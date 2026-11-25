/* Despliegue manual en Netlify usando la API (sin CLI ni GitHub link) */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOKEN = process.env.NETLIFY_TOKEN;
const SITE_ID = process.env.NETLIFY_SITE_ID;
const CARPETA = path.join(__dirname, '..', 'public');
const BASE = 'https://api.netlify.com/api/v1';

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json' };

function archivos(dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    const rel = base ? `${base}/${e.name}` : e.name;
    return e.isDirectory() ? archivos(ruta, rel) : [rel];
  });
}

async function api(ruta, { metodo = 'GET', cuerpo, crudo = false, tipo = 'application/json' } = {}) {
  const headers = { Authorization: `Bearer ${TOKEN}` };
  let body;
  if (cuerpo !== undefined) {
    if (crudo) { headers['Content-Type'] = tipo; body = cuerpo; }
    else { headers['Content-Type'] = 'application/json'; body = JSON.stringify(cuerpo); }
  }
  const res = await fetch(`${BASE}${ruta}`, { method: metodo, headers, body });
  const texto = await res.text();
  let datos;
  try { datos = JSON.parse(texto); } catch (_) { datos = texto; }
  if (!res.ok) throw new Error(`${metodo} ${ruta} → ${res.status}: ${texto.slice(0, 300)}`);
  return datos;
}

(async () => {
  const lista = archivos(CARPETA);
  const files = {};
  for (const rel of lista) {
    const buf = fs.readFileSync(path.join(CARPETA, rel));
    files[rel] = crypto.createHash('sha1').update(buf).digest('hex');
  }
  console.log(`Archivos a subir: ${lista.length}`);

  const deploy = await api(`/sites/${SITE_ID}/deploys`, {
    metodo: 'POST', cuerpo: { files, draft: false, async: false }
  });
  console.log(`Deploy creado: ${deploy.id} estado=${deploy.state}`);

  for (const rel of lista) {
    const buf = fs.readFileSync(path.join(CARPETA, rel));
    await api(`/deploys/${deploy.id}/files/${encodeURIComponent(rel)}`, {
      metodo: 'PUT', cuerpo: buf, crudo: true, tipo: MIME[path.extname(rel)] || 'application/octet-stream'
    });
  }
  console.log('Archivos subidos.');

  let publicado = false;
  for (const intento of [
    () => api(`/deploys/${deploy.id}/deploy`, { metodo: 'POST', cuerpo: {} }),
    () => api(`/deploys/${deploy.id}`, { metodo: 'PUT', cuerpo: { state: 'ready' } })
  ]) {
    try { const r = await intento(); console.log(`Publicado: ${r.state || 'ok'}`); publicado = true; break; }
    catch (e) { console.log(`Publicación intento alterno: ${e.message.slice(0, 120)}`); }
  }
  const sitio = await api(`/sites/${SITE_ID}`);
  console.log(`URL: ${sitio.ssl_url}`);
  console.log(`DeployURL: ${deploy.deploy_ssl_url || sitio.deploy_url}`);
  console.log(`PUBLICADO=${publicado}`);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
