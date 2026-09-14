import {createHash} from 'node:crypto';
import {attachBorrowedBase} from './borrowed-base-attachment.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {emitBaseCollections} from './base-collection.mjs';
import {loadSources,checkSnapshot} from './source-snapshot.mjs';

// Real complete child elements, not selected Properties fields. The enclosing
// enumeration's other collections are outside this child-conversion boundary.
export function enumValueCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const sources=loadSources(extraction.sourceHashes);
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  checkSnapshot(sources,graph.sourceHashes);
  graph.edges=graph.edges.filter(edge=>edge.item.symbol==='MetadataEnumerationValueRules');
  if(graph.edges.length!==1)throw new Error('Ambiguous enumeration value collection');
  const source=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationValueRules');
  const emitted=attachBorrowedBase(emitBaseCollections(graph,extraction.entries,catalog),source);
  const requests=[['cf','cf','ПеречислениеВсеСвойства'],['cfe/all-extension','cfe/Расширение_All','ПеречислениеВсеСвойства'],['cfe/all-extension','cfe/Расширение_All','ПеречислениеВсеСвойстваExt']].map(([component,folder,name])=>({
    component,xml:`e2e/fixtures/xml/${component}/Enums/${name}.xml`,
    yaml:`e2e/fixtures/nkdk/${folder}/Перечисление/${name}/Свойства.yaml`,
    collection:{item:'EnumValue',yaml:'Значения'}}));
  const examples=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{input:JSON.stringify(requests),encoding:'utf8'}));
  const entry=emitted.results[0].declaration;
  const cases=examples.map((example,index)=>({id:`e2e-complete-enum-values-${index}`,entry,
    inputs:{component:requests[index].component,owner:example.ownerIdentity,defaultLanguage:'ru',registeredLanguages:['ru','en']},
    factBindings:{identities:'metadata.own-identities',baseIds:'metadata.base-identities'},
    xml:example.xml,yaml:example.yaml,source:example.source,
    adaptation:'Complete EnumValue elements; only outer MDClasses namespace removed; owner contributions not accepted'}));
  const factSources=cases.map(c=>({entry,xml:c.xml,inputs:c.inputs}));
  const snapshot=JSON.parse(readFileSync('tests/migration/nested-identity-inventory.json','utf8'));
  for(const row of snapshot.rows.filter(row=>row.kind==='EnumValue'&&row.baseUuid&&requests.some(request=>request.xml===row.source))) {
    if(createHash('sha256').update(readFileSync(row.source)).digest('hex')!==row.sha256)throw new Error('Stale base identity source');
    factSources.push({entry:'migration.metadata-base-identity',xml:'<Root><Name>base</Name></Root>',inputs:{component:row.component,identity:row.uuid,baseIdentity:row.baseUuid}});
  }
  const borrowed=cases[1];
  const notify='<xr:PropertyState><xr:Property>ExtendedConfigurationObject</xr:Property><xr:State>Notify</xr:State></xr:PropertyState>';
  const withRows=rows=>borrowed.xml.replace('<ChildObjects','<ChildObjects xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"').replace(/<InternalInfo\s*\/>/,`<InternalInfo>${rows}</InternalInfo>`);
  const notifyYAML=borrowed.yaml.replace('    ПринадлежностьОбъекта: Заимствованный','    ПринадлежностьОбъекта: Заимствованный\n    ОбъектРасширяемойКонфигурации: !проверять');
  cases.push({...borrowed,id:'enum-values-notify',xml:withRows(notify),yaml:notifyYAML});
  const withoutBase=xml=>xml.replace(/<ExtendedConfigurationObject>[^<]*<\/ExtendedConfigurationObject>/,'');
  for(const [suffix,xml,marker] of [['control',borrowed.xml,''],['notify',withRows(notify),'!проверять ""']]) {
    cases.push({...borrowed,id:'enum-values-missing-base-'+suffix,xml:withoutBase(xml),
      yaml:borrowed.yaml.replace('    ПринадлежностьОбъекта: Заимствованный',`    ПринадлежностьОбъекта: Заимствованный\n    ОбъектРасширяемойКонфигурации: ${marker}`)});
  }

  const neighbor='<xr:PropertyState><xr:Property>Synonym</xr:Property><xr:State>Extended</xr:State></xr:PropertyState>';
  for(const [suffix,rows] of [['duplicate',notify+notify],['neighbor',notify+neighbor],['reversed',neighbor+notify]]) {
    cases.push({...borrowed,id:'enum-values-'+suffix,xml:withRows(rows),yaml:undefined,annotation:'    InternalInfo: !xml/raw',retainedYAML:['    Синоним: ""','    ПринадлежностьОбъекта: Заимствованный']});
  }
  return {ownerRequirements:emitted.results[0].ownerRequirements,modules:[...emitted.modules,catalog.get('migration.metadata-base-identity')],factSources,cases};
}
