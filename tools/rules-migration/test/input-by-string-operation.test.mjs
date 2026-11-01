import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';
import {inputByStringOperation} from '../src/input-by-string-operation.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';
import {emitCandidates} from '../src/emit.mjs';
import {reviewedPropertyExpression} from '../src/reviewed-property-expressions.mjs';

test('all source InputByStringFields owners reuse the declared field paths and defaults',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const source=extraction.entries.filter(entry=>entry.properties?.some(property=>
    property.type==='InputByStringFields'));
  const {modules,cases,factSources,production}=inputByStringOperation();
  assert.equal(modules.filter(module=>!module.id.startsWith('candidate.member-source.')).length,source.length*6);
  assert.equal(new Set(modules.map(module=>module.id)).size,modules.length);
  assert.equal(modules.filter(module=>module.contributions?.some(row=>row.index==='metadata.input-by-string-members')).length,source.length*4+19);
  assert.equal(cases.length,source.length*8+29);
  for(const module of modules.filter(item=>item.id.startsWith('candidate.input-by-string.'))){
    const fragment=modules.find(item=>item.id===module.imports?.part);
    assert.equal(fragment?.kind,'fragment',module.id);
    assert.equal(module.compose?.[0]?.use,'part',module.id);
    const owner=source.find(entry=>entry.properties.some(property=>
      property.type==='InputByStringFields' && module.id.endsWith(
        entry.properties.find(row=>row.type==='XMLRoot').parameters.container.toLowerCase())));
    assert.ok(owner,module.id);
    const standard=owner.properties.find(property=>property.type==='InputByStringFields').parameters.standardFields;
    for(const rule of fragment.presence.filter(item=>!['InputByString','history'].includes(item.target.field))){
      assert.deepEqual(rule.yaml.default.if,{input:'adopted'});
      assert.deepEqual(rule.yaml.default.then,{absent:true});
    }
    const declared=fragment.presence.find(item=>item.target.field==='InputByString').yaml.default;
    const text=JSON.stringify(declared);
    for(const field of standard)assert(text.includes(field.yaml),`${module.id}: ${field.yaml}`);
    assert.equal(fragment.value.fields.find(field=>field.name==='InputByString')?.type.use,'fields');
    assert.equal(fragment.inputs.adopted?.type?.scalar,'boolean');
    assert.equal(fragment.inputs.members?.type?.kind,'index',module.id);
    assert.equal(module.inputs.members?.index,'metadata.input-by-string-members',module.id);
    const e2e=cases.find(item=>item.entry===module.id);
    assert.ok(e2e?.xml.includes('InputByString')&&typeof e2e.yaml==='string',module.id);
    assert.equal(e2e.factBindings?.members,'metadata.input-by-string-members',module.id);
    assert.equal(e2e.factBindings?.states,'metadata.property-state-membership',module.id);
    assert.equal(fragment.imports.number,'common.stateful-number',module.id);
    if(owner.symbol==='MetadataChartOfAccountsRules') {
      for(const field of ['MaxExtDimensionCount','OrderLength']) {
        assert(fragment.value.fields.some(row=>row.name===field),`Missing numeric property ${field}`);
        assert(fragment.constraints.some(row=>row.id===`base-present-${field}`));
      }
    }
    assert.equal(module.inputs.baseNumbers.index,'metadata.base-owner-numbers');
    assert(fragment.constraints.some(rule=>rule.id.startsWith('base-value-')&&rule.diagnostic.severity==='warning'));
    assert(e2e.factBindings.baseNumbers==='metadata.base-owner-numbers');
    const composed=modules.find(item=>item.id===module.id.replace('candidate.input-by-string.',
      'candidate.')+'-name-and-input');
    assert.equal(composed?.compose?.length,2,module.id);
    assert.ok(cases.some(item=>item.entry===composed.id&&item.id.endsWith('-composed-cf')),module.id);
    const defaultCase=cases.find(item=>item.id===`e2e-input-by-string-${module.id.split('.').at(-1)}-default`);
    assert.ok(defaultCase&&!defaultCase.yaml.includes('ВводПоСтроке:')&&
      defaultCase.rejectedYAML?.[0].includes('ВводПоСтроке:'),module.id);
    for(const field of standard)assert(defaultCase.rejectedYAML[0].includes(`  - ${field.yaml}`),module.id);
  }
  const generated=['candidates/input-by-string.generated.yaml','objects/input-by-string-members-0.generated.yaml','objects/input-by-string-members-1.generated.yaml','common/input-by-string-member-views.generated.yaml',...Array.from({length:4},(_,part)=>`objects/input-by-string-consumers-${part}.generated.yaml`),'fragments/input-by-string-consumers.generated.yaml'].flatMap(path=>yaml.load(readFileSync('rust/declarations/'+path,'utf8')).declarations);
  assert.deepEqual(generated.toSorted((a,b)=>a.id.localeCompare(b.id)),[...modules,...production.identities,...production.numbers].toSorted((a,b)=>a.id.localeCompare(b.id)));
  assert(cases.find(item=>item.id==='e2e-input-by-string-document-invalid-length')?.xml.includes('>oops<'));
  const invalidCase=cases.find(item=>item.id==='e2e-input-by-string-catalog-invalid-field');
  assert.equal(invalidCase?.annotation,'ВводПоСтроке: !xml/raw');
  const missingMember=cases.find(item=>item.id==='e2e-input-by-string-catalog-missing-member');
  assert.equal(missingMember?.annotation,'ВводПоСтроке: !xml/invalid');
  assert.ok(missingMember?.xml.includes('.Attribute.ОтсутствующийРеквизит'));
  const unsupportedStandard=cases.find(item=>item.id==='e2e-input-by-string-catalog-unsupported-standard');
  assert.equal(unsupportedStandard?.annotation,'ВводПоСтроке: !xml/invalid');
  const wrongKind=cases.find(item=>item.id==='e2e-input-by-string-catalog-wrong-member-kind');
  assert.equal(wrongKind?.annotation,'ВводПоСтроке: !xml/invalid');
  assert.ok(wrongKind?.xml.includes('.Form.СтроковыйРеквизитСИндексом'));
  for(const item of cases){
    assert.equal(item.inputs.memberNames,undefined,item.id);
    assert.ok(typeof item.inputs.component==='string'&&typeof item.inputs.owner==='string',item.id);
    const source=factSources.find(source=>source.id===item.factSourceEntries[0]);
    if(source.xml!==undefined)assert.equal(source.xml,readFileSync(item.source[0].path,'utf8'),item.id);
    else assert.equal(typeof source.yaml,'string',item.id);
    assert.equal(source.inputs.owner,item.inputs.owner,item.id);
    assert.equal(source.inputs.component,item.inputs.component,item.id);
    if(item.factBindings.states){
      const states=item.factSourceEntries.map(id=>factSources.find(source=>source.id===id)).filter(source=>source.entry.startsWith('candidate.input-by-string-states.'));
      assert.equal(states.length,1,item.id);
      assert.equal(states[0].inputs.owner,item.inputs.owner,item.id);
      if(item.id.endsWith('-notify')||item.id.endsWith('-controlled-default')||item.id.includes('-base-'))assert.equal(states[0].xml,item.xml,item.id);
      else assert.equal(states[0].xml,source.xml??readFileSync(item.source[0].path,'utf8'),item.id);
      assert(!item.adaptation?.includes('PropertyState is outside'),item.id);
    }
  }
  for(const root of ['businessprocess','catalog','chartofaccounts','chartofcalculationtypes',
    'chartofcharacteristictypes','document','exchangeplan','task']){
    const extension=cases.find(item=>item.id===`e2e-input-by-string-${root}-adopted-cfe`);
    assert.ok(extension,`Missing adopted extension ${root}`);
    const own=cases.find(item=>item.id===`e2e-input-by-string-${root}-own-cfe`);
    assert.ok(own,`Missing own extension ${root}`);
    assert.equal(own.inputs.adopted,false);
    assert.equal(own.factSourceEntries.length,3);
    assert.equal(extension.inputs.adopted,true);
    assert.equal(extension.factSourceEntries.length,4);
    assert.ok(extension.source.some(item=>item.path.startsWith('e2e/fixtures/xml/cf/')),
      `Missing UUID-selected base evidence ${root}`);
  }
  const inherited=cases.find(item=>item.id==='e2e-input-by-string-inherited-valid');
  const inheritedSources=inherited.factSourceEntries.map(id=>factSources.find(source=>source.id===id));
  assert.equal(inheritedSources.length,2);
  assert(!inheritedSources[0].xml.includes('<Name>РеквизитПоУмолчанию</Name>'));
  assert(inheritedSources[1].xml.includes('<Name>РеквизитПоУмолчанию</Name>'));
  assert.equal(inheritedSources[1].xml,readFileSync('e2e/fixtures/xml/cf/DataProcessors/ОбработкаВсеСвойства.xml','utf8'));
  const inheritedProvider=modules.find(module=>module.id===inheritedSources[1].entry);
  assert.equal(inheritedProvider.inputs.localMembers.index,'metadata.input-by-string-local-members');
  assert.deepEqual(inheritedProvider.contributions[0].when.match.value.lookup.key,
    inheritedProvider.contributions[0].key);
  assert.equal(cases.find(item=>item.id==='e2e-input-by-string-catalog-adopted-cfe').factSourceEntries.length,4);
  const storage=cases.find(item=>item.id==='e2e-input-by-string-document-ineligible-type');
  assert.equal(storage?.annotation,'ВводПоСтроке: !xml/invalid');
  assert.ok(storage?.xml.includes('.Attribute.ПолныйРеквизит'));
  const providers=modules.filter(module=>module.contributions?.[0]?.value?.get?.field==='indexedName');
  assert.equal(providers.length,source.length*4+19);
  for(const provider of providers){
    const collectionPresence=provider.presence.find(rule=>rule.target.field===provider.value.fields[0].name);
    assert.deepEqual(collectionPresence.yaml.missing.denotes,{sequence:[]});
    assert.deepEqual(collectionPresence.xml.missing.denotes,{sequence:[]});
    assert.equal(provider.contributions[0].value.get.field,'indexedName');
    const list=modules.find(module=>module.id===provider.imports.items);
    const row=modules.find(module=>module.id===list.imports.item);
    const view=modules.find(module=>module.id===row.imports.source_type);
    assert.ok(view?.id.startsWith('candidate.member-source.view.'));
    assert.ok(view.value.fields.some(field=>field.name==='compatible'));
    if(view.representations.yaml.kind==='projection'){
      assert.equal(view.imports.items,'candidate.member-source.primary-type-items');
      assert.deepEqual(view.value.fields.map(field=>field.name),['items','compatible']);
    }else{
      assert.equal(view.imports.description,'common.type-description');
      assert.ok(view.representations.xml.fields.some(field=>field.path[0]==='xr:CheckValue'));
    }
    assert.ok(row.presence.some(rule=>rule.target.field==='indexedName'));
  }
  const extendedType=cases.find(item=>item.id==='e2e-input-by-string-catalog-adopted-scalar-types');
  assert.ok(extendedType?.yaml.includes('Реквизит.РеквизитСправочника'));
  assert.equal(extendedType.noRaw,false);
  assert.match(extendedType.xml,/<(?:[\w.-]+:)?InternalInfo\s*\/>/);
  assert.ok(extendedType.yaml.includes('InternalInfo: !xml/raw\n  $xml: ""'));
  const extendedReference=cases.find(item=>item.id==='e2e-input-by-string-catalog-adopted-reference-type');
  assert.equal(extendedReference?.annotation,'ВводПоСтроке: !xml/invalid');
  const mixedLength=cases.find(item=>item.id==='e2e-input-by-string-catalog-one-zero-length');
  assert.ok(mixedLength?.xml.includes('<ns0:CodeLength>0</ns0:CodeLength>'));
  assert.ok(mixedLength?.rejectedYAML?.[0].includes('  - СтандартныйРеквизит.Наименование\n'));
  assert.ok(!mixedLength?.rejectedYAML?.[0].includes('  - СтандартныйРеквизит.Код\n'));
  const adopted=cases.find(item=>item.id==='e2e-input-by-string-catalog-adopted-cfe');
  assert.equal(adopted?.inputs.adopted,true);
  assert.ok(adopted?.xml&&!adopted.xml.includes('InputByString'));
  const own=cases.find(item=>item.id==='e2e-input-by-string-catalog-own-cfe');
  assert.equal(own?.inputs.adopted,false);
  assert.ok(own?.xml.includes('InputByString'));
});

