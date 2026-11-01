import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {ownerBaseState,baseReferenceSource} from './owner-base-state.mjs';
import {writeChanged} from './focused-output.mjs';
import {ownerStateScalars} from './owner-state-scalars.mjs';
import {sourceOwnerFieldOrder} from './source-owner-assembly.mjs';
import {ownerStateRecords} from './owner-state-records.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const source=extraction.entries.find(row=>row.symbol==='MetadataChartOfCharacteristicTypesRules');
const {catalog}=candidateCatalog();
const scalar=ownerStateScalars(catalog.get('fragment.input-by-string.chartofcharacteristictypes'),source,catalog);
const numeric=ownerBaseState(scalar.module,source,
 {id:'candidate.characteristic-assembled.input-state',catalog});
const structured=ownerStateRecords(numeric,source,catalog,{
 id:'candidate.characteristic-base-state.input-type-state',fields:[{name:'type',plainForm:'sequence',
 fragmentId:'candidate.characteristic-base-state.type',stateId:'candidate.characteristic-base-state.description-state'}]});
const {module:fragment,declarations:wrappers}=structured;
const [description]=structured.fragments;
const original=JSON.parse(readFileSync('tests/migration/input-by-string-operation.json','utf8'));
const selected=['cf','adopted-cfe','own-cfe'].map(suffix=>original.cases.find(row=>row.id===`e2e-input-by-string-chartofcharacteristictypes-${suffix}`));
const probes=new Map();
const fact=baseReferenceSource(fragment,'candidate.characteristic-base-identity');
const cases=selected.map(example=>{
 if(!example)throw new Error('Missing accepted characteristic state case');
 const probe=structuredClone(catalog.get(example.entry));
 probe.id=example.entry+'.base-state';
 const part=probe.compose.find(part=>probe.imports[part.use]==='fragment.input-by-string.chartofcharacteristictypes');
 probe.imports[part.use]=fragment.id;
 probe.inputs.baseIds={...fragment.inputs.baseIds,index:'metadata.base-identities'};
 part.bind.baseIds={input:'baseIds'};
 probe.xmlOrder=sourceOwnerFieldOrder(probe,source,new Map([...catalog,[fragment.id,fragment],[description.id,description]]));
 probes.set(probe.id,probe);
 const path=example.source[0].path;
 const names=['codeLength','descriptionLength','inputByString',...scalar.properties,'type'];
 const properties=names.map(name=>source.properties.find(row=>row.name===name));
 const xmlName=property=>property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1);
 const [projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:path,yaml:example.source.find(row=>row.path.endsWith('/Свойства.yaml')).path,
   ownerFields:{propertyStates:[...properties.map(xmlName),'ExtendedConfigurationObject'],omitEmptyStateProjection:true,
    properties:[...(example.xml.includes('<ns0:Name>')?[{xml:'Name'}]:[]),
     ...properties.map(property=>({xml:xmlName(property),yaml:property.parameters.yaml,optional:true})),
     {xml:'ExtendedConfigurationObject',optional:true}]}}]),encoding:'utf8'}));
 const xml=projection.xml;
 const id=example.id+'.base-state';
 const sourceId=id+'.base';
 return {...example,id,entry:probe.id,xml,yaml:projection.yaml,xmlQNamePaths:projection.xmlQNamePaths,
  factBindings:{...example.factBindings,baseIds:'metadata.base-identities'},
  factSourceEntries:[...example.factSourceEntries,sourceId],
  baseSource:{id:sourceId,entry:fact.id,xml,inputs:{component:example.inputs.component,owner:example.inputs.owner}}};
});
const factSources=[...original.factSources.filter(row=>cases.some(c=>c.factSourceEntries.includes(row.id??row.entry))),
 ...cases.map(c=>c.baseSource)];
for(const example of cases) {
 const stateId=example.factSourceEntries.find(id=>id.endsWith('-states'));
 const states=factSources.find(row=>row.id===stateId);
 if(!states)throw new Error('Missing shared history source');
 // This reader uses the selected owner projection, not the original complete
 // source. It therefore has its own identity in a shared contract runner.
 states.id=example.id+'.history-states';
 example.factSourceEntries=example.factSourceEntries.map(id=>id===stateId?states.id:id);
 states.xml=example.xml;
}
for(const c of cases)delete c.baseSource;
// Exercise the already accepted notification boundary on the real borrowed
// owner's neighboring history. The immutable fixture itself stays unchanged.
const adopted=cases.find(c=>c.inputs.adopted);
const notify='<xr:PropertyState><xr:Property>ExtendedConfigurationObject</xr:Property><xr:State>Notify</xr:State></xr:PropertyState>';
if(!adopted.xml.includes('</ns0:InternalInfo>'))throw new Error('Missing borrowed owner history');
cases.push({...structuredClone(adopted),id:adopted.id+'.notify',
 xml:adopted.xml.replace('</ns0:InternalInfo>',notify+'</ns0:InternalInfo>'),
 yaml:adopted.yaml+'\nОбъектРасширяемойКонфигурации: !проверять\n',
 adaptation:'Notification boundary over the real borrowed owner; adjacent CodeLength/DescriptionLength history is retained.'});
