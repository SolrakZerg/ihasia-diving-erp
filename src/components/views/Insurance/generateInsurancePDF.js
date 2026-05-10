import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInsurancePDF = (customers, contractTitle, paxBalance, durationDays) => {
  const doc = new jsPDF({ orientation: 'portrait' });
  
  // Construir Cabecera Moderna
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204);
  doc.text('Ihasia Diving Koh Tao', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text(contractTitle || 'Daily Insurance Report', 14, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${new Date().toLocaleDateString('es-ES')}`, 14, 40);

  // 2. CONSTRUIR TABLA
  const tableHead = [
    ["#", "Name", "Surname", "Gen.", "Passport", "Start", "End"]
  ];
  const tableRows = [];
  let currentPaxTracker = paxBalance;

  // Datos de Clientes (Solo los que hay)
  for (let i = 0; i < customers.length; i++) {
    const d = customers[i];
    
    const startObj = new Date();
    const startStr = startObj.toLocaleDateString('es-ES');
    
    const endObj = new Date();
    endObj.setDate(endObj.getDate() + (durationDays - 1));
    const endStr = endObj.toLocaleDateString('es-ES');

    tableRows.push([
      String(currentPaxTracker),
      (d.first_name || '').trim(),
      (d.last_name || '').trim(),
      d.gender?.[0]?.toUpperCase() || 'M',
      d.passport_number || 'S/P',
      startStr,
      endStr
    ]);
    currentPaxTracker--;
  }

  // Fila de Total final incrustada
  tableRows.push([
    "",
    "TOTAL:",
    String(customers.length) + " PAX",
    "",
    "",
    "",
    ""
  ]);

  autoTable(doc, {
    startY: 48,
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], halign: 'center' },
    styles: { fontSize: 10, cellPadding: 2, textColor: [50, 50, 50] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 42 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 28 },
      5: { halign: 'center', cellWidth: 23 },
      6: { halign: 'center', cellWidth: 23 }
    },
    didParseCell: function(data) {
      // Destacar un poco la fila de TOTAL al final
      if (data.row.index === customers.length && data.section === 'body') {
        data.cell.styles.fillColor = [240, 245, 250];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [0, 102, 204];
        if (data.column.index === 1) data.cell.styles.halign = 'right';
      }
    }
  });

  return doc.output('blob');
};
