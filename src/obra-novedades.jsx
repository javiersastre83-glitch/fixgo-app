import { useState, useRef } from "react";

const PRIORIDADES = [
  { label: "URGENTE",  color: "#FF3B30", bg: "#FF3B3015", emoji: "🔴" },
  { label: "ATENCIÓN", color: "#FF6B00", bg: "#FF6B0015", emoji: "🟠" },
  { label: "MENOR",    color: "#FFB800", bg: "#FFB80015", emoji: "🟡" },
];

const RESPONSABLES = [
  "Albañil","Electricista","Plomero","Carpintero","Pintor",
  "Jardinero","Aire acondicionado","Aberturas","Ceramista","Otro"
];

const SECTORES = [
  "General","Planta baja","Planta alta","Terraza","Jardín",
  "Cocina","Baño PB","Baño PA","Dormitorio","Comedor","Garage","Otro"
];

// Roles del sistema
const ROLES_SISTEMA = [
  { id:"profesional", label:"Profesional", desc:"Arquitecto, Ingeniero o Idóneo. Director del proyecto.", emoji:"👷‍♂️", color:"#0057FF" },
  { id:"capataz",     label:"Capataz",     desc:"Sobrestante. Gestiona subcontratos y hace seguimiento en obra.", emoji:"🦺", color:"#FF6B00" },
  { id:"operario",    label:"Operario",    desc:"Albañil, Pintor, Electricista, etc. Ejecuta las tareas.", emoji:"🔨", color:"#8E44AD" },
];

// Usuarios de demo
const USUARIOS_DEMO = [
  { id:"u1", nombre:"Javier",  rolSistema:"profesional", especialidad:"Arquitecto",   avatar:"👷‍♂️", color:"#0057FF" },
  { id:"u2", nombre:"Carlos",  rolSistema:"operario",    especialidad:"Pintor",        avatar:"🖌️",  color:"#FF6B00" },
  { id:"u3", nombre:"Miguel",  rolSistema:"operario",    especialidad:"Albañil",       avatar:"🧱",  color:"#8E44AD" },
  { id:"u4", nombre:"Roberto", rolSistema:"capataz",     especialidad:"Capataz",       avatar:"🦺",  color:"#E67E22" },
];

const OBRAS_DEMO = [
  { id:1, nombre:"Casa Familia García", direccion:"Av. Colón 1234, Córdoba",
    equipo:[
      { uid:"u1", rolEnObra:"profesional" },
      { uid:"u2", rolEnObra:"operario" },
      { uid:"u3", rolEnObra:"operario" },
      { uid:"u4", rolEnObra:"capataz" },
    ]
  },
  { id:2, nombre:"Local Comercial Centro", direccion:"San Martín 450, Córdoba",
    equipo:[
      { uid:"u1", rolEnObra:"profesional" },
      { uid:"u2", rolEnObra:"operario" },
    ]
  },
];

const formatFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" });
};

const formatHora = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }) + " " +
    d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
};

const diasRestantes = (fechaLimite) => {
  if (!fechaLimite) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const limite = new Date(fechaLimite + "T00:00:00");
  return Math.ceil((limite - hoy) / (1000*60*60*24));
};

const estadoBadge = (nov) => {
  if (nov.resuelta) return { label:"✅ Resuelto", color:"#34C759", bg:"#34C75920" };
  const d = diasRestantes(nov.fechaLimite);
  if (d === null) return null;
  if (d < 0)   return { label:`⚠️ Vencida hace ${Math.abs(d)} dias`, color:"#FF3B30", bg:"#FF3B3020" };
  if (d === 0) return { label:"⏰ Vence hoy", color:"#FF6B00", bg:"#FF6B0020" };
  if (d <= 3)  return { label:`⏳ ${d} dias restantes`, color:"#FF6B00", bg:"#FF6B0020" };
  return { label:`📅 ${d} dias restantes`, color:"#8E8E93", bg:"#8E8E9315" };
};

const generarResumen = (nov, obraNombre) => {
  const pri = PRIORIDADES[nov.prioridad];
  const badge = estadoBadge(nov);
  return [
    `🏗️ *${obraNombre}*`,
    `${pri.emoji} *${pri.label}* — ${nov.descripcion}`,
    `👷 Responsable: ${nov.responsable}`,
    `📍 Sector: ${nov.sector}`,
    nov.fechaLimite ? `📅 Fecha límite: ${formatFecha(nov.fechaLimite)}` : "",
    badge ? `Estado: ${badge.label}` : "",
    nov.comentarios.length > 0 ? `💬 Notas: ${nov.comentarios.map(c=>c.texto).join(" | ")}` : "",
  ].filter(Boolean).join("\n");
};

const NOVEDADES_DEMO = [
  { id:1,
    fotos:["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80","https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80"],
    descripcion:"Revoque exterior fisura en esquina NE", responsable:"Albañil", sector:"Planta baja", prioridad:0, fechaLimite:"2026-05-22", resuelta:false, fecha:"2026-05-17",
    comentarios:[
      { texto:"Revisar antes de pintar", autorId:"u1", ts: Date.now()-86400000*2 },
      { texto:"Ya lo vi, necesito mezcla especial", autorId:"u3", ts: Date.now()-86400000 },
    ]},
  { id:2,
    fotos:["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80"],
    descripcion:"Falta toma de corriente en baño planta alta", responsable:"Electricista", sector:"Baño PA", prioridad:1, fechaLimite:"2026-05-28", resuelta:false, fecha:"2026-05-18",
    comentarios:[
      { texto:"La canalización no está terminada todavía", autorId:"u4", ts: Date.now()-86400000 },
    ]},
  { id:3,
    fotos:["https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80"],
    descripcion:"Pintura terminada en comedor", responsable:"Pintor", sector:"Comedor", prioridad:2, fechaLimite:"", resuelta:true, fecha:"2026-05-15",
    comentarios:[
      { texto:"Listo, dos manos aplicadas", autorId:"u2", ts: Date.now()-86400000*3 },
      { texto:"Confirmado, quedó excelente 👍", autorId:"u1", ts: Date.now()-86400000*2 },
    ]},
];

const FORM_INICIAL = {
  fotos:[], descripcion:"", responsable:RESPONSABLES[0], responsableCustom:"",
  sector:SECTORES[0], sectorCustom:"", prioridad:1, fechaLimite:"", comentario:"",
};

