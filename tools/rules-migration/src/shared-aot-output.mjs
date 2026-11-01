import {lstatSync,mkdirSync,readFileSync,unlinkSync,rmdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {writeChanged} from './focused-output.mjs';

const ownership='.nkdk-aot-files.json';
function validate(path) {
  if(typeof path!=='string' || path===ownership || path.includes('\\') || path.split('/').some(part=>!part || part==='.' || part==='..')) {
    throw new Error(`Unsafe generated path: ${path}`);
  }
}
function regular(path,directory=false) {
  const stat=lstatSync(path,{throwIfNoEntry:false});
  if(stat && (stat.isSymbolicLink() || (directory?!stat.isDirectory():!stat.isFile())))throw new Error(`Unsafe generated output: ${path}`);
  return stat;
}
export function prepareGenerated(directory,files,{check=false}={}) {
  regular(directory,true);
  const metadataPath=join(directory,ownership);
  const metadataStat=regular(metadataPath);
  const prior=metadataStat?JSON.parse(readFileSync(metadataPath,'utf8')):{format:'nkdk-aot-files/1',files:[]};
  if(prior.format!=='nkdk-aot-files/1' || !Array.isArray(prior.files))throw new Error('Unsafe ownership manifest');
  for(const path of [...prior.files,...files.keys()])validate(path);
  const owned=new Set(prior.files);
  const paths=[...files.keys()].sort();
  const obsolete=prior.files.filter(path=>!files.has(path));
  // Validate every destination before writing or removing any file.
  for(const path of new Set([...paths,...obsolete])) {
    let parent=directory;
    for(const part of path.split('/').slice(0,-1)) {parent=join(parent,part);regular(parent,true);}
    const stat=regular(join(directory,path));
    if(stat && !owned.has(path))throw new Error(`Unowned generated destination: ${path}`);
  }
  const metadata=JSON.stringify({format:'nkdk-aot-files/1',files:paths},null,2)+'\n';
  if(check) {
    if(!metadataStat || readFileSync(metadataPath,'utf8')!==metadata || obsolete.length)throw new Error('Stale AOT ownership manifest');
    for(const [path,contents] of files) {
      const output=join(directory,path);
      if(!regular(output) || !readFileSync(output).equals(contents))throw new Error(`Stale AOT file: ${path}`);
    }
    return ()=>{};
  }
  return ()=>{
    mkdirSync(directory,{recursive:true});
    for(const [path,contents] of files) { const output=join(directory,path);mkdirSync(dirname(output),{recursive:true});writeChanged(output,contents); }
    for(const path of obsolete)if(regular(join(directory,path)))unlinkSync(join(directory,path));
    const parents=new Set();
    for(const path of obsolete) {
      const parts=path.split('/').slice(0,-1);
      while(parts.length) {parents.add(parts.join('/'));parts.pop();}
    }
    for(const parent of [...parents].sort((a,b)=>b.split('/').length-a.split('/').length)) {
      try {rmdirSync(join(directory,parent));}
      catch(error) {if(!['ENOENT','ENOTEMPTY','EEXIST'].includes(error.code))throw error;}
    }
    writeChanged(metadataPath,metadata);
  };
}

export function publishGenerated(directory,files,options) {
  prepareGenerated(directory,files,options)();
}
