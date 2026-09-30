(function () {
  'use strict';
  try {
    var screenW = Number(screen.width) || 0;
    var screenH = Number(screen.height) || 0;
    var shortSide = Math.min(screenW, screenH);
    var portrait = screenH >= screenW;
    if (!portrait || shortSide > 1500) return;

    var content = 'width=390, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    var metas = document.querySelectorAll('meta[name="viewport"]');
    if (!metas.length) {
      var meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
      return;
    }
    Array.prototype.forEach.call(metas, function (item) {
      item.setAttribute('content', content);
    });
  } catch (e) {}
})();
