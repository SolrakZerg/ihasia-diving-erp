import csv
import json
import uuid
import re
import io
import os

# Updated STAFF_MAP from DB query
STAFF_MAP = {
    "MP": "8bcd7519-9713-40e9-b313-3c3c6f5513b6",
    "DRH": "84aa04fe-6204-4743-8617-7918032a149a",
    "CBH": "5dce02e6-b155-4f36-b2eb-737767996983",
    "F3": "18739be1-4d9c-4200-ae77-9201b23b49b2",
    "ILL": "1483760a-a4da-430b-9573-fcefc484537b",
    "JP": "fe025f75-8cf0-48e9-8490-0aff83d2938e",
    "AND": "9d90938a-6d95-405a-8787-f6f2bec04e21",
    "CR": "47ad3626-e74b-4b9b-bb56-4d50961e2711",
    "XAV": "0c009b8e-4aff-4629-9ee8-d63acaaf10b5",
    "HUG": "4790ef06-e50e-4f26-98f4-d2151aad593a",
    "BT": "5d25291d-d1ca-4232-808b-5adbb5f6cb19",
    "MIG": "9447eb97-0c1d-47a8-909f-24667999f2f9",
    "DAV": "d67c2e65-a5de-4f0e-8955-af803094e4ab",
    "ALB": "ee0ae42d-3afb-47cd-acc4-70ea92f89aa1",
    "MARIA": "ae8dbe47-0788-459e-935e-a6145b8db0bf",
    "CRI": "fe946e7c-daf9-421e-9f2b-8e4a3daa8658",
    "FREE": "fe2ad507-bfd8-4e96-8815-b6789329aacc",
    "SAL": "6013159c-c2af-4974-b105-4f32328577f7"
}

# Updated ACTIVITIES from DB query
ACTIVITIES = {
    "Deep Adv": "b838e71f-be1a-4aff-977b-c9b22ce02d59",
    "Update RR": "34fa46af-1ccb-4e93-884c-a440cac189f3",
    "Advanced": "d232f6fe-8943-4225-8f23-2f7a3eac1b99",
    "Scuba Diver": "77d5e1e6-a593-4778-94f8-56696e2a6562",
    "Update Open Water": "9ee1d398-01bf-41fb-ac7e-33038f5307b9",
    "Deep (3 Dives)": "717935fd-4160-47f9-b2f6-75a57d6815b2",
    "Scuba Diver UPG": "77c61ab4-cc3f-4a06-bb8f-565844294080",
    "Scuba Diver GO": "a2ca60e6-93d9-419c-97ef-9bdac8f9924a",
    "Reserva": "06ee3b83-af61-462e-9e98-b8dc90107ef9",
    "Cover + mako": "982d9170-194e-4594-b660-12743b1f5b4f",
    "FD 1": "d55e5186-f235-4401-aa90-7f790eb8dd5d",
    "FD 2 a 5": "19637215-8562-4a35-94d5-52db23c57886",
    "FD Alumno": "96776605-0633-4156-a8bf-b23920584c37",
    "SRock DMT": "97f417a1-65e9-4297-887a-4ae5be740d9a",
    "Sail Rock": "000afebb-088a-4a60-986b-b6aff211d250",
    "Rescate": "b4e2ea56-cd18-43d1-991d-58371859e6fe",
    "Otro": "553bd25b-3edb-461e-8f45-53716cb2d424",
    "Camiseta": "eb55ba0e-d287-4550-8b00-641ea0a9f19e",
    "Sudadera": "27cf7652-28e5-44a3-b1e6-3c44531c1d8c",
    "Open Water": "744d63b8-bab2-464c-b536-04597de66bc0",
    "Primeros Auxilios": "120aa12e-9bca-4e81-a1ca-3208ef6a2a5b",
    "Fotos": "25b0a390-7c1b-41cc-ab46-7a35abe82846",
    "Cover": "0996363a-8e7f-4229-9729-271784042388",
    "Bora": "4b802e7d-9255-43b2-ae35-e173c9d2bf9c",
    "Bautizo (2 dives)": "dab5b623-6d22-4154-8bda-cacfa5ba344a",
    "Xtreme": "a756a16e-d1ba-43a4-907e-ca57b7dfa792",
    "Bora + mako": "7b122b35-947e-4c11-aa3f-f3ee94b34449",
    "Deep (2 Dives)": "49fb5ad0-ded9-4abc-894b-82f1eaf0f072",
    "Xtreme + mako": "a0d01245-a2e6-456c-a304-4c42e899499d",
    "Open Water GO": "d41af798-a7fa-4060-91a6-536de7cc509d",
    "Refresh (2 Alum)": "6062cdb8-15d3-4b5e-9676-5d899ac42b3b",
    "Bautizo (1 dive)": "7e22f8d2-eb26-4a7e-9ddf-89010252418b",
    "Refresh (2)": "6fcbb026-f419-4b77-bd7d-cb65be2d28f4",
    "Refresh (1)": "dc47a704-95a7-47c5-a95b-cf3a97250d7d",
    "Nitrox": "501e735a-3863-444b-a0b3-b9821b4339d6",
    "Nitrox AOW": "fe6a5598-5bbb-4b46-8449-69bb91afb507",
    "Snokelling 10:00": "b4433512-1415-4442-a25c-58d58fd673fb",
    "Snokelling Afternoon": "3a0a4b2a-d37b-4635-a126-b610aebb7d0d",
    "Snokelling PREMIUN": "4e4992d0-b418-442a-b5cc-738602096646",
    "Cancel": "bbb1328f-a4b0-4f6d-b8e6-2359156e97e5",
    "Cancel 2 dives": "43e27b67-53fa-497a-b2fc-ce8e58cc79c8",
    "DM + 3 espc": "7c7b3c3c-9242-49bb-b94e-d8328b7a6cb6"
}

