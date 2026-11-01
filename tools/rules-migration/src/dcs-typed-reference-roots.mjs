import {readFileSync,writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {canonicalYamlXmlEnum} from './canonical-xml-enum.mjs';

const source='rust/declarations/common/metadata-path-lexicons.yaml';
const target='rust/declarations/common/dcs-typed-reference-roots.generated.yaml';
const base=yaml.load(readFileSync(source,'utf8')).declarations.find(row=>row.id==='common.path-root');
const declaration=canonicalYamlXmlEnum(base,'common.dcs-typed-reference-root');
const text=`# Generated from ${source}; run dcs-typed-reference-roots.mjs\n`+yaml.dump(declaration,{noRefs:true});
if(process.argv.includes('--check')){
  if(readFileSync(target,'utf8')!==text)throw new Error('Stale typed reference roots');
}else writeFileSync(target,text);
