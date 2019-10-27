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
  style: {
    height: props.height
  }
}))`
  background: orange;
`;

const topOffset = 10;
const minHeight = 100;

const Sticky = ({ parentRef }) => {
  const [offset, setOffset] = React.useState(0);
  const thisRef = React.useRef(null);
  let selfRect = React.useRef({ top: 0, height: 0 });
  let parentRect = React.useRef({ top: 0, height: 0 });

  React.useEffect(() => {
    parentRect.current = parentRef.current.getBoundingClientRect();
  }, [parentRect, parentRef]);

  React.useLayoutEffect(() => {
    selfRect.current = thisRef.current.getBoundingClientRect();
    // const parent = parentRef.current.getBoundingClientRect();
    // parentHeight.current = parent.height;
  }, [selfRect, thisRef]);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const parentEndFromTop =
        parentRect.current.top + parentRect.current.height;

      if (currPos.y < selfRect.current.top - topOffset) {
        setOffset(0);
      } else if (currPos.y + selfRect.current.height > parentEndFromTop) {
        setOffset(
          parentEndFromTop -
            selfRect.current.height -
            parentRect.current.top +
            topOffset
        );
      } else if (currPos.y > selfRect.current.top - topOffset) {
        setOffset(currPos.y - selfRect.current.top + topOffset);
      }
    },
    offset,
    parentRef,
    true
  );

  return (
    <>
      <Container ref={thisRef} top={offset}>
        <Header />
        <ScrollableBody>
          <Dummy />
        </ScrollableBody>
      </Container>
    </>
  );
};

export default Sticky;
