import {lstatSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {writeCandidates} from './candidate-output.mjs';

export function writeChanged(path,text) {
  const stat=lstatSync(path,{throwIfNoEntry:false});
  if(stat && (!stat.isFile() || stat.isSymbolicLink()))throw new Error('Unsafe generated output');
  if(stat && readFileSync(path,'utf8')===text)return false;
  writeFileSync(path,text);
  return true;
}
export function writeFocused(directory,files,manifest) {
  const stat=lstatSync(directory,{throwIfNoEntry:false});
  if(stat && (!stat.isDirectory() || stat.isSymbolicLink()))throw new Error('Unsafe focused directory');
  mkdirSync(directory,{recursive:true});
  const catalog=join(directory,'catalog');
  const metadata={status:'focused-test-only',entries:Object.keys(files).sort()};
  writeCandidates(catalog,files,metadata);
  const cases=join(directory,'cases.json');
  writeChanged(cases,JSON.stringify(manifest,null,2)+'\n');
  return {catalog,cases};
}
