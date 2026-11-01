import {completeScalarOwnerRoute} from './complete-scalar-owner-route.mjs';
import {completeScalarOwner} from './complete-scalar-owner.mjs';
import {attachCompatibilityContext} from './configuration-context.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,yaml} from './candidate-catalog.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {numericOwnerFragment,numberStateSource,numericDependencies,orderNumericHistory} from './numeric-owner-fragment.mjs';
import {ownerNumberFactSource,ownerNumberYamlProjection} from './owner-number-facts.mjs';
import {taggedNumberProperties,taggedScalarProperties} from './state-contributions.mjs';
import {linkedOwnerSources} from './linked-owner-source.mjs';
const fixtures=requests=>JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
 input:JSON.stringify(requests),encoding:'utf8'}));
export function numericOwnerOperation(catalog=candidateCatalog().catalog) {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
 const profiles=yaml.load(readFileSync('tools/rules-migration/profiles/numeric-owners.yaml','utf8'));
 const modules=[],cases=[],factSources=[],production=[],routes={format:'nkdk-operation-routes/1',routes:[],factRoutes:[]};
 for(const profile of profiles) {
  const source=extraction.entries.find(row=>row.symbol===profile.symbol);
  if(!source)throw new Error(`Missing numeric owner: ${profile.symbol}`);
  const properties=taggedNumberProperties(source),route=sourceOwnerXmlRoute(source);
  if(!properties.length)throw new Error(`Missing numeric properties: ${profile.symbol}`);
  const root=route.at(-1).slice(3).toLowerCase();
  const selectors=[...new Map([...numericDependencies(properties,source),...taggedScalarProperties(source)]
    .map(property=>[property.name,property])).values()];
  const fragment=numericOwnerFragment(`fragment.owner-numbers.${root}`,route,properties,catalog,selectors,source);
  const module=composeOwnerFragments(`candidate.owner-numbers.${root}`,[{alias:'numbers',fragment,
   bindings:{adopted:'adopted',owner:'owner',states:'states',baseNumbers:'baseNumbers',compatibilityMode:'compatibilityMode'}}]);
  const selected=[...properties,...selectors];
  if(source.xmlOrder?.status!=='static' || selected.some(property=>!source.xmlOrder.keys.includes(property.name)))
    throw new Error(`Missing numeric source XML order: ${source.symbol}`);
  module.xmlOrder=['history',...selected.sort((left,right)=>source.xmlOrder.keys.indexOf(left.name)-source.xmlOrder.keys.indexOf(right.name))
    .map(property=>property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1))];
  fragment.representations.xml.fields.sort((left,right)=>module.xmlOrder.indexOf(left.field)-module.xmlOrder.indexOf(right.field));
  orderNumericHistory(fragment);
  module.inputs.states.index='metadata.property-state-membership';
  module.inputs.baseNumbers.index='metadata.base-owner-numbers';
  const state=numberStateSource(`candidate.owner-numbers-states.${root}`,route);
  const names=properties.map(property=>property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1));
  const numbers=ownerNumberFactSource(`candidate.owner-numbers-base.${root}`,route,names,selectors);
  modules.push(fragment,module,state,numbers);
  const complete=profile.completeOwner?completeScalarOwner(source,fragment,catalog,{yamlKind:profile.yamlDirectory}):undefined;
  const currentBase=complete?ownerNumberYamlProjection(numbers,[...properties,...selectors]):undefined;
  if(complete) {
   modules.push(complete.owner,complete.borrowed,complete.validation,...complete.facts,currentBase);
   const operation=completeScalarOwnerRoute({profile,complete,state,numbers,currentBase,
    belonging:catalog.get(complete.facts[1].imports.belonging)});
   production.push(...operation.production);
   routes.routes.push(operation.route);routes.factRoutes.push(operation.factRoute);
  }
  const basePath=`e2e/fixtures/xml/cf/${profile.xmlDirectory}/${profile.name}.xml`;
  const base=linkedOwnerSources(fixtures([{xml:basePath,ownerHeader:true}]));
  for(const kind of ['cf','adopted','own']) {
   const name=profile.name+(kind==='own'?'Ext':'');
   const component=kind==='cf'?'cf':'cfe/all-extension';
   const xml=`e2e/fixtures/xml/${component}/${profile.xmlDirectory}/${name}.xml`;
   const yamlPath=`e2e/fixtures/nkdk/${kind==='cf'?'cf':'cfe/Расширение_All'}/${profile.yamlDirectory}/${name}${profile.yamlFile?'/'+profile.yamlFile:'.yaml'}`;
   const header=fixtures([{xml,ownerHeader:true,propertyHistory:true}])[0];
   const linked=kind==='cf'?undefined:base(header);
   if(Boolean(linked)!==(kind==='adopted'))throw new Error(`Unexpected numeric owner linkage: ${xml}`);
   const example=fixtures([{xml,yaml:yamlPath,ownerFields:{propertyStates:[...names,...selectors.map(row=>row.parameters.xml??row.name[0].toUpperCase()+row.name.slice(1))],
    properties:[...properties,...selectors].map(property=>({xml:property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1),yaml:property.parameters.yaml,optional:true}))}}])[0];
   const id=`e2e-owner-numbers-${root}-${kind}`;
   factSources.push({id:id+'-states',entry:state.id,xml:readFileSync(xml,'utf8'),inputs:{owner:example.ownerIdentity}},
    {id:id+'-base',entry:numbers.id,xml:readFileSync(linked?.source[0].path??xml,'utf8'),inputs:{owner:example.ownerIdentity}});
   cases.push({id,entry:module.id,xml:example.xml,yaml:example.yaml,
    inputs:{adopted:kind==='adopted',owner:example.ownerIdentity},noRaw:true,
    xmlQNamePaths:example.xmlQNamePaths,source:[...example.source,...(linked?.source??[])],
    factSourceEntries:[id+'-states',id+'-base'],
    factBindings:{states:'metadata.property-state-membership',baseNumbers:'metadata.base-owner-numbers'}});
   const current=cases.at(-1);
   if(complete) {
    const fullId=id+'-complete';
    const fullBaseId=fullId+'-base-values';
    const baseFact=factSources.find(row=>row.id===id+'-base');
    factSources.push({...baseFact,id:fullBaseId,inputs:{owner:linked?.identity??header.identity}});
    const context={component,parent:'',ownerName:header.name};
    factSources.push(...complete.facts.map((fact,index)=>({id:fullId+'-fact-'+index,entry:fact.id,
     xml:readFileSync(xml,'utf8'),...(fact.id.endsWith('.base-identity')?{snapshotFields:{uuid:example.ownerIdentity,objectBelonging:catalog.get('system.ObjectBelonging').enum[kind==='adopted'?'Adopted':'Native']}}:{}),inputs:Object.fromEntries(Object.keys(fact.inputs).map(name=>[name,name==='identitySeed'?'e2e':context[name]]))})));
    cases.push({id:fullId,entry:(kind==='adopted'?complete.borrowed:complete.owner).id,xml:readFileSync(xml,'utf8'),yaml:readFileSync(yamlPath,'utf8'),
     inputs:{...current.inputs,...context,defaultLanguage:'ru',registeredLanguages:['ru','en']},noRaw:true,
     source:current.source,factSourceEntries:[...current.factSourceEntries.map(entry=>entry===id+'-base'?fullBaseId:entry),...complete.facts.map((_,index)=>fullId+'-fact-'+index)],
     factBindings:{...current.factBindings,identities:'metadata.own-identities',baseIds:'metadata.base-identities'}});
    const sourceCase=cases.at(-1),membershipId=fullId+'-materialized-membership';
    const membership=factSources.find(row=>row.id===fullId+'-fact-1');
    factSources.push({...membership,id:membershipId,xml:undefined,
     yaml:yaml.dump({uuid:header.identity,...(linked?{base:linked.identity}:{})},{noRefs:true})});
    cases.push({...sourceCase,id:fullId+'-source-from-yaml',factSourceEntries:sourceCase.factSourceEntries.map(entry=>entry===membership.id?membershipId:entry),
     adaptation:'Materialized owner membership from YAML identity and optional base; original XML unchanged'});
    if(kind==='adopted') {
     const validationSource=sourceCase;
     cases.push({...validationSource,id:fullId+'-base-validation',entry:complete.validation.id,validationOnly:true,
      xml:undefined,yaml:undefined,noRaw:undefined,validationContexts:[
       {inputs:{},yaml:validationSource.yaml,codes:['base.value.changed','base.value.changed'],severities:['Error','Error']},
       {inputs:{},yaml:'КонтрольУникальности: Истина',codes:['base.value.changed'],severities:['Error'],paths:[['КонтрольУникальности']]},
       {inputs:{},yaml:'КонтрольУникальности: !проверять Истина',codes:['base.value.changed'],severities:['Warning'],paths:[['КонтрольУникальности']]},
       {inputs:{},yaml:'КонтрольУникальности: !изменять Истина',codes:[]},
       {inputs:{},yaml:'КонтрольУникальности: Ложь',codes:[]},
       {inputs:{},yaml:'ПериодичностьНомера: Непериодический',codes:['base.value.changed'],severities:['Error'],paths:[['ПериодичностьНомера']]},
       {inputs:{},yaml:'ПериодичностьНомера: !проверять null',codes:['base.value.changed'],severities:['Warning'],paths:[['ПериодичностьНомера']]},
       {inputs:{},yaml:'ПериодичностьНомера: !изменять null',codes:[]},
       {inputs:{},yaml:'ПериодичностьНомера: Год',codes:[]},
       {inputs:{},yaml:'ТипНомера: Строка',codes:['base.value.changed'],severities:['Error'],paths:[['ТипНомера']]},
       {inputs:{},yaml:'ТипНомера: !изменять Строка',codes:[]},
       {inputs:{},yaml:'ДопустимаяДлинаНомера: null',codes:[]},
      ]});
     const comparison=cases.at(-1);
     const currentBaseId=fullId+'-current-base-yaml';
     const baseYaml=readFileSync(`e2e/fixtures/nkdk/cf/${profile.yamlDirectory}/${profile.name}.yaml`,'utf8');
     factSources.push({id:currentBaseId,entry:currentBase.id,yaml:baseYaml,inputs:{owner:linked.identity}});
     cases.push({...comparison,id:currentBaseId,
      factSourceEntries:comparison.factSourceEntries.map(entry=>entry===fullBaseId?currentBaseId:entry),
      adaptation:'Current primary base YAML replaces the immutable XML values source'});
     const changedBaseId=currentBaseId+'-edited';
     factSources.push({id:changedBaseId,entry:currentBase.id,yaml:baseYaml.replace('КонтрольУникальности: Ложь','КонтрольУникальности: Истина'),inputs:{owner:linked.identity}});
     cases.push({...comparison,id:changedBaseId,
      factSourceEntries:comparison.factSourceEntries.map(entry=>entry===fullBaseId?changedBaseId:entry),
      validationContexts:[{inputs:{},yaml:'КонтрольУникальности: Истина\nПериодичностьНомера: Год',codes:[]},
       {inputs:{},yaml:'КонтрольУникальности: Ложь',codes:['base.value.changed'],severities:['Error'],paths:[['КонтрольУникальности']]}],
      adaptation:'Edited current base boolean changes validation without XML reimport'});
     const defaultBaseId=currentBaseId+'-defaults';
     factSources.push({id:defaultBaseId,entry:currentBase.id,yaml:'{}',inputs:{owner:linked.identity}});
     cases.push({...comparison,id:defaultBaseId,
      factSourceEntries:comparison.factSourceEntries.map(entry=>entry===fullBaseId?defaultBaseId:entry),
      validationContexts:[{inputs:{},yaml:'ДлинаНомера: 9\nТипНомера: Строка\nДопустимаяДлинаНомера: null\nПериодичностьНомера: Непериодический\nКонтрольУникальности: Истина',codes:[]}],
      adaptation:'Primary YAML omissions resolve all defaults from extracted rules, not missing XML fields'});
     const missingBaseId=fullId+'-missing-base-boolean';
     const missingXML=baseFact.xml.replace(/<CheckUnique>[^<]*<\/CheckUnique>/,'');
     if(missingXML===baseFact.xml)throw new Error('Missing base boolean fixture');
     factSources.push({...baseFact,id:missingBaseId,xml:missingXML,inputs:{owner:linked.identity}});
     cases.push({...comparison,id:missingBaseId, factSourceEntries:comparison.factSourceEntries.map(entry=>entry===fullBaseId?missingBaseId:entry),
      validationContexts:[{inputs:{},yaml:'ПериодичностьНомера: Год\nКонтрольУникальности: Истина',codes:['base.property.missing'],severities:['Error'],paths:[['КонтрольУникальности']]}],
      adaptation:'Removed base CheckUnique only in an in-memory XML copy; source fixture remains immutable'});
     const full=validationSource,notice='<xr:PropertyState><xr:Property>ExtendedConfigurationObject</xr:Property><xr:State>Notify</xr:State></xr:PropertyState>';
     for(const [suffix,count] of [['notify',1],['duplicate-notify',2]]) {
      const modified=full.xml.replace('</InternalInfo>',notice.repeat(count)+'</InternalInfo>');
      if(modified===full.xml)throw new Error('Missing complete owner history');
      const noticeId=fullId+'-'+suffix,statesId=noticeId+'-states';
      factSources.push({id:statesId,entry:state.id,xml:modified,inputs:{owner:current.inputs.owner}});
      const notifiedYAML=full.yaml+'\nОбъектРасширяемойКонфигурации: !проверять\n';
      cases.push({...full,id:noticeId,xml:modified,factSourceEntries:[statesId,...full.factSourceEntries.slice(1)],
       yaml:count===1?notifiedYAML:full.yaml+'\n'+yaml.dump({Состояния:[...header.history,...Array.from({length:count},()=>({Property:'ExtendedConfigurationObject',State:'Notify'}))]},{noRefs:true}),noRaw:true,
       ...(count===2?{}:{validationContexts:[
        {inputs:{compatibilityMode:'Version8_3_14'},yaml:notifiedYAML,codes:['metadata.notify-compatibility']},
        {inputs:{compatibilityMode:'Version8_3_15'},yaml:notifiedYAML,codes:[]}]}),
       adaptation:'Added base-reference notification to an in-memory XML copy; original fixture remains immutable'});
     }
    }
   }
   if(kind==='adopted' && example.xml.includes('<xr:State>Notify</xr:State>')) {
    const notified=properties.find(property=>example.yaml.includes(`${property.parameters.yaml}: !проверять`));
    if(!notified)throw new Error('Notify fixture has no readable numeric property');
    cases.push({...current,id:id+'-before-notify',inputs:{...current.inputs,compatibilityMode:'Version8_3_14'},
      yaml:undefined,noRaw:undefined,annotation:`${notified.parameters.yaml}: !xml/raw`,
      adaptation:'Compatibility context changed to Version8_3_14; source XML remains immutable'});
   }

   if(kind==='adopted')for(const property of properties.filter(row=>row.parameters.maximumWhen)) {
    const condition=property.parameters.maximumWhen,selector=selectors.find(row=>row.name===condition.propertyKey);
    const withoutSelector=example.yaml.split('\n').filter(line=>!selectors.some(row=>line.startsWith(row.parameters.yaml+':'))).join('\n');
    current.rejectedYAML=[withoutSelector.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),
      `${property.parameters.yaml}: !изменять ${condition.maximum+1}`)];
    current.acceptedYAML=[withoutSelector.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),
      `${property.parameters.yaml}: !изменять ${condition.maximum}`)];
    const checked=withoutSelector.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),`${property.parameters.yaml}: !проверять 11`);
    const extended=withoutSelector.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),`${property.parameters.yaml}: !изменять 11`);
    current.validationContexts=[
      {inputs:{compatibilityMode:'Version8_3_14'},yaml:checked,codes:['state.mode.unavailable']},
      {inputs:{compatibilityMode:'Version8_3_15'},yaml:checked,codes:[]},
      {inputs:{compatibilityMode:'Version8_3_7'},yaml:extended,codes:['state.mode.unavailable']},
      {inputs:{compatibilityMode:'Version8_3_8'},yaml:extended,codes:[]},
      {inputs:{compatibilityMode:'DontUse'},yaml:checked,codes:[]},
    ];

   }
   if(kind==='adopted') {
    const field=names[0],baseId=id+'-base',missingId=`e2e-owner-numbers-${root}-missing-base-property`;
    const baseFact=factSources.find(row=>row.id===baseId);
    const absent=baseFact.xml.replace(new RegExp(`<${field}>[^<]*</${field}>`),'');
    if(absent===baseFact.xml)throw new Error(`Missing base fixture property: ${field}`);
    factSources.push({...baseFact,id:missingId+'-base',xml:absent});
    cases.push({...current,id:missingId,factSourceEntries:[id+'-states',missingId+'-base'],
     acceptedYAML:undefined,rejectedYAML:undefined,
     yaml:undefined,noRaw:undefined,annotation:`${properties[0].parameters.yaml}: !xml/raw`,
     validationContexts:[{inputs:{},yaml:example.yaml,codes:['base.property.missing']}],
     adaptation:`Removed ${field} from an in-memory base XML copy; original fixture remains immutable`});
   }


   if(kind==='adopted')for(const property of properties.filter(row=>row.parameters.maximumWhen)) {
    const selector=selectors.find(row=>row.name===property.parameters.maximumWhen.propertyKey);
    const field=selector.parameters.xml??selector.name[0].toUpperCase()+selector.name.slice(1);
    const baseFact=factSources.find(row=>row.id===id+'-base');
    const absent=baseFact.xml.replace(new RegExp(`<${field}>[^<]*</${field}>`),'');
    if(absent===baseFact.xml)throw new Error(`Missing base selector fixture: ${field}`);
    const missingId=`e2e-owner-numbers-${root}-missing-base-selector`;
    factSources.push({...baseFact,id:missingId+'-base',xml:absent});
    const withoutSelector=example.yaml.split('\n').filter(line=>!selectors.some(row=>line.startsWith(row.parameters.yaml+':'))).join('\n');
    const condition=property.parameters.maximumWhen;
    const label=catalog.get('system.'+selector.parameters.typeSE).enum[condition.equals];
    const localValue=value=>`${property.parameters.yaml}: !изменять ${value}\n${selector.parameters.yaml}: !изменять ${label}`;
    cases.push({...current,id:missingId,factSourceEntries:[id+'-states',missingId+'-base'],
     acceptedYAML:[localValue(condition.maximum)],rejectedYAML:[localValue(condition.maximum+1)],
     validationContexts:[{inputs:{},yaml:withoutSelector,codes:['base.context.missing']},
       {inputs:{},yaml:localValue(condition.maximum),codes:[]},
       {inputs:{},yaml:localValue(condition.maximum+1),codes:['number.maximum']}],
     adaptation:`Removed ${field} from an in-memory base XML copy; original fixture remains immutable`});
    const missing=cases.at(-1);
    const localAbsent=example.xml.replace(new RegExp(`<ns0:${field}>[^<]*</ns0:${field}>`),'');
    if(localAbsent===example.xml)throw new Error(`Missing local selector fixture: ${field}`);
    cases.push({...missing,id:missingId+'-xml',xml:localAbsent,yaml:undefined,noRaw:undefined,
     annotation:`${property.parameters.yaml}: !xml/raw`,
     adaptation:`Removed ${field} from in-memory local and base XML copies; originals remain immutable`});
   }

   if(kind==='own') {
    const property=properties[0];
    current.validationContexts=['изменять','проверять'].map(tag=>({inputs:{},
      yaml:example.yaml.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),
        `${property.parameters.yaml}: !${tag} 11`),codes:['state.mode.unavailable']}));
    current.validationContexts.push(...selectors.flatMap(property=>['изменять','проверять'].map(tag=>({
      inputs:{},yaml:`${property.parameters.yaml}: !${tag} null\n`,codes:['state.mode.unavailable']}))));
   }
   if(kind==='cf') {
    const bounded=properties.find(property=>Number.isSafeInteger(property.parameters.maximum));
    if(bounded)current.rejectedYAML=[example.yaml.replace(
      new RegExp(`^${bounded.parameters.yaml}:.*$`,'m'),`${bounded.parameters.yaml}: ${bounded.parameters.maximum+1}`)];
    for(const property of properties.filter(row=>row.parameters.maximumWhen)) {
      const condition=property.parameters.maximumWhen,selector=selectors.find(row=>row.name===condition.propertyKey);
      const replace=(text,key,value)=>text.replace(new RegExp(`^${key}:.*$`,'m'),`${key}: ${value}`);
      const changed=replace(example.yaml,property.parameters.yaml,condition.maximum+1);
      current.rejectedYAML??=[];
      current.rejectedYAML.push(changed);
      const domain=catalog.get('system.'+selector.parameters.typeSE).enum;
      const alternate=Object.keys(domain).find(value=>value!==condition.equals);
      if(!alternate)throw new Error('Conditional bound needs an alternate fixture value');
      current.acceptedYAML=[replace(example.yaml,property.parameters.yaml,condition.maximum),
        replace(replace(example.yaml,selector.parameters.yaml,domain[alternate]),property.parameters.yaml,property.parameters.maximum)];
      const field=property.parameters.xml??property.name[0].toUpperCase()+property.name.slice(1);
      const selectorField=selector.parameters.xml??selector.name[0].toUpperCase()+selector.name.slice(1);
      const xmlNumber=value=>example.xml.replace(new RegExp(`(<ns0:${field}>)[^<]+`),`$1${value}`);
      const reference=current;
      cases.push({...reference,id:id+'-invalid-dependent-bound',xml:xmlNumber(condition.maximum+1),
        yaml:undefined,noRaw:undefined,annotation:`${property.parameters.yaml}: !xml/raw`,
        retainedYAML:[`${selector.parameters.yaml}: ${domain[condition.equals]}`],acceptedYAML:undefined,rejectedYAML:undefined},
        {...reference,id:id+'-alternate-dependent-bound',
          xml:xmlNumber(property.parameters.maximum).replace(new RegExp(`(<ns0:${selectorField}>)[^<]+`),`$1${alternate}`),
          yaml:replace(example.yaml,property.parameters.yaml,property.parameters.maximum)
            .replace(new RegExp(`^${selector.parameters.yaml}:.*(?:\\n|$)`,'m'),''),acceptedYAML:undefined,rejectedYAML:undefined});
    }
   }
  }
 }
 attachCompatibilityContext(modules,cases);
 return {modules,cases,factSources,production,routes};
}
if(process.argv[1]?.endsWith('numeric-owner-operation.mjs')) {
 const {modules,cases,factSources,production,routes}=numericOwnerOperation();
 const productionIds=new Set(production.map(row=>row.id));
 for(const [path,content] of Object.entries({
  'rust/declarations/candidates/numeric-owners.generated.yaml':yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules.filter(row=>!productionIds.has(row.id))},{noRefs:true}),
  'rust/declarations/objects/complete-scalar-owners.generated.yaml':yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:production},{noRefs:true}),
  'rust/operations/complete-scalar-owners.routes.generated.yaml':yaml.dump(routes,{noRefs:true}),
  'tests/migration/numeric-owner-operation.json':JSON.stringify({cases,factSources},null,2)+'\n',
 })) {
  if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==content)throw new Error(`Stale numeric owners: ${path}`);}
  else {mkdirSync(dirname(path),{recursive:true});writeFileSync(path,content);}
 }
}
