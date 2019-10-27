import * as React from "react";

const arrayGenerator = amount => Array.from(Array(amount).keys(), i => i);

const Dummy = props => (
  <>
    {arrayGenerator(props.amount).map(i => (
      <p key={i}>this is placeholder {i + 1}</p>
    ))}
  </>
);

Dummy.defaultProps = {
  amount: 100
};

export default Dummy;
