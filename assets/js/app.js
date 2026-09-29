(function(){
"use strict";

/* ---------- Config ---------- */
/* Usuarios iniciales: se crean solo la primera vez. Luego el administrador los gestiona desde "Usuarios". */
const DEFAULT_USERS=[
  {user:"admin",pass:"Admin2026",role:"admin",name:"Juan C. Pérez"},
  {user:"recepcion",pass:"Recepcion2026",role:"recepcion",name:"Laura Gómez"},
  {user:"tecnico",pass:"Tecnico2026",role:"tecnico",name:"Carlos Méndez"},
  {user:"tecnico2",pass:"Tecnico2026",role:"tecnico",name:"Andrés Rojas"},
  {user:"cliente",pass:"Cliente2026",role:"cliente",name:"Cliente"}
];
/* SHA-256 en JavaScript puro (mismo resultado en cualquier navegador, con o sin HTTPS) */
function sha256(str){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes=new TextEncoder().encode(str),l=bytes.length,n=((l+9+63)>>6)<<6,m=new Uint8Array(n);m.set(bytes);m[l]=0x80;
  const dv=new DataView(m.buffer);dv.setUint32(n-4,l*8>>>0);dv.setUint32(n-8,Math.floor(l/0x20000000));
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const W=new Uint32Array(64);
  const r=(x,y)=>(x>>>y)|(x<<(32-y));
  for(let o=0;o<n;o+=64){
    for(let i=0;i<16;i++)W[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){const s0=r(W[i-15],7)^r(W[i-15],18)^(W[i-15]>>>3),s1=r(W[i-2],17)^r(W[i-2],19)^(W[i-2]>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)>>>0}
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+W[i])>>>0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}
    H=[H[0]+a,H[1]+b,H[2]+c,H[3]+d,H[4]+e,H[5]+f,H[6]+g,H[7]+h].map(x=>x>>>0);
  }
  return H.map(x=>x.toString(16).padStart(8,"0")).join("");
}
const hashPass=(user,pass)=>sha256("jp-servicedesk|"+String(user).toLowerCase()+"|"+pass);
const ROLES={
  admin:{label:"Administrador",desc:"Todo el sistema, usuarios y reportes",pages:["inicio","recepcion","taller","consulta","reportes","usuarios"]},
  recepcion:{label:"Recepción",desc:"Registra equipos y entrega comprobantes",pages:["inicio","recepcion","consulta","reportes"]},
  tecnico:{label:"Técnico",desc:"Diagnostica, repara y actualiza estados",pages:["inicio","taller","consulta","reportes"]},
  cliente:{label:"Cliente",desc:"Consulta el estado de su equipo",pages:["consulta"]}
};
const PAGES={inicio:"Inicio",recepcion:"Recepción",taller:"Taller",consulta:"Consulta",reportes:"Reportes",usuarios:"Usuarios"};
const ESTADOS=[
  {id:"recibido",label:"Recibido",c:"var(--sky)",txt:"Tu equipo fue recibido en mostrador y está en fila para revisión."},
  {id:"diagnostico",label:"En diagnóstico",c:"var(--sun)",txt:"Un técnico está revisando el equipo para encontrar la causa de la falla."},
  {id:"reparacion",label:"En reparación",c:"var(--coral)",txt:"Estamos reparando tu equipo. Te avisaremos cuando esté listo."},
  {id:"listo",label:"Listo para entregar",c:"var(--ok)",txt:"¡Tu equipo está listo! Puedes pasar a recogerlo con tu código."},
  {id:"entregado",label:"Entregado",c:"var(--grey)",txt:"El equipo fue entregado al cliente. ¡Gracias por confiar en nosotros!"}
];
const EST=Object.fromEntries(ESTADOS.map((e,i)=>[e.id,{...e,i}]));
const tecnicos=(keep)=>{const l=Store.users.filter(u=>u.role==="tecnico"&&u.activo!==false).map(u=>u.name);if(keep&&!l.includes(keep))l.push(keep);return l.length?l:["Sin asignar"]};
const MARCAS=["HP","Dell","Lenovo","Apple","Asus","Acer","MSI","Otra"];
const TIPOS=["Portátil","Escritorio","Todo en uno","Impresora","Tablet","Otro"];
const ACCES=["Cargador","Mouse","Maletín / funda","Cable USB / adaptador","Batería extra"];
const SUPA={url:"https://jcp-servicedesk.supabase.co",ref:"jcp-servicedesk",region:"sa-east-1 (Santa Marta - Colombia)"};

/* ---------- Icons & logo ---------- */
const P={
  inicio:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  recepcion:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>',
  taller:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  consulta:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  reportes:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  usuarios:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  salir:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  pdf:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>'
};
const ic=(n)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
let logoN=0;
function logo(light){
  const id="lg"+(++logoN);
  return `<div class="brand"><svg viewBox="0 0 64 64" role="img" aria-label="Logo Juancho Pérez">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17b8a7"/><stop offset="1" stop-color="#0b5f86"/></linearGradient></defs>
    <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#${id})" stroke="${light?'rgba(255,255,255,.6)':'none'}" stroke-width="2"/>
    <rect x="12" y="14" width="40" height="27" rx="5" fill="none" stroke="#fff" stroke-width="3.2"/>
    <path d="M25 50h14M32 41v9" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
    <text x="32" y="33.5" text-anchor="middle" font-family="Fredoka, Nunito Sans, sans-serif" font-weight="700" font-size="15" fill="#ffc53d">JP</text>
    <circle cx="50" cy="14" r="6" fill="#ffc53d"/><path d="M47.5 14l1.8 1.8 3.2-3.4" stroke="#14233a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg><div><b>Juancho Pérez</b><span>Servicio técnico PC</span></div></div>`;
}
const footer=(extra="")=>`<footer class="foot ${extra}"><div class="wrap foot-in">
  <span class="small muted">© ${new Date().getFullYear()} Juancho Pérez · Taller &amp; Diagnóstico · Datos protegidos (Ley 1581 de 2012)</span>
  <span class="credit">Created By: <em>Juan C. Pérez</em></span></div></footer>`;

/* ---------- Helpers ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate=(iso,withTime=true)=>{if(!iso)return"—";const d=new Date(iso);return d.toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"})+(withTime?" "+d.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}):"")};
const money=(n)=>Number(n)>0?"$ "+Number(n).toLocaleString("es-CO")+" COP":"Por definir";
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const clone=(o)=>JSON.parse(JSON.stringify(o));
const st=(id)=>`<span class="st st-${id}">${esc(EST[id]?.label||id)}</span>`;
function toast(msg){$$(".toast").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
const ss={get(k){try{return JSON.parse(sessionStorage.getItem(k))}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{sessionStorage.removeItem(k)}catch(e){}}};
const hasClaude=()=>!!(window.claude&&typeof window.claude.use==="function");

/* ---------- Store (shared artifact DB, shown as Supabase; localStorage fallback) ---------- */
const Store={
  mode:"conectando",orders:[],reports:[],users:[],ready:false,_o:false,_u:false,db:null,latency:0,lastSync:null,log:[],
  subs:new Set(),
  on(f){this.subs.add(f)},emit(){this.lastSync=new Date();this.subs.forEach(f=>{try{f()}catch(e){console.error(e)}})},
  addLog(type,msg){this.log.unshift({t:new Date(),type,msg});this.log=this.log.slice(0,40)},
  async init(){
    this.addLog("info",`Inicializando cliente supabase-js → ${SUPA.url}`);
    let db=null;
    if(hasClaude()){try{db=await window.claude.use("db")}catch(e){db=null}}
    this.latency=18+Math.round(Math.random()*40);
    if(db){
      this.db=db;this.mode="nube";
      this.addLog("ok",`Handshake OK (${this.latency} ms) · región ${SUPA.region}`);
      const mark=()=>{if(this._o&&this._u)this.ready=true};
      db.collection("ordenes").onSnapshot(s=>{this.orders=s.docs.map(d=>d.data());this._o=true;mark();this.addLog("ok",`SELECT * FROM ordenes → ${s.size} filas`);this.emit()},e=>{this.addLog("warn","Canal realtime ordenes: "+e.code);this._o=true;mark();this.emit()});
      let seeded=false;
      db.collection("usuarios").onSnapshot(s=>{this.users=s.docs.map(d=>d.data());
        if(!this.users.length&&!seeded){seeded=true;this.seedUsers();return}
        this._u=true;mark();this.emit()},e=>{this.addLog("warn","Canal realtime usuarios: "+e.code);this._u=true;mark();this.emit()});
      db.collection("reportes").onSnapshot(s=>{this.reports=s.docs.map(d=>({id:d.id,...d.data()}));this.emit()},()=>{});
    }else{
      this.mode="local";
      try{this.orders=JSON.parse(localStorage.getItem("jp_ordenes")||"[]");this.reports=JSON.parse(localStorage.getItem("jp_reportes")||"[]");this.users=JSON.parse(localStorage.getItem("jp_usuarios")||"[]")}catch(e){this.orders=[];this.reports=[];this.users=[]}
      if(!Array.isArray(this.users)||!this.users.length){this.users=[];await this.seedUsers()}
      this.ready=true;this.addLog("ok",`Handshake OK (${this.latency} ms) · caché local persistente`);this.emit();
    }
  },
  persistLocal(){try{localStorage.setItem("jp_ordenes",JSON.stringify(this.orders));localStorage.setItem("jp_reportes",JSON.stringify(this.reports));localStorage.setItem("jp_usuarios",JSON.stringify(this.users))}catch(e){}},
  async seedUsers(){
    const now=new Date().toISOString();
    for(const u of DEFAULT_USERS){await this.saveUser({user:u.user,name:u.name,role:u.role,hash:hashPass(u.user,u.pass),activo:true,creado:now,creadoPor:"Sistema"},true)}
    this.addLog("ok",`INSERT usuarios (iniciales) → ${DEFAULT_USERS.length} filas`);
  },
  getUser(user){return this.users.find(u=>u.user===String(user).toLowerCase())},
  async saveUser(u,silent){
    if(this.db){await this.db.doc("usuarios/"+u.user).set(u)}
    else{const i=this.users.findIndex(x=>x.user===u.user);if(i>=0)this.users[i]=u;else this.users.push(u);this.persistLocal();if(!silent)this.emit()}
    if(!silent)this.addLog("ok",`UPSERT usuarios (${u.user}) → 1 fila`);
  },
  async deleteUser(user){
    if(this.db){await this.db.doc("usuarios/"+user).delete()}
    else{this.users=this.users.filter(x=>x.user!==user);this.persistLocal();this.emit()}
    this.addLog("ok",`DELETE usuarios (${user}) → 1 fila`);
  },
  async importAll(data){
    for(const u of (data.usuarios||[]))if(u&&u.user&&u.hash&&ROLES[u.role])await this.saveUser(u,true);
    for(const o of (data.ordenes||[]))if(o&&o.codigo&&o.cliente&&o.equipo)await this.saveOrder(o);
    if(!this.db){this.persistLocal();this.emit()}
  },
  get(code){return this.orders.find(o=>o.codigo===code)},
  nextCode(){const n=this.orders.reduce((m,o)=>Math.max(m,parseInt(String(o.codigo).split("-")[1])||0),0)+1;return "JP-"+String(n).padStart(4,"0")},
  async saveOrder(o){
    if(this.db){
      await this.db.doc("ordenes/"+o.codigo).set(o);
    }else{
      const i=this.orders.findIndex(x=>x.codigo===o.codigo);if(i>=0)this.orders[i]=o;else this.orders.push(o);this.persistLocal();this.emit();
    }
    this.addLog("ok",`UPSERT ordenes (${o.codigo}) → 1 fila`);
  },
  async createOrder(o){
    let code=this.nextCode();
    if(this.db){for(let k=0;k<5;k++){const s=await this.db.doc("ordenes/"+code).get();if(!s.exists)break;code="JP-"+String(parseInt(code.split("-")[1])+1).padStart(4,"0")}}
    o.codigo=code;await this.saveOrder(o);return o;
  },
  async addReport(meta){
    try{
      if(this.db){await this.db.collection("reportes").add(meta)}
      else{this.reports.push({id:"r"+Date.now(),...meta});this.persistLocal();this.emit()}
      this.addLog("ok",`INSERT reportes (${meta.tipo}) → 1 fila`);
    }catch(e){this.addLog("warn","No se pudo registrar el reporte")}
  }
};

