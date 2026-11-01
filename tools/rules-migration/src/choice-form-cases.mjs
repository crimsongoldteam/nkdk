import {readFileSync} from 'node:fs';

const value='Catalog.СправочникРеквизит.Form.ФормаВыбора';
const full='Справочник.СправочникРеквизит.Форма.ФормаВыбора';
const providerIds=[
  'migration.MetadataBusinessProcessTabularSection.external-root.Catalog',
  'migration.form-metadata-header',
];

export function choiceFormCases(catalog) {
  const corpus=JSON.parse(readFileSync('tests/migration/tabular-section-family-operation.json','utf8'));
  const owner=corpus.cases.find(row=>row.id==='e2e-businessprocesses-tabular-section-whole-cf');
  if(!owner?.xml.includes(value))throw new Error('Real ChoiceForm source changed');
  const sourceNames=[
    '.external-owner.Catalog.СправочникРеквизит',
    '.form.Catalog.СправочникРеквизит.ФормаВыбора',
  ];
  const factSources=providerIds.map((id,index)=>{
    const source=corpus.factSources.find(row=>row.entry===id &&
      row.id.endsWith(sourceNames[index]) && owner.factSourceEntries.includes(row.id));
    if(!source)throw new Error(`Missing real ChoiceForm fact source: ${id}`);
    return source;
  });
  const modules=providerIds.map(id=>{
    const module=catalog.get(id);
    if(!module)throw new Error(`Missing ChoiceForm fact declaration: ${id}`);
    return module;
  });
  modules.push({format:'nkdk-declarations/1',kind:'object',id:'migration.choice-form-profiles',
    imports:{form:'common.type-form-link',item:'common.type-description-item'},
    inputs:{roots:{index:'metadata.roots'},forms:{index:'metadata.forms'},
      typeItems:{type:{kind:'sequence',item:{use:'item',with:{metadataAttributeTypesOnly:true}}}}},
    value:{kind:'record',fields:[{name:'form',type:{use:'form',bind:{
      roots:{input:'roots'},forms:{input:'forms'},typeItems:{input:'typeItems'},
    }}}]},
    representations:{xml:{kind:'record',fields:[{field:'form',path:['Root','ChoiceForm']}]},
      yaml:{kind:'mapping',fields:[{field:'form',key:'ФормаВыбора'}]}},
  });
  const type=value=>({value,first:'',second:''});
  const variants=[
    ['sole-type',[type('Справочник.СправочникРеквизит')],'ФормаВыбора'],
    ['composite-type',[type('Справочник.СправочникРеквизит'),type('Строка')],full],
    ['no-type',[],full],
  ];
  const cases=variants.map(([name,typeItems,spelling])=>({
    id:`choice-form-${name}`,entry:'migration.choice-form-profiles',
    xml:`<Root><ChoiceForm>${value}</ChoiceForm></Root>`,
    yaml:`ФормаВыбора: ${spelling}`,
    inputs:{typeItems},factBindings:{roots:'metadata.roots',forms:'metadata.forms'},
    factSourceEntries:factSources.map(source=>source.id),noRaw:true,
    ...(name==='sole-type'?{rejectedYAML:['ФормаВыбора: Несуществующая']}:{})
  }));
  return {modules,cases,factSources};
}
