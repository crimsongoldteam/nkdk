// Identifier publication preserves local aliases and all semantic expressions.
export function renameDeclarationModules(modules,rename) {
  return modules.map(module=>({...module,id:rename(module.id),
    imports:Object.fromEntries(Object.entries(module.imports??{}).map(([name,id])=>[name,rename(id)]))}));
}

// A checked published declaration supplies the body; callers retain placement.
export function referenceDeclarationModule(modules,previous,published) {
  if(!modules.some(module=>module.id===previous && module.kind==='value') || previous===published)
    throw new Error('Missing replaceable library declaration');
  return renameDeclarationModules(modules.filter(module=>module.id!==previous),id=>id===previous?published:id);
}
