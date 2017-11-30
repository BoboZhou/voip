'use strict';
(function (RongIM) {

RongIM.createFav = function(unReadCount) {
    var size = 32;
    var longer = 20;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    var context = canvas.getContext('2d');

    //绘制icon
    // context.drawImage(img, longer, 0, size, size);

    //绘制红色圆
    var r, x, y;
    r = x = y = longer / 2;
    context.strokeStyle = '#f45349';
    context.fillStyle = '#f45349';
    context.beginPath();
    context.arc(x + 5, y + 5, r * 1.5, 0, Math.PI * 2, false);
    //arc(x, y, radius, startAngle, endAngle, anticlockwise)

    context.closePath();
    context.stroke();
    context.fill();

    //绘制未读数
    var number = 0;
    if (unReadCount < 10) {
        number = ' ' + unReadCount;
    } else if (unReadCount < 100) {
        number = '' + unReadCount;
    } else {
        number = '…';
    }
    context.font = size * 0.6 + 'px Arial';
    context.textBaseline = 'top';

    context.fillStyle = '#ffffff';

    context.fillText(number, 5, 4);

    //返回fav图标
    return canvas.toDataURL('image/png');
};

})(RongIM);
