import React, { useState, useEffect, useRef, forwardRef } from 'react';

const EditableInput = forwardRef(({
   defaultValue = '',
   onSave,
   onCancel,
   className = '',
   placeholder = '',
   type = 'text',
   ...props
}, ref) => {
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
         if (onCancel) onCancel();
      }
   };

   const handleBlur = (ev) => {
      if (isCancelling.current) {
         isCancelling.current = false;
         if (props.onBlur) props.onBlur(ev);
         return;
      }
      const newValue = ev.target.value;
      if (newValue !== originalValue) {
         onSave(newValue, originalValue);
         setOriginalValue(newValue); // Actualizamos el original tras guardar
      }
      if (props.onBlur) props.onBlur(ev);
   };

   return (
      <input
         ref={ref}
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
});

export default EditableInput;
