import {readFileSync} from 'node:fs';
import {sourceElementIdentity,sourceElementIdentityFacts} from './source-element-identity.mjs';
import {loadSources} from './source-snapshot.mjs';
import {assembleSourceElement} from './source-element-assembly.mjs';
import {numberedFactCases} from './numbered-fact-cases.mjs';

export function elementIdentityCases(catalog) {
  const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  loadSources(extraction.sourceHashes);
  const graph=JSON.parse(readFileSync('tests/migration/form-element-links.json','utf8'));
  const modules=[],cases=[],factSources=[];
  const selections=[
    ['AutoCommandBar','AutoCommandBar','ФормаКоманднаяПанель','-1',''],
    ['TableAutoCommandBar','AutoCommandBar','КакойТоЭлементКоманднаяПанель','1','КакойТоЭлемент'],
    ['ContextMenu','ContextMenu','КакойТоЭлементКонтекстноеМеню','1','КакойТоЭлемент'],
  ];
  for(const [type,root,canonical,id,ownerName] of selections) {
    const row=graph.registrations.find(row=>row.type===type);
    if(!row)throw new Error('Missing source element registration');
    const fragment=sourceElementIdentity(row,catalog);
    const producer=sourceElementIdentityFacts(row,catalog);
    for(const field of fragment.representations.xml.fields)field.path=[root];
    for(const field of producer.representations.xml.fields)field.path=[root];
    const wrapper={format:'nkdk-declarations/1',kind:'object',id:'migration.element-identity.'+type,
      imports:{identity:fragment.id},inputs:structuredClone(fragment.inputs),
      compose:[{use:'identity',bind:Object.fromEntries(Object.keys(fragment.inputs).map(name=>[name,{input:name}]))}],
      value:{kind:'record',fields:[]},representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
    modules.push(fragment,wrapper,producer);
    const source=extraction.entries.find(entry=>entry.path===row.item.path && entry.symbol===row.item.symbol);
    const assembly=assembleSourceElement(source,row,catalog,{id:wrapper.id+'.assembled',path:[root]});
    modules.push(...assembly.modules);

    const inputs={component:'main',owner:'ФормаОдин',...(ownerName?{ownerName}:{})};
    const assemblyInputs=Object.fromEntries(Object.entries(inputs).map(([key,value])=>['identity_'+key,value]));
    const factBindings={names:'metadata.element-names',...(type==='AutoCommandBar'?{}:{identities:'metadata.element-identities'})};
    const assemblyFacts=Object.fromEntries(Object.entries(factBindings).map(([key,value])=>['identity_'+key,value]));
    const add=(suffix,name,yaml)=>{
      const xml=`<${root} name="${name}" id="${id}"/>`,sourceId=producer.id+'.'+suffix;
      factSources.push({id:sourceId,entry:producer.id,xml,inputs});
      cases.push({id:'element-identity-'+type+'-'+suffix,entry:wrapper.id,xml,yaml,inputs,
        factBindings,factSourceEntries:[sourceId],...(yaml?{}:{noRaw:true})});
    };
    add('canonical',canonical,'');
    cases.push({...cases.at(-1),id:'element-assembled-'+type+'-minimal',entry:assembly.owner.id,inputs:assemblyInputs,factBindings:assemblyFacts});

    const fixture=type==='ContextMenu'?'packages/rules/metadata/forms/elements/contextMenu/__fixtures__/minimal.xml':
      'packages/rules/metadata/forms/elements/autoCommandBar/__fixtures__/'+(type==='AutoCommandBar'?'minimalForm.xml':'minimalTable.xml');
    const xml=readFileSync(fixture,'utf8');
    cases.at(-1).xml=xml;cases.at(-1).source=[{path:fixture}];factSources.at(-1).xml=xml;
    const alias=(ownerName||'')+row.parameters.nameStyle.referenceSuffixes[1];
    add('alias',alias,'');
    add('explicit','СвояПанель','Имя: !xml/name СвояПанель');
    cases.at(-1).rejectedYAML=['Имя: СвояПанель','Имя: !другое СвояПанель'];
    if(type==='AutoCommandBar') {
      const fixture='packages/rules/metadata/forms/elements/autoCommandBar/__fixtures__/fullForm.xml';
      const full=readFileSync(fixture,'utf8');
      const autofill=full.match(/<Autofill>[^<]*<\/Autofill>/g),importance=full.match(/DisplayImportance="[^"]*"/g);
      if(autofill?.length!==1 || importance?.length!==1)throw new Error('Ambiguous panel fixture properties');
      const xml=`<${root} name="${canonical}" id="${id}" ${importance[0]}>${autofill[0]}</${root}>`;
      cases.push({id:'element-assembled-panel-fixture-properties',entry:assembly.owner.id,xml,
        yaml:'Автозаполнение: Ложь\nВажностьПриОтображении: Высокая',inputs:assemblyInputs,factBindings:assemblyFacts,
        factSourceEntries:[producer.id+'.canonical'],noRaw:true,source:[{path:fixture}]});
      cases.push({...cases.at(-1),id:'element-assembled-panel-invalid-neighbour',
        xml:xml.replace('id="-1"','id="oops"'),yaml:undefined,noRaw:undefined,
        annotation:'Идентификатор: !xml/invalid oops',retainedYAML:['Автозаполнение: Ложь','ВажностьПриОтображении: Высокая']});

      // A malformed scalar also exercises the physical preservation boundary:
      // the raw XML key must not overwrite neighbouring semantic properties.
      cases.push({id:'element-assembled-panel-malformed-scalar',entry:assembly.owner.id,
        xml:xml.replace('<Autofill>false</Autofill>','<Autofill>oops</Autofill>'),
        inputs:assemblyInputs,factBindings:assemblyFacts,factSourceEntries:[producer.id+'.canonical'],
        annotation:'Autofill: !xml/raw',retainedYAML:['ВажностьПриОтображении: Высокая']});
      cases.push({id:'element-assembled-panel-explicit-attribute-default',entry:assembly.owner.id,
        xml:`<${root} name="${canonical}" id="${id}" DisplayImportance="Auto"/>`,
        inputs:assemblyInputs,factBindings:assemblyFacts,factSourceEntries:[producer.id+'.canonical'],
        annotation:'ВажностьПриОтображении: !xml/raw'});
      for(const [suffix,xml,expectation] of [
        ['bad-name','<AutoCommandBar name="Bad Name" id="-1"/>',{yaml:'Имя: !xml/invalid\n  $значение: !xml/name Bad Name'}],
        ['bad-id','<AutoCommandBar name="ФормаКоманднаяПанель" id="oops"/>',{annotation:'Идентификатор: !xml/invalid oops'}],
        ['bad-fixed-id','<AutoCommandBar name="ФормаКоманднаяПанель" id="-2"/>',{yaml:"Идентификатор: !xml/invalid '-2'"}],
        ['absent-attributes','<AutoCommandBar/>',{yaml:'name: !xml/raw\n  $xml: null\nid: !xml/raw\n  $xml: null'}],
      ]) {
        const sourceId=producer.id+'.'+suffix;
        factSources.push({id:sourceId,entry:producer.id,xml,inputs});
        cases.push({id:'element-identity-'+suffix,entry:wrapper.id,xml,...expectation,inputs,
          factBindings,factSourceEntries:[sourceId]});
      }
    }
    if(type==='TableAutoCommandBar') {
      const added=producer.id+'.new',occupied=producer.id+'.occupied';
      factSources.push({id:added,entry:producer.id,yaml:`Имя: ${canonical}`,inputs});
      factSources.push({id:occupied,entry:producer.id,xml:`<${root} name="ЧужаяПанель" id="1"/>`,inputs:{...inputs,ownerName:'ЧужойЭлемент'}});
      cases.push({id:'element-identity-new-number',entry:wrapper.id,
        xml:`<${root} name="${canonical}" id="2"/>`,yaml:'',inputs,factBindings,
        factSourceEntries:[added,occupied],noRaw:true});
      const missingIdSource=producer.id+'.missing-id',missingIdXML=`<${root} name="${canonical}"/>`;
      factSources.push({id:missingIdSource,entry:producer.id,xml:missingIdXML,inputs});
      cases.push({id:'element-identity-missing-indexed-id',entry:wrapper.id,xml:missingIdXML,inputs,
        factBindings,factSourceEntries:[missingIdSource],annotation:'id: !xml/raw'});
      const sourceId=producer.id+'.saved';
      factSources.push({id:sourceId,entry:producer.id,yaml:`Имя: ${alias}\nИдентификатор: '${id}'`,inputs,
        snapshotFields:{Имя:alias,Идентификатор:id}});
      cases.push({id:'element-identity-saved-index',entry:wrapper.id,xml:`<${root} name="${alias}" id="${id}"/>`,yaml:'',
        inputs,factBindings,factSourceEntries:[sourceId],noRaw:true});
      const otherSources=[['other-form',{...inputs,owner:'ФормаДва'}],['other-component',{...inputs,component:'extension'}]];
      for(const [suffix,context] of otherSources)factSources.push({id:producer.id+'.'+suffix,entry:producer.id,
        yaml:`Имя: ${canonical}\nИдентификатор: '99'`,inputs:context});
      cases.push({...cases.at(-1),id:'element-identity-owner-and-component-isolation',
        factSourceEntries:[sourceId,...otherSources.map(([suffix])=>producer.id+'.'+suffix)]});
    }
  }
  // Independent two-field pattern proves record construction is not tied to names.
  const text={kind:'scalar',scalar:'text'},number={kind:'scalar',scalar:'number',profile:'decimal'};
  const pair={format:'nkdk-declarations/1',kind:'value',id:'test.default-pair',
    value:{kind:'record',fields:[{name:'label',type:text},{name:'count',type:number}]},
    representations:Object.fromEntries(['xml','yaml'].map(side=>[side,{kind:'text-pattern',parts:[{literal:'pair:'},{field:'label'},{literal:'/'},{field:'count'}]}]))};
  const counter={format:pair.format,kind:'value',id:'test.default-counter',
    value:{kind:'record',fields:[{name:'count',type:number}]},
    representations:Object.fromEntries(['xml','yaml'].map(side=>[side,{kind:'text-pattern',parts:[{literal:'#'},{field:'count'}]}]))};
  const choice={format:pair.format,kind:'value',id:'test.default-choice',imports:{pair:pair.id,counter:counter.id},
    value:{kind:'choice',variants:[{name:'pair',type:{use:'pair'}},{name:'counter',type:{use:'counter'}}]},
    representations:{xml:{kind:'choice'},yaml:{kind:'choice',variants:[{variant:'pair',form:'scalar',tag:'договор'}]}}};
  const value={field:'value'},selected={variantValue:{value,variant:'pair'}};
  const contract={format:pair.format,kind:'object',id:'test.default-pair-owner',imports:{choice:choice.id},
    inputs:{label:{type:text},count:{type:number}},value:{kind:'record',fields:[{name:'value',type:{use:'choice'}}]},
    representations:{xml:{kind:'record',fields:[{field:'value',path:['Envelope','Value']}]},yaml:{kind:'mapping',fields:[{field:'value',key:'Значение'}]}},
    presence:[{target:{field:'value'},yaml:{missing:{denotes:{variant:{name:'pair',value:{record:{label:{input:'label'},count:{input:'count'}}}}}},
      omitWhen:{and:[{isVariant:{value,variant:'pair'}},...['label','count'].map(field=>({eq:[{get:{of:selected,field}},{input:field}]}))]}}}]};
  modules.push(pair,counter,choice,contract);
  cases.push({id:'element-identity-generic-record-default',entry:contract.id,xml:'<Envelope><Value>pair:Ключ/7</Value></Envelope>',yaml:'',
    inputs:{label:'Ключ',count:7},noRaw:true});
  cases.push({id:'element-identity-generic-record-explicit',entry:contract.id,xml:'<Envelope><Value>pair:Другой/9</Value></Envelope>',
    yaml:'Значение: !договор pair:Другой/9',inputs:{label:'Ключ',count:7},rejectedYAML:['Значение: !другое pair:Другой/9']});
  cases.push({id:'element-identity-generic-untagged-variant',entry:contract.id,xml:'<Envelope><Value>#9</Value></Envelope>',
    yaml:"Значение: '#9'",inputs:{label:'Ключ',count:7},noRaw:true});
  const numbering=numberedFactCases();
  return {modules:[...modules,...numbering.modules],cases:[...cases,...numbering.cases],factSources:[...factSources,...numbering.factSources]};
}
