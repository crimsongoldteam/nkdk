export function compare(extracted, assembled) {
  if (assembled.status !== 'loaded') return {...assembled};
  const itemTypeMatches=!Object.hasOwn(assembled,'itemType') || extracted.itemType===assembled.itemType;
  const keys = extracted.properties.map(p => p.name);
  const missing = assembled.keys.filter(k => !keys.includes(k));
  const extra = keys.filter(k => !assembled.keys.includes(k));
  const orderMatches = JSON.stringify(keys) === JSON.stringify(assembled.keys);
  const xmlOrderMatches=!Object.hasOwn(assembled,'xmlOrder') || extracted.xmlOrder?.status==='unresolved' ? null : JSON.stringify(extracted.xmlOrder?.status==='static'?extracted.xmlOrder.keys:null)===JSON.stringify(assembled.xmlOrder);
  return {status: !extracted.shapeComplete ? 'blocked' : missing.length || extra.length || !orderMatches || xmlOrderMatches===false || !itemTypeMatches ? 'mismatch' : 'keys-match',
    missing, extra, orderMatches, itemTypeMatches, xmlOrderMatches, assembledCount:assembled.keys.length};
}
