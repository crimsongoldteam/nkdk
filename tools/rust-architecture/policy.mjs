import {resolve} from 'node:path';
// Explicit package boundaries, not a baseline inferred from existing dependencies.
const allowed={
 'nkdk-decimal':{},
 'nkdk-rule-model':{},
 'nkdk-conversion-core':{normal:['nkdk-decimal']},
 'nkdk-rule-compiler':{normal:['nkdk-rule-model','nkdk-conversion-core','nkdk-decimal']},
 'nkdk-compiled-rules':{normal:['nkdk-conversion-core','nkdk-compiled-rules-elements','nkdk-compiled-rules-elements-2','nkdk-compiled-rules-base','nkdk-compiled-rules-bodies','nkdk-compiled-rules-bodies-2','nkdk-compiled-rules-bodies-3','nkdk-compiled-rules-bodies-4','nkdk-compiled-rules-bodies-5','nkdk-compiled-rules-owners','nkdk-compiled-rules-owners-2','nkdk-compiled-rules-owners-3','nkdk-compiled-rules-members','nkdk-compiled-rules-members-2','nkdk-compiled-rules-inputs','nkdk-compiled-rules-inputs-2'],build:['nkdk-rule-compiler'],dev:['yaml-rust2']},
 'nkdk-compiled-rules-bodies':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-bodies-2':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-bodies-3':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-bodies-4':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-bodies-5':{normal:['nkdk-shared-catalog-bodies-5']},
 'nkdk-compiled-rules-elements':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-elements-2':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-base':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-members-2':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-members':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-inputs-2':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-inputs':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-owners':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-owners-2':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-owners-3':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-probes':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-font':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-picture':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk-compiled-rules-fields':{normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']},
 'nkdk':{normal:['nkdk-compiled-rules','nkdk-conversion-core'],dev:['nkdk-probe-resources']},
 'nkdk-dev':{normal:['nkdk-compiled-rules-probes','nkdk-conversion-core','nkdk-rule-compiler']},
};
const systemEnumShard={normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']};
const probeFamily={normal:['nkdk-conversion-core'],build:['nkdk-rule-compiler']};
const probePackages=new Set([
 'nkdk-probe-calendar-records','nkdk-probe-choice-list','nkdk-probe-command-collections','nkdk-probe-common-attribute-content','nkdk-probe-defined-type-owner','nkdk-probe-identity','nkdk-probe-journal-columns','nkdk-probe-mobile-device-command-bar-content',
 'nkdk-probe-enumeration-commands',
 'nkdk-probe-path-lexicons','nkdk-probe-qname','nkdk-probe-scalars',
 'nkdk-probe-sequences-fill','nkdk-probe-sequences-value-core',
 'nkdk-probe-sequences-value-variants','nkdk-probe-sequences-collections',
 'nkdk-probe-dcs-primitive-values',
    'nkdk-probe-sequences-dcs-parameters','nkdk-probe-dcs-lists','nkdk-probe-dcs-fields','nkdk-probe-dcs-parameter-values','nkdk-probe-dcs-parameter-values-field','nkdk-probe-dcs-parameter-values-design-time','nkdk-probe-dcs-parameter-values-collections','nkdk-probe-dcs-parameter-values-primitive','nkdk-probe-dcs-enumerations',
 'nkdk-probe-type-description','nkdk-probe-resources',
]);
const candidatePackages=new Set(['nkdk-candidate-standard-attributes','nkdk-candidate-document-attributes']);
function sharedPolicies(catalogues) {
 const policies=new Map();
 for(const {facadeName,layout} of catalogues) {
  if(layout.format!=='nkdk-aot-layout/1' || !Array.isArray(layout.packages) || !Array.isArray(layout.facadeDependencies))throw new Error('Invalid shared AOT layout');
  const packages=layout.packages.filter(pkg=>!pkg.facade);
  const names=new Set(packages.map(pkg=>pkg.package));
  if(names.size!==packages.length || !/^nkdk-shared-catalog-[a-z0-9-]+$/.test(facadeName))throw new Error('Invalid shared AOT layout names');
  for(const pkg of packages) {
   if(!/^nkdk-aot-[a-f0-9]{16}$/.test(pkg.package) || !Array.isArray(pkg.dependencies) || pkg.dependencies.some(name=>!names.has(name)))throw new Error('Invalid shared AOT layout dependency');
   if(policies.has(pkg.package))throw new Error('Duplicate shared AOT layout owner');
   policies.set(pkg.package,{normal:['nkdk-conversion-core',...pkg.dependencies]});
  }
  if(layout.facadeDependencies.some(name=>!names.has(name)) || policies.has(facadeName))throw new Error('Invalid shared AOT facade dependency');
  policies.set(facadeName,{normal:['nkdk-conversion-core',...layout.facadeDependencies]});
 }
 return policies;
}
export function violations(metadata,catalogues=[]){
 const shared=sharedPolicies(catalogues);
 const members=new Set(metadata.workspace_members);
 const packages=metadata.packages.filter(pkg=>members.has(pkg.id));
 const names=new Set(packages.map(pkg=>pkg.name));
 const errors=[];
 for(const pkg of packages){
  const policy=shared.get(pkg.name)??allowed[pkg.name]??(probePackages.has(pkg.name)||candidatePackages.has(pkg.name)?probeFamily:(/^nkdk-system-enum-shard-[0-7]$/.test(pkg.name)?systemEnumShard:undefined));
  if(!policy){errors.push(`Unknown workspace package: ${pkg.name}`);continue;}
  for(const dep of pkg.dependencies){
   // All targets, optional dependencies and aliases retain their actual package name.
   if(!names.has(dep.name) && !dep.path)continue;
   const kind=dep.kind??'normal';
   // Existing third-party parser with a documented Unicode-tag compatibility
   // patch. This is not a general exemption for path dependencies.
   if(dep.name==='yaml-rust2' &&
      ((kind==='normal' && ['nkdk-conversion-core','nkdk-rule-compiler','nkdk'].includes(pkg.name)) ||
       (kind==='dev' && pkg.name==='nkdk-compiled-rules')) &&
      typeof metadata.workspace_root==='string' &&
      dep.path===resolve(metadata.workspace_root,'../third-party/yaml-rust2'))continue;

   if(!names.has(dep.name) || !policy[kind]?.includes(dep.name))errors.push(`Forbidden ${kind} dependency: ${pkg.name} -> ${dep.name}`);
  }
 }
 return errors;
}
