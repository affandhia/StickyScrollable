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
export function bindRaf(fn, throttle) {
  var isRunning, that, args;

  var run = function() {
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
    requestAnimationFrame(run);
  };
}
