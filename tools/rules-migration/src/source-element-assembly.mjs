import {isDeepStrictEqual} from 'node:util';
import {emitCandidates} from './emit.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {sourceOwnerFieldOrder,canonicalOwnerYamlOrder} from './source-owner-assembly.mjs';
import {sourceElementIdentity} from './source-element-identity.mjs';

// The registration owns singleton identity; ordinary properties retain the
// existing source emitter. Routes are supplied by the checked placement caller,
// never guessed from a property type (Button and CommandBarButton share a tag).
export function assembleSourceElement(source,registration,catalog,{id,path,xmlNamespace,kind='object'}={}) {
  if(!id || !['object','value'].includes(kind) || !source?.shapeComplete || source.comparison?.status!=='keys-match' ||
    registration?.item?.path!==source.path || registration.item.symbol!==source.symbol ||
    !Array.isArray(path) || (kind==='object' && !path.length) || path.some(part=>typeof part!=='string' ||
      !/^(?:[A-Za-z_][A-Za-z0-9_.-]*:)?[A-Za-z_][A-Za-z0-9_.-]*$/.test(part)))
    throw new Error('Checked element source and XML placement required');
  if(xmlNamespace!==undefined && (typeof xmlNamespace!=='string' || !xmlNamespace || path.some(part=>part.includes(':'))))
    throw new Error('Default XML namespace requires unqualified placement');
  const prefix=xmlNamespace?path.map(part=>'md:'+part):path;
  const mountFragment=(module,targetId)=>asOwnerFragment(
    xmlNamespace?{...module,namespaces:{...module.namespaces,md:xmlNamespace}}:module,targetId,prefix,xmlNamespace?'md':undefined);
  const name=source.properties.find(property=>property.name==='name');
  if(name && (name.status!=='static-parameters' || name.issues?.length ||
    !isDeepStrictEqual(name.parameters,{type:'string',xml:'_name',fromXML:false})))
    throw new Error('Unsupported registered element name property');
  // runtimeOnly is excluded by the old XML/YAML property plans. Account for
  // a checked internal enumeration with no serialized/default behavior; do
  // not invent its value or suppress a property with additional semantics.
  const notSerialized=source.properties.filter(property=>{
    const p=property.parameters;
    return property.status==='static-parameters' && !property.issues?.length &&
      p?.type==='SystemEnumeration' && p.runtimeOnly===true &&
      Object.keys(p).every(key=>['type','typeSE','runtimeOnly'].includes(key)) &&
      typeof p.typeSE==='string' && catalog.get('system.'+p.typeSE)?.enum;
  });
  const identity=mountFragment(sourceElementIdentity(registration,catalog),id+'.identity');
  const propertyNames=source.properties.map(property=>property.name);
  if(new Set(propertyNames).size!==propertyNames.length || identity.value.fields.some(field=>
    field.name!==name?.name && propertyNames.includes(field.name)))
    throw new Error('Source property conflicts with registered element identity');
  const emission=emitCandidates([{...source,properties:source.properties.filter(property=>property!==name && !notSerialized.includes(property))}],catalog);
  const originals=new Map(emission.modules.map(module=>[module.id,module]));
  const modules=new Map([[identity.id,identity]]),mounted=new Map();
  const mount=sourceId=>{
    if(mounted.has(sourceId))return mounted.get(sourceId);
    const original=originals.get(sourceId);
    if(!original)throw new Error('Missing emitted element fragment');
    const targetId=id+'.ordinary.'+mounted.size;
    mounted.set(sourceId,targetId);
    const module=mountFragment(original,targetId);
    for(const part of module.compose??[])module.imports[part.use]=mount(original.imports[part.use]);
    modules.set(targetId,module);
    return targetId;
  };
  const parts=[{alias:'identity',fragment:identity,bindings:Object.fromEntries(
    Object.keys(identity.inputs??{}).map(name=>[name,'identity_'+name]))}];
  for(const [index,projection] of emission.entries[0].projections.entries()) {
    const fragment=modules.get(mount(projection.id));
    parts.push({alias:'ordinary'+index,fragment,bindings:Object.fromEntries(
      Object.keys(fragment.inputs??{}).map(name=>[name,name==='ownerName'?
        {get:{of:{variantValue:{value:{field:'name'},variant:'explicit'}},field:'name'}}:
        'ordinary'+index+'_'+name]))});
  }
  const owner=composeOwnerFragments(id,parts),local=new Map([...catalog,...modules]);
  owner.kind=kind;
  owner.xmlOrder=sourceOwnerFieldOrder(owner,source,local);
  // Registration owns the leading name/id pair, even when rules.ts has no
  // name property/order entry. Preserve ordinary property order after it;
  // physical attribute order participates in the round-trip proof.
  owner.xmlOrder=['name','id',...owner.xmlOrder.filter(field=>!['name','id'].includes(field))];
  owner.yamlOrder=canonicalOwnerYamlOrder(owner,local);
  const rows=emission.entries[0];
  const covered=new Set(rows.properties.filter(row=>row.status==='candidate').map(row=>row.name));
  if(name)covered.add(name.name);
  const pending=rows.properties.filter(row=>row.status!=='candidate').map(row=>({name:row.name,reason:row.reason}));
  const coverage={assembled:source.properties.filter(row=>covered.has(row.name)).map(row=>row.name),pending,
    notSerialized:notSerialized.map(property=>({name:property.name,reason:'runtime-only-no-xml-yaml'})),
    blockers:rows.ownerBlockers,complete:pending.length===0 && rows.ownerBlockers.length===0};
  return {owner,modules:[...modules.values(),owner],coverage};
}
