# Propuesta de Arquitectura: Integración de Addtocalendar (Reservas Cash) en el ERP

**Fecha de redacción:** 2 de Octubre de 2026  
**Estado:** Propuesta Técnica / Plan para versión futura  
**Solución temporal activa:** Candado 1 (`billing_imported_calendar_events`)  

---

## 1. Contexto y Justificación

### 1.1 El Flujo de Trabajo Actual (Addtocalendar 5.1)
Actualmente, las reservas realizadas por **Wise** y **Bizum** están integradas y automatizadas con Google Calendar y la base de datos de Supabase. Sin embargo, las reservas cobradas en **efectivo (Cash)** se gestionan a través de una aplicación de escritorio externa:
* **Herramienta:** *Addtocalendar 5.1* (desarrollada en Python).
* **Entrada rápida:** Atajo global de teclado en Windows `Fn + B`.
* **Mecanismo:** El usuario copia el nombre y teléfono del cliente de WhatsApp o chat, pulsa `Fn + B`, el script lee el portapapeles, autocompleta los campos y crea el evento en Google Calendar.
* **Importación en Facturación:** Cuando el cliente llega a Koh Tao y se le añade a una factura, un trigger de base de datos (`fn_trg_billing_auto_import_calendar_deposit`) busca en Google Calendar mediante coincidencias de texto/nombre y crea una línea de reserva de 1.000 THB.

### 1.2 Problemas y Limitaciones del Sistema Actual
1. **Dependencia de un único PC:** Addtocalendar solo funciona en el ordenador que tiene Python instalado y el script configurado. No se pueden registrar reservas de Cash desde el móvil (en la playa, barco, restaurante) ni desde una tablet u otro portátil.
2. **Desconexión con la Base de Datos:** El evento se crea directamente en Google Calendar, sin un registro directo en Supabase. La base de datos solo se entera cuando el lector de facturas "raspa" el calendario.
3. **El problema de las reservas zombi al borrar en Cash:**  
   En el flujo habitual de Cash, si el cliente hace un curso (ej. Open Water por 9.000 THB) y ya dejó 1.000 THB de reserva, al pagar los 8.000 THB restantes el usuario suele borrar la línea de reserva de 1.000 THB y dejar el Open Water a 9.000 THB. Si más adelante el cliente compra una aventura extra (ej. Deep Adventure) y se pulsa `+`, el trigger vuelve a rastrear el calendario y resucita la reserva de 1.000 THB borrada.
4. **Falta de Apellidos en el Calendario:** Al meter datos rápidos en Addtocalendar suele ponerse solo el nombre de pila. Si luego el cliente se registra en la web con nombre y apellidos, el matching automático en BD es más propenso a ambigüedades.

---

## 2. Visión del Nuevo Módulo: "Reservas Cash / Quick Add" en el ERP

Integrar Addtocalendar como una sección o modal rápido en el Diving ERP permite resolver todos estos problemas con una experiencia de usuario prácticamente igual de rápida que el atajo de escritorio.

```
       [ WhatsApp / Chat ]
                │ (Copiar Nombre y Teléfono)
                ▼
   [ Diving ERP: Modal Rápido ] ──► Lectura Portapapeles (navigator.clipboard)
                │
                │ [ Botón Guardar / Intro ]
                ▼
       ┌────────────────────────┐
       │   EJECUCIÓN ATÓMICA    │
       └───────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
[ Google Calendar API ]    [ Supabase: cash_reservations ]
  (Crea evento con link      (id, customer_id, 1000 THB,
   WhatsApp + confirmación)   imported_to_invoice = FALSE)
                             │
                             ▼
                   [ Facturación ERP ]
                     - Importa a factura
                     - Marca: imported_to_invoice = TRUE
                     - Nunca resucita si se borra la línea
```

---

## 3. Experiencia de Usuario (UX) y Velocidad

### 3.1 Agilidad frente a `Fn + B`
* Aunque `Fn + B` es un atajo global de sistema operativo, en el ERP se puede alcanzar una velocidad de **2 clics / atajo web**:
  * Atajo de teclado en la web: `Alt + R` o `Shift + N` dentro del ERP.
  * O botón fijo/flotante en el menú lateral y en Facturación: **"⚡ Nueva Reserva Cash"**.
* **Lectura Inteligente del Portapapeles:**
  * Uso de la API estándar del navegador: `navigator.clipboard.readText()`.
  * Al hacer clic en "Pegar del portapapeles" (o directamente al abrir el modal), el sistema aplica los regex de Addtocalendar 5.1 para extraer automáticamente:
    * Prefijo telefónico internacional (`+34`, `+66`, etc.) y número de teléfono.
    * Nombre y Apellidos.
    * Posible actividad detectada (OW, AOW, Bautizo, Fun Dive).
* **Confirmación Inmediata de WhatsApp:**
  * Genera al vuelo el mensaje de confirmación (ES / EN) y el enlace `https://wa.me/XXXXXXXXXX?text=...` exactamente igual a como lo hace hoy Addtocalendar y el modal de Bizum.

---

## 4. Arquitectura de Datos en Supabase

### 4.1 Nueva Tabla: `public.cash_reservations`

