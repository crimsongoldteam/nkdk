import {resolve} from 'node:path';
// Explicit package boundaries, not a baseline inferred from existing dependencies.
const allowed={
 'nkdk-decimal':{},
 'nkdk-rule-model':{},
 'nkdk-conversion-core':{normal:['nkdk-decimal']},
 'nkdk-rule-compiler':{normal:['nkdk-rule-model','nkdk-conversion-core','nkdk-decimal']},
 'nkdk-compiled-rules':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk':{normal:['nkdk-compiled-rules','nkdk-conversion-core']},
 'nkdk-dev':{normal:['nkdk-compiled-rules','nkdk-conversion-core','nkdk-rule-compiler']},
};
export function violations(metadata){
 const members=new Set(metadata.workspace_members);
 const packages=metadata.packages.filter(pkg=>members.has(pkg.id));
 const names=new Set(packages.map(pkg=>pkg.name));
 const errors=[];
 for(const pkg of packages){
  if(!Object.hasOwn(allowed,pkg.name)){errors.push(`Unknown workspace package: ${pkg.name}`);continue;}
  for(const dep of pkg.dependencies){
   // All targets, optional dependencies and aliases retain their actual package name.
   if(!names.has(dep.name) && !dep.path)continue;
   const kind=dep.kind??'normal';
   // Existing third-party parser with a documented Unicode-tag compatibility
   // patch. This is not a general exemption for path dependencies.
   if(dep.name==='yaml-rust2' && kind==='normal' &&
      ['nkdk-conversion-core','nkdk-rule-compiler'].includes(pkg.name) &&
      typeof metadata.workspace_root==='string' &&
      dep.path===resolve(metadata.workspace_root,'../third-party/yaml-rust2'))continue;

   if(!names.has(dep.name) || !allowed[pkg.name][kind]?.includes(dep.name))errors.push(`Forbidden ${kind} dependency: ${pkg.name} -> ${dep.name}`);
  }
 }
 return errors;
}
