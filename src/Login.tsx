import { useState } from 'react'
import { supabase } from './supabase'

function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Todavía no confirmaste tu email. Revisá tu casilla de entrada.'
  if (m.includes('user already registered') || m.includes('already registered')) return 'Ese email ya tiene una cuenta. Probá iniciar sesión.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email address') || m.includes('invalid email')) return 'Ese email no es válido.'
  if (m.includes('rate limit')) return 'Demasiados intentos. Esperá un momento y volvé a intentar.'
  return 'Ocurrió un error. Probá de nuevo en unos segundos.'
}

export default function Login() {
  const [conectando, setConectando] = useState(false)
  const [vista, setVista] = useState<'inicio' | 'email'>('inicio')
  const [modoEmail, setModoEmail] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (conectando) return
    setError(null)
    setAviso(null)

    if (!email.trim() || !password) {
      setError('Completá el email y la contraseña.')
      return
    }

    setConectando(true)

    if (modoEmail === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (error) {
        setError(traducirError(error.message))
        setConectando(false)
      }
      // Si no hay error, onAuthStateChange (en App.tsx) se encarga de mostrar la app.
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password
      })
      if (error) {
        setError(traducirError(error.message))
        setConectando(false)
      } else if (data.session) {
        // Confirmación de email desactivada en Supabase: ya quedó logueado.
        // onAuthStateChange se encarga de mostrar la app.
      } else {
        // Confirmación de email activada: falta que confirme desde su casilla.
        setAviso('¡Listo! Te enviamos un email para confirmar tu cuenta. Confirmalo y después iniciá sesión acá.')
        setModoEmail('login')
        setPassword('')
        setConectando(false)
      }
    }
  }

  if (vista === 'email') {
    return (
      <div style={{
        minHeight:'100vh', background:'#fff',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px'
      }}>
        <style>{`
          @keyframes fixgoSpin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ width:'100%', maxWidth:320 }}>
          <button
            onClick={() => { setVista('inicio'); setError(null); setAviso(null) }}
            style={{
              border:'none', background:'none', padding:0, marginBottom:24,
              display:'flex', alignItems:'center', gap:6, color:'#8E8E93', fontSize:15, cursor:'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </button>

          <p style={{ margin:'0 0 4px', fontSize:26, fontWeight:900, color:'#1C1C1E', letterSpacing:-0.5 }}>
            {modoEmail === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </p>
          <p style={{ margin:'0 0 28px', fontSize:14, color:'#8E8E93' }}>
            {modoEmail === 'login' ? 'Ingresá con tu email y contraseña.' : 'Registrate con tu email para empezar.'}
          </p>

          {aviso && (
            <div style={{
              background:'#E8F5E9', color:'#2E7D32', borderRadius:12, padding:'12px 14px',
              fontSize:13.5, marginBottom:16, lineHeight:1.4
            }}>
              {aviso}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid #E5E5EA',
                fontSize:15, color:'#1C1C1E', background:'#F2F2F7', boxSizing:'border-box'
              }}
            />
            <input
              type="password"
              autoComplete={modoEmail === 'login' ? 'current-password' : 'new-password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid #E5E5EA',
                fontSize:15, color:'#1C1C1E', background:'#F2F2F7', boxSizing:'border-box'
              }}
            />

            {error && (
              <p style={{ margin:0, color:'#D92D20', fontSize:13.5, lineHeight:1.4 }}>{error}</p>
            )}

            <button type="submit" disabled={conectando} style={{
              width:'100%', padding:'14px', borderRadius:14, border:'none',
              background:'#1C1C1E', color:'#fff', fontSize:15, fontWeight:700,
              cursor: conectando ? 'default' : 'pointer',
              opacity: conectando ? 0.85 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              marginTop:4
            }}>
              {conectando ? (
                <span style={{
                  width:18, height:18, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff',
                  display:'inline-block', animation:'fixgoSpin 0.7s linear infinite'
                }}/>
              ) : (
                modoEmail === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
              )}
            </button>
          </form>

          <button
            onClick={() => {
              setModoEmail(modoEmail === 'login' ? 'signup' : 'login')
              setError(null)
              setAviso(null)
            }}
            style={{
              width:'100%', border:'none', background:'none', marginTop:20,
              color:'#1C1C1E', fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'center'
            }}
          >
            {modoEmail === 'login' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
          </button>
        </div>
      </div>
    )
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
        <button
          onClick={() => { setVista('email'); setModoEmail('login'); setError(null); setAviso(null) }}
          disabled={conectando}
          style={{
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