test('all eight owners declare the same source-derived Name default',()=>{
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const owners=extraction.entries.filter(entry=>entry.properties?.some(property=>
    property.type==='InputByStringFields'));
  const catalog=candidateCatalog().catalog;
  for(const owner of owners){
    const name=owner.properties.find(property=>property.name==='name');
    const emitted=emitCandidates([{...owner,properties:[name],
      comparison:{status:'keys-match'},propertyStates:[],xmlOrder:{status:'absent'}}],catalog);
    assert.equal(emitted.entries[0].properties[0].status,'candidate',owner.symbol);
  }
});

test('source Name callback recognition rejects altered expressions',()=>{
  const unresolved=expression=>({$unresolved:{kind:'expression',source:{path:'owner/rules.ts',line:1},
    sourceHash:'fixture',expression}});
  assert.equal(reviewedPropertyExpression('defaultValue',
    unresolved('({ name }: { name?: string }) => name'))?.kind,'owner-name-default');
  for(const expression of ['({ name }) => name + "suffix"','({ name, other }) => name',
    '({ name }) => other',''])
    assert.equal(reviewedPropertyExpression('defaultValue',unresolved(expression)),undefined);
});

test('numeric state assembly also connects owners without InputByString',async()=>{
  const {numericOwnerOperation}=await import('../src/numeric-owner-operation.mjs');
  const {modules,cases,factSources}=numericOwnerOperation();
  assert.equal(cases.length,26);
  for(const [root,field] of [['accountingregister','PeriodAdjustmentLength'],['documentnumerator','NumberLength']]) {
    const fragment=modules.find(row=>row.id===`fragment.owner-numbers.${root}`);
    assert(fragment.value.fields.some(row=>row.name===field));
    assert(!fragment.value.fields.some(row=>row.name==='InputByString'));
    assert(fragment.constraints.some(row=>row.id===`base-present-${field}`));
    if(root==='documentnumerator') {
      assert(fragment.constraints.some(row=>row.diagnostic.code==='number.maximum'));
      assert(cases.find(row=>row.id===`e2e-owner-numbers-${root}-cf`).rejectedYAML[0].includes('51'));
      assert(fragment.value.fields.some(row=>row.name==='NumberType'));
      for(const field of ['NumberAllowedLength','NumberPeriodicity','CheckUnique'])
        assert(fragment.value.fields.some(row=>row.name===field),field);

      const conditional=fragment.constraints.find(row=>row.id==='numberLength-maximum-when');
      assert.deepEqual(conditional.when.and[1].else.if,{input:'adopted'});
      assert.deepEqual(conditional.when.and[1].else.else,{literal:false});
      const original=cases.find(row=>row.id===`e2e-owner-numbers-${root}-cf`);
      assert(original.rejectedYAML.some(row=>row.includes('ДлинаНомера: 39')));
      assert(original.acceptedYAML.some(row=>row.includes('ТипНомера: Строка')&&row.includes('ДлинаНомера: 50')));
      const adopted=cases.find(row=>row.id===`e2e-owner-numbers-${root}-adopted`);
      const complete=cases.find(row=>row.id===adopted.id+'-complete');
      const baseValues=factSources.find(row=>row.id===complete.id+'-base-values');
      assert.notEqual(baseValues.inputs.owner,complete.inputs.owner);
      assert(complete.factSourceEntries.includes(baseValues.id));
      assert(adopted.validationContexts.some(row=>row.inputs.compatibilityMode==='Version8_3_14'&&row.codes.includes('state.mode.unavailable')));
      assert(adopted.source.some(row=>row.path==='e2e/fixtures/xml/cfe/all-extension/Configuration.xml'));
      assert.equal(adopted.inputs.compatibilityMode,'Version8_3_27');
      const missingSelector=cases.find(row=>row.id===`e2e-owner-numbers-${root}-missing-base-selector`);
      assert.deepEqual(missingSelector.validationContexts[0].codes,['base.context.missing']);
      assert(!missingSelector.validationContexts[0].yaml.includes('ТипНомера:'));
      assert(cases.find(row=>row.id===missingSelector.id+'-xml').annotation.endsWith('!xml/raw'));



    }
    assert(cases.some(row=>row.id===`e2e-owner-numbers-${root}-adopted` && row.inputs.adopted));
    const own=cases.find(row=>row.id===`e2e-owner-numbers-${root}-own`);
    assert(own.validationContexts.length>=2);
    if(root==='documentnumerator')for(const label of ['ДопустимаяДлинаНомера','ПериодичностьНомера','КонтрольУникальности'])
      assert(own.validationContexts.some(row=>row.yaml.includes(`${label}: !проверять`)),label);
    assert(own.validationContexts.every(row=>row.codes.join()==='state.mode.unavailable'));
    const missing=cases.find(row=>row.id===`e2e-owner-numbers-${root}-missing-base-property`);
    assert.equal(missing.yaml,undefined);
    assert(missing.annotation.endsWith('!xml/raw'));
    assert.deepEqual(missing.validationContexts[0].codes,['base.property.missing']);
    const base=factSources.find(row=>row.id===missing.factSourceEntries[1]);
    assert(!base.xml.includes(`<${field}>`));
    assert(base.xml.includes('<Properties>'));

  }
  assert.equal(factSources.length,33);
});

