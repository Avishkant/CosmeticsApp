// Basic input sanitization to prevent NoSQL injection and strip script tags from strings
export function sanitize(req, res, next) {
  function cleanObject(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(cleanObject);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      // skip keys that start with $ or contain . which are used in injections
      if (k.startsWith("$") || k.includes(".")) continue;
      if (typeof v === "string") {
        // basic XSS strip
        out[k] = v.replace(/<script.*?>.*?<\/script>/gi, "");
      } else if (typeof v === "object") {
        out[k] = cleanObject(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  // sanitize body (usually writable)
  try {
    req.body = cleanObject(req.body);
  } catch (e) {
    // fallback: attach sanitized body copy
    req.sanitizedBody = cleanObject(req.body);
  }

  // For req.query and req.params some frameworks expose getter-only properties.
  // Try to mutate the existing object contents if possible, otherwise attach
  // the sanitized version under a safe key (req.sanitizedQuery / req.sanitizedParams).
  const applySanitized = (name) => {
    const original = req[name];
    const sanitized = cleanObject(original);
    if (original && typeof original === "object") {
      try {
        // clear existing keys then copy sanitized keys in-place
        Object.keys(original).forEach((k) => delete original[k]);
        Object.entries(sanitized).forEach(([k, v]) => (original[k] = v));
        return;
      } catch (e) {
        // fallthrough to attaching sanitized copy
      }
    }
    // attach sanitized copy under a non-conflicting key
    req[`sanitized${name.charAt(0).toUpperCase() + name.slice(1)}`] = sanitized;
  };

  applySanitized("query");
  applySanitized("params");

  next();
}
