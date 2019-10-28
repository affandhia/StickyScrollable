import * as React from "react";
import styled from "styled-components";
import { useScroll } from "react-use-gesture";
import { animated, useSpring, config } from "react-spring";
import bindRaf from "./lib/bindRaf";
import Cue from "./lib/components/Cue";
import TopOffsetPointer from "./lib/components/TopOffsetIndicator";

const Container = styled(animated.div)`
  position: absolute;
  width: 100%;
  background: cyan;
`;

const ScrollableBody = styled(animated.div)`
  overflow-y: hidden;
`;

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

  const [{ pos: top }, setTop] = useSpring(() => ({
    pos: 0,
    config: { duration: 0 }
  }));
  const [{ pos: bodyHeight }, setHeight] = useSpring(() => ({
    pos: -1,
    config: { duration: 0 }
  }));

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
    parentEndFromTop.current =
      parentRect.current.top + parentRect.current.height;
  }, [parentRect, parentRef]);

  React.useLayoutEffect(() => {
    containerRect.current = containerRef.current.getBoundingClientRect();
    originalContainerHeight.current = containerRect.current.height;
    originalBodyHeight.current = bodyRef.current.getBoundingClientRect().height;
  }, [originalBodyHeight]);

  const bind = useScroll(
    state => {
      const parentEndFromTop =
        parentRect.current.top + parentRect.current.height;

      const currScrollTop = state.values[1];
      const prevScrollTop = state.previous[1];

      const isScrollingUp = currScrollTop < prevScrollTop;
      const isScrollingDown = !isScrollingUp;

      const scrollYRelativeToParent = currScrollTop - parentRect.current.top;
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

      const realHeight =
        originalBodyHeight.current - scrollYPositive + cueLocation.current;

      const scrollYFromTopElement =
        currScrollTop - parentRect.current.top + topOffset;
      const isContainerReachBottom =
        scrollYFromTopElement + containerRect.current.height >
        parentRect.current.height;
      let computedOfset = 0;
      if (scrollYFromTopElement < 0) {
        computedOfset = 0;
      } else if (isContainerReachBottom) {
        computedOfset =
          parentEndFromTop -
          containerRect.current.height -
          parentRect.current.top;
      } else if (scrollYFromTopElement > 0) {
        computedOfset = scrollYFromTopElement;
      }

      const procedure = () => {
        // update state
        setTop({ pos: computedOfset });
        setHeight({ pos: realHeight >= minHeight ? realHeight : minHeight });

        // update containerRect
        containerRect.current = containerRef.current.getBoundingClientRect();

        // set scrollTop to bottom of page
        bodyRef.current.scrollTop = originalBodyHeight.current;
      };

      const exec = isRAFSync ? bindRaf(procedure, true) : procedure;

      exec();
    },
    { domTarget: window }
  );

  React.useLayoutEffect(bind, [bind, originalBodyHeight]);

  const containerStyle = isUsingTransform
    ? {
        transform: top.interpolate(h => `translateY(${h}px)`)
      }
    : { top: top };

  const bodyStyle = {
    height: bodyHeight < 0 ? "inherit" : bodyHeight
  };

  return (
    <>
      {isDebug && <Cue top={cueLocation.current} />}
      {isDebug && <TopOffsetPointer top={topOffset} />}
      <Container ref={containerRef} style={containerStyle}>
        {header}
        {"items"}
        <ScrollableBody ref={bodyRef} style={bodyStyle}>
          {children}
        </ScrollableBody>
        {footer}
      </Container>
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
