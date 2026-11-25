const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 980 });
  await p.goto('https://brilliant-haupia-462c7a.netlify.app/', { waitUntil: 'networkidle0', timeout: 60000 });
  await p.type('#login-usuario', 'admin');
  await p.type('#login-password', 'Admin123!');
  await p.click('#form-login button[type=submit]');
  await p.waitForSelector('#app-shell', { visible: true, timeout: 30000 });
  await p.waitForSelector('#vista-contenido .stat-card', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  await p.screenshot({ path: 'docs/netlify-dashboard.png', fullPage: true });
  console.log('Captura guardada: docs/netlify-dashboard.png');
  await b.close();
})();
