import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {emitBaseCollections} from './base-collection.mjs';
import {deriveOwnerDefaultProfiles} from './owner-default-profiles.mjs';
import {loadSources,checkSnapshot} from './source-snapshot.mjs';

export function commandCollectionOperation(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  checkSnapshot(loadSources(extraction.sourceHashes),graph.sourceHashes);
  graph.edges=graph.edges.filter(edge=>edge.owner.symbol==='MetadataDocumentRules'&&edge.property==='commands');
  if(graph.edges.length!==1)throw new Error('Ambiguous command collection');
  const emitted=emitBaseCollections(graph,extraction.entries,catalog,{md:'http://v8.1c.ru/8.3/MDClasses'});
  const [boundary]=emitted.results;
  if(boundary.status!=='candidate')throw new Error(`Command collection blocked: ${JSON.stringify(boundary.blockers)}`);
  const [resource]=emitted.deferredResources;
  if(emitted.deferredResources.length!==1 || resource.symbol!=='MetadataCommandRules' ||
      JSON.stringify(resource.properties)!=='["commandModule"]')
    throw new Error('Command external module must remain an explicit owner resource');
  const [row,list]=structuredClone(emitted.modules);
  const commandSource=extraction.entries.find(entry=>entry.symbol==='MetadataCommandRules');
  const tooltipSource=commandSource?.properties.find(property=>property.name==='toolTip');
  if(tooltipSource?.type!=='I8nText' || tooltipSource.parameters?.defaultValueXMLRaw!=='')
    throw new Error('Changed command tooltip empty contract');
  const pictureSource=commandSource?.properties.find(property=>property.name==='picture');
  if(pictureSource?.type!=='Picture' || pictureSource.parameters?.defaultValueXMLRaw!=='')
    throw new Error('Changed command picture empty contract');
  row.id='metadata.command-row';
  const tooltip=row.value.fields.find(field=>field.name==='toolTip');
  tooltip.type.with={...(tooltip.type.with??{}),preserveEmptyXML:true};
  const picture=row.value.fields.find(field=>field.name==='picture');
  if(row.imports[picture?.type.use]!=='common.picture')
    throw new Error('Changed command picture type');
  list.imports.item=row.id;
  list.id='metadata.command-rows';
  const baseIds={kind:'index',key:{kind:'record',fields:[
    {name:'component',type:{kind:'scalar',scalar:'text'}},
    {name:'identity',type:{kind:'scalar',scalar:'text'}},
  ]},value:{kind:'scalar',scalar:'text'}};
  const baseLookup={lookup:{in:{input:'baseIds'},key:{record:{component:{input:'component'},identity:{field:'uuid'}}}}};
  row.imports.base='common.string';
  row.imports.states='command.property-states';
  row.value.fields.unshift({name:'states',type:{use:'states'}});
  row.value.fields.splice(row.value.fields.findIndex(field=>field.name==='group'),0,
    {name:'base',type:{use:'base'}});
  row.representations.xml.fields.unshift({field:'states',path:['md:InternalInfo']});
  row.representations.xml.fields.splice(
    row.representations.xml.fields.findIndex(field=>field.field==='group'),0,
    {field:'base',path:['md:Properties','md:ExtendedConfigurationObject']});
  row.representations.yaml.fields.splice(
    row.representations.yaml.fields.findIndex(field=>field.field==='toolTip'),0,
    {field:'states',key:'Изменять'});
  row.presence.push(
    {target:{field:'states'},xml:{missing:{denotes:{sequence:[]}},canonical:[{when:{not:{exists:{in:{field:'states'},as:'state',where:{literal:true}}}},form:'missing'},{form:'ordinary'}]},yaml:{default:{sequence:[]}}},
    {target:{field:'base'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{if:{present:baseLookup},then:{require:baseLookup},else:{absent:true}}}}},
  );
  const belonging=row.presence.find(item=>item.target.field==='objectBelonging');
  delete belonging.yaml.default;
  belonging.yaml.missing={denotes:{if:{present:baseLookup},then:{literal:'Adopted'},else:{literal:'Native'}}};
  row.presence.find(item=>item.target.field==='toolTip').xml.empty=[{
    form:'empty-element',denotes:{if:{eq:[{field:'objectBelonging'},{literal:'Adopted'}]},
      then:{sequence:[]},else:{absent:true}},
  }];
  const native={eq:[{field:'objectBelonging'},{literal:'Native'}]};
  deriveOwnerDefaultProfiles({inputs:{},imports:row.imports,
    value:{fields:[picture]},presence:[row.presence.find(item=>item.target.field==='picture')]},
    commandSource,{catalog,adopted:{not:native}});
  for(const [field,normal] of [
    ['commandParameterType',null],
    ['parameterUseMode','Single'],
    ['modifiesData',false],
    ['representation','Auto'],
    ['shortcut',''],
    ['onMainServerUnavalableBehavior','Auto'],
  ]) {
    const presence=row.presence.find(item=>item.target.field===field);
    const existing=presence.xml.canonical??[];
    const normalCondition=normal===null?{not:{present:{field}}}:{eq:[{field},{literal:normal}]};
    // The scalar writer uses this choice only when the field has no value.
    // Keep the native empty form first so XML import recognizes it as absence.
    presence.xml.canonical=field==='commandParameterType'?[
      {when:{and:[{eq:[{field:'objectBelonging'},{literal:'Native'}]},normalCondition]},form:'empty-element'},
      {when:{eq:[{field:'objectBelonging'},{literal:'Adopted'}]},form:'missing'},
    ]:[
      {when:{and:[{eq:[{field:'objectBelonging'},{literal:'Adopted'}]},normalCondition]},form:'missing'},
      ...existing,
      {form:'ordinary'},
    ];
  }
  row.inputs.baseIds={type:baseIds};
  list.inputs.baseIds={type:baseIds};
  list.value.item.bind.baseIds={input:'baseIds'};
  return {modules:[row,list],requirements:{owner:boundary.ownerRequirements,resources:resource}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const {catalog}=candidateCatalog();
  const {modules}=commandCollectionOperation(catalog);
  const path='rust/declarations/objects/metadata-command-rows.yaml';
  const content='# Generated by tools/rules-migration/src/command-collection-operation.mjs from rules.ts\n'+
    yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true});
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==content)throw new Error('Stale command collection operation: '+path);
  } else if(!existsSync(path)||readFileSync(path,'utf8')!==content)writeFileSync(path,content);
}
