import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import App from './obra-novedades.jsx'

export default function Root() {
  const [session, setSession] = useState<any>(null)
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

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1C1C1E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#fff', fontSize:16 }}>Cargando...</div>
    </div>
  )

  if (!session) return <Login />

  return <App />
}
