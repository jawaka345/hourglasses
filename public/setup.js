const BG_COLOUR = '#dddddd';


let canvas, ctx;
let gameState = {}

const socket = io();

let localData = {}
let myBoard = {}
let my_pseudo = "Pseudo" + Math.floor(Math.random() * 1000)
let myId = null;


function repositionElements() {

    myBoard.x = 100;
    myBoard.y = 350;
    myBoard.w = 200;
    myBoard.h = 100;

    //generate_canvas_from_img(images.tapis.img, 200, 100)

    // Cards to Buy position
    for (var cardId in localData.cardsToBuy) {
        var card = localData.cardsToBuy[cardId]
        card.x = 50 + (CARD_WIDTH + 5) * cardId
        card.y = 50
        card.w = CARD_WIDTH;
        card.h = CARD_HEIGHT;
    }

    // My Cards position
    for (var cardId in localData.players[myId].cards) {
        var card = localData.players[myId].cards[cardId]
        card.x = 50 + (CARD_WIDTH + 5) * cardId;
        card.y = 500;
        card.w = CARD_WIDTH;
        card.h = CARD_HEIGHT;
    }



    // Endroits position
    for (var endroitKey in localData.endroits) {
        var endroit = localData.endroits[endroitKey];
        endroit.x = 50 + endroitKey * 150;
        endroit.y = 150
        endroit.w = ENDROIT_WIDTH;
        endroit.h = ENDROIT_HEIGHT;
    }

    // Hourglass position
    var counterMyHourglass = 0
    for (var hourglassKey in localData.hourglasses) {
        var hourglass = localData.hourglasses[hourglassKey];
        if (hourglass.endroitId == -1 && hourglass.ownerId == myId) {
            console.log(counterMyHourglass)
            hourglass.x = myBoard.x + (HOURGLASS_WIDTH + 3) * counterMyHourglass + 10
            hourglass.y = myBoard.y + myBoard.h / 2 - HOURGLASS_HEIGHT / 2
            hourglass.w = HOURGLASS_WIDTH
            hourglass.h = HOURGLASS_HEIGHT
            counterMyHourglass += 1;
        }
    }


    for (var endroitKey in gameState.endroits) {
        var endroit = gameState.endroits[endroitKey];
        var counter = 0;

        for (var hourglassKey in localData.hourglasses) {
            var hourglass = localData.hourglasses[hourglassKey];
            if (hourglass.endroitId == endroitKey) {
                hourglass.x = endroit.x + (HOURGLASS_WIDTH + 2) * counter;
                hourglass.y = endroit.y;
                hourglass.w = HOURGLASS_WIDTH;
                hourglass.h = HOURGLASS_HEIGHT;
                counter += 1;
            }
        }

    }
}


// Images

var images = {
    endroit: {},
    tapis: {},
    money: {},
    point: {},
    cards: {}
}

load_new_card(CardSpeedUp, "img/card_speed_up.svg", CARD_WIDTH, CARD_HEIGHT)
load_new_card(CardNewHourglass, "img/card_new_hourglass.svg", CARD_WIDTH, CARD_HEIGHT)
load_new_card(CardRestartOthers, "img/card_restart_others.svg", CARD_WIDTH, CARD_HEIGHT)
load_new_card(CardVictoryPoints, "img/card_victory_points.svg", CARD_WIDTH, CARD_HEIGHT)
load_new_card(CardFreeze, "img/card_freeze.svg", CARD_WIDTH, CARD_HEIGHT)
load_new_card(CardMoveHourglass, "img/card_move.svg", CARD_WIDTH, CARD_HEIGHT)
load_new_card(CardSlowDown, "img/card_slow.svg", CARD_WIDTH, CARD_HEIGHT)

images.tapis.img = new Image();
images.tapis.img.src = "img/tapis.svg";
generate_canvas_from_img(images.tapis.img, 200, 100)

images.endroit.img = new Image();
images.endroit.img.src = "img/endroit.svg";
generate_canvas_from_img(images.endroit.img, ENDROIT_WIDTH, ENDROIT_HEIGHT)

images.money.img = new Image();
images.money.img.src = "img/coin.svg"
generate_canvas_from_img(images.money.img, 40, 40)

images.point.img = new Image();
images.point.img.src = "img/point.svg"
generate_canvas_from_img(images.point.img, 40, 40)

function load_new_img(property_name, file_path, w, h) {
    images[property_name] = {}
    images[property_name].img = new Image();
    images[property_name].img.src = file_path;
    generate_canvas_from_img(images[property_name].img, w, h)
}

load_new_img('endroit_freeze', 'img/endroit_freeze.svg', ENDROIT_WIDTH, ENDROIT_HEIGHT)



function load_new_card(type, file_path, w, h) {
    images.cards[type] = {}
    images.cards[type].img = new Image()
    images.cards[type].img.src = file_path
    generate_canvas_from_img(images.cards[type].img, w, h)
}

function generate_canvas_from_img(lol, w, h) {
    console.log(lol.src)
    lol.onload = function () {
        lol.canvas = document.createElement('canvas')
        var localCtx = lol.canvas.getContext('2d')
        lol.canvas.width = w
        lol.canvas.height = h
        localCtx.drawImage(lol, 0, 0, w, h)
    }
}




// INIT


function init() {

    // CANVAS SETUP
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 600;
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    window.addEventListener('resize', function () { resizeCanvas() }, false);
    document.addEventListener('contextmenu', event => event.preventDefault());
    setup_interactions()


    // SOCKET SETUP
    socket.on('myId', handleMyId);
    socket.on('updateGameState', handleGameState);

    function handleMyId(myNewId) {
        myId = myNewId;
        //requestAnimationFrame(() => draw())
        setInterval(() => (requestAnimationFrame(() => draw())), 40)
    }

    function handleGameState(newState) {
        console.log("updateGameState")
        gameState = newState;
        localData = newState;
        repositionElements();
        requestAnimationFrame(() => draw())
    }
}


init()