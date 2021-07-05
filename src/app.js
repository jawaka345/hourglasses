const port = 8001;
const express = require('express');
const app = express();
const server = require('http').createServer(app).listen(port);
const io = require('socket.io')(server)

app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile('index.html')
})
console.log('Server started at http://localhost:' + port);


const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow', 'black']
function choose_player_random_color() {
    return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
}

// CARDS

const CardSpeedUp = 0 // augmente la vitesse des nouveaux sabliers (pas ceux en cours ?)
const CardNewHourglass = 1 // rajoute un nouveau sablier non placé
const CardVictoryPoints = 2 // donne 5 points
const CardFreeze = 3
const CardMoveHourglass = 4
const CardSlowDown = 5
const CardRestartOthers = 6 // 
const CardNumber = 7;

class Card {
    constructor(type) {
        this.type = type;
        this.cost = 2;
    }
}


class Hourglass {
    constructor(oId, eId) {
        this.ownerId = oId;
        this.endroitId = eId;
        this.fill = Math.random()
        this.fillTimeInit = Date.now()
        this.fillTimeFinal = Date.now() + Math.floor((1. - this.fill) * 10000.);
        this.full = false;
        this.freeze = false;
    }

    restart() {
        this.fill = 0.;
        this.fillTimeInit = Date.now()
        this.fillTimeFinal = Date.now() + gameState.players[this.ownerId].speed;
        this.full = false;
    }

    run() {
        this.fillTimeInit = Date.now()
        this.fillTimeFinal = Date.now() + Math.floor((1. - this.fill) * gameState.players[this.ownerId].speed);
    }


}

class Player {
    constructor() {
        //this.hourglasses = [new Hourglass(), new Hourglass()]
        this.color = choose_player_random_color()
        this.points = 0
        this.money = 2
        this.cards = [new Card(3)]
        this.speed = 10000.;
    }
}

class Endroit {
    constructor(wp) {
        this.winningPoints = wp;
        this.freeze = false;
    }
}

const gameState = {
    hasStarted: false,
    players: {},
    hourglasses: [],
    cardsToBuy: [],
    endroits: []
}

function initGameState(nbEndroit, nbCard) {
    for (var i = 0; i < nbEndroit; i++) {
        gameState.endroits.push(new Endroit(Math.floor(Math.random() * 30)))
    }

    for (var i = 0; i < nbCard; i++) {
        gameState.cardsToBuy.push(new Card(Math.floor(Math.random() * CardNumber)))
    }
}

initGameState(3, 3);




io.sockets.on('connection', function (client) {

    // INIT NEW PLAYER
    console.log("connection from ", client.id)
    var new_player = new Player();
    gameState.players[client.id] = new_player
    var hg1 = new Hourglass(client.id, Math.floor(Math.random() * 3));
    var hg2 = new Hourglass(client.id, Math.floor(Math.random() * 3));
    gameState.hourglasses.push(hg1);
    gameState.hourglasses.push(hg2);

    console.log(gameState)
    client.emit('myId', client.id)
    client.emit('updateGameState', gameState)
    client.broadcast.emit('updateGameState', gameState)

    // SETUP ACTIONS
    client.on('moveHourglass', handleMoveHourglass);
    client.on('buyCard', handleBuyCard);
    client.on('playCard', handlePlayCard)

    function handleMoveHourglass(hourglassId, endroitId) {
        var hourglass = gameState.hourglasses[hourglassId]
        var player = gameState.players[hourglass.ownerId]
        hourglass.endroitId = endroitId;
        hourglass.fill = 0.
        hourglass.fillTimeInit = Date.now()
        hourglass.fillTimeFinal = Date.now() + Math.floor((1. - hourglass.fill) * player.speed);
        hourglass.full = false;

        if (gameState.endroits[endroitId].freeze) {
            hourglass.freeze = true;
        }

        client.emit('updateGameState', gameState)
        client.broadcast.emit('updateGameState', gameState)
    }

    function handleBuyCard(cardIndex) {
        var card = gameState.cardsToBuy[cardIndex]
        var player = gameState.players[client.id]
        if (card.cost <= player.money && player.cards.length <= 2) {
            player.money -= card.cost
            player.cards.push(card)
            gameState.cardsToBuy.splice(cardIndex, 1);
            gameState.cardsToBuy.push(new Card(Math.floor(Math.random() * CardNumber)))
            io.local.emit('updateGameState', gameState)
        }
    }

    function handlePlayCard(cardIndex, secondParam) {
        var card = gameState.players[client.id].cards[cardIndex]
        var player = gameState.players[client.id]
        gameState.players[client.id].cards.splice(cardIndex, 1);
        // card effect
        switch (card.type) {
            case CardSpeedUp:
                player.speed = 2000.;
                break;
            case CardNewHourglass:
                gameState.hourglasses.push(new Hourglass(client.id, -1))
                break;
            case CardVictoryPoints:
                player.points += 5;
                break;
            case CardRestartOthers:
                for (var hg of gameState.hourglasses) {
                    if (hg.ownerId != client.id) {
                        hg.restart()
                    }
                }
                break;
            case CardFreeze:
                var endroit = gameState.endroits[secondParam]
                endroit.freeze = true;
                endroit.freeze_time = Date.now()
                for (var hourglass of gameState.hourglasses) {
                    if (hourglass.endroitId == secondParam) {
                        hourglass.fill = hourglass.fill + (Date.now() - hourglass.fillTimeInit) * (1. - hourglass.fill) / (hourglass.fillTimeFinal - hourglass.fillTimeInit)
                        hourglass.freeze = true;
                    }
                }
                break;
        }

        io.local.emit('updateGameState', gameState)
    }

});