test('every CF owner accepts member facts from its current primary YAML',()=>{
 const {cases,factSources}=inputByStringOperation();
 const primary=cases.filter(item=>item.id.endsWith('-cf-current-yaml-members'));
 assert.equal(primary.length,8);
 for(const item of primary) {
  const source=factSources.find(source=>source.id===item.factSourceEntries[0]);
  assert.equal(source.xml,undefined,item.id);
  assert.equal(typeof source.yaml,'string',item.id);
  assert(source.yaml.includes('Реквизиты:'),item.id);
  assert.equal(source.inputs.owner,item.inputs.owner,item.id);
 }
});

 test('current extension member facts use both primary YAML sources with their declared tags',()=>{
  const {cases,factSources}=inputByStringOperation();
  const current=cases.filter(item=>item.id.endsWith('-cfe-current-yaml-members'));
  assert.equal(current.length,16);
  for(const item of current){
    const members=item.factSourceEntries.map(id=>factSources.find(source=>source.id===id))
      .filter(source=>source.entry.startsWith('candidate.member-source.'));
    assert.equal(members.length,item.inputs.adopted?2:1,item.id);
    for(const source of members){
      assert.equal(source.xml,undefined,item.id);
      assert.equal(typeof source.yaml,'string',item.id);
    }
  }
  const catalog=current.find(item=>item.id.includes('catalog-adopted'));
  const local=factSources.find(source=>source.id===catalog.factSourceEntries[0]);
  assert(local.yaml.includes('!изменять Булево'));
 });

