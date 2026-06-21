import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initialBlocks } from "./data";
import { firebaseConfig, firebaseEnabled } from "./firebaseConfig";

const InventoryContext = createContext(null);

const STORAGE_KEY = "bodega_blocks_v1";
const HISTORY_KEY = "bodega_history_v1";
const THRESHOLD_KEY = "bodega_threshold_v1";
const DEFAULT_THRESHOLD = 8;

// ---------- Firebase (inicializado una sola vez si está configurado) ----------
let firebaseApp = null;
let firebaseDb = null;

function getFirebaseDb() {
  if (!firebaseEnabled) return null;
  if (!firebaseApp) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
      firebaseDb = getDatabase(firebaseApp);
      const auth = getAuth(firebaseApp);
      // Inicia sesión anónima automáticamente. Esto es gratis, no caduca,
      // y permite que las reglas de Firebase exijan "estar autenticado"
      // sin que la persona vea ningún inicio de sesión ni lo note.
      signInAnonymously(auth).catch((err) => console.error("Error en autenticación anónima:", err));
    } catch (err) {
      console.error("Error iniciando Firebase:", err);
      return null;
    }
  }
  return firebaseDb;
}

function loadLocal(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return fallback;
}

function loadThreshold() {
  try {
    const raw = window.localStorage.getItem(THRESHOLD_KEY);
    if (raw) return Number(raw);
  } catch {
    // ignore
  }
  return DEFAULT_THRESHOLD;
}

