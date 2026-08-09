import { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Settings as SettingsIcon,
  Rows3,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Banknote,
  Handshake,
  DollarSign,
  Receipt,
  UserRoundSearch,
  CreditCard,
  ShieldCheck,
  UsersRound,
  BarChart3
} from 'lucide-react';
import { manualSections } from './sections';

const SSIIcon = ({ className }) => (
  <div
    className={className}
    style={{
      backgroundColor: 'currentColor',
      maskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi2.svg)',
      WebkitMaskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi2.svg)',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      transform: 'scale(1.2)'
    }}
  />
);

const CarabaoIcon = ({ className }) => (
  <div
    className={className}
    style={{
      backgroundColor: 'currentColor',
      maskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.svg)',
      WebkitMaskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.svg)',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      transform: 'scale(1.2)'
    }}
  />
);

const ICON_MAP = {
  BarChart3: BarChart3,
  SettingsIcon: SettingsIcon,
  Rows3: Rows3,
  Handshake: Handshake,
  DollarSign: DollarSign,
  Banknote: Banknote,
  Receipt: Receipt,
  UserRoundSearch: UserRoundSearch,
  CreditCard: CreditCard,
  ShieldCheck: ShieldCheck,
  UsersRound: UsersRound,
  SSIIcon: SSIIcon,
  CarabaoIcon: CarabaoIcon,
};

