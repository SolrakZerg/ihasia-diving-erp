import { useState, useRef, useCallback, useEffect } from 'react';

export const COL_KEYS = [
  'checkbox', 'plus', 'fecha', 'nombre', 'apellidos',
  'email', 'actividad', 'precio', 'qty', 'total',
  'estado', 'medio', 'instr', 'bizum', 'com', 'notas', 'actions'
];

const DEFAULT_WIDTHS = {
  checkbox: 35, plus: 35, fecha: 100, nombre: 150, apellidos: 150,
  email: 200, actividad: 150, precio: 65, qty: 40, total: 80,
  estado: 100, medio: 100, instr: 70, bizum: 60, com: 45, notas: 80, actions: 70
};

export const MIN_WIDTHS = {
  checkbox: 35, plus: 35, fecha: 100, nombre: 150, apellidos: 150,
  email: 200, actividad: 150, precio: 50, qty: 35, total: 80,
  estado: 100, medio: 100, instr: 70, bizum: 60, com: 45, notas: 1, actions: 70
};

const STORAGE_KEY = 'billing_col_widths_v1';

export function useColumnResize() {
  const [widths, setWidths] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_WIDTHS, ...JSON.parse(stored) } : { ...DEFAULT_WIDTHS };
    } catch {
      return { ...DEFAULT_WIDTHS };
    }
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const startResize = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();

    resizingCol.current = colKey;
    startX.current = e.clientX;
    startWidth.current = widths[colKey] ?? DEFAULT_WIDTHS[colKey] ?? 100;

    // Block text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMouseMove = (moveEvent) => {
      if (!resizingCol.current) return;
      const delta = moveEvent.clientX - startX.current;
      const minW = MIN_WIDTHS[resizingCol.current] ?? 30;
      const newWidth = Math.max(minW, startWidth.current + delta);
      setWidths(prev => ({ ...prev, [resizingCol.current]: Math.round(newWidth) }));
    };

    const onMouseUp = () => {
      resizingCol.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [widths]);

  const resetWidths = useCallback(() => {
    setWidths({ ...DEFAULT_WIDTHS });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { widths, startResize, resetWidths };
}
