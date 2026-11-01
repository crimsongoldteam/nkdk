import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';

// Independent collection projection: requests and retained rows come from
// separate sources. Their shared index must reserve late values before sealing.
export function numberedFactCases() {
  const fixture=name=>yaml.load(readFileSync('rust/crates/rule-compiler/tests/fixtures/'+name+'.yaml','utf8'));
  const rows=fixture('fact-rows');rows.id='test.numbered.rows';
  const requests=fixture('fact-rows-owner');requests.id='test.numbered.requests';requests.imports.rows=rows.id;
  const index='test.numbered.identities';
  const contribution=requests.contributions[1];
  requests.contributions=[{...contribution,index,allocate:{scope:['owner','kind'],first:1}}];
  delete requests.contributions[0].value;
  const retained={...structuredClone(requests),id:'test.numbered.retained',contributions:[{...contribution,index}]};
  const reserved=structuredClone(retained);reserved.id='test.numbered.reserved';
  const reservation=reserved.contributions[0];
  delete reservation.key.record.name;
  reservation.reserve=reservation.value;delete reservation.value;
  const snapshotFields={Rows:[{Code:'x',Title:'2'},{Code:'x',Title:'3'},{Code:'x',Title:'2'}]};
  const formPath='e2e/fixtures/xml/cf/CommonForms/ExtendedTooltip/Ext/Form.xml';
  const observedFields=['button','tooltip'];
  const buttonPath=['f:Form','f:AutoCommandBar','f:ChildItems','f:Button'];
  const observed={format:rows.format,kind:'object',id:'test.numbered.observed',
    namespaces:{f:'http://v8.1c.ru/8.3/xcf/logform'},
    value:{kind:'record',fields:observedFields.map(name=>({name,type:{kind:'scalar',scalar:'text'}}))},
    representations:{xml:{kind:'record',fields:[{field:'button',path:buttonPath,attribute:'id'},
      {field:'tooltip',path:[...buttonPath,'f:ExtendedTooltip'],attribute:'id'}]},
      yaml:{kind:'mapping',fields:observedFields.map(field=>({field,key:field}))}},
    contributions:observedFields.map(field=>({index,key:structuredClone(reservation.key),reserve:{field}}))};
  const consumer={format:rows.format,kind:'object',id:'test.numbered.consumer',
    inputs:{numbers:{index}},value:{kind:'record',fields:[{name:'id',type:{kind:'scalar',scalar:'text'}}]},
    representations:{xml:{kind:'record',fields:[{field:'id',path:['Number']}]},
      yaml:{kind:'mapping',fields:[{field:'id',key:'Номер'}]}},
    constraints:[{id:'allocated',appliesTo:['xml-import','yaml-validation'],
      assert:{eq:[{field:'id'},{require:{lookup:{in:{input:'numbers'},key:{record:{owner:{literal:'a.b'},kind:{literal:'element'},name:{literal:'beta'}}}}}}]},
      diagnostic:{code:'number.test',severity:'error',at:{field:'id'},message:'Unexpected allocated number'}}]};
  return {modules:[rows,requests,retained,reserved,observed,consumer],
    factSources:[{id:requests.id,entry:requests.id,xml:'<Root><Rows><Item><Code>alpha</Code><Title>x</Title></Item><Item><Code>beta</Code><Title>x</Title></Item></Rows></Root>'},
      {id:retained.id,entry:retained.id,xml:'<Root><Rows><Item><Code>old</Code><Title>1</Title></Item></Rows></Root>'},
      {id:reserved.id,entry:reserved.id,xml:'<Root><Rows><Item><Code>x</Code><Title>2</Title></Item><Item><Code>x</Code><Title>3</Title></Item><Item><Code>x</Code><Title>2</Title></Item></Rows></Root>',snapshotFields},
      {id:reserved.id+'.yaml',entry:reserved.id,yaml:yaml.dump(snapshotFields),snapshotFields},
      {id:observed.id,entry:observed.id,xml:readFileSync(formPath,'utf8'),snapshotFields:{button:'1',tooltip:'2'}}],
    cases:[{id:'numbered-facts-collection-requests',entry:consumer.id,xml:'<Number>3</Number>',yaml:"Номер: '3'",noRaw:true,
      factBindings:{numbers:index},factSourceEntries:[requests.id,retained.id]},
      {id:'numbered-facts-reserved-numbers',entry:consumer.id,xml:'<Number>5</Number>',yaml:"Номер: '5'",noRaw:true,
        factBindings:{numbers:index},factSourceEntries:[requests.id,retained.id,reserved.id]},
      {id:'numbered-facts-reserved-yaml',entry:consumer.id,xml:'<Number>5</Number>',yaml:"Номер: '5'",noRaw:true,
        factBindings:{numbers:index},factSourceEntries:[requests.id,retained.id,reserved.id+'.yaml']},
      {id:'numbered-facts-e2e-form-context',entry:consumer.id,xml:'<Number>4</Number>',yaml:"Номер: '4'",noRaw:true,
        factBindings:{numbers:index},factSourceEntries:[requests.id,observed.id],source:[{path:formPath}]}]};
}
