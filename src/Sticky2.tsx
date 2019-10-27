import * as React from "react";
import styled from "styled-components";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import Dummy from "./Dummy";

const Container = styled.div.attrs(props => ({
  style: {
    transform: `translateY(${props.top}px)`
  }
}))`
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
  const { parentRef, isShowThreshold, topOffset, minHeight } = props;

  const [scrollY, setScrollY] = React.useState(0);
  const [bodyHeight, setBodyHeight] = React.useState();
  const thisRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  let originalBodyHeight = React.useRef(0);
  let originalSelfHeight = React.useRef(0);
  // Adjustor TODO: define this
  let adjust = React.useRef(0);
  // Rectangle for <Container />
  let selfRect = React.useRef({ top: 0, height: 0 });
  // Rectangle for Parent Component
  let parentRect = React.useRef({ top: 0, height: 0 });
  const parentEndFromTop = React.useRef(0);

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
    parentEndFromTop.current =
      parentRect.current.top + parentRect.current.height;
  }, [parentRect, parentRef]);

  React.useLayoutEffect(() => {
    selfRect.current = thisRef.current.getBoundingClientRect();
    originalSelfHeight.current = selfRect.current.height;
    originalBodyHeight.current = bodyRef.current.getBoundingClientRect().height;
    setBodyHeight(originalBodyHeight.current);
  }, [originalBodyHeight]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      setScrollY(currPos.y);

      const isPulling = currPos.y < prevPos.y;
      const scrollYFromTopElement = currPos.y - parentRect.current.top;
      const adjustScrollYWithOffset = scrollYFromTopElement + topOffset;
      const normalizedOffset =
        adjustScrollYWithOffset > 0 ? adjustScrollYWithOffset : 0;

      if (
        !isPulling &&
        normalizedOffset > originalBodyHeight.current + adjust.current &&
        normalizedOffset <= parentRect.current.height - selfRect.current.height
      ) {
        adjust.current = normalizedOffset - originalBodyHeight.current;
      } else if (
        !isPulling &&
        normalizedOffset > parentRect.current.height - selfRect.current.height
      ) {
        adjust.current = parentRect.current.height - originalSelfHeight.current;
      } else if (isPulling && normalizedOffset < adjust.current) {
        adjust.current = normalizedOffset;
      }

      const realHeight =
        originalBodyHeight.current - normalizedOffset + adjust.current;

      setBodyHeight(realHeight >= minHeight ? realHeight : minHeight);

      selfRect.current = thisRef.current.getBoundingClientRect();

      bodyRef.current.scrollTop = originalBodyHeight.current;
    },
    [scrollY],
    parentRef,
    true
  );

  const scrollYFromTopElement = scrollY - parentRect.current.top;
  let computedOfset = 0;
  if (scrollYFromTopElement + topOffset < 0) {
    computedOfset = 0;
  } else if (
    scrollYFromTopElement + topOffset + selfRect.current.height >
    parentRect.current.height
  ) {
    computedOfset =
      parentEndFromTop.current -
      selfRect.current.height -
      parentRect.current.top;
  } else if (scrollYFromTopElement + topOffset > 0) {
    computedOfset = scrollYFromTopElement + topOffset;
  }

  return (
    <>
      {isShowThreshold && <Pointer top={adjust.current} />}
      {isShowThreshold && <TopOffsetPointer top={topOffset} />}
      <Container ref={thisRef} top={computedOfset}>
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
  isShowThreshold: true,
  topOffset: 200,
  minHeight: 100
};

export default Sticky;
