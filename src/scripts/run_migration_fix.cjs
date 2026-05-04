const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mowoxxyusicasgxouhxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE4OTY5MiwiZXhwIjoyMDkxNzY1NjkyfQ.Hb2IY-sHo0o_sHCvoD-45lUdxTvqBKpcH3OiSf_0rfI';

const supabase = createClient(supabaseUrl, supabaseKey);

const facturado = {
  2026: { 1: 853700, 2: 1058900, 3: 870550 },
  2025: { 1: 784984, 2: 626945, 3: 659950, 4: 635070, 5: 492190, 6: 598892, 7: 1783175, 8: 1739359, 9: 1423510, 10: 865264, 11: 724951, 12: 992217 },
  2024: { 1: 689790, 2: 700670, 3: 863210, 4: 620595, 5: 437767, 6: 614740, 7: 1329885, 8: 2121265, 9: 1310760, 10: 717380, 11: 931880, 12: 541540 },
  2023: { 1: 556140, 2: 792685, 3: 1161035, 4: 694700, 5: 493650, 6: 715575, 7: 982570, 8: 1620935, 9: 836950, 10: 582240, 11: 844800, 12: 758250 },
  2022: { 1: 94100, 2: 215200, 3: 322300, 4: 341400, 5: 258320, 6: 431950, 7: 853600, 8: 1894598, 9: 1208300, 10: 679800, 11: 592450, 12: 696670 }
};

const ssi = {
  2026: { 1: 82601, 2: 94669, 3: 107300 },
  2025: { 1: 68756, 2: 65276, 3: 62496, 4: 53496, 5: 48213, 6: 51898, 7: 201941, 8: 148808, 9: 129058, 10: 121274, 11: 85671, 12: 107786 },
  2024: { 1: 76072, 2: 72231, 3: 73840, 4: 59343, 5: 35744, 6: 49900, 7: 102345, 8: 155484, 9: 123274, 10: 62962, 11: 82934, 12: 67520 },
  2023: { 1: 55047, 2: 62643, 3: 136354, 4: 53654, 5: 36218, 6: 86878, 7: 78640, 8: 111114, 9: 59006, 10: 44562, 11: 76603, 12: 67725 },
  2022: { 1: 6650, 2: 28000, 3: 41000, 4: 21850, 5: 33100, 6: 46400, 7: 80380, 8: 125400, 9: 83600, 10: 49820, 11: 45700, 12: 54250 }
};

async function run() {
  console.log('Cleaning up monthly_reports and inserting only Facturado...');

  const monthlyInserts = [];
  for (const year in facturado) {
    for (const month in facturado[year]) {
      const factVal = facturado[year][month];
      const ssi_est = ssi[year] && ssi[year][month] ? ssi[year][month] : 0;

      monthlyInserts.push({ 
        year: Number(year), 
        month: Number(month), 
        facturado: factVal, 
        total_gastos: 0, 
        ssi_estimated: ssi_est 
      });
    }
  }

  console.log(`Upserting ${monthlyInserts.length} records...`);
  const { error } = await supabase.from('monthly_reports').upsert(monthlyInserts, { onConflict: 'year, month' });
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Cleanup and Facturado re-insert complete!');
  }
}

run().catch(console.error);
