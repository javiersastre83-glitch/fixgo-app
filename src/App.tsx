import { useState, useRef, useEffect } from "react";
import { supabase } from './supabase';

const PRIORIDADES = [
  { label:"URGENTE",  color:"#FF3B30", bg:"#FF3B3015", emoji:"🔴" },
  { label:"ATENCIÓN", color:"#FF6B00", bg:"#FF6B0015", emoji:"🟠" },
  { label:"MENOR",    color:"#FFB800", bg:"#FFB80015", emoji:"🟡" },
];
const RESPONSABLES = ["Albañil","Electricista","Plomero","Carpintero","Pintor","Jardinero","Aire acondicionado","Aberturas","Ceramista","Otro"];
const SECTORES     = ["General","Planta baja","Planta alta","Terraza","Jardín","Cocina","Baño PB","Baño PA","Dormitorio","Comedor","Garage","Otro"];
const ROLES_SISTEMA = [
  { id:"profesional", label:"Profesional", emoji:"👷‍♂️", color:"#0057FF", desc:"Arquitecto, Ingeniero o Idóneo." },
  { id:"capataz",     label:"Capataz",     emoji:"🦺",   color:"#FF6B00", desc:"Gestiona subcontratos y hace seguimiento." },
  { id:"operario",    label:"Operario",    emoji:"🔨",   color:"#8E44AD", desc:"Ejecuta las tareas." },
];
const USUARIOS_DEMO = [
  { id:"u1", nombre:"Javier",  rolSistema:"profesional", especialidad:"Arquitecto", avatar:"👷‍♂️", color:"#0057FF" },
  { id:"u2", nombre:"Carlos",  rolSistema:"operario",    especialidad:"Pintor",     avatar:"🖌️",  color:"#FF6B00" },
  { id:"u3", nombre:"Miguel",  rolSistema:"operario",    especialidad:"Albañil",    avatar:"🧱",  color:"#8E44AD" },
  { id:"u4", nombre:"Roberto", rolSistema:"capataz",     especialidad:"Capataz",    avatar:"🦺",  color:"#E67E22" },
];
const OBRAS_DEMO = [
  { id:1, nombre:"Casa Familia García",    direccion:"Av. Colón 1234, Córdoba",  equipo:[{uid:"u1",rolEnObra:"profesional"},{uid:"u2",rolEnObra:"operario"},{uid:"u3",rolEnObra:"operario"},{uid:"u4",rolEnObra:"capataz"}] },
  { id:2, nombre:"Local Comercial Centro", direccion:"San Martín 450, Córdoba",  equipo:[{uid:"u1",rolEnObra:"profesional"},{uid:"u2",rolEnObra:"operario"}] },
];
const NOVEDADES_DEMO = [
  { id:1, fotos:["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80","https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80"],
    descripcion:"Revoque exterior fisura en esquina NE", responsable:"Albañil", sector:"Planta baja", prioridad:0, fechaLimite:"2026-06-10", resuelta:false, fecha:"2026-05-17",
    comentarios:[{texto:"Revisar antes de pintar",autorId:"u1",ts:Date.now()-86400000*2},{texto:"Ya lo vi, necesito mezcla especial",autorId:"u3",ts:Date.now()-86400000}]},
  { id:2, fotos:["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80"],
    descripcion:"Falta toma de corriente en baño planta alta", responsable:"Electricista", sector:"Baño PA", prioridad:1, fechaLimite:"2026-06-20", resuelta:false, fecha:"2026-05-18",
    comentarios:[{texto:"La canalización no está terminada todavía",autorId:"u4",ts:Date.now()-86400000}]},
  { id:3, fotos:["https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80"],
    descripcion:"Pintura terminada en comedor", responsable:"Pintor", sector:"Comedor", prioridad:2, fechaLimite:"", resuelta:true, fecha:"2026-05-15",
    comentarios:[{texto:"Listo, dos manos aplicadas",autorId:"u2",ts:Date.now()-86400000*3},{texto:"Confirmado, quedó excelente 👍",autorId:"u1",ts:Date.now()-86400000*2}]},
];
const FORM_INICIAL = { fotos:[], descripcion:"", responsable:RESPONSABLES[0], responsableCustom:"", sector:SECTORES[0], sectorCustom:"", prioridad:1, fechaLimite:"", comentario:"" };

const formatFecha = (iso) => { if(!iso) return ""; const d=new Date(iso+"T00:00:00"); return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"}); };
const formatHora  = (ts)  => { const d=new Date(ts); return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); };
const diasRestantes = (f) => { if(!f) return null; const h=new Date(); h.setHours(0,0,0,0); return Math.ceil((new Date(f+"T00:00:00")-h)/(864e5)); };
const estadoBadge = (nov) => {
  if(nov.resuelta) return {label:"✅ Resuelto",color:"#34C759",bg:"#34C75920"};
  const d=diasRestantes(nov.fechaLimite); if(d===null) return null;
  if(d<0)  return {label:`⚠️ Vencida hace ${Math.abs(d)}d`,color:"#FF3B30",bg:"#FF3B3020"};
  if(d===0) return {label:"⏰ Vence hoy",color:"#FF6B00",bg:"#FF6B0020"};
  if(d<=3)  return {label:`⏳ ${d}d restantes`,color:"#FF6B00",bg:"#FF6B0020"};
  return {label:`📅 ${d}d restantes`,color:"#8E8E93",bg:"#8E8E9315"};
};
const generarResumen = (nov,obraNombre) => {
  const pri=PRIORIDADES[nov.prioridad]; const badge=estadoBadge(nov);
  return [`🏗️ *${obraNombre}*`,`${pri.emoji} *${pri.label}* — ${nov.descripcion}`,`👷 Responsable: ${nov.responsable}`,`📍 Sector: ${nov.sector}`,
    nov.fechaLimite?`📅 Fecha límite: ${formatFecha(nov.fechaLimite)}`:"",badge?`Estado: ${badge.label}`:"",
    nov.comentarios.length>0?`💬 Notas: ${nov.comentarios.map(c=>c.texto).join(" | ")}`:""].filter(Boolean).join("\n");
};

