const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mowoxxyusicasgxouhxv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE4OTY5MiwiZXhwIjoyMDkxNzY1NjkyfQ.Hb2IY-sHo0o_sHCvoD-45lUdxTvqBKpcH3OiSf_0rfI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBalance() {
  console.log('--- Ajustando saldo de Abril 2026 ---');
  const key = 'partner_payout_CRBT_2026_4';
  
  // 1. Obtener registro actual
  const { data: current } = await supabase.from('settings').select('*').eq('key', key).single();
  
  const newValue = current?.value || {};
  newValue.prevMonthBalance = { CR: 1.5, BT: 0 };
  
  // 2. Upsert
  const { error } = await supabase.from('settings').upsert({ key, value: newValue });
  
  if (error) {
    console.error('Error al actualizar:', error);
  } else {
    console.log('¡Éxito! Carlos (CR) ahora tiene 1.5 días de saldo anterior en Abril 2026.');
  }

  // 3. Opcional: Limpiar Mayo si existe para forzar que recalcule
  const nextKey = 'partner_payout_CRBT_2026_5';
  await supabase.from('settings').delete().eq('key', nextKey);
  console.log('Se ha limpiado Mayo 2026 para que el nuevo saldo de Abril se arrastre correctamente.');
}

fixBalance();
