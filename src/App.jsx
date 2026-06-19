import { HashRouter, Routes, Route } from "react-router-dom";
import { Component } from "react";
import { InventoryProvider, useInventory } from "./InventoryContext";
import Dashboard from "./pages/Dashboard";
import BlockDetail from "./pages/BlockDetail";
import QRView from "./pages/QRView";
import mascota from "./assets/mascota.png";
import "./index.css";

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
  return (
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
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="editor">Editor</option>
            <option value="lectura">Solo lectura</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  return (
    <HashRouter>
      <TopBar />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bloque/:id" element={<BlockDetail />} />
          <Route path="/qr" element={<QRView />} />
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
