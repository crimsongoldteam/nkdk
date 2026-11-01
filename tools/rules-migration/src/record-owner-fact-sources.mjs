import {identityPresence} from './owner-creation-declarations.mjs';
import {mapProperty} from './mappings.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {numberStateSource} from './numeric-owner-fragment.mjs';
import {baseReferenceSource} from './owner-base-state.mjs';
import {composedCollection} from './composed-collection.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';

// Project facts have independent readers: importing an identity or history
// must not require the complete object or the indexes that it consumes.
export function recordOwnerFactSources(source,assembly,catalog) {
 const route=sourceOwnerXmlRoute(source),id=assembly.owner.id;
 const namespace=assembly.owner.namespaces.md;
 const named=source.properties.find(row=>row.name==='name');
 const identities=source.properties.map(row=>mapProperty(row,catalog))
  .filter(row=>row.identityProjection);
 const name=named&&mapProperty(named,catalog);
 if(name?.status!=='candidate' || identities.length!==1)
  throw new Error('Record fact source requires one registered name and identity');
 const uuid=identities[0],qualify=part=>part.includes(':')?part:'md:'+part;
 const text={kind:'scalar',scalar:'text'};
 const identity={format:'nkdk-declarations/1',kind:'object',id:id+'.own-identity',
  namespaces:{md:namespace},inputs:{component:{type:text},owner:{type:text},ownerName:{type:text},identitySeed:{type:text}},
  value:{kind:'record',fields:[{name:'name',type:text},{name:'uuid',type:text}]},
  representations:{xml:{kind:'record',fields:[
   {field:'name',path:[...route,...name.path.map(qualify)]},
   {field:'uuid',path:[...route,...uuid.path.map(qualify)],attribute:uuid.attribute},
  ]},yaml:{kind:'mapping',fields:[{field:'name',key:'name'},{field:'uuid',key:'uuid'}]}},
  presence:identityPresence([{input:'component'},{concat:[{literal:'owner:'},{input:'owner'}]},
   {literal:route.at(-1).split(':').at(-1)},{field:'name'}]),
  contributions:[{index:'metadata.own-identities',key:{record:{
   component:{input:'component'},owner:{input:'owner'},kind:{literal:route.at(-1).split(':').at(-1)},
   name:{field:'name'}}},value:{field:'uuid'}}]};
 return [identity,numberStateSource(id+'.states',route),baseReferenceSource(assembly.state.module,id+'.base-identity')];
}

export function recordOwnerFactCollections(source,assembly,{parent,edge,id,catalog}) {
 const identity=assembly.factSources.find(module=>module.contributions?.some(row=>row.index==='metadata.own-identities'));
 if(!identity || !id || edge.item.symbol!==source.symbol || edge.owner.symbol!==parent.symbol)
  throw new Error('Registered record fact collection required');
 const parentIdentity=parent.properties.map(row=>mapProperty(row,catalog)).filter(row=>row.identityProjection);
 if(parentIdentity.length!==1)throw new Error('One registered parent identity required');
 const parentRoute=sourceOwnerXmlRoute(parent);
 const modules=[],entries=[];
 for(const original of assembly.factSources) {
  const fragment=structuredClone(original);
  fragment.kind='fragment';fragment.id=`${id}.fragment.${original.id}`;
  const ownIdentity=fragment.value.fields.some(field=>field.name==='uuid');
  for(const name of ['name','uuid'])if(!fragment.value.fields.some(field=>field.name===name)) {
   const field=identity.value.fields.find(field=>field.name===name);
   const xml=identity.representations.xml.fields.find(field=>field.field===name);
   if(!field || !xml)throw new Error('Missing record identity field');
   fragment.value.fields.push(structuredClone(field));
   fragment.representations.xml.fields.push(structuredClone(xml));
   fragment.representations.yaml.fields.push({field:name,key:name});
  }
  const bindings=Object.fromEntries(Object.keys(fragment.inputs??{}).map(name=>
   [name,name==='owner'&&!ownIdentity?{field:'uuid'}:{input:name}]));
  const item={format:fragment.format,kind:'object',id:`${fragment.id}.item`,
   imports:{facts:fragment.id},inputs:structuredClone(fragment.inputs??{}),
   namespaces:fragment.namespaces,compose:[{use:'facts',bind:bindings}],
   value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
  if(!ownIdentity)delete item.inputs.owner;
  const collection=composedCollection(edge,item,new Map(),[fragment],{
   bindings:{},extraInputs:{},namespaces:fragment.namespaces,defaultXmlNamespace:'md',
  });
  const suffix=original.id.slice(assembly.owner.id.length+1);
  const entry=asOwnerFragment(collection.entry,`${id}.${suffix}`,sourceOwnerXmlRoute(parent),'md');
  entry.kind='object';
  if(ownIdentity) {
   entry.value.fields[0].type.bind.owner={field:'parentIdentity'};
   delete entry.inputs.owner;
   entry.value.fields.push({name:'parentIdentity',type:{kind:'scalar',scalar:'text'}});
   entry.representations.xml.fields.push({field:'parentIdentity',
    path:[...parentRoute,...parentIdentity[0].path.map(part=>part.includes(':')?part:'md:'+part)],
    attribute:parentIdentity[0].attribute});
   entry.representations.yaml.fields.push({field:'parentIdentity',key:'parentIdentity'});
  }

  modules.push(...collection.modules.filter(module=>module!==collection.entry),entry);
  entries.push(entry);
 }
 return {modules,entries};
}
