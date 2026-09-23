# Formulario de Reservas por Wise (Definitivo - Respaldo Oficial)

Documento oficial de respaldo con el código final probado y validado en producción.

---

## 1. Código en Contact Form 7 (HTML + Script)

```html
<div class="ihasia-wise-form">

  <div class="iw-intro">
    <p>Para confirmar tu plaza, una vez realizada la transferencia en Wise, completa los siguientes datos.</p>
  </div>

  [hidden is_english "false"]

  <!-- 1. FECHA Y DATOS PERSONALES -->
  <div class="iw-grid-2">
    <div class="iw-field">
      <label>Fecha de la actividad <span class="req">*</span></label>
      [date* fecha_reserva min:today placeholder "dd/mm/aaaa"]
    </div>

    <div class="iw-field">
      <label>Nombre y Apellidos <span class="req">*</span></label>
      [text* nombre_cliente placeholder "Ej: Carlos García"]
    </div>
  </div>

  <div class="iw-grid-2">
    <div class="iw-field">
      <label>WhatsApp con prefijo de país <span class="req">*</span></label>
      [tel* whatsapp placeholder "+34 612 345 678"]
      <span class="iw-hint">Imprescindible incluir prefijo (+34, etc.)</span>
    </div>

    <div class="iw-field iw-highlight">
      <label>Titular de la cuenta Wise</label>
      [text titular_wise placeholder "(solo si es diferente a tu nombre)"]
      <span class="iw-hint">⚠️ Si pagaste desde la cuenta de otra persona o empresa.</span>
    </div>
  </div>

  <!-- 2. DESGLOSE DE PERSONAS POR ACTIVIDAD -->
  <div class="iw-section-title">
    <h4>¿Cuántas personas van a cada actividad?</h4>
    <p>Indica el número de participantes para cada curso o actividad:</p>
  </div>

  <div class="iw-activities-card">

    <!-- 1. BAUTIZO -->
    <div class="iw-activity-row">
      <div class="iw-act-info"><span class="iw-act-badge dsd">DSD</span> <strong>Bautizo de Buceo</strong></div>
      <div class="iw-act-counter">
        <button type="button" class="btn-step" onclick="window.stepPax('pax_dsd', -1)">-</button>
        [number num_dsd id:pax_dsd class:iw-pax-input min:0 max:10]
        <button type="button" class="btn-step" onclick="window.stepPax('pax_dsd', 1)">+</button>
      </div>
    </div>

    <!-- 2. OPEN WATER -->
    <div class="iw-activity-row">
      <div class="iw-act-info"><span class="iw-act-badge ow">OW</span> <strong>Open Water Course</strong></div>
      <div class="iw-act-counter">
        <button type="button" class="btn-step" onclick="window.stepPax('pax_ow', -1)">-</button>
        [number num_ow id:pax_ow class:iw-pax-input min:0 max:10]
        <button type="button" class="btn-step" onclick="window.stepPax('pax_ow', 1)">+</button>
      </div>
    </div>

    <!-- 3. AVANZADO -->
    <div class="iw-activity-row">
      <div class="iw-act-info"><span class="iw-act-badge aa">AA</span> <strong>Curso Avanzado</strong></div>
      <div class="iw-act-counter">
        <button type="button" class="btn-step" onclick="window.stepPax('pax_aa', -1)">-</button>
        [number num_aa id:pax_aa class:iw-pax-input min:0 max:10]
        <button type="button" class="btn-step" onclick="window.stepPax('pax_aa', 1)">+</button>
      </div>
    </div>

    <!-- 4. REFRESH -->
    <div class="iw-activity-row">
      <div class="iw-act-info"><span class="iw-act-badge sr">SR</span> <strong>Scuba Refresh</strong></div>
      <div class="iw-act-counter">
        <button type="button" class="btn-step" onclick="window.stepPax('pax_sr', -1)">-</button>
        [number num_sr id:pax_sr class:iw-pax-input min:0 max:10]
        <button type="button" class="btn-step" onclick="window.stepPax('pax_sr', 1)">+</button>
      </div>
    </div>

    <!-- 5. FUN DIVES -->
    <div class="iw-activity-row">
      <div class="iw-act-info"><span class="iw-act-badge fd">FD</span> <strong>Fun Dives</strong></div>
      <div class="iw-act-counter">
        <button type="button" class="btn-step" onclick="window.stepPax('pax_fd', -1)">-</button>
        [number num_fd id:pax_fd class:iw-pax-input min:0 max:10]
        <button type="button" class="btn-step" onclick="window.stepPax('pax_fd', 1)">+</button>
      </div>
    </div>

    <!-- 6. RESCATE -->
    <div class="iw-activity-row">
      <div class="iw-act-info"><span class="iw-act-badge res">RES</span> <strong>Curso de Rescate</strong></div>
      <div class="iw-act-counter">
        <button type="button" class="btn-step" onclick="window.stepPax('pax_rescue', -1)">-</button>
        [number num_rescue id:pax_rescue class:iw-pax-input min:0 max:10]
        <button type="button" class="btn-step" onclick="window.stepPax('pax_rescue', 1)">+</button>
      </div>
    </div>

    <!-- RESUMEN TOTAL DE PAX (En una sola línea para evitar saltos wpautop) -->
    <div class="iw-total-bar"><span>Total Participantes (Pax):</span><span class="iw-total-badge" id="iw-total-display">0 personas</span>[hidden total_pax id:total_pax "0"]</div>
  </div>

  <!-- BOTÓN DE ENVÍO -->
  <div class="iw-submit-wrap">
    [submit "Confirmar Reserva por Wise"]
  </div>

  <!-- CLOUDFLARE TURNSTILE (Centrado) -->
  <div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 15px;">
    [turnstile]
  </div>

</div>

<!-- SCRIPT DIRECTO DENTRO DEL FORMULARIO -->
<script>
window.stepPax = function(targetId, delta) {
  var input = document.getElementById(targetId);
  if (!input) {
    var name = targetId.replace('pax_', 'num_');
    input = document.querySelector('input[name="' + name + '"]');
  }
  if (input) {
    var current = parseInt(input.value, 10);
    if (isNaN(current)) current = 0;
    var next = current + delta;
    if (next < 0) next = 0;
    if (next > 10) next = 10;
    input.value = next;
    window.recalculateWiseTotal();
  }
};

window.recalculateWiseTotal = function() {
  var ids = ['pax_dsd', 'pax_ow', 'pax_aa', 'pax_sr', 'pax_fd', 'pax_rescue'];
  var total = 0;
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (!el) {
      el = document.querySelector('input[name="' + ids[i].replace('pax_', 'num_') + '"]');
    }
    if (el) {
      var val = parseInt(el.value, 10);
      if (!isNaN(val) && val > 0) total += val;
    }
  }
  var disp = document.getElementById('iw-total-display');
  var hidden = document.getElementById('total_pax') || document.querySelector('input[name="total_pax"]');
  if (disp) {
    disp.textContent = total + (total === 1 ? ' persona' : ' personas');
    disp.style.background = total > 0 ? '#10b981' : '#0ea5e9';
  }
  if (hidden) {
    hidden.value = total;
  }
};

// Por si alguien teclea a mano en el campo
document.addEventListener('input', function(e) {
  if (e.target && e.target.classList.contains('iw-pax-input')) {
    window.recalculateWiseTotal();
  }
});
</script>
```

