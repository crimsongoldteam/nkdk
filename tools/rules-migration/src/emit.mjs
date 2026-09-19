import { mergeInputs } from './common-inputs.mjs';
import { createHash } from 'node:crypto';
import { mapProperty } from './mappings.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20);

export function emitCandidates(entries, catalog, origin = p => p.source.path, xmlNamespaces={}) {
  const modules = new Map(), results = [];
  for (const entry of entries) {
    const result = {path:entry.path, symbol:entry.symbol, ownerStatus:entry.comparison.status,
      ownerBlockers:[...(entry.blockers ?? []),...(entry.propertyStates?.length?[{reason:'owner-state-assembly-required'}]:[])], propertyStates:entry.propertyStates??null, xmlOrder:entry.xmlOrder ?? {status:'absent'}, properties:[], projections:[]};
    results.push(result);
    const groups = new Map(), yamlOnly = [];
    const ordered = [...entry.properties];
    if (entry.xmlOrder?.status === 'static') {
      const ranks = new Map(entry.xmlOrder.keys.map((key,index) => [key,index]));
      ordered.sort((a,b) => (ranks.get(a.name) ?? ranks.size) - (ranks.get(b.name) ?? ranks.size));
    }
    for (const property of ordered) {
      const invalidOrder = entry.xmlOrder?.status === 'static' && new Set(entry.xmlOrder.keys).size !== entry.xmlOrder.keys.length;
      let mapped = entry.xmlOrder?.status === 'unresolved' || invalidOrder ? {status:'blocked',reason:'owner-order-unresolved'} :
        entry.comparison.status === 'keys-match' ? mapProperty(property,catalog,xmlNamespaces) : {status:'blocked',reason:`owner-${entry.comparison.status}`};
      if(mapped.status==='candidate' && !mapped.path.length && !mapped.yamlOnly)mapped={status:'blocked',reason:'owner-root-required'};
      result.properties.push({name:property.name, source:property.source, status:mapped.status, ...(property.constantDefaults?{constantDefaults:property.constantDefaults}:{}), ...(mapped.sourceTag?{sourceTag:mapped.sourceTag}:{}), ...(mapped.reason ? {reason:mapped.reason} : {}), ...(mapped.parameterEquivalences ? {parameterEquivalences:mapped.parameterEquivalences} : {}), ...(mapped.excludedParameters ? {excludedParameters:mapped.excludedParameters} : {})});
      if (mapped.status !== 'candidate') continue;
      if(mapped.yamlOnly) {
        yamlOnly.push({property,mapped,origin:origin(property)});
        continue;
      }
      if(mapped.ownerFactRole) {
        result.properties.at(-1).ownerFactRole=mapped.ownerFactRole;
        result.ownerBlockers.push({reason:'owner-fact-contribution-required',property:property.name,role:mapped.ownerFactRole});
      }
      const root = mapped.path[0];
      const group=JSON.stringify([root,mapped.sourceTag??null]);
      if (!groups.has(group)) groups.set(group,[]);
      groups.get(group).push({property, mapped, origin:origin(property)});
    }
    if(yamlOnly.length) {
      const target=groups.values().next().value;
      if(target)target.push(...yamlOnly.map(field=>({...field,origin:target.at(-1).origin})));
      else result.ownerBlockers.push({reason:'owner-root-required',properties:yamlOnly.map(field=>field.property.name)});
    }
    for (const fields of groups.values()) {
      const root=fields[0].mapped.path[0],sourceTag=fields[0].mapped.sourceTag;
      const chunks = [];
      for (const field of fields) {
        if (chunks.at(-1)?.origin === field.origin) chunks.at(-1).fields.push(field);
        else chunks.push({origin:field.origin, fields:[field]});
      }
      const imports = {}, compose = [], inputs = {};
      for (const chunk of chunks) {
        const fragment = {format:'nkdk-declarations/1',kind:'fragment',imports:{},
          value:{kind:'record',fields:[]}, representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},presence:[]};
        const fragmentInputs = {};
        for (const {property,mapped} of chunk.fields) {
          if(mapped.namespaces)Object.assign(fragment.namespaces??={},mapped.namespaces);
          Object.assign(fragment.imports,mapped.imports);
          Object.assign(imports,mapped.imports);
          const alias = Object.entries(fragment.imports).find(([,id])=>id===mapped.id)?.[0] ?? `value${Object.keys(fragment.imports).length}`;
          fragment.imports[alias] = mapped.id;
          fragment.value.fields.push({name:property.name,type:{...mapped.type,use:alias}});
          if(!mapped.yamlOnly) {
            fragment.representations.xml.fields.push({field:property.name,path:mapped.path,...(mapped.attribute?{attribute:mapped.attribute}:{})});
          }
          if(mapped.key!==undefined)fragment.representations.yaml.fields.push({field:property.name,key:mapped.key});
          if(mapped.presence)fragment.presence.push(mapped.presence);
          if(mapped.constraints)(fragment.constraints??=[]).push(...mapped.constraints);
          mergeInputs(fragmentInputs,mapped.inputs);
        }
        if (Object.keys(fragmentInputs).length) fragment.inputs = fragmentInputs;
        fragment.id = `candidate.fragment.${hash([chunk.origin,fragment])}`;
        modules.set(fragment.id,fragment);
        const alias = `part${compose.length}`;
        imports[alias] = fragment.id;
        compose.push({use:alias,...(Object.keys(fragmentInputs).length ? {bind:Object.fromEntries(Object.keys(fragmentInputs).map(k => [k,{input:k}]))} : {})});
        mergeInputs(inputs,fragmentInputs);
      }
      const id = `candidate.projection.${hash([root,imports,compose,inputs])}`;
      const projection = {format:'nkdk-declarations/1',kind:'object',id,
        description:`Кандидат проекции: относительный XML-корень ${root}; не полный владелец`,imports,compose,
        value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
      if (Object.keys(inputs).length) projection.inputs = inputs;
      modules.set(id,projection);
      result.projections.push({id,root,...(sourceTag?{sourceTag}:{}),context:'relative-path; owner namespaces and wrapper not bound',fields:fields.map(f => f.property.name), fragments:compose.map(part=>imports[part.use])});
    }
  }
  return {modules:[...modules.values()].sort((a,b) => a.id.localeCompare(b.id,'en')),entries:results};
}