// Noncanonical field order must retain both its XML patch and semantic tags.
// This derives a boundary case; the original fixture remains unchanged.
const reordered=structuredClone(adopted);
const base=reordered.xml.match(/<ns0:ExtendedConfigurationObject>[^<]+<\/ns0:ExtendedConfigurationObject>/)?.[0];
if(!base)throw new Error('Missing base reference for order boundary');
reordered.xml=reordered.xml.replace(base,'').replace('</ns0:Properties>',base+'</ns0:Properties>');
reordered.id+='.order';
delete reordered.yaml;
reordered.noRaw=false;
reordered.annotation='!xml/raw';
reordered.retainedYAML=['  ДлинаКода: !изменять null','  ДлинаНаименования: !изменять null','  ДопустимаяДлинаКода: !изменять null'];
reordered.adaptation='Move the base reference after ordinary properties; preserve the original order and all adjacent state tags.';
cases.push(reordered);
const singleton=structuredClone(cases.find(row=>row.id.includes('-cf.base-state')));
singleton.id+='.singleton';
singleton.xml=singleton.xml.replace(/\s*<v8:Type>cfg:CatalogRef\.[^<]+<\/v8:Type>/g,'');
singleton.yaml=singleton.yaml.replace(/ТипЗначения:[\s\S]*$/,'ТипЗначения: Строка(10)\n');
singleton.adaptation='Keep only the original string type to exercise the declared singleton spelling; the XML fixture stays unchanged.';
cases.push(singleton);
const typeNotify=structuredClone(adopted);
typeNotify.id+='.type-notify';
const typeState='<xr:PropertyState><xr:Property>Type</xr:Property><xr:State>Notify</xr:State></xr:PropertyState>';
typeNotify.xml=typeNotify.xml.replace('</ns0:InternalInfo>',typeState+'</ns0:InternalInfo>')
 .replace('<ns0:Hierarchical>',
  '<ns0:Type xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xs="http://www.w3.org/2001/XMLSchema"><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></ns0:Type><ns0:Hierarchical>');
typeNotify.yaml=typeNotify.yaml.replace('Иерархический:',
 'Состояния:\n  - Property: CodeLength\n    State: Extended\n  - Property: CodeAllowedLength\n    State: Extended\n  - Property: DescriptionLength\n    State: Extended\n  - Property: Type\n    State: Notify\nИерархический:')+'\nТипЗначения: !проверять Строка(10)\n';
typeNotify.xmlQNamePaths=structuredClone(singleton.xmlQNamePaths);
const oldStateId=typeNotify.factSourceEntries.find(id=>id.endsWith('-states'));
const typedStates=structuredClone(factSources.find(row=>row.id===oldStateId));
typedStates.id=typeNotify.id+'.states';
typedStates.xml=typeNotify.xml;
factSources.push(typedStates);
typeNotify.factSourceEntries=typeNotify.factSourceEntries.map(id=>id===oldStateId?typedStates.id:id);
typeNotify.adaptation='Notify over an ordinary string TypeDescription with explicit shared history; complete owner history shortening is a separate gate.';
typeNotify.validationContexts=[{inputs:{compatibilityMode:'Version8_3_8'},yaml:typeNotify.yaml,codes:['state.mode.unavailable']}];
cases.push(typeNotify);
const unavailableNotify=structuredClone(typeNotify);
unavailableNotify.id+='.old-version';
unavailableNotify.inputs.compatibilityMode='Version8_3_8';
delete unavailableNotify.yaml;
unavailableNotify.noRaw=false;
unavailableNotify.annotation='ТипЗначения: !xml/raw';
delete unavailableNotify.validationContexts;
unavailableNotify.retainedYAML=['ДлинаКода: !изменять null','ДлинаНаименования: !изменять null','ДопустимаяДлинаКода: !изменять null'];
unavailableNotify.adaptation='The same Notify type is unavailable in compatibility 8.3.8: preserve it as an inferred anomaly and retain neighboring states.';
cases.push(unavailableNotify);
const canonicalNotify=structuredClone(typeNotify);
canonicalNotify.id+='.canonical-history';
canonicalNotify.xml=canonicalNotify.xml.replace(typeState,'').replace('<ns0:InternalInfo>','<ns0:InternalInfo>'+typeState);
canonicalNotify.yaml=canonicalNotify.yaml.replace(/Состояния:\n[\s\S]*?(?=Иерархический:)/,'');
const canonicalStates=structuredClone(typedStates);
canonicalStates.id=canonicalNotify.id+'.states';
canonicalStates.xml=canonicalNotify.xml;
factSources.push(canonicalStates);
canonicalNotify.factSourceEntries=canonicalNotify.factSourceEntries.map(id=>id===typedStates.id?canonicalStates.id:id);
canonicalNotify.validationContexts=[{inputs:{compatibilityMode:'Version8_3_8'},yaml:canonicalNotify.yaml,codes:['state.mode.unavailable']}];
canonicalNotify.adaptation='Canonical history derives Notify from the whole-value tag; adjacent states are inferred in source property order.';
cases.push(canonicalNotify);
const modules=[fact,...wrappers,description,fragment,...probes.values()];
const outputs=[['rust/declarations/candidates/characteristic-base-state-probes.generated.yaml',
 yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true})],
 ['tests/migration/characteristic-base-state-operation.json',JSON.stringify({version:1,
 status:'shared base relation and input history; full owner acceptance pending',cases,factSources},null,2)+'\n']];
for(const [path,content]of outputs) {
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error('Stale characteristic base-state case: '+path);
 }else writeChanged(path,content);
}
