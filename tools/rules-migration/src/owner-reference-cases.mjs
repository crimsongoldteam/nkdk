import {readFileSync} from 'node:fs';
import {emitCandidates} from './emit.mjs';
import {yaml} from './candidate-catalog.mjs';

// A narrow source projection protects property wiring; the shared path matrix
// already protects target kinds, nested paths, invalid names and missing targets.
export function ownerReferenceCases(catalog) {
  const original=JSON.parse(readFileSync('tests/migration/rules-extraction.json')).entries
    .find(row=>row.symbol==='MetadataCatalogRules');
  const source={...original,propertyStates:[],properties:original.properties
    .filter(row=>['owners','basedOn'].includes(row.name))};
  const emission=emitCandidates([source],catalog);
  if(emission.entries[0].properties.some(row=>row.status!=='candidate'))throw new Error('Incomplete reference collections');
  const fragment=emission.modules.find(row=>row.kind==='fragment');
  fragment.value.fields.unshift({name:'fixtureName',type:{kind:'scalar',scalar:'text'}});
  fragment.representations.xml.fields.unshift({field:'fixtureName',path:['Properties','Name']});
  fragment.representations.yaml.fields.unshift({field:'fixtureName',key:'Имя'});
  const entry=emission.entries[0].projections[0].id;
  const rootSource=yaml.load(readFileSync('rust/declarations/probes/document-root-source.yaml','utf8'));
  rootSource.id='test.owner-reference.root-source';
  for(const row of rootSource.representations.xml.fields)row.path=row.path.map(word=>word==='md:Document'?'md:Catalog':word);
  rootSource.presence[0].xml.missing.denotes.literal='Catalog';
  rootSource.presence[0].yaml.default.literal='Catalog';
  // This focused example has no nested reference; declare the empty child
  // context explicitly instead of synthesizing a non-existent lookup result.
  rootSource.imports.childKind='common.path-object-kind';
  rootSource.value.fields.push({name:'childKind',type:{use:'childKind'}},
    {name:'childName',type:{kind:'scalar',scalar:'text'}});
  rootSource.representations.xml.fields.push({field:'childName',
    path:['md:MetaDataObject','md:Catalog','md:ChildObjects','md:Table','md:Properties','md:Name']});
  rootSource.representations.yaml.fields.push({field:'childKind',key:'ВидПодчинённого'},
    {field:'childName',key:'ИмяПодчинённого'});
  rootSource.presence.push({target:{field:'childKind'},xml:{missing:{denotes:{literal:'Table'}}},
    yaml:{default:{literal:'Table'}}},
    {target:{field:'childName'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}});
  rootSource.contributions.push({index:'metadata.children',when:{present:{field:'childName'}},
    key:{record:{kind:{field:'childKind'},name:{field:'childName'},parent:{field:'identity'}}},value:{field:'identity'}});
  const parentXML='e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml';
  const ownerXML='e2e/fixtures/xml/cf/Catalogs/СправочникВладелец.xml';
  const text=readFileSync(parentXML,'utf8');
  const owners=text.match(/<Owners>[\s\S]*?<\/Owners>/)?.[0];
  const basedOn=text.match(/<BasedOn>[\s\S]*?<\/BasedOn>/)?.[0]
    .match(/<xr:Item[^>]*>Catalog\.СправочникПолный<\/xr:Item>/)?.[0];
  if(!owners||!basedOn)throw new Error('Missing immutable reference collection fixture');
  const wrap=(owners,basedOn)=>'<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Name>Example</Name>'+owners+basedOn+'</Properties>';
  const common={entry,factBindings:{roots:'metadata.roots',children:'metadata.children'},
    source:[{path:parentXML},{path:ownerXML}],noRaw:true};
  return {modules:[...emission.modules,rootSource],
    factSources:[parentXML,ownerXML].map(path=>({id:path,entry:rootSource.id,xml:readFileSync(path,'utf8')})),
    cases:[
      {...common,id:'owner-reference-real',xml:wrap(owners,'<BasedOn>'+basedOn+'</BasedOn>'),
        yaml:'Имя: Example\nВладельцы:\n  - Справочник.СправочникВладелец\nВводитсяНаОсновании:\n  - Справочник.СправочникПолный'},
      {...common,id:'owner-reference-repeated',xml:wrap(owners.replace('</Owners>',owners.match(/<xr:Item[^>]*>[\s\S]*?<\/xr:Item>/)[0]+'</Owners>'),'<BasedOn/>'),
        yaml:'Имя: Example\nВладельцы:\n  - Справочник.СправочникВладелец\n  - Справочник.СправочникВладелец'},
      {...common,id:'owner-reference-empty',xml:wrap('<Owners/>','<BasedOn/>'),yaml:'Имя: Example'},
    ]};
}
