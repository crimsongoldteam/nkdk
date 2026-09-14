import {pathTemplate} from './path-template.mjs';
import {isDeepStrictEqual} from 'node:util';
import {commonInputs} from './common-inputs.mjs';
import {internalInfoAttachment} from './internal-info-attachment.mjs';

export function readyAttachment(property,catalog,profiles,owner) {
  if(property.parameters?.type==='InternalInfo' && owner) {
    const generated=internalInfoAttachment(owner);
    if(generated.status!=='candidate')return generated;
    if(!catalog.has('common.internal-generated-types'))return {status:'blocked',reason:'missing-declaration:common.internal-generated-types'};
    const {module}=generated,{inputs,imports,bind}=commonInputs(module);
    return {status:'ready',fragment:module.id,modules:[module],inputs,imports:{...imports,ready:module.id},compose:{use:'ready',bind}};
  }
  const choices=profiles.filter(profile=>profile.type===property.parameters?.type);
  if(!choices.length)return undefined;
  let parameters=property.parameters;
  const expression=parameters.xmlPath?.$unresolved?.expression;
  const template=pathTemplate(expression);
  if(property.status!=='static-parameters' && !template)return {status:'blocked',reason:'requires-expression-mapping'};
  if(template)parameters={...parameters,xmlPath:{$pathTemplate:template}};
  const matches=choices.filter(profile=>isDeepStrictEqual(profile.parameters,parameters));
  if(matches.length>1)throw new Error('Ambiguous ready attachment profile');
  if(!matches.length)return {status:'blocked',reason:'unreviewed-attachment-parameters',differences:choices.map(profile=>Object.keys({...profile.parameters,...property.parameters}).filter(key=>!isDeepStrictEqual(profile.parameters[key],property.parameters[key])).sort())};
  const {fragment}=matches[0],module=catalog.get(fragment);
  if(!module)return {status:'blocked',reason:`missing-declaration:${fragment}`};
  const {inputs,imports,bind}=commonInputs(module);
  for(const [name,expression] of Object.entries(matches[0].bindings??{})) {
    if(!Object.hasOwn(inputs,name))throw new Error(`Unknown fixed fragment input: ${name}`);
    bind[name]=structuredClone(expression);delete inputs[name];
  }
  const placement=matches[0].sourceRoot;
  if(placement && (!template || !isDeepStrictEqual(template.slice(0,1),placement) || template.slice(1).join('/')!==parameters.filePath))return {status:'blocked',reason:'source-root-contract-mismatch'};
  return {status:'ready',...(placement?{sourceRoot:placement,xmlSourcePath:template}:{}),fragment,inputs,imports:{...imports,ready:fragment},compose:{use:'ready',...(Object.keys(bind).length?{bind}:{})}};
}
