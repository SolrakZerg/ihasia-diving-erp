import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mowoxxyusicasgxouhxv.supabase.co';
// Usamos la Service Role Key que estaba en el .env (esta se salta el RLS)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE4OTY5MiwiZXhwIjoyMDkxNzY1NjkyfQ.Hb2IY-sHo0o_sHCvoD-45lUdxTvqBKpcH3OiSf_0rfI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase
    .from('activities')
    .select('id, acronym, name')
    .order('name');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
