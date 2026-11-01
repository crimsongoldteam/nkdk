import {deriveOwnerDefaultProfiles} from './owner-default-profiles.mjs';
import {emitCandidates,referencedFields} from './emit.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {bindObjectRootEnvelope} from './file-root-envelope.mjs';
import {compareYamlKeys} from './yaml-order.mjs';
import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {ownerIndexRequirements} from './owner-index-requirements.mjs';

const propertyOrder=yaml.load(readFileSync(new URL('../contracts/owner-property-order.yaml',import.meta.url),'utf8'));

function ownerFields(owner,catalog) {
  const fields=[],seen=new Set();
  const visit=(module,stack=new Set())=>{
    if(!module || stack.has(module.id))throw new Error('Missing or cyclic owner composition');
    let xml=module.representations.xml;
    if(xml.kind==='with-attributes')xml=xml.content;
    for(const row of module.value.fields) {
      if(seen.has(row.name))throw new Error(`Duplicate composed owner field: ${row.name}`);
      seen.add(row.name);
      fields.push({name:row.name,xml:xml.fields.find(field=>field.field===row.name),
        yaml:module.representations.yaml.fields.find(field=>field.field===row.name)});
    }
    for(const part of module.compose??[])visit(catalog.get(module.imports[part.use]),new Set(stack).add(module.id));
  };
  visit(owner);
  return fields;
}

export function sourceOwnerFieldOrder(owner,source,catalog) {
  if(source.xmlOrder?.status!=='static')throw new Error('Static source owner order required');
  const physicalFields=ownerFields(owner,catalog);
  const physicalName=field=>field[0].toUpperCase()+field.slice(1);
  const ranks=new Map(source.xmlOrder.keys.map((name,index)=>[name,index]));
  for(const {field,after,before,inheritedAfter} of propertyOrder.anchors) {
    if(ranks.has(field) || !physicalFields.some(row=>row.name===field ||
      row.xml?.path?.at(-1)?.split(':').at(-1)===physicalName(field)))continue;
    const inherited=!source.properties.some(property=>property.name===field);
    const anchor=before??(inherited&&inheritedAfter?inheritedAfter:after);
    if(!ranks.has(anchor))throw new Error(`Missing source order anchor: ${anchor}`);
    ranks.set(field,ranks.get(anchor)+(before?-0.5:0.5));
  }
  const fields=physicalFields.filter(row=>row.xml).map(row=>{
    const local=row.xml?.attribute??row.xml?.path?.at(-1)?.split(':').at(-1);
    const property=source.properties.find(property=>property.name===row.name)??
      source.properties.find(property=>{
        const name=property.parameters?.xml??property.name[0].toUpperCase()+property.name.slice(1);
        return name.replace(/^_/,'')===local;
      });
    const anchored=propertyOrder.anchors.find(({field})=>row.name===field||local===physicalName(field))?.field;
    return {name:row.name,rank:ranks.get(property?.name??anchored)??ranks.size};
  });
  return fields.sort((left,right)=>left.rank-right.rank).map(field=>field.name);
}

export function canonicalOwnerYamlOrder(owner,catalog) {
  return ownerFields(owner,catalog).filter(row=>row.yaml?.key!==undefined)
    .sort((left,right)=>compareYamlKeys(left.yaml.key,right.yaml.key)).map(row=>row.name);
}

