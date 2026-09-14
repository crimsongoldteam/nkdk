import {test} from 'node:test';
import {execFileSync} from 'node:child_process';

test('working enumeration declaration and e2e cases match their source rules',()=>{
  execFileSync(process.execPath,['tools/rules-migration/src/enum-values-operation.mjs','--check'],{stdio:'pipe'});
});
