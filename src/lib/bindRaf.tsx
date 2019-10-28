/**
 * @param fn {Function}
 * @param [throttle] {Boolean|undefined}
 * @return {Function}
 *
 * @example
 * //generate rAFed function
 * jQuery.fn.addClassRaf = bindRaf(jQuery.fn.addClass);
 *
 * //use rAFed function
 * $('div').addClassRaf('is-stuck');
 */
export default function bindRaf(
  fn: (...args: any) => any,
  throttle: boolean = true,
  isUsingShim: boolean = true,
  isOnFirefox: boolean = false
) {
  isUsingShim && rAFShim();

  let isRunning, that, args;

  const run = function() {
    isRunning = false;
    fn.apply(that, args);
  };

  return function() {
    that = this;
    args = arguments;

    if (isRunning && throttle) {
      return;
    }

    isRunning = true;
    isOnFirefox
      ? requestAnimationFrame(() => {
          requestAnimationFrame(run);
        })
      : requestAnimationFrame(run);
  };
}

// requestAnimationFrame polyfill by Erik Möller.
// Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavic, Darius Bacon and Joan Alba Maldonado.
// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// Added high resolution timing. This window.performance.now() polyfill can be used: https://gist.github.com/jalbam/cc805ac3cfe14004ecdf323159ecf40e
// MIT license
// Gist: https://gist.github.com/jalbam/5fe05443270fa6d8136238ec72accbc0
const rAFShim = () => {
  if (window === undefined) return;
  let vendors = ["webkit", "moz", "ms", "o"],
    vp = null;
  for (
    var x = 0;
    x < vendors.length &&
    !window.requestAnimationFrame &&
    !window.cancelAnimationFrame;
    x++
  ) {
    vp = vendors[x];
    window.requestAnimationFrame =
      window.requestAnimationFrame || window[vp + "RequestAnimationFrame"];
    window.cancelAnimationFrame =
      window.cancelAnimationFrame ||
      window[vp + "CancelAnimationFrame"] ||
      window[vp + "CancelRequestAnimationFrame"];
  }
  if (
    /iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) ||
    !window.requestAnimationFrame ||
    !window.cancelAnimationFrame
  ) {
    //iOS6 is buggy.
    let lastTime = 0;
    window.requestAnimationFrame = function(callback: FrameRequestCallback) {
      const now = window.performance.now();
      const nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function() {
        callback((lastTime = nextTime));
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
};
