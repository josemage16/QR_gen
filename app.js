/**
 * QR_gen - Generador de QR en Máxima Resolución PNG para Landing_Sorteos_BV_v2
 * Genera QR para: https://josemage16.github.io/Landing_Sorteos_BV_v2/?codigo=XXX
 */

document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL = 'https://josemage16.github.io/Landing_Sorteos_BV_v2/?codigo=';
  const SPONSORS_SHEET_ID = '1gTS4uFBAeCToLQKfv0WY6g_G9tOfNdWeU8Nm33s7rCA';
  const QUIET_ZONE_MODULES = 4; // Estándar ISO/IEC 18004

  const form = document.getElementById('qr-form');
  const inputCodigo = document.getElementById('codigo-input');
  const selectResolution = document.getElementById('resolution-select');
  const errorText = document.getElementById('error-text');

  const resultSection = document.getElementById('result-section');
  const previewCanvas = document.getElementById('qr-preview-canvas');
  const urlLink = document.getElementById('generated-url-link');
  const openUrlBtn = document.getElementById('btn-open-url');
  const copyUrlBtn = document.getElementById('btn-copy-url');
  const downloadBtn = document.getElementById('btn-download-png');
  const downloadBtnLabel = document.getElementById('download-btn-label');
  const metaBar = document.getElementById('qr-meta-bar');
  const sponsorPill = document.getElementById('sponsor-pill');
  const sponsorPillText = document.getElementById('sponsor-pill-text');

  let currentCode = '';
  let currentUrl = '';
  let currentQrInstance = null;
  let sponsorsMap = null;

  // --- Precarga opcional de nombres de comercios desde la planilla de sponsors ---
  function loadSponsorsLookup() {
    const cbName = `__qrGenSponsorsCb_${Date.now()}`;
    const script = document.createElement('script');

    window[cbName] = (response) => {
      try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
      if (!response || response.status !== 'ok' || !response.table) return;

      const cols = response.table.cols || [];
      const rows = response.table.rows || [];
      const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const cellText = (c) => (!c ? '' : (c.f !== undefined && c.f !== null && String(c.f).trim() !== '' ? String(c.f).trim() : (c.v !== undefined && c.v !== null ? String(c.v).trim() : '')));

      let headers = cols.map((c) => normalize(c && c.label));
      let startRow = 0;
      if (!headers.some((h) => h.includes('codigo')) && rows[0] && rows[0].c) {
        headers = rows[0].c.map((cell) => normalize(cellText(cell)));
        startRow = 1;
      }

      const codeIdx = headers.findIndex((h) => h === 'codigo sorteo' || h === 'codigosorteo' || h === 'codigo');
      const comercioIdx = headers.findIndex((h) => h === 'comercio' || h === 'nombre');
      if (codeIdx === -1 || comercioIdx === -1) return;

      const map = new Map();
      for (let i = startRow; i < rows.length; i++) {
        const cells = (rows[i] && rows[i].c) || [];
        let code = cellText(cells[codeIdx]).replace(/\.0+$/, '').toLowerCase();
        const comercio = cellText(cells[comercioIdx]);
        if (code && comercio) map.set(code, comercio);
      }
      sponsorsMap = map;
      if (currentCode) updateSponsorBadge(currentCode);
    };

    script.src = `https://docs.google.com/spreadsheets/d/${SPONSORS_SHEET_ID}/gviz/tq?tqx=responseHandler:${cbName}&_=${Date.now()}`;
    document.head.appendChild(script);
  }

  function updateSponsorBadge(code) {
    if (!sponsorPill || !sponsorPillText) return;
    if (!sponsorsMap) {
      sponsorPill.classList.add('hidden');
      return;
    }
    const found = sponsorsMap.get(code.trim().toLowerCase());
    if (found) {
      sponsorPillText.textContent = `Comercio vinculado: ${found}`;
      sponsorPill.classList.remove('hidden');
    } else {
      sponsorPill.classList.add('hidden');
    }
  }

  // --- Construcción del objeto QR (Nivel H - 30% corrección de error) ---
  function createQrMatrix(text) {
    if (typeof window.qrcode !== 'function') {
      throw new Error('No se encontró la librería qrcode.');
    }
    const qr = window.qrcode(0, 'H');
    qr.addData(text, 'Byte');
    qr.make();
    return qr;
  }

  /**
   * Dibuja el QR en un canvas con píxeles exactos (cero desenfoque / anti-aliasing)
   * ajustando la resolución final al múltiplo exacto más cercano a targetPx.
   */
  function renderQrToCanvas(qr, canvas, targetPx) {
    const moduleCount = qr.getModuleCount();
    const totalModules = moduleCount + QUIET_ZONE_MODULES * 2;
    const cellSize = Math.max(1, Math.floor(targetPx / totalModules));
    const exactSize = cellSize * totalModules;

    canvas.width = exactSize;
    canvas.height = exactSize;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Fondo blanco puro (quiet zone)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exactSize, exactSize);

    // Módulos en negro puro (#000000) para máximo contraste de escaneo
    ctx.fillStyle = '#000000';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + QUIET_ZONE_MODULES) * cellSize;
          const y = (r + QUIET_ZONE_MODULES) * cellSize;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }

    return exactSize;
  }

  function getExactExportDimensions(qr, requestedPx) {
    const totalModules = qr.getModuleCount() + QUIET_ZONE_MODULES * 2;
    const cellSize = Math.max(1, Math.floor(requestedPx / totalModules));
    return cellSize * totalModules;
  }

  function updateResolutionLabels() {
    if (!currentQrInstance) return;
    const requested = Number(selectResolution.value) || 4096;
    const exactPx = getExactExportDimensions(currentQrInstance, requested);
    downloadBtnLabel.textContent = `Descargar PNG (${exactPx} × ${exactPx} px)`;
    metaBar.textContent = `Matriz: ${currentQrInstance.getModuleCount()}×${currentQrInstance.getModuleCount()} módulos · Exportación sin pérdida: ${exactPx} × ${exactPx} px (PNG)`;
  }

  function generateQrForCode(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) {
      errorText.classList.remove('hidden');
      inputCodigo.focus();
      return;
    }

    errorText.classList.add('hidden');
    currentCode = code;
    currentUrl = `${BASE_URL}${encodeURIComponent(code)}`;

    try {
      currentQrInstance = createQrMatrix(currentUrl);
      renderQrToCanvas(currentQrInstance, previewCanvas, 640);

      urlLink.href = currentUrl;
      urlLink.textContent = currentUrl;
      openUrlBtn.href = currentUrl;

      updateResolutionLabels();
      updateSponsorBadge(code);

      resultSection.classList.remove('hidden');
    } catch (err) {
      console.error('Error generando QR:', err);
      errorText.textContent = 'No se pudo generar el código QR. Verificá el código ingresado.';
      errorText.classList.remove('hidden');
    }
  }

  // --- Descarga PNG en máxima resolución ---
  function downloadHighResPng() {
    if (!currentQrInstance || !currentCode) return;

    const requested = Number(selectResolution.value) || 4096;
    const offscreen = document.createElement('canvas');
    const exactSize = renderQrToCanvas(currentQrInstance, offscreen, requested);

    const safeCode = currentCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `QR_VIDA_codigo_${safeCode}_${exactSize}px.png`;

    const triggerDownload = (href, revokeAfter) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (revokeAfter) {
        setTimeout(() => URL.revokeObjectURL(href), 2500);
      }
    };

    if (typeof offscreen.toBlob === 'function') {
      offscreen.toBlob((blob) => {
        if (blob) {
          triggerDownload(URL.createObjectURL(blob), true);
        } else {
          triggerDownload(offscreen.toDataURL('image/png'), false);
        }
      }, 'image/png');
    } else {
      triggerDownload(offscreen.toDataURL('image/png'), false);
    }
  }

  // --- Event Listeners ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateQrForCode(inputCodigo.value);
  });

  inputCodigo.addEventListener('input', () => {
    errorText.classList.add('hidden');
  });

  selectResolution.addEventListener('change', updateResolutionLabels);

  downloadBtn.addEventListener('click', downloadHighResPng);

  copyUrlBtn.addEventListener('click', async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      copyUrlBtn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiada!';
      setTimeout(() => {
        copyUrlBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar URL';
      }, 1800);
    } catch (_) {
      // Fallback
    }
  });

  // Cargar catálogo opcional de nombres de comercios
  loadSponsorsLookup();

  // Si la propia app recibe ?codigo=XXX en la URL, generar automáticamente
  const urlParams = new URLSearchParams(window.location.search);
  const initialCode = urlParams.get('codigo') || urlParams.get('code') || '';
  if (initialCode.trim()) {
    inputCodigo.value = initialCode.trim();
    generateQrForCode(initialCode.trim());
  }
});
