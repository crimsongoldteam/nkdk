export function fileResourceCases(extraction,entries) {
  const cases=[];
  for(const owner of extraction.entries)for(const property of owner.properties) {
    if(!['ExternalFile','Module'].includes(property.type))continue;
    const row=entries.find(row=>row.path===owner.path && row.symbol===owner.symbol && row.property===property.name);
    if(row?.status!=='ready')continue;
    const routes=[{xml:property.parameters.xmlPath.split('/'),yaml:property.parameters.nkdkPath.split('/')}];
    if(property.type==='Module') {
      if(!property.parameters.xmlPath.endsWith('.bsl') || !property.parameters.nkdkPath.endsWith('.bsl'))throw new Error('Unreviewed module extension');
      routes.push({xml:property.parameters.xmlPath.slice(0,-4).concat('.bin').split('/'),yaml:property.parameters.nkdkPath.slice(0,-4).concat('.bin').split('/')});
    }
    cases.push({id:`${property.type==='Module'?'module':'external-file'}-${owner.symbol}-${property.name}`,entry:row.candidate,
      xml:'<Probe><Name>example</Name></Probe>',yaml:'Проверка: example',
      resources:routes,resourceGroups:[routes.length],
      source:property.source,scope:'Resource path from original rule; byte preservation checked by Rust resource integration'});
  }
  return cases;
}
