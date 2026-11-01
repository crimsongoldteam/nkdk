import {readFileSync} from 'node:fs';
import {ts,unwrap} from './syntax.mjs';
import {specializeStaticCallback} from './static-callback.mjs';

// Read the actual registration, independently of the fixture directory table.
// Walking backwards means a later unknown spread cannot silently override it.
export function sourceOwnerPlacement(source,text=readFileSync(source.path,'utf8')) {
 const fail=()=>{throw new Error(`Unsupported owner placement: ${source.symbol}`);};
 const file=ts.createSourceFile(source.path,text,ts.ScriptTarget.Latest,true);
 const declarations=file.statements.filter(ts.isVariableStatement)
  .flatMap(statement=>[...statement.declarationList.declarations])
  .filter(declaration=>declaration.name.getText(file)===source.symbol);
 const object=declarations.length===1 && unwrap(declarations[0].initializer);
 if(!object || !ts.isObjectLiteralExpression(object))fail();
 const wanted=new Map([['xmlDir','xmlDir'],['itemTypePrefix','yamlDir']]),result={};
 for(const property of [...object.properties].reverse()) {
  if(!wanted.size)break;
  if(ts.isSpreadAssignment(property) || (property.name && ts.isComputedPropertyName(property.name)))fail();
  const name=property.name?.text;
  if(!wanted.has(name))continue;
  const value=ts.isPropertyAssignment(property) && unwrap(property.initializer);
  if(!value || !ts.isStringLiteralLike(value) || !value.text ||
    ['.','..','.nkdk'].includes(value.text) || /[\\/\0]/.test(value.text))fail();
  result[wanted.get(name)]=value.text;
  wanted.delete(name);
 }
 if(wanted.size)fail();
 return result;
}

export function sourceOwnerXmlRoute(source) {
 const roots=source?.properties?.filter(property=>property.parameters?.type==='XMLRoot')??[];
 const root=roots[0];
 const child=roots.length===0 && /^Metadata[A-Z][A-Za-z]+$/.test(source?.itemType??'') &&
   source.properties.some(property=>property.name==='uuid');
 if(roots.length>1 || (!root && !child) ||
    (root && (root.status!=='static-parameters' ||
      !/^[A-Za-z][A-Za-z0-9]*$/.test(root.parameters?.container??'') ||
      root.parameters.rootAttributes?._xmlns!=='http://v8.1c.ru/8.3/MDClasses')))
   throw new Error(`Unsupported owner root: ${source?.symbol??'unknown'}`);
 return root?['md:MetaDataObject',`md:${root.parameters.container}`]:
   [`md:${source.itemType.slice('Metadata'.length)}`];
}

export function rootSource(catalog,id,kind) {
  const result=structuredClone(catalog.get('migration.document-root-source'));
  result.id=id;
  for(const field of result.representations.xml.fields)
    field.path=field.path.map(segment=>segment==='md:Document'?`md:${kind}`:segment);
  const presence=result.presence.find(item=>item.target.field==='kind');
  presence.xml.missing.denotes.literal=kind;
  presence.yaml.default.literal=kind;
  return result;
}

export function rootSourceFromRule(catalog,id,source) {
 const route=sourceOwnerXmlRoute(source);
 if(route.length!==2)throw new Error(`Unsupported owner root: ${source?.symbol??'unknown'}`);
 return rootSource(catalog,id,route[1].slice(3));
}

function rootRule(source) {
 const roots=source?.properties?.filter(property=>property.parameters?.type==='XMLRoot')??[];
 if(roots.length!==1)throw new Error(`Unsupported owner root: ${source?.symbol??'unknown'}`);
 return roots[0];
}

function rootValues(source,constantContext) {
 const root=rootRule(source),raw=root.parameters.rootAttributes;
 if(root.status!=='static-parameters' && (constantContext===undefined || !raw?.$unresolved))
  throw new Error(`Unsupported root attributes: ${source?.symbol??'unknown'}`);
 return root.status!=='static-parameters' ? specializeStaticCallback(raw,constantContext) : raw;
}

function literalAttributes(source,attributes) {
 const fail=()=>{throw new Error(`Unsupported root attributes: ${source?.symbol??'unknown'}`);};
 if(!attributes || typeof attributes!=='object' || Array.isArray(attributes))fail();
 const result=[];
 const namePattern=/^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/;
 for(const [key,text] of Object.entries(attributes)) {
  if(typeof text!=='string' || !key.startsWith('_') || !namePattern.test(key.slice(1)))fail();
  if(key==='_xmlns' || key.startsWith('_xmlns:'))continue;
  const name=key.slice(1),prefix=name.includes(':')?name.split(':')[0]:null;
  if(prefix && prefix!=='xml' && typeof attributes['_xmlns:'+prefix]!=='string')fail();
  result.push({name,value:{text}});
 }
 return result;
}

// Literal attributes belong to declarations, never an owner-specific runtime branch.
export function sourceRootAttributes(source,constantContext) {
 return literalAttributes(source,rootValues(source,constantContext));
}

export function sourceRootEnvelope(source,constantContext) {
 const root=rootRule(source).parameters,values=rootValues(source,constantContext);
 const attributes=literalAttributes(source,values);
 const fail=()=>{throw new Error(`Unsupported owner root: ${source?.symbol??'unknown'}`);};
 if(!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(root.container??'') ||
  ![undefined,false,true].includes(root.isFileRoot) || !values._xmlns)fail();
 const namespaces={md:values._xmlns};
 for(const [name,value] of Object.entries(values))if(name.startsWith('_xmlns:')) {
  const prefix=name.slice('_xmlns:'.length);
  if(prefix==='md' && value!==namespaces.md)fail();
  namespaces[prefix]=value;
 }
 return {path:root.isFileRoot?[`md:${root.container}`]:['md:MetaDataObject',`md:${root.container}`],namespaces,attributes};
}
