import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, lstatSync } from 'node:fs';
import { join } from 'node:path';

export function safeUpdate(current, previous, next) {
  for (const name of Object.keys(current)) {
    if (!Object.hasOwn(previous,name)) throw new Error(`unowned candidate file: ${name}`);
    if (current[name] !== previous[name]) throw new Error(`modified candidate file: ${name}`);
  }
  for (const name of Object.keys(previous)) if (!Object.hasOwn(current,name)) throw new Error(`modified candidate file removed: ${name}`);
  for (const name of [...Object.keys(previous),...Object.keys(next)]) if (!/^[A-Za-z0-9.-]+\.yaml$/.test(name)) throw new Error(`Unsafe candidate filename: ${name}`);
}

export function writeCandidates(directory, files, manifest) {
  if (existsSync(directory) && (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink())) throw new Error('Unsafe candidate directory');
  mkdirSync(directory,{recursive:true});
  const manifestPath = join(directory,'manifest.json');
  if (existsSync(manifestPath) && lstatSync(manifestPath).isSymbolicLink()) throw new Error('Unsafe manifest');
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath,'utf8')).generatedFiles : {};
  const current = {};
  for (const name of readdirSync(directory).filter(n => n !== 'manifest.json')) {
    const path = join(directory,name);
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error(`Unsafe candidate entry: ${name}`);
    current[name] = readFileSync(path,'utf8');
  }
  safeUpdate(current,previous,files);
  for (const [name,contents] of Object.entries(files)) if (current[name] !== contents) writeFileSync(join(directory,name),contents);
  for (const name of Object.keys(previous)) if (!Object.hasOwn(files,name)) unlinkSync(join(directory,name));
  const contents=`${JSON.stringify({...manifest,generatedFiles:files},null,2)}\n`;
  if (!existsSync(manifestPath) || readFileSync(manifestPath,'utf8') !== contents) writeFileSync(manifestPath,contents);
}
