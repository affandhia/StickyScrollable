import styled from "styled-components";

export default styled.div.attrs(props => ({
  style: {
    top: `${props.top - 1}px`
  }
}))`
  width: 100%;
  height: 2px;
  background-color: red;
  position: fixed;
  z-index: 99;
  border-radius: 9999px;
  right: 0;
`;
