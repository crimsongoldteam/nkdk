import {readFileSync, writeFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';

const source='rust/declarations/probes/document-internal-types.yaml';
const target='rust/declarations/probes/defined-type-internal-types.generated.yaml';
const declaration=yaml.load(readFileSync(source,'utf8'));
const ownerFragment=yaml.load(readFileSync('rust/declarations/fragments/defined-type-internal-info.generated.yaml','utf8'));
declaration.id='migration.defined-type-internal-types';
declaration.representations.xml.fields[0].path=ownerFragment.representations.xml.fields[0].path;
const content=`# Generated from ${source} by tools/rules-migration/src/internal-types-operation.mjs\n${yaml.dump(declaration,{noRefs:true})}`;
if(process.argv.includes('--check')) {
  if(readFileSync(target,'utf8')!==content)throw new Error(`Stale generated declaration: ${target}`);
} else {
  writeFileSync(target,content);
}
