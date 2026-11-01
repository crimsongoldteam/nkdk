import {scalarPart} from './numeric-owner-fragment.mjs';
// Source migration builds expressions; Rust still executes the shared declaration.
const get=(of,field)=>({get:{of,field}}),present=value=>({present:value});
const choose=(condition,then,otherwise)=>({if:condition,then,else:otherwise});
function inputShape(type,module,catalog,stack=new Set()) {
 if(type.use) {
  const id=module.imports[type.use],target=catalog.get(id);
  if(target?.enum && !target.value)return {kind:'enum',variants:Object.keys(target.enum).map(name=>({name,value:name}))};
  if(!target?.value||stack.has(id))throw new Error('Semantic view requires a finite declared input shape');
  return inputShape(target.value,target,catalog,new Set(stack).add(id));
 }
 if(type.kind==='record')return {kind:'record',fields:type.fields.map(row=>({name:row.name,type:inputShape(row.type,module,catalog,stack)}))};
 if(type.kind==='choice')return {kind:'choice',variants:type.variants.map(row=>({name:row.name,type:inputShape(row.type,module,catalog,stack)}))};
 if(type.kind==='sequence')return {kind:'sequence',item:inputShape(type.item,module,catalog,stack)};
 if(type.kind==='scalar')return structuredClone(type);
 throw new Error('Unsupported semantic input shape');
}
export function recordStateView(semantic,state,{field,profile,grouped,catalog}) {
 if(!profile)return undefined;
 const input=`stateView_${field}`,source={input},members={},known=new Set(semantic.value.fields.map(row=>row.name));
 const normal=state.value.variants.filter(row=>row.name!=='grouped').map(row=>({
  when:{isVariant:{value:source,variant:row.name}},
  value:get({variantValue:{value:source,variant:row.name}},'value'),
 }));
 const groupGuard={isVariant:{value:source,variant:'grouped'}};
 const groups=(grouped?.viewGroups??[]).map(name=>get({variantValue:{value:source,variant:'grouped'}},name));
 for(const [operation,names] of Object.entries(profile)) {
  if(!['concat','lastPresent'].includes(operation)||!Array.isArray(names))throw new Error('Invalid record state view operation');
  for(const name of names) {
   if(!known.has(name)||Object.hasOwn(members,name))throw new Error(`Invalid record state view member: ${name}`);
   const empty=operation==='concat'?{sequence:[]}:{literal:''};
   let value=empty;
   for(const row of normal.toReversed())value=choose(row.when,
    operation==='concat'?get(row.value,name):choose(present(get(row.value,name)),get(row.value,name),empty),value);
   if(groups.length) {
    const parts=groups.map(group=>choose(present(group),
     operation==='concat'?get(group,name):choose(present(get(group,name)),get(group,name),empty),empty));
    const combined=operation==='concat'?{concat:parts}:groups.reduce((prior,group)=>choose(
     {and:[present(group),present(get(group,name))]},get(group,name),prior),empty);
    value=choose(groupGuard,combined,value);
   }
   members[name]=value;
  }
 }
 return {semantic:semantic.id,input,type:inputShape(state.value,state,catalog),members};
}

// A dependent rule receives the scalar meaning, while the owner retains the
// tagged value and its inverse state contract. The same modes own both views.
export function scalarStateView(semantic,type,{field,module,catalog,payload}) {
 const input=`stateView_${field}`;
 return {semantic,input,type:inputShape(type,module,catalog),
  value:scalarPart(field,payload,{input}),presence:{present:{input}}};
}
export function bindMappedFieldViews(mapped,views) {
 const consumed=new Set();
 const rewrite=value=>{
  if(Array.isArray(value))return value.map(rewrite);
  if(!value||typeof value!=='object')return value;
  const presenceView=views[value.present?.field];
  if(Object.keys(value).length===1&&presenceView?.presence) {
   consumed.add(presenceView);return structuredClone(presenceView.presence);
  }
  const selector=value.get,view=views[selector?.of?.field];
  if(view) {
   const member=view.members[selector.field];
   if(!member)throw new Error(`Undeclared semantic view member: ${selector.field}`);
   consumed.add(view);return structuredClone(member);
  }
  if(Object.keys(value).length===1&&typeof value.field==='string'&&views[value.field]) {
   const selected=views[value.field];consumed.add(selected);return selected.value?structuredClone(selected.value):{input:selected.input};
  }
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,rewrite(child)]));
 };
 for(const key of ['type','presence','constraints','ownerConstraints','siblingExpressions'])
  if(mapped[key])mapped[key]=rewrite(mapped[key]);
 for(const [input,spec] of Object.entries(mapped.siblingExpressions??{}))if(views[spec.source]) {
  if(views[spec.source].semantic!==spec.sourceId)throw new Error('Sibling semantic view type differs');
  (mapped.type.bind??={})[input]=spec.value;delete mapped.inputs?.[input];delete mapped.siblingExpressions[input];
 }
 for(const view of consumed) {
  mapped.inputs??={};
  if(mapped.inputs[view.input])throw new Error('Conflicting semantic view input');
  mapped.inputs[view.input]={type:structuredClone(view.type)};
 }
 return mapped;
}
