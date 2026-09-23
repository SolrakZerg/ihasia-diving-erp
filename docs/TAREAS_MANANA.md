# 📋 Hoja de Ruta y Tareas para Mañana

Documento de seguimiento para la sesión de mañana.

---

## 🎯 Tarea 1: Corregir Plantilla de Emails en Contact Form 7 (Wise)

### ¿Por qué llegan los emails con `[your-subject]` y `[your-name]`?
Contact Form 7 incluye por defecto en la pestaña **"Correo"** etiquetas estándar como `[your-name]`, `[your-email]`, `[your-subject]` y `[your-message]`.
Al haber creado campos personalizados (`[nombre_cliente]`, `[fecha_reserva]`, `[whatsapp]`, etc.), Contact Form 7 no reconoce las etiquetas antiguas y las envía tal cual en texto plano sin sustituir.

### Solución (Copiar y pegar en WordPress):
1. Ve a **WordPress Admin > Contacto > Formularios de contacto**.
2. Edita el formulario **"Reserva por Wise"** (y el de inglés **"Wise Booking"**).
3. Haz clic en la pestaña superior **"Correo"** (Mail).
4. Configura los campos de la siguiente manera:

#### Para el formulario en Español:
* **Para:** `tu-email@ihasiadivingkohtao.com` (o el email donde quieras recibir las alertas)
* **De:** `Ihasia Diving <wordpress@ihasiadivingkohtao.com>`
* **Asunto:** `🌊 Nueva Reserva Wise: [nombre_cliente] - [fecha_reserva]`
* **Cabeceras adicionales:** `Reply-To: [whatsapp]`
* **Cuerpo del mensaje:**
```text
Se ha recibido una nueva reserva pagada por Wise desde la web:

--------------------------------------------------
DATOS DEL CLIENTE
--------------------------------------------------
Nombre y Apellidos: [nombre_cliente]
Fecha de la actividad: [fecha_reserva]
WhatsApp: [whatsapp]
Titular de la cuenta Wise: [titular_wise]

--------------------------------------------------
DETALLES DE LA RESERVA
--------------------------------------------------
Total Participantes: [pax_total]
Actividades solicitadas:
[actividades_desglose]

Comentarios / Notas:
[notas]

--------------------------------------------------
Este mensaje se generó automáticamente desde el formulario web de Ihasia Diving Kohtao.
El registro ya ha sido enviado automáticamente a Supabase / ERP.
```

#### Para el formulario en Inglés ("Wise Booking"):
* **Asunto:** `🌊 New Wise Booking: [nombre_cliente] - [fecha_reserva]`
* **Cuerpo del mensaje:**
```text
New Wise booking received from website:

--------------------------------------------------
CUSTOMER DETAILS
--------------------------------------------------
Name: [nombre_cliente]
Activity Date: [fecha_reserva]
WhatsApp: [whatsapp]
Wise Account Holder: [titular_wise]

--------------------------------------------------
BOOKING DETAILS
--------------------------------------------------
Total Pax: [pax_total]
Activities:
[actividades_desglose]

Special Requests / Notes:
[notas]

--------------------------------------------------
Automated notification from Ihasia Diving Kohtao.
```

---

## 🎯 Tarea 2: Modernizar Bizum (Eliminar Google Forms)

Queremos replicar el mismo éxito conseguido hoy con Wise para el flujo de **Bizum**:

### 1. Formulario Web en Contact Form 7 para Bizum
* Crear un nuevo formulario CF7 en WordPress con el mismo diseño premium, selector interactivo de personas (+/-) por actividad (`DSD`, `OW`, `AA`, `SR`, `FD`, `RES`).
* Campos clave:
  * Fecha de actividad (`fecha_reserva`)
  * Nombre y apellidos (`nombre_cliente`)
  * WhatsApp con prefijo (`whatsapp`)
  * Titular del Bizum (`titular_bizum` - por si lo hace un familiar/amigo)
  * Teléfono desde el que se hizo el Bizum (`telefono_bizum`)
  * Desglose de actividades y total pax
  * Notas/comentarios
* Sustituir en la web el iframe/enlace de Google Forms por el shortcode de este nuevo formulario.

### 2. Integración Directa WordPress -> Supabase (`public.bizums`)
* Ampliar el snippet PHP en **WPCode Lite** de WordPress.
* Cuando alguien envía el formulario de Bizum, insertar directamente vía REST API en la tabla `public.bizums` de Supabase.
* **Ventaja:** Decimos adiós definitivamente a Google Forms, Google Sheets, Apps Script y posibles desincronizaciones. Todo entra al segundo en la base de datos oficial.

### 3. Conciliación y Flujo en el ERP
* Revisar cómo llegan los datos a la tabla `public.bizums`.
* Asegurar que el estado inicial en el ERP refleje correctamente los datos recibidos de la web para revisión rápida.
* Comprobar que el modal de procesar (`Bizums_ProcessModal.jsx`) funcione al 100% con los datos enriquecidos de la web.

---

## 📌 Resumen de Estado Actual (Al cierre de hoy)
- ✅ ERP actualizado a **v1.5.7** y subido a GitHub (`origin/main`).
- ✅ Formulario Wise desplegado y funcionando en la web.
- ✅ Sincronización en tiempo real Web -> Supabase activa.
- ✅ Triggers de reconciliación automática en Supabase funcionando (0 duplicados).
- ✅ Tabla de Wise en el ERP con diseño idéntico a Bizum (badges con `OW x2`, toggle `Recibido`, modal `Procesado`).
