import {mkdirSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sharedAotArguments} from './shared-aot-args.mjs';
import {sharedAotArtifacts,publishPrepared} from './shared-aot-artifacts.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const options=sharedAotArguments(process.argv.slice(2),root);
const {output,check}=options;
const temporary=join(root,'rust/target/aot-staging');mkdirSync(temporary,{recursive:true});
const scratch=mkdtempSync(join(temporary,'prepare-'));
const staging=join(scratch,'bundle');
try {
  await new Promise((accept,reject)=>{
    const example=options.productionGroup?'emit_shared_production':'emit_shared';
    const inputs=options.productionGroup?[options.productionGroup,staging]:[options.catalog,options.exports,staging];
    const child=spawn('cargo',['+1.98.1','run','--offline','--locked','--manifest-path',join(root,'rust/Cargo.toml'),'-j1','-p','nkdk-rule-compiler','--example',example,'--',...inputs],
      {cwd:root,stdio:'inherit',env:{...process.env,CARGO_INCREMENTAL:'0'}});
    child.once('error',reject);child.once('exit',code=>code===0?accept():reject(new Error(`Shared AOT compiler exited ${code}`)));
  });
  const bundle=JSON.parse(readFileSync(join(staging,'bundle.json'),'utf8'));
  if(bundle.format!=='nkdk-aot-bundle/1')throw new Error('Unsupported shared AOT bundle');
  const files=new Map(bundle.files.map(path=>[path,readFileSync(join(staging,path))]));
  const layout=JSON.parse(files.get('layout.json').toString('utf8'));
  const publications=sharedAotArtifacts(root,output,files,{sources:options.sources,facadeName:`nkdk-shared-catalog-${options.productionGroup}`});
  publishPrepared(publications,{check});
  console.log(JSON.stringify({packages:layout.packages.filter(package_=>!package_.facade).length,facade:true,catalogSignature:layout.catalogSignature,check}));
} finally {rmSync(scratch,{recursive:true,force:true});}
