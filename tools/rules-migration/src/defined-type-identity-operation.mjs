import {readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {ownIdentityDeclaration} from './owner-creation-declarations.mjs';

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
  const declaration=role==='own'?ownIdentityDeclaration({
    id:'migration.defined-type-own-identity',namespace:owner.namespaces.md,
    xmlKind:'DefinedType',yamlKind:'ОпределяемыйТип',identityKind:'DefinedType',
    version:owner.representations.xml.attributes.find(row=>row.name==='version').value.text,
  }):{
    format:'nkdk-declarations/1',kind:'object',id:`migration.defined-type-${role}-identity`,
    namespaces:structuredClone(owner.namespaces),imports:{facts:fragment},
    inputs:{component:{type:scalar},...role==='own'?{parent:{type:scalar},ownerName:{type:scalar},identitySeed:{type:scalar}}:{}},
    value:{kind:'record',fields:fieldNames.map(name=>({name,type:scalar}))},
    compose:[{use:'facts',bind:bindings}],
    representations:{
      xml:{kind:'with-attributes',attributes:structuredClone(owner.representations.xml.attributes),content:{kind:'record',fields:fieldNames.map(xmlField)}},
      yaml:{kind:'mapping',fields:fieldNames.map(name=>({field:name,key:name}))},
    },
  };
  if(role==='base'){
    declaration.value.fields=declaration.value.fields.filter(field=>field.name==='base');
    declaration.representations.xml.content.fields=declaration.representations.xml.content.fields.filter(field=>field.field==='base');
    declaration.representations.xml=declaration.representations.xml.content;
    declaration.representations.yaml.fields=declaration.representations.yaml.fields.filter(field=>field.field==='base');
    const baseField=declaration.representations.xml.fields.find(field=>field.field==='base');
    baseField.path=baseField.path.slice(0,-1);
    declaration.imports={bases:'migration.defined-type-base-values'};
    declaration.value.fields.find(field=>field.name==='base').type={use:'bases'};
    declaration.inputs.parent={type:scalar};
    declaration.inputs.ownerName={type:scalar};
    declaration.inputs.identities={index:'metadata.own-identities'};
    delete declaration.compose;
    declaration.presence=[{target:{field:'base'},xml:{missing:{denotes:{sequence:[]}}},yaml:{missing:{denotes:{sequence:[]}}}}];
    declaration.contributions=[{
      index:'metadata.base-identities',
      forEach:{in:{field:'base'},as:'item'},
      key:{record:{component:{input:'component'},identity:{require:{lookup:{
        in:{input:'identities'},
        key:{record:{component:{input:'component'},owner:{input:'parent'},kind:{literal:'DefinedType'},name:{input:'ownerName'}}},
      }}}}},
      value:{get:{of:{var:'item'},field:'base'}},
    }];
  }
  const target=`rust/declarations/probes/defined-type-${role}-identity.generated.yaml`;
  const baseRow={
    format:'nkdk-declarations/1',kind:'value',id:'migration.defined-type-base-row',
    imports:{text:'common.string'},
    value:{kind:'record',fields:[{name:'base',type:{use:'text'}}]},
    representations:{xml:{kind:'record',fields:[{field:'base',path:[]}]},yaml:{kind:'mapping',fields:[{field:'base',key:'base'}]}},
  };
  const baseValues={
    format:'nkdk-declarations/1',kind:'value',id:'migration.defined-type-base-values',
    namespaces:structuredClone(owner.namespaces),
    imports:{row:baseRow.id},
    value:{kind:'sequence',item:{use:'row'}},
    representations:{xml:{kind:'element-sequence',path:['md:ExtendedConfigurationObject']},yaml:{kind:'sequence'}},
  };
  const document=role==='base'?{format:'nkdk-declarations/1',kind:'catalog',declarations:[baseRow,baseValues,declaration]}:declaration;
  const content=`# Generated from ${source} by tools/rules-migration/src/defined-type-identity-operation.mjs\n${yaml.dump(document,{noRefs:true})}`;
  if(process.argv.includes('--check')){
    if(readFileSync(target,'utf8')!==content)throw new Error(`Stale generated declaration: ${target}`);
  }else writeFileSync(target,content);
}
