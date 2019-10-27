import * as React from "react";
import styled from "styled-components";
import Sticky from "./Sticky";
import Dummy from "./Dummy";

import "sanitize.css";

const Container = styled.div`
  display: flex;
  flex-direction: column;
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
  flex-basis: 100%;
  flex: 1;
`;

export default () => {
  const parentRef = React.useRef(null);

  return (
    <>
      <Container>
        <Row>
          <Column>
            <Dummy />
          </Column>
          <Column ref={parentRef}>
            <Sticky parentRef={parentRef} />
          </Column>
        </Row>
        <Row>
          <Column style={{ backgroundColor: "cyan" }}>
            <Dummy />
          </Column>
        </Row>
      </Container>
    </>
  );
};
