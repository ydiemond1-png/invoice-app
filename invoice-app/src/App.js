import { useState, useRef, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection, doc, setDoc, getDocs, deleteDoc, query, orderBy
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Helpers ──────────────────────────────────────
function genNum(n) { return `INV-${String(n).padStart(4, "0")}`; }
function todayStr() { return new Date().toISOString().split("T")[0]; }

// ════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════
const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--ink:#0f0e0c;--paper:#faf8f4;--cream:#f0ebe1;--gold:#c8973a;--gold-light:#e8c97a;--muted:#7a7265;--border:#ddd8ce;--danger:#c0392b;}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);}

.auth-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--cream);padding:24px;}
.auth-card{background:var(--paper);border-radius:20px;box-shadow:0 8px 60px rgba(0,0,0,0.1);padding:44px 40px;width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;}
.auth-logo{margin-bottom:16px;}
.auth-title{font-family:'DM Serif Display',serif;font-size:1.8rem;letter-spacing:-0.5px;margin-bottom:6px;}
.auth-sub{color:var(--muted);font-size:0.83rem;text-align:center;margin-bottom:24px;}
.auth-tabs{display:flex;width:100%;background:var(--cream);border-radius:10px;padding:3px;margin-bottom:24px;}
.auth-tab{flex:1;padding:8px;border:none;background:transparent;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.18s;}
.auth-tab.active{background:var(--paper);color:var(--ink);box-shadow:0 1px 6px rgba(0,0,0,0.1);}
.auth-fields{width:100%;display:flex;flex-direction:column;gap:14px;margin-bottom:10px;}
.auth-field{display:flex;flex-direction:column;gap:5px;}
.auth-field label{font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);font-weight:600;}
.auth-field input{background:var(--cream);border:1.5px solid var(--border);border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--ink);transition:border-color 0.2s;width:100%;}
.auth-field input:focus{outline:none;border-color:var(--gold);}
.auth-field input::placeholder{color:var(--border);}
.auth-error{width:100%;background:#fdecea;border-radius:8px;padding:8px 13px;font-size:0.78rem;color:var(--danger);text-align:center;margin-top:4px;margin-bottom:4px;}
.auth-btn{width:100%;margin-top:16px;background:var(--gold);color:white;border:none;border-radius:10px;padding:12px;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;transition:background 0.18s;}
.auth-btn:hover{background:#b5842e;}
.auth-btn:disabled{opacity:0.6;cursor:default;}

.app-header{background:var(--paper);border-bottom:1px solid var(--border);padding:0 36px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
.app-brand{display:flex;align-items:center;gap:10px;font-family:'DM Serif Display',serif;font-size:1.1rem;color:var(--ink);}
.header-nav{display:flex;align-items:center;gap:4px;}
.hnav-btn{padding:7px 16px;border:none;background:transparent;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.18s;}
.hnav-btn:hover{background:var(--cream);color:var(--ink);}
.hnav-btn.active{background:var(--cream);color:var(--ink);}
.header-right{display:flex;align-items:center;gap:12px;}
.hdr-user{font-size:0.82rem;color:var(--muted);font-weight:500;}
.btn-logout{background:transparent;border:1.5px solid var(--border);border-radius:7px;padding:5px 13px;font-family:'DM Sans',sans-serif;font-size:0.78rem;color:var(--muted);cursor:pointer;transition:all 0.18s;}
.btn-logout:hover{border-color:var(--danger);color:var(--danger);}

.list-bg{min-height:100vh;background:var(--cream);}
.list-body{max-width:940px;margin:0 auto;padding:40px 24px;}
.list-top{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;}
.list-h2{font-family:'DM Serif Display',serif;font-size:2rem;letter-spacing:-0.5px;}
.list-count{color:var(--muted);font-size:0.83rem;margin-top:3px;}
.btn-create{background:var(--gold);color:white;border:none;border-radius:9px;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:background 0.18s;}
.btn-create:hover{background:#b5842e;}
.list-empty-box{display:flex;flex-direction:column;align-items:center;padding:64px 0;color:var(--muted);font-size:0.88rem;}
.inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
.inv-card-item{background:var(--paper);border-radius:13px;padding:22px 24px;border:1.5px solid var(--border);transition:box-shadow 0.2s,border-color 0.2s;}
.inv-card-item:hover{box-shadow:0 4px 20px rgba(0,0,0,0.08);border-color:#ccc8be;}
.inv-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;}
.inv-card-num{font-family:'DM Serif Display',serif;font-size:1.05rem;color:var(--gold);}
.inv-card-client{font-size:0.82rem;color:var(--muted);margin-top:2px;}
.inv-card-total{font-family:'DM Serif Display',serif;font-size:1.1rem;}
.inv-card-date{font-size:0.75rem;color:var(--border);margin-bottom:16px;}
.inv-card-actions{display:flex;gap:8px;}
.btn-open{flex:1;background:var(--ink);color:#e8e3da;border:none;border-radius:7px;padding:7px 0;font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;cursor:pointer;transition:background 0.18s;}
.btn-open:hover{background:#2a2925;}
.btn-del-inv{background:transparent;border:1.5px solid var(--border);color:var(--muted);border-radius:7px;padding:7px 12px;font-family:'DM Sans',sans-serif;font-size:0.78rem;cursor:pointer;transition:all 0.18s;}
.btn-del-inv:hover{border-color:var(--danger);color:var(--danger);}

.tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.tpl-card{background:var(--paper);border-radius:13px;padding:22px 24px;border:1.5px solid var(--border);transition:box-shadow 0.2s,border-color 0.2s;}
.tpl-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.08);border-color:#ccc8be;}
.tpl-card-name{font-family:'DM Serif Display',serif;font-size:1.15rem;margin-bottom:5px;}
.tpl-card-company{font-size:0.83rem;color:var(--muted);margin-bottom:3px;}
.tpl-card-meta{font-size:0.75rem;color:var(--border);margin-bottom:16px;}
.tpl-card-actions{display:flex;gap:8px;}
.btn-tpl-use{flex:1;background:var(--gold);color:white;border:none;border-radius:7px;padding:7px 0;font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;cursor:pointer;transition:background 0.18s;}
.btn-tpl-use:hover{background:#b5842e;}
.btn-tpl-edit{background:transparent;border:1.5px solid var(--border);color:var(--muted);border-radius:7px;padding:7px 12px;font-family:'DM Sans',sans-serif;font-size:0.78rem;cursor:pointer;transition:all 0.18s;}
.btn-tpl-edit:hover{background:var(--cream);color:var(--ink);border-color:#aaa;}
.btn-tpl-del{background:transparent;border:1.5px solid var(--border);color:var(--muted);border-radius:7px;padding:7px 12px;font-family:'DM Sans',sans-serif;font-size:0.78rem;cursor:pointer;transition:all 0.18s;}
.btn-tpl-del:hover{border-color:var(--danger);color:var(--danger);}
.tpl-logo-thumb{width:36px;height:36px;border-radius:6px;object-fit:contain;background:var(--cream);margin-bottom:10px;}
.tpl-logo-ph{width:36px;height:36px;border-radius:6px;background:var(--cream);display:flex;align-items:center;justify-content:center;margin-bottom:10px;}

.modal-overlay{position:fixed;inset:0;background:rgba(15,14,12,0.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;}
.modal-box{background:var(--paper);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,0.2);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;}
.modal-header{padding:28px 32px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}
.modal-title{font-family:'DM Serif Display',serif;font-size:1.4rem;}
.modal-close{background:var(--cream);border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;color:var(--muted);}
.modal-close:hover{background:var(--border);}
.modal-body{padding:0 32px 32px;display:flex;flex-direction:column;gap:16px;}
.m-field{display:flex;flex-direction:column;gap:6px;}
.m-lbl{font-size:0.68rem;letter-spacing:1.8px;text-transform:uppercase;color:var(--gold);font-weight:600;}
.m-inp{background:var(--cream);border:1.5px solid var(--border);border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--ink);transition:border-color 0.2s;width:100%;}
.m-inp:focus{outline:none;border-color:var(--gold);}
.m-inp::placeholder{color:var(--border);}
textarea.m-inp{resize:vertical;min-height:70px;line-height:1.55;}
.m-logo-zone{border:2px dashed var(--border);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;}
.m-logo-zone:hover{border-color:var(--gold);background:rgba(200,151,58,0.04);}
.m-logo-preview{max-height:60px;max-width:180px;border-radius:6px;}
.m-logo-ph{color:var(--border);font-size:0.78rem;}
.m-logo-ph svg{display:block;margin:0 auto 5px;}
.modal-footer{padding:0 32px 32px;display:flex;gap:10px;}
.btn-modal-save{flex:1;background:var(--gold);color:white;border:none;border-radius:10px;padding:12px;font-family:'DM Sans',sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;transition:background 0.18s;}
.btn-modal-save:hover{background:#b5842e;}
.btn-modal-save:disabled{opacity:0.5;cursor:default;}
.btn-modal-cancel{background:var(--cream);color:var(--muted);border:none;border-radius:10px;padding:12px 20px;font-family:'DM Sans',sans-serif;font-size:0.88rem;font-weight:600;cursor:pointer;transition:background 0.18s;}
.btn-modal-cancel:hover{background:var(--border);}

.editor-shell{display:flex;min-height:calc(100vh - 58px);}
.sidebar{width:278px;min-width:260px;background:var(--ink);color:#e8e3da;padding:22px 18px 36px;display:flex;flex-direction:column;gap:16px;height:calc(100vh - 58px);overflow-y:auto;position:sticky;top:58px;scrollbar-width:thin;scrollbar-color:#333 transparent;}
.sb-back-row{display:flex;align-items:center;gap:8px;}
.btn-back{background:rgba(255,255,255,0.08);border:none;color:#e8e3da;border-radius:8px;padding:6px 11px;font-family:'DM Sans',sans-serif;font-size:0.76rem;display:flex;align-items:center;gap:5px;cursor:pointer;transition:background 0.18s;}
.btn-back:hover{background:rgba(255,255,255,0.14);}
.sb-title{font-family:'DM Serif Display',serif;font-size:1.05rem;color:var(--gold-light);}
.s-sec{display:flex;flex-direction:column;gap:7px;}
.s-lbl{font-size:0.6rem;letter-spacing:1.8px;text-transform:uppercase;color:var(--gold);font-weight:600;}
.s-inp{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e8e3da;padding:8px 11px;font-family:'DM Sans',sans-serif;font-size:0.84rem;width:100%;transition:border-color 0.2s;}
.s-inp:focus{outline:none;border-color:var(--gold);}
.s-inp::placeholder{color:rgba(255,255,255,0.2);}
textarea.s-inp{resize:vertical;min-height:60px;line-height:1.55;}
.logo-zone{border:2px dashed rgba(200,151,58,0.35);border-radius:10px;padding:13px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;position:relative;}
.logo-zone:hover{border-color:var(--gold);background:rgba(200,151,58,0.06);}
.logo-preview{max-height:56px;max-width:160px;border-radius:5px;}
.logo-ph{color:rgba(200,151,58,0.7);font-size:0.7rem;line-height:1.5;}
.logo-ph svg{display:block;margin:0 auto 5px;}
.logo-rm{position:absolute;top:5px;right:7px;background:rgba(192,57,43,0.85);color:white;border:none;border-radius:4px;font-size:0.62rem;padding:2px 6px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.sdiv{height:1px;background:rgba(255,255,255,0.08);}
.btn-save-inv{background:var(--gold);color:white;border:none;border-radius:8px;padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:600;cursor:pointer;transition:background 0.18s;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;}
.btn-save-inv:hover{background:#b5842e;}
.btn-save-inv:disabled{opacity:0.6;cursor:default;}
.save-msg{font-size:0.73rem;color:#5dda8a;text-align:center;min-height:15px;font-weight:500;}
.editor-main{flex:1;padding:28px 36px;overflow-y:auto;}
.editor-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
.inv-num-disp{font-family:'DM Serif Display',serif;font-size:1rem;color:var(--gold);letter-spacing:1px;}
.btn-print{background:var(--ink);color:#e8e3da;border:none;border-radius:8px;padding:8px 16px;font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;}
.btn-print:hover{background:#2a2925;}
.inv-card{background:var(--paper);border-radius:16px;box-shadow:0 4px 48px rgba(0,0,0,0.09);padding:48px 52px;max-width:780px;}
.inv-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;gap:24px;}
.inv-logo{max-height:72px;max-width:200px;object-fit:contain;}
.inv-logo-ph{width:72px;height:72px;background:var(--cream);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--border);font-size:0.62rem;letter-spacing:1.5px;text-transform:uppercase;}
.inv-title-blk{text-align:right;}
.inv-title{font-family:'DM Serif Display',serif;font-size:2.8rem;color:var(--gold);letter-spacing:-1px;line-height:1;}
.inv-num-badge{color:var(--muted);font-size:0.83rem;margin-top:4px;letter-spacing:0.5px;}
.divider{height:1px;background:var(--border);margin:24px 0;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:28px;}
.p-lbl{font-size:0.61rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:7px;}
.p-name{font-family:'DM Serif Display',serif;font-size:1.18rem;margin-bottom:3px;}
.meta-row{display:flex;gap:30px;margin-bottom:30px;flex-wrap:wrap;align-items:flex-end;}
.mi{display:flex;flex-direction:column;gap:3px;}
.mi .ml{font-size:0.61rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:600;}
.mi .mv{font-size:0.85rem;font-weight:500;}
.items-tbl{width:100%;border-collapse:collapse;}
.items-tbl th{font-size:0.61rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);font-weight:600;text-align:left;padding:9px 0;border-bottom:1.5px solid var(--border);}
.items-tbl th.r,.items-tbl td.r{text-align:right;}
.items-tbl td{padding:10px 0;border-bottom:1px solid var(--border);vertical-align:middle;font-size:0.86rem;}
.i-inp{background:transparent;border:none;border-bottom:1.5px dashed transparent;font-family:'DM Sans',sans-serif;font-size:0.86rem;color:var(--ink);width:100%;padding:2px 0;transition:border-color 0.2s;}
.i-inp:focus{outline:none;border-bottom-color:var(--gold);}
.i-inp::placeholder{color:var(--border);}
.i-inp.r{text-align:right;}
.btn-del{background:transparent;border:none;color:var(--border);font-size:0.88rem;cursor:pointer;padding:2px 5px;border-radius:4px;transition:all 0.15s;font-family:'DM Sans',sans-serif;}
.btn-del:hover{color:var(--danger);background:#fdecea;}
.btn-add{background:none;border:none;color:var(--gold);font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;cursor:pointer;padding:10px 0;display:flex;align-items:center;gap:5px;}
.btn-add:hover{color:#b5842e;}
.totals{display:flex;flex-direction:column;align-items:flex-end;gap:7px;margin-top:6px;}
.t-row{display:flex;gap:36px;font-size:0.83rem;}
.t-row .tl{color:var(--muted);min-width:86px;text-align:right;}
.t-row .tv{min-width:86px;text-align:right;font-weight:500;}
.t-final{display:flex;gap:36px;margin-top:8px;padding-top:11px;border-top:2px solid var(--ink);}
.t-final .tl{font-family:'DM Serif Display',serif;font-size:1rem;min-width:86px;text-align:right;}
.t-final .tv{font-family:'DM Serif Display',serif;font-size:1.28rem;color:var(--gold);min-width:86px;text-align:right;}
.notes-sec{margin-top:40px;padding-top:18px;border-top:1px solid var(--border);}
.notes-lbl{font-size:0.61rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:7px;}
.notes-txt{color:var(--muted);font-size:0.82rem;line-height:1.6;white-space:pre-line;}

@media print{
  .sidebar,.editor-topbar,.btn-del,.btn-add,.app-header{display:none!important;}
  .editor-main{padding:0;}
  .inv-card{box-shadow:none;border-radius:0;padding:30px 36px;}
  body{background:white;}
  .i-inp{border-bottom:none;}
}

@media(max-width:640px){
  .app-header{padding:0 16px;}
  .header-nav{display:none;}
  .inv-card{padding:28px 20px;}
  .parties{grid-template-columns:1fr;}
  .editor-shell{flex-direction:column;}
  .sidebar{width:100%;height:auto;position:relative;top:0;}
  .list-body{padding:24px 16px;}
  .inv-grid{grid-template-columns:1fr;}
  .tpl-grid{grid-template-columns:1fr;}
}
`;

// ════════════════════════════════════════════════
// LOGO SVG
// ════════════════════════════════════════════════
function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="#c8973a"/>
      <path d="M10 26V12h10l6 6v8H10z" fill="white" opacity=".2"/>
      <path d="M10 12h10l6 6H16v-6" fill="white" opacity=".5"/>
      <rect x="13" y="20" width="10" height="1.5" rx=".75" fill="white"/>
      <rect x="13" y="23" width="7" height="1.5" rx=".75" fill="white"/>
    </svg>
  );
}

// ════════════════════════════════════════════════
// APP HEADER
// ════════════════════════════════════════════════
function AppHeader({ user, activeTab, onTab, onLogout }) {
  return (
    <header className="app-header">
      <div className="app-brand"><Logo size={28}/><span>InvoiceBuilder</span></div>
      <nav className="header-nav">
        <button className={`hnav-btn ${activeTab==="invoices"?"active":""}`} onClick={()=>onTab("invoices")}>Facturas</button>
        <button className={`hnav-btn ${activeTab==="templates"?"active":""}`} onClick={()=>onTab("templates")}>Templates</button>
      </nav>
      <div className="header-right">
        <span className="hdr-user">{user?.email?.split("@")[0]}</span>
        <button className="btn-logout" onClick={onLogout}>Salir</button>
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════════
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Completa todos los campos"); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Ese email ya está registrado",
        "auth/user-not-found": "Usuario no encontrado",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/invalid-email": "Email inválido",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
        "auth/invalid-credential": "Email o contraseña incorrectos",
      };
      setError(msgs[e.code] || "Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo"><Logo size={48}/></div>
        <h1 className="auth-title">InvoiceBuilder</h1>
        <p className="auth-sub">{mode==="login"?"Inicia sesión para continuar":"Crea tu cuenta gratis"}</p>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={()=>{setMode("login");setError("");}}>Iniciar sesión</button>
          <button className={`auth-tab ${mode==="register"?"active":""}`} onClick={()=>{setMode("register");setError("");}}>Registrarse</button>
        </div>
        <div className="auth-fields">
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete="email"/>
          </div>
          <div className="auth-field">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete={mode==="login"?"current-password":"new-password"}/>
          </div>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-btn" onClick={submit} disabled={loading}>{loading?"...":mode==="login"?"Entrar":"Crear cuenta"}</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// TEMPLATE MODAL
// ════════════════════════════════════════════════
function TemplateModal({ template, onSave, onClose }) {
  const [name, setName] = useState(template?.name||"");
  const [companyName, setCompanyName] = useState(template?.companyName||"");
  const [companyInfo, setCompanyInfo] = useState(template?.companyInfo||"");
  const [logo, setLogo] = useState(template?.logo||null);
  const [taxRate, setTaxRate] = useState(template?.taxRate??"");
  const [notes, setNotes] = useState(template?.notes||"");
  const logoRef = useRef();

  const handleLogo = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{template?"Editar Template":"Nuevo Template"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="m-field"><div className="m-lbl">Nombre *</div><input className="m-inp" placeholder="Ej: Beats Exclusivos" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="m-field">
            <div className="m-lbl">Logo</div>
            <div className="m-logo-zone" onClick={()=>logoRef.current.click()}>
              {logo ? <img src={logo} alt="logo" className="m-logo-preview"/> : <div className="m-logo-ph"><svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Clic para subir logo</div>}
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
            {logo && <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:"0.75rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:4}} onClick={()=>setLogo(null)}>✕ Quitar logo</button>}
          </div>
          <div className="m-field"><div className="m-lbl">Nombre de empresa</div><input className="m-inp" placeholder="Tu empresa" value={companyName} onChange={e=>setCompanyName(e.target.value)}/></div>
          <div className="m-field"><div className="m-lbl">Info de contacto</div><textarea className="m-inp" placeholder="Email / teléfono / dirección" value={companyInfo} onChange={e=>setCompanyInfo(e.target.value)}/></div>
          <div className="m-field"><div className="m-lbl">Tax (%)</div><input className="m-inp" type="number" min="0" max="100" step="0.1" placeholder="0" value={taxRate} onChange={e=>setTaxRate(e.target.value)} style={{maxWidth:120}}/></div>
          <div className="m-field"><div className="m-lbl">Notas / Términos</div><textarea className="m-inp" placeholder="Notas que aparecerán en cada factura..." value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        </div>
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-modal-save" onClick={()=>onSave({id:template?.id||Date.now().toString(),name,companyName,companyInfo,logo,taxRate,notes})} disabled={!name.trim()}>{template?"Guardar cambios":"Crear Template"}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// TEMPLATES SCREEN
// ════════════════════════════════════════════════
function TemplatesScreen({ user, onUseTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(()=>{ loadTemplates(); },[]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users", user.uid, "templates"), orderBy("name"));
      const snap = await getDocs(q);
      setTemplates(snap.docs.map(d=>({id:d.id,...d.data()})));
    } catch(_) { setTemplates([]); }
    setLoading(false);
  };

  const saveTemplate = async (tpl) => {
    try {
      await setDoc(doc(db,"users",user.uid,"templates",tpl.id), tpl);
      setShowModal(false); setEditing(null); loadTemplates();
    } catch(_){}
  };

  const deleteTemplate = async (tpl) => {
    try { await deleteDoc(doc(db,"users",user.uid,"templates",tpl.id)); } catch(_){}
    setTemplates(prev=>prev.filter(t=>t.id!==tpl.id));
  };

  return (
    <div className="list-bg">
      <div className="list-body">
        <div className="list-top">
          <div><h2 className="list-h2">Mis Templates</h2><p className="list-count">{templates.length} template{templates.length!==1?"s":""}</p></div>
          <button className="btn-create" onClick={()=>{setEditing(null);setShowModal(true);}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Template
          </button>
        </div>
        {loading && <div style={{color:"var(--muted)",textAlign:"center",padding:"40px 0"}}>Cargando...</div>}
        {!loading && templates.length===0 && (
          <div className="list-empty-box">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{color:"var(--border)",marginBottom:14}}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
            <p style={{marginBottom:6}}>No tienes templates</p>
            <button className="btn-create" onClick={()=>{setEditing(null);setShowModal(true);}}>Crear primer template</button>
          </div>
        )}
        {!loading && templates.length>0 && (
          <div className="tpl-grid">
            {templates.map(tpl=>(
              <div className="tpl-card" key={tpl.id}>
                {tpl.logo ? <img src={tpl.logo} alt="logo" className="tpl-logo-thumb"/> : <div className="tpl-logo-ph"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{color:"var(--border)"}}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>}
                <div className="tpl-card-name">{tpl.name}</div>
                {tpl.companyName && <div className="tpl-card-company">{tpl.companyName}</div>}
                <div className="tpl-card-meta">{tpl.taxRate ? `Tax: ${tpl.taxRate}%` : "Sin tax"}</div>
                <div className="tpl-card-actions">
                  <button className="btn-tpl-use" onClick={()=>onUseTemplate(tpl)}>Usar</button>
                  <button className="btn-tpl-edit" onClick={()=>{setEditing(tpl);setShowModal(true);}}>Editar</button>
                  <button className="btn-tpl-del" onClick={()=>deleteTemplate(tpl)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && <TemplateModal template={editing} onSave={saveTemplate} onClose={()=>{setShowModal(false);setEditing(null);}}/>}
    </div>
  );
}

// ════════════════════════════════════════════════
// INVOICE LIST
// ════════════════════════════════════════════════
function InvoiceListScreen({ user, onNew, onOpen }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ load(); },[]);

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db,"users",user.uid,"invoices"), orderBy("counter","desc"));
      const snap = await getDocs(q);
      setInvoices(snap.docs.map(d=>({id:d.id,...d.data()})));
    } catch(_){ setInvoices([]); }
    setLoading(false);
  };

  const del = async (inv) => {
    try { await deleteDoc(doc(db,"users",user.uid,"invoices",inv.id)); } catch(_){}
    setInvoices(prev=>prev.filter(i=>i.id!==inv.id));
  };

  const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);

  return (
    <div className="list-bg">
      <div className="list-body">
        <div className="list-top">
          <div><h2 className="list-h2">Mis Facturas</h2><p className="list-count">{invoices.length} factura{invoices.length!==1?"s":""}</p></div>
          <button className="btn-create" onClick={onNew}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Factura
          </button>
        </div>
        {loading && <div style={{color:"var(--muted)",textAlign:"center",padding:"40px 0"}}>Cargando...</div>}
        {!loading && invoices.length===0 && (
          <div className="list-empty-box">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{color:"var(--border)",marginBottom:12}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p style={{marginBottom:16}}>Aún no tienes facturas</p>
            <button className="btn-create" onClick={onNew}>Crear primera factura</button>
          </div>
        )}
        {!loading && invoices.length>0 && (
          <div className="inv-grid">
            {invoices.map(inv=>{
              const sub=(inv.items||[]).reduce((s,i)=>s+Number(i.qty)*Number(i.price),0);
              const t=sub*((inv.taxRate||0)/100);
              return (
                <div className="inv-card-item" key={inv.id}>
                  <div className="inv-card-top">
                    <div><div className="inv-card-num">{inv.invoiceNum}</div><div className="inv-card-client">{inv.clientName||"Sin cliente"}</div></div>
                    <div className="inv-card-total">{fmt(sub+t)}</div>
                  </div>
                  <div className="inv-card-date">{inv.invoiceDate}</div>
                  <div className="inv-card-actions">
                    <button className="btn-open" onClick={()=>onOpen(inv)}>Abrir</button>
                    <button className="btn-del-inv" onClick={()=>del(inv)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// TEMPLATE PICKER
// ════════════════════════════════════════════════
function TemplatePicker({ user, onPick, onSkip }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        const snap = await getDocs(collection(db,"users",user.uid,"templates"));
        setTemplates(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(_){}
      setLoading(false);
    })();
  },[]);

  if (loading) return null;
  if (templates.length===0) { onSkip(); return null; }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{maxWidth:520}}>
        <div className="modal-header">
          <div className="modal-title">¿Usar un template?</div>
          <button className="modal-close" onClick={onSkip}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{color:"var(--muted)",fontSize:"0.84rem",marginTop:-8}}>Selecciona uno para pre-llenar la factura, o empieza desde cero.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:4}}>
            {templates.map(tpl=>(
              <div key={tpl.id} style={{display:"flex",alignItems:"center",gap:14,background:"var(--cream)",borderRadius:11,padding:"14px 16px",cursor:"pointer",border:"1.5px solid transparent",transition:"border-color 0.18s"}}
                onClick={()=>onPick(tpl)}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
                {tpl.logo
                  ? <img src={tpl.logo} style={{width:38,height:38,objectFit:"contain",borderRadius:6,background:"white"}} alt="logo"/>
                  : <div style={{width:38,height:38,borderRadius:6,background:"var(--border)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                }
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1rem",marginBottom:2}}>{tpl.name}</div>
                  <div style={{fontSize:"0.78rem",color:"var(--muted)"}}>{tpl.companyName||"Sin empresa"}{tpl.taxRate?` · Tax ${tpl.taxRate}%`:""}</div>
                </div>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-modal-cancel" style={{width:"100%"}} onClick={onSkip}>Empezar desde cero</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// INVOICE EDITOR
// ════════════════════════════════════════════════
function InvoiceEditor({ user, invoice, onBack, onSaved }) {
  const isNew = !invoice?.id;
  const [companyName, setCompanyName] = useState(invoice?.companyName||"");
  const [companyInfo, setCompanyInfo] = useState(invoice?.companyInfo||"");
  const [logo, setLogo] = useState(invoice?.logo||null);
  const [invoiceNum, setInvoiceNum] = useState(invoice?.invoiceNum||"");
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoiceDate||todayStr());
  const [dueDate, setDueDate] = useState(invoice?.dueDate||"");
  const [clientName, setClientName] = useState(invoice?.clientName||"");
  const [clientInfo, setClientInfo] = useState(invoice?.clientInfo||"");
  const [items, setItems] = useState(invoice?.items||[{id:1,description:"",qty:1,price:0}]);
  const [notes, setNotes] = useState(invoice?.notes||"");
  const [taxRate, setTaxRate] = useState(invoice?.taxRate||0);
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const logoRef = useRef();

  useEffect(()=>{
    if (isNew && !invoiceNum) {
      (async()=>{
        try {
          const snap = await getDocs(collection(db,"users",user.uid,"invoices"));
          const nums = snap.docs.map(d=>d.data().counter||0);
          const next = nums.length>0 ? Math.max(...nums)+1 : 1;
          setInvoiceNum(genNum(next));
        } catch(_){ setInvoiceNum(genNum(1)); }
      })();
    }
  },[]);

  const handleLogo = (e) => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addItem = ()=>setItems([...items,{id:Date.now(),description:"",qty:1,price:0}]);
  const removeItem = id=>setItems(items.filter(i=>i.id!==id));
  const updateItem = (id,f,v)=>setItems(items.map(i=>i.id===id?{...i,[f]:v}:i));

  const subtotal=items.reduce((s,i)=>s+Number(i.qty)*Number(i.price),0);
  const tax=subtotal*(Number(taxRate)/100);
  const total=subtotal+tax;
  const fmt=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);

  const save = async () => {
    setSaving(true);
    const id=invoice?.id||Date.now().toString();
    const counter=parseInt((invoiceNum||"INV-0001").replace("INV-",""),10)||1;
    const data={counter,companyName,companyInfo,logo,invoiceNum,invoiceDate,dueDate,clientName,clientInfo,items,notes,taxRate,updatedAt:new Date().toISOString()};
    try {
      await setDoc(doc(db,"users",user.uid,"invoices",id), data);
      setSaveMsg("✓ Guardado");
      setTimeout(()=>setSaveMsg(""),2000);
      onSaved();
    } catch(e){ setSaveMsg("Error: "+e.message); setTimeout(()=>setSaveMsg(""),3000); }
    setSaving(false);
  };

  return (
    <div style={{display:"flex",minHeight:"calc(100vh - 58px)"}}>
      <aside className="sidebar">
        <div className="sb-back-row">
          <button className="btn-back" onClick={onBack}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Mis facturas
          </button>
        </div>
        <div className="sb-title">{isNew?"Nueva Factura":"Editar Factura"}</div>
        <div className="s-sec">
          <div className="s-lbl">Logo</div>
          <div className="logo-zone" onClick={()=>logoRef.current.click()}>
            {logo ? <><img src={logo} alt="logo" className="logo-preview"/><button className="logo-rm" onClick={e=>{e.stopPropagation();setLogo(null);}}>✕</button></> : <div className="logo-ph"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Subir logo</div>}
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
        </div>
        <div className="sdiv"/>
        <div className="s-sec"><div className="s-lbl">Empresa</div><input className="s-inp" placeholder="Tu empresa" value={companyName} onChange={e=>setCompanyName(e.target.value)}/></div>
        <div className="s-sec"><div className="s-lbl">Contacto</div><textarea className="s-inp" placeholder="Email / tel / dirección" value={companyInfo} onChange={e=>setCompanyInfo(e.target.value)}/></div>
        <div className="s-sec"><div className="s-lbl">Tax (%)</div><input className="s-inp" type="number" min="0" step="0.1" placeholder="0" value={taxRate} onChange={e=>setTaxRate(e.target.value)}/></div>
        <div className="s-sec"><div className="s-lbl">Notas</div><textarea className="s-inp" placeholder="Notas adicionales..." value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        <div className="sdiv"/>
        <button className="btn-save-inv" onClick={save} disabled={saving}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {saving?"Guardando...":"Guardar Factura"}
        </button>
        <div className="save-msg">{saveMsg}</div>
      </aside>

      <main className="editor-main">
        <div className="editor-topbar">
          <span className="inv-num-disp">{invoiceNum}</span>
          <button className="btn-print" onClick={()=>window.print()}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir / PDF
          </button>
        </div>
        <div className="inv-card">
          <div className="inv-hdr">
            <div>{logo?<img src={logo} alt="logo" className="inv-logo"/>:<div className="inv-logo-ph">logo</div>}</div>
            <div className="inv-title-blk"><div className="inv-title">Invoice</div><div className="inv-num-badge">{invoiceNum}</div></div>
          </div>
          <div className="parties">
            <div>
              <div className="p-lbl">De</div>
              <div className="p-name">{companyName||<span style={{color:"var(--border)"}}>Tu empresa</span>}</div>
              <div style={{color:"var(--muted)",fontSize:"0.82rem",lineHeight:1.6,whiteSpace:"pre-line"}}>{companyInfo}</div>
            </div>
            <div>
              <div className="p-lbl">Para</div>
              <div className="p-name"><input className="i-inp" style={{fontSize:"1.14rem",fontFamily:"'DM Serif Display',serif"}} placeholder="Nombre del cliente" value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
              <textarea className="i-inp" placeholder="Email / teléfono / dirección..." value={clientInfo} onChange={e=>setClientInfo(e.target.value)} style={{color:"var(--muted)",fontSize:"0.82rem",lineHeight:1.6,resize:"none",minHeight:"50px"}}/>
            </div>
          </div>
          <div className="meta-row">
            <div className="mi"><span className="ml">Fecha</span><span className="mv">{invoiceDate}</span></div>
            {dueDate&&<div className="mi"><span className="ml">Vence</span><span className="mv">{dueDate}</span></div>}
            <div className="mi" style={{marginLeft:"auto"}}><span className="ml">Fecha de vencimiento</span><input type="date" className="i-inp" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{fontSize:"0.82rem"}}/></div>
          </div>
          <div className="divider"/>
          <table className="items-tbl">
            <thead><tr><th style={{width:"50%"}}>Descripción</th><th className="r" style={{width:"13%"}}>Cant.</th><th className="r" style={{width:"17%"}}>Precio</th><th className="r" style={{width:"17%"}}>Total</th><th style={{width:"26px"}}></th></tr></thead>
            <tbody>
              {items.map(item=>(
                <tr key={item.id}>
                  <td><input className="i-inp" placeholder="Servicio o producto" value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)}/></td>
                  <td className="r"><input className="i-inp r" type="number" min="1" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} style={{width:"52px"}}/></td>
                  <td className="r"><input className="i-inp r" type="number" min="0" step="0.01" value={item.price} onChange={e=>updateItem(item.id,"price",e.target.value)} style={{width:"82px"}}/></td>
                  <td className="r" style={{fontWeight:500}}>{fmt(Number(item.qty)*Number(item.price))}</td>
                  <td>{items.length>1&&<button className="btn-del" onClick={()=>removeItem(item.id)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-add" onClick={addItem}><span style={{fontSize:"1rem"}}>+</span> Agregar línea</button>
          <div className="divider"/>
          <div className="totals">
            <div className="t-row"><span className="tl">Subtotal</span><span className="tv">{fmt(subtotal)}</span></div>
            {Number(taxRate)>0&&<div className="t-row"><span className="tl">Tax ({taxRate}%)</span><span className="tv">{fmt(tax)}</span></div>}
            <div className="t-final"><span className="tl">Total</span><span className="tv">{fmt(total)}</span></div>
          </div>
          {notes&&<div className="notes-sec"><div className="notes-lbl">Notas</div><div className="notes-txt">{notes}</div></div>}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("invoices");
  const [screen, setScreen] = useState("list");
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return ()=>unsub();
  },[]);

  const handleLogout = ()=>signOut(auth);

  const openNew = ()=>{ setEditingInvoice(null); setScreen("picker"); };
  const openExisting = inv=>{ setEditingInvoice(inv); setScreen("editor"); };
  const backToList = ()=>{ setScreen("list"); setEditingInvoice(null); setRefreshKey(k=>k+1); };

  const useTemplate = tpl => {
    setEditingInvoice({ companyName:tpl.companyName||"", companyInfo:tpl.companyInfo||"", logo:tpl.logo||null, taxRate:tpl.taxRate||0, notes:tpl.notes||"", items:[{id:1,description:"",qty:1,price:0}] });
    setScreen("editor");
  };

  if (authLoading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cream)",fontFamily:"'DM Sans',sans-serif",color:"var(--muted)"}}>
      <style>{G}</style>Cargando...
    </div>
  );

  if (!user) return (<><style>{G}</style><AuthScreen/></>);

  if (screen==="picker") return (
    <><style>{G}</style>
    <AppHeader user={user} activeTab={tab} onTab={t=>{setTab(t);setScreen("list");}} onLogout={handleLogout}/>
    <TemplatePicker user={user} onPick={useTemplate} onSkip={()=>{setEditingInvoice(null);setScreen("editor");}}/>
    </>
  );

  if (screen==="editor") return (
    <><style>{G}</style>
    <AppHeader user={user} activeTab={tab} onTab={t=>{setTab(t);backToList();}} onLogout={handleLogout}/>
    <InvoiceEditor user={user} invoice={editingInvoice} onBack={backToList} onSaved={backToList}/>
    </>
  );

  return (
    <><style>{G}</style>
    <AppHeader user={user} activeTab={tab} onTab={setTab} onLogout={handleLogout}/>
    {tab==="invoices"
      ? <InvoiceListScreen key={refreshKey} user={user} onNew={openNew} onOpen={openExisting}/>
      : <TemplatesScreen user={user} onUseTemplate={useTemplate}/>
    }
    </>
  );
}
