import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "../InventoryContext";
import { getTipoHarina, tiposDeHarina } from "../data";
import { exportToExcel, exportToPDF } from "../exportUtils";

function summarize(block) {
  const totalBigBags = block.secciones.reduce((sum, s) => sum + Number(s.bigBags || 0), 0);
  const totalTarimas = block.secciones.reduce((sum, s) => sum + Number(s.tarimas || 0), 0);
  const totalKg = block.secciones.reduce((sum, s) => {
    const tipo = getTipoHarina(s.harina);
    return sum + Number(s.bigBags || 0) * tipo.kgPorBigBag;
  }, 0);
  const harinas = [...new Set(block.secciones.map((s) => s.harina))];
  return { totalBigBags, totalTarimas, totalKg, harinas };
}

function matchesQuery(block, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (`bloque ${block.id}`.includes(q) || String(block.id) === q) return true;
  return block.secciones.some(
    (s) => s.harina.toLowerCase().includes(q) || (s.lote || "").toLowerCase().includes(q)
  );
}

export default function Dashboard() {
  const { blocks, threshold, setThreshold } = useInventory();
  const [query, setQuery] = useState("");
  const [showThresholdEdit, setShowThresholdEdit] = useState(false);

  const grandTarimas = blocks.reduce((sum, b) => sum + summarize(b).totalTarimas, 0);

  const toneladasPorHarina = useMemo(() => {
    const totals = {};
    tiposDeHarina.forEach((t) => { totals[t.nombre] = 0; });
    blocks.forEach((b) => {
      b.secciones.forEach((s) => {
        const tipo = getTipoHarina(s.harina);
        totals[s.harina] = (totals[s.harina] || 0) + (Number(s.bigBags || 0) * tipo.kgPorBigBag) / 1000;
      });
    });
    return totals;
  }, [blocks]);

  const filteredBlocks = useMemo(
    () => blocks.filter((b) => matchesQuery(b, query)),
    [blocks, query]
  );

  const lowStockCount = blocks.filter((b) =>
    b.secciones.some((s) => Number(s.bigBags || 0) <= threshold && Number(s.bigBags || 0) > 0)
  ).length;

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Inventario de bodega</h1>
          <p>Vista general de los {blocks.length} bloques. Toca un bloque para ver el detalle, o usa esto para hacer inventario sin bajar a escanear.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => exportToExcel(blocks)}>📊 Excel</button>
          <button className="btn" onClick={() => exportToPDF(blocks)}>📄 PDF</button>
          <Link to="/qr" className="btn">🏷️ QR</Link>
        </div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por harina, lote o número de bloque..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")}>✕</button>
          )}
        </div>
        <div className="threshold-control">
          {showThresholdEdit ? (
            <>
              <span className="threshold-label">Alerta si Big Bags ≤</span>
              <input
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="threshold-input"
              />
              <button className="btn primary" style={{ padding: "6px 12px" }} onClick={() => setShowThresholdEdit(false)}>OK</button>
            </>
          ) : (
            <button className="btn" onClick={() => setShowThresholdEdit(true)}>
              ⚠️ Umbral de alerta: {threshold} bags
            </button>
          )}
        </div>
      </div>

      <div className="stat-row stat-row-harinas">
        {tiposDeHarina.map((t) => (
          <div className="stat-cell" key={t.nombre} style={{ borderTopColor: t.color }}>
            <div className="stat-label" style={{ color: t.color }}>
              Toneladas {t.nombre.replace("Harina de ", "")}
            </div>
            <div className="stat-value">{(toneladasPorHarina[t.nombre] || 0).toFixed(1)} t</div>
          </div>
        ))}
        <div className="stat-cell">
          <div className="stat-label">Tarimas totales</div>
          <div className="stat-value">{grandTarimas}</div>
        </div>
        <div className="stat-cell" style={{ borderTopColor: lowStockCount > 0 ? "var(--red)" : "var(--gray-line)" }}>
          <div className="stat-label">Bloques con stock bajo</div>
          <div className="stat-value" style={{ color: lowStockCount > 0 ? "var(--red)" : "var(--ink)" }}>
            {lowStockCount}
          </div>
        </div>
      </div>

      {filteredBlocks.length === 0 && (
        <p style={{ color: "#9aa1a8" }}>No se encontró ningún bloque con "{query}".</p>
      )}

      <div className="block-grid">
        {filteredBlocks.map((block) => {
          const { totalBigBags, totalTarimas, totalKg, harinas } = summarize(block);
          const tieneStock = block.secciones.length > 0;
          const tieneStockBajo = block.secciones.some(
            (s) => Number(s.bigBags || 0) <= threshold && Number(s.bigBags || 0) > 0
          );
          const dominante = harinas.length > 0 ? getTipoHarina(harinas[0]) : null;

          return (
            <Link
              to={`/bloque/${block.id}`}
              key={block.id}
              className={`plate-card ${tieneStockBajo ? "low-stock" : ""}`}
              style={dominante ? { borderTopColor: dominante.color } : {}}
            >
              <div className="plate-top">
                <div className="plate-number">
                  <span className="hash">#</span>
                  {block.id}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {tieneStockBajo && <span className="low-stock-badge">Stock bajo</span>}
                  <div className={`plate-status-dot ${tieneStock ? "ok" : "empty"}`} />
                </div>
              </div>
              <div className="plate-body">
                {tieneStock ? (
                  <>
                    {harinas.map((h) => {
                      const tipo = getTipoHarina(h);
                      return (
                        <span
                          className="harina-chip"
                          key={h}
                          style={{ background: tipo.colorClaro, color: tipo.color }}
                        >
                          <span className="harina-dot" style={{ background: tipo.color }} />
                          {h}
                        </span>
                      );
                    })}
                    <div className="plate-summary-line">
                      <span><strong>{totalBigBags}</strong> bags</span>
                      <span><strong>{totalTarimas}</strong> tarimas</span>
                      <span><strong>{(totalKg / 1000).toFixed(1)}</strong> t</span>
                    </div>
                  </>
                ) : (
                  <span className="empty-note">Bloque vacío</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