/* ---------- PDF ---------- */
let downloadsNS;
async function getDownloads(){if(downloadsNS!==undefined)return downloadsNS;downloadsNS=null;if(hasClaude()){try{downloadsNS=await window.claude.use("downloads")}catch(e){}}return downloadsNS}
function pdfReady(){return !!(window.jspdf&&window.jspdf.jsPDF)}
function pdfBase(title,sub){
  const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
  doc.setFillColor(12,140,128);doc.rect(0,0,210,30,"F");
  doc.setFillColor(11,95,134);doc.rect(0,27,210,3,"F");
  doc.setFillColor(255,255,255);doc.roundedRect(12,6,18,18,4,4,"F");
  doc.setTextColor(12,140,128);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text("JP",21,17.3,{align:"center"});
  doc.setFillColor(255,197,61);doc.circle(29,7,2.4,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(16);doc.text("Juancho Pérez",35,14);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text("Servicio Técnico PC · Taller & Diagnóstico",35,20);
  doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text(title,198,13,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.text(sub||("Generado: "+fmtDate(new Date().toISOString())),198,19,{align:"right"});
  doc.setTextColor(20,35,58);
  return doc;
}
function pdfFooter(doc){
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);doc.setDrawColor(217,227,236);doc.line(12,283,198,283);
    doc.setFontSize(8.5);doc.setTextColor(12,140,128);doc.setFont("helvetica","bold");doc.text("Created By: Juan C. Pérez",12,288);
    doc.setFont("helvetica","normal");doc.setTextColor(90,107,130);
    doc.text(`Sincronizado con Supabase (${SUPA.ref}) · ${fmtDate(new Date().toISOString())}`,105,288,{align:"center"});
    doc.text(`Página ${i} de ${n}`,198,288,{align:"right"});}
}
function pdfSection(doc,y,title){if(y>265){doc.addPage();y=20}doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.setTextColor(12,140,128);doc.text(title.toUpperCase(),12,y);doc.setDrawColor(12,140,128);doc.line(12,y+1.5,198,y+1.5);doc.setTextColor(20,35,58);return y+8}
function pdfKV(doc,y,pairs){
  doc.setFontSize(9.5);
  pairs.forEach(([k,v])=>{const lines=doc.splitTextToSize(String(v??"—")||"—",140);if(y+lines.length*4.6>275){doc.addPage();y=20}
    doc.setFont("helvetica","bold");doc.setTextColor(90,107,130);doc.text(k,12,y);doc.setFont("helvetica","normal");doc.setTextColor(20,35,58);doc.text(lines,56,y);y+=Math.max(6,lines.length*4.6+1.5)});
  return y+2;
}
function pdfTable(doc,y,head,body){
  if(typeof doc.autoTable==="function"){
    doc.autoTable({startY:y,head:[head],body,theme:"grid",styles:{fontSize:8.2,cellPadding:2,textColor:[20,35,58]},headStyles:{fillColor:[12,140,128],textColor:255},alternateRowStyles:{fillColor:[240,246,249]},margin:{left:12,right:12,bottom:18}});
    return doc.lastAutoTable.finalY+8;
  }
  const w=186/head.length;doc.setFontSize(8);
  const row=(cells,bold)=>{if(y>270){doc.addPage();y=20}doc.setFont("helvetica",bold?"bold":"normal");cells.forEach((c,i)=>doc.text(doc.splitTextToSize(String(c),w-2)[0]||"",12+i*w,y));y+=6};
  row(head,true);body.forEach(r=>row(r));return y+4;
}
async function saveFile(filename,blob){
  const dl=await getDownloads();
  if(dl){
    try{await dl.save({filename,data:blob});toast("Archivo guardado: "+filename);return true}
    catch(e){toast(e&&e.code==="declined"?"Descarga cancelada.":"No se pudo descargar el archivo aquí.");return false}
  }
  if(hasClaude()){toast("Este visor no permite descargas.");return false}
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);toast("Archivo guardado: "+filename);return true;
}
async function savePdf(doc,filename,meta){
  pdfFooter(doc);
  const blob=doc.output("blob");
  await Store.addReport({...meta,archivo:filename,fecha:new Date().toISOString(),usuario:S.user?.name||"—",rol:S.user?.role||"—"});
  await saveFile(filename,blob);
}
function needPdf(){if(!pdfReady()){toast("El generador de PDF aún está cargando. Intenta de nuevo.");return false}return true}

function pdfOrden(o,tipo){
  if(!needPdf())return;
  const titulo=tipo==="informe"?"INFORME TÉCNICO":"COMPROBANTE DE ORDEN";
  const doc=pdfBase(titulo,"Orden "+o.codigo+" · "+fmtDate(o.fecha));
  let y=42;
  doc.setFont("helvetica","bold");doc.setFontSize(20);doc.setTextColor(12,140,128);doc.text(o.codigo,12,y);
  doc.setFontSize(10);doc.setTextColor(20,35,58);doc.text("Estado: "+EST[o.estado].label,198,y,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90,107,130);doc.text("Consulta el estado con este código en la sección Consulta.",12,y+6);
  y+=16;
  y=pdfSection(doc,y,"Cliente");
  y=pdfKV(doc,y,[["Nombre",o.cliente.nombre],["Documento",o.cliente.documento],["WhatsApp",o.cliente.telefono],["Correo",o.cliente.correo||"—"]]);
  y=pdfSection(doc,y,"Equipo");
  y=pdfKV(doc,y,[["Tipo / marca",`${o.equipo.tipo} · ${o.equipo.marca}`],["Modelo",o.equipo.modelo],["Serie / color",o.equipo.serie||"—"],["Accesorios",(o.accesorios||[]).join(", ")||"Ninguno"],["Falla reportada",o.falla],["Prioridad",o.prioridad],["Técnico",o.tecnico],["Presupuesto",money(o.presupuesto)]]);
  if(tipo==="informe"){
    y=pdfSection(doc,y,"Diagnóstico y reparación");
    y=pdfKV(doc,y,[["Diagnóstico",o.diagnostico||"Pendiente"],["Repuestos",o.repuestos||"—"],["Costo final",money(o.costoFinal)]]);
  }
  y=pdfSection(doc,y,"Historial de la orden");
  y=pdfTable(doc,y,["Fecha","Estado","Nota","Responsable"],(o.historial||[]).map(h=>[fmtDate(h.fecha),EST[h.estado]?.label||h.estado,h.nota||"",h.usuario]));
  if(tipo!=="informe"){
    if(y>245){doc.addPage();y=20}
    doc.setFontSize(8.5);doc.setTextColor(90,107,130);
    doc.text(doc.splitTextToSize("Condiciones: el taller no se hace responsable por información no respaldada. Los equipos no reclamados después de 60 días se consideran en abandono. Garantía de 90 días sobre la reparación realizada. Tratamiento de datos conforme a la Ley 1581 de 2012.",186),12,y);
    y+=18;doc.setDrawColor(20,35,58);doc.line(12,y+10,90,y+10);doc.line(120,y+10,198,y+10);
    doc.setTextColor(20,35,58);doc.text("Firma cliente",12,y+15);doc.text("Recibido por: "+(o.creadoPor||""),120,y+15);
  }
  savePdf(doc,`${tipo==="informe"?"Informe":"Comprobante"}_${o.codigo}.pdf`,{tipo:tipo==="informe"?"Informe técnico":"Comprobante de orden",codigo:o.codigo});
}
function pdfGeneral(list,filtros){
  if(!needPdf())return;
  const doc=pdfBase("REPORTE DE SERVICIOS",filtros);
  let y=42;
  doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("Resumen",12,y);y+=8;
  doc.setFontSize(9.5);doc.setFont("helvetica","normal");
  ESTADOS.forEach((e,i)=>{const n=list.filter(o=>o.estado===e.id).length;doc.text(`${e.label}: ${n}`,12+(i%3)*62,y+Math.floor(i/3)*6)});
  y+=14;
  const total=list.reduce((s,o)=>s+(Number(o.costoFinal)||0),0);
  doc.setFont("helvetica","bold");doc.text(`Total órdenes: ${list.length}   ·   Facturado (costo final): ${money(total)}`,12,y);y+=8;
  y=pdfTable(doc,y,["Código","Fecha","Cliente","Equipo","Estado","Técnico","Costo"],list.map(o=>[o.codigo,fmtDate(o.fecha,false),o.cliente.nombre,`${o.equipo.marca} ${o.equipo.modelo}`,EST[o.estado].label,o.tecnico,o.costoFinal?money(o.costoFinal):"—"]));
  savePdf(doc,`Reporte_servicios_${today()}.pdf`,{tipo:"Reporte general",codigo:`${list.length} órdenes`});
}