test('current member source production partition owns one dependency closure without owner conversions',()=>{
  const {modules,factSources,production}=inputByStringOperation();
  const required=new Set(factSources.filter(source=>source.yaml!==undefined&&source.xml===undefined).map(source=>source.entry));
  assert.equal(required.size,24);
  assert.deepEqual(new Set(production.roots.map(module=>module.id)),required);
  const own=new Set(modules.map(module=>module.id));
  const accepted=new Set([...production.roots,...production.values].map(module=>module.id));
  assert.equal(accepted.size,production.roots.length+production.values.length);
  assert(production.roots.every(module=>module.kind==='object'&&module.contributions?.length));
  assert(production.values.every(module=>module.kind==='value'));
  for(const module of [...production.roots,...production.values])
    for(const id of Object.values(module.imports??{}))assert(!own.has(id)||accepted.has(id),`${module.id}: ${id}`);
  assert(![...accepted].some(id=>id.startsWith('candidate.input-by-string.')));
});


test('eight member source routes derive identity and overlay scope without a full owner converter',()=>{
 const {production}=inputByStringOperation();
 assert.equal(production.identities?.length,8);
 assert.equal(production.routes?.format,'nkdk-operation-routes/1');
 assert.deepEqual(production.routes.routes,[]);
 const expected=[['BusinessProcesses','БизнесПроцесс','BusinessProcess'],
  ['Catalogs','Справочник','Catalog'],['ChartsOfAccounts','ПланСчетов','ChartOfAccounts'],
  ['ChartsOfCalculationTypes','ПланВидовРасчета','ChartOfCalculationTypes'],
  ['ChartsOfCharacteristicTypes','ПланВидовХарактеристик','ChartOfCharacteristicTypes'],
  ['Documents','Документ','Document'],['ExchangePlans','ПланОбмена','ExchangePlan'],['Tasks','Задача','Task']];
 assert.equal(production.routes.factRoutes.length,56);
 for(const [xmlDir,yamlDir,root] of expected){
  const routes=production.routes.factRoutes.filter(route=>route.xmlDir===xmlDir);
  assert.equal(routes.length,7,root);
  const saved=routes.find(route=>production.identities.some(identity=>identity.id===route.entry));
  const identity=production.identities.find(module=>module.id===saved.entry);
  assert(identity,root);
  assert.deepEqual(identity.representations.xml.attributes,[{name:'version',value:{text:'2.20'}}]);
  assert.deepEqual(identity.representations.xml.content.fields.find(field=>field.field==='identity').path,
   ['md:MetaDataObject',`md:${root}`]);
  assert.equal(identity.representations.xml.content.fields.find(field=>field.field==='identity').attribute,'uuid');
  assert.deepEqual(identity.representations.xml.content.fields.find(field=>field.field==='baseIdentity').path,
   ['md:MetaDataObject',`md:${root}`,'md:Properties','md:ExtendedConfigurationObject']);
  assert.equal(identity.contributions,undefined,'Retained identity must not duplicate global root contributions');
  for(const route of routes.filter(route=>production.roots.some(source=>source.id===route.entry))){
   assert.equal(route.yamlDir,yamlDir,root);
   assert.equal(route.yamlFile,'Свойства.yaml');
   assert.deepEqual(route.inputs.component,'component');
   assert.deepEqual(route.inputs.owner,{snapshot:{entry:saved.entry,field:'Идентификатор',storage:'external'}});
   assert(production.roots.some(module=>module.id===route.entry));
  }
  const current=routes.filter(route=>production.roots.some(source=>source.id===route.entry));
  assert.equal(current.filter(route=>route.only[0]==='cf').length,1);
  assert.equal(current.filter(route=>route.only[0]==='cfe').length,2);
  const base=current.find(route=>route.baseSource);
  const baseProvider=production.roots.find(module=>module.id===base.entry);
  assert.equal(baseProvider.inputs.localMembers.index,'metadata.input-by-string-local-members');
  const local=current.find(route=>route.only[0]==='cfe'&&!route.baseSource);
  assert(production.roots.find(module=>module.id===local.entry).contributions.some(row=>
    row.index==='metadata.input-by-string-local-members'));
  assert.deepEqual(base.only,['cfe']);
  assert.deepEqual(base.baseSource,{component:'cf',entry:saved.entry,field:'Идентификатор',
   key:{snapshot:{entry:saved.entry,field:'ИдентификаторОсновнойКонфигурации',storage:'external',default:''}}});
  assert.equal(base.fromBase,undefined);
 }
});

