import { createHash } from 'node:crypto';
import { commonInputs, mergeInputs } from './common-inputs.mjs';
import { propertyContract } from './property-contract.mjs';

// Bind one physical source without accepting the unconverted remainder of its owner.
export function sourceContract(entry, sourceTag, catalog, container) {
  const modules=[],fields=[],imports={},inputs={},compose=[],origins=[];
  for(const property of entry.properties.filter(property=>property.status==='candidate' && property.sourceTag===sourceTag)) {
    const matches=entry.projections.filter(projection=>projection.sourceTag===sourceTag && projection.fields.includes(property.name));
    if(matches.length!==1)throw new Error('Ambiguous source projection');
    const derived=propertyContract(matches[0],property.name,catalog,container);
    const module=derived.module;
    module.kind='fragment';module.id+='.fragment';
    const lifted=commonInputs(module);
    Object.assign(imports,lifted.imports);mergeInputs(inputs,lifted.inputs);
    const alias=`part${compose.length}`;imports[alias]=module.id;
    compose.push({use:alias,...(Object.keys(lifted.bind).length?{bind:lifted.bind}:{})});
    const xml=module.representations.xml.fields[0],yaml=module.representations.yaml.fields[0];
    if(xml.attribute)throw new Error('Source contract requires element properties');
    const leaf=xml.path.at(-1),prefix=leaf.includes(':')?leaf.split(':')[0]:undefined;
    const namespace=prefix?module.namespaces?.[prefix]:undefined;
    if(prefix && !namespace)throw new Error('Unresolved source field namespace');
    fields.push({name:property.name,xmlPath:xml.path,...(property.qname?{qname:true}:{}),...(namespace?{namespace}:{}),...(yaml?{yaml:yaml.key}:{})});
    origins.push({...derived.source,entry:module.id});modules.push(module);
  }
  if(!fields.length)throw new Error('Empty source contract');
  const id='contract.source.'+createHash('sha256').update(JSON.stringify([entry.path,entry.symbol,sourceTag,container,compose])).digest('hex').slice(0,20);
  const owner={format:'nkdk-declarations/1',kind:'object',id,imports,compose,value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}},...(Object.keys(inputs).length?{inputs}:{})};
  return {entry:id,modules:[...modules,owner],fields,source:{entry:id,sourceOwner:entry.symbol,sourceTag,container,properties:origins}};
}
