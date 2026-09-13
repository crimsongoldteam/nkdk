import {dirname,basename} from 'node:path';

const identity = entry => `${entry.path}:${entry.symbol}`;

// Structural requirements only: a known shape is not executable or accepted.
export function familyRequirements(extraction, graph, selections) {
  const entries = new Map(extraction.entries.map(entry => [identity(entry),entry]));
  const families = selections.map(selection => {
    const visited = new Set(), selected = [], properties = [], collections = [], blockers = [];
    const visit = reference => {
      const key = identity(reference);
      if (visited.has(key)) return;
      visited.add(key);
      const entry = entries.get(key);
      if (!entry) { blockers.push({...reference,reason:'missing-source-entry'}); return; }
      selected.push({path:entry.path,symbol:entry.symbol,source:entry.source});
      if (!entry.shapeComplete) blockers.push({...reference,reason:'incomplete-item-rule'});
      const children = graph.edges.filter(edge => identity(edge.owner) === key);
      for (const property of entry.properties ?? []) {
        properties.push({owner:reference,...property,collection:children.some(edge=>edge.property===property.name)});
        if (property.status !== 'static-parameters')
          blockers.push({...reference,property:property.name,source:property.source,reason:'requires-expression-mapping'});
      }
      for (const edge of children) {
        collections.push(edge);
        for (const reason of edge.blockers) blockers.push({...reference,property:edge.property,reason});
        visit(edge.item);
      }
    };
    visit({path:selection.path,symbol:selection.symbol});
    const paths = new Set([...selected.map(e=>e.path),...properties.map(p=>p.source?.path)]);
    const ownerConnections = graph.edges.filter(edge=>identity(edge.item)===identity(selection));
    return {...selection,entries:selected,properties,collections,ownerConnections,
      ownerRequirements:ownerConnections.map(edge=>entries.get(identity(edge.owner))).filter(Boolean),
      commonTypes:[...new Set(properties.filter(p=>!p.collection).map(p=>p.type))].sort(),
      sourceHashes:(extraction.sourceHashes ?? []).filter(source=>paths.has(source.path)),blockers};
  });
  return {families,blockers:families.flatMap(family=>family.blockers.map(blocker=>({family:family.id,...blocker})))};
}

export function legacyCases(inventory, families, previous={cases:[],staleCases:[]}) {
  const cases=[];
  for(const file of inventory.files.filter(file=>file.tests.length)) {
    const consumers=families.filter(family=>[family.path,...family.properties.map(p=>p.source?.path)].filter(Boolean).some(source=>{
      const directory=dirname(source);
      const related=path=>path?.startsWith(`${directory}/`) &&
        (basename(directory)!=='commonObjects' || basename(path).startsWith(basename(source,'.ts')+'.'));
      return related(file.path) || file.imports?.some(item=>related(item.resolved));
    }));
    if(!consumers.length)continue;
    for(const scenario of file.tests) {
      const id=`${file.path}:${scenario.source.line}:${scenario.source.column}`;
      const old=previous.cases.find(item=>item.id===id && item.sha256===file.sha256);
      cases.push({id,path:file.path,sha256:file.sha256,families:consumers.map(f=>f.id),
        title:scenario.title,source:scenario.source,tableRows:scenario.tableRows,
        extraction:scenario.extraction,
        assertions:scenario.assertions?.map(({matcher,source,literal})=>({matcher,source,literal})),
        newChecks:old?.newChecks??[],status:old?.status??'review-required'});
    }
  }
  return {version:1,cases,staleCases:[...(previous.staleCases??[]),
    ...previous.cases.filter(old=>!cases.some(current=>current.id===old.id&&current.sha256===old.sha256))]};
}
