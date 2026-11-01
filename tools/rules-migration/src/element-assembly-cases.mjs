import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadSources} from './source-snapshot.mjs';
import {sourceElementIdentityFacts} from './source-element-identity.mjs';
import {elementPropertyProfile,declaredElementProperty} from './declared-element-property.mjs';
import {assembleSourceElement} from './source-element-assembly.mjs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';

export function elementAssemblyCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  loadSources(extraction.sourceHashes);
  const graph=JSON.parse(readFileSync('tests/migration/form-element-links.json','utf8'));
  const registration=graph.registrations.find(row=>row.type==='ExtendedTooltip');
  const source=extraction.entries.find(entry=>entry.symbol===registration.item.symbol);
  const namespace='http://v8.1c.ru/8.3/xcf/logform';
  const assembly=assembleSourceElement(source,registration,catalog,
    {id:'migration.element.ExtendedTooltip',path:[source.itemType],xmlNamespace:namespace});
  if(!assembly.coverage.complete)throw new Error('Incomplete tooltip property assembly');
  const producer=sourceElementIdentityFacts(registration,catalog);
  // This mounted provider has a different XML namespace from the reusable
  // source registration, so it must not shadow its unqualified identifier.
  producer.id=assembly.owner.id+'.facts';
  producer.namespaces={...producer.namespaces,md:namespace};
  for(const field of producer.representations.xml.fields)field.path=['md:ExtendedTooltip'];
  const directory='packages/rules/metadata/forms/elements/extendedTooltip/__fixtures__/';
  const dataPath=directory+'data.ts',data=readFileSync(dataPath,'utf8');
  const expectation=name=>JSON.parse(JSON.stringify(literalFixture(dataPath,data,name).data,
    (_key,value)=>value?.$undefined===true?undefined:value));
  const cases=[],factSources=[];
  const formPath='e2e/fixtures/xml/cf/CommonForms/ExtendedTooltip/Ext/Form.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/ОбщаяФорма/ExtendedTooltip/Свойства.yaml';
  const contextXML=JSON.parse(execFileSync('python3',[
    'tools/rules-migration/src/xml-element-fixture.py',formPath,'ExtendedTooltip'],{encoding:'utf8'}));
  const namespaceAttributes=Object.entries(contextXML.namespaces).map(([prefix,uri])=>
    `xmlns${prefix?':'+prefix:''}="${uri}"`).join(' ');
  const savedTooltip=yaml.load(readFileSync(yamlPath,'utf8')).Форма.КоманднаяПанель.Элементы.Кнопка.РасширеннаяПодсказка;
  const stylePath='e2e/fixtures/xml/cf/StyleItems/ЭлементСтиляШрифтВсеСвойства.xml';
  const styleProducer=catalog.get('metadata.style-item-type-facts');
  if(!styleProducer)throw new Error('Missing accepted style index provider');
  factSources.push({id:'tooltip-style-context',entry:styleProducer.id,
    xml:readFileSync(stylePath,'utf8'),inputs:{ownerName:'ЭлементСтиляШрифтВсеСвойства'},source:[{path:stylePath}]});
  for(const [file,parent,expected] of [
    ['defaults.xml','КакойТоЭлемент','minimalExtendedTooltipYAML'],
    ['full.xml','Кнопка','fullExtendedTooltipYAML'],
    ['formattedEmptyTitle.xml','ПолеВвода',undefined],
    ['e2e','Кнопка','e2e'],
  ]) {
    const path=file==='e2e'?formPath:directory+file;
    // Legacy fragments have no enclosing namespace declarations. Supply only
    // that context in a read-only copy; the checked XML fixtures are untouched.
    const xml=file==='e2e'?contextXML.xml:readFileSync(path,'utf8').replace('<ExtendedTooltip ',
      `<ExtendedTooltip ${namespaceAttributes} `);
    const context={component:'main',owner:'ФормаОдин',ownerName:parent};
    const inputs=Object.fromEntries(Object.entries(context).map(([key,value])=>['identity_'+key,value]));
    const factBindings={identity_names:'metadata.element-names',identity_identities:'metadata.element-identities'};
    for(const name of Object.keys(assembly.owner.inputs)) {
      if(name.endsWith('_styleTypes'))factBindings[name]='metadata.style-item-types';
      else if(name.endsWith('_defaultLanguage'))inputs[name]='ru';
      else if(name.endsWith('_registeredLanguages'))inputs[name]=['ru'];
      else if(name.endsWith('_roles'))inputs[name]=[];
    }
    const id='element-assembly-tooltip-'+file.replace('.xml','');
    factSources.push({id,entry:producer.id,xml,inputs:context});
    cases.push({id,entry:assembly.owner.id,xml,inputs,
      xmlQNamePaths:['BackColor','BorderColor','TextColor'].map(name=>[source.itemType,name].map(part=>`{${namespace}}${part}`)),
      xmlQNameAttributes:[{path:[source.itemType,'Font'].map(part=>`{${namespace}}${part}`),name:'ref'}],
      factBindings,factSourceEntries:[id,'tooltip-style-context'],source:[{path},{path:dataPath},{path:yamlPath}],
      ...(expected==='e2e'?{yaml:yaml.dump(savedTooltip,{noRefs:true}),noRaw:true}:
        expected==='fullExtendedTooltipYAML'?{semanticYAML:yaml.dump(savedTooltip,{noRefs:true}),annotation:'!xml/raw'}:
        expected?{yaml:Object.keys(expectation(expected)).length?yaml.dump(expectation(expected),{noRefs:true}):'',noRaw:true}:
        {semanticYAML:'Заголовок:\n  Форматированный: Истина\nШирина: 14',annotation:'!xml/raw'})});
  }
  const minimal=cases[0],context=factSources.find(row=>row.id===minimal.id).inputs;
  const fresh=producer.id+'.new',occupied=producer.id+'.occupied';
  const name=minimal.xml.match(/\bname="([^"]+)"/)[1];
  factSources.push({id:fresh,entry:producer.id,yaml:yaml.dump({Имя:name}),inputs:context},
    {id:occupied,entry:producer.id,yaml:"Имя: ДругаяРасширеннаяПодсказка\nИдентификатор: '1'",inputs:{...context,ownerName:'Другая'}});
  cases.push({...structuredClone(minimal),id:'element-assembly-tooltip-new-number',
    xml:minimal.xml.replace(/\bid="[^"]+"/,'id="2"'),
    factSourceEntries:[fresh,occupied,'tooltip-style-context']});
  const framed=assembleSourceElement(source,registration,catalog,
    {id:assembly.owner.id+'.frame.body',kind:'value',path:[],xmlNamespace:namespace});
  const frame={format:assembly.owner.format,kind:'object',id:assembly.owner.id+'.frame',
    namespaces:{md:namespace},imports:{body:framed.owner.id},inputs:structuredClone(framed.owner.inputs),
    value:{kind:'record',fields:[{name:'tooltip',type:{use:'body',bind:Object.fromEntries(Object.keys(framed.owner.inputs).map(name=>[name,{input:name}]))}}]},
    representations:{xml:{kind:'record',fields:[{field:'tooltip',path:['md:Root','md:'+source.itemType]}]},
      yaml:{kind:'mapping',fields:[{field:'tooltip',key:'РасширеннаяПодсказка'}]}},
    presence:[{target:{field:'tooltip'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{record:{}}}}}]};
  for(const original of cases.filter(item=>item.noRaw)){
    const meaning=original.yaml.trim()?yaml.load(original.yaml):{};
    cases.push({...structuredClone(original),id:original.id+'-framed',entry:frame.id,
      xml:`<Root xmlns="${namespace}">${original.xml.replace(/^\s*<\?xml[^?]*\?>\s*/,'')}</Root>`,
      yaml:Object.keys(meaning).length?yaml.dump({РасширеннаяПодсказка:meaning},{noRefs:true}):'',
      xmlQNamePaths:original.xmlQNamePaths.map(path=>[`{${namespace}}Root`,...path]),
      xmlQNameAttributes:original.xmlQNameAttributes.map(attribute=>({...attribute,path:[`{${namespace}}Root`,...attribute.path]}))});
  }
  const propertyProfiles={[registration.type]:elementPropertyProfile(framed,source.itemType)};
  const local=new Map([...catalog,...framed.modules.map(module=>[module.id,module])]),propertyModules=[];
  // Source property frames prove mapping/context separately from full owner acceptance.
  for(const [symbol,caseId] of [['ButtonRules','element-assembly-tooltip-defaults'],
    ['ViewStatusAdditionRules','element-assembly-tooltip-e2e']]) {
    const owner=extraction.entries.find(entry=>entry.symbol===symbol);
    const property=owner.properties.find(property=>property.type===registration.type);
    const mapped=declaredElementProperty(property,local,propertyProfiles);
    if(mapped?.status!=='candidate')throw new Error('Incomplete source element property: '+mapped?.reason);
    const module={format:frame.format,kind:'object',id:assembly.owner.id+'.property.'+symbol,
      namespaces:{md:namespace},imports:{...mapped.imports,body:mapped.id},inputs:mapped.inputs,
      value:{kind:'record',fields:[{name:property.name,type:{...mapped.type,use:'body'}}]},
      representations:{xml:{kind:'record',fields:[{field:property.name,path:[owner.itemType,...mapped.path].map(part=>'md:'+part)}]},
        yaml:{kind:'mapping',fields:[{field:property.name,key:mapped.key}]}},presence:[mapped.presence]};
    propertyModules.push(module);
    const original=cases.find(row=>row.id===caseId),profile=propertyProfiles[registration.type];
    const transfer=values=>Object.fromEntries(Object.entries(values).map(([name,value])=>[profile.inputs[name],value]).filter(([name])=>name));
    const meaning=original.yaml.trim()?yaml.load(original.yaml):{};
    cases.push({...structuredClone(original),id:caseId+'-'+symbol,entry:module.id,
      inputs:transfer(original.inputs),factBindings:transfer(original.factBindings),
      xml:`<${owner.itemType} xmlns="${namespace}">${original.xml.replace(/^\s*<\?xml[^?]*\?>\s*/,'')}</${owner.itemType}>`,
      yaml:Object.keys(meaning).length?yaml.dump({[mapped.key]:meaning},{noRefs:true}):'',
      xmlQNamePaths:original.xmlQNamePaths.map(path=>[`{${namespace}}${owner.itemType}`,...path]),
      xmlQNameAttributes:original.xmlQNameAttributes.map(attribute=>({...attribute,path:[`{${namespace}}${owner.itemType}`,...attribute.path]}))});
  }
  return {modules:[...assembly.modules,...framed.modules,...propertyModules,frame,producer,styleProducer],cases,factSources,propertyProfiles};
}