export default function Manual_View() {
  const [selectedSectionId, setSelectedSectionId] = useState('dashboard-cuentas-ingresos');
  const [searchQuery, setSearchQuery] = useState('');
  const [openParents, setOpenParents] = useState({ dashboard: true, facturacion: true, gastos: true, depositos: true, carabao: true, crbt: true, configuracion: true });

  const toggleParent = (parentId) => {
    setOpenParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  // Obtener lista plana de subsecciones e ítems simples
  const allFlatSections = useMemo(() => {
    const flat = [];
    manualSections.forEach(sec => {
      if (sec.children && sec.children.length > 0) {
        sec.children.forEach(child => {
          flat.push({ ...child, parentId: sec.id, parentTitle: sec.title });
        });
      } else {
        flat.push(sec);
      }
    });
    return flat;
  }, []);

  const activeSection = useMemo(() => {
    return allFlatSections.find(s => s.id === selectedSectionId) || allFlatSections[0];
  }, [allFlatSections, selectedSectionId]);

  // Filtrado de búsquedas
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return activeSection.topics;
    const q = searchQuery.toLowerCase();
    return activeSection.topics.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      JSON.stringify(t.content).toLowerCase().includes(q)
    );
  }, [activeSection, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header Superior con Titular y Buscador */}
      <header className="bg-slate-900 border-b border-white/10 px-8 py-6 sticky top-0 z-30 shadow-2xl backdrop-blur-md bg-slate-900/95">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-brand/20 border border-brand/40 rounded-2xl text-brand shadow-lg shadow-brand/10">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Manual de Uso y Centro de Ayuda
              </h1>
              <p className="text-sm text-gray-300 font-medium mt-0.5">
                Guías de usuario, procedimientos y referencia técnica del sistema IHASIA ERP
              </p>
            </div>
          </div>

          {/* Buscador de artículos */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el manual (ej: acrónimo, ssi, tanques)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-white/15 rounded-2xl pl-11 pr-10 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Cuerpo principal en 2 columnas: Menú de Módulos (Sidebar) + Visor de Contenido */}
      <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-8 p-8">
        
        {/* Columna Izquierda: Menú de Secciones (Iconos del menú principal) */}
        <div className="md:col-span-4 lg:col-span-3 xl:col-span-2 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 px-3 mb-2">
            Módulos del Manual
          </p>
          <nav className="space-y-2">
            {manualSections.map((sec) => {
              const IconComp = ICON_MAP[sec.icon] || HelpCircle;
              const hasChildren = Boolean(sec.children && sec.children.length > 0);

              if (hasChildren) {
                const isParentOpen = Boolean(openParents[sec.id]);
                const isAnyChildActive = sec.children.some(c => c.id === selectedSectionId);

                return (
                  <div key={sec.id} className="space-y-1">
                    {/* Header del Padre (Configuración) */}
                    <button
                      onClick={() => toggleParent(sec.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                        isAnyChildActive
                          ? 'bg-slate-800/90 border-brand/40 text-white'
                          : 'bg-slate-900/80 border-white/10 text-gray-200 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className={`w-5 h-5 flex-shrink-0 ${isAnyChildActive ? 'text-brand' : 'text-gray-400 group-hover:text-brand-light'}`} />
                        <div>
                          <p className="text-sm font-black text-white">
                            {sec.title}
                          </p>
                          <span className="text-[10px] font-black text-brand uppercase tracking-wider">
                            {sec.badge}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isParentOpen ? 'rotate-180 text-brand' : ''}`} />
                    </button>

                    {/* Sub-items Hijos desplegables */}
                    {isParentOpen && (
                      <div className="pl-3 space-y-1 border-l-2 border-brand/30 ml-3.5 my-1">
                        {sec.children.map((child) => {
                          const isChildActive = child.id === selectedSectionId;

                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                setSelectedSectionId(child.id);
                                setSearchQuery('');
                              }}
                              className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all text-left ${
                                isChildActive
                                  ? 'bg-brand/25 border-brand/60 text-white shadow-lg shadow-brand/10 font-bold'
                                  : 'bg-slate-900/40 border-white/5 text-gray-300 hover:bg-slate-800/60 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isChildActive ? 'bg-brand animate-pulse' : 'bg-gray-500'}`} />
                                <span className="text-xs font-bold">
                                  {child.title}
                                </span>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 ${isChildActive ? 'text-brand' : 'text-gray-600'}`} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Sección standalone normal (ej: Facturación, SSI, Carabao)
              const isActive = sec.id === selectedSectionId;

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSelectedSectionId(sec.id);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                    isActive
                      ? 'bg-brand/20 border-brand/50 text-white shadow-xl shadow-brand/10'
                      : 'bg-slate-900/80 border-white/10 text-gray-200 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <IconComp className={`w-6 h-6 flex-shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-gray-400 group-hover:text-brand-light'}`} />
                    <div>
                      <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-100'}`}>
                        {sec.title}
                      </p>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        {sec.badge}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'text-brand rotate-90' : 'text-gray-500'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Columna Derecha: Visor de Contenidos */}
        <div className="md:col-span-8 lg:col-span-9 xl:col-span-10 space-y-8">

          
          {/* Cabecera del Módulo seleccionado */}
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-brand/15 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand/25 text-brand-light border border-brand/40 shadow-sm">
                {activeSection.badge}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-1">
              {activeSection.title}
            </h2>
            <p className="text-sm text-gray-200 font-medium mt-2 max-w-4xl leading-relaxed">
              {activeSection.subtitle}
            </p>
          </div>

          {/* Temas y Guías del Módulo */}
          <div className="space-y-8">
            {filteredTopics.length === 0 ? (
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-16 text-center shadow-xl">
                <Search className="w-10 h-10 text-gray-500 mx-auto mb-4 animate-bounce" />
                <p className="text-base font-bold text-white">No se encontraron artículos para tu búsqueda</p>
                <p className="text-sm text-gray-400 mt-1">Prueba con términos como "actividad", "ssi", "tanques" o "widget".</p>
              </div>
            ) : (
              filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-slate-900 border border-white/15 rounded-3xl p-8 shadow-2xl hover:border-white/25 transition-all space-y-5"
                >
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-brand" />
                      {topic.title}
                    </h3>
                    <p className="text-sm text-gray-300 font-medium mt-1">
                      {topic.summary}
                    </p>
                  </div>

                  {/* Renderizado dinámico de tipos de contenido */}
                  <div className="space-y-5 pt-1">
                    {topic.content.map((block, idx) => {

                      // 1. Pasos numerados
                      if (block.type === 'steps') {
                        return (
                          <div key={idx} className="bg-slate-800/60 rounded-2xl p-6 border border-white/10 space-y-4 shadow-inner">
                            {block.items.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-brand/25 border border-brand/50 text-brand-light text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                                  {sIdx + 1}
                                </div>
                                <p className="text-sm text-slate-100 font-medium leading-relaxed">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // 2. Fichas de campos técnicos
                      if (block.type === 'fields') {
                        return (
                          <div key={idx} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {block.items.map((field, fIdx) => (
                              <div key={fIdx} className="bg-slate-800/70 border border-white/10 rounded-2xl p-5 space-y-2 hover:border-brand/40 transition-all shadow-md">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-base font-black text-white tracking-tight flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    {field.name}
                                  </span>
                                  {field.badge && (
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${field.badgeColor}`}>
                                      {field.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-200 leading-relaxed font-medium pt-1">
                                  {field.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // 3. Destacados / Callouts
                      if (block.type === 'callout') {
                        const isTip = block.style === 'tip';
                        return (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border flex items-start gap-4 shadow-lg ${
                              isTip
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-100'
                                : 'bg-blue-500/15 border-blue-500/40 text-blue-100'
                            }`}
                          >
                            {isTip ? (
                              <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                            ) : (
                              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider mb-1 text-white">
                                {block.title}
                              </p>
                              <p className="text-sm font-medium leading-relaxed">
                                {block.text}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
