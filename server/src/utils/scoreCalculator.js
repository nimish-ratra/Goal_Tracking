function computeScore(uom, target, actual, completionDate, deadline) {
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  if (uom === 'NUMERIC_MIN') {
    if (target === 0) return 0;
    return clamp(actual / target, 0, 1.5);
  }
  
  if (uom === 'NUMERIC_MAX') {
    if (actual === 0) return 1.5;
    return clamp(target / actual, 0, 1.5);
  }
  
  if (uom === 'TIMELINE') {
    if (!completionDate || !deadline) return 0;
    const comp = new Date(completionDate);
    const dl = new Date(deadline);
    
    if (comp <= dl) return 1.0;
    
    const diffTime = Math.abs(comp - dl);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 1 - (diffDays / 30));
  }
  
  if (uom === 'ZERO') {
    return actual === 0 ? 1.0 : 0.0;
  }

  return 0;
}

module.exports = { computeScore };
