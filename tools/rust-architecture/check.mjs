import {spawnSync} from 'node:child_process';
import {violations} from './policy.mjs';
const result=spawnSync('cargo',['metadata','--format-version','1','--no-deps','--locked','--offline'],{cwd:new URL('../../rust/',import.meta.url),encoding:'utf8',maxBuffer:8*1024*1024});
if(result.error)throw result.error;
if(result.status!==0){process.stderr.write(result.stderr);process.exit(result.status??1);}
const errors=violations(JSON.parse(result.stdout));
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Rust: разрешённые зависимости пакетов проверены. Частные условия внутри пакетов требуют ревью.');
