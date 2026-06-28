import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";

const MATERIAS = {
  DG:   { nombre: "Dirección de Grupo",                      color: "#6366f1" },
  TIC:  { nombre: "Informática",                             color: "#0ea5e9" },
  BIO:  { nombre: "Biología",                                color: "#22c55e" },
  ARTS: { nombre: "Artes",                                   color: "#f59e0b" },
  CHS:  { nombre: "Cátedra de Habilidades Socioemocionales", color: "#ec4899" },
  ENG:  { nombre: "Inglés",                                  color: "#14b8a6" },
  FHC:  { nombre: "Formación Humana y Cristiana",            color: "#8b5cf6" },
  GEO:  { nombre: "Geometría",                               color: "#f97316" },
  EDF:  { nombre: "Educación Física",                        color: "#10b981" },
  SS:   { nombre: "Social Studies",                          color: "#3b82f6" },
  LYL:  { nombre: "Lengua y Literatura",                     color: "#e11d48" },
  QUI:  { nombre: "Química",                                 color: "#06b6d4" },
  FIS:  { nombre: "Física",                                  color: "#7c3aed" },
  DAN:  { nombre: "Danzas",                                  color: "#f43f5e" },
  FRAN: { nombre: "Francés",                                 color: "#0284c7" },
  CRL:  { nombre: "Creación Literaria",                      color: "#d97706" },
  MUS:  { nombre: "Música",                                  color: "#9333ea" },
  MATH: { nombre: "Matemáticas",                             color: "#dc2626" },
};

const HORARIO = {
  1: ["DG","TIC","FHC","FHC","QUI","FIS","LYL"],
  2: ["DG","BIO","GEO","MATH","DAN","SS","MUS"],
  3: ["DG","ARTS","EDF","EDF","SS","ENG","ENG"],
  4: ["DG","CHS","SS","LYL","LYL","ENG","MATH"],
  5: ["DG","ENG","CHS","FRAN","FRAN","CRL","ENG","ENG"],
  6: ["DG","BIO","LYL","GEO","FRAN","MATH"],
};

const FESTIVOS_2026 = new Set([
  "2026-01-01","2026-01-12","2026-03-23","2026-04-02","2026-04-03",
  "2026-05-01","2026-05-18","2026-06-08","2026-06-15","2026-06-29",
  "2026-07-20","2026-08-07","2026-08-17","2026-10-12",
  "2026-11-02","2026-11-16","2026-12-08","2026-12-25",
]);

const DIAS_CERO = new Set([
  "2026-07-13","2026-07-17","2026-07-31",
  "2026-08-14",
  "2026-09-11","2026-09-14","2026-10-16",
]);

const VACACIONES = new Set([
  "2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09",
]);

const BIMESTRES = [
  { inicio: "2026-07-07", diaCiclo: 1 },
  { inicio: "2026-09-15", diaCiclo: 1 },
];

const REF_DATE = new Date(2026, 4, 25);
const REF_DIA_CICLO = 2;
const PASS = "profe602";

function esDiaHabil(date) {
  const d = date.getDay();
  const iso = date.toISOString().slice(0,10);
  return d !== 0 && d !== 6 && !FESTIVOS_2026.has(iso) && !DIAS_CERO.has(iso) && !VACACIONES.has(iso);
}

function esDiaCero(date) {
  return DIAS_CERO.has(date.toISOString().slice(0,10));
}

function esVacaciones(date) {
  return VACACIONES.has(date.toISOString().slice(0,10));
}

function getBimestreActivo(fecha) {
  const iso = fecha.toISOString().slice(0,10);
  let bim = null;
  for (const b of BIMESTRES) {
    if (iso >= b.inicio) bim = b;
  }
  return bim;
}

function calcularDiaCiclo(fecha, override) {
  if (override) return override;
  const iso = fecha.toISOString().slice(0,10);
  if (DIAS_CERO.has(iso)) return 0;

  const bim = getBimestreActivo(fecha);
  if (bim) {
    const refB = new Date(bim.inicio + "T12:00:00");
    const target = new Date(iso + "T12:00:00");
    let count = 0;
    let cur = new Date(refB);
    cur.setDate(cur.getDate()+1);
    while (cur <= target) {
      if (esDiaHabil(cur)) count++;
      cur.setDate(cur.getDate()+1);
    }
    return ((bim.diaCiclo - 1 + count) % 6) + 1;
  }

  let count = 0;
  const start = new Date(Math.min(fecha.getTime(), REF_DATE.getTime()));
  const end   = new Date(Math.max(fecha.getTime(), REF_DATE.getTime()));
  let cur = new Date(start);
  while (cur < end) {
    if (esDiaHabil(cur)) count++;
    cur.setDate(cur.getDate()+1);
  }
  if (fecha < REF_DATE) {
    let dia = REF_DIA_CICLO - (count % 6);
    if (dia <= 0) dia += 6;
    return dia;
  } else {
    return ((REF_DIA_CICLO - 1 + count) % 6) + 1;
  }
}

