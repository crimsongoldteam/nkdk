import {ts,unwrap} from './syntax.mjs';
import {checkedCallback} from './static-callback.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';

const profiles = new Map([
  ['packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts:28\0' +
    '82f0ba845c796e0c90cb85c0e7f3f093940cd652fe31c2a2fe4e5b217eec592c', {
    parameter: 'defaultValue', kind: 'i8n-owner-name-default', requireSourceMatch: true, sharedSource: true,
    xmlMissing: {sequence: [{record: {language: {input: 'defaultLanguage'}, content: {literal: ''}}}]},
  }],
  ['packages/rules/metadata/commonObjects/predefinedItem/rules.ts:60\0' +
    '6190268cbe0338c5699f74deb1e270c5dcb13ee93aa52641fd19cade1ade3f6f', {
    parameter: 'toXML', kind: 'xml-when-input-equals', input: 'ownerItemType', value: 'MetadataChartOfCharacteristicTypes',
  }],
  ['packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts:24\0' +
    'a2319c0402f326a1a0e255e2042d7bb13e785acd1f14a4041823fe498882dfb2', {
    parameter: 'toXML', kind: 'xml-when-input-equals', input: 'ownerKind', value: 'ПолеНабораДанныхСхемыКомпоновкиДанных',
    sourceField: 'kind', sourceType: 'DataCompositionSchemaDataSetFieldKind',
  }],
  ['packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts:66\0' +
    'a2319c0402f326a1a0e255e2042d7bb13e785acd1f14a4041823fe498882dfb2', {
    parameter: 'toXML', kind: 'xml-when-input-equals', input: 'ownerKind',
    value: 'ПолеНабораДанныхСхемыКомпоновкиДанных',
    values: ['ПолеНабораДанныхСхемыКомпоновкиДанных', 'ВложенныйНаборДанныхСхемыКомпоновкиДанных'],
    sourceField: 'kind', sourceType: 'DataCompositionSchemaDataSetFieldKind',
  }],
  ['packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts:76\0' +
    'a2319c0402f326a1a0e255e2042d7bb13e785acd1f14a4041823fe498882dfb2', {
    parameter: 'toXML', kind: 'xml-when-input-equals', input: 'ownerKind',
    value: 'ПолеНабораДанныхСхемыКомпоновкиДанных',
    values: ['ПолеНабораДанныхСхемыКомпоновкиДанных', 'ПапкаПолейНабораДанныхСхемыКомпоновкиДанных'],
    sourceField: 'kind', sourceType: 'DataCompositionSchemaDataSetFieldKind',
  }],
  ['packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts:14\0' +
    'c7cdaa9f54260d7085e3d7f493acaa2bb932a0f326b3b254ae971637bd7c610d', {
    parameter: 'toXML', kind: 'xml-when-property-present',
  }],
  ['packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts:15\0' +
    '8a3b6a881dee4a5e193dc02934e637a8ed703cf0231b94fe4dbe97530bfe6cda', {
    parameter: 'toXML', kind: 'xml-when-property-present',
  }],
  ['packages/rules/metadata/forms/commonObjects/formAttribute/valueListSettings.ts:19\0' +
    '21f68d1f13518895e2565205ec92797eee022f06b2a6c0b5a147f53435a2b81f', {
    parameter: 'defaultValue', kind: 'yaml-default-when-input-equals', input: 'ownerType', value: 'СписокЗначений',
  }],
  ['packages/rules/metadata/commonObjects/metadataAttribute/fragments.ts:23\0' +
    '574e33c1d66458f04ae34d1f3fc5d0411b61a94592f07cbe534c6a13e932019d', {
    parameter: 'defaultValue', kind: 'i8n-owner-name-default',
  }],
  ['packages/rules/metadata/commonObjects/standardAttributeDescription/rules.ts:51\0' +
    'a4707c4dd60c17cc173ac20c3cbc5555aaaefca303aa365478465d0f56bf13ac', {
    parameter: 'defaultValue', kind: 'value-declaration', id: 'common.standard-attribute-name',
  }],
  ['packages/rules/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts:102\0' +
    '67fe8743cf1b4595acf5afc9e923e889a53a2283eb81395a14c817f74b3a0943', {
    parameter: 'toXML', kind: 'xml-explicit-in-adopted',
  }],
  ['packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/rules.ts:12\0' +
    '8053564900ebc8409df900bbb3de99a15965728671e3a5ac4504cfc9d62a37e2', {
    parameter: 'toXML', kind: 'xml-when-property-present',
  }],
]);

// Reviewed legacy predicates are migration data. The emitted Rust only sees
// ordinary presence/equality expressions, never helper or metadata names.
for(const [line,property] of [[342,'hierarchical'],[353,'hierarchyType']]) {
  profiles.set('packages/rules/metadata/appliedObjects/metadataCatalog/rules.ts:'+line+'\0'+
    '9d01185aa57872cb2594d931406ae19217d43f1aa901ab0090e892faa8cfe7dd',{
      parameter:'toXML',kind:'xml-dependent-adopted-default',property,
      helper:'exportCatalogHierarchyDefault',conditions:[{field:'codeType',yamlEquals:'Строка'}],
    });
}

