import { useState, useRef, memo } from 'react';
import { Settings, X, Save, Palette, Type, Layout, Coins } from 'lucide-react';

// Memorizamos los inputs para que no se re-rendericen mientras el usuario arrastra el ratón
const ColorInput = memo(({ label, field, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-1.5">
      <input 
        type="color" 
        value={value || '#000000'} 
        onInput={(e) => onChange(field, e.target.value)}
        className="w-10 h-10 rounded-xl border border-white/10 bg-slate-800 cursor-pointer overflow-hidden shrink-0"
      />
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full h-10 bg-slate-800 border border-white/10 rounded-xl px-2 text-[11px] text-white font-mono uppercase text-center"
      />
    </div>
  </div>
));

const TextInput = memo(({ label, field, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{label}</label>
    <input 
      type="text" 
      value={value || ''} 
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 bg-slate-800 border border-white/10 rounded-xl px-3 text-[11px] text-white font-medium"
    />
  </div>
));

export default function ThemeSettings({ uiConfig, setUiConfig, updateUIConfig, onClose }) {
  // Guardamos el original por si cancelan
  const originalConfig = useRef({ ...uiConfig });
  
  // Estado local para los inputs para que sean ultra-fluidos
  const [localConfig, setLocalConfig] = useState({ ...uiConfig });

  if (!uiConfig) return null;

  // Sincronizamos el estado local con el global para que se vea en el fondo
  const handleChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setUiConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updateUIConfig(localConfig);
    onClose();
  };

  const handleCancel = () => {
    setUiConfig(originalConfig.current);
    onClose();
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
      <Icon className="w-3.5 h-3.5 text-brand" />
      <h4 className="text-[10px] font-black text-white uppercase tracking-tight">{title}</h4>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-end p-6 pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={handleCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-[380px] overflow-hidden animate-in slide-in-from-right-8 duration-300 flex flex-col max-h-[90vh] pointer-events-auto">
        
        {/* HEADER SIMPLE */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900">
          <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand" />
            DISEÑO ERP
          </h3>
          <button onClick={handleCancel} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
          
          {/* FONDOS */}
          <section>
            <SectionHeader icon={Layout} title="Colores de Fondo" />
            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Abierto" field="bg_open" value={localConfig.bg_open} onChange={handleChange} />
              <ColorInput label="Cerrado" field="bg_closed" value={localConfig.bg_closed} onChange={handleChange} />
            </div>
          </section>

          {/* TÍTULOS */}
          <section>
            <SectionHeader icon={Type} title="Estilos de Título" />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Abierto" field="title_open" value={localConfig.title_open} onChange={handleChange} placeholder="Clases CSS..." />
              <TextInput label="Cerrado" field="title_closed" value={localConfig.title_closed} onChange={handleChange} placeholder="Clases CSS..." />
            </div>
          </section>

          {/* CANTIDADES */}
          <section>
            <SectionHeader icon={Coins} title="Colores de Cantidades" />
            <div className="space-y-8">
              {/* PAGADA */}
              <div className="space-y-2">
                <div className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest pl-1">PAGADA</div>
                <div className="flex items-start gap-2.5">
                  <div className="flex-1">
                    <ColorInput label="Fondo" field="paid_bg" value={localConfig.paid_bg} onChange={handleChange} />
                  </div>
                  <div className="flex-1">
                    <ColorInput label="Letra" field="paid_text" value={localConfig.paid_text} onChange={handleChange} />
                  </div>
                  <div className="flex-1">
                    <TextInput label="Estilo" field="paid_style" value={localConfig.paid_style} onChange={handleChange} placeholder="Clases CSS..." />
                  </div>
                </div>
              </div>

              {/* PARCIAL */}
              <div className="space-y-2">
                <div className="text-[8px] font-black text-orange-500/80 uppercase tracking-widest pl-1">PARCIAL</div>
                <div className="flex items-start gap-2.5">
                  <div className="flex-1">
                    <ColorInput label="Fondo" field="partial_bg" value={localConfig.partial_bg} onChange={handleChange} />
                  </div>
                  <div className="flex-1">
                    <ColorInput label="Letra" field="partial_text" value={localConfig.partial_text} onChange={handleChange} />
                  </div>
                  <div className="flex-1">
                    <TextInput label="Estilo" field="partial_style" value={localConfig.partial_style} onChange={handleChange} placeholder="Clases CSS..." />
                  </div>
                </div>
              </div>

              {/* PENDIENTE */}
              <div className="space-y-2">
                <div className="text-[8px] font-black text-red-500/80 uppercase tracking-widest pl-1">PENDIENTE</div>
                <div className="flex items-start gap-2.5">
                  <div className="flex-1">
                    <ColorInput label="Fondo" field="pending_bg" value={localConfig.pending_bg} onChange={handleChange} />
                  </div>
                  <div className="flex-1">
                    <ColorInput label="Letra" field="pending_text" value={localConfig.pending_text} onChange={handleChange} />
                  </div>
                  <div className="flex-1">
                    <TextInput label="Estilo" field="pending_style" value={localConfig.pending_style} onChange={handleChange} placeholder="Clases CSS..." />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-white/5 flex gap-2">
          <button 
            onClick={handleCancel}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl transition-all uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-2.5 bg-brand text-white text-[11px] font-black rounded-xl shadow-lg shadow-brand/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