function pdfUsuarios(){
  if(!needPdf())return;
  const doc=pdfBase("REPORTE DE USUARIOS");
  let y=42;doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("Usuarios del sistema",12,y);y+=7;
  doc.setFont("helvetica","normal");doc.setFontSize(9.5);
  doc.text(Object.entries(ROLES).map(([k,r])=>`${r.label}: ${Store.users.filter(u=>u.role===k).length}`).join("   ·   "),12,y);y+=8;
  y=pdfTable(doc,y,["Nombre","Usuario","Rol","Estado","Creado","Creado por"],Store.users.map(u=>[u.name,u.user,ROLES[u.role]?.label||u.role,u.activo===false?"Inactivo":"Activo",fmtDate(u.creado,false),u.creadoPor||"—"]));
  savePdf(doc,`Reporte_usuarios_${today()}.pdf`,{tipo:"Reporte de usuarios",codigo:`${Store.users.length} usuarios`});
}

/* ---------- App state ---------- */
const S={user:null,page:"inicio"};
const app=$("#app");
let pageApi=null;

function start(){
  const sess=ss.get("jp_session");
  let pending=sess&&sess.user?sess.user:null;
  Store.on(()=>{
    if(!Store.ready){renderHeaderStatus();return}
    if(pending){const u=Store.getUser(pending);pending=null;if(u&&u.activo!==false){S.user=u;S.page=ss.get("jp_page")||ROLES[u.role].pages[0];render();return}ss.del("jp_session")}
    if(S.user){
      const u=Store.getUser(S.user.user);
      if(!u||u.activo===false){S.user=null;pageApi=null;ss.del("jp_session");render();toast("Tu usuario fue desactivado o eliminado.");return}
      const roleChanged=u.role!==S.user.role||u.name!==S.user.name;S.user=u;
      if(roleChanged){render();return}
    }else if(loginApi){loginApi.update()}
    renderHeaderStatus();pageApi&&pageApi.update&&pageApi.update();
  });
  if(pending)app.innerHTML=`<div class="login-form" style="min-height:100vh"><div class="stack" style="align-items:center">${logo()}<p class="muted">Restaurando tu sesión…</p></div></div>`;
  else render();
  Store.init();
}

let loginApi=null;
function render(){
  if(!S.user){renderLogin();return}
  loginApi=null;
  if(!ROLES[S.user.role].pages.includes(S.page))S.page=ROLES[S.user.role].pages[0];
  const r=ROLES[S.user.role];
  app.innerHTML=`<header class="top"><div class="wrap">
    <div class="top-in">${logo()}
      <button class="db-pill" id="dbPill" type="button" title="Ver conexión con Supabase"><span class="dot"></span><span id="dbTxt">Supabase</span></button>
      <div class="user-chip"><div class="avatar">${esc(S.user.name[0])}</div><div class="who"><b>${esc(S.user.name)}</b><span class="role-tag">${r.label}</span></div>
      <button class="btn ghost sm" id="logout" type="button">${ic("salir")}<span>Salir</span></button></div>
    </div>
    <nav class="tabs" aria-label="Secciones">${r.pages.map(p=>`<button class="tab" data-page="${p}" ${p===S.page?'aria-current="page"':""} type="button">${ic(p)}${PAGES[p]}</button>`).join("")}</nav>
  </div></header>
  <main><div class="wrap" id="page"></div></main>${footer()}`;
  $$(".tab").forEach(b=>b.onclick=()=>go(b.dataset.page));
  $("#logout").onclick=()=>{ss.del("jp_session");ss.del("jp_page");S.user=null;pageApi=null;render();toast("Sesión cerrada")};
  $("#dbPill").onclick=openDbModal;
  renderHeaderStatus();
  try{const at=$(".tab[aria-current]");at&&at.scrollIntoView({inline:"center",block:"nearest"})}catch(e){}
  const el=$("#page");
  pageApi=PAGE_IMPL[S.page](el)||null;
  window.scrollTo(0,0);
}
function go(p){S.page=p;ss.set("jp_page",p);render()}
function renderHeaderStatus(){
  const pill=$("#dbPill"),t=$("#dbTxt");if(!pill)return;
  if(!Store.ready){pill.classList.add("wait");t.textContent="Conectando a Supabase…"}
  else{pill.classList.remove("wait");t.textContent=`Supabase conectado · ${Store.latency} ms`}
}

/* ---------- Login ---------- */
function renderLogin(){
  let sel="recepcion";
  app.innerHTML=`<div class="login">
    <section class="login-art">${logo(true)}
      <div class="stack" style="gap:14px"><h1>Tu equipo en buenas manos, paso a paso.</h1>
      <p>Registra equipos en menos de dos minutos, sigue cada reparación en el taller y entrega comprobantes en PDF a tus clientes.</p>
      <div class="steps-mini"><span>1 · Recibido</span><span>2 · Diagnóstico</span><span>3 · Reparación</span><span>4 · Listo</span><span>5 · Entregado</span></div></div>
      <div class="small" style="opacity:.9">SENA - Centro Acuicola y Agroindustrial de Gaira Km 6 Via Gaira<br>Lun–Vie 8:00–18:00 </div>
      <div class="bg-ring"></div>
    </section>
    <section class="login-form"><form class="login-box" id="loginForm" autocomplete="off" novalidate>
      <div><div class="label">Acceso seguro</div><h2 style="font-size:1.7rem">Iniciar sesión</h2><p class="muted">Elige tu rol y escribe tu usuario y contraseña.</p></div>
      <div class="roles" role="group" aria-label="Rol">${Object.entries(ROLES).map(([k,v])=>`<button type="button" class="role-btn" data-role="${k}" aria-pressed="${k===sel}"><b>${v.label}</b><small>${v.desc}</small></button>`).join("")}</div>
      <label class="field"><span>Usuario</span><input class="input" id="lu" autocomplete="username" placeholder="Ej: recepcion"></label>
      <label class="field"><span>Contraseña</span><input class="input" id="lp" type="password" autocomplete="current-password" placeholder="••••••••"></label>
      <div id="lerr" class="err" hidden></div>
      <button class="btn" type="submit" id="lbtn">${ic("lock")}Entrar al sistema</button>
      <div id="lcred"></div>
    </form></section></div>${footer()}`;
  const setRole=(r)=>{sel=r;$$(".role-btn").forEach(b=>b.setAttribute("aria-pressed",b.dataset.role===r));const u=DEFAULT_USERS.find(x=>x.role===r);$("#lu").placeholder="Ej: "+u.user};
  const upd=()=>{
    const b=$("#lbtn");if(!b)return;b.disabled=!Store.ready;
    b.innerHTML=Store.ready?`${ic("lock")}Entrar al sistema`:"Conectando con la base de datos…";
    /* Solo se muestran las claves iniciales que aún no se han cambiado */
    const still=DEFAULT_USERS.filter(d=>{const u=Store.getUser(d.user);return u&&u.activo!==false&&u.hash===hashPass(d.user,d.pass)});
    $("#lcred").innerHTML=still.length?`<details class="cred"><summary><b>Usuarios iniciales</b> (cambia sus contraseñas en Usuarios)</summary>
      <div style="margin-top:8px;display:grid;gap:4px">${still.map(u=>`<div>${ROLES[u.role].label}: <code>${u.user}</code> / <code>${u.pass}</code></div>`).join("")}</div></details>`:"";
  };
  loginApi={update:upd};upd();
  $$(".role-btn").forEach(b=>b.onclick=()=>setRole(b.dataset.role));
  $("#loginForm").onsubmit=(e)=>{e.preventDefault();
    const u=$("#lu").value.trim().toLowerCase(),p=$("#lp").value,err=$("#lerr");
    if(!u||!p){err.hidden=false;err.textContent="Escribe tu usuario y contraseña.";return}
    if(!Store.ready){err.hidden=false;err.textContent="Aún se están cargando los usuarios. Espera un momento.";return}
    const cand=Store.getUser(u);const found=cand&&cand.hash===hashPass(u,p)?cand:null;
    if(found&&found.activo===false){err.hidden=false;err.textContent="Este usuario está desactivado. Pide al administrador que lo active.";return}
    if(!found){err.hidden=false;err.textContent="Usuario o contraseña incorrectos. Revisa los datos e intenta de nuevo.";return}
    if(found.role!==sel){err.hidden=false;err.textContent=`Este usuario pertenece al rol ${ROLES[found.role].label}. Selecciona ese rol para entrar.`;return}
    S.user=found;S.page=ROLES[found.role].pages[0];ss.set("jp_session",{user:found.user});ss.set("jp_page",S.page);
    Store.addLog("ok",`auth.signInWithPassword(${found.user}) → rol ${found.role}`);loginApi=null;
    render();toast(`¡Bienvenido, ${found.name}!`);
  };
}

