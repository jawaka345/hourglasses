
var last_down = null
var click_pos_on_element = null
var card_selected = null
var power_move_hourglass = false

function check_click_on_element(click, element) {
    if (element.x <= click.pageX && click.pageX <= element.x + element.w &&
        element.y <= click.pageY && click.pageY <= element.y + element.h) {
        return true
    }
    else {
        return false
    }
}


function setup_interactions() {

    window.addEventListener('keydown', function (e) {

        // e.key
    });

    canvas.addEventListener('mouseup', function (e) {
        if (last_down != null) {
            localData.hourglasses[last_down].x = e.pageX + click_pos_on_element.x;
            localData.hourglasses[last_down].y = e.pageY + click_pos_on_element.y;
            requestAnimationFrame(() => draw())

            for (var endroitKey in localData.endroits) {
                var endroit = localData.endroits[endroitKey]
                if (check_click_on_element(e, endroit)) {
                    if (localData.hourglasses[last_down].ownerId != myId){
                        power_move_hourglass = false;
                    }
                    socket.emit('moveHourglass', last_down, endroitKey)
                }
            }

            if (check_click_on_element(e, myBoard) && localData.hourglasses[last_down].ownerId == myId) {
                socket.emit('moveHourglass', last_down, -1)
            }
            last_down = null
        }

        if (card_selected != null) {
            var card = localData.players[myId].cards[card_selected]
            card.x = e.pageX + click_pos_on_element.x;
            card.y = e.pageY + click_pos_on_element.y;


            for (var endroitKey in localData.endroits) {
                var endroit = localData.endroits[endroitKey]
                if (check_click_on_element(e, endroit)) {
                    console.log("play", card_selected, endroitKey)
                    socket.emit('playCard', card_selected, endroitKey)
                }
            }

            card_selected = null

            requestAnimationFrame(() => draw())
        }
    })

    canvas.addEventListener('mousemove', function (e) {
        if (last_down != null) {
            localData.hourglasses[last_down].x = e.pageX + click_pos_on_element.x;
            localData.hourglasses[last_down].y = e.pageY + click_pos_on_element.y;
            requestAnimationFrame(() => draw())
        }
        if (card_selected != null) {
            var card = localData.players[myId].cards[card_selected]
            card.x = e.pageX + click_pos_on_element.x;
            card.y = e.pageY + click_pos_on_element.y;
            requestAnimationFrame(() => draw())
        }
    })

    canvas.addEventListener('mousedown', function (e) {
        if (last_down == null) {
            for (var key in localData.hourglasses) {
                var hg = localData.hourglasses[key];
                if (check_click_on_element(e, hg) && ((hg.ownerId == myId && Date.now() >= hg.fillTimeFinal) || power_move_hourglass) && hg.freeze == false) {
                    last_down = key;
                    click_pos_on_element = { x: hg.x - e.pageX, y: hg.y - e.pageY }
                    return
                }
            }

            for (var cardIndex in localData.cardsToBuy) {
                var card = localData.cardsToBuy[cardIndex]
                if (check_click_on_element(e, card)) {
                    socket.emit('buyCard', cardIndex)
                }
            }

            for (var cardIndex in localData.players[myId].cards) {
                var card = localData.players[myId].cards[cardIndex]
                if (check_click_on_element(e, card)) {
                    if (card.type == CardFreeze) {
                        card_selected = cardIndex;
                        click_pos_on_element = { x: card.x - e.pageX, y: card.y - e.pageY }
                    } else {
                        if (card.type == CardMoveHourglass){
                            power_move_hourglass = true;
                        }
                        socket.emit('playCard', cardIndex)
                    }
                }
            }

        }
    }
    )


}