import {baseScalarConstraints,scalarTextExpression} from './owner-number-facts.mjs';
import {scalarPart} from './numeric-owner-fragment.mjs';
import {taggedScalarProperties} from './state-contributions.mjs';
import {compatibilityConstraints} from './compatibility-constraints.mjs';
import {readFileSync} from 'node:fs';
import {compareYamlKeys} from './yaml-order.mjs';
import {yaml} from './candidate-catalog.mjs';
import {emitCandidates} from './emit.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {mergeOwnerFragments} from './owner-composition.mjs';
import {deriveOwnerDefaultProfiles} from './owner-default-profiles.mjs';
import {ownIdentityDeclaration} from './owner-creation-declarations.mjs';
import {attachOwnerMembership} from './owner-membership-source.mjs';
const text={kind:'scalar',scalar:'text'};
const renameInput=(value,from,to)=>{
 if(!value||typeof value!=='object')return;
 if(value.input===from)value.input=to;
 for(const child of Object.values(value))renameInput(child,from,to);
};

// Source adaptation only. All conversions and base-state reconstruction remain
// ordinary declarations compiled ahead of time, including the shared history.
export function completeScalarOwner(source,scalar,catalog,{yamlKind}={}) {
 if(typeof yamlKind!=='string' || !yamlKind)throw new Error('Complete owner needs its registered YAML directory');
 const route=sourceOwnerXmlRoute(source),kind=route.at(-1).slice(3);
 const id='candidate.complete-scalar-owner.'+kind.toLowerCase();
 const headerNames=['uuid','name','synonym','comment','objectBelonging'];
 const mapped=new Set([...headerNames,'xmlRoot','extendedConfigurationObject',
  ...source.properties.filter(property=>scalar.value.fields.some(field=>field.name===(property.parameters?.xml??property.name[0].toUpperCase()+property.name.slice(1)))).map(property=>property.name)]);
 for(const property of source.properties)if(!mapped.has(property.name))throw new Error('Unmapped complete owner property: '+property.name);
 if(!headerNames.every(name=>source.properties.some(row=>row.name===name)))throw new Error('Incomplete owner header');
 const emission=emitCandidates([{...source,properties:source.properties.filter(row=>headerNames.includes(row.name)),
  propertyStates:[],xmlOrder:{status:'absent'},comparison:{status:'keys-match'}}],catalog);
 if(emission.entries[0].properties.some(row=>row.status!=='candidate'))throw new Error('Incomplete emitted owner header');
 const fragments=emission.modules.filter(row=>row.kind==='fragment').map((row,index)=>asOwnerFragment(
  {...row,namespaces:{md:scalar.namespaces.md}},id+'.header'+index,route,'md'));
 for(const [index,fragment] of fragments.entries()) {
  const aliases=new Map(Object.keys(fragment.imports??{}).map(alias=>[alias,`header${index}_${alias}`]));
  const rewrite=value=>{
   if(!value||typeof value!=='object')return;
   if(aliases.has(value.use))value.use=aliases.get(value.use);
   for(const child of Object.values(value))rewrite(child);
  };
  rewrite(fragment);fragment.imports=Object.fromEntries(Object.entries(fragment.imports).map(([alias,id])=>[aliases.get(alias),id]));
 }
 const identity=fragments.find(row=>row.value.fields.some(field=>field.name==='uuid'));
 for(const [from,to] of [['owner','parent'],['name','ownerName']]) {
  identity.inputs[to]=identity.inputs[from];delete identity.inputs[from];renameInput(identity,from,to);
 }
 // The registration, not an operation handler, supplies the metadata kind.
 delete identity.inputs.kind;
 identity.value.fields.find(row=>row.name==='uuid').type.bind.kind={literal:kind};
 const header=fragments.find(row=>row.value.fields.some(field=>field.name==='synonym'));
 deriveOwnerDefaultProfiles(header,source);
 // name-words is already declared by I8nText. Keep its local declaration on
 // the final owner rather than attempting to infer it from a metadata name.
 const types=header.types;delete header.types;
 header.inputs.adopted=structuredClone(scalar.inputs.adopted);
 header.presence.find(row=>row.target.field==='objectBelonging').xml.canonical=[{when:{eq:[{field:'objectBelonging'},{literal:'Native'}]},form:'missing'},{form:'ordinary'}];
 header.presence.find(row=>row.target.field==='objectBelonging').yaml.default={if:{input:'adopted'},then:{literal:'Adopted'},else:{literal:'Native'}};
 const owner=mergeOwnerFragments(id,[...fragments,scalar]);
 owner.kind='object';if(types)owner.types=types;
 owner.inputs.identities.index='metadata.own-identities';
 owner.inputs.states.index='metadata.property-state-membership';
 owner.inputs.baseNumbers.index='metadata.base-owner-numbers';
 const baseType={type:{kind:'index',key:{kind:'record',fields:['component','identity'].map(name=>({name,type:text}))},value:text}};
 owner.inputs.baseIds={...baseType,index:'metadata.base-identities'};
 const relation=yaml.load(readFileSync(new URL('../contracts/borrowed-base.yaml',import.meta.url),'utf8'));
 owner.imports.state='common.base-reference-state';
 owner.value.fields.push(...relation.value.fields.filter(row=>row.name!=='rows'));
 owner.representations.xml.fields.push({field:'base',path:[...route,'md:Properties','md:ExtendedConfigurationObject']});
 owner.representations.yaml.fields.push({field:'state',key:'ОбъектРасширяемойКонфигурации'});
 const rewriteHistory=value=>{
  if(!value||typeof value!=='object')return;
  if(value.field==='rows')value.field='history';
  for(const child of Object.values(value))rewriteHistory(child);
 };
 owner['state-relations']=structuredClone(relation['state-relations']);
 rewriteHistory(owner['state-relations']);
 owner['state-relations'][0].sources.base.present={if:{input:'adopted'},then:{require:{lookup:{in:{input:'baseIds'},key:{record:{component:{input:'component'},identity:{field:'uuid'}}}}}},else:{absent:true}};
 owner.presence.push({target:{field:'state'},yaml:{omitWhen:{not:{input:'adopted'}}}});
 owner.constraints.push(...compatibilityConstraints(source,catalog,{participates:{input:'adopted'},enumInput:true}));
 const scalarProperties=new Map(taggedScalarProperties(source).map(property=>[property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1),property]));
 const scalarChecks=baseScalarConstraints([...scalarProperties.keys()],field=>scalarTextExpression(scalarProperties.get(field).type,scalarPart(field,'value')));
 const history=owner.presence.find(row=>row.target.field==='history');
 history.yaml.default.concat.push({if:{present:{field:'notice'}},then:{sequence:[{record:{name:{literal:'ExtendedConfigurationObject'},mode:{field:'notice'}}}]},else:{sequence:[]}});
 const order=['history','objectBelonging','name','synonym','comment','base',...scalar.representations.xml.fields.filter(row=>row.field!=='history').map(row=>row.field),'uuid'];
 owner.representations.xml.fields.sort((left,right)=>order.indexOf(left.field)-order.indexOf(right.field));
 owner.xmlOrder=order;
 const root=source.properties.find(row=>row.name==='xmlRoot');
 owner.representations.xml={kind:'with-attributes',attributes:[{name:'version',value:{text:root.parameters.rootAttributes._version}}],content:owner.representations.xml};
 const own=ownIdentityDeclaration({id:id+'.own-identity',namespace:scalar.namespaces.md,xmlKind:kind,
  yamlKind,identityKind:kind,version:root.parameters.rootAttributes._version});
 const base={format:'nkdk-declarations/1',kind:'object',id:id+'.base-identity',namespaces:scalar.namespaces,
  inputs:{component:{type:text}},value:{kind:'record',fields:['uuid','base'].map(name=>({name,type:text}))},
  representations:{xml:{kind:'record',fields:[{field:'uuid',path:route,attribute:'uuid'},{field:'base',path:[...route,'md:Properties','md:ExtendedConfigurationObject']}]},
   yaml:{kind:'mapping',fields:['uuid','base'].map(field=>({field,key:field}))}},
  presence:[{target:{field:'base'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}],
  contributions:[{index:'metadata.base-identities',when:{present:{field:'base'}},key:{record:{component:{input:'component'},identity:{field:'uuid'}}},value:{field:'base'}}]};
 attachOwnerMembership(source,base);
 const borrowed=structuredClone(owner);borrowed.id=id+'.adopted';
 const ranks=new Map(source.properties.map((property,index)=>[property.name,index]));
 const sourceName=field=>source.properties.find(property=>property.name===field || (property.parameters?.xml??property.name[0].toUpperCase()+property.name.slice(1))===field)?.name;
 borrowed.yamlOrder=borrowed.representations.yaml.fields.slice().sort((left,right)=>(ranks.get(sourceName(left.field))??ranks.size)-(ranks.get(sourceName(right.field))??ranks.size)).map(row=>row.field);
 owner.yamlOrder=owner.representations.yaml.fields.slice().sort((left,right)=>compareYamlKeys(left.key,right.key)).map(row=>row.field);
 const validation=structuredClone(borrowed);validation.id=id+'.validation';
 validation.constraints.push(...scalarChecks);
 // Base values are indexed by the base object's real identity; state history
 // remains indexed by this owner's identity. Do not conflate the two contexts.
 const baseOwner={if:{input:'adopted'},then:{require:{lookup:{in:{input:'baseIds'},key:{record:{
  component:{input:'component'},identity:{input:'owner'}}}}}},else:{input:'owner'}};
 const bindBaseOwner=value=>{
  if(!value||typeof value!=='object')return;
  if(value.lookup?.in?.input==='baseNumbers')value.lookup.key.record.owner=structuredClone(baseOwner);
  for(const child of Object.values(value))bindBaseOwner(child);
 };
 for(const declaration of [owner,borrowed,validation])bindBaseOwner(declaration);
 return {owner,borrowed,validation,facts:[own,base]};
}
