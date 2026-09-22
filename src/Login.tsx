import { useState } from 'react'
import { supabase } from './supabase'
import { Capacitor } from '@capacitor/core'

function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Todavía no confirmaste tu email. Revisá tu casilla de entrada.'
  if (m.includes('user already registered') || m.includes('already registered')) return 'Ese email ya tiene una cuenta. Probá iniciar sesión.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email address') || m.includes('invalid email')) return 'Ese email no es válido.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Demasiados intentos. Esperá un minuto y volvé a probar.'
  if (m.includes('should be different')) return 'Elegí una contraseña distinta a la anterior.'
  if (m.includes('expired') || (m.includes('invalid') && m.includes('token'))) return 'El link venció. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".'
  return 'Ocurrió un error. Probá de nuevo en unos segundos.'
}

// Adónde vuelve la persona cuando toca un link de mail (confirmar cuenta o
// recuperar contraseña). En la app nativa usamos el esquema propio ar.fixgo.app://
// (mismo mecanismo que el login de Google), así el link abre Fixgo y no la web.
const destinoLink = (ruta: string) =>
  Capacitor.isNativePlatform() ? `ar.fixgo.app://${ruta}` : window.location.origin

export default function Login({ avisoInicial = null }: { avisoInicial?: string | null }) {
  const [conectando, setConectando] = useState(false)
  const [vista, setVista] = useState<'inicio' | 'email' | 'recuperar'>(avisoInicial ? 'email' : 'inicio')
  const [modoEmail, setModoEmail] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // true cuando el login falló por email/contraseña: mostramos el cartel con salidas.
  const [errorCredenciales, setErrorCredenciales] = useState(false)
  const [aviso, setAviso] = useState<string | null>(avisoInicial)

  const cambiarModo = (modo: 'login' | 'signup') => {
    setModoEmail(modo)
    setError(null)
    setErrorCredenciales(false)
    setAviso(null)
    setRepetir('')
  }

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (conectando) return
    setError(null)
    setAviso(null)
    if (!email.trim()) {
      setError('Escribí el email de tu cuenta.')
      return
    }
    setConectando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: destinoLink('reset-password')
    })
    setConectando(false)
    if (error) {
      setError(traducirError(error.message))
      return
    }
    // Mensaje igual exista o no la cuenta (así nadie puede averiguar qué emails están registrados).
    setAviso('Si ese email tiene una cuenta en Fixgo, te llega un link para crear una contraseña nueva. Abrilo desde este mismo celular. Si en unos minutos no aparece, mirá en spam.')
  }

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

    // En la app nativa, volver a "window.location.origin" (algo como https://localhost)
    // no sirve: Android no sabe enrutar esa dirección de vuelta a la app instalada.
    // Usamos un esquema de link propio (ar.fixgo.app://) en vez de un Android App Link
    // (https://app.fixgo.ar/): el App Link depende de que Android verifique el dominio
    // contra Google al instalar la app, y esa verificación resultó no ser confiable en
    // todas las marcas de celular (confirmado 20/09/2026 con testers reales en Samsung
    // y Motorola, que quedaban varados viendo la versión web). Un esquema propio no
    // necesita ninguna verificación: como nadie más puede registrar "ar.fixgo.app://",
    // Android abre Fixgo directo siempre, sin importar el dispositivo.
    const redirectTo = Capacitor.isNativePlatform() ? 'ar.fixgo.app://login-callback' : window.location.origin

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    })

    // Si signInWithOAuth falla (no hay redirect), reactivamos el botón.
    if (error) setConectando(false)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (conectando) return
    setError(null)
    setErrorCredenciales(false)
    setAviso(null)

    if (!email.trim() || !password) {
      setError('Completá el email y la contraseña.')
      return
    }
    if (modoEmail === 'signup') {
      if (password.length < 6) { setError('La contraseña necesita al menos 6 caracteres.'); return }
      if (password !== repetir) { setError('Las dos contraseñas tienen que coincidir.'); return }
    }

    setConectando(true)

    if (modoEmail === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) setErrorCredenciales(true)
        else setError(traducirError(error.message))
        setConectando(false)
      }
      // Si no hay error, onAuthStateChange (en App.tsx) se encarga de mostrar la app.
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: destinoLink('login-callback') }
      })
      if (error) {
        setError(traducirError(error.message))
        setConectando(false)
      } else if (data.session) {
        // Confirmación de email desactivada en Supabase: ya quedó logueado.
        // onAuthStateChange se encarga de mostrar la app.
      } else {
        // Confirmación de email activada: falta que confirme desde su casilla.
        setAviso('¡Listo! Te enviamos un email para confirmar tu cuenta. Tocá el link desde este celular y entrás directo. Si en unos minutos no aparece, mirá en spam.')
        setModoEmail('login')
        setPassword('')
        setRepetir('')
        setConectando(false)
      }
    }
  }

  if (vista === 'recuperar') {
    return (
      <div style={{
        minHeight:'100vh', background:'#fff',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px'
      }}>
        <style>{`@keyframes fixgoSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width:'100%', maxWidth:320 }}>
          <button
            onClick={() => { setVista('email'); setModoEmail('login'); setError(null); setAviso(null) }}
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
            Recuperar contraseña
          </p>
          <p style={{ margin:'0 0 28px', fontSize:14, color:'#8E8E93', lineHeight:1.4 }}>
            Escribí el email de tu cuenta y te mandamos un link para crear una contraseña nueva.
          </p>
          {aviso && (
            <div style={{ background:'#E8F5E9', color:'#2E7D32', borderRadius:12, padding:'12px 14px', fontSize:13.5, marginBottom:16, lineHeight:1.4 }}>
              {aviso}
            </div>
          )}
          <form onSubmit={handleRecuperar} style={{ display:'flex', flexDirection:'column', gap:12 }}>
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
            {error && <p style={{ margin:0, color:'#D92D20', fontSize:13.5, lineHeight:1.4 }}>{error}</p>}
            <button type="submit" disabled={conectando} style={{
              width:'100%', padding:'14px', borderRadius:14, border:'none',
              background:'#1C1C1E', color:'#fff', fontSize:15, fontWeight:700,
              cursor: conectando ? 'default' : 'pointer', opacity: conectando ? 0.85 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:4
            }}>
              {conectando ? (
                <span style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', display:'inline-block', animation:'fixgoSpin 0.7s linear infinite' }}/>
              ) : 'Enviar link'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (vista === 'email') {
    const esLogin = modoEmail === 'login'
    const bordeCampo = errorCredenciales ? '#D92D20' : '#E5E5EA'
    const estiloInput = {
      width:'100%', height:56, padding:'0 16px', borderRadius:14, border:`1.5px solid ${bordeCampo}`,
      fontSize:16, color:'#1C1C1E', background:'#F2F2F7', boxSizing:'border-box' as const, fontFamily:'inherit'
    }
    const estiloLabel = { fontSize:13, fontWeight:600, color:'#3A3A3C' }
    const estiloTab = (activa: boolean) => ({
      flex:1, height:40, border:'none', borderRadius:10, cursor:'pointer', fontFamily:'inherit',
      background: activa ? '#fff' : 'transparent',
      boxShadow: activa ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
      color: activa ? '#1C1C1E' : '#6C6C70', fontSize:15, fontWeight: activa ? 700 : 600
    })
    const ojito = (
      <button
        type="button"
        aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setVerPassword(v => !v)}
        style={{
          position:'absolute', right:6, top:6, width:44, height:44, border:'none', background:'transparent',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C6C70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
          <circle cx="12" cy="12" r="3"/>
          {verPassword && <path d="M3 3l18 18"/>}
        </svg>
      </button>
    )
    const linkTexto = {
      border:'none', background:'none', padding:'4px 0', cursor:'pointer', fontFamily:'inherit',
      fontSize:14, fontWeight:600, color:'#1C1C1E', textDecoration:'underline', textAlign:'left' as const
    }

    return (
      <div style={{
        minHeight:'100vh', background:'#fff',
        display:'flex', flexDirection:'column', alignItems:'center',
        fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'56px 24px 32px', boxSizing:'border-box'
      }}>
        <style>{`
          @keyframes fixgoSpin { to { transform: rotate(360deg); } }
          .fixgo-input::placeholder { color: #8E8E93; }
        `}</style>
        <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:24 }}>
          <button
            onClick={() => { setVista('inicio'); setError(null); setErrorCredenciales(false); setAviso(null) }}
            style={{
              border:'none', background:'none', padding:0, height:44, alignSelf:'flex-start',
              display:'flex', alignItems:'center', gap:6, color:'#6C6C70', fontSize:15, cursor:'pointer', fontFamily:'inherit'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6C70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </button>

          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <p style={{ margin:0, fontSize:28, fontWeight:900, color:'#1C1C1E', letterSpacing:-0.5 }}>
              Continuá con tu email
            </p>
            <p style={{ margin:0, fontSize:15, color:'#6C6C70' }}>
              Elegí si ya tenés cuenta o si es tu primera vez.
            </p>
          </div>

          <div role="tablist" aria-label="Elegí una opción" style={{ display:'flex', gap:4, padding:4, background:'#F2F2F7', borderRadius:14 }}>
            <button role="tab" aria-selected={esLogin} onClick={() => cambiarModo('login')} style={estiloTab(esLogin)}>
              Iniciar sesión
            </button>
            <button role="tab" aria-selected={!esLogin} onClick={() => cambiarModo('signup')} style={estiloTab(!esLogin)}>
              Crear cuenta
            </button>
          </div>

          {aviso && (
            <div style={{
              background:'#E8F5E9', color:'#2E7D32', borderRadius:12, padding:'12px 14px',
              fontSize:13.5, lineHeight:1.4
            }}>
              {aviso}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="fixgo-email" style={estiloLabel}>Email</label>
              <input
                id="fixgo-email"
                className="fixgo-input"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorCredenciales(false) }}
                style={estiloInput}
              />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="fixgo-password" style={estiloLabel}>Contraseña</label>
              <div style={{ position:'relative' }}>
                <input
                  id="fixgo-password"
                  className="fixgo-input"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete={esLogin ? 'current-password' : 'new-password'}
                  placeholder={esLogin ? 'Tu contraseña' : 'Creá una contraseña'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorCredenciales(false) }}
                  style={{ ...estiloInput, paddingRight:56 }}
                />
                {ojito}
              </div>
              {!esLogin && <p style={{ margin:0, fontSize:13, color:'#6C6C70' }}>Mínimo 6 caracteres.</p>}
            </div>

            {!esLogin && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label htmlFor="fixgo-repetir" style={estiloLabel}>Repetí la contraseña</label>
                <input
                  id="fixgo-repetir"
                  className="fixgo-input"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Escribila de nuevo"
                  value={repetir}
                  onChange={e => setRepetir(e.target.value)}
                  style={estiloInput}
                />
              </div>
            )}

            {esLogin && !errorCredenciales && (
              <button
                type="button"
                onClick={() => { setVista('recuperar'); setError(null); setAviso(null) }}
                style={{ ...linkTexto, alignSelf:'flex-end', textDecoration:'none', textAlign:'right' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}

            {errorCredenciales && (
              <div role="alert" style={{ display:'flex', flexDirection:'column', gap:8, padding:'14px 16px', borderRadius:14, background:'#FEF3F2' }}>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#B42318' }}>
                  El email o la contraseña no coinciden.
                </p>
                <button type="button" onClick={() => cambiarModo('signup')} style={linkTexto}>
                  ¿Primera vez en Fixgo? Creá tu cuenta
                </button>
                <button type="button" onClick={() => { setVista('recuperar'); setErrorCredenciales(false); setAviso(null) }} style={linkTexto}>
                  ¿Olvidaste tu contraseña? Recuperala
                </button>
              </div>
            )}

            {error && (
              <p role="alert" style={{ margin:0, color:'#B42318', fontSize:14, lineHeight:1.4 }}>{error}</p>
            )}

            <button type="submit" disabled={conectando} style={{
              width:'100%', height:54, borderRadius:14, border:'none',
              background:'#1C1C1E', color:'#fff', fontSize:16, fontWeight:700, fontFamily:'inherit',
              cursor: conectando ? 'default' : 'pointer',
              opacity: conectando ? 0.85 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:10
            }}>
              {conectando ? (
                <span style={{
                  width:18, height:18, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff',
                  display:'inline-block', animation:'fixgoSpin 0.7s linear infinite'
                }}/>
              ) : (
                esLogin ? 'Iniciar sesión' : 'Crear cuenta'
              )}
            </button>

            {!esLogin && (
              <p style={{ margin:0, fontSize:13, lineHeight:1.45, color:'#6C6C70', textAlign:'center' }}>
                Te vamos a mandar un email para confirmar tu cuenta.
              </p>
            )}
          </form>
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


// Pantalla que aparece cuando la persona vuelve desde el link de "Recuperar contraseña".
// En ese momento Supabase ya le abrió una sesión temporal: solo falta elegir la clave nueva.
export function NuevaPassword({ onListo }: { onListo: () => void }) {
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (guardando) return
    setError(null)
    if (password.length < 6) { setError('Usá al menos 6 caracteres.'); return }
    if (password !== repetir) { setError('Las dos contraseñas tienen que coincidir.'); return }
    setGuardando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setGuardando(false)
    if (error) { setError(traducirError(error.message)); return }
    onListo()
  }

  const estiloInput = {
    width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid #E5E5EA',
    fontSize:15, color:'#1C1C1E', background:'#F2F2F7', boxSizing:'border-box' as const
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#fff',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'20px'
    }}>
      <style>{`@keyframes fixgoSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:'100%', maxWidth:320 }}>
        <p style={{ margin:'0 0 4px', fontSize:26, fontWeight:900, color:'#1C1C1E', letterSpacing:-0.5 }}>
          Nueva contraseña
        </p>
        <p style={{ margin:'0 0 28px', fontSize:14, color:'#8E8E93' }}>
          Elegí tu contraseña nueva y seguí trabajando.
        </p>
        <form onSubmit={guardar} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input type="password" autoComplete="new-password" placeholder="Contraseña nueva"
            value={password} onChange={e => setPassword(e.target.value)} style={estiloInput}/>
          <input type="password" autoComplete="new-password" placeholder="Repetí la contraseña"
            value={repetir} onChange={e => setRepetir(e.target.value)} style={estiloInput}/>
          {error && <p style={{ margin:0, color:'#D92D20', fontSize:13.5, lineHeight:1.4 }}>{error}</p>}
          <button type="submit" disabled={guardando} style={{
            width:'100%', padding:'14px', borderRadius:14, border:'none',
            background:'#1C1C1E', color:'#fff', fontSize:15, fontWeight:700,
            cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.85 : 1,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:4
          }}>
            {guardando ? (
              <span style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', display:'inline-block', animation:'fixgoSpin 0.7s linear infinite' }}/>
            ) : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
