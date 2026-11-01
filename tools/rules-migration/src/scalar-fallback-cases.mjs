import {readFileSync} from 'node:fs';
import {emitCandidates} from './emit.mjs';
import {propertyContract} from './property-contract.mjs';
import {loadSources} from './source-snapshot.mjs';

// This matrix checks source registration and field placement, not the primitive
// boolean/number/text converters already covered by their own common matrices.
export function scalarFallbackCases(catalog) {
 const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json'));
 loadSources(extraction.sourceHashes);
 const source=extraction.entries.find(row=>row.symbol==='AutoCommandBarRules');
 const isolate=(owner,name,root)=>{
  const emitted=emitCandidates([{...owner,properties:owner.properties.filter(row=>row.name===name)}],catalog);
  const local=new Map([...catalog,...emitted.modules.map(row=>[row.id,row])]);
  const projection=emitted.entries[0].projections[0];
  if(!projection)throw new Error(`Missing scalar fallback projection: ${owner.symbol}.${name}`);
  return propertyContract(projection,name,local,root).module;
 };
 const module=isolate(source,'autofill','AutoCommandBar');
 const entry=module.id,modules=[module];
 const part={...structuredClone(module),kind:'fragment',id:module.id+'.fragment'};
 const neighbour={format:'nkdk-declarations/1',kind:'fragment',id:'migration.scalar-fallback-neighbour',
  value:{kind:'record',fields:[{name:'note',type:{kind:'scalar',scalar:'text'}}]},
  representations:{xml:{kind:'record',fields:[{field:'note',path:['AutoCommandBar','Note']}]},yaml:{kind:'mapping',fields:[{field:'note',key:'Сосед'}]}},
  presence:[{target:{field:'note'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{absent:true}}}}]};
 const composed={format:'nkdk-declarations/1',kind:'object',id:'migration.scalar-fallback-composed',
  imports:{part:part.id,neighbour:neighbour.id},compose:[{use:'part'},{use:'neighbour'}],value:{kind:'record',fields:[]},
  representations:{xml:{kind:'record',fields:[]},yaml:{kind:'mapping',fields:[]}}};
 modules.push(part,neighbour,composed);
 const folder='packages/rules/metadata/forms/elements/autoCommandBar/__fixtures__/';
 const full=readFileSync(folder+'fullForm.xml','utf8');
 const selected=full.match(/<Autofill>[^<]*<\/Autofill>/g);
 if(selected?.length!==1)throw new Error('Ambiguous legacy fallback XML field');
 const provenance=[{path:folder+'fullForm.xml'},{path:folder+'data.ts'},
  {path:source.path,symbol:source.symbol}];
 const cases=[
  {id:'scalar-fallback-panel-full',entry,xml:`<AutoCommandBar>${selected[0]}</AutoCommandBar>`,yaml:'Автозаполнение: Ложь',noRaw:true,source:provenance},
  {id:'scalar-fallback-panel-missing',entry,xml:'<AutoCommandBar/>',yaml:'',noRaw:true,source:[{path:folder+'minimalForm.xml'}]},
  {id:'scalar-fallback-panel-explicit-default',entry,xml:'<AutoCommandBar><Autofill>true</Autofill></AutoCommandBar>',annotation:'Автозаполнение: !xml/raw'},
 ];
 cases.push({...cases[2],id:'scalar-fallback-composed-explicit-default',entry:composed.id,xml:'<AutoCommandBar><Autofill>true</Autofill><Note>Проверка</Note></AutoCommandBar>',retainedYAML:['Сосед: Проверка']});
 const additions=[
  ['flag','boolean','Флаг',false,'Ложь','Истина','true'],
  ['caption','string','Текст','начало','начало','другое','другое'],
  ['count','number','Количество',7,7,'9','9'],
 ];
 for(const [name,type,key,value,implicit,nondefault,xmlValue] of additions) {
  const property={name,source:{path:source.path},status:'static-parameters',parameters:{type,yaml:key,xml:'Value',defaultValue:value,implicitValueYAML:implicit}};
  const selection={...source,xmlOrder:{status:'absent'},properties:[property]};
  const isolated=isolate(selection,name,'Envelope');
  cases.push({id:`scalar-fallback-${type}-missing`,entry:isolated.id,xml:'<Envelope/>',yaml:'',noRaw:true});
  cases.push({id:`scalar-fallback-${type}-value`,entry:isolated.id,xml:`<Envelope><Value>${xmlValue}</Value></Envelope>`,yaml:`${key}: ${nondefault}`,noRaw:true});
  if(type!=='boolean')cases.push({id:`scalar-fallback-${type}-explicit-default`,entry:isolated.id,
   xml:`<Envelope><Value>${value}</Value></Envelope>`,annotation:`${key}: !xml/raw`});
  modules.push(isolated);
 }
 const list=extraction.entries.find(row=>row.symbol==='DynamicListRules');
 const query=isolate(list,'customQuery','Settings');
 modules.push(query);
 const fixtures='packages/rules/metadata/forms/commonObjects/dynamicList/__fixtures__/';
 for(const [name,expected] of [['minimal',''],['customQuery','ПроизвольныйЗапрос: Истина']]) {
  const path=fixtures+name+'.xml';
  const values=readFileSync(path,'utf8').match(/<ManualQuery>[^<]*<\/ManualQuery>/g);
  if(values?.length!==1)throw new Error('Ambiguous ManualQuery fixture');
  cases.push({id:`scalar-fallback-list-${name}`,entry:query.id,xml:`<Settings>${values[0]}</Settings>`,
   yaml:expected,noRaw:true,source:[{path},{path:fixtures+'data.ts'},{path:list.path}],
   contract:'Equal literal, XML and YAML defaults; preserve the existing ManualQuery wire field and independently expected omission'});
 }
 cases.push({id:'scalar-fallback-list-missing',entry:query.id,xml:'<Settings/>',yaml:'ManualQuery: !xml/raw\n  $xml: null',
  contract:'Missing XML differs from the declared explicit default; generic preservation must retain the absence'});
 return {modules,cases,factSources:[]};
}
