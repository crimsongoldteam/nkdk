import {readFileSync} from 'node:fs';
import {declaredSettingsParameterTable} from './dcs-value-profile.mjs';
import {loadSources} from './source-snapshot.mjs';
import {styleItemFactSources,enumerationFactSources} from './declaration-fact-fixtures.mjs';

// Acceptance of the shared parameter profiles. Text/Format normalization is
// deliberately not represented as ordinary DesignTimeValue acceptance.
export function appearanceFieldsCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  loadSources(extraction.sourceHashes);
  const rules=extraction.entries.find(entry=>entry.symbol==='AppearanceFieldsRules');
  const selected=declaredSettingsParameterTable(rules,catalog);
  if(!selected)throw new Error('Appearance parameter table is not statically complete');
  const table=selected.declaration;
  const owner=structuredClone(catalog.get('migration.dcs-settings-parameter-value-collection'));
  owner.id='migration.appearance-field-profiles';
  owner.imports.parameters=table.id;
  for(const key of ['profiles','defaultProfile']) {
    delete owner.inputs[key];
    delete owner.value.fields[0].type.bind[key];
  }
  owner.representations.xml.fields[0].path=['dcsset:appearance'];
  owner.representations.yaml.fields[0].key='Оформление';
  const xmlPath='e2e/fixtures/xml/cf/CommonForms/УсловноеОформление/Ext/Form.xml';
  const yamlPath='e2e/fixtures/nkdk/cf/ОбщаяФорма/УсловноеОформление/Свойства.yaml';
  const form=readFileSync(xmlPath,'utf8');
  const namespaces=[...form.match(/<Form\b([^>]*)>/)[1].matchAll(/\bxmlns:[\w.-]+="[^"]*"/g)].map(match=>match[0]).join(' ');
  const appearance=form.match(/<dcsset:appearance>[\s\S]*?<\/dcsset:appearance>/)?.[0];
  const items=appearance?.match(/<dcscor:item\b[^>]*>[\s\S]*?<\/dcscor:item>/g)??[];
  const sourceYAML=readFileSync(yamlPath,'utf8').split('        Оформление:\n')[1]?.split('        Поля:')[0];
  if(!sourceYAML || items.length!==rules.properties.length)throw new Error('Changed complete appearance fixture');
  const rows=sourceYAML.match(/^          \S[^\n]*\n(?:^            .*\n?)*/gm)??[];
  const ordinary=rules.properties.filter(row=>row.parameters.valueType!=='DesignTimeValue');
  const wrap=items=>`<dcsset:appearance ${namespaces}>${items.join('')}</dcsset:appearance>`;
  const valuePath=['{http://v8.1c.ru/8.1/data-composition-system/settings}appearance',
    '{http://v8.1c.ru/8.1/data-composition-system/core}item',
    '{http://v8.1c.ru/8.1/data-composition-system/core}value'];
  const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en']};
  const factBindings={styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'};
  const source=[{path:xmlPath},{path:yamlPath},{path:rules.path}];
  const cases=ordinary.map(property=>{
    const name=property.parameters.yaml;
    const item=items.find(item=>item.includes(`<dcscor:parameter>${name}</dcscor:parameter>`));
    const row=rows.find(row=>row.startsWith(`          ${name}:\n`));
    if(!item||!row)throw new Error(`Missing appearance fixture for ${name}`);
    return {id:`appearance-profile-${name}`,entry:owner.id,xml:wrap([item]),
      yaml:'Оформление:\n'+row.trimEnd().split('\n').map(line=>line.slice(8)).join('\n'),
      xmlQNamePaths:property.parameters.valueType==='Color'?[valuePath]:[],
      xmlQNameAttributes:property.parameters.valueType==='Font'?[{path:valuePath,name:'ref'}]:[],
      inputs,factBindings,source,noRaw:true};
  });
  const body=ordinary.map(property=>items.find(item=>item.includes(`<dcscor:parameter>${property.parameters.yaml}</dcscor:parameter>`)));
  const whole={...cases[0],id:'appearance-profiles-together',xml:wrap(body),
    xmlQNamePaths:[valuePath],xmlQNameAttributes:[{path:valuePath,name:'ref'}],
    yaml:'Оформление:\n'+cases.map(row=>row.yaml.slice('Оформление:\n'.length)).join('\n')};
  cases.push(whole,{...whole,id:'appearance-profiles-duplicate',xml:wrap([...body,body[0]]),
    yaml:undefined,noRaw:false,annotation:'Оформление: !xml/raw'});
  const invalid=cases.find(row=>row.id==='appearance-profile-Видимость');
  cases.push({...invalid,id:'appearance-profile-invalid-boolean',
    xml:invalid.xml.replace('>false</dcscor:value>','>oops</dcscor:value>'),yaml:undefined,noRaw:false,annotation:'      - !xml/raw'});
  cases.push({...invalid,id:'appearance-profile-unknown-name',
    xml:invalid.xml.replace('>Видимость</dcscor:parameter>','>НеизвестноеОформление</dcscor:parameter>'),
    yaml:undefined,noRaw:false,annotation:'Оформление: !xml/raw'});
  const unknown=cases.at(-1);
  cases.push({...invalid,id:'appearance-profile-known-empty',
    xml:invalid.xml.replace(/<dcscor:value\b[^>]*>[\s\S]*?<\/dcscor:value>/,''),
    yaml:'Оформление:\n  Видимость: {}',noRaw:true,
    rejectedYAML:['Оформление:\n  НеизвестноеОформление: {}']});
  cases.push({...unknown,id:'appearance-profile-unknown-empty',
    xml:unknown.xml.replace(/<dcscor:value\b[^>]*>[\s\S]*?<\/dcscor:value>/,'')});
  return {modules:[table,owner,catalog.get('probe.style-item-type-facts'),catalog.get('migration.dcs-enumeration-lexeme')],
    cases,factSources:[...styleItemFactSources(),...enumerationFactSources(catalog,'FoldersAndItemsUse')]};
}
