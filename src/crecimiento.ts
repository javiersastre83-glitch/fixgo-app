// ─────────────────────────────────────────────────────────────────────────────
// Crecimiento: invitaciones que funcionan en la app instalada + pedido de reseña.
//
// Recorrido de una invitación (desde 09/2026):
//   1. "Invitar integrante" genera https://www.fixgo.ar/invitacion.html?codigo=XXXX
//   2. Esa página (sitio de marketing, repo fixgo-web) abre Fixgo si ya está instalada
//      (ar.fixgo.app://invitacion?codigo=XXXX) o manda a Google Play con el código
//      dentro del "referrer" (…&referrer=invitacion%3DXXXX%26utm_source%3Dinvitacion).
//   3a. App ya instalada → llega por appUrlOpen → procesarLinkEntrante().
//   3b. App recién instalada → al primer arranque leerReferrerInstalacion() lee el
//       referrer de Google Play y guarda el código.
//   3c. Respaldo manual → la persona pega el link o el código (extraerCodigoInvitacion).
//   4. App.tsx usa el código guardado en localStorage apenas hay sesión
//      (escucha el evento "fixgo-invitacion" por si ya estaba logueada).
// ─────────────────────────────────────────────────────────────────────────────
import { Capacitor, registerPlugin } from '@capacitor/core'

interface InstallReferrerPlugin { obtener(): Promise<{ referrer?: string }> }
interface ResenaPlugin { pedir(): Promise<{ mostrado?: boolean }> }
const InstallReferrer = registerPlugin<InstallReferrerPlugin>('InstallReferrer')
const Resena = registerPlugin<ResenaPlugin>('Resena')

export const SITIO = 'https://www.fixgo.ar'

export type TipoInvitacion = 'obra' | 'empresa'

export function linkInvitacion(codigo: string, tipo: TipoInvitacion = 'obra') {
  return tipo === 'empresa'
    ? `${SITIO}/invitacion.html?empresa=${encodeURIComponent(codigo)}`
    : `${SITIO}/invitacion.html?codigo=${encodeURIComponent(codigo)}`
}

function lsGet(k: string) { try { return localStorage.getItem(k) } catch { return null } }
function lsSet(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } }

/** Guarda el código para que App.tsx lo use apenas haya sesión, y avisa por si ya la hay. */
export function guardarInvitacion(tipo: TipoInvitacion, codigo: string) {
  if (!codigo) return
  lsSet(tipo === 'empresa' ? 'fixgo_invitacion_empresa' : 'fixgo_invitacion', codigo)
  try { window.dispatchEvent(new Event('fixgo-invitacion')) } catch { /* noop */ }
}

/**
 * Acepta cualquier cosa que la persona pegue: el link nuevo, el link viejo
 * (www.fixgo.ar/?invitacion=…), el mensaje de WhatsApp entero, o el código solo.
 */
export function extraerCodigoInvitacion(texto: string): { tipo: TipoInvitacion, codigo: string } | null {
  const t = (texto || '').trim()
  if (!t) return null
  const emp = t.match(/[?&]empresa=([A-Za-z0-9_-]+)/)
  if (emp) return { tipo: 'empresa', codigo: emp[1] }
  const obra = t.match(/[?&](?:codigo|invitacion)=([A-Za-z0-9_-]+)/)
  if (obra) return { tipo: 'obra', codigo: obra[1] }
  if (/^[A-Za-z0-9_-]{6,40}$/.test(t)) return { tipo: 'obra', codigo: t }
  return null
}

/** Para el referrer de Google Play: "invitacion=ABC&utm_source=…" */
function leerParametros(texto: string) {
  const p = new URLSearchParams(texto.includes('?') ? texto.slice(texto.indexOf('?') + 1) : texto)
  const empresa = p.get('empresa')
  const codigo = p.get('invitacion') || p.get('codigo')
  if (empresa) return { tipo: 'empresa' as const, codigo: empresa }
  if (codigo) return { tipo: 'obra' as const, codigo }
  return null
}

/** Link ar.fixgo.app://invitacion?codigo=… (o empresa=…). Devuelve true si era una invitación. */
export function procesarLinkEntrante(url: string): boolean {
  if (!url || !/invitacion/i.test(url)) return false
  const inv = leerParametros(url)
  if (!inv) return false
  guardarInvitacion(inv.tipo, inv.codigo)
  return true
}

/**
 * Solo la primera vez que se abre la app después de instalarla: lee con qué link de
 * Google Play se instaló. Si traía un código de invitación, lo guarda.
 * También guarda el origen (utm_source) para poder medir de dónde vienen los usuarios.
 */
