import { HashRouter, Routes, Route } from "react-router-dom";
import { Component, useState } from "react";
import { InventoryProvider, useInventory } from "./InventoryContext";
import Dashboard from "./pages/Dashboard";
import BlockDetail from "./pages/BlockDetail";
import QRView from "./pages/QRView";
import DispatchHome from "./pages/DispatchHome";
import Dispatch from "./pages/Dispatch";
import mascota from "./assets/mascota.png";
import { ROLE_PASSWORDS } from "./rolePasswords";
import "./index.css";

const UNLOCKED_KEY = "bodega_unlocked_roles";

function getUnlockedRoles() {
  try {
    const raw = window.sessionStorage.getItem(UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markRoleUnlocked(role) {
  try {
    const unlocked = getUnlockedRoles();
    if (!unlocked.includes(role)) {
      unlocked.push(role);
      window.sessionStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
    }
  } catch {
    // ignore
  }
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif", color: "#1a1a1a" }}>
          <h2 style={{ color: "#d14d4d" }}>Ocurrió un error al cargar la app</h2>
          <p>Detalle técnico (mándale esto a soporte):</p>
          <pre style={{ background: "#f6f8f9", padding: 16, borderRadius: 8, overflow: "auto", fontSize: 12 }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function TopBar() {
  const { role, setRole, cloudMode, cloudReady } = useInventory();
  const [pendingRole, setPendingRole] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  const handleRoleChange = (newRole) => {
    if (newRole === "lectura" || getUnlockedRoles().includes(newRole)) {
      setRole(newRole);
      return;
    }
    setPendingRole(newRole);
    setPasswordInput("");
    setError("");
  };

  const confirmPassword = () => {
    if (passwordInput === ROLE_PASSWORDS[pendingRole]) {
      markRoleUnlocked(pendingRole);
      setRole(pendingRole);
      setPendingRole(null);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  return (
    <>
      <div className="top-bar">
        <div className="brand">
          <img src={mascota} alt="Aniprotein" className="brand-mascot" />
          <div className="brand-name-block">
            <span className="brand-name">Aniprotein</span>
            <span className="brand-sub">Control de Bloques</span>
          </div>
        </div>
        <div className="top-bar-right">
          <span className={`cloud-badge ${cloudMode ? (cloudReady ? "on" : "connecting") : "off"}`}>
            {cloudMode ? (cloudReady ? "☁ En línea" : "☁ Conectando…") : "💾 Local"}
          </span>
          <span className="top-bar-meta">
            {new Date().toLocaleDateString("es-MX", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          </span>
          <div className="role-switch">
            <span>Rol:</span>
            <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="despachador">Despachador</option>
              <option value="lectura">Solo lectura</option>
            </select>
          </div>
        </div>
      </div>

      {pendingRole && (
        <div className="password-overlay">
          <div className="password-modal">
            <h3>🔒 {pendingRole === "editor" ? "Acceso de Editor" : "Acceso de Despachador"}</h3>
            <p>Ingresa la contraseña para entrar a este modo.</p>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && confirmPassword()}
              placeholder="Contraseña"
            />
            {error && <span className="password-error">{error}</span>}
            <div className="password-actions">
              <button className="btn primary" onClick={confirmPassword}>Entrar</button>
              <button className="btn" onClick={() => setPendingRole(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppInner() {
  const { role } = useInventory();
  return (
    <HashRouter>
      <TopBar />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={role === "despachador" ? <DispatchHome /> : <Dashboard />} />
          <Route path="/bloque/:id" element={<BlockDetail />} />
          <Route path="/qr" element={<QRView />} />
          <Route path="/despachos" element={<DispatchHome />} />
          <Route path="/despacho/:id" element={<Dispatch />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <InventoryProvider>
        <AppInner />
      </InventoryProvider>
    </ErrorBoundary>
  );
}
