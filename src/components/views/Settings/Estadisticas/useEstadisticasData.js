import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { MONTH_NAMES, COMPARISON_COLORS, getMetricLabel } from './Estadisticas_utils';

export default function useEstadisticasData() {
  // ── Estado ────────────────────────────────────────────────────────────────
  const [data, setData]                               = useState([]);
  const [settlementsData, setSettlementsData]         = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [activeMetric, setActiveMetric]               = useState('facturado');
  const [selectedComparisonYear, setSelectedComparisonYear] = useState(new Date().getFullYear());
  const [hiddenYears, setHiddenYears]                 = useState([]);
  const [hiddenMetrics, setHiddenMetrics]             = useState([]);
  const [availableYears, setAvailableYears]           = useState([]);

  // ── Efectos ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, settlementsRes] = await Promise.all([
        supabase.from('monthly_reports').select('*').order('year').order('month'),
        supabase.from('supplier_settlements').select('*'),
      ]);

      if (reportsRes.error)     throw reportsRes.error;
      if (settlementsRes.error) throw settlementsRes.error;

      const reports     = reportsRes.data     || [];
      const settlements = settlementsRes.data  || [];

      // Años dinámicos desde ambas fuentes + año actual
      const yearsInData = [...new Set([
        ...reports.map(r => r.year),
        ...settlements.map(s => s.year),
      ])];
      const currentYear = new Date().getFullYear();
      if (!yearsInData.includes(currentYear)) yearsInData.push(currentYear);

      setAvailableYears(yearsInData.sort((a, b) => b - a));
      setData(reports);
      setSettlementsData(settlements);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Transformaciones de datos ─────────────────────────────────────────────

  /** Genera cuadrícula [año][mes] con los valores de la métrica activa */
  const getGridData = (metric) => {
    const grid = {};
    availableYears.forEach(year => { grid[year] = Array(12).fill(0); });

    if (metric === 'carabao' || metric === 'ssi') {
      const target = metric === 'carabao' ? 'CARABAO' : 'SSI';
      settlementsData.forEach(item => {
        const sName = item.supplier_name?.toUpperCase() || '';
        if (sName === target && grid[item.year]) {
          grid[item.year][item.month - 1] += parseFloat(item.paid_amount) || 0;
        }
      });
    } else {
      data.forEach(item => {
        if (!grid[item.year]) return;
        let value = 0;
        if      (metric === 'facturado')  value = parseFloat(item.facturado)     || 0;
        else if (metric === 'total_crbt') value = parseFloat(item.partner_split) || 0;
        else if (metric === 'courses')    value = parseInt(item.total_courses)    || 0;
        grid[item.year][item.month - 1] = value;
      });
    }

    return grid;
  };

  /** Datos de un año para el modo Comparativa (todas las categorías) */
  const getYearlyComparisonData = (year) => {
    return MONTH_NAMES.map((name, i) => {
      const month  = i + 1;
      const report = data.find(r => r.year === year && r.month === month);
      const point  = {
        month,
        facturado: parseFloat(report?.facturado)     || 0,
        crbt:      parseFloat(report?.partner_split) || 0,
        ihasia:    (parseFloat(report?.partner_split) || 0) * 2,
        sueldos:   parseFloat(report?.sueldos_total)  || 0,
        carabao:   0,
        ssi:       0,
      };

      settlementsData.forEach(s => {
        if (s.year !== year || s.month !== month) return;
        const sName = s.supplier_name?.toUpperCase() || '';
        if (sName === 'CARABAO') point.carabao += parseFloat(s.paid_amount) || 0;
        if (sName === 'SSI')     point.ssi     += parseFloat(s.paid_amount) || 0;
      });

      return point;
    });
  };

  /** Datos formateados para Recharts */
  const getChartData = (metric) => {
    if (metric === 'comparativa') {
      return getYearlyComparisonData(selectedComparisonYear).map((d, i) => ({
        ...d,
        month: MONTH_NAMES[i],
      }));
    }

    const grid = getGridData(metric);
    return MONTH_NAMES.map((name, idx) => {
      const point = { month: name };
      availableYears.slice().sort().forEach(year => {
        const val = grid[year][idx];
        if (val > 0 || (year === new Date().getFullYear() && idx < new Date().getMonth())) {
          point[year] = val;
        }
      });
      return point;
    });
  };

  // ── Filtros de visibilidad ────────────────────────────────────────────────
  const toggleYear   = (year) => setHiddenYears(prev   => prev.includes(year)   ? prev.filter(y => y !== year)   : [...prev, year]);
  const toggleMetric = (m)    => setHiddenMetrics(prev  => prev.includes(m)     ? prev.filter(x => x !== m)      : [...prev, m]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    let csvContent = '';

    if (activeMetric === 'comparativa') {
      csvContent = `Categoría,${MONTH_NAMES.join(',')},Total Anual\n`;
      const compData   = getYearlyComparisonData(selectedComparisonYear);
      const categories = ['ihasia', 'carabao', 'sueldos', 'ssi', 'crbt', 'facturado'];
      categories.forEach(catId => {
        const label  = catId === 'crbt' ? 'CRBT' : catId === 'ihasia' ? 'IHASIA' : catId.toUpperCase();
        const values = compData.map(d => d[catId]);
        csvContent += `${label},${values.join(',')},${values.reduce((a, b) => a + b, 0)}\n`;
      });
    } else {
      const grid = getGridData(activeMetric);
      csvContent = `Año,${MONTH_NAMES.join(',')},Total Anual\n`;
      availableYears.forEach(year => {
        const row   = grid[year];
        const total = row.reduce((a, b) => a + b, 0);
        csvContent += `${year},${row.join(',')},${total}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Estadisticas_${getMetricLabel(activeMetric).replace(/ /g, '_')}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Valores derivados ─────────────────────────────────────────────────────
  const currentMetricGrid = getGridData(activeMetric);
  const chartData         = getChartData(activeMetric);
  const chartYears        = availableYears.slice().sort();

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Estado
    loading, activeMetric, setActiveMetric,
    availableYears, hiddenYears, hiddenMetrics,
    selectedComparisonYear, setSelectedComparisonYear,

    // Acciones
    toggleYear, toggleMetric, handleExportCSV,

    // Datos transformados
    currentMetricGrid, chartData, chartYears,

    // Funciones de transformación (necesarias en Table para modo comparativa)
    getYearlyComparisonData,
  };
}
