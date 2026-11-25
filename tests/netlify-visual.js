const puppeteer = require('puppeteer-core');
const URL = 'https://brilliant-haupia-462c7a.netlify.app/';
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const fallos = [];
  p.on('requestfailed', (r) => fallos.push(`${r.url()} ${r.failure()?.errorText}`));
  p.on('response', (r) => { if (r.status() >= 400) fallos.push(`${r.status()} ${r.url()}`); });
  await p.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  const datos = await p.evaluate(() => {
    const btn = document.querySelector('#form-login button[type=submit]');
    const h2 = document.querySelector('.login-card__brand h2');
    const side = document.querySelector('.login-side');
    const icono = document.querySelector('.brand-icon');
    return {
      fondoBoton: getComputedStyle(btn).backgroundImage,
      fuenteTitulo: getComputedStyle(h2).fontFamily,
      fondoLateral: getComputedStyle(side).backgroundImage,
      iconoVisible: icono.getBoundingClientRect().width > 0,
      anchoTarjeta: document.querySelector('.login-card').getBoundingClientRect().width
    };
  });
  console.log(JSON.stringify(datos, null, 2));
  console.log('RECURSOS_CON_ERROR=' + fallos.length);
  if (fallos.length) console.log(fallos.slice(0, 10).join('\n'));
  await p.screenshot({ path: 'docs/netlify-login.png', fullPage: true });
  await b.close();
  const ok = datos.fondoBoton.includes('gradient') && datos.fondoLateral.includes('gradient') && datos.iconoVisible && fallos.length === 0;
  console.log(ok ? 'OK: diseno completo cargado en Netlify' : 'FAIL: faltan estilos o recursos');
  process.exit(ok ? 0 : 1);
})();