export default function App() {
  // Usuario activo (simulado)
  const [usuarioActivo, setUsuarioActivo] = useState(USUARIOS_DEMO[0]);
  const [mostrarCambioUsuario, setMostrarCambioUsuario] = useState(false);

  const [vistaRaiz, setVistaRaiz]   = useState("inicio");
  const [obraActual, setObraActual] = useState(null);
  const [obras, setObras]           = useState(OBRAS_DEMO);
  const [novedadesPorObra, setNovedadesPorObra] = useState({ 1:NOVEDADES_DEMO, 2:[] });
  const [vista, setVista]           = useState("lista");
  const [form, setForm]             = useState(FORM_INICIAL);
  const [detalleId, setDetalleId]   = useState(null);
  const [filtro, setFiltro]         = useState("todas");
  const [busqueda, setBusqueda]     = useState("");
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [modalNuevaObra, setModalNuevaObra]   = useState(false);
  const [nuevaObraForm, setNuevaObraForm]     = useState({ nombre:"", direccion:"" });
  const [vistaStats, setVistaStats] = useState(false);
  const [vistaEquipo, setVistaEquipo] = useState(false);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [vistaPerfil, setVistaPerfil] = useState(false);
  const [vistaInfoApp, setVistaInfoApp] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [tabActiva, setTabActiva] = useState('obras'); // obras | alertas | perfil
  const [compartidoId, setCompartidoId] = useState(null);
  const [modalPro, setModalPro] = useState(false);
  const [menuContextual, setMenuContextual] = useState(null); // { novId, x, y }
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [menuObra, setMenuObra] = useState(null);
  const [confirmarEliminarObra, setConfirmarEliminarObra] = useState(null);
  const [modalProObra, setModalProObra] = useState(false);
  const esVersionPro = false; // cambiar a true cuando se active el pago
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState(null);
  const fileRef = useRef();

  const novedades = obraActual ? (novedadesPorObra[obraActual.id] || []) : [];
  const setNovedades = (fn) => setNovedadesPorObra(prev => ({
    ...prev,
    [obraActual.id]: typeof fn === "function" ? fn(prev[obraActual.id] || []) : fn
  }));

  const equipoObra = obraActual
    ? (obraActual.equipo || []).map(m => {
        const u = USUARIOS_DEMO.find(u=>u.id===m.uid);
        return u ? { ...u, rolEnObra: m.rolEnObra } : null;
      }).filter(Boolean)
    : [];

  // Rol del usuario activo en la obra actual
  const miRolEnObra = obraActual
    ? (obraActual.equipo || []).find(m=>m.uid===usuarioActivo.id)?.rolEnObra || "operario"
    : usuarioActivo.rolSistema;

  const miRolInfo = ROLES_SISTEMA.find(r=>r.id===miRolEnObra);

  const getUserById = (id) => USUARIOS_DEMO.find(u=>u.id===id);

  const handleFotos = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, fotos:[...f.fotos, ev.target.result] }));
      reader.readAsDataURL(file);
    });
  };

  const quitarFoto = (idx) => setForm(f => ({ ...f, fotos:f.fotos.filter((_,i) => i!==idx) }));

  const guardar = () => {
    if (!form.descripcion.trim()) return;
    const responsableFinal = form.responsable==="Otro" && form.responsableCustom.trim() ? form.responsableCustom.trim() : form.responsable;
    const sectorFinal = form.sector==="Otro" && form.sectorCustom.trim() ? form.sectorCustom.trim() : form.sector;
    setNovedades(n => [{
      id:Date.now(), fotos:form.fotos, descripcion:form.descripcion,
      responsable:responsableFinal, sector:sectorFinal, prioridad:form.prioridad,
      fechaLimite:form.fechaLimite, resuelta:false,
      fecha:new Date().toISOString().slice(0,10),
      comentarios:form.comentario.trim() ? [{ texto:form.comentario.trim(), autorId:usuarioActivo.id, ts:Date.now() }] : [],
    }, ...n]);
    setForm(FORM_INICIAL);
    setVista("lista");
  };

  const resolver = (id) => setNovedades(n => n.map(x => x.id===id ? {...x,resuelta:!x.resuelta} : x));
  const eliminar = (id) => { setNovedades(n => n.filter(x => x.id!==id)); setVista("lista"); };

  const agregarComentario = (id) => {
    if (!nuevoComentario.trim()) return;
    setNovedades(n => n.map(x => x.id===id
      ? {...x, comentarios:[...x.comentarios, { texto:nuevoComentario.trim(), autorId:usuarioActivo.id, ts:Date.now() }]}
      : x
    ));
    setNuevoComentario("");
  };

  const eliminarObra = (id) => {
    setObras(o => o.filter(x => x.id!==id));
    setNovedadesPorObra(p => { const n={...p}; delete n[id]; return n; });
    setConfirmarEliminarObra(null);
  };

  const crearObra = () => {
    if (!nuevaObraForm.nombre.trim()) return;
    const nueva = { id:Date.now(), nombre:nuevaObraForm.nombre, direccion:nuevaObraForm.direccion, equipo:["u1"] };
    setObras(o => [...o, nueva]);
    setNovedadesPorObra(p => ({ ...p, [nueva.id]:[] }));
    setNuevaObraForm({ nombre:"", direccion:"" });
    setModalNuevaObra(false);
  };

  const abrirEdicion = (nov) => {
    setFormEdit({
      fotos: nov.fotos,
      descripcion: nov.descripcion,
      responsable: nov.responsable,
      responsableCustom: "",
      sector: nov.sector,
      sectorCustom: "",
      prioridad: nov.prioridad,
      fechaLimite: nov.fechaLimite,
    });
    setEditando(true);
  };

  const guardarEdicion = (id) => {
    if (!formEdit.descripcion.trim()) return;
    const responsableFinal = formEdit.responsable==="Otro" && formEdit.responsableCustom.trim() ? formEdit.responsableCustom.trim() : formEdit.responsable;
    const sectorFinal = formEdit.sector==="Otro" && formEdit.sectorCustom.trim() ? formEdit.sectorCustom.trim() : formEdit.sector;
    setNovedades(n => n.map(x => x.id===id ? {
      ...x,
      fotos: formEdit.fotos,
      descripcion: formEdit.descripcion,
      responsable: responsableFinal,
      sector: sectorFinal,
      prioridad: formEdit.prioridad,
      fechaLimite: formEdit.fechaLimite,
    } : x));
    setEditando(false);
    setFormEdit(null);
  };

  const compartir = (nov) => {
    const texto = generarResumen(nov, obraActual?.nombre || "Obra");
    if (navigator.share) {
      navigator.share({ title:"Novedad de obra", text:texto }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(texto);
      setCompartidoId(nov.id);
      setTimeout(() => setCompartidoId(null), 2000);
    }
  };

  const statsResponsable = RESPONSABLES.map(r => ({
    nombre:r,
    pendientes: novedades.filter(n=>n.responsable===r && !n.resuelta).length,
    resueltas:  novedades.filter(n=>n.responsable===r && n.resuelta).length,
    urgentes:   novedades.filter(n=>n.responsable===r && !n.resuelta && n.prioridad===0).length,
  })).filter(r=>r.pendientes+r.resueltas>0);

  const novedadesFiltradas = novedades.filter(n => {
    // Operarios solo ven sus propias novedades (según rol en esta obra)
    const matchRol = miRolEnObra==="operario"
      ? n.responsable===usuarioActivo.especialidad
      : true;
    const matchFiltro =
      filtro==="pendientes" ? !n.resuelta :
      filtro==="resueltas"  ? n.resuelta :
      filtro==="vencidas"   ? !n.resuelta && diasRestantes(n.fechaLimite)<0 : true;
    const matchBusqueda = busqueda.trim()==="" ||
      n.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.responsable.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.sector.toLowerCase().includes(busqueda.toLowerCase());
    return matchRol && matchFiltro && matchBusqueda;
  }).sort((a,b) => {
    if (a.resuelta!==b.resuelta) return a.resuelta?1:-1;
    const da=diasRestantes(a.fechaLimite), db=diasRestantes(b.fechaLimite);
    if (da!==null && db!==null) return da-db;
    return a.prioridad-b.prioridad;
  });

  const contadores = {
    todas:      novedades.length,
    pendientes: novedades.filter(n=>!n.resuelta).length,
    resueltas:  novedades.filter(n=>n.resuelta).length,
    vencidas:   novedades.filter(n=>!n.resuelta && diasRestantes(n.fechaLimite)<0).length,
  };

  const detalle = novedades.find(n=>n.id===detalleId);

  // ── SELECTOR DE USUARIO (demo) ──
  const rolInfo = ROLES_SISTEMA.find(r=>r.id===usuarioActivo.rolSistema);

  const SelectorUsuario = () => (
    <div style={s.modalOverlay} onClick={()=>setMostrarCambioUsuario(false)}>
      <div style={s.modal} onClick={e=>e.stopPropagation()}>
        <p style={{ margin:"0 0 4px", fontSize:18, fontWeight:700 }}>Cambiar usuario</p>
        <p style={{ margin:"0 0 16px", fontSize:13, color:"#8E8E93" }}>Solo para demo — simulá ser otro miembro del equipo</p>
        {USUARIOS_DEMO.map(u => {
          const rol = ROLES_SISTEMA.find(r=>r.id===u.rolSistema);
          return (
            <button key={u.id} style={{
              width:"100%", display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              borderRadius:14, border:`2px solid ${usuarioActivo.id===u.id ? u.color : "#E5E5EA"}`,
              background: usuarioActivo.id===u.id ? u.color+"15" : "#fff",
              cursor:"pointer", marginBottom:8, textAlign:"left"
            }} onClick={()=>{ setUsuarioActivo(u); setMostrarCambioUsuario(false); }}>
              <span style={{ fontSize:28 }}>{u.avatar}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:15, color:"#1C1C1E" }}>{u.nombre}</p>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:2 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:u.color, background:u.color+"15", padding:"2px 8px", borderRadius:99 }}>{rol?.emoji} {rol?.label}</span>
                  <span style={{ fontSize:12, color:"#8E8E93" }}>{u.especialidad}</span>
                </div>
              </div>
              {usuarioActivo.id===u.id && <span style={{ color:u.color, fontSize:18 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // INFO APP (ícono Fixgo)
  // ════════════════════════════════════════
  if (vistaInfoApp) {
    return (
      <div style={{...s.root, background:"#F2F2F7"}}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>setVistaInfoApp(false)}>← Volver</button>
          <span style={s.headerTitle}>Fixgo</span>
          <div style={{ width:60 }} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Logo y versión */}
          <div style={{ background:"linear-gradient(135deg,#1C1C1E,#3A3A3C)", borderRadius:20, padding:"28px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="44" height="44" viewBox="0 0 72 72" fill="none">
                <g transform="rotate(-12, 36, 38)">
                  <path d="M14 40 C14 23 23 13 36 13 C49 13 58 23 58 40 Z" fill="white"/>
                  <rect x="10" y="40" width="52" height="7" rx="3.5" fill="white"/>
                </g>
              </svg>
            </div>
            <p style={{ margin:0, fontSize:28, fontWeight:900, color:"#fff", letterSpacing:-1 }}>Fixgo</p>
            <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,0.5)" }}>Versión 1.0.0</p>
          </div>

          {/* Planes */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Planes</p>
          <div style={{ background:"#fff", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 16px", borderBottom:"1px solid #F2F2F7" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:"#1C1C1E" }}>Plan Gratuito</p>
                <span style={{ background:"#F2F2F7", borderRadius:99, padding:"3px 10px", fontSize:12, color:"#636366", fontWeight:600 }}>Actual</span>
              </div>
              <p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>✅ 1 proyecto · ✅ Novedades ilimitadas · ❌ Estadísticas avanzadas</p>
            </div>
            <div style={{ padding:"14px 16px", background:"#FFB80008" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:"#1C1C1E" }}>Plan Pro</p>
                <span style={{ background:"#FFB800", borderRadius:99, padding:"3px 10px", fontSize:12, color:"#1C1C1E", fontWeight:800 }}>✨ PRO</span>
              </div>
              <p style={{ margin:0, fontSize:13, color:"#8E8E93", marginBottom:10 }}>✅ Proyectos ilimitados · ✅ Estadísticas avanzadas · ✅ Ranking y medallas · ✅ Filtros por responsable</p>
              <button style={{ width:"100%", padding:"12px", borderRadius:12, background:"#FFB800", color:"#1C1C1E", border:"none", fontSize:15, fontWeight:800, cursor:"pointer" }}>
                🚀 Activar Plan Pro
              </button>
            </div>
          </div>

          {/* Contacto */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Contacto y soporte</p>
          <div style={{ background:"#fff", borderRadius:16, overflow:"hidden" }}>
            {[
              { icon:"💬", label:"Contactarnos", sub:"Escribinos por cualquier consulta" },
              { icon:"🐛", label:"Reportar un problema", sub:"Ayudanos a mejorar Fixgo" },
              { icon:"❓", label:"Preguntas frecuentes", sub:"Guías y ayuda" },
            ].map((item,i,arr) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<arr.length-1?"1px solid #F2F2F7":"none", cursor:"pointer" }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:600, color:"#1C1C1E" }}>{item.label}</p>
                  <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>{item.sub}</p>
                </div>
                <span style={{ color:"#C7C7CC", fontSize:18 }}>›</span>
              </div>
            ))}
          </div>

          {/* Legal */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Legal</p>
          <div style={{ background:"#fff", borderRadius:16, overflow:"hidden" }}>
            {[
              { icon:"📄", label:"Términos y condiciones" },
              { icon:"🔒", label:"Política de privacidad" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i===0?"1px solid #F2F2F7":"none", cursor:"pointer" }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <p style={{ margin:0, flex:1, fontSize:15, fontWeight:600, color:"#1C1C1E" }}>{item.label}</p>
                <span style={{ color:"#C7C7CC", fontSize:18 }}>›</span>
              </div>
            ))}
          </div>

          <p style={{ textAlign:"center", fontSize:12, color:"#C7C7CC", marginBottom:8 }}>Fixgo · Versión 1.0.0 · Hecho con ❤️ en Córdoba</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // PERFIL / CONFIGURACIÓN
  // ════════════════════════════════════════
  if (tabActiva === 'perfil' && vistaRaiz === 'inicio') {
    const rolInfo2 = ROLES_SISTEMA.find(r=>r.id===usuarioActivo.rolSistema);
    return (
      <div style={{...s.root, background: modoOscuro?"#1C1C1E":"#F2F2F7"}}>
        <div style={{...s.header, background: modoOscuro?"#2C2C2E":"#fff", borderBottomColor: modoOscuro?"#3A3A3C":"#E5E5EA"}}>
          <div style={{ width:60 }} />
          <span style={{...s.headerTitle, color: modoOscuro?"#fff":"#1C1C1E"}}>Mi perfil</span>
          <div style={{ width:60 }} />
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Identidad editable */}
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:18, padding:"20px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:64, height:64, borderRadius:99, background:usuarioActivo.color+"20", border:`3px solid ${usuarioActivo.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, flexShrink:0, cursor:"pointer" }}>
                {usuarioActivo.avatar}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:20, fontWeight:800, color: modoOscuro?"#fff":"#1C1C1E" }}>{usuarioActivo.nombre}</p>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4 }}>
                  {rolInfo2 && <span style={{ fontSize:11, fontWeight:700, color:usuarioActivo.color, background:usuarioActivo.color+"15", padding:"2px 8px", borderRadius:99 }}>{rolInfo2.emoji} {rolInfo2.label}</span>}
                  <span style={{ fontSize:13, color:"#8E8E93" }}>{usuarioActivo.especialidad}</span>
                </div>
                <p style={{ margin:"4px 0 0", fontSize:13, color:"#8E8E93" }}>javier@email.com</p>
              </div>
            </div>
            <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600, color:"#8E8E93" }}>Nombre</p>
            <input style={{...s.inputText, marginBottom:10, background: modoOscuro?"#3A3A3C":"#F2F2F7", color: modoOscuro?"#fff":"#1C1C1E", border:"none"}} defaultValue={usuarioActivo.nombre} placeholder="Tu nombre" />
            <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600, color:"#8E8E93" }}>Especialidad</p>
            <input style={{...s.inputText, marginBottom:10, background: modoOscuro?"#3A3A3C":"#F2F2F7", color: modoOscuro?"#fff":"#1C1C1E", border:"none"}} defaultValue={usuarioActivo.especialidad} placeholder="Tu especialidad" />
            <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600, color:"#8E8E93" }}>Email</p>
            <input style={{...s.inputText, background: modoOscuro?"#3A3A3C":"#F2F2F7", color: modoOscuro?"#fff":"#1C1C1E", border:"none"}} defaultValue="javier@email.com" placeholder="Tu email" />
            <button style={{...s.btnPrincipal, background:"#1C1C1E", marginTop:14}}>Guardar cambios</button>
          </div>

          {/* Suscripción */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Suscripción</p>
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:16, overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(135deg,#1C1C1E,#3A3A3C)", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>Plan actual</p>
                <p style={{ margin:0, fontSize:17, fontWeight:800, color:"#fff" }}>Versión Gratuita</p>
              </div>
              <button style={{ background:"#FFB800", border:"none", borderRadius:12, padding:"8px 16px", fontSize:13, fontWeight:800, color:"#1C1C1E", cursor:"pointer" }}>
                🚀 Pasar a Pro
              </button>
            </div>
            <div style={{ padding:"12px 16px", borderTop:"1px solid #F2F2F7" }}>
              <p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>✅ 1 proyecto incluido · ❌ Estadísticas avanzadas · ❌ Proyectos ilimitados</p>
            </div>
          </div>

          {/* Cuenta */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Cuenta</p>
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:16, overflow:"hidden" }}>
            {[
              { icon:"✏️", label:"Editar perfil", sub:"Nombre, foto y especialidad" },
              { icon:"🔑", label:"Cambiar contraseña", sub:"Actualizar tu contraseña" },
              { icon:"🔔", label:"Notificaciones", sub:"Elegí qué alertas recibir" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:"1px solid #F2F2F7", cursor:"pointer" }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:600, color: modoOscuro?"#fff":"#1C1C1E" }}>{item.label}</p>
                  <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>{item.sub}</p>
                </div>
                <span style={{ color:"#C7C7CC", fontSize:18 }}>›</span>
              </div>
            ))}
          </div>

          {/* Preferencias */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Preferencias</p>
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:16, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px" }}>
              <span style={{ fontSize:22 }}>{modoOscuro?"🌙":"☀️"}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:15, fontWeight:600, color: modoOscuro?"#fff":"#1C1C1E" }}>Modo oscuro</p>
                <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>{modoOscuro?"Activado":"Desactivado"}</p>
              </div>
              <div style={{ width:50, height:28, borderRadius:99, background: modoOscuro?"#34C759":"#E5E5EA", cursor:"pointer", position:"relative", transition:"background .2s" }}
                onClick={()=>setModoOscuro(m=>!m)}>
                <div style={{ width:24, height:24, borderRadius:99, background:"#fff", position:"absolute", top:2, left: modoOscuro?24:2, transition:"left .2s", boxShadow:"0 2px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          </div>

          {/* Soporte */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Soporte</p>
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:16, overflow:"hidden" }}>
            {[
              { icon:"❓", label:"Preguntas frecuentes", sub:"FAQ y guías de uso" },
              { icon:"🐛", label:"Reportar un problema", sub:"Ayudanos a mejorar Fixgo" },
              { icon:"💬", label:"Contacto", sub:"Escribinos directamente" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:"1px solid #F2F2F7", cursor:"pointer" }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:600, color: modoOscuro?"#fff":"#1C1C1E" }}>{item.label}</p>
                  <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>{item.sub}</p>
                </div>
                <span style={{ color:"#C7C7CC", fontSize:18 }}>›</span>
              </div>
            ))}
          </div>

          {/* Legal */}
          <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5 }}>Legal</p>
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:16, overflow:"hidden" }}>
            {[
              { icon:"📄", label:"Términos y condiciones" },
              { icon:"🔒", label:"Política de privacidad" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom: i===0?"1px solid #F2F2F7":"none", cursor:"pointer" }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <p style={{ margin:0, flex:1, fontSize:15, fontWeight:600, color: modoOscuro?"#fff":"#1C1C1E" }}>{item.label}</p>
                <span style={{ color:"#C7C7CC", fontSize:18 }}>›</span>
              </div>
            ))}
          </div>

          {/* Cerrar sesión y eliminar */}
          <div style={{ background: modoOscuro?"#2C2C2E":"#fff", borderRadius:16, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:"1px solid #F2F2F7", cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>🚪</span>
              <p style={{ margin:0, flex:1, fontSize:15, fontWeight:600, color:"#FF6B00" }}>Cerrar sesión</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>🗑️</span>
              <p style={{ margin:0, flex:1, fontSize:15, fontWeight:600, color:"#FF3B30" }}>Eliminar cuenta</p>
            </div>
          </div>

          {/* Versión */}
          <p style={{ textAlign:"center", fontSize:12, color:"#C7C7CC", marginTop:4, marginBottom:8 }}>Fixgo · Versión 1.0.0</p>

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // TAB ALERTAS
  // ════════════════════════════════════════
  if (tabActiva === 'alertas' && vistaRaiz === 'inicio') {
    const alertas = [
      { id:1, texto:"Fisura en revoque lleva 3 días vencida", tipo:"urgente", tiempo:"Hace 2 horas" },
      { id:2, texto:"Miguel Albañil comentó en una novedad", tipo:"comentario", tiempo:"Hace 5 horas" },
      { id:3, texto:"Toma de corriente vence en 4 días", tipo:"aviso", tiempo:"Hace 1 día" },
    ];
    return (
      <div style={s.root}>
        <div style={{ background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)", padding:"22px 16px 16px" }}>
          <p style={{ margin:0, fontSize:24, fontWeight:900, color:"#fff" }}>🔔 Alertas</p>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"rgba(255,255,255,0.5)" }}>{alertas.length} notificaciones</p>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
          {alertas.map(a => (
            <div key={a.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start",
              borderLeft:`4px solid ${a.tipo==="urgente"?"#FF3B30":a.tipo==="comentario"?"#007AFF":"#FFB800"}` }}>
              <span style={{ fontSize:22 }}>{a.tipo==="urgente"?"⚠️":a.tipo==="comentario"?"💬":"📅"}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#1C1C1E", lineHeight:1.4 }}>{a.texto}</p>
                <p style={{ margin:"4px 0 0", fontSize:12, color:"#8E8E93" }}>{a.tiempo}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position:"sticky", bottom:0, background:"#fff", borderTop:"1px solid #E5E5EA", display:"flex", zIndex:20, paddingBottom:"env(safe-area-inset-bottom)" }}>
          {[
            { key:"obras", icon:"🏗️", label:"Obras" },
            { key:"alertas", icon:"🔔", label:"Alertas" },
            { key:"perfil", icon:"👤", label:"Perfil" },
          ].map(tab => (
            <button key={tab.key} style={{ flex:1, background:"none", border:"none", padding:"10px 4px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}
              onClick={()=>setTabActiva(tab.key)}>
              <span style={{ fontSize:22 }}>{tab.icon}</span>
              <span style={{ fontSize:10, fontWeight:tabActiva===tab.key?700:400, color:tabActiva===tab.key?"#1C1C1E":"#8E8E93" }}>{tab.label}</span>
              {tabActiva===tab.key && <div style={{ width:4, height:4, borderRadius:99, background:"#1C1C1E" }} />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // PANTALLA DE INICIO
  // ════════════════════════════════════════
  if (vistaRaiz==="inicio") {
    const totalPendientes = Object.values(novedadesPorObra).flat().filter(n=>!n.resuelta).length;
    const totalVencidas   = Object.values(novedadesPorObra).flat().filter(n=>!n.resuelta && diasRestantes(n.fechaLimite)<0).length;
    return (
      <div style={s.root}>
        <div style={{ background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)", padding:"28px 20px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                <div style={{ width:44, height:44, borderRadius:13, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
                    <g transform="rotate(-12, 36, 38)">
                      <path d="M14 40 C14 23 23 13 36 13 C49 13 58 23 58 40 Z" fill="white"/>
                      <rect x="10" y="40" width="52" height="7" rx="3.5" fill="white"/>
                    </g>
                  </svg>
                </div>
                <p style={{ margin:0, fontSize:30, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>Fixgo</p>
              </div>
              <p style={{ margin:0, fontSize:14, color:"rgba(255,255,255,0.6)" }}>
                {obras.length} obra{obras.length!==1?"s":""} · {totalPendientes} pendiente{totalPendientes!==1?"s":""}
                {totalVencidas>0 && <span style={{ color:"#FFD60A", fontWeight:700 }}> · ⚠️ {totalVencidas} vencida{totalVencidas!==1?"s":""}</span>}
              </p>
            </div>
            {/* Avatar usuario activo */}
            <button style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:12, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}
              onClick={()=>setMostrarCambioUsuario(true)}>
              <span style={{ fontSize:22 }}>{usuarioActivo.avatar}</span>
              <div style={{ textAlign:"left" }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#fff" }}>{usuarioActivo.nombre}</p>
                <p style={{ margin:0, fontSize:11, color:usuarioActivo.color }}>{usuarioActivo.rol}</p>
              </div>
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
          {obras.map(obra => {
            const novs = novedadesPorObra[obra.id] || [];
            const pend = novs.filter(n=>!n.resuelta).length;
            const venc = novs.filter(n=>!n.resuelta && diasRestantes(n.fechaLimite)<0).length;
            const res  = novs.filter(n=>n.resuelta).length;
            const progreso = novs.length>0 ? Math.round((res/novs.length)*100) : 0;
            const equipo = (obra.equipo||[]).map(m=>{ const u=USUARIOS_DEMO.find(u=>u.id===m.uid); return u?{...u,rolEnObra:m.rolEnObra}:null; }).filter(Boolean);
            return (
              <button key={obra.id} style={s.cardObra}
                onClick={()=>{ setObraActual(obra); setVistaRaiz("obra"); setVista("lista"); setBusqueda(""); setFiltro("todas"); }}
                onContextMenu={e=>{ e.preventDefault(); setMenuObra(obra.id); }}
                onPointerDown={e=>{ const t=setTimeout(()=>setMenuObra(obra.id),600); e.currentTarget._t=t; }}
                onPointerUp={e=>clearTimeout(e.currentTarget._t)}
                onPointerLeave={e=>clearTimeout(e.currentTarget._t)}
                onTouchStart={e=>{ e.currentTarget._tt=setTimeout(()=>setMenuObra(obra.id),600); }}
                onTouchEnd={e=>clearTimeout(e.currentTarget._tt)}
                onTouchMove={e=>clearTimeout(e.currentTarget._tt)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ flex:1, textAlign:"left" }}>
                    <p style={{ margin:0, fontSize:17, fontWeight:700, color:"#1C1C1E" }}>{obra.nombre}</p>
                    <p style={{ margin:"3px 0 0", fontSize:13, color:"#8E8E93" }}>📍 {obra.direccion||"Sin dirección"}</p>
                  </div>
                  <span style={{ fontSize:22, color:"#C7C7CC", marginLeft:8 }}>›</span>
                </div>
                {/* Equipo */}
                <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                  {equipo.map(u => (
                    <div key={u.id} title={`${u.nombre} · ${u.rol}`} style={{ width:30, height:30, borderRadius:99, background:u.color+"20", border:`2px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                      {u.avatar}
                    </div>
                  ))}
                </div>
                {/* Progreso */}
                {novs.length>0 && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ height:6, background:"#F2F2F7", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${progreso}%`, background:"#34C759", borderRadius:99 }} />
                    </div>
                    <p style={{ margin:"4px 0 0", fontSize:12, color:"#8E8E93" }}>{progreso}% resuelto · {novs.length} novedad{novs.length!==1?"es":""}</p>
                  </div>
                )}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{...s.chip, background:"#FF6B0015", color:"#FF6B00"}}>⏳ {pend} pendiente{pend!==1?"s":""}</span>
                  {venc>0 && <span style={{...s.chip, background:"#FF3B3020", color:"#FF3B30", fontWeight:700}}>⚠️ {venc} vencida{venc!==1?"s":""}</span>}
                  <span style={{...s.chip, background:"#34C75915", color:"#34C759"}}>✅ {res}</span>
                </div>
              </button>
            );
          })}
          <button style={{ width:"100%", border:"2px dashed #C7C7CC", background:"transparent", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"20px", cursor:"pointer" }}
            onClick={()=>{ if (!esVersionPro && obras.length >= 1) { setModalProObra(true); } else { setModalNuevaObra(true); } }}>
            <span style={{ fontSize:26, color:"#C7C7CC" }}>+</span>
            <span style={{ fontSize:16, fontWeight:600, color:"#8E8E93" }}>Nueva obra</span>
          </button>
        </div>

        {modalNuevaObra && (
          <div style={s.modalOverlay} onClick={()=>setModalNuevaObra(false)}>
            <div style={s.modal} onClick={e=>e.stopPropagation()}>
              <p style={{ margin:"0 0 16px", fontSize:18, fontWeight:700 }}>Nueva obra</p>
              <input style={s.inputText} placeholder="Nombre de la obra *"
                value={nuevaObraForm.nombre} onChange={e=>setNuevaObraForm(f=>({...f,nombre:e.target.value}))} />
              <input style={{...s.inputText, marginTop:10}} placeholder="Dirección (opcional)"
                value={nuevaObraForm.direccion} onChange={e=>setNuevaObraForm(f=>({...f,direccion:e.target.value}))} />
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button style={{...s.btnPrincipal, background:"#E5E5EA", color:"#1C1C1E", flex:1}} onClick={()=>setModalNuevaObra(false)}>Cancelar</button>
                <button style={{...s.btnPrincipal, flex:1, opacity:nuevaObraForm.nombre.trim()?1:0.4}} onClick={crearObra}>Crear</button>
              </div>
            </div>
          </div>
        )}
        {mostrarCambioUsuario && <SelectorUsuario />}
      </div>
    );
  }

  // ════════════════════════════════════════
  // TAREAS DE UN MIEMBRO
  // ════════════════════════════════════════
  if (vistaEquipo && miembroSeleccionado) {
    const u = miembroSeleccionado;
    const tareasU = novedades.filter(n=>n.responsable===u.especialidad);
    const pend = tareasU.filter(n=>!n.resuelta);
    const res  = tareasU.filter(n=>n.resuelta);
    const rolU = ROLES_SISTEMA.find(r=>r.id===u.rolEnObra);
    return (
      <div style={s.root}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>setMiembroSeleccionado(null)}>← Equipo</button>
          <span style={s.headerTitle}>{u.nombre}</span>
          <div style={{ width:60 }} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
          {/* Perfil del miembro */}
          <div style={{ background:"#fff", borderRadius:18, padding:"16px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:56, height:56, borderRadius:99, background:u.color+"15", border:`2px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>
              {u.avatar}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:800, fontSize:18, color:"#1C1C1E" }}>{u.nombre}</p>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4, flexWrap:"wrap" }}>
                {rolU && <span style={{ fontSize:11, fontWeight:700, color:u.color, background:u.color+"15", padding:"2px 8px", borderRadius:99 }}>{rolU.emoji} {rolU.label}</span>}
                <span style={{ fontSize:13, color:"#8E8E93" }}>{u.especialidad}</span>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, background:"#fff", borderRadius:14, padding:"12px", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:26, fontWeight:800, color:"#FF6B00" }}>{pend.length}</p>
              <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>Pendientes</p>
            </div>
            <div style={{ flex:1, background:"#fff", borderRadius:14, padding:"12px", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:26, fontWeight:800, color:"#34C759" }}>{res.length}</p>
              <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>Resueltas</p>
            </div>
            <div style={{ flex:1, background:"#fff", borderRadius:14, padding:"12px", textAlign:"center" }}>
              <p style={{ margin:0, fontSize:26, fontWeight:800, color:"#1C1C1E" }}>{tareasU.length}</p>
              <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>Total</p>
            </div>
          </div>

          {/* Tareas pendientes */}
          {pend.length > 0 && <>
            <p style={{ margin:"4px 0 0", fontSize:13, color:"#8E8E93", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>⏳ Pendientes</p>
            {pend.map(nov => {
              const pri = PRIORIDADES[nov.prioridad];
              const badge = estadoBadge(nov);
              return (
                <button key={nov.id} style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${pri.color}40`, padding:0, cursor:"pointer", textAlign:"left", overflow:"hidden", boxShadow:`0 2px 8px ${pri.color}12` }}
                  onClick={()=>{ setDetalleId(nov.id); setMiembroSeleccionado(null); setVistaEquipo(false); setVista("detalle"); }}>
                  <div style={{ display:"flex" }}>
                    <div style={{ width:5, background:pri.color, flexShrink:0 }} />
                    {nov.fotos.length>0
                      ? <img src={nov.fotos[0]} alt="" style={{ width:70, height:70, objectFit:"cover", flexShrink:0 }} />
                      : <div style={{ width:70, height:70, background:"#F2F2F7", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>📷</div>
                    }
                    <div style={{ padding:"10px 12px", flex:1, minWidth:0 }}>
                      <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:700, color:"#1C1C1E", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{nov.descripcion}</p>
                      <p style={{ margin:"0 0 5px", fontSize:12, color:"#636366" }}>📍 {nov.sector}</p>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        <span style={{...s.chip, background:pri.bg, color:pri.color, fontSize:11}}>{pri.emoji} {pri.label}</span>
                        {badge && <span style={{...s.chip, background:badge.bg, color:badge.color, fontSize:11}}>{badge.label}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", paddingRight:10, color:"#C7C7CC", fontSize:18 }}>›</div>
                  </div>
                </button>
              );
            })}
          </>}

          {/* Tareas resueltas */}
          {res.length > 0 && <>
            <p style={{ margin:"4px 0 0", fontSize:13, color:"#8E8E93", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Resueltas</p>
            {res.map(nov => {
              const pri = PRIORIDADES[nov.prioridad];
              return (
                <button key={nov.id} style={{ background:"#fff", borderRadius:16, border:"1.5px solid #E5E5EA", padding:0, cursor:"pointer", textAlign:"left", overflow:"hidden", opacity:0.6 }}
                  onClick={()=>{ setDetalleId(nov.id); setMiembroSeleccionado(null); setVistaEquipo(false); setVista("detalle"); }}>
                  <div style={{ display:"flex" }}>
                    <div style={{ width:5, background:"#C7C7CC", flexShrink:0 }} />
                    <div style={{ width:70, height:60, background:"#F2F2F7", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>✅</div>
                    <div style={{ padding:"10px 12px", flex:1, minWidth:0 }}>
                      <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:700, color:"#1C1C1E", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{nov.descripcion}</p>
                      <p style={{ margin:0, fontSize:12, color:"#636366" }}>📍 {nov.sector}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", paddingRight:10, color:"#C7C7CC", fontSize:18 }}>›</div>
                  </div>
                </button>
              );
            })}
          </>}

          {tareasU.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"#8E8E93" }}>
              <p style={{ fontSize:40, margin:0 }}>🎉</p>
              <p style={{ fontSize:16, fontWeight:600, margin:"10px 0 4px" }}>Sin tareas asignadas</p>
              <p style={{ fontSize:13, margin:0 }}>No hay novedades asignadas a {u.nombre}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // EQUIPO
  // ════════════════════════════════════════
  if (vistaEquipo) {
    return (
      <div style={s.root}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>setVistaEquipo(false)}>← Volver</button>
          <span style={s.headerTitle}>Equipo</span>
          <div style={{ width:60 }} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ margin:"0 0 4px", fontSize:13, color:"#8E8E93", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>
            {obraActual?.nombre}
          </p>
          {equipoObra.map(u => {
            const pend = novedades.filter(n=>n.responsable===u.especialidad && !n.resuelta).length;
            const res  = novedades.filter(n=>n.responsable===u.especialidad && n.resuelta).length;
            return (
              <button key={u.id} style={{ background:"#fff", borderRadius:18, padding:"16px", border:`1.5px solid ${u.color}25`, textAlign:"left", cursor:"pointer", width:"100%" }}
                onClick={()=>setMiembroSeleccionado(u)}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:50, height:50, borderRadius:99, background:u.color+"15", border:`2px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
                    {u.avatar}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:17, color:"#1C1C1E" }}>{u.nombre}</p>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:2, flexWrap:"wrap" }}>
                      {(() => { const r = ROLES_SISTEMA.find(r=>r.id===u.rolEnObra); return r ? <span style={{ fontSize:11, fontWeight:700, color:u.color, background:u.color+"15", padding:"2px 8px", borderRadius:99 }}>{r.emoji} {r.label}</span> : null; })()}
                      <span style={{ fontSize:13, color:"#8E8E93" }}>{u.especialidad}</span>
                    </div>
                  </div>
                  {u.id===usuarioActivo.id
                    ? <span style={{...s.chip, background:"#1C1C1E", color:"#fff", fontSize:11}}>Vos</span>
                    : <span style={{ color:"#C7C7CC", fontSize:18 }}>›</span>
                  }
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1, background:"#F2F2F7", borderRadius:12, padding:"10px", textAlign:"center" }}>
                    <p style={{ margin:0, fontSize:20, fontWeight:800, color:"#FF6B00" }}>{pend}</p>
                    <p style={{ margin:0, fontSize:11, color:"#8E8E93" }}>Pendientes</p>
                  </div>
                  <div style={{ flex:1, background:"#F2F2F7", borderRadius:12, padding:"10px", textAlign:"center" }}>
                    <p style={{ margin:0, fontSize:20, fontWeight:800, color:"#34C759" }}>{res}</p>
                    <p style={{ margin:0, fontSize:11, color:"#8E8E93" }}>Resueltas</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // ESTADÍSTICAS
  // ════════════════════════════════════════
  if (vistaStats) {
    const maxPend = Math.max(...statsResponsable.map(r=>r.pendientes), 1);
    const totalNovs = novedades.length;
    const pctResuelto = totalNovs>0 ? Math.round((contadores.resueltas/totalNovs)*100) : 0;
    const pctVencidas = totalNovs>0 ? Math.round((contadores.vencidas/totalNovs)*100) : 0;

    // Medallas por responsable
    const getMedalla = (r) => {
      const total = r.pendientes + r.resueltas;
      if (total===0) return null;
      const pct = Math.round((r.resueltas/total)*100);
      if (pct===100) return { emoji:"🥇", label:"100% resuelto", color:"#FFB800" };
      if (pct>=75)   return { emoji:"🥈", label:`${pct}% resuelto`, color:"#8E8E93" };
      if (pct>=50)   return { emoji:"🥉", label:`${pct}% resuelto`, color:"#CD7F32" };
      if (r.urgentes>0) return { emoji:"⚠️", label:"Tiene urgentes", color:"#FF3B30" };
      return null;
    };

    return (
      <div style={s.root}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>setVistaStats(false)}>← Volver</button>
          <span style={s.headerTitle}>Estadísticas</span>
          <div style={{ width:60 }} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>

          {/* Resumen general PRIMERO */}
          <p style={{ margin:"0 0 4px", fontSize:13, color:"#8E8E93", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Resumen general</p>
          <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px" }}>
            {/* Porcentaje grande */}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
              <div style={{ position:"relative", width:64, height:64, flexShrink:0 }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#F2F2F7" strokeWidth="7"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#34C759" strokeWidth="7"
                    strokeDasharray={`${pctResuelto*1.634} 163.4`}
                    strokeLinecap="round" strokeDashoffset="40.85"
                    transform="rotate(-90 32 32)"/>
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#1C1C1E" }}>{pctResuelto}%</div>
              </div>
              <div>
                <p style={{ margin:0, fontSize:17, fontWeight:700, color:"#1C1C1E" }}>Avance general</p>
                <p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>{contadores.resueltas} de {totalNovs} novedades resueltas</p>
                {pctVencidas>0 && <p style={{ margin:"4px 0 0", fontSize:12, color:"#FF3B30", fontWeight:600 }}>⚠️ {pctVencidas}% vencidas sin resolver</p>}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { label:"Total", val:totalNovs, color:"#1C1C1E" },
                { label:"Pendientes", val:contadores.pendientes, color:"#FF6B00" },
                { label:"Vencidas", val:contadores.vencidas, color:"#FF3B30" },
                { label:"Resueltas", val:contadores.resueltas, color:"#34C759" },
              ].map(c => (
                <div key={c.label} style={{ flex:1, background:"#F2F2F7", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
                  <p style={{ margin:0, fontSize:20, fontWeight:800, color:c.color }}>{c.val}</p>
                  <p style={{ margin:0, fontSize:10, color:"#8E8E93" }}>{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Por responsable */}
          <p style={{ margin:"4px 0 4px", fontSize:13, color:"#8E8E93", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Por responsable</p>
          {statsResponsable.length===0 && <p style={{ color:"#8E8E93", textAlign:"center", padding:"40px 0" }}>Sin datos aún</p>}
          {statsResponsable.map(r => {
            const total = r.pendientes + r.resueltas;
            const pct = total>0 ? Math.round((r.resueltas/total)*100) : 0;
            const medalla = getMedalla(r);
            return (
              <div key={r.nombre} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", position:"relative", overflow:"hidden" }}
                onClick={()=>{
                  setVistaStats(false);
                  setFiltro("todas");
                  setBusqueda(r.nombre);
                  // Mostrar modal Pro
                  setModalPro(true);
                }}>
                {/* Indicador Pro */}
                <div style={{ position:"absolute", top:10, right:10, background:"#FFB80020", borderRadius:99, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#FFB800" }}>✨ Pro</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>👷 {r.nombre}</span>
                    {medalla && <span title={medalla.label} style={{ fontSize:18 }}>{medalla.emoji}</span>}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:13, fontWeight:800, color: pct>=75?"#34C759":pct>=50?"#FF6B00":"#FF3B30" }}>{pct}%</span>
                    {r.urgentes>0 && <span style={{...s.chip, background:"#FF3B3015", color:"#FF3B30", fontSize:11}}>🔴 {r.urgentes}</span>}
                    <span style={{...s.chip, background:"#34C75915", color:"#34C759", fontSize:11}}>✅ {r.resueltas}</span>
                  </div>
                </div>
                <div style={{ height:8, background:"#F2F2F7", borderRadius:99, overflow:"hidden", marginBottom:4 }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:pct>=75?"#34C759":pct>=50?"#FF6B00":"#FF3B30", borderRadius:99, transition:"width .4s" }} />
                </div>
                <p style={{ margin:0, fontSize:12, color:"#8E8E93" }}>{r.resueltas} resueltas · {r.pendientes} pendiente{r.pendientes!==1?"s":""} de {total} totales</p>
              </div>
            );
          })}

          {/* ═══ SECCIÓN PRO ═══ */}
          <div style={{ background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)", borderRadius:16, padding:"16px 16px 4px", marginTop:4 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:"#FFB800", textTransform:"uppercase", letterSpacing:0.5 }}>✨ Versión Pro</p>
                <p style={{ margin:0, fontSize:17, fontWeight:800, color:"#fff" }}>Estadísticas avanzadas</p>
              </div>
              <span style={{ background:"#FFB800", borderRadius:99, padding:"4px 12px", fontSize:12, fontWeight:800, color:"#1C1C1E" }}>PRO</span>
            </div>

            {/* 1. GRÁFICO DE EVOLUCIÓN SEMANAL */}
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <p style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"#fff" }}>📈 Evolución semanal</p>
              {(() => {
                const semanas = ["S1","S2","S3","S4","S5","S6","S7"];
                const datos = [2,4,3,6,5,8,contadores.resueltas];
                const max = Math.max(...datos, 1);
                return (
                  <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
                    {semanas.map((s,i) => (
                      <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        <div style={{ width:"100%", background: i===semanas.length-1 ? "#FFB800" : "rgba(255,255,255,0.3)", borderRadius:"4px 4px 0 0", height:`${(datos[i]/max)*64}px`, transition:"height .4s", minHeight:4 }} />
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{s}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p style={{ margin:"8px 0 0", fontSize:12, color:"rgba(255,255,255,0.4)" }}>Novedades resueltas por semana</p>
            </div>

            {/* 2. RANKING DE CONTRATISTAS */}
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <p style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"#fff" }}>🏆 Ranking de contratistas</p>
              {statsResponsable.length===0
                ? <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>Sin datos aún</p>
                : [...statsResponsable]
                    .sort((a,b) => {
                      const pctA = (a.resueltas/(a.resueltas+a.pendientes)||0);
                      const pctB = (b.resueltas/(b.resueltas+b.pendientes)||0);
                      return pctB - pctA;
                    })
                    .map((r,i) => {
                      const total = r.resueltas + r.pendientes;
                      const pct = total>0 ? Math.round((r.resueltas/total)*100) : 0;
                      const medallas = ["🥇","🥈","🥉"];
                      const colores = ["#FFB800","#C0C0C0","#CD7F32"];
                      return (
                        <div key={r.nombre} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom: i<statsResponsable.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                          <span style={{ fontSize:20, width:28, textAlign:"center" }}>{medallas[i] || `${i+1}`}</span>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#fff" }}>👷 {r.nombre}</p>
                            <div style={{ height:4, background:"rgba(255,255,255,0.1)", borderRadius:99, overflow:"hidden", marginTop:4 }}>
                              <div style={{ height:"100%", width:`${pct}%`, background: i===0?"#FFB800":i===1?"#C0C0C0":"#CD7F32", borderRadius:99 }} />
                            </div>
                          </div>
                          <span style={{ fontSize:14, fontWeight:800, color: i===0?"#FFB800":i===1?"#C0C0C0":"#CD7F32" }}>{pct}%</span>
                        </div>
                      );
                    })
              }
            </div>

            {/* 3. TIEMPO PROMEDIO DE RESOLUCIÓN */}
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"14px", marginBottom:16 }}>
              <p style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"#fff" }}>⚡ Tiempo promedio de resolución</p>
              {(() => {
                const resueltas = novedades.filter(n=>n.resuelta);
                const promedios = statsResponsable.map(r => {
                  const novRes = resueltas.filter(n=>n.responsable===r.nombre);
                  const dias = novRes.map(n => {
                    const cargada = new Date(n.fecha+"T00:00:00");
                    const hoy = new Date();
                    return Math.max(1, Math.ceil((hoy-cargada)/(1000*60*60*24)));
                  });
                  const avg = dias.length>0 ? Math.round(dias.reduce((a,b)=>a+b,0)/dias.length) : null;
                  return { nombre:r.nombre, avg };
                }).filter(r=>r.avg!==null).sort((a,b)=>a.avg-b.avg);

                if (promedios.length===0) return <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>Sin datos aún</p>;
                const maxAvg = Math.max(...promedios.map(r=>r.avg), 1);
                return promedios.map((r,i) => (
                  <div key={r.nombre} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom: i<promedios.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", width:70, flexShrink:0 }}>👷 {r.nombre}</span>
                    <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.1)", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(r.avg/maxAvg)*100}%`, background: r.avg<=3?"#34C759":r.avg<=7?"#FFB800":"#FF3B30", borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)", width:40, textAlign:"right", flexShrink:0 }}>{r.avg}d</span>
                  </div>
                ));
              })()}
              <p style={{ margin:"8px 0 0", fontSize:11, color:"rgba(255,255,255,0.3)" }}>🟢 &lt;3d excelente · 🟡 &lt;7d bien · 🔴 +7d a mejorar</p>
            </div>

            <button style={{ width:"100%", padding:"13px", borderRadius:12, background:"#FFB800", color:"#1C1C1E", border:"none", fontSize:15, fontWeight:800, cursor:"pointer", marginBottom:16 }}>
              🚀 Activar versión Pro
            </button>
          </div>

        </div>
        {modalPro && (
          <div style={s.modalOverlay} onClick={()=>setModalPro(false)}>
            <div style={s.modal} onClick={e=>e.stopPropagation()}>
              <div style={{ textAlign:"center", marginBottom:16 }}>
                <span style={{ fontSize:40 }}>🔒</span>
                <p style={{ margin:"8px 0 4px", fontSize:20, fontWeight:800, color:"#1C1C1E" }}>Función Pro</p>
                <p style={{ margin:0, fontSize:14, color:"#8E8E93", lineHeight:1.5 }}>Ver las novedades filtradas por responsable es parte de la versión Pro de Fixgo.</p>
              </div>
              <div style={{ background:"#F2F2F7", borderRadius:14, padding:"12px 16px", marginBottom:16 }}>
                {["📋 Filtrar novedades por contratista","📈 Gráficos de evolución","🏆 Ranking y medallas acumuladas","⚡ Tiempo promedio de resolución"].map((item,i)=>(
                  <div key={i} style={{ fontSize:14, padding:"6px 0", borderBottom:i<3?"1px solid #E5E5EA":"none", color:"#1C1C1E" }}>{item}</div>
                ))}
              </div>
              <button style={{...s.btnPrincipal, background:"#FFB800", color:"#1C1C1E", marginBottom:10}}>🚀 Activar versión Pro</button>
              <button style={{...s.btnPrincipal, background:"#F2F2F7", color:"#8E8E93"}} onClick={()=>setModalPro(false)}>Ahora no</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════
  // EDITAR NOVEDAD
  // ════════════════════════════════════════
  if (vista==="detalle" && detalle && editando && formEdit) {
    return (
      <div style={s.root}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>{ setEditando(false); setFormEdit(null); }}>← Cancelar</button>
          <span style={s.headerTitle}>Editar novedad</span>
          <button style={{...s.backBtn, color:"#34C759", fontWeight:700}} onClick={()=>guardarEdicion(detalle.id)}>Guardar</button>
        </div>
        <div style={{ padding:"16px", flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:20 }}>

          <div>
            <p style={s.label}>📝 Descripción</p>
            <textarea style={s.textarea} rows={3}
              value={formEdit.descripcion}
              onChange={e=>setFormEdit(f=>({...f,descripcion:e.target.value}))} />
          </div>

          <div>
            <p style={s.label}>⚡ Prioridad</p>
            <div style={{ display:"flex", gap:10 }}>
              {PRIORIDADES.map((p,i) => (
                <button key={i} style={{ flex:1, padding:"12px 4px", borderRadius:14, border:`2px solid ${formEdit.prioridad===i?p.color:"#E5E5EA"}`, background:formEdit.prioridad===i?p.bg:"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}
                  onClick={()=>setFormEdit(f=>({...f,prioridad:i}))}>
                  <span style={{ fontSize:24 }}>{p.emoji}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:formEdit.prioridad===i?p.color:"#8E8E93" }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={s.label}>📍 Sector</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {SECTORES.map(sec => (
                <button key={sec} style={{ padding:"9px 14px", borderRadius:20, border:`2px solid ${formEdit.sector===sec?"#007AFF":"#E5E5EA"}`, background:formEdit.sector===sec?"#007AFF15":"#fff", color:formEdit.sector===sec?"#007AFF":"#3A3A3C", fontWeight:formEdit.sector===sec?700:400, fontSize:14, cursor:"pointer" }}
                  onClick={()=>setFormEdit(f=>({...f,sector:sec,sectorCustom:""}))}>
                  {sec}
                </button>
              ))}
            </div>
            {formEdit.sector==="Otro" && (
              <input style={{...s.inputText, marginTop:10}} placeholder="Escribí el sector..."
                value={formEdit.sectorCustom} onChange={e=>setFormEdit(f=>({...f,sectorCustom:e.target.value}))} />
            )}
          </div>

          <div>
            <p style={s.label}>👷 Responsable</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {RESPONSABLES.map(r => (
                <button key={r} style={{ padding:"9px 14px", borderRadius:20, border:`2px solid ${formEdit.responsable===r?"#007AFF":"#E5E5EA"}`, background:formEdit.responsable===r?"#007AFF15":"#fff", color:formEdit.responsable===r?"#007AFF":"#3A3A3C", fontWeight:formEdit.responsable===r?700:400, fontSize:14, cursor:"pointer" }}
                  onClick={()=>setFormEdit(f=>({...f,responsable:r,responsableCustom:""}))}>
                  {r}
                </button>
              ))}
            </div>
            {formEdit.responsable==="Otro" && (
              <input style={{...s.inputText, marginTop:10}} placeholder="Escribí el responsable..."
                value={formEdit.responsableCustom} onChange={e=>setFormEdit(f=>({...f,responsableCustom:e.target.value}))} />
            )}
          </div>

          <div>
            <p style={s.label}>📅 Fecha límite <span style={{ color:"#8E8E93", fontWeight:400 }}>(opcional)</span></p>
            <input type="date" style={s.inputDate} value={formEdit.fechaLimite}
              onChange={e=>setFormEdit(f=>({...f,fechaLimite:e.target.value}))} />
          </div>

          <button style={{...s.btnPrincipal, background:"#34C759", opacity:formEdit.descripcion.trim()?1:0.4}}
            onClick={()=>guardarEdicion(detalle.id)}>
            ✅ Guardar cambios
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // DETALLE
  // ════════════════════════════════════════
  if (vista==="detalle" && detalle) {
    const pri = PRIORIDADES[detalle.prioridad];
    const badge = estadoBadge(detalle);
    return (
      <div style={s.root}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>setVista("lista")}>← Volver</button>
          <span style={s.headerTitle}>Detalle</span>
          <button style={{...s.backBtn, color:"#FF3B30"}} onClick={()=>setConfirmarEliminar(detalle.id)}>Borrar</button>
        </div>
        <div style={{ padding:"16px", flex:1, overflowY:"auto" }}>
          {detalle.fotos.length>0 ? (
            <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16, paddingBottom:4 }}>
              {detalle.fotos.map((f,i) => (
                <img key={i} src={f} alt="" style={{ height:200, borderRadius:14, objectFit:"cover", flexShrink:0, maxWidth:"85%" }} />
              ))}
            </div>
          ) : (
            <div style={s.fotoPlaceholderGrande}>📷<br /><span style={{ fontSize:14, color:"#8E8E93", marginTop:8, display:"block" }}>Sin foto</span></div>
          )}

          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <span style={{...s.chip, background:pri.bg, color:pri.color, fontWeight:700}}>{pri.emoji} {pri.label}</span>
            {badge && <span style={{...s.chip, background:badge.bg, color:badge.color, fontWeight:600}}>{badge.label}</span>}
          </div>

          <p style={{ fontSize:20, fontWeight:700, color:"#1C1C1E", marginBottom:12, lineHeight:1.3 }}>{detalle.descripcion}</p>

          <div style={s.infoRow}><span style={s.infoIcon}>👷</span><span style={s.infoLabel}>Responsable</span><span style={s.infoVal}>{detalle.responsable}</span></div>
          <div style={s.infoRow}><span style={s.infoIcon}>📍</span><span style={s.infoLabel}>Sector</span><span style={s.infoVal}>{detalle.sector}</span></div>
          {detalle.fechaLimite && <div style={s.infoRow}><span style={s.infoIcon}>📅</span><span style={s.infoLabel}>Fecha límite</span><span style={s.infoVal}>{formatFecha(detalle.fechaLimite)}</span></div>}
          <div style={s.infoRow}><span style={s.infoIcon}>🗓</span><span style={s.infoLabel}>Cargada</span><span style={s.infoVal}>{formatFecha(detalle.fecha)}</span></div>

          {/* Comentarios con autor */}
          <p style={{...s.label, marginTop:20}}>💬 Comentarios</p>
          {detalle.comentarios.length===0 && <p style={{ color:"#8E8E93", fontSize:14, margin:"0 0 10px" }}>Sin comentarios aún</p>}
          {detalle.comentarios.map((c,i) => {
            const autor = getUserById(c.autorId);
            const esMio = c.autorId===usuarioActivo.id;
            return (
              <div key={i} style={{
                background: esMio ? "#1C1C1E" : "#F2F2F7",
                borderRadius:14, padding:"10px 14px", marginBottom:8,
                alignSelf: esMio?"flex-end":"flex-start",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{autor?.avatar}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: esMio?"#fff": autor?.color||"#636366" }}>{autor?.nombre}</span>
                  <span style={{ fontSize:11, color: esMio?"rgba(255,255,255,0.5)":"#C7C7CC", fontWeight:400 }}>{autor?.rol}</span>
                  <span style={{ fontSize:11, color: esMio?"rgba(255,255,255,0.4)":"#C7C7CC", marginLeft:"auto" }}>{formatHora(c.ts)}</span>
                </div>
                <p style={{ margin:0, fontSize:15, color: esMio?"#fff":"#1C1C1E", lineHeight:1.4 }}>{c.texto}</p>
              </div>
            );
          })}

          {/* Input comentario */}
          <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"center" }}>
            <span style={{ fontSize:20 }}>{usuarioActivo.avatar}</span>
            <input style={{...s.inputText, flex:1}} placeholder={`Comentar como ${usuarioActivo.nombre}...`}
              value={nuevoComentario} onChange={e=>setNuevoComentario(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && agregarComentario(detalle.id)} />
            <button style={{ background:"#1C1C1E", color:"#fff", border:"none", borderRadius:12, padding:"0 16px", fontSize:15, cursor:"pointer", fontWeight:700, height:48 }}
              onClick={()=>agregarComentario(detalle.id)}>→</button>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <button style={{...s.btnPrincipal, background:"#F2F2F7", color:"#1C1C1E", flex:1}}
              onClick={()=>abrirEdicion(detalle)}>
              ✏️ Editar
            </button>
            <button style={{...s.btnPrincipal, background:detalle.resuelta?"#636366":"#34C759", flex:1}}
              onClick={()=>{ resolver(detalle.id); setVista("lista"); }}>
              {detalle.resuelta?"↩ Reabrir":"✅ Resolver"}
            </button>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:10 }}>
            <button style={{...s.btnPrincipal, background:"#F2F2F7", color:"#1C1C1E", flex:1}}
              onClick={()=>compartir(detalle)}>
              {compartidoId===detalle.id?"✅ Copiado":"📤 Compartir"}
            </button>
            <button style={{...s.btnPrincipal, background:"#25D366", flex:1}}
              onClick={()=>{ const t=generarResumen(detalle,obraActual?.nombre||"Obra"); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,"_blank"); }}>
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </span>
            </button>
          </div>
        </div>
        {mostrarCambioUsuario && <SelectorUsuario />}

        {confirmarEliminar && (
          <div style={s.modalOverlay} onClick={()=>setConfirmarEliminar(null)}>
            <div style={s.modal} onClick={e=>e.stopPropagation()}>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <span style={{ fontSize:44 }}>🗑️</span>
                <p style={{ margin:"12px 0 8px", fontSize:19, fontWeight:800, color:"#1C1C1E" }}>¿Eliminar esta novedad?</p>
                <p style={{ margin:0, fontSize:14, color:"#8E8E93", lineHeight:1.5 }}>Esta acción no se puede deshacer.</p>
              </div>
              <button style={{...s.btnPrincipal, background:"#FF3B30", marginBottom:10}}
                onClick={()=>{ eliminar(confirmarEliminar); setConfirmarEliminar(null); }}>
                Sí, eliminar
              </button>
              <button style={{...s.btnPrincipal, background:"#F2F2F7", color:"#1C1C1E"}}
                onClick={()=>setConfirmarEliminar(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════
  // NUEVA NOVEDAD
  // ════════════════════════════════════════
  if (vista==="nueva") {
    return (
      <div style={s.root}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={()=>{ setForm(FORM_INICIAL); setVista("lista"); }}>← Cancelar</button>
          <span style={s.headerTitle}>Nueva novedad</span>
          <button style={{...s.backBtn, color:"#007AFF", fontWeight:700}} onClick={guardar}>Guardar</button>
        </div>
        <div style={{ padding:"16px", flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:20 }}>
          <div>
            <p style={s.label}>📷 Fotos <span style={{ color:"#8E8E93", fontWeight:400 }}>(podés agregar varias)</span></p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{ display:"none" }} onChange={handleFotos} />
            {form.fotos.length>0 && (
              <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:10 }}>
                {form.fotos.map((f,i) => (
                  <div key={i} style={{ position:"relative", flexShrink:0 }}>
                    <img src={f} alt="" style={{ height:100, width:100, objectFit:"cover", borderRadius:12 }} />
                    <button style={s.quitarFoto} onClick={()=>quitarFoto(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button style={s.fotoBtn} onClick={()=>fileRef.current.click()}>
              <span style={{ fontSize:30 }}>📷</span>
              <span style={{ color:"#636366", fontSize:14, marginTop:4 }}>{form.fotos.length>0?"Agregar más fotos":"Tocá para sacar foto"}</span>
            </button>
          </div>
          <div>
            <p style={s.label}>📝 ¿Qué hay que resolver?</p>
            <textarea style={s.textarea} placeholder="Ej: Fisura en la pared del baño..."
              value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} rows={3} />
          </div>
          <div>
            <p style={s.label}>⚡ Prioridad</p>
            <div style={{ display:"flex", gap:10 }}>
              {PRIORIDADES.map((p,i) => (
                <button key={i} style={{ flex:1, padding:"12px 4px", borderRadius:14, border:`2px solid ${form.prioridad===i?p.color:"#E5E5EA"}`, background:form.prioridad===i?p.bg:"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}
                  onClick={()=>setForm(f=>({...f,prioridad:i}))}>
                  <span style={{ fontSize:24 }}>{p.emoji}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:form.prioridad===i?p.color:"#8E8E93" }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={s.label}>📍 Sector</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {SECTORES.map(sec => (
                <button key={sec} style={{ padding:"9px 14px", borderRadius:20, border:`2px solid ${form.sector===sec?"#007AFF":"#E5E5EA"}`, background:form.sector===sec?"#007AFF15":"#fff", color:form.sector===sec?"#007AFF":"#3A3A3C", fontWeight:form.sector===sec?700:400, fontSize:14, cursor:"pointer" }}
                  onClick={()=>setForm(f=>({...f,sector:sec, sectorCustom:""}))}>{sec}</button>
              ))}
            </div>
            {form.sector==="Otro" && (
              <input style={{...s.inputText, marginTop:10}} placeholder="Escribí el sector..."
                value={form.sectorCustom} onChange={e=>setForm(f=>({...f,sectorCustom:e.target.value}))} autoFocus />
            )}
          </div>
          <div>
            <p style={s.label}>👷 Responsable</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {RESPONSABLES.map(r => (
                <button key={r} style={{ padding:"9px 14px", borderRadius:20, border:`2px solid ${form.responsable===r?"#007AFF":"#E5E5EA"}`, background:form.responsable===r?"#007AFF15":"#fff", color:form.responsable===r?"#007AFF":"#3A3A3C", fontWeight:form.responsable===r?700:400, fontSize:14, cursor:"pointer" }}
                  onClick={()=>setForm(f=>({...f,responsable:r, responsableCustom:""}))}>{r}</button>
              ))}
            </div>
            {form.responsable==="Otro" && (
              <input style={{...s.inputText, marginTop:10}} placeholder="Escribí el responsable..."
                value={form.responsableCustom} onChange={e=>setForm(f=>({...f,responsableCustom:e.target.value}))} autoFocus />
            )}
          </div>
          <div>
            <p style={s.label}>📅 Fecha límite <span style={{ color:"#8E8E93", fontWeight:400 }}>(opcional)</span></p>
            <input type="date" style={s.inputDate} value={form.fechaLimite} onChange={e=>setForm(f=>({...f,fechaLimite:e.target.value}))} />
          </div>
          <div>
            <p style={s.label}>💬 Comentario inicial <span style={{ color:"#8E8E93", fontWeight:400 }}>(opcional)</span></p>
            <input style={s.inputText} placeholder="Ej: Revisar antes de pintar"
              value={form.comentario} onChange={e=>setForm(f=>({...f,comentario:e.target.value}))} />
          </div>
          <button style={{...s.btnPrincipal, opacity:form.descripcion.trim()?1:0.4}} onClick={guardar}>✅ Guardar novedad</button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // LISTA
  // ════════════════════════════════════════

  const novMenu = menuContextual ? novedades.find(n=>n.id===menuContextual) : null;

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <button style={{...s.backBtn, fontSize:13, color:"#8E8E93"}} onClick={()=>setVistaRaiz("inicio")}>← Obras</button>
          <p style={{ margin:"2px 0 0", fontSize:17, fontWeight:700, color:"#1C1C1E", maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{obraActual?.nombre}</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* Avatar usuario con rol */}
          <button style={{ background:"#F2F2F7", border:"none", borderRadius:20, padding:"4px 10px 4px 6px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, height:36 }}
            onClick={()=>setMostrarCambioUsuario(true)}>
            <span style={{ fontSize:18 }}>{usuarioActivo.avatar}</span>
            <span style={{ fontSize:11, fontWeight:700, color: usuarioActivo.color }}>{miRolInfo?.label}</span>
          </button>
          <button style={{ background:"#F2F2F7", border:"none", borderRadius:20, padding:"8px 12px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#1C1C1E" }}
            onClick={()=>setVistaEquipo(true)}>👥</button>
          <button style={{ background:"#F2F2F7", border:"none", borderRadius:20, padding:"8px 12px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#1C1C1E" }}
            onClick={()=>setVistaStats(true)}>📊</button>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {miRolEnObra !== "operario" && (
              <button style={{ background:"#F2F2F7", border:"none", borderRadius:20, padding:"8px 12px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#1C1C1E" }}
                onClick={()=>setVistaEquipo(true)}>👥</button>
            )}
            {miRolEnObra === "profesional" && (
              <button style={{ background:"#F2F2F7", border:"none", borderRadius:20, padding:"8px 12px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#1C1C1E" }}
                onClick={()=>setVistaStats(true)}>📊</button>
            )}
            {miRolEnObra !== "operario" && (
              <button style={s.btnNueva} onClick={()=>setVista("nueva")}>+ Nueva</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #E5E5EA" }}>
        {[
          { label:"Pendientes", val:contadores.pendientes, color:"#FF6B00" },
          { label:"Vencidas",   val:contadores.vencidas,   color:"#FF3B30" },
          { label:"Resueltas",  val:contadores.resueltas,  color:"#34C759" },
        ].map(c => (
          <div key={c.label} style={{ flex:1, textAlign:"center", padding:"8px 4px", borderRadius:10, background:"#F2F2F7" }}>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:c.color }}>{c.val}</p>
            <p style={{ margin:0, fontSize:11, color:"#8E8E93" }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding:"10px 16px 0", background:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", background:"#F2F2F7", borderRadius:12, padding:"10px 14px", gap:8 }}>
          <span style={{ fontSize:16 }}>🔍</span>
          <input style={{ border:"none", background:"transparent", fontSize:15, flex:1, outline:"none", fontFamily:"inherit" }}
            placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          {busqueda && <button style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color:"#8E8E93" }} onClick={()=>setBusqueda("")}>✕</button>}
        </div>
      </div>

      <div style={{ display:"flex", gap:8, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #E5E5EA", overflowX:"auto" }}>
        {[
          { key:"todas", label:"Todas" },
          { key:"pendientes", label:"⏳ Pendientes" },
          { key:"vencidas", label:"⚠️ Vencidas" },
          { key:"resueltas", label:"✅ Resueltas" },
        ].map(f => (
          <button key={f.key} style={{ padding:"7px 14px", borderRadius:20, border:"none", whiteSpace:"nowrap", background:filtro===f.key?"#1C1C1E":"#F2F2F7", color:filtro===f.key?"#fff":"#3A3A3C", fontWeight:filtro===f.key?700:400, fontSize:14, cursor:"pointer" }}
            onClick={()=>setFiltro(f.key)}>
            {f.label} <span style={{ opacity:0.7 }}>({contadores[f.key]})</span>
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 24px", display:"flex", flexDirection:"column", gap:10 }}>
        {novedadesFiltradas.length===0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#8E8E93" }}>
            <p style={{ fontSize:48, margin:0 }}>{busqueda?"🔍":"🎉"}</p>
            <p style={{ fontSize:18, fontWeight:600, margin:"12px 0 4px" }}>{busqueda?"Sin resultados":"Todo en orden"}</p>
            <p style={{ fontSize:14, margin:0 }}>{busqueda?`No hay novedades con "${busqueda}"`:"No hay novedades en este filtro"}</p>
          </div>
        )}
        {novedadesFiltradas.map(nov => {
          const pri = PRIORIDADES[nov.prioridad];
          const badge = estadoBadge(nov);
          const ultimoComentario = nov.comentarios[nov.comentarios.length-1];
          const autorUltimo = ultimoComentario ? getUserById(ultimoComentario.autorId) : null;
          return (
            <button key={nov.id} style={{ background:"#fff", borderRadius:18, border:`1.5px solid ${nov.resuelta?"#E5E5EA":pri.color+"40"}`, padding:0, cursor:"pointer", textAlign:"left", overflow:"hidden", boxShadow:nov.resuelta?"none":`0 2px 10px ${pri.color}15`, opacity:nov.resuelta?0.65:1 }}
              onClick={()=>{ setDetalleId(nov.id); setVista("detalle"); }}
              onContextMenu={e=>{ e.preventDefault(); setMenuContextual(nov.id); }}
              onPointerDown={e=>{
                const timer = setTimeout(()=>{ setMenuContextual(nov.id); }, 600);
                e.currentTarget._timer = timer;
              }}
              onPointerUp={e=>{ clearTimeout(e.currentTarget._timer); }}
              onPointerCancel={e=>{ clearTimeout(e.currentTarget._timer); }}
              onPointerLeave={e=>{ clearTimeout(e.currentTarget._timer); }}
              onTouchStart={e=>{ e.currentTarget._touch = setTimeout(()=>{ setMenuContextual(nov.id); }, 600); }}
              onTouchEnd={e=>{ clearTimeout(e.currentTarget._touch); }}
              onTouchMove={e=>{ clearTimeout(e.currentTarget._touch); }}>
              <div style={{ display:"flex" }}>
                <div style={{ width:5, background:nov.resuelta?"#C7C7CC":pri.color, flexShrink:0 }} />
                {nov.fotos.length>0
                  ? <img src={nov.fotos[0]} alt="" style={{ width:80, height:80, objectFit:"cover", flexShrink:0 }} />
                  : <div style={{ width:80, height:80, background:"#F2F2F7", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>📷</div>
                }
                <div style={{ padding:"10px 10px 10px 12px", flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:700, color:"#1C1C1E", lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{nov.descripcion}</p>
                  <p style={{ margin:"0 0 5px", fontSize:12, color:"#636366" }}>👷 {nov.responsable} · 📍 {nov.sector}</p>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    <span style={{...s.chip, background:pri.bg, color:pri.color, fontSize:11}}>{pri.emoji} {pri.label}</span>
                    {badge && <span style={{...s.chip, background:badge.bg, color:badge.color, fontSize:11}}>{badge.label}</span>}
                    {autorUltimo && <span style={{...s.chip, background:"#F2F2F7", color:"#636366", fontSize:11}}>💬 {autorUltimo.avatar} {autorUltimo.nombre}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", paddingRight:12, color:"#C7C7CC", fontSize:20 }}>›</div>
              </div>
            </button>
          );
        })}
      </div>
      {mostrarCambioUsuario && <SelectorUsuario />}

      {/* Menú contextual — mantener presionado */}
      {menuContextual && novMenu && (
        <div style={s.modalOverlay} onClick={()=>setMenuContextual(null)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            {/* Encabezado con info de la novedad */}
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, paddingBottom:16, borderBottom:"1px solid #F2F2F7" }}>
              <div style={{ width:8, height:40, borderRadius:99, background:PRIORIDADES[novMenu.prioridad].color, flexShrink:0 }} />
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#1C1C1E", lineHeight:1.3 }}>{novMenu.descripcion}</p>
            </div>

            {/* Opciones */}
            <button style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 4px", background:"none", border:"none", borderBottom:"1px solid #F2F2F7", cursor:"pointer", textAlign:"left" }}
              onClick={()=>{ setDetalleId(novMenu.id); setVista("detalle"); setMenuContextual(null); }}>
              <span style={{ fontSize:24 }}>✏️</span>
              <div><p style={{ margin:0, fontSize:16, fontWeight:600, color:"#1C1C1E" }}>Editar</p><p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>Modificar datos de esta novedad</p></div>
            </button>

            <button style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 4px", background:"none", border:"none", borderBottom:"1px solid #F2F2F7", cursor:"pointer", textAlign:"left" }}
              onClick={()=>{
                const texto = generarResumen(novMenu, obraActual?.nombre||"Obra");
                if (navigator.share) {
                  navigator.share({ title:"Novedad Fixgo", text:texto }).catch(()=>{});
                } else {
                  navigator.clipboard?.writeText(texto);
                }
                setMenuContextual(null);
              }}>
              <span style={{ fontSize:24 }}>📤</span>
              <div><p style={{ margin:0, fontSize:16, fontWeight:600, color:"#1C1C1E" }}>Compartir</p><p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>WhatsApp, email, o cualquier app instalada</p></div>
            </button>

            <button style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 4px", background:"none", border:"none", borderBottom:"1px solid #F2F2F7", cursor:"pointer", textAlign:"left" }}
              onClick={()=>{
                const texto = generarResumen(novMenu, obraActual?.nombre||"Obra");
                window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`,"_blank");
                setMenuContextual(null);
              }}>
              <span style={{ fontSize:24 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </span>
              <div><p style={{ margin:0, fontSize:16, fontWeight:600, color:"#1C1C1E" }}>WhatsApp</p><p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>Enviar resumen por WhatsApp</p></div>
            </button>

            {miRolEnObra !== "operario" && (
              <button style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 4px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}
                onClick={()=>{ setConfirmarEliminar(novMenu.id); setMenuContextual(null); }}>
                <span style={{ fontSize:24 }}>🗑️</span>
                <div><p style={{ margin:0, fontSize:16, fontWeight:600, color:"#FF3B30" }}>Eliminar</p><p style={{ margin:0, fontSize:13, color:"#8E8E93" }}>Borrar esta novedad permanentemente</p></div>
              </button>
            )}

            <button style={{...s.btnPrincipal, background:"#F2F2F7", color:"#8E8E93", marginTop:12}} onClick={()=>setMenuContextual(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmarEliminar && (
        <div style={s.modalOverlay} onClick={()=>setConfirmarEliminar(null)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <span style={{ fontSize:44 }}>🗑️</span>
              <p style={{ margin:"12px 0 8px", fontSize:19, fontWeight:800, color:"#1C1C1E" }}>¿Eliminar esta novedad?</p>
              <p style={{ margin:0, fontSize:14, color:"#8E8E93", lineHeight:1.5 }}>Esta acción no se puede deshacer. La novedad y todos sus comentarios serán eliminados permanentemente.</p>
            </div>
            <button style={{...s.btnPrincipal, background:"#FF3B30", marginBottom:10}}
              onClick={()=>{ eliminar(confirmarEliminar); setConfirmarEliminar(null); }}>
              Sí, eliminar
            </button>
            <button style={{...s.btnPrincipal, background:"#F2F2F7", color:"#1C1C1E"}}
              onClick={()=>setConfirmarEliminar(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  root: { maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"#F2F2F7", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif" },
  header: { background:"#fff", padding:"12px 16px 10px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #E5E5EA", position:"sticky", top:0, zIndex:10 },
  headerTitle: { fontSize:17, fontWeight:600, color:"#1C1C1E" },
  backBtn: { background:"none", border:"none", fontSize:16, color:"#007AFF", cursor:"pointer", padding:"4px 0" },
  btnNueva: { background:"#1C1C1E", color:"#fff", border:"none", borderRadius:20, padding:"10px 16px", fontSize:15, fontWeight:700, cursor:"pointer" },
  btnPrincipal: { width:"100%", padding:"16px", borderRadius:16, border:"none", background:"#1C1C1E", color:"#fff", fontSize:17, fontWeight:700, cursor:"pointer" },
  label: { margin:"0 0 8px", fontSize:15, fontWeight:600, color:"#1C1C1E" },
  textarea: { width:"100%", borderRadius:12, border:"1.5px solid #E5E5EA", padding:"12px 14px", fontSize:16, resize:"none", boxSizing:"border-box", fontFamily:"inherit", outline:"none", background:"#fff" },
  inputDate: { width:"100%", borderRadius:12, border:"1.5px solid #E5E5EA", padding:"14px", fontSize:16, boxSizing:"border-box", fontFamily:"inherit", outline:"none", background:"#fff" },
  inputText: { width:"100%", borderRadius:12, border:"1.5px solid #E5E5EA", padding:"13px 14px", fontSize:15, boxSizing:"border-box", fontFamily:"inherit", outline:"none", background:"#fff" },
  fotoBtn: { width:"100%", borderRadius:14, border:"2px dashed #C7C7CC", padding:"20px 16px", background:"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  fotoPlaceholderGrande: { width:"100%", borderRadius:16, background:"#F2F2F7", padding:"40px 16px", textAlign:"center", fontSize:48, marginBottom:16, boxSizing:"border-box" },
  chip: { display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 },
  infoRow: { display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #F2F2F7" },
  infoIcon: { fontSize:20 },
  infoLabel: { flex:1, fontSize:15, color:"#636366" },
  infoVal: { fontSize:15, fontWeight:600, color:"#1C1C1E" },
  quitarFoto: { position:"absolute", top:4, right:4, background:"#000000AA", color:"#fff", border:"none", borderRadius:20, width:24, height:24, fontSize:12, cursor:"pointer" },
  cardObra: { background:"#fff", borderRadius:18, padding:"16px", border:"1.5px solid #E5E5EA", cursor:"pointer", textAlign:"left", boxShadow:"0 2px 8px #0000000A", width:"100%" },
  modalOverlay: { position:"fixed", inset:0, background:"#00000060", display:"flex", alignItems:"flex-end", zIndex:100 },
  modal: { background:"#fff", borderRadius:"20px 20px 0 0", padding:"24px 20px 32px", width:"100%", boxSizing:"border-box" },
};
