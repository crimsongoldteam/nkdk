import {readFileSync} from 'node:fs';
import {literalFixture} from './test-cases.mjs';
import {yaml} from './candidate-catalog.mjs';
import {mapProperty} from './mappings.mjs';

export function dcsMetadataTypedValueCases(catalog) {
  const path='packages/rules/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts';
  const fixtures=literalFixture(path,readFileSync(path,'utf8'),'dcsMetadataTypedValueFixtures');
  const value=catalog.get('common.dcs-metadata-typed-value');
  if(!value)throw new Error('Missing typed DCS declaration');
  const namespaces={xsi:'http://www.w3.org/2001/XMLSchema-instance',xs:'http://www.w3.org/2001/XMLSchema',
    dcscor:'http://v8.1c.ru/8.1/data-composition-system/core',dcsset:'http://v8.1c.ru/8.1/data-composition-system/settings',
    v8:'http://v8.1c.ru/8.1/data/core',xr:'http://v8.1c.ru/8.3/xcf/readable'};
  const xmlns=Object.entries(namespaces).map(([key,value])=>`xmlns:${key}="${value}"`).join(' ');
  const owner={format:'nkdk-declarations/1',kind:'object',id:'probe.dcs-metadata-typed-value',namespaces,
    imports:{typed:value.id},value:{kind:'record',fields:[{name:'value',type:{use:'typed'}}]},
    representations:{xml:{kind:'record',fields:[{field:'value',path:['Root','value']}]},
      yaml:{kind:'mapping',fields:[{field:'value',key:'Значение'}]}}};
  const cases=fixtures.data.map((row,index)=>({
    id:`dcs-metadata-typed-value-${index}-${row.name}`,entry:owner.id,
    xml:`<Root ${xmlns}>${row.XML}</Root>`,
    yaml:yaml.dump({Значение:row.YAML},{noRefs:true}).trimEnd(),noRaw:true,source:[{path}],
  }));
  const legacyBase='packages/rules/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/';
  const reference='Справочник.Организации.ПустаяСсылка';
  const referenceYAML=yaml.dump({Значение:reference},{noRefs:true}).trimEnd();
  cases.push({id:'dcs-typed-legacy-reference',entry:owner.id,
    xml:`<Root ${xmlns}><value xsi:type="xr:DesignTimeRef">Catalog.Организации.EmptyRef</value></Root>`,
    annotation:'Значение: !xml/raw',retainedYAML:[`  $значение: ${reference}`],
    source:[{path:legacyBase+'fromXML.integration.test.ts'},{path:legacyBase+'toYAML.test.ts'}]});
  cases.push({id:'dcs-typed-canonical-reference',entry:owner.id,
    xml:`<Root ${xmlns}><value xsi:type="dcscor:DesignTimeValue">${reference}</value></Root>`,
    yaml:referenceYAML,noRaw:true,source:[{path:legacyBase+'fromYAML.test.ts'}]});
  const mapped=mapProperty({name:'value',parameters:{type:'DcsMetadataTypedValue',xml:'value',xmlParents:['Root','Values'],yaml:'Значение'}},catalog,namespaces);
  if(mapped.status!=='candidate')throw new Error('Typed DCS rule is not mapped: '+JSON.stringify(mapped));
  const arrayOwner={...owner,id:'probe.dcs-typed-values',imports:{value:mapped.id,text:'common.string'},
    value:{kind:'record',fields:[{name:'neighbour',type:{use:'text'}},{name:'value',type:mapped.type}]},
    representations:{xml:{kind:'record',fields:[{field:'neighbour',path:['Root','Name']},{field:'value',path:mapped.path}]},
      yaml:{kind:'mapping',fields:[{field:'neighbour',key:'Сосед'},...owner.representations.yaml.fields]}}};
  cases.push({id:'dcs-typed-sequence',entry:arrayOwner.id,
    xml:`<Root ${xmlns}><Name>kept</Name><Values><value xsi:type="xs:string">x</value><value xsi:type="xs:decimal">12.5</value><value xsi:type="xs:string">x</value></Values></Root>`,
    yaml:yaml.dump({Сосед:"kept",Значение:["'x'",12.5,"'x'"]},{noRefs:true}).trimEnd(),noRaw:true,
    source:[{path:legacyBase+'fromXML.integration.test.ts'}],
    adaptation:'Combine independently tested string and decimal forms; retain repeated occurrences and order'});
  cases.push({id:'dcs-typed-absent-values',entry:arrayOwner.id,
    xml:`<Root ${xmlns}><Name>kept</Name></Root>`,yaml:'Сосед: kept',noRaw:true,
    source:[{path:legacyBase+'fromXML.integration.test.ts'}],
    adaptation:'Place the optional value list beside an independently preserved neighbour; omit its entire property'});
  cases.push({id:'dcs-typed-nil-position',entry:arrayOwner.id,
    xml:`<Root ${xmlns}><Name>kept</Name><Values><value xsi:type="xs:string">x</value><value xsi:nil="true"/><value xsi:type="xs:decimal">12.5</value></Values></Root>`,
    retainedYAML:['Сосед: kept','  - !xml/raw','      _{http://www.w3.org/2001/XMLSchema-instance}nil: "true"'],
    acceptedYAML:[yaml.dump({Сосед:'kept',Значение:["'x'",{},12.5]},{noRefs:true}).trimEnd()],
    source:[{path:legacyBase+'fromXML.integration.test.ts'},{path:legacyBase+'fromYAML.test.ts'},{path:legacyBase+'toYAML.test.ts'}]});
  cases.push({id:'dcs-typed-missing-position-export',entry:arrayOwner.id,
    xml:`<Root ${xmlns}><Name>kept</Name><Values><value xsi:type="xs:string">x</value><value xsi:type="xs:decimal">12.5</value></Values></Root>`,
    yaml:yaml.dump({Сосед:'kept',Значение:["'x'",12.5]},{noRefs:true}).trimEnd(),noRaw:true,
    reverseYAML:yaml.dump({Сосед:'kept',Значение:["'x'",{},12.5]},{noRefs:true}).trimEnd(),
    source:[{path:legacyBase+'toXML.integration.test.ts'}],
    adaptation:'Retain the existing rule: a missing array slot invents no XML node; an explicit source nil is preserved by its annotation'});
  for(const prefix of ['t','different']) cases.push({id:`dcs-typed-undefined-${prefix}`,entry:arrayOwner.id,
    xml:`<Root ${xmlns}><Name>kept</Name><Values><value xsi:type="xs:string">x</value><value xmlns:${prefix}="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">${prefix}:Undefined</value><value xsi:type="xs:string">y</value></Values></Root>`,
    retainedYAML:['Сосед: kept','  - !xml/raw','        - http://v8.1c.ru/8.2/data/types','        - Undefined'],
    xmlQNamePaths:[['Root','Values','value']],
    source:[{path:legacyBase+'fromXML.integration.test.ts'},{path:legacyBase+'toXML.integration.test.ts'}],
    adaptation:'Keep the independently tested Undefined namespace meaning under two prefixes, inside a sequence with neighbours'});
  const structured=[fixtures.data[0],fixtures.data[8],fixtures.data[0]];
  cases.push({id:'dcs-typed-structured-sequence',entry:arrayOwner.id,
    xml:`<Root ${xmlns}><Name>kept</Name><Values>${structured.map(row=>row.XML).join('')}</Values></Root>`,
    yaml:yaml.dump({Сосед:'kept',Значение:structured.map(row=>row.YAML)},{noRefs:true}).trimEnd(),noRaw:true,
    source:[{path}],adaptation:'Combine immutable list and beginning-date examples; repeat the list around the structured mapping'});
  for(const index of [0,8]) {
    const row=fixtures.data[index];
    cases.push({id:`dcs-typed-structured-singleton-${row.name}`,entry:arrayOwner.id,
      xml:`<Root ${xmlns}><Name>kept</Name><Values>${row.XML}</Values></Root>`,
      yaml:yaml.dump({Сосед:'kept',Значение:row.YAML},{noRefs:true}).trimEnd(),noRaw:true,source:[{path}]});
  }
  return {modules:[owner,arrayOwner],factSources:[],cases};
}
