import React, { useState, useEffect, useRef } from 'react';

const EditableInput = ({
   defaultValue = '',
   onSave,
   className = '',
   placeholder = '',
   type = 'text',
   ...props
}) => {
   const [value, setValue] = useState(defaultValue);
   const [originalValue, setOriginalValue] = useState(defaultValue);
   const isCancelling = useRef(false);

   useEffect(() => {
      setValue(defaultValue);
      setOriginalValue(defaultValue);
   }, [defaultValue]);

   const handleKeyDown = (ev) => {
      if (ev.key === 'Enter') {
         ev.target.blur();
      } else if (ev.key === 'Escape') {
         isCancelling.current = true;
         setValue(originalValue);
         ev.target.blur();
      }
   };

   const handleBlur = (ev) => {
      if (isCancelling.current) {
         isCancelling.current = false;
         return;
      }
      const newValue = ev.target.value;
      if (newValue !== originalValue) {
         onSave(newValue);
         setOriginalValue(newValue); // Actualizamos el original tras guardar
      }
   };

   return (
      <input
         type={type}
         value={value}
         onChange={(e) => setValue(e.target.value)}
         onKeyDown={handleKeyDown}
         onBlur={handleBlur}
         className={className}
         placeholder={placeholder}
         {...props}
      />
   );
};

export default EditableInput;
