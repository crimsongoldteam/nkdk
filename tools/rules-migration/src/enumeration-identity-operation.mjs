import {readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {ownIdentityDeclaration,internalTypeDeclaration} from './owner-creation-declarations.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {childIdentityCatalog} from './child-identity-declarations.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
loadSources(extraction.sourceHashes);
const owner=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
if(!owner?.shapeComplete)throw new Error('Complete enumeration source is required');
const property=type=>owner.properties.filter(row=>row.type===type);
const [root]=property('XMLRoot');
const [internal]=property('InternalInfo');
const name=owner.properties.find(row=>row.name==='name');
const uuid=owner.properties.find(row=>row.name==='uuid');
const children=[['enumValues','values','EnumValue'],['commands','commands','Command']].map(([name,field,kind])=>{
  const source=owner.properties.find(row=>row.name===name);
  if(source?.status!=='static-parameters' || source.parameters?.xml!==kind)
    throw new Error(`Unsupported enumeration child identity source: ${name}`);
  return {field,kind};
});
if(property('XMLRoot').length!==1 || property('InternalInfo').length!==1 ||
  root.status!=='static-parameters' || internal.status!=='static-parameters' ||
  root.parameters.container!=='Enum' || name?.parameters.xmlParents?.join('/')!=='Properties' ||
  uuid?.parameters.xml!=='_uuid' || !Array.isArray(internal.parameters.items))
  throw new Error('Unsupported enumeration identity source shape');
const namespace=root.parameters.rootAttributes._xmlns;
const own=ownIdentityDeclaration({
  id:'migration.enumeration-own-identity',namespace,xmlKind:root.parameters.container,
  yamlKind:'Перечисление',identityKind:'Enum',version:root.parameters.rootAttributes._version,
});
const template=yaml.load(readFileSync('rust/declarations/probes/document-internal-types.yaml','utf8'));
const fragment=yaml.load(readFileSync('rust/declarations/fragments/enumeration-internal-info.generated.yaml','utf8'))
  .declarations.find(module=>module.id==='fragment.enumeration-internal-info');
if(!fragment)throw new Error('Missing generated InternalInfo fragment');
const types=internalTypeDeclaration({template,fragment,id:'migration.enumeration-internal-types',
  identityKind:'Enum',yamlKind:'Перечисление',items:internal.parameters.items});
const extension=owner.properties.find(row=>row.name==='extendedConfigurationObject');
if(extension?.status!=='static-parameters' || extension.type!=='string' ||
   extension.parameters?.runtimeOnly!==true ||
   extension.parameters?.yaml!=='ОбъектРасширяемойКонфигурации')
  throw new Error('Unsupported enumeration base identity source');
const baseCatalog=yaml.load(readFileSync('rust/declarations/probes/defined-type-base-identity.generated.yaml','utf8'));
const base=structuredClone(baseCatalog.declarations.find(row=>row.id==='migration.defined-type-base-identity'));
if(!base || base.value.fields[0]?.name!=='base' ||
   base.imports.bases!=='migration.defined-type-base-values')
  throw new Error('Unsupported shared base identity declaration');
base.id='migration.enumeration-base-identity';
base.representations.xml.fields[0].path=[...sourceOwnerXmlRoute(owner),'md:Properties'];
base.contributions[0].key.record.identity.require.lookup.key.record.kind.literal='Enum';
const childCatalog=childIdentityCatalog({prefix:'enumeration',
  xmlRoute:sourceOwnerXmlRoute(owner),children});
for(const [path,declaration] of [
  ['rust/declarations/probes/enumeration-own-identity.generated.yaml',own],
  ['rust/declarations/probes/enumeration-internal-types.generated.yaml',types],
  ['rust/declarations/probes/enumeration-base-identity.generated.yaml',base],
  ['rust/declarations/probes/enumeration-child-identities.generated.yaml',childCatalog],
]) {
  const content=`# Generated from ${owner.path} by tools/rules-migration/src/enumeration-identity-operation.mjs\n${yaml.dump(declaration,{noRefs:true})}`;
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==content)throw new Error(`Stale generated declaration: ${path}`);
  } else writeFileSync(path,content);
}
