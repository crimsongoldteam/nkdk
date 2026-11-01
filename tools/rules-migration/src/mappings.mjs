import {readFileSync} from 'node:fs';
const commonAliases=JSON.parse(readFileSync(new URL('../profiles/common-aliases.json',import.meta.url),'utf8'));
const commonIndexProviders=JSON.parse(readFileSync(new URL('../contracts/common-index-providers.json',import.meta.url)));
import { dcsValueProfile, settingsParameterProfile, declaredSettingsParameterCollection } from './dcs-value-profile.mjs';
import {mapIdentity} from './identity-property.mjs';
import { commonInputs } from './common-inputs.mjs';
import { reviewedPropertyExpression } from './reviewed-property-expressions.mjs';
import { metadataAllowedPathProperty } from './metadata-allowed-path-property.mjs';
import {declaredElementProperty} from './declared-element-property.mjs';
import {declaredCollectionProperty} from './declared-collection-property.mjs';
import {mapCollectionReference} from './collection-reference-property.mjs';
const simple = new Map([['boolean','common.boolean'], ['string','common.string'], ['number','common.exact-decimal']]);
const lists = new Map([['WebSocketClientHeaders','common.web-socket-client-headers'],['XDTOPackages','common.xdto-packages']]);
const basedOnPaths=[['ChartOfAccounts'],['ExternalDataSource','Table'],['ExchangePlan'],['Catalog'],['Document'],['ChartOfCharacteristicTypes'],['BusinessProcess'],['ChartOfCalculationTypes'],['Task']];
const indexedTargetProfiles=[{root:'StyleItem',filter:'styleItemType',index:'metadata.style-item-types'}];
const commonKeys = ['tag','type','yaml','xml','xmlParents','defaultValueXML','implicitValueYAML','noImplicitValueYAML','toEnterprise','defaultValueAdoptedXML','description'];
const textInputs = {
  defaultLanguage:{type:{kind:'scalar',scalar:'text'}},
  registeredLanguages:{type:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}},
  ownerName:{type:{kind:'scalar',scalar:'text'}},
};
const emptyTypeDescription=()=>({record:{
  items:{sequence:[]},types:{sequence:[]},typeSets:{sequence:[]},identifiers:{sequence:[]},
  stringLength:{literal:''},stringAllowedLength:{literal:''},numberDigits:{literal:''},
  numberFractionDigits:{literal:''},numberAllowedSign:{literal:''},dateFractions:{literal:''},
  binaryLength:{literal:''},binaryAllowedLength:{literal:''},
}});
export const METADATA_ATTRIBUTE_TYPE_DESCRIPTION_TYPES = [
  'string','decimal','date','boolean','ValueStorage','UUID','CatalogRef','CatalogRef.*','DocumentRef','DocumentRef.*',
  'EnumRef','EnumRef.*','ChartOfCharacteristicTypesRef','ChartOfCharacteristicTypesRef.*','ChartOfAccountsRef','ChartOfAccountsRef.*',
  'ChartOfCalculationTypesRef','ChartOfCalculationTypesRef.*','BusinessProcessRef','BusinessProcessRef.*',
  'BusinessProcessRoutePointRef','BusinessProcessRoutePointRef.*','TaskRef','TaskRef.*','ExchangePlanRef','ExchangePlanRef.*',
  'AnyIBRef','DefinedType.*','Characteristic.*','ExternalDataSourceTableRef.*','ExternalDataSourceCubeDimensionTableRef.*',
];
function instantiateFieldProfile(value, names) {
  if(Array.isArray(value))return value.map(item=>instantiateFieldProfile(item,names));
  if(value===null || typeof value!=='object')return value;
  if(Object.keys(value).length===1 && typeof value.field==='string' && Object.hasOwn(names,value.field)) {
    return {field:names[value.field]};
  }
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[
    key, instantiateFieldProfile(item,names),
  ]));
}
function liftSelfPresence(value, field) {
  if(Array.isArray(value))return value.map(item=>liftSelfPresence(item,field));
  if(value===null || typeof value!=='object')return value;
  if(Object.keys(value).length===1 && value.self===true)return {field};
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[
    key, key==='target' && item==='self' ? {field} : liftSelfPresence(item,field),
  ]));
}
export function mapProperty(property, catalog, xmlNamespaces={}, ownerContext={}) {
  let p = property.parameters, fail = reason => ({status:'blocked', reason});
  const profiles=[];
  if(property.status!=='static-parameters' && p && typeof p==='object' && !Array.isArray(p)) {
    for(const parameter of ['toXML','defaultValue']) {
      if(!Object.hasOwn(p,parameter) || !p[parameter]?.$unresolved)continue;
      const profile=reviewedPropertyExpression(parameter,p[parameter]);
      if(!profile)return fail('requires-expression-mapping');
      profiles.push(profile);
    }
    const unresolved=Object.keys(p).filter(key=>p[key]?.$unresolved && !profiles.some(profile=>profile.parameter===key));
    if(unresolved.length)return fail('requires-expression-mapping');
    p=Object.fromEntries(Object.entries(p).filter(([key])=>!profiles.some(profile=>profile.parameter===key)));
  } else if (property.status !== 'static-parameters') return fail('requires-expression-mapping');
  if (!p || typeof p !== 'object' || Array.isArray(p)) return fail('invalid-property-shape');
  if (typeof property.name !== 'string' || !property.name) return fail('field-name-profile');
  if(Object.hasOwn(p,'externalFile')) {
    const file=p.externalFile;
    if(p.type!=='string' || !file || typeof file!=='object' || Array.isArray(file)
      || Object.keys(file).some(key=>!['dir','extension','nameFrom'].includes(key))
      || file.nameFrom!=='parent' || ![file.dir,file.extension].every(value=>typeof value==='string' && value.length && !/[\\/\u0000]/.test(value))
      || ['.','..'].includes(file.dir) || Object.hasOwn(p,'yaml'))return fail('external-text-storage-profile');
    const {externalFile,...parameters}=p;
    const mapped=mapProperty({...property,parameters:{...parameters,yaml:'externalStorage'}},catalog,xmlNamespaces,ownerContext);
    if(mapped.status!=='candidate')return mapped;
    delete mapped.key;
    mapped.file={sequence:[{literal:file.dir},{concat:[{input:'parentName'},{literal:'.'+file.extension}]}]};
    mapped.inputs={...mapped.inputs,parentName:{type:{kind:'scalar',scalar:'text'}}};
    return mapped;
  }
  if(Object.hasOwn(ownerContext.collectionValues??{},p.type)) {
    const {configurationIndexAddressing,...parameters}=p;
    if(configurationIndexAddressing!==undefined && configurationIndexAddressing!=='yamlPath')
      return fail('collection-index-addressing-unsupported');
    const mapped=mapCollectionReference({...property,parameters},ownerContext.collectionValues[p.type],xmlNamespaces);
    if(mapped.status==='candidate' && configurationIndexAddressing)
      mapped.ownerRequirements={indexAddressing:configurationIndexAddressing};
    return mapped;
  }
  const declaredElement=declaredElementProperty({...property,parameters:p},catalog);
  if(declaredElement)return declaredElement;
  const declaredCollection=declaredCollectionProperty({...property,parameters:p},catalog);
  if(declaredCollection)return declaredCollection;
  // A metadata item's Name lives in its directory/key rather than in its
  // properties YAML. This source profile is shared by every named owner.
  if(property.name==='name' && p.type==='string' && !Object.hasOwn(p,'yaml')) {
    if(profiles.some(profile=>profile.kind!=='owner-name-default'))return fail('owner-name-profile');
    if(p.required!==true || (p.xml!==undefined && p.xml!=='Name') ||
      JSON.stringify(p.xmlParents)!=='["Properties"]' ||
      Object.keys(p).some(key=>!['type','xml','xmlParents','required'].includes(key)))return fail('owner-name-profile');
    if(!catalog.has('common.string'))return fail('unsupported-common');
    return {status:'candidate',id:'common.string',type:{use:'value'},path:['Properties','Name'],
      inputs:{ownerName:{type:{kind:'scalar',scalar:'text'}}},
      presence:{target:{field:'name'},xml:{missing:{denotes:{absent:true}}},yaml:{missing:{denotes:{input:'ownerName'}}}}};
  }
  if (p.type === 'SettingsParameterValue') {
    const profile = settingsParameterProfile(p,catalog);
    return fail(profile ? 'dcs-parameter-collection-required' : 'dcs-parameter-profile');
  }
  if (p.type === 'SettingsParameterValueCollection') {
    const selected=declaredSettingsParameterCollection(p,catalog);
    if(!selected)return fail('dcs-parameter-collection-profile');
    const {declaration,profile}=selected;
    const choice=catalog.get('common.dcs-parameter-value-choice');
    const supported=new Set((choice?.representations?.yaml?.variants??[]).map(row=>row.input===undefined?null:row.equals).filter(Boolean));
    const selectors=Object.values(declaration.representations.yaml.itemInputs.valueProfile.table.values);
    selectors.push(declaration.representations.yaml.itemInputs.valueProfile.table.default);
    if(selectors.some(value=>!supported.has(value)))return {status:'blocked',reason:'dcs-parameter-selector-required',profile};
    const parents=p.xmlParents??[];
    const parts=[...parents,p.xml];
    if(typeof p.yaml!=='string' || !p.yaml || parts.some(part=>typeof part!=='string' || !/^(?:[A-Za-z][A-Za-z0-9]*:)?[A-Za-z][A-Za-z0-9]*$/.test(part)))return fail('xml-path-profile');
    if(p.xml!==declaration.representations.xml.path?.[0])return fail('dcs-parameter-item-path');
    const namespaces={};
    for(const part of parts.filter(part=>part.includes(':'))) {
      const prefix=part.split(':')[0];
      if(typeof xmlNamespaces[prefix]!=='string' || !xmlNamespaces[prefix])return fail(`unknown-xml-prefix:${prefix}`);
      namespaces[prefix]=xmlNamespaces[prefix];
    }
    catalog.set(declaration.id,declaration);
    const lifted=commonInputs(declaration);
    return {status:'candidate',id:declaration.id,type:{use:'value',bind:lifted.bind},
      path:parents,key:p.yaml,inputs:lifted.inputs,imports:lifted.imports,namespaces,
      indexProviders:{styleTypes:'metadata.style-item-types',labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes'},
      parameterEquivalences:[{parameter:'configurationIndexAddressing',equivalentTo:'yamlPath',via:declaration.id}],
      presence:{target:{field:property.name},xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{absent:true}}],canonical:[{when:{not:{present:{field:property.name}}},form:'missing'},{form:'ordinary'}]},yaml:{missing:{denotes:{absent:true}}}}};
  }
  const dcs=p.type==='MetadataDcsMetadataValue'?dcsValueProfile(p,catalog):undefined;
  if(p.type==='MetadataDcsMetadataValue' && !dcs)return fail('dcs-value-profile');
  if(dcs && !catalog.has(dcs.id))catalog=new Map([...catalog,[dcs.id,dcs.contract]]);
  const declaredValue=profiles.find(profile=>profile.kind==='value-declaration');
  if(declaredValue && (p.type!=='string' || typeof declaredValue.id!=='string'))return fail('value-declaration-profile');
  if(p.type==='uuid')return mapIdentity(property,catalog);
  if(Object.hasOwn(p,'toYAML') || Object.hasOwn(p,'fromYAML')) {
    if(p.toYAML!==false || p.fromYAML!==false || !(simple.has(p.type) || p.type==='SystemEnumeration') || !Object.hasOwn(p,'implicitValueYAML'))return fail('hidden-scalar-default-required');
    const {toYAML,fromYAML,...parameters}=p;
    const mapped=mapProperty({...property,parameters},catalog,xmlNamespaces);
    if(mapped.status==='candidate')delete mapped.key;
    return mapped;
  }
  if(Object.hasOwn(p,'fromXML') || Object.hasOwn(p,'toXML')) {
    if(p.fromXML!==false || p.toXML!==false || !simple.has(p.type) ||
      ['runtimeOnly','defaultValueXML','defaultValueXMLRaw','defaultValueAdoptedXML'].some(key=>Object.hasOwn(p,key)))
      return fail('yaml-only-scalar-profile');
    const {fromXML,toXML,...parameters}=p;
    const mapped=mapProperty({...property,parameters},catalog,xmlNamespaces,ownerContext);
    if(mapped.status==='candidate') {
      mapped.path=[];
      mapped.yamlOnly=true;
      delete mapped.attribute;
      mapped.presence.xml={missing:{denotes:{absent:true}}};
      mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
        {parameter:'fromXML',equivalentTo:'absent-xml-route'},
        {parameter:'toXML',equivalentTo:'absent-xml-route'}];
    }
    return mapped;
  }
  if(Object.hasOwn(p,'toEnterprise') && p.toEnterprise !== false)return fail('excluded-enterprise-profile');
  if(Object.hasOwn(p,'tag') && (typeof p.tag!=='string' || !p.tag))return fail('source-tag-profile');
  if(Object.hasOwn(p,'description') && typeof p.description!=='string')return fail('source-description-profile');
  const platform=value=>Array.isArray(value) && value.length===1 && value[0]==='PlatformApplication';
  const purposes=p.type==='UsePurposes';
  const purposeDefault=purposes && property.constantDefaults?.includes('defaultValue') && platform(p.defaultValue?.$constantFunction?.value);
  const plainPurposes=purposes && Object.keys(p).every(key=>['type','yaml','xml','xmlParents','tag','toEnterprise'].includes(key));
  if(purposes && !plainPurposes && (!purposeDefault || (Object.hasOwn(p,'defaultValueXML') ? !platform(p.defaultValueXML) : p.evaluateWhenYAMLMissing!==true) || (Object.hasOwn(p,'evaluateWhenYAMLMissing') && p.evaluateWhenYAMLMissing!==true)))return fail('use-purposes-default-profile');
  const parameterEquivalences=[];
  const referenceCollection=['MetadataItemLinks','MetadataObjectRefCollection'].includes(p.type);
  const multiRootLinks=referenceCollection && p.metadataTarget?.kind==='object'
    && Object.keys(p.metadataTarget).every(key=>['kind','roots'].includes(key))
    && Array.isArray(p.metadataTarget.roots) && p.metadataTarget.roots.length>1
    && p.metadataTarget.roots.every(root=>typeof root==='string' && Object.hasOwn(catalog.get('common.path-root')?.enum??{},root));
  const referenceCollectionEmpty=multiRootLinks && p.defaultValueXMLRaw &&
    typeof p.defaultValueXMLRaw==='object' && !Array.isArray(p.defaultValueXMLRaw) &&
    Object.keys(p.defaultValueXMLRaw).length===0;
  if(multiRootLinks && p.type==='MetadataObjectRefCollection' && !referenceCollectionEmpty)
    return fail('object-reference-collection-default-profile');
  const multiRootEmptyDefaults=multiRootLinks && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw)
    && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0
    && JSON.stringify(p.defaultValueAdoptedXML)==='[]';
  if(multiRootEmptyDefaults)parameterEquivalences.push(
    {parameter:'defaultValueAdoptedXML',equivalentTo:'empty-sequence',via:'common.metadata-item-links-allowed-roots'},
    {parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.metadata-item-links-allowed-roots'},
  );
  const unrestrictedObjectTarget=['MetadataItemLink','MetadataItemLinks'].includes(p.type)
    && JSON.stringify(p.metadataTarget)==='{"kind":"object"}';
  const unrestrictedEmptyDefault=unrestrictedObjectTarget && p.defaultValueXML==='' && p.defaultValueXMLRaw==='';
  const unrestrictedEqualAdoptedDefault=unrestrictedEmptyDefault && p.defaultValueAdoptedXML==='';
  const unrestrictedEmptyCollection=unrestrictedObjectTarget && p.type==='MetadataItemLinks'
    && JSON.stringify(p.defaultValue)==='[]' && JSON.stringify(p.defaultValueXMLEmpty)==='[]';
  const unrestrictedRawEmptyParent=unrestrictedObjectTarget && p.type==='MetadataItemLinks'
    && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw)
    && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0;
  if(unrestrictedRawEmptyParent)parameterEquivalences.push({parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.metadata-object-link-list'});
  const unrestrictedRawEmptyList=unrestrictedObjectTarget && p.type==='MetadataItemLinks' && p.defaultValueXMLRaw==='';
  if(unrestrictedRawEmptyList)parameterEquivalences.push({parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.metadata-object-link-list'});
  if(unrestrictedEmptyCollection)parameterEquivalences.push(
    {parameter:'defaultValue',equivalentTo:'empty-sequence',via:'common.metadata-object-link-list'},
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-sequence',via:'common.metadata-object-link-list'},
  );
  if(unrestrictedEmptyDefault && p.type==='MetadataItemLinks')parameterEquivalences.push({parameter:'defaultValueXML',equivalentTo:'defaultValueXMLRaw'});
  const adoptedEmptyTypeDescription=p.type==='TypeDescription'
    && JSON.stringify(p.defaultValueAdoptedXML)===JSON.stringify({type:[]});
  const emptyStringDefault=p.type==='string' && p.defaultValueXML==='' && p.defaultValueXMLRaw==='' && !p.noImplicitValueYAML && (!Object.hasOwn(p,'implicitValueYAML') || p.implicitValueYAML==='');
  if(emptyStringDefault)parameterEquivalences.push({parameter:'defaultValueXML',equivalentTo:'defaultValueXMLRaw',via:'common.string'});
  const emptyStringXMLDefault=p.type==='string' && p.defaultValueXMLEmpty==='' &&
    !Object.hasOwn(p,'defaultValueXMLRaw') && !Object.hasOwn(p,'defaultValueXML') && p.preserveEmptyXML!==true;
  if(emptyStringXMLDefault)parameterEquivalences.push({parameter:'defaultValueXMLEmpty',equivalentTo:'empty-text',via:'common.string'});
  if(Object.hasOwn(p,'defaultValueAdoptedXML')) {
    const ordinary=Object.hasOwn(p,'defaultValueXML')?'defaultValueXML':'defaultValueXMLRaw';
    const equalScalar=p[ordinary]===p.defaultValueAdoptedXML && ['string','number','boolean'].includes(typeof p[ordinary]);
    const equalPurposes=purposes && ordinary==='defaultValueXML' && platform(p[ordinary]) && platform(p.defaultValueAdoptedXML);
    if(!adoptedEmptyTypeDescription && !multiRootEmptyDefaults) {
      if(!Object.hasOwn(p,ordinary) || !(equalScalar || equalPurposes))return fail('adopted-default-profile');
      parameterEquivalences.push({parameter:'defaultValueAdoptedXML',equivalentTo:ordinary});
    }
  }
  const explicitDefault=Object.hasOwn(p,'preserveExplicitDefaultXML') && ['boolean','SystemEnumeration'].includes(p.type);
  if(explicitDefault && p.preserveExplicitDefaultXML!==true)return fail('explicit-default-profile');
  const xmlOnlyDefault=explicitDefault && p.noImplicitValueYAML===true && Object.hasOwn(p,'defaultValueXML') && !Object.hasOwn(p,'implicitValueYAML') && !Object.hasOwn(p,'defaultValueXMLRaw');
  const implicitXML=Object.hasOwn(p,'implicitValueXML');
  if(implicitXML && (p.type!=='boolean' || typeof p.implicitValueXML!=='boolean' || Object.hasOwn(p,'defaultValueXML') || Object.hasOwn(p,'defaultValueXMLRaw')))return fail('xml-implicit-profile');
  const index = p.type === 'IndexField';
  const indexDefault=index && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0;
  if(index && (p.preserveExplicitDefaultXML!==true || Object.hasOwn(p,'defaultValueXML') || Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'noImplicitValueYAML') || (Object.hasOwn(p,'defaultValueXMLRaw') && !indexDefault)))return fail('index-field-profile');
  const target=p.metadataTarget;
  const allowedPathProperty=metadataAllowedPathProperty(property,catalog,xmlNamespaces);
  if(allowedPathProperty)return allowedPathProperty;
  const genericId=typeof p.type==='string' && /^[A-Z][A-Za-z0-9]*$/.test(p.type)
    ? (commonAliases[p.type] ?? `common.${p.type.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}`) : undefined;
  const genericCommon=genericId && catalog.get(genericId);
  const commonPresence=genericCommon?.presence?.find(rule=>rule.target==='self');
  const declaredMissingDefault=genericCommon && Object.hasOwn(p,'defaultValue') &&
    Object.hasOwn(commonPresence?.xml?.missing?.denotes??{},'literal') &&
    Object.hasOwn(commonPresence?.yaml?.missing?.denotes??{},'literal') &&
    p.defaultValue===commonPresence.xml.missing.denotes.literal &&
    p.defaultValue===commonPresence.yaml.missing.denotes.literal;
  // A choice default belongs to its unique scalar variant, not to a domain
  // name. Ambiguous alternatives and contextual variants remain explicit.
  const defaultScalar={boolean:'boolean',string:'text',number:'number'}[typeof p.implicitValueYAML];
  const defaultVariants=genericCommon?.value?.kind==='choice' && defaultScalar
    ? genericCommon.value.variants.filter(variant=>{
      const target=genericCommon.imports?.[variant.type?.use];
      const declaration=target && catalog.get(target);
      return declaration?.value?.kind==='scalar' && declaration.value.scalar===defaultScalar &&
        !Object.keys(declaration.inputs??{}).length && !variant.type.bind && !variant.type.with;
    }) : [];
  const choiceDefault=defaultVariants.length===1 && Object.hasOwn(p,'implicitValueYAML') &&
    !['defaultValueXML','defaultValueXMLRaw','noImplicitValueYAML'].some(key=>Object.hasOwn(p,key))
    ? {variant:{name:defaultVariants[0].name,value:{literal:p.implicitValueYAML}}} : undefined;
  const indexInputs=Object.entries(genericCommon?.inputs??{}).filter(([,input])=>input.type?.kind==='index');
  const targetProfile=indexedTargetProfiles.find(profile=>target?.kind==='object' &&
    JSON.stringify(target.roots)===JSON.stringify([profile.root]) &&
    JSON.stringify(target.filters)===JSON.stringify([{kind:profile.filter,values:[p.type]}]));
  // A legacy empty XML object denotes the enclosing collection element,
  // never an invented item. Keep the policy at its owning property boundary.
  const emptyMappingDefault=(genericCommon?.value?.kind==='sequence' &&
    genericCommon.representations?.xml?.kind==='element-sequence' &&
    ['record-mapping','sequence'].includes(genericCommon.representations?.yaml?.kind) ||
    genericCommon?.value?.kind==='record' && genericCommon.representations?.xml?.kind==='record' &&
    genericCommon.representations?.yaml?.kind==='mapping') &&
    p.evaluateWhenYAMLMissing===true && p.defaultValueXMLRaw &&
    typeof p.defaultValueXMLRaw==='object' && !Array.isArray(p.defaultValueXMLRaw) &&
    Object.keys(p.defaultValueXMLRaw).length===0;
  const declaredProviders=commonIndexProviders[genericId];
  const providedCommon=genericCommon && indexInputs.length>0 && declaredProviders &&
    Object.keys(declaredProviders).length===indexInputs.length &&
    indexInputs.every(([name])=>typeof declaredProviders[name]==='string' && declaredProviders[name]) &&
    Object.keys(p).every(key=>['type','xml','xmlParents','yaml','tag','description','toEnterprise','configurationIndexAddressing',...(emptyMappingDefault?['defaultValueXMLRaw','evaluateWhenYAMLMissing']:[])].includes(key)) &&
    (!Object.hasOwn(p,'configurationIndexAddressing') || p.configurationIndexAddressing==='yamlPath');
  const indexedCommon=providedCommon || genericCommon && indexInputs.length===1 && Object.keys(genericCommon.inputs).length===1 && targetProfile;
  const picture=p.type==='Picture' && JSON.stringify(target)==='{"kind":"object","roots":["CommonPicture"]}';
  const yamlPathAddressing=p.configurationIndexAddressing==='yamlPath';
  const plainDeclaredCommon=genericCommon && indexInputs.length===0 &&
    Object.keys(p).every(key=>['type','xml','xmlParents','yaml','tag','description','toEnterprise','configurationIndexAddressing',...(declaredMissingDefault?['defaultValue']:[]),...(choiceDefault?['implicitValueYAML']:[]),...(emptyMappingDefault?['defaultValueXMLRaw','evaluateWhenYAMLMissing']:[])].includes(key)) &&
    (!Object.hasOwn(p,'configurationIndexAddressing') || yamlPathAddressing) &&
    Object.values(genericCommon.inputs??{}).every(input=>
      input.type?.kind==='scalar' && input.type.scalar==='text' ||
      input.type?.kind==='sequence' && input.type.item?.kind==='scalar' && input.type.item.scalar==='text');
  const declaredSequenceDefaults=genericCommon?.value?.kind==='sequence' &&
    genericCommon.representations?.xml?.kind==='element-sequence' &&
    genericCommon.representations?.yaml?.kind==='sequence' &&
    genericCommon.presence?.some(rule=>rule.target==='self' &&
      rule.xml?.empty?.some(form=>form.form==='empty-element' && form.denotes?.absent===true)) &&
    indexInputs.length===0 && Object.keys(genericCommon.inputs??{}).length===0 &&
    p.configurationIndexAddressing==='yamlPath' && p.preserveExplicitDefaultXML===true &&
    p.defaultValueXMLRaw==='' &&
    Object.hasOwn(p,'defaultValue')===Object.hasOwn(p,'defaultValueXMLEmpty') &&
    ['defaultValue','defaultValueXMLEmpty'].every(key=>!Object.hasOwn(p,key) ||
      Array.isArray(p[key]) && p[key].length===0) &&
    Object.keys(p).every(key=>['type','xml','xmlParents','yaml','tag','description',
      'configurationIndexAddressing','preserveExplicitDefaultXML','defaultValueXMLRaw',
      'defaultValue','defaultValueXMLEmpty'].includes(key));
  const genericReusable=indexedCommon || plainDeclaredCommon || declaredSequenceDefaults;
  if(declaredSequenceDefaults)for(const key of ['defaultValue','defaultValueXMLEmpty'])
    if(Object.hasOwn(p,key))parameterEquivalences.push({parameter:key,equivalentTo:'empty-sequence',via:genericId});
  // A scalar cannot equal a YAML mapping or the source record by identity.
  // Such a legacy implicitValueYAML neither omits an imported value nor supplies
  // a value on YAML import without implicitValueXML.
  const ineffectiveRecordDefault=indexedCommon && genericCommon.value?.kind==='record'
    && genericCommon.representations?.yaml?.kind==='mapping'
    && Object.hasOwn(p,'implicitValueYAML') && p.implicitValueYAML!==null
    && typeof p.implicitValueYAML!=='object' && !Object.hasOwn(p,'implicitValueXML');
  if(ineffectiveRecordDefault)parameterEquivalences.push({parameter:'implicitValueYAML',equivalentTo:'ineffective-scalar-default-for-record',via:genericId});
  const ownerForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this' && JSON.stringify(target.memberKinds)==='["Form"]' && JSON.stringify(target.objectRoots)==='["CommonForm"]' && Object.keys(target).every(key=>['kind','owner','memberKinds','objectRoots'].includes(key));
  const documentChoiceForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this'
    && JSON.stringify(target.memberKinds)==='["Form"]' && JSON.stringify(target.objectRoots)==='["CommonForm"]'
    && JSON.stringify(target.allowedMemberPaths)==='[["DocumentJournal","Form"]]'
    && Object.keys(target).every(key=>['kind','owner','memberKinds','objectRoots','allowedMemberPaths'].includes(key));
  const contextualFormStorage=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this'
    && JSON.stringify(target.memberKinds)==='["Form"]'
    && JSON.stringify(target.objectRoots)==='["SettingsStorage"]'
    && JSON.stringify(target.allowedMemberPaths)==='[["Report","Form"]]'
    && Object.keys(target).every(key=>['kind','owner','memberKinds','objectRoots','allowedMemberPaths'].includes(key));
  const formEmptyDefaults=ownerForm && p.defaultValueXMLRaw==='' && p.defaultValueXMLEmpty===''
    && p.defaultValue==='' && p.implicitValueYAML==='';
  if(formEmptyDefaults)parameterEquivalences.push(
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-variant',via:'common.owner-or-common-form-link'},
    {parameter:'defaultValue',equivalentTo:'empty-variant',via:'common.owner-or-common-form-link'},
    {parameter:'implicitValueYAML',equivalentTo:'empty-variant',via:'common.owner-or-common-form-link'},
  );
  const typeForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='type' && target.typeProperty==='type' && JSON.stringify(target.memberKinds)==='["Form"]' && Object.keys(target).every(key=>['kind','owner','typeProperty','memberKinds'].includes(key));
  const explicitForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='explicit' && JSON.stringify(target.memberKinds)==='["Form"]' && Object.keys(target).every(key=>['kind','owner','memberKinds'].includes(key));
  const directAllowedPaths=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='explicit'
    && Array.isArray(target.allowedObjectPaths) && target.allowedObjectPaths.every(path=>Array.isArray(path) && path.length===1 && Object.hasOwn(catalog.get('common.path-root')?.enum??{},path[0]))
    && Array.isArray(target.allowedMemberPaths) && target.allowedMemberPaths.every(path=>Array.isArray(path) && path.length===2
      && Object.hasOwn(catalog.get('common.path-root')?.enum??{},path[0])
      && Object.hasOwn(catalog.get('common.path-member-kind')?.enum??{},path[1]))
    && (target.allowOwner===undefined || typeof target.allowOwner==='boolean')
    && Object.keys(target).every(key=>['kind','owner','allowOwner','allowedObjectPaths','allowedMemberPaths'].includes(key));
  const explicitRootMember=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='explicit'
    && Array.isArray(target.objectRoots) && target.objectRoots.length===1
    && Array.isArray(target.memberKinds) && target.memberKinds.length===1
    && Object.keys(target).every(key=>['kind','owner','objectRoots','memberKinds'].includes(key));
  const ownMember=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this'
    && Array.isArray(target.memberKinds) && target.memberKinds.length===1
    && Object.hasOwn(catalog.get('common.path-ordinary-member-kind')?.enum??{},target.memberKinds[0])
    && (target.roots===undefined || (Array.isArray(target.roots) && target.roots.length===1
      && Object.hasOwn(catalog.get('common.path-root')?.enum??{},target.roots[0])))
    && Object.keys(target).every(key=>['kind','owner','memberKinds','roots'].includes(key));
  const ownMemberEmptyDefaults=ownMember && p.defaultValueXMLRaw==='' && p.defaultValueXMLEmpty===''
    && p.defaultValue==='' && p.implicitValueYAML==='';
  if(ownMemberEmptyDefaults)parameterEquivalences.push(
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-element',via:'common.owner-member-link'},
    {parameter:'defaultValue',equivalentTo:'empty-string',via:'common.owner-member-link'},
    {parameter:'implicitValueYAML',equivalentTo:'empty-string',via:'common.owner-member-link'},
  );
  const ownBooleanAttribute=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this' && JSON.stringify(target.memberKinds)==='["Attribute"]' && JSON.stringify(target.filters)===JSON.stringify([{kind:'directMember'},{kind:'hasType',type:'boolean'}]) && Object.keys(target).every(key=>['kind','owner','memberKinds','filters'].includes(key));
  const numerator=p.type==='MetadataItemLink' && target?.kind==='object' && JSON.stringify(target.roots)==='["DocumentNumerator"]' && Object.keys(target).every(key=>['kind','roots'].includes(key));
  const documentList=p.type==='MetadataItemLinks' && target?.kind==='object' && JSON.stringify(target.roots)==='["Document"]' && Object.keys(target).every(key=>['kind','roots'].includes(key));
  const genericRootTarget=['MetadataItemLink','MetadataItemLinks'].includes(p.type) && target?.kind==='object'
    && Object.keys(target).every(key=>['kind','roots'].includes(key))
    && Array.isArray(target.roots) && target.roots.length===1
    && target.roots.every(root=>typeof root==='string' && Object.hasOwn(catalog.get('common.path-root')?.enum??{},root));
  const dataTableLink=p.type==='MetadataItemLink' && target?.kind==='dataTable'
    && Object.keys(target).every(key=>['kind','roots'].includes(key))
    && Array.isArray(target.roots) && target.roots.length>0
    && target.roots.every(root=>typeof root==='string' && Object.hasOwn(catalog.get('common.path-root')?.enum??{},root));
  const genericRootLink=genericRootTarget && p.type==='MetadataItemLink' && !numerator;
  const genericRootLinks=genericRootTarget && p.type==='MetadataItemLinks' && !documentList;
  const basedOn=referenceCollection && target?.kind==='object' && JSON.stringify(target.allowedObjectPaths)===JSON.stringify(basedOnPaths) && Object.keys(target).every(key=>['kind','allowedObjectPaths'].includes(key));
  const explicitMemberList=p.type==='MetadataItemLinks' && target?.kind==='member' && target.owner==='explicit' && Object.keys(target).every(key=>['kind','owner'].includes(key));
  const ownerOrMemberList=p.type==='MetadataItemLinks' && JSON.stringify(target)==='{"kind":"member","owner":"explicit","allowOwner":true}';
  if(ownerOrMemberList && p.defaultValueXMLRaw==='')parameterEquivalences.push(
    {parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.metadata-item-links'});
  const contextualMemberList=p.type==='MetadataItemLinks' && target?.kind==='member' && target.owner==='this'
    && JSON.stringify(target.roots)==='["CalculationRegister"]'
    && JSON.stringify(target.memberKinds)==='["Dimension"]'
    && JSON.stringify(target.allowedMemberPaths)==='[["CalculationRegister","Dimension"],["CalculationRegister","Attribute"]]'
    && Object.keys(target).every(key=>['kind','owner','roots','memberKinds','allowedMemberPaths'].includes(key));
  if(contextualMemberList && p.defaultValueXMLRaw==='')parameterEquivalences.push(
    {parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.contextual-member-links'});
  const explicitMemberDefault=explicitMemberList && (p.defaultValueXMLRaw==='' ||
    (p.defaultValueXMLRaw && typeof p.defaultValueXMLRaw==='object' && !Array.isArray(p.defaultValueXMLRaw) && Object.keys(p.defaultValueXMLRaw).length===0));
  if(explicitMemberList && !explicitMemberDefault)return fail('explicit-member-default-profile');
  const basedOnDefault=basedOn && (p.defaultValueXMLRaw==='' || (p.defaultValueXMLRaw && typeof p.defaultValueXMLRaw==='object' && !Array.isArray(p.defaultValueXMLRaw) && Object.keys(p.defaultValueXMLRaw).length===0));
  if(basedOn && !basedOnDefault)return fail('based-on-default-profile');
  const linkList=documentList || multiRootLinks || basedOn || explicitMemberList || ownerOrMemberList || contextualMemberList || genericRootLinks
    || (unrestrictedObjectTarget && p.type==='MetadataItemLinks');
  const typeLink=p.type==='TypeLink';
  const typeDescription=p.type==='TypeDescription';
  const choiceValue=p.type==='ChoiceParameterLinks' || p.type==='ChoiceParameters';
  const metadataFields=p.type==='MetadataFields';
  const functionalOptions=p.type==='FunctionalOptionsProperty';
  const childSubsystemNames=p.type==='ChildSubsystemNames';
  const userVisible=p.type==='UserVisible';
  if(functionalOptions && (JSON.stringify(p.metadataTarget)!==JSON.stringify({kind:'object',roots:['FunctionalOption']})))return fail('functional-options-target-profile');
  if(childSubsystemNames && (p.xml!=='Subsystem' || JSON.stringify(p.xmlParents)!==JSON.stringify(['ChildObjects'])))return fail('child-subsystem-names-path-profile');
  if(userVisible && JSON.stringify(p.metadataTarget)!==JSON.stringify({kind:'object',roots:['Role']}))return fail('user-visible-role-target-profile');
  if(metadataFields && p.metadataTarget && (p.metadataTarget.kind!=='member' || p.metadataTarget.owner!=='this' || Object.keys(p.metadataTarget).some(key=>!['kind','owner'].includes(key))))return fail('metadata-fields-target-profile');
  const metadataFieldsDefault=metadataFields && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw) &&
    typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0;
  const metadataFieldsEmptyDefaults=metadataFields && Array.isArray(p.defaultValue) && p.defaultValue.length===0 &&
    Array.isArray(p.defaultValueXMLEmpty) && p.defaultValueXMLEmpty.length===0 && p.defaultValueXMLRaw==='';
  if(metadataFields && (Object.hasOwn(p,'defaultValue') || Object.hasOwn(p,'defaultValueXMLEmpty')) && !metadataFieldsEmptyDefaults)return fail('metadata-fields-default-profile');
  if(metadataFieldsEmptyDefaults)parameterEquivalences.push(
    {parameter:'defaultValue',equivalentTo:'empty-sequence',via:target?.owner==='this'?'common.owner-metadata-fields':'common.metadata-fields'},
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-sequence',via:target?.owner==='this'?'common.owner-metadata-fields':'common.metadata-fields'});
  const metadataValue=p.type==='MetadataValue';
  const metadataNilDefault=metadataValue && p.defaultValueXMLRaw &&
    !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' &&
    Object.keys(p.defaultValueXMLRaw).length===1 && p.defaultValueXMLRaw['_xsi:nil']===true;
  const metadataStringDefault=metadataValue && p.defaultValueXMLRaw &&
    !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' &&
    Object.keys(p.defaultValueXMLRaw).length===1 && p.defaultValueXMLRaw['_xsi:type']==='xs:string';
  if(metadataValue && Object.hasOwn(p,'exportNilValue') &&
    (typeof p.exportNilValue!=='boolean' || (metadataNilDefault && p.exportNilValue===false)))return fail('metadata-value-profile');
  if(metadataValue && !metadataNilDefault && !metadataStringDefault)return fail('metadata-value-profile');
  const runtimeOnly=p.runtimeOnly===true;
  if(Object.hasOwn(p,'runtimeOnly') && !runtimeOnly)return fail('runtime-only-profile');
  if(runtimeOnly && (!typeDescription || ['xml','xmlParents','defaultValueXML','defaultValueXMLRaw','defaultValueAdoptedXML'].some(key=>Object.hasOwn(p,key))))return fail('runtime-only-profile');
  if(typeLink && Object.hasOwn(p,'metadataTarget'))return fail('type-link-target-profile');
  const reference=dataTableLink || Boolean(dcs) || ownerForm || documentChoiceForm || contextualFormStorage || typeForm || explicitForm || directAllowedPaths || explicitRootMember || ownMember || ownBooleanAttribute || numerator || genericRootLink || (unrestrictedObjectTarget && p.type==='MetadataItemLink') || typeLink || typeDescription || choiceValue || metadataValue || metadataFields || functionalOptions || childSubsystemNames || userVisible || indexedCommon || picture;
  const emptyReferenceDefault=(genericRootLink || unrestrictedObjectTarget) && p.defaultValueXML==='' && p.defaultValueXMLRaw==='';
  if(emptyReferenceDefault)parameterEquivalences.push({parameter:'defaultValueXML',equivalentTo:'defaultValueXMLRaw'});
  if(reference && ((Object.hasOwn(p,'defaultValueXML') && !emptyReferenceDefault) || (Object.hasOwn(p,'implicitValueYAML') && !ineffectiveRecordDefault && !formEmptyDefaults && !ownMemberEmptyDefaults) || Object.hasOwn(p,'noImplicitValueYAML')))return fail('form-default-profile');
  const grouped = p.type === 'MetadataCommandGroup';
  const scalarChoice=p.type==='StringOrNumber';
  const qname = p.type === 'XDTOTypeName';
  const formatted = p.type === 'FormattedI8nText';
  const text = p.type === 'I8nText' || formatted;
  const emptyTextXMLDefault=text && JSON.stringify(p.defaultValueXMLEmpty)===JSON.stringify({items:{}});
  if(text && Object.hasOwn(p,'defaultValueXMLEmpty') && !emptyTextXMLDefault)return fail('text-empty-default-profile');
  const emptyObjectTextDefault=p.type==='I8nText' && p.defaultValueXMLRaw &&
    typeof p.defaultValueXMLRaw==='object' && !Array.isArray(p.defaultValueXMLRaw) &&
    Object.keys(p.defaultValueXMLRaw).length===0;
  if(emptyObjectTextDefault)parameterEquivalences.push({parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:'common.i8n-text'});
  const emptyTextDefault=p.type==='I8nText' && p.implicitValueYAML==='' && p.defaultValueXMLRaw==='' && !Object.hasOwn(p,'defaultValueXML') && !['preserveEmptyXML','excludeIfEqualNameYAML','skipEmptyToXML','typedXML'].some(key=>p[key]===true);
  if((formatted || qname || grouped || linkList || scalarChoice || purposes) && Object.keys(p).some(key=>!['tag','type','yaml','xml','xmlParents','toEnterprise','description',...(linkList?['metadataTarget']:[]),...(basedOn || explicitMemberList || ownerOrMemberList || contextualMemberList || multiRootEmptyDefaults || referenceCollectionEmpty || unrestrictedEmptyDefault || unrestrictedRawEmptyParent || unrestrictedRawEmptyList?['defaultValueXMLRaw']:[]),...(unrestrictedEmptyDefault?['defaultValueXML']:[]),...(multiRootEmptyDefaults?['defaultValueAdoptedXML','ownerFactRole']:[]),...(referenceCollectionEmpty?['ownerFactRole']:[]),...(unrestrictedEqualAdoptedDefault?['defaultValueAdoptedXML']:[]),...(unrestrictedEmptyCollection?['defaultValue','defaultValueXMLEmpty','ownerFactRole']:[]),...(unrestrictedRawEmptyParent?['ownerFactRole']:[]),...(purposes?['defaultValue','defaultValueXML','defaultValueAdoptedXML','evaluateWhenYAMLMissing']:[])].includes(key)))return fail('record-parameter-profile');
  const date=p.type==='dateTime';
  if(date && ((Object.hasOwn(p,'typedXML') && p.typedXML!==true) || ['implicitValueYAML','noImplicitValueYAML','defaultValueXMLRaw'].some(key=>Object.hasOwn(p,key)) || (Object.hasOwn(p,'defaultValueXML') && p.defaultValueXML!=='0001-01-01T00:00:00')))return fail('calendar-default-profile');
  const minMax = p.type === 'MinMaxValue';
  const bounds=p.type==='number'?['minimum','maximum'].filter(key=>Object.hasOwn(p,key)):[];
  if(bounds.some(key=>!Number.isSafeInteger(p[key])) || (bounds.length===2 && p.minimum>p.maximum))return fail('numeric-bounds-profile');
  const conditionalMaximum=p.type==='number'&&Object.hasOwn(p,'maximumWhen')?p.maximumWhen:undefined;
  if(conditionalMaximum!==undefined && (!conditionalMaximum || typeof conditionalMaximum!=='object' ||
    Array.isArray(conditionalMaximum) || Object.keys(conditionalMaximum).sort().join(',')!=='equals,maximum,propertyKey' ||
    typeof conditionalMaximum.propertyKey!=='string' || !conditionalMaximum.propertyKey ||
    conditionalMaximum.propertyKey===property.name || typeof conditionalMaximum.equals!=='string' ||
    !Number.isSafeInteger(conditionalMaximum.maximum)))return fail('conditional-numeric-bounds-profile');
  const list = lists.get(p.type);
  const emptyArray = value => Array.isArray(value) && value.length === 0;
  const rawEmptyList = p.type === 'XDTOPackages' && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw === 'object' && Object.keys(p.defaultValueXMLRaw).length === 0;
  if(list && (p.noImplicitValueYAML || (p.type === 'WebSocketClientHeaders'
    ? !emptyArray(p.defaultValueXML) || !emptyArray(p.implicitValueYAML) || Object.hasOwn(p,'defaultValueXMLRaw')
    : !rawEmptyList || Object.hasOwn(p,'defaultValueXML') || Object.hasOwn(p,'implicitValueYAML'))))return fail('collection-default-profile');
  const fields = p.type === 'FieldsList';
  if(fields && p.fieldsListXMLItem !== undefined && !['Field','xr:Field'].includes(p.fieldsListXMLItem))return fail('fields-list-item-profile');
  if(minMax && p.typedXML !== undefined && !['xs:string','xs:decimal'].includes(p.typedXML))return fail('min-max-type-profile');
  const nilDefault=minMax && p.defaultValueXMLRaw && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===1 && p.defaultValueXMLRaw['_xsi:nil']===true;
  const explicitId = dcs?.id ?? declaredValue?.id ?? simple.get(p.type) ?? list ?? (picture?'common.picture':null) ?? (date?(p.typedXML?'common.typed-date-time':'common.date-time'):null) ?? (purposes?'common.use-purposes':scalarChoice?'common.string-or-number':qname?'common.xdto-type-name':index?'common.index-field':grouped?'common.metadata-command-group':ownerForm?'common.owner-or-common-form-link':documentChoiceForm?'common.document-choice-form':contextualFormStorage?'common.form-settings-storage-link':typeForm?(p.defaultValueXMLRaw===''?'common.type-form-link-with-empty':'common.type-form-link'):explicitForm?'common.metadata-form-link':directAllowedPaths?'common.metadata-allowed-direct-link':explicitRootMember?'common.metadata-member-path':ownMember?'common.owner-member-link':ownBooleanAttribute?'common.owner-attribute-link':numerator?'common.document-numerator-link':dataTableLink?'common.metadata-data-table-link':genericRootLink?'common.metadata-item-link-roots':(unrestrictedObjectTarget && p.type==='MetadataItemLink')?'common.metadata-object-link':typeLink?'common.type-link':typeDescription?'common.type-description':metadataValue?'common.metadata-value':metadataFields?(target?.owner==='this'?'common.owner-metadata-fields':'common.metadata-fields'):functionalOptions?'common.functional-options-property':childSubsystemNames?'common.child-subsystem-names':userVisible?'common.user-visible':p.type==='ChoiceParameterLinks'?'common.choice-parameter-links':p.type==='ChoiceParameters'?'common.choice-parameters':documentList?'common.journal-document-links':multiRootLinks?'common.metadata-item-links-allowed-roots':genericRootLinks?'common.metadata-item-links-roots':(unrestrictedObjectTarget && p.type==='MetadataItemLinks')?'common.metadata-object-link-list':basedOn?'common.based-on-links':contextualMemberList?'common.contextual-member-links':ownerOrMemberList?'common.metadata-item-links':explicitMemberList?'common.metadata-member-links':null) ?? (p.type === 'SystemEnumeration' ? `system.${p.typeSE}` : text ? (formatted?'common.formatted-i8n-text':'common.i8n-text') : minMax ? (p.typedXML==='xs:string'?'common.min-max-value-text':'common.min-max-value') : fields ? (p.fieldsListXMLItem==='xr:Field'?'common.fields-list-readable':'common.fields-list') : null);
  const genericFallback=explicitId==null && genericReusable;
  const id=explicitId ?? (genericFallback?genericId:null);
  if (!id || !catalog.has(id)) return fail('unsupported-common');
  if(genericFallback && yamlPathAddressing)parameterEquivalences.push({parameter:'configurationIndexAddressing',equivalentTo:'yamlPath',via:genericId});
  if(metadataValue && !catalog.get(id).inputs?.onlyStringType)return fail('metadata-value-contract');
  let implicitValue=p.implicitValueYAML;
  if(p.type==='boolean' && typeof implicitValue==='string') {
    const matches=(catalog.get(id).representations?.yaml?.values??[]).filter(row=>row.literal===implicitValue && typeof row.value==='boolean');
    if(matches.length!==1)return fail('boolean-yaml-default-profile');
    implicitValue=matches[0].value;
  }
  // A literal fallback equal to the implicit meaning adds no new behavior:
  // the same ordinary presence rule handles both directions. Other fallbacks
  // stay blocked until their distinct import/export contract is established.
  const scalarFallback=simple.has(p.type) && Object.hasOwn(p,'defaultValue') &&
    Object.hasOwn(p,'implicitValueYAML') && !p.noImplicitValueYAML &&
    p.defaultValue===implicitValue &&
    ['string','boolean','number'].includes(typeof p.defaultValue) &&
    !['defaultValueXMLRaw','implicitValueXML'].some(key=>Object.hasOwn(p,key)) &&
    (!Object.hasOwn(p,'defaultValueXML') || p.defaultValueXML===p.defaultValue);
  if(scalarFallback)parameterEquivalences.push({parameter:'defaultValue',equivalentTo:'implicit-scalar-meaning',via:id});
  const required=Object.hasOwn(p,'required') && (simple.has(p.type) || p.type==='SystemEnumeration' || typeDescription || genericRootLink || ownMember || (unrestrictedObjectTarget && p.type==='MetadataItemLink'));
  if(required && (p.required!==true || ['defaultValueXML','defaultValueXMLRaw','implicitValueYAML','implicitValueXML'].some(key=>Object.hasOwn(p,key))))return fail('required-default-profile');
  const inheritedPresence=(catalog.get(id).presence??[]).find(rule=>rule.target==='self');
  if(required && inheritedPresence && (Object.keys(inheritedPresence).some(key=>!['target','xml','yaml'].includes(key)) || ['xml','yaml'].some(format=>inheritedPresence[format] && JSON.stringify(inheritedPresence[format])!==JSON.stringify({missing:{denotes:{absent:true}}}))))return fail('required-common-presence-profile');
  const allowed = new Set([...commonKeys, ...(required?['required']:[]), ...(explicitDefault?['preserveExplicitDefaultXML']:[]), ...(implicitXML ? ['implicitValueXML'] : []), ...(p.type === 'SystemEnumeration' ? ['typeSE'] : []),
    ...(scalarFallback || declaredMissingDefault?['defaultValue']:[]),
    ...(Object.hasOwn(p,'ownerFactRole')?['ownerFactRole']:[]),
    ...(genericFallback && yamlPathAddressing?['configurationIndexAddressing']:[]),
    ...(declaredSequenceDefaults?['preserveExplicitDefaultXML','defaultValueXMLRaw','defaultValue','defaultValueXMLEmpty']:[]),
    ...(emptyStringXMLDefault?['defaultValueXMLEmpty']:[]),
    ...(metadataValue?['exportNilValue']:[]),
    ...(dcs?['valueType','typeSE','exportNilValue']:[]),
    ...(p.type === 'string' || text || minMax || fields || list || index || reference || basedOn || explicitMemberList || ownerOrMemberList || contextualMemberList || multiRootEmptyDefaults || referenceCollectionEmpty || unrestrictedEmptyDefault || unrestrictedRawEmptyParent || unrestrictedRawEmptyList ? ['defaultValueXMLRaw'] : []),
    ...(minMax || date || (unrestrictedObjectTarget && p.type==='MetadataItemLink') ? ['typedXML'] : []),
    ...bounds,...(conditionalMaximum?['maximumWhen']:[]),
    ...(purposes?['defaultValue','evaluateWhenYAMLMissing']:[]),
    ...(emptyMappingDefault?['defaultValueXMLRaw','evaluateWhenYAMLMissing']:[]),
    ...(formEmptyDefaults || ownMemberEmptyDefaults?['defaultValue']:[]),
    ...(metadataFieldsEmptyDefaults || unrestrictedEmptyCollection || formEmptyDefaults || ownMemberEmptyDefaults?['defaultValue','defaultValueXMLEmpty']:[]),
    ...(fields ? ['fieldsListXMLItem'] : []),
    ...(index ? ['preserveExplicitDefaultXML'] : []),
    ...((reference || linkList) && !typeDescription ? ['metadataTarget'] : []),
    ...(typeDescription ? ['addTypeDescriptionAttributeToXML','declareTypeNamespaceXML','allowedTypes','preserveEmptyXML','defaultValueXMLEmpty','runtimeOnly'] : []),
    ...(text ? ['preserveEmptyXML','excludeIfEqualNameYAML','skipEmptyToXML','typedXML','defaultValueXMLEmpty'] : [])]);
  const unknown = Object.keys(p).filter(key => !allowed.has(key));
  if (unknown.length) return fail(`unsupported-parameters:${unknown.join(',')}`);
  if(unrestrictedObjectTarget && Object.hasOwn(p,'typedXML') && (p.type!=='MetadataItemLink' || p.typedXML!=='xr:MDObjectRef'))return fail('object-link-typed-xml-profile');
  if(typeDescription) {
    if(Object.hasOwn(p,'addTypeDescriptionAttributeToXML') && p.addTypeDescriptionAttributeToXML!==true)return fail('type-description-attribute-profile');
    if(Object.hasOwn(p,'preserveEmptyXML') && p.preserveEmptyXML!==true)return fail('type-description-empty-profile');
    const policy=p.declareTypeNamespaceXML;
    if(Object.hasOwn(p,'declareTypeNamespaceXML') && policy!==true && !(Array.isArray(policy) && policy.length>0 && policy.every(prefix=>prefix==='dcsset')))return fail('type-description-namespace-profile');
    if(Object.hasOwn(p,'allowedTypes') && JSON.stringify(p.allowedTypes)!==JSON.stringify(METADATA_ATTRIBUTE_TYPE_DESCRIPTION_TYPES))return fail('type-description-allowed-profile');
    if(Object.hasOwn(p,'defaultValueXMLEmpty') && JSON.stringify(p.defaultValueXMLEmpty)!==JSON.stringify({type:[]}))return fail('type-description-empty-default-profile');
  }
  if (typeof p.yaml !== 'string' || !p.yaml) return fail('explicit-yaml-name-required');
  const xml = runtimeOnly ? undefined : p.xml ?? property.name[0].toUpperCase() + property.name.slice(1);
  const parents = runtimeOnly ? [] : p.xmlParents ?? [];
  const attribute=typeof xml==='string' && /^_(?:[A-Za-z][A-Za-z0-9]*:)?[A-Za-z][A-Za-z0-9]*$/.test(xml)?xml.slice(1):undefined;
  if (!Array.isArray(parents) || [...parents,...(attribute?[]:xml?[xml]:[])].some(part => typeof part !== 'string' || !/^(?:[A-Za-z][A-Za-z0-9]*:)?[A-Za-z][A-Za-z0-9]*$/.test(part))) return fail('xml-path-profile');
  const namespaces={};
  if(metadataStringDefault) {
    namespaces.xs='http://www.w3.org/2001/XMLSchema';
    namespaces.xsi='http://www.w3.org/2001/XMLSchema-instance';
  }
  for(const part of [...parents,...(attribute?[attribute]:xml?[xml]:[])].filter(part=>part.includes(':'))) {
    const prefix=part.split(':')[0];
    if(typeof xmlNamespaces[prefix]!=='string' || !xmlNamespaces[prefix])return fail(`unknown-xml-prefix:${prefix}`);
    namespaces[prefix]=xmlNamespaces[prefix];
  }
  if (Object.hasOwn(p,'noImplicitValueYAML') && p.noImplicitValueYAML !== true) return fail('no-implicit-profile');
  if (p.noImplicitValueYAML && Object.hasOwn(p,'implicitValueYAML')) return fail('conflicting-defaults');
  if (minMax && Object.hasOwn(p,'defaultValueXMLRaw') && !nilDefault) return fail('raw-default-profile');
  if (fields && (Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'defaultValueXML'))) return fail('collection-default-profile');
  const emptyTypeDescriptionRaw=typeDescription && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0;
  if (Object.hasOwn(p,'defaultValueXMLRaw') && p.defaultValueXMLRaw !== '' && !nilDefault && !metadataNilDefault && !metadataStringDefault && !metadataFieldsDefault && !rawEmptyList && !indexDefault && !basedOnDefault && !explicitMemberDefault && !multiRootEmptyDefaults && !referenceCollectionEmpty && !unrestrictedRawEmptyParent && !emptyTypeDescriptionRaw && !emptyObjectTextDefault && !emptyMappingDefault) return fail('raw-default-profile');
  if (!list && !purposes && !date && !xmlOnlyDefault && !emptyStringDefault && !emptyReferenceDefault && Object.hasOwn(p,'defaultValueXML') && (!Object.hasOwn(p,'implicitValueYAML') || p.defaultValueXML !== implicitValue)) return fail('asymmetric-defaults');
  if (text && !emptyTextDefault && (Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'defaultValueXML'))) return fail('text-default-needs-expression');
  if (p.defaultValueXMLRaw === '' && Object.hasOwn(p,'implicitValueYAML') && p.implicitValueYAML !== '') return fail('asymmetric-raw-default');
  const hasDefault = xmlOnlyDefault || (!list && !emptyTextDefault && !formEmptyDefaults && !ownMemberEmptyDefaults && !p.noImplicitValueYAML && ((Object.hasOwn(p,'implicitValueYAML') && !ineffectiveRecordDefault) || (p.type === 'string' && p.defaultValueXMLRaw === '')));
  const defaultValue = Object.hasOwn(p,'implicitValueYAML') ? implicitValue : xmlOnlyDefault ? p.defaultValueXML : '';
  if (hasDefault) {
    const expected = choiceDefault ? typeof p.implicitValueYAML : p.type === 'SystemEnumeration' ? 'string' : p.type;
    if (typeof defaultValue !== expected) return fail('default-type');
    if (typeof defaultValue === 'number' && !Number.isSafeInteger(defaultValue)) return fail('exact-number-source-required');
    if (p.type === 'SystemEnumeration' && !Object.hasOwn(catalog.get(id).enum ?? {}, defaultValue)) return fail('unknown-enum-default');
  }
  const lifted=(grouped || reference || linkList || genericFallback)?commonInputs(catalog.get(id)):undefined;
  const type = {use:'value',...(lifted?{bind:lifted.bind}:{})};
  if(picture && p.defaultValueXMLRaw==='')type.with={allowEmpty:true};
  if(metadataValue && (metadataNilDefault || p.exportNilValue===true))type.with={exportNilValue:true};
  if(unrestrictedObjectTarget && p.typedXML==='xr:MDObjectRef')type.with={typedXML:true};
  if(typeDescription && (p.addTypeDescriptionAttributeToXML===true || Object.hasOwn(p,'allowedTypes')))type.with={
    ...(p.addTypeDescriptionAttributeToXML===true?{addTypeDescriptionAttributeToXML:true}:{}),
    ...(Object.hasOwn(p,'allowedTypes')?{metadataAttributeTypesOnly:true}:{}),
  };
  if (text) {
    const flags = ['preserveEmptyXML','excludeIfEqualNameYAML','skipEmptyToXML','typedXML'].filter(k => Object.hasOwn(p,k));
    if (flags.some(k => typeof p[k] !== 'boolean')) return fail('text-parameter-type');
    if (flags.length) type.with = Object.fromEntries(flags.map(k => [k,p[k]]));
    type.bind = Object.fromEntries(Object.keys(textInputs).map(k => [formatted ? ({registeredLanguages:'languages',ownerName:'name'}[k] ?? k) : k,{input:k}]));
  }
  const mapped = {status:'candidate', id, type, ...(p.tag?{sourceTag:p.tag}:{}), ...(parameterEquivalences.length?{parameterEquivalences}:{}), ...((Object.hasOwn(p,'toEnterprise') || Object.hasOwn(p,'description'))?{excludedParameters:[...(Object.hasOwn(p,'toEnterprise')?['toEnterprise']:[]),...(Object.hasOwn(p,'description')?['description']:[])]}:{}), path:runtimeOnly?[]:childSubsystemNames?parents:[...parents,...(attribute?[]:[xml])], ...(attribute?{attribute}:{}), ...(runtimeOnly?{yamlOnly:true}:{}), key:p.yaml, inputs:lifted?.inputs ?? (text ? textInputs : {}), ...(lifted?{imports:lifted.imports}:{}),
    presence:declaredSequenceDefaults ? {target:{field:property.name},xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{absent:true}}]},yaml:{missing:{denotes:{absent:true}}}} : (reference || emptyMappingDefault) && !metadataValue ? {target:{field:property.name},xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{absent:true}}],...((p.defaultValueXMLRaw==='' || metadataFieldsDefault || emptyMappingDefault)?{canonical:[{when:{not:{present:{field:property.name}}},form:'empty-element'}]}:{})},yaml:{missing:{denotes:{absent:true}},...(catalog.get(id).representations?.yaml?.kind==='text-pattern' && inheritedPresence?.yaml?.empty?{empty:structuredClone(inheritedPresence.yaml.empty)}:{})}} : indexDefault ? {target:{field:property.name},xml:{canonical:[{when:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}},form:'empty-element'},{form:'ordinary'}]}} : (metadataValue || formatted || qname || index || grouped || linkList || scalarChoice || purposes) ? undefined : list ? {target:{field:property.name},
      xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}]},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}}}} : {target:{field:property.name}, xml:{missing:{denotes:{absent:true}},
      ...(((text || fields) && p.defaultValueXMLRaw === '') || emptyObjectTextDefault || nilDefault ? {canonical:[{when:{not:{present:{field:property.name}}},form:nilDefault?'nil':'empty-element'}]} : {})},
      ...((text || fields) && !p.noImplicitValueYAML ? {} : {yaml:hasDefault ? {default:{literal:defaultValue}} : {missing:{denotes:{absent:true}}}})}};
  if(emptyMappingDefault)mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
    {parameter:'defaultValueXMLRaw',equivalentTo:'empty-element',via:id},
    {parameter:'evaluateWhenYAMLMissing',equivalentTo:'canonical-empty-when-absent',via:id},
  ];
  if(declaredMissingDefault) {
    mapped.presence=liftSelfPresence(commonPresence,property.name);
    mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
      {parameter:'defaultValue',equivalentTo:'declared-missing-value',via:id}];
  }
  // An unconfigured collection inherits its common presence contract. A
  // synthetic owner-level absence would erase the common empty/default rules.
  if(genericFallback && plainDeclaredCommon && !emptyMappingDefault && genericCommon.value?.kind==='sequence' && inheritedPresence)
    delete mapped.presence;
  if(genericFallback && genericCommon.representations?.xml?.kind==='element-sequence') {
    const ownPath=genericCommon.representations.xml.path??[];
    const qualified=(name,namespaces)=>{
      const parts=name.split(':');
      return parts.length===2 ? `${namespaces?.[parts[0]]}:${parts[1]}` : name;
    };
    if(ownPath.length && ownPath.length<=mapped.path.length && ownPath.every((part,index)=>
      qualified(part,genericCommon.namespaces)===qualified(mapped.path[mapped.path.length-ownPath.length+index],xmlNamespaces)))
      mapped.path=mapped.path.slice(0,-ownPath.length);
  }
  if(typeForm) {
    mapped.type.bind.typeItems={get:{of:{field:'type'},field:'items'}};
    delete mapped.inputs.typeItems;
    mapped.indexProviders={roots:'metadata.roots',forms:'metadata.forms'};
  }
  if(dataTableLink) {
    mapped.type.bind.allowedRoots={sequence:target.roots.map(root=>({literal:root}))};
    delete mapped.inputs.allowedRoots;
  }
  if(genericRootLink || genericRootLinks) {
    mapped.type.bind.allowedRoot={literal:target.roots[0]};
    delete mapped.inputs.allowedRoot;
  }
  if(basedOn)mapped.indexProviders={roots:'metadata.roots',children:'metadata.children'};
  if(multiRootLinks) {
    mapped.type.bind.allowedRoots={sequence:target.roots.map(root=>({literal:root}))};
    delete mapped.inputs.allowedRoots;
    mapped.indexProviders={roots:'metadata.roots'};
  }
  if(unrestrictedObjectTarget || ownerForm)mapped.indexProviders={roots:'metadata.roots'};
  if(documentChoiceForm) {
    mapped.indexProviders={roots:'metadata.roots',formTargets:'metadata.forms'};
    // This pattern spells Document literally; its owner slot is the name only.
    mapped.type.bind.owner={input:'containingOwnerName'};
    mapped.inputs.containingOwnerName=mapped.inputs.owner;
    delete mapped.inputs.owner;
  }
  if(contextualFormStorage)mapped.indexProviders={roots:'metadata.roots',formTargets:'metadata.forms'};
  if(directAllowedPaths) {
    mapped.type.bind.allowedObjectRoots={sequence:target.allowedObjectPaths.map(([root])=>({literal:root}))};
    mapped.type.bind.allowedMemberPaths={sequence:target.allowedMemberPaths.map(([root,kind])=>({record:{root:{literal:root},kind:{literal:kind}}}))};
    mapped.type.bind.allowOwner={literal:target.allowOwner===true};
    delete mapped.inputs.allowedObjectRoots;
    delete mapped.inputs.allowedMemberPaths;
    delete mapped.inputs.allowOwner;
  }
  if(ownMember) {
    mapped.type.bind.memberKind={literal:target.memberKinds[0]};
    delete mapped.inputs.memberKind;
    if(target.roots) {
      mapped.type.bind.ownerRoot={literal:target.roots[0]};
      delete mapped.inputs.ownerRoot;
    }
  }
  if(dcs) {
    mapped.indexProviders=dcs.indexProviders;
    if(dcs.outerNullable) {
      mapped.presence.xml.empty=[{form:'nil',denotes:{absent:true}}];
      mapped.presence.yaml.empty=[{form:'null',denotes:{absent:true}}];
    }
    if(p.exportNilValue===true)mapped.presence.xml.canonical=[
      {when:{not:{present:{field:property.name}}},form:'nil'},{form:'ordinary'},
    ];

  }
  if(indexedCommon)mapped.indexProviders=providedCommon
    ? Object.fromEntries(indexInputs.map(([name])=>[name,declaredProviders[name]]))
    : {[indexInputs[0][0]]:targetProfile.index};
  if(reference && p.metadataTarget?.kind==='member' && p.metadataTarget.owner==='this' && mapped.inputs?.ownerName) {
    mapped.inputs.containingOwnerName=mapped.inputs.ownerName;
    delete mapped.inputs.ownerName;
    mapped.type.bind.ownerName={input:'containingOwnerName'};
  }
  if(contextualMemberList && mapped.inputs?.ownerName) {
    mapped.inputs.containingOwnerName=mapped.inputs.ownerName;
    delete mapped.inputs.ownerName;
    mapped.type.bind.ownerName={input:'containingOwnerName'};
  }
  if(metadataValue && ownerContext.hasTypeSibling===false && metadataNilDefault) {
    const standalone=catalog.get('common.standalone-metadata-value-profile');
    const rule=standalone?.presence?.find(row=>row.target?.field==='value');
    if(!rule)return fail('standalone-metadata-value-profile');
    mapped.type.bind.onlyStringType={literal:false};
    delete mapped.inputs.onlyStringType;
    mapped.presence=instantiateFieldProfile(rule,{value:property.name});
  } else if(metadataValue) {
    const profile=catalog.get('common.fill-value-profile');
    const defaultRule=profile?.presence?.find(rule=>rule.target?.field==='value');
    if(!defaultRule)return fail('fill-value-default-profile');
    mapped.presence=instantiateFieldProfile(defaultRule,{value:property.name,type:'type'});
    Object.assign(namespaces,profile.namespaces??{});
    mapped.inputs.definedTypes=structuredClone(catalog.get('common.fill-value-compatibility')?.inputs?.definedTypes ?? {type:{kind:'index',key:{kind:'scalar',scalar:'text'},value:{kind:'sequence',item:{kind:'scalar',scalar:'text'}}}});
    mapped.indexProviders={definedTypes:'metadata.defined-type-alternatives'};
    mapped.siblingExpressions={onlyStringType:{source:'type',sourceId:'common.type-description',value:{and:[
      {present:{field:'type'}},
      {one:{in:{get:{of:{field:'type'},field:'items'}},as:'item',where:{literal:true}}},
      {exists:{in:{get:{of:{field:'type'},field:'items'}},as:'item',where:{matches:{value:{get:{of:{var:'item'},field:'value'}},pattern:'Строка|ФиксированнаяСтрока'}}}},
    ]}}};
    const items={get:{of:{field:'type'},field:'items'}};
    mapped.ownerConstraints={use:'common.fill-value-compatibility',bindings:{
      definedTypes:{input:'definedTypes'},
      typeItems:items,
      textValue:{isVariant:{value:{field:property.name},variant:'text'}},
      numberValue:{isVariant:{value:{field:property.name},variant:'decimal'}},
      booleanValue:{isVariant:{value:{field:property.name},variant:'boolean'}},
      calendarValue:{isVariant:{value:{field:property.name},variant:'calendar'}},
      referenceValue:{isVariant:{value:{field:property.name},variant:'reference'}},
      referenceContent:{variantText:{value:{field:property.name},variant:'reference'}},
      textContent:{variantValue:{value:{field:property.name},variant:'text'}},
      stringLength:{get:{of:{field:'type'},field:'stringLength'}},
      stringAllowedLength:{get:{of:{field:'type'},field:'stringAllowedLength'}},
      calendarContent:{variantValue:{value:{field:property.name},variant:'calendar'}},
      dateFractions:{get:{of:{field:'type'},field:'dateFractions'}},
      decimalContent:{variantValue:{value:{field:property.name},variant:'decimal'}},
      numberDigits:{get:{of:{field:'type'},field:'numberDigits'}},
      numberFractionDigits:{get:{of:{field:'type'},field:'numberFractionDigits'}},
      numberAllowedSign:{get:{of:{field:'type'},field:'numberAllowedSign'}},
    }};
  }
  if(Object.hasOwn(p,'ownerFactRole')) {
    if(typeof p.ownerFactRole!=='string' || !p.ownerFactRole)return fail('owner-fact-role-profile');
    mapped.ownerFactRole=p.ownerFactRole;
  }
  if(hasDefault && !Object.hasOwn(p,'defaultValueXML') && !Object.hasOwn(p,'defaultValueXMLRaw'))mapped.presence.xml={missing:{denotes:{literal:defaultValue}},canonical:[{when:{eq:[{field:property.name},{literal:defaultValue}]},form:'missing'}]};
  if(choiceDefault && genericFallback) {
    const selected={isVariant:{value:{field:property.name},variant:choiceDefault.variant.name}};
    const payload={variantValue:{value:{field:property.name},variant:choiceDefault.variant.name}};
    mapped.presence={target:{field:property.name},
      xml:{missing:{denotes:choiceDefault},canonical:[{when:{and:[selected,{eq:[payload,{literal:defaultValue}]}]},form:'missing'},{form:'ordinary'}]},
      yaml:{missing:{denotes:choiceDefault},omitWhen:{and:[selected,{eq:[payload,{literal:defaultValue}]}]}}};
  }
  if(explicitDefault && hasDefault)mapped.presence.yaml={missing:{denotes:{literal:defaultValue}}};
  if(implicitXML)mapped.presence.xml={missing:{denotes:{literal:p.implicitValueXML}},canonical:[{when:{eq:[{field:property.name},{literal:p.implicitValueXML}]},form:'missing'}]};
  if(typeDescription) {
    // The payload declaration owns an explicit empty collection of types.
    // A declared empty XML default may still canonicalize it to absence.
    if(!Object.hasOwn(p,'defaultValueXMLRaw') || Object.hasOwn(p,'defaultValueXMLEmpty'))
      delete mapped.presence.xml.empty;
    if(emptyTypeDescriptionRaw)mapped.presence.xml.canonical=[
      {when:{not:{present:{field:property.name}}},form:'empty-element'},{form:'ordinary'},
    ];
  }
  if(adoptedEmptyTypeDescription) {
    mapped.presence.yaml.missing={denotes:{
      if:{eq:[{input:'xmlDefaultVariant'},{literal:'adopted'}]},
      then:emptyTypeDescription(),
      else:{absent:true},
    }};
    mapped.inputs={...(mapped.inputs??{}),xmlDefaultVariant:{type:{kind:'scalar',scalar:'text'}}};
  }
  if(profiles.some(profile=>profile.kind==='xml-explicit-in-adopted')) {
    if(!mapped.presence?.xml)return fail('xml-explicit-in-adopted-profile');
    mapped.inputs={...(mapped.inputs??{}),xmlDefaultVariant:{type:{kind:'scalar',scalar:'text'}}};
    mapped.presence.xml.canonical=[
      {when:{and:[{eq:[{input:'xmlDefaultVariant'},{literal:'adopted'}]},
        {not:{present:{field:property.name}}}]},form:'missing'},
      ...(mapped.presence.xml.canonical??[]),
      {form:'ordinary'},
    ];
  }
  if(Object.keys(namespaces).length)mapped.namespaces=namespaces;
  if(emptyTextDefault)mapped.presence.yaml={missing:{denotes:{absent:true}},omitWhen:{or:[
    {not:{present:{field:property.name}}},
    {eq:[{field:property.name},{sequence:[{record:{language:{input:'defaultLanguage'},content:{literal:''}}}]}]},
  ]}};
  if(date && Object.hasOwn(p,'defaultValueXML')) {
    const denotes={literal:p.defaultValueXML};
    mapped.presence={target:{field:property.name},xml:{missing:{denotes}},yaml:{missing:{denotes},omitWhen:{eq:[{field:property.name},denotes]}}};
  }
  if(purposeDefault) {
    const denotes={sequence:p.defaultValue.$constantFunction.value.map(value=>({literal:value}))};
    mapped.presence={target:{field:property.name},xml:{missing:{denotes},empty:[{form:'empty-element',denotes}]},yaml:{missing:{denotes},omitWhen:{eq:[{field:property.name},denotes]}}};
  }
  if(bounds.length)mapped.constraints=bounds.map(bound=>({id:`${property.name}-${bound}`,appliesTo:['xml-import','yaml-validation'],when:{present:{field:property.name}},assert:{lte:bound==='minimum'?[{literal:p[bound]},{field:property.name}]:[{field:property.name},{literal:p[bound]}]},diagnostic:{code:`number.${bound}`,severity:'error',at:{field:property.name},message:`Значение ${bound==='minimum'?'не меньше':'не больше'} ${p[bound]}`}}));
  if(conditionalMaximum)mapped.constraints=[...(mapped.constraints??[]),{
    id:property.name+'-conditional-maximum',appliesTo:['xml-import','yaml-validation'],
    when:{and:[{present:{field:property.name}},
      {eq:[{field:conditionalMaximum.propertyKey},{literal:conditionalMaximum.equals}]}]},
    assert:{lte:[{field:property.name},{literal:conditionalMaximum.maximum}]},
    diagnostic:{code:'number.maximum',severity:'error',at:{field:property.name},
      message:'Значение не больше '+conditionalMaximum.maximum},
  }];
  if(typeDescription && Object.hasOwn(p,'declareTypeNamespaceXML'))mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),{parameter:'declareTypeNamespaceXML',equivalentTo:'canonical-owner-namespace-declarations',via:'common.type-description'}];
  if(required)mapped.constraints=[...(mapped.constraints??[]),{
    id:`${property.name}-required`,appliesTo:['xml-import','yaml-validation'],assert:{present:{field:property.name}},
    diagnostic:{code:'value.required',severity:'warning',at:{field:property.name},message:'Обязательное значение отсутствует'},
  }];
  if(explicitRootMember)mapped.constraints=[...(mapped.constraints??[]),
    ...[['root',target.objectRoots[0],'metadata.root-kind'],['kind',target.memberKinds[0],'metadata.member-kind']]
      .map(([field,value,code])=>({id:`${property.name}-${field}`,appliesTo:['xml-import','yaml-validation'],
        when:{present:{field:property.name}},
        assert:{eq:[{get:{of:{field:property.name},field}},{literal:value}]},
        diagnostic:{code,severity:'error',at:{field:property.name},message:'Недопустимый вид ссылки'}})),
  ];
  for(const profile of profiles) {
    if(profile.sharedSource) {
      const {path,line,column}=property.parameters[profile.parameter].$unresolved.source;
      mapped.sharedOrigin=`${path}#expression:${line}:${column}`;
    }
    if(profile.kind==='xml-when-property-present' && !mapped.presence?.xml && linkList) {
      const selfPresence=(catalog.get(id).presence??[]).find(row=>row.target==='self');
      if(selfPresence?.xml?.canonical?.some(row=>row.form==='missing'
        && JSON.stringify(row.when)==='{"not":{"present":{"self":true}}}')) {
        mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
          {parameter:profile.parameter,equivalentTo:'declared-property-presence',via:id}];
        continue;
      }
      if(selfPresence?.xml)mapped.presence=liftSelfPresence(selfPresence,property.name);
    }
    // A collection's implicit presence remains its source of truth. Lift it
    // only when an enclosing predicate needs to add a canonical condition.
    if(!mapped.presence?.xml && inheritedPresence?.xml &&
       ['xml-when-property-present','xml-when-input-equals'].includes(profile.kind))
      mapped.presence=liftSelfPresence(inheritedPresence,property.name);
    if((!mapped.presence?.xml && ['xml-when-property-present','xml-when-input-equals'].includes(profile.kind)) ||
      (!mapped.presence?.yaml && profile.kind==='yaml-default-when-input-equals'))return fail('common-presence-profile-composition');
    if(profile.kind==='xml-when-property-present' || profile.kind==='xml-when-input-equals') {
      const sourceField=profile.sourceField && ownerContext.properties?.find(row=>row.name===profile.sourceField);
      if(profile.sourceField && ownerContext.properties && sourceField?.parameters?.type!==profile.sourceType)
        return fail('condition-sibling-source-required');
      const targetField=profile.property??property.name;
      if(profile.kind==='xml-when-property-present' && targetField!==property.name &&
         !ownerContext.properties?.some(row=>row.name===targetField))return fail('condition-sibling-source-required');
      const sourceValue=sourceField?{if:{present:{field:sourceField.name}},then:{field:sourceField.name},else:{literal:profile.value}}:{input:profile.input};
      const alternatives=(profile.values??[profile.value]).map(value=>({eq:[sourceValue,{literal:value}]}));
      const condition=profile.kind==='xml-when-property-present' ? {present:{field:targetField}} :
        alternatives.length===1?alternatives[0]:{or:alternatives};
      const fallback=profile.kind==='xml-when-property-present' ? [] : (mapped.presence.xml.canonical??[]);
      mapped.presence.xml.canonical=[{when:{not:condition},form:'missing'},...fallback];
      if(profile.kind==='xml-when-input-equals' && !sourceField)mapped.inputs={...(mapped.inputs??{}),[profile.input]:{type:{kind:'scalar',scalar:'text'}}};
    } else if(profile.kind==='xml-dependent-adopted-default') {
      if(profile.property!==property.name || !mapped.presence?.xml || !hasDefault)
        return fail('dependent-adopted-default-profile');
      const conditions=[];
      for(const condition of profile.conditions??[]) {
        const sibling=ownerContext.properties?.find(row=>row.name===condition.field);
        const declaration=catalog.get(sibling?.parameters?.type==='SystemEnumeration'
          ? 'system.'+sibling.parameters.typeSE : ownerContext.fieldViews?.[condition.field]?.semantic);
        const matches=Object.entries(declaration?.enum??{}).filter(([,yaml])=>yaml===condition.yamlEquals);
        if(!declaration?.enum||matches.length!==1)
          return fail('dependent-default-sibling-representation');
        conditions.push({and:[{present:{field:condition.field}},
          {eq:[{field:condition.field},{literal:matches[0][0]}]}]});
      }
      const dependencies={or:[...(profile.dependencies??[]).map(name=>({present:{field:name}})),...conditions]};
      const missing={and:[{input:'adopted'},{not:{present:{field:property.name}}},{not:dependencies}]};
      mapped.inputs={...(mapped.inputs??{}),adopted:{type:{kind:'scalar',scalar:'boolean'}}};
      mapped.presence.xml.canonical=[{when:missing,form:'missing'},
        {when:{input:'adopted'},form:'ordinary'},...(mapped.presence.xml.canonical??[{form:'ordinary'}])];
      mapped.presence.yaml={missing:{denotes:{if:{input:'adopted'},
        then:{if:dependencies,then:{literal:defaultValue},else:{absent:true}},else:{literal:defaultValue}}},
        omitWhen:{and:[{not:{input:'adopted'}},{eq:[{field:property.name},{literal:defaultValue}]}]}};
    } else if(profile.kind==='yaml-default-when-input-equals') {
      mapped.presence.yaml.missing={denotes:{if:{eq:[{input:profile.input},{literal:profile.value}]},then:emptyTypeDescription(),else:{absent:true}}};
      mapped.inputs={...(mapped.inputs??{}),[profile.input]:{type:{kind:'scalar',scalar:'text'}}};
    } else if(profile.kind==='i8n-owner-name-default') {
      if(p.type!=='I8nText' || p.excludeIfEqualNameYAML!==true)return fail('i8n-owner-name-default-profile');
      if(profile.xmlMissing)mapped.presence.xml.missing={denotes:structuredClone(profile.xmlMissing)};
      mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
        {parameter:profile.parameter,equivalentTo:'owner-name-shorthand',via:'common.i8n-text'}];
    } else if(profile.kind==='value-declaration') {
      mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
        {parameter:profile.parameter,equivalentTo:'declared-value-representation',via:profile.id}];
    }
  }
  // Declared records honor paired XML nil / YAML null. Other YAML empty
  // and omit expressions still need a sequence backend before emission.
  const common=catalog.get(id);
  const itemId=common?.value?.kind==='sequence' && common.value.item?.use
    ? common.imports?.[common.value.item.use] : undefined;
  const declaredRecordCollection=itemId && catalog.get(itemId)?.value?.kind==='record' &&
    ['sequence','record-mapping'].includes(common.representations?.yaml?.kind);
  const supportedCollectionNull=mapped.presence?.xml?.empty?.some(form=>form.form==='nil' && form.denotes?.absent===true)
    && JSON.stringify(mapped.presence?.yaml?.empty)==='[{"form":"null","denotes":{"absent":true}}]';
  if(declaredRecordCollection && mapped.presence && (
    mapped.presence.yaml?.empty?.length && !supportedCollectionNull || mapped.presence.yaml?.omitWhen
  ))return fail('declared-collection-presence-backend');
  if(emptyTextXMLDefault)mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-sequence',via:'common.i8n-text'}];
  return mapped;
}
