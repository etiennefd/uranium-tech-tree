// Field colors for the uranium tech tree.
// Each top-level grouping has a recognizable family hue so the tags
// "code" the kind of thing at a glance against the dark background.

export const FIELD_COLORS: Record<string, string> = {
  // Materials / elements
  Uranium: "#E6C84A",   // yellowcake yellow
  Radium: "#5A8FD6",    // Cherenkov blue

  // Greens — four shades, dim mineral → vivid radioactive
  "Green rocks": "#4A7438",
  "Green poison": "#6A8F2A",
  "Green glowing uranium": "#6FCF2D",
  Glow: "#5BCFA1",

  // Cultural artifacts — pink family
  "Visual arts": "#E94E8A",
  "Music & dance": "#FF8AB8",
  "Comics & literature": "#C2185B",
  "Film & TV": "#E0556B",
  Games: "#FFA1C9",

  // Concepts / contexts
  Science: "#7E94B0",            // lab steel
  Society: "#C08148",            // warm sienna
  "Toxic radiation": "#E94F37",  // warning red
  "Pollution concerns": "#8B7355",
  "Nuclear mutant": "#B23AEE",
  Ultraviolet: "#6A2BC4",        // intense violet

  Misc: "#919191",
} as const;

// Default color for unknown fields
export const DEFAULT_FIELD_COLOR = "#2D2D2D";

export type FieldName = keyof typeof FIELD_COLORS;

export function getFieldColor(field: string): string {
  return FIELD_COLORS[field] ?? DEFAULT_FIELD_COLOR;
}
