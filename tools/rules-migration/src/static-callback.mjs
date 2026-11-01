import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {evaluator,serialize} from './static-value.mjs';
import {sourceProgram} from './source-program.mjs';
import {ts,walk} from './syntax.mjs';

// Migration-time specialization only: the AST evaluator never executes JS.
export function checkedCallback(unresolved,sourceText) {
 const fail=()=>{throw new Error('Unsupported or stale static callback');};
 const issue=unresolved?.$unresolved;
 if(issue?.kind!=='expression' || typeof issue.expression!=='string' ||
   typeof issue.source?.path!=='string' || typeof issue.sourceHash!=='string')fail();
 const text=sourceText??readFileSync(issue.source.path,'utf8');
 if(createHash('sha256').update(text).digest('hex')!==issue.sourceHash)fail();
 const source=ts.createSourceFile(issue.source.path,text,ts.ScriptTarget.Latest,true);
 if(source.parseDiagnostics.length)fail();
 let matched;
 walk(source,node=>{
  if(!ts.isArrowFunction(node) && !ts.isFunctionExpression(node))return;
  const position=source.getLineAndCharacterOfPosition(node.getStart(source));
  if(position.line+1===issue.source.line && position.character+1===issue.source.column &&
    node.getText(source)===issue.expression)matched=node;
 });
 if(!matched)fail();
 return {source,expression:matched};
}

export function specializeStaticCallback(unresolved,argument,sourceText) {
 checkedCallback(unresolved,sourceText);
 const fail=()=>{throw new Error('Unsupported or stale static callback');};
 const issue=unresolved.$unresolved;
 let json;
 try { json=JSON.stringify(argument); } catch { fail(); }
 if(json===undefined || !isDeepStrictEqual(argument,JSON.parse(json)))fail();
 const program=sourceProgram({'static-callback.ts':`const result = (${issue.expression})(${json});`});
 const file=program.parsed.get('/static-callback.ts');
 if(file.parseDiagnostics.length)fail();
 const expression=file.statements[0].declarationList.declarations[0].initializer;
 const issues=[],value=serialize(evaluator(program)(expression),issues);
 if(issues.length)fail();
 return value;
}