test('eight numeric state sources share current retained identity on import and export',()=>{
 const {production}=inputByStringOperation();
 assert.equal(production.states?.length,8);
 for(const state of production.states){
  const route=production.routes.factRoutes.find(route=>route.entry===state.id);
  assert.deepEqual(route.factDirections,['xml-to-yaml','yaml-to-xml']);
  assert.equal(route.yamlDir,undefined,'States retain XML presence rather than projecting current primary YAML');
  const provider=production.identities.find(identity=>identity.id===route.inputs.owner.snapshot.entry);
  assert(provider);
  assert.deepEqual(route.inputs.owner.snapshot,{entry:provider.id,field:'Идентификатор',storage:'external'});
  assert.deepEqual(Object.keys(route.inputs),['owner']);
  assert.equal(state.contributions[0].index,'metadata.property-state-membership');
  assert.equal(state.contributions[0].duplicates,'coalesce-equal');
  assert.equal(state.imports.rows,'common.property-states');
 }
});

test('current numeric base sources derive primary scalar names and join by base UUID',()=>{
 const {production}=inputByStringOperation();
 assert.equal(production.numbers?.length,8);
 for(const source of production.numbers){
  const routes=production.routes.factRoutes.filter(route=>route.entry===source.id);
  assert.equal(routes.length,2);
  const own=routes.find(route=>route.only[0]==='cf');
  const base=routes.find(route=>route.only[0]==='cfe');
  assert(own && base);
  for(const route of routes){
   assert.deepEqual(route.factDirections,['yaml-to-xml']);
   assert.equal(route.yamlFile,'Свойства.yaml');
   assert.deepEqual(Object.keys(route.inputs),['owner']);
   assert.equal(route.inputs.owner.snapshot.storage,'external');
  }
  assert.equal(base.baseSource.component,'cf');
  assert.equal(base.baseSource.field,'Идентификатор');
  assert.equal(base.baseSource.key.snapshot.field,'ИдентификаторОсновнойКонфигурации');
  assert.equal(base.baseSource.key.snapshot.default,'');
  assert.equal(own.baseSource,undefined);
  assert(source.representations.yaml.fields.every(field=>field.key!==field.field));
  assert(source.presence.every(row=>Object.hasOwn(row.yaml.missing.denotes,'literal')));
 }
});

