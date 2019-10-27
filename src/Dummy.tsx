import React from "react";

const dummy = Array.from(Array(100).keys(), i => i / 100);

export default () => (
  <>
    {dummy.map(i => (
      <p key={i}>this is placeholder {i}</p>
    ))}
  </>
);
