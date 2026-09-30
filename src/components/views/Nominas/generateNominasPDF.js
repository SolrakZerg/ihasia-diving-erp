import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES_ESPANOL = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const ACTIVITY_NAMES = {
  FD: 'Fun Dive',
  SR1: 'Refresh (1 buceo)',
  SR2: 'Refresh (2 buceos)',
  DSD1: 'Bautizo (1 buceo)',
  DSD2: 'Bautizo (2 buceos)',
  SD: 'Scuba Diver',
  OW: 'Open Water',
  AOW: 'Avanzado',
  'S&R': 'Rescue',
  CAN: 'Cancelación'
};

function renderInstructorToDoc(doc, payrollData, isFirstPage = true) {
  const {
    selectedMember,
    month,
    year,
    matrixData,
    fixedColumns,
    dynamicActivities,
    assists = {},
    manualAdj = {},
    advances = [],
    totalComm = 0,
    totalAssists = 0,
    totalAdj = 0,
    finalBalance = 0,
    commissionsList = [],
    totalAgentCommissions = 0,
    totalAgentCommissionsPaid = 0,
    totalAgentCommissionsPending = 0
  } = payrollData;

  if (!isFirstPage) {
    doc.addPage();
  }

  const instructorName = selectedMember 
    ? `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim()
    : 'Instructor';
  const monthName = MESES_ESPANOL[(month - 1) % 12] || '';
  const periodStr = `${monthName} ${year}`;

  // Header - Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 128, 128); // Teal
  doc.text('IHASIA', 14, 20);

  const ihasiaWidth = doc.getTextWidth('IHASIA');
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(' Koh Tao', 14 + ihasiaWidth, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('RESUMEN DE PAGOS Y ACTIVIDADES', 14, 26);

  // Meta (Right side)
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('INSTRUCTOR:', 196, 17, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(instructorName, 196, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('PERIODO:', 196, 28, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 128, 128);
  doc.text(periodStr, 196, 33, { align: 'right' });

  // Line separator under header
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.5);
  doc.line(14, 37, 196, 37);

  // Prepare table data
  const daysInMonth = new Date(year, month, 0).getDate();
  const tableRows = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayData = matrixData[d] || { items: {}, colTotals: {}, total: 0 };
    const assistCount = assists[d] || 0;
    const adj = manualAdj[d] || null;

    const commTotal = dayData.total || 0;
    const assistTotal = assistCount * 2000;
    const adjTotal = adj ? (adj.amount || 0) : 0;
    const dayTotal = commTotal + assistTotal + adjTotal;

    const hasItems = Object.values(dayData.items || {}).some(q => q > 0);
    const hasAssists = assistCount > 0;
    const hasAdj = adj && (adj.amount !== 0 || (adj.concept && adj.concept.trim() !== ''));

    if (!hasItems && !hasAssists && !hasAdj && dayTotal === 0) {
      continue;
    }

    const activityLines = [];

    // Fixed activities
    (fixedColumns || []).forEach(col => {
      const qty = dayData.items[col.key] || 0;
      if (qty > 0) {
        const name = ACTIVITY_NAMES[col.key] || col.label || col.key;
        activityLines.push(`• ${name} (x${qty})`);
      }
    });

    // Dynamic activities
    (dynamicActivities || []).forEach(act => {
      const colKey = `dyn_${act.id}`;
      const qty = dayData.items[colKey] || 0;
      if (qty > 0) {
        const name = act.acronym || act.name || 'Actividad';
        activityLines.push(`• ${name} (x${qty})`);
      }
    });

    // Assists
    if (hasAssists) {
      activityLines.push(`• Asistencia (x${assistCount})`);
    }

    // Adjustments / Extras
    if (hasAdj) {
      const amtStr = adj.amount > 0 ? `+${adj.amount.toLocaleString('es-ES')}` : `${adj.amount.toLocaleString('es-ES')}`;
      const conceptStr = adj.concept ? ` — ${adj.concept}` : '';
      activityLines.push(`• Extra (${amtStr})${conceptStr}`);
    }

    tableRows.push([
      String(d),
      activityLines.join('\n'),
      dayTotal.toLocaleString('es-ES')
    ]);
  }

  if (tableRows.length === 0) {
    tableRows.push(['-', 'No hay actividad registrada en este periodo.', '0']);
  }

  // Draw Table
  autoTable(doc, {
    startY: 40,
    head: [['Día', 'Actividades / Descripción', 'Total (THB)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 9.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'normal' },
      2: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [40, 40, 40],
      lineColor: [220, 225, 230],
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Footer / Summary section
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 180;

  // If table is close to page bottom, add a new page
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }

  const totalGenerated = totalComm + totalAssists + totalAdj;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(14, finalY, 196, finalY);

  finalY += 6;

  // Row: Total Generado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GENERADO (MES)', 14, finalY);
  doc.text(`${totalGenerated.toLocaleString('es-ES')} THB`, 196, finalY, { align: 'right' });

  finalY += 6;

  // Advances breakdown if any
  if (advances && advances.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(231, 76, 60); // Red

    advances.forEach(adv => {
      const advConcept = adv.concept && adv.concept.trim() !== '' ? adv.concept.trim() : 'Adelanto parcial';
      const advDateStr = adv.date ? ` (${new Date(adv.date).toLocaleDateString('es-ES')})` : '';
      
      doc.text(`- ${advConcept}${advDateStr}`, 20, finalY);
      doc.text(`- ${(adv.amount || 0).toLocaleString('es-ES')} THB`, 196, finalY, { align: 'right' });
      finalY += 5;
    });

    finalY += 2;
    doc.setDrawColor(200, 205, 210);
    doc.setLineWidth(0.3);
    doc.line(14, finalY, 196, finalY);
    finalY += 6;

    // Row: Pendiente de recibir
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 128); // Teal
    doc.text('PENDIENTE DE RECIBIR', 14, finalY);
    doc.text(`${finalBalance.toLocaleString('es-ES')} THB`, 196, finalY, { align: 'right' });
  } else {
    // Row: Total a recibir
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 128); // Teal
    doc.text('TOTAL A RECIBIR', 14, finalY);
    doc.text(`${finalBalance.toLocaleString('es-ES')} THB`, 196, finalY, { align: 'right' });
  }

  // -------------------------------------------------------------
  // PAGE 2: ANEXO DE COMISIONES POR VENTA (Solo si existen)
  // -------------------------------------------------------------
  if (commissionsList && commissionsList.length > 0) {
    doc.addPage();

    // Header - Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 128, 128); // Teal
    doc.text('IHASIA', 14, 20);

    const ihasiaWidthComm = doc.getTextWidth('IHASIA');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(' Koh Tao', 14 + ihasiaWidthComm, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('ANEXO: COMISIONES POR VENTA', 14, 26);

    // Meta (Right side)
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('INSTRUCTOR:', 196, 17, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(instructorName, 196, 22, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('PERIODO:', 196, 28, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 128, 128);
    doc.text(periodStr, 196, 33, { align: 'right' });

    // Line separator under header
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.5);
    doc.line(14, 37, 196, 37);

    // Prepare commissions table rows
    const commRows = commissionsList.map(c => {
      const day = c.date ? c.date.split('-')[2] : '-';
      const statusText = c.isPaid ? 'Pagado' : 'Pendiente';
      return [
        day,
        c.customerName || '—',
        c.activityName || '—',
        `${c.amount.toLocaleString('es-ES')} THB`,
        statusText
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['Día', 'Cliente', 'Actividad', 'Comisión (THB)', 'Estado']],
      body: commRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // Slate 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 9.5
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        1: { cellWidth: 55, fontStyle: 'normal' },
        2: { cellWidth: 'auto', fontStyle: 'normal' },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
        4: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [40, 40, 40],
        lineColor: [220, 225, 230],
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'Pagado') {
            data.cell.styles.textColor = [16, 149, 106]; // Emerald
          } else {
            data.cell.styles.textColor = [217, 119, 6]; // Amber
          }
        }
      }
    });

    let commFinalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 180;
    if (commFinalY > 220) {
      doc.addPage();
      commFinalY = 20;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(14, commFinalY, 196, commFinalY);
    commFinalY += 6;

    // 1. Resumen de comisiones (estilo página 1)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL COMISIONES GENERADAS (MES)', 14, commFinalY);
    doc.text(`${totalAgentCommissions.toLocaleString()} THB`, 196, commFinalY, { align: 'right' });
    commFinalY += 5;

    if (totalAgentCommissionsPaid > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(231, 76, 60); // Rojo idéntico a la página 1
      doc.text('- Comisiones ya pagadas / liquidadas', 20, commFinalY);
      doc.text(`- ${totalAgentCommissionsPaid.toLocaleString()} THB`, 196, commFinalY, { align: 'right' });
      commFinalY += 5;

      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.3);
      doc.line(14, commFinalY, 196, commFinalY);
      commFinalY += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 128, 128); // Teal
      doc.text('COMISIONES PENDIENTES DE RECIBIR', 14, commFinalY);
      doc.text(`${totalAgentCommissionsPending.toLocaleString()} THB`, 196, commFinalY, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 128, 128); // Teal
      doc.text('COMISIONES A RECIBIR', 14, commFinalY);
      doc.text(`${totalAgentCommissionsPending.toLocaleString()} THB`, 196, commFinalY, { align: 'right' });
    }

    // Gran separación visual limpia (sin líneas, amplio espacio en blanco)
    let boxY = Math.max(commFinalY + 35, 226);

    // Si la tabla de comisiones ocupó gran parte de la página y no cabe abajo
    if (commFinalY + 45 > 280) {
      doc.addPage();
      boxY = 226;
    }

    const boxX = 14;
    const boxW = 182;
    const boxH = 37;

    // Tarjeta destacada con fondo diferenciado y bordes redondeados
    doc.setFillColor(243, 246, 250); // Fondo suave tipo tarjeta
    doc.setDrawColor(185, 198, 212); // Borde distinguible más nítido
    doc.setLineWidth(0.7);
    doc.roundedRect(boxX, boxY, boxW, boxH, 3.5, 3.5, 'FD');

    // Título de la tarjeta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.text('RESUMEN CONSOLIDADO DEL MES (SUELDO + COMISIONES)', boxX + 8, boxY + 7.5);

    // Fila 1: Sueldo de actividades
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('• Sueldo generado por cursos y actividades:', boxX + 8, boxY + 14.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalGenerated.toLocaleString()} THB`, boxX + boxW - 8, boxY + 14.5, { align: 'right' });

    // Fila 2: Comisiones de venta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('• Comisiones generadas por venta de clientes:', boxX + 8, boxY + 21);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalAgentCommissions.toLocaleString()} THB`, boxX + boxW - 8, boxY + 21, { align: 'right' });

    // Línea separadora interna en la tarjeta
    doc.setDrawColor(215, 224, 233);
    doc.setLineWidth(0.3);
    doc.line(boxX + 8, boxY + 25.5, boxX + boxW - 8, boxY + 25.5);

    // Fila Total Global Destacada
    const grandTotal = totalGenerated + totalAgentCommissions;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 128); // Teal
    doc.text('TOTAL GLOBAL GENERADO:', boxX + 8, boxY + 32);
    doc.setFontSize(12);
    doc.text(`${grandTotal.toLocaleString()} THB`, boxX + boxW - 8, boxY + 32, { align: 'right' });
  }
}

