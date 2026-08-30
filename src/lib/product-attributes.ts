/**
 * Shared catalog of product "custom input fields" (extra attributes) that admins
 * can enable per category. Used by both the admin category manager (checkbox
 * modal) and the advanced product form (dynamic spec generator), plus the
 * storefront product-detail specifications table.
 */

export type AttributeFieldType = "text" | "number" | "select";

export interface AttributeDef {
  key: string;
  label: string;
  type: AttributeFieldType;
  placeholder?: string;
  options?: string[];
}

/** Fields that always have a dedicated top-level input on the product form. */
export const TOP_LEVEL_KEYS = ["brand", "color_family"] as const;

export const ATTRIBUTE_CATALOG: AttributeDef[] = [
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Seiko, Tom Ford" },
  {
    key: "color_family",
    label: "Color family",
    type: "select",
    options: [
      "Black", "White", "Silver", "Grey", "Gold", "Rose Gold", "Brown", "Tan",
      "Beige", "Red", "Blue", "Navy", "Green", "Olive", "Purple", "Pink",
      "Orange", "Multi", "Clear",
    ],
  },
  { key: "material", label: "Material", type: "text", placeholder: "e.g. Grade A brass" },
  { key: "warranty", label: "Warranty", type: "text", placeholder: "e.g. 1 year official" },

  // Watches
  {
    key: "movement",
    label: "Movement",
    type: "select",
    options: ["Automatic", "Quartz", "Mechanical", "Solar", "Chronograph", "Kinetic"],
  },
  { key: "case_diameter", label: "Case diameter", type: "text", placeholder: "e.g. 42mm" },
  { key: "water_resistance", label: "Water resistance", type: "text", placeholder: "e.g. 10 ATM / 100m" },
  { key: "case_material", label: "Case material", type: "text", placeholder: "e.g. 316L steel" },
  { key: "strap_material", label: "Strap material", type: "text", placeholder: "e.g. Italian leather" },
  { key: "glass_material", label: "Glass", type: "select", options: ["Sapphire", "Mineral", "Hardlex", "Acrylic"] },
  { key: "dial_color", label: "Dial color", type: "text", placeholder: "e.g. Sunburst blue" },
  {
    key: "box_included",
    label: "Box included",
    type: "select",
    options: ["Yes", "No"],
  },

  // Perfumes
  {
    key: "fragrance_family",
    label: "Fragrance family",
    type: "select",
    options: ["Amber", "Floral", "Fresh", "Fruity", "Gourmand", "Oud", "Woody", "Citrus", "Aquatic"],
  },
  { key: "top_notes", label: "Top notes", type: "text", placeholder: "e.g. Bergamot, Black Pepper" },
  { key: "heart_notes", label: "Heart notes", type: "text", placeholder: "e.g. Rose, Saffron" },
  { key: "base_notes", label: "Base notes", type: "text", placeholder: "e.g. Oud, Amber, Vanilla" },
  { key: "volume", label: "Volume", type: "text", placeholder: "e.g. 100ml" },
  {
    key: "longevity",
    label: "Longevity",
    type: "select",
    options: ["1-3 hours", "4-6 hours", "6-8 hours", "8-12 hours", "12+ hours"],
  },
  { key: "occasion", label: "Occasion", type: "text", placeholder: "e.g. Evening wear" },

  // Footwear
  { key: "upper_material", label: "Upper material", type: "text", placeholder: "e.g. Full-grain leather" },
  { key: "sole_material", label: "Sole material", type: "text", placeholder: "e.g. Rubber" },
  { key: "lining", label: "Lining", type: "text", placeholder: "e.g. Genuine leather" },
  {
    key: "closure",
    label: "Closure",
    type: "select",
    options: ["Lace-up", "Slip-on", "Zip", "Buckle", "Velcro"],
  },
  { key: "season", label: "Season", type: "text", placeholder: "e.g. All-season" },
  { key: "care_instructions", label: "Care instructions", type: "text", placeholder: "e.g. Wipe clean, store dry" },
  { key: "size_range", label: "Size range", type: "text", placeholder: "e.g. UK 7–12" },
];

const DEFAULT_KEYS = ["material", "warranty"];

/** Normalize a category name to a compact id used for preset lookup. */
export const normalizeCategoryKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z]+/g, "");

const PRESET_KEYS: Record<string, string[]> = {
  watches: ["movement", "case_diameter", "water_resistance", "case_material", "strap_material", "glass_material", "dial_color", "box_included", "warranty"],
  watch: ["movement", "case_diameter", "water_resistance", "case_material", "strap_material", "glass_material", "dial_color", "box_included", "warranty"],
  perfumes: ["fragrance_family", "top_notes", "heart_notes", "base_notes", "volume", "longevity", "occasion", "warranty"],
  perfume: ["fragrance_family", "top_notes", "heart_notes", "base_notes", "volume", "longevity", "occasion", "warranty"],
  shoes: ["upper_material", "sole_material", "lining", "closure", "season", "size_range", "care_instructions", "warranty"],
  footwear: ["upper_material", "sole_material", "lining", "closure", "season", "size_range", "care_instructions", "warranty"],
};

export const defByKey = (key: string): AttributeDef | undefined =>
  ATTRIBUTE_CATALOG.find((def) => def.key === key);

/**
 * Resolve the attribute definitions a product form should render for a category.
 * Explicit category `fields` (chosen in the admin checkbox modal) win; otherwise
 * fall back to a per-category name preset, then a small generic default set.
 */
export function resolveCategoryFields(category: {
  name: string;
  fields?: string[] | null;
}): AttributeDef[] {
  const keys = category.fields && category.fields.length
    ? category.fields
    : PRESET_KEYS[normalizeCategoryKey(category.name)] ?? DEFAULT_KEYS;

  return keys
    .map(defByKey)
    .filter((def): def is AttributeDef => Boolean(def));
}

/** All catalog fields available to be toggled (excluding always-top-level ones). */
export const SELECTABLE_ATTRIBUTES = ATTRIBUTE_CATALOG.filter(
  (def) => !(TOP_LEVEL_KEYS as readonly string[]).includes(def.key),
);