function nowStamp() {
  return new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Firebase puede convertir arrays con "huecos" en objetos indexados, o
// devolver null/undefined para posiciones vacías. Esta función limpia
// cualquier dato (de Firebase o localStorage) a una forma segura y
// predecible: siempre un array de bloques, cada uno con un array de
// secciones (nunca null/undefined).
function normalizeBlocks(raw) {
  if (raw == null) return [];
  const asArray = Array.isArray(raw) ? raw : Object.values(raw);
  return asArray
    .filter((b) => b != null)
    .map((b) => {
      const seccionesRaw = b.secciones;
      let secciones = [];
      if (Array.isArray(seccionesRaw)) {
        secciones = seccionesRaw.filter((s) => s != null);
      } else if (seccionesRaw && typeof seccionesRaw === "object") {
        secciones = Object.values(seccionesRaw).filter((s) => s != null);
      }
      return { ...b, secciones };
    })
    .sort((a, b) => Number(a.id) - Number(b.id));
}

export function InventoryProvider({ children }) {
  const [blocks, setBlocksState] = useState(() => normalizeBlocks(loadLocal(STORAGE_KEY, initialBlocks)));
  const [history, setHistoryState] = useState(() => loadLocal(HISTORY_KEY, []));
  const [threshold, setThresholdState] = useState(loadThreshold);
  const [role, setRole] = useState("lectura");
  const [cloudReady, setCloudReady] = useState(false);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Conectar a Firebase si está configurado, y suscribirse a cambios en vivo
  useEffect(() => {
    if (!firebaseEnabled) return;
    let offBlocks = () => {};
    let offHistory = () => {};
    try {
      const db = getFirebaseDb();
      if (!db) return;

      const blocksNode = ref(db, "blocks");
      const historyNode = ref(db, "history");

      offBlocks = onValue(
        blocksNode,
        (snap) => {
          try {
            const val = snap.val();
            if (val == null) {
              set(blocksNode, initialBlocks).catch((err) => console.error("Error sembrando datos:", err));
              setBlocksState(normalizeBlocks(initialBlocks));
            } else {
              setBlocksState(normalizeBlocks(val));
            }
            setCloudReady(true);
          } catch (err) {
            console.error("Error procesando snapshot de blocks:", err);
          }
        },
        (err) => console.error("Error leyendo blocks:", err)
      );

      offHistory = onValue(
        historyNode,
        (snap) => {
          try {
            const val = snap.val();
            setHistoryState(val ? Object.values(val).filter((h) => h != null).sort((a, b) => (a.id < b.id ? 1 : -1)) : []);
          } catch (err) {
            console.error("Error procesando snapshot de history:", err);
          }
        },
        (err) => console.error("Error leyendo history:", err)
      );
    } catch (err) {
      console.error("Error conectando a Firebase, usando modo local:", err);
    }

    return () => {
      try {
        offBlocks();
        offHistory();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  const persist = useCallback((next) => {
    const clean = normalizeBlocks(next);
    setBlocksState(clean);
    const db = getFirebaseDb();
    if (db) {
      // Guardamos como objeto con clave = id de bloque (no array indexado),
      // así Firebase nunca puede generar "huecos" aunque falten bloques.
      const asObject = {};
      clean.forEach((b) => { asObject[`b${b.id}`] = b; });
      set(ref(db, "blocks"), asObject).catch((err) => console.error("Error guardando blocks:", err));
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch {
        // storage full or unavailable
      }
    }
  }, []);

  const logEvent = useCallback((blockId, harina, message) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      blockId,
      harina,
      message,
      ts: nowStamp(),
    };
    const db = getFirebaseDb();
    if (db) {
      const node = push(ref(db, "history"));
      set(node, entry).catch((err) => console.error("Error guardando historial:", err));
    } else {
      setHistoryState((prev) => {
        const next = [entry, ...prev].slice(0, 300);
        try {
          window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, []);

  const setThreshold = useCallback((n) => {
    const clean = Number.isFinite(Number(n)) && Number(n) >= 0 ? Number(n) : DEFAULT_THRESHOLD;
    setThresholdState(clean);
    try {
      window.localStorage.setItem(THRESHOLD_KEY, String(clean));
    } catch {
      // ignore — threshold stays local per-device by design, it's a view preference
    }
  }, []);

  const updateSection = useCallback(
    (blockId, sectionId, patch) => {
      const cleanPatch = { ...patch };
      if ("bigBags" in cleanPatch) {
        const n = Math.round(Number(cleanPatch.bigBags));
        cleanPatch.bigBags = Number.isFinite(n) && n >= 0 ? n : 0;
      }
      if ("tarimas" in cleanPatch) {
        const n = Math.round(Number(cleanPatch.tarimas));
        cleanPatch.tarimas = Number.isFinite(n) && n >= 0 ? n : 0;
      }
      if ("parcialKg" in cleanPatch) {
        const n = Number(cleanPatch.parcialKg);
        cleanPatch.parcialKg = Number.isFinite(n) && n >= 0 ? n : 0;
      }
      let harinaForLog = "";
      let changeMsg = "";
      const current = blocksRef.current;
      const next = current.map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          secciones: b.secciones.map((s) => {
            if (s.id !== sectionId) return s;
            harinaForLog = s.harina;
            const parts = [];
            if ("bigBags" in cleanPatch && Number(cleanPatch.bigBags) !== Number(s.bigBags)) {
              parts.push(`Big Bags ${s.bigBags} → ${cleanPatch.bigBags}`);
            }
            if ("tarimas" in cleanPatch && Number(cleanPatch.tarimas) !== Number(s.tarimas)) {
              parts.push(`Tarimas ${s.tarimas} → ${cleanPatch.tarimas}`);
            }
            if ("parcialKg" in cleanPatch && Number(cleanPatch.parcialKg) !== Number(s.parcialKg || 0)) {
              parts.push(`Parcial ${s.parcialKg || 0}kg → ${cleanPatch.parcialKg}kg`);
            }
            if ("lote" in cleanPatch && cleanPatch.lote !== s.lote) {
              parts.push(`Lote ${s.lote || "—"} → ${cleanPatch.lote || "—"}`);
            }
            changeMsg = parts.join(" · ");
            return { ...s, ...cleanPatch, actualizado: new Date().toISOString().slice(0, 10) };
          }),
        };
      });
      persist(next);
      if (changeMsg) logEvent(blockId, harinaForLog, changeMsg);
    },
    [persist, logEvent]
  );

  const adjustSection = useCallback(
    (blockId, sectionId, field, delta) => {
      const block = blocksRef.current.find((b) => b.id === blockId);
      const section = block?.secciones.find((s) => s.id === sectionId);
      if (!section) return;
      const current = Number(section[field] || 0);
      const next = Math.max(0, current + delta);
      updateSection(blockId, sectionId, { [field]: next });
    },
    [updateSection]
  );

  const addSection = useCallback(
    (blockId, section) => {
      const current = blocksRef.current;
      const newId = `${blockId}-${Date.now()}`;
      const next = current.map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          secciones: [
            ...b.secciones,
            { id: newId, ...section, actualizado: new Date().toISOString().slice(0, 10) },
          ],
        };
      });
      persist(next);
      logEvent(blockId, section.harina, `Sección agregada: ${section.bigBags} Big Bags, ${section.tarimas} tarimas, lote ${section.lote || "—"}`);
    },
    [persist, logEvent]
  );

  const removeSection = useCallback(
    (blockId, sectionId) => {
      const current = blocksRef.current;
      const block = current.find((b) => b.id === blockId);
      const section = block?.secciones.find((s) => s.id === sectionId);
      const next = current.map((b) => {
        if (b.id !== blockId) return b;
        return { ...b, secciones: b.secciones.filter((s) => s.id !== sectionId) };
      });
      persist(next);
      if (section) logEvent(blockId, section.harina, `Sección eliminada (tenía ${section.bigBags} Big Bags, lote ${section.lote || "—"})`);
    },
    [persist, logEvent]
  );

  // Registrar una salida/despacho: resta Big Bags y Tarimas de una sección,
  // validando que nunca se pueda sacar más de lo disponible.
  // Devuelve { ok: true } si se aplicó, o { ok: false, error: "..." } si no.
  const dispatchSection = useCallback(
    (blockId, sectionId, salidaBigBags, salidaTarimas) => {
      const MAX_BIGBAGS_POR_SALIDA = 20;
      const MAX_TARIMAS_POR_SALIDA = 15;
      const block = blocksRef.current.find((b) => b.id === blockId);
      const section = block?.secciones.find((s) => s.id === sectionId);
      if (!section) return { ok: false, error: "No se encontró esa sección." };

      const outBigBags = Number(salidaBigBags) || 0;
      const outTarimas = Number(salidaTarimas) || 0;
      const curBigBags = Number(section.bigBags || 0);
      const curTarimas = Number(section.tarimas || 0);

      if (outBigBags < 0 || outTarimas < 0) {
        return { ok: false, error: "Las cantidades no pueden ser negativas." };
      }
      if (outBigBags === 0 && outTarimas === 0) {
        return { ok: false, error: "Ingresa al menos una cantidad a despachar." };
      }
      if (outBigBags > MAX_BIGBAGS_POR_SALIDA) {
        return { ok: false, error: `Máximo ${MAX_BIGBAGS_POR_SALIDA} Big Bags por salida.` };
      }
      if (outTarimas > MAX_TARIMAS_POR_SALIDA) {
        return { ok: false, error: `Máximo ${MAX_TARIMAS_POR_SALIDA} tarimas por salida.` };
      }
      if (outBigBags > curBigBags) {
        return { ok: false, error: `Solo hay ${curBigBags} Big Bags disponibles, no puedes sacar ${outBigBags}.` };
      }
      if (outTarimas > curTarimas) {
        return { ok: false, error: `Solo hay ${curTarimas} tarimas disponibles, no puedes sacar ${outTarimas}.` };
      }

      const nextBigBags = curBigBags - outBigBags;
      const nextTarimas = curTarimas - outTarimas;
      updateSection(blockId, sectionId, { bigBags: nextBigBags, tarimas: nextTarimas });
      logEvent(
        blockId,
        section.harina,
        `🚚 Despacho: salieron ${outBigBags} Big Bags y ${outTarimas} tarimas (quedan ${nextBigBags} Big Bags, ${nextTarimas} tarimas)`
      );
      return { ok: true };
    },
    [updateSection, logEvent]
  );

  const resetData = useCallback(() => {
    persist(initialBlocks);
  }, [persist]);

  const value = {
    blocks,
    role,
    setRole,
    updateSection,
    adjustSection,
    dispatchSection,
    addSection,
    removeSection,
    resetData,
    history,
    threshold,
    setThreshold,
    cloudMode: firebaseEnabled,
    cloudReady,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory debe usarse dentro de InventoryProvider");
  return ctx;
}
