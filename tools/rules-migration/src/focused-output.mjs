import {lstatSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {writeCandidates} from './candidate-output.mjs';

export function writeChanged(path,text) {
  const stat=lstatSync(path,{throwIfNoEntry:false});
  if(stat && (!stat.isFile() || stat.isSymbolicLink()))throw new Error('Unsafe generated output');
  if(stat && readFileSync(path).equals(Buffer.isBuffer(text)?text:Buffer.from(text)))return false;
  writeFileSync(path,text);
  return true;
}
export function writeFocused(directory,files,manifest,{catalogDirectory=directory}={}) {
  for(const path of new Set([directory,catalogDirectory])) {
    const stat=lstatSync(path,{throwIfNoEntry:false});
    if(stat && (!stat.isDirectory() || stat.isSymbolicLink()))throw new Error('Unsafe focused directory');
    mkdirSync(path,{recursive:true});
  }
  const catalog=join(catalogDirectory,'catalog');
  const metadata={status:'focused-test-only',entries:Object.keys(files).sort()};
  writeCandidates(catalog,files,metadata);
  const cases=join(directory,'cases.json');
  writeChanged(cases,JSON.stringify(manifest,null,2)+'\n');
  return {catalog,cases};
}
