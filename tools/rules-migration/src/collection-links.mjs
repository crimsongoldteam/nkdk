import {sourceProgram} from './source-program.mjs';
import {evaluator,serialize} from './static-value.mjs';
import {ts,unwrap,location} from './syntax.mjs';

const factoryPath='packages/rules/metadata/ruleRuntime/metadataCollection/ruleFactory.ts';

// Read registrations as syntax; importing or executing metadata modules is unnecessary.
export function collectionLinks(sources,entries) {
  const program=sourceProgram(sources), evaluate=evaluator(program), registrations=[], itemRegistrations=[], unresolved=[];
  function visit(node,env=new Map()) {
    if(ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text==='map') {
      const callback=unwrap(node.arguments[0]), values=evaluate(node.expression.expression,env);
      if(callback && ts.isArrowFunction(callback) && callback.parameters.length===1 && values.kind==='array') {
        for(const value of values.values) {
          const local=new Map(env);local.set(callback.parameters[0],value);
          if(ts.isBlock(callback.body)) {
            for(const statement of callback.body.statements) {
              if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations)
                local.set(declaration,evaluate(declaration.initializer,local));
              else visit(statement,local);
            }
          } else visit(callback.body,local);
        }
        return;
      }
    }
    if(ts.isCallExpression(node)) {
      const target=program.target(ts.isPropertyAccessExpression(node.expression)?node.expression.name:node.expression);
      if(target && /packages\/(?:rules|runtime)\/metadata\/ruleRuntime\/metadataItem\/ruleFactory\.ts$/.test(location(target).path) && target.name?.getText()==='defineMetadataItemRule') {
        const object=unwrap(node.arguments[0]);
        if(object && ts.isObjectLiteralExpression(object)) {
          const fields=new Map(object.properties.filter(ts.isPropertyAssignment).map(property=>[property.name.getText(),property.initializer]));
          const type=fields.has('propertyType')?serialize(evaluate(fields.get('propertyType'),env),[]):undefined;
          const reference=fields.has('itemRule')?program.target(unwrap(fields.get('itemRule'))):undefined;
          if(typeof type==='string' && reference)itemRegistrations.push({type,item:location(reference).path,symbol:reference.name?.getText()});
        }
      }
      if(target && location(target).path===factoryPath && target.name?.getText()==='defineMetadataItemCollectionRule') {
        const object=unwrap(node.arguments[0]);
        const fail=reason=>unresolved.push({source:location(node),reason});
        if(!object || !ts.isObjectLiteralExpression(object) || object.properties.some(p=>!ts.isPropertyAssignment(p)&&!ts.isShorthandPropertyAssignment(p))) {fail('unsupported-registration-shape');return;}
        const fields=new Map(object.properties.map(p=>[p.name.text,p]));
        const item=fields.get('itemRule');
        const reference=item && (ts.isShorthandPropertyAssignment(item)?program.checker.getShorthandAssignmentValueSymbol(item)?.valueDeclaration:program.target(unwrap(item.initializer)));
        const itemEntry=reference && entries.find(e=>e.path===location(reference).path && e.symbol===reference.name?.getText());
        const issues=[],parameters={};
        for(const [key,property] of fields)if(key!=='itemRule') {
          const declaration=ts.isShorthandPropertyAssignment(property)?program.checker.getShorthandAssignmentValueSymbol(property)?.valueDeclaration:undefined;
          const value=declaration ? env.get(declaration)??evaluate(declaration.initializer,env) : evaluate(property.initializer,env);
          parameters[key]=serialize(value,issues);
        }
        if(typeof parameters.propertyType!=='string' || !itemEntry) {fail(!itemEntry?'unresolved-item-rule':'unresolved-property-type');return;}
        registrations.push({source:location(node),type:parameters.propertyType,item:{path:itemEntry.path,symbol:itemEntry.symbol},parameters,issues});
        return;
      }
    }
    ts.forEachChild(node,child=>visit(child,env));
  }
  for(const [path,file] of program.parsed)if(path.startsWith('/packages/rules/metadata/') && !/\.(test|integration\.test)\.ts$/.test(path) && !path.includes('/__fixtures__/'))visit(file);
  const ownerValues=new Map();
  for(const entry of entries) {
    const file=program.parsed.get('/'+entry.path);
    const declaration=file?.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]).find(d=>d.name.getText()===entry.symbol);
    if(declaration?.initializer)ownerValues.set(entry,evaluate(declaration.initializer));
  }
  const routesByType=new Map();
  for(const entry of entries)for(const property of entry.properties??[]) {
    const parameters=property.parameters;
    if(typeof parameters.xml!=='string' || !Array.isArray(parameters.xmlParents??[]) ||
      !(parameters.xmlParents??[]).every(part=>typeof part==='string'))continue;
    const routes=routesByType.get(property.type)??new Map();
    const route=[...(parameters.xmlParents??[]),parameters.xml];
    routes.set(JSON.stringify(route),route);
    routesByType.set(property.type,routes);
  }
  const mountsByRule=new Map();
  for(const registration of itemRegistrations) {
    const key=`${registration.item}#${registration.symbol}`;
    const mounts=mountsByRule.get(key)??new Map();
    for(const [route,path] of routesByType.get(registration.type)??[])mounts.set(route,path);
    mountsByRule.set(key,mounts);
  }
  const edges=[];
  for(const owner of entries)for(const property of owner.properties??[]) {
    const matches=registrations.filter(r=>r.type===property.type);
    if(!matches.length)continue;
    const registration=matches[0];
    let selected=registration.item;
    const reference=ownerValues.get(owner)?.fields?.get('properties')?.value.fields?.get(property.name)?.value.fields?.get('itemRule')?.value.reference;
    const overridden=property.parameters.itemRule!==undefined;
    const resolved=reference && entries.some(e=>e.path===reference.path&&e.symbol===reference.symbol);
    if(overridden && resolved)selected=reference;
    const item=entries.find(e=>e.path===selected.path&&e.symbol===selected.symbol);
    const blockers=[];
    if(matches.length!==1)blockers.push('ambiguous-registration');
    if(registration.issues.length)blockers.push('registration-expressions');
    if(overridden && !resolved)blockers.push('unresolved-property-item-rule-override');
    if(!item.shapeComplete)blockers.push('incomplete-item-rule');
    const mounts=mountsByRule.get(`${owner.path}#${owner.symbol}`);
    edges.push({owner:{path:owner.path,symbol:owner.symbol},property:property.name,type:property.type,
      item:selected,registration:registration.source,
      mapping:{xml:property.parameters.xml??registration.parameters.xmlElement,xmlParents:property.parameters.xmlParents??[],yaml:property.parameters.yaml,
        keyField:registration.parameters.keyField??null,yamlAsArray:registration.parameters.yamlAsArray??false,
        ...(!(property.parameters.xmlParents??[]).length && mounts?.size===1?{ownerXmlRoot:[...mounts.values()][0]}:{})},
      context:{ownerFactRole:property.parameters.ownerFactRole??null,configurationIndexUidSegment:property.parameters.configurationIndexUidSegment??null},
      status:blockers.length?'blocked':'linked-structure',blockers});
  }
  return {scope:'Structural collection links only; not executable declaration or object acceptance',registrations,unresolved,edges};
}