export function buildInstructorPDFDoc(payrollData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderInstructorToDoc(doc, payrollData, true);
  return doc;
}

export function downloadInstructorPDF(payrollData) {
  const doc = buildInstructorPDFDoc(payrollData);
  const name = payrollData.selectedMember 
    ? `${payrollData.selectedMember.first_name || ''}_${payrollData.selectedMember.last_name || ''}`.trim().replace(/\s+/g, '_')
    : 'Instructor';
  const monthName = MESES_ESPANOL[(payrollData.month - 1) % 12] || '';
  const filename = `Informe_mensual_${name}_${monthName}_${payrollData.year}.pdf`;
  doc.save(filename);
}

export function previewInstructorPDF(payrollData) {
  const doc = buildInstructorPDFDoc(payrollData);
  const string = doc.output('bloburl');
  window.open(string, '_blank');
}

export function downloadAllInstructorsPDF(allPayrollData, month, year) {
  if (!allPayrollData || allPayrollData.length === 0) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  allPayrollData.forEach((payrollData, index) => {
    renderInstructorToDoc(doc, payrollData, index === 0);
  });

  const monthName = MESES_ESPANOL[(month - 1) % 12] || '';
  const filename = `Informes_mensuales_Staff_${monthName}_${year}.pdf`;
  doc.save(filename);
}

export function previewAllInstructorsPDF(allPayrollData) {
  if (!allPayrollData || allPayrollData.length === 0) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  allPayrollData.forEach((payrollData, index) => {
    renderInstructorToDoc(doc, payrollData, index === 0);
  });

  const string = doc.output('bloburl');
  window.open(string, '_blank');
}

export function downloadIndividualPDFs(allPayrollData) {
  if (!allPayrollData || allPayrollData.length === 0) return;
  allPayrollData.forEach((payrollData, index) => {
    setTimeout(() => {
      downloadInstructorPDF(payrollData);
    }, index * 250);
  });
}
