// Finds review targets only: a matching suffix does not prove equivalent owner context.
import { constraintFieldNames } from './property-contract.mjs';
export function candidateDiff(modules,catalog) {
  const existing = [];
  function fields(module) {
    const xml = module.representations?.xml;
    const content = xml?.kind === 'with-attributes' ? xml.content : xml;
    const types = new Map((module.value?.fields ?? []).map(f => [f.name,f.type]));
    return (module.representations?.yaml?.fields ?? []).flatMap(y => {
      const x = content?.fields?.find(f => f.field === y.field), type = types.get(y.field);
      if (!x || x.file || x.attribute || !type) return [];
      const common = type.use ? module.imports?.[type.use] :
        {text:'common.string',boolean:'common.boolean',number:'common.exact-decimal'}[type.scalar];
      if (!common) return [];
      return [{field:y.field,key:y.key,path:x.path,localPath:x.path.map(p => p.split(':').at(-1)),common,
        presence:module.presence?.find(p => p.target?.field === y.field)?.yaml ?? null,
        xmlPresence:module.presence?.find(p => p.target?.field === y.field)?.xml ?? null,
        constraints:(module.constraints??[]).filter(rule=>{const names=constraintFieldNames(rule);return !names.size || names.has(y.field);}),
        parameters:type.with ?? {},bindings:type.bind ?? {}}];
    });
  }
  for (const module of catalog.values()) for (const field of fields(module)) existing.push({id:module.id,...field});
  const entries = [];
  for (const module of modules.filter(m => m.kind === 'fragment')) for (const field of fields(module)) {
    const matches = existing.filter(e => e.key === field.key && e.common === field.common &&
      e.localPath.length >= field.localPath.length && JSON.stringify(e.localPath.slice(-field.localPath.length)) === JSON.stringify(field.localPath));
    entries.push({candidate:module.id,field:field.field,matchCount:matches.length,
      reviewTargets:matches.slice(0,3).map(e => ({id:e.id,field:e.field,
        differences:['path','presence','xmlPresence','parameters','bindings','constraints'].filter(k => JSON.stringify(e[k]) !== JSON.stringify(field[k]))}))});
  }
  return {status:'structural-review-only',matchedFields:entries.filter(e => e.matchCount).length,entries};
}
