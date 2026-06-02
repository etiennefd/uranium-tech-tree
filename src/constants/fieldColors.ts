// Field colors for the uranium tech tree.
// Each top-level grouping has a recognizable family hue so the tags
// "code" the kind of thing at a glance against the dark background.

export const FIELD_COLORS: Record<string, string> = {
  // Materials / elements
  Uranium: "#D9A92E",   // deep yellowcake
  Radium: "#3D7BE0",    // saturated Cherenkov blue

  // Greens — four shades, dim mineral → vivid radioactive
  "Green rocks": "#3F7A1F",
  "Green poison": "#6FA32E",
  "Green glow uranium": "#4FCF1A",
  Glow: "#1FBA8A",

  // Cultural artifacts — saturated pink family
  "Visual arts": "#E0357A",
  "Comics & literature": "#BF0E50",
  "Music & dance": "#E04E8C",
  "Film & TV": "#D6385C",
  Games: "#E060A0",

  // Concepts / contexts
  Science: "#2A95BA",            // electric lab teal
  Society: "#CC6F1F",            // vivid sienna
  "Toxic radiation": "#D94835",  // warning red
  "Pollution concerns": "#A87830",
  "Nuclear mutant": "#A82BD9",   // acid violet
  Ultraviolet: "#6F1ED9",        // intense violet

  Misc: "#919191",
} as const;

// Default color for unknown fields
export const DEFAULT_FIELD_COLOR = "#2D2D2D";

export type FieldName = keyof typeof FIELD_COLORS;

export function getFieldColor(field: string): string {
  return FIELD_COLORS[field] ?? DEFAULT_FIELD_COLOR;
}