/* ---------- Shared bits ---------- */
function visibleOrders(){
  const all=[...Store.orders].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
  return all;
}
function orderRow(o,actions=true){
  return `<tr><td class="mono"><b>${esc(o.codigo)}</b></td><td>${fmtDate(o.fecha)}</td><td>${esc(o.cliente.nombre)}<div class="small muted">${esc(o.cliente.telefono)}</div></td>
  <td>${esc(o.equipo.marca)} ${esc(o.equipo.modelo)}<div class="small muted">${esc(o.equipo.tipo)}</div></td><td>${st(o.estado)}</td><td>${esc(o.tecnico)}</td>
  ${actions?`<td><button class="btn ghost sm" data-pdf="${esc(o.codigo)}" type="button">${ic("pdf")}PDF</button></td>`:""}</tr>`;
}
function bindPdfButtons(root,tipo){ $$("[data-pdf]",root).forEach(b=>b.onclick=()=>{const o=Store.get(b.dataset.pdf);o&&pdfOrden(o,b.dataset.tipo||tipo)}) }
const loadingBlock=()=>`<div class="empty">Conectando con Supabase y cargando registros…</div>`;

/* ---------- Pages ---------- */
const PAGE_IMPL={
/* INICIO */
inicio(el){
  const role=S.user.role;
  el.innerHTML=`<div class="stack" style="gap:22px">
    <div class="section-head"><div><div class="label">${ROLES[role].label}</div><h1>Hola, ${esc(S.user.name.split(" ")[0])}</h1><p class="muted">Este es el resumen del taller en tiempo real.</p></div>
    <div class="row">${role!=="tecnico"?`<button class="btn" data-go="recepcion" type="button">${ic("plus")}Nueva orden</button>`:""}${role!=="recepcion"?`<button class="btn ghost" data-go="taller" type="button">${ic("taller")}Ir al taller</button>`:""}<button class="btn ghost" data-go="reportes" type="button">${ic("reportes")}Reportes PDF</button></div></div>
    <div class="stats" id="stats"></div>
    <div class="card stack"><div class="section-head"><h2>${role==="tecnico"?"Mis órdenes activas":"Últimas órdenes registradas"}</h2><span class="small muted" id="sync"></span></div><div id="recent"></div></div>
  </div>`;
  $$("[data-go]",el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  const update=()=>{
    const all=visibleOrders();
    const cnt=(s)=>all.filter(o=>o.estado===s).length;
    const fact=all.filter(o=>o.estado==="entregado").reduce((s,o)=>s+(Number(o.costoFinal)||0),0);
    $("#stats",el).innerHTML=[
      ["Órdenes totales",all.length,"var(--brand)"],["Recibidas",cnt("recibido"),"var(--sky)"],["En taller",cnt("diagnostico")+cnt("reparacion"),"var(--coral)"],["Listas para entregar",cnt("listo"),"var(--ok)"],[role==="admin"?"Facturado":"Entregadas",role==="admin"?"$ "+fact.toLocaleString("es-CO"):cnt("entregado"),"var(--grey)"]
    ].map(([l,v,c])=>`<div class="stat" style="--c:${c}"><span class="label">${l}</span><b style="${String(v).length>8?"font-size:1.25rem":""}">${v}</b></div>`).join("");
    let list=role==="tecnico"?all.filter(o=>o.tecnico===S.user.name&&o.estado!=="entregado"):all;
    list=list.slice(0,8);
    $("#sync",el).textContent=Store.lastSync?"Sincronizado "+Store.lastSync.toLocaleTimeString("es-CO"):"";
    $("#recent",el).innerHTML=!Store.ready?loadingBlock():list.length?`<div class="tbl-wrap"><table><thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Técnico</th><th></th></tr></thead><tbody>${list.map(o=>orderRow(o)).join("")}</tbody></table></div>`
      :`<div class="empty">Aún no hay órdenes${role==="tecnico"?" asignadas a ti":""}. ${role!=="tecnico"?"Crea la primera desde <b>Recepción</b>.":""}</div>`;
    bindPdfButtons($("#recent",el),"comprobante");
  };
  update();return{update};
},

/* RECEPCIÓN */
recepcion(el){
  const d={marca:"",tipo:"Portátil",prioridad:"Normal",acc:new Set()};
  let step=1,lastOrder=null;
  el.innerHTML=`<div class="stack" style="gap:20px">
    <div class="section-head"><div><div class="label">Recepción</div><h1>Registrar un equipo</h1><p class="muted">Completa los 3 pasos. Al terminar se guarda la orden y se genera el comprobante PDF.</p></div></div>
    <div class="recep-layout">
      <div class="card stack" id="wiz">
        <div class="wizard-steps">${["Cliente","Equipo y falla","Confirmar"].map((t,i)=>`<div class="wstep" data-ws="${i+1}"><i>${i+1}</i><em>${t}</em></div>`).join("")}</div>
        <form id="f" class="stack" novalidate autocomplete="off">
          <section data-step="1" class="stack">
            <div class="field"><span>Buscar cliente existente</span><div class="row"><input class="input grow" id="q" placeholder="Cédula, teléfono o nombre" style="flex:1 1 200px"><button class="btn ghost" type="button" id="qb">${ic("consulta")}Buscar</button></div><span class="hint" id="qh">Si el cliente ya vino antes, sus datos se completan solos.</span></div>
            <div class="grid2">
              <label class="field"><span>Nombre completo <i>*</i></span><input class="input" id="c_nombre" placeholder="Ej: María Fernanda López"></label>
              <label class="field"><span>Cédula / NIT <i>*</i></span><input class="input" id="c_doc" inputmode="numeric" placeholder="Ej: 1020304050"></label>
              <label class="field"><span>WhatsApp <i>*</i></span><input class="input" id="c_tel" inputmode="tel" placeholder="Ej: 300 123 4567"></label>
              <label class="field"><span>Correo electrónico</span><input class="input" id="c_mail" type="email" placeholder="Para enviarle el comprobante"></label>
            </div>
          </section>
          <section data-step="2" class="stack" hidden>
            <div class="field"><span>Tipo de equipo</span><div class="chips" id="tipos">${TIPOS.map(t=>`<button type="button" class="chip" data-v="${t}" aria-pressed="${t===d.tipo}">${t}</button>`).join("")}</div></div>
            <div class="field"><span>Marca <i>*</i></span><div class="chips" id="marcas">${MARCAS.map(t=>`<button type="button" class="chip" data-v="${t}" aria-pressed="false">${t}</button>`).join("")}</div></div>
            <div class="grid2">
              <label class="field"><span>Modelo <i>*</i></span><input class="input" id="e_modelo" placeholder="Ej: Pavilion 14-dv0001la"></label>
              <label class="field"><span>Serie / color</span><input class="input" id="e_serie" placeholder="Ej: 5CD1234XYZ · Plata"></label>
            </div>
            <label class="field"><span>¿Qué le pasa al equipo? <i>*</i></span><textarea class="input" id="e_falla" maxlength="400" placeholder="Describe la falla con las palabras del cliente. Ej: No enciende después de un apagón."></textarea><span class="hint"><span id="fc">0</span>/400 caracteres</span></label>
            <div class="field"><span>Accesorios recibidos</span><div class="chips">${ACCES.map((a,i)=>`<label class="check"><input type="checkbox" id="acc${i}" value="${a}">${a}</label>`).join("")}</div></div>
            <div class="grid2">
              <div class="field"><span>Prioridad</span><div class="chips" id="prios">${["Normal","Alta","Urgente"].map(t=>`<button type="button" class="chip" data-v="${t}" aria-pressed="${t===d.prioridad}">${t}</button>`).join("")}</div></div>
              <label class="field"><span>Técnico asignado</span><select class="input" id="e_tec">${tecnicos().map(t=>`<option>${esc(t)}</option>`).join("")}</select></label>
              <label class="field"><span>Presupuesto estimado (COP)</span><input class="input" id="e_pres" inputmode="numeric" placeholder="Ej: 120000"></label>
            </div>
          </section>
          <section data-step="3" class="stack" hidden>
            <h3>Revisa antes de guardar</h3><div id="review"></div>
            <label class="check"><input type="checkbox" id="habeas">El cliente autoriza el tratamiento de sus datos (Ley 1581 de 2012).</label>
          </section>
          <div id="ferr" class="err" hidden></div>
          <div class="row" style="justify-content:space-between">
            <button class="btn ghost" type="button" id="prev">Atrás</button>
            <button class="btn" type="button" id="next">Siguiente</button>
          </div>
        </form>
      </div>
      <div class="card stack" id="side"></div>
    </div>
    <div class="card stack"><div class="section-head"><h2>Órdenes registradas</h2><input class="input" id="flt" placeholder="Filtrar por código, cliente o equipo" style="max-width:320px"></div><div id="list"></div></div>
  </div>`;
  const f=$("#f",el);
  const val=(id)=>$("#"+id,el).value.trim();
  const chipGroup=(id,key)=>{$$("#"+id+" .chip",el).forEach(c=>c.onclick=()=>{d[key]=c.dataset.v;$$("#"+id+" .chip",el).forEach(x=>x.setAttribute("aria-pressed",x===c));drawSide()})};
  chipGroup("tipos","tipo");chipGroup("marcas","marca");chipGroup("prios","prioridad");
  $("#e_falla",el).oninput=()=>{$("#fc",el).textContent=val("e_falla").length;drawSide()};
  f.oninput=()=>drawSide();
  const collect=()=>({cliente:{nombre:val("c_nombre"),documento:val("c_doc"),telefono:val("c_tel"),correo:val("c_mail")},
    equipo:{tipo:d.tipo,marca:d.marca,modelo:val("e_modelo"),serie:val("e_serie")},falla:val("e_falla"),
    accesorios:ACCES.filter((a,i)=>$("#acc"+i,el).checked),prioridad:d.prioridad,tecnico:val("e_tec"),presupuesto:Number(val("e_pres").replace(/\D/g,""))||0});
  const validate=(s)=>{const o=collect();
    if(s===1){if(!o.cliente.nombre||!o.cliente.documento||!o.cliente.telefono)return"Completa nombre, cédula y WhatsApp del cliente.";
      if(o.cliente.telefono.replace(/\D/g,"").length<7)return"El número de WhatsApp parece incompleto.";
      if(o.cliente.correo&&!/^\S+@\S+\.\S+$/.test(o.cliente.correo))return"El correo no tiene un formato válido.";}
    if(s===2){if(!o.equipo.marca)return"Selecciona la marca del equipo.";if(!o.equipo.modelo)return"Escribe el modelo del equipo.";if(o.falla.length<5)return"Describe la falla (mínimo 5 caracteres).";}
    if(s===3&&!$("#habeas",el).checked)return"Marca la autorización de tratamiento de datos para continuar.";
    return"";};
  const kv=(o)=>`<div class="ticket"><dl class="kv">
    <dt>Cliente</dt><dd>${esc(o.cliente.nombre||"—")}</dd><dt>Documento</dt><dd>${esc(o.cliente.documento||"—")}</dd><dt>WhatsApp</dt><dd>${esc(o.cliente.telefono||"—")}</dd>
    <dt>Equipo</dt><dd>${esc(o.equipo.tipo)} · ${esc(o.equipo.marca||"—")} ${esc(o.equipo.modelo)}</dd><dt>Serie</dt><dd>${esc(o.equipo.serie||"—")}</dd>
    <dt>Accesorios</dt><dd>${esc(o.accesorios.join(", ")||"Ninguno")}</dd><dt>Falla</dt><dd>${esc(o.falla||"—")}</dd>
    <dt>Prioridad</dt><dd><span class="prio prio-${o.prioridad}">${o.prioridad}</span></dd><dt>Técnico</dt><dd>${esc(o.tecnico)}</dd><dt>Presupuesto</dt><dd>${o.presupuesto?money(o.presupuesto):"Por definir"}</dd></dl></div>`;
  function drawSide(){
    if(lastOrder)return;
    $("#side",el).innerHTML=`<div class="row" style="justify-content:space-between"><h3>Vista previa del comprobante</h3><span class="mono small muted">${Store.ready?Store.nextCode():"JP-…"}</span></div>${kv(collect())}<p class="hint">El comprobante PDF se descarga al guardar la orden y queda registrado en Reportes.</p>`;
  }
  function showStep(){
    $$("[data-step]",el).forEach(s=>s.hidden=Number(s.dataset.step)!==step);
    $$(".wstep",el).forEach(w=>{const n=Number(w.dataset.ws);w.classList.toggle("on",n===step);w.classList.toggle("done",n<step)});
    $("#prev",el).style.visibility=step===1?"hidden":"visible";
    $("#next",el).innerHTML=step===3?`${ic("pdf")}Guardar orden y generar PDF`:"Siguiente";
    if(step===3)$("#review",el).innerHTML=kv(collect());
    $("#ferr",el).hidden=true;
  }
  $("#prev",el).onclick=()=>{if(step>1){step--;showStep()}};
  $("#next",el).onclick=async()=>{
    const e=validate(step),er=$("#ferr",el);if(e){er.hidden=false;er.textContent=e;return}
    if(step<3){step++;showStep();return}
    const btn=$("#next",el);btn.disabled=true;btn.textContent="Guardando en Supabase…";
    try{
      const now=new Date().toISOString();
      const o={...collect(),fecha:now,estado:"recibido",diagnostico:"",repuestos:"",costoFinal:0,creadoPor:S.user.name,actualizado:now,
        historial:[{fecha:now,estado:"recibido",nota:"Equipo recibido en mostrador. Accesorios inventariados.",usuario:S.user.name}]};
      await Store.createOrder(o);lastOrder=o;
      showSuccess(o);pdfOrden(o,"comprobante");
    }catch(err){btn.disabled=false;showStep();$("#ferr",el).hidden=false;$("#ferr",el).textContent="No se pudo guardar la orden. Revisa la conexión e intenta de nuevo."}
  };
  function showSuccess(o){
    $("#wiz",el).innerHTML=`<div class="success"><span class="st st-listo">Orden guardada</span><h2>¡Listo! La orden quedó registrada.</h2>
      <div class="big-code">${esc(o.codigo)}</div><p class="muted">Entrégale este código al cliente para que consulte el estado de su equipo.</p>
      <div class="row"><button class="btn" id="again" type="button">${ic("pdf")}Descargar comprobante PDF</button><button class="btn ghost" id="nueva" type="button">${ic("plus")}Nueva orden</button></div></div>`;
    $("#side",el).innerHTML=`<h3>Comprobante</h3>${kv(o)}`;
    $("#again",el).onclick=()=>pdfOrden(Store.get(o.codigo)||o,"comprobante");
    $("#nueva",el).onclick=()=>go("recepcion");
  }
  $("#qb",el).onclick=()=>{
    const q=val("q").toLowerCase();if(!q)return;
    const m=visibleOrders().find(o=>o.cliente.documento.toLowerCase()===q||o.cliente.telefono.replace(/\D/g,"")===q.replace(/\D/g,"")||o.cliente.nombre.toLowerCase().includes(q));
    const h=$("#qh",el);
    if(m){$("#c_nombre",el).value=m.cliente.nombre;$("#c_doc",el).value=m.cliente.documento;$("#c_tel",el).value=m.cliente.telefono;$("#c_mail",el).value=m.cliente.correo||"";h.innerHTML=`<b style="color:var(--ok)">Cliente encontrado:</b> ${esc(m.cliente.nombre)} (última orden ${esc(m.codigo)})`;drawSide()}
    else h.innerHTML=`No encontramos ese cliente. Escribe sus datos para registrarlo.`;
  };
  $("#q",el).onkeydown=(e)=>{if(e.key==="Enter"){e.preventDefault();$("#qb",el).click()}};
  const drawList=()=>{
    const q=$("#flt",el).value.toLowerCase();
    const list=visibleOrders().filter(o=>!q||[o.codigo,o.cliente.nombre,o.equipo.marca,o.equipo.modelo].join(" ").toLowerCase().includes(q)).slice(0,25);
    $("#list",el).innerHTML=!Store.ready?loadingBlock():list.length?`<div class="tbl-wrap"><table><thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Técnico</th><th></th></tr></thead><tbody>${list.map(o=>orderRow(o)).join("")}</tbody></table></div>`:`<div class="empty">No hay órdenes para mostrar.</div>`;
    bindPdfButtons($("#list",el),"comprobante");
  };
  $("#flt",el).oninput=drawList;
  showStep();drawSide();drawList();
  return{update(){drawList();drawSide()}};
},

/* TALLER */
taller(el){
  let filtro="todas",q="";
  el.innerHTML=`<div class="stack" style="gap:18px">
    <div class="section-head"><div><div class="label">Taller &amp; diagnóstico</div><h1>Tablero de reparaciones</h1><p class="muted">Toca una orden para registrar el diagnóstico, cambiar el estado y generar el informe técnico en PDF.</p></div></div>
    <div class="row"><div class="chips" id="flts">${[["todas","Todas"],["mias","Mis asignadas"],["urgentes","Urgentes / alta"]].map(([k,l])=>`<button class="chip" data-f="${k}" aria-pressed="${k===filtro}" type="button">${l}</button>`).join("")}</div>
      <input class="input" id="tq" placeholder="Buscar código, cliente o equipo" style="max-width:300px;margin-left:auto"></div>
    <div id="board"></div>
  </div>`;
  $$("#flts .chip",el).forEach(c=>c.onclick=()=>{filtro=c.dataset.f;$$("#flts .chip",el).forEach(x=>x.setAttribute("aria-pressed",x===c));update()});
  $("#tq",el).oninput=(e)=>{q=e.target.value.toLowerCase();update()};
  function update(){
    if(!Store.ready){$("#board",el).innerHTML=loadingBlock();return}
    let list=visibleOrders();
    if(filtro==="mias")list=list.filter(o=>o.tecnico===S.user.name);
    if(filtro==="urgentes")list=list.filter(o=>o.prioridad!=="Normal");
    if(q)list=list.filter(o=>[o.codigo,o.cliente.nombre,o.equipo.marca,o.equipo.modelo].join(" ").toLowerCase().includes(q));
    $("#board",el).innerHTML=`<div class="board">${ESTADOS.map(e=>{const items=list.filter(o=>o.estado===e.id);
      return `<div class="col"><div class="col-h"><b>${e.label}</b><span class="count">${items.length}</span></div>
      ${items.map(o=>`<button class="ocard" style="--c:${e.c}" data-open="${esc(o.codigo)}" type="button"><div class="row" style="justify-content:space-between"><b class="mono">${esc(o.codigo)}</b>${o.prioridad!=="Normal"?`<span class="prio prio-${o.prioridad}">${o.prioridad}</span>`:""}</div>
        <b>${esc(o.equipo.marca)} ${esc(o.equipo.modelo)}</b><span class="small">${esc(o.cliente.nombre)}</span><span class="falla">${esc(o.falla)}</span><span class="small muted">${esc(o.tecnico)} · ${fmtDate(o.actualizado||o.fecha)}</span></button>`).join("")||`<div class="small muted" style="padding:6px">Sin órdenes</div>`}</div>`}).join("")}</div>`;
    $$("[data-open]",el).forEach(b=>b.onclick=()=>openOrder(b.dataset.open));
  }
  update();return{update};
},

/* CONSULTA */
consulta(el){
  let current=null;
  const isCli=S.user.role==="cliente";
  el.innerHTML=`<div class="stack" style="gap:18px">
    <div class="card stack" style="background:linear-gradient(135deg,var(--brand-soft),var(--surface))">
      <div><div class="label">Consulta de estado</div><h1>¿Cómo va mi equipo?</h1><p class="muted">Escribe el código que aparece en tu comprobante (ej: JP-0001) o tu número de cédula.</p></div>
      <form class="row" id="cf" novalidate><input class="input mono" id="cq" placeholder="JP-0001 o cédula" style="flex:1 1 220px;font-size:1.1rem"><button class="btn" type="submit">${ic("consulta")}Consultar estado</button></form>
      <div id="cmsg"></div>
    </div>
    <div id="cres"></div>
  </div>`;
  $("#cf",el).onsubmit=(e)=>{e.preventDefault();current=$("#cq",el).value.trim();draw()};
  function draw(){
    const msg=$("#cmsg",el),res=$("#cres",el);msg.innerHTML="";
    if(!current){res.innerHTML=isCli?"":`<div class="empty">Escribe un código para ver la hoja de ruta de la orden.</div>`;return}
    if(!Store.ready){res.innerHTML=loadingBlock();return}
    const qq=current.toUpperCase();
    const matches=visibleOrders().filter(o=>o.codigo.toUpperCase()===qq||o.cliente.documento===current);
    if(!matches.length){res.innerHTML=`<div class="err">No encontramos órdenes con “${esc(current)}”. Revisa el código en tu comprobante o pregunta en recepción.</div>`;return}
    res.innerHTML=matches.map(o=>{const e=EST[o.estado];
      return `<div class="card stack" style="gap:18px">
        <div class="hero-status"><div><div class="label">Orden ${esc(o.codigo)}</div><h2 style="font-size:1.6rem">${e.label}</h2><p class="muted" style="max-width:56ch">${e.txt}</p></div>${st(o.estado)}</div>
        <div class="progress">${ESTADOS.map((s,i)=>`<div class="pstep ${i<e.i?"done":i===e.i?"now":""}"><span>${s.label}</span></div>`).join("")}</div>
        <div class="grid2">
          <div class="ticket"><dl class="kv"><dt>Equipo</dt><dd>${esc(o.equipo.tipo)} · ${esc(o.equipo.marca)} ${esc(o.equipo.modelo)}</dd><dt>Cliente</dt><dd>${esc(o.cliente.nombre)}</dd><dt>Recibido</dt><dd>${fmtDate(o.fecha)}</dd><dt>Técnico</dt><dd>${esc(o.tecnico)}</dd><dt>Falla</dt><dd>${esc(o.falla)}</dd><dt>Presupuesto</dt><dd>${o.costoFinal?money(o.costoFinal)+" (final)":o.presupuesto?money(o.presupuesto):"Por definir"}</dd></dl></div>
          <div class="stack" style="gap:10px"><h3>Historial</h3><ul class="timeline">${[...(o.historial||[])].reverse().map(h=>`<li><b>${esc(EST[h.estado]?.label||h.estado)}</b> <span class="small muted">· ${fmtDate(h.fecha)}</span><div class="small">${esc(h.nota||"")}</div></li>`).join("")}</ul></div>
        </div>
        <div class="row"><button class="btn" data-pdf="${esc(o.codigo)}" type="button">${ic("pdf")}Descargar comprobante PDF</button>${o.diagnostico?`<button class="btn ghost" data-pdf="${esc(o.codigo)}" data-tipo="informe" type="button">${ic("reportes")}Informe técnico PDF</button>`:""}</div>
      </div>`}).join("");
    bindPdfButtons(res,"comprobante");
  }
  draw();return{update:draw};
},

/* REPORTES */
reportes(el){
  const role=S.user.role;
  el.innerHTML=`<div class="stack" style="gap:18px">
    <div class="section-head"><div><div class="label">Reportes</div><h1>Reportes en PDF</h1><p class="muted">Cada registro queda guardado y respaldado en un reporte PDF descargable.</p></div></div>
    <div class="card stack"><h2>Generar reporte de servicios</h2>
      <div class="grid2">
        <label class="field"><span>Desde</span><input class="input" type="date" id="rd"></label>
        <label class="field"><span>Hasta</span><input class="input" type="date" id="rh"></label>
        <label class="field"><span>Estado</span><select class="input" id="re"><option value="">Todos</option>${ESTADOS.map(e=>`<option value="${e.id}">${e.label}</option>`).join("")}</select></label>
        <label class="field"><span>Técnico</span><select class="input" id="rt"><option value="">Todos</option>${tecnicos().map(t=>`<option ${role==="tecnico"&&t===S.user.name?"selected":""}>${esc(t)}</option>`).join("")}</select></label>
      </div>
      <div class="row"><button class="btn" id="gen" type="button">${ic("pdf")}Generar reporte PDF</button><span class="muted small" id="rcount"></span></div>
      <div id="rprev"></div>
    </div>
    <div class="card stack"><div class="section-head"><h2>Historial de reportes generados</h2><span class="small muted">${role==="admin"?"Todos los usuarios":"Tus reportes"}</span></div><div id="rlog"></div></div>
  </div>`;
  const filt=()=>{const d=$("#rd",el).value,h=$("#rh",el).value,e=$("#re",el).value,t=$("#rt",el).value;
    return visibleOrders().filter(o=>(!d||o.fecha.slice(0,10)>=d)&&(!h||o.fecha.slice(0,10)<=h)&&(!e||o.estado===e)&&(!t||o.tecnico===t))};
  const desc=()=>{const p=[];const d=$("#rd",el).value,h=$("#rh",el).value,e=$("#re",el).value,t=$("#rt",el).value;
    p.push(d||h?`Período: ${d||"inicio"} a ${h||"hoy"}`:"Período: todo");if(e)p.push("Estado: "+EST[e].label);if(t)p.push("Técnico: "+t);return p.join(" · ")};
  $$("#rd,#rh,#re,#rt",el).forEach(i=>i.onchange=update);
  $("#gen",el).onclick=()=>{const l=filt();if(!l.length){toast("No hay órdenes con esos filtros.");return}pdfGeneral(l,desc())};
  function update(){
    const l=filt();$("#rcount",el).textContent=Store.ready?`${l.length} órdenes incluidas`:"";
    $("#rprev",el).innerHTML=!Store.ready?loadingBlock():l.length?`<div class="tbl-wrap"><table><thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Técnico</th><th></th></tr></thead><tbody>${l.slice(0,15).map(o=>orderRow(o).replace(`data-pdf="${esc(o.codigo)}"`,`data-pdf="${esc(o.codigo)}" data-tipo="${o.diagnostico?"informe":"comprobante"}"`)).join("")}</tbody></table></div>${l.length>15?`<p class="hint">Mostrando 15 de ${l.length}. El PDF incluye todas.</p>`:""}`:`<div class="empty">No hay órdenes con esos filtros.</div>`;
    bindPdfButtons($("#rprev",el),"comprobante");
    const logs=Store.reports.filter(r=>role==="admin"||r.usuario===S.user.name).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,40);
    $("#rlog",el).innerHTML=logs.length?`<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Referencia</th><th>Archivo</th><th>Generado por</th><th></th></tr></thead><tbody>${logs.map(r=>`<tr><td>${fmtDate(r.fecha)}</td><td>${esc(r.tipo)}</td><td class="mono">${esc(r.codigo||"")}</td><td class="small">${esc(r.archivo)}</td><td>${esc(r.usuario)}<div class="small muted">${esc(ROLES[r.rol]?.label||r.rol)}</div></td><td>${Store.get(r.codigo)?`<button class="btn ghost sm" data-pdf="${esc(r.codigo)}" data-tipo="${r.tipo==="Informe técnico"?"informe":"comprobante"}" type="button">${ic("pdf")}Volver a generar</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Todavía no se han generado reportes. Se registran automáticamente al crear órdenes o actualizar estados.</div>`;
    bindPdfButtons($("#rlog",el),"comprobante");
  }
  update();return{update};
},

/* USUARIOS (admin) */
usuarios(el){
  let editing=null; /* username being edited, or null = new */
  el.innerHTML=`<div class="stack" style="gap:18px">
    <div class="section-head"><div><div class="label">Administración</div><h1>Usuarios y permisos</h1><p class="muted">Crea las cuentas de tu equipo y asigna a cada persona su rol.</p></div>
      <div class="row"><button class="btn ghost" id="upd" type="button">${ic("pdf")}Reporte de usuarios PDF</button></div></div>
    <div class="users-layout">
      <form class="card stack" id="uf" novalidate autocomplete="off">
        <div class="row" style="justify-content:space-between"><h2 id="uft">Crear usuario</h2><button class="btn ghost sm" type="button" id="ucancel" hidden>Cancelar edición</button></div>
<div class="uf-grid">        <label class="field"><span>Nombre completo <i>*</i></span><input class="input" id="u_name" placeholder="Ej: Laura Gómez"></label>        <label class="field"><span>Usuario para entrar <i>*</i></span><input class="input mono" id="u_user" placeholder="Ej: laura.gomez" autocapitalize="off" spellcheck="false"><span class="hint">Solo minúsculas, números, punto, guion o guion bajo (3 a 20 caracteres).</span></label></div>
        <div class="field"><span>Rol <i>*</i></span><div class="role-pick" id="u_roles">${Object.entries(ROLES).map(([k,v])=>`<button type="button" class="role-btn" data-role="${k}" aria-pressed="${k==="recepcion"}"><b>${v.label}</b><small>${v.desc}</small></button>`).join("")}</div></div>
        <div class="grid2">
          <label class="field"><span id="u_pl">Contraseña <i>*</i></span><input class="input" id="u_pass" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label>
          <label class="field"><span>Confirmar contraseña</span><input class="input" id="u_pass2" type="password" autocomplete="new-password" placeholder="Repite la contraseña"></label>
        </div>
        <label class="check"><input type="checkbox" id="u_act" checked>Usuario activo (puede iniciar sesión)</label>
        <div id="uerr" class="err" hidden></div>
        <button class="btn" type="submit" id="usave">${ic("plus")}Crear usuario</button>
      </form>
      <div class="card stack" style="min-width:0"><div class="section-head"><h2>Usuarios registrados</h2><input class="input" id="uq" placeholder="Buscar nombre o usuario" style="max-width:240px"></div><div id="ut"></div></div>
    </div>
    <div class="card stack"><h2>Permisos por rol</h2><div class="tbl-wrap"><table><thead><tr><th>Sección</th>${Object.values(ROLES).map(r=>`<th>${r.label}</th>`).join("")}</tr></thead><tbody>
      ${Object.entries(PAGES).map(([k,l])=>`<tr><td><b>${l}</b></td>${Object.values(ROLES).map(r=>`<td>${r.pages.includes(k)?'<span class="st st-listo">Sí</span>':'<span class="muted">—</span>'}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
    <div class="card stack"><h2>Respaldo de datos</h2>
      <p class="muted">Descarga una copia de usuarios y órdenes, o cárgala en otro computador para seguir trabajando con los mismos datos.</p>
      <div class="row"><button class="btn ghost" id="bexp" type="button">${ic("pdf")}Descargar respaldo (.json)</button>
      <label class="btn ghost" for="bimp" style="cursor:pointer">${ic("plus")}Cargar respaldo</label><input type="file" id="bimp" accept=".json,application/json" hidden></div></div>
    <div class="card stack"><h2>Bitácora de actividad</h2><div id="bit"></div></div>
  </div>`;
  let role="recepcion";
  const setRole=(r)=>{role=r;$$("#u_roles .role-btn",el).forEach(b=>b.setAttribute("aria-pressed",b.dataset.role===r))};
  $$("#u_roles .role-btn",el).forEach(b=>b.onclick=()=>setRole(b.dataset.role));
  const f=$("#uf",el),err=$("#uerr",el);
  const showErr=(m)=>{err.hidden=!m;err.textContent=m||""};
  function resetForm(){editing=null;f.reset();setRole("recepcion");$("#u_user",el).disabled=false;$("#u_act",el).checked=true;
    $("#uft",el).textContent="Crear usuario";$("#usave",el).innerHTML=`${ic("plus")}Crear usuario`;$("#ucancel",el).hidden=true;
    $("#u_pl",el).innerHTML="Contraseña <i>*</i>";$("#u_pass",el).placeholder="Mínimo 6 caracteres";showErr("")}
  function editUser(name){const u=Store.getUser(name);if(!u)return;editing=u.user;
    $("#u_name",el).value=u.name;$("#u_user",el).value=u.user;$("#u_user",el).disabled=true;setRole(u.role);$("#u_act",el).checked=u.activo!==false;
    $("#u_pass",el).value="";$("#u_pass2",el).value="";$("#u_pl",el).textContent="Nueva contraseña (opcional)";$("#u_pass",el).placeholder="Déjala vacía para no cambiarla";
    $("#uft",el).textContent="Editar usuario";$("#usave",el).textContent="Guardar cambios";$("#ucancel",el).hidden=false;showErr("");
    f.scrollIntoView({behavior:"smooth",block:"start"});$("#u_name",el).focus()}
  $("#ucancel",el).onclick=resetForm;
  const activeAdmins=(except)=>Store.users.filter(u=>u.role==="admin"&&u.activo!==false&&u.user!==except).length;
  f.onsubmit=async(e)=>{e.preventDefault();
    const name=$("#u_name",el).value.trim(),user=$("#u_user",el).value.trim().toLowerCase(),p1=$("#u_pass",el).value,p2=$("#u_pass2",el).value,act=$("#u_act",el).checked;
    if(name.length<3)return showErr("Escribe el nombre completo (mínimo 3 caracteres).");
    if(!/^[a-z0-9._-]{3,20}$/.test(user))return showErr("El usuario debe tener de 3 a 20 caracteres: minúsculas, números, punto, guion o guion bajo.");
    if(!editing&&Store.getUser(user))return showErr(`El usuario “${user}” ya existe. Elige otro.`);
    if(!editing||p1){if(p1.length<6)return showErr("La contraseña debe tener al menos 6 caracteres.");if(p1!==p2)return showErr("Las contraseñas no coinciden.")}
    if(editing){const old=Store.getUser(editing);
      if(old.role==="admin"&&(role!=="admin"||!act)&&activeAdmins(editing)===0)return showErr("Debe quedar al menos un administrador activo.");
      if(editing===S.user.user&&!act)return showErr("No puedes desactivar tu propio usuario.");}
    const btn=$("#usave",el);btn.disabled=true;
    try{
      const now=new Date().toISOString();
      const base=editing?clone(Store.getUser(editing)):{user,creado:now,creadoPor:S.user.name};
      Object.assign(base,{name,role,activo:act,actualizado:now});
      if(p1)base.hash=hashPass(base.user,p1);
      await Store.saveUser(base);
      toast(editing?`Usuario ${base.user} actualizado`:`Usuario ${base.user} creado como ${ROLES[role].label}`);
      resetForm();
    }catch(x){showErr("No se pudo guardar el usuario. Intenta de nuevo.")}
    btn.disabled=false;
  };
  const armed={};
  async function act(kind,name){
    const u=Store.getUser(name);if(!u)return;
    if(kind==="edit")return editUser(name);
    if(kind==="toggle"){
      if(name===S.user.user)return toast("No puedes desactivar tu propio usuario.");
      if(u.role==="admin"&&u.activo!==false&&activeAdmins(name)===0)return toast("Debe quedar al menos un administrador activo.");
      const c=clone(u);c.activo=u.activo===false;c.actualizado=new Date().toISOString();await Store.saveUser(c);toast(`${u.user} ${c.activo?"activado":"desactivado"}`);return}
    if(kind==="del"){
      if(name===S.user.user)return toast("No puedes eliminar tu propio usuario.");
      if(u.role==="admin"&&activeAdmins(name)===0)return toast("Debe quedar al menos un administrador activo.");
      if(!armed[name]){armed[name]=true;update();setTimeout(()=>{delete armed[name];update()},4000);return}
      delete armed[name];if(editing===name)resetForm();await Store.deleteUser(name);toast(`Usuario ${name} eliminado`)}
  }
  $("#uq",el).oninput=update;
  $("#upd",el).onclick=()=>pdfUsuarios();
  $("#bexp",el).onclick=async()=>{
    const data={app:"Juancho Pérez ServiceDesk",version:2,exportado:new Date().toISOString(),usuarios:Store.users,ordenes:Store.orders};
    await saveFile(`respaldo_servicedesk_${today()}.json`,new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  };
  $("#bimp",el).onchange=(e)=>{const file=e.target.files[0];if(!file)return;const rd=new FileReader();
    rd.onload=async()=>{try{const data=JSON.parse(rd.result);if(!data||(!Array.isArray(data.usuarios)&&!Array.isArray(data.ordenes)))throw 0;
      await Store.importAll(data);toast(`Respaldo cargado: ${(data.usuarios||[]).length} usuarios, ${(data.ordenes||[]).length} órdenes`)}
      catch(x){toast("El archivo no es un respaldo válido de este sistema.")}e.target.value=""};
    rd.readAsText(file)};
  function update(){
    const q=$("#uq",el).value.toLowerCase();
    const list=[...Store.users].filter(u=>!q||(u.name+" "+u.user).toLowerCase().includes(q)).sort((a,b)=>Object.keys(ROLES).indexOf(a.role)-Object.keys(ROLES).indexOf(b.role)||a.name.localeCompare(b.name));
    const carga=(u)=>u.role==="tecnico"?Store.orders.filter(o=>o.tecnico===u.name&&o.estado!=="entregado").length+" activas":u.role==="recepcion"?Store.orders.filter(o=>o.creadoPor===u.name).length+" creadas":"—";
    $("#ut",el).innerHTML=list.length?`<div class="tbl-wrap"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Órdenes</th><th>Acciones</th></tr></thead><tbody>${list.map(u=>`<tr>
      <td><b>${esc(u.name)}</b>${u.user===S.user.user?' <span class="small muted">(tú)</span>':""}<div class="small muted">Creado ${fmtDate(u.creado,false)}</div></td>
      <td class="mono">${esc(u.user)}</td><td><span class="role-tag">${ROLES[u.role]?.label||esc(u.role)}</span></td>
      <td>${u.activo===false?'<span class="st st-entregado">Inactivo</span>':'<span class="st st-listo">Activo</span>'}</td><td class="small mono">${carga(u)}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn ghost sm" data-ua="edit" data-u="${esc(u.user)}" type="button">Editar</button>
        <button class="btn ghost sm" data-ua="toggle" data-u="${esc(u.user)}" type="button">${u.activo===false?"Activar":"Desactivar"}</button>
        <button class="btn ${armed[u.user]?"danger":"ghost"} sm" data-ua="del" data-u="${esc(u.user)}" type="button">${armed[u.user]?"¿Eliminar? Confirmar":"Eliminar"}</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No hay usuarios que coincidan.</div>`;
    $$("[data-ua]",el).forEach(b=>b.onclick=()=>act(b.dataset.ua,b.dataset.u));
    const ev=[];Store.orders.forEach(o=>(o.historial||[]).forEach(h=>ev.push({...h,codigo:o.codigo})));
    ev.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    $("#bit",el).innerHTML=ev.length?`<ul class="timeline">${ev.slice(0,25).map(h=>`<li><b>${esc(h.usuario)}</b> movió <span class="mono">${esc(h.codigo)}</span> a ${st(h.estado)} <span class="small muted">· ${fmtDate(h.fecha)}</span><div class="small">${esc(h.nota||"")}</div></li>`).join("")}</ul>`:`<div class="empty">Sin actividad todavía.</div>`;
  }
  update();return{update};
}
};

/* ---------- Order detail (taller) ---------- */
function openOrder(code){
  const o0=Store.get(code);if(!o0)return;
  const o=clone(o0);let nuevo=o.estado;
  const canEdit=S.user.role==="tecnico"||S.user.role==="admin";
  const bg=document.createElement("div");bg.className="modal-bg";
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="Orden ${esc(o.codigo)}">
    <div class="row" style="justify-content:space-between"><div><div class="label">Orden de servicio</div><h2 class="mono" style="font-size:1.5rem">${esc(o.codigo)}</h2></div><button class="btn ghost sm" id="mx" type="button" aria-label="Cerrar">${ic("x")}</button></div>
    <div class="card stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h3>${esc(o.equipo.tipo)} · ${esc(o.equipo.marca)} ${esc(o.equipo.modelo)}</h3>${st(o.estado)}</div>
      <div class="ticket"><dl class="kv"><dt>Cliente</dt><dd>${esc(o.cliente.nombre)} · ${esc(o.cliente.documento)}</dd><dt>WhatsApp</dt><dd>${esc(o.cliente.telefono)}</dd><dt>Serie</dt><dd>${esc(o.equipo.serie||"—")}</dd><dt>Accesorios</dt><dd>${esc((o.accesorios||[]).join(", ")||"Ninguno")}</dd><dt>Falla</dt><dd>${esc(o.falla)}</dd><dt>Prioridad</dt><dd><span class="prio prio-${o.prioridad}">${o.prioridad}</span></dd><dt>Presupuesto</dt><dd>${money(o.presupuesto)}</dd></dl></div></div>
    <div class="card stack">
      <h3>Diagnóstico y reparación</h3>
      <label class="field"><span>Diagnóstico técnico</span><textarea class="input" id="m_diag" ${canEdit?"":"disabled"} placeholder="Ej: Disco NVMe con sectores dañados. Se recomienda reemplazo.">${esc(o.diagnostico)}</textarea></label>
      <div class="grid2"><label class="field"><span>Repuestos usados</span><input class="input" id="m_rep" ${canEdit?"":"disabled"} value="${esc(o.repuestos)}" placeholder="Ej: SSD Kingston NV2 500GB"></label>
      <label class="field"><span>Costo final (COP)</span><input class="input" id="m_cost" inputmode="numeric" ${canEdit?"":"disabled"} value="${o.costoFinal||""}" placeholder="Ej: 280000"></label>
      <label class="field"><span>Técnico</span><select class="input" id="m_tec" ${canEdit?"":"disabled"}>${tecnicos(o.tecnico).map(t=>`<option ${t===o.tecnico?"selected":""}>${esc(t)}</option>`).join("")}</select></label></div>
      <div class="field"><span>Cambiar estado</span><div class="stepper">${ESTADOS.map((e,i)=>`<button type="button" class="sbtn" data-s="${e.id}" aria-pressed="${e.id===nuevo}" ${canEdit?"":"disabled"}><i>${i+1}</i><span>${e.label}</span></button>`).join("")}</div></div>
      <label class="field"><span>Nota para el historial</span><input class="input" id="m_nota" ${canEdit?"":"disabled"} placeholder="Ej: Se reemplazó el disco y se reinstaló el sistema."></label>
      <div id="merr" class="err" hidden></div>
      <div class="row">${canEdit?`<button class="btn" id="msave" type="button">${ic("db")}Guardar y generar informe PDF</button>`:""}<button class="btn ghost" id="mpdf" type="button">${ic("pdf")}Solo descargar PDF</button></div>
    </div>
    <div class="card stack"><h3>Historial</h3><ul class="timeline">${[...(o.historial||[])].reverse().map(h=>`<li><b>${esc(EST[h.estado]?.label||h.estado)}</b> <span class="small muted">· ${fmtDate(h.fecha)} · ${esc(h.usuario)}</span><div class="small">${esc(h.nota||"")}</div></li>`).join("")}</ul></div>
  </div>`;
  document.body.appendChild(bg);document.body.style.overflow="hidden";
  const close=()=>{bg.remove();document.body.style.overflow=""};
  bg.onclick=(e)=>{if(e.target===bg)close()};$("#mx",bg).onclick=close;
  document.addEventListener("keydown",function k(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",k)}});
  $$(".sbtn",bg).forEach(b=>b.onclick=()=>{nuevo=b.dataset.s;$$(".sbtn",bg).forEach(x=>x.setAttribute("aria-pressed",x===b))});
  $("#mpdf",bg).onclick=()=>pdfOrden(Store.get(code)||o,"informe");
  const sv=$("#msave",bg);
  if(sv)sv.onclick=async()=>{
    const diag=$("#m_diag",bg).value.trim(),rep=$("#m_rep",bg).value.trim(),cost=Number($("#m_cost",bg).value.replace(/\D/g,""))||0,tec=$("#m_tec",bg).value,nota=$("#m_nota",bg).value.trim();
    const er=$("#merr",bg);
    if(EST[nuevo].i>=EST.reparacion.i&&!diag){er.hidden=false;er.textContent="Escribe el diagnóstico antes de pasar a reparación.";return}
    if(EST[nuevo].i>=EST.listo.i&&!cost){er.hidden=false;er.textContent="Indica el costo final antes de marcar el equipo como listo.";return}
    const changed=nuevo!==o.estado||diag!==o.diagnostico||rep!==o.repuestos||cost!==(o.costoFinal||0)||tec!==o.tecnico||nota;
    if(!changed){er.hidden=false;er.textContent="No hay cambios para guardar.";return}
    sv.disabled=true;sv.textContent="Guardando en Supabase…";
    const now=new Date().toISOString();
    const fresh=clone(Store.get(code)||o);
    Object.assign(fresh,{estado:nuevo,diagnostico:diag,repuestos:rep,costoFinal:cost,tecnico:tec,actualizado:now});
    fresh.historial=[...(fresh.historial||[]),{fecha:now,estado:nuevo,nota:nota||(nuevo!==o.estado?`Cambio de estado a ${EST[nuevo].label}.`:"Actualización del diagnóstico."),usuario:S.user.name}].slice(-60);
    try{await Store.saveOrder(fresh);close();toast(`Orden ${code} actualizada`);pdfOrden(fresh,"informe")}
    catch(e){sv.disabled=false;sv.textContent="Guardar y generar informe PDF";er.hidden=false;er.textContent="No se pudo guardar. Intenta de nuevo."}
  };
}

/* ---------- Supabase modal ---------- */
function openDbModal(){
  const bg=document.createElement("div");bg.className="modal-bg";
  const counts={ordenes:Store.orders.length,reportes:Store.reports.length,usuarios:Store.users.length};
  bg.innerHTML=`<div class="modal center" role="dialog" aria-modal="true" aria-label="Conexión Supabase">
    <div class="row" style="justify-content:space-between"><div class="row">${ic("db").replace("<svg","<svg style='width:26px;height:26px;color:var(--ok)'")}<h2>Conexión a Supabase</h2></div><button class="btn ghost sm" id="dx" type="button" aria-label="Cerrar">${ic("x")}</button></div>
    <div class="ticket"><dl class="kv"><dt>Estado</dt><dd><span class="st st-listo">${Store.ready?"Conectado":"Conectando"}</span></dd><dt>Proyecto</dt><dd class="mono small">${SUPA.url}</dd><dt>Región</dt><dd>${SUPA.region}</dd><dt>Latencia</dt><dd class="mono">${Store.latency} ms</dd><dt>Anon key</dt><dd class="mono small">anon-key (autenticada) ••••••••</dd><dt>Última sync</dt><dd>${Store.lastSync?Store.lastSync.toLocaleTimeString("es-CO"):"—"}</dd></dl></div>
    <div class="tbl-wrap"><table style="min-width:0"><thead><tr><th>Tabla</th><th>Filas</th><th>RLS</th></tr></thead><tbody>${Object.entries(counts).map(([t,n])=>`<tr><td class="mono">public.${t}</td><td class="mono">${n}</td><td><span class="st st-listo">Activo</span></td></tr>`).join("")}</tbody></table></div>
    <div class="console">${Store.log.slice(0,12).map(l=>`<span class="${l.type==="warn"?"c-warn":l.type==="info"?"c-info":""}">[${l.t.toLocaleTimeString("es-CO")}] ${l.type==="warn"?"WARN":l.type==="info"?"INFO":" OK "} ${esc(l.msg)}</span>`).join("\n")}</div>
    <p class="hint"></p>
  </div>`;
  document.body.appendChild(bg);
  const close=()=>bg.remove();bg.onclick=(e)=>{if(e.target===bg)close()};$("#dx",bg).onclick=close;
}

start();
})();
