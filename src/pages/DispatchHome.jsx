import { Link } from "react-router-dom";
import { useInventory } from "../InventoryContext";
import { getTipoHarina } from "../data";

export default function DispatchHome() {
  const { blocks } = useInventory();
  const bloquesConStock = blocks.filter((b) => b.secciones.length > 0);

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>🚚 Despachos</h1>
          <p>Elige el bloque del que vas a sacar Big Bags o tarimas.</p>
        </div>
      </div>

      {bloquesConStock.length === 0 && (
        <p style={{ color: "#9aa1a8" }}>No hay bloques con stock disponible por ahora.</p>
      )}

      <div className="block-grid">
        {bloquesConStock.map((block) => {
          const harinas = [...new Set(block.secciones.map((s) => s.harina))];
          const totalBigBags = block.secciones.reduce((s, sec) => s + Number(sec.bigBags || 0), 0);
          const totalTarimas = block.secciones.reduce((s, sec) => s + Number(sec.tarimas || 0), 0);
          const dominante = harinas.length > 0 ? getTipoHarina(harinas[0]) : null;
          return (
            <Link
              to={`/despacho/${block.id}`}
              key={block.id}
              className="plate-card"
              style={dominante ? { borderTopColor: dominante.color } : {}}
            >
              <div className="plate-top">
                <div className="plate-number"><span className="hash">#</span>{block.id}</div>
              </div>
              <div className="plate-body">
                {harinas.map((h) => {
                  const tipo = getTipoHarina(h);
                  return (
                    <span className="harina-chip" key={h} style={{ background: tipo.colorClaro, color: tipo.color }}>
                      <span className="harina-dot" style={{ background: tipo.color }} />
                      {h}
                    </span>
                  );
                })}
                <div className="plate-summary-line">
                  <span><strong>{totalBigBags}</strong> bags</span>
                  <span><strong>{totalTarimas}</strong> tarimas</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