```sql
CREATE TABLE public.cash_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Datos del cliente
  first_name text NOT NULL,
  last_name text DEFAULT '',
  phone text DEFAULT '',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Detalles de la actividad y depósito
  activity_code text NOT NULL,        -- 'OW', 'OW2', 'AOW', 'DSD', etc.
  num_people integer NOT NULL DEFAULT 1,
  amount_thb numeric NOT NULL DEFAULT 1000.00,
  is_english boolean DEFAULT true,
  notes text DEFAULT '',
  
  -- Integración con Google Calendar
  calendar_event_id text,
  calendar_event_summary text,
  calendar_html_link text,
  
  -- Control de Facturación (Evita duplicados y reservas zombi)
  imported_to_invoice boolean DEFAULT false,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  imported_at timestamptz
);

-- Índices de búsqueda rápida
CREATE INDEX idx_cash_reservations_phone ON public.cash_reservations (phone);
CREATE INDEX idx_cash_reservations_customer ON public.cash_reservations (customer_id);
CREATE INDEX idx_cash_reservations_booking_date ON public.cash_reservations (booking_date);
CREATE INDEX idx_cash_reservations_pending_import ON public.cash_reservations (imported_to_invoice) WHERE imported_to_invoice = false;
```

---

## 5. Integración con Google Calendar

El ERP **ya cuenta con las credenciales OAuth de Google Calendar en Supabase Vault** y funciones RPC operativas:
* Función existente: `public.create_custom_google_calendar_event` (ver `database/db_functions.sql` L1150-L1250).
* Adaptación para Cash:
  * El evento en Google Calendar se crea con el texto estándar:
    * **Título:** `Nombre Apellido OWx2 - in 2 days - Inglés`
    * **Cuerpo:** Enlace `wa.me/` con botón `SEND CONFIRMATION MESSAGE`, fecha de inicio y viñeta: `Reserva: X personas -> 1000 thb a CASH`.
  * La función retorna el `event_id` y `htmlLink` que se guardan en `cash_reservations`.

---

## 6. Lógica de Importación en Facturación (Solución Definitiva)

### 6.1 Cómo se importa:
Cuando se crea una factura para un cliente (o se le añade desde Asegurados/Clientes):
1. El sistema busca reservas en `cash_reservations` donde `customer_id = v_customer_id` (o match por teléfono) y `imported_to_invoice = false`.
2. Si encuentra una reserva:
   * Inserta la línea en `invoice_items` (`concepto = 'Reserva'`, `precio = 1000`, `pagado = true`, `metodo = 'cash'`).
   * Actualiza inmediatamente `cash_reservations`:
     ```sql
     UPDATE public.cash_reservations
     SET imported_to_invoice = true,
         invoice_id = v_invoice_id,
         imported_at = now()
     WHERE id = v_reserva_id;
     ```

### 6.2 Qué ocurre si el usuario borra la línea de reserva:
* Si el usuario borra la línea de reserva en la factura porque le cobra los 9.000 THB del tirón en efectivo, **la fila en `cash_reservations` sigue teniendo `imported_to_invoice = true`**.
* Si luego el usuario pulsa `+` para añadir el *Deep Adventure*, el sistema comprueba `cash_reservations`, ve que ya fue importada / consumida, y **no vuelve a crear ninguna línea de reserva**.
* Si el cliente regresa a los 10 días para hacer otro curso y deja una **nueva reserva en cash**, esta tendrá un nuevo registro en `cash_reservations` con `imported_to_invoice = false`, por lo que esa segunda reserva **sí se importará correctamente**.

---

## 7. Tabla Comparativa de Ventajas

| Característica | Addtocalendar 5.1 (Actual) | Nuevo Módulo Cash en ERP (Futuro) |
| :--- | :--- | :--- |
| **Dispositivos soportados** | Solo PC local (requiere Python instalado) | Cualquier navegador (PC, Mac, iPhone, Android, Tablet) |
| **Atajo de apertura** | `Fn + B` global en Windows | Botón flotante en ERP / Atajo web (`Alt + R`) |
| **Lectura de portapapeles** | Sí (Python `pyperclip`) | Sí (`navigator.clipboard.readText()`) |
| **Registro en BD** | No (solo Google Calendar) | Sí (tabla `cash_reservations` en Supabase) |
| **Trazabilidad de apellidos** | Regular (muchas veces solo nombre) | Completa (Nombre + Apellido) |
| **Matching con Clientes** | Scraping difuso de texto de Calendar | Relacional limpio por ID de cliente o teléfono |
| **Resurrección de reservas zombi** | Requiere "Candado 1" para no duplicar | Imposible por diseño (`imported_to_invoice = true`) |
| **Panel de gestión y caja** | No existe (solo vista en Calendar) | Panel unificado junto a Bizum y Wise |

---

## 8. Hoja de Ruta de Implementación (Roadmap)

1. **Fase Actual (Inmediata):** Implementar **Candado 1** (`billing_imported_calendar_events`) en el trigger de facturación para erradicar las reservas zombi con el sistema actual de Addtocalendar 5.1.
2. **Fase Futura (Evolución a ERP):**
   * Crear la migración SQL de `cash_reservations`.
   * Crear el componente React `CashReservationQuickModal.jsx` con lector de portapapeles y selector de idioma/actividad.
   * Conectar la llamada a `create_custom_google_calendar_event` con variante `'a CASH'`.
   * Integrar el listener en Facturación para consumir de `cash_reservations` en lugar de raspar directamente la API de Google Calendar.