function fmtDate(d) { return d.toISOString().slice(0,10); }
function parseFecha(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); }
function fmtDisplay(s) {
  return parseFecha(s).toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
}

function loadTareas() { try { const r=localStorage.getItem("tareas602"); return r?JSON.parse(r):[]; } catch{return[];} }
function saveTareas(t) { try{localStorage.setItem("tareas602",JSON.stringify(t));}catch{} }
function loadOverrides() { try { const r=localStorage.getItem("cicloOverrides"); return r?JSON.parse(r):{}; } catch{return{};} }
function saveOverrides(o) { try{localStorage.setItem("cicloOverrides",JSON.stringify(o));}catch{} }

const S = {
  btnPrimary:   {background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontWeight:700,cursor:"pointer",fontSize:14},
  btnSecondary: {background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",fontWeight:600,cursor:"pointer",fontSize:14},
  btnSmall:     {background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",fontWeight:600,cursor:"pointer",fontSize:13},
  btnBack:      {background:"transparent",color:"#6366f1",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,marginBottom:12,padding:0},
  input:        {width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff"},
  label:        {fontSize:12,fontWeight:700,color:"#374151",marginBottom:4,display:"block"},
  h2:           {margin:"0 0 16px",color:"#1e293b",fontSize:20},
};

function Badge({codigo}) {
  const m = MATERIAS[codigo];
  return <span style={{background:m?.color||"#888",color:"#fff",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700,letterSpacing:0.5}}>{codigo}</span>;
}

function TareaCard({tarea, onClick, compact}) {
  const hoy = fmtDate(new Date());
  const vencida = tarea.fechaEntrega < hoy && !tarea.completada;
  const proxima = !tarea.completada && tarea.fechaEntrega >= hoy;
  return (
    <div onClick={()=>onClick(tarea)} style={{background:tarea.completada?"#f1f5f9":"#fff",border:`2px solid ${vencida?"#ef4444":proxima?MATERIAS[tarea.materia]?.color||"#6366f1":"#e2e8f0"}`,borderRadius:12,padding:compact?"8px 12px":"14px 16px",cursor:"pointer",marginBottom:8,opacity:tarea.completada?0.7:1,transition:"transform 0.15s",boxShadow:"0 2px 8px #0001"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <Badge codigo={tarea.materia}/>
        <span style={{fontSize:11,color:vencida?"#ef4444":"#64748b",fontWeight:600}}>{vencida?"⚠️ Vencida":`📅 ${fmtDisplay(tarea.fechaEntrega)}`}</span>
      </div>
      <div style={{fontWeight:700,marginTop:4,fontSize:14,color:"#1e293b"}}>{tarea.titulo}</div>
      {!compact&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>{tarea.descripcion?.slice(0,80)}{tarea.descripcion?.length>80?"…":""}</div>}
    </div>
  );
}

function FormTarea({inicial, onSave, onCancel, hoy}) {
  const [f, setF] = useState(()=>inicial||{materia:"MATH",titulo:"",descripcion:"",fechaEntrega:hoy,links:"",completada:false});
  const upd = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div style={{background:"#f8fafc",borderRadius:16,padding:20,border:"2px solid #e2e8f0"}}>
      <h3 style={{margin:"0 0 16px",color:"#1e293b"}}>{f.id?"✏️ Editar tarea":"➕ Nueva tarea"}</h3>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><label style={S.label}>Materia</label>
          <select value={f.materia} onChange={e=>upd("materia",e.target.value)} style={S.input}>
            {Object.entries(MATERIAS).map(([k,v])=><option key={k} value={k}>{k} – {v.nombre}</option>)}
          </select>
        </div>
        <div><label style={S.label}>Título *</label>
          <input value={f.titulo} onChange={e=>upd("titulo",e.target.value)} style={S.input} placeholder="¿Qué hay que hacer?"/>
        </div>
        <div><label style={S.label}>Descripción</label>
          <textarea value={f.descripcion} onChange={e=>upd("descripcion",e.target.value)} style={{...S.input,height:80,resize:"vertical"}} placeholder="Instrucciones, páginas..."/>
        </div>
        <div><label style={S.label}>Fecha de entrega *</label>
          <input type="date" value={f.fechaEntrega} onChange={e=>upd("fechaEntrega",e.target.value)} style={S.input}/>
        </div>
        <div><label style={S.label}>Links</label>
          <input value={f.links} onChange={e=>upd("links",e.target.value)} style={S.input} placeholder="https://..."/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={()=>{if(!f.titulo||!f.fechaEntrega){alert("Título y fecha son obligatorios");return;}onSave(f);}} style={S.btnPrimary}>💾 Guardar</button>
          <button onClick={onCancel} style={S.btnSecondary}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function AsistenteForm({mat, fecha, onNext, isLast}) {
  const [hayTarea, setHayTarea] = useState(null);
  const [titulo, setTitulo]     = useState("");
  const [desc, setDesc]         = useState("");
  const [fEntrega, setFEntrega] = useState(fecha);
  const [links, setLinks]       = useState("");

  function handleNext() {
    onNext(hayTarea ? {hayTarea:true,titulo,descripcion:desc,fechaEntrega:fEntrega,links} : {hayTarea:false});
  }

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={()=>setHayTarea(true)}  style={{...S.btnPrimary,flex:1,background:hayTarea===true?"#4338ca":"#6366f1"}}>✅ Sí hay tarea</button>
        <button onClick={()=>setHayTarea(false)} style={{...S.btnSecondary,flex:1,background:hayTarea===false?"#e2e8f0":"#fff"}}>❌ No hay tarea</button>
      </div>
      {hayTarea && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div><label style={S.label}>Título *</label>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} style={S.input} placeholder="¿Qué hay que hacer?"/>
          </div>
          <div><label style={S.label}>Descripción</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} style={{...S.input,height:70,resize:"vertical"}} placeholder="Detalles, páginas..."/>
          </div>
          <div><label style={S.label}>Fecha de entrega</label>
            <input type="date" value={fEntrega} onChange={e=>setFEntrega(e.target.value)} style={S.input}/>
          </div>
          <div><label style={S.label}>Links</label>
            <input value={links} onChange={e=>setLinks(e.target.value)} style={S.input} placeholder="https://..."/>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={handleNext} disabled={hayTarea===null||(hayTarea&&!titulo)}
          style={{...S.btnPrimary,flex:1,opacity:(hayTarea===null||(hayTarea&&!titulo))?0.5:1}}>
          {isLast?"Finalizar ✅":"Siguiente →"}
        </button>
      </div>
    </div>
  );
}

const FECHAS_VERIFICAR = [
  {fecha:"2026-07-07", esperado:"Día 1"},
  {fecha:"2026-07-10", esperado:"Día 4"},
  {fecha:"2026-07-13", esperado:"🎭 Día 0"},
  {fecha:"2026-07-14", esperado:"Día 5"},
  {fecha:"2026-07-15", esperado:"Día 6"},
  {fecha:"2026-07-16", esperado:"Día 1"},
  {fecha:"2026-07-17", esperado:"🎭 Día 0"},
  {fecha:"2026-07-21", esperado:"Día 2"},
  {fecha:"2026-07-23", esperado:"Día 4"},
  {fecha:"2026-07-31", esperado:"🎭 Día 0"},
  {fecha:"2026-08-14", esperado:"🎭 Día 0"},
  {fecha:"2026-09-10", esperado:"Día 5"},
  {fecha:"2026-09-15", esperado:"Día 1"},
  {fecha:"2026-10-05", esperado:"📴 Vacaciones"},
  {fecha:"2026-10-13", esperado:"Día 3"},
  {fecha:"2026-10-16", esperado:"🎭 Día 0"},
  {fecha:"2026-11-05", esperado:"Día 6"},
  {fecha:"2026-11-17", esperado:"Día 1"},
  {fecha:"2026-11-18", esperado:"Día 2"},
];

export default function App() {
  const [vista, setVista]               = useState("inicio");
  const [tareas, setTareas]             = useState(loadTareas);
  const [overrides, setOverrides]       = useState(loadOverrides);
  const [loggedIn, setLoggedIn]         = useState(false);
  const [passInput, setPassInput]       = useState("");
  const [passError, setPassError]       = useState(false);
  const [tareaDetalle, setTareaDetalle] = useState(null);
  const [mesCalendario, setMesCalendario] = useState(()=>{const h=new Date();return{y:h.getFullYear(),m:h.getMonth()};});
  const [formTarea, setFormTarea]       = useState(null);
  const [tabAdmin, setTabAdmin]         = useState("tareas");
  const [showLogin, setShowLogin]       = useState(false);
  const [asisStep, setAsisStep]         = useState(0);
  const [asisFecha, setAsisFecha]       = useState("");
  const [asisDia, setAsisDia]           = useState(null);
  const [asisMats, setAsisMats]         = useState([]);
  const [asisCurrent, setAsisCurrent]   = useState(0);
  const [asisGuardadas, setAsisGuardadas] = useState([]);

  useEffect(()=>{ saveTareas(tareas); }, [tareas]);
  useEffect(()=>{ saveOverrides(overrides); }, [overrides]);

  const hoy = fmtDate(new Date());
  const esHabilHoy  = esDiaHabil(new Date());
  const esCeroHoy   = esDiaCero(new Date());
  const esVacHoy    = esVacaciones(new Date());
  const diaHoy = esHabilHoy ? calcularDiaCiclo(new Date(), overrides[hoy]) : esCeroHoy ? 0 : null;

  const tareasActivas   = tareas.filter(t=>!t.completada);
  const tareasHistorial = tareas.filter(t=>t.completada||t.fechaEntrega<hoy);

  function handleLogin() {
    if (passInput===PASS) { setLoggedIn(true);setPassError(false);setShowLogin(false);setPassInput("");setVista("admin");setTabAdmin("tareas"); }
    else setPassError(true);
  }

  function guardarTarea(t) {
    if (t.id) setTareas(p=>p.map(x=>x.id===t.id?t:x));
    else setTareas(p=>[...p,{...t,id:Date.now().toString(),creadoEn:hoy}]);
    setFormTarea(null); setTabAdmin("tareas");
  }
  function eliminarTarea(id) { if(confirm("¿Eliminar esta tarea?")) setTareas(p=>p.filter(t=>t.id!==id)); }
  function completarTarea(id) { setTareas(p=>p.map(t=>t.id===id?{...t,completada:!t.completada}:t)); }

  function iniciarAsistente() {
    let sig = new Date(); sig.setDate(sig.getDate()+1);
    while (!esDiaHabil(sig)) sig.setDate(sig.getDate()+1);
    const sigStr = fmtDate(sig);
    const diaSig = calcularDiaCiclo(sig, overrides[sigStr]);
    const mats = [...new Set(HORARIO[diaSig]||[])].filter(m=>m!=="DG");
    setAsisFecha(sigStr); setAsisDia(diaSig); setAsisMats(mats);
    setAsisCurrent(0); setAsisGuardadas([]);
    setAsisStep(1); setVista("asistente");
  }

  function renderCalendario() {
    const {y,m} = mesCalendario;
    const primerDia = new Date(y,m,1).getDay();
    const diasMes   = new Date(y,m+1,0).getDate();
    const celdas = [];
    for (let i=0;i<primerDia;i++) celdas.push(null);
    for (let d=1;d<=diasMes;d++) celdas.push(d);
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>setMesCalendario(p=>p.m===0?{y:p.y-1,m:11}:{y:p.y,m:p.m-1})} style={S.btnSmall}>◀</button>
          <span style={{fontWeight:800,fontSize:18,color:"#1e293b"}}>{meses[m]} {y}</span>
          <button onClick={()=>setMesCalendario(p=>p.m===11?{y:p.y+1,m:0}:{y:p.y,m:p.m+1})} style={S.btnSmall}>▶</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
          {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d,i)=>(
            <div key={i} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#64748b",padding:"4px 0"}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {celdas.map((d,i)=>{
            if (!d) return <div key={i}/>;
            const fs = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const esHoy2 = fs===hoy;
            const td = tareas.filter(t=>t.fechaEntrega===fs&&!t.completada);
            const dow = new Date(y,m,d).getDay();
            const noHabil = dow===0||dow===6||FESTIVOS_2026.has(fs);
            const esCero2 = DIAS_CERO.has(fs);
            const esVac2  = VACACIONES.has(fs);
            return (
              <div key={i} style={{minHeight:52,background:esHoy2?"#6366f1":esCero2?"#fef9c3":esVac2?"#dbeafe":noHabil?"#f8fafc":"#fff",border:esHoy2?"2px solid #4338ca":"1px solid #e2e8f0",borderRadius:8,padding:4,cursor:td.length?"pointer":"default",opacity:noHabil?0.5:1}}
                onClick={()=>{ if(td.length){setTareaDetalle({multi:true,fecha:fs,lista:td});setVista("detalle");} }}>
                <div style={{fontSize:11,fontWeight:esHoy2?800:600,color:esHoy2?"#fff":"#374151",textAlign:"right"}}>{d}</div>
                {esCero2&&<div style={{fontSize:8,color:"#854d0e",fontWeight:700,textAlign:"center"}}>Día 0</div>}
                {esVac2&&<div style={{fontSize:8,color:"#1e40af",fontWeight:700,textAlign:"center"}}>Vac.</div>}
                {td.slice(0,3).map(t=>(
                  <div key={t.id} style={{background:MATERIAS[t.materia]?.color||"#888",color:"#fff",borderRadius:4,fontSize:9,padding:"1px 3px",marginTop:1,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.materia}</div>
                ))}
                {td.length>3&&<div style={{fontSize:9,color:"#64748b",textAlign:"center"}}>+{td.length-3}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
          {[{color:"#fef9c3",label:"Día 0 / Evento"},{color:"#dbeafe",label:"Vacaciones"},{color:"#f8fafc",label:"Festivo/Fin de semana"}].map(l=>(
            <div key={l.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748b"}}>
              <div style={{width:12,height:12,borderRadius:3,background:l.color,border:"1px solid #e2e8f0"}}/>
              {l.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function VistaDetalle() {
    if (!tareaDetalle) return null;
    if (tareaDetalle.multi) return (
      <div>
        <button onClick={()=>setVista("calendario")} style={S.btnBack}>← Volver</button>
        <h2 style={S.h2}>📅 Tareas: {fmtDisplay(tareaDetalle.fecha)}</h2>
        {tareaDetalle.lista.map(t=><TareaCard key={t.id} tarea={t} onClick={t=>{setTareaDetalle(t);}} compact={false}/>)}
      </div>
    );
    const t = tareaDetalle;
    return (
      <div>
        <button onClick={()=>setVista("inicio")} style={S.btnBack}>← Volver</button>
        <div style={{background:"#fff",borderRadius:16,padding:20,border:`3px solid ${MATERIAS[t.materia]?.color||"#888"}`,boxShadow:"0 4px 24px #0002"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <Badge codigo={t.materia}/><span style={{fontSize:12,color:"#64748b"}}>{fmtDisplay(t.creadoEn||hoy)}</span>
          </div>
          <h2 style={{margin:"12px 0 4px",color:"#1e293b",fontSize:20}}>{t.titulo}</h2>
          <div style={{color:"#64748b",fontSize:13,marginBottom:12}}>{MATERIAS[t.materia]?.nombre}</div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:12,marginBottom:12}}>
            <div style={{fontWeight:700,color:"#374151",marginBottom:4}}>📝 Descripción</div>
            <div style={{color:"#475569",whiteSpace:"pre-wrap"}}>{t.descripcion||"Sin descripción adicional."}</div>
          </div>
          <div style={{background:"#fef3c7",borderRadius:10,padding:10,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>📅</span>
            <div>
              <div style={{fontSize:11,color:"#92400e",fontWeight:700}}>FECHA DE ENTREGA</div>
              <div style={{fontWeight:800,color:"#78350f",fontSize:16}}>{fmtDisplay(t.fechaEntrega)}</div>
            </div>
          </div>
          {t.links&&(
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:700,color:"#374151",marginBottom:4}}>🔗 Links</div>
              {t.links.split("\n").map((l,i)=>(
                <a key={i} href={l.startsWith("http")?l:"https://"+l} target="_blank" rel="noreferrer" style={{display:"block",color:"#6366f1",fontSize:13,marginBottom:2}}>{l}</a>
              ))}
            </div>
          )}
          {loggedIn&&(
            <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
              <button onClick={()=>{setFormTarea(t);setTabAdmin("nueva");setVista("admin");}} style={S.btnPrimary}>✏️ Editar</button>
              <button onClick={()=>completarTarea(t.id)} style={{...S.btnSecondary,background:t.completada?"#dcfce7":"#f0fdf4",color:t.completada?"#166534":"#16a34a"}}>{t.completada?"↩️ Restaurar":"✅ Completar"}</button>
              <button onClick={()=>{eliminarTarea(t.id);setVista("admin");}} style={{...S.btnSecondary,color:"#ef4444"}}>🗑️ Eliminar</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function VistaAsistente() {
    const mat = asisMats[asisCurrent];
    const diasNombres = {1:"Día 1",2:"Día 2",3:"Día 3",4:"Día 4",5:"Día 5",6:"Día 6"};

    function handleNext(data) {
      if (data.hayTarea && data.titulo) {
        const nueva = {id:Date.now().toString()+asisCurrent,materia:mat,titulo:data.titulo,descripcion:data.descripcion||"",fechaEntrega:data.fechaEntrega||asisFecha,links:data.links||"",completada:false,creadoEn:hoy};
        setTareas(p=>[...p,nueva]);
        setAsisGuardadas(p=>[...p,mat]);
      }
      if (asisCurrent<asisMats.length-1) setAsisCurrent(c=>c+1);
      else setAsisStep(3);
    }

    if (asisStep===1) return (
      <div style={{textAlign:"center",padding:20}}>
        <div style={{fontSize:48,marginBottom:8}}>🤖</div>
        <h2 style={{color:"#6366f1",margin:"0 0 8px"}}>Asistente de Tareas</h2>
        <p style={{color:"#64748b",marginBottom:20}}>Mañana es <strong>{fmtDisplay(asisFecha)}</strong><br/><strong style={{color:"#6366f1",fontSize:18}}>{diasNombres[asisDia]}</strong> del ciclo</p>
        <div style={{background:"#f1f5f9",borderRadius:12,padding:12,marginBottom:20,textAlign:"left"}}>
          <div style={{fontWeight:700,color:"#374151",marginBottom:8}}>Materias de mañana:</div>
          {asisMats.map(m=><div key={m} style={{marginBottom:4}}><Badge codigo={m}/> <span style={{fontSize:13,color:"#64748b"}}>{MATERIAS[m]?.nombre}</span></div>)}
        </div>
        <button onClick={()=>setAsisStep(2)} style={S.btnPrimary}>🚀 Empezar</button>
        <button onClick={()=>setVista("inicio")} style={{...S.btnSecondary,marginLeft:8}}>Cancelar</button>
      </div>
    );

    if (asisStep===2) return (
      <div style={{padding:8}}>
        <div style={{background:"#6366f1",color:"#fff",borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:11,opacity:0.8,marginBottom:4}}>{asisCurrent+1} de {asisMats.length}</div>
          <Badge codigo={mat}/> <span style={{fontWeight:700,fontSize:16}}> {MATERIAS[mat]?.nombre}</span>
          <div style={{marginTop:4,fontSize:13,opacity:0.9}}>¿Hay tarea para mañana?</div>
        </div>
        <AsistenteForm key={mat} mat={mat} fecha={asisFecha} onNext={handleNext} isLast={asisCurrent===asisMats.length-1}/>
        <div style={{display:"flex",gap:4,marginTop:12,justifyContent:"center"}}>
          {asisMats.map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i===asisCurrent?"#6366f1":i<asisCurrent?"#22c55e":"#e2e8f0"}}/>
          ))}
        </div>
      </div>
    );

    if (asisStep===3) return (
      <div style={{textAlign:"center",padding:20}}>
        <div style={{fontSize:64}}>🎉</div>
        <h2 style={{color:"#22c55e"}}>¡Tareas registradas!</h2>
        <p style={{color:"#64748b",marginBottom:16}}>{asisGuardadas.length>0?`Se guardaron ${asisGuardadas.length} tarea(s).`:"No se registraron tareas nuevas."}</p>
        {asisGuardadas.length>0&&<div style={{background:"#f0fdf4",borderRadius:12,padding:12,marginBottom:16,textAlign:"left"}}>{asisGuardadas.map(m=><div key={m} style={{marginBottom:4}}><Badge codigo={m}/></div>)}</div>}
        <button onClick={()=>setVista("inicio")} style={S.btnPrimary}>Ir al inicio</button>
      </div>
    );
    return null;
  }

  function VistaAdmin() {
    const [overrideHoy, setOverrideHoy] = useState(overrides[hoy]||"");
    return (
      <div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["tareas","nueva","ciclo"].map(t=>(
            <button key={t} onClick={()=>setTabAdmin(t)} style={{...S.btnSmall,background:tabAdmin===t?"#6366f1":"#f1f5f9",color:tabAdmin===t?"#fff":"#374151",padding:"6px 14px",fontSize:13}}>
              {t==="tareas"?"📋 Tareas":t==="nueva"?"➕ Nueva":"🔄 Ciclo"}
            </button>
          ))}
          <button onClick={()=>{setLoggedIn(false);setVista("inicio");}} style={{...S.btnSmall,background:"#fef2f2",color:"#ef4444",marginLeft:"auto"}}>🚪 Salir</button>
        </div>

        {tabAdmin==="nueva"&&<FormTarea key={formTarea?.id||"new"} inicial={formTarea} onSave={guardarTarea} onCancel={()=>{setFormTarea(null);setTabAdmin("tareas");}} hoy={hoy}/>}

        {tabAdmin==="tareas"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h3 style={{margin:0,color:"#1e293b"}}>Todas las tareas ({tareas.length})</h3>
              <button onClick={iniciarAsistente} style={{...S.btnPrimary,fontSize:12,padding:"6px 12px"}}>🤖 Asistente</button>
            </div>
            {tareas.length===0&&<div style={{color:"#94a3b8",textAlign:"center",padding:32}}>No hay tareas. ¡Crea la primera!</div>}
            {tareas.map(t=>(
              <div key={t.id} style={{position:"relative"}}>
                <TareaCard tarea={t} onClick={t=>{setTareaDetalle(t);setVista("detalle");}} compact={false}/>
                <div style={{position:"absolute",top:8,right:8,display:"flex",gap:4}}>
                  <button onClick={e=>{e.stopPropagation();completarTarea(t.id);}} style={{...S.btnSmall,fontSize:11,padding:"2px 6px",background:t.completada?"#dcfce7":"#f0fdf4",color:t.completada?"#166534":"#16a34a"}}>{t.completada?"↩️":"✅"}</button>
                  <button onClick={e=>{e.stopPropagation();setFormTarea(t);setTabAdmin("nueva");}} style={{...S.btnSmall,fontSize:11,padding:"2px 6px"}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();eliminarTarea(t.id);}} style={{...S.btnSmall,fontSize:11,padding:"2px 6px",background:"#fef2f2",color:"#ef4444"}}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tabAdmin==="ciclo"&&(
          <div>
            <h3 style={{color:"#1e293b",margin:"0 0 12px"}}>🔄 Ajuste de Día de Ciclo</h3>
            <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{color:"#64748b",fontSize:13,marginBottom:12}}>Si hay festivo o evento especial, corrige el día de ciclo aquí.</div>
              <div style={{fontWeight:700,color:"#1e293b",marginBottom:8}}>Hoy ({fmtDisplay(hoy)}):</div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:"#6366f1",fontWeight:800,fontSize:16}}>{diaHoy===0?"🎭 Día 0":diaHoy?`Día ${diaHoy}`:"Sin clases"}</span>
                <select value={overrideHoy} onChange={e=>setOverrideHoy(e.target.value)} style={{...S.input,width:"auto"}}>
                  <option value="">Sin corrección</option>
                  {[1,2,3,4,5,6].map(d=><option key={d} value={d}>Día {d}</option>)}
                </select>
                <button onClick={()=>{const o={...overrides};if(overrideHoy)o[hoy]=Number(overrideHoy);else delete o[hoy];setOverrides(o);alert("Guardado ✅");}} style={S.btnPrimary}>Guardar</button>
              </div>
            </div>

            <div style={{background:"#eff6ff",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #bfdbfe"}}>
              <div style={{fontWeight:700,color:"#1e40af",marginBottom:10}}>🔍 Verificador de fechas</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {FECHAS_VERIFICAR.map(({fecha, esperado})=>{
                  const f = parseFecha(fecha);
                  const iso = fecha;
                  const esCero2 = DIAS_CERO.has(iso);
                  const esVac2  = VACACIONES.has(iso);
                  const esHabil2 = esDiaHabil(f);
                  let calculado;
                  if (esCero2) calculado = "🎭 Día 0";
                  else if (esVac2) calculado = "📴 Vacaciones";
                  else if (!esHabil2) calculado = "📴 No hábil";
                  else calculado = `Día ${calcularDiaCiclo(f, null)}`;
                  const ok = calculado === esperado;
                  return (
                    <div key={fecha} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:ok?"#f0fdf4":"#fef2f2",borderRadius:8,padding:"6px 10px",border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,flexWrap:"wrap",gap:4}}>
                      <span style={{fontSize:12,color:"#64748b",fontWeight:600}}>{fmtDisplay(fecha)}</span>
                      <span style={{fontSize:12,fontWeight:700,color:ok?"#16a34a":"#dc2626"}}>{calculado} {ok?"✅":"❌"}</span>
                      <span style={{fontSize:11,color:"#94a3b8"}}>esp: {esperado}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{background:"#fffbeb",borderRadius:12,padding:12,border:"1px solid #fde68a"}}>
              <div style={{fontWeight:700,color:"#92400e",marginBottom:4}}>📌 Referencias</div>
              <div style={{color:"#78350f",fontSize:12}}>• Lun 25 mayo 2026 = Día 2 (Bimestre 2)</div>
              <div style={{color:"#78350f",fontSize:12}}>• Mar 7 julio 2026 = Día 1 (Bimestre 3)</div>
              <div style={{color:"#78350f",fontSize:12}}>• Mar 15 sep 2026 = Día 1 (Bimestre 4)</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const navItems = [{id:"inicio",icon:"🏠",label:"Inicio"},{id:"calendario",icon:"📅",label:"Calendario"},{id:"historial",icon:"📚",label:"Historial"}];

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"linear-gradient(135deg,#667eea22,#764ba222)",minHeight:"100vh",maxWidth:600,margin:"0 auto"}}>
      <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",padding:"16px 20px",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px #6366f144"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:900,fontSize:18,letterSpacing:-0.5}}>📚 Tareógrafo 602</div>
            <div style={{fontSize:11,opacity:0.85}}>Colegio Santo Tomás de Aquino</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{textAlign:"right",fontSize:11,opacity:0.85}}>
              <div>{diaHoy===0?"🎭 Día 0":diaHoy?<>Hoy: <strong>Día {diaHoy}</strong></>:<strong>Sin clases</strong>}</div>
              <div style={{fontSize:10}}>{tareasActivas.length} tarea(s) activa(s)</div>
            </div>
            {!loggedIn
              ? <button onClick={()=>setShowLogin(true)} style={{background:"rgba(255,255,255,0.2)",color:"#fff",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>🔐 Profe</button>
              : <button onClick={iniciarAsistente} style={{background:"rgba(255,255,255,0.2)",color:"#fff",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>🤖 Asistente</button>
            }
          </div>
        </div>
      </div>

      {showLogin&&(
        <div style={{position:"fixed",inset:0,background:"#0006",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,width:300,boxShadow:"0 20px 60px #0003"}}>
            <h3 style={{margin:"0 0 16px",color:"#1e293b"}}>🔐 Acceso Docente</h3>
            <input type="password" value={passInput} onChange={e=>setPassInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Contraseña" style={{...S.input,marginBottom:8}} autoFocus/>
            {passError&&<div style={{color:"#ef4444",fontSize:12,marginBottom:8}}>Contraseña incorrecta</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleLogin} style={{...S.btnPrimary,flex:1}}>Entrar</button>
              <button onClick={()=>{setShowLogin(false);setPassError(false);setPassInput("");}} style={S.btnSecondary}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:"16px 16px 80px"}}>
        {vista==="detalle"    && <VistaDetalle/>}
        {vista==="asistente"  && <VistaAsistente/>}
        {vista==="admin"      && loggedIn && <VistaAdmin/>}
        {vista==="calendario" && <div><h2 style={S.h2}>📅 Calendario de Tareas</h2>{renderCalendario()}</div>}
        {vista==="historial"  && (
          <div>
            <h2 style={S.h2}>📚 Historial de Tareas</h2>
            {tareasHistorial.length===0
              ? <div style={{color:"#94a3b8",textAlign:"center",padding:32}}>No hay tareas en el historial aún.</div>
              : tareasHistorial.map(t=><TareaCard key={t.id} tarea={t} onClick={t=>{setTareaDetalle(t);setVista("detalle");}} compact={false}/>)
            }
          </div>
        )}
        {vista==="inicio"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",borderRadius:16,padding:20,marginBottom:16,boxShadow:"0 4px 20px #6366f133"}}>
              <div style={{fontSize:12,opacity:0.8,marginBottom:2}}>HOY</div>
              {esCeroHoy ? <>
                <div style={{fontWeight:900,fontSize:22}}>🎭 Día 0 — Evento Especial</div>
                <div style={{fontSize:13,opacity:0.85,marginTop:2}}>{new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div style={{fontSize:12,opacity:0.75,marginTop:6}}>Olimpiadas / Muestra cultural / Evento institucional</div>
              </> : esVacHoy ? <>
                <div style={{fontWeight:900,fontSize:22}}>🏖️ Vacaciones</div>
                <div style={{fontSize:13,opacity:0.85,marginTop:2}}>{new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div style={{fontSize:12,opacity:0.75,marginTop:6}}>¡Disfruta el descanso! 🎉</div>
              </> : diaHoy ? <>
                <div style={{fontWeight:900,fontSize:24}}>Día {diaHoy} del Ciclo</div>
                <div style={{fontSize:13,opacity:0.85,marginTop:2}}>{new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[...new Set(HORARIO[diaHoy]||[])].map(m=><Badge key={m} codigo={m}/>)}
                </div>
              </> : <>
                <div style={{fontWeight:900,fontSize:22}}>📴 Sin clases hoy</div>
                <div style={{fontSize:13,opacity:0.85,marginTop:2}}>{new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div style={{fontSize:12,opacity:0.75,marginTop:6}}>Es fin de semana o festivo — ¡a descansar! 🎉</div>
              </>}
            </div>

            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h3 style={{margin:0,color:"#1e293b",fontSize:16}}>📋 Próximas tareas</h3>
                {loggedIn&&<button onClick={()=>{setFormTarea(null);setTabAdmin("nueva");setVista("admin");}} style={{...S.btnSmall,background:"#6366f1",color:"#fff"}}>+ Nueva</button>}
              </div>
              {tareasActivas.length===0
                ? <div style={{background:"#f8fafc",borderRadius:12,padding:24,textAlign:"center",color:"#94a3b8"}}>🎉 ¡No hay tareas pendientes!</div>
                : [...tareasActivas].sort((a,b)=>a.fechaEntrega.localeCompare(b.fechaEntrega)).slice(0,5).map(t=>(
                    <TareaCard key={t.id} tarea={t} onClick={t=>{setTareaDetalle(t);setVista("detalle");}} compact={false}/>
                  ))
              }
            </div>

            {loggedIn&&(
              <div style={{background:"#fffbeb",borderRadius:12,padding:14,border:"1px solid #fde68a",marginBottom:16}}>
                <div style={{fontWeight:700,color:"#92400e",marginBottom:8}}>⚡ Acceso rápido (Docente)</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={iniciarAsistente} style={{...S.btnPrimary,fontSize:13}}>🤖 Asistente guiado</button>
                  <button onClick={()=>setVista("admin")} style={{...S.btnSecondary,fontSize:13}}>⚙️ Administrar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,background:"#fff",borderTop:"1px solid #e2e8f0",display:"flex",boxShadow:"0 -4px 20px #0001",zIndex:99}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setVista(n.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:20}}>{n.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:vista===n.id?"#6366f1":"#94a3b8"}}>{n.label}</span>
          </button>
        ))}
        {loggedIn&&(
          <button onClick={()=>setVista("admin")} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:20}}>⚙️</span>
            <span style={{fontSize:10,fontWeight:700,color:vista==="admin"?"#6366f1":"#94a3b8"}}>Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}