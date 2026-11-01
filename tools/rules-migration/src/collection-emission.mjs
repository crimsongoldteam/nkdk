import {createHash} from 'node:crypto';
import {mapProperty} from './mappings.mjs';
import {mapCollectionReference} from './collection-reference-property.mjs';
import {mapReconstructedProperty} from './reconstructed-property.mjs';
import {bindSiblingExpressions,mergeMappedInputs} from './common-inputs.mjs';
import {prepareCollectionProperty} from './collection-property.mjs';
import {compareYamlKeys} from './yaml-order.mjs';
const id=(role,value)=>`candidate.collection.${role}.${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20)}`;

// Emit complete element rules only. Property projections cannot stand in for an element.
export function emitCollections(graph,entries,catalog,namespaces={},options={}) {
  const modules=[],results=[];
  const ownerOnly=new Set(['collection-owner-path','collection-property-options','collection-owner-contributions-required',
    'collection-owner-operation-required','collection-index-addressing-required','owner-source-incomplete']);
  for(const edge of graph.edges) {
    const itemNamespace=options.itemXmlNamespaces?.[`${edge.item.path}#${edge.item.symbol}`];
    const localNamespaces={...namespaces};
    if(itemNamespace) {
      if(localNamespaces[itemNamespace.prefix] && localNamespaces[itemNamespace.prefix]!==itemNamespace.uri)
        throw new Error('Conflicting item XML namespace');
      localNamespaces[itemNamespace.prefix]=itemNamespace.uri;
    }
    const defaultPrefix=itemNamespace?.prefix??options.defaultXmlNamespace;
    if(defaultPrefix && typeof localNamespaces[defaultPrefix]!=='string')throw new Error(`Missing default XML namespace: ${defaultPrefix}`);
    const xmlPath=path=>path.map(name=>defaultPrefix&&!name.includes(':')?`${defaultPrefix}:${name}`:name);
    const result={owner:edge.owner,property:edge.property,item:edge.item,status:'blocked',blockers:[]};
    results.push(result);
    const block=(reason,details)=>result.blockers.push({reason,...(details?{details}: {})});
    if(edge.status!=='linked-structure')block('collection-link',edge.blockers);
    const registration=graph.registrations.find(r=>r.type===edge.type);
    const parameters=registration?.parameters??{};
    const supported=['propertyType','itemRule','xmlElement','yamlAsArray','collectionItemRule','schemaName','schemaShape','keyField','configurationIndexAddressing','configurationIndexUidSegment','requiredIdentity'];
    const extra=Object.keys(parameters).filter(key=>!supported.includes(key));
    if(extra.length)block('collection-registration-options',extra);
    const registeredSegment=parameters.configurationIndexUidSegment;
    if(registeredSegment!==undefined && (typeof registeredSegment!=='string'||!registeredSegment.trim()))block('collection-index-segment-invalid');
    const ownerContext={...edge.context,configurationIndexUidSegment:registeredSegment??edge.context.configurationIndexUidSegment};
    if(edge.mapping.yamlAsArray!==true && typeof edge.mapping.keyField!=='string')block('collection-key-required');
    if(parameters.schemaShape && parameters.schemaShape!=='array')block('collection-schema-shape');
    const child=entries.find(e=>e.path===edge.item.path&&e.symbol===edge.item.symbol);
    if(!child || child.comparison?.status!=='keys-match' || !child.shapeComplete) {block('item-source-incomplete');continue;}
    if(child.itemType && !Array.isArray(child.propertyStates))block('item-state-inventory-required');
    if(child.propertyStates?.length) {
      result.propertyStates=structuredClone(child.propertyStates);
      block('item-state-assembly-required');
    }
    if(child.xmlOrder?.status==='unresolved' || (child.xmlOrder?.status==='static' && new Set(child.xmlOrder.keys).size!==child.xmlOrder.keys.length))block('item-order-unresolved');
    const owner=entries.find(e=>e.path===edge.owner.path&&e.symbol===edge.owner.symbol);
    const property=owner?.properties.find(p=>p.name===edge.property);
    const emptyDefaults=Array.isArray(property?.parameters?.defaultValue) && !property.parameters.defaultValue.length &&
      Array.isArray(property.parameters.defaultValueXMLEmpty) && !property.parameters.defaultValueXMLEmpty.length &&
      property.parameters.defaultValueXMLRaw && !Array.isArray(property.parameters.defaultValueXMLRaw) &&
      typeof property.parameters.defaultValueXMLRaw==='object' && !Object.keys(property.parameters.defaultValueXMLRaw).length;
    const propertyKeys=['type','yaml','xml','xmlParents','itemRule','ownerFactRole','configurationIndexUidSegment','configurationIndexAddressing'];
    const unsupported=Object.keys(property?.parameters??{}).filter(key=>!propertyKeys.includes(key) &&
      !(emptyDefaults && ['defaultValue','defaultValueXMLEmpty','defaultValueXMLRaw'].includes(key)));
    const operationTarget=property?.parameters?.operationTarget;
    if(operationTarget && options.deferOwnerContributions!==true)block('collection-owner-operation-required');
    if(unsupported.filter(key=>key!=='operationTarget').length)block('collection-property-options',unsupported.filter(key=>key!=='operationTarget'));
    const addressing=[parameters.configurationIndexAddressing,property?.parameters?.configurationIndexAddressing].filter(value=>value!==undefined);
    if(addressing.some(value=>value!=='yamlPath'))block('collection-index-addressing-unsupported',addressing);
    else if(addressing.length) {
      if(options.deferOwnerContributions===true)result.ownerRequirements={indexAddressing:'yamlPath'};
      else block('collection-index-addressing-required');
    }
    if(owner?.comparison?.status!=='keys-match')block('owner-source-incomplete');
    const reconstruction=options.reconstructedFields?.[`${child.path}#${child.symbol}`]??{};
    const unknownRecovery=Object.keys(reconstruction).filter(name=>!child.properties.some(property=>property.name===name));
    if(unknownRecovery.length)block('unknown-reconstructed-fields',unknownRecovery);
    const fields=child.properties.map(property=>{
      // The source record collection uses keyField as its key's YAML name
      // when the property omits yaml. Array items have no such contract.
      const source=prepareCollectionProperty(property,edge.mapping);
      return {property,mapped:Object.hasOwn(reconstruction,property.name)
        ? mapReconstructedProperty(source,reconstruction[property.name],catalog,localNamespaces)
        : Object.hasOwn(options.collectionValues??{},source.parameters?.type)
          ? mapCollectionReference(source,options.collectionValues[source.parameters.type],localNamespaces)
          : mapProperty(source,catalog,localNamespaces,{properties:child.properties})};
    });
    // xmlId is a checked legacy registration requirement, not a runtime type.
    if(parameters.requiredIdentity!==undefined &&
      (parameters.requiredIdentity!=='xmlId' || !fields.some(({property,mapped})=>
        property.parameters?.xml==='_id' && property.parameters.xmlOnly===true &&
        Object.hasOwn(reconstruction,property.name) && mapped.status==='candidate')))
      block('collection-required-identity-binding');
    if(edge.mapping.yamlAsArray!==true && !fields.some(f=>f.property.name===edge.mapping.keyField && f.property.parameters?.type==='string'))block('collection-key-type');
    const incomplete=fields.filter(f=>f.mapped.status!=='candidate').map(f=>({property:f.property.name,reason:f.mapped.reason}));
    if(incomplete.length)block('item-properties',incomplete);
    if(!fields.length)block('empty-item');
    // Source metadataCollection selects its name through keyField, then "name".
    // This is a migration correspondence, not a runtime rule for named fields.
    const nameField=fields.find(f=>f.property.name===(edge.mapping.keyField??'name'));
    for(const {mapped} of fields) for(const [input,sibling] of Object.entries(mapped.siblingBindings??{})) {
      const source=fields.find(field=>field.property.name===sibling && field.mapped.status==='candidate');
      if(!source) {block('item-sibling-binding-required',{input,sibling});continue;}
      (mapped.type.bind??={})[input]={field:sibling};
      mapped.inputs=Object.fromEntries(Object.entries(mapped.inputs??{}).filter(([name])=>name!==input));
    }
    bindSiblingExpressions(fields,(input,sibling)=>block('item-sibling-binding-required',{input,sibling}));
    const identities=fields.filter(field=>field.mapped.identityProjection);
    if(identities.length>1)block('multiple-identity-properties');
    for(const {mapped} of identities) {
      if(nameField?.mapped.id!=='common.string') { block('identity-name-required'); continue; }
      if(typeof edge.mapping.xml!=='string') {block('identity-kind-required');continue;}
      mapped.type.bind.name={field:nameField.property.name};
      mapped.type.bind.kind={literal:edge.mapping.xml.split(':').at(-1)};
      mapped.inputs=Object.fromEntries(Object.entries(mapped.inputs).filter(([name])=>!['name','kind'].includes(name)));
    }
    for(const {property,mapped} of fields) {
      if(!['I8nText','FormattedI8nText'].includes(property.parameters?.type) || mapped.status!=='candidate')continue;
      if(nameField?.mapped.id!=='common.string')continue;
      const argument=property.parameters.type==='FormattedI8nText'?'name':'ownerName';
      mapped.type.bind[argument]={field:nameField.property.name};
      mapped.inputs=Object.fromEntries(Object.entries(mapped.inputs).filter(([name])=>name!=='ownerName'));
    }
    // Shared indexes retain their explicit provider. Only researched language
    // inputs are shared scalars; other context still requires a source binding.
    const inputRequirements=[...new Set(fields.flatMap(f=>Object.entries(f.mapped.inputs??{}).filter(([name,input])=>input.type?.kind!=='index' &&
      !((['I8nText','FormattedI8nText','MetadataValue'].includes(f.property.parameters?.type) && ['defaultLanguage','registeredLanguages'].includes(name)) || (f.mapped.identityProjection && ['component','owner'].includes(name)))).map(([name])=>name)))];
    if(inputRequirements.length)result.inputRequirements=inputRequirements;
    const inlineFields=fields.filter(({mapped})=>mapped.yamlInline);
    if(inlineFields.length && (edge.mapping.yamlAsArray===true || inlineFields.length!==1 ||
      fields.some(({property,mapped})=>mapped.key!==undefined && property.name!==edge.mapping.keyField && !mapped.yamlInline)))
      block('collection-inline-value-layout');
    if(fields.some(f=>f.mapped.sourceTag))block('item-source-tag');
    const sourceParents=edge.mapping.xmlParents;
    const ownerKey=`${edge.owner.path}#${edge.owner.symbol}`;
    const ownerRoot=options.ownerXmlRoots?.[ownerKey]??edge.mapping.ownerXmlRoot;
    const projectionParents=Array.isArray(sourceParents) && sourceParents.length ? sourceParents : ownerRoot;
    if(typeof edge.mapping.xml!=='string' || typeof edge.mapping.yaml!=='string' || !Array.isArray(projectionParents) || !projectionParents.length || projectionParents.some(p=>typeof p!=='string'||!p))block('collection-owner-path');
    if(ownerContext.ownerFactRole || ownerContext.configurationIndexUidSegment || operationTarget) {
      if(options.deferOwnerContributions===true)result.ownerRequirements={...result.ownerRequirements,...structuredClone(ownerContext),...(operationTarget?{operationTarget:structuredClone(operationTarget)}:{})};
      else block('collection-owner-contributions-required');
    }
    const qualified=[edge.mapping.xml,...(Array.isArray(projectionParents)?projectionParents:[])].filter(p=>typeof p==='string'&&p.includes(':'));
    if(qualified.some(p=>typeof localNamespaces[p.split(':')[0]]!=='string'))block('collection-namespace-binding');
    if(result.blockers.length && !(options.emitReadyItems===true && result.blockers.every(blocker=>ownerOnly.has(blocker.reason))))continue;
    if(child.xmlOrder?.status==='static') {
      const ranks=new Map(child.xmlOrder.keys.map((name,index)=>[name,index]));
      fields.sort((a,b)=>(ranks.get(a.property.name)??ranks.size)-(ranks.get(b.property.name)??ranks.size));
    }
    const row={format:'nkdk-declarations/1',kind:'value',imports:{},value:{kind:'record',fields:[]},
      representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
    const inputs={},inputImports={};
    for(const {property,mapped} of fields) {
      mergeMappedInputs(inputs,mapped);
      Object.assign(inputImports,mapped.imports);
      if(mapped.namespaces)Object.assign(row.namespaces??={},mapped.namespaces);
      Object.assign(row.imports,mapped.imports);
      const alias=`field${row.value.fields.length}`;
      if(Object.hasOwn(row.imports,alias))throw new Error('Generated collection alias collision');
      row.imports[alias]=mapped.id;
      row.value.fields.push({name:property.name,type:{...mapped.type,use:alias}});
      row.representations.xml.fields.push({field:property.name,path:xmlPath(mapped.path),...(mapped.attribute?{attribute:mapped.attribute}:{})});
      if(mapped.key!==undefined)row.representations.yaml.fields.push({field:property.name,key:mapped.key});
      if(mapped.presence)(row.presence??=[]).push(mapped.presence);
      if(mapped.constraints)(row.constraints??=[]).push(...mapped.constraints);
    }
    // xmlOrder orders the XML representation only. YAML follows source property
    // registration order; the two orders differ for adopted metadata objects.
    const yamlOrder=new Map(child.properties.map((property,index)=>[property.name,index]));
    row.representations.yaml.fields.sort((a,b)=>options.canonicalYamlKeyOrder
      ? compareYamlKeys(a.key,b.key)||yamlOrder.get(a.field)-yamlOrder.get(b.field)
      : yamlOrder.get(a.field)-yamlOrder.get(b.field));
    const bind=Object.fromEntries(Object.keys(inputs).map(name=>[name,{input:name}]));
    const withInputs=module=>{
      if(Object.keys(inputs).length) {
        module.inputs=structuredClone(inputs);
        Object.assign(module.imports,inputImports);
      }
      return module;
    };
    withInputs(row);
    if(defaultPrefix)(row.namespaces??={})[defaultPrefix]=localNamespaces[defaultPrefix];
    row.id=id('item',[edge.item,row]);
    const list={format:'nkdk-declarations/1',kind:'value',imports:{item:row.id},value:{kind:'sequence',item:{use:'item'}},
      representations:{xml:{kind:'element-sequence',path:xmlPath([edge.mapping.xml])},yaml:edge.mapping.yamlAsArray===true?{kind:'sequence'}:{kind:'record-mapping',key:edge.mapping.keyField,...(inlineFields.length?{value:inlineFields[0].property.name}:{})}}};
    withInputs(list);
    if(Object.keys(inputs).length)list.value.item.bind=structuredClone(bind);
    if(qualified.length)list.namespaces=Object.fromEntries(qualified.map(p=>[p.split(':')[0],localNamespaces[p.split(':')[0]]]));
    if(defaultPrefix)(list.namespaces??={})[defaultPrefix]=localNamespaces[defaultPrefix];
    list.id=id('list',list);
    if(options.emitReadyItems===true) {
      modules.push(row,list);
      result.itemDeclaration=row.id;
      result.collectionDeclaration=list.id;
      if(result.blockers.length)continue;
    }
    const projection={format:'nkdk-declarations/1',kind:'object',imports:{items:list.id},
      value:{kind:'record',fields:[{name:edge.property,type:{use:'items'}}]},
      representations:{xml:{kind:'record',fields:[{field:edge.property,path:xmlPath(projectionParents)}]},yaml:{kind:'mapping',fields:[{field:edge.property,key:edge.mapping.yaml}]}}};
    if(emptyDefaults)projection.presence=[{target:{field:edge.property},
      xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}]},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:edge.property},as:'row',where:{literal:true}}}}}}];
    withInputs(projection);
    if(Object.keys(inputs).length)projection.value.fields[0].type.bind=structuredClone(bind);
    if(list.namespaces)projection.namespaces=list.namespaces;
    if(identities.length) {
      projection.inputs.identities.index='metadata.own-identities';
      const field=name=>({get:{of:{var:'row'},field:name}});
      projection.contributions=[{index:'metadata.own-identities',forEach:{in:{field:edge.property},as:'row'},
        key:{record:{component:{input:'component'},owner:{input:'owner'},kind:{literal:edge.mapping.xml.split(':').at(-1)},name:field(nameField.property.name)}},
        value:field(identities[0].property.name)}];
    }
    projection.id=id('property',[edge.owner,projection]);
    modules.push(row,list,projection);
    result.status='candidate';result.declaration=projection.id;
  }
  return {scope:'Complete supported array and named record elements; collection property projection is not a complete owner',
    modules:[...new Map(modules.map(m=>[m.id,m])).values()],results};
}
