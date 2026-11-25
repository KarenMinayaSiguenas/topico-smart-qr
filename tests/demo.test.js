/* Prueba del modo demostración (localStorage) en navegador */
const puppeteer = require('puppeteer-core');
const BASE = process.env.DEMO_URL || 'http://127.0.0.1:3100/?demo=1';
const VISTAS = ['dashboard', 'medicamentos', 'lotes', 'inventario', 'movimientos', 'alertas', 'reportes', 'escaner', 'usuarios', 'perfil'];
const resultados = [];
const check = (n, ok, d = '') => { resultados.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`); };

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    const errores = [];
    p.on('pageerror', (e) => errores.push(e.message));
    await p.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
    await p.type('#login-usuario', 'admin');
    await p.type('#login-password', 'Admin123!');
    await p.click('#form-login button[type=submit]');
    await p.waitForSelector('#app-shell', { visible: true, timeout: 20000 });
    await p.waitForSelector('#vista-contenido .stat-card', { timeout: 20000 });
    check('Login en modo demo', true);

    for (const v of VISTAS) {
      await p.evaluate((x) => { location.hash = '#/' + x; }, v);
      try {
        await p.waitForFunction(() => document.querySelector('#vista-contenido .view') && !document.querySelector('#vista-contenido .spinner'), { timeout: 12000 });
        await new Promise((r) => setTimeout(r, 200));
        const txt = await p.$eval('#vista-contenido', (e) => e.textContent);
        check(`Vista ${v}`, txt.length > 80 && !/No se pudo cargar/.test(txt));
      } catch (e) { check(`Vista ${v}`, false, e.message); }
    }

    // QR real generado en el navegador
    await p.evaluate(() => { location.hash = '#/lotes'; });
    await p.waitForSelector('[data-action=ver-qr]');
    await p.click('[data-action=ver-qr]');
    await p.waitForSelector('#qr-img', { timeout: 20000 });
    check('QR PNG generado en demo', await p.$eval('#qr-img', (i) => i.src.startsWith('data:image/png')));
    await p.click('#modal-root [data-cerrar-modal]');
    await new Promise((r) => setTimeout(r, 250));

    // Datos guardados en localStorage
    const datos = await p.evaluate(() => {
      const e = JSON.parse(localStorage.getItem('topico_qr_demo_v2'));
      return { meds: e.medicamentos.length, lotes: e.lotes.length, movs: e.movimientos.length, alertas: e.alertas.length };
    });
    check('Datos persistidos en localStorage', datos.meds >= 6 && datos.lotes >= 9 && datos.alertas > 0, JSON.stringify(datos));
    check('Sin errores JavaScript', errores.length === 0, errores.slice(0, 2).join(' | '));
  } finally { await b.close(); }
  const ok = resultados.filter(Boolean).length;
  console.log(`\nRESULTADO DEMO: ${ok}/${resultados.length} verificaciones correctas.`);
  process.exit(ok === resultados.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
