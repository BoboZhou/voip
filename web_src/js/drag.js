'use strict';

(function (RongIM) {

/**
 * Drag.js: drag absolutely positioned HTML elements.
 *
 * https://github.com/davidflanagan/javascript6_examples/blob/master/examples/17.02.Drag.js
 **/
function drag(elementToDrag, event, callback, context) {
    // Left button=0
    if(event.button !== 0) {
        return;
    }
    context = context || document;
    // The initial mouse position, converted to document coordinates
    // A utility function from elsewhere
    var scroll = getScrollOffsets();
    var startX = event.clientX + scroll.x;
    var startY = event.clientY + scroll.y;

    // The original position (in document coordinates) of the element
    // that is going to be dragged.  Since elementToDrag is absolutely
    // positioned, we assume that its offsetParent is the document body.
    var origX = elementToDrag.offsetLeft;
    var origY = elementToDrag.offsetTop;

    // Compute the distance between the mouse down event and the upper-left
    // corner of the element. We'll maintain this distance as the mouse moves.
    var deltaX = startX - origX;
    var deltaY = startY - origY;

    // Register the event handlers that will respond to the mousemove events
    // and the mouseup event that follow this mousedown event.
    if (document.addEventListener) {

        // Standard event model
        // Register capturing event handlers on the document
        context.addEventListener('mousemove', moveHandler, true);
        document.addEventListener('mouseup', upHandler, true);
    } else if (document.attachEvent) {

        // IE Event Model for IE5-8
        // In the IE event model, we capture events by calling
        // setCapture() on the element to capture them.
        elementToDrag.setCapture();
        elementToDrag.attachEvent('onmousemove', moveHandler);
        elementToDrag.attachEvent('onmouseup', upHandler);
        // Treat loss of mouse capture as a mouseup event.
        elementToDrag.attachEvent('onlosecapture', upHandler);
    }

    // We've handled this event. Don't let anybody else see it.
    if (event.stopPropagation) {

        // Standard model
        event.stopPropagation();
    } else {

        // IE
        event.cancelBubble = true;
    }

    // Now prevent any default action.
    if (event.preventDefault) {

        // Standard model
        event.preventDefault();
    } else {

        // IE
        event.returnValue = false;
    }

    /**
     * This is the handler that captures mousemove events when an element
     * is being dragged. It is responsible for moving the element.
     **/
    function moveHandler(e) {

        // IE Event Model
        e = e || window.event;

        // Move the element to the current mouse position, adjusted by the
        // position of the scrollbars and the offset of the initial click.
        var scroll = getScrollOffsets();
        var position = {
            left: e.clientX + scroll.x - deltaX,
            top: e.clientY + scroll.y - deltaY
        };
        callback.call(elementToDrag, position);

        // And don't let anyone else see this event.
        if (e.stopPropagation) {

            // Standard
            e.stopPropagation();
        } else {

            // IE
            e.cancelBubble = true;
        }
    }

    /**
     * This is the handler that captures the final mouseup event that
     * occurs at the end of a drag.
     **/
    function upHandler(e) {

        // IE Event Model
        e = e || window.event;

        // Unregister the capturing event handlers.
        if (document.removeEventListener) {

            // DOM event model
            document.removeEventListener('mouseup', upHandler, true);
            context.removeEventListener('mousemove', moveHandler, true);
        } else if (document.detachEvent) {

            // IE 5+ Event Model
            elementToDrag.detachEvent('onlosecapture', upHandler);
            elementToDrag.detachEvent('onmouseup', upHandler);
            elementToDrag.detachEvent('onmousemove', moveHandler);
            elementToDrag.releaseCapture();
        }

        // And don't let the event propagate any further.
        if (e.stopPropagation) {

            // Standard model
            e.stopPropagation();
        } else {

            // IE
            e.cancelBubble = true;
        }
    }
}

// Return the current scrollbar offsets as the x and y properties of an object
function getScrollOffsets(w) {
    // Use the specified window or the current window if no argument
    w = w || window;

    // This works for all browsers except IE versions 8 and before
    if (w.pageXOffset !== null) {
        return {x: w.pageXOffset, y:w.pageYOffset};
    }

    // For IE (or any browser) in Standards mode
    var d = w.document;
    if (document.compatMode === 'CSS1Compat') {
        return {x:d.documentElement.scrollLeft, y:d.documentElement.scrollTop};
    }

    // For browsers in Quirks mode
    return { x: d.body.scrollLeft, y: d.body.scrollTop };
}

RongIM.drag = drag;

})(RongIM);
