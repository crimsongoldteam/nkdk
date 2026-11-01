import {prepareGenerated} from './shared-aot-output.mjs';
import {sharedAotManifests} from './shared-aot-manifests.mjs';

// The layout and Cargo graph are reviewable source; large generated code is not.
export function sharedAotArtifacts(root,output,bundle,{sources,facadeName}={}) {
  const layout=JSON.parse(bundle.get('layout.json').toString('utf8'));
  const manifests=sharedAotManifests(root,output,layout,sources?{sources,facadeName,workspace:false}:{});
  for(const package_ of layout.packages) {
    const prefix=package_.facade?'src/':`packages/${package_.package}/src/`;
    package_.compiledRustBytes=[...bundle,...manifests].filter(([path])=>path.startsWith(prefix) && path.endsWith('.rs')).reduce((sum,[,bytes])=>sum+bytes.length,0);
    if(package_.compiledRustBytes>16*1024*1024)throw new Error(`Rust package budget exceeded including wrapper: ${package_.package}`);
  }
  const layoutBytes=Buffer.from(JSON.stringify(layout,null,2)+'\n');
  if(!sources)return [{directory:output,files:new Map([...bundle,...manifests,['layout.json',layoutBytes]])}];
  const prepared=new Map(bundle);prepared.delete('layout.json');
  const tracked=new Map(manifests);tracked.set('layout.json',layoutBytes);
  return [{directory:sources,files:prepared},{directory:output,files:tracked}];
}

export function publishPrepared(publications,options) {
  const plans=publications.map(({directory,files})=>prepareGenerated(directory,files,options));
  for(const publish of plans)publish();
}
