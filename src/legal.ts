// Documentos legales de Fixgo (publicados en el sitio). Se abren en el navegador del teléfono.
// Las tiendas exigen que estos links estén dentro de la app: en el ingreso, en Perfil y en la compra de Pro.
export const URL_TERMINOS = 'https://www.fixgo.ar/terminos-condiciones.html'
export const URL_PRIVACIDAD = 'https://www.fixgo.ar/politica-privacidad.html'

export function abrirLegal(cual: 'terminos' | 'privacidad') {
  try {
    window.open(cual === 'terminos' ? URL_TERMINOS : URL_PRIVACIDAD, '_blank')
  } catch (e) {
    console.warn('No se pudo abrir el documento:', e)
  }
}
