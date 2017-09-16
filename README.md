# touch

## 安装

```bash
npm install cking-touch --save
```

## 简介
移动端基本手势库，支持的有tap、hold、swipe(swipe/swipeStart/swipeMove/swipeEnd swipeLeft/swipeRight/swipeUp/swipeDown)、drag(dragStart/dragMove/dragEnd);

## 使用

```javascript
let touch = require('cking-touch/touch');

let element = document.querySelector('body');

////绑定
//tap
let eleTap = touch.on(element,'tap',function(event) {
  ...
});

//hold
let eleHold = touch.on(element,'hold',function(event) {
  ...
});

//swipe
//根据event.detail.direction判断left right down up
let eleSwipe = touch.on(element,'swipe',function(event) {
    let detail = event.detail.direction;
    switch (detail){
        case 'up':
            ...
            break;
        case 'down':
            ...
            break;
        case 'left':
            ...
            break;
        case 'right':
            ...
            break;
    }
});

//swipeLeft
let eleSwipeLeft = touch.on(element, 'swipeLeft', function(event) {
    ...
});

//解绑
eleTap.off();
eleHold.off();
eleSwipe.off();
eleSwipeLeft.off();

```
