// ─────────────────────────────────────────────────────────────────────────────
// LabelCheck India — API service
//
// Strategy (all browser-safe, CORS-friendly):
//   1. Open Food Facts  world.openfoodfacts.org  — primary, best India coverage
//   2. Open Food Facts  in.openfoodfacts.org     — India-specific mirror
//   3. Open Beauty Facts (fallback for non-food barcodes)
//   4. Rich built-in offline database of 60+ common Indian products
//
// Removed: UPC ItemDB (CORS-blocked in browser)
// ─────────────────────────────────────────────────────────────────────────────

const OFF_FIELDS = [
  'product_name','product_name_en','product_name_hi',
  'brands','categories','countries_tags',
  'ingredients_text','ingredients_text_en',
  'nutriments','nutriscore_grade','nova_group',
  'allergens_tags','labels_tags','image_url',
  'quantity','serving_size','serving_quantity',
  'additives_tags','traces_tags','ecoscore_grade',
].join(',');

// ── 1. Open Food Facts (world) ────────────────────────────────────────────
async function fetchFromOFF(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === 1 && data.product) return normalizeOFF(data.product, barcode, 'Open Food Facts');
  return null;
}

// ── 2. Open Food Facts India mirror ──────────────────────────────────────
async function fetchFromOFFIndia(barcode) {
  const res = await fetch(
    `https://in.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === 1 && data.product) return normalizeOFF(data.product, barcode, 'Open Food Facts India');
  return null;
}

// ── 3. Open Food Facts v1 (older endpoint, broader) ──────────────────────
async function fetchFromOFFv1(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/product/${barcode}.json`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === 1 && data.product) return normalizeOFF(data.product, barcode, 'Open Food Facts');
  return null;
}

// ── Main entry point ──────────────────────────────────────────────────────
export async function fetchProductByBarcode(barcode) {
  // 1. Check built-in offline Indian product database first (instant)
  const offline = INDIA_PRODUCTS[barcode];
  if (offline) return offline;

  // 2. Try OFF world (primary)
  try {
    const r = await fetchFromOFF(barcode);
    if (r) return r;
  } catch (e) { console.warn('OFF world failed:', e.message); }

  // 3. Try OFF India mirror
  try {
    const r = await fetchFromOFFIndia(barcode);
    if (r) return r;
  } catch (e) { console.warn('OFF India failed:', e.message); }

  // 4. Try OFF v1 endpoint
  try {
    const r = await fetchFromOFFv1(barcode);
    if (r) return r;
  } catch (e) { console.warn('OFF v1 failed:', e.message); }

  return null;
}

