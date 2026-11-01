import {readFileSync} from 'node:fs';
import {dcsProductionFactSources} from './declaration-fact-fixtures.mjs';
import {emitCollections} from './collection-emission.mjs';
import {renameDeclarationModules} from './declaration-identifiers.mjs';

const xmlFixture='e2e/fixtures/xml/cf/CommonForms/ДинамическийСписок/Ext/Form.xml';
const yamlFixture='e2e/fixtures/nkdk/cf/ОбщаяФорма/ДинамическийСписок/Свойства.yaml';
const names=['Параметр1','СоставнойДоступенСписок','Составной','БезТипа','БезТипаДоступенСписок','СТипомДоступенСписок','СТипом'];

export function dcsParameterCase(catalog) {
  const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const edge=graph.edges.find(edge=>edge.owner.symbol==='DynamicListRules'&&edge.property==='parameters');
  if(!edge)throw new Error('DynamicListRules.parameters collection is missing');
  graph.edges=[edge];
  graph.registrations=graph.registrations.filter(registration=>registration.type===edge.type);
  const entries=extraction.entries.filter(entry=>[edge.owner,edge.item].some(reference=>reference.path===entry.path&&reference.symbol===entry.symbol));
  const form=readFileSync(xmlFixture,'utf8');
  const attributes=form.match(/<Form\b([^>]*)>/)?.[1];
  if(!attributes)throw new Error('Form root is missing from the XML fixture');
  const namespaceAttributes=[...attributes.matchAll(/\bxmlns(?::([A-Za-z][\w.-]*))?="([^"]+)"/g)];
  const namespaces=Object.fromEntries(namespaceAttributes.filter(match=>match[1]).map(match=>[match[1],match[2]]));
  namespaces.form=namespaceAttributes.find(match=>!match[1])?.[2];
  if(!namespaces.form)throw new Error('Form default XML namespace is missing');
  const emitted=emitCollections(graph,entries,catalog,namespaces,{defaultXmlNamespace:'form',deferOwnerContributions:true});
  if(emitted.results[0]?.status!=='candidate'||emitted.results[0].ownerRequirements?.indexAddressing!=='yamlPath')throw new Error(JSON.stringify(emitted.results));
  // The registration lifts name into the dictionary key. Reuse its complete
  // prepared element rather than losing that correspondence in a standalone
  // projection of rules.ts, where name is deliberately hidden.
  const itemId=emitted.modules[0].id;
  emitted.modules=renameDeclarationModules(emitted.modules,id=>id===itemId?'common.dcs-parameter':id);
  const item=entries.find(entry=>entry.path===edge.item.path&&entry.symbol===edge.item.symbol);
  const order=new Map(item.properties.map((property,index)=>[property.parameters?.yaml,index]));
  const reorderRow=source=>{
    const [header,...body]=source.trimEnd().split('\n');
    const groups=[];
    for(const line of body){
      if(/^            \S/.test(line))groups.push([line]);
      else if(groups.length)groups.at(-1).push(line);
      else throw new Error('YAML row starts before its property');
    }
    groups.sort((left,right)=>(order.get(left[0].trim().split(':')[0])??Infinity)-(order.get(right[0].trim().split(':')[0])??Infinity));
    return [header,...groups.flat()].map(line=>line.slice(8)).join('\n');
  };
  const parameters=[...form.matchAll(/<Parameter(?:\s[^>]*)?>[\s\S]*?<\/Parameter>/g)].map(match=>match[0]);
  const yaml=readFileSync(yamlFixture,'utf8');
  const rows=[...yaml.matchAll(/^        Параметры:\n([\s\S]*?)(?=^        ПараметрыДанных:)/gm)].map(match=>match[1]);
  if(rows.length!==2)throw new Error('Expected both Dynamic list Parameters collections in the YAML fixture');
  const sourceRows=rows.map(group=>group.match(/^          [^\s][^\n]*\n(?:^            .*\n?)*/gm)??[]);
  const xmlns=namespaceAttributes.map(match=>match[0]).join(' ');
  const qualified=name=>{
    const [prefix,local]=name.split(':');
    const namespace=namespaces[local?prefix:'form'];
    if(!namespace)throw new Error(`Unknown XML namespace in ${name}`);
    return `{${namespace}}${local??prefix}`;
  };
  const qnamePath=[...emitted.modules[2].representations.xml.fields[0].path,
    ...emitted.modules[1].representations.xml.path,
    ...emitted.modules[0].representations.xml.fields.find(field=>field.field==='valueType').path,
    ...catalog.get('common.type-description-types').representations.xml.path].map(qualified);
  const cases=[...names.map(name=>({name,group:0})),{name:'Параметр1',group:1}].map(({name,group})=>{
    const matches=parameters.filter(fragment=>fragment.includes(`<dcssch:name>${name}</dcssch:name>`));
    const parameter=group===0?matches[0]:matches.at(-1);
    const sourceRow=sourceRows[group].find(row=>row.startsWith(`          ${name}:\n`));
    if(!parameter||!sourceRow)throw new Error(`Expected real XML/YAML Parameter named ${name}`);
    return {id:`real-dynamic-list-dcs-parameter-${group}-${name}`,entry:emitted.results[0].declaration,
      xml:`<Settings ${xmlns}>${parameter}</Settings>`,yaml:`Параметры:\n${reorderRow(sourceRow)}`,
      xmlQNamePaths:[qnamePath],source:[{path:xmlFixture},{path:yamlFixture},{path:item.path}],
      inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en']},
      factBindings:{styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'}};
  });
  // Exercise one whole real collection: row-by-row checks cannot detect losses
  // of neighbours, order or repeated keys at the enclosing YAML boundary.
  const wholeRows=cases.slice(0,names.length).map(row=>({row,
    parameter:row.xml.match(/<Parameter(?:\s[^>]*)?>[\s\S]*?<\/Parameter>/)[0]}))
    .sort((left,right)=>form.indexOf(left.parameter)-form.indexOf(right.parameter));
  const whole={...cases[0],id:'real-dynamic-list-dcs-parameters-whole',
    xml:`<Settings ${xmlns}>${wholeRows.map(({parameter})=>parameter).join('')}</Settings>`,
    yaml:`Параметры:\n${wholeRows.map(({row})=>row.yaml.slice('Параметры:\n'.length)).join('\n')}`,
    source:[{path:xmlFixture},{path:yamlFixture}]};
  cases.push(whole);
  cases.push({...whole,id:'real-dynamic-list-dcs-parameters-duplicate',
    xml:whole.xml.replace('</Settings>',wholeRows[0].parameter+'</Settings>'),
    yaml:undefined,annotation:'Параметры: !xml/raw'});
  const ordinary=cases[0];
  // These two source properties are absent from the real collection. Extend
  // a copy in memory; immutable XML fixtures and their expectations stay intact.
  const optionalXML=ordinary.xml.replace('</Parameter>',
    '<dcssch:functionalOptionsParameter>Опция</dcssch:functionalOptionsParameter><dcssch:denyIncompleteValues>true</dcssch:denyIncompleteValues></Parameter>');
  if(!optionalXML.includes('<dcssch:functionalOptionsParameter>') ||
    !optionalXML.includes('<dcssch:denyIncompleteValues>'))throw new Error('Expected the source parameter ordering anchors');
  const optionalYAML=ordinary.yaml.replace('    ПараметрыРедактирования:',
    '    ПараметрФункциональныхОпций: Опция\n    ПараметрыРедактирования:')
    +'\n    ЗапрещатьНезаполненныеЗначения: Истина';
  if(!optionalYAML.includes('ЗапрещатьНезаполненныеЗначения:'))throw new Error('Expected the source parameter use field');
  cases.push({...ordinary,id:'dcs-parameter-optional-source-fields',xml:optionalXML,yaml:optionalYAML,
    source:[...ordinary.source,{path:'packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts'}]});
  const second=cases[names.length];
  const choiceParameters=ordinary.xml.match(/<dcscor:value xsi:type="dcscor:ChoiceParameters">\s*<dcscor:item>[\s\S]*?<\/dcscor:item>\s*<\/dcscor:value>/)?.[0];
  if(!choiceParameters)throw new Error('Expected real singleton choice parameters');
  const extraChoice=choiceParameters.replace(/<\/dcscor:value>$/, '<dcscor:item><dcscor:choiceParameter>ВторойПараметр</dcscor:choiceParameter><dcscor:value xsi:type="xs:decimal">456</dcscor:value></dcscor:item></dcscor:value>');
  cases.push({...ordinary,id:'dcs-parameter-choice-parameters-extra-item',
    xml:ordinary.xml.replace(choiceParameters,extraChoice),yaml:undefined,
    annotation:'          - !xml/raw',retainedYAML:['    Заголовок: Параметр1','      СвязьПоТипу:','              Параметр: 123']});
  const malformed=ordinary.xml.replace('<dcssch:useRestriction>true</dcssch:useRestriction>',
    '<dcssch:useRestriction>неверно</dcssch:useRestriction>');
  if(malformed===ordinary.xml)throw new Error('Expected a real useRestriction value in the e2e fixture');
  cases.push({...ordinary,id:'real-dynamic-list-dcs-parameter-invalid-boolean',xml:malformed,
    yaml:undefined,annotation:'    useRestriction: !xml/raw',
    retainedYAML:['    Заголовок: Параметр1','    ПараметрыРедактирования:']});
  const malformedNested=second.xml.replace('<dcscor:value xsi:type="xs:decimal">123</dcscor:value>',
    '<dcscor:value xsi:type="xs:decimal">неверно</dcscor:value>');
  if(malformedNested===second.xml)throw new Error('Expected a real nested decimal value in the e2e fixture');
  cases.push({...second,id:'real-dynamic-list-dcs-parameter-invalid-nested-decimal',xml:malformedNested,
    yaml:undefined,annotation:'          Параметр: !xml/raw',
    retainedYAML:['    Заголовок: Параметр1','      СвязьПоТипу:']});
  return {factSources:dcsProductionFactSources(),modules:[...emitted.modules,catalog.get('metadata.style-item-type-facts'),catalog.get('metadata.system-enumeration-index-source')],
    cases};
}
