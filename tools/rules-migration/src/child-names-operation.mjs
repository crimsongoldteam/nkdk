import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {yaml} from './candidate-catalog.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {loadSources} from './source-snapshot.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';

const text={kind:'scalar',scalar:'text'};
const names={kind:'sequence',item:text};
const roles={ChildFormNames:'form',ChildTemplateNames:'template'};

export function childNamesFragment(source,id) {
 const fail=reason=>({status:'blocked',reason});
 if(!source?.properties || typeof id!=='string' || !id)return fail('child-names-owner-required');
 const properties=source.properties.filter(property=>Object.hasOwn(roles,property.parameters?.type));
 if(!properties.length || new Set(properties.map(property=>property.name)).size!==properties.length)
   return fail('child-names-properties-required');
 let route;
 try{route=sourceOwnerXmlRoute(source)}catch{return fail('child-names-root-required')}
 const fields=[],remaining=[];
 for(const property of properties) {
  const p=property.parameters,operation=p.operationTarget;
  const childRule=p.itemRule;
  const deferredTarget=!operation && p.toYAML===false && p.fromYAML===false;
  if(childRule && (p.type!=='ChildFormNames' || childRule.itemType!=='ClientApplicationForm' ||
    !Array.isArray(childRule.xmlOrder) || !childRule.properties ||
    typeof childRule.properties!=='object' || Array.isArray(childRule.properties)))
    return fail(`child-names-item-rule:${property.name}`);
  if(!(property.status==='static-parameters' ||
      property.status==='requires-expression-mapping' && childRule) ||
    !['forms','templates'].includes(property.name) ||
    p.xmlOnly!==true || JSON.stringify(p.xmlParents)!=='["ChildObjects"]' ||
    !/^[A-Za-z][A-Za-z0-9]*$/.test(p.xml??'') ||
    typeof p.folderName!=='string' || !p.folderName ||
    (Object.hasOwn(p,'yaml') && p.yaml!==p.folderName) ||
    ['toYAML','fromYAML'].some(key=>Object.hasOwn(p,key)&&p[key]!==false) ||
    Object.keys(p).some(key=>!['type','xml','yaml','folderName','itemRule','xmlOnly','xmlParents',
      'toYAML','fromYAML','operationTarget'].includes(key)) ||
    (!operation && !deferredTarget) || (operation && (Object.keys(operation).sort().join(',')!==
      'folderName,kind,migrationSegment,requiresMigration,role,yamlFileName' ||
    operation.kind!=='fileItemCollectionTarget' || operation.role!==roles[p.type] ||
    operation.folderName!==p.folderName || operation.requiresMigration!==false ||
    typeof operation.migrationSegment!=='string' || !operation.migrationSegment ||
    typeof operation.yamlFileName!=='string' || !operation.yamlFileName)))
    return fail(`child-names-profile:${property.name}`);
  fields.push({name:property.name,xml:p.xml,yaml:p.folderName});
  if(childRule)remaining.push(`${property.name}.itemRule`);
  if(deferredTarget)remaining.push(`${property.name}.operationTarget`);
 }
 const module={format:'nkdk-declarations/1',kind:'fragment',id,
  imports:{names:'common.child-object-names'},namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},
  inputs:Object.fromEntries(fields.map(field=>[field.name,{type:names}])),
  value:{kind:'record',fields:fields.map(field=>({name:field.name,type:{use:'names',bind:{names:{input:field.name}}}}))},
  representations:{xml:{kind:'record',fields:fields.map(field=>({field:field.name,path:[...route,'md:ChildObjects',`md:${field.xml}`]}))},
    yaml:{kind:'mapping',fields:fields.map(field=>({field:field.name,key:field.yaml}))}},
 };
 return {status:'candidate',module,...(remaining.length?{remaining}:{})};
}

function main() {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 loadSources(extraction.sourceHashes);
 const owner=extraction.entries.find(entry=>entry.symbol==='MetadataEnumerationRules');
 const result=childNamesFragment(owner,'fragment.enumeration-child-names');
 if(result.status!=='candidate')throw new Error(`Enumeration child names: ${result.reason}`);
 const probe=composeOwnerFragments('migration.enumeration-child-names',[{
  alias:'part',fragment:result.module,
  bindings:Object.fromEntries(Object.keys(result.module.inputs).map(name=>[name,name])),
 }]);
 const path='rust/declarations/fragments/enumeration-child-names.generated.yaml';
 const content='# Generated from rules.ts by tools/rules-migration/src/child-names-operation.mjs\n'+
  yaml.dump(result.module,{noRefs:true});
 const objectPath='rust/declarations/objects/enumeration-child-names.generated.yaml';
 const objectContent='# Generated from rules.ts by tools/rules-migration/src/child-names-operation.mjs\n'+
  yaml.dump(probe,{noRefs:true});
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error(`Stale child names declaration: ${path}`);
  if(readFileSync(objectPath,'utf8')!==objectContent)
   throw new Error(`Stale child names object: ${objectPath}`);
 }else {
  if(!existsSync(path) || readFileSync(path,'utf8')!==content)writeFileSync(path,content);
  if(!existsSync(objectPath) || readFileSync(objectPath,'utf8')!==objectContent)
   writeFileSync(objectPath,objectContent);
 }
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