// GAME MECHANISM

function countPlayerOnEndroit(endroitKey) {
    var playerOnEndroit = new Set();
    for (var hourglassKey in gameState.hourglasses) {
        if (gameState.hourglasses[hourglassKey].endroitId == endroitKey) {
            playerOnEndroit.add(gameState.hourglasses[hourglassKey].ownerId)
        }
    }
    return playerOnEndroit.size;
}

function countFullHourglassOnEndroit(endroitKey) {
    var counter = 0;
    for (var hourglassKey in gameState.hourglasses) {
        var hourglass = gameState.hourglasses[hourglassKey]
        if (hourglass.endroitId == endroitKey && hourglass.full) {
            counter += 1;
        }
    }
    return counter;
}


function dropHourglass(hourglassId) {
    var hourglass = gameState.hourglasses[hourglassId];
    gameState.players[hourglass.ownerId].points += gameState.endroits[hourglass.endroitId].winningPoints;
    hourglass.endroitId = -1;
}

function moneyGainHourglass(hourglassId) {
    var hourglass = gameState.hourglasses[hourglassId];
    if (hourglass.full && hourglass.endroitId != -1) {
        var c = countFullHourglassOnEndroit(hourglass.endroitId);
        gameState.players[hourglass.ownerId].money += c - 1;
    }
}


function checkHourglasses() {
    var datenow = Date.now()

    for (var endroitId in gameState.endroits) {
        var endroit = gameState.endroits[endroitId]
        if (endroit.freeze && datenow - endroit.freeze_time >= 10000) {
            endroit.freeze = false;
            for (var hourglass of gameState.hourglasses) {
                if (hourglass.endroitId == endroitId && hourglass.freeze) {
                    hourglass.freeze = false;
                    hourglass.run();
                }
            }
            io.local.emit('updateGameState', gameState)
        }
    }

    for (var hourglassKey in gameState.hourglasses) {
        var hourglass = gameState.hourglasses[hourglassKey]
        if (hourglass.freeze) {
            continue;
        }

        if (hourglass.full == false && datenow >= hourglass.fillTimeFinal) {
            hourglass.full = true;
            moneyGainHourglass(hourglassKey)

            if (hourglass.endroitId != -1 && countPlayerOnEndroit(hourglass.endroitId) == 1) {
                dropHourglass(hourglassKey)
            }

            io.local.emit('updateGameState', gameState)
        }
        else if (hourglass.full == true && hourglass.endroitId != -1 && countPlayerOnEndroit(hourglass.endroitId) == 1) {
            dropHourglass(hourglassKey)
            io.local.emit('updateGameState', gameState)
        }
    }
}

setInterval(checkHourglasses, 50)







