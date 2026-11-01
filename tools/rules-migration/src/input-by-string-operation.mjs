import {attachCompatibilityContext} from './configuration-context.mjs';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {candidateCatalog,dependencyFiles,yaml} from './candidate-catalog.mjs';
import {sourceOwnerPlacement,sourceOwnerXmlRoute,sourceRootEnvelope} from './owner-root-source.mjs';
import {composeOwnerFragments} from './owner-composition.mjs';
import {asOwnerFragment} from './owner-fragment.mjs';
import {emitCandidates} from './emit.mjs';
import {namedMemberFactSource} from './named-member-fact-source.mjs';
import {recordFactView,bindFactDefaults} from './record-fact-view.mjs';
import {factSourceOverlay} from './fact-source-overlay.mjs';
import {linkedOwnerSources} from './linked-owner-source.mjs';
import {ownerNumberFactSource,ownerNumberYamlProjection} from './owner-number-facts.mjs';
import {numberStateSource,numericOwnerFragment,numericModes,numericPart,numericDependencies,orderNumericHistory} from './numeric-owner-fragment.mjs';
import {taggedNumberProperties} from './state-contributions.mjs';

const memberProjection=yaml.load(readFileSync('tools/rules-migration/profiles/input-by-string-member-facts.yaml','utf8'));
const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const collectionGraph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
const fixtureNames={
  BusinessProcess:'БизнесПроцессВсеСвойства',
  Catalog:'СправочникПолный',
  ChartOfAccounts:'ПланСчетовВсеСвойства',
  ChartOfCalculationTypes:'ПланРасчетаВсеСвойства',
  ChartOfCharacteristicTypes:'ПланВидовХарактеристикВсеСвойства',
  Document:'ДокументВсеСвойства',
  ExchangePlan:'ПланОбменаВсеСвойства',
  Task:'ЗадачаВсеСвойства',
};
const pascal=name=>name[0].toUpperCase()+name.slice(1);
const xmlName=property=>property.parameters.xml??pascal(property.name);
const standardNames=yaml.load(readFileSync('rust/declarations/common/metadata-path-lexicons.yaml','utf8'))
  .declarations.find(item=>item.id==='common.path-standard-attribute').enum;
const standardXmlName=new Map(Object.entries(standardNames).map(([xml,yaml])=>[yaml,xml]));
const canonicalInputList=(source,standard)=>{
  const actual=source.match(/^ВводПоСтроке:\n(?:  - [^\n]+\n?)+/m);
  if(!actual)return {yaml:source};
  const expected=standard.filter(field=>{
    const length=source.match(new RegExp(`^${field.length.yaml}: (\\d+)$`,'m'));
    return Number(length?.[1]??field.length.implicitValue)>0;
  }).map(field=>field.yaml);
  const selected=[...actual[0].matchAll(/^  - ([^\n]+)$/gm)].map(match=>match[1]);
  if(selected.length!==expected.length || selected.some((field,index)=>field!==expected[index]))
    return {yaml:source};
  return {yaml:source.replace(actual[0],''),
    adaptation:'The source YAML spells the full computed list explicitly; the declared default emits its canonical omission'};
};
export {numericPart} from './numeric-owner-fragment.mjs';
const defaultPart=(field)=>({if:{lt:[{literal:0},numericPart(pascal(field.length.propertyKey))]},
  then:{parseYaml:{sequence:[{literal:field.yaml}]}},else:{sequence:[]}});

