import * as React from "react";
import styled from "styled-components";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import Dummy from "./Dummy";

const Container = styled.div.attrs(props => ({
  style: props.isUsingTransform
    ? {
        transform: `translateY(${props.top}px)`
      }
    : { top: `${props.top - 1}px` }
}))`
  position: absolute;
  width: 100%;
  background-color: green;
`;

const Pointer = styled.div.attrs(props => ({
  style: {
    transform: `translateY(${props.top - 1}px)`
  }
}))`
  width: 50px;
  height: 2px;
  background-color: blue;
  position: absolute;
  z-index: 99;
  border-radius: 9999px;
  right: 0;
`;

const TopOffsetPointer = styled.div.attrs(props => ({
  style: {
    top: `${props.top - 1}px)`
  }
}))`
  width: 50px;
  height: 2px;
  background-color: red;
  position: fixed;
  z-index: 99;
  border-radius: 9999px;
  right: 0;
`;

const Banner = styled.h3`
  background-color: red;
  color: yellow;
`;

const Header = () => {
  return <Banner>Header</Banner>;
};

const Footer = () => {
  return <Banner>Footer</Banner>;
};

const ScrollableBody = styled.div.attrs(props => ({
  style: props.height !== undefined ? { height: `${props.height}px` } : {}
}))`
  background: orange;
  overflow-y: hidden;
`;

const Sticky = props => {
  const {
    parentRef,
    isShowThreshold,
    topOffset,
    minHeight,
    isUsingTransform
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
  let adjust = React.useRef(0);
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
    containerRect.current = containerRef.current.getBoundingClientRect();
    originalContainerHeight.current = containerRect.current.height;
    originalBodyHeight.current = bodyRef.current.getBoundingClientRect().height;
    setBodyHeight(originalBodyHeight.current);
  }, [originalBodyHeight]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      setScrollTop(currPos.y);

      // it's True when user is scrolling down, otherwise is False
      const isPulling = currPos.y < prevPos.y;

      const scrollYFromTopElement = currPos.y - parentRect.current.top;
      const adjustScrollYWithOffset = scrollYFromTopElement + topOffset;
      const normalizedOffset =
        adjustScrollYWithOffset > 0 ? adjustScrollYWithOffset : 0;

      if (
        !isPulling &&
        normalizedOffset >
          originalBodyHeight.current - minHeight + adjust.current &&
        normalizedOffset <=
          parentRect.current.height - containerRect.current.height
      ) {
        adjust.current =
          normalizedOffset - originalBodyHeight.current + minHeight;
      } else if (
        !isPulling &&
        normalizedOffset >
          parentRect.current.height - containerRect.current.height
      ) {
        adjust.current =
          parentRect.current.height - originalContainerHeight.current;
      } else if (isPulling && normalizedOffset < adjust.current) {
        adjust.current = normalizedOffset;
      }

      const realHeight =
        originalBodyHeight.current - normalizedOffset + adjust.current;

      setBodyHeight(realHeight >= minHeight ? realHeight : minHeight);

      containerRect.current = containerRef.current.getBoundingClientRect();

      bodyRef.current.scrollTop = originalBodyHeight.current;
    },
    [scrollTop],
    parentRef,
    true
  );

  const scrollYFromTopElement = scrollTop - parentRect.current.top;
  let computedOfset = 0;
  if (scrollYFromTopElement + topOffset < 0) {
    computedOfset = 0;
  } else if (
    scrollYFromTopElement + topOffset + containerRect.current.height >
    parentRect.current.height
  ) {
    computedOfset =
      parentEndFromTop.current -
      containerRect.current.height -
      parentRect.current.top;
  } else if (scrollYFromTopElement + topOffset > 0) {
    computedOfset = scrollYFromTopElement + topOffset;
  }

  return (
    <>
      {isShowThreshold && <Pointer top={adjust.current} />}
      {isShowThreshold && <TopOffsetPointer top={topOffset} />}
      <Container
        ref={containerRef}
        top={computedOfset}
        isUsingTransform={isUsingTransform}
      >
        <Header />
        <ScrollableBody ref={bodyRef} height={bodyHeight}>
          <Dummy amount={4} />
        </ScrollableBody>
        <Footer />
      </Container>
    </>
  );
};

Sticky.defaultProps = {
  isUsingTransform: true,
  isShowThreshold: true,
  topOffset: 200,
  minHeight: 100
};

export default Sticky;
