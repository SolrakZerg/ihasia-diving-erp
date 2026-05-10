const url = 'https://mowoxxyusicasgxouhxv.supabase.co/rest/v1/customers?first_name=ilike.*Ruben*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE4OTY5MiwiZXhwIjoyMDkxNzY1NjkyfQ.Hb2IY-sHo0o_sHCvoD-45lUdxTvqBKpcH3OiSf_0rfI';

fetch(url, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }
})
.then(async r => {
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { error: 'Not JSON', text };
  }
})
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(e => console.error(e));
