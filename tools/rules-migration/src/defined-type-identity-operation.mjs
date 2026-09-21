import {readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';

const source='rust/declarations/objects/defined-type.yaml';
const owner=yaml.load(readFileSync(source,'utf8'));
const fields=owner.representations.xml.content.fields;
const xmlField=name=>{
  const field=fields.find(item=>item.field===name);
  if(!field)throw new Error(`Missing owner XML field: ${name}`);
  return structuredClone(field);
};
const scalar={kind:'scalar',scalar:'text'};
for(const [role,fragment,fieldNames,bindings] of [
  ['own','fragment.metadata-own-identity',['name','uuid'],{
    component:{input:'component'},owner:{input:'parent'},kind:{literal:'DefinedType'},
    name:{field:'name'},identity:{field:'uuid'},
  }],
  ['base','fragment.metadata-base-identity',['uuid','base'],{
    component:{input:'component'},identity:{field:'uuid'},baseIdentity:{field:'base'},
  }],
]){
  const declaration={
    format:'nkdk-declarations/1',kind:'object',id:`migration.defined-type-${role}-identity`,
    namespaces:structuredClone(owner.namespaces),imports:{facts:fragment},
    inputs:{component:{type:scalar},...role==='own'?{parent:{type:scalar}}:{}},
    value:{kind:'record',fields:fieldNames.map(name=>({name,type:scalar}))},
    compose:[{use:'facts',bind:bindings}],
    representations:{
      xml:{kind:'with-attributes',attributes:structuredClone(owner.representations.xml.attributes),content:{kind:'record',fields:fieldNames.map(xmlField)}},
      yaml:{kind:'mapping',fields:fieldNames.map(name=>({field:name,key:name}))},
    },
  };
  const target=`rust/declarations/probes/defined-type-${role}-identity.generated.yaml`;
  const content=`# Generated from ${source} by tools/rules-migration/src/defined-type-identity-operation.mjs\n${yaml.dump(declaration,{noRefs:true})}`;
  if(process.argv.includes('--check')){
    if(readFileSync(target,'utf8')!==content)throw new Error(`Stale generated declaration: ${target}`);
  }else writeFileSync(target,content);
}
