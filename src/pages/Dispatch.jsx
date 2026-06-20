import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useInventory } from "../InventoryContext";
import { getTipoHarina } from "../data";

const sacoImages = import.meta.glob("../assets/sacos/*.png", { eager: true, import: "default" });
function getSacoSrc(filename) {
  const match = Object.entries(sacoImages).find(([path]) => path.endsWith(filename));
  return match ? match[1] : null;
}

const MAX_BIGBAGS_POR_SALIDA = 20;
const MAX_TARIMAS_POR_SALIDA = 15;

function DispatchForm({ blockId, section, onDispatch }) {
  const tipo = getTipoHarina(section.harina);
  const sacoSrc = getSacoSrc(tipo.saco);
  const [bigBags, setBigBags] = useState("");
  const [tarimas, setTarimas] = useState("");
  const [feedback, setFeedback] = useState(null); // { type: 'error'|'success', text }
  const [confirming, setConfirming] = useState(false);

  const curBigBags = Number(section.bigBags || 0);
  const curTarimas = Number(section.tarimas || 0);
  const outBigBags = Number(bigBags) || 0;
  const outTarimas = Number(tarimas) || 0;

  const tope = (val, max) => (val === "" ? "" : String(Math.min(Number(val) || 0, max)));

  const excedeLimiteBigBags = outBigBags > MAX_BIGBAGS_POR_SALIDA;
  const excedeLimiteTarimas = outTarimas > MAX_TARIMAS_POR_SALIDA;
  const excedeStockBigBags = outBigBags > curBigBags;
  const excedeStockTarimas = outTarimas > curTarimas;
  const excedeBigBags = excedeLimiteBigBags || excedeStockBigBags;
  const excedeTarimas = excedeLimiteTarimas || excedeStockTarimas;

  const handleSubmit = () => {
    setFeedback(null);
    const result = onDispatch(blockId, section.id, outBigBags, outTarimas);
    if (!result.ok) {
      setFeedback({ type: "error", text: result.error });
      setConfirming(false);
      return;
    }
    setFeedback({ type: "success", text: `Salida registrada: ${outBigBags} Big Bags y ${outTarimas} tarimas.` });
    setBigBags("");
    setTarimas("");
    setConfirming(false);
  };

  return (
    <div className="dispatch-card">
      <div className="dispatch-sack" style={{ background: tipo.colorClaro }}>
        {sacoSrc && <img src={sacoSrc} alt={section.harina} />}
      </div>
      <div className="dispatch-content">
        <div className="dispatch-head">
          <h3>{section.harina}</h3>
          <span className="lote-tag" style={{ background: tipo.colorClaro, color: tipo.color }}>
            LOTE {section.lote || "—"}
          </span>
        </div>

        <div className="dispatch-available">
          Disponible ahora: <strong>{curBigBags}</strong> Big Bags · <strong>{curTarimas}</strong> tarimas
        </div>

        <div className="dispatch-inputs">
          <div className="dispatch-input-group">
            <label>Big Bags que salen (máx. {MAX_BIGBAGS_POR_SALIDA})</label>
            <input
              type="number"
              min="0"
              value={bigBags}
              onChange={(e) => { setBigBags(e.target.value); setFeedback(null); }}
              className={excedeBigBags ? "input-error" : ""}
              placeholder="0"
            />
          </div>
          <div className="dispatch-input-group">
            <label>Tarimas que salen (máx. {MAX_TARIMAS_POR_SALIDA})</label>
            <input
              type="number"
              min="0"
              value={tarimas}
              onChange={(e) => { setTarimas(e.target.value); setFeedback(null); }}
              className={excedeTarimas ? "input-error" : ""}
              placeholder="0"
            />
          </div>
        </div>

        {(excedeBigBags || excedeTarimas) && (
          <div className="dispatch-feedback error">
            ⚠️
            {excedeLimiteBigBags && ` Máximo ${MAX_BIGBAGS_POR_SALIDA} Big Bags por salida.`}
            {excedeLimiteTarimas && ` Máximo ${MAX_TARIMAS_POR_SALIDA} tarimas por salida.`}
            {!excedeLimiteBigBags && excedeStockBigBags && ` Solo hay ${curBigBags} Big Bags disponibles en este bloque.`}
            {!excedeLimiteTarimas && excedeStockTarimas && ` Solo hay ${curTarimas} tarimas disponibles en este bloque.`}
          </div>
        )}

        {feedback && (
          <div className={`dispatch-feedback ${feedback.type}`}>
            {feedback.type === "success" ? "✅ " : "⚠️ "}{feedback.text}
          </div>
        )}

        {!confirming ? (
          <button
            className="btn primary dispatch-submit"
            disabled={excedeBigBags || excedeTarimas || (!outBigBags && !outTarimas)}
            onClick={() => setConfirming(true)}
          >
            🚚 Dar salida
          </button>
        ) : (
          <div className="dispatch-confirm">
            <span>¿Confirmas sacar {outBigBags} Big Bags y {outTarimas} tarimas?</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={handleSubmit}>Sí, confirmar</button>
              <button className="btn" onClick={() => setConfirming(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dispatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { blocks, dispatchSection } = useInventory();
  const block = blocks.find((b) => String(b.id) === id);

  if (!block) {
    return (
      <div>
        <Link to="/" className="back-link">← Volver</Link>
        <p>No encontramos ese bloque.</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="back-link">← Volver</Link>
      <div className="page-heading">
        <div>
          <h1>Salida de despacho — Bloque #{block.id}</h1>
          <p>Selecciona la harina y registra cuánto sale. El sistema no te va a dejar sacar más de lo que hay.</p>
        </div>
      </div>

      {block.secciones.length === 0 ? (
        <p style={{ color: "#9aa1a8" }}>Este bloque está vacío, no hay nada que despachar.</p>
      ) : (
        block.secciones.map((s) => (
          <DispatchForm key={s.id} blockId={block.id} section={s} onDispatch={dispatchSection} />
        ))
      )}
    </div>
  );
}
