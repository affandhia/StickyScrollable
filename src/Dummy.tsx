import * as React from "react";

const arrayGenerator = amount => Array.from(Array(amount).keys(), i => i);
const DummyItem = props => {
  const [show, setShow] = React.useState(false);
  const { i } = props;
  return (
    <>
      <p
        onClick={() => {
          setShow(!show);
        }}
        key={i}
      >
        this is placeholder {i + 1}
      </p>
      {show && <p>dropdown</p>}
    </>
  );
};
const Dummy = props => {
  return (
    <div style={props.style}>
      {arrayGenerator(props.amount).map(i => (
        <DummyItem key={i} i={i} />
      ))}
    </div>
  );
};

Dummy.defaultProps = {
  amount: 100
};

export default Dummy;
