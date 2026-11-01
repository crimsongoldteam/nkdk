import {pathTemplate} from './path-template.mjs';
import {conditionalPathTemplate} from './conditional-path-template.mjs';

function samplePath(path,inputs) {
  if(typeof path==='string')return path;
  const expression=path?.$unresolved?.expression;
  const conditional=conditionalPathTemplate(expression);
  const template=conditional ? (inputs[conditional.optionalInput] ? conditional.present : conditional.absent) : pathTemplate(expression);
  if(!template)throw new Error('Unreviewed resource path expression');
  const segment=part=>typeof part==='string' ? part : part.literal ?? (part.input ? inputs[part.input] : part.concat?.map(segment).join(''));
  return template.map(segment).join('/');
}

function sampleInputs(paths) {
  const names=new Set();
  const visit=part=>{
    if(typeof part!=='object' || part===null)return;
    if(part?.input)names.add(part.input);
    for(const child of part?.concat??[])visit(child);
  };
  for(const path of paths) {
    const expression=path?.$unresolved?.expression;
    const conditional=conditionalPathTemplate(expression);
    for(const part of conditional ? [...conditional.absent,...conditional.present] : pathTemplate(expression)??[])visit(part);
  }
  return Object.fromEntries([...names].map(name=>[name,'example']));
}

export function fileResourceCases(extraction,entries) {
  const cases=[];
  for(const owner of extraction.entries)for(const property of owner.properties) {
    if(!['ExternalFile','Module'].includes(property.type))continue;
    const row=entries.find(row=>row.path===owner.path && row.symbol===owner.symbol && row.property===property.name);
    if(row?.status!=='ready')continue;
    const conditional=conditionalPathTemplate(property.parameters.xmlPath?.$unresolved?.expression);
    for(const parentPresent of conditional?[true,false]:[false]) {
      const inputs=sampleInputs([property.parameters.xmlPath,property.parameters.nkdkPath]);
      if(conditional && !parentPresent)inputs[conditional.optionalInput]='';
      const xmlPath=samplePath(property.parameters.xmlPath,inputs),yamlPath=samplePath(property.parameters.nkdkPath,inputs);
      const routes=[{xml:xmlPath.split('/'),yaml:yamlPath.split('/')}];
      if(property.type==='Module') {
        if(!xmlPath.endsWith('.bsl') || !yamlPath.endsWith('.bsl'))throw new Error('Unreviewed module extension');
        routes.push({xml:xmlPath.slice(0,-4).concat('.bin').split('/'),yaml:yamlPath.slice(0,-4).concat('.bin').split('/')});
      }
      cases.push({id:`${property.type==='Module'?'module':'external-file'}-${owner.symbol}-${property.name}${conditional?(parentPresent?'-with-parent':'-without-parent'):''}`,entry:row.candidate,
        xml:'<Probe><Name>example</Name></Probe>',yaml:'Проверка: example',
        ...(Object.keys(inputs).length?{inputs}:{}),
        resources:routes,resourceGroups:[routes.length],
        source:property.source,scope:'Resource path from original rule; byte preservation checked by Rust resource integration'});
    }
  }
  return cases;
}
