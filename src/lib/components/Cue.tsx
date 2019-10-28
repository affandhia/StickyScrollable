import styled from "styled-components";

export default styled.div.attrs(props => ({
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
