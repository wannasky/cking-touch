/**
 * author: wannasky
 * email: wannasky@126.com
 */
(function (root, touch) {
    if (module.exports) {
        module.exports = touch();
    } else {
        root.Touch = touch();
    }
})(this, function () {

    //touch标识
    var IS_TOUCH_START = false;
    //touch开始时刻
    var TOUCH_START_TIME = 0;
    //tap事件触发持续时间
    var TOUCH_TIME = 50;
    //tap最大位移量
    var TAP_MAX_DISTANCE = 10;
    //长按事件触发持续时间
    var HOLD_TIME = 500;
    //长按时最大位移量
    var HOLD_MAX_DISTANCE = 10;
    //长按TIMER
    var HOLD_TIMER = null;
    //滑动标识（swipe)
    var IS_SWIPE = false;
    //滑动时间
    var SWIPE_TIME = 300;
    //滑动最小位移
    var SWIPE_MIN_DISTANCE = 100;
    //拖动
    var IS_START_DRAG = false;

    //手势节点属性
    var touchPos = {
        start: null,
        move: null,
        end: null
    }

    var reset = function () {
        IS_TOUCH_START = false;
        TOUCH_START_TIME = 0;
        IS_SWIPE = false;
        IS_START_DRAG = false;
        touchPos = {};
    }

    //事件代理
    var engine = {

        //绑定
        bind: function (element, evt, handler) {
            var wrapHandler = function (event) {
                var returnValue = handler.call(event.target, event);
                if(typeof returnValue !== 'undefined' && !returnValue){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
            element.addEventListener(evt, wrapHandler,false);

            return {
                off: function () {
                    engine.unbind(element, evt, wrapHandler);
                }
            }
        },

        //解绑
        unbind: function (element, evt, handler) {
            return element.removeEventListener(evt, handler);
        },

        //分发
        trigger: function (element, evt, detail) {
            detail = detail || {};
            if(typeof CustomEvent !== 'undefined'){
                if(element){
                    element.dispatchEvent(new CustomEvent(evt, {
                        bubbles: true,
                        cancelable: true,
                        detail: detail
                    }));
                }else{
                    var ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent(event, true, true, detail);
                    if(element) element.dispatchEvent(ev);
                }
            }
        }
    }

    //手势定义
    var gestures = {

        //触摸
        tap: function (event) {
            var touchTime = Date.now() - TOUCH_START_TIME;
            var distance = getTouchDistance(touchPos.start, touchPos.mov ? touchPos.mov : touchPos.start);
            if(touchTime < HOLD_TIME){
                clearTimeout(HOLD_TIMER);
            }
            if(TAP_MAX_DISTANCE < distance) return;
            if(HOLD_TIME > touchTime && TOUCH_TIME < touchTime && getFingers(event) <= 1){
                clearTimeout(HOLD_TIMER);
                engine.trigger(event.target, 'tap', {
                    type: 'tap',
                    originEvent: event
                });
            }
        },

        //长按
        hold: function (event) {
            clearTimeout(HOLD_TIMER);
            HOLD_TIMER = setTimeout(function () {
                if(!touchPos.start) return;
                var distance = getTouchDistance(touchPos.start, touchPos.move ? touchPos.move : touchPos.start);
                if(HOLD_MAX_DISTANCE < distance) return;
                engine.trigger(event.target,'hold',{
                    type: 'hold',
                    originEvent: event
                });
            },HOLD_TIME);
        },

        //滑动
        swipe: function (event) {
            if(!IS_TOUCH_START || !touchPos.move || getFingers(event) > 1) return;
            var touchTime = Date.now() - TOUCH_START_TIME;
            var distance = getTouchDistance(touchPos.start,touchPos.move);
            var direction = getTouchDirection(touchPos.start,touchPos.move);
            var element = event.target;
            var detail = {
                type: 'swipe',
                originEvent: event,
                direction: direction,
                distance: distance,
                x: touchPos.move.x - touchPos.start.x,
                y: touchPos.move.y - touchPos.start.y,
                duration: touchTime
            }

            //发布带方向的swipe
            var swipeDirection = function() {
                switch (direction) {
                    case 'up':
                        engine.trigger(element, 'swipeUp', detail);
                        break;
                    case 'down':
                        engine.trigger(element, 'swipeDown', detail);
                        break;
                    case 'left':
                        engine.trigger(element, 'swipeLeft', detail);
                        break;
                    case 'right':
                        engine.trigger(element, 'swipeRight', detail);
                        break;
                }
            };

            if(!IS_SWIPE){
                IS_SWIPE = true;
                detail.swipe = 'start';
                engine.trigger(element, 'swipeStart', detail);
            }else if(event.type === 'touchmove'){
                detail.swipe = 'move';
                engine.trigger(element, 'swipeMove', detail);
                if(touchTime > SWIPE_TIME
                    && touchTime < SWIPE_TIME + 50
                    && distance > SWIPE_MIN_DISTANCE){
                    swipeDirection();
                    engine.trigger(element, 'swipe', detail);
                }
            }else if (event.type === 'touchend' || event.type === 'touchcancel'){
                detail.swipe = 'end';
                engine.trigger(element, 'swipeEnd', detail);
                if(touchTime < SWIPE_TIME
                    && distance > SWIPE_MIN_DISTANCE){
                    swipeDirection();
                    engine.trigger(element, 'swipe', detail);
                }
            }

            if(!IS_START_DRAG){
                IS_START_DRAG = true;
                detail.swipe = 'start';
                engine.trigger(element, 'dragStart', detail);
            }else if(event.type === 'touchmove'){
                detail.swipe = 'move';
                engine.trigger(element, 'dragMove', detail);
            }else if(event.type === 'touchend' || event.type === 'touchcancel'){
                detail.swipe = 'end';
                engine.trigger(element, 'dragEnd', detail);
            }
        }
    }

    //获取触控点的个数
    var getFingers = function (event) {
        return event.touches ? event.touches.length : 1;
    }

    //获取touch position
    //暂时版本只支持一个触控点
    var getTouchPos = function (event) {
        var touch = event.touches[0];
        return {
            x: touch.pageX,
            y: touch.pageY
        }
    }

    //获取位移
    var getTouchDistance = function (pos1, pos2) {
        var x = pos2.x - pos1.x;
        var y = pos2.y - pos1.y;
        return Math.sqrt((x * x) + (y * y));
    }

    //获取位移方向
    var getTouchDirection = function (pos1, pos2) {
        var angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) * 180 / Math.PI;
        var directions = {
            up: angle < -45 && angle > -135,
            down: angle >= 45 && angle < 135,
            left: angle >= 135 || angle <= -135,
            right: angle >= -45 && angle <= 45
        };
        for (var key in directions) {
            if (directions[key]) return key;
        }
        return null;
    }

    //事件统一处理
    var eventHandler = function (event) {
        switch (event.type) {
            case 'touchstart':
                IS_TOUCH_START = true;
                TOUCH_START_TIME = Date.now();
                touchPos.start = getTouchPos(event);
                gestures.hold(event);
                break;
            case 'touchmove':
                if(!IS_TOUCH_START || !touchPos.start) return;
                touchPos.move = getTouchPos(event);
                gestures.swipe(event);
                break;
            case 'touchend':
            case 'touchcancel':
                if(!IS_TOUCH_START) return;
                if(IS_SWIPE){
                    gestures.swipe(event);
                }else{
                    gestures.tap(event);
                }
                reset();
                break;
        }
    };

    //touch事件绑定到document上
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(function (event) {
        document.addEventListener(event, eventHandler, false);
    });

    return {
        on: function (element, event, callback) {
            return engine.bind(element, event, callback);
        }
    }
})