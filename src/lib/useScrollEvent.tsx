/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useLayoutEffect } from "react";

const isBrowser = typeof window !== `undefined`;

interface ScrollPositionConfig {
  element?: HTMLElement;
  useWindow?: boolean;
}

function getScrollPosition(config: ScrollPositionConfig) {
  const { element, useWindow } = config;

  if (!isBrowser) return { x: 0, y: 0 };

  const target = element ? element.current : document.body;
  const position = target.getBoundingClientRect();

  return useWindow
    ? { x: window.scrollX, y: window.scrollY }
    : { x: position.left, y: position.top };
}

export function useScrollPosition(
  effect: (...args: any) => any,
  deps?: any[],
  element?: HTMLElement,
  useWindow?: boolean,
  wait?: number
) {
  const position = useRef(getScrollPosition({ useWindow }));

  let throttleTimeout = null;

  const callBack = () => {
    const currPos = getScrollPosition({ element, useWindow });
    effect({ prevPos: position.current, currPos });
    position.current = currPos;
    throttleTimeout = null;
  };

  useLayoutEffect(() => {
    if (!isBrowser) {
      return;
    }

    const handleScroll = () => {
      if (wait) {
        if (throttleTimeout === null) {
          throttleTimeout = setTimeout(callBack, wait);
        }
      } else {
        callBack();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, deps);
}

useScrollPosition.defaultProps = {
  deps: [],
  element: false,
  useWindow: false,
  wait: 0
};
