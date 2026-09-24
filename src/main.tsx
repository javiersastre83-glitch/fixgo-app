import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Login, { NuevaPassword } from './Login.tsx'
import { AvisoActualizacion } from './actualizacion'
import { supabase } from './supabase'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { leerReferrerInstalacion, procesarLinkEntrante, procesarLinkObra } from './crecimiento'

function Splash() {
  return (
    <div style={{
      position:"fixed", inset:0, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:18,
      background:"#fff"
    }}>
      <style>{`
        @keyframes fixgoPulse {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%      { transform: scale(1.06); opacity: 0.85;}
        }
        @keyframes fixgoFade {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1;   }
        }
      `}</style>
      <img
        src="/Fixgo_logo.png"
        alt="Fixgo"
        style={{
          width:88, height:88, borderRadius:22,
          boxShadow:"0 8px 24px rgba(0,0,0,0.18)",
          animation:"fixgoPulse 1.4s ease-in-out infinite"
        }}
      />
      <p style={{
        margin:0, fontSize:15, fontWeight:600, color:"#8E8E93",
        letterSpacing:0.2, animation:"fixgoFade 1.4s ease-in-out infinite"
      }}>
        Entrando…
      </p>
    </div>
  )
}

function Root() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // true cuando la persona entró desde el link de "Recuperar contraseña":
  // antes de mostrar la app le pedimos que elija la contraseña nueva.
  const [recuperando, setRecuperando] = useState(false)
  // Mensaje para la pantalla de login cuando un link de mail no se pudo usar.
  const [avisoLink, setAvisoLink] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecuperando(true)
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Google login dentro de la app nativa (Android App Links) ──
  // Cuando la persona vuelve de Google, Android abre Fixgo directamente (en vez de
  // quedarse en Chrome mostrando la versión web) gracias al App Link configurado.
  // Ese regreso dispara este evento con la URL completa (incluye "?code=..."),
  // que canjeamos por una sesión real. onAuthStateChange (arriba) hace el resto.
  // ── Invitaciones en la app instalada ──
  // Primer arranque después de instalar: el código puede venir en el referrer de Google Play.
  // Arranque en frío desde un link ar.fixgo.app://invitacion?codigo=…: lo leemos acá.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    leerReferrerInstalacion()
    CapacitorApp.getLaunchUrl().then(r => { if (r?.url && !procesarLinkObra(r.url)) procesarLinkEntrante(r.url) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      // Link de invitación (ar.fixgo.app://invitacion?codigo=…): se guarda y App.tsx lo usa.
      if (procesarLinkEntrante(url)) return
      // Link de obra (ar.fixgo.app://obra?obra=…): se guarda y App.tsx abre la obra.
      if (procesarLinkObra(url)) return
      // Sirve para 3 regresos: login con Google (login-callback), confirmación de
      // cuenta por mail (login-callback) y recuperar contraseña (reset-password).
      try {
        const u = new URL(url)
        const esRecuperacion = url.includes('reset-password')
        const descError = u.searchParams.get('error_description') || new URLSearchParams(u.hash.slice(1)).get('error_description')
        if (descError) {
          setAvisoLink(esRecuperacion
            ? 'Ese link ya venció o ya se usó. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".'
            : 'Tu email ya puede estar confirmado: probá iniciar sesión.')
          return
        }
        const codigo = u.searchParams.get('code')
        if (!codigo) return
        if (esRecuperacion) setRecuperando(true)
        const { error } = await supabase.auth.exchangeCodeForSession(codigo)
        if (error) {
          setRecuperando(false)
          setAvisoLink(esRecuperacion
            ? 'Abrí el link desde el mismo celular donde lo pediste, o pedí uno nuevo desde "¿Olvidaste tu contraseña?".'
            : 'Tu email quedó confirmado. Iniciá sesión con tu email y contraseña.')
        }
      } catch (e) {
        console.error('Error al procesar el link de regreso:', e)
      }
    })
    return () => { listenerPromise.then(listener => listener.remove()) }
  }, [])

  if (loading) return <Splash />
  if (!session) return <Login key={avisoLink || 'login'} avisoInicial={avisoLink} />
  if (recuperando) return <NuevaPassword onListo={() => setRecuperando(false)} />
  return <><App session={session} /><AvisoActualizacion /></>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
