import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {ownIdentityDeclaration,internalTypeDeclaration} from './owner-creation-declarations.mjs';
import {childIdentityCatalog} from './child-identity-declarations.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
loadSources(extraction.sourceHashes);
const owner=extraction.entries.find(entry=>entry.symbol==='MetadataDocumentJournalRules');
if(!owner?.shapeComplete)throw new Error('Complete document journal source is required');
const byName=name=>owner.properties.find(row=>row.name===name);
const root=byName('xmlRoot'),internal=byName('internalInfo');
const uuid=byName('uuid'),name=byName('name');
if(root?.type!=='XMLRoot' || root.status!=='static-parameters' ||
  root.parameters?.container!=='DocumentJournal' ||
  internal?.type!=='InternalInfo' || internal.status!=='static-parameters' ||
  !Array.isArray(internal.parameters?.items) ||
  name?.parameters?.xmlParents?.join('/')!=='Properties' ||
  uuid?.parameters?.xml!=='_uuid')
  throw new Error('Unsupported document journal identity source');
const children=[['columns','Column'],['commands','Command']].map(([field,kind])=>{
  const source=byName(field);
  if(source?.status!=='static-parameters' || source.parameters?.xml!==kind ||
    source.parameters?.xmlParents?.join('/')!=='ChildObjects')
    throw new Error(`Unsupported document journal child source: ${field}`);
  return {field,kind};
});
const namespace=root.parameters.rootAttributes._xmlns;
const own=ownIdentityDeclaration({id:'migration.journal-own-identity',namespace,
  xmlKind:root.parameters.container,yamlKind:'ЖурналДокументов',
  identityKind:'DocumentJournal',version:root.parameters.rootAttributes._version});
const internalFragment=yaml.load(readFileSync('rust/declarations/fragments/journal-internal-info.yaml','utf8'));
if(internalFragment.id!=='fragment.journal-internal-info')
  throw new Error('Unsupported journal InternalInfo fragment');
const internalTypes=internalTypeDeclaration({
  template:yaml.load(readFileSync('rust/declarations/probes/document-internal-types.yaml','utf8')),
  fragment:internalFragment,id:'migration.journal-generated-types',
  identityKind:'DocumentJournal',yamlKind:'ЖурналДокументов',items:internal.parameters.items});
const extension=byName('extendedConfigurationObject');
if(extension?.status!=='static-parameters' || extension.type!=='string' ||
  extension.parameters?.runtimeOnly!==true ||
  extension.parameters?.yaml!=='ОбъектРасширяемойКонфигурации')
  throw new Error('Unsupported document journal base identity source');
const baseCatalog=yaml.load(readFileSync('rust/declarations/probes/defined-type-base-identity.generated.yaml','utf8'));
const base=structuredClone(baseCatalog.declarations.find(row=>row.id==='migration.defined-type-base-identity'));
if(!base || base.value.fields[0]?.name!=='base' ||
   base.imports.bases!=='migration.defined-type-base-values')
  throw new Error('Unsupported shared base identity declaration');
base.id='migration.journal-base-identity';
base.representations.xml.fields[0].path=[...sourceOwnerXmlRoute(owner),'md:Properties'];
base.contributions[0].key.record.identity.require.lookup.key.record.kind.literal='DocumentJournal';
const childCatalog=childIdentityCatalog({prefix:'journal',
  xmlRoute:sourceOwnerXmlRoute(owner),children});
const commands=childCatalog.declarations.find(row=>row.id==='migration.journal-commands-identity-source');
if(!commands || commands.contributions[0]?.index!=='metadata.own-identities')
  throw new Error('Command identity source changed');
commands.contributions.push({
  index:'metadata.path-children',forEach:{in:{field:'commands'},as:'row'},
  key:{record:{parent:{input:'ownerIdentity'},kind:{literal:'Command'},
    name:{get:{of:{var:'row'},field:'name'}}}},
  value:{get:{of:{var:'row'},field:'uuid'}},
});
for(const [path,declaration] of [
  ['rust/declarations/probes/journal-own-identity.generated.yaml',own],
  ['rust/declarations/probes/journal-generated-types.generated.yaml',internalTypes],
  ['rust/declarations/probes/journal-base-identity.generated.yaml',base],
  ['rust/declarations/probes/journal-child-identities.generated.yaml',childCatalog],
]) {
  const content=`# Generated from ${owner.path} by tools/rules-migration/src/journal-identity-operation.mjs\n${yaml.dump(declaration,{noRefs:true})}`;
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==content)
      throw new Error(`Stale generated declaration: ${path}`);
  } else if(!existsSync(path) || readFileSync(path,'utf8')!==content) writeFileSync(path,content);
}
