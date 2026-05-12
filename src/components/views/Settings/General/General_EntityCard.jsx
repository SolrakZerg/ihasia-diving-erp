import React from 'react';
import { 
  Building, 
  Ship, 
  Save, 
  MapPin, 
  Mail, 
  Phone, 
  Globe2, 
  Upload, 
  Image as ImageIcon, 
  X as CloseIcon 
} from 'lucide-react';
import logoFull from '../../../../assets/Logo_Ihasia.svg';
import logoSmall from '../../../../assets/logo-version-movil-ihasia.webp';
import EditableInput from '../../../common/EditableInput';

const General_EntityCard = ({ entity, saving, updateEntityField, saveEntity, handleFileUpload, removeImage }) => {
  const [logoError, setLogoError] = React.useState(false);
  const [secondaryError, setSecondaryError] = React.useState(false);

  React.useEffect(() => {
    setLogoError(false);
  }, [entity.logo_url]);

  React.useEffect(() => {
    setSecondaryError(false);
  }, [entity.secondary_image_url]);

  return (
    <div className={`bg-surface-soft border border-surface-edge rounded-3xl overflow-hidden shadow-2xl transition-all ${entity.is_own_company ? 'ring-2 ring-brand/20' : ''}`}>
      {/* Entity Header */}
      <div className={`px-6 py-4 flex justify-between items-center ${entity.is_own_company ? 'bg-brand/10' : 'bg-emerald-500/10'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${entity.is_own_company ? 'bg-brand text-white' : 'bg-emerald-500 text-white'}`}>
            {entity.is_own_company ? <Building className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight">{entity.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {entity.is_own_company ? 'Sede Principal' : 'Proveedor de Servicios'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => saveEntity(entity)}
          disabled={saving}
          className={`p-2 rounded-xl transition-all ${entity.is_own_company ? 'hover:bg-brand text-brand hover:text-white' : 'hover:bg-emerald-500 text-emerald-400 hover:text-white'}`}
        >
          <Save className="w-5 h-5" />
        </button>
      </div>

      {/* Entity Form */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-5">
          {/* Legal Name & Tax ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre Legal</label>
              <EditableInput 
                defaultValue={entity.legal_name || ''} 
                onSave={val => updateEntityField(entity.id, 'legal_name', val)}
                className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TAX ID</label>
              <EditableInput 
                defaultValue={entity.tax_id || ''} 
                onSave={val => updateEntityField(entity.id, 'tax_id', val)}
                className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand transition-all outline-none"
              />
            </div>
          </div>

          {/* Brand Name (Space preserved for symmetry) */}
          <div className={`space-y-1.5 ${!entity.is_own_company ? 'invisible pointer-events-none' : ''}`}>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sucursal / Brand</label>
            <EditableInput 
              defaultValue={entity.brand_name || ''} 
              onSave={val => updateEntityField(entity.id, 'brand_name', val)}
              className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand transition-all outline-none"
              tabIndex={!entity.is_own_company ? -1 : 0}
            />
          </div>

          {/* Address Section */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-2 border-b border-surface-edge/30 pb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dirección y Localización</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Dirección (Línea 1)</label>
                <EditableInput 
                  placeholder="Ej: 50/15 Moo 3"
                  defaultValue={entity.address_line1 || ''} 
                  onSave={val => updateEntityField(entity.id, 'address_line1', val)}
                  className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Barrio / Zona (Línea 2)</label>
                <EditableInput 
                  placeholder="Ej: Chalok Ban Kao"
                  defaultValue={entity.address_line2 || ''} 
                  onSave={val => updateEntityField(entity.id, 'address_line2', val)}
                  className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Ciudad</label>
                <EditableInput 
                  placeholder="Koh Tao"
                  defaultValue={entity.city || ''} 
                  onSave={val => updateEntityField(entity.id, 'city', val)}
                  className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Provincia</label>
                <EditableInput 
                  placeholder="Surat Thani"
                  defaultValue={entity.province || ''} 
                  onSave={val => updateEntityField(entity.id, 'province', val)}
                  className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">C.P.</label>
                <EditableInput 
                  placeholder="84360"
                  defaultValue={entity.zip_code || ''} 
                  onSave={val => updateEntityField(entity.id, 'zip_code', val)}
                  className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">País</label>
                <EditableInput 
                  placeholder="Thailand"
                  defaultValue={entity.country || ''} 
                  onSave={val => updateEntityField(entity.id, 'country', val)}
                  className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="pt-2">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
                  <EditableInput 
                    placeholder="Email"
                    defaultValue={entity.email || ''} 
                    onSave={val => updateEntityField(entity.id, 'email', val)}
                    className="w-full bg-black/20 border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand outline-none transition-all"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
                  <EditableInput 
                    placeholder="Teléfono"
                    defaultValue={entity.phone || ''} 
                    onSave={val => updateEntityField(entity.id, 'phone', val)}
                    className="w-full bg-black/20 border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand outline-none transition-all"
                  />
                </div>
                <div className="relative group">
                  <Globe2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
                  <EditableInput 
                    placeholder="Web"
                    defaultValue={entity.website || ''} 
                    onSave={val => updateEntityField(entity.id, 'website', val)}
                    className="w-full bg-black/20 border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand outline-none transition-all"
                  />
                </div>
             </div>
          </div>

          {/* IMAGES SECTION */}
          <div className="pt-4 border-t border-surface-edge/30">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Logotipos e Imágenes</p>
            <div className="grid grid-cols-2 gap-4">
              {/* LOGO */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Logo Principal</p>
                <div className="relative aspect-square rounded-2xl bg-black/40 border-2 border-dashed border-surface-edge group/img overflow-hidden flex items-center justify-center hover:border-brand/50 transition-all cursor-pointer">
                  { (!logoError && (entity.logo_url || (entity.is_own_company ? logoFull : null))) ? (
                    <>
                      <img 
                        src={entity.logo_url || logoFull} 
                        alt="Logo" 
                        className={`w-full h-full object-contain p-4 ${!entity.logo_url && entity.is_own_company ? 'brightness-0 invert opacity-50' : ''}`} 
                        onError={() => setLogoError(true)}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {entity.logo_url ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeImage(entity.id, 'logo_url'); }}
                            className="p-2 bg-rose-500 rounded-lg text-white hover:scale-110 transition-transform"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[8px] font-black text-white uppercase px-2 py-1 bg-brand rounded">Local (Sugerido)</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover/img:text-brand transition-colors">
                      <Upload className="w-6 h-6" />
                      <span className="text-[8px] font-black uppercase">Subir Logo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(entity.id, 'logo_url', e.target.files[0])}
                  />
                </div>
              </div>

              {/* SECONDARY IMAGE */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Imagen Secundaria</p>
                <div className="relative aspect-square rounded-2xl bg-black/40 border-2 border-dashed border-surface-edge group/img overflow-hidden flex items-center justify-center hover:border-brand/50 transition-all cursor-pointer">
                  { (!secondaryError && (entity.secondary_image_url || (entity.is_own_company ? logoSmall : null))) ? (
                    <>
                      <img 
                        src={entity.secondary_image_url || logoSmall} 
                        alt="Secondary" 
                        className={`w-full h-full object-contain p-4 ${!entity.secondary_image_url && entity.is_own_company ? 'brightness-0 invert opacity-50' : ''}`} 
                        onError={() => setSecondaryError(true)}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {entity.secondary_image_url ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeImage(entity.id, 'secondary_image_url'); }}
                            className="p-2 bg-rose-500 rounded-lg text-white hover:scale-110 transition-transform"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[8px] font-black text-white uppercase px-2 py-1 bg-brand rounded">Local (Sugerido)</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover/img:text-brand transition-colors">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[8px] font-black uppercase">Subir Imagen</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(entity.id, 'secondary_image_url', e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default General_EntityCard;
