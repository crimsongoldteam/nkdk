import {readFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
// Reuse the runner's own source and dependency versions, not a copied harness.
export function preparedRunnerManifest(directory,catalogDirectory,{catalogPackage='nkdk-shared-catalog'}={}) {
  const runtime=join(root,'tools/rules-migration/runtime');
  let manifest=readFileSync(join(runtime,'Cargo.toml'),'utf8').split('[build-dependencies]')[0];
  const path=target=>JSON.stringify(relative(directory,target).split('\\').join('/'));
  manifest=manifest.replace('name = "nkdk-migration-contracts"','name = "nkdk-shared-contracts"')
    .replace('[features]','[features]\ndefault = ["working-catalog"]')
    .replace(/^nkdk-compiled-rules = .*$/m,`nkdk-compiled-rules = { package = ${JSON.stringify(catalogPackage)}, path = ${path(catalogDirectory)}, optional = true }`)
    .replace(/^nkdk-conversion-core = .*$/m,`nkdk-conversion-core = { path = ${path(join(root,'rust/crates/conversion-core'))} }`)
    .replace(/^yaml-rust2 = .*$/m,`yaml-rust2 = { version = "=0.11.0", path = ${path(join(root,'third-party/yaml-rust2'))} }`);
  return manifest+`\n[[bin]]\nname = "nkdk-shared-contracts"\npath = ${path(join(runtime,'src/main.rs'))}\n`;
}