EXISTING_CUSTOMERS = {}
CUSTOMERS_JSON_PATH = r"C:\Users\solra\.gemini\antigravity\brain\5c9219c5-ef54-46a8-b1c8-f79fab4a8afb\.system_generated\steps\3419\output.txt"

def load_customers():
    with open(CUSTOMERS_JSON_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find the JSON part within the execute_sql output
        start, end = content.find('['), content.rfind(']') + 1
        if start == -1 or end <= 0:
            print("ERROR: Could not find JSON array in customer file.")
            return
        
        json_str = content[start:end]
        try:
            customers_list = json.loads(json_str)
        except Exception as e:
            print(f"DEBUG: Initial JSON load failed: {e}. Trying unicode_escape decode.")
            try:
                json_str = json_str.encode('utf-8').decode('unicode_escape')
                customers_list = json.loads(json_str)
            except Exception as e2:
                print(f"ERROR: JSON parsing failed completely: {e2}")
                return
            
        for c in customers_list:
            cid = c.get('id')
            if c.get('email'):
                EXISTING_CUSTOMERS[c['email'].lower().strip()] = cid
            
            first = (c.get('first_name','') or '').lower().strip()
            last = (c.get('last_name','') or '').lower().strip()
            full_name = f"{first} {last}".strip()
            if full_name:
                EXISTING_CUSTOMERS[full_name] = cid
        print(f"Loaded {len(customers_list)} customers.")

load_customers()

def clean_price(p):
    if not p: return 0.0
    p = "".join(c for c in p if c.isdigit() or c in '.,+-')
    if not p: return 0.0
    if ',' in p and '.' in p: p = p.replace('.', '')
    p = p.replace(',', '.')
    try: return float(p)
    except: return 0.0

CSV_PATH = r"c:\Users\solra\Documents\Antigravity\diving-erp\Abril 26 New - Facturas.csv"
sql_commands = []
invoices = {}
last_date_day = "1"

with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
    lines = [l for l in f.readlines() if l.strip()]
    csv_content = "".join(lines)
    reader = csv.DictReader(io.StringIO(csv_content))
    for i, row in enumerate(reader):
        day_raw = row.get('Fecha', '').strip()
        if day_raw: last_date_day = day_raw
        
        try:
            day_int = int(float(last_date_day))
            full_date = f"2026-04-{day_int:02d}"
        except:
            full_date = "2026-04-01"
            
        email = row.get('Email', '').lower().strip()
        first_name = (row.get('Nombre','') or '').lower().strip()
        last_name = (row.get('Apellidos','') or '').lower().strip()
        name_key = f"{first_name} {last_name}".strip()
        
        customer_id = EXISTING_CUSTOMERS.get(email) or EXISTING_CUSTOMERS.get(name_key)
        
        price = clean_price(row.get('Precio', '0'))
        quantity = clean_price(row.get('Unidades', '1'))
        total = clean_price(row.get('Total', '0')) or (price * quantity)
        
        status_raw = (row.get('Pagado/Por pagar', '') or '').upper()
        status = "Paid" if "PAGADO" in status_raw else "Pending"
        
        method = row.get('Metodo', '').strip() or "Cash"
        instructor_raw = (row.get('Instructor', '') or '').upper().strip()
        instructor_id = STAFF_MAP.get(instructor_raw)
        
        bizum = clean_price(row.get('Bizum', '0'))
        
        # Unique key for grouping into an invoice
        inv_key = (full_date, customer_id or f"temp_{i}", method)
        
        if inv_key not in invoices:
            invoices[inv_key] = {
                "id": str(uuid.uuid4()),
                "customer_id": customer_id,
                "date": full_date,
                "method": method,
                "status": status,
                "items": []
            }
            
        invoices[inv_key]["items"].append({
            "activity_id": ACTIVITIES.get(row.get('Actividad', ''), ACTIVITIES["Otro"]),
            "instructor_id": instructor_id,
            "quantity": quantity,
            "price": price,
            "total": total,
            "notes": row.get('Notas', '').strip(),
            "bizum": bizum,
            "temp_name": name_key if not customer_id else None
        })

for inv in invoices.values():
    c_val = f"'{inv['customer_id']}'" if inv['customer_id'] else "NULL"
    total_invoice_thb = sum(item['total'] for item in inv['items'])
    total_bizum_eur = sum(item['bizum'] for item in inv['items'])
    
    sql_commands.append(f"INSERT INTO public.invoices (id, customer_id, total_thb, payment_method, status, created_at, bizum_deposit_eur) VALUES ('{inv['id']}', {c_val}, {total_invoice_thb}, {repr(inv['method'])}, '{inv['status']}', '{inv['date']}', {total_bizum_eur});")
    
    for item in inv['items']:
        a_val = f"'{item['activity_id']}'" if item['activity_id'] else "NULL"
        i_val = f"'{item['instructor_id']}'" if item['instructor_id'] else "NULL"
        sql_commands.append(f"INSERT INTO public.invoice_items (invoice_id, customer_id, activity_id, instructor_id, date, quantity, unit_price_thb, total_thb, payment_method, status, notes, bizum_deposit_eur, temporary_name) VALUES ('{inv['id']}', {c_val}, {a_val}, {i_val}, '{inv['date']}', {item['quantity']}, {item['price']}, {item['total']}, {repr(inv['method'])}, '{inv['status']}', {repr(item['notes'])}, {item['bizum']}, {repr(item['temp_name']) if item['temp_name'] else 'NULL'});")

OUTPUT_SQL_PATH = r"C:\Users\solra\Documents\Antigravity\diving-erp\scratch\import_april.sql"
with open(OUTPUT_SQL_PATH, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_commands))

print(f"Success: Generated {len(sql_commands)} SQL commands for import.")
