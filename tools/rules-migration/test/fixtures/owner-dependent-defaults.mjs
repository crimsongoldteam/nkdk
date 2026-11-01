import {readFileSync} from 'node:fs';
import {candidateCatalog} from '../../src/candidate-catalog.mjs';
import {emitCandidates} from '../../src/emit.mjs';
import {deriveOwnerDefaultProfiles} from '../../src/owner-default-profiles.mjs';
const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
  .find(row=>row.symbol==='MetadataCatalogRules');
const source={...original,propertyStates:[],properties:original.properties
  .filter(row=>['codeLength','codeType','codeAllowedLength','hierarchical','hierarchyType'].includes(row.name))};
const emission=emitCandidates([source],candidateCatalog().catalog);
if(emission.entries[0].properties.some(row=>row.status!=='candidate'))throw new Error('Incomplete dependent defaults');
for(const module of emission.modules)if(module.kind==='fragment') {
  module.inputs??={};module.inputs.adopted={type:{kind:'scalar',scalar:'boolean'}};
  deriveOwnerDefaultProfiles(module,source,{adopted:{input:'adopted'}});
}
const payload=emission.modules.find(row=>row.kind==='fragment');
payload.value.fields.unshift({name:'fixtureName',type:{kind:'scalar',scalar:'text'}});
payload.representations.xml.fields.unshift({field:'fixtureName',path:['Properties','Name']});
payload.representations.yaml.fields.unshift({field:'fixtureName',key:'Имя'});
const root=emission.modules.find(row=>row.kind==='object');
root.inputs??={};root.inputs.component={type:{kind:'scalar',scalar:'text'}};
for(const part of root.compose)part.bind={...(part.bind??{}),component:{input:'component'}};
root.xmlOrder=['fixtureName','codeLength','codeType','codeAllowedLength','hierarchical','hierarchyType'];
export const declarations=emission.modules;
const fixture='e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникПолный.xml';
const text=readFileSync(fixture,'utf8');
const fragment=['CodeLength','CodeType','CodeAllowedLength'].map(name=>{
  const matches=[...text.matchAll(new RegExp(`<${name}>[^<]*</${name}>`,'g'))];
  if(matches.length!==1)throw new Error('Ambiguous code fixture');
  return matches[0][0];
}).join('');
export const cases=[
  {id:'unified-dependent-default-real',xml:'<Properties>'+fragment+'</Properties>',
    yaml:'ДлинаКода: 11\nТипКода: Число\nДопустимаяДлинаКода: Переменная',source:[{path:fixture}],
    acceptedYAML:['Имя: Example\nДлинаКода: 38\nТипКода: Число',
      'Имя: Example\nДлинаКода: 50\nТипКода: Строка',
      'Имя: Example\nДлинаКода: 50'],
    rejectedYAML:['Имя: Example\nДлинаКода: 39\nТипКода: Число',
      'Имя: Example\nДлинаКода: 51\nТипКода: Строка']},
  {id:'unified-dependent-default-missing',xml:'<Properties/>',yaml:''},
  {id:'unified-dependent-default-explicit',xml:'<Properties><CodeAllowedLength>Variable</CodeAllowedLength></Properties>',
    yaml:'ДопустимаяДлинаКода: Переменная'},
  {id:'unified-dependent-default-reconstructed',xml:'<Properties><CodeType>Number</CodeType><CodeAllowedLength>Variable</CodeAllowedLength></Properties>',
    yaml:'ТипКода: Число\nДопустимаяДлинаКода: Переменная',reverseYAML:'ТипКода: Число'},
  {id:'unified-dependent-default-string-restored',
    xml:'<Properties><CodeType>String</CodeType><CodeAllowedLength>Variable</CodeAllowedLength><Hierarchical>false</Hierarchical><HierarchyType>HierarchyFoldersAndItems</HierarchyType></Properties>',
    yaml:'Иерархический: Ложь\nВидИерархии: ИерархияГруппИЭлементов\nТипКода: Строка\nДопустимаяДлинаКода: Переменная',
    reverseYAML:'ТипКода: Строка'},
  {id:'unified-dependent-default-string-nondefault',
    xml:'<Properties><CodeType>String</CodeType><CodeAllowedLength>Variable</CodeAllowedLength><Hierarchical>true</Hierarchical><HierarchyType>HierarchyOfItems</HierarchyType></Properties>',
    yaml:'Иерархический: Истина\nВидИерархии: ИерархияЭлементов\nТипКода: Строка\nДопустимаяДлинаКода: Переменная'},
  {id:'unified-dependent-default-explicit-hierarchy-without-type',
    xml:'<Properties><Hierarchical>false</Hierarchical><HierarchyType>HierarchyFoldersAndItems</HierarchyType></Properties>',
    yaml:'Иерархический: Ложь\nВидИерархии: ИерархияГруппИЭлементов'},
].map(row=>({...row,xml:row.xml==='<Properties/>'?'<Properties><Name>Example</Name></Properties>':
  row.xml.replace('<Properties>','<Properties><Name>Example</Name>'),
  yaml:'Имя: Example'+(row.yaml?'\n'+row.yaml:''),
  ...(row.reverseYAML?{reverseYAML:'Имя: Example\n'+row.reverseYAML}:{}),
  entry:root.id,inputs:{adopted:true,component:'cfe'},noRaw:true}));
