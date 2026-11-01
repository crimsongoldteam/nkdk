import {childNamesFragment} from './child-names-operation.mjs';
import {sourceChildFileResources} from './source-child-file-resources.mjs';

// Source adapter only. Paths and filenames are registered by the old rules;
// the router receives a generic ordered sequence and directory discovery.
export function sourceChildNameFacts(source,id,catalog) {
 const properties=source.properties.filter(row=>
  ['ChildFormNames','ChildTemplateNames'].includes(row.parameters?.type));
 if(!properties.length)return {modules:[],sources:[],bindings:{}};
 const fragment=childNamesFragment(source,id+'.child-names');
 if(fragment.status!=='candidate' || fragment.remaining?.length)
  throw new Error('Unresolved child-name source registration: '+(fragment.reason??fragment.remaining));
 const registered=catalog.get(fragment.module.imports.names);
 if(!registered || registered.value.kind!=='sequence')throw new Error('Registered child-name sequence required');
 const names=structuredClone(registered);
 names.id=id+'.child-names.sequence';delete names.inputs;
 names.presence=[{target:'self',xml:{missing:{denotes:{sequence:[]}}},
  yaml:{missing:{denotes:{sequence:[]}}}}];
 const modules=[names],sources=[],bindings={};
 for(const property of properties) {
  const field=property.name,p=property.parameters,target=p.operationTarget;
  const resources=sourceChildFileResources(property,catalog);
  const xml=fragment.module.representations.xml.fields.find(row=>row.field===field);
  const reader={format:'nkdk-declarations/1',kind:'object',id:id+'.child-names.'+field,
   namespaces:structuredClone(fragment.module.namespaces),imports:{names:names.id},
   value:{kind:'record',fields:[{name:field,type:{use:'names'}}]},
   representations:{xml:{kind:'record',fields:[structuredClone(xml)]},
    yaml:{kind:'mapping',fields:[{field,key:field}]}},
   presence:[{target:{field},xml:{missing:{denotes:{sequence:[]}}},
    yaml:{missing:{denotes:{sequence:[]}}}}]};
  modules.push(reader);
  sources.push({entry:reader.id,inputs:{},factDirections:[],newOwner:{template:{[field]:[]}},
   resourceNames:{directory:[target.folderName],field,entryFile:resources?.entryFile??target.yamlFileName,preserveOrder:true}});
  bindings[field]={snapshot:{entry:reader.id,field}};
 }
 return {modules,sources,bindings};
}
