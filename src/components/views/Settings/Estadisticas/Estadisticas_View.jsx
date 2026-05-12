import { Loader2, BarChart3 } from 'lucide-react';
import useEstadisticasData from './useEstadisticasData';
import Estadisticas_MetricSelector from './Estadisticas_MetricSelector';
import Estadisticas_Chart from './Estadisticas_Chart';
import Estadisticas_Table from './Estadisticas_Table';

/**
 * Estadisticas_View — Orquestador del módulo Estadísticas.
 * Consume useEstadisticasData y ensambla todos los subcomponentes.
 * No contiene lógica de negocio ni transformaciones de datos.
 */
export default function Estadisticas_View() {
  const {
    loading,
    activeMetric, setActiveMetric,
    availableYears, hiddenYears, hiddenMetrics,
    selectedComparisonYear, setSelectedComparisonYear,
    toggleYear, toggleMetric, handleExportCSV,
    currentMetricGrid, chartData, chartYears,
    getYearlyComparisonData,
  } = useEstadisticasData();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
        <Loader2 className="w-12 h-12 animate-spin text-brand" />
        <span className="text-xs font-black uppercase tracking-widest">Cargando Histórico...</span>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-unfold">

      {/* ── Selector de métricas ─────────────────────────────────────────── */}
      <Estadisticas_MetricSelector
        activeMetric={activeMetric}
        setActiveMetric={setActiveMetric}
      />

      {/* ── Gráfico de líneas ────────────────────────────────────────────── */}
      <Estadisticas_Chart
        activeMetric={activeMetric}
        chartData={chartData}
        chartYears={chartYears}
        hiddenYears={hiddenYears}
        toggleYear={toggleYear}
        hiddenMetrics={hiddenMetrics}
        toggleMetric={toggleMetric}
        selectedComparisonYear={selectedComparisonYear}
      />

      {/* ── Tabla comparativa mensual ────────────────────────────────────── */}
      <Estadisticas_Table
        activeMetric={activeMetric}
        currentMetricGrid={currentMetricGrid}
        availableYears={availableYears}
        hiddenYears={hiddenYears}
        hiddenMetrics={hiddenMetrics}
        selectedComparisonYear={selectedComparisonYear}
        setSelectedComparisonYear={setSelectedComparisonYear}
        getYearlyComparisonData={getYearlyComparisonData}
        handleExportCSV={handleExportCSV}
      />

    </div>
  );
}
