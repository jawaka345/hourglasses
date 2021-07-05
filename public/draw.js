function draw() {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    printEndroits()
    printMyBoard()
    printHourglasses()
    printCardsToBuy()
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    requestAnimationFrame(function () { draw() })
}




function printCardsToBuy() {
    for (var card of localData.cardsToBuy) {
        ctx.drawImage(images.cards[card.type].img.canvas, card.x, card.y)
    }
}


function printMyBoard() {

    if (myBoard.x != null) {
        ctx.drawImage(images.tapis.img.canvas, myBoard.x, myBoard.y)
        ctx.fillStyle = localData.players[myId].color;
        ctx.fillRect(myBoard.x - 5, myBoard.y - 5, myBoard.w + 10, 10);
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.drawImage(images.point.img.canvas, myBoard.x + myBoard.w + 10, myBoard.y);
    ctx.fillText(gameState.players[myId].points, myBoard.x + myBoard.w + 60, myBoard.y + 30);
    ctx.drawImage(images.money.img.canvas, myBoard.x + myBoard.w + 10, myBoard.y + 50)
    ctx.fillText(gameState.players[myId].money, myBoard.x + myBoard.w + 60, myBoard.y + 80);

    for (var card of localData.players[myId].cards) {
        ctx.drawImage(images.cards[card.type].img.canvas, card.x, card.y)
    }

}


function printHourglass(hourglass) {
    var datenow = Date.now();
    if (hourglass.freeze) {
        var fill = hourglass.fill
    } else if (datenow >= hourglass.fillTimeFinal) {
        var fill = 1.
    } else {
        var fill = hourglass.fill + (1. - hourglass.fill) * (Date.now() - hourglass.fillTimeInit) / (hourglass.fillTimeFinal - hourglass.fillTimeInit)
    }


    var x = hourglass.x;
    var y = hourglass.y;
    var color = gameState.players[hourglass.ownerId].color

    ctx.fillStyle = color;
    ctx.fillRect(x, y - 5, HOURGLASS_WIDTH, 5);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, HOURGLASS_WIDTH, HOURGLASS_HEIGHT * fill);

    ctx.strokeStyle = 'black'
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + HOURGLASS_WIDTH, y);
    ctx.lineTo(x + HOURGLASS_WIDTH, y + HOURGLASS_HEIGHT);
    ctx.lineTo(x, y + HOURGLASS_HEIGHT);
    ctx.lineTo(x, y);
    ctx.stroke();
}


function printHourglasses() {
    for (var k in localData.hourglasses) {
        var hg = localData.hourglasses[k];
        if (hg.endroitId != -1 || hg.ownerId == myId) {
            printHourglass(hg)
        }

    }
}



function printEndroits() {
    for (var endroit of gameState.endroits) {
        if (endroit.freeze) {
            ctx.drawImage(images['endroit_freeze'].img.canvas, endroit.x, endroit.y)
        }
        else {
            ctx.drawImage(images.endroit.img.canvas, endroit.x, endroit.y)
        }

    }
}