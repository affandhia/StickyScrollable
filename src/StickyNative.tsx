import * as React from "react";
import { Animated } from "react-native";
import { useScrollPosition } from "./lib/useScrollEvent";
import bindRaf from "./lib/bindRaf";
import Cue from "./lib/components/Cue";
import TopOffsetPointer from "./lib/components/TopOffsetIndicator";

interface StickyProps {
  parentRef: any;
  isDebug: boolean;
  isRAFSync: boolean;
  topOffset: number;
  bottomOffset?: number;
  minHeight: number;
  isUsingTransform: boolean;
  header: any;
  footer: any;
  children: React.ReactChildren;
}

const Sticky = (props: StickyProps) => {
  const {
    parentRef,
    isDebug,
    isRAFSync,
    topOffset,
    bottomOffset,
    minHeight,
    isUsingTransform,
    header,
    footer,
    children
  } = props;

  const containerRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  let originalBodyHeight = React.useRef(0);
  let originalContainerHeight = React.useRef(0);
  // Adjustor to let system know
  // that body need to be expanded until meet this adjustor offset.
  let cueLocation = React.useRef(0);
  let containerRect = React.useRef({ top: 0, height: 0 });
  let parentRect = React.useRef({ top: 0, height: 0 });
  // the offset of parent's bottom side
  const parentEndFromTop = React.useRef(0);
  const heightAV = React.useRef(new Animated.Value(-1));
  const topAV = React.useRef(new Animated.Value(-1));

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
    parentEndFromTop.current =
      parentRect.current.top + parentRect.current.height;
  }, [parentRect, parentRef]);

  const setContainerRect = React.useCallback((callback?: Function) => {
    containerRef.current._component.measure((...args: any) => {
      containerRect.current = { top: args[1], height: args[3] };
      callback && callback(args);
    });
  }, []);

  const setInitialOriginalHeight = React.useCallback((_, h) => {
    originalBodyHeight.current = h;
    heightAV.current.setValue(h);
  }, []);

  React.useLayoutEffect(() => {
    setContainerRect(() => {
      originalContainerHeight.current = containerRect.current.height;
    });
  }, [setContainerRect]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const wHeight = window ? window.innerHeight : 0;
      let finalMinHeight = 0;
      const topBottomHeight = wHeight - topOffset - bottomOffset;
      if (bottomOffset && containerRect.current.height >= topBottomHeight) {
        finalMinHeight = topBottomHeight;
      } else if (
        bottomOffset &&
        containerRect.current.height < topBottomHeight
      ) {
        finalMinHeight = containerRect.current.height;
      } else finalMinHeight = minHeight;

      const isScrollingUp = currPos.y < prevPos.y;
      const isScrollingDown = !isScrollingUp;

      const scrollYRelativeToParent = currPos.y - parentRect.current.top;
      const scrollYWithOffset = scrollYRelativeToParent + topOffset;
      const scrollYPositive = scrollYWithOffset > 0 ? scrollYWithOffset : 0;

      const isDraggingCueDown =
        scrollYPositive >
        originalBodyHeight.current - finalMinHeight + cueLocation.current;
      const isDraggingCueUp = scrollYPositive < cueLocation.current;
      const isContainerNotOnBottom =
        scrollYPositive <=
        parentRect.current.height - containerRect.current.height;
      const isContainerOnBottom = !isContainerNotOnBottom;

      if (isScrollingDown && isDraggingCueDown && isContainerNotOnBottom) {
        cueLocation.current =
          scrollYPositive - originalBodyHeight.current + finalMinHeight;
      } else if (isScrollingDown && isContainerOnBottom) {
        cueLocation.current =
          parentRect.current.height - originalContainerHeight.current;
      } else if (isScrollingUp && isDraggingCueUp) {
        cueLocation.current = scrollYPositive;
      }

      const procedure = () => {
        // set Top
        const scrollYFromTopElement =
          currPos.y - parentRect.current.top + topOffset;
        const isContainerReachBottom =
          scrollYFromTopElement + containerRect.current.height >
          parentRect.current.height;
        let computedOfset = 0;
        if (scrollYFromTopElement < 0) {
          computedOfset = 0;
        } else if (isContainerReachBottom) {
          computedOfset =
            parentEndFromTop.current -
            containerRect.current.height -
            parentRect.current.top;
        } else if (scrollYFromTopElement > 0) {
          computedOfset = scrollYFromTopElement;
        }
        topAV.current.setValue(computedOfset);

        // set Height
        const realHeight =
          originalBodyHeight.current - scrollYPositive + cueLocation.current;
        heightAV.current.setValue(
          realHeight >= finalMinHeight ? realHeight : finalMinHeight
        );

        // update containerRect
        setContainerRect();

        // set scrollTop to bottom of page
        bodyRef.current._component.scrollTo({
          y: originalBodyHeight.current,
          animated: false
        });
      };

      const exec = isRAFSync ? bindRaf(procedure, true) : procedure;

      exec();
    },
    [topAV],
    parentRef,
    true
  );

  return (
    <>
      {isDebug && <Cue top={cueLocation.current} />}
      {isDebug && <TopOffsetPointer top={topOffset} />}
      <Animated.View
        ref={containerRef}
        style={
          isUsingTransform
            ? {
                transform: [
                  {
                    translateY: topAV.current
                  }
                ]
              }
            : {
                top: topAV.current
              }
        }
      >
        {header}
        <Animated.ScrollView
          onContentSizeChange={setInitialOriginalHeight}
          ref={bodyRef}
          style={{
            height: heightAV.current,
            overflowY: "hidden"
          }}
        >
          {children}
        </Animated.ScrollView>
        {footer}
      </Animated.View>
    </>
  );
};

Sticky.defaultProps = {
  isUsingTransform: true,
  isRAFSync: false,
  isDebug: false,
  topOffset: 0,
  minHeight: 0
};

export default Sticky;