export function inputByStringOperation(catalog=candidateCatalog().catalog) {
  const viewProfile=yaml.load(readFileSync('tools/rules-migration/profiles/type-description-fact-view.yaml','utf8'));
  const typeView=recordFactView(catalog.get(viewProfile.base),viewProfile.extension);
  // Current CF/CFE YAML shares one read-only profile. Item spelling comes
  // from the canonical declaration; state tags and eligibility remain YAML
  // declarations. The private XML spelling is an internal fact-view shape,
  // never the TypeDescription conversion contract.
  const baseType=catalog.get(viewProfile.base);
  const primaryField=baseType.value.fields.find(field=>field.name===baseType.representations.yaml.field);
  const primaryPattern=bindFactDefaults(catalog.get('common.type-description-item'));
  primaryPattern.id='candidate.member-source.primary-type-pattern';
  primaryPattern.representations.xml={kind:'text-pattern',parts:primaryPattern.value.fields.flatMap((field,index)=>
    [...(index?[{literal:'|'}]:[]),{field:field.name}])};
  for(const rule of primaryPattern.presence??[])delete rule.xml;
  const taggedModules=viewProfile.primaryTagged.declarations.map(declaration=>({
    format:'nkdk-declarations/1',...structuredClone(declaration)}));
  const taggedItems=structuredClone(catalog.get('common.type-description-items'));
  taggedItems.id='candidate.member-source.primary-type-items';
  taggedItems.imports.item=taggedModules.at(-1).id;
  delete taggedItems.value.item.with;
  const taggedTypeView=recordFactView({
    ...baseType,imports:{...baseType.imports,items:taggedItems.id},value:{kind:'record',fields:[primaryField]},
    representations:{xml:{kind:'record',fields:[]},yaml:baseType.representations.yaml},
    presence:[{target:{field:primaryField.name},xml:{missing:{denotes:{absent:true}}}}],constraints:[],
  },viewProfile.primary);
  catalog=new Map([...catalog,...[typeView,primaryPattern,...taggedModules,taggedItems,taggedTypeView].map(module=>[module.id,module])]);
  const projection={...memberProjection,properties:[{name:'type',use:typeView.id}]};
  const owners=extraction.entries.filter(entry=>entry.properties?.some(property=>property.type==='InputByStringFields'));
  if(owners.length!==8)throw new Error(`Expected eight InputByStringFields owners, got ${owners.length}`);
  const placements=new Map(owners.map(owner=>{
    const root=sourceOwnerXmlRoute(owner).at(-1).slice(3),name=fixtureNames[root];
    if(!name)throw new Error(`No e2e fixture for ${root}`);
    return [owner,{...sourceOwnerPlacement(owner),root,name}];
  }));
  const modules=[typeView,primaryPattern,...taggedModules,taggedItems,taggedTypeView],cases=[],factSources=[],memberSources=new Map(),stateProviders=new Map(),numberProviders=new Map(),primaryMemberSources=new Map();
  const baseHeaders=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([...Array.from(placements.values(),({xmlDir,name})=>
      `e2e/fixtures/xml/cf/${xmlDir}/${name}.xml`),
      'e2e/fixtures/xml/cf/DataProcessors/ОбработкаВсеСвойства.xml'].map(xml=>({xml,ownerHeader:true}))),
    encoding:'utf8'}));
  const linkedBase=linkedOwnerSources(baseHeaders);

  const registerMemberSources=(id,xml,inputs,source,baseXML)=>{
    const key=`${inputs.component}\0${inputs.owner}`;
    if(memberSources.has(key))throw new Error(`Repeated member source: ${id}`);
    const scope={component:inputs.component,owner:inputs.owner};
    const selected=[id];
    if(baseXML!==undefined){
      const overlay=factSourceOverlay(source,{name:'localMembers',
        index:'metadata.input-by-string-local-members',
        type:catalog.get('common.owner-checked-metadata-fields').inputs.members.type});
      const primary=modules.find(module=>module.id===primaryMemberSources.get(source.id));
      if(primary){
        const primaryOverlay=factSourceOverlay(primary,{name:'localMembers',
          index:'metadata.input-by-string-local-members',
          type:catalog.get('common.owner-checked-metadata-fields').inputs.members.type});
        modules.push(primaryOverlay.local,primaryOverlay.base);
        primaryMemberSources.set(overlay.local.id,primaryOverlay.local.id);
        primaryMemberSources.set(overlay.base.id,primaryOverlay.base.id);
      }
      modules.push(overlay.local,overlay.base);
      factSources.push({id,entry:overlay.local.id,xml,inputs:scope},
        {id:`${id}-base`,entry:overlay.base.id,xml:baseXML,inputs:scope});
      selected.push(`${id}-base`);
    }else factSources.push({id,entry:source.id,xml,inputs:scope});
    const stateProvider=stateProviders.get(source.id);
    if(stateProvider){
      const stateId=`${id}-states`;
      factSources.push({id:stateId,entry:stateProvider.id,xml,inputs:{owner:inputs.owner}});
      selected.push(stateId);
    }
    const numbers=numberProviders.get(source.id);
    if(numbers){
      const numberId=id+'-numbers';
      factSources.push({id:numberId,entry:numbers.id,xml:baseXML??xml,inputs:{owner:inputs.owner}});
      selected.push(numberId);
    }
    memberSources.set(key,selected);
  };
  for(const owner of owners) {
    const input=owner.properties.find(property=>property.type==='InputByStringFields');
    const standard=input.parameters.standardFields;
    if(!Array.isArray(standard)||!standard.length)throw new Error(`Missing standard fields for ${owner.symbol}`);
    const standardNames=standard.map(field=>{
      const name=field.yaml.split('СтандартныйРеквизит.')[1];
      const xml=standardXmlName.get(name);
      if(!xml)throw new Error(`Unknown standard field: ${field.yaml}`);
      return xml;
    });
    const route=sourceOwnerXmlRoute(owner);
    if(route.length!==2)throw new Error(`InputByString owner has no root: ${owner.symbol}`);
    const root=route[1].slice(3);
    const {xmlDir,yamlDir,name}=placements.get(owner);
    const fixtureXml=readFileSync(`e2e/fixtures/xml/cf/${xmlDir}/${name}.xml`,'utf8');
    const memberEdges=collectionGraph.edges.filter(edge=>edge.owner.path===owner.path&&
      edge.owner.symbol===owner.symbol&&edge.property==='attributes');
    if(memberEdges.length!==1)throw new Error(`Ambiguous source attributes: ${owner.symbol}`);
    const memberEdge=memberEdges[0];
    const memberSource=namedMemberFactSource(memberEdge,extraction.entries,catalog,
      {md:'http://v8.1c.ru/8.3/MDClasses'},projection);
    modules.push(...memberSource.modules);
    const primarySource=namedMemberFactSource(memberEdge,extraction.entries,catalog,
      {md:'http://v8.1c.ru/8.3/MDClasses'},
      {...memberProjection,properties:[{name:'type',use:taggedTypeView.id}]});
    modules.push(...primarySource.modules);
    primaryMemberSources.set(memberSource.source.id,primarySource.source.id);
    const standardLengths=[...new Set(standard.map(field=>field.length.propertyKey))].map(name=>{
      const property=owner.properties.find(item=>item.name===name);
      if(!property||property.type!=='number'||property.parameters.yaml!==
        standard.find(field=>field.length.propertyKey===name).length.yaml)
        throw new Error(`Missing source length rule: ${owner.symbol}.${name}`);
      return property;
    });
    const lengths=[...new Map([...standardLengths,...taggedNumberProperties(owner)].map(property=>[property.name,property])).values()];
    const selectors=numericDependencies(lengths,owner);
    const stateSource=numberStateSource(`candidate.input-by-string-states.${root.toLowerCase()}`,route);
    modules.push(stateSource);
    stateProviders.set(memberSource.source.id,stateSource);
    const numberSource=ownerNumberFactSource(`candidate.input-by-string-base-numbers.${root.toLowerCase()}`,route,lengths.map(xmlName),selectors);
    modules.push(numberSource);numberProviders.set(memberSource.source.id,numberSource);
    const id=`candidate.input-by-string.${root.toLowerCase()}`;
    const sourcePosition=property=>{
      const position=fixtureXml.indexOf(`<${xmlName(property)}>`);
      if(position<0)throw new Error(`Missing fixture XML field: ${owner.symbol}.${property.name}`);
      return position;
    };
    const properties=[...lengths,...selectors,input].sort((left,right)=>sourcePosition(left)-sourcePosition(right));
    const fragment=numericOwnerFragment(`fragment.input-by-string.${root.toLowerCase()}`,route,
      lengths,catalog,selectors,owner);
    const fields=properties.map(property=>property===input?
      {name:'InputByString',type:{use:'fields',bind:{ownerRoot:{literal:root},ownerName:{input:'name'},
        component:{input:'component'},owner:{input:'owner'},members:{input:'members'},
        memberRole:{literal:memberEdge.context.ownerFactRole},
        memberKind:{literal:memberEdge.mapping.xml.split(':').at(-1)},
        standardNames:{sequence:standardNames.map(name=>({literal:name}))}}}}:
      fragment.value.fields.find(field=>field.name===xmlName(property)));
    fragment.imports.fields='common.owner-checked-metadata-fields';
    fragment.inputs={name:{type:{kind:'scalar',scalar:'text'}},component:{type:{kind:'scalar',scalar:'text'}},
      members:structuredClone(catalog.get('common.owner-checked-metadata-fields').inputs.members),...fragment.inputs};
    fragment.value.fields=[fragment.value.fields[0],...fields];
    fragment.representations.xml.fields=[fragment.representations.xml.fields[0],...properties.map(property=>({
      field:xmlName(property),path:[...route,'md:Properties',`md:${xmlName(property)}`]}))];
    fragment.representations.yaml.fields=properties.map(property=>({field:xmlName(property),key:property.parameters.yaml}))
      .concat([{field:'history',key:'Состояния'}]);
    orderNumericHistory(fragment);
    fragment.presence.push(
      {target:{field:'InputByString'},
        xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{sequence:[]}}],
          canonical:[{when:{and:[{input:'adopted'},
            {not:{present:{field:'InputByString'}}}]},form:'missing'},{form:'ordinary'}]},
        yaml:{default:{if:{input:'adopted'},then:{absent:true},
          else:standard.length===1?defaultPart(standard[0]):{concat:standard.map(defaultPart)}},
          empty:[{form:'empty-sequence',denotes:{sequence:[]}}]}});
    const module=composeOwnerFragments(id,[{alias:'part',fragment,
      bindings:{name:'name',adopted:'adopted',component:'component',owner:'owner',members:'members',states:'states',baseNumbers:'baseNumbers',compatibilityMode:'compatibilityMode'}}]);
    module.inputs.members.index=memberProjection.index;
    module.inputs.states.index='metadata.property-state-membership';
    module.inputs.baseNumbers.index='metadata.base-owner-numbers';
    modules.push(fragment,module);
    const example=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
      input:JSON.stringify([{xml:`e2e/fixtures/xml/cf/${xmlDir}/${name}.xml`,
        yaml:`e2e/fixtures/nkdk/cf/${yamlDir}/${name}/Свойства.yaml`,
        ownerFields:{propertyStates:[...lengths,...selectors].map(xmlName),properties:properties.map(property=>({
          xml:xmlName(property),yaml:property.parameters.yaml,optional:true}))}}]),
      encoding:'utf8'}))[0];
    const inputs={name:example.ownerPath.split('.').at(-1),adopted:false,
      component:'cf',owner:example.ownerIdentity};
    const canonical=canonicalInputList(example.yaml,standard);
    registerMemberSources(`input-by-string-${root.toLowerCase()}-cf-members`,fixtureXml,inputs,memberSource.source);
    cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-cf`,entry:id,
      xml:example.xml,yaml:canonical.yaml,inputs,
      xmlQNamePaths:example.xmlQNamePaths,factSourceEntries:[id],source:example.source,noRaw:true,
      ...(canonical.adaptation?{adaptation:canonical.adaptation}:{})});
    const nameProperty=owner.properties.find(property=>property.name==='name');
    if(!nameProperty)throw new Error(`Source owner has no name property: ${owner.symbol}`);
    const nameEmission=emitCandidates([{...owner,properties:[nameProperty],
      comparison:{status:'keys-match'},propertyStates:[],xmlOrder:{status:'absent'}}],catalog);
    if(nameEmission.entries[0].properties[0].status!=='candidate')
      throw new Error(`Owner name cannot be emitted declaratively: ${owner.symbol}`);
    const nameSource=nameEmission.modules.find(item=>item.kind==='fragment');
    if(!nameSource)throw new Error(`Owner name fragment is missing: ${owner.symbol}`);
    const nameFragment=asOwnerFragment({...nameSource,
      namespaces:{...nameSource.namespaces,md:'http://v8.1c.ru/8.3/MDClasses'}},
    `fragment.${root.toLowerCase()}-source-name`,route,'md');
    const composed=composeOwnerFragments(`candidate.${root.toLowerCase()}-name-and-input`,[
      {alias:'name',fragment:nameFragment,bindings:{ownerName:'name'}},
      {alias:'input',fragment,bindings:{name:'name',adopted:'adopted',
        component:'component',owner:'owner',members:'members',states:'states',baseNumbers:'baseNumbers',compatibilityMode:'compatibilityMode'}},
    ]);
    composed.xmlOrder=['history',...nameFragment.representations.xml.fields.map(field=>field.field),
      ...properties.map(xmlName)];
    composed.inputs.members.index=memberProjection.index;
    composed.inputs.states.index='metadata.property-state-membership';
    composed.inputs.baseNumbers.index='metadata.base-owner-numbers';
    modules.push(nameFragment,composed);
    const composedExample=JSON.parse(execFileSync('python3',
      ['tools/rules-migration/src/project-fixtures.py'],{
        input:JSON.stringify([{xml:`e2e/fixtures/xml/cf/${xmlDir}/${name}.xml`,
          yaml:`e2e/fixtures/nkdk/cf/${yamlDir}/${name}/Свойства.yaml`,
          ownerFields:{propertyStates:[...lengths,...selectors].map(xmlName),properties:[{xml:'Name'},...properties.map(property=>({
            xml:xmlName(property),yaml:property.parameters.yaml,optional:true}))]}}]),
        encoding:'utf8'}))[0];
    const composedCanonical=canonicalInputList(composedExample.yaml,standard);
    cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-composed-cf`,entry:composed.id,
      xml:composedExample.xml,yaml:composedCanonical.yaml,inputs,
      xmlQNamePaths:composedExample.xmlQNamePaths,factSourceEntries:[composed.id],
      source:composedExample.source,noRaw:true,
      ...(composedCanonical.adaptation?{adaptation:composedCanonical.adaptation}:{})});
    const xmlList=example.xml.match(/<ns0:InputByString>[\s\S]*?<\/ns0:InputByString>/);
    const yamlList=example.yaml.match(/^ВводПоСтроке:\n(?:  - [^\n]+\n?)+/m);
    if(!xmlList||!yamlList)throw new Error(`Missing explicit fixture list: ${owner.symbol}`);
    const standardPaths=standardNames.map(name=>`${root}.${inputs.name}.StandardAttribute.${name}`);
    const defaultXML=example.xml.replace(xmlList[0],
      `<ns0:InputByString>${standardPaths.map(path=>`<xr:Field>${path}</xr:Field>`).join('')}</ns0:InputByString>`);
    const defaultYAML=example.yaml.replace(yamlList[0],
      `ВводПоСтроке:\n${standard.map(field=>`  - ${field.yaml}\n`).join('')}`);
    const missingYAML=defaultYAML.replace(/^ВводПоСтроке:\n(?:  - [^\n]+\n?)+/m,'');
    cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-default`,entry:id,
      xml:defaultXML,yaml:missingYAML,inputs,rejectedYAML:[defaultYAML],
      rejectedCode:'yaml.implicit-value',
      xmlQNamePaths:example.xmlQNamePaths,factSourceEntries:[id],
      source:example.source,noRaw:true});
    const acceptedTypes=root==='Document'?[['boolean','ИндексированноеПоле','РеквизитБулево']]:
      root==='Catalog'?[['date','СтроковыйРеквизитСИндексом','РеквизитСправочника'],
        ['reference-only','СтроковыйРеквизитСИндексом','Реквизит1']]:[];
    for(const [label,before,after] of acceptedTypes){
      const xml=example.xml.replace(`${root}.${inputs.name}.Attribute.${before}`,
        `${root}.${inputs.name}.Attribute.${after}`);
      const expected=example.yaml.replace(`  - Реквизит.${before}`,`  - Реквизит.${after}`);
      if(xml===example.xml||expected===example.yaml)throw new Error(`Missing source type case: ${label}`);
      // AnyIBRef is a reference type and must not be accepted as a scalar.
      const invalid=label==='reference-only';
      cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-${label}-type`,entry:id,xml,
        ...(invalid?{annotation:'ВводПоСтроке: !xml/invalid',rejectedYAML:[expected],
          retainedYAML:['  - СтандартныйРеквизит.Код']}:{yaml:expected,noRaw:true}),
        inputs,xmlQNamePaths:example.xmlQNamePaths,source:example.source});
    }
    if(['Document','Catalog'].includes(root)){
      const property=lengths[0];
      const field=xmlName(property);
      const bare=root==='Catalog';
      const value=bare?String(property.parameters.implicitValueYAML):
        example.xml.match(new RegExp(`<ns0:${field}>([^<]+)</ns0:${field}>`))?.[1];
      if(value===undefined)throw new Error(`Missing Notify numeric fixture: ${field}`);
      const state=`<xr:PropertyState><xr:Property>${field}</xr:Property><xr:State>Notify</xr:State></xr:PropertyState>`;
      const withNamespace=example.xml.includes('xmlns:xr=')?example.xml:example.xml.replace(
        '<ns0:MetaDataObject ','<ns0:MetaDataObject xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" ');
      const xml=withNamespace.replace(
        '<ns0:InternalInfo />',`<ns0:InternalInfo>${state}</ns0:InternalInfo>`).replace(
        new RegExp(`<ns0:${field}>[^<]+</ns0:${field}>`),`<ns0:${field}>${value}</ns0:${field}>`);
      if(!xml.includes(state))throw new Error('Missing InternalInfo projection for Notify');
      const expected=example.yaml.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),
        `${property.parameters.yaml}: !проверять${bare?'':' '+value}`);
      const sources=memberSources.get(`${inputs.component}\0${inputs.owner}`);
      const stateId=id+'-notify-states';
      factSources.push({id:stateId,entry:stateSource.id,xml,inputs:{owner:inputs.owner}});
      cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-notify`,entry:id,xml,annotation:`${property.parameters.yaml}: !xml/raw`,
        inputs,source:example.source,xmlQNamePaths:example.xmlQNamePaths,
        factBindings:{members:memberProjection.index,states:'metadata.property-state-membership',baseNumbers:'metadata.base-owner-numbers'},
        factSourceEntries:[...sources.filter(id=>!id.endsWith('-states')),stateId],
        rejectedYAML:[expected],rejectedCode:'state.mode.unavailable'});
    }
    if(root==='Document'){
      const invalidLengthXML=example.xml.replace(/<ns0:NumberLength>[^<]*<\/ns0:NumberLength>/,
        '<ns0:NumberLength>oops</ns0:NumberLength>');
      if(invalidLengthXML===example.xml)throw new Error('Missing numeric length in document fixture');
      cases.push({id:'e2e-input-by-string-document-invalid-length',entry:id,
        xml:invalidLengthXML,annotation:'ДлинаНомера: !xml/raw',
        retainedYAML:['  - Реквизит.ИндексированноеПоле'],
        inputs,xmlQNamePaths:example.xmlQNamePaths,source:example.source});
    }
    if(root==='Document'){
      const rejectedXML=example.xml.replace('Document.ДокументВсеСвойства.Attribute.ИндексированноеПоле',
        'Document.ДокументВсеСвойства.Attribute.ПолныйРеквизит');
      const rejectedYAML=example.yaml.replace('  - Реквизит.ИндексированноеПоле',
        '  - Реквизит.ПолныйРеквизит');
      if(rejectedXML===example.xml||rejectedYAML===example.yaml)
        throw new Error('Document storage field fixture was not changed');
      cases.push({id:'e2e-input-by-string-document-ineligible-type',entry:id,
        xml:rejectedXML,annotation:'ВводПоСтроке: !xml/invalid',
        retainedYAML:['  - СтандартныйРеквизит.Номер'],rejectedYAML:[rejectedYAML],
        inputs,xmlQNamePaths:example.xmlQNamePaths,source:example.source});
    }
    for(const extension of [
      {name,adopted:true,id:'adopted'},
      {name:root==='Catalog'?'СправочникCоВсемиОбъектамиExt':`${name}Ext`,adopted:false,id:'own'},
    ]) {
      const extensionPath=`e2e/fixtures/xml/cfe/all-extension/${xmlDir}/${extension.name}.xml`;
      const header=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
        input:JSON.stringify([{xml:extensionPath,ownerHeader:true}]),encoding:'utf8'}))[0];
      const base=linkedBase(header);
      if(Boolean(base)!==extension.adopted)throw new Error(`Unexpected linked base: ${extensionPath}`);
      const extensionExample=JSON.parse(execFileSync('python3',
        ['tools/rules-migration/src/project-fixtures.py'],{
          input:JSON.stringify([{xml:extensionPath,
            yaml:`e2e/fixtures/nkdk/cfe/Расширение_All/${yamlDir}/${extension.name}/Свойства.yaml`,
            ownerFields:{propertyStates:[...lengths,...selectors].map(xmlName),properties:properties.map(property=>({
              xml:xmlName(property),yaml:property.parameters.yaml,optional:true}))}}]),
          encoding:'utf8'}))[0];
      if(extensionExample.xml.includes('InputByString')===extension.adopted)
        throw new Error(`Unexpected extension InputByString presence: ${extension.name}`);
      const extensionInputs={name:extension.name,adopted:extension.adopted,
        component:'cfe/all-extension',owner:extensionExample.ownerIdentity};
      registerMemberSources(`input-by-string-${root.toLowerCase()}-${extension.id}-members`,
        readFileSync(extensionPath,'utf8'),extensionInputs,memberSource.source,
        base?readFileSync(base.source[0].path,'utf8'):undefined);
      const namedExtension=JSON.parse(execFileSync('python3',
        ['tools/rules-migration/src/project-fixtures.py'],{
          input:JSON.stringify([{xml:extensionPath,
            yaml:`e2e/fixtures/nkdk/cfe/Расширение_All/${yamlDir}/${extension.name}/Свойства.yaml`,
            ownerFields:{propertyStates:[...lengths,...selectors].map(xmlName),properties:[{xml:'Name'},...properties.map(property=>({
              xml:xmlName(property),yaml:property.parameters.yaml,optional:true}))]}}]),
          encoding:'utf8'}))[0];
      cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-${extension.id}-cfe`,entry:composed.id,
        xml:namedExtension.xml,yaml:namedExtension.yaml,inputs:extensionInputs,
        xmlQNamePaths:namedExtension.xmlQNamePaths,
        source:[...namedExtension.source,...(base?.source??[])],noRaw:true,
        ...(namedExtension.adaptation?{adaptation:namedExtension.adaptation}:{}),
        ...(root==='Catalog'&&extension.adopted?{rejectedYAML:[namedExtension.yaml.replace('ДлинаКода: 11','ДлинаКода: 12')],rejectedCode:'base.value.changed'}:{})});
      if(extension.adopted && ['Document','Catalog'].includes(root)){
        const property=lengths[0],field=xmlName(property);
        const xml=namedExtension.xml.replace(/<xr:PropertyState>[\s\S]*?<\/xr:PropertyState>/g,row=>
          row.includes(`<xr:Property>${field}</xr:Property>`)?'':row).replace(
          /<ns0:InternalInfo>\s*<\/ns0:InternalInfo>/,'<ns0:InternalInfo />').replace(
          new RegExp(`<ns0:${field}>[^<]+</ns0:${field}>`),
          `<ns0:${field}>${property.parameters.implicitValueYAML}</ns0:${field}>`);
        const expected=namedExtension.yaml.replace(new RegExp(`^${property.parameters.yaml}:.*$`,'m'),
          `${property.parameters.yaml}:`);
        const sources=memberSources.get(`${extensionInputs.component}\0${extensionInputs.owner}`);
        const stateId=id+'-controlled-default-states';
        factSources.push({id:stateId,entry:stateSource.id,xml,inputs:{owner:extensionInputs.owner}});
        cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-controlled-default`,entry:composed.id,
          xml,annotation:`${property.parameters.yaml}: !xml/raw`,rejectedYAML:[expected],rejectedCode:'base.value.changed',inputs:extensionInputs,xmlQNamePaths:namedExtension.xmlQNamePaths,
          source:[...namedExtension.source,...(base?.source??[])],
          factBindings:{members:memberProjection.index,states:'metadata.property-state-membership',baseNumbers:'metadata.base-owner-numbers'},
          factSourceEntries:[...sources.filter(id=>!id.endsWith('-states')),stateId]});
        for(const [mode,tag] of [['Notify','проверять'],['Extended','изменять']]){
          const namespaced=xml.includes('xmlns:xr=')?xml:xml.replace('<ns0:MetaDataObject ',
            '<ns0:MetaDataObject xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" ');
          const state=`<xr:PropertyState><xr:Property>${field}</xr:Property><xr:State>${mode}</xr:State></xr:PropertyState>`;
          const taggedXml=namespaced.includes('<ns0:InternalInfo />')?
            namespaced.replace('<ns0:InternalInfo />',`<ns0:InternalInfo>${state}</ns0:InternalInfo>`):
            namespaced.replace('</ns0:InternalInfo>',`${state}</ns0:InternalInfo>`);
          if(!taggedXml.includes(state))throw new Error('Missing projected state container');
          const taggedExpected=expected.replace(`${property.parameters.yaml}:`,`${property.parameters.yaml}: !${tag}`);
          const taggedStateId=stateId+'-'+mode.toLowerCase();
          factSources.push({id:taggedStateId,entry:stateSource.id,xml:taggedXml,inputs:{owner:extensionInputs.owner}});
          cases.push({id:`e2e-input-by-string-${root.toLowerCase()}-base-${mode.toLowerCase()}`,entry:composed.id,
            xml:taggedXml,yaml:taggedExpected,inputs:extensionInputs,xmlQNamePaths:namedExtension.xmlQNamePaths,
            source:[...namedExtension.source,...(base?.source??[])],noRaw:true,
            ...(mode==='Notify'?{diagnosticsByPhase:{xmlToYaml:[],yamlToXml:['base.value.changed'],validation:['base.value.changed']}}:{}),
            factBindings:{members:memberProjection.index,states:'metadata.property-state-membership',baseNumbers:'metadata.base-owner-numbers'},
            factSourceEntries:[...sources.filter(id=>!id.endsWith('-states')),taggedStateId]});
        }
      }
      if(root==='Catalog'&&extension.adopted)for(const scenario of [
        {id:'scalar-types',fields:['СтроковыйРеквизитСИндексом','РеквизитСправочника'],valid:true},
        {id:'reference-type',fields:['СтроковыйРеквизитСИндексом','Реквизит1'],valid:false},
      ]){
        const xml=extensionExample.xml.replace('<ns0:MetaDataObject ',
          '<ns0:MetaDataObject xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" ').replace(
          '</ns0:Properties>',`<ns0:InputByString>${scenario.fields.map(field=>
            `<xr:Field>Catalog.${extension.name}.Attribute.${field}</xr:Field>`).join('')}</ns0:InputByString></ns0:Properties>`);
        const expected=extensionExample.yaml.trimEnd()+`\nВводПоСтроке:\n${scenario.fields.map(field=>`  - Реквизит.${field}\n`).join('')}`;
        cases.push({id:`e2e-input-by-string-catalog-adopted-${scenario.id}`,entry:id,xml,
          ...(scenario.valid?{yaml:expected,noRaw:true}:{annotation:'ВводПоСтроке: !xml/invalid',
            retainedYAML:['  - Реквизит.СтроковыйРеквизитСИндексом'],rejectedYAML:[expected]}),
          inputs:extensionInputs,xmlQNamePaths:extensionExample.xmlQNamePaths,source:extensionExample.source});
      }
    }
    if(root==='Catalog'){
      const codePath=`<xr:Field>${root}.${inputs.name}.StandardAttribute.Code</xr:Field>`;
      const oneZeroXML=defaultXML.replace(codePath,'').replace(
        /<ns0:CodeLength>\d+<\/ns0:CodeLength>/,'<ns0:CodeLength>0</ns0:CodeLength>');
      const oneZeroYAML=defaultYAML.replace('  - СтандартныйРеквизит.Код\n','').replace(
        /ДлинаКода: \d+/, 'ДлинаКода: 0');
      const oneZeroMissingYAML=oneZeroYAML.replace(/^ВводПоСтроке:\n(?:  - [^\n]+\n?)+/m,'');
      if(oneZeroXML===defaultXML||oneZeroYAML===defaultYAML||
        oneZeroMissingYAML===oneZeroYAML)
        throw new Error('Catalog mixed-length fixture could not be constructed');
      cases.push({id:'e2e-input-by-string-catalog-one-zero-length',entry:id,
        xml:oneZeroXML,yaml:oneZeroMissingYAML,inputs,rejectedYAML:[oneZeroYAML],
        rejectedCode:'yaml.implicit-value',
        xmlQNamePaths:example.xmlQNamePaths,factSourceEntries:[id],
        source:example.source,noRaw:true});
      const invalidXml=example.xml.replace(
        'Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом',
        'Unknown.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом');
      if(invalidXml===example.xml)throw new Error('Catalog invalid field fixture was not changed');
      cases.push({id:'e2e-input-by-string-catalog-invalid-field',entry:id,xml:invalidXml,
        annotation:'ВводПоСтроке: !xml/raw',
        retainedYAML:['    - СтандартныйРеквизит.Наименование','    - СтандартныйРеквизит.Код'],
        inputs,xmlQNamePaths:example.xmlQNamePaths,
        factSourceEntries:[id],source:example.source});
      const missingMemberXML=example.xml.replace(
        'Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом',
        'Catalog.СправочникПолный.Attribute.ОтсутствующийРеквизит');
      const missingMemberYAML=example.yaml.replace(
        'Реквизит.СтроковыйРеквизитСИндексом','Реквизит.ОтсутствующийРеквизит');
      if(missingMemberXML===example.xml||missingMemberYAML===example.yaml)
        throw new Error('Catalog missing member fixture was not changed');
      cases.push({id:'e2e-input-by-string-catalog-missing-member',entry:id,
        xml:missingMemberXML,annotation:'ВводПоСтроке: !xml/invalid',
        retainedYAML:['  - СтандартныйРеквизит.Наименование','  - СтандартныйРеквизит.Код'],
        rejectedYAML:[missingMemberYAML],
        inputs,xmlQNamePaths:example.xmlQNamePaths,
        factSourceEntries:[id],source:example.source});
      const unsupportedStandardXML=example.xml.replace(
        'Catalog.СправочникПолный.StandardAttribute.Code',
        'Catalog.СправочникПолный.StandardAttribute.Date');
      const unsupportedStandardYAML=example.yaml.replace(
        'СтандартныйРеквизит.Код','СтандартныйРеквизит.Дата');
      if(unsupportedStandardXML===example.xml||unsupportedStandardYAML===example.yaml)
        throw new Error('Catalog unsupported standard field fixture was not changed');
      cases.push({id:'e2e-input-by-string-catalog-unsupported-standard',entry:id,
        xml:unsupportedStandardXML,annotation:'ВводПоСтроке: !xml/invalid',
        retainedYAML:['  - СтандартныйРеквизит.Наименование','  - Реквизит.СтроковыйРеквизитСИндексом'],
        rejectedYAML:[unsupportedStandardYAML],
        inputs,xmlQNamePaths:example.xmlQNamePaths,
        factSourceEntries:[id],source:example.source});
      const wrongMemberKindXML=example.xml.replace(
        'Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом',
        'Catalog.СправочникПолный.Form.СтроковыйРеквизитСИндексом');
      const wrongMemberKindYAML=example.yaml.replace(
        'Реквизит.СтроковыйРеквизитСИндексом','Форма.СтроковыйРеквизитСИндексом');
      if(wrongMemberKindXML===example.xml||wrongMemberKindYAML===example.yaml)
        throw new Error('Catalog wrong member kind fixture was not changed');
      cases.push({id:'e2e-input-by-string-catalog-wrong-member-kind',entry:id,
        xml:wrongMemberKindXML,annotation:'ВводПоСтроке: !xml/invalid',
        retainedYAML:['  - СтандартныйРеквизит.Наименование','  - СтандартныйРеквизит.Код'],
        rejectedYAML:[wrongMemberKindYAML],
        inputs,xmlQNamePaths:example.xmlQNamePaths,source:example.source});
    }
  }
  // This independent collection example exercises inherited members on a real
  // sparse extension, without adding InputByString to that metadata owner.
  const sparseOwner=extraction.entries.find(entry=>entry.properties?.some(property=>
    property.type==='XMLRoot'&&property.parameters.container==='DataProcessor'));
  const sparseEdge=collectionGraph.edges.find(edge=>edge.owner.path===sparseOwner.path&&
    edge.owner.symbol===sparseOwner.symbol&&edge.property==='attributes');
  const sparseMembers=namedMemberFactSource(sparseEdge,extraction.entries,catalog,
    {md:'http://v8.1c.ru/8.3/MDClasses'},projection);
  modules.push(...sparseMembers.modules);
  const sparsePath='e2e/fixtures/xml/cfe/all-extension/DataProcessors/ОбработкаВсеСвойства.xml';
  const sparseHeader=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([{xml:sparsePath,ownerHeader:true}]),encoding:'utf8'}))[0];
  const sparseInputs={ownerRoot:'DataProcessor',ownerName:sparseHeader.name,
    component:'cfe:Расширение_All',owner:sparseHeader.identity,
    memberRole:sparseEdge.context.ownerFactRole,memberKind:'Attribute',standardNames:[]};
  const sparseProbe={format:'nkdk-declarations/1',kind:'object',
    id:'candidate.member-source.probe.inherited-fields',
    imports:{...catalog.get('common.owner-checked-metadata-fields').imports,
      fields:'common.owner-checked-metadata-fields'},
    inputs:structuredClone(catalog.get('common.owner-checked-metadata-fields').inputs),
    value:{kind:'record',fields:[{name:'fields',type:{use:'fields',bind:
      Object.fromEntries(Object.keys(sparseInputs).concat('members').map(name=>[name,{input:name}]))}}]},
    representations:{xml:{kind:'record',fields:[{field:'fields',path:['Probe','List']}]},
      yaml:{kind:'mapping',fields:[{field:'fields',key:'Fields'}]}}};
  sparseProbe.inputs.members.index=memberProjection.index;
  modules.push(sparseProbe);
  const sparseSource='input-by-string-sparse-cfe-members';
  const sparseBasePath=linkedBase(sparseHeader).source[0].path;
  registerMemberSources(sparseSource,readFileSync(sparsePath,'utf8'),sparseInputs,
    sparseMembers.source,readFileSync(sparseBasePath,'utf8'));
  for(const invalid of [false,true]){
    const fields=['РеквизитПоУмолчанию',invalid?'РеквизитВсеСвойства':'РеквизитБулево'];
    const text=`<Probe><List xmlns:xr="http://v8.1c.ru/8.3/xcf/readable">${fields.map(name=>
      `<xr:Field>DataProcessor.${sparseHeader.name}.Attribute.${name}</xr:Field>`).join('')}</List></Probe>`;
    const expected='Fields:\n'+fields.map(name=>`  - Реквизит.${name}\n`).join('');
    cases.push({id:`e2e-input-by-string-inherited-${invalid?'invalid':'valid'}`,
      entry:sparseProbe.id,xml:text,inputs:sparseInputs,
      factBindings:{members:memberProjection.index},factSourceEntries:memberSources.get(`${sparseInputs.component}\0${sparseInputs.owner}`),
      source:sparseHeader.source,...(invalid?{annotation:'Fields: !xml/invalid',
        retainedYAML:['  - Реквизит.РеквизитПоУмолчанию'],rejectedYAML:[expected]}:{yaml:expected,noRaw:true})});
  }
  for(const item of cases){
    if(item.factBindings)continue;
    const source=memberSources.get(`${item.inputs.component}\0${item.inputs.owner}`);
    if(!source)throw new Error(`Missing member source for ${item.id}`);
    item.factBindings={members:memberProjection.index,states:'metadata.property-state-membership',baseNumbers:'metadata.base-owner-numbers'};
    item.factSourceEntries=source;
  }
  // The same declared projection consumes the current primary YAML. No
  // captured XML or pre-extracted member list may replace this source.
  for(const {root,yamlDir,name} of placements.values()) {
    const original=cases.find(item=>item.id===`e2e-input-by-string-${root.toLowerCase()}-cf`);
    if(!original)throw new Error(`Missing primary member contract: ${root}`);
    const provider=factSources.find(source=>source.id===original.factSourceEntries[0]);
    const id=provider.id+'-current-yaml';
    factSources.push({...provider,id,entry:primaryMemberSources.get(provider.entry),xml:undefined,
      yaml:readFileSync(`e2e/fixtures/nkdk/cf/${yamlDir}/${name}/Свойства.yaml`,'utf8')});
    cases.push({...original,id:original.id+'-current-yaml-members',
      factSourceEntries:original.factSourceEntries.map(source=>source===provider.id?id:source)});
  }
  for(const {root,yamlDir,name} of placements.values()) {
    for(const extension of ['adopted','own']) {
      const original=cases.find(item=>item.id===`e2e-input-by-string-${root.toLowerCase()}-${extension}-cfe`);
      const selected=new Map();
      for(const [index,sourceId] of original.factSourceEntries.entries()) {
        if(index>(original.inputs.adopted?1:0))break;
        const provider=factSources.find(source=>source.id===sourceId);
        const yamlPath=index===0
          ?`e2e/fixtures/nkdk/cfe/Расширение_All/${yamlDir}/${original.inputs.name}/Свойства.yaml`
          :`e2e/fixtures/nkdk/cf/${yamlDir}/${name}/Свойства.yaml`;
        const id=provider.id+'-current-yaml';
        factSources.push({...provider,id,entry:primaryMemberSources.get(provider.entry),xml:undefined,
          yaml:readFileSync(yamlPath,'utf8')});
        selected.set(sourceId,id);
      }
      cases.push({...original,id:original.id+'-current-yaml-members',
        factSourceEntries:original.factSourceEntries.map(id=>selected.get(id)??id)});
    }
  }
  const currentExtension=cases.find(item=>item.id==='e2e-input-by-string-catalog-adopted-cfe-current-yaml-members');
  for(const suffix of ['scalar-types','reference-type']) {
    const original=cases.find(item=>item.id===`e2e-input-by-string-catalog-adopted-${suffix}`);
    cases.push({...original,id:original.id+'-current-yaml',factSourceEntries:currentExtension.factSourceEntries});
  }
  const currentScalar=cases.find(item=>item.id==='e2e-input-by-string-catalog-adopted-scalar-types-current-yaml');
  const currentLocal=factSources.find(source=>source.id===currentScalar.factSourceEntries[0]);
  const localRow=currentLocal.yaml.match(/^  СтроковыйРеквизитСИндексом:\n(?:    .*\n)+/m)?.[0];
  if(!localRow?.includes('!изменять Булево'))throw new Error('Missing tagged current YAML type evidence');
  const localReference=localRow.replace(/    Тип:\n(?:      .*\n)+/,'    Тип: ЛюбаяСсылка\n');
  for(const [suffix,value,valid] of [
    ['reference-shadow',currentLocal.yaml.replace(localRow,localReference),false],
    ['removed-local',currentLocal.yaml.replace(localRow,''),true],
    ['notified-types',currentLocal.yaml.replaceAll('!изменять Булево','!проверять Булево'),true],
  ]){
    const sourceId=currentLocal.id+'-'+suffix;
    factSources.push({...currentLocal,id:sourceId,yaml:value});
    cases.push({...currentScalar,id:currentScalar.id+'-'+suffix,
      ...(!valid?{yaml:undefined,noRaw:undefined,annotation:'ВводПоСтроке: !xml/invalid',
        rejectedYAML:[currentScalar.yaml],rejectedCode:'metadata.target-missing'}:{}),
      factSourceEntries:currentScalar.factSourceEntries.map(id=>id===currentLocal.id?sourceId:id)});
  }
  const currentCatalog=cases.find(item=>item.id==='e2e-input-by-string-catalog-cf-current-yaml-members');
  const currentProvider=factSources.find(source=>source.id===currentCatalog.factSourceEntries[0]);
  const row=currentProvider.yaml.match(/^  СтроковыйРеквизитСИндексом:\n(?:    .*\n)+/m)?.[0];
  if(!row?.includes('Тип: Строка(10)'))throw new Error('Missing current YAML type evidence');
  for(const [name,replacement] of [['removed',''],['reference-type',row.replace('Тип: Строка(10)','Тип: ЛюбаяСсылка')]]) {
    const sourceId=currentProvider.id+'-'+name;
    factSources.push({...currentProvider,id:sourceId,yaml:currentProvider.yaml.replace(row,replacement)});
    cases.push({...currentCatalog,id:currentCatalog.id+'-'+name,yaml:undefined,noRaw:undefined,
      annotation:'ВводПоСтроке: !xml/invalid',rejectedYAML:[currentCatalog.yaml],rejectedCode:'metadata.target-missing',
      factSourceEntries:currentCatalog.factSourceEntries.map(id=>id===currentProvider.id?sourceId:id)});
  }
  attachCompatibilityContext(modules,cases);
  const unique=[...new Map(modules.map(module=>[module.id,module])).values()];
  const local=new Map(unique.map(module=>[module.id,module]));
  const roots=[...new Set(primaryMemberSources.values())].sort().map(id=>{
    const source=local.get(id);
    if(!source?.contributions?.length)throw new Error(`Missing production member source: ${id}`);
    return source;
  });
  const dependencies=dependencyFiles(roots,new Map([...catalog,...local])).filter(module=>local.has(module.id));
  if(dependencies.some(module=>module.kind!=='value'))throw new Error('Production member view contains an undeclared object dependency');
  const identityProfile=yaml.load(readFileSync('tools/rules-migration/profiles/owner-retained-identity.yaml','utf8'));
  const states=[...stateProviders.values()];
  const numbers=[];
  const identities=[],routes={format:'nkdk-operation-routes/1',routes:[],factRoutes:[]};
  for(const [owner,{xmlDir,yamlDir,root}] of placements){
    const route=sourceOwnerXmlRoute(owner);
    const identity={...structuredClone(identityProfile),id:`migration.input-by-string-identity.${root.toLowerCase()}`};
    for(const field of identity.representations.xml.fields)field.path=[...route,...field.path];
    const attributes=sourceRootEnvelope(owner).attributes;
    if(attributes.length)identity.representations.xml={kind:'with-attributes',attributes,content:identity.representations.xml};
    identities.push(identity);
    routes.factRoutes.push({xmlDir,entry:identity.id,factDirections:['xml-to-yaml'],inputs:{}});
    const state=states.find(module=>module.representations.xml.fields[0].path.length===route.length+1 &&
      route.every((part,index)=>part===module.representations.xml.fields[0].path[index]));
    if(!state)throw new Error(`Missing source state contract: ${owner.symbol}`);
    routes.factRoutes.push({xmlDir,entry:state.id,factDirections:['xml-to-yaml','yaml-to-xml'],
      inputs:{owner:{snapshot:{entry:identity.id,field:'Идентификатор',storage:'external'}}}});
    const providers=roots.filter(module=>module.representations.xml.fields.some(field=>
      field.path.length===route.length+1 && field.path.at(-1)==='md:ChildObjects' &&
      route.every((part,index)=>part===field.path[index])));
    if(providers.length!==3)throw new Error(`Ambiguous primary member routes: ${owner.symbol}`);
    const numberSource=[...numberProviders.values()].find(module=>module.representations.xml.fields.some(field=>
      route.every((part,index)=>part===field.path[index])));
    if(!numberSource)throw new Error(`Missing numeric base source: ${owner.symbol}`);
    const number=ownerNumberYamlProjection(numberSource,owner.properties);
    numbers.push(number);
    for(const component of ['cf','cfe']){
      const source={xmlDir,yamlDir,yamlFile:'Свойства.yaml',entry:number.id,only:[component],factDirections:['yaml-to-xml'],
        inputs:{owner:{snapshot:{entry:identity.id,field:'Идентификатор',storage:'external'}}}};
      if(component==='cfe')source.baseSource={component:'cf',entry:identity.id,field:'Идентификатор',
        key:{snapshot:{entry:identity.id,field:'ИдентификаторОсновнойКонфигурации',storage:'external',default:''}}};
      routes.factRoutes.push(source);
    }
    for(const provider of providers){
      const base=Boolean(provider.inputs?.localMembers);
      const local=provider.contributions.some(row=>row.index==='metadata.input-by-string-local-members');
      const entry={xmlDir,yamlDir,yamlFile:'Свойства.yaml',entry:provider.id,
        only:[base||local?'cfe':'cf'],factDirections:['yaml-to-xml'],
        inputs:{component:'component',owner:{snapshot:{entry:identity.id,field:'Идентификатор',storage:'external'}}}};
      if(base)entry.baseSource={component:'cf',entry:identity.id,field:'Идентификатор',
        key:{snapshot:{entry:identity.id,field:'ИдентификаторОсновнойКонфигурации',storage:'external',default:''}}};
      routes.factRoutes.push(entry);
    }
  }
  const consumers=unique.filter(module=>module.id.startsWith('candidate.input-by-string.'));
  const fragments=consumers.map(module=>local.get(module.imports.part));
  if(consumers.length!==owners.length || fragments.some(fragment=>fragment?.kind!=='fragment'))
    throw new Error('Incomplete working consumer fragments');
  const fragmentIds=new Set(fragments.map(module=>module.id));
  const composedConsumers=unique.filter(module=>module.kind==='object' && module.compose?.length===2 &&
    Object.values(module.imports??{}).some(id=>fragmentIds.has(id)));
  const nameFragments=[...new Set(composedConsumers.flatMap(module=>module.compose.map(part=>module.imports[part.use]).filter(id=>!fragmentIds.has(id))))]
    .map(id=>local.get(id));
  if(composedConsumers.length!==owners.length || nameFragments.some(module=>module?.kind!=='fragment'))
    throw new Error('Incomplete working composed consumers');
  const consumerIds=new Set([...consumers,...composedConsumers].map(module=>module.id));
  const sourceById=new Map(factSources.map(source=>[source.id,source]));
  // Current YAML projections are not readers for the original XML type shape.
  // Retain those independent XML-source contracts in the candidate suite.
  // The old YAML fixture drops an explicitly empty InternalInfo. These owners
  // canonically omit empty history, so the imported XML form needs a raw patch.
  // Derive this expectation from the source XML, never from converter output.
  for(const item of cases) {
    if(typeof item.yaml!=='string' || !/<(?:[\w.-]+:)?InternalInfo\s*\/>/.test(item.xml)
      || /^InternalInfo:/m.test(item.yaml))continue;
    item.yaml=item.yaml.trimEnd()+'\nInternalInfo: !xml/raw\n  $xml: ""\n';
    item.noRaw=false;
    item.adaptation=[item.adaptation,'Preserve explicitly empty InternalInfo omitted by the legacy YAML fixture'].filter(Boolean).join('; ');
  }
  const workingCases=cases.filter(item=>consumerIds.has(item.entry) && item.factSourceEntries.every(id=>{
    const source=sourceById.get(id);
    return source.xml===undefined || !primaryMemberSources.has(source.entry);
  }));
  const selectedSources=new Set(workingCases.flatMap(item=>item.factSourceEntries));
  const sourceAliases=new Map([...primaryMemberSources,...[...numberProviders.values()].map(source=>[source.id,source.id+'.current-yaml'])]);
  const acceptedSources=new Set([...roots,...states,...numbers].map(module=>module.id));
  const workingSources=factSources.filter(source=>selectedSources.has(source.id)).map(source=>{
    const entry=sourceAliases.get(source.entry)??source.entry;
    if(!acceptedSources.has(entry))throw new Error(`Uncompiled working source: ${source.entry}`);
    return {...source,entry};
  });
  const working={cases:workingCases,factSources:workingSources};
  return {modules:unique,cases,factSources,production:{roots,values:dependencies,identities,states,numbers,consumers,fragments,composedConsumers,nameFragments,working,routes}};
}

if(process.argv[1]?.endsWith('input-by-string-operation.mjs')) {
  const {modules,cases,factSources,production}=inputByStringOperation(candidateCatalog().catalog);
  const accepted=new Set([...production.roots,...production.values,...production.states,...production.numbers,...production.consumers,...production.fragments,...production.composedConsumers,...production.nameFragments].map(module=>module.id));
  const outputs={
    'rust/declarations/candidates/input-by-string.generated.yaml':
      yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules.filter(module=>!accepted.has(module.id))},{noRefs:true}),
    ...Object.fromEntries([0,1].map(part=>[`rust/declarations/objects/input-by-string-members-${part}.generated.yaml`,
      yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[...production.roots,...production.identities,...production.states,...production.numbers].filter((_,index)=>index%2===part)},{noRefs:true})])),
    ...Object.fromEntries([0,1,2,3].map(part=>[`rust/declarations/objects/input-by-string-consumers-${part}.generated.yaml`,
      yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[...production.consumers,...production.composedConsumers].filter((_,index)=>index%4===part)},{noRefs:true})])),
    'rust/declarations/fragments/input-by-string-consumers.generated.yaml':
      yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:[...production.fragments,...production.nameFragments]},{noRefs:true}),
    'rust/declarations/common/input-by-string-member-views.generated.yaml':
      yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:production.values},{noRefs:true}),
    'rust/operations/input-by-string-members.routes.generated.yaml':
      yaml.dump(production.routes,{noRefs:true}),
    'tests/migration/input-by-string-working.json': JSON.stringify(production.working,null,2)+'\n',
    'tests/migration/input-by-string-operation.json':
      JSON.stringify({factSources,cases},null,2)+'\n',
  };
  for(const [path,content] of Object.entries(outputs)) {
    if(process.argv.includes('--check')) {
      if(readFileSync(path,'utf8')!==content)throw new Error(`Stale input-by-string operation: ${path}`);
    } else if(!existsSync(path)||readFileSync(path,'utf8')!==content) {
      mkdirSync(dirname(path),{recursive:true});writeFileSync(path,content);
    }
  }
}