// Assemble source adapters, not conversion handlers. The existing emission owns
// sibling expressions and constraints; retain its compose tree instead of
// flattening fields and accidentally losing their bindings.
export function assembleSourceOwner(source,catalog,{id,attachments=[],xmlNamespace,extensionContext}={}) {
  if(!id || !source?.shapeComplete || source.comparison?.status!=='keys-match')
    throw new Error('Complete source owner registration required');
  const names=new Set(source.properties.map(property=>property.name)),claimed=new Set();
  if(names.size!==source.properties.length)throw new Error('Duplicate source property');
  const modules=new Map(),parts=[],fieldViews={},indexProviders={};
  if(extensionContext && (!extensionContext.adopted || !extensionContext.component ||
    Object.values(extensionContext).some(value=>typeof value!=='string')))
    throw new Error('Extension context requires named adopted and component inputs');
  const add=(alias,module,bindings)=>{
    if(!alias || parts.some(part=>part.alias===alias) || module?.kind!=='fragment')
      throw new Error('Invalid source owner attachment');
    if(modules.has(module.id))throw new Error('Duplicate source owner declaration');
    modules.set(module.id,structuredClone(module));
    parts.push({alias,fragment:module,bindings:bindings??Object.fromEntries(
      Object.keys(module.inputs??{}).map(name=>[name,`${alias}_${name}`]))});
  };
  for(const attachment of attachments) {
    // A context/history fragment may contribute constraints without claiming
    // an ordinary source property. Keep it composed; do not invent coverage.
    if(!Array.isArray(attachment.properties))
      throw new Error('Source attachment properties required');
    for(const name of attachment.properties) {
      if(!names.has(name))throw new Error(`Unknown source property: ${name}`);
      if(claimed.has(name))throw new Error(`Duplicate source property: ${name}`);
      claimed.add(name);
    }
    for(const [name,view] of Object.entries(attachment.fieldViews??{})) {
      if(!attachment.properties.includes(name)||fieldViews[name])throw new Error('Invalid attached semantic field view');
      fieldViews[name]=structuredClone(view);
    }
    add(attachment.alias,attachment.module,attachment.bindings);
    if(attachment.indexProviders)indexProviders[attachment.module.id]=structuredClone(attachment.indexProviders);
  }
  const root=source.properties.find(property=>property.type==='XMLRoot');
  if(root && claimed.has(root.name))throw new Error('Source owner root already attached');
  const route=sourceOwnerXmlRoute(source),namespace=root?.parameters.rootAttributes._xmlns??xmlNamespace;
  if(typeof namespace!=='string'||!namespace)throw new Error('Source owner XML namespace required');
  if(root)claimed.add(root.name);
  const emission=emitCandidates([{...source,
    properties:source.properties.filter(property=>!claimed.has(property.name)),
  }],catalog,undefined,{},fieldViews);
  const emitted=new Map(emission.modules.map(module=>[module.id,module]));
  for(const module of emitted.values()) {
    const declared=new Set(ownerFields(module,emitted).map(field=>field.name));
    const external=[...referencedFields(module)].filter(name=>!declared.has(name));
    if(external.length)throw new Error(`External owner dependency requires a declared field view: ${external.join(', ')}`);
  }
  const mounted=new Map();
  const mount=(sourceId)=>{
    if(mounted.has(sourceId))return mounted.get(sourceId);
    const original=emitted.get(sourceId);
    if(!original)throw new Error(`Missing emitted owner part: ${sourceId}`);
    const targetId=`${id}.ordinary.${mounted.size}`;
    mounted.set(sourceId,targetId);
    const module=asOwnerFragment({...original,namespaces:{...original.namespaces,md:namespace}},
      targetId,route,'md');
    indexProviders[targetId]=Object.fromEntries(Object.entries(original.inputs??{})
      .filter(([,input])=>input.index).map(([name,input])=>[name,input.index]));
    // asOwnerFragment removes automatic index providers for a nested fragment.
    // Only the operation root prepares indexes. Every mounted fragment
    // receives that context, including fragments originating from file owners.
    if(extensionContext) {
      module.inputs??={};
      module.inputs.adopted={type:{kind:'scalar',scalar:'boolean'}};
      deriveOwnerDefaultProfiles(module,source,{adopted:{input:'adopted'},catalog});
    }
    for(const part of module.compose??[]) {
      module.imports[part.use]=mount(original.imports[part.use]);
      if(extensionContext) {
        part.bind??={};
        for(const name of ['adopted','component'])part.bind[name]={input:name};
      }
    }
    modules.set(targetId,module);
    return targetId;
  };
  const viewSources=new Map(Object.entries(fieldViews).map(([name,view])=>[view.input,name]));
  for(const [index,projection] of emission.entries[0].projections.entries()) {
    const mountedId=mount(projection.id),module=modules.get(mountedId);
    // Already inserted by mount; add only its composition entry here.
    parts.push({alias:`ordinary${index}`,fragment:module,bindings:Object.fromEntries(
      Object.keys(module.inputs??{}).map(name=>[name,
        viewSources.has(name)?{field:viewSources.get(name)}:(extensionContext?.[name]??`ordinary${index}_${name}`)]))});
  }
  const owner=composeOwnerFragments(id,parts);
  const local=new Map([...catalog,...modules]);
  const wrapped=root?bindObjectRootEnvelope(owner,source,undefined,local):owner;
  wrapped.xmlOrder=sourceOwnerFieldOrder(wrapped,source,local);
  wrapped.yamlOrder=canonicalOwnerYamlOrder(wrapped,local);
  const candidateNames=new Set(emission.entries[0].properties.filter(row=>row.status==='candidate').map(row=>row.name));
  const pending=emission.entries[0].properties.filter(row=>row.status!=='candidate').map(row=>({name:row.name,reason:row.reason}));
  const blockers=emission.entries[0].ownerBlockers;
  const coverage={assembled:source.properties.filter(row=>claimed.has(row.name)||candidateNames.has(row.name)).map(row=>row.name),
    pending,blockers,complete:pending.length===0 && blockers.length===0};
  const indexRequirements=ownerIndexRequirements(wrapped,local,indexProviders);
  return {owner:wrapped,modules:[...modules.values(),wrapped],coverage,indexRequirements};
}