// ══════════════════════════════════════════════════════
// NAVBAR — siempre visible en todas las pantallas
// ══════════════════════════════════════════════════════
const NavBar = ({ tabActiva, onTab, onPerfil }) => (
  <div style={{ background:"#fff", borderTop:"1px solid #E5E5EA", display:"flex", paddingBottom:"env(safe-area-inset-bottom)", flexShrink:0 }}>
    {[{key:"obras",icon:"🏗️",label:"Obras"},{key:"alertas",icon:"🚨",label:"Urgencias"},{key:"perfil",icon:"👤",label:"Perfil"}].map(t=>(
      <button key={t.key} onClick={()=>t.key==="perfil"?onPerfil():onTab(t.key)}
        style={{flex:1,background:"none",border:"none",padding:"10px 4px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <span style={{fontSize:22}}>{t.icon}</span>
        <span style={{fontSize:10,fontWeight:tabActiva===t.key?700:400,color:tabActiva===t.key?"#1C1C1E":"#8E8E93"}}>{t.label}</span>
        {tabActiva===t.key&&<div style={{width:4,height:4,borderRadius:99,background:"#1C1C1E"}}/>}
      </button>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════
// HEADER con breadcrumb
// ══════════════════════════════════════════════════════
const Header = ({ migas=[], accionDerecha=null, dark=false }) => {
  const bg   = dark ? "linear-gradient(135deg,#1C1C1E,#2C2C2E)" : "#fff";
  const col  = dark ? "#fff" : "#1C1C1E";
  const sub  = dark ? "rgba(255,255,255,0.5)" : "#8E8E93";
  // migas: array de {label, onClick?}  — el último es el título actual (sin onClick)
  const padre = migas.slice(0,-1);
  const actual = migas[migas.length-1];
  return (
    <div style={{background:bg,borderBottom:dark?"none":"1px solid #E5E5EA",padding:"14px 16px 10px",flexShrink:0}}>
      {padre.length>0&&(
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
          {padre.map((m,i)=>(
            <span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              {i>0&&<span style={{color:sub,fontSize:12}}>›</span>}
              <button onClick={m.onClick} style={{background:"none",border:"none",padding:0,fontSize:13,color:dark?"rgba(255,255,255,0.6)":"#007AFF",cursor:"pointer",fontWeight:500}}>
                {m.label}
              </button>
            </span>
          ))}
          <span style={{color:sub,fontSize:12}}>›</span>
          <span style={{fontSize:13,color:col,fontWeight:600}}>{actual?.label}</span>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        {padre.length>0
          ? <button onClick={padre[padre.length-1].onClick}
              style={{background:"none",border:"none",padding:0,fontSize:15,color:dark?"rgba(255,255,255,0.7)":"#007AFF",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
              ← {padre[padre.length-1].label}
            </button>
          : <div style={{width:8}}/>
        }
        {accionDerecha&&<div style={{marginLeft:"auto"}}>{accionDerecha}</div>}
      </div>
    </div>
  );
};

export default function App({ session }) {
  const usuarioReal = session?.user||null;
  const [usuarioActivo,    setUsuarioActivo]    = useState(USUARIOS_DEMO[0]);
  const [mostrarCambioUsuario, setMostrarCambioUsuario] = useState(false);
  const [vistaRaiz,        setVistaRaiz]        = useState("inicio");
  const [obraActual,       setObraActual]       = useState(null);
  const [obras,            setObras]            = useState(OBRAS_DEMO);
  const [novedadesPorObra, setNovedadesPorObra] = useState({1:NOVEDADES_DEMO,2:[]});
  const [vista,            setVista]            = useState("lista");
  const [form,             setForm]             = useState(FORM_INICIAL);
  const [detalleId,        setDetalleId]        = useState(null);
  const [filtro,           setFiltro]           = useState("todas");
  const [busqueda,         setBusqueda]         = useState("");
  const [nuevoComentario,  setNuevoComentario]  = useState("");
  const [modalNuevaObra,   setModalNuevaObra]   = useState(false);
  const [nuevaObraForm,    setNuevaObraForm]    = useState({nombre:"",direccion:""});
  const [vistaStats,       setVistaStats]       = useState(false);
  const [vistaEquipo,      setVistaEquipo]      = useState(false);
  const [miembroSel,       setMiembroSel]       = useState(null);
  const [vistaPerfil,      setVistaPerfil]      = useState(false);
  const [vistaInfoApp,     setVistaInfoApp]     = useState(false);
  const [modoOscuro,       setModoOscuro]       = useState(false);
  const [tabActiva,        setTabActiva]        = useState("obras");
  const [compartidoId,     setCompartidoId]     = useState(null);
  const [modalPro,         setModalPro]         = useState(false);
  const [menuContextual,   setMenuContextual]   = useState(null);
  const [confirmarEliminar,setConfirmarEliminar]= useState(null);
  const [menuObra,         setMenuObra]         = useState(null);
  const [confirmarEliminarObra,setConfirmarEliminarObra]=useState(null);
  const [modalProObra,     setModalProObra]     = useState(false);
  const [editando,         setEditando]         = useState(false);
  const [formEdit,         setFormEdit]         = useState(null);
  const [perfilForm,       setPerfilForm]       = useState({nombre:"",especialidad:"",email:""});
  const esVersionPro = false;
  const fileRef = useRef();

  const novedades    = obraActual?(novedadesPorObra[obraActual.id]||[]):[];
  const setNovedades = (fn)=>setNovedadesPorObra(p=>({...p,[obraActual.id]:typeof fn==="function"?fn(p[obraActual.id]||[]):fn}));
  const equipoObra   = obraActual?(obraActual.equipo||[]).map(m=>{const u=USUARIOS_DEMO.find(u=>u.id===m.uid);return u?{...u,rolEnObra:m.rolEnObra}:null;}).filter(Boolean):[];
  const usuarioActivoReal = usuarioReal?{id:usuarioReal.id,nombre:usuarioReal.user_metadata?.full_name||usuarioReal.email?.split("@")[0]||"Usuario",rolSistema:"profesional",especialidad:"Profesional",avatar:"👷‍♂️",color:"#0057FF"}:usuarioActivo;
  const miRolEnObra  = obraActual?(obraActual.equipo||[]).find(m=>m.uid===usuarioActivo.id)?.rolEnObra||"operario":usuarioActivo.rolSistema;
  const miRolInfo    = ROLES_SISTEMA.find(r=>r.id===miRolEnObra);
  const getUserById  = (id)=>USUARIOS_DEMO.find(u=>u.id===id);

  useEffect(()=>{
    if(!usuarioReal)return;
    (async()=>{
      const{data}=await supabase.from("obras").select("*").eq("propietario_id",usuarioReal.id);
      if(data&&data.length>0){
        setObras(data);
        const novsPorObra={};
        for(const obra of data){
          const{data:novs}=await supabase.from("novedades").select("*,comentarios(*)").eq("obra_id",obra.id);
          novsPorObra[obra.id]=(novs||[]).map(n=>({...n,fotos:n.fotos||[],comentarios:(n.comentarios||[]).map(c=>({texto:c.texto,autorId:c.autor_id,ts:new Date(c.created_at).getTime()}))}));
        }
        setNovedadesPorObra(novsPorObra);
      }
    })();
  },[usuarioReal]);

  useEffect(()=>{
    setPerfilForm({nombre:usuarioActivoReal.nombre,especialidad:usuarioActivo.especialidad,email:usuarioReal?.email||"demo@fixgo.app"});
  },[usuarioActivo.id,usuarioReal?.id]);

  const handleFotos=(e)=>{Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setForm(ff=>({...ff,fotos:[...ff.fotos,ev.target.result]}));r.readAsDataURL(f);});};
  const quitarFoto=(idx)=>setForm(f=>({...f,fotos:f.fotos.filter((_,i)=>i!==idx)}));

  const guardar=async()=>{
    if(!form.descripcion.trim())return;
    const resp=form.responsable==="Otro"&&form.responsableCustom.trim()?form.responsableCustom.trim():form.responsable;
    const sect=form.sector==="Otro"&&form.sectorCustom.trim()?form.sectorCustom.trim():form.sector;
    if(usuarioReal&&obraActual?.id&&typeof obraActual.id==="string"){
      const{data}=await supabase.from("novedades").insert({obra_id:obraActual.id,descripcion:form.descripcion,responsable:resp,sector:sect,prioridad:form.prioridad,fecha_limite:form.fechaLimite||null,resuelta:false,fotos:form.fotos,autor_id:usuarioReal.id}).select().single();
      if(data){
        const nn={...data,fecha:data.created_at?.slice(0,10),comentarios:[]};
        if(form.comentario.trim()){await supabase.from("comentarios").insert({novedad_id:data.id,autor_id:usuarioReal.id,texto:form.comentario.trim()});nn.comentarios=[{texto:form.comentario.trim(),autorId:usuarioReal.id,ts:Date.now()}];}
        setNovedades(n=>[nn,...n]);
      }
    } else {
      setNovedades(n=>[{id:Date.now(),fotos:form.fotos,descripcion:form.descripcion,responsable:resp,sector:sect,prioridad:form.prioridad,fechaLimite:form.fechaLimite,resuelta:false,fecha:new Date().toISOString().slice(0,10),comentarios:form.comentario.trim()?[{texto:form.comentario.trim(),autorId:usuarioActivo.id,ts:Date.now()}]:[]},...n]);
    }
    setForm(FORM_INICIAL);setVista("lista");
  };

  const resolver=(id)=>setNovedades(n=>n.map(x=>x.id===id?{...x,resuelta:!x.resuelta}:x));
  const eliminar=(id)=>{setNovedades(n=>n.filter(x=>x.id!==id));setVista("lista");};
  const agregarComentario=(id)=>{if(!nuevoComentario.trim())return;setNovedades(n=>n.map(x=>x.id===id?{...x,comentarios:[...x.comentarios,{texto:nuevoComentario.trim(),autorId:usuarioActivo.id,ts:Date.now()}]}:x));setNuevoComentario("");};
  const eliminarObra=(id)=>{setObras(o=>o.filter(x=>x.id!==id));setNovedadesPorObra(p=>{const n={...p};delete n[id];return n;});setConfirmarEliminarObra(null);};
  const crearObra=()=>{if(!nuevaObraForm.nombre.trim())return;const nueva={id:Date.now(),nombre:nuevaObraForm.nombre,direccion:nuevaObraForm.direccion,equipo:[{uid:"u1",rolEnObra:"profesional"}]};setObras(o=>[...o,nueva]);setNovedadesPorObra(p=>({...p,[nueva.id]:[]}));setNuevaObraForm({nombre:"",direccion:""});setModalNuevaObra(false);};
  const abrirEdicion=(nov)=>{setFormEdit({fotos:nov.fotos,descripcion:nov.descripcion,responsable:nov.responsable,responsableCustom:"",sector:nov.sector,sectorCustom:"",prioridad:nov.prioridad,fechaLimite:nov.fechaLimite});setEditando(true);};
  const guardarEdicion=(id)=>{if(!formEdit.descripcion.trim())return;const resp=formEdit.responsable==="Otro"&&formEdit.responsableCustom.trim()?formEdit.responsableCustom.trim():formEdit.responsable;const sect=formEdit.sector==="Otro"&&formEdit.sectorCustom.trim()?formEdit.sectorCustom.trim():formEdit.sector;setNovedades(n=>n.map(x=>x.id===id?{...x,fotos:formEdit.fotos,descripcion:formEdit.descripcion,responsable:resp,sector:sect,prioridad:formEdit.prioridad,fechaLimite:formEdit.fechaLimite}:x));setEditando(false);setFormEdit(null);};
  const compartir=(nov)=>{const t=generarResumen(nov,obraActual?.nombre||"Obra");if(navigator.share)navigator.share({title:"Novedad",text:t}).catch(()=>{});else{navigator.clipboard?.writeText(t);setCompartidoId(nov.id);setTimeout(()=>setCompartidoId(null),2000);}};

  const statsResponsable=RESPONSABLES.map(r=>({nombre:r,pendientes:novedades.filter(n=>n.responsable===r&&!n.resuelta).length,resueltas:novedades.filter(n=>n.responsable===r&&n.resuelta).length,urgentes:novedades.filter(n=>n.responsable===r&&!n.resuelta&&n.prioridad===0).length})).filter(r=>r.pendientes+r.resueltas>0);

  const novedadesFiltradas=novedades.filter(n=>{
    const matchRol=miRolEnObra==="operario"?n.responsable===usuarioActivo.especialidad:true;
    const matchFiltro=filtro==="pendientes"?!n.resuelta:filtro==="resueltas"?n.resuelta:filtro==="vencidas"?!n.resuelta&&diasRestantes(n.fechaLimite)<0:true;
    const matchBusqueda=busqueda.trim()===""||n.descripcion.toLowerCase().includes(busqueda.toLowerCase())||n.responsable.toLowerCase().includes(busqueda.toLowerCase())||n.sector.toLowerCase().includes(busqueda.toLowerCase());
    return matchRol&&matchFiltro&&matchBusqueda;
  }).sort((a,b)=>{if(a.resuelta!==b.resuelta)return a.resuelta?1:-1;const da=diasRestantes(a.fechaLimite),db=diasRestantes(b.fechaLimite);if(da!==null&&db!==null)return da-db;return a.prioridad-b.prioridad;});

  const contadores={todas:novedades.length,pendientes:novedades.filter(n=>!n.resuelta).length,resueltas:novedades.filter(n=>n.resuelta).length,vencidas:novedades.filter(n=>!n.resuelta&&diasRestantes(n.fechaLimite)<0).length};
  const detalle=novedades.find(n=>n.id===detalleId);

  // helpers de navegación
  const irInicio=()=>{setVistaRaiz("inicio");setObraActual(null);setVistaPerfil(false);setVistaInfoApp(false);};
  const irObra=(obra)=>{setObraActual(obra);setVistaRaiz("obra");setVista("lista");setBusqueda("");setFiltro("todas");setVistaStats(false);setVistaEquipo(false);setMiembroSel(null);};

  const SelectorUsuario=()=>(
    <div style={s.overlay} onClick={()=>setMostrarCambioUsuario(false)}>
      <div style={s.modal} onClick={e=>e.stopPropagation()}>
        <p style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>Cambiar usuario</p>
        <p style={{margin:"0 0 16px",fontSize:13,color:"#8E8E93"}}>Solo para demo</p>
        {USUARIOS_DEMO.map(u=>{const rol=ROLES_SISTEMA.find(r=>r.id===u.rolSistema);return(
          <button key={u.id} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,border:`2px solid ${usuarioActivo.id===u.id?u.color:"#E5E5EA"}`,background:usuarioActivo.id===u.id?u.color+"15":"#fff",cursor:"pointer",marginBottom:8,textAlign:"left"}}
            onClick={()=>{setUsuarioActivo(u);setMostrarCambioUsuario(false);}}>
            <span style={{fontSize:28}}>{u.avatar}</span>
            <div style={{flex:1}}>
              <p style={{margin:0,fontWeight:700,fontSize:15,color:"#1C1C1E"}}>{u.nombre}</p>
              <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
                <span style={{fontSize:11,fontWeight:700,color:u.color,background:u.color+"15",padding:"2px 8px",borderRadius:99}}>{rol?.emoji} {rol?.label}</span>
                <span style={{fontSize:12,color:"#8E8E93"}}>{u.especialidad}</span>
              </div>
            </div>
            {usuarioActivo.id===u.id&&<span style={{color:u.color,fontSize:18}}>✓</span>}
          </button>
        );})}
      </div>
    </div>
  );

  // ─────────────────────────────
  // INFO APP
  // ─────────────────────────────
  if(vistaInfoApp) return(
    <div style={s.root}>
      <Header migas={[{label:"Inicio",onClick:irInicio},{label:"Fixgo"}]} />
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"linear-gradient(135deg,#1C1C1E,#3A3A3C)",borderRadius:20,padding:"28px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{width:88,height:88,borderRadius:22,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
            <img src="/Fixgo_logo.png" alt="Fixgo" style={{width:88,height:88,objectFit:"cover"}}/>
          </div>
          <p style={{margin:0,fontSize:28,fontWeight:900,color:"#fff",letterSpacing:-1}}>Fixgo</p>
          <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,0.5)"}}>Versión 1.0.0</p>
        </div>
        <p style={{margin:"4px 0 0",fontSize:12,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>Planes</p>
        <div style={{background:"#fff",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #F2F2F7"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:"#1C1C1E"}}>Plan Gratuito</p>
              <span style={{background:"#F2F2F7",borderRadius:99,padding:"3px 10px",fontSize:12,color:"#636366",fontWeight:600}}>Actual</span>
            </div>
            <p style={{margin:0,fontSize:13,color:"#8E8E93"}}>✅ 1 proyecto · ✅ Novedades ilimitadas · ❌ Estadísticas avanzadas</p>
          </div>
          <div style={{padding:"14px 16px",background:"#FFB80008"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:"#1C1C1E"}}>Plan Pro</p>
              <span style={{background:"#FFB800",borderRadius:99,padding:"3px 10px",fontSize:12,color:"#1C1C1E",fontWeight:800}}>✨ PRO</span>
            </div>
            <p style={{margin:0,fontSize:13,color:"#8E8E93",marginBottom:10}}>✅ Proyectos ilimitados · ✅ Estadísticas avanzadas · ✅ Ranking · ✅ Filtros</p>
            <button style={{width:"100%",padding:"12px",borderRadius:12,background:"#FFB800",color:"#1C1C1E",border:"none",fontSize:15,fontWeight:800,cursor:"pointer"}}>🚀 Activar Plan Pro</button>
          </div>
        </div>
        {[["Contacto y soporte",[{icon:"💬",label:"Contactarnos",sub:"Escribinos por cualquier consulta"},{icon:"🐛",label:"Reportar un problema",sub:"Ayudanos a mejorar Fixgo"},{icon:"❓",label:"Preguntas frecuentes",sub:"Guías y ayuda"}]],
          ["Legal",[{icon:"📄",label:"Términos y condiciones"},{icon:"🔒",label:"Política de privacidad"}]]].map(([titulo,items])=>(
          <div key={titulo}>
            <p style={{margin:"4px 0 8px",fontSize:12,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>{titulo}</p>
            <div style={{background:"#fff",borderRadius:16,overflow:"hidden"}}>
              {items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<items.length-1?"1px solid #F2F2F7":"none",cursor:"pointer"}}>
                  <span style={{fontSize:22}}>{item.icon}</span>
                  <div style={{flex:1}}><p style={{margin:0,fontSize:15,fontWeight:600,color:"#1C1C1E"}}>{item.label}</p>{item.sub&&<p style={{margin:0,fontSize:12,color:"#8E8E93"}}>{item.sub}</p>}</div>
                  <span style={{color:"#C7C7CC",fontSize:18}}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",marginBottom:8}}>Fixgo · Versión 1.0.0</p>
      </div>
      <NavBar tabActiva={tabActiva} onTab={(k)=>{setVistaInfoApp(false);setTabActiva(k);irInicio();}} onPerfil={()=>{setVistaInfoApp(false);setVistaPerfil(true);}} />
    </div>
  );

  // ─────────────────────────────
  // PERFIL
  // ─────────────────────────────
  if(vistaPerfil){
    const rolInfo2=ROLES_SISTEMA.find(r=>r.id===usuarioActivo.rolSistema);
    return(
      <div style={{...s.root,background:modoOscuro?"#1C1C1E":"#F2F2F7"}}>
        <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderBottom:`1px solid ${modoOscuro?"#3A3A3C":"#E5E5EA"}`,padding:"14px 16px 10px",flexShrink:0}}>
          <button onClick={()=>{setVistaPerfil(false);}} style={{background:"none",border:"none",padding:0,fontSize:15,color:"#007AFF",cursor:"pointer",fontWeight:500}}>← Volver</button>
          <p style={{margin:"4px 0 0",fontSize:22,fontWeight:800,color:modoOscuro?"#fff":"#1C1C1E"}}>Mi perfil</p>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:18,padding:"20px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:64,height:64,borderRadius:99,background:usuarioActivo.color+"20",border:`3px solid ${usuarioActivo.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>{usuarioActivo.avatar}</div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:20,fontWeight:800,color:modoOscuro?"#fff":"#1C1C1E"}}>{perfilForm.nombre}</p>
                <div style={{display:"flex",gap:6,alignItems:"center",marginTop:4}}>
                  {rolInfo2&&<span style={{fontSize:11,fontWeight:700,color:usuarioActivo.color,background:usuarioActivo.color+"15",padding:"2px 8px",borderRadius:99}}>{rolInfo2.emoji} {rolInfo2.label}</span>}
                  <span style={{fontSize:13,color:"#8E8E93"}}>{perfilForm.especialidad}</span>
                </div>
              </div>
            </div>
            {[["Nombre","nombre","Tu nombre"],["Especialidad","especialidad","Tu especialidad"],["Email","email","Tu email"]].map(([lbl,key,ph])=>(
              <div key={key}><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:"#8E8E93"}}>{lbl}</p>
              <input style={{...s.input,marginBottom:12,background:modoOscuro?"#3A3A3C":"#F2F2F7",color:modoOscuro?"#fff":"#1C1C1E",border:"none"}} value={perfilForm[key]} onChange={e=>setPerfilForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/></div>
            ))}
            <button style={{...s.btnPrincipal,background:"#1C1C1E",marginTop:4}} onClick={async()=>{setUsuarioActivo(u=>({...u,nombre:perfilForm.nombre,especialidad:perfilForm.especialidad}));if(usuarioReal)await supabase.auth.updateUser({data:{full_name:perfilForm.nombre}});alert("✅ Cambios guardados");}}>Guardar cambios</button>
          </div>
          <p style={{margin:"4px 0 0",fontSize:12,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>Preferencias</p>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
              <span style={{fontSize:22}}>{modoOscuro?"🌙":"☀️"}</span>
              <div style={{flex:1}}><p style={{margin:0,fontSize:15,fontWeight:600,color:modoOscuro?"#fff":"#1C1C1E"}}>Modo oscuro</p></div>
              <div style={{width:50,height:28,borderRadius:99,background:modoOscuro?"#34C759":"#E5E5EA",cursor:"pointer",position:"relative"}} onClick={()=>setModoOscuro(m=>!m)}>
                <div style={{width:24,height:24,borderRadius:99,background:"#fff",position:"absolute",top:2,left:modoOscuro?24:2,transition:"left .2s",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}}/>
              </div>
            </div>
          </div>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #F2F2F7",cursor:"pointer"}} onClick={async()=>{if(window.confirm("¿Cerrar sesión?"))await supabase.auth.signOut();}}>
              <span style={{fontSize:22}}>🚪</span><p style={{margin:0,flex:1,fontSize:15,fontWeight:600,color:"#FF6B00"}}>Cerrar sesión</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
              <span style={{fontSize:22}}>🗑️</span><p style={{margin:0,flex:1,fontSize:15,fontWeight:600,color:"#FF3B30"}}>Eliminar cuenta</p>
            </div>
          </div>
          <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",marginBottom:8}}>Fixgo · Versión 1.0.0</p>
        </div>
        <NavBar tabActiva="perfil" onTab={(k)=>{setVistaPerfil(false);setTabActiva(k);}} onPerfil={()=>{}} />
      </div>
    );
  }

  // ─────────────────────────────
  // ALERTAS
  // ─────────────────────────────
  if(tabActiva==="alertas"&&vistaRaiz==="inicio"){
    // Solo novedades URGENTES que vencen en menos de 24hs (o ya vencidas)
    const urgencias = [];
    obras.forEach(obra => {
      const novs = novedadesPorObra[obra.id] || [];
      novs.forEach(nov => {
        if (nov.resuelta) return;
        if (nov.prioridad !== 0) return; // solo URGENTE
        const d = diasRestantes(nov.fechaLimite);
        // Vencidas o vencen hoy (menos de 24hs)
        if (d !== null && d <= 0) {
          urgencias.push({
            key: `urg-${nov.id}`,
            texto: d < 0 ? `Vencida hace ${Math.abs(d)} dia${Math.abs(d)!==1?"s":""}` : "Vence hoy",
            descripcion: nov.descripcion,
            sub: `${obra.nombre} · ${nov.responsable}`,
            obraId: obra.id,
            novId: nov.id,
            dias: d,
          });
        }
      });
    });
    urgencias.sort((a,b) => a.dias - b.dias);

    const irAUrgencia = (u) => {
      const obra = obras.find(o=>o.id===u.obraId);
      if (!obra) return;
      setObraActual(obra);
      setVistaRaiz("obra");
      setDetalleId(u.novId);
      setVista("detalle");
      setTabActiva("obras");
    };

    return(
      <div style={s.root}>
        <div style={{background:"linear-gradient(135deg,#FF3B30,#C0392B)",padding:"22px 16px 16px",flexShrink:0}}>
          <p style={{margin:0,fontSize:24,fontWeight:900,color:"#fff"}}>🚨 Urgencias</p>
          <p style={{margin:"6px 0 0",fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.4}}>
            Aquí solo se muestran las tareas urgentes que vencen en menos de 24hs
          </p>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
          {urgencias.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#8E8E93"}}>
              <p style={{fontSize:44,margin:0}}>✅</p>
              <p style={{fontSize:17,fontWeight:600,margin:"12px 0 6px",color:"#3A3A3C"}}>Sin urgencias</p>
              <p style={{fontSize:14,margin:0,lineHeight:1.5}}>No hay tareas urgentes vencidas{"
"}ni que venzan hoy</p>
            </div>
          )}
          {urgencias.map(u=>(
            <button key={u.key} onClick={()=>irAUrgencia(u)}
              style={{background:"#fff",borderRadius:16,padding:"16px",display:"flex",gap:12,
                alignItems:"flex-start",width:"100%",textAlign:"left",cursor:"pointer",border:"none",
                outline:"none",boxShadow:"0 2px 12px rgba(255,59,48,0.15)",
                borderLeft:"4px solid #FF3B30"}}>
              <span style={{fontSize:26,flexShrink:0}}>🔴</span>
              <div style={{flex:1,minWidth:0}}>
                <span style={{display:"inline-block",background:"#FF3B3015",color:"#FF3B30",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99,marginBottom:6}}>{u.texto}</span>
                <p style={{margin:0,fontSize:15,fontWeight:700,color:"#1C1C1E",lineHeight:1.4}}>{u.descripcion}</p>
                <p style={{margin:"4px 0 0",fontSize:12,color:"#8E8E93"}}>{u.sub}</p>
              </div>
              <span style={{color:"#C7C7CC",fontSize:18,flexShrink:0,alignSelf:"center"}}>›</span>
            </button>
          ))}
        </div>
        <NavBar tabActiva="alertas" onTab={k=>{setTabActiva(k);}} onPerfil={()=>setVistaPerfil(true)} />
      </div>
    );
  }

  // ─────────────────────────────
  // INICIO (lista de obras)
  // ─────────────────────────────
  if(vistaRaiz==="inicio"){
    const totalPend=Object.values(novedadesPorObra).flat().filter(n=>!n.resuelta).length;
    const totalVenc=Object.values(novedadesPorObra).flat().filter(n=>!n.resuelta&&diasRestantes(n.fechaLimite)<0).length;
    return(
      <div style={s.root}>
        <div style={{background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)",padding:"28px 20px 20px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                <button onClick={()=>setVistaInfoApp(true)} style={{width:44,height:44,borderRadius:13,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0,padding:0,overflow:"hidden"}}>
                  <img src="/Fixgo_logo.png" alt="Fixgo" style={{width:44,height:44,objectFit:"cover",borderRadius:13}}/>
                </button>
                <p style={{margin:0,fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>Fixgo</p>
              </div>
              <p style={{margin:0,fontSize:14,color:"rgba(255,255,255,0.6)"}}>
                {obras.length} obra{obras.length!==1?"s":""} · {totalPend} pendiente{totalPend!==1?"s":""}
                {totalVenc>0&&<span style={{color:"#FFD60A",fontWeight:700}}> · ⚠️ {totalVenc} vencida{totalVenc!==1?"s":""}</span>}
              </p>
            </div>
            <button style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:12,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}} onClick={()=>setMostrarCambioUsuario(true)}>
              <span style={{fontSize:22}}>{usuarioActivo.avatar}</span>
              <div style={{textAlign:"left"}}><p style={{margin:0,fontSize:13,fontWeight:700,color:"#fff"}}>{usuarioActivoReal.nombre}</p><p style={{margin:0,fontSize:11,color:usuarioActivo.color}}>{usuarioActivo.especialidad}</p></div>
            </button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          {obras.map(obra=>{
            const novs=novedadesPorObra[obra.id]||[];
            const pend=novs.filter(n=>!n.resuelta).length;
            const venc=novs.filter(n=>!n.resuelta&&diasRestantes(n.fechaLimite)<0).length;
            const res=novs.filter(n=>n.resuelta).length;
            const prog=novs.length>0?Math.round((res/novs.length)*100):0;
            const equipo=(obra.equipo||[]).map(m=>{const u=USUARIOS_DEMO.find(u=>u.id===m.uid);return u?{...u,rolEnObra:m.rolEnObra}:null;}).filter(Boolean);
            return(
              <button key={obra.id} style={s.cardObra} onClick={()=>irObra(obra)}
                onContextMenu={e=>{e.preventDefault();setMenuObra(obra.id);}}
                onPointerDown={e=>{const t=setTimeout(()=>setMenuObra(obra.id),600);e.currentTarget._t=t;}} onPointerUp={e=>clearTimeout(e.currentTarget._t)} onPointerLeave={e=>clearTimeout(e.currentTarget._t)}
                onTouchStart={e=>{e.currentTarget._tt=setTimeout(()=>setMenuObra(obra.id),600);}} onTouchEnd={e=>clearTimeout(e.currentTarget._tt)} onTouchMove={e=>clearTimeout(e.currentTarget._tt)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{flex:1,textAlign:"left"}}>
                    <p style={{margin:0,fontSize:17,fontWeight:700,color:"#1C1C1E"}}>{obra.nombre}</p>
                    <p style={{margin:"3px 0 0",fontSize:13,color:"#8E8E93"}}>📍 {obra.direccion||"Sin dirección"}</p>
                  </div>
                  <span style={{fontSize:22,color:"#C7C7CC",marginLeft:8}}>›</span>
                </div>
                <div style={{display:"flex",gap:4,marginBottom:10}}>
                  {equipo.map(u=><div key={u.id} title={`${u.nombre} · ${u.especialidad}`} style={{width:30,height:30,borderRadius:99,background:u.color+"20",border:`2px solid ${u.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{u.avatar}</div>)}
                </div>
                {novs.length>0&&<div style={{marginBottom:10}}><div style={{height:6,background:"#F2F2F7",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${prog}%`,background:"#34C759",borderRadius:99}}/></div><p style={{margin:"4px 0 0",fontSize:12,color:"#8E8E93"}}>{prog}% resuelto · {novs.length} novedad{novs.length!==1?"es":""}</p></div>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{...s.chip,background:"#FF6B0015",color:"#FF6B00"}}>⏳ {pend} pendiente{pend!==1?"s":""}</span>
                  {venc>0&&<span style={{...s.chip,background:"#FF3B3020",color:"#FF3B30",fontWeight:700}}>⚠️ {venc} vencida{venc!==1?"s":""}</span>}
                  <span style={{...s.chip,background:"#34C75915",color:"#34C759"}}>✅ {res}</span>
                </div>
              </button>
            );
          })}
          <button style={{width:"100%",border:"2px dashed #C7C7CC",background:"transparent",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"20px",cursor:"pointer"}}
            onClick={()=>{if(!esVersionPro&&obras.length>=1)setModalProObra(true);else setModalNuevaObra(true);}}>
            <span style={{fontSize:26,color:"#C7C7CC"}}>+</span><span style={{fontSize:16,fontWeight:600,color:"#8E8E93"}}>Nueva obra</span>
          </button>
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);}} onPerfil={()=>setVistaPerfil(true)} />

        {modalNuevaObra&&<div style={s.overlay} onClick={()=>setModalNuevaObra(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 16px",fontSize:18,fontWeight:700}}>Nueva obra</p><input style={s.input} placeholder="Nombre de la obra *" value={nuevaObraForm.nombre} onChange={e=>setNuevaObraForm(f=>({...f,nombre:e.target.value}))}/><input style={{...s.input,marginTop:10}} placeholder="Dirección (opcional)" value={nuevaObraForm.direccion} onChange={e=>setNuevaObraForm(f=>({...f,direccion:e.target.value}))}/><div style={{display:"flex",gap:10,marginTop:20}}><button style={{...s.btnPrincipal,background:"#E5E5EA",color:"#1C1C1E",flex:1}} onClick={()=>setModalNuevaObra(false)}>Cancelar</button><button style={{...s.btnPrincipal,flex:1,opacity:nuevaObraForm.nombre.trim()?1:0.4}} onClick={crearObra}>Crear</button></div></div></div>}
        {modalProObra&&<div style={s.overlay} onClick={()=>setModalProObra(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:16}}><span style={{fontSize:40}}>🔒</span><p style={{margin:"8px 0 4px",fontSize:20,fontWeight:800}}>Función Pro</p><p style={{margin:0,fontSize:14,color:"#8E8E93"}}>Crear más de 1 obra es parte de la versión Pro.</p></div><button style={{...s.btnPrincipal,background:"#FFB800",color:"#1C1C1E",marginBottom:10}}>🚀 Activar versión Pro</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#8E8E93"}} onClick={()=>setModalProObra(false)}>Ahora no</button></div></div>}
        {menuObra&&<div style={s.overlay} onClick={()=>setMenuObra(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 16px",fontSize:17,fontWeight:700}}>Opciones de obra</p><button style={{...s.btnPrincipal,background:"#FF3B3010",color:"#FF3B30",marginBottom:10}} onClick={()=>{setConfirmarEliminarObra(menuObra);setMenuObra(null);}}>🗑️ Eliminar obra</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#8E8E93"}} onClick={()=>setMenuObra(null)}>Cancelar</button></div></div>}
        {confirmarEliminarObra&&<div style={s.overlay} onClick={()=>setConfirmarEliminarObra(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar esta obra?</p><p style={{margin:0,fontSize:14,color:"#8E8E93"}}>Se borrarán todas sus novedades. No se puede deshacer.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>eliminarObra(confirmarEliminarObra)}>Sí, eliminar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminarObra(null)}>Cancelar</button></div></div>}
        {mostrarCambioUsuario&&<SelectorUsuario/>}
      </div>
    );
  }

  // ─────────────────────────────
  // TAREAS DE UN MIEMBRO
  // ─────────────────────────────
  if(vistaEquipo&&miembroSel){
    const u=miembroSel;
    const tareasU=novedades.filter(n=>n.responsable===u.especialidad);
    const pend=tareasU.filter(n=>!n.resuelta);
    const res=tareasU.filter(n=>n.resuelta);
    const rolU=ROLES_SISTEMA.find(r=>r.id===u.rolEnObra);
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>{setVistaEquipo(false);setMiembroSel(null);}},{label:"Equipo",onClick:()=>setMiembroSel(null)},{label:u.nombre}]} />
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#fff",borderRadius:18,padding:"16px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:99,background:u.color+"15",border:`2px solid ${u.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{u.avatar}</div>
            <div style={{flex:1}}><p style={{margin:0,fontWeight:800,fontSize:18,color:"#1C1C1E"}}>{u.nombre}</p>
              <div style={{display:"flex",gap:6,alignItems:"center",marginTop:4}}>{rolU&&<span style={{fontSize:11,fontWeight:700,color:u.color,background:u.color+"15",padding:"2px 8px",borderRadius:99}}>{rolU.emoji} {rolU.label}</span>}<span style={{fontSize:13,color:"#8E8E93"}}>{u.especialidad}</span></div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            {[["#FF6B00",pend.length,"Pendientes"],["#34C759",res.length,"Resueltas"],["#1C1C1E",tareasU.length,"Total"]].map(([col,val,lbl])=>(
              <div key={lbl} style={{flex:1,background:"#fff",borderRadius:14,padding:"12px",textAlign:"center"}}><p style={{margin:0,fontSize:26,fontWeight:800,color:col}}>{val}</p><p style={{margin:0,fontSize:12,color:"#8E8E93"}}>{lbl}</p></div>
            ))}
          </div>
          {[["⏳ Pendientes",pend],["✅ Resueltas",res]].map(([titulo,lista])=>lista.length>0&&(
            <div key={titulo}><p style={{margin:"4px 0 8px",fontSize:13,color:"#8E8E93",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{titulo}</p>
              {lista.map(nov=>{const pri=PRIORIDADES[nov.prioridad];const badge=estadoBadge(nov);return(
                <button key={nov.id} style={{width:"100%",background:"#fff",borderRadius:16,border:`1.5px solid ${nov.resuelta?"#E5E5EA":pri.color+"40"}`,padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",marginBottom:8,opacity:nov.resuelta?0.7:1}}
                  onClick={()=>{setDetalleId(nov.id);setMiembroSel(null);setVistaEquipo(false);setVista("detalle");}}>
                  <div style={{display:"flex"}}><div style={{width:5,background:nov.resuelta?"#C7C7CC":pri.color,flexShrink:0}}/>
                    {nov.fotos.length>0?<img src={nov.fotos[0]} alt="" style={{width:70,height:70,objectFit:"cover",flexShrink:0}}/>:<div style={{width:70,height:70,background:"#F2F2F7",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📷</div>}
                    <div style={{padding:"10px 12px",flex:1,minWidth:0}}>
                      <p style={{margin:"0 0 3px",fontSize:14,fontWeight:700,color:"#1C1C1E",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nov.descripcion}</p>
                      <p style={{margin:"0 0 5px",fontSize:12,color:"#636366"}}>📍 {nov.sector}</p>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}><span style={{...s.chip,background:pri.bg,color:pri.color,fontSize:11}}>{pri.emoji} {pri.label}</span>{badge&&<span style={{...s.chip,background:badge.bg,color:badge.color,fontSize:11}}>{badge.label}</span>}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",paddingRight:10,color:"#C7C7CC",fontSize:18}}>›</div>
                  </div>
                </button>
              );})}
            </div>
          ))}
          {tareasU.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#8E8E93"}}><p style={{fontSize:40,margin:0}}>🎉</p><p style={{fontSize:16,fontWeight:600,margin:"10px 0 4px"}}>Sin tareas asignadas</p></div>}
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
      </div>
    );
  }

  // ─────────────────────────────
  // EQUIPO
  // ─────────────────────────────
  if(vistaEquipo){
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>setVistaEquipo(false)},{label:"Equipo"}]} />
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          {equipoObra.map(u=>{
            const pend=novedades.filter(n=>n.responsable===u.especialidad&&!n.resuelta).length;
            const res=novedades.filter(n=>n.responsable===u.especialidad&&n.resuelta).length;
            return(
              <button key={u.id} style={{background:"#fff",borderRadius:18,padding:"16px",border:`1.5px solid ${u.color}25`,textAlign:"left",cursor:"pointer",width:"100%"}} onClick={()=>setMiembroSel(u)}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:50,height:50,borderRadius:99,background:u.color+"15",border:`2px solid ${u.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{u.avatar}</div>
                  <div style={{flex:1}}><p style={{margin:0,fontWeight:700,fontSize:17,color:"#1C1C1E"}}>{u.nombre}</p>
                    <div style={{display:"flex",gap:6,marginTop:2}}>{(()=>{const r=ROLES_SISTEMA.find(r=>r.id===u.rolEnObra);return r?<span style={{fontSize:11,fontWeight:700,color:u.color,background:u.color+"15",padding:"2px 8px",borderRadius:99}}>{r.emoji} {r.label}</span>:null;})()}<span style={{fontSize:13,color:"#8E8E93"}}>{u.especialidad}</span></div>
                  </div>
                  {u.id===usuarioActivo.id?<span style={{...s.chip,background:"#1C1C1E",color:"#fff",fontSize:11}}>Vos</span>:<span style={{color:"#C7C7CC",fontSize:18}}>›</span>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,background:"#F2F2F7",borderRadius:12,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:20,fontWeight:800,color:"#FF6B00"}}>{pend}</p><p style={{margin:0,fontSize:11,color:"#8E8E93"}}>Pendientes</p></div>
                  <div style={{flex:1,background:"#F2F2F7",borderRadius:12,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:20,fontWeight:800,color:"#34C759"}}>{res}</p><p style={{margin:0,fontSize:11,color:"#8E8E93"}}>Resueltas</p></div>
                </div>
              </button>
            );
          })}
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
      </div>
    );
  }

  // ─────────────────────────────
  // ESTADÍSTICAS
  // ─────────────────────────────
  if(vistaStats){
    const totalNovs=novedades.length;
    const pctResuelto=totalNovs>0?Math.round((contadores.resueltas/totalNovs)*100):0;
    const pctVenc=totalNovs>0?Math.round((contadores.vencidas/totalNovs)*100):0;
    const getMedalla=(r)=>{const total=r.pendientes+r.resueltas;if(!total)return null;const pct=Math.round((r.resueltas/total)*100);if(pct===100)return"🥇";if(pct>=75)return"🥈";if(pct>=50)return"🥉";if(r.urgentes>0)return"⚠️";return null;};
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>setVistaStats(false)},{label:"Estadísticas"}]} />
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#fff",borderRadius:16,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
                <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#F2F2F7" strokeWidth="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="#34C759" strokeWidth="7" strokeDasharray={`${pctResuelto*1.634} 163.4`} strokeLinecap="round" strokeDashoffset="40.85" transform="rotate(-90 32 32)"/></svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#1C1C1E"}}>{pctResuelto}%</div>
              </div>
              <div><p style={{margin:0,fontSize:17,fontWeight:700,color:"#1C1C1E"}}>Avance general</p><p style={{margin:0,fontSize:13,color:"#8E8E93"}}>{contadores.resueltas} de {totalNovs} resueltas</p>{pctVenc>0&&<p style={{margin:"4px 0 0",fontSize:12,color:"#FF3B30",fontWeight:600}}>⚠️ {pctVenc}% vencidas</p>}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[["Total",totalNovs,"#1C1C1E"],["Pendientes",contadores.pendientes,"#FF6B00"],["Vencidas",contadores.vencidas,"#FF3B30"],["Resueltas",contadores.resueltas,"#34C759"]].map(([lbl,val,col])=>(
                <div key={lbl} style={{flex:1,background:"#F2F2F7",borderRadius:10,padding:"8px 4px",textAlign:"center"}}><p style={{margin:0,fontSize:20,fontWeight:800,color:col}}>{val}</p><p style={{margin:0,fontSize:10,color:"#8E8E93"}}>{lbl}</p></div>
              ))}
            </div>
          </div>
          <p style={{margin:"4px 0 4px",fontSize:13,color:"#8E8E93",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Por responsable</p>
          {statsResponsable.length===0&&<p style={{color:"#8E8E93",textAlign:"center",padding:"40px 0"}}>Sin datos aún</p>}
          {statsResponsable.map(r=>{const total=r.pendientes+r.resueltas;const pct=total>0?Math.round((r.resueltas/total)*100):0;const med=getMedalla(r);return(
            <div key={r.nombre} style={{background:"#fff",borderRadius:16,padding:"14px 16px",position:"relative",overflow:"hidden",cursor:"pointer"}} onClick={()=>setModalPro(true)}>
              <div style={{position:"absolute",top:10,right:10,background:"#FFB80020",borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#FFB800"}}>✨ Pro</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:15}}>👷 {r.nombre} {med&&<span>{med}</span>}</span>
                <div style={{display:"flex",gap:6}}><span style={{fontSize:13,fontWeight:800,color:pct>=75?"#34C759":pct>=50?"#FF6B00":"#FF3B30"}}>{pct}%</span>{r.urgentes>0&&<span style={{...s.chip,background:"#FF3B3015",color:"#FF3B30",fontSize:11}}>🔴 {r.urgentes}</span>}</div>
              </div>
              <div style={{height:8,background:"#F2F2F7",borderRadius:99,overflow:"hidden",marginBottom:4}}><div style={{height:"100%",width:`${pct}%`,background:pct>=75?"#34C759":pct>=50?"#FF6B00":"#FF3B30",borderRadius:99}}/></div>
              <p style={{margin:0,fontSize:12,color:"#8E8E93"}}>{r.resueltas} resueltas · {r.pendientes} pendiente{r.pendientes!==1?"s":""}</p>
            </div>
          );})}
          <div style={{background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)",borderRadius:16,padding:"20px 16px"}}>
            <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#FFB800",textTransform:"uppercase"}}>✨ Versión Pro</p>
            <p style={{margin:"0 0 16px",fontSize:17,fontWeight:800,color:"#fff"}}>Estadísticas avanzadas</p>
            <button style={{width:"100%",padding:"13px",borderRadius:12,background:"#FFB800",color:"#1C1C1E",border:"none",fontSize:15,fontWeight:800,cursor:"pointer"}}>🚀 Activar versión Pro</button>
          </div>
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {modalPro&&<div style={s.overlay} onClick={()=>setModalPro(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:16}}><span style={{fontSize:40}}>🔒</span><p style={{margin:"8px 0 4px",fontSize:20,fontWeight:800}}>Función Pro</p><p style={{margin:0,fontSize:14,color:"#8E8E93"}}>Esta función es parte de la versión Pro.</p></div><button style={{...s.btnPrincipal,background:"#FFB800",color:"#1C1C1E",marginBottom:10}}>🚀 Activar versión Pro</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#8E8E93"}} onClick={()=>setModalPro(false)}>Ahora no</button></div></div>}
      </div>
    );
  }

  // ─────────────────────────────
  // EDITAR NOVEDAD
  // ─────────────────────────────
  if(vista==="detalle"&&detalle&&editando&&formEdit){
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>{setEditando(false);setFormEdit(null);setVista("lista");}},{label:"Novedades",onClick:()=>{setEditando(false);setFormEdit(null);setVista("lista");}},{label:"Editar"}]}
          accionDerecha={<button style={{background:"none",border:"none",fontSize:15,color:"#34C759",fontWeight:700,cursor:"pointer"}} onClick={()=>guardarEdicion(detalle.id)}>Guardar</button>} />
        <div style={{padding:"16px",flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:20}}>
          <div><p style={s.label}>📝 Descripción</p><textarea style={s.textarea} rows={3} value={formEdit.descripcion} onChange={e=>setFormEdit(f=>({...f,descripcion:e.target.value}))}/></div>
          <div><p style={s.label}>⚡ Prioridad</p><div style={{display:"flex",gap:10}}>{PRIORIDADES.map((p,i)=><button key={i} style={{flex:1,padding:"12px 4px",borderRadius:14,border:`2px solid ${formEdit.prioridad===i?p.color:"#E5E5EA"}`,background:formEdit.prioridad===i?p.bg:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setFormEdit(f=>({...f,prioridad:i}))}><span style={{fontSize:24}}>{p.emoji}</span><span style={{fontSize:11,fontWeight:700,color:formEdit.prioridad===i?p.color:"#8E8E93"}}>{p.label}</span></button>)}</div></div>
          <div><p style={s.label}>📍 Sector</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SECTORES.map(sec=><button key={sec} style={{padding:"9px 14px",borderRadius:20,border:`2px solid ${formEdit.sector===sec?"#007AFF":"#E5E5EA"}`,background:formEdit.sector===sec?"#007AFF15":"#fff",color:formEdit.sector===sec?"#007AFF":"#3A3A3C",fontWeight:formEdit.sector===sec?700:400,fontSize:14,cursor:"pointer"}} onClick={()=>setFormEdit(f=>({...f,sector:sec,sectorCustom:""}))}>{sec}</button>)}</div>{formEdit.sector==="Otro"&&<input style={{...s.input,marginTop:10}} placeholder="Escribí el sector..." value={formEdit.sectorCustom} onChange={e=>setFormEdit(f=>({...f,sectorCustom:e.target.value}))}/>}</div>
          <div><p style={s.label}>👷 Responsable</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{RESPONSABLES.map(r=><button key={r} style={{padding:"9px 14px",borderRadius:20,border:`2px solid ${formEdit.responsable===r?"#007AFF":"#E5E5EA"}`,background:formEdit.responsable===r?"#007AFF15":"#fff",color:formEdit.responsable===r?"#007AFF":"#3A3A3C",fontWeight:formEdit.responsable===r?700:400,fontSize:14,cursor:"pointer"}} onClick={()=>setFormEdit(f=>({...f,responsable:r,responsableCustom:""}))}>{r}</button>)}</div>{formEdit.responsable==="Otro"&&<input style={{...s.input,marginTop:10}} placeholder="Escribí el responsable..." value={formEdit.responsableCustom} onChange={e=>setFormEdit(f=>({...f,responsableCustom:e.target.value}))}/>}</div>
          <div><p style={s.label}>📅 Fecha límite <span style={{color:"#8E8E93",fontWeight:400}}>(opcional)</span></p><input type="date" style={s.inputDate} value={formEdit.fechaLimite} onChange={e=>setFormEdit(f=>({...f,fechaLimite:e.target.value}))}/></div>
          <button style={{...s.btnPrincipal,background:"#34C759",opacity:formEdit.descripcion.trim()?1:0.4}} onClick={()=>guardarEdicion(detalle.id)}>✅ Guardar cambios</button>
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
      </div>
    );
  }

  // ─────────────────────────────
  // DETALLE
  // ─────────────────────────────
  if(vista==="detalle"&&detalle){
    const pri=PRIORIDADES[detalle.prioridad];const badge=estadoBadge(detalle);
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>setVista("lista")},{label:"Novedades",onClick:()=>setVista("lista")},{label:"Detalle"}]}
          accionDerecha={<button style={{background:"none",border:"none",fontSize:15,color:"#FF3B30",cursor:"pointer",fontWeight:600}} onClick={()=>setConfirmarEliminar(detalle.id)}>Borrar</button>} />
        <div style={{padding:"16px",flex:1,overflowY:"auto"}}>
          {detalle.fotos.length>0?<div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16}}>{detalle.fotos.map((f,i)=><img key={i} src={f} alt="" style={{height:200,borderRadius:14,objectFit:"cover",flexShrink:0,maxWidth:"85%"}}/>)}</div>:<div style={s.fotoPlaceholder}>📷</div>}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <span style={{...s.chip,background:pri.bg,color:pri.color,fontWeight:700}}>{pri.emoji} {pri.label}</span>
            {badge&&<span style={{...s.chip,background:badge.bg,color:badge.color,fontWeight:600}}>{badge.label}</span>}
          </div>
          <p style={{fontSize:20,fontWeight:700,color:"#1C1C1E",marginBottom:12,lineHeight:1.3}}>{detalle.descripcion}</p>
          {[["👷","Responsable",detalle.responsable],["📍","Sector",detalle.sector],detalle.fechaLimite?["📅","Fecha límite",formatFecha(detalle.fechaLimite)]:null,["🗓","Cargada",formatFecha(detalle.fecha)]].filter(Boolean).map(([ic,lb,vl])=>(
            <div key={lb} style={s.infoRow}><span style={s.infoIcon}>{ic}</span><span style={s.infoLabel}>{lb}</span><span style={s.infoVal}>{vl}</span></div>
          ))}
          <p style={{...s.label,marginTop:20}}>💬 Comentarios</p>
          {detalle.comentarios.length===0&&<p style={{color:"#8E8E93",fontSize:14,margin:"0 0 10px"}}>Sin comentarios aún</p>}
          {detalle.comentarios.map((c,i)=>{const autor=getUserById(c.autorId);const esMio=c.autorId===usuarioActivo.id;return(
            <div key={i} style={{background:esMio?"#1C1C1E":"#F2F2F7",borderRadius:14,padding:"10px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:14}}>{autor?.avatar}</span><span style={{fontSize:12,fontWeight:700,color:esMio?"#fff":autor?.color||"#636366"}}>{autor?.nombre}</span><span style={{fontSize:11,color:esMio?"rgba(255,255,255,0.4)":"#C7C7CC",marginLeft:"auto"}}>{formatHora(c.ts)}</span></div>
              <p style={{margin:0,fontSize:15,color:esMio?"#fff":"#1C1C1E",lineHeight:1.4}}>{c.texto}</p>
            </div>
          );})}
          <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
            <span style={{fontSize:20}}>{usuarioActivo.avatar}</span>
            <input style={{...s.input,flex:1}} placeholder={`Comentar como ${usuarioActivoReal.nombre}...`} value={nuevoComentario} onChange={e=>setNuevoComentario(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarComentario(detalle.id)}/>
            <button style={{background:"#1C1C1E",color:"#fff",border:"none",borderRadius:12,padding:"0 16px",fontSize:15,cursor:"pointer",fontWeight:700,height:48}} onClick={()=>agregarComentario(detalle.id)}>→</button>
          </div>
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",flex:1}} onClick={()=>abrirEdicion(detalle)}>✏️ Editar</button>
            <button style={{...s.btnPrincipal,background:detalle.resuelta?"#636366":"#34C759",flex:1}} onClick={()=>{resolver(detalle.id);setVista("lista");}}>{ detalle.resuelta?"↩ Reabrir":"✅ Resolver"}</button>
          </div>
          <div style={{display:"flex",gap:10,marginTop:10}}>
            <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",flex:1}} onClick={()=>compartir(detalle)}>{compartidoId===detalle.id?"✅ Copiado":"📤 Compartir"}</button>
            <button style={{...s.btnPrincipal,background:"#25D366",flex:1}} onClick={()=>{const t=generarResumen(detalle,obraActual?.nombre||"Obra");window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,"_blank");}}>
              <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp</span>
            </button>
          </div>
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {mostrarCambioUsuario&&<SelectorUsuario/>}
        {confirmarEliminar&&<div style={s.overlay} onClick={()=>setConfirmarEliminar(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar esta novedad?</p><p style={{margin:0,fontSize:14,color:"#8E8E93"}}>Esta acción no se puede deshacer.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>{eliminar(confirmarEliminar);setConfirmarEliminar(null);}}>Sí, eliminar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminar(null)}>Cancelar</button></div></div>}
      </div>
    );
  }

  // ─────────────────────────────
  // NUEVA NOVEDAD
  // ─────────────────────────────
  if(vista==="nueva"){
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>{setForm(FORM_INICIAL);setVista("lista");}},{label:"Novedades",onClick:()=>{setForm(FORM_INICIAL);setVista("lista");}},{label:"Nueva novedad"}]}
          accionDerecha={<button style={{background:"none",border:"none",fontSize:15,color:"#007AFF",fontWeight:700,cursor:"pointer"}} onClick={guardar}>Guardar</button>} />
        <div style={{padding:"16px",flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:20}}>
          <div><p style={s.label}>📷 Fotos <span style={{color:"#8E8E93",fontWeight:400}}>(podés agregar varias)</span></p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{display:"none"}} onChange={handleFotos}/>
            {form.fotos.length>0&&<div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:10}}>{form.fotos.map((f,i)=><div key={i} style={{position:"relative",flexShrink:0}}><img src={f} alt="" style={{height:100,width:100,objectFit:"cover",borderRadius:12}}/><button style={s.quitarFoto} onClick={()=>quitarFoto(i)}>✕</button></div>)}</div>}
            <button style={s.fotoBtn} onClick={()=>fileRef.current.click()}><span style={{fontSize:30}}>📷</span><span style={{color:"#636366",fontSize:14,marginTop:4}}>{form.fotos.length>0?"Agregar más fotos":"Tocá para sacar foto"}</span></button>
          </div>
          <div><p style={s.label}>📝 ¿Qué hay que resolver?</p><textarea style={s.textarea} placeholder="Ej: Fisura en la pared del baño..." value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} rows={3}/></div>
          <div><p style={s.label}>⚡ Prioridad</p><div style={{display:"flex",gap:10}}>{PRIORIDADES.map((p,i)=><button key={i} style={{flex:1,padding:"12px 4px",borderRadius:14,border:`2px solid ${form.prioridad===i?p.color:"#E5E5EA"}`,background:form.prioridad===i?p.bg:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setForm(f=>({...f,prioridad:i}))}><span style={{fontSize:24}}>{p.emoji}</span><span style={{fontSize:11,fontWeight:700,color:form.prioridad===i?p.color:"#8E8E93"}}>{p.label}</span></button>)}</div></div>
          <div><p style={s.label}>📍 Sector</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SECTORES.map(sec=><button key={sec} style={{padding:"9px 14px",borderRadius:20,border:`2px solid ${form.sector===sec?"#007AFF":"#E5E5EA"}`,background:form.sector===sec?"#007AFF15":"#fff",color:form.sector===sec?"#007AFF":"#3A3A3C",fontWeight:form.sector===sec?700:400,fontSize:14,cursor:"pointer"}} onClick={()=>setForm(f=>({...f,sector:sec,sectorCustom:""}))}>{sec}</button>)}</div>{form.sector==="Otro"&&<input style={{...s.input,marginTop:10}} placeholder="Escribí el sector..." value={form.sectorCustom} onChange={e=>setForm(f=>({...f,sectorCustom:e.target.value}))} autoFocus/>}</div>
          <div><p style={s.label}>👷 Responsable</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{RESPONSABLES.map(r=><button key={r} style={{padding:"9px 14px",borderRadius:20,border:`2px solid ${form.responsable===r?"#007AFF":"#E5E5EA"}`,background:form.responsable===r?"#007AFF15":"#fff",color:form.responsable===r?"#007AFF":"#3A3A3C",fontWeight:form.responsable===r?700:400,fontSize:14,cursor:"pointer"}} onClick={()=>setForm(f=>({...f,responsable:r,responsableCustom:""}))}>{r}</button>)}</div>{form.responsable==="Otro"&&<input style={{...s.input,marginTop:10}} placeholder="Escribí el responsable..." value={form.responsableCustom} onChange={e=>setForm(f=>({...f,responsableCustom:e.target.value}))} autoFocus/>}</div>
          <div><p style={s.label}>📅 Fecha límite <span style={{color:"#8E8E93",fontWeight:400}}>(opcional)</span></p><input type="date" style={s.inputDate} value={form.fechaLimite} onChange={e=>setForm(f=>({...f,fechaLimite:e.target.value}))}/></div>
          <div><p style={s.label}>💬 Nota inicial <span style={{color:"#8E8E93",fontWeight:400}}>(opcional)</span></p><input style={s.input} placeholder="Ej: Revisar antes del jueves..." value={form.comentario} onChange={e=>setForm(f=>({...f,comentario:e.target.value}))}/></div>
          <button style={{...s.btnPrincipal,opacity:form.descripcion.trim()?1:0.4}} onClick={guardar}>Guardar novedad</button>
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
      </div>
    );
  }

  // ─────────────────────────────
  // LISTA DE NOVEDADES
  // ─────────────────────────────
  return(
    <div style={s.root}>
      <div style={{background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)",padding:"16px 16px 0",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",fontSize:15,cursor:"pointer",padding:0,fontWeight:500}} onClick={irInicio}>← Obras</button>
          <div style={{display:"flex",gap:8}}>
            <button style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 12px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600}} onClick={()=>setVistaEquipo(true)}>👥 Equipo</button>
            <button style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 12px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600}} onClick={()=>setVistaStats(true)}>📊 Stats</button>
          </div>
        </div>
        <p style={{margin:0,fontSize:20,fontWeight:800,color:"#fff",lineHeight:1.2}}>{obraActual?.nombre}</p>
        <p style={{margin:"3px 0 8px",fontSize:13,color:"rgba(255,255,255,0.5)"}}>📍 {obraActual?.direccion||"Sin dirección"}</p>
        <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:12}}>
          <span style={{fontSize:14}}>{usuarioActivo.avatar}</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{usuarioActivoReal.nombre}</span>
          {miRolInfo&&<span style={{fontSize:11,fontWeight:700,color:miRolInfo.color,background:miRolInfo.color+"25",padding:"2px 8px",borderRadius:99}}>{miRolInfo.emoji} {miRolInfo.label}</span>}
          <button style={{marginLeft:"auto",background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:12,cursor:"pointer"}} onClick={()=>setMostrarCambioUsuario(true)}>cambiar</button>
        </div>
      </div>
      <div style={{background:"#fff",borderBottom:"1px solid #F2F2F7",padding:"12px 16px 0",flexShrink:0}}>
        <input style={{...s.input,marginBottom:10,background:"#F2F2F7",border:"none"}} placeholder="🔍 Buscar novedades..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>
          {[["todas",`Todas (${contadores.todas})`],["pendientes",`⏳ Pendientes (${contadores.pendientes})`],["vencidas",`⚠️ Vencidas (${contadores.vencidas})`],["resueltas",`✅ Resueltas (${contadores.resueltas})`]].map(([key,lbl])=>(
            <button key={key} style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:`1.5px solid ${filtro===key?"#1C1C1E":"#E5E5EA"}`,background:filtro===key?"#1C1C1E":"#fff",color:filtro===key?"#fff":"#636366",fontSize:13,fontWeight:filtro===key?700:400,cursor:"pointer"}} onClick={()=>setFiltro(key)}>{lbl}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {novedadesFiltradas.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"#8E8E93"}}><p style={{fontSize:44,margin:0}}>{filtro==="resueltas"?"🎉":"📋"}</p><p style={{fontSize:17,fontWeight:600,margin:"12px 0 6px",color:"#3A3A3C"}}>{filtro==="resueltas"?"No hay resueltas aún":filtro==="vencidas"?"No hay vencidas 🙌":busqueda?"Sin resultados":"Sin novedades"}</p>{filtro==="todas"&&!busqueda&&<p style={{fontSize:14,margin:0}}>Tocá + para cargar la primera novedad</p>}</div>}
        {novedadesFiltradas.map(nov=>{
          const pri=PRIORIDADES[nov.prioridad];const badge=estadoBadge(nov);
          return(
            <button key={nov.id} style={{width:"100%",background:"#fff",borderRadius:16,border:`1.5px solid ${nov.resuelta?"#E5E5EA":pri.color+"40"}`,padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",boxShadow:nov.resuelta?"none":`0 2px 8px ${pri.color}12`,opacity:nov.resuelta?0.7:1}}
              onClick={()=>{setDetalleId(nov.id);setVista("detalle");}}
              onContextMenu={e=>{e.preventDefault();setMenuContextual({novId:nov.id});}}
              onPointerDown={e=>{const t=setTimeout(()=>setMenuContextual({novId:nov.id}),600);e.currentTarget._t=t;}} onPointerUp={e=>clearTimeout(e.currentTarget._t)} onPointerLeave={e=>clearTimeout(e.currentTarget._t)}
              onTouchStart={e=>{e.currentTarget._tt=setTimeout(()=>setMenuContextual({novId:nov.id}),600);}} onTouchEnd={e=>clearTimeout(e.currentTarget._tt)} onTouchMove={e=>clearTimeout(e.currentTarget._tt)}>
              <div style={{display:"flex"}}>
                <div style={{width:5,background:nov.resuelta?"#C7C7CC":pri.color,flexShrink:0}}/>
                {nov.fotos.length>0?<img src={nov.fotos[0]} alt="" style={{width:80,height:80,objectFit:"cover",flexShrink:0}}/>:<div style={{width:80,height:80,background:"#F2F2F7",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,color:"#C7C7CC"}}>📷</div>}
                <div style={{padding:"10px 12px",flex:1,minWidth:0}}>
                  <p style={{margin:"0 0 4px",fontSize:15,fontWeight:700,color:"#1C1C1E",lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{nov.descripcion}</p>
                  <p style={{margin:"0 0 6px",fontSize:12,color:"#636366"}}>👷 {nov.responsable} · 📍 {nov.sector}</p>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}><span style={{...s.chip,background:pri.bg,color:pri.color,fontSize:11}}>{pri.emoji} {pri.label}</span>{badge&&<span style={{...s.chip,background:badge.bg,color:badge.color,fontSize:11}}>{badge.label}</span>}{nov.comentarios.length>0&&<span style={{...s.chip,background:"#007AFF15",color:"#007AFF",fontSize:11}}>💬 {nov.comentarios.length}</span>}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",paddingRight:10,color:"#C7C7CC",fontSize:18}}>›</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{padding:"12px 16px 0",background:"#fff",borderTop:"1px solid #F2F2F7",flexShrink:0}}>
        <button style={{...s.btnPrincipal,marginBottom:0}} onClick={()=>setVista("nueva")}>+ Nueva novedad</button>
      </div>
      <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />

      {menuContextual&&<div style={s.overlay} onClick={()=>setMenuContextual(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 16px",fontSize:17,fontWeight:700}}>Opciones</p><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10}} onClick={()=>{resolver(menuContextual.novId);setMenuContextual(null);}}>{novedades.find(n=>n.id===menuContextual.novId)?.resuelta?"↩ Reabrir":"✅ Marcar como resuelto"}</button><button style={{...s.btnPrincipal,background:"#FF3B3010",color:"#FF3B30",marginBottom:10}} onClick={()=>{setConfirmarEliminar(menuContextual.novId);setMenuContextual(null);}}>🗑️ Eliminar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#8E8E93"}} onClick={()=>setMenuContextual(null)}>Cancelar</button></div></div>}
      {confirmarEliminar&&!detalle&&<div style={s.overlay} onClick={()=>setConfirmarEliminar(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar esta novedad?</p><p style={{margin:0,fontSize:14,color:"#8E8E93"}}>Esta acción no se puede deshacer.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>{eliminar(confirmarEliminar);setConfirmarEliminar(null);}}>Sí, eliminar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminar(null)}>Cancelar</button></div></div>}
      {mostrarCambioUsuario&&<SelectorUsuario/>}
    </div>
  );
}

const s = {
  root:        { display:"flex", flexDirection:"column", height:"100dvh", width:"100%", background:"#F2F2F7", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", overflow:"hidden" },
  chip:        { display:"inline-flex", alignItems:"center", padding:"4px 10px", borderRadius:99, fontSize:12, fontWeight:600, whiteSpace:"nowrap" },
  label:       { fontSize:14, fontWeight:700, color:"#1C1C1E", margin:"0 0 10px" },
  input:       { width:"100%", padding:"13px 14px", borderRadius:14, border:"1.5px solid #E5E5EA", fontSize:16, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  inputDate:   { width:"100%", padding:"13px 14px", borderRadius:14, border:"1.5px solid #E5E5EA", fontSize:16, outline:"none", boxSizing:"border-box", background:"#fff" },
  textarea:    { width:"100%", padding:"13px 14px", borderRadius:14, border:"1.5px solid #E5E5EA", fontSize:16, outline:"none", resize:"none", fontFamily:"inherit", boxSizing:"border-box" },
  btnPrincipal:{ width:"100%", padding:"15px", borderRadius:14, background:"#1C1C1E", color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor:"pointer" },
  fotoBtn:     { width:"100%", border:"2px dashed #D1D1D6", borderRadius:16, padding:"20px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, background:"#F9F9F9", cursor:"pointer" },
  fotoPlaceholder:{ width:"100%", height:160, background:"#F2F2F7", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, marginBottom:16, color:"#C7C7CC" },
  infoRow:     { display:"flex", alignItems:"center", gap:10, padding:"12px 0", borderBottom:"1px solid #F2F2F7" },
  infoIcon:    { fontSize:20 },
  infoLabel:   { flex:1, fontSize:15, color:"#636366" },
  infoVal:     { fontSize:15, fontWeight:600, color:"#1C1C1E" },
  quitarFoto:  { position:"absolute", top:4, right:4, background:"#000000AA", color:"#fff", border:"none", borderRadius:20, width:24, height:24, fontSize:12, cursor:"pointer" },
  cardObra:    { background:"#fff", borderRadius:18, padding:"16px", border:"1.5px solid #E5E5EA", cursor:"pointer", textAlign:"left", boxShadow:"0 2px 8px #0000000A", width:"100%" },
  overlay:     { position:"fixed", inset:0, background:"#00000060", display:"flex", alignItems:"flex-end", zIndex:100 },
  modal:       { background:"#fff", borderRadius:"20px 20px 0 0", padding:"24px 20px 32px", width:"100%", boxSizing:"border-box" },
};