test('all eight consumer roots share their original fragments in bounded working partitions',()=>{
 const {production}=inputByStringOperation();
 assert.equal(production.consumers?.length,8);
 assert.equal(production.fragments?.length,8);
 for(const consumer of production.consumers){
  assert.equal(consumer.kind,'object');
  assert.equal(consumer.compose.length,1);
  const fragment=production.fragments.find(fragment=>fragment.id===consumer.imports.part);
  assert(fragment);
  assert.equal(fragment.imports.fields,'common.owner-checked-metadata-fields');
  assert.equal(consumer.inputs.members.index,'metadata.input-by-string-members');
  assert.equal(consumer.inputs.states.index,'metadata.property-state-membership');
  assert.equal(consumer.inputs.baseNumbers.index,'metadata.base-owner-numbers');
 }
});


test('working contracts retain current YAML source cases and use only accepted fact sources',()=>{
 const {cases,factSources,production}=inputByStringOperation();
 assert.equal(production.composedConsumers.length,8);
 assert.equal(production.nameFragments.length,8);
 assert.equal(production.working.cases.length,31);
 const sourceById=new Map(factSources.map(source=>[source.id,source]));
 const accepted=new Set([...production.roots,...production.states,...production.numbers].map(module=>module.id));
 const expected=cases.filter(item=>!item.entry.startsWith('candidate.member-source.probe.') && item.factSourceEntries.every(id=>{const source=sourceById.get(id);return source.xml===undefined || accepted.has(source.entry) || source.entry.startsWith('candidate.input-by-string-base-numbers.');}));
 assert.deepEqual(production.working.cases,expected);
 const ids=new Set([...production.roots,...production.states,...production.numbers].map(module=>module.id));
 const selected=new Set(expected.flatMap(item=>item.factSourceEntries));
 assert.deepEqual(new Set(production.working.factSources.map(source=>source.id)),selected);
 for(const source of production.working.factSources){
  assert(ids.has(source.entry),source.entry);
  const original=factSources.find(original=>original.id===source.id);
  assert.deepEqual({...source,entry:original.entry},original,'Source data and inputs must not change during working entry binding');
 }
});
