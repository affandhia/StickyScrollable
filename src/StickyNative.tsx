import * as React from "react";
import { View, Animated, Easing } from "react-native";
import styled from "styled-components";
import { useScrollPosition } from "./lib/useScrollEvent";
import bindRaf from "./lib/bindRaf";
import Cue from "./lib/components/Cue";
import TopOffsetPointer from "./lib/components/TopOffsetIndicator";

interface StickyProps {
  parentRef: any;
  isDebug: boolean;
  isRAFSync: boolean;
  topOffset: number;
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
    minHeight,
    isUsingTransform,
    header,
    footer,
    children
  } = props;

  // Window scrollTop location
  const [scrollTop, setScrollTop] = React.useState(0);
  const [bodyHeight, setBodyHeight] = React.useState();
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

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
    parentEndFromTop.current =
      parentRect.current.top + parentRect.current.height;
  }, [parentRect, parentRef]);

  React.useLayoutEffect(() => {
    // containerRect.current = containerRef.current.getBoundingClientRect();
    containerRef.current.measure((x, py, px, mContainerHeight, fx, fy) => {
      containerRect.current = { top: py, height: mContainerHeight };

      originalContainerHeight.current = containerRect.current.height;
      originalBodyHeight.current = bodyRef.current._component.measure(
        ({}, {}, {}, mBodyHeight) => {
          console.log("didmount", mBodyHeight, mContainerHeight);
          originalBodyHeight.current = mBodyHeight;
          setBodyHeight(originalBodyHeight.current);
        }
      );
    });
  }, [containerRect]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const isScrollingUp = currPos.y < prevPos.y;
      const isScrollingDown = !isScrollingUp;

      const scrollYRelativeToParent = currPos.y - parentRect.current.top;
      const scrollYWithOffset = scrollYRelativeToParent + topOffset;
      const scrollYPositive = scrollYWithOffset > 0 ? scrollYWithOffset : 0;

      const isDraggingCueDown =
        scrollYPositive >
        originalBodyHeight.current - minHeight + cueLocation.current;
      const isDraggingCueUp = scrollYPositive < cueLocation.current;
      const isContainerNotOnBottom =
        scrollYPositive <=
        parentRect.current.height - containerRect.current.height;
      const isContainerOnBottom = !isContainerNotOnBottom;

      if (isScrollingDown && isDraggingCueDown && isContainerNotOnBottom) {
        cueLocation.current =
          scrollYPositive - originalBodyHeight.current + minHeight;
      } else if (isScrollingDown && isContainerOnBottom) {
        cueLocation.current =
          parentRect.current.height - originalContainerHeight.current;
      } else if (isScrollingUp && isDraggingCueUp) {
        cueLocation.current = scrollYPositive;
      }

      // console.log(currPos.y, prevPos.y, scrollYPositive, cueLocation.current);

      const realHeight =
        originalBodyHeight.current - scrollYPositive + cueLocation.current;

      const procedure = () => {
        // update state
        setScrollTop(currPos.y);
        setBodyHeight(realHeight >= minHeight ? realHeight : minHeight);

        // update containerRect
        containerRef.current.measure((x, py, px, mContainerHeight, fx, fy) => {
          containerRect.current = { top: py, height: mContainerHeight };
        });

        // set scrollTop to bottom of page
        // bodyRef.current._component.scrollTo({ y: originalBodyHeight.current });
        // console.log(bodyRef.current._component);
      };

      const exec = isRAFSync ? bindRaf(procedure, true) : procedure;

      exec();
    },
    [scrollTop],
    parentRef,
    true
  );

  const scrollYFromTopElement = scrollTop - parentRect.current.top + topOffset;
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

  const opacity = React.useRef(new Animated.Value(-1));

  React.useEffect(() => {
    Animated.timing(opacity.current, {
      toValue: bodyHeight,
      duration: 0
    }).start();
  }, [bodyHeight]);

  // const contentHeight = opacity.current.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0, bodyHeight]
  // });

  return (
    <>
      {isDebug && <Cue top={cueLocation.current} />}
      {isDebug && <TopOffsetPointer top={topOffset} />}
      <View
        ref={containerRef}
        style={{
          top: computedOfset
        }}
        top={computedOfset}
        isUsingTransform={isUsingTransform}
      >
        {header}
        <Animated.View
          ref={bodyRef}
          style={{
            height: opacity.current,
            backgroundColor: "cyan",
            overflowY: "hidden"
          }}
        >
          {children}
        </Animated.View>
        {footer}
      </View>
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
