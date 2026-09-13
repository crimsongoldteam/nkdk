import { sourceProgram } from './source-program.mjs';
import { ts, unwrap } from './syntax.mjs';

// Find direct structural references, without evaluating getters or calling builders.
export function exposedRules(sources, entries) {
  const program=sourceProgram(sources), results=[];
  for(const target of entries.filter(entry=>entry.exportStatus==='not-exported')) {
    const file=program.parsed.get(`/${target.path}`);
    const variables=file.statements.filter(ts.isVariableStatement).flatMap(statement=>[...statement.declarationList.declarations]);
    const declaration=variables.find(d=>d.name.getText()===target.symbol);
    function trace(input,path=[]) {
      const node=unwrap(input);
      if(!node)return undefined;
      if(ts.isIdentifier(node)&&program.target(node)===declaration)return path;
      if(ts.isObjectLiteralExpression(node))for(const property of node.properties) {
        if(!ts.isPropertyAssignment(property)||(!ts.isIdentifier(property.name)&&!ts.isStringLiteral(property.name)))continue;
        const found=trace(property.initializer,[...path,property.name.text]);
        if(found)return found;
      }
      if(ts.isArrayLiteralExpression(node)&&!node.elements.some(ts.isSpreadElement))for(const [index,item] of node.elements.entries()) {
        const found=trace(item,[...path,index]);if(found)return found;
      }
    }
    for(const owner of entries.filter(entry=>entry.path===target.path&&entry.exportStatus==='owner-candidate')) {
      const root=variables.find(d=>d.name.getText()===owner.symbol);
      const path=trace(root?.initializer);
      if(path){results.push({path:target.path,symbol:target.symbol,via:{export:owner.symbol,path}});break;}
    }
  }
  return results;
}
export function dataPath(value,path) {
  for(const key of path) {
    const property=value!=null&&Object.getOwnPropertyDescriptor(value,key);
    if(!property||!Object.hasOwn(property,'value'))throw new Error(`Not a data property: ${key}`);
    value=property.value;
  }
  return value;
}
