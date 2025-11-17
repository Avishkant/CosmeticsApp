// Simple SKU generator: prefix + short base36 id
export function generateSku(prefix = "SKU") {
  // use timestamp + random to produce short id
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${t}-${r}`;
}

export default generateSku;
