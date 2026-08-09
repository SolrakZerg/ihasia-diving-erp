import { widgetCuentasIngresosManual } from './dashboard/widgetCuentasIngresosManual';
import { widgetGastosStaffManual } from './dashboard/widgetGastosStaffManual';
import { widgetCursosStaffManual } from './dashboard/widgetCursosStaffManual';
import { widgetCrbtSociosManual } from './dashboard/widgetCrbtSociosManual';

import { resumenManual } from './facturacion/resumenManual';
import { facturasGruposManual } from './facturacion/facturasGruposManual';
import { cajaCobrosManual } from './facturacion/cajaCobrosManual';
import { bizumsAlertasManual } from './facturacion/bizumsAlertasManual';

import { nominasManual } from './nominas/nominasManual';

import { gastosGeneralesManual } from './gastos/gastosGeneralesManual';
import { comisionesManual } from './gastos/comisionesManual';
import { oxigenoManual } from './gastos/oxigenoManual';

import { ssiManual } from './ssi/ssiManual';
import { clientesManual } from './clientes/clientesManual';

import { bizumManual } from './depositos/bizumManual';
import { wiseManual } from './depositos/wiseManual';

import { segurosManual } from './seguros/segurosManual';

import { resumenActividadesManual } from './carabao/resumenActividadesManual';
import { facturaCarabaoManual } from './carabao/facturaCarabaoManual';

import { matrizLiquidacionManual } from './crbt/matrizLiquidacionManual';
import { liquidacionSociosManual } from './crbt/liquidacionSociosManual';

import { catalogoManual } from './configuracion/catalogoManual';
import { tarifasManual } from './configuracion/tarifasManual';
import { personalManual } from './configuracion/personalManual';
import { boteManual } from './configuracion/boteManual';

export const manualSections = [
  {
    id: 'dashboard',
    title: 'Panel Principal (Dashboard)',
    subtitle: 'Explicación detallada de cada widget: Cuentas, Ingresos, Cursos, Gastos, Staff y CRBT.',
    icon: 'BarChart3',
    badge: 'Inicio',
    children: [
      widgetCuentasIngresosManual,
      widgetGastosStaffManual,
      widgetCursosStaffManual,
      widgetCrbtSociosManual,
    ]
  },
  {
    id: 'facturacion',
    title: 'Facturación y Cobros',
    subtitle: 'Gestión de facturas, clientes, grupos, caja, Bizums y alertas operativas.',
    icon: 'Rows3',
    badge: 'Operativa',
    children: [
      resumenManual,
      facturasGruposManual,
      cajaCobrosManual,
      bizumsAlertasManual,
    ]
  },
  nominasManual,
  {
    id: 'gastos',
    title: 'Gastos y Comisiones',
    subtitle: 'Gastos diarios, comisiones de captación y tours de snorkeling (Oxygen).',
    icon: 'DollarSign',
    badge: 'Finanzas',
    children: [
      gastosGeneralesManual,
      comisionesManual,
      oxigenoManual,
    ]
  },
  ssiManual,
  clientesManual,
  {
    id: 'depositos',
    title: 'Depósitos y Anticipos',
    subtitle: 'Control de señas por Bizum y transferencias internacionales por Wise.',
    icon: 'CreditCard',
    badge: 'Tesorería',
    children: [
      bizumManual,
      wiseManual,
    ]
  },
  segurosManual,
  {
    id: 'carabao',
    title: 'Carabao',
    subtitle: 'Resumen de consumo de botellas por actividad y factura oficial de embarcación.',
    icon: 'CarabaoIcon',
    badge: 'Operaciones',
    children: [
      resumenActividadesManual,
      facturaCarabaoManual,
    ]
  },
  {
    id: 'crbt',
    title: 'CRBT (Gestión de Socios)',
    subtitle: 'Matriz de cursos de socios, diario de turnos, adelantos y reparto de beneficios.',
    icon: 'UsersRound',
    badge: 'Dirección',
    children: [
      matrizLiquidacionManual,
      liquidacionSociosManual,
    ]
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    subtitle: 'Catálogo de actividades, tarifas staff, personal y gestión del bote.',
    icon: 'SettingsIcon',
    badge: 'Módulo Base',
    children: [
      catalogoManual,
      tarifasManual,
      personalManual,
      boteManual,
    ]
  },
];
