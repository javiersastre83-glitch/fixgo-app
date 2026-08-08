import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { HardHat, Wrench, AlertTriangle, CheckCircle, Clock, MapPin, Camera, MessageCircle, ChevronRight, Users, BarChart2, Bell, User, Home, Plus, Search, Zap, Trash2, Edit2, Share2, ChevronLeft, X, Calendar, Send, RotateCcw, LogOut, EyeOff, FileText, ClipboardList, Phone, ArrowUpDown, Play, Pause, Mic } from "lucide-react";
import { supabase } from './supabase';

const PRIORIDADES = [
  { label:"URGENTE",  color:"#FF3B30", bg:"#FF3B3015", emoji:"🔴", Icon: AlertTriangle },
  { label:"ATENCIÓN", color:"#FF6B00", bg:"#FF6B0015", emoji:"🟠", Icon: Clock },
  { label:"MENOR",    color:"#FFB800", bg:"#FFB80015", emoji:"🟡", Icon: CheckCircle },
];
const RESPONSABLES = ["Albañil","Demoledor","Encofrador carpintero","Fierrero / Armador de hierro","Hormigonero","Pilotero","Pocero / Excavador","Techista","Calderista","Electricista de obra","Gasista","Instalador de ascensores y montacargas","Instalador de corrientes débiles","Instalador de sistemas contra incendios","Instalador de sistemas de climatización","Instalador de sistemas solares / renovables","Instalador sanitario","Plomero / Fontanero","Técnico en domótica y automatización","Carpintero de obra / terminaciones","Carpintero de obra gruesa","Cerrajero de obra","Herrero de obra","Instalador de aberturas de aluminio","Instalador de aberturas de PVC","Instalador de aberturas metálicas","Montador de estructuras metálicas","Soldador","Vidriero","Zinguería","Ceramista","Colocador de pisos de madera / Parquetista","Colocador de pisos vinílicos / Alfombrista","Colocador revestimientos plásticos texturados","Durlero / Montador de construcción en seco","Enduido","Impermeabilizador / Techista de membranas","Marmolero","Pintor de obra","Pintor industrial","Pulidor de pisos","Yesero","Armador de andamios / Andamiero","Jardinero","Operario de limpieza de obra (fin de obra)","Proveedor de servicios","Restaurador","Riego","Sereno / Personal de vigilancia de obra","Técnico en Higiene y Seguridad en el Trabajo","Topógrafo / Agrimensor","Tunelero","Otro"];
const SECTORES     = ["General","Planta baja","Planta alta","Terraza","Jardín","Cocina","Baño PB","Baño PA","Dormitorio","Comedor","Garage","Otro"];
const EMOJI_OFICIO = {
  "Albañil":"🧱","Demoledor":"🔨","Encofrador carpintero":"🪵","Fierrero / Armador de hierro":"⛓️","Hormigonero":"🏗️","Pilotero":"🛠️","Pocero / Excavador":"⛏️","Techista":"🏠","Calderista":"🔥","Electricista de obra":"⚡","Gasista":"🔧","Instalador de ascensores y montacargas":"🛗","Instalador de corrientes débiles":"🔌","Instalador de sistemas contra incendios":"🧯","Instalador de sistemas de climatización":"❄️","Instalador de sistemas solares / renovables":"☀️","Instalador sanitario":"🚿","Plomero / Fontanero":"🔧","Técnico en domótica y automatización":"🤖","Carpintero de obra / terminaciones":"🪚","Carpintero de obra gruesa":"🪵","Cerrajero de obra":"🔑","Herrero de obra":"⚒️","Instalador de aberturas de aluminio":"🪟","Instalador de aberturas de PVC":"🪟","Instalador de aberturas metálicas":"🪟","Montador de estructuras metálicas":"🏗️","Soldador":"🔥","Vidriero":"🪟","Zinguería":"🏠","Ceramista":"🧱","Colocador de pisos de madera / Parquetista":"🪵","Colocador de pisos vinílicos / Alfombrista":"🧶","Colocador revestimientos plásticos texturados":"🎨","Durlero / Montador de construcción en seco":"🧱","Enduido":"🪣","Impermeabilizador / Techista de membranas":"🏠","Marmolero":"🪨","Pintor de obra":"🖌️","Pintor industrial":"🎨","Pulidor de pisos":"✨","Yesero":"🪣","Armador de andamios / Andamiero":"🚧","Jardinero":"🌳","Operario de limpieza de obra (fin de obra)":"🧹","Proveedor de servicios":"📦","Restaurador":"🛠️","Riego":"💧","Sereno / Personal de vigilancia de obra":"👁️","Técnico en Higiene y Seguridad en el Trabajo":"🦺","Topógrafo / Agrimensor":"📐","Tunelero":"⛏️","Otro":"👷"
};
const emojiDeOficio = (oficio) => EMOJI_OFICIO[oficio] || "👷";

// ══════════════════════════════════════════════════════
// NÚMERO ANIMADO — cuenta desde 0 hasta el valor real (Dashboard Director)
// ══════════════════════════════════════════════════════
const NumeroAnimado = ({ valor, decimales=0, style }) => {
  const [mostrado, setMostrado] = useState(0);
  useEffect(() => {
    const target = valor;
    const duracion = 750;
    const inicio = performance.now();
    const desdeArriba = target === 0 ? 3 : 0;
    let activo = true;
    function frame(ahora) {
      if(!activo)return;
      const t = Math.min((ahora - inicio) / duracion, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      let v;
      if (target === 0) {
        v = t < 0.4 ? (desdeArriba * (t/0.4)) : (desdeArriba * (1 - ((t-0.4)/0.6)));
        v = Math.max(v, 0);
      } else {
        v = target * ease;
      }
      setMostrado(v);
      if (t < 1) requestAnimationFrame(frame);
      else setMostrado(target);
    }
    requestAnimationFrame(frame);
    return () => { activo = false; };
  }, [valor]);
  return <span style={style}>{mostrado.toFixed(decimales)}</span>;
};

// ══════════════════════════════════════════════════════
// EDITOR DE DIBUJO SOBRE FOTO (Pro) — punto 5 de pendientes
// Lápiz libre a mano alzada + paleta básica de colores
// ══════════════════════════════════════════════════════
const PALETA_DIBUJO = [
  { nombre: "Rojo",   color: "#FF3B30" },
  { nombre: "Amarillo", color: "#FFCC00" },
  { nombre: "Negro",  color: "#1C1C1E" },
  { nombre: "Blanco", color: "#FFFFFF" },
];
const ModalEditorDibujo = ({ src, onGuardar, onCerrar }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dibujandoRef = useRef(false);
  const trazosRef = useRef([]); // [{color, puntos:[{x,y}]}]
  const [colorActivo, setColorActivo] = useState(PALETA_DIBUJO[0].color);
  const [listo, setListo] = useState(false);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      const maxW = Math.min(window.innerWidth - 32, 480);
      const escala = maxW / img.width;
      canvas.width = img.width * escala;
      canvas.height = img.height * escala;
      redibujar();
      setListo(true);
    };
    img.src = src;
  }, [src]);

  const redibujar = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    trazosRef.current.forEach((trazo) => {
      if (trazo.puntos.length < 2) return;
      ctx.strokeStyle = trazo.color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(trazo.puntos[0].x, trazo.puntos[0].y);
      trazo.puntos.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  };

  const posDesdeEvento = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cliente = e.touches ? e.touches[0] : e;
    return { x: cliente.clientX - rect.left, y: cliente.clientY - rect.top };
  };
  const empezarTrazo = (e) => {
    e.preventDefault();
    dibujandoRef.current = true;
    trazosRef.current = [...trazosRef.current, { color: colorActivo, puntos: [posDesdeEvento(e)] }];
  };
  const seguirTrazo = (e) => {
    if (!dibujandoRef.current) return;
    e.preventDefault();
    const trazoActual = trazosRef.current[trazosRef.current.length - 1];
    trazoActual.puntos.push(posDesdeEvento(e));
    redibujar();
  };
  const terminarTrazo = () => { dibujandoRef.current = false; };
  const deshacer = () => { trazosRef.current = trazosRef.current.slice(0, -1); redibujar(); forceRender(n=>n+1); };
  const borrarTodo = () => { trazosRef.current = []; redibujar(); forceRender(n=>n+1); };
  const guardar = () => {
    const canvas = canvasRef.current;
    onGuardar(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
        <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={22} color="#fff" /></button>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Marcar en la foto</span>
        <button onClick={deshacer} style={{ background: "none", border: "none", cursor: "pointer" }}><RotateCcw size={20} color="#fff" /></button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {!listo && <span style={{ color: "#fff", fontSize: 13 }}>Cargando foto…</span>}
        <canvas
          ref={canvasRef}
          style={{ touchAction: "none", borderRadius: 12, display: listo ? "block" : "none", maxWidth: "100%", maxHeight: "100%" }}
          onMouseDown={empezarTrazo} onMouseMove={seguirTrazo} onMouseUp={terminarTrazo} onMouseLeave={terminarTrazo}
          onTouchStart={empezarTrazo} onTouchMove={seguirTrazo} onTouchEnd={terminarTrazo}
        />
      </div>
      <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "center", gap: 14 }}>
        {PALETA_DIBUJO.map((p) => (
          <button key={p.color} onClick={() => setColorActivo(p.color)} style={{ width: 34, height: 34, borderRadius: "50%", background: p.color, border: colorActivo === p.color ? "3px solid #fff" : "3px solid rgba(255,255,255,0.25)", cursor: "pointer" }} />
        ))}
      </div>
      <div style={{ padding: "0 16px 24px", display: "flex", gap: 10 }}>
        <button onClick={borrarTodo} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Borrar todo</button>
        <button onClick={guardar} style={{ flex: 2, padding: "13px", borderRadius: 14, border: "none", background: "#34C759", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><CheckCircle size={16} />Usar foto</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// BURBUJA DE AUDIO — reproductor simple para notas de voz en comentarios
// ══════════════════════════════════════════════════════
const BurbujaAudio = ({ src, duracion=0, esMio=false }) => {
  const [reproduciendo, setReproduciendo] = useState(false);
  const audioRef = useRef(null);
  const alTerminar = () => setReproduciendo(false);
  const alternar = () => {
    if(!audioRef.current)return;
    if(reproduciendo){audioRef.current.pause();}
    else{audioRef.current.play().catch(()=>{});}
    setReproduciendo(r=>!r);
  };
  const mm = Math.floor(duracion/60);
  const ss = String(Math.round(duracion%60)).padStart(2,"0");
  const barras = [4,10,18,7,14,22,9,16,6,20,11,17,5,13,19,8,15,21,6,12,18,9,16,4,11,19,7,15,21,6,13,17,9,20,5,12];
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <audio ref={audioRef} src={src} onEnded={alTerminar} style={{display:"none"}}/>
      <button type="button" onClick={alternar} style={{width:32,height:32,borderRadius:"50%",border:"none",background:esMio?"rgba(255,255,255,0.18)":"#E5E5EA",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
        {reproduciendo?<Pause size={14} color={esMio?"#fff":"#1C1C1E"}/>:<Play size={14} color={esMio?"#fff":"#1C1C1E"} style={{marginLeft:1}}/>}
      </button>
      <div style={{display:"flex",alignItems:"center",gap:1.5,flex:1,justifyContent:"space-between",height:22}}>
        {barras.map((h,i)=><div key={i} style={{width:2,height:h,borderRadius:1,background:esMio?"rgba(255,255,255,0.55)":"#B0B0B5",flexShrink:0}}/>)}
      </div>
      <span style={{fontSize:11,color:esMio?"rgba(255,255,255,0.7)":"#55555A",flexShrink:0}}>{mm}:{ss}</span>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// BÚSQUEDA INTELIGENTE DE OFICIOS — punto 4 de pendientes
// Cada oficio tiene palabras clave (materiales/jerga de obra) además
// de su nombre, para que "mesa", "silestone", "durlock", etc. encuentren
// el oficio correcto aunque el usuario no sepa el nombre técnico.
// ══════════════════════════════════════════════════════
const TAGS_OFICIO = {
  "Albañil": ["pared","muro","ladrillo","mezcla","revoque","contrapiso","azulejo","mamposteria","bloque","cimiento","fino","grueso"],
  "Demoledor": ["picar","demoler","escombro","martillo","rotura","derribar","tirar pared","losa vieja"],
  "Encofrador carpintero": ["madera","encofrado","molde","columna","viga","losa","tablero","apuntalamiento"],
  "Fierrero / Armador de hierro": ["malla","estribo","varilla","hierro","armadura","doblado","atado","acero","8mm","10mm","12mm"],
  "Hormigonero": ["hormigon","llenado","trompito","mixer","losa","colado","cemento","base"],
  "Pilotero": ["pilote","perforacion","fundacion profunda","pozo romano","cimentacion"],
  "Pocero / Excavador": ["zanja","pozo","excavacion","tierra","pozo ciego","camara","pala","retroexcavadora"],
  "Techista": ["techo","chapa","teja","cubierta","estructura de techo","cabio","tirante","cumbrera"],
  "Calderista": ["caldera","radiador","calefaccion","piso radiante","vapor","agua caliente","termotanque grande"],
  "Electricista de obra": ["luz","cable","termica","disyuntor","cañeria electrica","caja","toma","llave","tablero","corriente","pico"],
  "Gasista": ["gas","caño epoxi","sigas","termofusion gas","estufa","cocina","medidor","prueba hermeticidad"],
  "Instalador de ascensores y montacargas": ["ascensor","montacargas","elevador","cabina","guias","motor elevacion"],
  "Instalador de corrientes débiles": ["red","internet","ethernet","camara","alarma","portero","citofono","wifi","fibra optica","rack","cableado estructurado"],
  "Instalador de sistemas contra incendios": ["nicho hidrante","extintor","matafuego","sprinkler","rociador","deteccion humo","bomba incendio"],
  "Instalador de sistemas de climatización": ["aire acondicionado","split","fancoil","ducto","ventilacion","extraccion","vrv","clima"],
  "Instalador de sistemas solares / renovables": ["panel solar","inversor","fotovoltaico","termotanque solar","energia renovable","bateria"],
  "Instalador sanitario": ["baño","agua","desague","cloaca","cañeria","termofusion","agua fria","agua caliente","camara de inspeccion"],
  "Plomero / Fontanero": ["canilla","grifo","griferia","mochila","inodoro","bidet","sifon","perdida","caño","fuga","lavatorio","bacha"],
  "Técnico en domótica y automatización": ["domotica","sensor","automatizacion","porton automatico","luz inteligente","escena"],
  "Carpintero de obra / terminaciones": ["mueble","bajo mesada","alacena","zocalo","placard","vestidor","puerta de madera","frente de placard","marco"],
  "Carpintero de obra gruesa": ["encofrado grueso","madera estructural","tirantes","andamio de madera","apuntalamiento"],
  "Cerrajero de obra": ["cerradura","llave","picaporte","cerrojo","traba","cilindro"],
  "Herrero de obra": ["reja","porton","baranda","pasamanos","hierro","perfileria","estructura metalica chica","escalera de hierro"],
  "Instalador de aberturas de aluminio": ["ventana de aluminio","puerta de aluminio","marco","vidrio doble","dvh","paño fijo","abertura"],
  "Instalador de aberturas de PVC": ["ventana de pvc","puerta de pvc","dvh","carpinteria de pvc","abertura"],
  "Instalador de aberturas metálicas": ["puerta placa metalica","marco de chapa","porton de chapa","cortina metalica"],
  "Montador de estructuras metálicas": ["perfil w","ipn","upn","galpon","parabolico","reticulado","estructura pesada","alma llena"],
  "Soldador": ["soldadura","electrodo","mig","tig","costura","union de hierro"],
  "Vidriero": ["vidrio","espejo","dvh","templado","laminado","mampara","ventanal"],
  "Zinguería": ["canaleta","batea","caño de bajada","zingueria","cumbrera","babeta"],
  "Ceramista": ["ceramica","porcelanato","azulejo","pastina","pegamento","klaukol","revestimiento"],
  "Colocador de pisos de madera / Parquetista": ["parquet","piso flotante","entablonado","pulido de madera","plastificado","hidrolaqueado","zocalo de madera"],
  "Colocador de pisos vinílicos / Alfombrista": ["vinilico","spc","lvt","alfombra","piso de goma"],
  "Colocador revestimientos plásticos texturados": ["revear","tarquini","texturado","plastilok","fino texturado","rodillo","revestimiento exterior"],
  "Durlero / Montador de construcción en seco": ["durlock","placa de yeso","tabique","cielorraso","montante","solera","masillado","perfileria durlock"],
  "Enduido": ["enduido","lija","masilla","pared lisa","preparado de pared"],
  "Impermeabilizador / Techista de membranas": ["membrana","asfalto","pintura asfaltica","gotera","filtracion","impermeabilizante","losa"],
  "Marmolero": ["marmol","granito","mesada","mesa","zocalo de granito","bacha pegada","travertino","silestone","dekton","barra"],
  "Pintor de obra": ["pintura","latex","sintetico","rodillo","pincel","enduido basico","fachada","pared"],
  "Pintor industrial": ["epoxi","poliuretano","pintura anticorrosiva","soplete","estructura metalica","granallado"],
  "Pulidor de pisos": ["pulido granito","mosaico","marmol","curado","diamantado","pisos antiguos"],
  "Yesero": ["yeso","cielorraso de yeso","moldura","aplicado","proyectado","enlucido"],
  "Armador de andamios / Andamiero": ["andamio","tubular","acople","plataforma","torre","seguridad en altura"],
  "Jardinero": ["cesped","grama","plantas","tierra negra","jardin","paisajismo","cantero"],
  "Operario de limpieza de obra (fin de obra)": ["limpieza","final de obra","retiro de restos","calcomanias","vidrios","polvo"],
  "Proveedor de servicios": ["flete","volquete","contenedor","alquiler maquinaria","quimicos","baños quimicos"],
  "Restaurador": ["restauracion","patrimonio","moldura antigua","fachada historica","conservacion"],
  "Riego": ["aspersor","riego por goteo","electrovalvula","bomba de riego","automatizacion de riego"],
  "Sereno / Personal de vigilancia de obra": ["sereno","guardia","seguridad nocturna","cuidado de materiales","control de acceso"],
  "Técnico en Higiene y Seguridad en el Trabajo": ["seguridad","epp","casco","arnes","art","plan de seguridad","auditoria","higiene"],
  "Topógrafo / Agrimensor": ["nivelacion","terreno","estaca","loteo","teodolito","estacion total","plano de mensura"],
  "Tunelero": ["tunelera","cruce de calle","topo","cañeria subterranea sin zanja"],
};
const normalizarTexto = (texto) => (texto||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// Busca por nombre de oficio O por cualquiera de sus tags/palabras clave. Ignora tildes y mayúsculas.
const buscarOficio = (terminoBusqueda, listaOficios=RESPONSABLES) => {
  const busquedaLimpia = normalizarTexto((terminoBusqueda||"").trim());
  if (!busquedaLimpia) return listaOficios;
  return listaOficios.filter((nombreOficio) => {
    const coincideNombre = normalizarTexto(nombreOficio).includes(busquedaLimpia);
    const tags = TAGS_OFICIO[nombreOficio] || [];
    const coincideTag = tags.some((tag) => normalizarTexto(tag).includes(busquedaLimpia));
    return coincideNombre || coincideTag;
  });
};
const PALETA_PASTEL = ["#C9A6E8","#F5C77E","#A8C7E8","#E8A6B8","#A6D4C4","#D4C4A6","#E8C4A6","#A6C4D4","#B8D4A6","#E8B8A6","#A6B8E8","#D4A6A6"];
const colorPastelDe = (id) => { const s=String(id||""); let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))&0xffffffff; return PALETA_PASTEL[Math.abs(h)%PALETA_PASTEL.length]; };
const colorPorIndice = (idx) => PALETA_PASTEL[idx%PALETA_PASTEL.length];
const ROLES_SISTEMA = [
  { id:"profesional", label:"Profesional", emoji:"📐", color:"#0057FF", desc:"Arquitecto, Ingeniero o Idóneo." },
  { id:"co_profesional", label:"Colega", emoji:"🤝", color:"#0057FF", desc:"Mismos poderes que el dueño sobre esta obra." },
  { id:"capataz",     label:"Capataz",     emoji:"🦺",   color:"#FF6B00", desc:"Gestiona subcontratos y hace seguimiento." },
  { id:"operario",    label:"Operario",    emoji:"👷",   color:"#8E44AD", desc:"Ejecuta las novedades." },
];
const USUARIOS_DEMO = [
  { id:"u1", nombre:"Javier",  rolSistema:"profesional", especialidad:"Arquitecto", avatar:"📐", color:"#0057FF" },
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
const FORM_INICIAL = { fotos:[], descripcion:"", responsable:RESPONSABLES[0], responsableCustom:"", responsableUsuarioId:null, sector:SECTORES[0], sectorCustom:"", prioridad:1, fechaLimite:"", comentario:"", ocultoCapataz:false, tokenAsignacionPendiente:null };

const formatFecha = (iso) => { if(!iso) return ""; const d=new Date(iso+"T00:00:00"); return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"}); };
const formatHora  = (ts)  => { const d=new Date(ts); return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); };
const diasRestantes = (f) => { if(!f) return null; const h=new Date(); h.setHours(0,0,0,0); return Math.ceil((new Date(f+"T00:00:00")-h)/(864e5)); };
const estadoBadge = (nov) => {
  if(nov.resuelta) return {label:"✅ Resuelto",color:"#34C759",bg:"#34C75920"};
  const d=diasRestantes(nov.fechaLimite); if(d===null) return null;
  if(d<0)  return {label:`⚠️ Vencida hace ${Math.abs(d)} ${Math.abs(d)===1?"día":"días"}`,color:"#FF3B30",bg:"#FF3B3020"};
  if(d===0) return {label:"⏰ Vence hoy",color:"#FF6B00",bg:"#FF6B0020"};
  if(d<=3)  return {label:`⏳ ${d} ${d===1?"día":"días"} restantes`,color:"#FF6B00",bg:"#FF6B0020"};
  return {label:`📅 ${d} ${d===1?"día":"días"} restantes`,color:"#55555A",bg:"#55555A15"};
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
// ══════════════════════════════════════════════════════
// SELECTOR DE OFICIO — dropdown con buscador
// value: oficio elegido | onChange: (oficio)=>void
// customValue/onCustomChange: texto libre cuando se elige "Otro"
// ══════════════════════════════════════════════════════
const SelectorOficio = ({ value, onChange, customValue, onCustomChange, color="#007AFF" }) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const filtrados = buscarOficio(busqueda, RESPONSABLES);
  return (
    <div style={{position:"relative"}}>
      <button type="button" onClick={()=>setAbierto(a=>!a)}
        style={{width:"100%",padding:"13px 14px",borderRadius:14,border:`1.5px solid ${value?color:"#E5E5EA"}`,background:"#fff",fontSize:16,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit",color:value?"#1C1C1E":"#55555A"}}>
        <span>{value || "Seleccioná el oficio..."}</span>
        <span style={{color:"#55555A",fontSize:13}}>{abierto?"▲":"▼"}</span>
      </button>
      {abierto && (
        <>
        <div style={{position:"fixed",inset:0,zIndex:49}} onClick={()=>{setAbierto(false);setBusqueda("");}}/>
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",borderRadius:14,border:"1.5px solid #E5E5EA",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:50,maxHeight:280,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px",borderBottom:"1px solid #F2F2F7"}}>
            <input autoFocus value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar oficio..."
              style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E5EA",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {filtrados.length===0 && <p style={{padding:"14px",margin:0,fontSize:14,color:"#55555A",textAlign:"center"}}>Sin resultados</p>}
            {filtrados.map(r => (
              <button type="button" key={r} onClick={()=>{onChange(r);setAbierto(false);setBusqueda("");}}
                style={{width:"100%",padding:"12px 14px",border:"none",borderBottom:"1px solid #F7F7F7",background:value===r?color+"12":"#fff",textAlign:"left",cursor:"pointer",fontSize:15,color:value===r?color:"#1C1C1E",fontWeight:value===r?700:400,fontFamily:"inherit"}}>
                {r}
              </button>
            ))}
          </div>
        </div>
        </>
      )}
      {value==="Otro" && (
        <input style={{width:"100%",padding:"13px 14px",borderRadius:14,border:"1.5px solid #E5E5EA",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginTop:10}}
          placeholder="Escribí el oficio..." value={customValue} onChange={e=>onCustomChange(e.target.value)} autoFocus/>
      )}
    </div>
  );
};

// ─────────────────────────────
// CACHEO LOCAL DE IMÁGENES (IndexedDB) — para que fotos de resolución, logo de estudio
// y portada del informe se guarden en el teléfono la primera vez que se ven, y las
// próximas veces (con o sin señal) se muestren al instante sin volver a pedirlas.
// ─────────────────────────────
const IMG_CACHE_DB="fixgo_img_cache";
const IMG_CACHE_STORE="imagenes";
const abrirImgCacheDB=()=>new Promise((resolve,reject)=>{
  if(typeof indexedDB==="undefined"){reject(new Error("Sin IndexedDB"));return;}
  const req=indexedDB.open(IMG_CACHE_DB,1);
  req.onupgradeneeded=()=>{req.result.createObjectStore(IMG_CACHE_STORE);};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
});
const obtenerImagenCacheada=async(url)=>{
  if(!url)return null;
  try{
    const db=await abrirImgCacheDB();
    const cacheado=await new Promise((resolve,reject)=>{
      const tx=db.transaction(IMG_CACHE_STORE,"readonly");
      const req=tx.objectStore(IMG_CACHE_STORE).get(url);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
    if(cacheado)return URL.createObjectURL(cacheado);
    const resp=await fetch(url);
    if(!resp.ok)return url;
    const blob=await resp.blob();
    const db2=await abrirImgCacheDB();
    await new Promise((resolve,reject)=>{
      const tx=db2.transaction(IMG_CACHE_STORE,"readwrite");
      tx.objectStore(IMG_CACHE_STORE).put(blob,url);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
    return URL.createObjectURL(blob);
  }catch(e){return url;} // si algo falla (sin IndexedDB, cuota llena, etc.) se usa la URL original como respaldo
};
const useImagenCacheada=(url)=>{
  const [src,setSrc]=useState(url||null);
  useEffect(()=>{
    let activo=true;
    setSrc(url||null);
    if(!url)return;
    obtenerImagenCacheada(url).then(u=>{if(activo&&u)setSrc(u);});
    return()=>{activo=false;};
  },[url]);
  return src;
};
const ImgCacheada=({src,...props})=>{
  const url=useImagenCacheada(src);
  if(!url)return null;
  return <img src={url} {...props}/>;
};

const SelectorResponsable = ({ value, usuarioId, onChange, equipo=[], color="#007AFF" }) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const miembros = (equipo||[]).filter(m=>m.nombre);
  const miembrosFiltrados = miembros.filter(m=>(m.nombre||"").toLowerCase().includes(busqueda.toLowerCase()));
  const oficiosFiltrados = buscarOficio(busqueda, RESPONSABLES);
  const personaSel = usuarioId ? miembros.find(m=>m.uid===usuarioId) : null;
  const etiqueta = personaSel ? `${personaSel.nombre}${personaSel.especialidad?" — "+personaSel.especialidad:""}` : (value||"Seleccioná...");
  return (
    <div style={{position:"relative"}}>
      <button type="button" onClick={()=>setAbierto(a=>!a)}
        style={{width:"100%",padding:"13px 14px",borderRadius:14,border:`1.5px solid ${(value||usuarioId)?color:"#E5E5EA"}`,background:"#fff",fontSize:16,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit",color:(value||usuarioId)?"#1C1C1E":"#55555A"}}>
        <span>{etiqueta}</span>
        <span style={{color:"#55555A",fontSize:13}}>{abierto?"▲":"▼"}</span>
      </button>
      {abierto && (
        <>
        <div style={{position:"fixed",inset:0,zIndex:49}} onClick={()=>{setAbierto(false);setBusqueda("");}}/>
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",borderRadius:14,border:"1.5px solid #E5E5EA",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:50,maxHeight:320,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px",borderBottom:"1px solid #F2F2F7"}}>
            <input autoFocus ref={inputBusquedaRef} value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar persona u oficio..."
              style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E5EA",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {miembrosFiltrados.length>0 && <p style={{padding:"8px 14px 4px",margin:0,fontSize:12,fontWeight:700,color:"#55555A"}}>👥 Mi equipo</p>}
            {miembrosFiltrados.map(m => (
              <button type="button" key={m.uid} onClick={()=>{inputBusquedaRef.current?.blur();onChange({responsable:m.especialidad||"",usuarioId:m.uid});setAbierto(false);setBusqueda("");}}
                style={{width:"100%",padding:"12px 14px",border:"none",borderBottom:"1px solid #F7F7F7",background:usuarioId===m.uid?color+"12":"#fff",textAlign:"left",cursor:"pointer",fontSize:15,color:usuarioId===m.uid?color:"#1C1C1E",fontWeight:usuarioId===m.uid?700:400,fontFamily:"inherit"}}>
                {m.nombre}{m.especialidad?<span style={{color:"#55555A",fontWeight:400}}> — {m.especialidad}</span>:null}
              </button>
            ))}
            {oficiosFiltrados.length>0 && <p style={{padding:"8px 14px 4px",margin:0,fontSize:12,fontWeight:700,color:"#55555A"}}>🔧 Oficio genérico</p>}
            {oficiosFiltrados.map(r => (
              <button type="button" key={r} onClick={()=>{inputBusquedaRef.current?.blur();onChange({responsable:r,usuarioId:null});setAbierto(false);setBusqueda("");}}
                style={{width:"100%",padding:"12px 14px",border:"none",borderBottom:"1px solid #F7F7F7",background:(!usuarioId&&value===r)?color+"12":"#fff",textAlign:"left",cursor:"pointer",fontSize:15,color:(!usuarioId&&value===r)?color:"#1C1C1E",fontWeight:(!usuarioId&&value===r)?700:400,fontFamily:"inherit"}}>
                {r}
              </button>
            ))}
            {miembrosFiltrados.length===0 && oficiosFiltrados.length===0 && <p style={{padding:"14px",margin:0,fontSize:14,color:"#55555A",textAlign:"center"}}>Sin resultados</p>}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

const TiraResponsables = ({ value, usuarioId, onChange, equipo=[], color="#0057FF", onInvitarNuevo=null }) => {
  const [modalOficio, setModalOficio] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const miembros = (equipo||[]).filter(m=>m.nombre);
  const oficioSel = (!usuarioId && value) ? value : null;
  const oficiosFiltrados = buscarOficio(busqueda, RESPONSABLES);
  return (
    <div>
      {/* TIRA DE MIEMBROS */}
      <div style={{display:"flex",gap:9,overflowX:"auto",paddingBottom:6,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
        {miembros.map(m=>{
          const sel = usuarioId===m.uid;
          return (
            <button type="button" key={m.uid} onClick={()=>onChange({responsable:m.especialidad||"",usuarioId:m.uid})}
              style={{flexShrink:0,minWidth:90,background:sel?"#F5F5F5":"#fff",border:`2px solid ${sel?"#1C1C1E":"#E5E5EA"}`,borderRadius:14,padding:"10px 14px",textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#1C1C1E",whiteSpace:"nowrap"}}>{m.nombre}</div>
              {m.especialidad&&<div style={{fontSize:11,color:"#55555A",marginTop:2,whiteSpace:"nowrap"}}>{m.especialidad}</div>}
            </button>
          );
        })}
        {onInvitarNuevo&&<button type="button" onClick={onInvitarNuevo}
          style={{flexShrink:0,minWidth:110,background:"#F9F9F9",border:"1.5px dashed #D0D0D5",borderRadius:14,padding:"10px 14px",textAlign:"left",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{fontSize:18,color:"#55555A",lineHeight:1}}>＋</div>
          <div style={{fontSize:11,fontWeight:700,color:"#55555A",marginTop:3,whiteSpace:"nowrap"}}>Invitar nuevo integrante</div>
        </button>}
      </div>

      {/* SEPARADOR */}
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"12px 0"}}>
        <div style={{flex:1,height:1,background:"#F0F0F0"}}/>
        <span style={{fontSize:11,color:"#C7C7CC",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>o un oficio genérico</span>
        <div style={{flex:1,height:1,background:"#F0F0F0"}}/>
      </div>

      {/* BOTÓN OFICIO */}
      <button type="button" onClick={()=>setModalOficio(true)}
        style={{width:"100%",background:oficioSel?"#F5F5F5":"#F9F9F9",border:`1.5px ${oficioSel?"solid":"dashed"} ${oficioSel?"#1C1C1E":"#D0D0D5"}`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:oficioSel?"#1C1C1E":"#EBEBF0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
            {oficioSel?"🔧":"🔧"}
          </div>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:14,fontWeight:oficioSel?700:500,color:oficioSel?"#1C1C1E":"#55555A"}}>{oficioSel||"Sin oficio asignado"}</div>
            <div style={{fontSize:11,color:"#55555A",marginTop:1}}>Para contratistas fuera del equipo</div>
          </div>
        </div>
        <span style={{fontSize:11,fontWeight:600,color:oficioSel?"#fff":"#55555A",background:oficioSel?"#1C1C1E":"#EBEBF0",padding:"3px 10px",borderRadius:99}}>{oficioSel?"Cambiar":"Elegir"}</span>
      </button>

      {/* MODAL OFICIO */}
      {modalOficio && (
        <div style={s.overlay} onClick={()=>{setModalOficio(false);setBusqueda("");}}>
          <div style={{...s.modal,maxHeight:"75vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <p style={{margin:"0 0 10px",fontSize:17,fontWeight:700}}>Elegí un oficio</p>
            <input
              style={{...s.input,marginBottom:12}}
              placeholder="Buscar oficio..."
              value={busqueda}
              onChange={e=>setBusqueda(e.target.value)}
              autoFocus
            />
            <div style={{overflowY:"auto",flex:1,margin:"0 -20px",padding:"0 20px"}}>
              {oficiosFiltrados.map(r=>(
                <button type="button" key={r} onClick={()=>{onChange({responsable:r,usuarioId:null});setModalOficio(false);setBusqueda("");}}
                  style={{width:"100%",padding:"13px 4px",border:"none",borderBottom:"1px solid #F2F2F7",background:(oficioSel===r)?"#F5F5F5":"#fff",textAlign:"left",cursor:"pointer",fontSize:15,color:(oficioSel===r)?"#1C1C1E":"#1C1C1E",fontWeight:(oficioSel===r)?700:400,fontFamily:"inherit"}}>{r}</button>
              ))}
              {oficiosFiltrados.length===0&&<p style={{textAlign:"center",color:"#55555A",padding:"20px 0",fontSize:14}}>Sin resultados</p>}
            </div>
            <button type="button" onClick={()=>{setModalOficio(false);setBusqueda("");}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A",marginTop:12}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavBar = ({ tabActiva, onTab, onPerfil }) => (
  <div style={{ background:"#fff", borderTop:"1px solid #E5E5EA", display:"flex", paddingBottom:"env(safe-area-inset-bottom)", flexShrink:0 }}>
    {[
      {key:"obras",   Icon:Home,      label:"Inicio"},
      {key:"alertas", Icon:Zap,       label:"Urgencias"},
      {key:"perfil",  Icon:User,      label:"Perfil"},
    ].map(({key,Icon,label})=>(
      <button key={key} onClick={()=>key==="perfil"?onPerfil():onTab(key)}
        style={{flex:1,background:"none",border:"none",padding:"10px 4px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <Icon size={22} color={tabActiva===key?"#1C1C1E":"#55555A"} strokeWidth={tabActiva===key?2.5:1.8}/>
        <span style={{fontSize:10,fontWeight:tabActiva===key?700:400,color:tabActiva===key?"#1C1C1E":"#55555A"}}>{label}</span>
        {tabActiva===key&&<div style={{width:4,height:4,borderRadius:99,background:"#1C1C1E"}}/>}
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
  const sub  = dark ? "rgba(255,255,255,0.5)" : "#55555A";
  // migas: array de {label, onClick?}  — el último es el título actual; el penúltimo (si existe) es a dónde vuelve la flecha
  const padre = migas.slice(0,-1);
  const actual = migas[migas.length-1];
  const volver = padre.length>0 ? padre[padre.length-1].onClick : null;
  const volverLabel = padre.length>0 ? padre[padre.length-1].label : null;
  return (
    <div style={{background:bg,borderBottom:dark?"none":"1px solid #E5E5EA",padding:"10px 16px 12px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:26}}>
        {volver?(
          <button onClick={volver} aria-label={`Volver a ${volverLabel||""}`}
            style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:dark?"#fff":"#007AFF",cursor:"pointer",flexShrink:1,minWidth:0,padding:0}}>
            <ChevronLeft size={19}/>
            <span style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{volverLabel}</span>
          </button>
        ):<span/>}
        {accionDerecha&&<div style={{marginLeft:"auto",flexShrink:0}}>{accionDerecha}</div>}
      </div>
      <span style={{display:"block",marginTop:4,fontSize:19,color:col,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{actual?.label}</span>
    </div>
  );
};

export default function App({ session }) {
  const usuarioReal = session?.user||null;
  const [guardando,        setGuardando]        = useState(false);
  const guardandoRef = useRef(false);
  const [toast,            setToast]            = useState("");
  const [usuarioActivo,    setUsuarioActivo]    = useState(USUARIOS_DEMO[0]);
  const [vistaRaiz,        setVistaRaiz]        = useState("inicio");
  const [obraActual,       setObraActual]       = useState(null);
  const [obras,            setObras]            = useState(OBRAS_DEMO);
  const [avisoObraEliminada, setAvisoObraEliminada] = useState<string|null>(null);
  const [cargandoDatos,    setCargandoDatos]    = useState(true);
  const [novedadesPorObra, setNovedadesPorObra] = useState({1:NOVEDADES_DEMO,2:[]});
  const [estaOnline,       setEstaOnline]       = useState(typeof navigator!=="undefined"?navigator.onLine:true);
  const [colaOffline,      setColaOffline]      = useState<any[]>(()=>{try{return JSON.parse(localStorage.getItem("fixgo_cola_offline")||"[]");}catch(e){return[];}});
  const [sincronizando,    setSincronizando]    = useState(false);
  useEffect(()=>{
    const onOnline=()=>setEstaOnline(true);
    const onOffline=()=>setEstaOnline(false);
    window.addEventListener("online",onOnline);
    window.addEventListener("offline",onOffline);
    return()=>{window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline);};
  },[]);
  useEffect(()=>{
    if(!usuarioReal)return;
    try{localStorage.setItem("fixgo_cache_novedades",JSON.stringify(novedadesPorObra));}catch(e){}
  },[novedadesPorObra,usuarioReal?.id]);
  useEffect(()=>{
    if(!usuarioReal||obras.length===0)return;
    try{localStorage.setItem("fixgo_cache_obras_full",JSON.stringify(obras));}catch(e){}
  },[obras,usuarioReal?.id]);
  useEffect(()=>{
    try{localStorage.setItem("fixgo_cola_offline",JSON.stringify(colaOffline));}catch(e){}
  },[colaOffline]);
  const [vista,            setVista]            = useState("lista");
  const [form,             setForm]             = useState(FORM_INICIAL);
  const [masOpciones,      setMasOpciones]      = useState(false);
  const [fotoAmpliada,     setFotoAmpliada]     = useState(null);
  const [detalleId,        setDetalleId]        = useState(null);
  const [filtro,           setFiltro]           = useState("todas");
  const [filtroResp,       setFiltroResp]       = useState("todos");
  const [filtroSector,     setFiltroSector]      = useState("todos");
  const [orden,            setOrden]             = useState("urgencia");
  const [ordenDesc,        setOrdenDesc]         = useState(false);
  const [filtroRespOpen,   setFiltroRespOpen]   = useState(false);
  const [busqueda,         setBusqueda]         = useState("");
  const [nuevoComentario,  setNuevoComentario]  = useState("");
  const [grabandoAudio,    setGrabandoAudio]    = useState(false);
  const [comentariosAbiertos, setComentariosAbiertos] = useState(false);
  const [editorDibujo,     setEditorDibujo]     = useState(null); // {src, origen:"nueva"|"editar"|"resolucion", idx}
  const [tiempoGrabacion,  setTiempoGrabacion]  = useState(0);
  const mediaRecorderRef = useRef(null);
  const swipeInicioRef = useRef({x:0,y:0});
  const [direccionTab, setDireccionTab] = useState(1);
  const audioChunksRef = useRef([]);
  const grabacionIntervalRef = useRef(null);
  const grabacionCanceladaRef = useRef(false);
  const [modalNuevaObra,   setModalNuevaObra]   = useState(false);
  const [modalInvitar,     setModalInvitar]     = useState(false);
  const [invitarRol,       setInvitarRol]       = useState("operario");
  const [invitarEsp,       setInvitarEsp]       = useState(RESPONSABLES[0]);
  const [invitarEspOtro,   setInvitarEspOtro]   = useState("");
  const [invitarNombre,    setInvitarNombre]    = useState("");
  const [invitarTelefono,  setInvitarTelefono]  = useState("");
  const [linkGenerado,     setLinkGenerado]     = useState("");
  const [generandoLink,    setGenerandoLink]    = useState(false);
  const [nuevaObraForm,    setNuevaObraForm]    = useState({nombre:"",direccion:""});
  const [vistaStats,       setVistaStats]       = useState(false);
  const [vistaEquipo,      setVistaEquipo]      = useState(false);
  const [miembroSel,       setMiembroSel]       = useState(null);
  const [editandoNombreId, setEditandoNombreId] = useState(null);
  const [confirmarEliminarMiembro, setConfirmarEliminarMiembro] = useState(null);
  const [nombreEditado,    setNombreEditado]    = useState("");
  const [vistaPerfil,      setVistaPerfil]      = useState(false);
  const [vistaInfoApp,     setVistaInfoApp]     = useState(false);
  const [modoOscuro,       setModoOscuro]       = useState(false);
  const [tabActiva,        setTabActiva]        = useState("obras");
  const [compartidoId,     setCompartidoId]     = useState(null);
  const [modalPro,         setModalPro]         = useState(false);
  const [modalPeriodoReporte, setModalPeriodoReporte] = useState(false);
  const [rangoPersonalizado, setRangoPersonalizado] = useState({desde:"",hasta:""});
  const [reporteData,      setReporteData]      = useState<any>(null);
  const [vistaReporte,     setVistaReporte]      = useState(false);
  const [generandoReporte, setGenerandoReporte]  = useState(false);
  const generarReporte=(desde,hasta)=>{
    const desdeMs=desde.getTime(),hastaMs=hasta.getTime();
    const duracionMs=hastaMs-desdeMs;
    const desdeAntMs=desdeMs-duracionMs,hastaAntMs=desdeMs;
    const enRango=(fecha,dMs,hMs)=>{if(!fecha)return false;const t=new Date(fecha).getTime();return t>=dMs&&t<=hMs;};
    const hoyMs=Date.now();

    const calcularPeriodo=(dMs,hMs)=>{
      const reportadas=novedades.filter(n=>enRango(n.created_at,dMs,hMs));
      const resueltas=novedades.filter(n=>n.resuelta&&enRango(n.resueltaAt,dMs,hMs));
      const tiempos=resueltas.filter(n=>n.resueltaAt&&n.created_at).map(n=>Math.max(0,(new Date(n.resueltaAt).getTime()-new Date(n.created_at).getTime())/864e5));
      const tiempoProm=tiempos.length>0?tiempos.reduce((a,b)=>a+b,0)/tiempos.length:0;
      return{reportadas,resueltas,tiempoProm};
    };

    const actual=calcularPeriodo(desdeMs,hastaMs);
    const anterior=calcularPeriodo(desdeAntMs,hastaAntMs);

    const pendientesActuales=novedades.filter(n=>!n.resuelta);
    const vencidasActuales=pendientesActuales.filter(n=>n.fechaLimite&&new Date(n.fechaLimite).getTime()<hoyMs);
    const criticasAbiertas=pendientesActuales.filter(n=>n.prioridad===0&&n.fechaLimite&&new Date(n.fechaLimite).getTime()<hoyMs);

    const porSectorMap={};
    actual.reportadas.forEach(n=>{const s=n.sector||"Sin sector";porSectorMap[s]=(porSectorMap[s]||0)+1;});
    const porSector=Object.entries(porSectorMap).map(([nombre,cant])=>({nombre,cant})).sort((a:any,b:any)=>b.cant-a.cant);

    // Por oficio (el campo "responsable" siempre guarda el oficio, esté o no asignado a una persona)
    const porOficioMap={};
    actual.reportadas.forEach(n=>{const o=n.responsable||"Sin oficio";porOficioMap[o]=(porOficioMap[o]||0)+1;});
    const porOficio=Object.entries(porOficioMap).map(([nombre,cant])=>({nombre,cant})).sort((a:any,b:any)=>b.cant-a.cant);

    // Actividad por persona: resueltas por responsable_usuario_id, a-su-cargo por responsable asignado (reportadas del período)
    const personasMap={};
    const clavePersona=(n)=>n.responsable_usuario_id||`oficio:${n.responsable}`;
    actual.reportadas.forEach(n=>{
      const k=clavePersona(n);
      if(!personasMap[k])personasMap[k]={uid:n.responsable_usuario_id||null,nombre:n.responsable_usuario_id?(equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.nombre||"Sin nombre"):n.responsable,oficio:n.responsable_usuario_id?(equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.especialidad||""):n.responsable,resueltas:0,aCargo:0,vencidas:0};
      personasMap[k].aCargo++;
      if(!n.resuelta&&n.fechaLimite&&new Date(n.fechaLimite).getTime()<hoyMs)personasMap[k].vencidas++;
    });
    actual.resueltas.forEach(n=>{
      const k=clavePersona(n);
      if(!personasMap[k])personasMap[k]={uid:n.responsable_usuario_id||null,nombre:n.responsable_usuario_id?(equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.nombre||"Sin nombre"):n.responsable,oficio:n.responsable_usuario_id?(equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.especialidad||""):n.responsable,resueltas:0,aCargo:0,vencidas:0};
      personasMap[k].resueltas++;
    });
    const actividadPersonas=Object.values(personasMap).sort((a:any,b:any)=>(b.resueltas+b.aCargo)-(a.resueltas+a.aCargo));

    // Línea de tiempo: agrupa por día si el rango es corto, por semana si es medio, por mes si es largo.
    // (criterio: ≤14 días → día · 15 días a 3 meses → semana · más de 3 meses → mes)
    const diasTotales=Math.max(1,Math.round(duracionMs/864e5));
    const tipoLinea=diasTotales<=14?"dia":diasTotales<=90?"semana":"mes";
    const timelinePuntos=[];
    if(tipoLinea==="dia"){
      for(let t=desdeMs;t<=hastaMs;t+=864e5){
        const bMs=t,bFinMs=t+864e5-1;
        const novsDia=novedades.filter(n=>enRango(n.created_at,bMs,bFinMs));
        timelinePuntos.push({fecha:new Date(bMs),label:new Date(bMs).toLocaleDateString("es-AR",{day:"2-digit",month:"short"}).toUpperCase(),sub:new Date(bMs).toLocaleDateString("es-AR",{weekday:"long"}),novs:novsDia});
      }
    }else if(tipoLinea==="semana"){
      for(let t=desdeMs;t<=hastaMs;t+=7*864e5){
        const bMs=t,bFinMs=Math.min(t+7*864e5-1,hastaMs);
        const novsSemana=novedades.filter(n=>enRango(n.created_at,bMs,bFinMs));
        timelinePuntos.push({fecha:new Date(bMs),label:`${new Date(bMs).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"})}`,sub:`al ${new Date(bFinMs).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"})}`,novs:novsSemana});
      }
    }else{
      const d0=new Date(desdeMs);
      let cursor=new Date(d0.getFullYear(),d0.getMonth(),1);
      while(cursor.getTime()<=hastaMs){
        const bMs=Math.max(cursor.getTime(),desdeMs);
        const finMes=new Date(cursor.getFullYear(),cursor.getMonth()+1,1).getTime()-1;
        const bFinMs=Math.min(finMes,hastaMs);
        const novsMes=novedades.filter(n=>enRango(n.created_at,bMs,bFinMs));
        timelinePuntos.push({fecha:new Date(bMs),label:cursor.toLocaleDateString("es-AR",{month:"long",year:"numeric"}).toUpperCase(),sub:"",novs:novsMes});
        cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);
      }
    }
    // Máximo 8 puntos en la línea de tiempo para que no se rompa el diseño (si hay más, ya debería estar agrupando por una unidad más grande)
    const timeline=timelinePuntos.slice(0,8).map(p=>{
      const resueltasP=p.novs.filter(n=>n.resuelta).length;
      const vencidasP=p.novs.filter(n=>!n.resuelta&&n.fechaLimite&&new Date(n.fechaLimite).getTime()<hoyMs).length;
      const pendientesP=p.novs.length-resueltasP-vencidasP;
      let estado="sin_cambios",cant=0,etiqueta="Sin cambios";
      if(vencidasP>0){estado="vencida";cant=vencidasP;etiqueta=vencidasP===1?"Vencida":"Vencidas";}
      else if(pendientesP>0){estado="pendiente";cant=pendientesP;etiqueta=pendientesP===1?"Pendiente":"Pendientes";}
      else if(resueltasP>0){estado="resuelta";cant=resueltasP;etiqueta=resueltasP===1?"Resuelta":"Resueltas";}
      const fotos=p.novs.map(n=>n.fotoResolucion||(n.fotos&&n.fotos[0])).filter(Boolean).slice(0,2);
      return{...p,estado,cant,etiqueta,fotos};
    });

    // Comparativa con el período anterior (vencidas: las que ya estaban vencidas al cierre de cada período)
    const vencidasEnPeriodo=(lista,finMs)=>lista.filter(n=>!n.resuelta&&n.fechaLimite&&new Date(n.fechaLimite).getTime()<finMs).length;
    const vencidasActualPeriodo=vencidasEnPeriodo(actual.reportadas,hastaMs);
    const vencidasAnteriorPeriodo=vencidasEnPeriodo(anterior.reportadas,hastaAntMs);

    const fotos=actual.resueltas.filter(n=>n.fotoResolucion).map((n,i)=>({
      num:i+1,descripcion:n.descripcion,sector:n.sector,foto:n.fotoResolucion,
      responsable:n.responsable_usuario_id?(equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.nombre||n.responsable):n.responsable
    }));

    const delta=(act,ant,invertido=false)=>{
      if(ant===0&&act===0)return{texto:"Sin cambios",tipo:"neutral"};
      if(ant===0)return{texto:"Primer período con datos",tipo:"neutral"};
      const pct=Math.round(((act-ant)/ant)*100);
      const bueno=invertido?pct<=0:pct>=0;
      return{texto:`${Math.abs(pct)}% ${pct>=0?"más":"menos"} que el período anterior`,tipo:pct===0?"neutral":(bueno?"good":"bad"),pct};
    };

    // Estado general (regla simple, sin IA): según vencidas y críticas abiertas ahora mismo
    const estadoGeneral=criticasAbiertas.length>0?{txt:"Crítico",color:"#D0342C",desc:"Hay novedades urgentes vencidas que necesitan atención inmediata."}
      :vencidasActuales.length>0?{txt:"Atención",color:"#9a6b00",desc:"Hay novedades vencidas sin resolver que conviene priorizar."}
      :{txt:"Bueno",color:"#1a8a3d",desc:"La obra muestra un buen nivel de avance general, con la mayoría de las incidencias bajo control."};

    // Puntos clave del período (plantillas con datos reales, sin texto libre)
    const deltaRep=delta(actual.reportadas.length,anterior.reportadas.length);
    const oficioCritico=porOficio.filter(o=>actual.reportadas.some(n=>n.responsable===o.nombre&&!n.resuelta&&n.fechaLimite&&new Date(n.fechaLimite).getTime()<hoyMs)).sort((a,b)=>b.cant-a.cant)[0];
    const vencidaMasVieja=vencidasActuales.sort((a,b)=>new Date(a.fechaLimite).getTime()-new Date(b.fechaLimite).getTime())[0];
    const diasVencidaMasVieja=vencidaMasVieja?Math.floor((hoyMs-new Date(vencidaMasVieja.fechaLimite).getTime())/864e5):0;
    const insights=[];
    if(deltaRep.tipo!=="neutral")insights.push({icono:"📈",texto:`Las novedades reportadas ${deltaRep.pct>=0?"subieron":"bajaron"} un ${Math.abs(deltaRep.pct)}% respecto del período anterior.`});
    if(oficioCritico)insights.push({icono:"🔧",texto:`El oficio con más atrasos es ${oficioCritico.nombre}.`});
    if(vencidaMasVieja)insights.push({icono:"⚠️",texto:`Hay una novedad vencida hace ${diasVencidaMasVieja} día${diasVencidaMasVieja!==1?"s":""} que necesita atención.`});
    if(porSector[0])insights.push({icono:"📍",texto:`El sector ${porSector[0].nombre} concentra el ${Math.round((porSector[0].cant/actual.reportadas.length)*100)}% de las novedades del período.`});
    if(actual.resueltas.length>0)insights.push({icono:"⏱️",texto:`El tiempo promedio de resolución es de ${actual.tiempoProm.toFixed(1)} días.`});
    else insights.push({icono:"⏱️",texto:"Todavía no hay novedades resueltas en este período para calcular un tiempo promedio."});

    setReporteData({
      desde,hasta,
      listaCompleta:actual.reportadas,
      reportadas:actual.reportadas.length,
      resueltas:actual.resueltas.length,
      tiempoProm:actual.tiempoProm,
      pendientes:pendientesActuales.length,
      vencidas:vencidasActuales.length,
      criticas:criticasAbiertas.length,
      avance:actual.reportadas.length>0?Math.round((actual.resueltas.length/actual.reportadas.length)*100):0,
      deltaReportadas:delta(actual.reportadas.length,anterior.reportadas.length),
      deltaResueltas:delta(actual.resueltas.length,anterior.resueltas.length),
      deltaTiempo:delta(Number(actual.tiempoProm.toFixed(1)),Number(anterior.tiempoProm.toFixed(1)),true),
      deltaVencidas:delta(vencidasActualPeriodo,vencidasAnteriorPeriodo,true),
      vencidasActualPeriodo,vencidasAnteriorPeriodo,
      resueltasAnterior:anterior.resueltas.length,
      reportadasAnterior:anterior.reportadas.length,
      tiempoPromAnterior:anterior.tiempoProm,
      desdeAnt:new Date(desdeAntMs),hastaAnt:new Date(hastaAntMs),
      porSector,porOficio,
      actividadPersonas,
      tipoLinea,timeline,
      estadoGeneral,insights,
      fotos,
    });
    setModalPeriodoReporte(false);
    setVistaReporte(true);
    setGenerandoReporte(false);
  };
  const elegirPeriodo=(tipo)=>{
    const hoy=new Date();hoy.setHours(23,59,59,999);
    let desde=new Date();
    if(tipo==="dia"){desde=new Date();desde.setHours(0,0,0,0);}
    else if(tipo==="semana"){desde=new Date();desde.setDate(desde.getDate()-6);desde.setHours(0,0,0,0);}
    else if(tipo==="mes"){desde=new Date();desde.setDate(desde.getDate()-29);desde.setHours(0,0,0,0);}
    else if(tipo==="inicio"){desde=obraActual?.created_at?new Date(obraActual.created_at):new Date(2020,0,1);desde.setHours(0,0,0,0);}
    else if(tipo==="personalizado"){
      if(!rangoPersonalizado.desde||!rangoPersonalizado.hasta){alert("Elegí las dos fechas");return;}
      setGenerandoReporte(true);
      setTimeout(()=>generarReporte(new Date(rangoPersonalizado.desde+"T00:00:00"),new Date(rangoPersonalizado.hasta+"T23:59:59")),50);
      return;
    }
    setGenerandoReporte(true);
    setTimeout(()=>generarReporte(desde,hoy),50);
  };
  const [menuContextual,   setMenuContextual]   = useState(null);
  const [modalTelefono, setModalTelefono] = useState<{uid:string,nombre:string}|null>(null);
  const [telInput, setTelInput] = useState("");
  const [asignacionRapida, setAsignacionRapida] = useState(null);
  const [asignarTareaMiembro, setAsignarTareaMiembro] = useState(null);
  const [invitarCallback,  setInvitarCallback]  = useState<((datos:{responsable:string,usuarioId:null})=>void)|null>(null);
  const [invitacionesPendientes, setInvitacionesPendientes] = useState<any[]>([]);
  const [empresaPropia,        setEmpresaPropia]        = useState<any>(null);
  const [bitacoraItems,        setBitacoraItems]        = useState<any[]>([]);
  const [notasBitacora,        setNotasBitacora]        = useState<any>({});
  const [vistaBitacora,        setVistaBitacora]        = useState(false);
  const [buscarBitacora,       setBuscarBitacora]       = useState("");
  const [ordenBitacora,        setOrdenBitacora]        = useState("reciente");
  const [notaEditando,         setNotaEditando]         = useState<any>(null); // {bitacoraId,notaId,texto}
  const [nuevaNotaTexto,       setNuevaNotaTexto]       = useState("");
  const [miembrosEmpresa,      setMiembrosEmpresa]      = useState<any[]>([]);
  const [obrasEmpresa,         setObrasEmpresa]         = useState<any[]>([]);
  const [modalCrearEmpresa,    setModalCrearEmpresa]    = useState(false);
  const [nombreEmpresaInput,   setNombreEmpresaInput]   = useState("");
  const [modalInvitarArq,      setModalInvitarArq]      = useState(false);
  const [linkEmpresaGenerado,  setLinkEmpresaGenerado]  = useState("");
  const [generandoLinkEmpresa, setGenerandoLinkEmpresa] = useState(false);
  const [invitacionesEmpresaPendientes, setInvitacionesEmpresaPendientes] = useState<any[]>([]);
  const [vistaHome,            setVistaHome]            = useState("mias");
  const [misEmpresasComoMiembro, setMisEmpresasComoMiembro] = useState<any[]>([]);
  const [modalCompartirObra,   setModalCompartirObra]   = useState(null);
  const [metricasAyerEmpresa,  setMetricasAyerEmpresa]  = useState<any>(null);
  const [vistaDirectorCategoria, setVistaDirectorCategoria] = useState<string|null>(null); // "urgencias"|"novedades"|"resueltas"
  const [filtroObraAlertas,      setFiltroObraAlertas]      = useState<any>(null); // {id,nombre} o null = todas
  const [origenDirectorCategoria,setOrigenDirectorCategoria]= useState<string|null>(null); // para que "volver" desde una obra vuelva a la pastilla correcta
  const [vistaTuEquipo,        setVistaTuEquipo]        = useState(false);
  const [vistaProfesionales,   setVistaProfesionales]   = useState(false);
  const cargarEmpresa=async()=>{
    if(!usuarioReal)return;
    const{data:emp}=await supabase.from("empresas").select("id,nombre").eq("director_id",usuarioReal.id).limit(1).maybeSingle();
    setEmpresaPropia(emp||null);
    if(!emp)return;
    const{data:miembros}=await supabase.from("empresa_miembros").select("usuario_id,usuarios(nombre,email)").eq("empresa_id",emp.id);
    setMiembrosEmpresa(miembros||[]);
    const{data:obrasEmp}=await supabase.from("obras").select("*").eq("empresa_id",emp.id);
    const conNovedades=await Promise.all((obrasEmp||[]).map(async o=>{
      const{data:novs}=await supabase.from("novedades").select("id,descripcion,prioridad,resuelta,estado_aprobacion,responsable,responsable_usuario_id,fecha_limite,created_at,resuelta_at").eq("obra_id",o.id);
      const{data:equipoObraData}=await supabase.from("equipo_obra").select("usuario_id,telefono,email_contacto").eq("obra_id",o.id);
      const equipo=(equipoObraData||[]).map(m=>({uid:m.usuario_id,telefono:m.telefono||null,emailContacto:m.email_contacto||null}));
      return{...o,novedades:novs||[],equipo};
    }));
    setObrasEmpresa(conNovedades);
    const{data:invsEmp}=await supabase.from("invitaciones_empresa").select("codigo,usada,created_at").eq("empresa_id",emp.id).eq("usada",false);
    setInvitacionesEmpresaPendientes(invsEmp||[]);
    const{data:metricasAyer}=await supabase.from("metricas_diarias_empresa").select("*").eq("empresa_id",emp.id).lt("fecha",new Date().toISOString().slice(0,10)).order("fecha",{ascending:false}).limit(1).maybeSingle();
    setMetricasAyerEmpresa(metricasAyer||null);
  };
  const compartirObraConEmpresa=async(obraId,empresaId)=>{
    const{error}=await supabase.from("obras").update({empresa_id:empresaId}).eq("id",obraId);
    if(error){alert("No se pudo actualizar: "+error.message);return;}
    setObras(o=>o.map(x=>x.id===obraId?{...x,empresa_id:empresaId}:x));
    mostrarToast(empresaId?"Obra compartida":"Obra vuelta a privada");
  };
  const cargarInvitacionesPendientes=async()=>{
    if(!obraActual?.id)return;
    const{data}=await supabase.from("invitaciones").select("codigo,rol,especialidad,nombre,telefono,created_at").eq("obra_id",obraActual.id).eq("usada",false).order("created_at",{ascending:false});
    setInvitacionesPendientes(data||[]);
  };
  useEffect(()=>{if(vistaEquipo&&obraActual?.id)cargarInvitacionesPendientes();},[vistaEquipo,obraActual?.id]);
  const cancelarInvitacion=async(codigo)=>{
    const{error}=await supabase.from("invitaciones").delete().eq("codigo",codigo);
    if(error){alert("No se pudo cancelar la invitación: "+error.message);return;}
    setInvitacionesPendientes(p=>p.filter(i=>i.codigo!==codigo));
    mostrarToast("Invitación cancelada");
  };
  const reenviarInvitacion=(inv)=>{
    const link=`https://www.fixgo.ar/?invitacion=${inv.codigo}`;
    const rolTxt=inv.rol==="capataz"?"Capataz":inv.rol==="co_profesional"?"Colega":(inv.especialidad||"Operario");
    const msg=`Hola! Te mando esto desde Fixgo 👷\n\nTe estoy sumando a la obra "${obraActual?.nombre}" como ${rolTxt}.\n\nFixgo es la app donde vamos a coordinar el trabajo. Vas a ver las novedades que te asigno y vas a poder avisarme cuando las terminás.\n\nPara entrar, tocá acá 👇\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
  };
  const guardarTelefono=async()=>{
    if(!modalTelefono)return;
    const uid=modalTelefono.uid;
    const{error}=await supabase.from("equipo_obra").update({telefono:telInput.trim()||null}).eq("usuario_id",uid);
    if(error){alert("No se pudo guardar el teléfono: "+error.message);return;}
    const tel=telInput.trim()||null;
    setObras(obs=>obs.map(o=>({...o,equipo:(o.equipo||[]).map(m=>m.uid===uid?{...m,telefono:tel}:m)})));
    setObraActual(oa=>oa?{...oa,equipo:(oa.equipo||[]).map(m=>m.uid===uid?{...m,telefono:tel}:m)}:oa);
    setObrasEmpresa(oe=>oe.map(o=>({...o,equipo:(o.equipo||[]).map(m=>m.uid===uid?{...m,telefono:tel}:m)})));
    if(miembroSel&&miembroSel.uid===uid)setMiembroSel(ms=>ms?{...ms,telefono:tel}:ms);
    setModalTelefono(null);setTelInput("");mostrarToast("Teléfono guardado");
  };
  const [modalEmailContacto,setModalEmailContacto]=useState<any>(null); // {uid,nombre,obraId}
  const [emailContactoInput,setEmailContactoInput]=useState("");
  const guardarEmailContacto=async()=>{
    if(!modalEmailContacto)return;
    const uid=modalEmailContacto.uid;
    const{error}=await supabase.from("equipo_obra").update({email_contacto:emailContactoInput.trim()||null}).eq("usuario_id",uid);
    if(error){alert("No se pudo guardar el mail: "+error.message);return;}
    const mail=emailContactoInput.trim()||null;
    setObrasEmpresa(oe=>oe.map(o=>({...o,equipo:(o.equipo||[]).map(m=>m.uid===uid?{...m,emailContacto:mail}:m)})));
    setModalEmailContacto(null);setEmailContactoInput("");mostrarToast("Mail de contacto guardado");
  };
  const [confirmarEliminar,setConfirmarEliminar]= useState(null);
  const [menuObra,         setMenuObra]         = useState(null);
  const [confirmarEliminarObra,setConfirmarEliminarObra]=useState(null);
  const [modalProObra,     setModalProObra]     = useState(false);
  const [editando,         setEditando]         = useState(false);
  const [formEdit,         setFormEdit]         = useState(null);
  const [perfilForm,       setPerfilForm]       = useState({nombre:"",especialidad:"",email:""});
  const [esProReal,        setEsProReal]        = useState(false);
  const esVersionPro = esProReal;
  const [nombreEstudio,    setNombreEstudio]    = useState("");
  const [nombreEstudioInput, setNombreEstudioInput] = useState("");
  const [logoEstudioUrl,   setLogoEstudioUrl]   = useState("");
  const [subiendoLogo,     setSubiendoLogo]     = useState(false);
  const fileRefLogo = useRef();
  const [nombrePersonalizado, setNombrePersonalizado] = useState("");
  useEffect(()=>{
    if(!usuarioReal){setEsProReal(false);return;}
    supabase.from("usuarios").select("es_pro,nombre_estudio,logo_estudio_url,nombre_personalizado").eq("id",usuarioReal.id).single().then(({data})=>{
      setEsProReal(!!data?.es_pro);
      setNombreEstudio(data?.nombre_estudio||"");
      setNombreEstudioInput(data?.nombre_estudio||"");
      setLogoEstudioUrl(data?.logo_estudio_url||"");
      setNombrePersonalizado(data?.nombre_personalizado||"");
    });
  },[usuarioReal?.id]);
  const simularPro=async(valor)=>{
    if(!usuarioReal)return;
    setEsProReal(valor);
    const{error}=await supabase.from("usuarios").update({es_pro:valor}).eq("id",usuarioReal.id);
    if(error){alert("No se pudo guardar: "+error.message);setEsProReal(!valor);return;}
    mostrarToast(valor?"Modo Pro activado (simulado)":"Modo Pro desactivado");
  };
  const misObrasPropias = usuarioReal ? obras.filter(o=>o.propietario_id===usuarioReal.id).length : obras.length;
  const [modalFotoResolucion, setModalFotoResolucion] = useState(null);
  const [subiendoFotoResolucion, setSubiendoFotoResolucion] = useState(false);
  const fileRefResolucion = useRef();
  const fileRef = useRef();
  const fileRefEdit = useRef();

  const novedades    = obraActual?(novedadesPorObra[obraActual.id]||[]):[];
  const setNovedades = (fn)=>setNovedadesPorObra(p=>({...p,[obraActual.id]:typeof fn==="function"?fn(p[obraActual.id]||[]):fn}));
  const usuarioActivoReal = usuarioReal?{id:usuarioReal.id,nombre:nombrePersonalizado||usuarioReal.user_metadata?.full_name||usuarioReal.email?.split("@")[0]||"Usuario",rolSistema:"profesional",especialidad:"Profesional",avatar:"📐",color:"#0057FF"}:usuarioActivo;
  const equipoObra   = useMemo(()=>obraActual?(obraActual.equipo||[]).filter((m,i,arr)=>arr.findIndex(x=>x.uid===m.uid)===i).map((m,idx)=>{const esDueno=usuarioReal&&m.uid===usuarioReal.id;const nombreFinal=m.nombre||(esDueno?usuarioActivoReal.nombre:null);const color=colorPorIndice(idx);if(nombreFinal){return{id:m.uid,uid:m.uid,nombre:nombreFinal,especialidad:m.especialidad||(m.rolEnObra==="profesional"?"Profesional":""),avatar:m.avatar||"📐",color,rolEnObra:m.rolEnObra,invitadoPor:m.invitadoPor||null,colorIdx:idx,telefono:m.telefono||null};}const u=USUARIOS_DEMO.find(u=>u.id===m.uid);if(u)return{...u,uid:m.uid,rolEnObra:m.rolEnObra,invitadoPor:m.invitadoPor||null,color,colorIdx:idx,telefono:m.telefono||null};return{id:m.uid,uid:m.uid,nombre:m.especialidad?"("+m.especialidad+")":"Sin nombre",especialidad:m.especialidad||"",avatar:m.avatar||"👷",color,rolEnObra:m.rolEnObra,invitadoPor:m.invitadoPor||null,colorIdx:idx,telefono:m.telefono||null};}).filter(Boolean):[],[obraActual?.id,obraActual?.equipo,usuarioReal?.id]);
  const miId         = usuarioReal?.id||usuarioActivo.id;
  const miRolEnObra  = obraActual?((obraActual.equipo||[]).find(m=>m.uid===miId)?.rolEnObra||(usuarioReal?(obraActual.propietario_id===miId?"profesional":"operario"):"operario")):(usuarioReal?"profesional":usuarioActivo.rolSistema);
  const miRolInfo    = ROLES_SISTEMA.find(r=>r.id===miRolEnObra);
  const puedeGestionar = miRolEnObra==="profesional"||miRolEnObra==="capataz"||miRolEnObra==="co_profesional";
  const getUserById  = (id)=>{
    if(!id)return null;
    if(usuarioReal&&id===usuarioReal.id)return{id,nombre:usuarioActivoReal.nombre};
    const enEquipo=(obraActual?.equipo||[]).find(m=>m.uid===id);
    if(enEquipo)return{id,nombre:enEquipo.nombre||"Usuario"};
    return USUARIOS_DEMO.find(u=>u.id===id)||null;
  };

  useEffect(()=>{
    if(document.getElementById("fixgo-spin-style"))return;
    const st=document.createElement("style");
    st.id="fixgo-spin-style";
    st.textContent="@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes slideInDcha{from{transform:translateX(38px);opacity:0.4}to{transform:translateX(0);opacity:1}}@keyframes slideInIzq{from{transform:translateX(-38px);opacity:0.4}to{transform:translateX(0);opacity:1}}";
    document.head.appendChild(st);
  },[]);

  useEffect(()=>{
    let el=document.getElementById("fixgo-toast");
    if(!el){
      el=document.createElement("div");
      el.id="fixgo-toast";
      el.style.cssText="position:fixed;left:50%;bottom:90px;transform:translateX(-50%) translateY(12px);background:#1C1C1E;color:#fff;padding:12px 20px;border-radius:99px;font-size:13px;fontWeight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.25);white-space:nowrap;z-index:9999;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
      document.body.appendChild(el);
    }
    if(toast){
      el.innerHTML='<span style="width:18px;height:18px;border-radius:50%;background:#34C759;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700">&#10003;</span>'+toast;
      el.style.opacity="1";
      el.style.transform="translateX(-50%) translateY(0)";
    }else{
      el.style.opacity="0";
      el.style.transform="translateX(-50%) translateY(12px)";
    }
  },[toast]);

  // ── ETAPA 4: detectar el link de invitación al abrir la app ──
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const codigo=params.get("invitacion");
    if(codigo){
      localStorage.setItem("fixgo_invitacion",codigo);
    }
    const codigoEmpresa=params.get("empresa");
    if(codigoEmpresa){
      localStorage.setItem("fixgo_invitacion_empresa",codigoEmpresa);
    }
  },[]);

  // ── ETAPA 4: usar el link una vez que la persona inició sesión (ANTES de cargar obras) ──
  const [invitacionProcesada, setInvitacionProcesada] = useState(false);
  useEffect(()=>{
    if(!usuarioReal){setInvitacionProcesada(false);return;}
    const codigo=localStorage.getItem("fixgo_invitacion");
    if(!codigo){setInvitacionProcesada(true);return;}
    (async()=>{
      const{data,error}=await supabase.rpc("usar_invitacion",{codigo:codigo});
      localStorage.removeItem("fixgo_invitacion");
      if(error){console.error("Error al usar invitación:",error);setInvitacionProcesada(true);return;}
      if(data?.ok){
        setToast("¡Te uniste a la obra!");
        setTimeout(()=>setToast(""),2500);
        window.history.replaceState({},"","https://www.fixgo.ar/");
      }else if(data?.motivo==="ya_usada"){
        setToast("Este link de invitación ya fue usado");
        setTimeout(()=>setToast(""),2500);
      }else if(data?.motivo==="no_existe"){
        setToast("El link de invitación no es válido");
        setTimeout(()=>setToast(""),2500);
      }else if(data?.error){
        setToast(data.error);
        setTimeout(()=>setToast(""),2500);
      }
      setInvitacionProcesada(true);
    })();
  },[usuarioReal]);

  useEffect(()=>{if(usuarioReal&&invitacionProcesada)cargarEmpresa();},[usuarioReal,invitacionProcesada]);
  useEffect(()=>{
    if(!vistaReporte||!reporteData)return;
    let cancelado=false,impreso=false;
    const imprimirUnaVez=()=>{if(impreso||cancelado)return;impreso=true;window.print();};
    const esperarImagenesYImprimir=()=>{
      const imgs=Array.from(document.querySelectorAll(".hoja-informe img")) as HTMLImageElement[];
      const pendientes=imgs.filter(img=>!img.complete);
      if(pendientes.length===0){setTimeout(imprimirUnaVez,150);return;}
      let restantes=pendientes.length;
      const listo=()=>{restantes--;if(restantes<=0)setTimeout(imprimirUnaVez,150);};
      pendientes.forEach(img=>{img.addEventListener("load",listo,{once:true});img.addEventListener("error",listo,{once:true});});
      // Respaldo: si por algún motivo alguna imagen nunca dispara load/error, igual imprime a los 5s
      setTimeout(imprimirUnaVez,5000);
    };
    const t=setTimeout(esperarImagenesYImprimir,120); // pequeña espera para que React termine de montar el DOM
    return ()=>{cancelado=true;clearTimeout(t);};
  },[vistaReporte,reporteData]);
  useEffect(()=>{if(usuarioReal&&invitacionProcesada)cargarBitacora();},[usuarioReal,invitacionProcesada]);
  useEffect(()=>{
    if(!usuarioReal||!invitacionProcesada)return;
    (async()=>{
      const{data}=await supabase.from("empresa_miembros").select("empresa_id,empresas(nombre)").eq("usuario_id",usuarioReal.id);
      setMisEmpresasComoMiembro(data||[]);
    })();
  },[usuarioReal,invitacionProcesada]);

  // ── Procesar invitación de EMPRESA una vez logueado ──
  useEffect(()=>{
    if(!usuarioReal)return;
    const codigoEmp=localStorage.getItem("fixgo_invitacion_empresa");
    if(!codigoEmp)return;
    (async()=>{
      const{data,error}=await supabase.rpc("usar_invitacion_empresa",{codigo:codigoEmp});
      localStorage.removeItem("fixgo_invitacion_empresa");
      if(error){console.error("Error al usar invitación de empresa:",error);return;}
      if(data?.ok){setToast("¡Te uniste al equipo de profesionales!");setTimeout(()=>setToast(""),2500);window.history.replaceState({},"","https://www.fixgo.ar/");}
      else if(data?.motivo==="ya_usada"){setToast("Este link de invitación ya fue usado");setTimeout(()=>setToast(""),2500);}
      else if(data?.motivo==="no_existe"){setToast("El link de invitación no es válido");setTimeout(()=>setToast(""),2500);}
    })();
  },[usuarioReal]);

  useEffect(()=>{
    if(!usuarioReal){setCargandoDatos(false);return;}
    if(!invitacionProcesada)return;
    if(!estaOnline){
      // ── Sin conexión: hidratar desde lo guardado localmente ──
      try{
        const obrasCache=JSON.parse(localStorage.getItem("fixgo_cache_obras_full")||"null");
        const novsCache=JSON.parse(localStorage.getItem("fixgo_cache_novedades")||"null");
        if(obrasCache)setObras(obrasCache);
        if(novsCache)setNovedadesPorObra(novsCache);
      }catch(e){}
      setCargandoDatos(false);
      return;
    }
    (async()=>{
     try{
      // Obras propias (donde es dueño)
      const{data:obrasPropias}=await supabase.from("obras").select("*").eq("propietario_id",usuarioReal.id);
      // Obras donde fue invitado (figura en equipo_obra)
      const{data:miembrosDe}=await supabase.from("equipo_obra").select("obra_id").eq("usuario_id",usuarioReal.id);
      const idsMiembro=(miembrosDe||[]).map(m=>m.obra_id);
      let obrasInvitado=[];
      if(idsMiembro.length>0){
        const{data:oi}=await supabase.from("obras").select("*").in("id",idsMiembro);
        obrasInvitado=oi||[];
      }
      // Juntar las dos listas SIN duplicar (por si es dueño Y miembro de la misma)
      const mapaObras={};
      for(const o of (obrasPropias||[])) mapaObras[o.id]=o;
      for(const o of obrasInvitado) mapaObras[o.id]=o;
      const data=Object.values(mapaObras);
      const error=null;
   if(!error){
     const obrasConEquipo=await Promise.all((data||[]).map(async(obra)=>{
       const{data:miembros}=await supabase.from("equipo_obra").select("usuario_id,rol_en_obra,nombre,especialidad,invitado_por,telefono").eq("obra_id",obra.id);
       const equipo=(miembros||[]).map(m=>({uid:m.usuario_id,rolEnObra:m.rol_en_obra,nombre:m.nombre,especialidad:m.especialidad,invitadoPor:m.invitado_por||null,telefono:m.telefono||null}));
       return{...obra,equipo};
     }));
     setObras(obrasConEquipo);
        // ── Detectar si alguna obra en la que participaba desapareció (eliminada u obra donde lo sacaron) ──
        try{
          const cacheRaw=localStorage.getItem("fixgo_obras_cache");
          const cachePrev=cacheRaw?JSON.parse(cacheRaw):null;
          if(cachePrev&&Array.isArray(cachePrev)){
            const idsActuales=new Set(obrasConEquipo.map(o=>o.id));
            const desaparecidas=cachePrev.filter(o=>!idsActuales.has(o.id)&&o.propietarioId!==usuarioReal.id);
            if(desaparecidas.length>0)setAvisoObraEliminada(desaparecidas[0].nombre||"una obra");
          }
          localStorage.setItem("fixgo_obras_cache",JSON.stringify(obrasConEquipo.map(o=>({id:o.id,nombre:o.nombre,propietarioId:o.propietario_id}))));
        }catch(e){}
        // Inicializar arrays vacíos
        const novsPorObra={};
        (data||[]).forEach(obra=>{ novsPorObra[obra.id]=[]; });
        setNovedadesPorObra(novsPorObra);
        // Cargar novedades de a una con delay para no bloquear el hilo principal
        (data||[]).forEach((obra, idx)=>{
          setTimeout(async()=>{
            const{data:novs}=await supabase.from("novedades").select("*,comentarios(*)").eq("obra_id",obra.id);
            if(novs){setNovedadesPorObra(p=>({...p,[obra.id]:novs.map(n=>({...n,fotos:n.fotos||[],ocultoCapataz:n.oculto_capataz||false,selloDirector:n.sello_director||null,estadoAprobacion:n.estado_aprobacion||null,autorId:n.autor_id||null,fechaLimite:n.fecha_limite||"",fecha:n.created_at?n.created_at.slice(0,10):"",comentarios:(n.comentarios||[]).map(c=>({texto:c.texto,audioUrl:c.audio_url||null,audioDuracion:c.audio_duracion||null,autorId:c.autor_id,ts:new Date(c.created_at).getTime()}))}))}))}
          }, idx * 300);
        });
      }
     }finally{
       setCargandoDatos(false);
     }
    })();
  },[usuarioReal,invitacionProcesada]);

  useEffect(()=>{
    if(!usuarioReal)return;
    const mapNov=(n)=>({...n,fotos:n.fotos||[],fotoResolucion:n.foto_resolucion||null,ocultoCapataz:n.oculto_capataz||false,selloDirector:n.sello_director||null,estadoAprobacion:n.estado_aprobacion||null,autorId:n.autor_id||null,fechaLimite:n.fecha_limite||"",fecha:n.created_at?n.created_at.slice(0,10):"",resueltaAt:n.resuelta_at||null,comentarios:[]});
    const canal=supabase.channel(`fixgo-realtime-${usuarioReal.id}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"novedades"},(payload)=>{
        const obraId=payload.new.obra_id;
        setNovedadesPorObra(p=>{const lista=p[obraId]||[];if(lista.some(x=>x.id===payload.new.id))return p;return{...p,[obraId]:[mapNov(payload.new),...lista]};});
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"novedades"},(payload)=>{
        const obraId=payload.new.obra_id;
        setNovedadesPorObra(p=>{const lista=p[obraId];if(!lista)return p;return{...p,[obraId]:lista.map(x=>{
          if(x.id!==payload.new.id)return x;
          const fotosNuevas=(payload.new.fotos===undefined||payload.new.fotos===null)?x.fotos:payload.new.fotos;
          return{...x,...mapNov(payload.new),fotos:fotosNuevas,comentarios:x.comentarios};
        })};});
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"novedades"},(payload)=>{
        const idBorrado=payload.old.id;
        setNovedadesPorObra(p=>{
          const obraKey=payload.old.obra_id&&p[payload.old.obra_id]?payload.old.obra_id:Object.keys(p).find(k=>(p[k]||[]).some(x=>x.id===idBorrado));
          if(!obraKey)return p;
          return{...p,[obraKey]:p[obraKey].filter(x=>x.id!==idBorrado)};
        });
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"comentarios"},(payload)=>{
        const nuevo=payload.new;
        setNovedadesPorObra(p=>{
          let cambio=false;
          const next={...p};
          for(const obraId of Object.keys(p)){
            const lista=p[obraId];
            const idx=lista.findIndex(x=>x.id===nuevo.novedad_id);
            if(idx===-1)continue;
            const nov=lista[idx];
            const yaTiene=nuevo.audio_url
              ?nov.comentarios.some(c=>c.audioUrl===nuevo.audio_url)
              :nov.comentarios.some(c=>c.autorId===nuevo.autor_id&&c.texto===nuevo.texto&&!c.audioUrl);
            if(yaTiene)continue;
            const novActualizada={...nov,comentarios:[...nov.comentarios,{texto:nuevo.texto,audioUrl:nuevo.audio_url||null,audioDuracion:nuevo.audio_duracion||null,autorId:nuevo.autor_id,ts:new Date(nuevo.created_at).getTime()}]};
            next[obraId]=lista.map((x,i)=>i===idx?novActualizada:x);
            cambio=true;
            break;
          }
          return cambio?next:p;
        });
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"equipo_obra"},(payload)=>{
        const m=payload.new;const obraId=m.obra_id;const nuevoMiembro={uid:m.usuario_id,rolEnObra:m.rol_en_obra,nombre:m.nombre,especialidad:m.especialidad,invitadoPor:m.invitado_por||null,telefono:m.telefono||null};
        setObras(os=>os.map(o=>{if(o.id!==obraId)return o;if((o.equipo||[]).some(x=>x.uid===nuevoMiembro.uid))return o;return{...o,equipo:[...(o.equipo||[]),nuevoMiembro]};}));
        setObraActual(oa=>{if(!oa||oa.id!==obraId)return oa;if((oa.equipo||[]).some(x=>x.uid===nuevoMiembro.uid))return oa;return{...oa,equipo:[...(oa.equipo||[]),nuevoMiembro]};});
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"equipo_obra"},(payload)=>{
        const m=payload.new;const obraId=m.obra_id;const actualizado={rolEnObra:m.rol_en_obra,nombre:m.nombre,especialidad:m.especialidad,invitadoPor:m.invitado_por||null,telefono:m.telefono||null};
        setObras(os=>os.map(o=>o.id===obraId?{...o,equipo:(o.equipo||[]).map(x=>x.uid===m.usuario_id?{...x,...actualizado}:x)}:o));
        setObraActual(oa=>(oa&&oa.id===obraId)?{...oa,equipo:(oa.equipo||[]).map(x=>x.uid===m.usuario_id?{...x,...actualizado}:x)}:oa);
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"equipo_obra"},(payload)=>{
        const obraId=payload.old.obra_id;const uidBorrado=payload.old.usuario_id;
        if(uidBorrado&&uidBorrado===usuarioReal.id){
          // ── Me sacaron a mí de esta obra: se la saco de mi lista y aviso ──
          const obraSaliente=obras.find(o=>o.id===obraId);
          setObras(os=>os.filter(o=>o.id!==obraId));
          setNovedadesPorObra(p=>{const{[obraId]:_omitido,...resto}=p;return resto;});
          if(obraActual?.id===obraId){setObraActual(null);setVistaRaiz("inicio");}
          setAvisoObraEliminada(obraSaliente?.nombre||"una obra");
          // Avisamos también al otro sistema (el que compara al recargar) para que no repita el mismo aviso después
          try{
            const cachePrev=JSON.parse(localStorage.getItem("fixgo_obras_cache")||"[]");
            localStorage.setItem("fixgo_obras_cache",JSON.stringify(cachePrev.filter((o:any)=>o.id!==obraId)));
          }catch(e){}
          return;
        }
        setObras(os=>os.map(o=>o.id===obraId?{...o,equipo:(o.equipo||[]).filter(x=>x.uid!==uidBorrado)}:o));
        setObraActual(oa=>(oa&&oa.id===obraId)?{...oa,equipo:(oa.equipo||[]).filter(x=>x.uid!==uidBorrado)}:oa);
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"invitaciones"},(payload)=>{
        // Se aceptó la invitación (usada pasó a true): sacarla de la lista de pendientes en vivo
        if(payload.new.usada){
          setInvitacionesPendientes(p=>p.filter(i=>i.codigo!==payload.new.codigo));
        }
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"invitaciones"},(payload)=>{
        // Se canceló la invitación: sacarla de la lista de pendientes en vivo
        setInvitacionesPendientes(p=>p.filter(i=>i.codigo!==payload.old.codigo));
      })
      .subscribe();
    return()=>{supabase.removeChannel(canal);};
  },[usuarioReal?.id]);

  useEffect(()=>{
    setPerfilForm({nombre:usuarioActivoReal.nombre,especialidad:usuarioActivo.especialidad,email:usuarioReal?.email||"demo@fixgo.app"});
  },[usuarioActivo.id,usuarioReal?.id]);

  const comprimirFoto=(file)=>new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=1280;
        let{width,height}=img;
        if(width>height&&width>MAX){height=Math.round(height*MAX/width);width=MAX;}
        else if(height>MAX){width=Math.round(width*MAX/height);height=MAX;}
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL("image/jpeg",0.7));
      };
      img.onerror=()=>resolve(ev.target.result);
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  const comprimirFotoBlob=(file)=>new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=1280;
        let{width,height}=img;
        if(width>height&&width>MAX){height=Math.round(height*MAX/width);width=MAX;}
        else if(height>MAX){width=Math.round(width*MAX/height);height=MAX;}
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,width,height);
        canvas.toBlob(blob=>resolve(blob),"image/jpeg",0.7);
      };
      img.onerror=()=>resolve(null);
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  const confirmarSinFoto=(id)=>{
    const nov=novedades.find(n=>n.id===id);
    const esDirecta=nov&&(nov.autorId===miId||puedeGestionar);
    if(esDirecta)resolver(id);else enviarAprobacion(id);
    setModalFotoResolucion(null);
    setVista("lista");
  };
  const confirmarResolucionConFoto=async(id,file)=>{
    setSubiendoFotoResolucion(true);
    const nov=novedades.find(n=>n.id===id);
    const esDirecta=nov&&(nov.autorId===miId||puedeGestionar);
    try{
      const blob=await comprimirFotoBlob(file);
      if(!blob)throw new Error("No se pudo procesar la foto");
      const nombreArchivo=`${obraActual.id}/${id}-${Date.now()}.jpg`;
      const{error:errorSubida}=await supabase.storage.from("fotos-resolucion").upload(nombreArchivo,blob,{contentType:"image/jpeg"});
      if(errorSubida)throw errorSubida;
      const{data:urlData}=supabase.storage.from("fotos-resolucion").getPublicUrl(nombreArchivo);
      const url=urlData.publicUrl;
      const ahora=new Date().toISOString();
      const cambios=esDirecta?{resuelta:true,estado_aprobacion:null,foto_resolucion:url,resuelta_at:ahora}:{estado_aprobacion:"pendiente",foto_resolucion:url};
      if(usuarioReal&&typeof id==="string"){const{error:errorUpdate}=await supabase.from("novedades").update(cambios).eq("id",id);if(errorUpdate)throw errorUpdate;}
      const cambiosLocal=esDirecta?{resuelta:true,estadoAprobacion:null,fotoResolucion:url,resueltaAt:ahora}:{estadoAprobacion:"pendiente",fotoResolucion:url};
      setNovedades(n=>n.map(x=>x.id===id?{...x,...cambiosLocal}:x));
      mostrarToast(esDirecta?"Novedad resuelta con foto":"Enviado a aprobación con foto");
      setVista("lista");
    }catch(e){alert("No se pudo subir la foto: "+(e.message||"error desconocido")+". Se confirmó igual, sin foto.");confirmarSinFoto(id);}
    setSubiendoFotoResolucion(false);
    setModalFotoResolucion(null);
  };
  const subirFotoNovedad=async(base64,carpetaId)=>{
    const blob=await(await fetch(base64)).blob();
    const nombreArchivo=`${carpetaId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
    const{error}=await supabase.storage.from("fotos-novedad").upload(nombreArchivo,blob,{contentType:"image/jpeg"});
    if(error)throw error;
    const{data}=supabase.storage.from("fotos-novedad").getPublicUrl(nombreArchivo);
    return data.publicUrl;
  };
  const handleFotos=async(e)=>{
    const files=Array.from(e.target.files);
    for(const f of files){
      const comprimida=await comprimirFoto(f);
      let idxNuevo;
      setForm(ff=>{idxNuevo=ff.fotos.length;return{...ff,fotos:[...ff.fotos,comprimida]};});
      let fotoFinal=comprimida;
      if(esVersionPro){
        fotoFinal=await new Promise(resolve=>setEditorDibujo({src:comprimida,origen:"nueva",idx:idxNuevo,onListo:resolve}));
      }
      if(estaOnline){
        try{
          const url=await subirFotoNovedad(fotoFinal,obraActual?.id||"temp");
          setForm(ff=>({...ff,fotos:ff.fotos.map((foto,i)=>i===idxNuevo?url:foto)}));
        }catch(err){
          console.error("No se pudo subir la foto, se guarda localmente como respaldo:",err);
          setForm(ff=>({...ff,fotos:ff.fotos.map((foto,i)=>i===idxNuevo?fotoFinal:foto)}));
        }
      }else{
        setForm(ff=>({...ff,fotos:ff.fotos.map((foto,i)=>i===idxNuevo?fotoFinal:foto)}));
      }
    }
  };
  const quitarFoto=(idx)=>setForm(f=>({...f,fotos:f.fotos.filter((_,i)=>i!==idx)}));
  const handleFotosEdit=async(e)=>{
    const files=Array.from(e.target.files);
    for(const f of files){
      const comprimida=await comprimirFoto(f);
      let idxNuevo;
      setFormEdit(ff=>{idxNuevo=(ff.fotos||[]).length;return{...ff,fotos:[...(ff.fotos||[]),comprimida]};});
      let fotoFinal=comprimida;
      if(esVersionPro){
        fotoFinal=await new Promise(resolve=>setEditorDibujo({src:comprimida,origen:"editar",idx:idxNuevo,onListo:resolve}));
      }
      if(estaOnline){
        try{
          const url=await subirFotoNovedad(fotoFinal,obraActual?.id||"temp");
          setFormEdit(ff=>({...ff,fotos:(ff.fotos||[]).map((foto,i)=>i===idxNuevo?url:foto)}));
        }catch(err){
          console.error("No se pudo subir la foto, se guarda localmente como respaldo:",err);
          setFormEdit(ff=>({...ff,fotos:(ff.fotos||[]).map((foto,i)=>i===idxNuevo?fotoFinal:foto)}));
        }
      }else{
        setFormEdit(ff=>({...ff,fotos:(ff.fotos||[]).map((foto,i)=>i===idxNuevo?fotoFinal:foto)}));
      }
    }
  };
  const quitarFotoEdit=(idx)=>setFormEdit(f=>({...f,fotos:f.fotos.filter((_,i)=>i!==idx)}));

  // ── EDITOR DE DIBUJO SOBRE FOTO (punto 5, Pro) — se abre solo al agregar la foto; reeditar es opcional para Pro ──
  const abrirEditorDibujo=(src,origen,idx=null)=>{
    if(!esVersionPro)return;
    setEditorDibujo({src,origen,idx});
  };
  const guardarDesdeEditorDibujo=async(dataUrlFinal)=>{
    const{origen,idx,onListo}=editorDibujo;
    if(origen==="nueva"){
      setForm(f=>({...f,fotos:f.fotos.map((foto,i)=>i===idx?dataUrlFinal:foto)}));
      setEditorDibujo(null);
      onListo?.(dataUrlFinal);
      return;
    }else if(origen==="editar"){
      setFormEdit(f=>({...f,fotos:(f.fotos||[]).map((foto,i)=>i===idx?dataUrlFinal:foto)}));
      setEditorDibujo(null);
      onListo?.(dataUrlFinal);
      return;
    }else if(origen==="resolucion"){
      const blob=await(await fetch(dataUrlFinal)).blob();
      confirmarResolucionConFoto(modalFotoResolucion,blob);
    }
    setEditorDibujo(null);
    onListo?.();
  };

  const guardar=async(continuar=false)=>{
    if(!form.descripcion.trim()||guardandoRef.current)return;
    guardandoRef.current=true;
    setGuardando(true);
    const resp=form.responsable==="Otro"&&form.responsableCustom.trim()?form.responsableCustom.trim():form.responsable;
    const sect=form.sector==="Otro"&&form.sectorCustom.trim()?form.sectorCustom.trim():form.sector;
    // "Guardar y agregar otra" (feedback experto 04/08): limpia fotos/descripción/nota/responsable,
    // mantiene obra (ya es global) y sector, y se queda en la pantalla de carga.
    const formSiguiente={...FORM_INICIAL,sector:form.sector,sectorCustom:form.sectorCustom};
    if(usuarioReal&&obraActual?.id&&typeof obraActual.id==="string"&&!estaOnline){
      // ── SIN CONEXIÓN: guardar localmente y encolar para sincronizar ──
      const tempId=`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const payload={obra_id:obraActual.id,descripcion:form.descripcion,responsable:resp,sector:sect,prioridad:form.prioridad,fecha_limite:form.fechaLimite||null,resuelta:false,fotos:form.fotos,autor_id:usuarioReal.id,oculto_capataz:form.ocultoCapataz,responsable_usuario_id:form.responsableUsuarioId||null};
      const comentarioInicial=form.comentario.trim();
      const nn={...payload,id:tempId,created_at:new Date().toISOString(),fecha:new Date().toISOString().slice(0,10),fechaLimite:payload.fecha_limite||"",ocultoCapataz:payload.oculto_capataz,autorId:payload.autor_id,pendienteSync:true,comentarios:comentarioInicial?[{texto:comentarioInicial,autorId:usuarioReal.id,ts:Date.now()}]:[]};
      setNovedades(n=>[nn,...n]);
      setColaOffline(c=>[...c,{tipo:"crear_novedad",tempId,payload,comentario:comentarioInicial||null}]);
      setForm(formSiguiente);if(!continuar)setVista("lista");setGuardando(false);guardandoRef.current=false;mostrarToast(continuar?"📡 Guardada sin conexión — lista para la próxima":"📡 Guardada sin conexión — se sube sola cuando vuelva la señal");
      return;
    }
    if(usuarioReal&&obraActual?.id&&typeof obraActual.id==="string"){
      // Conexión garantizada por TOKEN (no depende de que el nombre coincida) — memoria pendiente 04/08.
      let responsableUsuarioIdFinal=form.responsableUsuarioId||null;
      let tokenPendienteFinal=null;
      if(!responsableUsuarioIdFinal&&form.tokenAsignacionPendiente){
        const{data:invData}=await supabase.from("invitaciones").select("usuario_asignado").eq("token_novedad",form.tokenAsignacionPendiente).maybeSingle();
        if(invData?.usuario_asignado)responsableUsuarioIdFinal=invData.usuario_asignado;
        else tokenPendienteFinal=form.tokenAsignacionPendiente;
      }
      // Respaldo por nombre, por si la invitación no tenía token (invitada desde otro lugar)
      if(!responsableUsuarioIdFinal&&resp){
        const miembroCoincide=equipoObra.find(m=>m.nombre&&m.nombre.trim().toLowerCase()===resp.trim().toLowerCase());
        if(miembroCoincide)responsableUsuarioIdFinal=miembroCoincide.uid;
      }
      const{data,error}=await supabase.from("novedades").insert({obra_id:obraActual.id,descripcion:form.descripcion,responsable:resp,sector:sect,prioridad:form.prioridad,fecha_limite:form.fechaLimite||null,resuelta:false,fotos:form.fotos,autor_id:usuarioReal.id,oculto_capataz:form.ocultoCapataz,responsable_usuario_id:responsableUsuarioIdFinal,token_asignacion_pendiente:tokenPendienteFinal}).select().single();
      if(error){alert("No se pudo guardar la novedad: "+error.message);setGuardando(false);guardandoRef.current=false;return;}
      if(data){
        const nn={...data,fecha:data.created_at?.slice(0,10),fechaLimite:data.fecha_limite||"",ocultoCapataz:data.oculto_capataz||false,comentarios:[]};
        if(form.comentario.trim()){await supabase.from("comentarios").insert({novedad_id:data.id,autor_id:usuarioReal.id,texto:form.comentario.trim()});nn.comentarios=[{texto:form.comentario.trim(),autorId:usuarioReal.id,ts:Date.now()}];}
        setNovedades(n=>n.some(x=>x.id===nn.id)?n:[nn,...n]);
      }
    } else {
      setNovedades(n=>[{id:Date.now(),fotos:form.fotos,descripcion:form.descripcion,responsable:resp,sector:sect,prioridad:form.prioridad,fechaLimite:form.fechaLimite,resuelta:false,fecha:new Date().toISOString().slice(0,10),comentarios:form.comentario.trim()?[{texto:form.comentario.trim(),autorId:usuarioActivo.id,ts:Date.now()}]:[]},...n]);
    }
    setForm(formSiguiente);if(!continuar)setVista("lista");setGuardando(false);guardandoRef.current=false;mostrarToast(continuar?"✅ Guardada — lista para cargar la próxima":"Tarea creada con éxito");
  };

  const resolver=async(id)=>{
    const actual=novedades.find(x=>x.id===id);
    const nuevoEstado=!actual?.resuelta;
    const ahora=nuevoEstado?new Date().toISOString():null;
    if(usuarioReal&&typeof id==="string"&&id.startsWith("local-")){
      // Todavía ni se subió la novedad — solo actualizamos localmente, se sube ya resuelta cuando sincronice
      setNovedades(n=>n.map(x=>x.id===id?{...x,resuelta:nuevoEstado,estadoAprobacion:null,resueltaAt:ahora}:x));
      setColaOffline(c=>c.map(item=>item.tempId===id?{...item,payload:{...item.payload,resuelta:nuevoEstado,resuelta_at:ahora}}:item));
      return;
    }
    if(usuarioReal&&typeof id==="string"&&!estaOnline){
      setNovedades(n=>n.map(x=>x.id===id?{...x,resuelta:nuevoEstado,estadoAprobacion:null,resueltaAt:ahora,pendienteSync:true}:x));
      setColaOffline(c=>[...c,{tipo:"resolver",id,resuelta:nuevoEstado,resuelta_at:ahora,obraId:obraActual?.id}]);
      return;
    }
    if(usuarioReal&&typeof id==="string"){const{error}=await supabase.from("novedades").update({resuelta:nuevoEstado,estado_aprobacion:null,resuelta_at:ahora}).eq("id",id);if(error){alert("No se pudo actualizar: "+error.message);return;}}
    setNovedades(n=>n.map(x=>x.id===id?{...x,resuelta:nuevoEstado,estadoAprobacion:null,resueltaAt:ahora}:x));
  };
  const enviarAprobacion=async(id)=>{if(usuarioReal&&typeof id==="string"){const{error}=await supabase.from("novedades").update({estado_aprobacion:"pendiente"}).eq("id",id);if(error){alert("No se pudo enviar a aprobación: "+error.message);return;}}setNovedades(n=>n.map(x=>x.id===id?{...x,estadoAprobacion:"pendiente"}:x));};
  const aprobar=async(id)=>{const ahora=new Date().toISOString();if(usuarioReal&&typeof id==="string"){const{error}=await supabase.from("novedades").update({resuelta:true,estado_aprobacion:null,resuelta_at:ahora}).eq("id",id);if(error){alert("No se pudo aprobar: "+error.message);return;}}setNovedades(n=>n.map(x=>x.id===id?{...x,resuelta:true,estadoAprobacion:null,resueltaAt:ahora}:x));};
  const rechazar=async(id)=>{if(usuarioReal&&typeof id==="string"){const{error}=await supabase.from("novedades").update({resuelta:false,estado_aprobacion:null,resuelta_at:null}).eq("id",id);if(error){alert("No se pudo rechazar: "+error.message);return;}}setNovedades(n=>n.map(x=>x.id===id?{...x,resuelta:false,estadoAprobacion:null,resueltaAt:null}:x));};
  const eliminar=async(id)=>{
    if(typeof id==="string"&&id.startsWith("local-")){
      // Todavía ni se subió, la sacamos también de la cola de sincronización
      setColaOffline(c=>c.filter(item=>item.tempId!==id));
      setNovedades(n=>n.filter(x=>x.id!==id));
      setVista("lista");
      return;
    }
    if(!estaOnline){
      alert("📡 No hay conexión. Para borrar esta novedad necesitás internet — probá de nuevo cuando vuelva la señal.");
      return;
    }
    if(usuarioReal&&typeof id==="string"){
      const{error}=await supabase.from("novedades").delete().eq("id",id);
      if(error){
        const sinRed=error.message?.toLowerCase().includes("fetch")||error.message?.toLowerCase().includes("network");
        alert(sinRed?"📡 No se pudo borrar por falta de conexión. Probá de nuevo cuando vuelva la señal.":"No se pudo eliminar: "+error.message);
        return;
      }
    }
    setNovedades(n=>n.filter(x=>x.id!==id));
    setVista("lista");
  };
  const sincronizandoRef = useRef(false);
  const sincronizarCola=async()=>{
    if(!usuarioReal||sincronizandoRef.current)return;
    sincronizandoRef.current=true;
    const pendientes=JSON.parse(localStorage.getItem("fixgo_cola_offline")||"[]");
    if(pendientes.length===0){sincronizandoRef.current=false;return;}
    setSincronizando(true);
    let quedaronPendientes=[...pendientes];
    for(const item of pendientes){
      try{
        if(item.tipo==="crear_novedad"){
          const fotosFinales=await Promise.all((item.payload.fotos||[]).map(async(f)=>{
            if(typeof f==="string"&&f.startsWith("data:")){
              try{return await subirFotoNovedad(f,item.payload.obra_id);}
              catch(e){console.error("No se pudo subir una foto offline, se guarda como respaldo local:",e);return f;}
            }
            return f;
          }));
          const{data,error}=await supabase.from("novedades").insert({...item.payload,fotos:fotosFinales}).select().single();
          if(error)throw error;
          if(item.comentario){await supabase.from("comentarios").insert({novedad_id:data.id,autor_id:usuarioReal.id,texto:item.comentario});}
          const nn={...data,fecha:data.created_at?.slice(0,10),fechaLimite:data.fecha_limite||"",ocultoCapataz:data.oculto_capataz||false,resueltaAt:data.resuelta_at||null,fotoResolucion:data.foto_resolucion||null,comentarios:item.comentario?[{texto:item.comentario,autorId:usuarioReal.id,ts:Date.now()}]:[]};
          setNovedadesPorObra(p=>{
            const lista=p[item.payload.obra_id]||[];
            const yaLaAgregoTiempoReal=lista.some(x=>x.id===data.id);
            const nuevaLista=yaLaAgregoTiempoReal
              ?lista.filter(x=>x.id!==item.tempId) // ya está visible por Tiempo Real, solo sacamos la temporal
              :lista.map(x=>x.id===item.tempId?nn:x); // Tiempo Real todavía no llegó, la mostramos ya
            return{...p,[item.payload.obra_id]:nuevaLista};
          });
          quedaronPendientes=quedaronPendientes.filter(p=>p!==item);
        } else if(item.tipo==="resolver"){
          const{error:errorResolver}=await supabase.from("novedades").update({resuelta:item.resuelta,estado_aprobacion:null,resuelta_at:item.resuelta_at}).eq("id",item.id);
          if(errorResolver)throw errorResolver;
          setNovedadesPorObra(p=>{
            const obraKey=item.obraId&&p[item.obraId]?item.obraId:Object.keys(p).find(k=>(p[k]||[]).some(x=>x.id===item.id));
            if(!obraKey)return p;
            return{...p,[obraKey]:p[obraKey].map(x=>x.id===item.id?{...x,pendienteSync:false}:x)};
          });
          quedaronPendientes=quedaronPendientes.filter(p=>p!==item);
        } else if(item.tipo==="comentario_audio"){
          const blob=await base64ABlob(item.audioBase64);
          const nombreArchivo=`${item.novedadId}-${Date.now()}.webm`;
          const{error:errorSubida}=await supabase.storage.from("audios-comentarios").upload(nombreArchivo,blob,{contentType:blob.type||"audio/webm"});
          if(errorSubida)throw errorSubida;
          const{data:urlData}=supabase.storage.from("audios-comentarios").getPublicUrl(nombreArchivo);
          const audioUrl=urlData.publicUrl;
          const{error:errorInsert}=await supabase.from("comentarios").insert({novedad_id:item.novedadId,autor_id:item.autorId,texto:"",audio_url:audioUrl,audio_duracion:item.duracionSeg});
          if(errorInsert)throw errorInsert;
          setNovedadesPorObra(p=>{
            const obraKey=Object.keys(p).find(k=>(p[k]||[]).some(x=>x.id===item.novedadId));
            if(!obraKey)return p;
            return{...p,[obraKey]:p[obraKey].map(x=>x.id===item.novedadId?{...x,comentarios:x.comentarios.map(c=>(c.audioUrl===item.audioBase64)?{...c,audioUrl,pendienteSync:false}:c)}:x)};
          });
          quedaronPendientes=quedaronPendientes.filter(p=>p!==item);
        } else if(item.tipo==="comentario_texto"){
          const{error:errorInsert}=await supabase.from("comentarios").insert({novedad_id:item.novedadId,autor_id:item.autorId,texto:item.texto});
          if(errorInsert)throw errorInsert;
          setNovedadesPorObra(p=>{
            const obraKey=Object.keys(p).find(k=>(p[k]||[]).some(x=>x.id===item.novedadId));
            if(!obraKey)return p;
            return{...p,[obraKey]:p[obraKey].map(x=>x.id===item.novedadId?{...x,comentarios:x.comentarios.map(c=>(c.texto===item.texto&&c.autorId===item.autorId&&c.pendienteSync)?{...c,pendienteSync:false}:c)}:x)};
          });
          quedaronPendientes=quedaronPendientes.filter(p=>p!==item);
        }
      }catch(e){
        console.error("Error sincronizando item offline:",e);
        // lo dejamos en la cola para reintentar la próxima vez
      }
    }
    setColaOffline(quedaronPendientes);
    setSincronizando(false);
    sincronizandoRef.current=false;
    if(quedaronPendientes.length===0&&pendientes.length>0)mostrarToast("✅ Todo sincronizado");
  };
  useEffect(()=>{
    if(estaOnline&&colaOffline.length>0)sincronizarCola();
  },[estaOnline]);
  useEffect(()=>{
    const onVisible=()=>{if(document.visibilityState==="visible"&&navigator.onLine)sincronizarCola();};
    document.addEventListener("visibilitychange",onVisible);
    return()=>document.removeEventListener("visibilitychange",onVisible);
  },[]);

  const agregarComentario=async(id)=>{
    if(!nuevoComentario.trim()||guardando)return;
    const texto=nuevoComentario.trim();
    setGuardando(true);
    const autorId=usuarioReal?.id||usuarioActivo.id;
    if(usuarioReal&&typeof id==="string"&&!estaOnline){
      // ── Sin conexión: guardar local y encolar para subir cuando vuelva la señal ──
      setNovedades(n=>n.map(x=>x.id===id?{...x,comentarios:[...x.comentarios,{texto,autorId,ts:Date.now(),pendienteSync:true}]}:x));
      setColaOffline(c=>[...c,{tipo:"comentario_texto",novedadId:id,texto,autorId}]);
      setNuevoComentario("");
      setGuardando(false);
      mostrarToast("📡 Comentario guardado sin conexión — se sube solo cuando vuelva la señal");
      return;
    }
    if(usuarioReal&&typeof id==="string"){
      const{error}=await supabase.from("comentarios").insert({novedad_id:id,autor_id:usuarioReal.id,texto});
      if(error){alert("No se pudo agregar el comentario: "+error.message);setGuardando(false);return;}
    }
    setNovedades(n=>n.map(x=>x.id===id?{...x,comentarios:[...x.comentarios,{texto,autorId,ts:Date.now()}]}:x));
    setNuevoComentario("");
    setGuardando(false);
    mostrarToast("Comentario agregado");
  };

  // ── NOTAS DE VOZ EN COMENTARIOS (punto 1) ──
  const blobABase64=(blob)=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  const base64ABlob=async(base64)=>(await fetch(base64)).blob();
  // ══════════════════════════════════════════════════════
  // ESTADÍSTICAS DEL DASHBOARD DEL DIRECTOR
  // ══════════════════════════════════════════════════════
  const calcularStatsEmpresa=()=>{
    const hoy=new Date().toISOString().slice(0,10);
    const esUrgente=(n)=>!n.resuelta&&n.estado_aprobacion!=="pendiente"&&n.prioridad===0;
    const esPendienteAprob=(n)=>!n.resuelta&&n.estado_aprobacion==="pendiente";
    const esVencida=(n)=>!n.resuelta&&n.fecha_limite&&n.fecha_limite<hoy;

    let totalUrgentes=0,totalPendientes=0,totalResueltas=0,totalVencidas=0,totalNovedades=0;
    const porObraUrgentes:any[]=[],porObraPendientes:any[]=[],porObraResueltas:any[]=[],porObraNovedades:any[]=[],porObraVencidas:any[]=[],porObraSinResponsable:any[]=[],porObraTodas:any[]=[];
    const previewUrgentes:any[]=[],previewNovedades:any[]=[],previewResueltas:any[]=[],previewVencidas:any[]=[],previewSinResponsable:any[]=[];

    obrasEmpresa.forEach(obra=>{
      const novs=obra.novedades||[];
      const u=novs.filter(esUrgente).length;
      const p=novs.filter(esPendienteAprob).length;
      const r=novs.filter(n=>n.resuelta).length;
      const v=novs.filter(esVencida).length;
      const sr=novs.filter(n=>!n.resuelta&&!n.responsable_usuario_id).length;
      totalUrgentes+=u;totalPendientes+=p;totalResueltas+=r;totalNovedades+=novs.length;
      totalVencidas+=v;
      const nombreResponsable=miembrosEmpresa.find(m=>m.usuario_id===obra.propietario_id)?.usuarios?.nombre||"Profesional";
      porObraTodas.push({obraId:obra.id,obraNombre:obra.nombre,direccion:obra.direccion,responsable:nombreResponsable,count:novs.length});
      if(u>0)porObraUrgentes.push({obraId:obra.id,obraNombre:obra.nombre,responsable:nombreResponsable,count:u});
      if(v>0)porObraVencidas.push({obraId:obra.id,obraNombre:obra.nombre,responsable:nombreResponsable,count:v});
      if(sr>0)porObraSinResponsable.push({obraId:obra.id,obraNombre:obra.nombre,responsable:nombreResponsable,count:sr});
      if(p>0){
        const pendientesObra=novs.filter(esPendienteAprob);
        const masVieja=pendientesObra.reduce((min,n)=>!min||n.created_at<min.created_at?n:min,null);
        const dias=masVieja?Math.floor((Date.now()-new Date(masVieja.created_at).getTime())/86400000):0;
        porObraPendientes.push({obraId:obra.id,obraNombre:obra.nombre,responsable:nombreResponsable,count:p,diasMasVieja:dias});
      }
      if(r>0)porObraResueltas.push({obraId:obra.id,obraNombre:obra.nombre,responsable:nombreResponsable,count:r});
      if(novs.length>0)porObraNovedades.push({obraId:obra.id,obraNombre:obra.nombre,responsable:nombreResponsable,count:novs.length});
      novs.filter(esUrgente).forEach(n=>previewUrgentes.push({texto:n.descripcion,obraNombre:obra.nombre}));
      novs.filter(esVencida).forEach(n=>previewVencidas.push({texto:n.descripcion,obraNombre:obra.nombre}));
      novs.filter(n=>!n.resuelta&&!n.responsable_usuario_id).forEach(n=>previewSinResponsable.push({texto:n.descripcion,obraNombre:obra.nombre}));
      novs.forEach(n=>previewNovedades.push({texto:n.descripcion,obraNombre:obra.nombre}));
      novs.filter(n=>n.resuelta).forEach(n=>previewResueltas.push({texto:n.descripcion,obraNombre:obra.nombre}));
    });

    // Ranking por profesional
    const porProfesional=miembrosEmpresa.map(m=>{
      const obrasDeEste=obrasEmpresa.filter(o=>o.propietario_id===m.usuario_id);
      const todasNovs=obrasDeEste.flatMap(o=>o.novedades||[]);
      const urgentes=todasNovs.filter(esUrgente).length;
      const vencidas=todasNovs.filter(esVencida).length;
      const resueltas=todasNovs.filter(n=>n.resuelta).length;
      const total=todasNovs.length;
      const pctResuelto=total>0?Math.round((resueltas/total)*100):0;
      const resueltasConFecha=todasNovs.filter(n=>n.resuelta&&n.resuelta_at&&n.created_at);
      const diasProm=resueltasConFecha.length>0?Math.max(0,(resueltasConFecha.reduce((sum,n)=>sum+Math.max(0,(new Date(n.resuelta_at).getTime()-new Date(n.created_at).getTime())/86400000),0)/resueltasConFecha.length)):0;
      // Gremio crítico: oficio con más urgentes+vencidas
      const problemasPorGremio:any={};
      todasNovs.filter(n=>esUrgente(n)||esVencida(n)).forEach(n=>{problemasPorGremio[n.responsable]=(problemasPorGremio[n.responsable]||0)+1;});
      const gremioCritico=Object.entries(problemasPorGremio).sort((a:any,b:any)=>b[1]-a[1])[0];
      // Obra con más atrasos
      const problemasPorObra:any={};
      obrasDeEste.forEach(o=>{const c=(o.novedades||[]).filter(n=>esUrgente(n)||esVencida(n)).length;if(c>0)problemasPorObra[o.nombre]=c;});
      const obraCritica=Object.entries(problemasPorObra).sort((a:any,b:any)=>b[1]-a[1])[0];
      const estado=vencidas>0||urgentes>=3?"critico":urgentes>0?"atencion":"aldia";
      return{usuario_id:m.usuario_id,nombre:m.usuarios?.nombre||m.usuarios?.email||"Profesional",obras:obrasDeEste,urgentes,vencidas,resueltas,total,pctResuelto,diasProm,gremioCritico,obraCritica,estado};
    }).sort((a,b)=>{
      const orden:any={critico:0,atencion:1,aldia:2};
      return orden[a.estado]-orden[b.estado]||b.urgentes-a.urgentes;
    });

    // Eficiencia general (memoria pendiente 03/08): antigüedad promedio de TODO lo pendiente en todas las obras
    // del director juntas — mismo criterio que "Nivel de ritmo" individual, no tiempo de resolución histórico.
    const hoyTs=Date.now();
    const todasPendientesEmpresa=obrasEmpresa.flatMap(o=>(o.novedades||[]).filter(n=>!n.resuelta));
    const antiguedadPromEmpresa=todasPendientesEmpresa.length>0?todasPendientesEmpresa.reduce((acc,n)=>{const t=n.created_at?new Date(n.created_at).getTime():hoyTs;return acc+(hoyTs-t)/864e5;},0)/todasPendientesEmpresa.length:0;
    const obrasActivas=obrasEmpresa.length;
    const novedadesSinResponsable=obrasEmpresa.reduce((acc,o)=>acc+(o.novedades||[]).filter(n=>!n.resuelta&&!n.responsable_usuario_id).length,0);
    const profesionalesActivos=porProfesional.filter(p=>p.total>0).length;
    return{totalUrgentes,totalPendientes,totalResueltas,totalVencidas,totalNovedades,porObraUrgentes,porObraPendientes,porObraResueltas,porObraNovedades,porObraVencidas,porObraSinResponsable,porObraTodas,previewUrgentes,previewNovedades,previewResueltas,previewVencidas,previewSinResponsable,porProfesional,
      diasPromEmpresa:porProfesional.filter(p=>p.diasProm>0).length>0?(porProfesional.reduce((s,p)=>s+p.diasProm,0)/porProfesional.filter(p=>p.diasProm>0).length):0,
      antiguedadPromEmpresa,obrasActivas,novedadesSinResponsable,profesionalesActivos};
  };

  const cargarBitacora=async()=>{
    if(!usuarioReal)return;
    const{data:items,error}=await supabase.from("bitacora_director").select("*").eq("director_id",usuarioReal.id).order("created_at",{ascending:false});
    if(error){console.error("No se pudo cargar la Bitácora:",error.message);return;}
    setBitacoraItems(items||[]);
    if(items&&items.length>0){
      const ids=items.map(i=>i.id);
      const{data:notas,error:errorNotas}=await supabase.from("bitacora_notas").select("*").in("bitacora_id",ids).order("created_at",{ascending:true});
      if(errorNotas){console.error("No se pudieron cargar las notas:",errorNotas.message);return;}
      const agrupadas:any={};
      (notas||[]).forEach(n=>{(agrupadas[n.bitacora_id]||=[]).push(n);});
      setNotasBitacora(agrupadas);
    }else{
      setNotasBitacora({});
    }
  };
  const guardarEnBitacora=async(novedadId)=>{
    if(!usuarioReal)return null;
    const{data,error}=await supabase.from("bitacora_director").insert({director_id:usuarioReal.id,novedad_id:novedadId}).select().single();
    if(error){alert("No se pudo guardar en la Bitácora: "+error.message);return null;}
    setBitacoraItems(b=>[data,...b]);
    return data;
  };
  const agregarNotaBitacoraAuto=async(novedadId,miEntrada,texto)=>{
    if(!texto.trim())return;
    let entrada=miEntrada;
    if(!entrada)entrada=await guardarEnBitacora(novedadId);
    if(!entrada)return;
    await agregarNotaBitacora(entrada.id,texto);
  };
  const sacarDeBitacora=async(bitacoraId)=>{
    const{error}=await supabase.from("bitacora_director").delete().eq("id",bitacoraId);
    if(error){alert("No se pudo sacar de la Bitácora: "+error.message);return;}
    setBitacoraItems(b=>b.filter(x=>x.id!==bitacoraId));
    setNotasBitacora(n=>{const c={...n};delete c[bitacoraId];return c;});
    mostrarToast("Sacada de tu Bitácora");
  };
  const toggleHabladoBitacora=async(bitacoraId,valor)=>{
    setBitacoraItems(b=>b.map(x=>x.id===bitacoraId?{...x,hablado:valor}:x));
    const{error}=await supabase.from("bitacora_director").update({hablado:valor}).eq("id",bitacoraId);
    if(error){alert("No se pudo actualizar: "+error.message);setBitacoraItems(b=>b.map(x=>x.id===bitacoraId?{...x,hablado:!valor}:x));}
  };
  const agregarNotaBitacora=async(bitacoraId,texto)=>{
    if(!texto.trim())return;
    const{data,error}=await supabase.from("bitacora_notas").insert({bitacora_id:bitacoraId,texto:texto.trim()}).select().single();
    if(error){alert("No se pudo agregar la nota: "+error.message);return;}
    setNotasBitacora(n=>({...n,[bitacoraId]:[...(n[bitacoraId]||[]),data]}));
    setNuevaNotaTexto("");
  };
  const editarNotaBitacora=async(bitacoraId,notaId,textoNuevo)=>{
    if(!textoNuevo.trim())return;
    const{error}=await supabase.from("bitacora_notas").update({texto:textoNuevo.trim(),updated_at:new Date().toISOString()}).eq("id",notaId);
    if(error){alert("No se pudo editar la nota: "+error.message);return;}
    setNotasBitacora(n=>({...n,[bitacoraId]:(n[bitacoraId]||[]).map(x=>x.id===notaId?{...x,texto:textoNuevo.trim()}:x)}));
    setNotaEditando(null);
  };
  const borrarNotaBitacora=async(bitacoraId,notaId)=>{
    const{error}=await supabase.from("bitacora_notas").delete().eq("id",notaId);
    if(error){alert("No se pudo borrar la nota: "+error.message);return;}
    setNotasBitacora(n=>({...n,[bitacoraId]:(n[bitacoraId]||[]).filter(x=>x.id!==notaId)}));
  };

  const marcarSelloDirector=async(id,valor)=>{
    const nuevoValor=detalle?.selloDirector===valor?null:valor; // tocar de nuevo el mismo = sacarlo
    setNovedades(n=>n.map(x=>x.id===id?{...x,selloDirector:nuevoValor}:x));
    if(usuarioReal&&typeof id==="string"){
      const{error}=await supabase.from("novedades").update({sello_director:nuevoValor}).eq("id",id);
      if(error){alert("No se pudo guardar el sello: "+error.message);setNovedades(n=>n.map(x=>x.id===id?{...x,selloDirector:detalle?.selloDirector||null}:x));}
    }
  };

  const agregarComentarioAudio=async(id,blob,duracionSeg)=>{
    if(guardando)return;
    setGuardando(true);
    const autorId=usuarioReal?.id||usuarioActivo.id;
    // ── SIN CONEXIÓN: guardar local (base64) y encolar para subir cuando vuelva la señal ──
    if(usuarioReal&&typeof id==="string"&&!estaOnline){
      const audioBase64=await blobABase64(blob);
      setNovedades(n=>n.map(x=>x.id===id?{...x,comentarios:[...x.comentarios,{texto:"",audioUrl:audioBase64,audioDuracion:duracionSeg,autorId,ts:Date.now(),pendienteSync:true}]}:x));
      setColaOffline(c=>[...c,{tipo:"comentario_audio",novedadId:id,audioBase64,duracionSeg,autorId}]);
      setGuardando(false);
      mostrarToast("📡 Audio guardado sin conexión — se sube solo cuando vuelva la señal");
      return;
    }
    try{
      const nombreArchivo=`${obraActual?.id||"local"}/${id}-${Date.now()}.webm`;
      const{error:errorSubida}=await supabase.storage.from("audios-comentarios").upload(nombreArchivo,blob,{contentType:blob.type||"audio/webm"});
      if(errorSubida)throw errorSubida;
      const{data:urlData}=supabase.storage.from("audios-comentarios").getPublicUrl(nombreArchivo);
      const audioUrl=urlData.publicUrl;
      if(usuarioReal&&typeof id==="string"){
        const{error}=await supabase.from("comentarios").insert({novedad_id:id,autor_id:usuarioReal.id,texto:"",audio_url:audioUrl,audio_duracion:duracionSeg});
        if(error)throw error;
      }
      setNovedades(n=>n.map(x=>x.id===id?{...x,comentarios:[...x.comentarios,{texto:"",audioUrl,audioDuracion:duracionSeg,autorId,ts:Date.now()}]}:x));
      mostrarToast("Nota de voz enviada");
    }catch(e){
      alert("No se pudo enviar la nota de voz: "+(e.message||"error desconocido"));
    }
    setGuardando(false);
  };

  const DURACION_MAX_AUDIO=15;
  const iniciarGrabacion=async(idNovedad)=>{
    if(grabandoAudio)return;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      grabacionCanceladaRef.current=false;
      audioChunksRef.current=[];
      const inicioRef={ts:Date.now()};
      const mimeType=MediaRecorder.isTypeSupported("audio/webm")?"audio/webm":(MediaRecorder.isTypeSupported("audio/mp4")?"audio/mp4":"");
      const mr=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
      mediaRecorderRef.current=mr;
      mr.ondataavailable=(e)=>{if(e.data.size>0)audioChunksRef.current.push(e.data);};
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        clearInterval(grabacionIntervalRef.current);
        const duracionFinal=Math.min(Math.round((Date.now()-inicioRef.ts)/1000),DURACION_MAX_AUDIO);
        setGrabandoAudio(false);
        setTiempoGrabacion(0);
        if(grabacionCanceladaRef.current||audioChunksRef.current.length===0)return;
        const blob=new Blob(audioChunksRef.current,{type:mimeType||"audio/webm"});
        await agregarComentarioAudio(idNovedad,blob,duracionFinal||1);
      };
      mr.start();
      setGrabandoAudio(true);
      setTiempoGrabacion(0);
      grabacionIntervalRef.current=setInterval(()=>{
        const transcurrido=Math.round((Date.now()-inicioRef.ts)/1000);
        setTiempoGrabacion(Math.min(transcurrido,DURACION_MAX_AUDIO));
        if(transcurrido>=DURACION_MAX_AUDIO)mr.stop();
      },1000);
    }catch(e){
      alert("No se pudo acceder al micrófono. Revisá los permisos de la app/navegador.");
    }
  };
  const detenerGrabacionYEnviar=()=>{
    if(mediaRecorderRef.current&&mediaRecorderRef.current.state!=="inactive")mediaRecorderRef.current.stop();
  };
  const cancelarGrabacion=()=>{
    grabacionCanceladaRef.current=true;
    if(mediaRecorderRef.current&&mediaRecorderRef.current.state!=="inactive")mediaRecorderRef.current.stop();
  };

  const eliminarObra=async(id)=>{if(usuarioReal&&typeof id==="string"){const{error:e1}=await supabase.from("novedades").delete().eq("obra_id",id);if(e1){alert("No se pudo eliminar: "+e1.message);return;}const{error:e2}=await supabase.from("obras").delete().eq("id",id);if(e2){alert("No se pudo eliminar la obra: "+e2.message);return;}}setObras(o=>o.filter(x=>x.id!==id));setNovedadesPorObra(p=>{const n={...p};delete n[id];return n;});setConfirmarEliminarObra(null);};
  const mostrarToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2200);};
  const [modalEditarObra, setModalEditarObra] = useState<any>(null);
  const [editarObraForm,  setEditarObraForm]  = useState({nombre:"",direccion:""});
  const guardarEdicionObra=async()=>{
    if(!editarObraForm.nombre.trim()||!modalEditarObra)return;
    const{error}=await supabase.from("obras").update({nombre:editarObraForm.nombre.trim(),direccion:editarObraForm.direccion.trim()}).eq("id",modalEditarObra);
    if(error){alert("No se pudo guardar: "+error.message);return;}
    setObras(o=>o.map(x=>x.id===modalEditarObra?{...x,nombre:editarObraForm.nombre.trim(),direccion:editarObraForm.direccion.trim()}:x));
    setObraActual(oa=>(oa&&oa.id===modalEditarObra)?{...oa,nombre:editarObraForm.nombre.trim(),direccion:editarObraForm.direccion.trim()}:oa);
    setModalEditarObra(null);
    mostrarToast("Obra actualizada");
  };
  const crearObra=async()=>{if(!nuevaObraForm.nombre.trim()||guardando)return;setGuardando(true);if(usuarioReal){const{data,error}=await supabase.from("obras").insert({nombre:nuevaObraForm.nombre,direccion:nuevaObraForm.direccion,propietario_id:usuarioReal.id}).select().single();if(error){alert("Error al crear la obra: "+error.message);setGuardando(false);return;}await supabase.from("equipo_obra").insert({obra_id:data.id,usuario_id:usuarioReal.id,rol_en_obra:"profesional"});const obraConEquipo={...data,equipo:[{uid:usuarioReal.id,rolEnObra:"profesional",nombre:usuarioActivoReal.nombre,especialidad:"Profesional",avatar:"📐"}]};setObras(o=>[...o,obraConEquipo]);setNovedadesPorObra(p=>({...p,[data.id]:[]}));}else{const nueva={id:Date.now(),nombre:nuevaObraForm.nombre,direccion:nuevaObraForm.direccion,equipo:[{uid:"u1",rolEnObra:"profesional"}]};setObras(o=>[...o,nueva]);setNovedadesPorObra(p=>({...p,[nueva.id]:[]}));}setNuevaObraForm({nombre:"",direccion:""});setModalNuevaObra(false);setGuardando(false);mostrarToast("Obra creada con éxito");};

  const abrirModalInvitar=(callback=null)=>{setInvitarRol("operario");setInvitarEsp(RESPONSABLES[0]);setInvitarEspOtro("");setInvitarNombre("");setInvitarTelefono("");setLinkGenerado("");setInvitarCallback(()=>callback);setModalInvitar(true);};
  const guardarNombreIntegrante=async(uid)=>{const nuevo=nombreEditado.trim();if(usuarioReal&&obraActual?.id&&typeof obraActual.id==="string"){const{error}=await supabase.from("equipo_obra").update({nombre:nuevo||null}).eq("obra_id",obraActual.id).eq("usuario_id",uid);if(error){alert("No se pudo guardar el nombre: "+error.message);return;}}setObras(os=>os.map(o=>o.id===obraActual.id?{...o,equipo:(o.equipo||[]).map(m=>m.uid===uid?{...m,nombre:nuevo||m.nombre}:m)}:o));setObraActual(oa=>oa?{...oa,equipo:(oa.equipo||[]).map(m=>m.uid===uid?{...m,nombre:nuevo||m.nombre}:m)}:oa);setEditandoNombreId(null);setNombreEditado("");mostrarToast("Nombre actualizado");};
  const eliminarMiembro=async(u)=>{
    if(usuarioReal&&obraActual?.id&&typeof obraActual.id==="string"){
      const{error:error1}=await supabase.from("novedades").update({responsable_usuario_id:null}).eq("obra_id",obraActual.id).eq("responsable_usuario_id",u.uid);
      if(error1){alert("No se pudo desasignar sus tareas: "+error1.message);return;}
      const{error:error2}=await supabase.from("equipo_obra").delete().eq("obra_id",obraActual.id).eq("usuario_id",u.uid);
      if(error2){alert("No se pudo eliminar del equipo: "+error2.message);return;}
    }
    setObras(os=>os.map(o=>o.id===obraActual.id?{...o,equipo:(o.equipo||[]).filter(m=>m.uid!==u.uid)}:o));
    setObraActual(oa=>oa?{...oa,equipo:(oa.equipo||[]).filter(m=>m.uid!==u.uid)}:oa);
    setNovedades(n=>n.map(x=>x.responsable_usuario_id===u.uid?{...x,responsable_usuario_id:null}:x));
    setConfirmarEliminarMiembro(null);
    mostrarToast("Integrante eliminado");
  };
  const generarInvitacion=async()=>{
    if(!usuarioReal||!obraActual?.id||generandoLink)return;
    setGenerandoLink(true);
    const codigo=Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6);
    // Token único: garantiza la conexión con la novedad que originó la invitación,
    // sin depender de que el nombre escrito coincida exactamente (memoria pendiente 04/08 — crítico).
    const tokenNov=invitarCallback?(`tk-${Date.now()}-${Math.random().toString(36).slice(2,10)}`):null;
    const esp=invitarRol==="operario"?(invitarEsp==="Otro"?(invitarEspOtro.trim()||"Otro"):invitarEsp):null;
    const nombreLimpio=invitarNombre.trim();
    if(nombreLimpio){
      // RESTRICCIÓN: si esta persona (por nombre) ya es miembro del equipo de esta obra,
      // no dejamos generar una segunda invitación con otro rol (evita que alguien quede
      // invitado como Operario Y Colega a la vez, con el segundo rol nunca activándose).
      const yaEsMiembro=(equipoObra||[]).find(m=>(m.nombre||"").trim().toLowerCase()===nombreLimpio.toLowerCase());
      if(yaEsMiembro){
        const rolTxt=yaEsMiembro.rolEnObra==="capataz"?"Capataz":yaEsMiembro.rolEnObra==="co_profesional"?"Colega":yaEsMiembro.rolEnObra==="profesional"?"Profesional":"Operario";
        alert(`${yaEsMiembro.nombre} ya es parte del equipo de esta obra (como ${rolTxt}). Si querés cambiarle el rol, primero sacalo del equipo desde "Equipo" y volvé a invitarlo.`);
        setGenerandoLink(false);
        return;
      }
      // Si ya había una invitación sin usar para esta MISMA persona en esta obra, la borramos
      // (evita que quede "fantasma" pendiente para siempre si se regenera el link).
      await supabase.from("invitaciones").delete().eq("obra_id",obraActual.id).eq("usada",false).ilike("nombre",nombreLimpio);
    }
    const{error}=await supabase.from("invitaciones").insert({codigo,obra_id:obraActual.id,rol:invitarRol,especialidad:esp,invitado_por:usuarioReal.id,nombre:nombreLimpio||null,telefono:invitarTelefono.trim()||null,token_novedad:tokenNov});
    if(error){alert("Error al generar la invitación: "+error.message);setGenerandoLink(false);return;}
    setLinkGenerado(`https://www.fixgo.ar/?invitacion=${codigo}`);
    setGenerandoLink(false);
    setInvitacionesPendientes(p=>[{codigo,rol:invitarRol,especialidad:esp,nombre:nombreLimpio||null,telefono:invitarTelefono.trim()||null,created_at:new Date().toISOString()},...(nombreLimpio?p.filter(i=>(i.nombre||"").toLowerCase()!==nombreLimpio.toLowerCase()):p)]);
    if(invitarCallback){
      const etiqueta=invitarNombre.trim()||esp||(invitarRol==="capataz"?"Capataz":invitarRol==="co_profesional"?"Colega":"Nuevo integrante");
      invitarCallback({responsable:etiqueta,usuarioId:null,token:tokenNov});
    }
  };
  const compartirLinkWhatsapp=()=>{const rolTxt=invitarRol==="capataz"?"Capataz":invitarRol==="co_profesional"?"Colega":(invitarEsp==="Otro"?(invitarEspOtro.trim()||"Otro"):invitarEsp);const msg=`Hola! Te mando esto desde Fixgo 👷\n\nTe estoy sumando a la obra "${obraActual?.nombre}" como ${rolTxt}.\n\nFixgo es la app donde vamos a coordinar el trabajo. Vas a ver las novedades que te asigno y vas a poder avisarme cuando las terminás.\n\nPara entrar, tocá acá 👇\n${linkGenerado}`;window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");};
  const guardarNombreEstudio=async()=>{
    if(!usuarioReal)return;
    const nombreFinal=nombreEstudioInput.trim();
    const{error}=await supabase.from("usuarios").update({nombre_estudio:nombreFinal||null}).eq("id",usuarioReal.id);
    if(error){alert("No se pudo guardar: "+error.message);return;}
    setNombreEstudio(nombreFinal);
    if(empresaPropia&&nombreFinal){
      const{error:errorEmpresa}=await supabase.from("empresas").update({nombre:nombreFinal}).eq("id",empresaPropia.id);
      if(errorEmpresa){
        console.error("No se pudo sincronizar el nombre en Modo Director:",errorEmpresa.message);
      }else{
        setEmpresaPropia(e=>e?({...e,nombre:nombreFinal}):e);
      }
    }
    mostrarToast("Nombre guardado");
  };
  const comprimirLogo=(file)=>new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=400;
        let{width,height}=img;
        if(width>height&&width>MAX){height=Math.round(height*MAX/width);width=MAX;}
        else if(height>MAX){width=Math.round(width*MAX/height);height=MAX;}
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,width,height);
        canvas.toBlob(blob=>resolve(blob||file),"image/webp",0.85);
      };
      img.onerror=()=>resolve(file);
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  const subirLogoEstudio=async(file)=>{
    if(!usuarioReal||!file)return;
    const LIMITE_BYTES=2*1024*1024; // 2MB
    if(file.size>LIMITE_BYTES){alert("La imagen pesa demasiado (máximo 2MB). Elegí una más liviana.");return;}
    setSubiendoLogo(true);
    try{
      const comprimido=await comprimirLogo(file);
      const esWebp=comprimido.type==="image/webp";
      const nombreArchivo=`${usuarioReal.id}-${Date.now()}.${esWebp?"webp":(file.name.split(".").pop()||"png")}`;
      const{error:errorSubida}=await supabase.storage.from("logos-estudio").upload(nombreArchivo,comprimido,{contentType:comprimido.type||file.type});
      if(errorSubida)throw errorSubida;
      const{data:urlData}=supabase.storage.from("logos-estudio").getPublicUrl(nombreArchivo);
      const url=urlData.publicUrl;
      const{error:errorUpdate}=await supabase.from("usuarios").update({logo_estudio_url:url}).eq("id",usuarioReal.id);
      if(errorUpdate)throw errorUpdate;
      setLogoEstudioUrl(url);
      mostrarToast("Logo actualizado");
    }catch(e:any){alert("No se pudo subir el logo: "+(e.message||"error desconocido"));}
    setSubiendoLogo(false);
  };
  const crearEmpresa=async()=>{
    if(!usuarioReal||!nombreEmpresaInput.trim())return;
    if(empresaPropia){
      const{error}=await supabase.from("empresas").update({nombre:nombreEmpresaInput.trim()}).eq("id",empresaPropia.id);
      if(error){alert("No se pudo renombrar: "+error.message);return;}
      setEmpresaPropia(e=>({...e,nombre:nombreEmpresaInput.trim()}));
      setModalCrearEmpresa(false);
      setNombreEmpresaInput("");
      mostrarToast("Nombre actualizado");
      return;
    }
    const{data,error}=await supabase.from("empresas").insert({nombre:nombreEmpresaInput.trim(),director_id:usuarioReal.id}).select().single();
    if(error){alert("No se pudo crear la empresa: "+error.message);return;}
    setEmpresaPropia(data);
    setModalCrearEmpresa(false);
    setNombreEmpresaInput("");
    mostrarToast("Empresa creada");
  };
  const generarInvitacionEmpresa=async()=>{
    if(!usuarioReal||!empresaPropia?.id||generandoLinkEmpresa)return;
    setGenerandoLinkEmpresa(true);
    await supabase.from("invitaciones_empresa").delete().eq("empresa_id",empresaPropia.id).eq("usada",false);
    const codigo=Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6);
    const{error}=await supabase.from("invitaciones_empresa").insert({codigo,empresa_id:empresaPropia.id});
    if(error){alert("Error al generar la invitación: "+error.message);setGenerandoLinkEmpresa(false);return;}
    setLinkEmpresaGenerado(`https://www.fixgo.ar/?empresa=${codigo}`);
    setGenerandoLinkEmpresa(false);
    setInvitacionesEmpresaPendientes(()=>[{codigo,created_at:new Date().toISOString()}]);
  };
  const cancelarInvitacionEmpresa=async(codigo)=>{
    const{error}=await supabase.from("invitaciones_empresa").delete().eq("codigo",codigo);
    if(error){alert("No se pudo cancelar: "+error.message);return;}
    setInvitacionesEmpresaPendientes(p=>p.filter(i=>i.codigo!==codigo));
    mostrarToast("Invitación cancelada");
  };
  const copiarLink=()=>{navigator.clipboard?.writeText(linkGenerado);mostrarToast("Link copiado");};
  const generarResumenGremio=(gremio:string)=>{const novs=novedades.filter(n=>!n.resuelta&&n.responsable===gremio);const urgentes=novs.filter(n=>n.prioridad===0);const otras=novs.filter(n=>n.prioridad!==0);let msg=`Hola! Te mando el estado de tus novedades en "${obraActual?.nombre}":\n\n`;if(urgentes.length>0){msg+=`🔴 URGENTES (${urgentes.length}):\n`;urgentes.forEach(n=>{msg+=`• ${n.descripcion}${n.sector?` (${n.sector})`:""}${n.fechaLimite?` — límite ${formatFecha(n.fechaLimite)}`:""}\n`;});msg+="\n";}if(otras.length>0){msg+=`🟡 PENDIENTES (${otras.length}):\n`;otras.forEach(n=>{msg+=`• ${n.descripcion}${n.sector?` (${n.sector})`:""}\n`;});}msg+=`\nTotal pendiente: ${novs.length} novedad${novs.length!==1?"es":""}`;return msg;};
  const abrirEdicion=(nov)=>{setFormEdit({fotos:nov.fotos,descripcion:nov.descripcion,responsable:nov.responsable,responsableCustom:"",responsableUsuarioId:nov.responsable_usuario_id||null,sector:nov.sector,sectorCustom:"",prioridad:nov.prioridad,fechaLimite:nov.fechaLimite,ocultoCapataz:nov.ocultoCapataz||false});setEditando(true);};
  const asignarRapido=async(id,{responsable,usuarioId})=>{if(usuarioReal&&typeof id==="string"){const{error}=await supabase.from("novedades").update({responsable,responsable_usuario_id:usuarioId||null}).eq("id",id);if(error){alert("No se pudo asignar: "+error.message);return;}}setNovedades(n=>n.map(x=>x.id===id?{...x,responsable,responsable_usuario_id:usuarioId||null}:x));setAsignacionRapida(null);};
  const guardarEdicion=async(id)=>{if(!formEdit.descripcion.trim())return;if(guardando)return;setGuardando(true);try{const resp=formEdit.responsable==="Otro"&&formEdit.responsableCustom.trim()?formEdit.responsableCustom.trim():formEdit.responsable;const sect=formEdit.sector==="Otro"&&formEdit.sectorCustom.trim()?formEdit.sectorCustom.trim():formEdit.sector;if(usuarioReal&&typeof id==="string"){const{error}=await supabase.from("novedades").update({descripcion:formEdit.descripcion,responsable:resp,sector:sect,prioridad:formEdit.prioridad,fecha_limite:formEdit.fechaLimite||null,fotos:formEdit.fotos,oculto_capataz:formEdit.ocultoCapataz,responsable_usuario_id:formEdit.responsableUsuarioId||null}).eq("id",id);if(error){alert("No se pudo guardar la edición: "+error.message);return;}}setNovedades(n=>n.map(x=>x.id===id?{...x,fotos:formEdit.fotos,descripcion:formEdit.descripcion,responsable:resp,responsable_usuario_id:formEdit.responsableUsuarioId||null,sector:sect,prioridad:formEdit.prioridad,fechaLimite:formEdit.fechaLimite,ocultoCapataz:formEdit.ocultoCapataz}:x));setEditando(false);setFormEdit(null);}finally{setGuardando(false);}};
  const compartir=(nov)=>{const t=generarResumen(nov,obraActual?.nombre||"Obra");if(navigator.share)navigator.share({title:"Novedad",text:t}).catch(()=>{});else{navigator.clipboard?.writeText(t);setCompartidoId(nov.id);setTimeout(()=>setCompartidoId(null),2000);}};

  const statsResponsable=RESPONSABLES.map(r=>({nombre:r,pendientes:novedades.filter(n=>n.responsable===r&&!n.resuelta).length,resueltas:novedades.filter(n=>n.responsable===r&&n.resuelta).length,urgentes:novedades.filter(n=>n.responsable===r&&!n.resuelta&&n.prioridad===0).length})).filter(r=>r.pendientes+r.resueltas>0);

  const novedadesFiltradas=useMemo(()=>{
    const esObraPropia=obras.some(o=>o.id===obraActual?.id);
    const listaBase=esObraPropia?novedades:(novedadesPorObra[obraActual?.id]||[]);
    return listaBase.filter(n=>{
    const matchRol=true;
    const matchResp=filtroResp==="todos"||n.responsable===filtroResp;
    const matchSector=filtroSector==="todos"||n.sector===filtroSector;
    const matchFiltro=filtro==="pendientes"?!n.resuelta:filtro==="resueltas"?n.resuelta:filtro==="vencidas"?!n.resuelta&&diasRestantes(n.fechaLimite)<0:filtro==="sinResponsable"?!n.resuelta&&!n.responsable_usuario_id:true;
    const matchBusqueda=busqueda.trim()===""||n.descripcion.toLowerCase().includes(busqueda.toLowerCase())||n.responsable.toLowerCase().includes(busqueda.toLowerCase())||n.sector.toLowerCase().includes(busqueda.toLowerCase());
    return matchRol&&matchResp&&matchSector&&matchFiltro&&matchBusqueda;
  }).sort((a,b)=>{
    if(a.resuelta!==b.resuelta)return a.resuelta?1:-1;
    let resultado;
    if(orden==="fecha"){
      const ca=a.created_at?new Date(a.created_at).getTime():(a.fecha?new Date(a.fecha).getTime():0);
      const cb=b.created_at?new Date(b.created_at).getTime():(b.fecha?new Date(b.fecha).getTime():0);
      resultado=ca-cb;
    }else if(orden==="vencimiento"){
      const da=diasRestantes(a.fechaLimite),db=diasRestantes(b.fechaLimite);
      if(da===null&&db===null)resultado=0;
      else if(da===null)resultado=1;
      else if(db===null)resultado=-1;
      else resultado=da-db;
    }else{
      // orden==="urgencia" (default)
      const da=diasRestantes(a.fechaLimite),db=diasRestantes(b.fechaLimite);
      resultado=(da!==null&&db!==null)?da-db:a.prioridad-b.prioridad;
    }
    return ordenDesc?-resultado:resultado;
  });
  },[novedades,novedadesPorObra,obraActual?.id,obras,filtro,filtroResp,filtroSector,busqueda,orden,ordenDesc]);

  const respConTareas=[...new Set(novedades.map(n=>n.responsable))].map(r=>({nombre:r,cant:novedades.filter(n=>n.responsable===r).length})).sort((a,b)=>b.cant-a.cant);

  const contadores=useMemo(()=>{
    const esObraPropia=obras.some(o=>o.id===obraActual?.id);
    const base=esObraPropia?novedades:(novedadesPorObra[obraActual?.id]||[]);
    return{todas:base.length,pendientes:base.filter(n=>!n.resuelta).length,resueltas:base.filter(n=>n.resuelta).length,vencidas:base.filter(n=>!n.resuelta&&diasRestantes(n.fechaLimite)<0).length};
  },[novedades,novedadesPorObra,obraActual?.id,obras]);
  const detalle=novedades.find(n=>n.id===detalleId)||(novedadesPorObra[obraActual?.id]||[]).find(n=>n.id===detalleId);

  // helpers de navegación
  const irInicio=()=>{setVistaRaiz("inicio");setObraActual(null);setVistaPerfil(false);setVistaInfoApp(false);setOrigenDirectorCategoria(null);setFiltroObraAlertas(null);};
  const TABS_INICIO=["mias","tareas","director"];
  const cambiarVistaHome=(nueva)=>{
    if(nueva==="director"&&!esVersionPro){setModalProObra(true);return;}
    const idxViejo=TABS_INICIO.indexOf(vistaHome);
    const idxNuevo=TABS_INICIO.indexOf(nueva);
    if(idxViejo!==-1&&idxNuevo!==-1)setDireccionTab(idxNuevo>idxViejo?1:-1);
    setVistaHome(nueva);
  };
  const onSwipeInicioStart=(e)=>{const t=e.touches[0];swipeInicioRef.current={x:t.clientX,y:t.clientY};};
  const onSwipeInicioEnd=(e)=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-swipeInicioRef.current.x;
    const dy=t.clientY-swipeInicioRef.current.y;
    if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.4)return;
    const idxActual=TABS_INICIO.indexOf(vistaHome);
    if(idxActual===-1)return;
    const siguiente=dx<0?idxActual+1:idxActual-1;
    if(siguiente>=0&&siguiente<TABS_INICIO.length)cambiarVistaHome(TABS_INICIO[siguiente]);
  };
  const irObra=(obra)=>{setObraActual(obra);setVistaRaiz("obra");setVista("lista");setBusqueda("");setFiltro("todas");setFiltroResp("todos");setFiltroSector("todos");setOrden("urgencia");setOrdenDesc(false);setVistaStats(false);setVistaEquipo(false);setMiembroSel(null);setModalEditarObra(null);setMenuObra(null);setModalCompartirObra(null);
    // Cargar novedades de esta obra si no están cargadas aún
    if(usuarioReal&&typeof obra.id==="string"&&(!novedadesPorObra[obra.id]||novedadesPorObra[obra.id].length===0)){
      supabase.from("novedades").select("*,comentarios(*)").eq("obra_id",obra.id).then(({data:novs})=>{
        if(novs){setNovedadesPorObra(p=>({...p,[obra.id]:novs.map(n=>({...n,fotos:n.fotos||[],ocultoCapataz:n.oculto_capataz||false,selloDirector:n.sello_director||null,estadoAprobacion:n.estado_aprobacion||null,autorId:n.autor_id||null,fechaLimite:n.fecha_limite||"",fecha:n.created_at?n.created_at.slice(0,10):"",comentarios:(n.comentarios||[]).map(c=>({texto:c.texto,audioUrl:c.audio_url||null,audioDuracion:c.audio_duracion||null,autorId:c.autor_id,ts:new Date(c.created_at).getTime()}))}))}))}
      });
    }
  };

  const modalFotoResolucionJSX = modalFotoResolucion&&<div style={s.overlay} onClick={()=>{if(!subiendoFotoResolucion)setModalFotoResolucion(null);}}><div style={s.modal} onClick={e=>e.stopPropagation()}>
    <p style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>¿Cómo quedó resuelto?</p>
    <p style={{margin:"0 0 18px",fontSize:13,color:"#55555A"}}>Sacale una foto del resultado (opcional). Ayuda a mostrar el avance real.</p>
    <input ref={fileRefResolucion} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f){if(esVersionPro){const url=URL.createObjectURL(f);setEditorDibujo({src:url,origen:"resolucion",idx:null});}else{confirmarResolucionConFoto(modalFotoResolucion,f);}}}}/>
    <button disabled={subiendoFotoResolucion} onClick={()=>fileRefResolucion.current.click()} style={{...s.btnPrincipal,background:"#34C759",marginBottom:10,opacity:subiendoFotoResolucion?0.6:1}}>
      <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{subiendoFotoResolucion?<><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Subiendo foto...</>:<><Camera size={16}/>Sacar foto y confirmar</>}</span>
    </button>
    <button disabled={subiendoFotoResolucion} onClick={()=>confirmarSinFoto(modalFotoResolucion)} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10,opacity:subiendoFotoResolucion?0.6:1}}>Confirmar sin foto</button>
    <button disabled={subiendoFotoResolucion} onClick={()=>setModalFotoResolucion(null)} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A",opacity:subiendoFotoResolucion?0.6:1}}>Cancelar</button>
  </div></div>;

  const offlineBannerJSX = (!estaOnline||colaOffline.length>0)&&(
    <div style={{background:!estaOnline?"#FF3B30":"#FFB800",color:"#fff",padding:"8px 16px",fontSize:12.5,fontWeight:700,textAlign:"center",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      {!estaOnline?<>📡 Sin conexión — viendo datos guardados{colaOffline.length>0?` (${colaOffline.length} pendiente${colaOffline.length!==1?"s":""} de subir)`:""}</>
      :<>{sincronizando?<span style={{width:12,height:12,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>:"⏳"} {sincronizando?"Sincronizando...":`${colaOffline.length} novedad${colaOffline.length!==1?"es":""} pendiente${colaOffline.length!==1?"s":""} de subir`}</>}
    </div>
  );

  const modalPeriodoJSX = modalPeriodoReporte&&<div style={s.overlay} onClick={()=>{if(!generandoReporte)setModalPeriodoReporte(false);}}><div style={s.modal} onClick={e=>e.stopPropagation()}>
    {generandoReporte?(
      <div style={{textAlign:"center",padding:"30px 10px"}}>
        <span style={{width:34,height:34,border:"3px solid #E5E5EA",borderTopColor:"#0057FF",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite",marginBottom:16}}/>
        <p style={{margin:0,fontSize:15,fontWeight:700,color:"#1C1C1E"}}>Generando informe...</p>
        <p style={{margin:"4px 0 0",fontSize:13,color:"#55555A"}}>Puede tardar algunos segundos</p>
      </div>
    ):(<>
      <p style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>Generar informe</p>
      <p style={{margin:"0 0 18px",fontSize:13,color:"#55555A"}}>Elegí el período que querés analizar de "{obraActual?.nombre}"</p>
      {[["dia","Hoy"],["semana","Últimos 7 días"],["mes","Últimos 30 días"],["inicio","Desde el inicio de la obra"]].map(([key,lbl])=>(
        <button key={key} onClick={()=>elegirPeriodo(key)} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:8}}>{lbl}</button>
      ))}
      <p style={{margin:"14px 0 8px",fontSize:12,fontWeight:700,color:"#55555A",textTransform:"uppercase"}}>Rango personalizado</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input type="date" value={rangoPersonalizado.desde} onChange={e=>setRangoPersonalizado(r=>({...r,desde:e.target.value}))} style={{...s.input,flex:1,fontSize:13,padding:"10px"}}/>
        <input type="date" value={rangoPersonalizado.hasta} onChange={e=>setRangoPersonalizado(r=>({...r,hasta:e.target.value}))} style={{...s.input,flex:1,fontSize:13,padding:"10px"}}/>
      </div>
      <button onClick={()=>elegirPeriodo("personalizado")} style={{...s.btnPrincipal,background:"#2E3A4B",marginBottom:8}}>Generar con este rango</button>
      <button onClick={()=>{setModalPeriodoReporte(false);setModoInformeFoto(false);}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}}>Cancelar</button>
    </>)}
  </div></div>;

  const modalEditarObraJSX = modalEditarObra&&<div style={s.overlay} onClick={()=>setModalEditarObra(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}>
    <p style={{margin:"0 0 16px",fontSize:18,fontWeight:700}}>Editar datos de la obra</p>
    <input style={{...s.input,marginBottom:10}} placeholder="Nombre de la obra *" value={editarObraForm.nombre} onChange={e=>setEditarObraForm(f=>({...f,nombre:e.target.value}))}/>
    <input style={{...s.input,marginBottom:20}} placeholder="Dirección (opcional)" value={editarObraForm.direccion} onChange={e=>setEditarObraForm(f=>({...f,direccion:e.target.value}))}/>
    <div style={{display:"flex",gap:10}}>
      <button style={{...s.btnPrincipal,background:"#E5E5EA",color:"#1C1C1E",flex:1}} onClick={()=>setModalEditarObra(null)}>Cancelar</button>
      <button style={{...s.btnPrincipal,flex:1,opacity:editarObraForm.nombre.trim()?1:0.4}} disabled={!editarObraForm.nombre.trim()} onClick={guardarEdicionObra}>Guardar</button>
    </div>
  </div></div>;

  const asignacionRapidaJSX = asignacionRapida&&(()=>{const nov=novedades.find(n=>n.id===asignacionRapida);if(!nov)return null;return(
    <div style={s.overlay} onClick={()=>setAsignacionRapida(null)}><div style={{...s.modal,maxHeight:"75vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
      <p style={{margin:"0 0 4px",fontSize:17,fontWeight:700}}>¿Quién lo resuelve?</p>
      <p style={{margin:"0 0 14px",fontSize:13,color:"#55555A"}}>{nov.descripcion}</p>
      <div style={{overflowY:"auto"}}>
        <TiraResponsables value={nov.responsable} usuarioId={nov.responsable_usuario_id} equipo={equipoObra} onChange={({responsable,usuarioId})=>asignarRapido(nov.id,{responsable,usuarioId})} onInvitarNuevo={()=>{setAsignacionRapida(null);abrirModalInvitar(async({responsable,usuarioId,token})=>{await asignarRapido(nov.id,{responsable,usuarioId});if(token)await supabase.from("novedades").update({token_asignacion_pendiente:token}).eq("id",nov.id);});}} />
      </div>
      <button type="button" onClick={()=>setAsignacionRapida(null)} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A",marginTop:16}}>Cancelar</button>
    </div></div>
  );})();

  const avisoObraEliminadaJSX = avisoObraEliminada&&<div style={s.overlay} onClick={()=>setAvisoObraEliminada(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}>
    <div style={{textAlign:"center",marginBottom:20}}>
      <span style={{fontSize:44}}>👋</span>
      <p style={{margin:"12px 0 8px",fontSize:18,fontWeight:800}}>Ya no formás parte de "{avisoObraEliminada}"</p>
      <p style={{margin:0,fontSize:14,color:"#55555A"}}>El administrador eliminó esa obra o te quitó del equipo.</p>
    </div>
    <button style={s.btnPrincipal} onClick={()=>setAvisoObraEliminada(null)}>Entendido</button>
  </div></div>;

  const modalInvitarJSX = modalInvitar&&<div style={s.overlay} onClick={()=>{setModalInvitar(false);setLinkGenerado("");setInvitarNombre("");setInvitarRol("operario");setInvitarEsp(RESPONSABLES[0]);setInvitarEspOtro("");setInvitarCallback(null);}}><div style={s.modal} onClick={e=>e.stopPropagation()}>
    <p style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>Invitar integrante</p>
    <p style={{margin:"0 0 16px",fontSize:13,color:"#55555A"}}>Generá un link para sumar a alguien a "{obraActual?.nombre}"</p>
    {!linkGenerado?<>
      <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:"#55555A"}}>Rol</p>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["operario","👷 Operario"],["capataz","🦺 Capataz"]].map(([val,lbl])=>(
          <button key={val} style={{flex:1,padding:"12px",borderRadius:12,border:`2px solid ${invitarRol===val?"#0057FF":"#E5E5EA"}`,background:invitarRol===val?"#0057FF15":"#fff",color:invitarRol===val?"#0057FF":"#636366",fontSize:14,fontWeight:invitarRol===val?700:400,cursor:"pointer"}} onClick={()=>setInvitarRol(val)}>{lbl}</button>
        ))}
        <button onClick={()=>{if(esVersionPro)setInvitarRol("co_profesional");else setModalPro(true);}} style={{flex:1,padding:"12px",borderRadius:12,border:`2px solid ${invitarRol==="co_profesional"?"#0057FF":"#E5E5EA"}`,background:invitarRol==="co_profesional"?"#0057FF15":"#fff",color:invitarRol==="co_profesional"?"#0057FF":"#636366",fontSize:14,fontWeight:invitarRol==="co_profesional"?700:400,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,opacity:esVersionPro?1:0.7}}>
          <span>🤝 Colega</span>
          {!esVersionPro&&<span style={{fontSize:9,fontWeight:800,color:"#FFB800"}}>🔒 PRO</span>}
        </button>
      </div>
      {invitarRol==="operario"&&<><p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:"#55555A"}}>Especialidad (gremio)</p>
      <div style={{marginBottom:16}}>
        <SelectorOficio value={invitarEsp} onChange={r=>setInvitarEsp(r)} customValue={invitarEspOtro} onCustomChange={setInvitarEspOtro} color="#0057FF" />
      </div></>}
      <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:"#55555A"}}>Nombre o empresa <span style={{fontWeight:400}}>(opcional)</span></p>
      <input style={{...s.input,marginBottom:12}} placeholder="Ej: Jorge, Cuadrilla 2..." value={invitarNombre} onChange={e=>setInvitarNombre(e.target.value)} maxLength={40}/>
      <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:"#55555A"}}>Teléfono <span style={{fontWeight:400}}>(opcional)</span></p>
      {typeof navigator!=="undefined"&&(navigator as any).contacts&&<button type="button" onClick={async()=>{try{const c=await(navigator as any).contacts.select(["name","tel"],{multiple:false});if(c&&c[0]){if(c[0].tel?.[0])setInvitarTelefono(c[0].tel[0].replace(/\s/g,""));if(c[0].name?.[0]&&!invitarNombre.trim())setInvitarNombre(c[0].name[0]);}}catch(e){}}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10,padding:"11px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>📱</span>Elegir de mis contactos</button>}
      <input style={{...s.input,marginBottom:4}} type="tel" placeholder="+54 9 351 555 0000" value={invitarTelefono} onChange={e=>setInvitarTelefono(e.target.value)}/>
      <p style={{margin:"0 0 16px",fontSize:11,color:"#C7C7CC"}}>Para contactarlo rápido desde Estadísticas</p>
      <button style={{...s.btnPrincipal,background:"#1C1C1E",opacity:generandoLink?0.5:1}} disabled={generandoLink} onClick={generarInvitacion}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{generandoLink?<><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Generando...</>:"Generar link de invitación"}</span></button>
    </>:<>
      <div style={{background:"#34C75915",borderRadius:14,padding:"14px",marginBottom:16,textAlign:"center"}}>
        <p style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"#34C759"}}>✅ Link generado</p>
        <p style={{margin:0,fontSize:12,color:"#636366",wordBreak:"break-all"}}>{linkGenerado}</p>
      </div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(linkGenerado)}`} alt="QR de invitación" style={{width:180,height:180,borderRadius:12,border:"1px solid #E5E5EA"}}/>
      </div>
      <p style={{margin:"0 0 12px",textAlign:"center",fontSize:12,color:"#55555A"}}>El invitado puede escanear este QR con la cámara del teléfono</p>
      <button style={{...s.btnPrincipal,background:"#25D366",marginBottom:10}} onClick={compartirLinkWhatsapp}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Compartir por WhatsApp</span></button>
      <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10}} onClick={()=>{const rolTxt=invitarRol==="capataz"?"Capataz":invitarRol==="co_profesional"?"Colega":(invitarEsp==="Otro"?(invitarEspOtro.trim()||"Otro"):invitarEsp);const msg=`Hola! Te mando esto desde Fixgo 👷\n\nTe estoy sumando a la obra "${obraActual?.nombre}" como ${rolTxt}.\n\nFixgo es la app donde vamos a coordinar el trabajo. Vas a ver las novedades que te asigno y vas a poder avisarme cuando las terminás.\n\nPara entrar, tocá acá 👇\n${linkGenerado}`;if(navigator.share){navigator.share({title:"Invitación a Fixgo",text:msg}).catch(()=>{});}else{navigator.clipboard?.writeText(linkGenerado);mostrarToast("Link copiado");};}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Share2 size={16}/>Compartir por otro medio</span></button>
      <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>{setModalInvitar(false);setLinkGenerado("");setInvitarNombre("");setInvitarRol("operario");setInvitarEsp(RESPONSABLES[0]);setInvitarEspOtro("");setInvitarCallback(null);}}>Cerrar</button>
    </>}
  </div></div>;

  // ─────────────────────────────
  // INFO APP

  if(vistaReporte&&reporteData){
    const rd=reporteData;
    const PORTADA_DEFAULT_URL="/informe-portada-default.jpg"; // Javier: subir esta imagen a la carpeta public/ del repo con este nombre exacto
    const fmtFecha=(d)=>d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"});
    const fmtFechaCorta=(d)=>d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
    const paletaPersona=["#3DAE8C","#E8A23D","#5CA9E0","#8B7FD1","#D17FA0","#9AAE8E"];
    const TEAL="#3DAE8C",MINT="#EAF6F1",INK="#1A2B2A",GRAY="#6B7573",RED="#D64545",ORANGE="#E8A23D";
    const totalDonut=Math.max(1,rd.resueltas+Math.max(0,rd.pendientes-rd.vencidas)+rd.vencidas);
    const pctResueltas=Math.round((rd.resueltas/totalDonut)*100);
    const pctPendientes=Math.round((Math.max(0,rd.pendientes-rd.vencidas)/totalDonut)*100);
    const pctVencidas=100-pctResueltas-pctPendientes;
    const estadoBadge=(n)=>n.resuelta?{txt:"Resuelta",bg:"#E4F5EC",color:"#1a8a3d"}:(n.fechaLimite&&diasRestantes(n.fechaLimite)<0)?{txt:"Vencida",bg:"#FBE7E6",color:"#D0342C"}:{txt:"Pendiente",bg:"#FDF1DE",color:"#9a6b00"};
    const prioTxt=(p)=>p===0?{txt:"Alta",color:RED}:p===1?{txt:"Media",color:ORANGE}:{txt:"Baja",color:"#8FBFA8"};
    const nombreResp=(n)=>n.responsable_usuario_id?(equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.nombre||n.responsable):n.responsable;

    const styleHoja:any={width:"210mm",height:"297mm",background:"#fff",margin:"20px auto",boxShadow:"0 4px 30px rgba(0,0,0,0.18)",position:"relative",padding:"14mm 14mm 10mm",pageBreakAfter:"always",breakAfter:"page"};
    const HeaderPagina=()=>(
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          {logoEstudioUrl?<ImgCacheada src={logoEstudioUrl} style={{width:24,height:24,objectFit:"contain"}}/>:<div style={{width:24,height:24,borderRadius:6,background:"#2E3A4B"}}/>}
          <span style={{fontSize:16,fontWeight:800,letterSpacing:-0.2}}>{nombreEstudio||"FIXGO"}</span>
        </div>
        <div style={{fontSize:10,fontWeight:700,textAlign:"right",lineHeight:1.5,borderRight:`2px solid ${TEAL}`,paddingRight:12}}>
          INFORME EJECUTIVO DE NOVEDADES<br/>
          <span style={{color:GRAY,fontWeight:600}}>{obraActual?.nombre?.toUpperCase()}{obraActual?.direccion?` · ${obraActual.direccion.toUpperCase()}`:""}</span>
        </div>
      </div>
    );
    const FooterPagina=({pagina}:{pagina:number})=>(
      <div style={{position:"absolute",bottom:"8mm",left:"14mm",right:"14mm",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:9.5,color:GRAY}}>
        <span>Informe generado por <b style={{color:INK}}>Fixgo</b></span>
        {logoEstudioUrl?<ImgCacheada src={logoEstudioUrl} style={{width:14,height:14,objectFit:"contain",opacity:0.35}}/>:<span/>}
        <span>{pagina} / 4</span>
      </div>
    );

    return(
      <div className="fondo-informe-pantalla" style={{background:"#8A8D93",height:"100dvh",overflowY:"auto",padding:"20px 0"}}>
        <style>{`
          .hoja-informe, .hoja-informe *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
          @media print{
          html,body,#root{height:auto!important;overflow:visible!important;}
          @page{size:A4 portrait;margin:0;}
          .fondo-informe-pantalla{background:none!important;padding:0!important;height:auto!important;overflow:visible!important;}
          .hoja-informe{box-shadow:none!important;margin:0!important;}
          .no-print{display:none!important;}
        }`}</style>
        <div className="no-print" style={{maxWidth:"210mm",margin:"0 auto 14px",display:"flex",gap:10,padding:"0 20px"}}>
          <button onClick={()=>{setVistaReporte(false);setReporteData(null);}} style={{background:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><ChevronLeft size={16}/>Volver</button>
          <button onClick={()=>window.print()} style={{background:"#1C1C1E",color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:700,cursor:"pointer"}}>Guardar / Imprimir PDF</button>
        </div>

        {/* ══════════ PÁGINA 1 — PORTADA ══════════ */}
        <div className="hoja-informe" style={{...styleHoja,padding:0}}>
          <div style={{position:"absolute",inset:0,overflow:"hidden"}}><ImgCacheada src={PORTADA_DEFAULT_URL} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 25%"}}/></div>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(100deg,#0A1418 0%,#0E1B22 38%,rgba(14,27,34,0) 62%)"}}/>
          <div style={{position:"relative",height:"100%",display:"flex",flexDirection:"column",padding:"14mm 14mm 10mm"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {logoEstudioUrl?<ImgCacheada src={logoEstudioUrl} style={{width:36,height:36,borderRadius:9,objectFit:"contain"}}/>:<div style={{width:36,height:36,borderRadius:9,background:"#fff"}}/>}
                <span style={{color:"#fff",fontSize:19,fontWeight:800,letterSpacing:-0.3}}>{(nombreEstudio||"FIXGO").toUpperCase()}</span>
              </div>
              <div style={{color:"#fff",fontSize:11,fontWeight:700,textAlign:"right",lineHeight:1.4,opacity:0.85,borderRight:`2px solid ${TEAL}`,paddingRight:12}}>
                INFORME EJECUTIVO<br/>DE NOVEDADES
              </div>
            </div>

            <div style={{marginTop:56,maxWidth:400}}>
              <h1 style={{color:"#fff",fontSize:42,lineHeight:1.03,margin:0,fontWeight:800,letterSpacing:-1}}>Informe<br/>Ejecutivo</h1>
              <p style={{color:TEAL,fontSize:15,fontWeight:700,margin:"9px 0 0",letterSpacing:0.3}}>DE NOVEDADES</p>
              <div style={{width:56,height:2,background:"rgba(255,255,255,0.3)",margin:"18px 0"}}/>
              <p style={{color:"#fff",fontSize:23,fontWeight:800,margin:0}}>{obraActual?.nombre}</p>
              <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,margin:"4px 0 0"}}>{obraActual?.direccion}</p>
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:22}}>
                <div style={{width:25,height:25,border:"1.5px solid rgba(255,255,255,0.35)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,flexShrink:0}}><Calendar size={13}/></div>
                <div>
                  <p style={{margin:0,color:"rgba(255,255,255,0.5)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>Período</p>
                  <p style={{margin:0,color:"#fff",fontSize:14,fontWeight:700}}>{fmtFecha(rd.desde)} al {fmtFecha(rd.hasta)}</p>
                </div>
              </div>
            </div>

            <div style={{flex:1}}/>

            <div style={{background:"rgba(14,27,34,0.82)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px 6px",display:"flex"}}>
              {[["Novedades",rd.reportadas,TEAL],["Resueltas",`${rd.avance}%`,TEAL],["Pendientes",rd.pendientes,ORANGE],["Vencidas",rd.vencidas,"#FF6B60"]].map(([lbl,val,color],i)=>(
                <div key={String(lbl)} style={{flex:1,textAlign:"center",borderRight:i<3?"1px solid rgba(255,255,255,0.1)":"none"}}>
                  <b style={{display:"block",fontSize:30,fontWeight:800,letterSpacing:-1,color:color as string}}>{val}</b>
                  <span style={{display:"block",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.55)",textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{lbl}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14,color:"rgba(255,255,255,0.5)",fontSize:10}}>
              <span>Informe generado por <b style={{color:TEAL}}>Fixgo</b></span>
              <span>01 / 04</span>
            </div>
          </div>
        </div>

        {/* ══════════ PÁGINA 2 — RESUMEN GENERAL ══════════ */}
        <div className="hoja-informe" style={styleHoja}>
          <HeaderPagina/>
          <div style={{display:"flex",gap:18,marginBottom:22}}>
            <div style={{flex:"0 0 190px"}}>
              <h1 style={{fontSize:27,margin:0,lineHeight:1.05,fontWeight:800,letterSpacing:-0.5}}>RESUMEN<span style={{color:TEAL,display:"block"}}>GENERAL</span></h1>
              <div style={{width:30,height:3,background:TEAL,margin:"11px 0 9px"}}/>
              <p style={{fontSize:10.5,color:GRAY,lineHeight:1.5,margin:0}}>Análisis consolidado de las novedades registradas en el período.</p>
            </div>
            <div style={{flex:1,background:"linear-gradient(135deg,#0B2622,#123D37)",borderRadius:16,padding:"18px 20px",display:"flex",alignItems:"center",gap:16}}>
              <div>
                <p style={{margin:"0 0 2px",color:"rgba(255,255,255,0.5)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>Estado general</p>
                <p style={{margin:"0 0 6px",fontSize:20,fontWeight:800,color:rd.estadoGeneral.color}}>{rd.estadoGeneral.txt}</p>
                <p style={{margin:0,fontSize:10.5,color:"rgba(255,255,255,0.7)",lineHeight:1.5,maxWidth:230}}>{rd.estadoGeneral.desc}</p>
              </div>
              <div style={{width:50,height:50,borderRadius:"50%",border:`2px solid ${rd.estadoGeneral.color}`,display:"flex",alignItems:"center",justifyContent:"center",color:rd.estadoGeneral.color,fontSize:20,flexShrink:0,marginLeft:"auto"}}>{rd.estadoGeneral.txt==="Bueno"?"✓":"!"}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div style={{border:"1px solid #E5E5EA",borderRadius:13,padding:17}}>
              <h3 style={{fontSize:13,margin:"0 0 14px",fontWeight:800}}>Estado de novedades</h3>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:96,height:96,borderRadius:"50%",flexShrink:0,position:"relative",background:`conic-gradient(${TEAL} 0% ${pctResueltas}%, ${ORANGE} ${pctResueltas}% ${pctResueltas+pctPendientes}%, ${RED} ${pctResueltas+pctPendientes}% 100%)`}}>
                  <div style={{position:"absolute",inset:14,background:"#fff",borderRadius:"50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <b style={{fontSize:17}}>{rd.reportadas}</b><span style={{fontSize:7,color:GRAY,textTransform:"uppercase"}}>Total</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11}}><span style={{width:8,height:8,borderRadius:2,background:TEAL,flexShrink:0}}/>Resueltas<b style={{marginLeft:"auto"}}>{pctResueltas}% ({rd.resueltas})</b></div>
                  <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11}}><span style={{width:8,height:8,borderRadius:2,background:ORANGE,flexShrink:0}}/>Pendientes<b style={{marginLeft:"auto"}}>{pctPendientes}% ({Math.max(0,rd.pendientes-rd.vencidas)})</b></div>
                  <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11}}><span style={{width:8,height:8,borderRadius:2,background:RED,flexShrink:0}}/>Vencidas<b style={{marginLeft:"auto"}}>{pctVencidas}% ({rd.vencidas})</b></div>
                </div>
              </div>
            </div>

            <div style={{border:"1px solid #E5E5EA",borderRadius:13,padding:17}}>
              <h3 style={{fontSize:13,margin:"0 0 14px",fontWeight:800}}>Novedades por oficio</h3>
              {rd.porOficio.length===0&&<p style={{fontSize:11,color:GRAY}}>Sin datos en este período.</p>}
              {rd.porOficio.slice(0,5).map((o:any)=>(
                <div key={o.nombre} style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                  <span style={{fontSize:10.5,width:95,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.nombre}</span>
                  <div style={{flex:1,height:7,background:"#F0F0F2",borderRadius:99}}><div style={{height:"100%",width:`${(o.cant/rd.porOficio[0].cant)*100}%`,background:TEAL,borderRadius:99}}/></div>
                  <span style={{fontSize:11,fontWeight:700,width:14,textAlign:"right",flexShrink:0}}>{o.cant}</span>
                </div>
              ))}
            </div>

            <div style={{border:"1px solid #E5E5EA",borderRadius:13,padding:17}}>
              <h3 style={{fontSize:13,margin:"0 0 14px",fontWeight:800}}>Novedades por responsable</h3>
              {rd.actividadPersonas.length===0&&<p style={{fontSize:11,color:GRAY}}>Sin datos en este período.</p>}
              {rd.actividadPersonas.slice(0,5).map((p:any,i:number)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                  <span style={{width:19,height:19,borderRadius:"50%",background:paletaPersona[i%paletaPersona.length],color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{p.nombre[0]?.toUpperCase()}</span>
                  <span style={{fontSize:10.5,width:76,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</span>
                  <div style={{flex:1,height:7,background:"#F0F0F2",borderRadius:99}}><div style={{height:"100%",width:`${((p.resueltas+p.aCargo)/(rd.actividadPersonas[0].resueltas+rd.actividadPersonas[0].aCargo))*100}%`,background:TEAL,borderRadius:99}}/></div>
                  <span style={{fontSize:11,fontWeight:700,width:14,textAlign:"right",flexShrink:0}}>{p.resueltas+p.aCargo}</span>
                </div>
              ))}
            </div>

            <div style={{border:"1px solid #E5E5EA",borderRadius:13,padding:17}}>
              <h3 style={{fontSize:13,margin:"0 0 14px",fontWeight:800}}>Novedades por sector</h3>
              {rd.porSector.length===0?<p style={{fontSize:11,color:GRAY}}>Sin datos en este período.</p>:(
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:96,height:96,borderRadius:"50%",flexShrink:0,background:`conic-gradient(${rd.porSector.map((s:any,i:number)=>{
                    const total=rd.porSector.reduce((a:number,x:any)=>a+x.cant,0);
                    const acumPrev=rd.porSector.slice(0,i).reduce((a:number,x:any)=>a+x.cant,0);
                    const from=Math.round((acumPrev/total)*100),to=Math.round(((acumPrev+s.cant)/total)*100);
                    return `${paletaPersona[i%paletaPersona.length]} ${from}% ${to}%`;
                  }).join(", ")})`}}/>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {rd.porSector.slice(0,4).map((s:any,i:number)=>{
                    const total=rd.porSector.reduce((a:number,x:any)=>a+x.cant,0);
                    return(<div key={s.nombre} style={{display:"flex",alignItems:"center",gap:7,fontSize:11}}><span style={{width:8,height:8,borderRadius:2,background:paletaPersona[i%paletaPersona.length],flexShrink:0}}/>{s.nombre}<b style={{marginLeft:"auto"}}>{Math.round((s.cant/total)*100)}%</b></div>);
                  })}
                </div>
              </div>
              )}
            </div>
          </div>

          <div style={{background:MINT,borderRadius:13,padding:18}}>
            <p style={{display:"flex",alignItems:"center",gap:8,fontSize:10.5,fontWeight:800,textTransform:"uppercase",letterSpacing:0.5,margin:"0 0 15px"}}><span style={{width:22,height:22,borderRadius:6,background:"#DFF3EA",color:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>💡</span>Puntos clave del período</p>
            <div style={{display:"flex",gap:11}}>
              {rd.insights.slice(0,5).map((ins:any,i:number)=>(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:"#fff",border:"1.5px solid #E5E5EA",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,margin:"0 auto 8px"}}>{ins.icono}</div>
                  <p style={{fontSize:9,color:"#3A4340",lineHeight:1.35,margin:0}}>{ins.texto}</p>
                </div>
              ))}
            </div>
          </div>
          <FooterPagina pagina={2}/>
        </div>

        {/* ══════════ PÁGINA 3 — EVOLUCIÓN DE NOVEDADES ══════════ */}
        <div className="hoja-informe" style={styleHoja}>
          <HeaderPagina/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:18,marginBottom:22}}>
            <div>
              <p style={{color:TEAL,fontSize:10.5,fontWeight:800,textTransform:"uppercase",letterSpacing:0.8,margin:"0 0 2px"}}>Línea de tiempo</p>
              <h1 style={{fontSize:25,margin:0,lineHeight:1.06,fontWeight:800,letterSpacing:-0.5}}>EVOLUCIÓN DE<span style={{color:TEAL,display:"block"}}>NOVEDADES</span></h1>
              <div style={{width:30,height:3,background:TEAL,margin:"9px 0 8px"}}/>
              <p style={{fontSize:10.5,color:GRAY,lineHeight:1.5,margin:0,maxWidth:250}}>Resumen cronológico de las novedades registradas durante el período.</p>
            </div>
            <div style={{background:MINT,borderRadius:12,padding:"12px 15px",display:"flex",alignItems:"center",gap:10,flexShrink:0,width:230}}>
              <div style={{width:30,height:30,borderRadius:8,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Calendar size={13} color={TEAL}/></div>
              <div>
                <p style={{margin:0,fontSize:8.5,color:TEAL,fontWeight:700,textTransform:"uppercase",letterSpacing:0.3}}>Período analizado</p>
                <p style={{margin:"2px 0 0",fontSize:11.5,fontWeight:800}}>{fmtFecha(rd.desde)} al {fmtFecha(rd.hasta)}</p>
                <p style={{margin:0,fontSize:9,color:GRAY}}>Agrupado por {rd.tipoLinea==="dia"?"día":rd.tipoLinea==="semana"?"semana":"mes"}</p>
              </div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"flex-start",position:"relative",marginBottom:28}}>
            <div style={{position:"absolute",left:"5%",right:"5%",top:100,height:1.5,background:"#E5E5EA",zIndex:0}}/>
            {rd.timeline.map((p:any,i:number)=>{
              const colorEstado=p.estado==="resuelta"?"#1a8a3d":p.estado==="pendiente"?"#9a6b00":p.estado==="vencida"?"#D0342C":"#8E8E93";
              const bgEstado=p.estado==="resuelta"?"#E4F5EC":p.estado==="pendiente"?"#FDF1DE":p.estado==="vencida"?"#FBE7E6":"#F2F2F7";
              const colorCirculo=p.estado==="resuelta"?TEAL:p.estado==="pendiente"?ORANGE:p.estado==="vencida"?RED:"#D9D9DE";
              return(
                <div key={i} style={{flex:1,textAlign:"center",position:"relative",zIndex:1}}>
                  <div style={{height:96}}>
                    <p style={{fontSize:11.5,fontWeight:800,margin:0}}>{p.label}</p>
                    {p.sub&&<p style={{fontSize:7,color:GRAY,textTransform:"uppercase",letterSpacing:0.3,margin:"1px 0 10px"}}>{p.sub}</p>}
                    <div style={{width:12,height:12,borderRadius:"50%",border:`2.5px solid ${colorCirculo}`,background:p.estado==="sin_cambios"?"#fff":colorCirculo,margin:"0 auto"}}/>
                    <span style={{display:"inline-block",fontSize:7,fontWeight:800,padding:"3px 7px",borderRadius:99,marginTop:10,textTransform:"uppercase",background:bgEstado,color:colorEstado}}>{p.etiqueta}</span>
                    {p.cant>0&&<p style={{fontSize:16,fontWeight:800,margin:"7px 0 0"}}>{p.cant}</p>}
                  </div>
                  <div style={{marginTop:11,height:135,display:"flex",flexDirection:"column",gap:3}}>
                    {p.fotos.length>0?p.fotos.map((f:string,fi:number)=>(
                      <img key={fi} src={f} style={{width:"90%",margin:"0 auto",height:p.fotos.length>1?"66px":"135px",objectFit:"cover",borderRadius:6,display:"block"}}/>
                    )):(
                      <div style={{width:"90%",height:135,margin:"0 auto",borderRadius:6,background:"#F7F8F8",display:"flex",alignItems:"center",justifyContent:"center"}}><img src="/fixgo-logo-relleno.png" style={{width:32,height:32,objectFit:"contain",opacity:0.35}}/></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{background:MINT,borderRadius:15,padding:20}}>
            <div style={{display:"flex",gap:16}}>
              <div style={{width:115,flexShrink:0}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#fff",color:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginBottom:8}}>📈</div>
                <b style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:0.3,display:"block",lineHeight:1.4}}>Comparativa con período anterior</b>
                <span style={{fontSize:9.5,color:GRAY,display:"block",marginTop:5}}>{fmtFechaCorta(rd.desdeAnt)} al {fmtFechaCorta(rd.hastaAnt)}</span>
              </div>
              <div style={{flex:1,display:"flex"}}>
                {[
                  {ic:"📄",lbl:"Novedades totales",...rd.deltaReportadas,vs:`(${rd.reportadas} vs ${rd.reportadasAnterior})`},
                  {ic:"⏱️",lbl:"Tiempo prom. de resolución",...rd.deltaTiempo,vs:`(${rd.tiempoProm.toFixed(1)} vs ${rd.tiempoPromAnterior.toFixed(1)} días)`},
                  {ic:"✓",lbl:"Novedades resueltas",...rd.deltaResueltas,vs:`(${rd.resueltas} vs ${rd.resueltasAnterior})`},
                  {ic:"⚠️",lbl:"Novedades vencidas",...rd.deltaVencidas,vs:`(${rd.vencidasActualPeriodo} vs ${rd.vencidasAnteriorPeriodo})`},
                ].map((c:any,i:number)=>(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,margin:"0 auto 7px"}}>{c.ic}</div>
                    <p style={{fontSize:16,fontWeight:800,margin:0,color:c.tipo==="bad"?RED:c.tipo==="good"?"#1a8a3d":INK}}>{c.pct!==undefined?`${c.pct>=0?"+":""}${c.pct}%`:"—"}</p>
                    <p style={{fontSize:8.5,color:GRAY,lineHeight:1.35,margin:"4px 0 0"}}>{c.lbl}</p>
                    <small style={{fontSize:8,color:"#8E9490",display:"block",marginTop:1}}>{c.vs}</small>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start",paddingTop:16,marginTop:16,borderTop:"1px solid rgba(61,174,140,0.25)"}}>
              <span style={{fontSize:15}}>✨</span>
              <div>
                <b style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:0.4,display:"block",marginBottom:3}}>En resumen</b>
                <p style={{fontSize:10.5,color:"#2E3D3A",margin:0,lineHeight:1.5}}>
                  {rd.deltaReportadas.tipo==="bad"?"La cantidad de novedades aumentó respecto del período anterior. ":rd.deltaReportadas.tipo==="good"?"La cantidad de novedades disminuyó respecto del período anterior. ":""}
                  {rd.deltaVencidas.tipo==="bad"?"Las vencidas aumentaron, se recomienda priorizar su resolución.":rd.vencidas===0?"No hay novedades vencidas en este momento.":"Las vencidas se mantuvieron bajo control."}
                </p>
              </div>
            </div>
          </div>
          <FooterPagina pagina={3}/>
        </div>

        {/* ══════════ PÁGINA 4 — GALERÍA DE NOVEDADES ══════════ */}
        <div className="hoja-informe" style={{...styleHoja,pageBreakAfter:"auto",breakAfter:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              {logoEstudioUrl?<ImgCacheada src={logoEstudioUrl} style={{width:24,height:24,objectFit:"contain"}}/>:<div style={{width:24,height:24,borderRadius:6,background:"#2E3A4B"}}/>}
              <span style={{fontSize:16,fontWeight:800,letterSpacing:-0.2}}>{nombreEstudio||"FIXGO"}</span>
            </div>
            <div style={{fontSize:10,fontWeight:700,textAlign:"right",lineHeight:1.5,borderRight:`2px solid ${TEAL}`,paddingRight:12}}>
              INFORME EJECUTIVO DE NOVEDADES<br/>
              <span style={{color:GRAY,fontWeight:600}}>{obraActual?.nombre?.toUpperCase()} · {obraActual?.direccion?.toUpperCase()}</span><br/>
              <span style={{color:TEAL,fontWeight:800}}>{fmtFechaCorta(rd.desde)} – {fmtFechaCorta(rd.hasta)} {rd.desde.getFullYear()}</span>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:20}}>
            <div>
              <h1 style={{fontSize:19,margin:0,fontWeight:800,letterSpacing:-0.3}}>GALERÍA DE NOVEDADES <span style={{fontSize:12,fontWeight:600,color:GRAY}}>(Vista general)</span></h1>
              <p style={{fontSize:10.5,color:GRAY,margin:"5px 0 0",lineHeight:1.4}}>Vista rápida de las incidencias registradas en el período.</p>
            </div>
            <div style={{display:"flex",background:"#fff",border:"1.5px solid #E5E5EA",borderRadius:13,padding:"12px 8px",gap:13,flexShrink:0}}>
              {[["✓",rd.resueltas,"Resueltas","#E4F5EC","#1a8a3d"],["🕐",Math.max(0,rd.pendientes-rd.vencidas),"Pendientes","#FDF1DE","#9a6b00"],["⚠️",rd.vencidas,"Vencida","#FBE7E6","#D0342C"],["📄",rd.reportadas,"Total","#F2F2F7",INK]].map(([ic,val,lbl,bg,color]:any,i)=>(
                <div key={i} style={{textAlign:"center",width:48}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:bg,color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,margin:"0 auto 4px"}}>{ic}</div>
                  <b style={{fontSize:15,display:"block",fontWeight:800}}>{val}</b>
                  <span style={{fontSize:7,color:GRAY,textTransform:"uppercase"}}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {rd.listaCompleta.slice(0,8).map((n:any,i:number)=>{
              const est=estadoBadge(n);
              const prio=prioTxt(n.prioridad);
              const fotosNov=[n.fotoResolucion,...(n.fotos||[])].filter(Boolean);
              return(
                <div key={n.id} style={{border:"1px solid #E5E5EA",borderRadius:11,overflow:"hidden"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px"}}>
                    <span style={{fontSize:8.5,fontWeight:800,color:"#fff",background:INK,padding:"2px 6px",borderRadius:5}}>#{String(i+1).padStart(3,"0")}</span>
                    <span style={{fontSize:7.5,fontWeight:800,padding:"2px 6px",borderRadius:99,textTransform:"uppercase",background:est.bg,color:est.color}}>{est.txt}</span>
                  </div>
                  {fotosNov[0]?<img src={fotosNov[0]} style={{width:"100%",height:88,objectFit:"cover",display:"block"}}/>:<div style={{width:"100%",height:88,background:"linear-gradient(135deg,#E5E5EA,#D4D4D8)",display:"flex",alignItems:"center",justifyContent:"center",color:"#B0B0B5",fontSize:9}}>Sin foto</div>}
                  {fotosNov.length>1&&<div style={{display:"flex",gap:2,padding:2}}>
                    {fotosNov.slice(1,3).map((f:string,fi:number)=>(<img key={fi} src={f} style={{width:"33.3%",height:30,objectFit:"cover"}}/>))}
                    {fotosNov.length>3&&<div style={{width:"33.3%",height:30,background:"rgba(0,0,0,0.65)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>+{fotosNov.length-3}</div>}
                  </div>}
                  <div style={{padding:"8px 9px 9px"}}>
                    <p style={{fontSize:9.5,fontWeight:800,margin:"0 0 6px",lineHeight:1.25,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.descripcion}</p>
                    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:7.5,color:GRAY,borderTop:"1px solid #F0F0F2",paddingTop:6,flexWrap:"wrap"}}>
                      <span>👤 {nombreResp(n)}</span>
                      <span>📅 {n.fecha?fmtFechaCorta(new Date(n.fecha+"T00:00:00")):""}</span>
                      <span style={{display:"flex",alignItems:"center",gap:2}}><span style={{width:6,height:6,borderRadius:"50%",background:prio.color,flexShrink:0}}/>{prio.txt}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rd.listaCompleta.length===0&&<p style={{textAlign:"center",color:"#8E8E93",fontSize:12,marginTop:30}}>No hay novedades en este período.</p>}

          <div style={{display:"flex",alignItems:"center",gap:10,background:MINT,borderRadius:11,padding:"12px 15px"}}>
            <span style={{fontSize:15}}>⭐</span>
            <p style={{fontSize:10,margin:0,color:"#2E3D3A"}}>Esta es una vista general del período{rd.listaCompleta.length>8?" — se muestran las primeras 8 novedades":""}.</p>
          </div>
          <FooterPagina pagina={4}/>
        </div>

      </div>
    );
  }

  if(vistaInfoApp) return(
    <div style={s.root}>
      <Header migas={[{label:"Inicio",onClick:irInicio},{label:"Fixgo"}]} />
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"linear-gradient(135deg,#1C1C1E,#3A3A3C)",borderRadius:20,padding:"28px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <img src="/Fixgo_logo.png" alt="Fixgo" style={{width:72,height:72,borderRadius:18,boxShadow:"0 6px 18px rgba(0,0,0,0.3)"}}/>
          <p style={{margin:0,fontSize:28,fontWeight:900,color:"#fff",letterSpacing:-1}}>Fixgo</p>
          <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,0.5)"}}>Versión 1.0.0</p>
        </div>
        <p style={{margin:"4px 0 0",fontSize:12,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Planes</p>
        <div style={{background:"#fff",borderRadius:16,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #F2F2F7"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:"#1C1C1E"}}>Plan Gratuito</p>
              <span style={{background:"#F2F2F7",borderRadius:99,padding:"3px 10px",fontSize:12,color:"#636366",fontWeight:600}}>Actual</span>
            </div>
            <p style={{margin:0,fontSize:13,color:"#55555A"}}>✅ 1 obra · ✅ Novedades ilimitadas · ❌ Offline, Modo Director, dibujo sobre fotos</p>
          </div>
          <div style={{padding:"14px 16px",background:"#FFB80008"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:"#1C1C1E"}}>Plan Pro</p>
              <span style={{background:"#FFB800",borderRadius:99,padding:"3px 10px",fontSize:12,color:"#1C1C1E",fontWeight:800}}>✨ PRO</span>
            </div>
            <p style={{margin:0,fontSize:13,color:"#55555A",marginBottom:10}}>✅ Obras ilimitadas · ✅ Offline · ✅ Modo Director · ✅ Dibujar sobre fotos</p>
            <button style={{width:"100%",padding:"12px",borderRadius:12,background:"#FFB800",color:"#1C1C1E",border:"none",fontSize:15,fontWeight:800,cursor:"pointer"}}>🚀 Activar Plan Pro</button>
          </div>
        </div>
        {[["Contacto y soporte",[{icon:"💬",label:"Contactarnos",sub:"Escribinos por cualquier consulta"},{icon:"🐛",label:"Reportar un problema",sub:"Ayudanos a mejorar Fixgo"},{icon:"❓",label:"Preguntas frecuentes",sub:"Guías y ayuda"}]],
          ["Legal",[{icon:"📄",label:"Términos y condiciones"},{icon:"🔒",label:"Política de privacidad"}]]].map(([titulo,items])=>(
          <div key={titulo}>
            <p style={{margin:"4px 0 8px",fontSize:12,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>{titulo}</p>
            <div style={{background:"#fff",borderRadius:16,overflow:"hidden"}}>
              {items.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<items.length-1?"1px solid #F2F2F7":"none",cursor:"pointer"}}>
                  <span style={{fontSize:22}}>{item.icon}</span>
                  <div style={{flex:1}}><p style={{margin:0,fontSize:15,fontWeight:600,color:"#1C1C1E"}}>{item.label}</p>{item.sub&&<p style={{margin:0,fontSize:12,color:"#55555A"}}>{item.sub}</p>}</div>
                  <span style={{color:"#C7C7CC",fontSize:18}}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",marginBottom:8}}>Fixgo · Versión 1.0.0</p>
      </div>
      {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={(k)=>{setVistaInfoApp(false);setTabActiva(k);irInicio();}} onPerfil={()=>{setVistaInfoApp(false);setVistaPerfil(true);}} />
    </div>
  );

  // ─────────────────────────────
  // DASHBOARD DEL DIRECTOR — nivel 1 por categoría
  // ─────────────────────────────
  if(vistaDirectorCategoria){
    const stats=calcularStatsEmpresa();
    const CONFIG:any={
      urgencias:{titulo:"Urgentes",tituloPlural:"urgentes",emoji:"🔥",color:"#D0342C",bg:"linear-gradient(160deg,#FFF4F3,#FFE3E1)",badgeBg:"#FFEDEC",valor:stats.totalUrgentes,lista:stats.porObraUrgentes,unidad:"urg.",esAlertas:true},
      vencidas:{titulo:"Vencidas",tituloPlural:"vencidas",emoji:"⏰",color:"#B8720A",bg:"linear-gradient(160deg,#FFF9EF,#FDECD1)",badgeBg:"#FDECD1",valor:stats.totalVencidas,lista:stats.porObraVencidas,filtroDestino:"vencidas",unidad:"venc."},
      novedades:{titulo:"Novedades",tituloPlural:"novedades",emoji:"📋",color:"#6B4FD9",bg:"linear-gradient(160deg,#F8F5FF,#EDE6FF)",badgeBg:"#F0EBFF",valor:stats.totalNovedades,lista:stats.porObraNovedades,filtroDestino:"todas",unidad:"nov."},
      resueltas:{titulo:"Resueltas",tituloPlural:"resueltas",emoji:"✓",color:"#1a8a3d",bg:"linear-gradient(160deg,#F2FBF5,#DFF6E6)",badgeBg:"#E9F9EE",valor:stats.totalResueltas,lista:stats.porObraResueltas,filtroDestino:"resueltas",unidad:"res."},
      sinResponsable:{titulo:"Sin responsable asignado",tituloPlural:"sin responsable asignado",emoji:"👤",color:"#854F0B",bg:"linear-gradient(160deg,#FAEEDA,#F5DDB0)",badgeBg:"#FAEEDA",valor:stats.novedadesSinResponsable,lista:stats.porObraSinResponsable,filtroDestino:"sinResponsable",unidad:"nov."},
      obrasActivas:{titulo:"Obras activas",tituloPlural:"obras activas",emoji:"🏗️",color:"#2E3A4B",bg:"linear-gradient(160deg,#F2F4F6,#E4E8EC)",badgeBg:"#E4E8EC",valor:stats.obrasActivas,lista:stats.porObraTodas,filtroDestino:"todas",unidad:"nov."},
    };
    const cfg=CONFIG[vistaDirectorCategoria];
    // Agrupar las obras por el profesional dueño (memoria pendiente 03/08: reemplaza la tarjeta grande de color repetida)
    const gruposPorProfesional=Object.values(
      cfg.lista.reduce((acc:any,item:any)=>{
        const key=item.responsable||"Profesional";
        if(!acc[key])acc[key]={responsable:key,items:[]};
        acc[key].items.push(item);
        return acc;
      },{})
    ).sort((a:any,b:any)=>a.responsable.localeCompare(b.responsable));
    return(
      <div style={{...s.root}}>
        <div style={{padding:"16px 16px 4px",flexShrink:0}}>
          <button onClick={()=>{setVistaDirectorCategoria(null);setTabActiva("obras");irInicio();}} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:"#007AFF",cursor:"pointer",padding:"0 4px 8px",fontSize:14,fontWeight:600}}><ChevronLeft size={19}/>Director</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 16px 24px"}}>
          <p style={{margin:"4px 0 4px",fontSize:22,fontWeight:800,color:"#1C1C1E"}}>{vistaDirectorCategoria==="obrasActivas"?cfg.titulo:`${cfg.titulo} por obra`}</p>
          <p style={{margin:"0 0 18px",fontSize:13,color:"#55555A"}}>{vistaDirectorCategoria==="obrasActivas"?`${cfg.lista.length} obra${cfg.lista.length!==1?"s":""} bajo tu Modo Director`:`${cfg.valor} ${cfg.tituloPlural} repartidas en ${cfg.lista.length} obra${cfg.lista.length!==1?"s":""}`}</p>
          {cfg.lista.length===0&&<p style={{textAlign:"center",color:"#55555A",fontSize:13,marginTop:20}}>Nada por acá 🎉</p>}
          {vistaDirectorCategoria==="obrasActivas"?(
            cfg.lista.map((item:any)=>(
              <div key={item.obraId} onClick={()=>{
                  const obra=obras.find(o=>o.id===item.obraId)||obrasEmpresa.find(o=>o.id===item.obraId);
                  if(obra){setOrigenDirectorCategoria(vistaDirectorCategoria);irObra(obra);setFiltro(cfg.filtroDestino);setVistaDirectorCategoria(null);}
                }}
                style={{background:"#fff",borderRadius:16,padding:"13px 15px",marginBottom:10,border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:15.5,fontWeight:800}}>{item.obraNombre}</p>
                  <p style={{margin:"2px 0 0",fontSize:11.5,color:"#55555A"}}>{item.direccion||item.responsable}</p>
                </div>
                <div style={{background:cfg.badgeBg,borderRadius:14,padding:"6px 12px",textAlign:"center",flexShrink:0}}>
                  <p style={{margin:0,fontSize:19,fontWeight:800,color:cfg.color,lineHeight:1}}>{item.count}</p>
                  <p style={{margin:"1px 0 0",fontSize:8.5,textTransform:"uppercase",fontWeight:700,color:cfg.color}}>{cfg.unidad}</p>
                </div>
                <span style={{color:"#8E8E93",fontSize:16}}>›</span>
              </div>
            ))
          ):gruposPorProfesional.map((grupo:any)=>(
            <div key={grupo.responsable}>
              <p style={{margin:"18px 0 8px 2px",fontSize:11,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>{grupo.responsable}</p>
              {grupo.items.map((item:any)=>(
                <div key={item.obraId} onClick={()=>{
                    if(cfg.esAlertas){setFiltroObraAlertas({id:item.obraId,nombre:item.obraNombre});setOrigenDirectorCategoria(vistaDirectorCategoria);setTabActiva("alertas");setVistaDirectorCategoria(null);return;}
                    const obra=obras.find(o=>o.id===item.obraId)||obrasEmpresa.find(o=>o.id===item.obraId);
                    if(obra){setOrigenDirectorCategoria(vistaDirectorCategoria);irObra(obra);setFiltro(cfg.filtroDestino);setVistaDirectorCategoria(null);}
                  }}
                  style={{background:"#fff",borderRadius:16,padding:"13px 15px",marginBottom:10,border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:14.5,fontWeight:700}}>{item.obraNombre}</p>
                    {item.diasMasVieja!==undefined&&<p style={{margin:"2px 0 0",fontSize:11.5,color:"#55555A"}}>{`la más vieja: ${item.diasMasVieja} día${item.diasMasVieja!==1?"s":""}`}</p>}
                  </div>
                  <div style={{background:cfg.badgeBg,borderRadius:14,padding:"6px 12px",textAlign:"center",flexShrink:0}}>
                    <p style={{margin:0,fontSize:19,fontWeight:800,color:cfg.color,lineHeight:1}}>{item.count}</p>
                    <p style={{margin:"1px 0 0",fontSize:8.5,textTransform:"uppercase",fontWeight:700,color:cfg.color}}>{cfg.unidad}</p>
                  </div>
                  <span style={{color:"#8E8E93",fontSize:16}}>›</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);setVistaDirectorCategoria(null);irInicio();}} onPerfil={()=>{setVistaDirectorCategoria(null);setVistaPerfil(true);}} />
      </div>
    );
  }

  // ─────────────────────────────
  // DASHBOARD DEL DIRECTOR — Tu equipo (ranking)
  // ─────────────────────────────
  // ─────────────────────────────
  // DASHBOARD DEL DIRECTOR — Profesionales (directorio de contacto)
  // ─────────────────────────────
  if(vistaProfesionales){
    return(
      <div style={{...s.root}}>
        <div style={{padding:"16px 16px 4px",flexShrink:0}}>
          <button onClick={()=>setVistaProfesionales(false)} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:"#007AFF",cursor:"pointer",padding:"0 4px 8px",fontSize:14,fontWeight:600}}><ChevronLeft size={19}/>Director</button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {logoEstudioUrl&&<ImgCacheada src={logoEstudioUrl} style={{width:36,height:36,borderRadius:9,objectFit:"contain",border:"1.5px solid #E5E5EA",flexShrink:0}}/>}
            <div>
              <p style={{fontSize:24,margin:0,fontWeight:800,letterSpacing:-0.4}}>Profesionales</p>
              <p style={{fontSize:12.5,color:"#55555A",margin:"4px 0 0"}}>{miembrosEmpresa.length} en {nombreEstudio||empresaPropia?.nombre}</p>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 0 24px"}}>
          {miembrosEmpresa.map(m=>{
            const obrasDeEste=obrasEmpresa.filter(o=>o.propietario_id===m.usuario_id);
            const nombre=m.usuarios?.nombre||m.usuarios?.email||"Profesional";
            const emailCuenta=m.usuarios?.email;
            const primeraObra=obrasDeEste[0];
            const telefono=obrasDeEste.map(o=>o.equipo?.find(eq=>eq.uid===m.usuario_id)?.telefono).find(Boolean);
            const emailContacto=obrasDeEste.map(o=>o.equipo?.find(eq=>eq.uid===m.usuario_id)?.emailContacto).find(Boolean);
            return(
              <div key={m.usuario_id} style={{background:"#fff",borderRadius:18,padding:15,margin:"0 16px 10px",border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"#EFE9FF",color:"#7C5CFC",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{nombre[0]?.toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:15,fontWeight:800}}>{nombre}</p>
                    <p style={{margin:"2px 0 0",fontSize:11.5,color:"#55555A"}}>{obrasDeEste.length} obra{obrasDeEste.length!==1?"s":""} a cargo{obrasDeEste.length>0?`: ${obrasDeEste.map(o=>o.nombre).join(", ")}`:""}</p>
                  </div>
                </div>

                {/* Teléfono: llamar / WhatsApp / editar — mismo estilo que en Equipo */}
                {telefono?(
                  <div style={{background:"#F2F2F7",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    <Phone size={16} color="#55555A" style={{flexShrink:0}}/>
                    <span style={{flex:1,fontSize:15,fontWeight:600,color:"#1C1C1E"}}>{telefono}</span>
                    <button onClick={()=>window.open(`https://wa.me/${telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${nombre}! Te escribo por Fixgo.`)}`,"_blank")} style={{width:34,height:34,borderRadius:10,background:"#25D36615",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                    <button onClick={()=>window.open(`tel:${telefono.replace(/\s/g,"")}`,"_blank")} style={{width:34,height:34,borderRadius:10,background:"#007AFF15",border:"none",cursor:"pointer",fontSize:16}}>📞</button>
                    {primeraObra&&<button onClick={()=>{setModalTelefono({uid:m.usuario_id,nombre,obraId:primeraObra.id});setTelInput(telefono||"");}} style={{width:34,height:34,borderRadius:10,background:"#F2F2F7",border:"1px solid #E5E5EA",cursor:"pointer",fontSize:14}}>✏️</button>}
                  </div>
                ):(
                  primeraObra&&<button onClick={()=>{setModalTelefono({uid:m.usuario_id,nombre,obraId:primeraObra.id});setTelInput("");}} style={{width:"100%",background:"#FFF3E8",border:"none",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontFamily:"inherit",marginBottom:8}}>
                    <Phone size={16} color="#FF6B00" style={{flexShrink:0}}/>
                    <span style={{flex:1,fontSize:14,fontWeight:600,color:"#FF6B00",textAlign:"left"}}>Sin teléfono</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#fff",background:"#FF6B00",padding:"3px 10px",borderRadius:99}}>+ Agregar</span>
                  </button>
                )}

                {/* Mail de contacto (aparte del mail de la cuenta) */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#F2F2F7",borderRadius:12,padding:"9px 12px"}}>
                  <span style={{fontSize:14}}>✉️</span>
                  <a href={`mailto:${emailContacto||emailCuenta}`} style={{flex:1,fontSize:12.5,fontWeight:600,color:"#1C1C1E",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emailContacto||emailCuenta||"Sin mail"}</a>
                  {primeraObra&&<button onClick={()=>{setModalEmailContacto({uid:m.usuario_id,nombre,obraId:primeraObra.id});setEmailContactoInput(emailContacto||"");}} style={{width:28,height:28,borderRadius:8,background:"#fff",border:"1px solid #E5E5EA",cursor:"pointer",fontSize:12,flexShrink:0}}>✏️</button>}
                </div>
              </div>
            );
          })}
          {miembrosEmpresa.length===0&&<p style={{textAlign:"center",color:"#55555A",fontSize:13,marginTop:30}}>Todavía no invitaste a nadie.</p>}
        </div>
        {modalTelefono&&createPortal(<div style={s.overlay} onClick={()=>setModalTelefono(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>Teléfono de {modalTelefono.nombre}</p><p style={{margin:"0 0 14px",fontSize:14,color:"#55555A"}}>Para llamarlo o mandarle WhatsApp desde la app.</p>{typeof navigator!=="undefined"&&(navigator as any).contacts&&<button type="button" onClick={async()=>{try{const c=await (navigator as any).contacts.select(["tel"],{multiple:false});if(c&&c[0]?.tel?.[0]){setTelInput(c[0].tel[0].replace(/\s/g,""));}}catch(e){}}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>📱</span>Elegir de mis contactos</button>}<input style={{...s.input,marginBottom:16}} type="text" placeholder="+54 9 351 555 0000" value={telInput} onChange={e=>setTelInput(e.target.value)} inputMode="tel"/><button style={{...s.btnPrincipal,background:"#1C1C1E",marginBottom:10}} onClick={guardarTelefono}>Guardar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalTelefono(null)}>Cancelar</button></div></div>,document.body)}
        {modalEmailContacto&&<div style={s.overlay} onClick={()=>setModalEmailContacto(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}>
          <p style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>Mail de contacto de {modalEmailContacto.nombre}</p>
          <p style={{margin:"0 0 14px",fontSize:14,color:"#55555A"}}>No cambia su cuenta, es solo para que vos lo tengas a mano.</p>
          <input style={{...s.input,marginBottom:16}} type="email" placeholder="mail@ejemplo.com" value={emailContactoInput} onChange={e=>setEmailContactoInput(e.target.value)}/>
          <button style={{...s.btnPrincipal,background:"#1C1C1E",marginBottom:10}} onClick={guardarEmailContacto}>Guardar</button>
          <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalEmailContacto(null)}>Cancelar</button>
        </div></div>}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);setVistaProfesionales(false);irInicio();}} onPerfil={()=>{setVistaProfesionales(false);setVistaPerfil(true);}} />
      </div>
    );
  }

  if(vistaTuEquipo){
    const stats=calcularStatsEmpresa();
    const ESTADO_CFG:any={
      critico:{emoji:"🔴",label:"Crítico",bg:"#FFEDEC",color:"#D0342C"},
      atencion:{emoji:"🟡",label:"Atención",bg:"#FFF6E0",color:"#9a6b00"},
      aldia:{emoji:"🟢",label:"Al día",bg:"#E9F9EE",color:"#1a8a3d"},
    };
    return(
      <div style={{...s.root}}>
        <div style={{padding:"16px 16px 4px",flexShrink:0}}>
          <button onClick={()=>setVistaTuEquipo(false)} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:"#007AFF",cursor:"pointer",padding:"0 4px 8px",fontSize:14,fontWeight:600}}><ChevronLeft size={19}/>Director</button>
          <p style={{fontSize:24,margin:0,fontWeight:800,letterSpacing:-0.4}}>Tu equipo</p>
          <p style={{fontSize:12.5,color:"#55555A",margin:"4px 0 0"}}>{miembrosEmpresa.length} profesional{miembrosEmpresa.length!==1?"es":""} en {nombreEstudio||empresaPropia?.nombre}</p>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 0 24px"}}>
          <div style={{display:"flex",gap:10,margin:"16px 16px"}}>
            <div style={{flex:1,background:"#fff",border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A",borderRadius:18,padding:14}}>
              <p style={{margin:"0 0 6px",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:0.3,color:"#55555A"}}>Tiempo prom. de resolución</p>
              <p style={{margin:0,fontSize:26,fontWeight:800,letterSpacing:-0.5,color:"#7C5CFC"}}><NumeroAnimado valor={stats.diasPromEmpresa} decimales={1}/> <span style={{fontSize:14,fontWeight:600,color:"#55555A"}}>días</span></p>
            </div>
            <div style={{flex:1,background:"#fff",border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A",borderRadius:18,padding:14}}>
              <p style={{margin:"0 0 6px",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:0.3,color:"#55555A"}}>Vencidas ahora</p>
              <p style={{margin:0,fontSize:26,fontWeight:800,letterSpacing:-0.5,color:"#FF3B30"}}><NumeroAnimado valor={stats.totalVencidas}/></p>
            </div>
          </div>

          <div style={{height:1.5,background:"#E5E5EA",margin:"6px 16px 18px"}}/>

          <p style={{margin:"0 16px 10px",fontSize:11.5,fontWeight:800,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Profesionales</p>
          {stats.porProfesional.map(p=>{
            const ec=ESTADO_CFG[p.estado];
            const circ=2*Math.PI*27;
            return(
              <div key={p.usuario_id} style={{background:"#fff",borderRadius:18,padding:15,margin:"0 16px 10px",border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:ec.bg,color:ec.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0,border:`3px solid ${ec.color}`}}>{p.nombre[0]?.toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:15,fontWeight:800}}>{p.nombre}</p>
                    <p style={{margin:"2px 0 0",fontSize:11.5,color:"#55555A"}}>{p.obras.length} obra{p.obras.length!==1?"s":""}{p.obras.length>0?` · ${p.obras.map(o=>o.nombre).join(", ")}`:""}</p>
                  </div>
                  <span style={{fontSize:11,fontWeight:800,padding:"5px 11px",borderRadius:99,background:ec.bg,color:ec.color,whiteSpace:"nowrap"}}>{ec.emoji} {ec.label}</span>
                </div>
                <div style={{display:"flex",gap:16,alignItems:"center",borderTop:"1px solid #F0F0F2",paddingTop:14}}>
                  <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="27" fill="none" stroke="#F2F2F7" strokeWidth="7"/>
                      <circle cx="32" cy="32" r="27" fill="none" stroke={ec.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ-(circ*p.pctResuelto/100)} transform="rotate(-90 32 32)"/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:15,fontWeight:800,lineHeight:1}}>{p.pctResuelto}%</span>
                      <span style={{fontSize:7,color:"#8E8E93",textTransform:"uppercase",fontWeight:700}}>Resuelto</span>
                    </div>
                  </div>
                  <div>
                    <p style={{margin:0,fontSize:24,fontWeight:800,letterSpacing:-0.4}}>{p.diasProm.toFixed(1)}</p>
                    <p style={{margin:"2px 0 0",fontSize:9.5,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.3}}>Días prom. de resolución</p>
                  </div>
                </div>
                {(p.gremioCritico||p.obraCritica)&&<div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {p.gremioCritico&&<div style={{display:"flex",alignItems:"center",gap:8,background:"#FFF6E0",borderRadius:11,padding:"8px 11px"}}><span style={{fontSize:14}}>🔧</span><span style={{fontSize:12,fontWeight:700,color:"#9a6b00"}}>Oficio con más atrasos: <b style={{color:"#7a5400"}}>{p.gremioCritico[0]}</b> ({p.gremioCritico[1]})</span></div>}
                  {p.obraCritica&&<div style={{display:"flex",alignItems:"center",gap:8,background:"#FFF6E0",borderRadius:11,padding:"8px 11px"}}><span style={{fontSize:14}}>📍</span><span style={{fontSize:12,fontWeight:700,color:"#9a6b00"}}>Obra con más atrasos: <b style={{color:"#7a5400"}}>{p.obraCritica[0]}</b> ({p.obraCritica[1]})</span></div>}
                </div>}
              </div>
            );
          })}
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);setVistaTuEquipo(false);irInicio();}} onPerfil={()=>{setVistaTuEquipo(false);setVistaPerfil(true);}} />
      </div>
    );
  }

  // ─────────────────────────────
  // PERFIL
  // ─────────────────────────────
  if(vistaBitacora){
    // Arma la lista combinando lo que ya está en memoria (novedades/obras) con las entradas de bitacora_director
    const entradas=bitacoraItems.map(b=>{
      let novEncontrada=null,obraEncontrada=null;
      for(const oid in novedadesPorObra){
        const n=(novedadesPorObra[oid]||[]).find(x=>x.id===b.novedad_id);
        if(n){novEncontrada=n;obraEncontrada=obras.find(o=>o.id===oid)||obrasEmpresa.find(o=>o.id===oid);break;}
      }
      if(!novEncontrada){
        // Respaldo: buscar en la versión liviana ya cargada de obrasEmpresa (sin necesitar visitar la obra primero)
        for(const obra of [...obras,...obrasEmpresa]){
          const n=(obra.novedades||[]).find((x:any)=>x.id===b.novedad_id);
          if(n){novEncontrada={...n,fotos:n.fotos||[],comentarios:n.comentarios||[]};obraEncontrada=obra;break;}
        }
      }
      return{...b,novedad:novEncontrada,obra:obraEncontrada};
    }).filter(e=>e.novedad);
    const filtradas=entradas.filter(e=>{
      if(!buscarBitacora.trim())return true;
      const t=buscarBitacora.toLowerCase();
      return e.novedad.descripcion?.toLowerCase().includes(t)||e.obra?.nombre?.toLowerCase().includes(t)||(notasBitacora[e.id]||[]).some(n=>n.texto.toLowerCase().includes(t));
    }).sort((a,b)=>ordenBitacora==="reciente"?new Date(b.created_at).getTime()-new Date(a.created_at).getTime():new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
    const porObra:any={};
    filtradas.forEach(e=>{const key=e.obra?.nombre||"Sin obra";(porObra[key]||=[]).push(e);});

    return(
      <div style={{...s.root}}>
        <div style={{padding:"14px 16px 4px",flexShrink:0}}>
          <button onClick={()=>setVistaBitacora(false)} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:"#007AFF",cursor:"pointer",padding:"0 4px 8px",fontSize:14,fontWeight:600}}><ChevronLeft size={19}/>Director</button>
          <h1 style={{fontSize:20,margin:0,fontWeight:800,display:"flex",alignItems:"center",gap:8}}>📔 Mi Bitácora</h1>
        </div>
        <div style={{padding:"12px 16px",display:"flex",gap:8,flexShrink:0}}>
          <input value={buscarBitacora} onChange={e=>setBuscarBitacora(e.target.value)} placeholder="Buscar en mis notas..." style={{flex:1,background:"#fff",border:"1.5px solid #E5E5EA",borderRadius:12,padding:"10px 14px",fontSize:14}}/>
          <button onClick={()=>setOrdenBitacora(o=>o==="reciente"?"vieja":"reciente")} style={{background:"#fff",border:"1.5px solid #E5E5EA",borderRadius:12,padding:"10px 12px",fontSize:13,fontWeight:600,color:"#55555A",whiteSpace:"nowrap"}}>{ordenBitacora==="reciente"?"↓ Reciente":"↑ Vieja"}</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 0 24px"}}>
          {filtradas.length===0&&<p style={{textAlign:"center",color:"#55555A",fontSize:13,marginTop:30}}>Todavía no guardaste nada en tu Bitácora.</p>}
          {Object.keys(porObra).map(nombreObra=>(
            <div key={nombreObra}>
              <p style={{margin:"18px 16px 8px",fontSize:12,fontWeight:800,color:"#7C5CFC",textTransform:"uppercase",letterSpacing:0.5}}>🏗️ {nombreObra}</p>
              {porObra[nombreObra].map(e=>(
                <div key={e.id} onClick={()=>{setObraActual(e.obra);setDetalleId(e.novedad.id);setVista("detalle");setVistaBitacora(false);}}
                  style={{background:"#fff",borderRadius:16,padding:"13px 15px",margin:"0 16px 10px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",opacity:e.hablado?0.6:1}}>
                  <div style={{width:24,height:24,borderRadius:8,border:"2px solid "+(e.hablado?"#34C759":"#D9D9DE"),background:e.hablado?"#34C759":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",marginTop:2}}>{e.hablado?"✓":""}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:14.5,fontWeight:700,textDecoration:e.hablado?"line-through":"none",color:e.hablado?"#55555A":"#1C1C1E"}}>{e.novedad.descripcion}</p>
                    <p style={{margin:"2px 0 0",fontSize:11.5,color:"#55555A"}}>{e.novedad.fecha?formatFecha(e.novedad.fecha):""}</p>
                    <p style={{margin:"5px 0 0",fontSize:12.5,color:"#7A7A80"}}>💬 {(notasBitacora[e.id]||[]).length} nota{(notasBitacora[e.id]||[]).length!==1?"s":""}{(notasBitacora[e.id]||[]).length>0?` · última: "${(notasBitacora[e.id]||[]).slice(-1)[0].texto.slice(0,40)}${(notasBitacora[e.id]||[]).slice(-1)[0].texto.length>40?"...":""}"`:""}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);setVistaBitacora(false);irInicio();}} onPerfil={()=>{setVistaBitacora(false);setVistaPerfil(true);}} />
      </div>
    );
  }

  if(vistaPerfil){
    const rolInfo2=ROLES_SISTEMA.find(r=>r.id===usuarioActivo.rolSistema);
    return(
      <div style={{...s.root,background:modoOscuro?"#1C1C1E":"#F2F2F7"}}>
        <div style={{padding:"14px 12px 4px",flexShrink:0}}>
          <div style={{background:"linear-gradient(135deg,#2E3A4B,#3C4A5E)",borderRadius:20,padding:"18px 18px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:60,height:60,borderRadius:99,background:"rgba(255,255,255,0.12)",border:"2px solid rgba(255,255,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{usuarioActivo.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:20,fontWeight:800,color:"#fff"}}>{perfilForm.nombre}</p>
              <div style={{display:"flex",gap:7,alignItems:"center",marginTop:5,flexWrap:"wrap"}}>
                {rolInfo2&&<span style={{fontSize:11,fontWeight:700,color:"#fff",background:"rgba(255,255,255,0.18)",padding:"2px 9px",borderRadius:99}}>{rolInfo2.emoji} {rolInfo2.label}</span>}
                <span style={{fontSize:13,color:"rgba(255,255,255,0.65)"}}>{perfilForm.especialidad}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:18,padding:"18px 16px",flexShrink:0}}>
            {[["Nombre","nombre","Tu nombre"],["Especialidad","especialidad","Tu especialidad"]].map(([lbl,key,ph])=>(
              <div key={key}><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:"#55555A"}}>{lbl}</p>
              <input style={{...s.input,marginBottom:14,background:modoOscuro?"#3A3A3C":"#F2F2F7",color:modoOscuro?"#fff":"#1C1C1E",border:"none"}} value={perfilForm[key]} onChange={e=>setPerfilForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/></div>
            ))}
            <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:"#55555A"}}>Email</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,background:"transparent",border:"1px dashed #E0E0E5",borderRadius:12,padding:"13px 14px",marginBottom:16}}>
              <span style={{fontSize:15,color:"#55555A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{perfilForm.email}</span>
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#C7C7CC",flexShrink:0}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Google</span>
            </div>
            <button style={{...s.btnPrincipal,background:"#34C759",marginTop:0}} onClick={async()=>{setUsuarioActivo(u=>({...u,nombre:perfilForm.nombre,especialidad:perfilForm.especialidad}));if(usuarioReal){await supabase.from("usuarios").update({nombre_personalizado:perfilForm.nombre||null}).eq("id",usuarioReal.id);setNombrePersonalizado(perfilForm.nombre||"");}alert("✅ Cambios guardados");}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><CheckCircle size={16}/>Guardar cambios</span></button>
          </div>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:18,padding:"18px 16px",flexShrink:0}}>
            <p style={{margin:"0 0 4px",fontSize:15,fontWeight:800,color:modoOscuro?"#fff":"#1C1C1E"}}>Tu estudio</p>
            <p style={{margin:"0 0 14px",fontSize:12,color:"#55555A"}}>Aparece en los informes que generás. Es opcional.</p>
            <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:"#55555A"}}>Nombre del estudio</p>
            <input style={{...s.input,marginBottom:10,background:modoOscuro?"#3A3A3C":"#F2F2F7",color:modoOscuro?"#fff":"#1C1C1E",border:"none"}} value={nombreEstudioInput} onChange={e=>setNombreEstudioInput(e.target.value)} placeholder="Completar con el nombre de tu estudio" maxLength={40}/>
            <button onClick={guardarNombreEstudio} disabled={nombreEstudioInput===nombreEstudio} style={{...s.btnPrincipal,background:"#0057FF",marginTop:0,marginBottom:16,opacity:nombreEstudioInput===nombreEstudio?0.4:1}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><CheckCircle size={16}/>Guardar nombre</span></button>
            <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:"#55555A"}}>Logo</p>
            <input ref={fileRefLogo} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)subirLogoEstudio(f);}}/>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:64,height:64,borderRadius:12,background:modoOscuro?"#3A3A3C":"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",border:logoEstudioUrl?"1px solid #E5E5EA":"1.5px dashed #D0D0D5"}}>
                {logoEstudioUrl?<ImgCacheada src={logoEstudioUrl} alt="Logo" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>:<span style={{fontSize:20,color:"#C7C7CC"}}>🏢</span>}
              </div>
              <button onClick={()=>fileRefLogo.current?.click()} disabled={subiendoLogo} style={{background:modoOscuro?"#3A3A3C":"#F2F2F7",border:"none",borderRadius:12,padding:"11px 16px",fontWeight:700,cursor:"pointer",fontSize:13,color:modoOscuro?"#fff":"#1C1C1E",opacity:subiendoLogo?0.6:1}}>{subiendoLogo?"Subiendo...":logoEstudioUrl?"Cambiar logo":"Subir logo"}</button>
            </div>
            <p style={{margin:"8px 0 0",fontSize:11,color:"#C7C7CC"}}>Máximo 2MB. Se muestra tal cual es, sin recortar.</p>
          </div>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:16,padding:"16px",flexShrink:0,border:"1.5px dashed #FFB800"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:15,fontWeight:700,color:modoOscuro?"#fff":"#1C1C1E",display:"flex",alignItems:"center",gap:6}}>✨ Modo Pro (prueba)</p>
                <p style={{margin:"2px 0 0",fontSize:12,color:"#55555A"}}>Solo para testear, no cobra nada real</p>
              </div>
              <button onClick={()=>simularPro(!esProReal)} style={{flexShrink:0,width:50,height:30,borderRadius:99,border:"none",cursor:"pointer",background:esProReal?"#FFB800":"#C7C7CC",position:"relative",transition:"background 0.2s"}}>
                <span style={{position:"absolute",top:3,left:esProReal?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
              </button>
            </div>
          </div>
          <div style={{background:modoOscuro?"#2C2C2E":"#fff",borderRadius:16,overflow:"hidden",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"15px 16px",borderBottom:"1px solid #F2F2F7",cursor:"pointer"}} onClick={async()=>{if(window.confirm("¿Cerrar sesión?"))await supabase.auth.signOut();}}>
              <LogOut size={20} color="#55555A"/><p style={{margin:0,flex:1,fontSize:15,fontWeight:600,color:"#3A3A3C"}}>Cerrar sesión</p><ChevronRight size={16} color="#C7C7CC"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"15px 16px",cursor:"pointer"}} onClick={async()=>{
              if(!window.confirm("¿Eliminar tu cuenta?\n\nEsto borrará para siempre todas tus obras, novedades, comentarios y tu cuenta. Esta acción NO se puede deshacer."))return;
              if(!window.confirm("Última confirmación.\n\n¿Seguro que querés eliminar tu cuenta y todos tus datos de forma permanente?"))return;
              try{
                if(usuarioReal){
                  await supabase.from("obras").delete().eq("propietario_id",usuarioReal.id);
                  const{data:{session:ses}}=await supabase.auth.getSession();
                  const resp=await fetch(`https://kvemmluxgdlhandjpbfn.supabase.co/functions/v1/eliminar-cuenta`,{method:"POST",headers:{"Authorization":`Bearer ${ses?.access_token}`,"Content-Type":"application/json"}});
                  if(!resp.ok)console.warn("La función de borrado de cuenta aún no está disponible");
                }
                await supabase.auth.signOut();
                alert("Tu cuenta y tus datos fueron eliminados.");
              }catch(e){alert("Hubo un problema al eliminar la cuenta. Escribinos a soporte@fixgo.ar");}
            }}>
              <Trash2 size={20} color="#FF3B30"/><p style={{margin:0,flex:1,fontSize:15,fontWeight:600,color:"#FF3B30"}}>Eliminar cuenta</p>
            </div>
          </div>
          <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",marginBottom:8}}>Fixgo · Versión 1.0.0</p>
        </div>
        {offlineBannerJSX}
        <NavBar tabActiva="perfil" onTab={(k)=>{setVistaPerfil(false);setTabActiva(k);}} onPerfil={()=>{}} />
      </div>
    );
  }

  // ─────────────────────────────
  // ALERTAS
  // ─────────────────────────────
  if(tabActiva==="alertas"&&vistaRaiz==="inicio"){
    // Generar alertas dinámicas desde todas las obras
    const alertasDinamicas = [];
    const obrasParaAlertas=[...obras.map(o=>({...o,esDeEquipo:false,esPropia:usuarioReal?o.propietario_id===usuarioReal.id:true})),...obrasEmpresa.filter(oe=>!obras.some(o=>o.id===oe.id)).map(oe=>({...oe,esDeEquipo:true,esPropia:false,novedades:(oe.novedades||[]).map(n=>({...n,fechaLimite:n.fecha_limite}))}))];
    obrasParaAlertas.forEach(obra => {
      const novs = obra.novedades||novedadesPorObra[obra.id] || [];
      novs.forEach(nov => {
        if (nov.resuelta) return;
        const d = diasRestantes(nov.fechaLimite);
        // Vencida (lo más grave: ya pasó la fecha)
        if (d !== null && d < 0) {
          alertasDinamicas.push({ key:`venc-${nov.id}`, tipo:"vencida",
            texto:`Vencida hace ${Math.abs(d)} ${Math.abs(d)===1?"día":"días"} — ${nov.descripcion}`,
            sub:`${obra.nombre} · ${nov.responsable}`, obraId:obra.id, novId:nov.id, orden:0, esDeEquipo:obra.esDeEquipo, esPropia:obra.esPropia });
        }
        // Vence hoy (todavía no está vencida, pero es momento de resolverla ya)
        else if (d === 0) {
          alertasDinamicas.push({ key:`hoy-${nov.id}`, tipo:"urgente",
            texto:`Vence hoy — ${nov.descripcion}`,
            sub:`${obra.nombre} · ${nov.responsable}`, obraId:obra.id, novId:nov.id, orden:1, esDeEquipo:obra.esDeEquipo, esPropia:obra.esPropia });
        }
        // Marcadas URGENTE (aunque la fecha sea futura o no tenga)
        else if (nov.prioridad === 0) {
          alertasDinamicas.push({ key:`urg-${nov.id}`, tipo:"urgente",
            texto:`Urgente — ${nov.descripcion}`,
            sub:`${obra.nombre} · ${nov.responsable}`, obraId:obra.id, novId:nov.id, orden:2, esDeEquipo:obra.esDeEquipo, esPropia:obra.esPropia });
        }
      });
    });
    alertasDinamicas.sort((a,b)=>a.orden-b.orden);
    const alertasFiltradas=filtroObraAlertas?alertasDinamicas.filter(a=>a.obraId===filtroObraAlertas.id):alertasDinamicas;

    const irAAlerta = (alerta) => {
      const obra = obras.find(o=>o.id===alerta.obraId)||obrasEmpresa.find(o=>o.id===alerta.obraId);
      if (!obra) return;
      setObraActual(obra);
      setVistaRaiz("obra");
      setDetalleId(alerta.novId);
      setVista("detalle");
      const novReal=(novedadesPorObra[alerta.obraId]||[]).find(n=>n.id===alerta.novId);
      setComentariosAbiertos((novReal?.comentarios||[]).length>0);
      setTabActiva("obras");
      // Traer los datos COMPLETOS de la obra (fotos, comentarios, sector) si todavía no están cargados —
      // la versión liviana usada para armar las alertas no alcanza para mostrar el detalle ni la lista.
      if(usuarioReal&&typeof obra.id==="string"&&(!novedadesPorObra[obra.id]||novedadesPorObra[obra.id].length===0)){
        supabase.from("novedades").select("*,comentarios(*)").eq("obra_id",obra.id).then(({data:novs})=>{
          if(novs){setNovedadesPorObra(p=>({...p,[obra.id]:novs.map(n=>({...n,fotos:n.fotos||[],ocultoCapataz:n.oculto_capataz||false,selloDirector:n.sello_director||null,estadoAprobacion:n.estado_aprobacion||null,autorId:n.autor_id||null,fechaLimite:n.fecha_limite||"",fecha:n.created_at?n.created_at.slice(0,10):"",comentarios:(n.comentarios||[]).map(c=>({texto:c.texto,audioUrl:c.audio_url||null,audioDuracion:c.audio_duracion||null,autorId:c.autor_id,ts:new Date(c.created_at).getTime()}))}))}))}
        });
      }
    };

    return(
      <div style={s.root}>
        <div style={{padding:"14px 12px 4px",flexShrink:0}}>
          {filtroObraAlertas&&<button onClick={()=>{setFiltroObraAlertas(null);if(origenDirectorCategoria){setVistaDirectorCategoria(origenDirectorCategoria);setOrigenDirectorCategoria(null);}else{setTabActiva("obras");}}} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:"#007AFF",cursor:"pointer",padding:"0 4px 8px",fontSize:14,fontWeight:600}}><ChevronLeft size={19}/>Director</button>}
          <div style={{background:"linear-gradient(135deg,#2E3A4B,#3C4A5E)",borderRadius:20,padding:"20px 18px"}}>
            <p style={{margin:0,fontSize:24,fontWeight:900,color:"#fff",display:"flex",alignItems:"center",gap:9}}><Bell size={22}/>Urgencias</p>
            <p style={{margin:"5px 0 0",fontSize:13,color:"rgba(255,255,255,0.6)"}}>
              {filtroObraAlertas?`${filtroObraAlertas.nombre} · `:""}{(()=>{
                const nU=alertasFiltradas.filter(a=>a.tipo==="urgente").length;
                const nV=alertasFiltradas.filter(a=>a.tipo==="vencida").length;
                if(nU===0&&nV===0)return"Todo en orden";
                const partes=[];
                if(nU>0)partes.push(`${nU} urgente${nU!==1?"s":""}`);
                if(nV>0)partes.push(`${nV} vencida${nV!==1?"s":""}`);
                return partes.join(" · ");
              })()}
            </p>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
          {alertasFiltradas.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#55555A"}}>
              <p style={{fontSize:44,margin:0}}>✅</p> 
              <p style={{fontSize:17,fontWeight:600,margin:"12px 0 6px",color:"#3A3A3C"}}>Todo al dia</p> 
              <p style={{fontSize:14,margin:0}}>No hay novedades urgentes ni vencidas</p>
            </div>
          )}
          {(()=>{
            const propias=alertasFiltradas.filter(a=>!a.esDeEquipo&&a.esPropia);
            const tareas=alertasFiltradas.filter(a=>!a.esDeEquipo&&!a.esPropia);
            const deEquipo=alertasFiltradas.filter(a=>a.esDeEquipo);
            const Tarjeta=(a)=>{
              const esVencida=a.tipo==="vencida";
              const colorTipo=esVencida?"#B8720A":"#FF3B30";
              return(
              <button key={a.key} onClick={()=>irAAlerta(a)}
                style={{background:"#fff",borderRadius:16,padding:"14px 16px",display:"flex",gap:12,
                  alignItems:"center",
                  border:"none",width:"100%",textAlign:"left",cursor:"pointer",
                  outline:"none",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                <span style={{width:36,height:36,borderRadius:10,background:`${colorTipo}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{esVencida?<Clock size={19} color={colorTipo}/>:<AlertTriangle size={19} color={colorTipo}/>}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:14,fontWeight:700,color:"#1C1C1E",lineHeight:1.35}}>{a.texto}</p>
                  <p style={{margin:"3px 0 0",fontSize:12,color:"#55555A"}}>{a.sub}</p>
                </div>
                <ChevronRight size={18} color="#C7C7CC" style={{flexShrink:0}}/>
              </button>
              );
            };
            // Si hay un filtro por obra puntual (viniendo de Director), no hace falta separar en secciones
            if(filtroObraAlertas||(deEquipo.length===0&&tareas.length===0)){
              return alertasFiltradas.map(Tarjeta);
            }
            return(<>
              {propias.length>0&&<>
                <p style={{margin:"4px 0 2px",fontSize:11.5,fontWeight:800,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5,display:"flex",alignItems:"center",gap:7}}><span style={{width:9,height:9,borderRadius:"50%",background:"#2E3A4B",flexShrink:0}}/>Tus obras</p>
                {propias.map(Tarjeta)}
              </>}
              {tareas.length>0&&<>
                <p style={{margin:"12px 0 2px",fontSize:11.5,fontWeight:800,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5,display:"flex",alignItems:"center",gap:7}}><span style={{width:9,height:9,borderRadius:"50%",background:"#E8A23D",flexShrink:0}}/>Tus tareas</p>
                {tareas.map(Tarjeta)}
              </>}
              {deEquipo.length>0&&<>
                <p style={{margin:"12px 0 2px",fontSize:11.5,fontWeight:800,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5,display:"flex",alignItems:"center",gap:7}}><span style={{width:9,height:9,borderRadius:"50%",background:"#7C5CFC",flexShrink:0}}/>Obras de tu equipo</p>
                {deEquipo.map(Tarjeta)}
              </>}
            </>);
          })()}
        </div>
        {offlineBannerJSX}
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
      <div style={s.root} onTouchStart={onSwipeInicioStart} onTouchEnd={onSwipeInicioEnd}>
        <div style={{padding:"14px 12px 4px",flexShrink:0}}>
          <div style={{background:"linear-gradient(135deg,#2E3A4B,#3C4A5E)",borderRadius:20,padding:"22px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                <button onClick={()=>setVistaInfoApp(true)} style={{width:44,height:44,borderRadius:13,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0}}>
                  <img src="/Fixgo_logo.png" alt="Fixgo" style={{width:44,height:44,objectFit:"cover",borderRadius:13}}/>
                </button>
                <p style={{margin:0,fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>Fixgo</p>
              </div>
              <p style={{margin:0,fontSize:14,color:"rgba(255,255,255,0.5)"}}>Gestión simple de novedades</p>
            </div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{textAlign:"left"}}><p style={{margin:0,fontSize:13,fontWeight:700,color:"#fff"}}>{usuarioActivoReal.nombre}</p></div>
            </div>
          </div>
        </div>
        <div style={{padding:"10px 16px 14px",flexShrink:0,display:"flex",gap:8}}>
          <button onClick={()=>cambiarVistaHome("mias")} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:vistaHome==="mias"?"#2E3A4B":"#F2F2F7",color:vistaHome==="mias"?"#fff":"#55555A",fontSize:13,fontWeight:700,cursor:"pointer"}}>Mis obras</button>
          <button onClick={()=>cambiarVistaHome("tareas")} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:vistaHome==="tareas"?"#2E3A4B":"#F2F2F7",color:vistaHome==="tareas"?"#fff":"#55555A",fontSize:13,fontWeight:700,cursor:"pointer"}}>Mis tareas</button>
          <button onClick={()=>{if(!esVersionPro){setModalProObra(true);return;}cambiarVistaHome("director");}} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:vistaHome==="director"?"#2E3A4B":"#F2F2F7",color:vistaHome==="director"?"#fff":"#55555A",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{!esVersionPro&&<span style={{fontSize:11}}>🔒</span>}Director</button>
        </div>
        {vistaHome==="director"?(
        <div key={vistaHome} style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12,animation:(direccionTab===1?"slideInDcha":"slideInIzq")+" 0.22s ease-out"}}>
          {!empresaPropia?(
            <div style={{background:"#fff",borderRadius:20,padding:"28px 20px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <p style={{fontSize:38,margin:"0 0 10px"}}>🧭</p>
              <p style={{margin:"0 0 6px",fontSize:17,fontWeight:800,color:"#1C1C1E"}}>Todavía no armaste tu equipo de profesionales</p>
              <p style={{margin:"0 0 18px",fontSize:13,color:"#55555A"}}>Sabé al instante quién está al día y quién necesita ayuda.</p>
              <button onClick={()=>{setNombreEmpresaInput(nombreEstudio);setModalCrearEmpresa(true);}} style={{...s.btnPrincipal,background:"#2E3A4B"}}>Crear mi equipo de profesionales</button>
            </div>
          ):miembrosEmpresa.length===0?(
            <div style={{background:"#fff",borderRadius:20,padding:"28px 20px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <p style={{fontSize:38,margin:"0 0 10px"}}>🧭</p>
              <p style={{margin:"0 0 6px",fontSize:17,fontWeight:800,color:"#1C1C1E"}}>{nombreEstudio||empresaPropia.nombre} todavía no tiene profesionales</p>
              <p style={{margin:"0 0 18px",fontSize:13,color:"#55555A"}}>Invitá a los profesionales de tu equipo para verlos acá.</p>
              <button onClick={()=>setModalInvitarArq(true)} style={{...s.btnPrincipal,background:"#2E3A4B"}}>Invitar profesional</button>
            </div>
          ):(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <p style={{margin:0,fontSize:19,fontWeight:800,color:"#1C1C1E",flex:1}}>{nombreEstudio||empresaPropia.nombre}</p>
                <button onClick={()=>setVistaBitacora(true)} style={{background:"#F7F5FF",color:"#7C5CFC",border:"1.5px solid #D9CFFF",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>📔 Bitácora</button>
                <button onClick={()=>setModalInvitarArq(true)} style={{background:"#2E3A4B",color:"#fff",border:"none",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>+ Invitar</button>
              </div>

              {(()=>{
                const stats=calcularStatsEmpresa();
                const PASTILLAS=[
                  {key:"urgencias",emoji:"🔥",label:"Urgentes",valor:stats.totalUrgentes,color:"#D0342C",bg:"linear-gradient(160deg,#FFF4F3,#FFE3E1)",sub:`en ${stats.porObraUrgentes.length} obra${stats.porObraUrgentes.length!==1?"s":""}`,preview:stats.previewUrgentes,onTap:()=>setVistaDirectorCategoria("urgencias")},
                  {key:"novedades",emoji:"📋",label:"Novedades",valor:stats.totalNovedades,color:"#6B4FD9",bg:"linear-gradient(160deg,#F8F5FF,#EDE6FF)",sub:`en ${stats.porObraNovedades.length} obra${stats.porObraNovedades.length!==1?"s":""}`,preview:stats.previewNovedades,onTap:()=>setVistaDirectorCategoria("novedades")},
                  {key:"vencidas",emoji:"⏰",label:"Vencidas",valor:stats.totalVencidas,color:"#B8720A",bg:"linear-gradient(160deg,#FFF9EF,#FDECD1)",sub:`en ${stats.porObraVencidas.length} obra${stats.porObraVencidas.length!==1?"s":""}`,preview:stats.previewVencidas,onTap:()=>setVistaDirectorCategoria("vencidas")},
                  {key:"resueltas",emoji:"✓",label:"Resueltas",valor:stats.totalResueltas,color:"#1a8a3d",bg:"linear-gradient(160deg,#F2FBF5,#DFF6E6)",sub:`en ${stats.porObraResueltas.length} obra${stats.porObraResueltas.length!==1?"s":""}`,preview:stats.previewResueltas,onTap:()=>setVistaDirectorCategoria("resueltas")},
                ];
                const NIVELES_EMPRESA=[
                  {id:"diamante",label:"Diamante",color:"#5AC8FA",icon:"💎",min:0,max:2,siguiente:null},
                  {id:"oro",label:"Oro",color:"#E5A400",icon:"🥇",min:2,max:4,siguiente:2},
                  {id:"plata",label:"Plata",color:"#9A9A9A",icon:"🥈",min:4,max:7,siguiente:4},
                  {id:"bronce",label:"Bronce",color:"#CD7F32",icon:"🥉",min:7,max:Infinity,siguiente:7},
                ];
                const nivelEmpresa=stats.totalNovedades>0?(NIVELES_EMPRESA.find(n=>stats.antiguedadPromEmpresa>=n.min&&stats.antiguedadPromEmpresa<n.max)||NIVELES_EMPRESA[3]):NIVELES_EMPRESA[0];
                return<>
                <div style={{background:"#fff",borderRadius:18,padding:16,border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A"}}>
                  <p onClick={()=>setVistaTuEquipo(true)} style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#1C1C1E",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>Tu equipo <span style={{color:"#8E8E93",fontSize:16}}>›</span></p>
                  <div style={{background:"#EAF6F1",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"#DCEFC7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{nivelEmpresa.icon}</div>
                    <div style={{flex:1}}>
                      <p style={{margin:0,fontSize:11,fontWeight:700,color:"#3B6D11",textTransform:"uppercase",letterSpacing:0.3}}>Eficiencia general · {nivelEmpresa.label}</p>
                      <p style={{margin:"2px 0 0"}}><span style={{fontSize:20,fontWeight:800,color:"#1C1C1E"}}>{stats.antiguedadPromEmpresa<1?"<1":stats.antiguedadPromEmpresa.toFixed(1)}</span> <span style={{fontSize:13,fontWeight:600,color:"#3B6D11"}}>días promedio de resolución</span></p>
                    </div>
                  </div>
                  <div style={{height:6,background:"#E5E5EA",borderRadius:3,overflow:"hidden",marginBottom:16}}>
                    <div style={{width:`${nivelEmpresa.siguiente===null?100:Math.max(4,Math.min(100,Math.round(((nivelEmpresa.max===Infinity?nivelEmpresa.min*2:nivelEmpresa.max)-stats.antiguedadPromEmpresa)/((nivelEmpresa.max===Infinity?nivelEmpresa.min*2:nivelEmpresa.max)-nivelEmpresa.min)*100)))}%`,height:"100%",background:"#3DAE8C"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div onClick={()=>setVistaDirectorCategoria("obrasActivas")} style={{background:"#F7F8F8",borderRadius:12,padding:12,cursor:"pointer"}}>
                      <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#55555A"}}>Obras activas</p>
                      <p style={{margin:0,fontSize:18,fontWeight:800,color:"#1C1C1E"}}>{stats.obrasActivas}</p>
                    </div>
                    <div onClick={()=>setVistaProfesionales(true)} style={{background:"#F7F8F8",borderRadius:12,padding:12,cursor:"pointer"}}>
                      <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#55555A"}}>Profesionales activos</p>
                      <p style={{margin:0,fontSize:18,fontWeight:800,color:"#1C1C1E"}}>{stats.profesionalesActivos}</p>
                    </div>
                    <div onClick={()=>setVistaDirectorCategoria("sinResponsable")} style={{background:"#F7F8F8",borderRadius:12,padding:12,cursor:"pointer"}}>
                      <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#55555A"}}>Novedades sin responsable asignado</p>
                      <p style={{margin:0,fontSize:18,fontWeight:800,color:"#1C1C1E"}}>{stats.novedadesSinResponsable}</p>
                    </div>
                    <div onClick={()=>setVistaDirectorCategoria("novedades")} style={{background:"#F7F8F8",borderRadius:12,padding:12,cursor:"pointer"}}>
                      <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#55555A"}}>Total de novedades</p>
                      <p style={{margin:0,fontSize:18,fontWeight:800,color:"#1C1C1E"}}>{stats.totalNovedades}</p>
                    </div>
                  </div>
                </div>
                {PASTILLAS.map(p=>(
                  <div key={p.key} onClick={p.onTap} style={{borderRadius:18,padding:18,border:"2px solid #1C1C1E",boxShadow:"0 2px 8px #0000000A",background:p.bg,cursor:"pointer"}}>
                    <p style={{margin:"0 0 4px",fontSize:12.5,fontWeight:800,textTransform:"uppercase",letterSpacing:0.4,color:p.color}}>{p.emoji} {p.label}</p>
                    <p style={{margin:0,fontSize:42,fontWeight:800,letterSpacing:-1.5,lineHeight:1,color:p.color}}><NumeroAnimado valor={p.valor}/></p>
                    <p style={{margin:"6px 0 0",fontSize:11.5,color:"#55555A",fontWeight:600}}>{p.sub}</p>
                    {p.preview.slice(0,3).map((it,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 2px 0",marginTop:9,borderTop:i===0?"1px solid rgba(0,0,0,0.07)":"none"}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                        <span style={{fontSize:12.5,fontWeight:600,color:"#1C1C1E",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.texto}</span>
                        <span style={{fontSize:10.5,color:"#55555A",fontWeight:600,flexShrink:0}}>{it.obraNombre}</span>
                      </div>
                    ))}
                  </div>
                ))}
                </>;
              })()}

              {invitacionesEmpresaPendientes.length>0&&<div style={{background:"#FFF9E8",borderRadius:14,padding:"12px 14px"}}>
                <p style={{margin:"0 0 6px",fontSize:12,fontWeight:700,color:"#B8860B"}}>⏳ {invitacionesEmpresaPendientes.length} invitación{invitacionesEmpresaPendientes.length!==1?"es":""} pendiente{invitacionesEmpresaPendientes.length!==1?"s":""}</p>
                {invitacionesEmpresaPendientes.map(inv=>(
                  <div key={inv.codigo} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0"}}>
                    <span style={{fontSize:12,color:"#55555A"}}>Esperando que acepte...</span>
                    <button onClick={()=>cancelarInvitacionEmpresa(inv.codigo)} style={{background:"none",border:"none",cursor:"pointer"}}><Trash2 size={14} color="#C7C7CC"/></button>
                  </div>
                ))}
              </div>}
            </>
          )}
        </div>
        ):(
        <div key={vistaHome} style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12,animation:(direccionTab===1?"slideInDcha":"slideInIzq")+" 0.22s ease-out"}}>
          {cargandoDatos?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:"48px 16px"}}>
              <span style={{width:28,height:28,border:"3px solid #E5E5EA",borderTopColor:"#2E3A4B",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>
              <p style={{margin:0,fontSize:14,fontWeight:600,color:"#55555A"}}>Cargando tus obras…</p>
            </div>
          ):(<>
          {vistaHome==="tareas"&&obras.filter(obra=>{
            const esDuenoF=usuarioReal?obra.propietario_id===usuarioReal.id:true;
            const miRolObraF=esDuenoF?"profesional":((obra.equipo||[]).find(m=>m.uid===miId)?.rolEnObra||"operario");
            const esGestorObraF=esDuenoF||miRolObraF==="co_profesional";
            return !esGestorObraF;
          }).length===0&&(()=>{
            // Si la persona gestiona al menos una obra (Profesional/Director/Colega), el mensaje es distinto
            // al de un Operario recién invitado que todavía no tiene nada — memoria pendiente 04/08 (UX Writer, opción A)
            const esGestorDeAlgunaObra=obras.some(obra=>{
              const esDuenoF=usuarioReal?obra.propietario_id===usuarioReal.id:true;
              const miRolObraF=esDuenoF?"profesional":((obra.equipo||[]).find(m=>m.uid===miId)?.rolEnObra||"operario");
              return esDuenoF||miRolObraF==="co_profesional";
            });
            return(
              <div style={{textAlign:"center",padding:"50px 20px",color:"#55555A"}}>
                <p style={{fontSize:44,margin:0}}>📋</p>
                {esGestorDeAlgunaObra?(<>
                  <p style={{fontSize:17,fontWeight:700,margin:"12px 0 6px",color:"#3A3A3C"}}>No tenés tareas asignadas a tu nombre</p>
                  <p style={{fontSize:14,margin:0}}>Las novedades de tus obras las administrás desde "Mis obras" o "Director".</p>
                </>):(<>
                  <p style={{fontSize:17,fontWeight:700,margin:"12px 0 6px",color:"#3A3A3C"}}>Aún no tenés tareas asignadas</p>
                  <p style={{fontSize:14,margin:0}}>Cuando un profesional te sume a una obra, la vas a ver acá.</p>
                </>)}
              </div>
            );
          })()}
          {obras.filter(obra=>{
            const esDuenoF=usuarioReal?obra.propietario_id===usuarioReal.id:true;
            const miRolObraF=esDuenoF?"profesional":((obra.equipo||[]).find(m=>m.uid===miId)?.rolEnObra||"operario");
            const esGestorObraF=esDuenoF||miRolObraF==="co_profesional";
            return vistaHome==="tareas"?!esGestorObraF:esGestorObraF;
          }).map(obra=>{
            const novs=novedadesPorObra[obra.id]||[];
            const pend=novs.filter(n=>!n.resuelta).length;
            const venc=novs.filter(n=>!n.resuelta&&diasRestantes(n.fechaLimite)<0).length;
            const res=novs.filter(n=>n.resuelta).length;
            const prog=novs.length>0?Math.round((res/novs.length)*100):0;
            const equipo=(obra.equipo||[]).filter((m,i,arr)=>arr.findIndex(x=>x.uid===m.uid)===i).map((m,idx)=>{const esDueno=usuarioReal&&m.uid===usuarioReal.id;const nombre=m.nombre||(esDueno?usuarioActivoReal.nombre:null)||"?";return{uid:m.uid,nombre,color:colorPorIndice(idx)};});
            const esDueno=usuarioReal?obra.propietario_id===usuarioReal.id:true;
            const miRolObra=esDueno?"profesional":((obra.equipo||[]).find(m=>m.uid===miId)?.rolEnObra||"operario");
            const esGestorObra=esDueno||miRolObra==="co_profesional";
            const tieneCoProfesional=(obra.equipo||[]).some(m=>m.rolEnObra==="co_profesional");
            const enModoDirector=!!obra.empresa_id;
            const miEspecialidad=(obra.equipo||[]).find(m=>m.uid===miId)?.especialidad||"";
            const colorPorPct=(p:number)=>{let r=0,g=0,b=0;if(p<=50){const t=p/50;r=255;g=Math.round(59+(184-59)*t);b=Math.round(48+(0-48)*t);}else{const t=(p-50)/50;r=Math.round(255+(52-255)*t);g=Math.round(184+(199-184)*t);b=Math.round(0+(89-0)*t);}return`rgb(${r},${g},${b})`;};
            const animId=`anim${obra.id}`.replace(/[^a-zA-Z0-9]/g,'');

            // Círculo reutilizable con color sólido dinámico
            const CirculoProg=({radius,pct,size,labelOutside,label}:{radius:number,pct:number,size:number,labelOutside?:boolean,label?:string})=>{
              const circ=2*Math.PI*radius;
              const offset=circ-(pct/100)*circ;
              const color=colorPorPct(pct);
              const sw=size>100?14:8;
              return(
                <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
                  <style>{`@keyframes ${animId}r{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${offset}}}`}</style>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:size*0.88,height:size*0.88,borderRadius:"50%",boxShadow:`0 0 16px 6px ${color}40`}}/>
                  <svg style={{position:"absolute",top:0,left:0}} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <g transform={`rotate(-90,${size/2},${size/2})`}>
                      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#F0F0F0" strokeWidth={sw}/>
                      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{animation:`${animId}r 1.4s cubic-bezier(0.34,1.05,0.64,1) forwards`}}/>
                    </g>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <p style={{margin:0,fontSize:size>100?42:18,fontWeight:900,color:"#1C1C1E",lineHeight:1,letterSpacing:-1}}>{pct}%</p>
                    {!labelOutside&&<p style={{margin:"2px 0 0",fontSize:size>100?9:7,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.6}}>{esDueno?"resuelto":"mis novedades"}</p>}
                  </div>
                </div>
              );
            };

            return(
              <button key={obra.id} style={{...s.cardObra,padding:"16px 18px",textAlign:"left"}} onClick={()=>{if(obra._menuAbierto){obra._menuAbierto=false;return;}irObra(obra);}}
                onContextMenu={e=>{e.preventDefault();obra._menuAbierto=true;setMenuObra(obra.id);}}
                onPointerDown={e=>{const t=setTimeout(()=>{obra._menuAbierto=true;setMenuObra(obra.id);},600);e.currentTarget._t=t;}} onPointerUp={e=>clearTimeout(e.currentTarget._t)} onPointerLeave={e=>clearTimeout(e.currentTarget._t)}
                onTouchStart={e=>{e.currentTarget._tt=setTimeout(()=>{obra._menuAbierto=true;setMenuObra(obra.id);},600);}} onTouchEnd={e=>clearTimeout(e.currentTarget._tt)} onTouchMove={e=>clearTimeout(e.currentTarget._tt)}>

                {esGestorObra?(
                  // ── TARJETA DUEÑO / CO-PROFESIONAL ──
                  <>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                      {esDueno?<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#1C1C1E",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,textTransform:"uppercase",letterSpacing:0.3}}>⭐ Tu obra</span>
                      :<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#0057FF",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,textTransform:"uppercase",letterSpacing:0.3}}>🤝 Colega</span>}
                      {tieneCoProfesional&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#0057FF12",color:"#0057FF",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,textTransform:"uppercase",letterSpacing:0.3}}>🤝 En equipo</span>}
                      {enModoDirector&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#2E3A4B12",color:"#2E3A4B",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,textTransform:"uppercase",letterSpacing:0.3}}>🧭 En Modo Director</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                      <CirculoProg radius={38} pct={prog} size={90}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:"0 0 2px",fontSize:16,fontWeight:800,color:"#1C1C1E"}}>{obra.nombre}</p>
                        <p style={{margin:"0 0 10px",fontSize:11,color:"#55555A",display:"flex",alignItems:"center",gap:3}}><MapPin size={11} color="#55555A"/>{obra.direccion||"Sin dirección"}</p>
                        <div style={{display:"flex",gap:6}}>
                          <div style={{flex:1,background:"#FFF3E8",borderRadius:10,padding:"6px 4px",textAlign:"center"}}><p style={{margin:0,fontSize:16,fontWeight:900,color:"#FF6B00"}}>{pend}</p><p style={{margin:"1px 0 0",fontSize:9,fontWeight:600,color:"#FF9040",textTransform:"uppercase"}}>Pend.</p></div>
                          <div style={{flex:1,background:"#FFF0EE",borderRadius:10,padding:"6px 4px",textAlign:"center"}}><p style={{margin:0,fontSize:16,fontWeight:900,color:"#FF3B30"}}>{venc}</p><p style={{margin:"1px 0 0",fontSize:9,fontWeight:600,color:"#FF6B60",textTransform:"uppercase"}}>Venc.</p></div>
                          <div style={{flex:1,background:"#EDFAF1",borderRadius:10,padding:"6px 4px",textAlign:"center"}}><p style={{margin:0,fontSize:16,fontWeight:900,color:"#28A745"}}>{res}</p><p style={{margin:"1px 0 0",fontSize:9,fontWeight:600,color:"#34C759",textTransform:"uppercase"}}>Res.</p></div>
                        </div>
                      </div>
                    </div>
                    {equipo.length>0&&<div onClick={e=>{e.stopPropagation();irObra(obra);setVistaEquipo(true);}} style={{borderTop:"1px solid #F2F2F7",paddingTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer"}}>
                      <div style={{display:"flex"}}>{equipo.slice(0,5).map((u,i)=><div key={u.uid||i} style={{width:24,height:24,borderRadius:"50%",border:"2px solid #fff",background:u.color||colorPorIndice(i),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",marginRight:-7}}>{u.nombre?u.nombre[0].toUpperCase():""}</div>)}</div>
                      <span style={{marginLeft:12,fontSize:12,fontWeight:700,color:"#636366"}}>{equipo.length} miembro{equipo.length!==1?"s":""}</span>
                      <span style={{fontSize:10,color:"#C7C7CC"}}>→ Mi equipo</span>
                    </div>}
                  </>
                ):(
                  // ── TARJETA MIEMBRO ──
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                    <CirculoProg radius={28} pct={prog} size={72} labelOutside/>
                    <p style={{margin:0,fontSize:9,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.4,whiteSpace:"nowrap"}}>Mis novedades</p>
                  </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{marginBottom:6}}>
                        <span style={{display:"inline-flex",alignItems:"center",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,textTransform:"uppercase",letterSpacing:0.3,background:miRolObra==="capataz"?"#FFF3E8":"#F0EEFF",color:miRolObra==="capataz"?"#FF6B00":"#6B4FA8"}}>{miEspecialidad||miRolObra}</span>
                      </div>
                      <p style={{margin:"0 0 2px",fontSize:15,fontWeight:800,color:"#1C1C1E"}}>{obra.nombre}</p>
                      <p style={{margin:"0 0 8px",fontSize:11,color:"#55555A",display:"flex",alignItems:"center",gap:3}}><MapPin size={10} color="#55555A"/>{obra.direccion||"Sin dirección"}</p>
                      <div style={{display:"flex",gap:6}}>
                        <div style={{background:"#FFF3E8",borderRadius:8,padding:"5px 8px",textAlign:"center"}}><p style={{margin:0,fontSize:14,fontWeight:900,color:"#FF6B00"}}>{pend}</p><p style={{margin:"1px 0 0",fontSize:9,fontWeight:600,color:"#FF9040",textTransform:"uppercase"}}>Pend.</p></div>
                        <div style={{background:"#EDFAF1",borderRadius:8,padding:"5px 8px",textAlign:"center"}}><p style={{margin:0,fontSize:14,fontWeight:900,color:"#28A745"}}>{res}</p><p style={{margin:"1px 0 0",fontSize:9,fontWeight:600,color:"#34C759",textTransform:"uppercase"}}>Res.</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          {vistaHome==="mias"&&<button style={{width:"100%",border:"1.5px solid #C7C7CC",background:"#fff",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"18px",cursor:"pointer"}}
            onClick={()=>{if(!esVersionPro&&misObrasPropias>=1)setModalProObra(true);else setModalNuevaObra(true);}}>
            <Plus size={22} color="#636366"/><span style={{fontSize:16,fontWeight:600,color:"#636366"}}>Nueva obra</span>
          </button>}
          </>)}
        </div>
        )}
        {offlineBannerJSX}
        {vistaHome==="tareas"&&avisoObraEliminadaJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);}} onPerfil={()=>setVistaPerfil(true)} />

        {modalNuevaObra&&<div style={s.overlay} onClick={()=>setModalNuevaObra(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 16px",fontSize:18,fontWeight:700}}>Nueva obra</p><input style={s.input} placeholder="Nombre de la obra *" value={nuevaObraForm.nombre} onChange={e=>setNuevaObraForm(f=>({...f,nombre:e.target.value}))}/><input style={{...s.input,marginTop:10}} placeholder="Dirección (opcional)" value={nuevaObraForm.direccion} onChange={e=>setNuevaObraForm(f=>({...f,direccion:e.target.value}))}/><div style={{display:"flex",gap:10,marginTop:20}}><button style={{...s.btnPrincipal,background:"#E5E5EA",color:"#1C1C1E",flex:1}} onClick={()=>setModalNuevaObra(false)}>Cancelar</button><button style={{...s.btnPrincipal,flex:1,opacity:(nuevaObraForm.nombre.trim()&&!guardando)?1:0.4}} disabled={guardando} onClick={crearObra}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{guardando?<><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Creando...</>:<><CheckCircle size={15}/>Crear</>}</span></button></div></div></div>}
        {modalCrearEmpresa&&<div style={s.overlay} onClick={()=>setModalCrearEmpresa(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}>
          <p style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>{empresaPropia?"Renombrar tu equipo":"Crear tu equipo de profesionales"}</p>
          <p style={{margin:"0 0 16px",fontSize:13,color:"#55555A"}}>{empresaPropia?"Este nombre lo ven los profesionales que invites.":"Así vas a poder invitar profesionales y ver todas sus obras."}</p>
          <input style={s.input} placeholder="Nombre de tu equipo/estudio" value={nombreEmpresaInput} onChange={e=>setNombreEmpresaInput(e.target.value)} maxLength={40} autoFocus/>
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button style={{...s.btnPrincipal,background:"#E5E5EA",color:"#1C1C1E",flex:1}} onClick={()=>setModalCrearEmpresa(false)}>Cancelar</button>
            <button style={{...s.btnPrincipal,flex:1,opacity:nombreEmpresaInput.trim()?1:0.4,background:"#2E3A4B"}} disabled={!nombreEmpresaInput.trim()} onClick={crearEmpresa}>{empresaPropia?"Guardar":"Crear"}</button>
          </div>
        </div></div>}
        {modalInvitarArq&&<div style={s.overlay} onClick={()=>{setModalInvitarArq(false);setLinkEmpresaGenerado("");}}><div style={s.modal} onClick={e=>e.stopPropagation()}>
          <p style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>Invitar profesional</p>
          <p style={{margin:"0 0 16px",fontSize:13,color:"#55555A"}}>Generá un link para sumarlo a "{empresaPropia?.nombre}"</p>
          {!linkEmpresaGenerado?(
            <button style={{...s.btnPrincipal,background:"#2E3A4B",opacity:generandoLinkEmpresa?0.5:1}} disabled={generandoLinkEmpresa} onClick={generarInvitacionEmpresa}>
              {generandoLinkEmpresa?"Generando...":"Generar link de invitación"}
            </button>
          ):(<>
            <div style={{background:"#34C75915",borderRadius:14,padding:"14px",marginBottom:16,textAlign:"center"}}>
              <p style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"#34C759"}}>✅ Link generado</p>
              <p style={{margin:0,fontSize:12,color:"#636366",wordBreak:"break-all"}}>{linkEmpresaGenerado}</p>
            </div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(linkEmpresaGenerado)}`} alt="QR de invitación" style={{width:180,height:180,borderRadius:12,border:"1px solid #E5E5EA"}}/>
            </div>
            <p style={{margin:"0 0 12px",textAlign:"center",fontSize:12,color:"#55555A"}}>El invitado puede escanear este QR con la cámara del teléfono</p>
            <button style={{...s.btnPrincipal,background:"#25D366",marginBottom:10}} onClick={()=>{const msg=`Te invito a sumarte a mi equipo de profesionales en Fixgo 👷\n\n${linkEmpresaGenerado}`;window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");}}>Compartir por WhatsApp</button>
            <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>{setModalInvitarArq(false);setLinkEmpresaGenerado("");}}>Cerrar</button>
          </>)}
        </div></div>}
        {modalProObra&&<div style={s.overlay} onClick={()=>setModalProObra(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:16}}><span style={{fontSize:40}}>🔒</span><p style={{margin:"8px 0 4px",fontSize:20,fontWeight:800}}>Pasá a Fixgo Pro</p><p style={{margin:"0 0 14px",fontSize:14,color:"#636366"}}>Con el plan gratuito podés tener 1 obra. Con Pro desbloqueás todo:</p></div>
              <div style={{textAlign:"left",marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
                {["Obras ilimitadas","Modo offline","Marcar y dibujar sobre fotos","Informe de novedades registradas","Gestión en equipo para una misma obra","Modo Director para estar al tanto de las obras que lleva tu equipo"].map(t=>(
                  <div key={t} style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:"#1C1C1E",fontWeight:600}}><span style={{color:"#34C759",fontSize:16}}>✓</span>{t}</div>
                ))}
              </div>
              <button style={{...s.btnPrincipal,background:"#FFB800",color:"#1C1C1E",marginBottom:10}}>🚀 Activar versión Pro</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalProObra(false)}>Ahora no</button></div></div>}
        {menuObra&&(()=>{const obraM=obras.find(o=>o.id===menuObra);const esDuenoM=usuarioReal&&obraM?.propietario_id===usuarioReal.id;const miRolM=(obraM?.equipo||[]).find(m=>m.uid===miId)?.rolEnObra;const esGestorM=esDuenoM||miRolM==="co_profesional";return(
        <div style={s.overlay} onClick={()=>setMenuObra(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 16px",fontSize:17,fontWeight:700}}>Opciones de obra</p>
          {esGestorM&&<button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10}} onClick={()=>{setEditarObraForm({nombre:obraM?.nombre||"",direccion:obraM?.direccion||""});setModalEditarObra(menuObra);setMenuObra(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}><Edit2 size={15}/>Editar datos de la obra</span></button>}
          {esGestorM&&misEmpresasComoMiembro.length>0&&<button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10}} onClick={()=>{setModalCompartirObra(menuObra);setMenuObra(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}>Compartir con equipo</span></button>}
          {esDuenoM&&<button style={{...s.btnPrincipal,background:"#FF3B3010",color:"#FF3B30",marginBottom:10}} onClick={()=>{setConfirmarEliminarObra(menuObra);setMenuObra(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}><Trash2 size={15}/>Eliminar obra</span></button>}
          <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setMenuObra(null)}>Cancelar</button>
        </div></div>
        );})()}
        {modalCompartirObra&&(()=>{const obraSel=obras.find(o=>o.id===modalCompartirObra);return(
          <div style={s.overlay} onClick={()=>setModalCompartirObra(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}>
            <p style={{margin:"0 0 4px",fontSize:17,fontWeight:700}}>Compartir "{obraSel?.nombre}"</p>
            <p style={{margin:"0 0 16px",fontSize:12.5,color:"#55555A"}}>Elegí con qué empresa la ve el director. Por defecto, tus obras son privadas.</p>
            {misEmpresasComoMiembro.map(em=>{
              const activo=obraSel?.empresa_id===em.empresa_id;
              return(
                <button key={em.empresa_id} onClick={()=>{compartirObraConEmpresa(modalCompartirObra,activo?null:em.empresa_id);setModalCompartirObra(null);}}
                  style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:14,border:`2px solid ${activo?"#2E3A4B":"#E5E5EA"}`,background:activo?"#2E3A4B10":"#fff",cursor:"pointer",marginBottom:8,fontFamily:"inherit"}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#1C1C1E"}}>{em.empresas?.nombre}</span>
                  <span style={{width:44,height:26,borderRadius:99,background:activo?"#2E3A4B":"#C7C7CC",position:"relative",flexShrink:0}}>
                    <span style={{position:"absolute",top:3,left:activo?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.15s"}}/>
                  </span>
                </button>
              );
            })}
            <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A",marginTop:8}} onClick={()=>setModalCompartirObra(null)}>Listo</button>
          </div></div>
        );})()}
        {confirmarEliminarObra&&<div style={s.overlay} onClick={()=>setConfirmarEliminarObra(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar esta obra?</p><p style={{margin:0,fontSize:14,color:"#55555A"}}>Se borrarán todas sus novedades. No se puede deshacer.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>eliminarObra(confirmarEliminarObra)}><span style={{display:"flex",alignItems:"center",gap:6}}><Trash2 size={15}/>Sí, eliminar</span></button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminarObra(null)}>Cancelar</button></div></div>}
        {modalEditarObraJSX}
      </div>
    );
  }

  // ─────────────────────────────
  // TAREAS DE UN MIEMBRO
  // ─────────────────────────────
  if(vistaEquipo&&miembroSel){
    const u=miembroSel;
    const esProfesional=u.rolEnObra==="profesional";
    const tareasU=esProfesional?novedades:novedades.filter(n=>n.responsable===u.especialidad);
    const pend=tareasU.filter(n=>!n.resuelta);
    const res=tareasU.filter(n=>n.resuelta);
    const rolU=ROLES_SISTEMA.find(r=>r.id===u.rolEnObra);
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>{setVistaEquipo(false);setMiembroSel(null);}},{label:"Equipo",onClick:()=>setMiembroSel(null)},{label:u.nombre}]} />
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#fff",borderRadius:18,padding:"16px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:99,background:u.color||colorPastelDe(u.uid),flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff"}}>{u.nombre?u.nombre[0].toUpperCase():""}</div>
            <div style={{flex:1}}><p style={{margin:0,fontWeight:800,fontSize:18,color:"#1C1C1E"}}>{u.nombre}</p>
              <div style={{display:"flex",gap:6,alignItems:"center",marginTop:4}}>{rolU&&<span style={{fontSize:11,fontWeight:700,color:rolU.color,background:rolU.color+"15",padding:"2px 8px",borderRadius:99}}>{rolU.emoji} {rolU.label}</span>}<span style={{fontSize:13,color:"#55555A"}}>{u.especialidad}</span></div>
              <p style={{margin:"6px 0 0",fontSize:12,color:"#55555A"}}>{esProfesional?"Resumen general de la obra":"Tareas asignadas a "+u.especialidad}</p>
            </div>
          </div>
          {/* TELÉFONO */}
          {u.telefono?(
            <div style={{background:"#fff",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12}}>
              <Phone size={16} color="#55555A" style={{flexShrink:0}}/>
              <span style={{flex:1,fontSize:15,fontWeight:600,color:"#1C1C1E"}}>{u.telefono}</span>
              <button onClick={()=>window.open(`https://wa.me/${u.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${u.nombre}! Te escribo por Fixgo.`)}`,"_blank")} style={{width:34,height:34,borderRadius:10,background:"#25D36615",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </button>
              <button onClick={()=>window.open(`tel:${u.telefono.replace(/\s/g,"")}`,"_blank")} style={{width:34,height:34,borderRadius:10,background:"#007AFF15",border:"none",cursor:"pointer",fontSize:16}}>📞</button>
              <button onClick={()=>{setModalTelefono({uid:u.uid,nombre:u.nombre});setTelInput(u.telefono||"");}} style={{width:34,height:34,borderRadius:10,background:"#F2F2F7",border:"none",cursor:"pointer",fontSize:14}}>✏️</button>
            </div>
          ):(
            puedeGestionar&&<button onClick={()=>{setModalTelefono({uid:u.uid,nombre:u.nombre});setTelInput("");}} style={{width:"100%",background:"#FFF3E8",border:"none",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontFamily:"inherit"}}>
              <Phone size={16} color="#FF6B00" style={{flexShrink:0}}/>
              <span style={{flex:1,fontSize:14,fontWeight:600,color:"#FF6B00",textAlign:"left"}}>Sin teléfono — Agregar para contacto rápido</span>
              <span style={{fontSize:12,fontWeight:700,color:"#fff",background:"#FF6B00",padding:"3px 10px",borderRadius:99}}>+ Agregar</span>
            </button>
          )}
          <div style={{display:"flex",gap:10}}>
            {[["#FF6B00",pend.length,"Pendientes"],["#34C759",res.length,"Resueltas"],["#1C1C1E",tareasU.length,"Total"]].map(([col,val,lbl])=>(
              <div key={lbl} style={{flex:1,background:"#fff",borderRadius:14,padding:"12px",textAlign:"center"}}><p style={{margin:0,fontSize:26,fontWeight:800,color:col}}>{val}</p><p style={{margin:0,fontSize:12,color:"#55555A"}}>{lbl}</p></div>
            ))}
          </div>
          {puedeGestionar&&!esProfesional&&(
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,background:"#1C1C1E",color:"#fff",border:"none",borderRadius:14,padding:"14px 10px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}} onClick={()=>{setForm({...FORM_INICIAL,responsable:u.especialidad||RESPONSABLES[0],responsableUsuarioId:u.uid});setMiembroSel(null);setVistaEquipo(false);setVista("nueva");}}><Plus size={16}/>Nueva novedad</button>
              <button style={{flex:1,background:"#fff",color:"#1C1C1E",border:"1.5px solid #E0E0E5",borderRadius:14,padding:"14px 10px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}} onClick={()=>setAsignarTareaMiembro(u)}><User size={16}/>Asignar novedad</button>
            </div>
          )}
          {[["⏳ Pendientes",pend],["✅ Resueltas",res]].map(([titulo,lista])=>lista.length>0&&(
            <div key={titulo}><p style={{margin:"4px 0 8px",fontSize:13,color:"#55555A",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{titulo}</p>
              {lista.map(nov=>{const pri=PRIORIDADES[nov.prioridad];const badge=estadoBadge(nov);return(
                <button key={nov.id} style={{width:"100%",background:"#fff",borderRadius:16,border:"1px solid #ECECEF",padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",marginBottom:8,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",opacity:nov.resuelta?0.65:1}}
                  onClick={()=>{setDetalleId(nov.id);setMiembroSel(null);setVistaEquipo(false);setVista("detalle");setComentariosAbiertos((nov.comentarios||[]).length>0);}}>
                  <div style={{display:"flex",alignItems:"center"}}>
                    {nov.fotos.length>0
                      ?<div style={{position:"relative",width:72,height:72,flexShrink:0,marginLeft:11}}>
                         <img src={nov.fotos[0]} alt="" style={{width:72,height:72,objectFit:"cover",display:"block",borderRadius:10}}/>
                         {nov.fotos.length>1&&<span style={{position:"absolute",right:4,bottom:4,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:99,lineHeight:1}}>+{nov.fotos.length-1}</span>}
                       </div>
                      :<div style={{width:72,height:72,background:"#F2F2F7",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,marginLeft:11}}><Camera size={26} color="#C7C7CC"/></div>}
                    <div style={{padding:"11px 12px",flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:nov.resuelta?"#34C759":nov.estadoAprobacion==="pendiente"?"#9333EA":pri.color,flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontSize:11.5,fontWeight:800,letterSpacing:0.2,color:nov.resuelta?"#34C759":nov.estadoAprobacion==="pendiente"?"#9333EA":pri.color}}>{nov.resuelta?"RESUELTO":nov.estadoAprobacion==="pendiente"?"EN APROBACIÓN":pri.label}</span>
                        {!nov.resuelta&&!nov.estadoAprobacion&&badge&&<span style={{fontSize:11.5,fontWeight:600,color:"#55555A"}}>· {badge.label.replace(/^[^\s]+\s/,"")}</span>}
                      </div>
                      <p style={{margin:"0 0 3px",fontSize:15,fontWeight:700,color:"#1C1C1E",lineHeight:1.25}}>{nov.descripcion}</p>
                      <p style={{margin:0,fontSize:12,color:"#636366"}}><MapPin size={12} style={{display:"inline",verticalAlign:"middle"}}/> {nov.sector}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",paddingRight:10}}><ChevronRight size={18} color="#C7C7CC"/></div>
                  </div>
                </button>
              );})}
            </div>
          ))}
          {tareasU.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#55555A"}}><p style={{fontSize:40,margin:0}}>🎉</p><p style={{fontSize:16,fontWeight:600,margin:"10px 0 4px"}}>{esProfesional?"La obra no tiene novedades":"Sin novedades asignadas"}</p></div>}
        </div>
        {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {asignarTareaMiembro&&(()=>{
          const sinAsignar=novedades.filter(n=>!n.resuelta&&!n.responsable_usuario_id);
          return(
            <div style={s.overlay} onClick={()=>setAsignarTareaMiembro(null)}>
              <div style={{...s.modal,maxHeight:"75vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
                <p style={{margin:"0 0 4px",fontSize:17,fontWeight:700}}>Asignar novedad a {asignarTareaMiembro.nombre}</p>
                <p style={{margin:"0 0 14px",fontSize:13,color:"#55555A"}}>Tareas pendientes sin responsable asignado</p>
                <button style={{width:"100%",background:"#1C1C1E",color:"#fff",border:"none",borderRadius:14,padding:"12px 14px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:14,fontWeight:700}}
                  onClick={()=>{const m=asignarTareaMiembro;setForm(f=>({...FORM_INICIAL,responsable:m.especialidad||RESPONSABLES[0],responsableUsuarioId:m.uid}));setAsignarTareaMiembro(null);setMiembroSel(null);setVistaEquipo(false);setVista("nueva");}}>
                  <Plus size={16}/>Cargar novedad nueva para {asignarTareaMiembro.nombre}
                </button>
                <div style={{overflowY:"auto",flex:1,margin:"0 -20px",padding:"0 20px"}}>
                  {sinAsignar.length===0
                    ?<p style={{textAlign:"center",color:"#55555A",fontSize:14,padding:"20px 0"}}>Todas las novedades ya tienen un responsable asignado.</p>
                    :sinAsignar.map(nov=>{const pri=PRIORIDADES[nov.prioridad];return(
                      <button key={nov.id} style={{width:"100%",background:"#fff",border:"1px solid #ECECEF",borderRadius:14,padding:"12px 14px",marginBottom:8,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}
                        onClick={()=>asignarRapido(nov.id,{responsable:asignarTareaMiembro.especialidad||"",usuarioId:asignarTareaMiembro.uid})}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:pri.color,flexShrink:0,display:"inline-block"}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:0,fontSize:15,fontWeight:700,color:"#1C1C1E"}}>{nov.descripcion}</p>
                          {nov.sector&&<p style={{margin:"2px 0 0",fontSize:12,color:"#55555A"}}>{nov.sector}</p>}
                        </div>
                        <ChevronRight size={16} color="#C7C7CC"/>
                      </button>
                    );})}
                </div>
                <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A",marginTop:12}} onClick={()=>setAsignarTareaMiembro(null)}>Cancelar</button>
              </div>
            </div>
          );
        })()}
        {modalTelefono&&<div style={s.overlay} onClick={()=>setModalTelefono(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>Teléfono de {modalTelefono.nombre}</p><p style={{margin:"0 0 14px",fontSize:14,color:"#55555A"}}>Para llamarlo o mandarle WhatsApp desde la app.</p>{typeof navigator!=="undefined"&&(navigator as any).contacts&&<button type="button" onClick={async()=>{try{const c=await(navigator as any).contacts.select(["tel"],{multiple:false});if(c&&c[0]?.tel?.[0]){setTelInput(c[0].tel[0].replace(/\s/g,""));}}catch(e){}}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>📱</span>Elegir de mis contactos</button>}<input style={{...s.input,marginBottom:16}} type="text" placeholder="+54 9 351 555 0000" value={telInput} onChange={e=>setTelInput(e.target.value)} inputMode="tel"/><button style={{...s.btnPrincipal,background:"#1C1C1E",marginBottom:10}} onClick={guardarTelefono}>Guardar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalTelefono(null)}>Cancelar</button></div></div>}
      </div>
    );
  }

  // ─────────────────────────────
  // EQUIPO
  // ─────────────────────────────
  if(vistaEquipo){
    const obraPend=novedades.filter(n=>!n.resuelta).length;
    const obraRes=novedades.filter(n=>n.resuelta).length;
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>setVistaEquipo(false)},{label:"Equipo"}]} />
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Resumen de la obra</p>
            <div style={{display:"flex",gap:10}}>
              {[["#FF6B00",obraPend,"Pendientes","pendientes"],["#34C759",obraRes,"Resueltas","resueltas"],["#1C1C1E",novedades.length,"Total","todas"]].map(([col,val,lbl,filtroVal])=>(
                <div key={lbl} onClick={()=>{setFiltro(filtroVal);setVistaEquipo(false);setVista("lista");}} style={{flex:1,background:"#fff",borderRadius:14,padding:"14px 8px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"pointer"}}><p style={{margin:0,fontSize:24,fontWeight:800,color:col}}>{val}</p><p style={{margin:"2px 0 0",fontSize:11,color:"#55555A"}}>{lbl}</p></div>
              ))}
            </div>
          </div>
          <div>
            <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Integrantes ({equipoObra.length})</p>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              {equipoObra.map(u=>{
                const esProf=u.rolEnObra==="profesional";
                const pend=esProf?obraPend:novedades.filter(n=>n.responsable===u.especialidad&&!n.resuelta).length;
                const res=esProf?obraRes:novedades.filter(n=>n.responsable===u.especialidad&&n.resuelta).length;
                const r=ROLES_SISTEMA.find(r=>r.id===u.rolEnObra);
                const colorRol=r?.color||"#0057FF";
                const editando=editandoNombreId===u.uid;
                const tareasTxt=esProf?"Dueño de la obra":pend>0?`${pend} ${pend===1?"novedad pendiente":"novedades pendientes"}`:"Sin novedades asignadas";
                return(
                  <div key={u.id} style={{display:"flex",alignItems:"center",gap:13,padding:"14px 15px",background:"#fff",borderRadius:16,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                    <div onClick={()=>!editando&&setMiembroSel(u)} style={{width:46,height:46,borderRadius:99,background:u.color||colorPastelDe(u.uid),flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff"}}>{u.nombre?u.nombre[0].toUpperCase():""}</div>
                    <div style={{flex:1,minWidth:0}}>
                      {editando?(
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <input autoFocus value={nombreEditado} onChange={e=>setNombreEditado(e.target.value)} placeholder="Nombre o empresa" maxLength={40}
                            style={{flex:1,padding:"8px 10px",borderRadius:10,border:"1.5px solid #0057FF",fontSize:15,outline:"none",fontFamily:"inherit",minWidth:0}}/>
                          <button onClick={()=>guardarNombreIntegrante(u.uid)} style={{background:"#34C759",border:"none",borderRadius:10,padding:"8px 10px",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>✓</button>
                          <button onClick={()=>{setEditandoNombreId(null);setNombreEditado("");}} style={{background:"#F2F2F7",border:"none",borderRadius:10,padding:"8px 10px",color:"#55555A",cursor:"pointer",fontSize:13}}>✕</button>
                        </div>
                      ):(<>
                        <p onClick={()=>setMiembroSel(u)} style={{margin:0,fontWeight:700,fontSize:16,color:"#1C1C1E",display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>{u.nombre}{puedeGestionar&&(u.rolEnObra!=="profesional"||u.uid===miId)&&<button onClick={e=>{e.stopPropagation();setEditandoNombreId(u.uid);setNombreEditado(u.nombre||"");}} style={{background:"none",border:"none",cursor:"pointer",color:"#0057FF",padding:0,display:"flex",alignItems:"center"}}><Edit2 size={13}/></button>}{u.uid===miId&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:"#1C1C1E",padding:"1px 7px",borderRadius:99}}>Vos</span>}</p>
                        <p style={{margin:"3px 0 0",fontSize:13,color:"#55555A"}}>{r&&<span style={{color:colorRol,fontWeight:600}}>{r.label}</span>}{r&&" · "}{u.especialidad}{!esProf&&" · "}{!esProf&&<span style={{color:pend>0?"#FF8A3D":"#55555A",fontWeight:pend>0?600:400}}>{tareasTxt}</span>}</p>
                      </>)}
                      {!editando&&u.telefono&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:7}}>
                        <button onClick={e=>{e.stopPropagation();window.open(`https://wa.me/${u.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${u.nombre}! Te escribo por Fixgo.`)}`,"_blank");}} style={{width:26,height:26,borderRadius:8,background:"#25D36615",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                        <button onClick={e=>{e.stopPropagation();window.open(`tel:${u.telefono.replace(/\s/g,"")}`,"_blank");}} style={{width:26,height:26,borderRadius:8,background:"#007AFF15",border:"none",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>📞</button>
                        <span style={{fontSize:11.5,color:"#55555A",fontWeight:500}}>{u.telefono}</span>
                      </div>}
                    </div>
                    {!editando&&u.uid!==miId&&u.rolEnObra!=="profesional"&&(miRolEnObra==="profesional"||(miRolEnObra==="capataz"&&u.rolEnObra==="operario"&&u.invitadoPor===miId))&&<button onClick={()=>setConfirmarEliminarMiembro(u)} style={{background:"none",border:"none",cursor:"pointer",flexShrink:0,padding:8,display:"flex",alignItems:"center"}}><Trash2 size={17} color="#C7C7CC"/></button>}
                  </div>
                );
              })}
            </div>
          </div>
          {invitacionesPendientes.length>0&&<div>
            <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Invitaciones pendientes ({invitacionesPendientes.length})</p>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              {invitacionesPendientes.map(inv=>(
                <div key={inv.codigo} style={{background:"#fff",borderRadius:16,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"#FF950015",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:17}}>⏳</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:14.5,fontWeight:700,color:"#1C1C1E"}}>{inv.nombre||(inv.rol==="capataz"?"Capataz":inv.rol==="co_profesional"?"Colega":inv.especialidad)||"Sin nombre"}</p>
                    <p style={{margin:"1px 0 0",fontSize:12,color:"#55555A"}}>{inv.rol==="capataz"?"Capataz":inv.rol==="co_profesional"?"Colega":`Operario · ${inv.especialidad}`} · Esperando que acepte</p>
                  </div>
                  <button onClick={()=>reenviarInvitacion(inv)} style={{background:"#F2F2F7",border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0}}><Share2 size={15} color="#1C1C1E"/></button>
                  <button onClick={()=>cancelarInvitacion(inv.codigo)} style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"flex",alignItems:"center",flexShrink:0}}><Trash2 size={16} color="#C7C7CC"/></button>
                </div>
              ))}
            </div>
          </div>}
          <button style={{width:"100%",border:"2px dashed #C7C7CC",background:"transparent",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"18px",cursor:"pointer"}} onClick={()=>abrirModalInvitar()}>
            <Plus size={22} color="#55555A"/><span style={{fontSize:16,fontWeight:600,color:"#55555A"}}>Invitar integrante</span>
          </button>
        </div>
        {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {confirmarEliminarMiembro&&<div style={s.overlay} onClick={()=>setConfirmarEliminarMiembro(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar a {confirmarEliminarMiembro.nombre} del equipo?</p><p style={{margin:0,fontSize:14,color:"#55555A"}}>Dejará de ver esta obra y sus novedades. Las novedades que tenía asignadas quedarán sin responsable.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>eliminarMiembro(confirmarEliminarMiembro)}><span style={{display:"flex",alignItems:"center",gap:6}}><Trash2 size={15}/>Sí, eliminar</span></button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminarMiembro(null)}>Cancelar</button></div></div>}
        {modalInvitarJSX}
        {asignacionRapidaJSX}
        {editorDibujo&&<ModalEditorDibujo src={editorDibujo.src} onGuardar={guardarDesdeEditorDibujo} onCerrar={()=>{const cont=editorDibujo.onListo;const original=editorDibujo.src;setEditorDibujo(null);cont?.(original);}}/>}
        {modalEditarObraJSX}
        {modalPeriodoJSX}
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
    // Por prioridad (solo pendientes)
    const pendientes=novedades.filter(n=>!n.resuelta);
    // Por sector (solo pendientes)
    const sectoresMap={};
    pendientes.forEach(n=>{sectoresMap[n.sector]=(sectoresMap[n.sector]||0)+1;});
    const porSector=Object.entries(sectoresMap).map(([nombre,cant])=>({nombre,cant})).sort((a,b)=>b.cant-a.cant);
    const maxSec=Math.max(1,...porSector.map(s=>s.cant));
    // Por gremio (solo pendientes)
    const gremioMap={};
    pendientes.forEach(n=>{gremioMap[n.responsable]=(gremioMap[n.responsable]||0)+1;});
    const porGremio=Object.entries(gremioMap).map(([nombre,cant])=>({nombre,cant})).sort((a,b)=>b.cant-a.cant);
    const maxGre=Math.max(1,...porGremio.map(g=>g.cant));
    // Foco: la novedad más urgente pendiente (prioridad 0 primero, luego vencidas)
    const urgentesPend=pendientes.filter(n=>n.prioridad===0);
    const sectorFoco=porSector.length>0?porSector[0]:null;
    // Evolución: resueltas por semana (últimas 4 semanas)
    const ahora=Date.now();
    const semanas=[3,2,1,0].map(s=>{
      const desde=ahora-(s+1)*7*864e5, hasta=ahora-s*7*864e5;
      const cant=novedades.filter(n=>{if(!n.resuelta||!n.fecha)return false;const t=new Date(n.fecha+"T00:00:00").getTime();return t>=desde&&t<hasta;}).length;
      return {label:s===0?"Esta":`S-${s}`,cant};
    });
    const maxSem=Math.max(1,...semanas.map(s=>s.cant));
    // Calcular criticidad por gremio: urgentes vencidas > urgentes > pendientes
    const porGremioEnriquecido=porGremio.map(g=>{
      const novsGremio=novedades.filter(n=>!n.resuelta&&(n.responsable===g.nombre||equipoObra.find(m=>m.uid===n.responsable_usuario_id)?.especialidad===g.nombre));
      const urgVenc=novsGremio.filter(n=>n.prioridad===0&&estadoBadge(n)?.tipo==="urgente");
      const urgentes=novsGremio.filter(n=>n.prioridad===0);
      const miembro=equipoObra.find(m=>m.especialidad===g.nombre);
      return{...g,urgVenc:urgVenc.length,urgentes:urgentes.length,miembro};
    }).sort((a,b)=>b.urgVenc-a.urgVenc||b.urgentes-a.urgentes||b.cant-a.cant);
    // Antigüedad promedio de pendientes → sistema de niveles (Bronce/Plata/Oro/Platino)
    const hoyTs=Date.now();
    const antiguedadPromedio=pendientes.length>0?pendientes.reduce((acc,n)=>{const t=n.created_at?new Date(n.created_at).getTime():hoyTs;return acc+(hoyTs-t)/864e5;},0)/pendientes.length:0;
    const NIVELES=[
      {id:"diamante",label:"Diamante",color:"#5AC8FA",icon:"💎",min:0,max:2,siguiente:null},
      {id:"oro",label:"Oro",color:"#E5A400",icon:"🥇",min:2,max:4,siguiente:2},
      {id:"plata",label:"Plata",color:"#9A9A9A",icon:"🥈",min:4,max:7,siguiente:4},
      {id:"bronce",label:"Bronce",color:"#CD7F32",icon:"🥉",min:7,max:Infinity,siguiente:7},
    ];
    const nivelActual=pendientes.length===0?NIVELES[0]:NIVELES.find(n=>antiguedadPromedio>=n.min&&antiguedadPromedio<n.max)||NIVELES[3];
    const capNivel=nivelActual.max===Infinity?nivelActual.min*2:nivelActual.max;
    const progresoNivel=nivelActual.siguiente===null?100:Math.max(4,Math.min(100,Math.round((capNivel-antiguedadPromedio)/(capNivel-nivelActual.min)*100)));
    return(
      <div style={s.root}>
        <div style={{background:"#fff",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #F0F0F0",flexShrink:0}}>
          <button onClick={()=>setVistaStats(false)} style={{width:34,height:34,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0}}><ChevronLeft size={20} color="#1C1C1E"/></button>
          <p style={{margin:0,fontSize:16,fontWeight:700,color:"#1C1C1E",flex:1}}>Estadísticas</p>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>

          {/* INFORME INTERNO — solo Profesional o Colega, nunca Capataz/Operario — ARRIBA DE TODO */}
          {(miRolEnObra==="profesional"||miRolEnObra==="co_profesional")&&(esVersionPro?(
            <button onClick={()=>setModalPeriodoReporte(true)} style={{display:"flex",alignItems:"center",gap:14,width:"100%",background:"#fff",border:"none",borderRadius:20,cursor:"pointer",padding:"18px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",textAlign:"left"}}>
              <div style={{width:44,height:44,borderRadius:14,background:"#0057FF15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><ClipboardList size={20} color="#0057FF"/></div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:15,fontWeight:800,color:"#1C1C1E"}}>Generar informe</p>
                <p style={{margin:"1px 0 0",fontSize:12,color:"#55555A"}}>Informe ejecutivo del período, listo para guardar en PDF</p>
              </div>
              <ChevronRight size={18} color="#C7C7CC"/>
            </button>
          ):(
            <div style={{background:"linear-gradient(135deg,#1C1C1E,#2C2C2E)",borderRadius:16,padding:"20px 16px"}}>
              <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#FFB800",textTransform:"uppercase"}}>✨ Versión Pro</p>
              <p style={{margin:"0 0 14px",fontSize:17,fontWeight:800,color:"#fff"}}>Informes de obra</p>
              <button style={{width:"100%",padding:"13px",borderRadius:12,background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>setModalPro(true)}><span style={{display:"flex",alignItems:"center",gap:8}}><ClipboardList size={17}/>Informe interno (uso propio)</span><span style={{fontSize:11,background:"#FFB800",color:"#1C1C1E",padding:"2px 8px",borderRadius:99,fontWeight:800}}>PRO</span></button>
            </div>
          ))}

          {/* POR GREMIO */}
          <div style={{background:"#fff",borderRadius:20,padding:"18px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <p style={{margin:"0 0 14px",fontSize:11,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Por oficio</p>
            {porGremioEnriquecido.length===0
              ?<div style={{background:"#EDFAF1",borderRadius:14,padding:"20px",textAlign:"center"}}><p style={{fontSize:28,margin:"0 0 8px"}}>✅</p><p style={{fontSize:14,fontWeight:600,color:"#34C759"}}>Sin problemas por oficio</p></div>
              :porGremioEnriquecido.map(g=>{
                const tieneUrgVenc=g.urgVenc>0;
                const tieneUrg=g.urgentes>0;
                return(
                  <div key={g.nombre} style={{background:"#F9F9F9",borderRadius:14,padding:"14px",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:40,height:40,borderRadius:12,background:g.miembro?.color||"#E5E5EA",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>
                        {g.miembro?.nombre?.[0]?.toUpperCase()||"🔧"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:15,fontWeight:800,color:"#1C1C1E"}}>{g.miembro?.nombre?`${g.miembro.nombre} · ${g.nombre}`:g.nombre}</p>
                        <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                          {tieneUrgVenc&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,background:"#FF3B3015",color:"#FF3B30"}}>● {g.urgVenc} urgente{g.urgVenc!==1?"s":""} vencida{g.urgVenc!==1?"s":""}</span>}
                          {!tieneUrgVenc&&tieneUrg&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,background:"#FF6B0015",color:"#FF6B00"}}>● {g.urgentes} urgente{g.urgentes!==1?"s":""}</span>}
                          {!tieneUrgVenc&&!tieneUrg&&<span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,background:"#F2F2F7",color:"#55555A"}}>● {g.cant} pendiente{g.cant!==1?"s":""}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:12}}>
                      {g.miembro?.telefono?(
                        <>
                          <button onClick={()=>{const t=generarResumenGremio(g.nombre);window.open(`https://wa.me/${g.miembro.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(t)}`,"_blank");}} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:"#25D36615",color:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </button>
                          <button onClick={()=>window.open(`tel:${g.miembro.telefono.replace(/\s/g,"")}`,"_blank")} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:"#007AFF15",color:"#007AFF",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>📞 Llamar</button>
                        </>
                      ):(
                        g.miembro&&<button onClick={()=>{setModalTelefono({uid:g.miembro.uid,nombre:g.miembro.nombre});setTelInput("");}} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:"#F2F2F7",color:"#55555A",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>+ Agregar teléfono</button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* POR SECTOR */}
          {porSector.length>0&&<div style={{background:"#fff",borderRadius:20,padding:"18px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <p style={{margin:"0 0 14px",fontSize:11,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Por sector</p>
            {porSector.map((sec,i)=>{
              const novsS=novedades.filter(n=>!n.resuelta&&n.sector===sec.nombre);
              const urgS=novsS.filter(n=>n.prioridad===0).length;
              const barColor=urgS>0?"#FF3B30":novsS.some(n=>n.prioridad===1)?"#FF9500":"#C7C7CC";
              const pct=pendientes.length>0?Math.round(sec.cant/pendientes.length*100):0;
              return(
                <button key={sec.nombre} onClick={()=>{setFiltroSector(sec.nombre);setFiltro("pendientes");setVistaStats(false);setVista("lista");}} style={{width:"100%",border:"none",background:"none",padding:"12px 0",borderBottom:i<porSector.length-1?"1px solid #F2F2F7":"none",textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:14,fontWeight:700,color:"#1C1C1E",flex:1}}>{sec.nombre}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"#1C1C1E"}}>{sec.cant} · {pct}%</span>
                  </div>
                  <div style={{height:8,background:"#F2F2F7",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:99}}/>
                  </div>
                  <p style={{margin:"5px 0 0",fontSize:10,color:"#C7C7CC"}}>Tocá para filtrar → {sec.nombre}</p>
                </button>
              );
            })}
          </div>}

          {/* NIVEL DE RITMO */}
          <div style={{background:"#fff",borderRadius:20,padding:"20px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <p style={{margin:"0 0 14px",fontSize:11,fontWeight:700,color:"#55555A",textTransform:"uppercase",letterSpacing:0.5}}>Nivel de ritmo</p>
            {novedades.length===0?(
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:26}}>📋</div>
                <div>
                  <p style={{margin:0,fontSize:16,fontWeight:800,color:"#55555A"}}>Todavía sin nivel</p>
                  <p style={{margin:"2px 0 0",fontSize:12,color:"#55555A"}}>Cargá tu primera novedad para empezar a medir tu ritmo</p>
                </div>
              </div>
            ):(<>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:nivelActual.color+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:28}}>
                  {nivelActual.icon}
                </div>
                <div>
                  <p style={{margin:0,fontSize:18,fontWeight:900,color:nivelActual.color}}>Nivel {nivelActual.label}</p>
                  <p style={{margin:"2px 0 0",fontSize:12,color:"#55555A"}}>{pendientes.length===0?"¡No tenés nada pendiente ahora mismo!":`Tus pendientes esperan ${antiguedadPromedio<1?"menos de 1 día":antiguedadPromedio.toFixed(1)+" días"} en promedio`}</p>
                </div>
              </div>
              <div style={{height:10,background:"#F2F2F7",borderRadius:99,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${progresoNivel}%`,background:nivelActual.color,borderRadius:99}}/>
              </div>
              <p style={{margin:0,fontSize:11,color:"#55555A"}}>
                {nivelActual.siguiente===null
                  ?"¡Estás en el nivel más alto! Seguí así 🔥"
                  :`Bajá de ${nivelActual.siguiente} días de espera para subir de nivel`}
              </p>
            </>)}
          </div>

          {/* URGENTES */}
          {(urgentesPend.length>0||contadores.vencidas>0)&&(
            <button onClick={()=>{setVistaStats(false);setTabActiva("alertas");irInicio();}} style={{background:"#FF3B3012",borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:12,border:"none",width:"100%",textAlign:"left",cursor:"pointer"}}>
              <span style={{width:40,height:40,borderRadius:11,background:"#FF3B3018",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertTriangle size={22} color="#FF3B30"/></span>
              <div style={{flex:1}}><p style={{margin:0,fontSize:15,fontWeight:800,color:"#FF3B30"}}>{urgentesPend.length>0?`${urgentesPend.length} urgente${urgentesPend.length!==1?"s":""} sin resolver`:`${contadores.vencidas} vencida${contadores.vencidas!==1?"s":""}`}</p><p style={{margin:"2px 0 0",fontSize:13,color:"#55555A"}}>Tocá para ver en Urgencias</p></div>
              <ChevronRight size={20} color="#FF3B30" style={{flexShrink:0,opacity:0.6}}/>
            </button>
          )}

        </div>
        {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {modalPro&&<div style={s.overlay} onClick={()=>setModalPro(false)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:16}}><span style={{fontSize:40}}>🔒</span><p style={{margin:"8px 0 4px",fontSize:20,fontWeight:800}}>Función Pro</p><p style={{margin:0,fontSize:14,color:"#55555A"}}>Los informes de obra son parte de la versión Pro.</p></div><button style={{...s.btnPrincipal,background:"#FFB800",color:"#1C1C1E",marginBottom:10}}>🚀 Activar versión Pro</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalPro(false)}>Ahora no</button></div></div>}
        {modalTelefono&&createPortal(<div style={s.overlay} onClick={()=>setModalTelefono(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>Teléfono de {modalTelefono.nombre}</p><p style={{margin:"0 0 14px",fontSize:14,color:"#55555A"}}>Para llamarlo o mandarle WhatsApp desde la app.</p>{typeof navigator!=="undefined"&&(navigator as any).contacts&&<button type="button" onClick={async()=>{try{const c=await (navigator as any).contacts.select(["tel"],{multiple:false});if(c&&c[0]?.tel?.[0]){setTelInput(c[0].tel[0].replace(/\s/g,""));}}catch(e){}}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>📱</span>Elegir de mis contactos</button>}<input style={{...s.input,marginBottom:16}} type="text" placeholder="+54 9 351 555 0000" value={telInput} onChange={e=>setTelInput(e.target.value)} inputMode="tel"/><button style={{...s.btnPrincipal,background:"#1C1C1E",marginBottom:10}} onClick={guardarTelefono}>Guardar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalTelefono(null)}>Cancelar</button></div></div>,document.body)}
        {modalPeriodoJSX}
      </div>
    );
  }

  // ─────────────────────────────
  // EDITAR NOVEDAD
  // ─────────────────────────────
  if(vista==="detalle"&&detalle&&editando&&formEdit){
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>{setEditando(false);setFormEdit(null);setVista("lista");}},{label:"Novedades",onClick:()=>{setEditando(false);setFormEdit(null);setVista("lista");}},{label:"Editar"}]} />
        <div style={{padding:"16px",flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:20,paddingBottom:24}}>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><Camera size={14}/>Fotos</span></p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {(formEdit.fotos||[]).map((f,i)=>(
                <div key={i} style={{position:"relative",width:80,height:80,flexShrink:0}}>
                  <img src={f} alt="" onClick={()=>setFotoAmpliada(f)} style={{width:80,height:80,objectFit:"cover",borderRadius:12,cursor:"pointer"}}/>
                  {esVersionPro&&<button onClick={()=>abrirEditorDibujo(f,"editar",i)} style={{position:"absolute",bottom:-7,left:-7,width:24,height:24,borderRadius:"50%",background:"#1C1C1E",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}><Edit2 size={11} color="#fff"/></button>}
                  <button onClick={()=>quitarFotoEdit(i)} style={{position:"absolute",top:-7,right:-7,width:24,height:24,borderRadius:"50%",background:"#FF3B30",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}><X size={13} color="#fff" strokeWidth={3}/></button>
                </div>
              ))}
              <input ref={fileRefEdit} type="file" accept="image/*" capture="environment" multiple style={{display:"none"}} onChange={handleFotosEdit}/>
              <button onClick={()=>fileRefEdit.current.click()} style={{width:80,height:80,flexShrink:0,borderRadius:12,border:"2px dashed #C7C7CC",background:"#F9F9FB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:3}}><Camera size={22} color="#55555A"/><span style={{fontSize:10,color:"#55555A"}}>Agregar</span></button>
            </div>
          </div>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><Edit2 size={14}/>Descripción</span></p><textarea style={s.textarea} rows={3} value={formEdit.descripcion} onChange={e=>setFormEdit(f=>({...f,descripcion:e.target.value}))}/></div>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><Zap size={14}/>Prioridad</span></p><div style={{display:"flex",gap:10}}>{PRIORIDADES.map((p,i)=><button key={i} style={{flex:1,padding:"12px 4px",borderRadius:14,border:`2px solid ${formEdit.prioridad===i?p.color:"#E5E5EA"}`,background:formEdit.prioridad===i?p.bg:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setFormEdit(f=>({...f,prioridad:i}))}><span style={{fontSize:24}}>{p.emoji}</span><span style={{fontSize:11,fontWeight:700,color:formEdit.prioridad===i?p.color:"#55555A"}}>{p.label}</span></button>)}</div></div>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><MapPin size={14}/>Sector</span></p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SECTORES.map(sec=><button key={sec} style={{padding:"9px 14px",borderRadius:20,border:`2px solid ${formEdit.sector===sec?"#007AFF":"#E5E5EA"}`,background:formEdit.sector===sec?"#007AFF15":"#fff",color:formEdit.sector===sec?"#007AFF":"#3A3A3C",fontWeight:formEdit.sector===sec?700:400,fontSize:14,cursor:"pointer"}} onClick={()=>setFormEdit(f=>({...f,sector:sec,sectorCustom:""}))}>{sec}</button>)}</div>{formEdit.sector==="Otro"&&<input style={{...s.input,marginTop:10}} placeholder="Escribí el sector..." value={formEdit.sectorCustom} onChange={e=>setFormEdit(f=>({...f,sectorCustom:e.target.value}))}/>}</div>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><User size={14}/>Responsable</span></p><p style={{margin:"-4px 0 8px",fontSize:12.5,color:"#55555A"}}>Elegí a alguien de tu equipo o un oficio genérico</p><SelectorResponsable value={formEdit.responsable} usuarioId={formEdit.responsableUsuarioId} equipo={equipoObra} onChange={({responsable,usuarioId})=>setFormEdit(f=>({...f,responsable,responsableUsuarioId:usuarioId}))} /></div>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><Calendar size={14}/>Fecha límite</span> <span style={{color:"#55555A",fontWeight:400}}>(opcional)</span></p><p style={{margin:"0 0 6px",fontSize:13,color:"#55555A"}}>Seleccioná una fecha:</p><input type="date" style={s.inputDate} value={formEdit.fechaLimite} onChange={e=>setFormEdit(f=>({...f,fechaLimite:e.target.value}))}/></div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:"#F2F2F7",borderRadius:14,padding:"14px 16px"}}>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:15,fontWeight:600,color:"#1C1C1E",display:"flex",alignItems:"center",gap:6}}><EyeOff size={15}/>Ocultar al capataz</p>
              <p style={{margin:"2px 0 0",fontSize:12,color:"#55555A"}}>Solo la verán vos y el responsable asignado.</p>
            </div>
            <button onClick={()=>setFormEdit(f=>({...f,ocultoCapataz:!f.ocultoCapataz}))} style={{flexShrink:0,width:50,height:30,borderRadius:99,border:"none",cursor:"pointer",background:formEdit.ocultoCapataz?"#0057FF":"#C7C7CC",position:"relative",transition:"background 0.2s"}}>
              <span style={{position:"absolute",top:3,left:formEdit.ocultoCapataz?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
            </button>
          </div>
          <div style={{position:"sticky",bottom:-24,background:"#F2F2F7",paddingTop:14,paddingBottom:24,marginBottom:-24,zIndex:5}}>
          <button disabled={guardando||!formEdit.descripcion.trim()} style={{...s.btnPrincipal,background:"#34C759",opacity:(guardando||!formEdit.descripcion.trim())?0.55:1,cursor:guardando?"default":"pointer"}} onClick={()=>guardarEdicion(detalle.id)}>
            {guardando
              ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{width:17,height:17,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Guardando…</span>
              :<span style={{display:"flex",alignItems:"center",gap:6}}><CheckCircle size={16}/>Guardar cambios</span>}
          </button>
          </div>
        </div>
        {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {fotoAmpliada&&<div onClick={()=>setFotoAmpliada(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><button onClick={()=>setFotoAmpliada(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:99,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={22} color="#fff"/></button><img src={fotoAmpliada} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:8}}/></div>}
      </div>
    );
  }

  // ─────────────────────────────
  // DETALLE
  // ─────────────────────────────
  if(vista==="detalle"&&detalle){
    const pri=PRIORIDADES[detalle.prioridad];const badge=estadoBadge(detalle);
    const miembroDetalle=detalle.responsable_usuario_id?equipoObra.find(m=>m.uid===detalle.responsable_usuario_id):null;
    const colorResp=miembroDetalle?miembroDetalle.color||colorPastelDe(miembroDetalle.uid):"#55555A";
    return(
      <div style={s.root}>
        <div style={{background:"#fff",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #F0F0F0",flexShrink:0}}>
          <button onClick={()=>{if(origenDirectorCategoria){setVistaDirectorCategoria(origenDirectorCategoria);setOrigenDirectorCategoria(null);setTabActiva("obras");}else{setVista("lista");}}} style={{width:34,height:34,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0}}><ChevronLeft size={20} color="#1C1C1E"/></button>
          <p style={{margin:0,fontSize:16,fontWeight:700,color:"#1C1C1E",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{detalle.descripcion}</p>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {detalle.fotos.length>0
            ?<div style={{position:"relative",width:"100%",aspectRatio:"4/3",background:"#000",overflow:"hidden"}}>
               <div style={{display:"flex",height:"100%",overflowX:"auto",scrollSnapType:"x mandatory"}}>
                 {detalle.fotos.map((f,i)=><img key={i} src={f} alt="" onClick={()=>setFotoAmpliada(f)} style={{width:"100%",height:"100%",objectFit:"cover",flexShrink:0,scrollSnapAlign:"start",cursor:"pointer"}}/>)}
               </div>
               <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,rgba(0,0,0,0.5))"}}/>
               <div style={{position:"absolute",top:12,left:12,display:"flex",alignItems:"center",gap:6,background:detalle.resuelta?"rgba(52,199,89,0.9)":detalle.estadoAprobacion==="pendiente"?"rgba(147,51,234,0.9)":pri.color+"E6",color:"#fff",fontSize:11,fontWeight:800,padding:"5px 10px",borderRadius:99}}>
                 <span style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.8)"}}/>
                 {detalle.resuelta?"RESUELTO":detalle.estadoAprobacion==="pendiente"?"EN APROBACIÓN":pri.label}
                 {badge&&!detalle.resuelta&&!detalle.estadoAprobacion&&<span style={{opacity:0.8,fontWeight:600}}> · {badge.label.replace(/^[^\s]+\s/,"")}</span>}
               </div>
               {detalle.fotos.length>1&&<span style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.5)",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99}}>{detalle.fotos.length} fotos</span>}
             </div>
            :<div style={{width:"100%",height:140,background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center"}}><Camera size={40} color="#C7C7CC"/></div>}
          <div style={{padding:"0 16px 24px"}}>
          {detalle.fotos.length===0&&<div style={{background:detalle.resuelta?"#34C75912":detalle.estadoAprobacion==="pendiente"?"#9333EA12":pri.color+"12",borderRadius:"0 0 16px 16px",padding:"12px 16px",display:"flex",alignItems:"center",gap:8,marginBottom:0}}>
            <span style={{width:9,height:9,borderRadius:99,background:detalle.resuelta?"#34C759":detalle.estadoAprobacion==="pendiente"?"#9333EA":pri.color,flexShrink:0}}/>
            <span style={{color:detalle.resuelta?"#34C759":detalle.estadoAprobacion==="pendiente"?"#9333EA":pri.color,fontSize:15,fontWeight:800}}>{detalle.resuelta?"RESUELTO":detalle.estadoAprobacion==="pendiente"?"EN APROBACIÓN":pri.label}</span>
            {badge&&!detalle.resuelta&&!detalle.estadoAprobacion&&<span style={{marginLeft:"auto",color:"#55555A",fontSize:13}}>{badge.label.replace(/^[^\s]+\s/,"")}</span>}
          </div>}
          <div style={{background:"#fff",borderRadius:detalle.fotos.length>0?"20px":"0 0 20px 20px",padding:"18px 18px 16px",marginBottom:12}}>
          <p style={{fontSize:21,fontWeight:800,color:"#1C1C1E",marginBottom:16,lineHeight:1.25}}>{detalle.descripcion}</p>
          {detalle.fotoResolucion&&<div style={{marginBottom:16}}>
            <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#34C759",textTransform:"uppercase",letterSpacing:0.5}}>✅ Foto del resultado</p>
            <ImgCacheada src={detalle.fotoResolucion} alt="Resultado" onClick={()=>setFotoAmpliada(detalle.fotoResolucion)} style={{width:"100%",maxHeight:220,objectFit:"cover",borderRadius:14,cursor:"pointer",border:"2px solid #34C75930"}}/>
          </div>}
          <div onClick={()=>{if(detalle.autorId===miId||puedeGestionar)setAsignacionRapida(detalle.id);}} style={{background:"#F9F9F9",borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:10,cursor:(detalle.autorId===miId||puedeGestionar)?"pointer":"default"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:colorResp,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>
              {miembroDetalle?miembroDetalle.nombre?.[0].toUpperCase():<Wrench size={16} color="#fff"/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:10,fontWeight:600,color:"#55555A",textTransform:"uppercase",letterSpacing:0.3}}>Responsable</p>
              <p style={{margin:"1px 0 0",fontSize:15,fontWeight:700,color:"#1C1C1E"}}>{miembroDetalle?miembroDetalle.nombre:detalle.responsable}</p>
              {miembroDetalle?.especialidad&&<p style={{margin:0,fontSize:12,color:"#55555A"}}>{miembroDetalle.especialidad}</p>}
            </div>
            {miembroDetalle?.telefono&&<>
              <button onClick={e=>{e.stopPropagation();window.open(`https://wa.me/${miembroDetalle.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${miembroDetalle.nombre}! Te escribo por Fixgo, sobre "${detalle.descripcion}".`)}`,"_blank");}} style={{width:34,height:34,borderRadius:10,background:"#25D36615",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </button>
              <button onClick={e=>{e.stopPropagation();window.open(`tel:${miembroDetalle.telefono.replace(/\D/g,"")}`,"_self");}} style={{width:34,height:34,borderRadius:10,background:"#0057FF15",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Phone size={16} color="#0057FF"/>
              </button>
            </>}
            {(detalle.autorId===miId||puedeGestionar)&&<ChevronRight size={18} color="#8E8E93" style={{flexShrink:0}}/>}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {detalle.sector&&<span style={{display:"flex",alignItems:"center",gap:5,background:"#F2F2F7",borderRadius:99,padding:"5px 10px",fontSize:12,fontWeight:600,color:"#636366"}}><MapPin size={11} color="#55555A"/>{detalle.sector}</span>}
            {detalle.fechaLimite&&<span style={{display:"flex",alignItems:"center",gap:5,background:badge?"#FF3B3012":"#F2F2F7",borderRadius:99,padding:"5px 10px",fontSize:12,fontWeight:600,color:badge?"#FF3B30":"#636366"}}><Calendar size={11} color={badge?"#FF3B30":"#55555A"}/>{formatFecha(detalle.fechaLimite)}</span>}
            <span style={{display:"flex",alignItems:"center",gap:5,background:"#F2F2F7",borderRadius:99,padding:"5px 10px",fontSize:12,fontWeight:600,color:"#636366"}}><Calendar size={11} color="#55555A"/>Cargada {detalle.fecha?formatFecha(detalle.fecha):"—"}</span>
          </div>
          </div>
          
          {(empresaPropia&&obraActual?.empresa_id===empresaPropia.id)?(
            <div style={{display:"flex",gap:8,margin:"0 0 12px",alignItems:"center",flexWrap:"wrap"}}>
              <div onClick={()=>marcarSelloDirector(detalle.id,"like")} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:99,border:detalle.selloDirector==="like"?"1.5px solid #34C759":"1.5px solid #E5E5EA",background:detalle.selloDirector==="like"?"#EAFBEF":"#fff",cursor:"pointer",fontSize:12,fontWeight:700,color:detalle.selloDirector==="like"?"#1a8a3d":"#55555A"}}><span style={{fontSize:14}}>👍</span>Destacar</div>
              <div onClick={()=>marcarSelloDirector(detalle.id,"atencion")} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:99,border:detalle.selloDirector==="atencion"?"1.5px solid #FFB800":"1.5px solid #E5E5EA",background:detalle.selloDirector==="atencion"?"#FFF8E5":"#fff",cursor:"pointer",fontSize:12,fontWeight:700,color:detalle.selloDirector==="atencion"?"#9a6b00":"#55555A"}}><span style={{fontSize:14}}>⚠️</span>Atención</div>
              <span style={{fontSize:10.5,color:"#B0B0B5"}}>👁️ {getUserById(detalle.responsable_usuario_id)?.nombre||"El responsable"} lo ve</span>
            </div>
          ):detalle.selloDirector?(
            <div style={{display:"flex",alignItems:"center",gap:6,margin:"0 0 12px",padding:"8px 12px",borderRadius:12,background:detalle.selloDirector==="like"?"#EAFBEF":"#FFF8E5",fontSize:12.5,fontWeight:600,color:detalle.selloDirector==="like"?"#1a8a3d":"#9a6b00"}}>
              {detalle.selloDirector==="like"?"👍 Tu Director destacó esta novedad":"⚠️ Tu Director marcó esta novedad para prestarle atención"}
            </div>
          ):null}

          <div style={{background:"#fff",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
          <div onClick={()=>setComentariosAbiertos(a=>!a)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:comentariosAbiertos?12:0}}>
            <p style={{margin:0,fontSize:15,fontWeight:700,color:"#1C1C1E"}}>💬 Comentarios <span style={{color:"#B0B0B5",fontWeight:600}}>({detalle.comentarios.length})</span></p>
            <span style={{width:30,height:30,borderRadius:"50%",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"transform .2s",transform:comentariosAbiertos?"rotate(180deg)":"rotate(0deg)"}}><ChevronLeft size={16} color="#55555A" style={{transform:"rotate(-90deg)"}}/></span>
          </div>
          {comentariosAbiertos&&<>
          {detalle.comentarios.length===0&&<p style={{color:"#55555A",fontSize:14,margin:"0 0 12px"}}>Sin comentarios aún</p>}
          {detalle.comentarios.map((c,i)=>{const autor=getUserById(c.autorId);const esMio=c.autorId===usuarioActivo.id;return(
            <div key={i} style={{background:esMio?"#1C1C1E":"#F9F9F9",borderRadius:14,padding:"10px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,color:esMio?"rgba(255,255,255,0.7)":"#636366"}}>{autor?.nombre||"Usuario"}</span>
                <span style={{fontSize:10,color:esMio?"rgba(255,255,255,0.35)":"#C7C7CC",marginLeft:"auto"}}>{formatHora(c.ts)}</span>
              </div>
              {c.audioUrl?<BurbujaAudio src={c.audioUrl} duracion={c.audioDuracion||0} esMio={esMio}/>:<p style={{margin:0,fontSize:14,color:esMio?"#fff":"#1C1C1E",lineHeight:1.4}}>{c.texto}</p>}
            </div>
          );})}
          </>}
          <div style={{display:"flex",gap:8,marginTop:4,alignItems:"center",position:"sticky",bottom:-24,background:"#fff",paddingTop:10,paddingBottom:24,marginBottom:-24,zIndex:5}}>
            {grabandoAudio?(
              <div style={{flex:1,display:"flex",alignItems:"center",gap:10,background:"#FFF3F0",border:"1.5px solid #FF3B30",borderRadius:12,padding:"9px 14px"}}>
                <span style={{width:9,height:9,borderRadius:"50%",background:"#FF3B30",flexShrink:0,animation:"pulse 1s infinite"}}/>
                <div style={{display:"flex",alignItems:"center",gap:2,flex:1}}>
                  {[6,12,8,16,10,14,7,11,15,9,13,6,10].map((h,i)=><div key={i} style={{width:2.5,height:h,borderRadius:2,background:"#FF3B30",flexShrink:0,opacity:0.6+0.4*Math.sin(Date.now()/150+i)}}/>)}
                </div>
                <span style={{fontSize:13,fontWeight:700,color:"#FF3B30",flexShrink:0}}>0:{String(tiempoGrabacion).padStart(2,"0")} / 0:{DURACION_MAX_AUDIO}</span>
                <button type="button" onClick={cancelarGrabacion} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#F2F2F7",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><X size={14} color="#55555A"/></button>
              </div>
            ):(
              <input style={{...s.input,flex:1,background:"#F2F2F7",border:"none"}} placeholder={`Comentar como ${usuarioActivoReal.nombre}...`} value={nuevoComentario} onChange={e=>setNuevoComentario(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarComentario(detalle.id)}/>
            )}
            {grabandoAudio?(
              <button type="button" onClick={detenerGrabacionYEnviar} style={{width:40,height:40,background:"#FF3B30",border:"none",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Send size={16} color="#fff"/></button>
            ):nuevoComentario.trim()?(
              <button style={{width:40,height:40,background:"#1C1C1E",border:"none",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={()=>agregarComentario(detalle.id)}><Send size={16} color="#fff"/></button>
            ):(
              <button type="button" onClick={()=>iniciarGrabacion(detalle.id)} style={{width:40,height:40,background:"#1C1C1E",border:"none",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Mic size={16} color="#fff"/></button>
            )}
          </div>
          </div>

          {(empresaPropia&&obraActual?.empresa_id===empresaPropia.id)&&(()=>{
            const miEntrada=bitacoraItems.find(b=>b.novedad_id===detalle.id);
            const notas=miEntrada?(notasBitacora[miEntrada.id]||[]):[];
            return(
              <div style={{background:"linear-gradient(135deg,#F7F5FF,#FBFAFF)",border:"1.5px dashed #D9CFFF",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <p style={{margin:0,fontSize:15,fontWeight:800,color:"#7C5CFC",display:"flex",alignItems:"center",gap:7}}>📔 Mi Bitácora</p>
                  {miEntrada&&<span onClick={()=>{if(confirm("¿Sacar esta novedad de tu Bitácora? Se borran también las notas."))sacarDeBitacora(miEntrada.id);}} style={{fontSize:11,color:"#D0342C",fontWeight:600,cursor:"pointer"}}>Quitar</span>}
                </div>

                {miEntrada&&<div style={{display:"flex",alignItems:"center",background:miEntrada.hablado?"#EAFBEF":"#fff",borderRadius:12,padding:"9px 12px",marginBottom:12,border:"1.5px solid "+(miEntrada.hablado?"#34C759":"#E5E5EA")}}>
                  <span onClick={()=>toggleHabladoBitacora(miEntrada.id,!miEntrada.hablado)} style={{fontSize:12.5,fontWeight:700,color:miEntrada.hablado?"#1a8a3d":"#55555A",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                    {miEntrada.hablado?"✓ Hablado con el equipo":"○ Marcar como hablado"}
                  </span>
                </div>}

                {notas.map(nota=>(
                  <div key={nota.id} style={{background:"#fff",borderRadius:12,padding:"10px 12px",marginBottom:8}}>
                    {notaEditando?.notaId===nota.id?(<>
                      <textarea autoFocus value={notaEditando.texto} onChange={e=>setNotaEditando(x=>({...x,texto:e.target.value}))} style={{width:"100%",border:"1px solid #E5E5EA",borderRadius:8,padding:8,fontSize:13.5,fontFamily:"inherit",resize:"none",minHeight:44}}/>
                      <div style={{display:"flex",gap:10,marginTop:6}}>
                        <span onClick={()=>editarNotaBitacora(miEntrada.id,nota.id,notaEditando.texto)} style={{fontSize:11,color:"#34C759",fontWeight:700,cursor:"pointer"}}>Guardar</span>
                        <span onClick={()=>setNotaEditando(null)} style={{fontSize:11,color:"#55555A",fontWeight:600,cursor:"pointer"}}>Cancelar</span>
                      </div>
                    </>):(<>
                      <p style={{margin:"0 0 4px",fontSize:10,color:"#B0B0B5"}}>{formatHora(new Date(nota.created_at).getTime())}</p>
                      <p style={{margin:0,fontSize:13.5,lineHeight:1.4}}>{nota.texto}</p>
                      <div style={{display:"flex",gap:12,marginTop:6}}>
                        <span onClick={()=>setNotaEditando({bitacoraId:miEntrada.id,notaId:nota.id,texto:nota.texto})} style={{fontSize:11,color:"#55555A",fontWeight:600,cursor:"pointer"}}>Editar</span>
                        <span onClick={()=>borrarNotaBitacora(miEntrada.id,nota.id)} style={{fontSize:11,color:"#D0342C",fontWeight:600,cursor:"pointer"}}>Eliminar</span>
                      </div>
                    </>)}
                  </div>
                ))}

                {!notas.length&&!miEntrada&&<p style={{margin:"0 0 10px",fontSize:12.5,color:"#8E8E93"}}>Escribí algo para guardarla en tu Bitácora.</p>}

                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <input value={nuevaNotaTexto} onChange={e=>setNuevaNotaTexto(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarNotaBitacoraAuto(detalle.id,miEntrada,nuevaNotaTexto)} placeholder="Agregar nota..." style={{flex:1,background:"#fff",border:"1.5px solid #E5E5EA",borderRadius:12,padding:"10px 13px",fontSize:13.5}}/>
                  <button onClick={()=>agregarNotaBitacoraAuto(detalle.id,miEntrada,nuevaNotaTexto)} style={{width:40,height:40,background:"#7C5CFC",border:"none",borderRadius:12,color:"#fff",fontSize:16,flexShrink:0,cursor:"pointer"}}>＋</button>
                </div>
              </div>
            );
          })()}

          <div style={{background:"#fff",borderRadius:20,padding:"16px 18px",marginBottom:8}}>
          {detalle.resuelta?(
            (detalle.autorId===miId||puedeGestionar)?<button style={{...s.btnPrincipal,background:"#636366",fontSize:16,padding:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}} onClick={()=>{resolver(detalle.id);setVista("lista");}}><RotateCcw size={18}/>Reabrir novedad</button>:null
          ):detalle.estadoAprobacion==="pendiente"?(
            detalle.autorId===miId?(
              <div>
                <div style={{background:"#A855F712",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Clock size={16} color="#9333EA"/><span style={{fontSize:14,fontWeight:700,color:"#9333EA"}}>El responsable marcó esta novedad como finalizada</span></div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <button style={{...s.btnPrincipal,background:"#34C759",flex:1,fontSize:15,padding:"14px"}} onClick={()=>{aprobar(detalle.id);setVista("lista");}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><CheckCircle size={16}/>Aprobar</span></button>
                  <button style={{...s.btnPrincipal,background:"#fff",color:"#FF3B30",border:"1.5px solid #FF3B30",flex:1,fontSize:15,padding:"14px"}} onClick={()=>{rechazar(detalle.id);setVista("lista");}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><RotateCcw size={16}/>Rechazar</span></button>
                </div>
              </div>
            ):<div style={{background:"#A855F712",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}><Clock size={16} color="#9333EA"/><span style={{fontSize:14,fontWeight:700,color:"#9333EA"}}>Esperando aprobación</span></div>
          ):(detalle.autorId===miId||puedeGestionar)?(
            <button style={{...s.btnPrincipal,background:"#34C759",fontSize:16,padding:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}} onClick={()=>{if(detalle.resuelta){resolver(detalle.id);setVista("lista");}else{setModalFotoResolucion(detalle.id);}}}><CheckCircle size={18}/>Marcar como resuelto</button>
          ):(
            <button style={{...s.btnPrincipal,background:"#34C759",fontSize:16,padding:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}} onClick={()=>setModalFotoResolucion(detalle.id)}><CheckCircle size={18}/>Finalizado — Enviar a aprobación</button>
          )}
          <div style={{display:"flex",gap:8}}>
            {(detalle.autorId===miId||puedeGestionar)&&<button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",flex:1,fontSize:13,padding:"12px 4px"}} onClick={()=>abrirEdicion(detalle)}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Edit2 size={14}/>Editar</span></button>}
            <button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",flex:1,fontSize:13,padding:"12px 4px"}} onClick={()=>compartir(detalle)}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{compartidoId===detalle.id?"✓ Copiado":<><Share2 size={14}/>Compartir</>}</span></button>
            <button style={{...s.btnPrincipal,background:"#25D36615",border:"1.5px solid #25D36630",flex:1,fontSize:13,padding:"12px 4px"}} onClick={()=>{const t=generarResumen(detalle,obraActual?.nombre||"Obra");window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,"_blank");}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg><span style={{color:"#25D366",fontWeight:700}}>WhatsApp</span></span></button>
          </div>
          </div>
          {(detalle.autorId===miId||puedeGestionar)&&<button style={{width:"100%",background:"#fff",border:"none",borderRadius:14,padding:"14px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:"#FF3B30",fontSize:14,fontWeight:600,cursor:"pointer"}} onClick={()=>setConfirmarEliminar(detalle.id)}><Trash2 size={15}/>Borrar novedad</button>}
          </div>
        </div>
        {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {confirmarEliminar&&<div style={s.overlay} onClick={()=>setConfirmarEliminar(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar esta novedad?</p><p style={{margin:0,fontSize:14,color:"#55555A"}}>Esta acción no se puede deshacer.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>{eliminar(confirmarEliminar);setConfirmarEliminar(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}><Trash2 size={15}/>Sí, eliminar</span></button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminar(null)}>Cancelar</button></div></div>}
        {fotoAmpliada&&<div onClick={()=>setFotoAmpliada(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><button onClick={()=>setFotoAmpliada(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:99,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={22} color="#fff"/></button><img src={fotoAmpliada} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:8}}/></div>}
        {modalFotoResolucionJSX}
        {asignacionRapidaJSX}
        {editorDibujo&&<ModalEditorDibujo src={editorDibujo.src} onGuardar={guardarDesdeEditorDibujo} onCerrar={()=>{const cont=editorDibujo.onListo;const original=editorDibujo.src;setEditorDibujo(null);cont?.(original);}}/>}
      </div>
    );
  }

  // ─────────────────────────────
  // NUEVA NOVEDAD
  // ─────────────────────────────
  if(vista==="nueva"){
    return(
      <div style={s.root}>
        <Header migas={[{label:"Obras",onClick:irInicio},{label:obraActual?.nombre,onClick:()=>{setForm(FORM_INICIAL);setVista("lista");}},{label:"Novedades",onClick:()=>{setForm(FORM_INICIAL);setVista("lista");}},{label:"Nueva novedad"}]} />
        <div style={{padding:"16px",flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:20,paddingBottom:24}}>
          <div><p style={s.label}>📷 Fotos <span style={{color:"#55555A",fontWeight:400}}>(podés agregar varias)</span></p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{display:"none"}} onChange={handleFotos}/>
            {form.fotos.length>0&&<div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:10}}>{form.fotos.map((f,i)=><div key={i} style={{position:"relative",flexShrink:0}}><img src={f} alt="" style={{height:100,width:100,objectFit:"cover",borderRadius:12}}/>{esVersionPro&&<button onClick={()=>abrirEditorDibujo(f,"nueva",i)} style={{position:"absolute",bottom:-7,left:-7,width:24,height:24,borderRadius:"50%",background:"#1C1C1E",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}><Edit2 size={11} color="#fff"/></button>}<button style={s.quitarFoto} onClick={()=>quitarFoto(i)}><X size={12}/></button></div>)}</div>}
            <button style={s.fotoBtn} onClick={()=>fileRef.current.click()}><Camera size={32} color="#636366"/><span style={{color:"#636366",fontSize:14,marginTop:4}}>{form.fotos.length>0?"Agregar más fotos":"Tocá para sacar foto"}</span></button>
          </div>
          <div><p style={s.label}>📝 ¿Qué hay que resolver?</p><textarea style={s.textarea} placeholder="Ej: Fisura en la pared del baño..." value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} rows={3}/></div>
          <div><p style={s.label}>⚡ Prioridad</p><div style={{display:"flex",gap:10}}>{PRIORIDADES.map((p,i)=><button key={i} style={{flex:1,padding:"12px 4px",borderRadius:14,border:`2px solid ${form.prioridad===i?p.color:"#E5E5EA"}`,background:form.prioridad===i?p.bg:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}} onClick={()=>setForm(f=>({...f,prioridad:i}))}><span style={{fontSize:24}}>{p.emoji}</span><span style={{fontSize:11,fontWeight:700,color:form.prioridad===i?p.color:"#55555A"}}>{p.label}</span></button>)}</div></div>
          <div><p style={s.label}>👷 ¿Quién lo resuelve?</p><TiraResponsables value={form.responsable} usuarioId={form.responsableUsuarioId} equipo={equipoObra} onChange={({responsable,usuarioId})=>setForm(f=>({...f,responsable,responsableUsuarioId:usuarioId}))} onInvitarNuevo={()=>abrirModalInvitar(({responsable,usuarioId,token})=>setForm(f=>({...f,responsable,responsableUsuarioId:usuarioId,tokenAsignacionPendiente:token||null})))} /></div>
          <button type="button" onClick={()=>setMasOpciones(o=>!o)} style={{width:"100%",background:"#fff",border:"1.5px solid #E5E5EA",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:15,fontWeight:600,color:"#1C1C1E"}}>⚙️ Más opciones</span>
            <span style={{fontSize:13,color:"#55555A"}}>{masOpciones?"▲":"▼ sector, fecha, nota…"}</span>
          </button>
          {masOpciones && <>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><MapPin size={14}/>Sector</span></p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SECTORES.map(sec=><button key={sec} style={{padding:"9px 14px",borderRadius:20,border:`2px solid ${form.sector===sec?"#007AFF":"#E5E5EA"}`,background:form.sector===sec?"#007AFF15":"#fff",color:form.sector===sec?"#007AFF":"#3A3A3C",fontWeight:form.sector===sec?700:400,fontSize:14,cursor:"pointer"}} onClick={()=>setForm(f=>({...f,sector:sec,sectorCustom:""}))}>{sec}</button>)}</div>{form.sector==="Otro"&&<input style={{...s.input,marginTop:10}} placeholder="Escribí el sector..." value={form.sectorCustom} onChange={e=>setForm(f=>({...f,sectorCustom:e.target.value}))} autoFocus/>}</div>
          <div><p style={s.label}><span style={{display:"flex",alignItems:"center",gap:6}}><Calendar size={14}/>Fecha límite</span> <span style={{color:"#55555A",fontWeight:400}}>(opcional)</span></p>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {[["Hoy",0],["Mañana",1],["En 1 semana",7]].map(([lbl,dias])=>{
                const d=new Date();d.setDate(d.getDate()+dias);
                const iso=d.toISOString().slice(0,10);
                return <button key={lbl} style={{flex:1,padding:"8px 4px",borderRadius:12,border:`1.5px solid ${form.fechaLimite===iso?"#1C1C1E":"#E5E5EA"}`,background:form.fechaLimite===iso?"#1C1C1E":"#fff",color:form.fechaLimite===iso?"#fff":"#636366",fontSize:13,fontWeight:form.fechaLimite===iso?700:400,cursor:"pointer"}} onClick={()=>setForm(f=>({...f,fechaLimite:iso}))}>{lbl}</button>;
              })}
            </div>
            <p style={{margin:"0 0 6px",fontSize:13,color:"#55555A"}}>O elegí una fecha exacta:</p>
            <input type="date" style={s.inputDate} value={form.fechaLimite} onChange={e=>setForm(f=>({...f,fechaLimite:e.target.value}))}/>
          </div>
          <div><p style={s.label}>💬 Nota inicial <span style={{color:"#55555A",fontWeight:400}}>(opcional)</span></p><input style={s.input} placeholder="Ej: Revisar antes del jueves..." value={form.comentario} onChange={e=>setForm(f=>({...f,comentario:e.target.value}))}/></div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:"#F2F2F7",borderRadius:14,padding:"14px 16px"}}>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:15,fontWeight:600,color:"#1C1C1E",display:"flex",alignItems:"center",gap:6}}><EyeOff size={15}/>Ocultar al capataz</p>
              <p style={{margin:"2px 0 0",fontSize:12,color:"#55555A"}}>Solo la verán vos y el responsable asignado.</p>
            </div>
            <button onClick={()=>setForm(f=>({...f,ocultoCapataz:!f.ocultoCapataz}))} style={{flexShrink:0,width:50,height:30,borderRadius:99,border:"none",cursor:"pointer",background:form.ocultoCapataz?"#0057FF":"#C7C7CC",position:"relative",transition:"background 0.2s"}}>
              <span style={{position:"absolute",top:3,left:form.ocultoCapataz?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
            </button>
          </div>
          </>}
          <div style={{position:"sticky",bottom:-24,background:"#F2F2F7",paddingTop:14,paddingBottom:24,marginBottom:-24,zIndex:5}}>
          <button style={{...s.btnPrincipal,opacity:(form.descripcion.trim()&&!guardando)?1:0.4}} disabled={guardando} onClick={()=>guardar(false)}><span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{guardando?<><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Creando...</>:<><CheckCircle size={16}/>Guardar novedad</>}</span></button>
          <button style={{width:"100%",marginTop:8,padding:"12px",borderRadius:14,border:"1.5px solid #D1D1D6",background:"#fff",color:"#3A3A3C",fontSize:13.5,fontWeight:700,cursor:(form.descripcion.trim()&&!guardando)?"pointer":"default",opacity:(form.descripcion.trim()&&!guardando)?1:0.4,display:"flex",alignItems:"center",justifyContent:"center",gap:6}} disabled={guardando} onClick={()=>guardar(true)}><Plus size={15}/>Guardar y agregar otra</button>
          </div>
        </div>
        {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />
        {modalInvitarJSX}
        {asignacionRapidaJSX}
        {editorDibujo&&<ModalEditorDibujo src={editorDibujo.src} onGuardar={guardarDesdeEditorDibujo} onCerrar={()=>{const cont=editorDibujo.onListo;const original=editorDibujo.src;setEditorDibujo(null);cont?.(original);}}/>}
        {modalEditarObraJSX}
        {modalPeriodoJSX}
      </div>
    );
  }

  // ─────────────────────────────
  // LISTA DE NOVEDADES
  // ─────────────────────────────
  return(
    <div style={{...s.root,position:"relative"}}>
      <div style={{padding:"14px 12px 4px",flexShrink:0}}>
        <button onClick={()=>{if(origenDirectorCategoria){setVistaDirectorCategoria(origenDirectorCategoria);setOrigenDirectorCategoria(null);}else{irInicio();}}} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:2,color:"#007AFF",cursor:"pointer",padding:"0 4px 8px",fontSize:14,fontWeight:600}}><ChevronLeft size={19}/>{origenDirectorCategoria?"Director":"Inicio"}</button>
        <div style={{background:"linear-gradient(135deg,#2E3A4B,#3C4A5E)",borderRadius:20,padding:"18px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{margin:0,fontSize:20,fontWeight:800,color:"#fff",lineHeight:1.2}}>{obraActual?.nombre}</p>
            <p style={{margin:"3px 0 8px",fontSize:13,color:"rgba(255,255,255,0.6)"}}><MapPin size={13} style={{flexShrink:0}}/> {obraActual?.direccion||"Sin dirección"}</p>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{usuarioActivoReal.nombre}</span>
              {miRolInfo&&<span style={{fontSize:11,fontWeight:700,color:"#fff",background:"rgba(255,255,255,0.18)",padding:"2px 8px",borderRadius:99}}>{miRolInfo.emoji} {miRolInfo.label}</span>}
            </div>
          </div>
          {puedeGestionar&&<button style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:14,width:60,height:60,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,color:"#fff",cursor:"pointer",flexShrink:0}} onClick={()=>setVistaEquipo(true)}>
            <Users size={19} color="#fff"/>
            <span style={{fontSize:9.5,fontWeight:700,letterSpacing:0.1,color:"#fff"}}>Mi equipo</span>
          </button>}
        </div>
      </div>
      <div style={{background:"#fff",borderBottom:"1px solid #F2F2F7",padding:"12px 16px 0",flexShrink:0}}>
        <div style={{position:"relative",marginBottom:10}}><Search size={16} color="#55555A" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/><input style={{...s.input,background:"#F2F2F7",border:"none",paddingLeft:38}} placeholder="Buscar oficios o novedades..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
        <div style={{display:"flex",gap:6,paddingBottom:12}}>
          {[["todas","Todas",contadores.todas,"#2E3A4B"],["pendientes","Pendientes",contadores.pendientes,"#2E3A4B"],["vencidas","Vencidas",contadores.vencidas,"#2E3A4B"],["resueltas","Resueltas",contadores.resueltas,"#2E3A4B"]].map(([key,lbl,val,col])=>(
            <button key={key} style={{flex:1,minWidth:0,padding:"8px 2px",borderRadius:12,border:`1.5px solid ${filtro===key?col:"#E5E5EA"}`,background:filtro===key?col:"#fff",color:filtro===key?"#fff":"#636366",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}} onClick={()=>setFiltro(key)}>
              <span style={{fontSize:17,fontWeight:800,lineHeight:1}}>{val}</span>
              <span style={{fontSize:10.5,fontWeight:filtro===key?700:500,whiteSpace:"nowrap"}}>{lbl}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,paddingBottom:12}}>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"#55555A",flexShrink:0}}><ArrowUpDown size={12}/>Ordenar:</span>
          {[["urgencia","Urgencia"],["fecha","Fecha"],["vencimiento","Vencimiento"]].map(([key,lbl])=>(
            <button key={key} onClick={()=>{if(orden===key)setOrdenDesc(d=>!d);else{setOrden(key);setOrdenDesc(false);}}} style={{padding:"5px 12px",borderRadius:99,border:`1.5px solid ${orden===key?"#0057FF":"#E5E5EA"}`,background:orden===key?"#0057FF12":"#fff",color:orden===key?"#0057FF":"#55555A",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
              {lbl}{orden===key&&<span style={{fontSize:13,fontWeight:900}}>{ordenDesc?"▼":"▲"}</span>}
            </button>
          ))}
        </div>
        {puedeGestionar&&<button onClick={()=>setVistaStats(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,width:"100%",background:"#F2F2F7",border:"1px solid #E5E5EA",borderRadius:12,cursor:"pointer",color:"#0057FF",fontSize:13.5,fontWeight:700,padding:"11px",marginBottom:12}}><BarChart2 size={15}/>Ver estadísticas completas<ChevronRight size={15}/></button>}
        {filtroSector!=="todos"&&<button onClick={()=>setFiltroSector("todos")} style={{display:"flex",alignItems:"center",gap:6,background:"#0057FF12",border:"1px solid #0057FF30",borderRadius:99,padding:"7px 12px",marginBottom:12,cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>
          <span style={{fontSize:12.5,fontWeight:700,color:"#0057FF"}}>Filtrando: {filtroSector}</span>
          <span style={{fontSize:14,fontWeight:800,color:"#0057FF",lineHeight:1}}>✕</span>
        </button>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {novedadesFiltradas.length===0&&<div style={{textAlign:"center",padding:"50px 20px",color:"#55555A"}}>
          <p style={{fontSize:44,margin:0}}>{filtro==="resueltas"?"🎉":filtro==="vencidas"?"✅":"📋"}</p>
          <p style={{fontSize:17,fontWeight:700,margin:"12px 0 6px",color:"#3A3A3C"}}>{filtro==="resueltas"?"Todavía no hay resueltas":filtro==="vencidas"?"¡Todo al día!":busqueda?"Sin resultados":"Sin novedades aún"}</p>
          <p style={{fontSize:14,margin:"0 0 18px"}}>{filtro==="resueltas"?"Cuando marques una novedad como resuelta, aparece acá.":filtro==="vencidas"?"No tenés novedades vencidas. Buen trabajo.":busqueda?"Probá con otra palabra.":"Cargá la primera novedad de esta obra."}</p>
          {puedeGestionar&&!busqueda&&filtro!=="resueltas"&&<button style={{...s.btnPrincipal,width:"auto",padding:"12px 22px",display:"inline-flex",alignItems:"center",gap:8}} onClick={()=>setVista("nueva")}><Plus size={18}/>Nueva novedad</button>}
        </div>}
        {novedadesFiltradas.map(nov=>{
          const pri=PRIORIDADES[nov.prioridad];const badge=estadoBadge(nov);
          return(
            <button key={nov.id} style={{width:"100%",flexShrink:0,background:"#fff",borderRadius:16,border:"1px solid #ECECEF",padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",opacity:nov.resuelta?0.65:1}}
              onClick={()=>{setDetalleId(nov.id);setVista("detalle");setComentariosAbiertos((nov.comentarios||[]).length>0);}}
              onContextMenu={e=>{e.preventDefault();setMenuContextual({novId:nov.id});}}
              onPointerDown={e=>{const t=setTimeout(()=>setMenuContextual({novId:nov.id}),600);e.currentTarget._t=t;}} onPointerUp={e=>clearTimeout(e.currentTarget._t)} onPointerLeave={e=>clearTimeout(e.currentTarget._t)}
              onTouchStart={e=>{e.currentTarget._tt=setTimeout(()=>setMenuContextual({novId:nov.id}),600);}} onTouchEnd={e=>clearTimeout(e.currentTarget._tt)} onTouchMove={e=>clearTimeout(e.currentTarget._tt)}>
              <div style={{display:"flex",alignItems:"center"}}>
                {nov.fotos.length>0
                  ?<div style={{position:"relative",width:72,height:72,flexShrink:0,marginLeft:11}}>
                     <img src={nov.fotos[0]} alt="" style={{width:72,height:72,objectFit:"cover",display:"block",borderRadius:10}}/>
                     {nov.fotos.length>1&&<span style={{position:"absolute",right:4,bottom:4,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:99,lineHeight:1}}>+{nov.fotos.length-1}</span>}
                   </div>
                  :<div style={{width:72,height:72,background:"#F2F2F7",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,marginLeft:11}}><Camera size={26} color="#C7C7CC"/></div>}
                <div style={{padding:"11px 12px",flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:94}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:nov.resuelta?"#34C759":nov.estadoAprobacion==="pendiente"?"#9333EA":pri.color,flexShrink:0,display:"inline-block"}}/>
                    <span style={{fontSize:11.5,fontWeight:800,letterSpacing:0.2,color:nov.resuelta?"#34C759":nov.estadoAprobacion==="pendiente"?"#9333EA":pri.color}}>{nov.resuelta?"RESUELTO":nov.estadoAprobacion==="pendiente"?"EN APROBACIÓN":pri.label}</span>
                    {!nov.resuelta&&!nov.estadoAprobacion&&badge&&<span style={{fontSize:11.5,fontWeight:600,color:"#55555A"}}>· {badge.label.replace(/^[^\s]+\s/,"")}</span>}
                    {nov.pendienteSync&&<span style={{fontSize:9.5,fontWeight:800,color:"#FFB800",background:"#FFB80015",padding:"2px 7px",borderRadius:99,textTransform:"uppercase"}}>📡 Pendiente</span>}
                  </div>
                  <p style={{margin:"0 0 3px",fontSize:15,fontWeight:700,color:"#1C1C1E",lineHeight:1.25}}>{nov.descripcion}</p>
                  <p style={{margin:0,fontSize:12,color:"#636366",display:"flex",alignItems:"center",gap:4,flexWrap:"nowrap",minWidth:0}}>{(()=>{const miembro=nov.responsable_usuario_id?equipoObra.find(m=>m.uid===nov.responsable_usuario_id):null;return miembro?<span style={{width:18,height:18,borderRadius:"50%",background:colorPastelDe(miembro.uid),flexShrink:0,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{miembro.nombre?miembro.nombre[0].toUpperCase():""}</span>:<Wrench size={12} color="#55555A" style={{flexShrink:0}}/>;})()}<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0,fontWeight:nov.responsable_usuario_id?700:400,color:nov.responsable_usuario_id?"#1C1C1E":"#636366"}}>{(()=>{const miembro=nov.responsable_usuario_id?equipoObra.find(m=>m.uid===nov.responsable_usuario_id):null;return miembro?miembro.nombre:nov.responsable;})()}</span><span style={{color:"#C7C7CC",margin:"0 2px",flexShrink:0}}>·</span><MapPin size={12} color="#55555A" style={{flexShrink:0}}/><span style={{whiteSpace:"nowrap",flexShrink:0}}>{nov.sector}</span></p>
                  {!nov.resuelta&&!nov.responsable_usuario_id&&<span style={{marginTop:5,display:"inline-flex",alignItems:"center",gap:5,background:"#FAEEDA",color:"#854F0B",padding:"3px 8px",borderRadius:8,fontSize:10.5,fontWeight:700,width:"fit-content"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeDasharray="3 3"/></svg>{nov.responsable} · Sin responsable</span>}
                  {nov.comentarios.length>0&&<span style={{marginTop:5,fontSize:11.5,color:"#55555A",fontWeight:600,display:"inline-flex",alignItems:"center",gap:3}}><MessageCircle size={12}/> {nov.comentarios.length} comentario{nov.comentarios.length!==1?"s":""}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",paddingRight:10}}><ChevronRight size={18} color="#C7C7CC"/></div>
              </div>
            </button>
          );
        })}
      </div>
      {puedeGestionar&&novedadesFiltradas.length>0&&<button onClick={()=>setVista("nueva")} aria-label="Nueva novedad" style={{position:"absolute",right:18,bottom:82,width:58,height:58,borderRadius:"50%",background:"#1C1C1E",border:"none",boxShadow:"0 4px 16px rgba(0,0,0,0.28)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:20}}><Plus size={26} color="#fff" strokeWidth={2.5}/></button>}
      {offlineBannerJSX}
        <NavBar tabActiva={tabActiva} onTab={k=>{setTabActiva(k);irInicio();}} onPerfil={()=>setVistaPerfil(true)} />

      {menuContextual&&<div style={s.overlay} onClick={()=>setMenuContextual(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 16px",fontSize:17,fontWeight:700}}>Opciones</p>{(()=>{const nov=novedades.find(n=>n.id===menuContextual.novId);const puedeReabrirOResolver=nov&&(!nov.resuelta||nov.autorId===miId||puedeGestionar);const puedeEliminar=nov&&(nov.autorId===miId||puedeGestionar);const puedeAsignar=nov&&(nov.autorId===miId||puedeGestionar);return(<>
        {puedeReabrirOResolver&&<button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10}} onClick={()=>{resolver(menuContextual.novId);setMenuContextual(null);}}>{nov?.resuelta?"↩ Reabrir":"✅ Marcar como resuelto"}</button>}
        {puedeAsignar&&<button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10}} onClick={()=>{setAsignacionRapida(menuContextual.novId);setMenuContextual(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}><User size={15}/>Elegir responsable</span></button>}
        {puedeEliminar&&<button style={{...s.btnPrincipal,background:"#FF3B3010",color:"#FF3B30",marginBottom:10}} onClick={()=>{setConfirmarEliminar(menuContextual.novId);setMenuContextual(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}><Trash2 size={15}/>Eliminar</span></button>}
      </>);})()}<button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setMenuContextual(null)}>Cancelar</button></div></div>}
      {null}
      {confirmarEliminar&&!detalle&&<div style={s.overlay} onClick={()=>setConfirmarEliminar(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:20}}><span style={{fontSize:44}}>🗑️</span><p style={{margin:"12px 0 8px",fontSize:19,fontWeight:800}}>¿Eliminar esta novedad?</p><p style={{margin:0,fontSize:14,color:"#55555A"}}>Esta acción no se puede deshacer.</p></div><button style={{...s.btnPrincipal,background:"#FF3B30",marginBottom:10}} onClick={()=>{eliminar(confirmarEliminar);setConfirmarEliminar(null);}}><span style={{display:"flex",alignItems:"center",gap:6}}><Trash2 size={15}/>Sí, eliminar</span></button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E"}} onClick={()=>setConfirmarEliminar(null)}>Cancelar</button></div></div>}
      {modalTelefono&&createPortal(<div style={s.overlay} onClick={()=>setModalTelefono(null)}><div style={s.modal} onClick={e=>e.stopPropagation()}><p style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>Teléfono de {modalTelefono.nombre}</p><p style={{margin:"0 0 14px",fontSize:14,color:"#55555A"}}>Para llamarlo o mandarle WhatsApp desde la app.</p>{typeof navigator!=="undefined"&&(navigator as any).contacts&&<button type="button" onClick={async()=>{try{const c=await (navigator as any).contacts.select(["tel"],{multiple:false});if(c&&c[0]?.tel?.[0]){setTelInput(c[0].tel[0].replace(/\s/g,""));}}catch(e){}}} style={{...s.btnPrincipal,background:"#F2F2F7",color:"#1C1C1E",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>📱</span>Elegir de mis contactos</button>}<input style={{...s.input,marginBottom:16}} type="text" placeholder="+54 9 351 555 0000" value={telInput} onChange={e=>setTelInput(e.target.value)} inputMode="tel"/><button style={{...s.btnPrincipal,background:"#1C1C1E",marginBottom:10}} onClick={guardarTelefono}>Guardar</button><button style={{...s.btnPrincipal,background:"#F2F2F7",color:"#55555A"}} onClick={()=>setModalTelefono(null)}>Cancelar</button></div></div>,document.body)}
      {modalInvitarJSX}
        {asignacionRapidaJSX}
        {editorDibujo&&<ModalEditorDibujo src={editorDibujo.src} onGuardar={guardarDesdeEditorDibujo} onCerrar={()=>{const cont=editorDibujo.onListo;const original=editorDibujo.src;setEditorDibujo(null);cont?.(original);}}/>}
        {modalEditarObraJSX}
        {modalPeriodoJSX}
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
  cardObra:    { background:"#fff", borderRadius:18, padding:"16px", border:"2px solid #1C1C1E", cursor:"pointer", textAlign:"left", boxShadow:"0 2px 8px #0000000A", width:"100%" },
  overlay:     { position:"fixed", top:0, left:0, right:0, height:"100dvh", background:"#00000060", display:"flex", alignItems:"flex-end", zIndex:100 },
  modal:       { background:"#fff", borderRadius:"20px 20px 0 0", padding:"24px 20px 32px", width:"100%", boxSizing:"border-box", maxHeight:"92dvh", overflowY:"auto" },
};
