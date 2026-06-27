import { useState, useRef, useEffect } from "react";
import { 
  HardHat, Wrench, AlertTriangle, CheckCircle, Clock, MapPin, Camera, 
  MessageCircle, ChevronRight, Users, BarChart2, Bell, User, Home, 
  Plus, Search, Zap, Trash2, Edit2, Share2, ChevronLeft, X, Calendar, 
  Send, RotateCcw, LogOut 
} from "lucide-react";
import { supabase } from './supabase';

const PRIORIDADES = [
  { label: "URGENTE",  color: "#FF3B30", bg: "#FF3B3015", emoji: "🔴", Icon: AlertTriangle },
  { label: "ATENCIÓN", color: "#FF6B00", bg: "#FF6B0015", emoji: "🟠", Icon: Clock },
  { label: "MENOR",    color: "#FFB800", bg: "#FFB80015", emoji: "🟡", Icon: CheckCircle },
];

const RESPONSABLES = [
  "Albañil", "Demoledor", "Encofrador carpintero", "Fierrero / Armador de hierro", 
  "Hormigonero", "Pilotero", "Pocero / Excavador", "Techista", "Calderista", 
  "Electricista de obra", "Gasista", "Instalador de ascensores y montacargas", 
  "Instalador de corrientes débiles", "Instalador de sistemas contra incendios", 
  "Instalador de sistemas de climatización", "Instalador de sistemas solares / renovables", 
  "Instalador sanitario", "Plomero / Fontanero", "Técnico en domótica y automatización", 
  "Carpintero de obra / terminaciones", "Carpintero de obra gruesa", "Cerrajero de obra", 
  "Cristalero / Vidriero", "Colocador de durlock / Yesero", "Colocador de pisos y revestimientos / Conductor", 
  "Impermeabilizador", "Marmolista", "Pintor de obra", "Parquetista", "Techista de techos livianos", 
  "Zinguero", "Ayudante gremial", "Medio oficial", "Oficial especialista", "Pedón / Obrero no calificado", 
  "Sereno / Seguridad de obra", "Capataz general", "Capataz de cuadrilla", "Jefe de obra", 
  "Pañolero / Guarda herramientas", "Técnico en Higiene y Seguridad"
];

