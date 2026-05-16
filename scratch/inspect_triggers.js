import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mowoxxyusicasgxouhxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE4OTY5MiwiZXhwIjoyMDkxNzY1NjkyfQ.Hb2IY-sHo0o_sHCvoD-45lUdxTvqBKpcH3OiSf_0rfI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying triggers...');
  const { data, error } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name, event_object_table, action_statement');

  if (error) {
    console.error('Error querying triggers:', error);
  } else {
    console.log('Triggers found:', data);
  }
}

run();
