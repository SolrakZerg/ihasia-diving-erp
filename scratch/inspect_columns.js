import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mowoxxyusicasgxouhxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE4OTY5MiwiZXhwIjoyMDkxNzY1NjkyfQ.Hb2IY-sHo0o_sHCvoD-45lUdxTvqBKpcH3OiSf_0rfI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching one row from insurance_batches...');
  const { data: batchData, error: batchError } = await supabase
    .from('insurance_batches')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (batchError) {
    console.error('Error fetching insurance_batches:', batchError);
  } else if (batchData) {
    console.log('Columns in insurance_batches:', Object.keys(batchData));
  } else {
    console.log('No rows in insurance_batches');
  }

  console.log('Fetching one row from customers...');
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (customerError) {
    console.error('Error fetching customers:', customerError);
  } else if (customerData) {
    console.log('Columns in customers:', Object.keys(customerData));
  } else {
    console.log('No rows in customers');
  }
}

run();
