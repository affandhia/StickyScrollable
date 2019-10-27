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

const BannerHeader = styled.h3`
  background-color: red;
  color: yellow;
`;

const Header = () => {
  return <BannerHeader>Header</BannerHeader>;
};

const ScrollableBody = styled.div.attrs(props => ({
  style: props.height ? { height: `${props.height}px` } : {}
}))`
  background: orange;
  overflow-y: hidden;
`;

const topOffset = 10;
const minHeight = 100;

const Sticky = ({ parentRef }) => {
  const [offset, setOffset] = React.useState(0);
  const [height, setHeight] = React.useState(null);
  const thisRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  let originalBodyHeight = React.useRef(0);
  let selfRect = React.useRef({ top: 0, height: 0 });
  let parentRect = React.useRef({ top: 0, height: 0 });

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
  }, [parentRect, parentRef]);

  React.useLayoutEffect(() => {
    originalBodyHeight.current = bodyRef.current.getBoundingClientRect().height;
    setHeight(originalBodyHeight.current);
    console.log("didmount", originalBodyHeight.current);
  }, [originalBodyHeight, bodyRef]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const parentEndFromTop =
        parentRect.current.top + parentRect.current.height;

      const scrollYFromTopElement = currPos.y - parentRect.current.top;

      if (scrollYFromTopElement + topOffset < 0) {
        setOffset(0);
        setHeight(originalBodyHeight);
      } else if (
        scrollYFromTopElement + topOffset + selfRect.current.height >
        parentRect.current.height
      ) {
        setOffset(
          parentEndFromTop - selfRect.current.height - parentRect.current.top
        );
      } else if (scrollYFromTopElement + topOffset > 0) {
        const newHeight = originalBodyHeight.current - scrollYFromTopElement;

        setOffset(scrollYFromTopElement + topOffset);
        if (newHeight > minHeight) {
          setHeight(newHeight);
        } else {
          setHeight(minHeight);
        }

        bodyRef.current.scrollTop = originalBodyHeight.current;
      }
    },
    [offset, height],
    parentRef,
    true
  );

  return (
    <>
      <Container ref={thisRef} top={offset}>
        <Header />
        <ScrollableBody ref={bodyRef} height={height}>
          <Dummy amount={10} />
        </ScrollableBody>
      </Container>
    </>
  );
};

export default Sticky;
