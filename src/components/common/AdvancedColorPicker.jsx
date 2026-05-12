import { useState, useRef, useEffect } from 'react';
import { RgbaStringColorPicker } from 'react-colorful';

const PRESETS = [
  'rgba(239, 68, 68, 1)',   // Red
  'rgba(249, 115, 22, 1)',  // Orange
  'rgba(245, 158, 11, 1)',  // Amber
  'rgba(34, 197, 94, 1)',   // Green
  'rgba(16, 185, 129, 1)',  // Emerald
  'rgba(6, 182, 212, 1)',   // Cyan
  'rgba(59, 130, 246, 1)',  // Blue
  'rgba(99, 102, 241, 1)',  // Indigo
  'rgba(168, 85, 247, 1)',  // Purple
  'rgba(236, 72, 153, 1)',  // Pink
];

// Helper para asegurar que siempre pasamos RGBA al RgbaStringColorPicker
function ensureRgba(color) {
  if (!color || color.startsWith('bg-')) return 'rgba(59, 130, 246, 1)';
  if (color.startsWith('rgba')) return color;
  if (color.startsWith('rgb')) return color.replace('rgb', 'rgba').replace(')', ', 1)');
  
  // Hex to RGBA
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
    let c = color.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(', ') + ', 1)';
  }
  
  return 'rgba(59, 130, 246, 1)';
}

export default function AdvancedColorPicker({ 
  color = 'rgba(59, 130, 246, 1)', 
  onChange, 
  className = '',
  align = 'left' // 'left' | 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Parse color to ensure it's a valid string for the picker
  const safeColor = ensureRgba(color);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-xl border border-surface-edge shadow-sm focus:outline-none focus:ring-2 focus:ring-brand overflow-hidden flex items-center justify-center bg-checkered-pattern"
        style={{
          // We use a checkered background (via CSS or base64 SVG) so opacity is visible
          backgroundImage: 'conic-gradient(rgba(255,255,255,0.1) 90deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.1) 180deg, rgba(255,255,255,0.1) 270deg, transparent 270deg)',
          backgroundSize: '8px 8px'
        }}
      >
        {/* Actual Color Overlay */}
        <div className="w-full h-full" style={{ backgroundColor: safeColor }} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className={`absolute z-50 top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-surface border border-surface-edge p-3 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200`}>
          <RgbaStringColorPicker color={safeColor} onChange={onChange} />
          
          <div className="mt-4 border-t border-surface-edge pt-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Predefinidos</span>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange(preset)}
                  className="w-8 h-8 rounded-lg border border-surface-edge hover:scale-110 transition-transform shadow-sm relative overflow-hidden"
                  style={{
                    backgroundImage: 'conic-gradient(rgba(255,255,255,0.1) 90deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.1) 180deg, rgba(255,255,255,0.1) 270deg, transparent 270deg)',
                    backgroundSize: '6px 6px'
                  }}
                >
                  <div className="absolute inset-0" style={{ backgroundColor: preset }} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-surface-edge">
             <input 
               type="text" 
               value={safeColor} 
               onChange={(e) => onChange(e.target.value)}
               className="w-full bg-surface-soft border border-surface-edge rounded-lg px-2 py-1 text-[11px] font-mono text-gray-300 text-center outline-none focus:border-brand"
             />
          </div>
        </div>
      )}
    </div>
  );
}
