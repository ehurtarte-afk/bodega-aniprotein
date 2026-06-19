// Datos de ejemplo. En producción esto vendría de una base de datos real.

export const tiposDeHarina = [
  {
    nombre: "Harina de Pluma",
    color: "#6b7077",
    colorClaro: "#eceeef",
    saco: "pluma.png",
    kgPorBigBag: 1000,
  },
  {
    nombre: "Harina de Cerdo",
    color: "#d6357f",
    colorClaro: "#fbe6f0",
    saco: "cerdo.png",
    kgPorBigBag: 1000,
  },
  {
    nombre: "Harina de Pollo 65% Premium",
    color: "#5fa746",
    colorClaro: "#e9f5e5",
    saco: "pollo.png",
    kgPorBigBag: 1000,
  },
];

export function getTipoHarina(nombre) {
  return tiposDeHarina.find((t) => t.nombre === nombre) || tiposDeHarina[0];
}

export const initialBlocks = [
  {
    id: 1,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=1",
    secciones: [
      {
        id: "1-a",
        harina: "Harina de Pluma",
        bigBags: 18,
        tarimas: 9,
        lote: "PLM-0612-A",
        actualizado: "2026-06-16",
      },
    ],
  },
  {
    id: 2,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=2",
    secciones: [
      {
        id: "2-a",
        harina: "Harina de Pollo 65% Premium",
        bigBags: 24,
        tarimas: 12,
        lote: "POL-0610-C",
        actualizado: "2026-06-17",
      },
    ],
  },
  {
    id: 3,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=3",
    secciones: [
      {
        id: "3-a",
        harina: "Harina de Pluma",
        bigBags: 7,
        tarimas: 4,
        lote: "PLM-0601-B",
        actualizado: "2026-06-15",
      },
      {
        id: "3-b",
        harina: "Harina de Pollo 65% Premium",
        bigBags: 11,
        tarimas: 5,
        lote: "POL-0605-A",
        actualizado: "2026-06-15",
      },
    ],
  },
  {
    id: 4,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=4",
    secciones: [
      {
        id: "4-a",
        harina: "Harina de Cerdo",
        bigBags: 30,
        tarimas: 15,
        lote: "CER-0608-A",
        actualizado: "2026-06-14",
      },
    ],
  },
  {
    id: 5,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=5",
    secciones: [],
  },
  {
    id: 6,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=6",
    secciones: [
      {
        id: "6-a",
        harina: "Harina de Pluma",
        bigBags: 14,
        tarimas: 7,
        lote: "PLM-0613-A",
        actualizado: "2026-06-17",
      },
    ],
  },
  {
    id: 7,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=7",
    secciones: [
      {
        id: "7-a",
        harina: "Harina de Cerdo",
        bigBags: 20,
        tarimas: 10,
        lote: "CER-0607-B",
        actualizado: "2026-06-13",
      },
    ],
  },
  {
    id: 8,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=8",
    secciones: [
      {
        id: "8-a",
        harina: "Harina de Pollo 65% Premium",
        bigBags: 9,
        tarimas: 4,
        lote: "POL-0611-D",
        actualizado: "2026-06-16",
      },
      {
        id: "8-b",
        harina: "Harina de Pluma",
        bigBags: 6,
        tarimas: 3,
        lote: "PLM-0614-A",
        actualizado: "2026-06-16",
      },
    ],
  },
  {
    id: 9,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=9",
    secciones: [
      {
        id: "9-a",
        harina: "Harina de Cerdo",
        bigBags: 16,
        tarimas: 8,
        lote: "CER-0609-B",
        actualizado: "2026-06-12",
      },
    ],
  },
  {
    id: 10,
    odooUrl: "https://odoo.aniprotein.com/odoo/inventory/products?block=10",
    secciones: [],
  },
];
