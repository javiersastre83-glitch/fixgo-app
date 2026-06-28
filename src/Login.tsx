import { useState } from 'react'
import { supabase } from './supabase'

export default function Login() {
  const [conectando, setConectando] = useState(false)

  const handleGoogle = async () => {
    if (conectando) return
    setConectando(true)

    // ── ETAPA 4: guardar el código de invitación ANTES de ir a Google ──
    // En este momento la URL todavía tiene el ?invitacion=CODIGO.
    // Lo guardamos en localStorage para que sobreviva el viaje al login de Google,
    // que devuelve a fixgo.ar con la URL cambiada a ?code=... (sin el invitacion).
    const params = new URLSearchParams(window.location.search)
    const codigo = params.get('invitacion')
    if (codigo) {
      localStorage.setItem('fixgo_invitacion', codigo)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })

    // Si signInWithOAuth falla (no hay redirect), reactivamos el botón.
    if (error) setConectando(false)
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#fff',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px'
    }}>
      <style>{`
        @keyframes fixgoSpin { to { transform: rotate(360deg); } }
      `}</style>
      <img src="/Fixgo_logo.png" alt="Fixgo" style={{
        width:96, height:96, borderRadius:22, marginBottom:16,
        boxShadow:'0 8px 24px rgba(0,0,0,0.18)'
      }}/>
      <p style={{ margin:'0 0 8px', fontSize:32, fontWeight:900, color:'#1C1C1E', letterSpacing:-1 }}>Fixgo</p>
      <p style={{ margin:'0 0 48px', fontSize:15, color:'#8E8E93', textAlign:'center' }}>
        Resolvé los pendientes de obra{'\n'}con tu equipo, en tiempo real
      </p>
      <div style={{ width:'100%', maxWidth:320, display:'flex', flexDirection:'column', gap:12 }}>
        <button onClick={handleGoogle} disabled={conectando} style={{
          width:'100%', padding:'14px', borderRadius:14, border:'none',
          background:'#1C1C1E', color:'#fff', fontSize:15, fontWeight:700,
          cursor: conectando ? 'default' : 'pointer',
          opacity: conectando ? 0.85 : 1,
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          transition:'opacity 0.15s ease'
        }}>
          {conectando ? (
            <>
              <span style={{
                width:18, height:18, borderRadius:'50%',
                border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff',
                display:'inline-block', animation:'fixgoSpin 0.7s linear infinite'
              }}/>
              Conectando…
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </>
          )}
        </button>
        <button disabled={conectando} style={{
          width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid #E5E5EA',
          background:'#F2F2F7', color:'#1C1C1E', fontSize:15, fontWeight:700,
          cursor: conectando ? 'default' : 'pointer',
          opacity: conectando ? 0.5 : 1,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          transition:'opacity 0.15s ease'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          Continuar con email
        </button>
      </div>
      <p style={{ margin:'32px 0 0', fontSize:12, color:'#8E8E93', textAlign:'center' }}>
        Al continuar aceptás los Términos de uso{'\n'}y la Política de privacidad
      </p>
    </div>
  )
}
