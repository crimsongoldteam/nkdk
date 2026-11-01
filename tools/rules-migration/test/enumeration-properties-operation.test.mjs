import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {yaml} from '../src/candidate-catalog.mjs';
import {enumerationPropertiesFragment} from '../src/enumeration-properties-operation.mjs';

test('enumeration properties mount the source-derived candidate under the XML owner root',()=>{
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 const source=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const result=enumerationPropertiesFragment(source);
 assert.equal(result.status,'candidate',result.reason);
 assert.equal(result.module.value.fields.length,16);
 assert.equal(result.module.inputs.component.type.scalar,'text');
 assert.equal(result.module.value.fields.find(field=>field.name==='explanation').type.with.preserveEmptyXML,true);
 assert.equal(result.module.presence.find(row=>row.target?.field==='defaultListForm').xml.empty,undefined);
 assert.deepEqual(result.module.representations.xml.fields[0].path,
  ['md:MetaDataObject','md:Enum','md:Properties','md:ObjectBelonging']);
 const changed=structuredClone(source);
 changed.properties.find(property=>property.name==='xmlRoot').parameters.container='OtherEnum';
 const updated=enumerationPropertiesFragment(changed);
 assert.equal(updated.status,'candidate',updated.reason);
 assert.equal(updated.module.representations.xml.fields[0].path[1],'md:OtherEnum');
 const fragments=yaml.load(readFileSync('rust/declarations/fragments/enumeration-properties.generated.yaml','utf8'));
 assert.ok(fragments.declarations.some(module=>module.id==='fragment.enumeration-properties'));
 assert.ok(existsSync('rust/declarations/objects/enumeration.generated.yaml'),'production enumeration declaration is missing');
 const production=yaml.load(readFileSync('rust/declarations/objects/enumeration.generated.yaml','utf8'));
 assert.equal(production.id,'metadata.enumeration');
 assert.equal(production.kind,'object');
 const joined=production;
 assert.equal(joined.imports.internal,'fragment.enumeration-internal-info');
 assert.equal(joined.imports.manager,'fragment.manager-module-resource');
 assert.equal(joined.imports.modules,'fragment.child-module-resources');
 assert.equal(joined.imports.commands,'fragment.enumeration-commands');
 assert.equal(joined.imports.values,'fragment.enumeration-values');
 assert.equal(joined.imports.standard,'fragment.enumeration-standard-attributes');
 const childNames=yaml.load(readFileSync('rust/declarations/objects/enumeration-child-names.generated.yaml','utf8'));
 assert.equal(childNames.id,'migration.enumeration-child-names');
 assert.equal(childNames.imports.part,'fragment.enumeration-child-names');
 assert.deepEqual(joined.compose.map(part=>part.use),
  ['internal','properties','names','manager','modules','commands','values','standard']);
 assert.equal(joined.representations.xml.kind,'with-attributes');
 assert.equal(joined.representations.xml.content.fields[0].attribute,'uuid');
 assert.equal(joined.representations.xml.attributes[0].value.text,'2.20');
 const routes=yaml.load(readFileSync('rust/operations/enumeration.routes.generated.yaml','utf8'));
 assert.deepEqual(routes.routes[0].owners,{cf:joined.id,cfe:joined.id});
 assert.deepEqual(routes.routes[0].inputs.commandNames.snapshot,{
  entry:'migration.enumeration-commands-identity-source',field:'commands',each:'name',default:[]});
 const directionalSources=Object.fromEntries(routes.routes[0].sources
  .filter(source=>source.factDirections)
  .map(source=>[source.entry,source.factDirections]));
 assert.deepEqual(directionalSources,{
  'migration.enumeration-values-identity-source':['yaml-to-xml'],
  'migration.enumeration-commands-identity-source':['yaml-to-xml'],
  'migration.enumeration-values-base-source':['xml-to-yaml'],
  'migration.enumeration-commands-base-source':['xml-to-yaml'],
 });
 const identities=yaml.load(readFileSync('rust/declarations/probes/enumeration-child-identities.generated.yaml','utf8'));
 for(const id of Object.keys(directionalSources)) {
  assert(identities.declarations.some(declaration=>declaration.id===id),`missing ${id}`);
 }
 assert.deepEqual(routes.routes[0].inputs.profiles.literal.map(row=>row.name),
  Object.keys(source.properties.find(property=>property.name==='standardAttributes').parameters.standartAttributeNames));
 assert(joined.representations.xml.content.fields.some(field=>field.field==='extendedConfigurationObject'));
 assert.equal(joined.inputs.baseIds.index,'metadata.base-identities');
 const fixture=JSON.parse(readFileSync('tests/migration/enumeration-properties.json','utf8'));
 assert.equal(fixture.entry,'metadata.enumeration');
 assert.deepEqual(fixture.coverage.pending,[]);
 assert.equal(fixture.coverage.assembled.length+fixture.coverage.pending.length,source.properties.length);
 assert.equal(fixture.ownerInternalTypes.length,3);
 assert.equal(fixture.ownerInternalTypes[0].name,'EnumRef.ПеречислениеВсеСвойства');
 assert(fixture.xml.includes('GeneratedType'));
 assert.match(fixture.xml,/<(?:\w+:)?Enum uuid="ec93e916-ecd7-45c4-8e73-ea76f186183c"/);
 assert.match(fixture.xml,/<(?:\w+:)?MetaDataObject[^>]+version="2.20"/);
 assert.match(fixture.xml,/<(?:\w+:)?Command uuid="3712df7a-2311-48bf-a14c-dd76417176c1"/);
 assert.match(fixture.xml,/<(?:\w+:)?EnumValue uuid="3422552b-50dd-46cf-88bd-163e75331ff9"/);
 assert.match(fixture.yaml,/Команды:\n  Команда1:/);
 assert.match(fixture.yaml,/Значения:\n  ЗначениеПеречисления1:/);
 assert.match(fixture.yaml,/СтандартныеРеквизиты:\n  Порядок:/);
 const extension=JSON.parse(readFileSync('tests/migration/enumeration-properties-extension.json','utf8'));
 assert.equal(extension.baseIdentity,fixture.ownerIdentity);
 assert.equal(extension.ownerForms.length,2);
 assert(extension.xml.includes('ExtendedConfigurationObject'));
 assert(extension.xml.includes('PropertyState'));
 assert(extension.yaml.includes('ОсновнаяФормаСписка: ""'));
 assert(extension.yaml.includes('МодульМенеджера'));
 const defaultOwner=JSON.parse(readFileSync('tests/migration/enumeration-properties-default.json','utf8'));
 const adoptedDefault=JSON.parse(readFileSync('tests/migration/enumeration-properties-default-extension.json','utf8'));
 assert.equal(defaultOwner.yaml,'');
 assert.equal(defaultOwner.inputs.ownerName,'ПеречислениеПоУмолчанию');
 assert.equal(adoptedDefault.baseIdentity,defaultOwner.ownerIdentity);
 assert.equal(adoptedDefault.yaml,'ПринадлежностьОбъекта: Заимствованный');
 const simple=JSON.parse(readFileSync('tests/migration/enumeration-properties-simple.json','utf8'));
 const ownFull=JSON.parse(readFileSync('tests/migration/enumeration-properties-full-own-extension.json','utf8'));
 assert.equal(simple.inputs.ownerName,'Перечисление1');
 assert.equal(ownFull.inputs.ownerName,'ПеречислениеВсеСвойстваExt');
 assert.equal(ownFull.baseIdentity,undefined);
 assert.deepEqual([simple,ownFull].map(row=>row.coverage.pending),[[],[]]);
 const internalCatalog=yaml.load(readFileSync('rust/declarations/fragments/enumeration-internal-info.generated.yaml','utf8'));
 const names=internalCatalog.declarations.find(module=>module.id==='enumeration.property-state-name');
 assert(names.value.variants.some(variant=>variant.name==='ManagerModule'));
 assert.equal(
  internalCatalog.declarations.find(module=>module.id==='fragment.enumeration-internal-info')
   .representations.yaml.fields.find(field=>field.field==='states').key,
  'Изменять');
 execFileSync(process.execPath,['tools/rules-migration/src/enumeration-properties-operation.mjs','--check']);
});
