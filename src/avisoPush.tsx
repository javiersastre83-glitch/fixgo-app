// ─────────────────────────────────────────────────────────────────────────────
// Cartel de aviso dentro de la app.
// Con Fixgo abierta en pantalla, Android no muestra la notificación push. App.tsx avisa
// con el evento "fixgo-aviso-push" y este componente muestra un cartel arriba durante unos
// segundos. Al tocarlo, navega igual que si se hubiera tocado la notificación.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { pedirAbrirDesdeAviso } from './crecimiento'

type Aviso = { titulo: string, cuerpo: string, data: any }

export function AvisoPushEnApp() {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const timer = useRef<any>(null)

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as Aviso
      if (!d) return
      setAviso(d)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setAviso(null), 6000)
    }
    window.addEventListener('fixgo-aviso-push', h)
    return () => { window.removeEventListener('fixgo-aviso-push', h); clearTimeout(timer.current) }
  }, [])

  if (!aviso) return null

  const abrir = () => { const d = aviso.data; setAviso(null); pedirAbrirDesdeAviso(d) }

  return (
    <div role="alert" style={{
      position: 'fixed', left: 10, right: 10, top: 'calc(10px + env(safe-area-inset-top, 0px))', zIndex: 9999,
      background: '#1C1C1E', color: '#fff', borderRadius: 16, padding: '12px 10px 12px 14px',
      display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', animation: 'fixgoAvisoBaja 0.25s ease-out'
    }}>
      <style>{'@keyframes fixgoAvisoBaja{from{transform:translateY(-120%);opacity:0}to{transform:none;opacity:1}}'}</style>
      <button type="button" onClick={abrir} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', color: 'inherit', textAlign: 'left', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aviso.titulo}</span>
        {aviso.cuerpo && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.35, marginTop: 2, overflow: 'hidden', display: '-webkit-box' as any, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{aviso.cuerpo}</span>}
      </button>
      <button type="button" onClick={abrir} style={{ background: '#E35A0F', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Ver</button>
      <button type="button" aria-label="Cerrar aviso" onClick={() => setAviso(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 20, lineHeight: 1, padding: '4px 6px', cursor: 'pointer', flexShrink: 0 }}>×</button>
    </div>
  )
}
