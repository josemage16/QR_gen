# QR_gen — Generador de QR para Landing Sorteos VIDA

Aplicación web HTML/CSS/JS para generar y descargar códigos QR en **formato PNG de máxima resolución** (hasta **8192 × 8192 px**, píxeles exactos sin desenfoque y corrección de error nivel **H**) apuntando a:

`https://josemage16.github.io/Landing_Sorteos_BV_v2/?codigo=XXX`

- **Repositorio GitHub:** https://github.com/josemage16/QR_gen

## Funcionalidades

- Solicita el código con el prompt **`INTRODUZCA CODIGO`**.
- Genera el código QR al instante 100% en el navegador (librería `qrcode.min.js` incluida localmente, funciona incluso sin conexión).
- Muestra el enlace destino, verifica opcionalmente si el código coincide con un comercio en la planilla de sponsors y permite copiar o probar el enlace.
- Descarga el QR en **`.png`** en alta resolución (`2048 px`, `4096 px` por defecto, o `8192 px` para impresión de gran formato).

## Publicar en GitHub Pages

1. Entrá a https://github.com/josemage16/QR_gen/settings/pages
2. En **Source**, seleccioná **Deploy from a branch** → rama `main` → `/ (root)` → **Save**.
3. Quedará publicada en `https://josemage16.github.io/QR_gen/`.
