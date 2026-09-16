import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Login from './Login.tsx'
import { supabase } from './supabase'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Google login dentro de la app nativa (Android App Links) ──
  // Cuando la persona vuelve de Google, Android abre Fixgo directamente (en vez de
  // quedarse en Chrome mostrando la versión web) gracias al App Link configurado.
  // Ese regreso dispara este evento con la URL completa (incluye "?code=..."),
  // que canjeamos por una sesión real. onAuthStateChange (arriba) hace el resto.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      try {
        const codigo = new URL(url).searchParams.get('code')
        if (codigo) await supabase.auth.exchangeCodeForSession(codigo)
      } catch (e) {
        console.error('Error al procesar el regreso de Google:', e)
      }
    })
    return () => { listenerPromise.then(listener => listener.remove()) }
  }, [])

  if (loading) return <Splash />
  if (!session) return <Login />
  return <App session={session} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
