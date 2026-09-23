import { bindSiblingExpressions, mergeMappedInputs } from './common-inputs.mjs';
import { createHash } from 'node:crypto';
import { mapProperty } from './mappings.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20);
function referencedFields(value, result=new Set()) {
  if(Array.isArray(value))for(const item of value)referencedFields(item,result);
  else if(value && typeof value==='object') {
    if(Object.keys(value).length===1 && typeof value.field==='string')result.add(value.field);
    else for(const item of Object.values(value))referencedFields(item,result);
  }
  return result;
}
function joinDependentChunks(chunks) {
  for(let changed=true;changed;) {
    changed=false;
    const positions=new Map(chunks.flatMap((chunk,index)=>chunk.fields.map(field=>[field.property.name,index])));
    for(const [last,chunk] of chunks.entries())for(const field of chunk.fields) {
      const dependencies=referencedFields(field.mapped.presence);
      for(const sibling of dependencies) {
        const first=positions.get(sibling);
        if(first===undefined || first===last)continue;
        const start=Math.min(first,last),end=Math.max(first,last);
        const joined=chunks.slice(start,end+1);
        chunks.splice(start,joined.length,{origin:joined.map(part=>part.origin).join('+'),fields:joined.flatMap(part=>part.fields)});
        changed=true;
        break;
      }
      if(changed)break;
    }
  }
}
function bindFragmentInputs(ownerInputs, fragmentInputs, overrides={}) {
  const bindings={};
  for(const [name,type] of Object.entries(fragmentInputs)) {
    if(Object.hasOwn(overrides,name)) {bindings[name]=structuredClone(overrides[name]);continue;}
    const ownerName=Object.hasOwn(ownerInputs,name) && JSON.stringify(ownerInputs[name])!==JSON.stringify(type)
      ? `${name}_${hash(type)}` : name;
    if(Object.hasOwn(ownerInputs,ownerName) && JSON.stringify(ownerInputs[ownerName])!==JSON.stringify(type))throw new Error(`Conflicting input alias: ${ownerName}`);
    ownerInputs[ownerName]=type;
    bindings[name]={input:ownerName};
  }
  return bindings;
}

function instantiateOwnerConstraints(fields,catalog) {
  const result=[];
  for(const {property,mapped} of fields) {
    const specification=mapped.ownerConstraints;
    if(!specification)continue;
    const source=catalog.get(specification.use);
    if(source?.kind!=='fragment' || !Array.isArray(source.constraints))throw new Error(`Missing owner constraint declaration: ${specification.use}`);
    const substitute=value=>{
      if(Array.isArray(value))return value.map(substitute);
      if(!value || typeof value!=='object')return value;
      if(typeof value.input==='string') {
        if(!Object.hasOwn(specification.bindings,value.input))throw new Error(`Unbound owner constraint input: ${value.input}`);
        return structuredClone(specification.bindings[value.input]);
      }
      return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,substitute(child)]));
    };
    for(const original of source.constraints) {
      const constraint=substitute(original);
      constraint.id=`${property.name}.${constraint.id}`;
      if(constraint.diagnostic?.at?.self===true)constraint.diagnostic.at={field:property.name};
      result.push(constraint);
    }
  }
  return result;
}

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
      const root = mapped.path[0] ?? null;
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
      const eligibleFields=fields.filter(field=>{
        const missing=Object.values(field.mapped.siblingExpressions??{}).find(spec=>
          !fields.some(sibling=>sibling.property.name===spec.source && sibling.mapped.id===spec.sourceId));
        if(!missing)return true;
        const row=result.properties.find(row=>row.name===field.property.name);
        row.status='blocked';row.reason='sibling-expression-required';
        return false;
      });
      if(!eligibleFields.length)continue;
      const root=eligibleFields[0].mapped.path[0] ?? null,sourceTag=eligibleFields[0].mapped.sourceTag;
      const chunks = [];
      for (const field of eligibleFields) {
        if (chunks.at(-1)?.origin === field.origin) chunks.at(-1).fields.push(field);
        else chunks.push({origin:field.origin, fields:[field]});
      }
      joinDependentChunks(chunks);
      const imports = {}, compose = [], inputs = {}, indexProviders = new Map();
      for (const chunk of chunks) {
        const ownerBindings={};
        bindSiblingExpressions(chunk.fields,(input,sibling,spec)=>{
          if(eligibleFields.some(field=>field.property.name===sibling && field.mapped.status==='candidate' && field.mapped.id===spec.sourceId))ownerBindings[input]=spec.value;
          else throw new Error(`Missing eligible sibling expression: ${input} <- ${sibling}`);
        });
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
          mergeMappedInputs(fragmentInputs,mapped);
        }
        if (Object.keys(fragmentInputs).length) fragment.inputs = fragmentInputs;
        fragment.id = `candidate.fragment.${hash([chunk.origin,fragment])}`;
        modules.set(fragment.id,fragment);
        const alias = `part${compose.length}`;
        imports[alias] = fragment.id;
        const bind=bindFragmentInputs(inputs,fragmentInputs,ownerBindings);
        for(const {mapped} of chunk.fields) for(const [name,index] of Object.entries(mapped.indexProviders??{})) {
          const ownerName=bind[name]?.input;
          if(!ownerName)throw new Error(`Missing declared index input: ${name}`);
          const previous=indexProviders.get(ownerName);
          if(previous && previous!==index)throw new Error(`Conflicting index provider: ${ownerName}`);
          indexProviders.set(ownerName,index);
        }
        compose.push({use:alias,...(Object.keys(bind).length ? {bind} : {})});
      }
      for(const [name,index] of indexProviders) {
        inputs[name]={...inputs[name],index};
      }
      const constraints=instantiateOwnerConstraints(eligibleFields,catalog);
      const id = `candidate.projection.${hash(constraints.length?[root,imports,compose,inputs,constraints]:[root,imports,compose,inputs])}`;
      const projection = {format:'nkdk-declarations/1',kind:'object',id,
        description:`Кандидат проекции: ${root===null?'корень владельца':`относительный XML-корень ${root}`}; не полный владелец`,imports,compose,
        value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},
        ...(constraints.length?{constraints}:{})};
      if (Object.keys(inputs).length) projection.inputs = inputs;
      modules.set(id,projection);
      result.projections.push({id,root,...(sourceTag?{sourceTag}:{}),context:'relative-path; owner namespaces and wrapper not bound',fields:eligibleFields.map(f => f.property.name), fragments:compose.map(part=>imports[part.use])});
    }
  }
  return {modules:[...modules.values()].sort((a,b) => a.id.localeCompare(b.id,'en')),entries:results};
}
