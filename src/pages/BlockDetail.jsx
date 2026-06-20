import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useInventory } from "../InventoryContext";
import { tiposDeHarina, getTipoHarina } from "../data";

const sacoImages = import.meta.glob("../assets/sacos/*.png", { eager: true, import: "default" });

function getSacoSrc(filename) {
  const match = Object.entries(sacoImages).find(([path]) => path.endsWith(filename));
  return match ? match[1] : null;
}

function QtyAdjuster({ value, onAdjust, disabled, step = 1 }) {
  return (
    <div className="qty-adjust-row">
      <button className="qty-adjust-btn" disabled={disabled || value <= 0} onClick={() => onAdjust(-step)}>−</button>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, minWidth: 22, textAlign: "center" }}>
        {value}
      </span>
      <button className="qty-adjust-btn" disabled={disabled} onClick={() => onAdjust(step)}>+</button>
    </div>
  );
}

function SectionCard({ blockId, section, canEdit, threshold, onUpdate, onAdjust, onRemove }) {
  const tipo = getTipoHarina(section.harina);
  const sacoSrc = getSacoSrc(tipo.saco);
  const parcialKg = Number(section.parcialKg || 0);
  const kg = Number(section.bigBags || 0) * tipo.kgPorBigBag + parcialKg;
  const isLow = Number(section.bigBags || 0) <= threshold && Number(section.bigBags || 0) > 0;

  return (
    <div className="section-card">
      <div className="sack-panel" style={{ background: tipo.colorClaro }}>
        {sacoSrc ? (
          <img src={sacoSrc} alt={section.harina} />
        ) : (
          <span style={{ color: tipo.color, fontFamily: "var(--font-mono)", fontSize: 12 }}>Sin imagen</span>
        )}
      </div>
      <div className="section-content">
        <div className="section-card-head">
          <h3>{section.harina}</h3>
          <span className="lote-tag" style={{ background: tipo.colorClaro, color: tipo.color }}>
            LOTE {section.lote || "—"}
          </span>
        </div>

        {isLow && <div className="low-stock-tag">⚠️ Stock bajo — quedan {section.bigBags} Big Bags</div>}

        <div className="metric-row metric-row-5">
          <div className="metric-box editable">
            <span className="metric-label">Big Bags</span>
            {canEdit ? (
              <QtyAdjuster
                value={section.bigBags}
                disabled={!canEdit}
                onAdjust={(delta) => onAdjust(blockId, section.id, "bigBags", delta)}
              />
            ) : (
              <span className="metric-value">{section.bigBags}</span>
            )}
          </div>
          <div className="metric-box editable">
            <span className="metric-label">Tarimas</span>
            {canEdit ? (
              <QtyAdjuster
                value={section.tarimas}
                disabled={!canEdit}
                onAdjust={(delta) => onAdjust(blockId, section.id, "tarimas", delta)}
              />
            ) : (
              <span className="metric-value">{section.tarimas}</span>
            )}
          </div>
          <div className="metric-box editable">
            <span className="metric-label">Parcial (kg)</span>
            {canEdit ? (
              <input
                type="number"
                min="0"
                step="0.1"
                value={section.parcialKg ?? 0}
                onChange={(e) => onUpdate(blockId, section.id, { parcialKg: e.target.value })}
              />
            ) : (
              <span className="metric-value" style={{ fontSize: 16 }}>{parcialKg} kg</span>
            )}
          </div>
          <div className="metric-box metric-box-tons">
            <span className="metric-label">Toneladas</span>
            <span className="metric-value-tons">{(kg / 1000).toLocaleString("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}<span className="tons-unit"> t</span></span>
          </div>
          <div className="metric-box editable">
            <span className="metric-label">Lote</span>
            {canEdit ? (
              <input type="text" value={section.lote} onChange={(e) => onUpdate(blockId, section.id, { lote: e.target.value })} />
            ) : (
              <span className="metric-value" style={{ fontSize: 16 }}>{section.lote}</span>
            )}
          </div>
        </div>
        <div className="section-footer">
          <span>Actualizado {section.actualizado}</span>
          {canEdit && (
            <button className="remove-btn" onClick={() => onRemove(blockId, section.id)}>
              Quitar sección
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddSectionForm({ blockId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [harina, setHarina] = useState(tiposDeHarina[0].nombre);
  const [bigBags, setBigBags] = useState("");
  const [tarimas, setTarimas] = useState("");
  const [lote, setLote] = useState("");

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Agregar tipo de harina a este bloque
      </button>
    );
  }

  return (
    <div className="add-section-form">
      <h4>Nueva sección en este bloque</h4>
      <div className="form-grid">
        <div>
          <label>Tipo de harina</label>
          <select value={harina} onChange={(e) => setHarina(e.target.value)}>
            {tiposDeHarina.map((t) => (
              <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Big Bags</label>
          <input type="number" min="0" value={bigBags} onChange={(e) => setBigBags(e.target.value)} />
        </div>
        <div>
          <label>Tarimas</label>
          <input type="number" min="0" value={tarimas} onChange={(e) => setTarimas(e.target.value)} />
        </div>
        <div>
          <label>Lote</label>
          <input type="text" value={lote} onChange={(e) => setLote(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn primary"
          onClick={() => {
            onAdd(blockId, { harina, bigBags: Number(bigBags) || 0, tarimas: Number(tarimas) || 0, lote });
            setBigBags(""); setTarimas(""); setLote(""); setOpen(false);
          }}
        >
          Guardar sección
        </button>
        <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </div>
  );
}

function HistoryPanel({ blockId, history }) {
  const items = history.filter((h) => h.blockId === blockId).slice(0, 20);
  return (
    <div className="history-panel">
      <h4>🕓 Historial de este bloque</h4>
      {items.length === 0 ? (
        <p className="history-empty">Todavía no hay movimientos registrados para este bloque.</p>
      ) : (
        <div className="history-list">
          {items.map((h) => (
            <div className="history-item" key={h.id}>
              <span className="history-dot" />
              <div>
                <div className="history-text"><strong>{h.harina}:</strong> {h.message}</div>
                <div className="history-time">{h.ts}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlockDetail() {
  const { id } = useParams();
  const { blocks, role, threshold, history, updateSection, adjustSection, addSection, removeSection } = useInventory();
  const block = blocks.find((b) => String(b.id) === id);
  const canEdit = role === "editor";

  if (!block) {
    return (
      <div>
        <Link to="/" className="back-link">← Volver al inventario</Link>
        <p>No encontramos ese bloque.</p>
      </div>
    );
  }

  const qrUrl = `${window.location.origin}${window.location.pathname}#/bloque/${block.id}`;

  return (
    <div>
      <Link to="/" className="back-link">← Volver al inventario</Link>

      <div className="detail-header">
        <div className="detail-title-group">
          <div className="detail-plate-number"><span className="hash">#</span>{block.id}</div>
          <div className="detail-meta">{block.secciones.length} sección(es) activa(s)</div>
        </div>
      </div>

      {!canEdit && (
        <div className="readonly-note">🔒 Modo solo lectura — no puedes editar cantidades</div>
      )}

      {block.secciones.length === 0 && (
        <p style={{ color: "#9aa1a8", marginBottom: 18 }}>Este bloque está vacío por ahora.</p>
      )}

      {block.secciones.map((s) => (
        <SectionCard
          key={s.id}
          blockId={block.id}
          section={s}
          canEdit={canEdit}
          threshold={threshold}
          onUpdate={updateSection}
          onAdjust={adjustSection}
          onRemove={removeSection}
        />
      ))}

      {canEdit && <AddSectionForm blockId={block.id} onAdd={addSection} />}

      <div className="qr-panel" style={{ marginTop: 28 }}>
        <div className="qr-box"><QRCodeSVG value={qrUrl} size={92} fgColor="#1a1a1a" /></div>
        <div className="qr-panel-text">
          <strong>QR de este bloque</strong>
          Imprime y pega en el bloque #{block.id}. Siempre apunta a esta misma página, aunque cambie el contenido.
        </div>
      </div>

      <HistoryPanel blockId={block.id} history={history} />
    </div>
  );
}
