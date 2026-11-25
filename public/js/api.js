/* TÓPICO SMART QR — Cliente HTTP del API */
const API = (function () {
  const CLAVE = 'topico_qr_token';
  const token = () => localStorage.getItem(CLAVE);
  const guardarToken = (t) => localStorage.setItem(CLAVE, t);
  const limpiarToken = () => localStorage.removeItem(CLAVE);
  let modoDemo = new URLSearchParams(location.search).has('demo');
  let avisadoDemo = false;

  async function usarDemo(ruta, opciones) {
    if (typeof Demo === 'undefined') throw new Error('El servicio no está disponible.');
    if (!avisadoDemo) {
      avisadoDemo = true;
      if (window.UI) UI.toast('Modo demostración: los datos se guardan en este navegador.', 'info', 'Sin conexión al servidor');
    }
    const resultado = await Demo.peticion(ruta, opciones);
    if (resultado && resultado.error) throw new Error(resultado.error);
    return resultado;
  }

  async function peticion(ruta, { metodo = 'GET', cuerpo, archivo = false } = {}) {
    const opciones = { metodo, cuerpo, archivo };
    if (modoDemo) return usarDemo(ruta, opciones);
    const headers = {};
    if (token()) headers.Authorization = `Bearer ${token()}`;
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    let respuesta;
    try {
      respuesta = await fetch(`/api${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
      });
    } catch (e) {
      modoDemo = true;
      return usarDemo(ruta, opciones);
    }

    if ([502, 503, 504].includes(respuesta.status)) {
      modoDemo = true;
      return usarDemo(ruta, opciones);
    }

    if (respuesta.status === 401 && !ruta.startsWith('/auth/login')) {
      limpiarToken();
      window.dispatchEvent(new CustomEvent('sesion:expirada'));
    }
    if (!respuesta.ok) {
      let mensaje = `Error ${respuesta.status}`;
      try {
        const datos = await respuesta.json();
        if (datos.error) mensaje = datos.error;
      } catch (_) { /* respuesta no JSON */ }
      throw new Error(mensaje);
    }
    if (archivo) return respuesta.blob();
    return respuesta.json();
  }

  const get = (r, opciones = {}) => peticion(r, opciones);
  const post = (r, cuerpo) => peticion(r, { metodo: 'POST', cuerpo });
  const put = (r, cuerpo) => peticion(r, { metodo: 'PUT', cuerpo });
  const patch = (r, cuerpo) => peticion(r, { metodo: 'PATCH', cuerpo });
  const del = (r) => peticion(r, { metodo: 'DELETE' });
  const descargar = (r) => peticion(r, { archivo: true });

  async function guardarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return { token, guardarToken, limpiarToken, get, post, put, patch, del, descargar, guardarBlob };
})();