export async function leerReferrerInstalacion() {
  if (!Capacitor.isNativePlatform()) return
  if (lsGet('fixgo_referrer_leido')) return
  try {
    const { referrer } = await InstallReferrer.obtener()
    lsSet('fixgo_referrer_leido', '1')
    if (!referrer) return
    const decodificado = referrer.includes('%') ? decodeURIComponent(referrer) : referrer
    lsSet('fixgo_origen_instalacion', decodificado.slice(0, 300))
    const inv = leerParametros(decodificado)
    if (inv) guardarInvitacion(inv.tipo, inv.codigo)
  } catch (e) {
    // Versión vieja sin el plugin nativo, o Play Store no disponible: seguimos sin romper nada.
    console.warn('Install referrer no disponible:', e)
  }
}

/**
 * Pedido de reseña de Google Play. Se llama después de un momento positivo
 * (una novedad resuelta). Se pide recién a la 3ª resolución y, como mucho, una vez
 * cada 60 días; además Google aplica su propio límite y puede no mostrarlo.
 */
export async function pedirResenaSiCorresponde() {
  if (!Capacitor.isNativePlatform()) return
  const n = parseInt(lsGet('fixgo_resueltas_count') || '0', 10) + 1
  lsSet('fixgo_resueltas_count', String(n))
  if (n < 3) return
  const ultima = parseInt(lsGet('fixgo_resena_pedida_ts') || '0', 10)
  if (ultima && Date.now() - ultima < 60 * 24 * 3600 * 1000) return
  lsSet('fixgo_resena_pedida_ts', String(Date.now()))
  // Pequeña pausa para que primero se vea el cambio de estado de la novedad
  setTimeout(() => { Resena.pedir().catch(() => { /* sin plugin nativo */ }) }, 900)
}

// ─────────────────────────────────────────────────────────────────────────────
// Links para abrir una obra/novedad desde afuera (resumen por WhatsApp).
//   https://www.fixgo.ar/abrir.html?obra=ID[&novedad=ID]
//   → en Android abre ar.fixgo.app://obra?obra=ID&novedad=ID (o Google Play si no está instalada)
//   → llega por appUrlOpen → procesarLinkObra() lo guarda y avisa con el evento "fixgo-abrir-obra"
//   → App.tsx navega a la obra (o avisa si la persona no es parte del equipo).
// ─────────────────────────────────────────────────────────────────────────────
export function linkAbrirObra(obraId: string, novedadId?: string | number | null) {
  const q = new URLSearchParams({ obra: String(obraId) })
  if (novedadId !== undefined && novedadId !== null && novedadId !== '') q.set('novedad', String(novedadId))
  return `${SITIO}/abrir.html?${q.toString()}`
}

/** Link ar.fixgo.app://obra?obra=…&novedad=… Devuelve true si era un link de obra. */
export function procesarLinkObra(url: string): boolean {
  if (!url || !/^ar\.fixgo\.app:\/\/obra/i.test(url)) return false
  try {
    const q = new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '')
    const obra = (q.get('obra') || '').replace(/[^A-Za-z0-9_-]/g, '')
    const novedad = (q.get('novedad') || '').replace(/[^A-Za-z0-9_-]/g, '')
    if (!obra) return true
    guardarPedidoAbrirObra(obra, novedad || null, 'link')
  } catch { /* link mal formado: lo ignoramos */ }
  return true
}

/**
 * Guarda "abrí esta obra / novedad" y avisa a App.tsx. Lo usan los links de WhatsApp y el
 * tap de una notificación push: si la app recién arranca y todavía no cargó las obras,
 * el pedido queda guardado y se cumple apenas terminan de cargar.
 */
export function guardarPedidoAbrirObra(obra: string, novedad: string | null, tipo: string | null = null) {
  if (!obra) return
  lsSet('fixgo_abrir_obra', JSON.stringify({ obra: String(obra), novedad: novedad ? String(novedad) : null, tipo: tipo || null, ts: Date.now() }))
  try { window.dispatchEvent(new Event('fixgo-abrir-obra')) } catch { /* noop */ }
}

/** Lee (y borra) el pedido pendiente de abrir una obra. Vence a los 10 minutos. */
export function leerPedidoAbrirObra(): { obra: string, novedad: string | null, tipo: string | null } | null {
  const raw = lsGet('fixgo_abrir_obra')
  if (!raw) return null
  try { localStorage.removeItem('fixgo_abrir_obra') } catch { /* noop */ }
  try {
    const p = JSON.parse(raw)
    if (!p?.obra || (p.ts && Date.now() - p.ts > 10 * 60 * 1000)) return null
    return { obra: p.obra, novedad: p.novedad || null, tipo: p.tipo || null }
  } catch { return null }
}
