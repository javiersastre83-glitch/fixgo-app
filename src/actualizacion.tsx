// ─────────────────────────────────────────────────────────────────────────────
// Aviso de versión nueva (Google Play In-App Updates).
//
// - FLEXIBLE (lo normal): si Google Play tiene una versión más nueva, aparece un aviso
//   "Hay una versión nueva de Fixgo · Actualizar". Descarga en segundo plano mientras
//   la persona sigue usando la app; al terminar, "Reiniciar" instala y vuelve a abrir.
// - OBLIGATORIA (solo para emergencias): si la versión instalada es menor que
//   `version_minima` de la tabla `config_app` en Supabase, se abre la pantalla de Google
//   que no deja seguir hasta actualizar. Para activarla no hace falta publicar nada:
//   alcanza con cambiar ese número en Supabase.
//
// Solo funciona en la app instalada desde Google Play (incluye prueba interna/cerrada).
// En la web o en un APK instalado a mano no hace nada.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } from '@capawesome/capacitor-app-update'
import { supabase } from './supabase'

type Estado = 'nada' | 'disponible' | 'descargando' | 'lista'

const CLAVE_POSPUESTA = 'fixgo_actualizacion_pospuesta' // { version, hasta }

function lsGet(k: string) { try { return localStorage.getItem(k) } catch { return null } }
function lsSet(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } }

function pospuesta(version: string) {
  try {
    const p = JSON.parse(lsGet(CLAVE_POSPUESTA) || 'null')
    return p && p.version === version && Date.now() < p.hasta
  } catch { return false }
}

async function versionMinima(): Promise<number> {
  try {
    const { data } = await supabase.from('config_app').select('valor').eq('clave', 'version_minima').maybeSingle()
    const n = parseInt(String(data?.valor ?? '0'), 10)
    return Number.isFinite(n) ? n : 0
  } catch { return 0 } // tabla inexistente o sin conexión: nunca bloquear por esto
}

export function AvisoActualizacion() {
  const [estado, setEstado] = useState<Estado>('nada')
  const [version, setVersion] = useState('')

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    let activo = true

    const revisar = async () => {
      try {
        const info = await AppUpdate.getAppUpdateInfo()
        if (!activo) return
        if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) { setEstado('lista'); return }
        if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return
        const actual = parseInt(info.currentVersionCode || '0', 10)
        const minima = await versionMinima()
        if (minima && actual < minima && info.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate()
          return
        }
        const disponible = info.availableVersionCode || ''
        if (info.flexibleUpdateAllowed && !pospuesta(disponible)) {
          setVersion(disponible)
          setEstado(e => (e === 'descargando' ? e : 'disponible'))
        }
      } catch (e) {
        // Instalada fuera de Play, sin Play Store o sin conexión: seguimos sin aviso.
        console.warn('No se pudo revisar si hay versión nueva:', e)
      }
    }

    const escucha = AppUpdate.addListener('onFlexibleUpdateStateChange', (st) => {
      if (st.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) setEstado('lista')
      else if (st.installStatus === FlexibleUpdateInstallStatus.DOWNLOADING || st.installStatus === FlexibleUpdateInstallStatus.PENDING) setEstado('descargando')
      else if (st.installStatus === FlexibleUpdateInstallStatus.FAILED || st.installStatus === FlexibleUpdateInstallStatus.CANCELED) setEstado('disponible')
    })
    const alVolver = CapacitorApp.addListener('appStateChange', ({ isActive }) => { if (isActive) revisar() })

    revisar()
    return () => {
      activo = false
      escucha.then(h => h.remove()).catch(() => {})
      alVolver.then(h => h.remove()).catch(() => {})
    }
  }, [])

  if (estado === 'nada') return null

  const actualizar = async () => {
    try {
      setEstado('descargando')
      await AppUpdate.startFlexibleUpdate()
    } catch {
      // Si la actualización flexible no está disponible, mandamos a la ficha de Play.
      setEstado('disponible')
      try { await AppUpdate.openAppStore() } catch { /* noop */ }
    }
  }
  const reiniciar = async () => { try { await AppUpdate.completeFlexibleUpdate() } catch { /* noop */ } }
  const despues = () => {
    lsSet(CLAVE_POSPUESTA, JSON.stringify({ version, hasta: Date.now() + 24 * 3600 * 1000 }))
    setEstado('nada')
  }

  const texto = estado === 'lista'
    ? 'La versión nueva está lista'
    : estado === 'descargando'
      ? 'Descargando la versión nueva…'
      : 'Hay una versión nueva de Fixgo'

  return (
    <div role="status" style={{
      position: 'fixed', left: 12, right: 12, bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))', zIndex: 9998,
      background: '#1C1C1E', color: '#fff', borderRadius: 16, padding: '12px 12px 12px 16px',
      display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
    }}>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{texto}</span>
      {estado === 'disponible' && <>
        <button type="button" onClick={despues} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, padding: '10px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>Más tarde</button>
        <button type="button" onClick={actualizar} style={{ background: '#E35A0F', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Actualizar</button>
      </>}
      {estado === 'lista' && (
        <button type="button" onClick={reiniciar} style={{ background: '#34C759', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Reiniciar</button>
      )}
    </div>
  )
}
