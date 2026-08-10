import { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  FileJson, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  HardDrive, 
  Users, 
  Receipt, 
  ShieldCheck,
  CloudUpload,
  GitBranch
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { APP_VERSION } from '../../../../version';

const ALL_TABLES = [
  'customers',
  'invoices',
  'invoice_items',
  'bizums',
  'wise_payments',
  'staff',
  'staff_settlements',
  'staff_advances',
  'staff_daily_activity',
  'staff_adjustments',
  'partner_settlements',
  'partner_advances',
  'partner_daily_activity',
  'partner_adjustments',
  'partner_cash_payments',
  'partner_daily_log',
  'bote_monthly',
  'bote_expenses',
  'monthly_expenses',
  'monthly_reports',
  'daily_expenses',
  'fixed_expenses',
  'supplier_settlements',
  'ssi_monthly_breakdown',
  'activities',
  'activity_categories',
  'activity_logs',
  'monthly_activity_logs',
  'insurance_batches',
  'insurance_batch_items',
  'insurance_config',
  'business_entities',
  'cash_control_monthly',
  'attendance',
  'exchange_rates',
  'expense_categories',
  'external_promoters',
  'instructor_payouts',
  'ui_config'
];

export default function Backups_View() {
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentExportTable, setCurrentExportTable] = useState('');
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [githubSyncDate, setGithubSyncDate] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [metrics, setMetrics] = useState({
    customers: 0,
    invoices: 0,
    bizums: 0,
    totalRows: 0
  });

  useEffect(() => {
    fetchMetrics();
    const storedDate = localStorage.getItem('ihasia_last_data_backup_date');
    if (storedDate) {
      setLastBackupDate(new Date(storedDate));
    }
    const storedGithubDate = localStorage.getItem('ihasia_last_github_sync_date');
    if (storedGithubDate) {
      setGithubSyncDate(new Date(storedGithubDate));
    }
  }, []);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setErrorMessage('');
    try {
      const [custRes, invRes, bizRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('bizums').select('id', { count: 'exact', head: true })
      ]);

      const custCount = custRes.count || 0;
      const invCount = invRes.count || 0;
      const bizCount = bizRes.count || 0;

      setMetrics({
        customers: custCount,
        invoices: invCount,
        bizums: bizCount,
        totalRows: custCount + invCount + bizCount
      });
    } catch (err) {
      console.error('Error fetching database metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchAllRowsForTable = async (tableName) => {
    let allRows = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error(`Error descargando tabla ${tableName}:`, error);
        throw error;
      }
      if (data && data.length > 0) {
        allRows = allRows.concat(data);
      }
      if (!data || data.length < pageSize) {
        break;
      }
      page++;
    }
    return allRows;
  };

  const generateFullBackupPayload = async () => {
    const fullData = {};
    let totalRowsExported = 0;

    for (let i = 0; i < ALL_TABLES.length; i++) {
      const table = ALL_TABLES[i];
      setCurrentExportTable(table);
      const rows = await fetchAllRowsForTable(table);
      fullData[table] = rows;
      totalRowsExported += rows.length;
      setExportProgress(Math.round(((i + 1) / ALL_TABLES.length) * 100));
    }

    return {
      payload: {
        metadata: {
          project: 'IHASIA Diving ERP',
          version: APP_VERSION,
          export_date: new Date().toISOString(),
          total_tables: ALL_TABLES.length,
          total_rows: totalRowsExported
        },
        tables: fullData
      },
      totalRowsExported
    };
  };

  const handleExportData = async (format = 'json', syncToGithub = true) => {
    setIsExporting(true);
    setExportProgress(0);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { payload, totalRowsExported } = await generateFullBackupPayload();
      const todayStr = new Date().toISOString().split('T')[0];
      const jsonPayloadString = JSON.stringify(payload, null, 2);

      if (format === 'json') {
        const jsonBlob = new Blob([jsonPayloadString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(jsonBlob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', url);
        downloadAnchor.setAttribute('download', `ihasia_erp_data_backup_${todayStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      } else if (format === 'sql') {
        let sqlContent = `-- IHASIA ERP DATA BACKUP SNAPSHOT\n-- Date: ${new Date().toISOString()}\n-- App Version: ${APP_VERSION}\n-- Total Tables: ${ALL_TABLES.length}\n-- Total Rows: ${totalRowsExported}\n\n`;

        for (const [table, rows] of Object.entries(payload.tables)) {
          if (rows.length === 0) continue;
          sqlContent += `-- Table: public.${table} (${rows.length} rows)\n`;
          rows.forEach((row) => {
            const keys = Object.keys(row);
            const values = Object.values(row).map((val) => {
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number' || typeof val === 'boolean') return val;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            sqlContent += `INSERT INTO public.${table} (${keys.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
          });
          sqlContent += '\n';
        }

        const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', url);
        downloadAnchor.setAttribute('download', `ihasia_erp_data_backup_${todayStr}.sql`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      }

      const now = new Date();
      setLastBackupDate(now);
      localStorage.setItem('ihasia_last_data_backup_date', now.toISOString());

      let extraMsg = '';
      if (syncToGithub) {
        setCurrentExportTable('Servidor Supabase Vault -> GitHub API...');
        const { data: ghRes, error: ghErr } = await supabase.rpc('generate_and_push_github_backup');

        if (ghErr) {
          console.error('Error al sincronizar con GitHub:', ghErr);
          extraMsg = ` (Aviso: ${ghErr.message || 'Error de conexión con GitHub'})`;
        } else if (ghRes && ghRes.success) {
          setGithubSyncDate(now);
          localStorage.setItem('ihasia_last_github_sync_date', now.toISOString());
          extraMsg = ` ☁️ ¡Respaldo sincronizado automáticamente en tu repositorio privado de GitHub! (Commit: ${ghRes.commit ? ghRes.commit.substring(0, 7) : 'OK'})`;
        } else if (ghRes && !ghRes.success) {
          extraMsg = ` (Aviso GitHub API: ${ghRes.error || 'Error en respuesta de GitHub'})`;
        }
      }

      setSuccessMessage(`¡Copia completada! Se respaldaron ${totalRowsExported.toLocaleString()} filas de las 39 tablas.${extraMsg}`);
    } catch (err) {
      console.error('Error durante la exportación:', err);
      setErrorMessage(`Error al generar la copia de seguridad: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsExporting(false);
      setCurrentExportTable('');
    }
  };

  const daysSinceBackup = lastBackupDate
    ? Math.floor((new Date() - lastBackupDate) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fadeIn">
      {/* Header Info Banner */}
      <div className="bg-surface-soft/40 backdrop-blur-xl border border-surface-edge p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand/20 border border-brand/40 rounded-xl text-brand-light">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Gestión de Copias de Seguridad de Datos Reales
              <span className="text-xs bg-brand/20 border border-brand/40 text-brand-light px-2 py-0.5 rounded-full font-mono font-semibold">
                v{APP_VERSION}
              </span>
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Descarga local y sincronización automática cifrada con tu repositorio privado de GitHub.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loadingMetrics || isExporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-edge/30 hover:bg-surface-edge/60 border border-surface-edge text-sm font-semibold text-text-light hover:text-white rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'animate-spin text-brand-light' : ''}`} />
          Actualizar Estadísticas
        </button>
      </div>

      {/* Metric Cards - Panel de Salud */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-surface-soft/30 border border-surface-edge p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Clientes Registrados</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {loadingMetrics ? '...' : metrics.customers.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-surface-soft/30 border border-surface-edge p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Facturas Emitidas</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {loadingMetrics ? '...' : metrics.invoices.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-surface-soft/30 border border-surface-edge p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Depósitos Bizum</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {loadingMetrics ? '...' : metrics.bizums.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-surface-soft/30 border border-surface-edge p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Tablas Respaldadas</p>
            <p className="text-2xl font-black text-white mt-0.5">39 Tablas</p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-medium animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Exporting Progress Bar */}
      {isExporting && (
        <div className="bg-brand/10 border border-brand/30 p-6 rounded-2xl space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-brand-light flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Procesando: <code className="bg-brand/20 px-2 py-0.5 rounded text-white font-mono">{currentExportTable}</code>
            </span>
            <span className="font-bold text-white">{exportProgress}%</span>
          </div>
          <div className="w-full bg-surface-edge rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-brand to-brand-light h-full rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JSON Export + Auto GitHub Cloud Sync Card */}
        <div className="bg-surface-soft/20 border border-surface-edge p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-brand/40 transition-all relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            Auto-Sync GitHub
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand/10 text-brand-light rounded-xl border border-brand/30">
                <CloudUpload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Respaldo Completo (.JSON + GitHub)</h3>
                <p className="text-xs text-text-muted">Descarga en tu equipo y subida automática cifrada a GitHub.</p>
              </div>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Descarga el JSON en tu ordenador y simultáneamente ejecuta la función segura de Supabase Vault para actualizar <code>database/data_backups/backup_latest.json</code> en tu repositorio privado.
            </p>
          </div>

          <button
            onClick={() => handleExportData('json', true)}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-brand hover:bg-brand-light text-white font-bold rounded-xl transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            <CloudUpload className="w-5 h-5" />
            Descargar y Sincronizar en GitHub
          </button>
        </div>

        {/* SQL Export Card */}
        <div className="bg-surface-soft/20 border border-surface-edge p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-purple-500/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/30">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Respaldo Formato SQL (INSERTs)</h3>
                <p className="text-xs text-text-muted">Sentencias SQL de inserción directa para PostgreSQL.</p>
              </div>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Genera un archivo de script SQL con sentencias <code>INSERT INTO ... ON CONFLICT DO NOTHING</code> ejecutable en el editor SQL de Supabase para restauración parcial o total.
            </p>
          </div>

          <button
            onClick={() => handleExportData('sql', false)}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Descargar Script Datos (.SQL)
          </button>
        </div>
      </div>

      {/* Backup Frequency & History Advice Banner */}
      <div className="bg-surface-soft/20 border border-surface-edge p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 mt-1 md:mt-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Estado del Respaldo Nube en GitHub</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              • <strong>Sincronización segura:</strong> Supabase Vault (Token cifrado AES-256 no visible en navegador).<br />
              • <strong>Histórico de commits:</strong> Todos los cambios pasados se guardan de forma acumulativa e indestructible.
            </p>
          </div>
        </div>

        <div className="bg-surface-soft/40 border border-surface-edge px-4 py-3 rounded-xl text-right flex-shrink-0 w-full md:w-auto">
          <p className="text-xs text-text-muted font-medium">Última sincronización en GitHub:</p>
          <p className="text-sm font-bold text-white mt-0.5">
            {githubSyncDate
              ? `${githubSyncDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} (${githubSyncDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`
              : 'No registrada aún en este navegador'}
          </p>
          {daysSinceBackup !== null && (
            <p className={`text-xs mt-1 font-semibold ${daysSinceBackup > 14 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {daysSinceBackup === 0 ? '¡Sincronizado hoy!' : `Hace ${daysSinceBackup} día(s)`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