/**
 * Converts reviewed TypeScript callbacks into data-only declaration profiles.
 * A source-file hash makes every semantic source change return to the blocked list.
 */
export function reviewedPropertyExpression(parameter, unresolved) {
  const issue=unresolved?.$unresolved;
  if(issue?.kind!=='expression' || typeof issue.source?.path!=='string' || typeof issue.sourceHash!=='string')return undefined;
  if(parameter==='defaultValue' && typeof issue.expression==='string') {
    const source=ts.createSourceFile('default-value.ts',`(${issue.expression})`,ts.ScriptTarget.Latest,true);
    const expression=unwrap(source.statements[0]?.expression);
    if(!source.parseDiagnostics.length && ts.isArrowFunction(expression) &&
      expression.parameters.length===1 && !expression.parameters[0].initializer &&
      ts.isObjectBindingPattern(expression.parameters[0].name) &&
      expression.parameters[0].name.elements.length===1) {
      const binding=expression.parameters[0].name.elements[0];
      if(!binding.dotDotDotToken && !binding.propertyName && !binding.initializer &&
        ts.isIdentifier(binding.name) && binding.name.text==='name' &&
        ts.isIdentifier(expression.body) && expression.body.text==='name')
        return {parameter,kind:'owner-name-default'};
    }
  }
  if(parameter==='toXML') {
    try {
      const {expression}=checkedCallback(unresolved);
      const call=unwrap(expression.body);
      if(ts.isArrowFunction(expression) && expression.parameters.length===1 &&
         ts.isIdentifier(expression.parameters[0].name) && !expression.parameters[0].initializer &&
         !expression.parameters[0].dotDotDotToken && !expression.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.AsyncKeyword) &&
         ts.isCallExpression(call) &&
         ts.isPropertyAccessExpression(call.expression) && ts.isIdentifier(call.expression.expression) &&
         call.expression.expression.text===expression.parameters[0].name.text && call.expression.name.text==='has' &&
         call.arguments.length===1 && ts.isStringLiteral(call.arguments[0]))
        return {parameter,kind:'xml-when-property-present',property:call.arguments[0].text};
    } catch { /* Unchecked callbacks remain blocked. */ }
    const dependent=dependentAdoptedDefault(unresolved);
    if(dependent)return dependent;
  }
  const profile=profiles.get(`${issue.source.path}:${issue.source.line}\0${issue.sourceHash}`);
  if(profile?.parameter!==parameter)return undefined;
  if(profile.requireSourceMatch) {
    try {checkedCallback(unresolved);} catch {return undefined;}
  }
  if(profile.conditions) {
    try {
      const {expression}=checkedCallback(unresolved);
      const call=unwrap(expression.body);
      if(!ts.isArrowFunction(expression)||expression.parameters.length!==2||
        expression.parameters.some(p=>!ts.isIdentifier(p.name))||
        !ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||call.expression.text!==profile.helper||
        call.arguments.length!==3||!ts.isStringLiteral(call.arguments[2])||
        call.arguments[2].text!==profile.property||call.arguments.slice(0,2).some((arg,index)=>
          !ts.isIdentifier(arg)||arg.text!==expression.parameters[index].name.text))return undefined;
    } catch {return undefined;}
  }
  return profile;
}


// Recognize a reviewed helper invocation, never execute the source callback.
// The callback, imported helper identity and helper body must all remain checked.
function dependentAdoptedDefault(unresolved) {
  try {
    const {source,expression}=checkedCallback(unresolved);
    if(!ts.isArrowFunction(expression) || expression.parameters.length!==2 ||
      expression.parameters.some(p=>!ts.isIdentifier(p.name)||p.initializer||p.dotDotDotToken))return;
    const call=unwrap(expression.body);
    if(!ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||call.arguments.length!==4)return;
    const [value,context,key,dependencies]=call.arguments;
    if(!ts.isIdentifier(value)||value.text!==expression.parameters[0].name.text||
      !ts.isIdentifier(context)||context.text!==expression.parameters[1].name.text||
      !ts.isStringLiteral(key)||!ts.isArrayLiteralExpression(dependencies)||
      !dependencies.elements.length||dependencies.elements.some(e=>!ts.isStringLiteral(e)))return;
    const expected=resolve('packages/rules/metadata/ruleRuntime/property/xmlDefaultVariant.ts');
    const imported=source.statements.some(statement=>ts.isImportDeclaration(statement)&&
      ts.isStringLiteral(statement.moduleSpecifier)&&
      resolve(dirname(source.fileName),statement.moduleSpecifier.text+'.ts')===expected&&
      statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings)&&
      statement.importClause.namedBindings.elements.some(binding=>binding.name.text===call.expression.text&&
        (binding.propertyName??binding.name).text==='exportDependentAdoptedDefault'&&!binding.isTypeOnly));
    if(!imported||createHash('sha256').update(readFileSync(expected)).digest('hex')!==
      '64ad99800d4cf8f19c0b07efa5de7291ab5342275bfe3c184d35876e1a608bd2')return;
    const names=dependencies.elements.map(e=>e.text);
    if(new Set(names).size!==names.length||names.includes(key.text))return;
    return {parameter:'toXML',kind:'xml-dependent-adopted-default',property:key.text,dependencies:names};
  } catch {return undefined;}
}