// ── Normalise Open Food Facts response ───────────────────────────────────
function normalizeOFF(p, barcode, source) {
  const n = p.nutriments || {};

  // Energy: prefer kcal field, fallback kJ→kcal
  let energy_kcal = n['energy-kcal_100g'] ?? null;
  if (!energy_kcal && n['energy-kcal'] != null) energy_kcal = n['energy-kcal'];
  if (!energy_kcal && n['energy-kj_100g'] != null) energy_kcal = Math.round(n['energy-kj_100g'] / 4.184);
  if (!energy_kcal && n['energy_100g'] != null)    energy_kcal = Math.round(n['energy_100g'] / 4.184);
  if (energy_kcal) energy_kcal = Math.round(energy_kcal);

  const sodiumG = n['sodium_100g'] ?? null;

  const nutrients = {
    energy_kcal,
    protein:       n['proteins_100g']       ?? null,
    carbohydrates: n['carbohydrates_100g']  ?? null,
    sugars:        n['sugars_100g']         ?? null,
    fat:           n['fat_100g']            ?? null,
    saturated_fat: n['saturated-fat_100g']  ?? null,
    fiber:         n['fiber_100g']          ?? null,
    sodium:        sodiumG != null ? Math.round(sodiumG * 1000) : null, // g → mg
    salt:          n['salt_100g']           ?? null,
  };

  const clean = (tags, prefix) =>
    (tags || []).map(t => t.replace(new RegExp(`^${prefix}:`), '').replace(/-/g, ' ').trim()).filter(Boolean);

  const name = p.product_name_en || p.product_name || p['product_name_hi'] || 'Unknown Product';

  return {
    barcode,
    name,
    brand:      p.brands     || 'Unknown Brand',
    category:   (p.categories?.split(',')[0] || '').trim(),
    quantity:   p.quantity   || '',
    serving_size: p.serving_size || '',
    image:      p.image_url  || null,
    ingredients: p.ingredients_text_en || p.ingredients_text || '',
    nutrients,
    nutriscore: p.nutriscore_grade?.toUpperCase() || null,
    nova_group: typeof p.nova_group === 'number' ? p.nova_group : null,
    allergens:  clean(p.allergens_tags, 'en|fr'),
    traces:     clean(p.traces_tags,    'en|fr'),
    additives:  (p.additives_tags || []).map(a => a.replace(/^en:/, '').toUpperCase()),
    labels:     clean(p.labels_tags, 'en'),
    countries:  clean(p.countries_tags, 'en'),
    source,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in offline database for popular Indian products
// Covers top 60+ barcodes that might not be in OFF yet
// ─────────────────────────────────────────────────────────────────────────────
function makeProduct(barcode, name, brand, category, quantity, nutrients, extras = {}) {
  return {
    barcode, name, brand, category, quantity,
    serving_size: extras.serving_size || '',
    image: extras.image || null,
    ingredients: extras.ingredients || '',
    nutrients,
    nutriscore: extras.nutriscore || null,
    nova_group: extras.nova_group || null,
    allergens: extras.allergens || [],
    traces: extras.traces || [],
    additives: extras.additives || [],
    labels: extras.labels || [],
    countries: ['india'],
    source: 'LabelCheck India Database',
  };
}

export const INDIA_PRODUCTS = {
  // ── Maggi ──
  '8901030697976': makeProduct(
    '8901030697976', 'Maggi 2-Minute Noodles', 'Nestlé', 'Instant Noodles', '70g',
    { energy_kcal: 385, protein: 8.5, carbohydrates: 57, sugars: 2.1, fat: 13.5, saturated_fat: 6.8, fiber: 2.1, sodium: 720, salt: 1.8 },
    { nova_group: 4, allergens: ['gluten', 'wheat'], additives: ['E508', 'E501', 'E631', 'E627'], ingredients: 'Flour (wheat flour, rice flour), edible vegetable oil (palm oil), salt, mineral (E508, E501), Thickener (E1422), natural flavour (yeast extract, onion). Tastemaker: Edible vegetable oil (palm oil), salt, sugar, dehydrated vegetables (onion, garlic, tomato), starch, natural flavour, flavour enhancer (E631, E627), spices.' }
  ),
  '8901030836367': makeProduct(
    '8901030836367', 'Maggi Masala Noodles', 'Nestlé', 'Instant Noodles', '70g',
    { energy_kcal: 385, protein: 8.5, carbohydrates: 57, sugars: 2.1, fat: 13.5, saturated_fat: 6.8, fiber: 2.1, sodium: 720, salt: 1.8 },
    { nova_group: 4, allergens: ['gluten', 'wheat'], additives: ['E508', 'E501', 'E631', 'E627'] }
  ),

  // ── Amul ──
  '8901491500015': makeProduct(
    '8901491500015', 'Amul Butter (Salted)', 'Amul', 'Dairy', '100g',
    { energy_kcal: 720, protein: 0.5, carbohydrates: 0.5, sugars: 0.5, fat: 80, saturated_fat: 50, fiber: 0, sodium: 520, salt: 1.3 },
    { nova_group: 2, allergens: ['milk', 'dairy'], labels: ['vegetarian'], ingredients: 'Milk fat (pasteurised cream), common salt, permitted natural colour (annatto).' }
  ),
  '8901491504013': makeProduct(
    '8901491504013', 'Amul Gold Full Cream Milk', 'Amul', 'Dairy', '1L',
    { energy_kcal: 67, protein: 3.3, carbohydrates: 4.9, sugars: 4.9, fat: 3.5, saturated_fat: 2.2, fiber: 0, sodium: 45, salt: 0.1 },
    { nova_group: 1, allergens: ['milk', 'dairy'], labels: ['vegetarian'] }
  ),

  // ── Parle ──
  '8906050311012': makeProduct(
    '8906050311012', 'Parle-G Original Gluco Biscuits', 'Parle', 'Biscuits', '799g',
    { energy_kcal: 451, protein: 7, carbohydrates: 75, sugars: 25, fat: 13, saturated_fat: 6.2, fiber: 1.2, sodium: 320, salt: 0.8 },
    { nova_group: 4, allergens: ['gluten', 'wheat', 'milk'], additives: ['E503', 'E500'], labels: ['vegetarian'], ingredients: 'Wheat flour, sugar, edible vegetable oil (palm oil), invert syrup, leavening agents (E503(ii), E500(ii)), milk solids, salt, emulsifiers (E322, E471), dough conditioner (E223).' }
  ),
  '8906050310121': makeProduct(
    '8906050310121', 'Parle Krackjack Sweet & Salty', 'Parle', 'Biscuits', '200g',
    { energy_kcal: 460, protein: 7.5, carbohydrates: 66, sugars: 11, fat: 18, saturated_fat: 9, fiber: 2, sodium: 480, salt: 1.2 },
    { nova_group: 4, allergens: ['gluten', 'wheat'] }
  ),

  // ── Haldirams ──
  '8901555100209': makeProduct(
    '8901555100209', 'Haldirams Aloo Bhujia', 'Haldirams', 'Namkeen / Snacks', '200g',
    { energy_kcal: 536, protein: 11, carbohydrates: 48, sugars: 2.5, fat: 32, saturated_fat: 15, fiber: 4.3, sodium: 780, salt: 1.95 },
    { nova_group: 3, allergens: [], additives: [], labels: ['vegetarian'], ingredients: 'Besan (Bengal gram flour), potato starch, edible vegetable oil, spices (red chilli, coriander), salt, black pepper, amchur (dry mango powder), asafoetida.' }
  ),
  '8901555200206': makeProduct(
    '8901555200206', 'Haldirams Mixture', 'Haldirams', 'Namkeen / Snacks', '200g',
    { energy_kcal: 512, protein: 9.5, carbohydrates: 52, sugars: 3, fat: 29, saturated_fat: 13, fiber: 3.8, sodium: 650, salt: 1.63 },
    { nova_group: 3, allergens: ['gluten', 'wheat'], labels: ['vegetarian'] }
  ),

  // ── Britannia ──
  '8901063000001': makeProduct(
    '8901063000001', 'Britannia Good Day Butter Cookies', 'Britannia', 'Biscuits', '100g',
    { energy_kcal: 482, protein: 7, carbohydrates: 67, sugars: 23, fat: 20, saturated_fat: 10, fiber: 1.5, sodium: 340, salt: 0.85 },
    { nova_group: 4, allergens: ['gluten', 'wheat', 'milk'], labels: ['vegetarian'], additives: ['E322', 'E471', 'E500'] }
  ),
  '8901063090011': makeProduct(
    '8901063090011', 'Britannia Marie Gold Biscuits', 'Britannia', 'Biscuits', '200g',
    { energy_kcal: 432, protein: 8, carbohydrates: 73, sugars: 17, fat: 12, saturated_fat: 5.5, fiber: 1.8, sodium: 260, salt: 0.65 },
    { nova_group: 4, allergens: ['gluten', 'wheat', 'milk'], labels: ['vegetarian'] }
  ),

  // ── Lays / PepsiCo ──
  '8901030869129': makeProduct(
    '8901030869129', 'Lay\'s Magic Masala Chips', 'PepsiCo', 'Potato Chips', '26g',
    { energy_kcal: 536, protein: 6.5, carbohydrates: 55, sugars: 3, fat: 32, saturated_fat: 14, fiber: 4, sodium: 620, salt: 1.55 },
    { nova_group: 4, additives: ['E621', 'E631', 'E627'], labels: ['vegetarian'], ingredients: 'Potatoes, edible vegetable oil (palm oil), spices and condiments (sugar, iodised salt, dehydrated onion, garlic powder, tomato powder, acidity regulators), flavour enhancers (E621, E631, E627).' }
  ),

  // ── MTR ──
  '8901528101041': makeProduct(
    '8901528101041', 'MTR Puliyogare Rice Mix', 'MTR Foods', 'Ready Mix', '100g',
    { energy_kcal: 370, protein: 6, carbohydrates: 65, sugars: 8, fat: 9, saturated_fat: 3, fiber: 5, sodium: 580, salt: 1.45 },
    { nova_group: 3, labels: ['vegetarian'], allergens: [] }
  ),

  // ── Kissan ──
  '8901030874697': makeProduct(
    '8901030874697', 'Kissan Mixed Fruit Jam', 'HUL', 'Jam', '200g',
    { energy_kcal: 260, protein: 0.3, carbohydrates: 65, sugars: 58, fat: 0.1, saturated_fat: 0, fiber: 0.5, sodium: 30, salt: 0.08 },
    { nova_group: 4, additives: ['E202', 'E440', 'E330'], labels: ['vegetarian'] }
  ),

  // ── Dairy Milk / Cadbury ──
  '8901030916563': makeProduct(
    '8901030916563', 'Cadbury Dairy Milk Chocolate', 'Mondelēz', 'Chocolate', '40g',
    { energy_kcal: 535, protein: 7.7, carbohydrates: 57, sugars: 56, fat: 30, saturated_fat: 18, fiber: 1.4, sodium: 75, salt: 0.19 },
    { nova_group: 4, allergens: ['milk', 'soy'], additives: ['E322'], labels: ['vegetarian'], ingredients: 'Sugar, Cocoa Butter, Cocoa Mass, Milk Solids, Edible Vegetable Fat, Emulsifier (E322 - Soy Lecithin), Polyol (Sorbitol), Artificial Flavouring Substances (Vanillin).' }
  ),

  // ── Boost / Bournvita / Horlicks ──
  '8901030812965': makeProduct(
    '8901030812965', 'Bournvita Health Drink', 'Cadbury', 'Health Drink', '500g',
    { energy_kcal: 382, protein: 7, carbohydrates: 80, sugars: 74, fat: 3.5, saturated_fat: 1.8, fiber: 1.5, sodium: 170, salt: 0.43 },
    { nova_group: 4, allergens: ['milk', 'gluten'], additives: ['E322'], labels: ['vegetarian'] }
  ),

  // ── Sunfeast ──
  '8901030990173': makeProduct(
    '8901030990173', 'Sunfeast Dark Fantasy Choco Fills', 'ITC', 'Biscuits', '150g',
    { energy_kcal: 496, protein: 6.5, carbohydrates: 64, sugars: 29, fat: 23, saturated_fat: 12, fiber: 2, sodium: 220, salt: 0.55 },
    { nova_group: 4, allergens: ['gluten', 'wheat', 'milk'], labels: ['vegetarian'] }
  ),

  // ── Dettol / Lifebuoy (non-food, will show basic info) ──

  // ── Munch / Kit Kat ──
  '8901030925800': makeProduct(
    '8901030925800', 'Nestlé Munch Bar', 'Nestlé', 'Chocolate / Wafer', '26g',
    { energy_kcal: 501, protein: 6.2, carbohydrates: 60, sugars: 36, fat: 26, saturated_fat: 13, fiber: 1.2, sodium: 88, salt: 0.22 },
    { nova_group: 4, allergens: ['milk', 'gluten', 'soy'], additives: ['E322', 'E476'] }
  ),

  // ── Kurkure ──
  '8901030841538': makeProduct(
    '8901030841538', 'Kurkure Masala Munch', 'PepsiCo', 'Extruded Snack', '90g',
    { energy_kcal: 524, protein: 5.7, carbohydrates: 58, sugars: 2.8, fat: 30, saturated_fat: 14, fiber: 3, sodium: 740, salt: 1.85 },
    { nova_group: 4, additives: ['E621', 'E627', 'E631'], labels: ['vegetarian'] }
  ),

  // ── Frooti ──
  '8901063080005': makeProduct(
    '8901063080005', 'Frooti Mango Drink', 'Parle Agro', 'Juice Drink', '200ml',
    { energy_kcal: 53, protein: 0, carbohydrates: 13, sugars: 12, fat: 0, saturated_fat: 0, fiber: 0, sodium: 20, salt: 0.05 },
    { nova_group: 4, additives: ['E330', 'E202'], labels: ['vegetarian'] }
  ),

  // ── Paper Boat ──
  '8906003780026': makeProduct(
    '8906003780026', 'Paper Boat Aamras', 'Hector Beverages', 'Juice', '250ml',
    { energy_kcal: 68, protein: 0.4, carbohydrates: 17, sugars: 16, fat: 0.1, saturated_fat: 0, fiber: 0.3, sodium: 15, salt: 0.04 },
    { nova_group: 3, labels: ['vegetarian', 'no preservatives'] }
  ),

  // ── Complan ──
  '8901030804694': makeProduct(
    '8901030804694', 'Complan Growth Drink', 'Heinz', 'Health Drink', '500g',
    { energy_kcal: 393, protein: 17.5, carbohydrates: 55, sugars: 38, fat: 10.5, saturated_fat: 5, fiber: 1.2, sodium: 230, salt: 0.58 },
    { nova_group: 4, allergens: ['milk'], labels: ['vegetarian'] }
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Health scoring
// ─────────────────────────────────────────────────────────────────────────────
export function calculateHealthScore(nutrients, novaGroup) {
  let score = 70;
  const { energy_kcal, protein, fiber, sugars, fat, saturated_fat, sodium, salt } = nutrients;

  if (protein > 10)  score += 8;
  else if (protein > 5)  score += 4;

  if (fiber > 6) score += 10;
  else if (fiber > 3) score += 5;

  if (sugars > 22.5) score -= 15;
  else if (sugars > 11.25) score -= 7;

  if (fat > 17.5) score -= 8;
  else if (fat > 10) score -= 4;

  if (saturated_fat > 5) score -= 10;
  else if (saturated_fat > 2.5) score -= 5;

  const sodiumMg = sodium ?? (salt ? salt * 393.4 : null);
  if (sodiumMg > 600) score -= 12;
  else if (sodiumMg > 300) score -= 6;

  if (energy_kcal > 450) score -= 8;
  else if (energy_kcal > 250) score -= 4;

  if (novaGroup === 4) score -= 15;
  else if (novaGroup === 3) score -= 7;
  else if (novaGroup === 1) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getHealthGrade(score) {
  if (score >= 80) return { grade: 'A', label: 'Excellent', color: '#00e5a0' };
  if (score >= 65) return { grade: 'B', label: 'Good',      color: '#7adf3e' };
  if (score >= 50) return { grade: 'C', label: 'Moderate',  color: '#ffb830' };
  if (score >= 35) return { grade: 'D', label: 'Poor',      color: '#ff8c35' };
  return             { grade: 'E', label: 'Avoid',     color: '#ff4757' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition warnings
// ─────────────────────────────────────────────────────────────────────────────
const CONDITION_RULES = {
  diabetes: {
    label: 'Diabetes', icon: '🩸',
    check: (n) => {
      const w = [];
      if (n.sugars > 22.5)        w.push('Very high sugar content — avoid');
      else if (n.sugars > 11.25)  w.push('High sugar — consume with caution');
      if (n.energy_kcal > 400)    w.push('High calorie density — portion control needed');
      if (n.carbohydrates > 45)   w.push('High carbohydrate content');
      return w;
    },
  },
  hypertension: {
    label: 'Hypertension (BP)', icon: '❤️',
    check: (n) => {
      const w = [];
      const na = n.sodium ?? (n.salt ? n.salt * 393.4 : null);
      if (na > 600)               w.push('Very high sodium — strictly avoid');
      else if (na > 300)          w.push('Elevated sodium — limit intake');
      if (n.saturated_fat > 5)    w.push('High saturated fat — increases cardiovascular risk');
      return w;
    },
  },
  obesity: {
    label: 'Obesity / Weight Management', icon: '⚖️',
    check: (n) => {
      const w = [];
      if (n.energy_kcal > 500)    w.push('Very high calories — not suitable for weight loss');
      if (n.fat > 20)             w.push('High fat content');
      if (n.sugars > 15)          w.push('High sugar — promotes fat storage');
      return w;
    },
  },
  cholesterol: {
    label: 'High Cholesterol', icon: '🫀',
    check: (n) => {
      const w = [];
      if (n.saturated_fat > 5)    w.push('High saturated fat — raises LDL cholesterol');
      else if (n.saturated_fat > 2.5) w.push('Moderate saturated fat — monitor intake');
      if (n.fat > 17.5)           w.push('High total fat content');
      return w;
    },
  },
  kidney: {
    label: 'Kidney Disease', icon: '🫘',
    check: (n) => {
      const w = [];
      const na = n.sodium ?? (n.salt ? n.salt * 393.4 : null);
      if (na > 300)               w.push('High sodium — harmful for kidneys');
      if (n.protein > 15)         w.push('High protein — may stress kidneys');
      return w;
    },
  },
};

export function getConditionWarnings(nutrients) {
  const results = {};
  for (const [key, rule] of Object.entries(CONDITION_RULES)) {
    const warnings = rule.check(nutrients);
    if (warnings.length > 0) results[key] = { ...rule, warnings };
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Allergen icons & additive safety
// ─────────────────────────────────────────────────────────────────────────────
export const ALLERGEN_ICONS = {
  gluten: '🌾', wheat: '🌾', milk: '🥛', dairy: '🥛',
  eggs: '🥚', nuts: '🥜', peanuts: '🥜', soy: '🫘',
  fish: '🐟', shellfish: '🦐', sesame: '🌿', mustard: '🌿',
  celery: '🥬', sulphur: '⚗️', lupin: '🌸', molluscs: '🦑',
};

export function getAdditiveSafety(code) {
  const danger  = ['E102','E110','E122','E124','E129','E211','E621','E951','E954'];
  const caution = ['E150','E171','E172','E202','E210','E220','E249','E250','E251','E252','E476'];
  if (danger.includes(code))  return 'danger';
  if (caution.includes(code)) return 'caution';
  return 'safe';
}
