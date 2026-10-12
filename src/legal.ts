// Documentos legales de Fixgo (publicados en el sitio). Se abren en el navegador del teléfono.
// Las tiendas exigen que estos links estén dentro de la app: en el ingreso, en Perfil y en la compra de Pro.
export const URL_TERMINOS = 'https://www.fixgo.ar/terminos-condiciones.html'
export const URL_PRIVACIDAD = 'https://www.fixgo.ar/politica-privacidad.html'
// Botón de baja de servicio (Disposición 954/2025). La norma habla de "páginas web y canales
// digitales"; no nombra apps, pero como Pro se vende adentro de la app, el acceso va también acá.
export const URL_BAJA = 'https://www.fixgo.ar/baja.html'

export function abrirLegal(cual: 'terminos' | 'privacidad' | 'baja') {
  try {
    window.open(cual === 'terminos' ? URL_TERMINOS : cual === 'baja' ? URL_BAJA : URL_PRIVACIDAD, '_blank')
  } catch (e) {
    console.warn('No se pudo abrir el documento:', e)
  }
}