export default function App() {
  // --- ESTADOS ---
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<"login" | "obras" | "detalle-obra">("login");
  
  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombreRegistro, setNombreRegistro] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Obras
  const [obras, setObras] = useState<any[]>([]);
  const [showNuevaObraModal, setShowNuevaObraModal] = useState(false);
  const [nuevaObra, setNuevaObra] = useState({ nombre: "", ubicacion: "", descripcion: "" });

  // Detalle Obra Activa
  const [obraSeleccionada, setObraSeleccionada] = useState<any>(null);
  const [rolEnObra, setRolEnObra] = useState("profesional");
  const [tabActivo, setTabActivo] = useState<"novedades" | "equipo" | "info">("novedades");
  
  // Novedades
  const [novedades, setNovedades] = useState<any[]>([]);
  const [showNuevaNovedadModal, setShowNuevaNovedadModal] = useState(false);
  
  // PASO 1 INTEGRADO: Se agrega responsable_usuario_id al estado inicial
  const [nuevaNovedad, setNuevaNovedad] = useState({
    descripcion: "",
    sector: "",
    responsable: "",
    prioridad: 0,
    fecha_limite: "",
    responsable_usuario_id: "" 
  });

  // Equipo
  const [equipo, setEquipo] = useState<any[]>([]);
  const [showInvitarModal, setShowInvitarModal] = useState(false);
  const [invitacion, setInvitacion] = useState({ email: "", rol: "operario", especialidad: "Albañil" });

  // --- EFECTOS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        cargarObras(session.user.id);
        setScreen("obras");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        cargarObras(session.user.id);
        setScreen("obras");
      } else {
        setUser(null);
        setObras([]);
        setScreen("login");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FUNCIONES LOGIC / SUPABASE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("usuarios_perfil").insert([
            { id: data.user.id, email: email, nombre: nombreRegistro || email.split("@")[0] }
          ]);
          alert("Registro correcto. Ya puedes iniciar sesión.");
          setIsRegistering(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error en la autenticación");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScreen("login");
  };

  const cargarObras = async (userId: string) => {
    try {
      const { data: creadas, error: e1 } = await supabase
        .from("obras")
        .select("*")
        .eq("creador_id", userId);
      if (e1) throw e1;

      const { data: participando, error: e2 } = await supabase
        .from("equipo_obra")
        .select("obras(*)")
        .eq("usuario_id", userId);
      if (e2) throw e2;

      const obrasParticipando = participando?.map(p => p.obras).filter(Boolean) || [];
      
      const unificadas: any[] = [];
      const idsMap = new Set();
      
      creadas?.forEach(o => { unificadas.push(o); idsMap.add(o.id); });
      obrasParticipando.forEach(o => { if(!idsMap.has(o.id)) unificadas.push(o); });

      setObras(unificadas);
    } catch (error) {
      console.error("Error cargando obras:", error);
    }
  };

  const handleCrearObra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("obras")
        .insert([{ ...nuevaObra, creador_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      
      setObras([data, ...obras]);
      setShowNuevaObraModal(false);
      setNuevaObra({ nombre: "", ubicacion: "", descripcion: "" });
    } catch (error) {
      console.error(error);
    }
  };

  // PASO 3 INTEGRADO: Primero busca el rol, luego invoca a cargarNovedades con seguridad
  const seleccionarObra = async (obra: any) => {
    setObraSeleccionada(obra);
    let miRol = "profesional";
    
    if (user) {
      const { data } = await supabase
        .from("equipo_obra")
        .select("rol_en_obra")
        .eq("obra_id", obra.id)
        .eq("usuario_id", user.id)
        .maybeSingle();
      if (data) {
        miRol = data.rol_en_obra;
      }
    }
    
    setRolEnObra(miRol);
    await cargarNovedades(obra.id, miRol, user?.id);
    await cargarEquipo(obra.id);
    setScreen("detalle-obra");
  };

  // PASO 2 INTEGRADO: Consulta inteligente con el candado para operarios
  const cargarNovedades = async (obraId: string, rolEspecifico?: string, usuarioIdEspecifico?: string) => {
    try {
      let query = supabase
        .from("novedades")
        .select("*")
        .eq("obra_id", obraId);

      const rolActual = rolEspecifico || rolEnObra;
      const uidActual = usuarioIdEspecifico || user?.id;

      if (rolActual === "operario" && uidActual) {
        query = query.eq("responsable_usuario_id", uidActual);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setNovedades(data || []);
    } catch (error) {
      console.error("Error al cargar novedades filtradas:", error);
    }
  };

  const cargarEquipo = async (obraId: string) => {
    try {
      const { data, error } = await supabase
        .from("equipo_obra")
        .select("*")
        .eq("obra_id", obraId);
      if (error) throw error;
      setEquipo(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // PASO 4 INTEGRADO: Se guarda la columna responsable_usuario_id al insertar
  const handleCrearNovedad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !obraSeleccionada) return;
    
    try {
      const { error } = await supabase
        .from("novedades")
        .insert([{
          obra_id: obraSeleccionada.id,
          descripcion: nuevaNovedad.descripcion,
          sector: nuevaNovedad.sector,
          responsable: nuevaNovedad.responsable,
          prioridad: Number(nuevaNovedad.prioridad),
          fecha_limite: nuevaNovedad.fecha_limite || null,
          autor_id: user.id,
          resuelta: false,
          responsable_usuario_id: nuevaNovedad.responsable_usuario_id || null 
        }]);
      
      if (error) throw error;
      
      setNuevaNovedad({
        descripcion: "",
        sector: "",
        responsable: "",
        prioridad: 0,
        fecha_limite: "",
        responsable_usuario_id: "" 
      });
      
      setShowNuevaNovedadModal(false);
      cargarNovedades(obraSeleccionada.id);
    } catch (error) {
      console.error("Error al crear novedad:", error);
    }
  };

  const toggleResolverNovedad = async (nov: any) => {
    try {
      const { error } = await supabase
        .from("novedades")
        .update({ resuelta: !nov.resuelta })
        .eq("id", nov.id);
      if (error) throw error;
      cargarNovedades(obraSeleccionada.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInvitarMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraSeleccionada) return;
    try {
      const targetEmail = invitacion.email.trim().toLowerCase();
      
      const { data: perfil } = await supabase
        .from("usuarios_perfil")
        .select("id, nombre")
        .eq("email", targetEmail)
        .maybeSingle();

      const { error } = await supabase
        .from("equipo_obra")
        .insert([{
          obra_id: obraSeleccionada.id,
          usuario_email: targetEmail,
          rol_en_obra: invitacion.rol,
          especialidad: invitacion.especialidad,
          usuario_id: perfil ? perfil.id : null,
          nombre: perfil ? perfil.nombre : targetEmail.split("@")[0]
        }]);

      if (error) throw error;

      alert("Miembro agregado correctamente al equipo.");
      setShowInvitarModal(false);
      setInvitacion({ email: "", rol: "operario", especialidad: "Albañil" });
      cargarEquipo(obraSeleccionada.id);
    } catch (error) {
      console.error(error);
      alert("Error al invitar miembro");
    }
  };

  if (loading) {
    return <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }}>Cargando Fixgo...</div>;
  }

  return (
    <div style={styles.appContainer}>
      
      {/* ---------------- SCREEN: LOGIN ---------------- */}
      {screen === "login" && (
        <div style={styles.loginCard}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={styles.logoIcon}><HardHat size={32} color="#fff" /></div>
            <h1 style={styles.loginTitle}>Fixgo</h1>
            <p style={styles.loginSubtitle}>Gestión de Obra Inteligente</p>
          </div>
          
          <form onSubmit={handleAuth} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {isRegistering && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre Completo</label>
                <input type="text" style={styles.input} value={nombreRegistro} onChange={e => setNombreRegistro(e.target.value)} placeholder="Ej: Juan Pérez" required />
              </div>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input type="email" style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Contraseña</label>
              <input type="password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {errorMsg && <p style={{ color:"#FF3B30", fontSize:14, margin:0 }}>{errorMsg}</p>}

            <button type="submit" style={styles.btnPrincipal}>
              {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
            </button>
          </form>

          <div style={{ textAlign:"center", marginTop:20 }}>
            <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }} style={styles.btnSecundario}>
              {isRegistering ? "¿Ya tienes cuenta? Ingresa" : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </div>
      )}

      {/* ---------------- SCREEN: OBRAS LIST ---------------- */}
      {screen === "obras" && (
        <div style={styles.containerContenido}>
          <div style={styles.header}>
            <div>
              <h2 style={styles.tituloSeccion}>Mis Obras</h2>
              <p style={styles.subtiuloSeccion}>{user?.email}</p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={styles.btnIconoRound} onClick={() => setShowNuevaObraModal(true)}><Plus size={20} /></button>
              <button style={styles.btnIconoRound} onClick={handleLogout}><LogOut size={20} /></button>
            </div>
          </div>

          <div style={styles.listadoGrid}>
            {obras.length === 0 ? (
              <p style={{ color:"#8E8E93", textAlign:"center", gridColumn:"1/-1", padding:"40px 0" }}>No tienes obras asignadas o creadas aún.</p>
            ) : (
              obras.map(o => (
                <div key={o.id} style={styles.tarjetaObra} onClick={() => seleccionarObra(o)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <h3 style={styles.tarjetaObraTitulo}>{o.nombre}</h3>
                    <ChevronRight size={18} color="#C7C7CC" />
                  </div>
                  <p style={styles.tarjetaObraDato}><MapPin size={14} style={{ marginRight:4 }} /> {o.ubicacion || "Sin ubicación"}</p>
                  {o.creador_id === user?.id && <span style={styles.badgeRol}>Propietario</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- SCREEN: DETALLE OBRA ---------------- */}
      {screen === "detalle-obra" && obraSeleccionada && (
        <div style={styles.containerContenido}>
          <div style={styles.header}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button style={styles.btnVolver} onClick={() => { setScreen("obras"); setObraSeleccionada(null); }}><ChevronLeft size={20} /></button>
              <div>
                <h2 style={styles.tituloSeccion}>{obraSeleccionada.nombre}</h2>
                <p style={styles.subtiuloSeccion}>Modo: <strong style={{textTransform:"uppercase"}}>{rolEnObra}</strong></p>
              </div>
            </div>
            {rolEnObra === "profesional" && tabActivo === "novedades" && (
              <button style={styles.btnAccionHeader} onClick={() => setShowNuevaNovedadModal(true)}><Plus size={16} /> Nueva Tarea</button>
            )}
            {rolEnObra === "profesional" && tabActivo === "equipo" && (
              <button style={styles.btnAccionHeader} onClick={() => setShowInvitarModal(true)}><Plus size={16} /> Añadir Personal</button>
            )}
          </div>

          {/* Selector de Solapas */}
          <div style={styles.tabsContainer}>
            <button style={tabActivo === "novedades" ? styles.tabActivo : styles.tabInactivo} onClick={() => setTabActivo("novedades")}>Tareas / Novedades</button>
            <button style={tabActivo === "equipo" ? styles.tabActivo : styles.tabInactivo} onClick={() => setTabActivo("equipo")}>Equipo de Obra</button>
            <button style={tabActivo === "info" ? styles.tabActivo : styles.tabInactivo} onClick={() => setTabActivo("info")}>Información</button>
          </div>

          {/* CONTENIDO SOLAPA: NOVEDADES */}
          {tabActivo === "novedades" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:10 }}>
              {novedades.length === 0 ? (
                <p style={{ textAling:"center", color:"#8E8E93", padding:"30px 0" }}>No hay novedades o tareas pendientes asignadas.</p>
              ) : (
                novedades.map((n) => {
                  const prio = PRIORIDADES[n.prioridad] || PRIORIDADES[2];
                  return (
                    <div key={n.id} style={n.resuelta ? styles.tarjetaNovedadResuelta : styles.tarjetaNovedad}>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <button style={styles.checkbox} onClick={() => toggleResolverNovedad(n)}>
                          {n.resuelta && <div style={styles.checkboxChecked} />}
                        </button>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                            <span style={{ ...styles.badgePrio, color: prio.color, backgroundColor: prio.bg }}>{prio.emoji} {prio.label}</span>
                            <span style={styles.badgeSector}>{n.sector || "General"}</span>
                            <span style={styles.badgeResponsable}><Wrench size={10} /> {n.responsable || "Cualquiera"}</span>
                          </div>
                          <p style={n.resuelta ? styles.novTextoResuelto : styles.novTexto}>{n.descripcion}</p>
                          {n.fecha_limite && (
                            <p style={styles.novFecha}><Calendar size={12} /> Límite: {new Date(n.fecha_limite).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* CONTENIDO SOLAPA: EQUIPO */}
          {tabActivo === "equipo" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:10 }}>
              <div style={styles.tarjetaMiembro}>
                <div>
                  <h4 style={{ margin:0, fontSize:15, fontWeight:600 }}>Propietario / Creador</h4>
                  <p style={{ margin:"2px 0 0 0", fontSize:13, color:"#636366" }}>Arquitecto / Coordinador General</p>
                </div>
                <span style={{ ...styles.badgeRol, backgroundColor:"#E5E5EA", color:"#1C1C1E" }}>Profesional</span>
              </div>
              {equipo.map((m) => (
                <div key={m.id} style={styles.tarjetaMiembro}>
                  <div>
                    <h4 style={{ margin:0, fontSize:15, fontWeight:600 }}>{m.nombre || m.usuario_email}</h4>
                    <p style={{ margin:"2px 0 0 0", fontSize:13, color:"#636366" }}>Rubro: {m.especialidad || "General"}</p>
                  </div>
                  <span style={m.rol_en_obra === "profesional" ? styles.badgeRol : styles.badgeRolOperario}>
                    {m.rol_en_obra}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CONTENIDO SOLAPA: INFO */}
          {tabActivo === "info" && (
            <div style={styles.tarjetaGeneralInfo}>
              <h3 style={{ marginTop:0, fontSize:18 }}>Datos del Proyecto</h3>
              <p style={styles.infoLinea}><strong>Ubicación:</strong> {obraSeleccionada.ubicacion || "No especificada"}</p>
              <p style={styles.infoLinea}><strong>Descripción:</strong> {obraSeleccionada.descripcion || "Sin descripción disponible"}</p>
              <p style={styles.infoLinea}><strong>Código ID Obra:</strong> <code style={{background:"#F2F2F7", padding:"2px 6px", borderRadius:4}}>{obraSeleccionada.id}</code></p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODAL: NUEVA OBRA ---------------- */}
      {showNuevaObraModal && (
        <div style={styles.overlayModal}>
          <div style={styles.modalContenido}>
            <div style={styles.modalHeader}>
              <h3>Crear Nueva Obra</h3>
              <button style={styles.btnCerrarModal} onClick={() => setShowNuevaObraModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearObra} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de la Obra *</label>
                <input type="text" style={styles.input} value={nuevaObra.nombre} onChange={e => setNuevaObra({...nuevaObra, nombre: e.target.value})} placeholder="Ej: Torre Alvear - Piso 4" required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Dirección / Ubicación</label>
                <input type="text" style={styles.input} value={nuevaObra.ubicacion} onChange={e => setNuevaObra({...nuevaObra, ubicacion: e.target.value})} placeholder="Ej: Av. Colón 1200, Córdoba" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Breve Descripción</label>
                <textarea style={{...styles.input, height:80, resize:"none"}} value={nuevaObra.descripcion} onChange={e => setNuevaObra({...nuevaObra, descripcion: e.target.value})} placeholder="Detalles u observaciones..." />
              </div>
              <button type="submit" style={styles.btnPrincipal}>Dar de Alta Obra</button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: NUEVA NOVEDAD / TAREA ---------------- */}
      {showNuevaNovedadModal && (
        <div style={styles.overlayModal}>
          <div style={styles.modalContenido}>
            <div style={styles.modalHeader}>
              <h3>Nueva Novedad / Requerimiento</h3>
              <button style={styles.btnCerrarModal} onClick={() => setShowNuevaNovedadModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearNovedad} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Descripción de la Tarea o Falla *</label>
                <input type="text" style={styles.input} value={nuevaNovedad.descripcion} onChange={e => setNuevaNovedad({...nuevaNovedad, descripcion: e.target.value})} placeholder="Ej: Corregir humedad en pared o pintura descascarada" required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ubicación / Sector Interno</label>
                <input type="text" style={styles.input} value={nuevaNovedad.sector} onChange={e => setNuevaNovedad({...nuevaNovedad, sector: e.target.value})} placeholder="Ej: Baño principal, Cocina, Planta Alta" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Criticidad / Prioridad</label>
                <select style={styles.input} value={nuevaNovedad.prioridad} onChange={e => setNuevaNovedad({...nuevaNovedad, prioridad: Number(e.target.value)})}>
                  <option value={0}>🔴 URGENTE (Frena la entrega / Peligro)</option>
                  <option value={1}>🟠 ATENCIÓN (Detalle importante a resolver)</option>
                  <option value={2}>🟡 MENOR (Estética o limpieza menor)</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rubro Gremial Responsable</label>
                <select style={styles.input} value={nuevaNovedad.responsable} onChange={e => setNuevaNovedad({...nuevaNovedad, responsable: e.target.value, responsable_usuario_id: ""})}>
                  <option value="">Cualquier gremio / General</option>
                  {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* PASO 5 INTEGRADO: Menú desplegable inteligente de personas asignadas */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Asignar a Persona Específica:</label>
                <select
                  value={nuevaNovedad.responsable_usuario_id}
                  onChange={(e) => setNuevaNovedad({ ...nuevaNovedad, responsable_usuario_id: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Cualquier persona de este rubro</option>
                  {equipo
                    .filter((miembro) => !nuevaNovedad.responsable || miembro.especialidad === nuevaNovedad.responsable)
                    .map((miembro) => (
                      <option key={miembro.id} value={miembro.usuario_id || ""}>
                        {miembro.nombre || "Invitado sin nombre"} ({miembro.especialidad})
                      </option>
                    ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha Límite de Resolución</label>
                <input type="date" style={styles.input} value={nuevaNovedad.fecha_limite} onChange={e => setNuevaNovedad({...nuevaNovedad, fecha_limite: e.target.value})} />
              </div>
              <button type="submit" style={styles.btnPrincipal}>Publicar Orden en Tablero</button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: INVITAR / AÑADIR PERSONAL ---------------- */}
      {showInvitarModal && (
        <div style={styles.overlayModal}>
          <div style={styles.modalContenido}>
            <div style={styles.modalHeader}>
              <h3>Dar de Alta en Equipo</h3>
              <button style={styles.btnCerrarModal} onClick={() => setShowInvitarModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleInvitarMiembro} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email del Operario o Colega *</label>
                <input type="email" style={styles.input} value={invitacion.email} onChange={e => setInvitacion({...invitacion, email: e.target.value})} placeholder="nombre@correo.com" required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Permisos / Rol</label>
                <select style={styles.input} value={invitacion.rol} onChange={e => setInvitacion({...invitacion, rol: e.target.value})}>
                  <option value="operario">Operario (Solo ve tareas asignadas a su rubro/ID)</option>
                  <option value="profesional">Profesional / Co-Administrador (Audita y ve todo)</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Especialidad Principal</label>
                <select style={styles.input} value={invitacion.especialidad} onChange={e => setInvitacion({...invitacion, especialidad: e.target.value})}>
                  {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" style={styles.btnPrincipal}>Vincular a la Obra</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- ESTILOS EN LINEA ---
const styles: { [key: string]: React.CSSProperties } = {
  appContainer: { backgroundColor:"#F2F2F7", minHeight:"100vh", display:"flex", justifyContent:"center", alignItems:"flex-start", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", padding:"20px 10px" },
  loginCard: { backgroundColor:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:400, boxShadow:"0 10px 25px rgba(0,0,0,0.05)", marginTop:60 },
  logoIcon: { backgroundColor:"#1C1C1E", width:56, height:56, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px auto" },
  loginTitle: { margin:0, fontSize:28, fontWeight:800, color:"#1C1C1E" },
  loginSubtitle: { margin:"4px 0 0 0", fontSize:14, color:"#8E8E93" },
  formGroup: { display:"flex", flexDirection:"column", gap:6 },
  label: { fontSize:13, fontWeight:600, color: "#3A3A3C" },
  input: { padding:"12px 14px", borderRadius:10, border:"1px solid #D1D1D6", fontSize:15, fontFamily:"inherit", boxSizing:"border-box" },
  btnPrincipal: { width:"100%", padding:"14px", borderRadius:12, backgroundColor:"#1C1C1E", color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor:"pointer" },
  btnSecundario: { background:"none", border:"none", color:"#007AFF", fontSize:14, cursor:"pointer", fontWeight:500 },
  containerContenido: { width:"100%", maxWidth:600, display:"flex", flexDirection:"column", gap:20 },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", backgroundColor:"#fff", padding:"16px 20px", borderRadius:16, boxShadow:"0 2px 8px rgba(0,0,0,0.02)" },
  tituloSeccion: { margin:0, fontSize:22, fontWeight:800, color:"#1C1C1E" },
  subtiuloSeccion: { margin:"2px 0 0 0", fontSize:13, color:"#8E8E93" },
  btnIconoRound: { width:40, height:40, borderRadius:20, border:"none", backgroundColor:"#F2F2F7", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#1C1C1E" },
  listadoGrid: { display:"grid", gridTemplateColumns:"1fr", gap:14 },
  tarjetaObra: { backgroundColor:"#fff", padding:18, borderRadius:16, boxShadow:"0 2px 6px rgba(0,0,0,0.01)", cursor:"pointer", border:"1px solid transparent", transition:"all 0.2s" },
  tarjetaObraTitulo: { margin:0, fontSize:17, fontWeight:700, color:"#1C1C1E" },
  tarjetaObraDato: { margin:"6px 0 0 0", fontSize:13, color:"#636366", display:"flex", alignItems:"center" },
  badgeRol: { display:"inline-block", marginTop:10, padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600, backgroundColor:"#E8F5E9", color:"#2E7D32" },
  badgeRolOperario: { display:"inline-block", marginTop:10, padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600, backgroundColor:"#E3F2FD", color:"#1565C0" },
  btnVolver: { border:"none", background:"none", padding:4, cursor:"pointer", color:"#1C1C1E" },
  btnAccionHeader: { backgroundColor:"#1C1C1E", color:"#fff", border:"none", borderRadius:10, padding:"8px 12px", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, cursor:"pointer" },
  tabsContainer: { display:"flex", backgroundColor:"#E5E5EA", padding:4, borderRadius:10, gap:4 },
  tabActivo: { flex:1, padding:"8px 0", textAlign:"center", border:"none", backgroundColor:"#fff", color:"#1C1C1E", borderRadius:8, fontSize:13, fontWeight:700, boxShadow:"0 1px 3px rgba(0,0,0,0.1)", cursor:"pointer" },
  tabInactivo: { flex:1, padding:"8px 0", textAlign:"center", border:"none", background:"none", color:"#636366", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" },
  tarjetaNovedad: { backgroundColor:"#fff", padding:16, borderRadius:14, boxShadow:"0 2px 5px rgba(0,0,0,0.01)", borderLeft:"4px solid #1C1C1E" },
  tarjetaNovedadResuelta: { backgroundColor:"#F4F4F4", padding:16, borderRadius:14, opacity:0.6, borderLeft:"4px solid #8E8E93" },
  checkbox: { width:20, height:20, borderRadius:6, border:"2px solid #C7C7CC", backgroundColor:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:0, marginTop:2 },
  checkboxChecked: { width:10, height:10, borderRadius:2, backgroundColor:"#007AFF" },
  badgePrio: { fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4 },
  badgeSector: { fontSize:10, fontWeight:600, backgroundColor:"#F2F2F7", color:"#48484A", padding:"2px 6px", borderRadius:4 },
  badgeResponsable: { fontSize:10, fontWeight:600, backgroundColor:"#E5E5EA", color:"#1C1C1E", padding:"2px 6px", borderRadius:4, display:"inline-flex", alignItems:"center", gap:3 },
  novTexto: { margin:"8px 0 0 0", fontSize:15, color:"#1C1C1E", fontWeight:500, lineHeight:1.4 },
  novTextoResuelto: { margin:"8px 0 0 0", fontSize:15, color:"#8E8E93", textDecoration:"line-through", lineHeight:1.4 },
  novFecha: { margin:"6px 0 0 0", fontSize:11, color:"#8E8E93", display:"flex", alignItems:"center", gap:4 },
  tarjetaMiembro: { backgroundColor:"#fff", padding:"14px 18px", borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center" },
  tarjetaGeneralInfo: { backgroundColor:"#fff", padding:20, borderRadius:14, display:"flex", flexDirection:"column", gap:10 },
  infoLinea: { margin:0, fontSize:14, color:"#3A3A3C", lineHeight:1.5 },
  overlayModal: { position:"fixed", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:1000 },
  modalContenido: { backgroundColor:"#fff", borderRadius:16, padding:24, width:"100%", maxWidth:450, boxShadow:"0 20px 40px rgba(0,0,0,0.15)" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, marginTop:0 },
  btnCerrarModal: { border:"none", background:"none", cursor:"pointer", color:"#8E8E93" }
};
