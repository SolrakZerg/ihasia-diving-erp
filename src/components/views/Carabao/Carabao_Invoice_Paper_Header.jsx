import React from 'react';
import { Ship } from 'lucide-react';

export default function Carabao_Invoice_Paper_Header({
  ihasia,
  carabao,
  month,
  year
}) {
  return (
    <div className="flex justify-between items-start">
      <div className="space-y-6 flex-1 pr-8">
        {/* Own Logo */}
        <div className="w-40 h-40 flex items-center justify-start overflow-hidden">
          {ihasia?.logo_url ? (
            <img 
              src={ihasia.logo_url} 
              alt="Logo" 
              className="w-full h-full object-contain"
              style={{ filter: 'none', opacity: 1 }} 
            />
          ) : (
            <Ship className="w-16 h-16 text-emerald-800" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase tracking-tighter text-gray-800">{ihasia?.legal_name || 'Ihasia Diving Koh Tao Co., Ltd.'}</h2>
          <p className="text-sm font-bold text-gray-500">{ihasia?.brand_name || 'Head Office'}</p>
          <p className="text-sm font-bold text-gray-500">
            {ihasia?.address_line1} {ihasia?.address_line2 ? `, ${ihasia.address_line2}` : ''}
          </p>
          <p className="text-sm font-bold text-gray-500">
            {ihasia?.city}{ihasia?.province ? `, ${ihasia.province}` : ''}{ihasia?.zip_code ? `, ${ihasia.zip_code}` : ''}
          </p>
          <p className="text-sm font-black text-emerald-800 pt-1">TAX ID: {ihasia?.tax_id || '0843556002348'}</p>
        </div>
      </div>

      <div className="text-right space-y-6 w-64">
        {/* Invoice Meta */}
        <div className="bg-[#8a8e6b] text-white rounded-sm overflow-hidden shadow-md">
           <div className="grid grid-cols-2 text-center">
             <div className="border-r border-white/20 py-2">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Invoice No.</p>
               <p className="text-base font-black">{(month < 10 ? '0' : '') + month}/{year.toString().slice(-2)}</p>
             </div>
             <div className="py-2">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Date</p>
               <p className="text-base font-black">
                 {new Date(year, month, 0).toLocaleDateString('es-ES')}
               </p>
             </div>
           </div>
        </div>

        {/* Pay To Box */}
        <div className="text-left">
          <div className="bg-[#8a8e6b] text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
            Pay To:
          </div>
          <div className="bg-gray-100 p-4 border-x border-b border-gray-200">
            <p className="text-lg font-black text-gray-800 leading-tight mb-1">{carabao?.legal_name || 'Carabao Diving Koh Tao'}</p>
            <p className="text-xs font-bold text-gray-500">{carabao?.address_line1}</p>
            <p className="text-xs font-bold text-gray-500">{carabao?.address_line2}{carabao?.zip_code ? `, ${carabao.zip_code}` : ''}</p>
            <p className="text-xs font-bold text-gray-500">{carabao?.city}</p>
            <p className="text-xs font-bold text-gray-500">{carabao?.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
