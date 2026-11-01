import {readFileSync} from 'node:fs';
import {ts} from './syntax.mjs';
import {emitCandidates} from './emit.mjs';

// Build-time library projection. Placement and unselected owner properties
// belong to the caller; no TypeScript callback runs in the resulting converter.
export function sourceProjection(owner,catalog,{properties,id,namespaces,root,defaultXmlNamespace,collectionValues,deferOwnerContributions}) {
  if(!owner || !(root?id?.startsWith('working.'):id?.startsWith('common.')) || !Array.isArray(properties) ||
     !properties.length || new Set(properties).size!==properties.length)
    throw new Error('Invalid source projection selection');
  if(defaultXmlNamespace && typeof namespaces?.[defaultXmlNamespace]!=='string')throw new Error('Missing default XML namespace');
  let selected=owner.properties.filter(row=>properties.includes(row.name));
  if(selected.length!==properties.length)throw new Error('Unknown source projection property');
  const ownsXmlType=selected.some(({parameters:p})=>typeof p.xml==='string' &&
    /^_[^:]+:type$/.test(p.xml) && namespaces?.[p.xml.slice(1,-5)]==='http://www.w3.org/2001/XMLSchema-instance' &&
    !(p.xmlParents?.length));
  if(root) {
    if(typeof root!=='string' || !/^(?:[A-Za-z][A-Za-z0-9]*:)?[A-Za-z][A-Za-z0-9]*$/.test(root))throw new Error('Invalid projection root');
    selected=selected.map(row=>({...row,parameters:{...row.parameters,xmlParents:[root,...(row.parameters.xmlParents??[])]}}));
  }
  const existingIds=new Set(catalog.keys());
  const localCatalog=new Map(catalog);
  const result=emitCandidates([{...owner,properties:selected}],localCatalog,undefined,namespaces,{}, {collectionValues,deferOwnerContributions});
  const entry=result.entries[0];
  if(entry.ownerBlockers.length || entry.properties.some(row=>row.status!=='candidate') ||
     entry.projections.length!==1 || entry.projections[0].root!==(root??null))
    throw new Error('Source projection needs one complete relative owner boundary');
  const projection=result.modules.find(module=>module.id===entry.projections[0].id);
  const value={...projection,kind:root?'object':'value',id,
    // Reuse the language's independent ordering; keep hashed fragments intact.
    yamlOrder:selected.map(property=>property.name),
    description:`Проекция ${owner.symbol}: ${properties.join(', ')}; остальные свойства владельца не включены`};
  if(root) {
    const xmlType=ownsXmlType?undefined:ownerXmlType(owner);
    if(xmlType) {
      const parts=xmlType.split(':');
      const prefix=parts.length===2?parts[0]:defaultXmlNamespace;
      if(parts.length>2 || parts.some(part=>!/^[_\p{L}][_\p{L}\p{N}.\-]*$/u.test(part)) ||
         (prefix && !namespaces?.[prefix]) || namespaces?.xsi!=='http://www.w3.org/2001/XMLSchema-instance')
        throw new Error('Owning XML type needs its namespace declarations');
      const qname=parts.length===1 && prefix?prefix+':'+xmlType:xmlType;
      value.namespaces={...value.namespaces,...(prefix?{[prefix]:namespaces[prefix]}:{}),xsi:namespaces.xsi};
      value.representations={...value.representations,xml:{kind:'with-attributes',
        attributes:[{name:'xsi:type',value:{qname}}],content:value.representations.xml}};
    }
  }
  const providers={};
  for(const [name,input] of Object.entries(value.inputs??{})) {
    if(input.index){providers[name]=input.index;if(!root)delete input.index;}
  }
  const derived=[...localCatalog.values()].filter(module=>!existingIds.has(module.id));
  // A value-only proof explicitly defers project addressing. Keep every
  // source requirement, including prepared common profiles that consume it
  // as a parameter equivalence rather than a registered collection.
  const ownerRequirements=structuredClone(entry.ownerRequirements??[]);
  if(deferOwnerContributions===true)for(const property of selected) {
    const addressing=property.parameters.configurationIndexAddressing;
    if(addressing!==undefined && !ownerRequirements.some(row=>row.property===property.name))
      ownerRequirements.push({property:property.name,indexAddressing:addressing});
  }
  let modules=result.modules.filter(module=>module!==projection).map(module=>({...module,
    inputs:unpreparedInputs(module.inputs)})).concat(value);
  if(defaultXmlNamespace)modules=modules.map(module=>({...module,
    namespaces:{...module.namespaces,[defaultXmlNamespace]:namespaces[defaultXmlNamespace]},
    representations:{...module.representations,xml:mapXmlPaths(module.representations.xml,
      path=>path.map(name=>name.includes(':')?name:defaultXmlNamespace+':'+name))}}));
  return {modules:[...derived,...modules],value:modules.find(module=>module.id===id),providers,...(ownerRequirements.length?{ownerRequirements}:{})};
}

// Owner attributes belong to the source declaration, not to a named family.
function ownerXmlType(owner) {
  const file=ts.createSourceFile(owner.path,readFileSync(owner.path,'utf8'),ts.ScriptTarget.Latest,true);
  let type;
  for(const statement of file.statements) {
    if(!ts.isVariableStatement(statement))continue;
    for(const declaration of statement.declarationList.declarations) {
      if(!ts.isIdentifier(declaration.name) || declaration.name.text!==owner.symbol)continue;
      let value=declaration.initializer;
      while(value && (ts.isAsExpression(value) || ts.isSatisfiesExpression(value) || ts.isParenthesizedExpression(value)))value=value.expression;
      if(!value || !ts.isObjectLiteralExpression(value))throw new Error('Nonliteral source owner');
      const property=value.properties.find(row=>ts.isPropertyAssignment(row) && row.name.getText(file)==='xsiType');
      if(property) {
        if(!ts.isStringLiteral(property.initializer))throw new Error('Nonliteral owning XML type');
        type=property.initializer.text;
      }
    }
  }
  return type;
}

// Compile the same source record as a library value. Only its synthetic
// placement is removed; semantic expressions and actual XML paths stay intact.
export function relativeSourceProjection(owner,catalog,{properties,id,namespaces,defaultXmlNamespace,collectionValues,deferOwnerContributions}) {
  if(!id?.startsWith('common.'))throw new Error('Relative source projection needs a common identifier');
  const placement='Projection';
  const result=sourceProjection(owner,catalog,{properties,id:'working.relative-source',root:placement,namespaces,
    defaultXmlNamespace,collectionValues,deferOwnerContributions});
  const qualifiedPlacement=defaultXmlNamespace?defaultXmlNamespace+':'+placement:placement;
  const modules=result.modules.map(module=>({...module,
    ...(module===result.value?{id,kind:'value'}:{}),
    inputs:unpreparedInputs(module.inputs),
    representations:{...module.representations,xml:mapXmlPaths(module.representations.xml,path=>path[0]===qualifiedPlacement?path.slice(1):path)}}));
  return {...result,modules,value:modules.find(module=>module.id===id)};
}

function unpreparedInputs(inputs) {
  return Object.fromEntries(Object.entries(inputs??{}).map(([name,input])=>{
    const {index,...declaration}=input;
    return [name,declaration];
  }));
}

function mapXmlPaths(value,map) {
  if(Array.isArray(value))return value.map(child=>mapXmlPaths(child,map));
  if(!value || typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,
    key==='path' && Array.isArray(child)?map(child):mapXmlPaths(child,map)]));
}
