import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {loadSources} from './source-snapshot.mjs';
import {assembleRecordStateOwner} from './source-record-owner.mjs';
import {bindPreparedOwnerIndexes} from './owner-index-requirements.mjs';
import {recordOwnerFactSources,recordOwnerFactCollections} from './record-owner-fact-sources.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {sourceOwnerCollections} from './source-owner-collections.mjs';

// The source adapter supplies row context from checked composition bindings.
// Prepared base facts precede conversion; deriving adopted from the field's own
// YAML default would be circular. No converter callback is generated here.
export function recordOwnerCollectionItem(source,assembly,{keyField='name'}={}) {
 const owner=assembly.owner;
 const state=owner.compose.find(part=>owner.imports[part.use]===assembly.state.module.id);
 const input=(part,name)=>{
  const binding=part.bind?.[name];
  if(!binding || Object.keys(binding).length!==1 || !owner.inputs[binding.input])
   throw new Error(`Missing record context input: ${name}`);
  return binding.input;
 };
 if(!state)throw new Error('Missing record state composition');
 const bindings={};
 const bind=(name,expression)=>{
  if(bindings[name] && JSON.stringify(bindings[name])!==JSON.stringify(expression))
   throw new Error(`Conflicting row context: ${name}`);
  bindings[name]=expression;
 };
 bind(input(state,'owner'),{field:'uuid'});
 bind(input(state,'adopted'),{present:{lookup:{in:{input:input(state,'baseIds')},
  key:{record:{component:{input:input(state,'component')},identity:{field:'uuid'}}}}}});
 const root=sourceOwnerXmlRoute(source);
 if(root.length!==1)throw new Error('Record collection item requires a child registration');
 for(const part of owner.compose) {
  for(const name of ['ownerName','name'])if(part.bind?.[name])bind(input(part,name),{field:keyField});
  if(part.bind?.kind)bind(input(part,'kind'),{literal:root[0].split(':').at(-1)});
 }
 return {id:owner.id,bindings};
}

export function recordOwnerOperation(extraction,catalog,{symbol,id,xmlNamespace}) {
 const source=extraction.entries.find(row=>row.symbol===symbol);
 if(!source)throw new Error(`Missing record owner registration: ${symbol}`);
 const assembly=assembleRecordStateOwner(source,catalog,{id,xmlNamespace});
 if(assembly.coverage.pending.length || assembly.coverage.assembled.length!==source.properties.length)
  throw new Error(`Incomplete record owner: ${symbol}`);
 const nested=assembly.owner;
 assembly.owner=bindPreparedOwnerIndexes(nested,assembly.indexRequirements);
 assembly.modules=assembly.modules.map(module=>module===nested?assembly.owner:module);
 assembly.factSources=recordOwnerFactSources(source,assembly,catalog);
 assembly.modules.push(...assembly.factSources);
 return assembly;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const path='rust/declarations/candidates/catalog-attribute-owner.generated.yaml';
 const sourcesPath='rust/declarations/objects/catalog-attribute-sources.generated.yaml';
 const collectionsPath='rust/declarations/candidates/catalog-attribute-collections.generated.yaml';
 const {catalog}=candidateCatalog({excludePaths:[path,sourcesPath,collectionsPath]});
 const result=recordOwnerOperation(extraction,catalog,{symbol:'MetadataCatalogAttributeRules',
  id:'metadata.catalog-attribute',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
 const source=extraction.entries.find(row=>row.symbol==='MetadataCatalogAttributeRules');
 const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
 const edges=graph.edges.filter(edge=>edge.item.symbol===source.symbol);
 if(!edges.length)throw new Error('Missing record owner collection registration');
 const fileFacts=edges.map(edge=>recordOwnerFactCollections(source,result,{
  edge,catalog,parent:extraction.entries.find(row=>row.symbol===edge.owner.symbol),
  id:`${result.owner.id}.file-facts.${edge.owner.symbol}`,
 }));
 const local=new Map([...catalog,...result.modules.map(module=>[module.id,module])]);
 const descriptor=recordOwnerCollectionItem(source,result);
 const collections=edges.map(edge=>({edge,result:sourceOwnerCollections(
  extraction.entries.find(row=>row.symbol===edge.owner.symbol),extraction,local,graph,{
   id:`${result.owner.id}.collection.${edge.owner.symbol}`,properties:[edge.property],
   composedItems:{[edge.property]:descriptor},
  })}));

 const outputs=[
  [path,'# Generated from rules.ts by record-owner-operation.mjs; working attachment pending\n'+
   yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:result.modules.filter(row=>!catalog.has(row.id)&&!result.factSources.includes(row)).map(row=>({format:'nkdk-declarations/1',...row}))},{noRefs:true})],
  [sourcesPath,'# Generated independent fact readers from rules.ts by record-owner-operation.mjs\n'+
   yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[...result.factSources,...fileFacts.flatMap(result=>result.modules)]},{noRefs:true})],
  [collectionsPath,'# Generated collection attachments from rules.ts; full file conversion acceptance pending\n'+
   yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:collections.flatMap(row=>row.result.modules)},{noRefs:true})],
  ['tests/migration/catalog-attribute-owner-coverage.json',JSON.stringify({...result.coverage,
   indexRequirements:result.indexRequirements,fileFactSources:fileFacts.flatMap(result=>result.entries.map(module=>module.id)),
   collections:collections.map(({edge,result})=>({owner:edge.owner.symbol,property:edge.property,
    fragment:result.attachments[0].module.id,probe:`${result.attachments[0].module.id}.probe`,
    indexProviders:result.attachments[0].indexProviders}))},null,2)+'\n'],
 ];
 for(const [output,content] of outputs) {
  if(process.argv.includes('--check')) {
   if(!existsSync(output)||readFileSync(output,'utf8')!==content)throw new Error('Stale record owner: '+output);
  } else if(!existsSync(output)||readFileSync(output,'utf8')!==content)writeFileSync(output,content);
 }
}
