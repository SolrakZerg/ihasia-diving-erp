import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const UndoContext = createContext();

export const useUndo = () => useContext(UndoContext);

export const UndoProvider = ({ children, currentView, navigateTo }) => {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState([]);
  const MAX_HISTORY = 50;
  const TTL_MS = 30 * 60 * 1000; // 30 minutos

  const timeoutRef = useRef(null);

  // Agregar toast a la cola
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 15000); // 15 segundos para pruebas fáciles
  }, []);

  // Eliminar un toast de forma manual (al pulsar la X)
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Limpiar historial si pasa mucho tiempo inactivo (Protección Pila Caducada)
  const resetActivityTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPast([]);
      setFuture([]);
      console.log('🔄 [UndoProvider] Historial borrado por inactividad (TTL 30m)');
    }, TTL_MS);
  }, [TTL_MS]);

  useEffect(() => {
    resetActivityTimeout();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [past, future, resetActivityTimeout]);

  const pushAction = useCallback((action) => {
    setPast((prev) => {
      const newPast = [...prev, action];
      if (newPast.length > MAX_HISTORY) {
        newPast.shift(); // Borrar el más antiguo si excedemos el límite
      }
      return newPast;
    });
    setFuture([]); // Borrar futuro al hacer nueva acción
    resetActivityTimeout();
  }, [resetActivityTimeout]);

  const undo = useCallback(async () => {
    if (past.length === 0) return;
    const action = past[past.length - 1];
    
    // Si la acción fue en otra vista, navegamos a ella primero
    if (action.view && action.view !== currentView && navigateTo) {
      console.log(`🔀 [UndoProvider] Cambiando interfaz a '${action.view}' antes de deshacer...`);
      navigateTo(action.view);
      // Damos un pequeño respiro para que React desmonte/monte componentes si es necesario
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    try {
      // Validar Optimistic Concurrency dentro del action.undo() si está definido, o confiar en Supabase.
      const success = await action.undo();
      if (success !== false) {
        setPast((prev) => prev.slice(0, -1));
        setFuture((prev) => [...prev, action]);
        setRefreshTrigger((prev) => prev + 1);
        if (action.description) {
          const desc = typeof action.description === 'object' ? action.description.undo : action.description;
          addToast(desc, 'undo');
        }
      }
    } catch (err) {
      console.error('❌ [UndoProvider] Error al deshacer:', err);
      addToast(`Error al deshacer: ${err.message || 'Error desconocido'}`, 'error');
    }
  }, [past, currentView, navigateTo, addToast]);

  const redo = useCallback(async () => {
    if (future.length === 0) return;
    const action = future[future.length - 1];

    if (action.view && action.view !== currentView && navigateTo) {
      console.log(`🔀 [UndoProvider] Cambiando interfaz a '${action.view}' antes de rehacer...`);
      navigateTo(action.view);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    try {
      const success = await action.redo();
      if (success !== false) {
        setFuture((prev) => prev.slice(0, -1));
        setPast((prev) => [...prev, action]);
        setRefreshTrigger((prev) => prev + 1);
        if (action.description) {
          const desc = typeof action.description === 'object' ? action.description.redo : action.description;
          addToast(desc, 'redo');
        }
      }
    } catch (err) {
      console.error('❌ [UndoProvider] Error al rehacer:', err);
      addToast(`Error al rehacer: ${err.message || 'Error desconocido'}`, 'error');
    }
  }, [future, currentView, navigateTo, addToast]);

  // Escucha de teclado global
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo actuar si presionamos Ctrl o Cmd
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        // Evitamos prevenir el comportamiento por defecto si están escribiendo en un input o textarea
        // A MENOS que sea estrictamente Z, para permitir que deshagan texto a nivel de input nativo
        // Sin embargo, queremos atraparlo a nivel global. Para evitar colisiones con Ctrl+Z nativo del input:
        // Si el usuario está enfocando un input, dejaremos que el navegador actúe. 
        // ¡OJO! Si el usuario "onBlur" pierde el foco, el Ctrl+Z nuestro actuará.
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
        if (isInput) return; // Si están tecleando, el navegador manda.

        if (key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        } else if (key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <UndoContext.Provider value={{ pushAction, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, refreshTrigger }}>
      {children}
      
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2.5 items-center pointer-events-none w-full max-w-xl md:max-w-2xl px-4">
        {[...toasts].reverse().map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3.5 border transition-all duration-300 transform scale-100 hover:scale-[1.01] hover:shadow-3xl ${
              toast.type === 'error'
                ? 'bg-rose-600 border-rose-500 text-white shadow-rose-900/20'
                : toast.type === 'undo'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/20'
                : toast.type === 'redo'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/20'
                : 'bg-brand border-brand-edge text-white shadow-brand/10'
            } animate-fade-in-up`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : toast.type === 'undo' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            ) : toast.type === 'redo' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-semibold text-[13.5px] md:text-sm tracking-wide leading-snug flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-colors focus:outline-none"
              aria-label="Cerrar notificación"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </UndoContext.Provider>
  );
};
