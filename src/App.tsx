import * as React from "react";
import styled from "styled-components";
import Sticky from "./StickyNative";
import Dummy from "./Dummy";

import "sanitize.css";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
const Row = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Column = styled.div`
  position: relative;
  background-color: yellow;
  color: red;
  display: flex;
  flex-direction: column;
  flex-basis: 1;
  flex: 1;
`;

export default () => {
  const parentRef = React.useRef(null);

  return (
    <>
      <Container>
        <Row>
          <Column>
            <Dummy amount={5} />
          </Column>
        </Row>
        <Row>
          <Column>
            <Dummy amount={100} />
          </Column>
          <Column ref={parentRef}>
            <Sticky
              parentRef={parentRef}
              isDebug
              topOffset={200}
              minHeight={100}
            >
              <Dummy amount={20} />
            </Sticky>
          </Column>
        </Row>
        <Row>
          <Column style={{ marginTop: 100, backgroundColor: "cyan" }}>
            <Dummy />
          </Column>
        </Row>
      </Container>
    </>
  );
};
