import useDashboardData from './useDashboardData';
import Dashboard_Header from './Dashboard_Header';
import Dashboard_Chart_Staff from './Dashboard_Chart_Staff';
import Dashboard_Chart_Gastos from './Dashboard_Chart_Gastos';
import Dashboard_CRBT from './Dashboard_CRBT';
import Dashboard_Table_Staff from './Dashboard_Table_Staff';
import Dashboard_Cursos from './Dashboard_Cursos';
import Dashboard_Table_Gastos from './Dashboard_Table_Gastos';
import Dashboard_Cuentas from './Dashboard_Cuentas';
import Dashboard_Ingresos from './Dashboard_Ingresos';
import Dashboard_Chart_CRBT from './Dashboard_Chart_CRBT';

export default function Dashboard_View() {
  const {
    loading,
    year,
    setYear,
    month,
    setMonth,
    months,
    staffData,
    expenseData,
    monthlyReport,
    incomeData,
    courseStats,
    handlePrevMonth,
    handleNextMonth,
    updateOpeningCash,
    updateGenericPending,
    fetchDashboardData
  } = useDashboardData();

  if (loading && !staffData.length) {
    return (
      <div className="min-h-screen bg-[#0d0e15] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white font-sans p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col gap-6 max-w-[1920px] mx-auto">
      
      {/* 1. Header */}
      <Dashboard_Header 
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        months={months}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
      />

      {/* 2. Top Row (Charts and CRBT) */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 flex flex-col md:flex-row gap-6">
           <Dashboard_Chart_Staff staffData={staffData} />
           <Dashboard_Chart_Gastos expenseData={expenseData} monthlyReport={monthlyReport} incomeData={incomeData} />
        </div>
        <Dashboard_CRBT monthlyReport={monthlyReport} />
      </div>

      {/* 3. Bottom Row (Tables, Cursos, Accounts, Income, Pies) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
         <Dashboard_Table_Staff staffData={staffData} />
         <Dashboard_Cursos courseStats={courseStats} year={year} />
         <Dashboard_Table_Gastos 
           expenseData={expenseData} 
           incomeData={incomeData}
           updateGenericPending={updateGenericPending} 
           fetchDashboardData={fetchDashboardData} 
         />
         <Dashboard_Cuentas 
           incomeData={incomeData} 
           updateOpeningCash={updateOpeningCash} 
           fetchDashboardData={fetchDashboardData}
           monthlyReport={monthlyReport}
         />
         <Dashboard_Ingresos incomeData={incomeData} />
         <Dashboard_Chart_CRBT incomeData={incomeData} />
      </div>

    </div>
  );
}
