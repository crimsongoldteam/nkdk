import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml} from './candidate-catalog.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {loadSources} from './source-snapshot.mjs';

const text={kind:'scalar',scalar:'text'};
const target={kind:'member',owner:'this',memberKinds:['Form'],objectRoots:['CommonForm']};
const formLink=property=>property.parameters?.type==='MetadataItemLink' &&
  JSON.stringify(property.parameters.metadataTarget)===JSON.stringify(target);

export function ownerFormLinksFragment(source,id) {
 const fail=reason=>({status:'blocked',reason});
 if(!source?.properties || typeof id!=='string' || !id)return fail('form-links-owner-required');
 const properties=source.properties.filter(formLink);
 if(!properties.length || new Set(properties.map(property=>property.name)).size!==properties.length)
   return fail('form-links-properties-required');
 let route;
 try{route=sourceOwnerXmlRoute(source)}catch{return fail('form-links-root-required')}
 const fields=[];
 for(const property of properties) {
  const p=property.parameters;
  if(property.status!=='static-parameters' ||
    JSON.stringify(p.xmlParents)!=='["Properties"]' || p.defaultValueXMLRaw!=='' ||
    typeof p.yaml!=='string' || !p.yaml ||
    Object.keys(p).some(key=>!['type','metadataTarget','yaml','xmlParents','defaultValueXMLRaw'].includes(key)) ||
    !/^[a-z][A-Za-z0-9]*$/.test(property.name))return fail(`form-links-profile:${property.name}`);
  fields.push({name:property.name,xml:property.name[0].toUpperCase()+property.name.slice(1),yaml:p.yaml});
 }
 const module={format:'nkdk-declarations/1',kind:'fragment',id,
  imports:{link:'common.owner-or-common-form-link',rootKind:'common.path-root'},
  namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
  inputs:{ownerPath:{type:text},forms:{type:{kind:'sequence',item:text}},roots:{type:{kind:'index',
   key:{kind:'record',fields:[{name:'kind',type:{use:'rootKind'}},{name:'name',type:text}]},value:text}}},
  value:{kind:'record',fields:fields.map(field=>({name:field.name,type:{use:'link',bind:{owner:{input:'ownerPath'},forms:{input:'forms'},roots:{input:'roots'}}}}))},
  representations:{xml:{kind:'record',fields:fields.map(field=>({field:field.name,path:[...route,'md:Properties',`md:${field.xml}`]}))},
   yaml:{kind:'mapping',fields:fields.map(field=>({field:field.name,key:field.yaml}))}},
  presence:fields.map(field=>({target:{field:field.name},xml:{missing:{denotes:{absent:true}},
   empty:[{form:'empty-element',denotes:{absent:true}}],
   canonical:[{when:{not:{present:{field:field.name}}},form:'empty-element'}]},
   yaml:{missing:{denotes:{absent:true}}}})),
 };
 return {status:'candidate',module};
}

function main() {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const owner=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const result=ownerFormLinksFragment(owner,'fragment.enumeration-form-links');
 if(result.status!=='candidate')throw new Error(`Enumeration form links: ${result.reason}`);
 const probe=composeOwnerFragments('migration.enumeration-form-links',[{
  alias:'part',fragment:result.module,bindings:{ownerPath:'ownerPath',forms:'forms',roots:'roots'},
 }]);
 const path='rust/declarations/fragments/enumeration-form-links.generated.yaml';
 const content='# Generated from rules.ts by tools/rules-migration/src/owner-form-links-operation.mjs\n'+
  yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[result.module,probe]},{noRefs:true});
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error(`Stale form links declaration: ${path}`);
 }else if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
