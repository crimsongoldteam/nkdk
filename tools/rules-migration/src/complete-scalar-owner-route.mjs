// Operation assembly uses declaration identities and extracted registration data.
// Neither the Rust operation nor its compiler needs a metadata-specific branch.
export function completeScalarOwnerRoute({profile,complete,state,numbers,currentBase,belonging}) {
 const [own,base]=complete.facts;
 const snapshot=(entry,field)=>({snapshot:{entry:entry.id,field}});
 const owner=snapshot(own,'uuid');
 const membership=snapshot(base,'objectBelonging');
 const select=cases=>({select:{on:membership,cases}});
 const native=belonging.enum.Native,adopted=belonging.enum.Adopted;
 if(!native || !adopted || native===adopted)throw new Error('Ambiguous owner membership');
 const inputs={component:'component',parent:'parent',ownerName:'name',
  defaultLanguage:'defaultLanguage',registeredLanguages:'registeredLanguages',
  compatibilityMode:'compatibilityMode',owner,
  adopted:{byComponent:{cf:{literal:false},cfe:select({[native]:{literal:false},[adopted]:{literal:true}})}}};
 const route={xmlDir:profile.xmlDirectory,yamlDir:profile.yamlDirectory,
  owners:{cf:complete.owner.id,cfe:select({[native]:{literal:complete.owner.id},[adopted]:{literal:complete.borrowed.id}})},
  validators:{cf:complete.validation.id,cfe:complete.validation.id},inputs,ownerFacts:false,
  sources:[
   {entry:own.id,inputs:{component:'component',parent:'parent',ownerName:'name'}},
   {entry:base.id,inputs:{component:'component'},newOwner:{template:{uuid:owner,
    base:{optional:{externalSnapshot:{component:'cf',entry:own.id,field:'uuid'}}}}}},
   {entry:state.id,inputs:{owner},newOwner:{template:{}}},
   {entry:numbers.id,only:['cf'],factDirections:['xml-to-yaml'],inputs:{owner},newOwner:{template:{}}},
  ]};
 const factRoute={xmlDir:profile.xmlDirectory,yamlDir:profile.yamlDirectory,
  entry:currentBase.id,only:['cf'],fromBase:true,factDirections:['yaml-to-xml'],inputs:{owner}};
 return {route,factRoute,production:[complete.owner,complete.borrowed,complete.validation,...complete.facts,state,numbers,currentBase]};
}
