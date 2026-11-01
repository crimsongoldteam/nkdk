import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {writeChanged} from './focused-output.mjs';

// Reuse accepted item expectations and fact sources. Project the immutable
// owner fixture at its collection boundary; do not invent conversion results.
export function characteristicCollectionContracts(extraction,graph,original) {
 const source=extraction.entries.find(row=>row.symbol==='MetadataChartOfCharacteristicTypesRules');
 const edge=graph.edges.find(row=>row.owner.symbol===source.symbol&&row.property==='tabularSections');
 const itemId=`migration.${edge.item.symbol.replace(/Rules$/,'')}`;
 const example=original.cases.find(row=>row.entry===itemId&&row.inputs.component==='cf');
 if(!example)throw new Error('Missing accepted characteristic tabular-section example');
 const xmlPath=example.source.find(row=>row.path.endsWith('.xml')&&!row.path.includes('/Forms/')).path;
 const yamlPath=example.source.find(row=>row.path.endsWith('/Свойства.yaml')).path;
 const [header,projection]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
  input:JSON.stringify([{xml:xmlPath,ownerHeader:true},{xml:xmlPath,yaml:yamlPath,
   collection:{item:edge.mapping.xml,yaml:edge.mapping.yaml,preserveNamespace:true}}]),encoding:'utf8',
 }));
 const route=sourceOwnerXmlRoute(source).map(part=>part.split(':').at(-1));
 if(header.kind!==route[1])throw new Error('Characteristic fixture kind differs from source registration');
 const namespace=source.properties.find(row=>row.type==='XMLRoot').parameters.rootAttributes._xmlns;
 const version=source.properties.find(row=>row.type==='XMLRoot').parameters.rootAttributes._version;
 const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const xml=`<${route[0]} xmlns="${namespace}" version="${version}"><${route[1]}>`+
  `<Properties><Name>${escape(header.name)}</Name></Properties>${projection.xml}</${route[1]}></${route[0]}>`;
 const inputs={...example.inputs,parentName:header.name,ordinary0_ownerName:header.name};
 for(const name of ['itemName','itemOwner','qualifiedName','kind'])delete inputs[name];
 // This fixture still contains the former raw English data path. The
 // accepted common path contract uses 1C's Russian metadata names.
 const oldPath=`ПутьКДанным: ChartOfCharacteristicTypes.${header.name}.StandardAttribute.Code`;
 const newPath=`ПутьКДанным: ПланВидовХарактеристик.${header.name}.СтандартныйРеквизит.Код`;
 if(projection.yaml.split(oldPath).length!==2)throw new Error('Changed legacy choice-link path expectation');
 const expected=projection.yaml.replace(oldPath,newPath);
 const selected=new Set(example.factSourceEntries);
 const attributeCases=['ПланВидовХарактеристик1','ХарактеристикиОбъектов'].map(name=>{
  const xmlPath=`e2e/fixtures/xml/cf/ChartsOfCharacteristicTypes/${name}.xml`;
  const yamlPath=`e2e/fixtures/nkdk/cf/ПланВидовХарактеристик/${name}/Свойства.yaml`;
  const [value]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
   input:JSON.stringify([{xml:xmlPath,yaml:yamlPath,
    collection:{item:'Attribute',yaml:'Реквизиты',preserveNamespace:true}}]),encoding:'utf8',
  }));
  const entry='candidate.characteristic-assembled.attributes.probe';
  const xml=`<${route[0]} xmlns="${namespace}" version="${version}"><${route[1]}>`+
   `<Properties><Name>${escape(name)}</Name></Properties>${value.xml}</${route[1]}></${route[0]}>`;
  const inputs={defaultLanguage:'ru',registeredLanguages:['ru','en'],component:'cf',
   owner:value.ownerIdentity,ordinary0_ownerName:name};
  return {id:`e2e-characteristic-attributes-${name}-cf`,entry,xml,yaml:value.yaml,inputs,
   xmlQNamePaths:value.xmlQNamePaths.map(path=>[...route.map(local=>`{${namespace}}${local}`),...path]),
   factBindings:{identities:'metadata.own-identities'},factSourceEntries:[`e2e-characteristic-attributes-${name}-cf.identities`],source:value.source};
 });
 return {version:1,status:'base collection contract; complete owner and extension acceptance pending',
  cases:[{...example,id:'e2e-characteristic-tabular-sections-collection-cf',
   entry:'candidate.characteristic-assembled.tabularSections.probe',xml,yaml:expected,inputs,
   adaptation:'ChoiceParameterLinks data paths use the accepted Russian metadata spelling; the old fixture retains an English raw path.',
   xmlQNamePaths:projection.xmlQNamePaths.map(path=>[...route.map(local=>`{${namespace}}${local}`),...path]),
   source:example.source,
  },...attributeCases],factSources:[...original.factSources.filter(row=>selected.has(row.id??row.entry)),
   ...attributeCases.map(({id,entry,xml,inputs})=>({id:id+'.identities',entry,xml,inputs}))]};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const read=path=>JSON.parse(readFileSync(path,'utf8'));
 const result=characteristicCollectionContracts(read('tests/migration/rules-extraction.json'),
  read('tests/migration/collection-links.json'),read('tests/migration/tabular-section-family-operation.json'));
 const path='tests/migration/characteristic-collections-operation.json',content=JSON.stringify(result,null,2)+'\n';
 if(process.argv.includes('--check')) {
  if(readFileSync(path,'utf8')!==content)throw new Error('Stale characteristic collection contracts');
 }else writeChanged(path,content);
}
