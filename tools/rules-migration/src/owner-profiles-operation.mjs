import {readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';

const source='rust/declarations/objects/defined-type.yaml';
const output='rust/declarations/objects/defined-type-extension.generated.yaml';
const profile=yaml.load(readFileSync(source,'utf8'));
profile.id='metadata.defined-type-extension';
const rule=field=>{
  const found=profile.presence.find(item=>item.target?.field===field);
  if(!found)throw new Error(`Missing profile field: ${field}`);
  return found;
};
delete rule('type').xml.empty;
delete rule('synonym').xml.canonical;
rule('synonym').yaml={missing:{denotes:{absent:true}},omitWhen:{not:{present:{field:'synonym'}}}};
const content='# Generated from defined-type.yaml by tools/rules-migration/src/owner-profiles-operation.mjs\n'+yaml.dump(profile,{noRefs:true});
if(process.argv.includes('--check')){
  if(readFileSync(output,'utf8')!==content)throw new Error(`Stale owner profile: ${output}`);
}else writeFileSync(output,content);
