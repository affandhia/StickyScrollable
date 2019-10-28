import * as React from "react";
import styled from "styled-components";
import { useScrollPosition } from "./lib/useScrollEvent";
import bindRaf from "./lib/bindRaf";
import Cue from "./lib/components/Cue";
import TopOffsetPointer from "./lib/components/TopOffsetIndicator";

const Container = styled.div.attrs(props => ({
  style: props.isUsingTransform
    ? {
        transform: `translateY(${props.top}px)`
      }
    : { top: `${props.top - 1}px` }
}))`
  position: absolute;
  width: 100%;
`;

const ScrollableBody = styled.div.attrs(props => ({
  style: props.height !== undefined ? { height: `${props.height}px` } : {}
}))`
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

  const requestAnimationId = React.useRef(0);

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
    parentEndFromTop.current =
      parentRect.current.top + parentRect.current.height;
  }, [parentRect, parentRef]);

  React.useLayoutEffect(() => {
    containerRect.current = containerRef.current.getBoundingClientRect();
    originalContainerHeight.current = containerRect.current.height;

    originalBodyHeight.current = bodyRef.current.getBoundingClientRect().height;
    setBodyHeight(originalBodyHeight.current);
  }, [originalBodyHeight]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const isScrollingUp = currPos.y < prevPos.y;
      const isScrollingDown = !isScrollingUp;

      const scrollYRelativeToParent = currPos.y - parentRect.current.top;
      const scrollYWithOffset = scrollYRelativeToParent + topOffset;
      const scrollYPositive = scrollYWithOffset > 0 ? scrollYWithOffset : 0;

      if (cueLocation.current < scrollYWithOffset) {
        cancelAnimationFrame(requestAnimationId.current);
      }

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

      const procedure = () => {
        // update state
        setScrollTop(currPos.y);
        setBodyHeight(realHeight >= minHeight ? realHeight : minHeight);

        // update containerRect
        containerRect.current = containerRef.current.getBoundingClientRect();

        // set scrollTop to bottom of page
        bodyRef.current.scrollTop = originalBodyHeight.current;
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

  return (
    <>
      {isDebug && <Cue top={cueLocation.current} />}
      {isDebug && <TopOffsetPointer top={topOffset} />}
      <Container
        ref={containerRef}
        top={computedOfset}
        isUsingTransform={isUsingTransform}
      >
        {header}
        <ScrollableBody ref={bodyRef} height={bodyHeight}>
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