---

## 2. Código CSS en Kallyas (Personalizar -> CSS Adicional)

```css
/* ==========================================================================
   FORMULARIO DE RESERVAS WISE (IHASIA DIVING)
   ========================================================================== */
.ihasia-wise-form {
  max-width: 680px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1e293b;
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}
.iw-intro {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 14px;
}
.iw-intro p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}
.iw-grid-2 {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px 14px -8px;
}
.iw-grid-2 > .iw-field {
  flex: 1 1 240px;
  padding: 0 8px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
.iw-field {
  display: flex;
  flex-direction: column;
}
.iw-field label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}
.iw-field .req { color: #e11d48; }
.iw-field input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  background: #f8fafc;
}
.iw-field input:focus {
  border-color: #0284c7;
  background: #fff;
}
.iw-hint {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 4px;
}
.iw-highlight {
  background: #f0fdf4;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed #86efac;
}
.iw-section-title {
  margin: 22px 0 12px 0;
}
.iw-section-title h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #0f172a;
}
.iw-section-title p {
  margin: 0;
  font-size: 12.5px;
  color: #64748b;
}
.iw-activities-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.iw-activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #edf2f7;
}

/* ALINEACIÓN HORIZONTAL DE BADGE Y NOMBRE */
.iw-act-info {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  gap: 10px !important;
}
.iw-act-info p {
  display: inline-flex !important;
  align-items: center !important;
  margin: 0 !important;
  padding: 0 !important;
}
.iw-act-info strong {
  display: inline-block !important;
  font-size: 14.5px !important;
  color: #1e293b !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
  vertical-align: middle !important;
}
.iw-act-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 6px;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
.iw-act-badge.dsd { background: #ffe4e6; color: #be123c; }
.iw-act-badge.ow  { background: #dcfce7; color: #15803d; }
.iw-act-badge.aa  { background: #e0f2fe; color: #0369a1; }
.iw-act-badge.sr  { background: #fef3c7; color: #b45309; }
.iw-act-badge.fd  { background: #f3e8ff; color: #7e22ce; }
.iw-act-badge.res { background: #ffedd5; color: #c2410c; }

/* CONTENEDOR DE BOTONES EN HORIZONTAL */
.iw-act-counter {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-end !important;
  flex-wrap: nowrap !important;
  width: auto !important;
}
.iw-act-counter p {
  display: inline-flex !important;
  margin: 0 !important;
  padding: 0 !important;
}
.iw-act-counter br {
  display: none !important;
}
.iw-act-counter .wpcf7-form-control-wrap {
  display: inline-flex !important;
  width: auto !important;
  margin: 0 4px !important;
  padding: 0 !important;
}
.iw-act-counter .btn-step {
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  border: 1px solid #cbd5e1 !important;
  background: #ffffff !important;
  color: #1e293b !important;
  font-size: 18px !important;
  font-weight: bold !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
  margin: 0 !important;
}
.iw-pax-input {
  width: 44px !important;
  height: 32px !important;
  text-align: center !important;
  padding: 0 !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  background: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  border-radius: 8px !important;
  display: inline-block !important;
  margin: 0 !important;
}

/* BARRA DE TOTAL (CENTRADA Y CON ESPACIADO) */
.iw-total-bar {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-wrap: wrap !important;
  gap: 14px !important;
  padding: 14px 16px !important;
  background: #0f172a !important;
  color: #ffffff !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-align: center !important;
}
.iw-total-bar p {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 14px !important;
  margin: 0 !important;
  padding: 0 !important;
}
.iw-total-badge {
  display: inline-block !important;
  background: #0ea5e9 !important;
  color: #ffffff !important;
  padding: 5px 14px !important;
  border-radius: 20px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
}




/* BOTÓN DE ENVÍO */
.iw-submit-wrap {
  margin-top: 22px;
  text-align: center;
}
.iw-submit-wrap input[type="submit"] {
  background: #0284c7;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  padding: 12px 32px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
}

/* QUITAR FLECHITAS DEL CAMPO NUMÉRICO */
input.iw-pax-input::-webkit-outer-spin-button,
input.iw-pax-input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  margin: 0 !important;
}
input.iw-pax-input {
  -moz-appearance: textfield !important;
}
```
