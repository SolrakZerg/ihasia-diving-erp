import MonthYearSelector from '../../common/MonthYearSelector';

export default function Dashboard_Header({
  month,
  setMonth,
  year,
  setYear,
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-soft/30 py-8 px-6 rounded-2xl border border-surface-edge shadow-2xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <img src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg" alt="Logo" className="w-24 md:w-28 h-24 md:h-28 object-contain brightness-0 invert opacity-100" />
        <img
          src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-secondary.webp"
          alt="iHasia Financial"
          className="h-12 md:h-16 w-auto object-contain brightness-0 invert"
        />
      </div>

      <MonthYearSelector
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
          shortNames={true}
        />

      <div className="flex items-center gap-4">
        {/* Espacio reservado para futuros widgets de cabecera */}
      </div>
    </div>
  );
}
