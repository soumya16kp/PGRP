import React, { useId } from "react";

const Input = React.forwardRef(function Input(
  { label, className = "", ...props },
  ref
) {
  const id = useId(); 

  return (
    <div className="input-container">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <input {...props} id={id} ref={ref} className={`input-field ${className}`} />
    </div>
  );
});

export default Input;