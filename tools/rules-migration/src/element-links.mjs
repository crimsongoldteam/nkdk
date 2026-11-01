import {sourceProgram} from './source-program.mjs';
import {evaluator,serialize} from './static-value.mjs';
import {specializeStaticCallback} from './static-callback.mjs';
import {ts,walk,location} from './syntax.mjs';

const factories=new Set([
  'packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts',
  'packages/rules/metadata/ruleRuntime/formElement/ruleFactory.ts',
]);
const allowed=new Set(['propertyType','elementRule','toXML','nameStyle','directId']);

// Structural evidence only. A callback is retained even when its constant result
// can be proved: linking a registration does not implement its runtime contract.
export function elementLinks(sources,entries) {
  const program=sourceProgram(sources),evaluate=evaluator(program);
  const registrations=[],unresolved=[];
  for(const [path,file] of program.parsed) {
    if(!path.startsWith('/packages/rules/metadata/') || /(?:__fixtures__|\.(?:test|spec)\.ts$)/.test(path))continue;
    walk(file,node=>{
      if(!ts.isCallExpression(node))return;
      const target=program.target(ts.isPropertyAccessExpression(node.expression)?node.expression.name:node.expression);
      if(!target || target.name?.getText()!=='defineElementAsType' || !factories.has(location(target).path))return;
      const source=location(node),value=evaluate(node.arguments[0]);
      const fail=reason=>unresolved.push({source,reason});
      if(node.arguments.length!==1 || value.kind!=='object') {fail('unsupported-registration-shape');return;}
      const reference=value.fields.get('elementRule')?.value.reference;
      const item=reference && entries.find(entry=>entry.path===reference.path && entry.symbol===reference.symbol);
      const type=value.fields.get('propertyType')?.value;
      if(!item || type?.kind!=='scalar' || typeof type.value!=='string') {
        fail(!item?'unresolved-element-rule':'unresolved-property-type');return;
      }
      const issues=[...value.blockers],parameters={},callbacks={},blockers=[];
      if(!value.complete)blockers.push('incomplete-registration');
      if([...value.fields.keys()].some(key=>!allowed.has(key)))blockers.push('unsupported-registration-parameter');
      for(const [key,field] of value.fields) {
        if(key==='elementRule')continue;
        if(key==='toXML')callbacks[key]=serialize(field.value);
        else parameters[key]=serialize(field.value,issues);
      }
      if(issues.length)blockers.push('registration-expressions');
      let constantOutput;
      if(callbacks.toXML?.$unresolved?.kind==='expression') {
        try {constantOutput=specializeStaticCallback(callbacks.toXML,{},sources[source.path]);}
        catch { /* The original expression remains explicit and unresolved. */ }
      }
      registrations.push({source,type:type.value,item:{path:item.path,symbol:item.symbol},
        parameters,callbacks,...(constantOutput!==undefined?{constantOutput}:{}),issues,blockers});
    });
  }
  const edges=[];
  for(const owner of entries)for(const property of owner.properties??[]) {
    const matches=registrations.filter(registration=>registration.type===property.type);
    if(!matches.length)continue;
    const registration=matches[0],item=entries.find(entry=>entry.path===registration.item.path && entry.symbol===registration.item.symbol);
    const blockers=[...registration.blockers];
    if(matches.length!==1)blockers.push('ambiguous-registration');
    if(!item.shapeComplete)blockers.push('incomplete-element-rule');
    edges.push({owner:{path:owner.path,symbol:owner.symbol},property:property.name,type:property.type,
      item:registration.item,registration:registration.source,
      mapping:{xml:property.parameters.xml,xmlParents:property.parameters.xmlParents??[],yaml:property.parameters.yaml},
      status:blockers.length?'blocked':'linked-structure',blockers});
  }
  return {scope:'Structural singleton element links only; not executable declaration or object acceptance',registrations,unresolved,edges};
}
