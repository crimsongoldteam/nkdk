import {emitCandidates} from './emit.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {compareYamlKeys} from './yaml-order.mjs';

const md='http://v8.1c.ru/8.3/MDClasses';

export function assembleTabularSection(catalog,rule,attributes,internal,id='migration.document-tabular-section') {
  const emitted=emitCandidates([rule],catalog);
  const attached=new Set(['internalInfo','standardAttributes','attributes']);
  for(const property of emitted.entries[0].properties)
    if(property.status!=='candidate' && !attached.delete(property.name))
      throw new Error(`Unaccounted tabular-section property: ${property.name}`);
  if(attached.size)throw new Error(`Missing tabular-section attachments: ${[...attached].join(', ')}`);
  const fragments=emitted.modules.filter(module=>module.kind==='fragment');
  const scalar=fragments.find(module=>module.value.fields.some(field=>field.name==='name'));
  const uuid=fragments.find(module=>module.value.fields.some(field=>field.name==='uuid'));
  if(fragments.length!==2 || !scalar || !uuid || !Array.isArray(rule.xmlOrder?.keys))
    throw new Error('Incomplete ordered tabular-section fragments');
  const mount=(source,name)=>asOwnerFragment({...source,namespaces:{...source.namespaces,md}},name,['md:TabularSection'],'md');
  const properties=mount(scalar,`${id}.properties`);
  properties.representations.yaml.fields.sort((left,right)=>compareYamlKeys(left.key,right.key));
  const standards=catalog.get('fragment.document-tabular-section-standard-attributes');
  if(!standards)throw new Error('Missing tabular-section standard-attributes fragment');
  const attachments={internalInfo:['internal',internal],standardAttributes:['standard',standards],
    attributes:['attributes',mount(attributes,`${id}.attributes`)],
    uuid:['identity',mount(uuid,`${id}.identity`)]};
  const scalarNames=new Set(scalar.value.fields.map(field=>field.name));
  const ordered=new Set();
  for(const name of rule.xmlOrder.keys) {
    if(ordered.has(name))throw new Error(`Duplicate tabular-section XML order field: ${name}`);
    ordered.add(name);
    if(!Object.hasOwn(attachments,name) && !scalarNames.has(name))
      throw new Error(`Unaccounted tabular-section XML order field: ${name}`);
  }
  if([...scalarNames,...Object.keys(attachments)].some(name=>!ordered.has(name)))
    throw new Error('Tabular-section XML order omits a declared field');
  const visible=[['properties',properties],attachments.attributes,attachments.standardAttributes];
  visible.sort((left,right)=>compareYamlKeys(left[1].representations.yaml.fields[0].key,
    right[1].representations.yaml.fields[0].key));
  const parts=[attachments.internalInfo,...visible,attachments.uuid];
  const bindings=(alias,fragment)=>Object.fromEntries(Object.keys(fragment.inputs??{}).map(name=>{
    const target=name==='owner' ? (alias==='identity'?'parentOwner':'itemOwner') :
      name==='ownerName'||name==='name' ? (alias==='internal'?'qualifiedName':'itemName') : name;
    return [name,target];
  }));
  const entry=composeOwnerFragments(id,parts.map(([alias,fragment])=>({alias,fragment,bindings:bindings(alias,fragment)})));
  entry.xmlOrder=rule.xmlOrder.keys.map(name=>({internalInfo:'types',standardAttributes:'items'}[name]??name));
  entry.contributions=[{index:'metadata.own-identities',
    key:{record:{component:{input:'component'},owner:{input:'parentOwner'},kind:{input:'kind'},name:{input:'itemName'}}},
    value:{field:'uuid'}}];
  return {modules:[...parts.filter(([alias])=>!['internal','standard'].includes(alias)).map(([,fragment])=>fragment),entry],entry};
}
