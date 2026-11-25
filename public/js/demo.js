/* TÓPICO SMART QR — Modo demostración con localStorage (cuando el API no está disponible) */
const Demo = (function () {
  const CLAVE = 'topico_qr_demo_v2';
  const hoyISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const offset = (dias) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + dias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const diasHasta = (f) => Math.round((new Date(`${String(f).slice(0, 10)}T12:00:00`) - new Date(`${hoyISO()}T12:00:00`)) / 86400000);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)));
  const uid = (e, nombre) => Math.max(0, ...e[nombre].map((x) => Number(x.id) || 0)) + 1;

  function semilla() {
    const cats = [
      { id: 1, nombre: 'Analgésicos', descripcion: 'Alivio del dolor y la fiebre', activo: true },
      { id: 2, nombre: 'Antibióticos', descripcion: 'Infecciones bacterianas', activo: true },
      { id: 3, nombre: 'Vitaminas', descripcion: 'Suplementos nutricionales', activo: true },
      { id: 4, nombre: 'Respiratorio', descripcion: 'Vías respiratorias', activo: true },
      { id: 5, nombre: 'Antihistamínicos', descripcion: 'Tratamiento de alergias', activo: true }
    ];
    const meds = [
      { id: 1, codigo: 'MED-001', nombre: 'Paracetamol', categoria_id: 1, concentracion: '500 mg', presentacion: 'Tabletas', laboratorio: 'Farmacéutica Nacional', descripcion: 'Analgésico y antipirético', activo: true },
      { id: 2, codigo: 'MED-002', nombre: 'Amoxicilina', categoria_id: 2, concentracion: '500 mg', presentacion: 'Cápsulas', laboratorio: 'Antibióticos del Sur', descripcion: 'Antibiótico de amplio espectro', activo: true },
      { id: 3, codigo: 'MED-003', nombre: 'Vitamina C', categoria_id: 3, concentracion: '1 g', presentacion: 'Efervescente', laboratorio: 'VitaSalud', descripcion: 'Ácido ascórbico', activo: true },
      { id: 4, codigo: 'MED-004', nombre: 'Ibuprofeno', categoria_id: 1, concentracion: '400 mg', presentacion: 'Tabletas', laboratorio: 'Farmacéutica Nacional', descripcion: 'Antiinflamatorio', activo: true },
      { id: 5, codigo: 'MED-005', nombre: 'Salbutamol', categoria_id: 4, concentracion: '100 mcg', presentacion: 'Inhalador', laboratorio: 'Respira Pharma', descripcion: 'Broncodilatador', activo: true },
      { id: 6, codigo: 'MED-006', nombre: 'Loratadina', categoria_id: 5, concentracion: '10 mg', presentacion: 'Tabletas', laboratorio: 'Antihist Pharma', descripcion: 'Antialérgico', activo: true }
    ];
    const planes = [
      [1, 'L-PAR-2601', 300, 120, 30, 'A-01'], [1, 'L-PAR-2602', 180, 40, 30, 'A-02'],
      [2, 'L-AMX-2601', 25, 18, 25, 'B-01'], [3, 'L-VTC-2601', 75, 45, 20, 'C-01'],
      [3, 'L-VTC-2602', 5, 12, 20, 'C-02'], [4, 'L-IBU-2501', -12, 8, 20, 'A-03'],
      [5, 'L-SAL-2601', 400, 0, 10, 'D-01'], [5, 'L-SAL-2509', -40, 0, 10, 'D-02'],
      [6, 'L-LOR-2601', 110, 60, 15, 'E-01']
    ];
    const lotes = planes.map((p, i) => ({ id: i + 1, medicamento_id: p[0], numero_lote: p[1], fecha_vencimiento: offset(p[2]), cantidad: p[3], stock_minimo: p[4], ubicacion: p[5], qr_token: uuid(), activo: true }));
    const movimientos = lotes.filter((l) => l.cantidad > 0).map((l, i) => ({
      id: i + 1, fecha: new Date(Date.now() - (40 - i * 4) * 86400000).toISOString(), tipo: 'entrada',
      medicamento_id: l.medicamento_id, lote_id: l.id, cantidad: l.cantidad, cantidad_antes: 0, cantidad_despues: l.cantidad,
      motivo: 'Stock inicial', observaciones: 'Carga inicial', usuario_nombre: 'Administrador del Tópico',
      lote_numero: l.numero_lote, medicamento_nombre: meds.find((m) => m.id === l.medicamento_id).nombre
    }));
    const estado = {
      categorias: cats, medicamentos: meds, lotes, movimientos, alertas: [],
      usuarios: [
        { id: 1, nombre: 'Administrador del Tópico', username: 'admin', password: 'Admin123!', rol: 'admin', email: 'admin@topico.local' },
        { id: 2, nombre: 'Personal del Tópico', username: 'personal', password: 'Personal123!', rol: 'personal', email: 'personal@topico.local' }
      ],
      sesion: null, contador: 100
    };
    evaluar(estado);
    return estado;
  }

  function cargar() {
    let e;
    try { e = JSON.parse(localStorage.getItem(CLAVE)); } catch (_) { e = null; }
    if (!e || !Array.isArray(e.medicamentos)) { e = semilla(); localStorage.setItem(CLAVE, JSON.stringify(e)); }
    return e;
  }
  const guardar = (e) => localStorage.setItem(CLAVE, JSON.stringify(e));

  function evaluar(e) {
    e.alertas.forEach((a) => { a.resuelta = true; a.resuelta_at = a.resuelta_at || new Date().toISOString(); });
    const nuevo = [];
    for (const l of e.lotes) {
      if (!l.activo || l.cantidad <= 0) continue;
      const med = e.medicamentos.find((m) => m.id === l.medicamento_id);
      if (!med || !med.activo) continue;
      const etiqueta = `${med.nombre} · Lote ${l.numero_lote}`;
      const d = diasHasta(l.fecha_vencimiento);
      let tipo = null, nivel = 'advertencia', titulo = '';
      if (d < 0) { tipo = 'vencido'; nivel = 'critico'; titulo = 'Medicamento vencido'; }
      else if (d <= 7) { tipo = 'vencimiento_7'; nivel = 'critico'; titulo = 'Vence en 7 días o menos'; }
      else if (d <= 30) { tipo = 'vencimiento_30'; titulo = 'Vence en 30 días o menos'; }
      else if (d <= 90) { tipo = 'vencimiento_90'; nivel = 'info'; titulo = 'Vence en 90 días'; }
      if (tipo) nuevo.push({ clave: `${tipo}:${l.id}`, tipo, nivel, titulo, mensaje: `${etiqueta} · vence ${l.fecha_vencimiento} (${d} días). Quedan ${l.cantidad} unidad(es).`, medicamento_id: med.id, lote_id: l.id });
      if (l.cantidad <= l.stock_minimo) nuevo.push({ clave: `stock_bajo:${l.id}`, tipo: 'stock_bajo', nivel: 'advertencia', titulo: 'Stock en nivel mínimo', mensaje: `${etiqueta} tiene ${l.cantidad} unidad(es); mínimo ${l.stock_minimo}.`, medicamento_id: med.id, lote_id: l.id });
    }
    const claves = new Set(nuevo.map((a) => a.clave));
    e.alertas = e.alertas.filter((a) => !claves.has(a.clave));
    for (const a of nuevo) e.alertas.push({ id: ++e.contador, ...a, leida: false, resuelta: false, created_at: new Date().toISOString(), resuelta_at: null });
    if (e.alertas.length > 200) e.alertas = e.alertas.slice(-200);
  }

  const resumenAlertas = (e) => ({
    activas: e.alertas.filter((a) => !a.resuelta).length,
    criticas: e.alertas.filter((a) => !a.resuelta && a.nivel === 'critico').length,
    advertencias: e.alertas.filter((a) => !a.resuelta && a.nivel === 'advertencia').length,
    informativas: e.alertas.filter((a) => !a.resuelta && a.nivel === 'info').length,
    historial: e.alertas.length
  });

  function medConDatos(e, m) {
    const lots = e.lotes.filter((l) => l.medicamento_id === m.id && l.activo);
    return {
      ...m, categoria_nombre: (e.categorias.find((c) => c.id === m.categoria_id) || {}).nombre || 'Sin categoría',
      stock_total: lots.reduce((s, l) => s + l.cantidad, 0), total_lotes: lots.length,
      proximo_vencimiento: lots.filter((l) => l.cantidad > 0).map((l) => l.fecha_vencimiento).sort()[0] || null
    };
  }
  const loteConDatos = (e, l) => {
    const m = e.medicamentos.find((x) => x.id === l.medicamento_id) || {};
    return { ...l, medicamento_nombre: m.nombre || '—', medicamento_codigo: m.codigo || '—', categoria_nombre: (e.categorias.find((c) => c.id === m.categoria_id) || {}).nombre || '—', concentracion: m.concentracion, presentacion: m.presentacion, laboratorio: m.laboratorio };
  };

  async function qrPNG(contenido) {
    if (typeof qrcode === 'undefined') return '';
    const qr = qrcode(0, 'M');
    qr.addData(contenido); qr.make();
    const img = new Image();
    img.src = qr.createDataURL(6, 2);
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  }

  const error = (mensaje, estado = 400) => ({ error: mensaje, estado });
  const texto = (v, n, req = true) => { const s = String(v ?? '').trim(); if (req && !s) throw error(`El campo ${n} es obligatorio.`); return s; };
  const entero = (v, n, min = 0) => { const x = Number(v); if (!Number.isInteger(x) || x < min) throw error(`${n} debe ser un número entero ≥ ${min}.`); return x; };

  async function peticion(ruta, { metodo = 'GET', cuerpo = {}, archivo = false } = {}) {
    const e = cargar();
    const url = new URL(ruta, 'http://demo.local');
    const p = url.pathname.split('/').filter(Boolean);
    const q = url.searchParams;

    // ------------------ Autenticación ------------------
    if (p[0] === 'auth' && p[1] === 'login' && metodo === 'POST') {
      const u = e.usuarios.find((x) => x.username.toLowerCase() === String(cuerpo.username || '').toLowerCase());
      if (!u || u.password !== cuerpo.password) return error('Usuario o contraseña incorrectos.', 401);
      e.sesion = { id: u.id, nombre: u.nombre, username: u.username, rol: u.rol, email: u.email };
      guardar(e);
      return { token: 'demo-token', usuario: e.sesion };
    }
    if (p[0] === 'auth' && p[1] === 'me') {
      if (!e.sesion) return error('Debe iniciar sesión.', 401);
      return e.sesion;
    }
    if (p[0] === 'auth' && p[1] === 'cambiar-password' && metodo === 'POST') {
      const u = e.usuarios.find((x) => x.id === e.sesion?.id);
      if (!u || u.password !== cuerpo.actual) return error('La contraseña actual no es correcta.');
      if (String(cuerpo.nueva || '').length < 8) return error('La nueva contraseña debe tener al menos 8 caracteres.');
      u.password = cuerpo.nueva; guardar(e); return { mensaje: 'Contraseña actualizada correctamente.' };
    }

    // ------------------ Catálogos ------------------
    if (p[0] === 'catalogo' && p[1] === 'categorias') {
      if (metodo === 'GET') return e.categorias;
      const nombre = texto(cuerpo.nombre, 'Nombre de la categoría');
      if (metodo === 'POST') { const c = { id: uid(e, 'categorias'), nombre, descripcion: cuerpo.descripcion || '', activo: true }; e.categorias.push(c); guardar(e); return c; }
      const c = e.categorias.find((x) => x.id === Number(p[2]));
      if (metodo === 'PUT' && c) { Object.assign(c, { nombre, descripcion: cuerpo.descripcion || '' }); guardar(e); return c; }
      if (metodo === 'DELETE' && c) { e.categorias = e.categorias.filter((x) => x !== c); guardar(e); return { mensaje: 'Categoría eliminada.' }; }
      return error('Categoría no encontrada.', 404);
    }

    if (p[0] === 'catalogo' && p[1] === 'medicamentos') {
      if (p[2] && p[3] === 'estado' && metodo === 'PATCH') {
        const m = e.medicamentos.find((x) => x.id === Number(p[2]));
        if (!m) return error('Medicamento no encontrado.', 404);
        m.activo = Boolean(cuerpo.activo); guardar(e); evaluar(e); guardar(e); return m;
      }
      if (p[2] && metodo === 'GET') {
        const m = e.medicamentos.find((x) => x.id === Number(p[2]));
        if (!m) return error('Medicamento no encontrado.', 404);
        return { ...medConDatos(e, m), lotes: e.lotes.filter((l) => l.medicamento_id === m.id).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)) };
      }
      if (metodo === 'GET') {
        const qq = (q.get('q') || '').toLowerCase();
        const estado = q.get('estado') || 'activos';
        return e.medicamentos.filter((m) =>
          (!qq || `${m.nombre} ${m.codigo} ${m.laboratorio}`.toLowerCase().includes(qq)) &&
          (!q.get('categoria') || m.categoria_id === Number(q.get('categoria'))) &&
          (estado === 'todos' || (estado === 'activos' ? m.activo : !m.activo))
        ).map((m) => medConDatos(e, m));
      }
      const datos = {
        codigo: texto(cuerpo.codigo, 'Código').toUpperCase(), nombre: texto(cuerpo.nombre, 'Nombre'),
        categoria_id: cuerpo.categoria_id ? Number(cuerpo.categoria_id) : null,
        concentracion: cuerpo.concentracion || '', presentacion: cuerpo.presentacion || '',
        laboratorio: cuerpo.laboratorio || '', descripcion: cuerpo.descripcion || ''
      };
      if (e.medicamentos.some((m) => m.codigo === datos.codigo && (!cuerpo.id || m.id !== Number(cuerpo.id)))) return error('El código de medicamento ya está registrado.');
      if (metodo === 'POST') { const m = { id: uid(e, 'medicamentos'), ...datos, activo: true }; e.medicamentos.push(m); guardar(e); evaluar(e); guardar(e); return m; }
      const m = e.medicamentos.find((x) => x.id === Number(p[2] || cuerpo.id));
      if (m) { Object.assign(m, datos); guardar(e); evaluar(e); guardar(e); return m; }
      return error('Medicamento no encontrado.', 404);
    }

    if (p[0] === 'catalogo' && p[1] === 'lotes') {
      if (p[2] && p[3] === 'qr' && metodo === 'GET') {
        const l = e.lotes.find((x) => x.id === Number(p[2]));
        if (!l) return error('Lote no encontrado.', 404);
        const contenido = `${location.origin}/escanear?t=${l.qr_token}`;
        return { token: l.qr_token, contenido, imagen: await qrPNG(contenido), numero_lote: l.numero_lote };
      }
      if (p[2] && p[3] === 'estado' && metodo === 'PATCH') {
        const l = e.lotes.find((x) => x.id === Number(p[2]));
        if (!l) return error('Lote no encontrado.', 404);
        l.activo = Boolean(cuerpo.activo); guardar(e); evaluar(e); guardar(e); return l;
      }
      if (p[2] && metodo === 'GET') {
        const l = e.lotes.find((x) => x.id === Number(p[2]));
        return l ? loteConDatos(e, l) : error('Lote no encontrado.', 404);
      }
      if (metodo === 'GET') {
        const estado = q.get('estado');
        return e.lotes.filter((l) =>
          (!q.get('medicamento_id') || l.medicamento_id === Number(q.get('medicamento_id'))) &&
          (!estado || estado === 'todos' || (estado === 'activos' ? l.activo : !l.activo))
        ).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)).map((l) => loteConDatos(e, l));
      }
      if (metodo === 'POST') {
        const numero_lote = texto(cuerpo.numero_lote, 'Número de lote').toUpperCase();
        const medicamento_id = entero(cuerpo.medicamento_id, 'Medicamento', 1);
        if (e.lotes.some((l) => l.medicamento_id === medicamento_id && l.numero_lote === numero_lote)) return error('Ya existe un lote con ese número para este medicamento.');
        const l = { id: uid(e, 'lotes'), medicamento_id, numero_lote, fecha_vencimiento: texto(cuerpo.fecha_vencimiento, 'Fecha de vencimiento'), cantidad: entero(cuerpo.cantidad, 'Cantidad'), stock_minimo: entero(cuerpo.stock_minimo, 'Stock mínimo'), ubicacion: cuerpo.ubicacion || '', qr_token: uuid(), activo: true };
        e.lotes.push(l);
        e.movimientos.push({ id: ++e.contador, fecha: new Date().toISOString(), tipo: 'entrada', medicamento_id, lote_id: l.id, cantidad: l.cantidad, cantidad_antes: 0, cantidad_despues: l.cantidad, motivo: 'Registro de lote', observaciones: '', usuario_nombre: e.sesion?.nombre || 'Sistema', lote_numero: numero_lote, medicamento_nombre: e.medicamentos.find((m) => m.id === medicamento_id)?.nombre || '' });
        guardar(e); evaluar(e); guardar(e); return l;
      }
      const l = e.lotes.find((x) => x.id === Number(p[2] || cuerpo.id));
      if (l) {
        Object.assign(l, { numero_lote: texto(cuerpo.numero_lote, 'Número de lote').toUpperCase(), fecha_vencimiento: texto(cuerpo.fecha_vencimiento, 'Fecha'), stock_minimo: entero(cuerpo.stock_minimo, 'Stock mínimo'), ubicacion: cuerpo.ubicacion || '' });
        guardar(e); evaluar(e); guardar(e); return l;
      }
      return error('Lote no encontrado.', 404);
    }

    // ------------------ QR público ------------------
    if (p[0] === 'public' && p[1] === 'qr') {
      const l = e.lotes.find((x) => x.qr_token === p[2]);
      if (!l) return error('No se encontró ningún lote para este código QR.', 404);
      const m = e.medicamentos.find((x) => x.id === l.medicamento_id) || {};
      const d = diasHasta(l.fecha_vencimiento);
      return {
        ...loteConDatos(e, l), codigo: m.codigo, nombre: m.nombre, categoria: (e.categorias.find((c) => c.id === m.categoria_id) || {}).nombre || '',
        estado_vencimiento: d < 0 ? 'vencido' : d <= 7 ? 'vence_7' : d <= 30 ? 'vence_30' : d <= 90 ? 'vence_90' : 'vigente',
        dias_para_vencer: d, consultado_en: new Date().toISOString()
      };
    }
    if (p[0] === 'public' && p[1] === 'salud') return { ok: true, servicio: 'TÓPICO SMART QR (demo)', base_de_datos: 'localStorage', hora: new Date().toISOString() };

    // ------------------ Inventario ------------------
    if (p[0] === 'inventario' && p[1] === 'dashboard') {
      const activos = e.lotes.filter((l) => l.activo);
      const stats = {
        total_medicamentos: e.medicamentos.filter((m) => m.activo).length,
        unidades: activos.reduce((s, l) => s + l.cantidad, 0),
        stock_bajo: activos.filter((l) => l.cantidad > 0 && l.cantidad <= l.stock_minimo).length,
        proximos_vencer: activos.filter((l) => l.cantidad > 0 && diasHasta(l.fecha_vencimiento) >= 0 && diasHasta(l.fecha_vencimiento) <= 90).length,
        vencidos: activos.filter((l) => l.cantidad > 0 && diasHasta(l.fecha_vencimiento) < 0).length,
        agotados: e.medicamentos.filter((m) => m.activo && activos.filter((l) => l.medicamento_id === m.id).reduce((s, l) => s + l.cantidad, 0) === 0).length
      };
      const meses = [];
      for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); meses.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('es-PE', { month: 'short' }) }); }
      const porMes = meses.map((m) => ({ mes: m.key, entradas: e.movimientos.filter((x) => x.tipo === 'entrada' && String(x.fecha).slice(0, 7) === m.key).length, salidas: e.movimientos.filter((x) => x.tipo === 'salida' && String(x.fecha).slice(0, 7) === m.key).length }));
      const porCategoria = e.categorias.map((c) => ({ nombre: c.nombre, unidades: activos.filter((l) => e.medicamentos.find((m) => m.id === l.medicamento_id)?.categoria_id === c.id).reduce((s, l) => s + l.cantidad, 0), medicamentos: e.medicamentos.filter((m) => m.categoria_id === c.id).length }));
      const porTipo = ['entrada', 'salida', 'ajuste'].map((t) => ({ tipo: t, total: e.movimientos.filter((x) => x.tipo === t).length, unidades: e.movimientos.filter((x) => x.tipo === t).reduce((s, x) => s + x.cantidad, 0) }));
      return { stats, movimientos: [...e.movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8), graficas: { porMes, porCategoria: porCategoria.filter((c) => c.unidades > 0), porTipo }, alertas: e.alertas.filter((a) => !a.resuelta).slice(0, 6), resumenAlertas: resumenAlertas(e), fecha: hoyISO() };
    }

    if (p[0] === 'inventario' && p[1] === 'movimientos') {
      if (metodo === 'POST' && p[2] === 'entrada') {
        const cant = entero(cuerpo.cantidad, 'Cantidad', 1);
        const motivo = texto(cuerpo.motivo, 'Motivo');
        let l;
        if (cuerpo.lote_id) l = e.lotes.find((x) => x.id === Number(cuerpo.lote_id) && x.activo);
        else {
          const numero_lote = texto(cuerpo.numero_lote, 'Número de lote').toUpperCase();
          const medicamento_id = entero(cuerpo.medicamento_id, 'Medicamento', 1);
          if (e.lotes.some((x) => x.medicamento_id === medicamento_id && x.numero_lote === numero_lote)) return error('Ya existe ese número de lote. Seleccione el lote existente.');
          l = { id: uid(e, 'lotes'), medicamento_id, numero_lote, fecha_vencimiento: texto(cuerpo.fecha_vencimiento, 'Fecha de vencimiento'), cantidad: 0, stock_minimo: entero(cuerpo.stock_minimo, 'Stock mínimo'), ubicacion: cuerpo.ubicacion || '', qr_token: uuid(), activo: true };
          e.lotes.push(l);
        }
        if (!l) return error('El lote seleccionado no existe o está inactivo.');
        const antes = l.cantidad; l.cantidad += cant;
        e.movimientos.push({ id: ++e.contador, fecha: new Date().toISOString(), tipo: 'entrada', medicamento_id: l.medicamento_id, lote_id: l.id, cantidad: cant, cantidad_antes: antes, cantidad_despues: l.cantidad, motivo, observaciones: cuerpo.observaciones || '', usuario_nombre: e.sesion?.nombre || 'Sistema', lote_numero: l.numero_lote, medicamento_nombre: e.medicamentos.find((m) => m.id === l.medicamento_id)?.nombre || '' });
        guardar(e); evaluar(e); guardar(e);
        return { mensaje: `Entrada de ${cant} unidad(es) registrada correctamente.`, lote_id: l.id, lote_numero: l.numero_lote, cantidad: cant };
      }
      if (metodo === 'POST' && p[2] === 'salida') {
        const cant = entero(cuerpo.cantidad, 'Cantidad', 1);
        const medId = entero(cuerpo.medicamento_id, 'Medicamento', 1);
        let candidatos = e.lotes.filter((l) => l.medicamento_id === medId && l.activo && l.cantidad > 0).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));
        if (cuerpo.lote_id) {
          candidatos = candidatos.filter((l) => l.id === Number(cuerpo.lote_id));
          if (candidatos[0] && diasHasta(candidatos[0].fecha_vencimiento) < 0) return error(`El lote ${candidatos[0].numero_lote} venció el ${candidatos[0].fecha_vencimiento}. No se permite la salida de medicamentos vencidos.`);
        }
        const vigentes = candidatos.filter((l) => diasHasta(l.fecha_vencimiento) >= 0);
        if (vigentes.reduce((s, l) => s + l.cantidad, 0) < cant) return error('Existencias vigentes insuficientes.');
        let restante = cant; const usados = [];
        for (const l of vigentes) {
          if (restante <= 0) break;
          const tomar = Math.min(l.cantidad, restante);
          if (!tomar) continue;
          const antes = l.cantidad; l.cantidad -= tomar;
          e.movimientos.push({ id: ++e.contador, fecha: new Date().toISOString(), tipo: 'salida', medicamento_id: medId, lote_id: l.id, cantidad: tomar, cantidad_antes: antes, cantidad_despues: l.cantidad, motivo: texto(cuerpo.motivo, 'Motivo'), observaciones: cuerpo.observaciones || '', usuario_nombre: e.sesion?.nombre || 'Sistema', lote_numero: l.numero_lote, medicamento_nombre: e.medicamentos.find((m) => m.id === medId)?.nombre || '' });
          usados.push({ lote_id: l.id, numero_lote: l.numero_lote, fecha_vencimiento: l.fecha_vencimiento, cantidad: tomar });
          restante -= tomar;
        }
        guardar(e); evaluar(e); guardar(e);
        return { mensaje: `Salida de ${cant} unidad(es) registrada (FEFO).`, medicamento: e.medicamentos.find((m) => m.id === medId)?.nombre, solicitada: cant, lotes_usados: usados };
      }
      if (metodo === 'POST' && p[2] === 'ajuste') {
        const l = e.lotes.find((x) => x.id === Number(cuerpo.lote_id));
        if (!l) return error('Lote no encontrado.', 404);
        const nueva = entero(cuerpo.cantidad_nueva, 'Cantidad nueva');
        const antes = l.cantidad;
        if (nueva === antes) return error('La cantidad nueva es igual a la actual.');
        l.cantidad = nueva;
        e.movimientos.push({ id: ++e.contador, fecha: new Date().toISOString(), tipo: 'ajuste', medicamento_id: l.medicamento_id, lote_id: l.id, cantidad: Math.abs(nueva - antes), cantidad_antes: antes, cantidad_despues: nueva, motivo: texto(cuerpo.motivo, 'Motivo'), observaciones: cuerpo.observaciones || '', usuario_nombre: e.sesion?.nombre || 'Sistema', lote_numero: l.numero_lote, medicamento_nombre: e.medicamentos.find((m) => m.id === l.medicamento_id)?.nombre || '' });
        guardar(e); evaluar(e); guardar(e);
        return { mensaje: 'Ajuste de inventario registrado correctamente.', lote_id: l.id, numero_lote: l.numero_lote, anterior: antes, nueva };
      }
      const qq = (q.get('q') || '').toLowerCase();
      const filtered = [...e.movimientos].filter((m) =>
        (!qq || `${m.medicamento_nombre} ${m.lote_numero} ${m.usuario_nombre} ${m.motivo}`.toLowerCase().includes(qq)) &&
        (!q.get('tipo') || m.tipo === q.get('tipo')) &&
        (!q.get('desde') || String(m.fecha).slice(0, 10) >= q.get('desde')) &&
        (!q.get('hasta') || String(m.fecha).slice(0, 10) <= q.get('hasta'))
      ).sort((a, b) => b.fecha.localeCompare(a.fecha));
      return filtered.slice(0, Number(q.get('limite') || 300));
    }

    // ------------------ Alertas ------------------
    if (p[0] === 'alertas') {
      if (p[1] === 'resumen' && metodo === 'GET') return resumenAlertas(e);
      if (p[2] === 'leida' && metodo === 'PATCH') { const a = e.alertas.find((x) => x.id === Number(p[1])); if (a) { a.leida = true; guardar(e); } return a || error('Alerta no encontrada.', 404); }
      if (p[1] === 'leer-todas' && metodo === 'PATCH') { e.alertas.forEach((a) => { if (!a.resuelta) a.leida = true; }); guardar(e); return { mensaje: 'Alertas marcadas como leídas.' }; }
      if (p[1] === 'reevaluar' && metodo === 'POST') { evaluar(e); guardar(e); const n = e.alertas.filter((a) => !a.resuelta).length; return { mensaje: `Evaluación completada. ${n} alerta(s) vigente(s).`, activas: n }; }
      if (metodo === 'GET') {
        const historial = q.get('historial') === '1';
        const lista = e.alertas.filter((a) => historial || !a.resuelta).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map((a) => ({ ...a, medicamento_nombre: e.medicamentos.find((m) => m.id === a.medicamento_id)?.nombre || null, numero_lote: e.lotes.find((l) => l.id === a.lote_id)?.numero_lote || null }));
        return { alertas: lista, resumen: resumenAlertas(e) };
      }
    }

    // ------------------ Usuarios ------------------
    if (p[0] === 'usuarios') {
      if (metodo === 'GET') return e.usuarios.map(({ password, ...u }) => u);
      if (metodo === 'POST' && p[2] === undefined) {
        const username = texto(cuerpo.username, 'Usuario').toLowerCase();
        if (e.usuarios.some((u) => u.username === username)) return error('El usuario ya está registrado.');
        const u = { id: uid(e, 'usuarios'), nombre: texto(cuerpo.nombre, 'Nombre'), username, email: cuerpo.email || '', password: texto(cuerpo.password, 'Contraseña'), rol: ['admin', 'personal'].includes(cuerpo.rol) ? cuerpo.rol : 'personal', activo: true };
        e.usuarios.push(u); guardar(e); const { password, ...publico } = u; return publico;
      }
      if (p[2] && p[3] === 'password' && metodo === 'POST') { const u = e.usuarios.find((x) => x.id === Number(p[2])); if (!u) return error('Usuario no encontrado.', 404); u.password = texto(cuerpo.password, 'Contraseña'); guardar(e); return { mensaje: 'Contraseña restablecida.' }; }
      if (p[2] && metodo === 'PUT') { const u = e.usuarios.find((x) => x.id === Number(p[2])); if (u) { Object.assign(u, { nombre: texto(cuerpo.nombre, 'Nombre'), email: cuerpo.email || '', rol: cuerpo.rol, activo: cuerpo.activo !== false }); guardar(e); const { password, ...publico } = u; return publico; } }
      if (p[2] && metodo === 'DELETE') { e.usuarios = e.usuarios.filter((u) => u.id !== Number(p[2])); guardar(e); return { mensaje: 'Usuario eliminado.' }; }
    }

    // ------------------ Reportes ------------------
    if (p[0] === 'reportes') {
      const tipo = p[1] || 'inventario';
      const formato = q.get('formato') || 'json';
      let columnas = [], filas = [], titulo = '';
      if (tipo === 'inventario') {
        titulo = 'Reporte de Inventario General';
        columnas = [{ header: 'Código', key: 'codigo', ancho: 14 }, { header: 'Medicamento', key: 'nombre', ancho: 26 }, { header: 'Categoría', key: 'categoria', ancho: 20 }, { header: 'Concentración', key: 'concentracion', ancho: 16 }, { header: 'Presentación', key: 'presentacion', ancho: 16 }, { header: 'Laboratorio', key: 'laboratorio', ancho: 24 }, { header: 'Lotes', key: 'lotes', ancho: 10 }, { header: 'Unidades', key: 'unidades', ancho: 12 }];
        filas = e.medicamentos.map((m) => { const d = medConDatos(e, m); return { codigo: d.codigo, nombre: d.nombre, categoria: d.categoria_nombre, concentracion: d.concentracion, presentacion: d.presentacion, laboratorio: d.laboratorio, lotes: d.total_lotes, unidades: d.stock_total }; });
      } else if (tipo === 'stock-bajo') {
        titulo = 'Reporte de Stock Bajo';
        columnas = [{ header: 'Medicamento', key: 'medicamento', ancho: 26 }, { header: 'Lote', key: 'lote', ancho: 16 }, { header: 'Existencia', key: 'cantidad', ancho: 12 }, { header: 'Mínimo', key: 'minimo', ancho: 10 }, { header: 'Ubicación', key: 'ubicacion', ancho: 14 }, { header: 'Vencimiento', key: 'vencimiento', ancho: 16 }];
        filas = e.lotes.filter((l) => l.activo && l.cantidad <= l.stock_minimo).map((l) => ({ medicamento: e.medicamentos.find((m) => m.id === l.medicamento_id)?.nombre, lote: l.numero_lote, cantidad: l.cantidad, minimo: l.stock_minimo, ubicacion: l.ubicacion, vencimiento: l.fecha_vencimiento }));
      } else if (tipo === 'vencimientos') {
        titulo = 'Reporte de Vencimientos';
        columnas = [{ header: 'Medicamento', key: 'medicamento', ancho: 26 }, { header: 'Lote', key: 'lote', ancho: 16 }, { header: 'Vencimiento', key: 'vencimiento', ancho: 16 }, { header: 'Días', key: 'dias', ancho: 10 }, { header: 'Unidades', key: 'cantidad', ancho: 12 }];
        filas = e.lotes.filter((l) => l.activo && diasHasta(l.fecha_vencimiento) <= 90).map((l) => ({ medicamento: e.medicamentos.find((m) => m.id === l.medicamento_id)?.nombre, lote: l.numero_lote, vencimiento: l.fecha_vencimiento, dias: diasHasta(l.fecha_vencimiento), cantidad: l.cantidad }));
      } else {
        titulo = 'Reporte de Entradas y Salidas';
        columnas = [{ header: 'Fecha', key: 'fecha', ancho: 22 }, { header: 'Tipo', key: 'tipo', ancho: 12 }, { header: 'Medicamento', key: 'medicamento', ancho: 26 }, { header: 'Lote', key: 'lote', ancho: 16 }, { header: 'Cantidad', key: 'cantidad', ancho: 12 }, { header: 'Motivo', key: 'motivo', ancho: 24 }, { header: 'Usuario', key: 'usuario', ancho: 20 }];
        filas = e.movimientos.map((m) => ({ fecha: String(m.fecha).slice(0, 16).replace('T', ' '), tipo: m.tipo, medicamento: m.medicamento_nombre, lote: m.lote_numero, cantidad: m.cantidad, motivo: m.motivo, usuario: m.usuario_nombre }));
      }
      if (archivo) {
        const csv = [columnas.map((c) => c.header).join(';'), ...filas.map((f) => columnas.map((c) => String(f[c.key] ?? '').replace(/;/g, ',')).join(';'))].join('\n');
        return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      }
      return { titulo, columnas, filas, total: filas.length };
    }

    return error('Ruta no disponible en modo demostración.', 404);
  }

  return { peticion, cargar, guardar, semilla, evaluar };
})();
