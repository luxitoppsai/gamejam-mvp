export type ItemKind = "hose" | "extinguisher" | "backpack" | "shovel" | "seeds" | "radio" | "drone";
export type Role = "sofocador" | "soporte" | "cortafuegos" | "botanico" | "vigia";

export interface ItemDef {
  kind: ItemKind;
  role: Role;
  label: string;
  /** Frame en el spritesheet de Kenney Tiny Town (referencia, 12 columnas). */
  icon: number;
  /** Textura propia en lugar del spritesheet de Kenney (p. ej. el dron, que no existe en el pack). */
  iconKey?: string;
  /** Capacidad de agua (0 si no usa agua). */
  capacity: number;
  /** Agua/s que gasta al usarse. */
  drain: number;
  /** Potencia de extinción (calor/s) sobre cada celda. */
  power: number;
  /** Alcance en tiles. */
  range: number;
}

const none = { capacity: 0, drain: 0, power: 0, range: 0 };

/** Tabla de ítems -> rol. El rol lo da el ítem en mano, no la persona (Q1). */
export const ITEMS: Record<ItemKind, ItemDef> = {
  hose: { kind: "hose", role: "sofocador", label: "Manguera", icon: 106, iconKey: "item-hose", capacity: 100, drain: 15, power: 90, range: 4 },
  extinguisher: { kind: "extinguisher", role: "sofocador", label: "Extintor", icon: 128, iconKey: "item-extinguisher", capacity: 60, drain: 25, power: 150, range: 2 },
  backpack: { kind: "backpack", role: "soporte", label: "Mochila de agua", icon: 107, iconKey: "item-backpack", ...none, capacity: 300 },
  shovel: { kind: "shovel", role: "cortafuegos", label: "Pala", icon: 116, iconKey: "item-shovel", ...none },
  seeds: { kind: "seeds", role: "botanico", label: "Kit de semillas", icon: 93, iconKey: "item-seeds", ...none },
  radio: { kind: "radio", role: "vigia", label: "Radio", icon: 95, iconKey: "item-radio", ...none },
  /** Dron: la "capacidad" es la batería en segundos de vuelo; se recarga en tierra. */
  drone: { kind: "drone", role: "vigia", label: "Dron", icon: 95, iconKey: "drone", ...none, capacity: 25, drain: 1 },
};

export const ROLES: Record<Role, { label: string; color: number }> = {
  sofocador: { label: "Sofocador", color: 0x3aa0ff },
  soporte: { label: "Soporte de agua", color: 0x2fe0d0 },
  cortafuegos: { label: "Cortafuegos", color: 0xd08a3a },
  botanico: { label: "Botánico", color: 0x5fd35f },
  vigia: { label: "Vigía", color: 0xffd23f },
};

export const roleOf = (kind: ItemKind | null | undefined): Role | null => (kind ? ITEMS[kind].role : null);

/** Ítems que llevan tanque de agua y pueden recibir recarga del Soporte. */
export const usesWater = (kind: ItemKind): boolean => ITEMS[kind].role === "sofocador";