import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useInventory } from "../InventoryContext";

export default function QRView() {
  const { blocks } = useInventory();
  const base = `${window.location.origin}${window.location.pathname}`;

  return (
    <div>
      <Link to="/" className="back-link">← Volver al inventario</Link>
      <div className="page-heading">
        <div>
          <h1>Todos los QR</h1>
          <p>Imprímelos y pégalos en cada bloque pintado.</p>
        </div>
        <button className="btn primary" onClick={() => window.print()}>
          🖨 Imprimir QR
        </button>
      </div>
      <div className="qr-grid">
        {blocks.map((b) => (
          <div className="qr-mini-card" key={b.id}>
            <div className="qr-box">
              <QRCodeSVG
                value={`${base}#/bloque/${b.id}`}
                size={120}
                fgColor="#15171a"
              />
            </div>
            <div className="qr-label">Bloque #{b.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
