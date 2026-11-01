// Derive ordinary PropertyState declarations from the extracted capability
// registry. Unsupported modes stay outside this fragment until represented.
export function propertyStateDeclarations(source,id) {
 const names=new Map();
 for(const contribution of source.propertyStates??[]) {
  for(const item of [contribution.item,...(contribution.delta?.items??[])].filter(Boolean)) {
   if(item.itemType!==source.itemType)continue;
   for(const [key,state] of Object.entries(item.properties??{})) {
    if(state.availability!=='borrowed' || !['plain','section'].includes(state.representation))continue;
    if(!state.modes?.includes('extend') || state.modes.some(mode=>mode!=='extend'))
     throw new Error('Unsupported PropertyState mode: '+key);
    const property=source.properties.find(row=>row.name===key);
    const yaml=state.externalName??property?.parameters?.yaml;
    if(typeof yaml!=='string' || !yaml)throw new Error('Missing PropertyState YAML name: '+key);
    const xml=key[0].toUpperCase()+key.slice(1);
    const previous=names.get(xml);
    if(previous && previous!==yaml)throw new Error('Conflicting PropertyState name: '+key);
    names.set(xml,yaml);
   }
  }
 }
 if(names.size===0)throw new Error('No declared PropertyState names');
 if(new Set(names.values()).size!==names.size)throw new Error('Ambiguous PropertyState YAML names');
 const nameId=id+'.property-state-name';
 const rowId=id+'.property-state-row';
 const statesId=id+'.property-states';
 const text=()=>({kind:'scalar',scalar:'text'});
 return [
  {format:'nkdk-declarations/1',kind:'value',id:nameId,
   value:{kind:'enum',variants:[...names.keys()].map(name=>({name,value:name}))},
   representations:{xml:{kind:'text',values:[...names.keys()].map(name=>({value:name,text:name}))},
    yaml:{kind:'scalar',values:[...names].map(([value,literal])=>({value,literal}))}}},
  {format:'nkdk-declarations/1',kind:'value',id:rowId,
   imports:{name:nameId},namespaces:{xr:'http://v8.1c.ru/8.3/xcf/readable'},
   value:{kind:'record',fields:[{name:'name',type:{use:'name'}},{name:'mode',type:text()}]},
   representations:{xml:{kind:'record',fields:[
    {field:'name',path:['xr:Property']},{field:'mode',path:['xr:State']}]},
    yaml:{kind:'projection',field:'name'}},
   presence:[{target:{field:'mode'},yaml:{missing:{denotes:{literal:'Extended'}}}}]},
  {format:'nkdk-declarations/1',kind:'value',id:statesId,
   imports:{row:rowId},namespaces:{xr:'http://v8.1c.ru/8.3/xcf/readable'},
   value:{kind:'sequence',item:{use:'row'}},
   representations:{xml:{kind:'element-sequence',path:['xr:PropertyState']},
    yaml:{kind:'sequence'}}},
 ];
}

export function attachPropertyStates(internal,source,id) {
 const declarations=propertyStateDeclarations(source,id);
 const statesId=id+'.property-states';
 internal.imports.states=statesId;
 internal.namespaces.xr='http://v8.1c.ru/8.3/xcf/readable';
 internal.value.fields.push({name:'states',type:{use:'states'}});
 const path=internal.representations.xml.fields.find(field=>field.field==='types').path;
 internal.representations.xml.fields.push({field:'states',path:[...path]});
 internal.representations.yaml.fields.push({field:'states',key:'Изменять'});
 internal.presence.push({target:{field:'states'},
  xml:{missing:{denotes:{sequence:[]}}},yaml:{default:{sequence:[]}}});
 internal.contributions=[...(internal.contributions??[]),{
  index:'metadata.property-state-membership',duplicates:'coalesce-equal',
  forEach:{in:{field:'states'},as:'row'},
  key:{record:{owner:{input:'owner'},property:{get:{of:{var:'row'},field:'name'}},
    mode:{get:{of:{var:'row'},field:'mode'}}}},value:{literal:'present'},
 }];
 return declarations;
}
