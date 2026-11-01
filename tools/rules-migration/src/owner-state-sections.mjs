import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {stateCapabilitiesFor} from './state-contributions.mjs';
import {orderNumericHistory} from './numeric-owner-fragment.mjs';

// Section names and allowed modes come from the source registry. They produce
// ordinary sequence expressions; no module-specific converter is emitted.
export function ownerStateSections(fragment,source,catalog) {
 const capabilities=stateCapabilitiesFor(source);
 const properties=source.properties.filter(row=>capabilities[row.name]?.representation==='section');
 if(!properties.length)return {module:fragment,properties:[],declarations:[]};
 const snapshot=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url),'utf8'));
 const original=snapshot.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 const module=structuredClone(fragment),declarations=[];
 const defaults=module.presence.find(row=>row.target.field==='history')?.yaml?.default?.concat;
 if(!defaults)throw new Error('Section states require shared history');
 for(const property of properties) {
  if(!isDeepStrictEqual(property,original?.properties.find(row=>row.name===property.name)))
   throw new Error('Unreviewed section state registration: '+property.name);
  const capability=capabilities[property.name];
  if(capability.availability!=='borrowed' || !capability.externalName || capability.modes.some(mode=>!['control','extend','notify'].includes(mode)))
   throw new Error('Unsupported section state profile: '+property.name);
 }
 const eq=(left,right)=>({eq:[left,right]});
 for(const [mode,xmlMode,key] of [['extend','Extended','Изменять'],['notify','Notify','Проверять']]) {
  const selected=properties.filter(row=>capabilities[row.name].modes.includes(mode));
  if(!selected.length)continue;
  const field='section_'+mode,id=module.id+'.section-'+mode,alias=field+'_values';
  module.imports[alias]=id;
  declarations.push({format:module.format,kind:'value',id:id+'.item',
   value:{kind:'record',fields:[{name:'name',type:{kind:'scalar',scalar:'text'}}]},
   representations:{xml:{kind:'record',fields:[{field:'name',path:['Name']}]},
    yaml:{kind:'projection',field:'name'}}});
  declarations.push({format:module.format,kind:'value',id,
   imports:{item:id+'.item'},value:{kind:'sequence',item:{use:'item'}},
   representations:{xml:{kind:'element-sequence',path:['Item']},
    yaml:{kind:'sequence'}}});
  module.value.fields.push({name:field,type:{use:alias}});
  module.representations.yaml.fields.push({field,key});
  const sectionName=variable=>({get:{of:{var:variable},field:'name'}});
  const has=(name)=>({exists:{in:{field},as:'sectionName',where:eq(sectionName('sectionName'),{literal:name})}});
  const inHistory=property=>({exists:{in:{field:'history'},as:'sectionRow',where:{and:[
   eq({get:{of:{var:'sectionRow'},field:'name'}},{literal:property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1)}),
   eq({get:{of:{var:'sectionRow'},field:'mode'}},{literal:xmlMode})]}}});
  module.presence.push({target:{field},xml:{missing:{denotes:{concat:selected.map(property=>({
   if:inHistory(property),then:{sequence:[{record:{name:{literal:capabilities[property.name].externalName}}}]},else:{sequence:[]}}))}}},
   yaml:{default:{sequence:[]}}});
  const known={or:selected.map(row=>eq(sectionName('sectionName'),{literal:capabilities[row.name].externalName}))};
  const diagnostic={code:'state.section.invalid',severity:'error',at:{field},message:'Недопустимое имя или повтор в секции состояния'};
  module.constraints.push({id:field+'-names',appliesTo:['yaml-validation'],
   assert:{each:{in:{field},as:'sectionName',where:{and:[known,{one:{in:{field},as:'otherName',where:eq(sectionName('otherName'),sectionName('sectionName'))}}]}}},diagnostic});
  for(const property of selected) {
   const name=capabilities[property.name].externalName,xml=property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1);
   const allowed=Object.keys(catalog.get('system.CompatibilityMode').enum).filter(version=>stateCapabilitiesFor(source,version)[property.name]?.modes.includes(mode));
   const available={and:[{input:'adopted'},{or:allowed.map(version=>eq({input:'compatibilityMode'},{literal:version}))}]};
   module.constraints.push({id:field+'-'+property.name,appliesTo:['xml-import','yaml-validation'],when:has(name),
    assert:available,diagnostic:{code:'state.mode.unavailable',severity:'error',at:{field},message:'Секция недоступна для этого объекта или версии'}});
   defaults.push({if:{and:[has(name),available]},then:{sequence:[{record:{name:{literal:xml},mode:{literal:xmlMode}}}]},else:{sequence:[]}});
   module.constraints.push({id:field+'-'+property.name+'-history',appliesTo:['yaml-validation'],
    assert:eq(has(name),inHistory(property)),diagnostic:{code:'state.expected',severity:'error',at:{field},message:'Секция не соответствует явно заданной истории'}});
  }
 }
 for(const property of properties.filter(row=>['extend','notify'].every(mode=>capabilities[row.name].modes.includes(mode)))) {
  const named=field=>({exists:{in:{field},as:'modeName',where:{eq:[
   {get:{of:{var:'modeName'},field:'name'}},{literal:capabilities[property.name].externalName}]}}});
  module.constraints.push({id:'section-exclusive-'+property.name,appliesTo:['xml-import','yaml-validation'],
   assert:{not:{and:[named('section_extend'),named('section_notify')]}},
   diagnostic:{code:'state.mode.conflict',severity:'error',at:{field:'section_extend'},message:'Раздел не может одновременно изменяться и проверяться'}});
 }
 orderNumericHistory(module);
 return {module,properties:properties.map(row=>row.name),declarations};
}
