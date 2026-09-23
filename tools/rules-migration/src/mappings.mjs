import {mapIdentity} from './identity-property.mjs';
import { commonInputs } from './common-inputs.mjs';
import { reviewedPropertyExpression } from './reviewed-property-expressions.mjs';
const simple = new Map([['boolean','common.boolean'], ['string','common.string'], ['number','common.exact-decimal']]);
const lists = new Map([['WebSocketClientHeaders','common.web-socket-client-headers'],['XDTOPackages','common.xdto-packages']]);
const basedOnPaths=[['ChartOfAccounts'],['ExternalDataSource','Table'],['ExchangePlan'],['Catalog'],['Document'],['ChartOfCharacteristicTypes'],['BusinessProcess'],['ChartOfCalculationTypes'],['Task']];
const indexedTargetProfiles=[{root:'StyleItem',filter:'styleItemType',index:'metadata.style-item-types'}];
const commonKeys = ['tag','type','yaml','xml','xmlParents','defaultValueXML','implicitValueYAML','noImplicitValueYAML','toEnterprise','defaultValueAdoptedXML'];
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
export function mapProperty(property, catalog, xmlNamespaces={}) {
  let p = property.parameters, fail = reason => ({status:'blocked', reason});
  const profiles=[];
  if(property.status!=='static-parameters' && p && typeof p==='object' && !Array.isArray(p)) {
    for(const parameter of ['toXML','defaultValue']) {
      if(!Object.hasOwn(p,parameter))continue;
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
  if(Object.hasOwn(p,'toEnterprise') && p.toEnterprise !== false)return fail('excluded-enterprise-profile');
  if(Object.hasOwn(p,'tag') && (typeof p.tag!=='string' || !p.tag))return fail('source-tag-profile');
  const platform=value=>Array.isArray(value) && value.length===1 && value[0]==='PlatformApplication';
  const purposes=p.type==='UsePurposes';
  const purposeDefault=purposes && property.constantDefaults?.includes('defaultValue') && platform(p.defaultValue?.$constantFunction?.value);
  const plainPurposes=purposes && Object.keys(p).every(key=>['type','yaml','xml','xmlParents','tag','toEnterprise'].includes(key));
  if(purposes && !plainPurposes && (!purposeDefault || (Object.hasOwn(p,'defaultValueXML') ? !platform(p.defaultValueXML) : p.evaluateWhenYAMLMissing!==true) || (Object.hasOwn(p,'evaluateWhenYAMLMissing') && p.evaluateWhenYAMLMissing!==true)))return fail('use-purposes-default-profile');
  const parameterEquivalences=[];
  const adoptedEmptyTypeDescription=p.type==='TypeDescription'
    && JSON.stringify(p.defaultValueAdoptedXML)===JSON.stringify({type:[]});
  const emptyStringDefault=p.type==='string' && p.defaultValueXML==='' && p.defaultValueXMLRaw==='' && !p.noImplicitValueYAML && (!Object.hasOwn(p,'implicitValueYAML') || p.implicitValueYAML==='');
  if(emptyStringDefault)parameterEquivalences.push({parameter:'defaultValueXML',equivalentTo:'defaultValueXMLRaw',via:'common.string'});
  if(Object.hasOwn(p,'defaultValueAdoptedXML')) {
    const ordinary=Object.hasOwn(p,'defaultValueXML')?'defaultValueXML':'defaultValueXMLRaw';
    const equalScalar=p[ordinary]===p.defaultValueAdoptedXML && ['string','number','boolean'].includes(typeof p[ordinary]);
    const equalPurposes=purposes && ordinary==='defaultValueXML' && platform(p[ordinary]) && platform(p.defaultValueAdoptedXML);
    if(!adoptedEmptyTypeDescription) {
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
  const genericId=typeof p.type==='string' && /^[A-Z][A-Za-z0-9]*$/.test(p.type)
    ? `common.${p.type.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}` : undefined;
  const genericCommon=genericId && catalog.get(genericId);
  const indexInputs=Object.entries(genericCommon?.inputs??{}).filter(([,input])=>input.type?.kind==='index');
  const targetProfile=indexedTargetProfiles.find(profile=>target?.kind==='object' &&
    JSON.stringify(target.roots)===JSON.stringify([profile.root]) &&
    JSON.stringify(target.filters)===JSON.stringify([{kind:profile.filter,values:[p.type]}]));
  const indexedCommon=genericCommon && indexInputs.length===1 && Object.keys(genericCommon.inputs).length===1 && targetProfile;
  const genericReusable=indexedCommon;
  // A scalar cannot equal a YAML mapping or the source record by identity.
  // Such a legacy implicitValueYAML neither omits an imported value nor supplies
  // a value on YAML import without implicitValueXML.
  const ineffectiveRecordDefault=indexedCommon && genericCommon.value?.kind==='record'
    && genericCommon.representations?.yaml?.kind==='mapping'
    && Object.hasOwn(p,'implicitValueYAML') && p.implicitValueYAML!==null
    && typeof p.implicitValueYAML!=='object' && !Object.hasOwn(p,'implicitValueXML');
  if(ineffectiveRecordDefault)parameterEquivalences.push({parameter:'implicitValueYAML',equivalentTo:'ineffective-scalar-default-for-record',via:genericId});
  const ownerForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this' && JSON.stringify(target.memberKinds)==='["Form"]' && JSON.stringify(target.objectRoots)==='["CommonForm"]' && Object.keys(target).every(key=>['kind','owner','memberKinds','objectRoots'].includes(key));
  const typeForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='type' && target.typeProperty==='type' && JSON.stringify(target.memberKinds)==='["Form"]' && Object.keys(target).every(key=>['kind','owner','typeProperty','memberKinds'].includes(key));
  const explicitForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='explicit' && JSON.stringify(target.memberKinds)==='["Form"]' && Object.keys(target).every(key=>['kind','owner','memberKinds'].includes(key));
  const ownBooleanAttribute=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this' && JSON.stringify(target.memberKinds)==='["Attribute"]' && JSON.stringify(target.filters)===JSON.stringify([{kind:'directMember'},{kind:'hasType',type:'boolean'}]) && Object.keys(target).every(key=>['kind','owner','memberKinds','filters'].includes(key));
  const numerator=p.type==='MetadataItemLink' && target?.kind==='object' && JSON.stringify(target.roots)==='["DocumentNumerator"]' && Object.keys(target).every(key=>['kind','roots'].includes(key));
  const documentList=p.type==='MetadataItemLinks' && target?.kind==='object' && JSON.stringify(target.roots)==='["Document"]' && Object.keys(target).every(key=>['kind','roots'].includes(key));
  const basedOn=p.type==='MetadataItemLinks' && target?.kind==='object' && JSON.stringify(target.allowedObjectPaths)===JSON.stringify(basedOnPaths) && Object.keys(target).every(key=>['kind','allowedObjectPaths'].includes(key));
  const basedOnDefault=basedOn && (p.defaultValueXMLRaw==='' || (p.defaultValueXMLRaw && typeof p.defaultValueXMLRaw==='object' && !Array.isArray(p.defaultValueXMLRaw) && Object.keys(p.defaultValueXMLRaw).length===0));
  if(basedOn && !basedOnDefault)return fail('based-on-default-profile');
  const linkList=documentList || basedOn;
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
  const reference=ownerForm || typeForm || explicitForm || ownBooleanAttribute || numerator || typeLink || typeDescription || choiceValue || metadataValue || metadataFields || functionalOptions || childSubsystemNames || userVisible || indexedCommon;
  if(reference && (Object.hasOwn(p,'defaultValueXML') || (Object.hasOwn(p,'implicitValueYAML') && !ineffectiveRecordDefault) || Object.hasOwn(p,'noImplicitValueYAML')))return fail('form-default-profile');
  const grouped = p.type === 'MetadataCommandGroup';
  const scalarChoice=p.type==='StringOrNumber';
  const qname = p.type === 'XDTOTypeName';
  const formatted = p.type === 'FormattedI8nText';
  const text = p.type === 'I8nText' || formatted;
  const emptyTextXMLDefault=text && JSON.stringify(p.defaultValueXMLEmpty)===JSON.stringify({items:{}});
  if(text && Object.hasOwn(p,'defaultValueXMLEmpty') && !emptyTextXMLDefault)return fail('text-empty-default-profile');
  const emptyTextDefault=p.type==='I8nText' && p.implicitValueYAML==='' && p.defaultValueXMLRaw==='' && !Object.hasOwn(p,'defaultValueXML') && !['preserveEmptyXML','excludeIfEqualNameYAML','skipEmptyToXML','typedXML'].some(key=>p[key]===true);
  if((formatted || qname || grouped || linkList || scalarChoice || purposes) && Object.keys(p).some(key=>!['tag','type','yaml','xml','xmlParents','toEnterprise',...(linkList?['metadataTarget']:[]),...(basedOn?['defaultValueXMLRaw']:[]),...(purposes?['defaultValue','defaultValueXML','defaultValueAdoptedXML','evaluateWhenYAMLMissing']:[])].includes(key)))return fail('record-parameter-profile');
  const date=p.type==='dateTime';
  if(date && ((Object.hasOwn(p,'typedXML') && p.typedXML!==true) || ['implicitValueYAML','noImplicitValueYAML','defaultValueXMLRaw'].some(key=>Object.hasOwn(p,key)) || (Object.hasOwn(p,'defaultValueXML') && p.defaultValueXML!=='0001-01-01T00:00:00')))return fail('calendar-default-profile');
  const minMax = p.type === 'MinMaxValue';
  const bounds=p.type==='number'?['minimum','maximum'].filter(key=>Object.hasOwn(p,key)):[];
  if(bounds.some(key=>!Number.isSafeInteger(p[key])) || (bounds.length===2 && p.minimum>p.maximum))return fail('numeric-bounds-profile');
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
  const id = declaredValue?.id ?? simple.get(p.type) ?? list ?? (date?(p.typedXML?'common.typed-date-time':'common.date-time'):null) ?? (purposes?'common.use-purposes':scalarChoice?'common.string-or-number':qname?'common.xdto-type-name':index?'common.index-field':grouped?'common.metadata-command-group':ownerForm?'common.owner-or-common-form-link':(typeForm||explicitForm)?'common.metadata-form-link':ownBooleanAttribute?'common.owner-attribute-link':numerator?'common.document-numerator-link':typeLink?'common.type-link':typeDescription?'common.type-description':metadataValue?'common.metadata-value':metadataFields?(target?.owner==='this'?'common.owner-metadata-fields':'common.metadata-fields'):functionalOptions?'common.functional-options-property':childSubsystemNames?'common.child-subsystem-names':userVisible?'common.user-visible':p.type==='ChoiceParameterLinks'?'common.choice-parameter-links':p.type==='ChoiceParameters'?'common.choice-parameters':documentList?'common.journal-document-links':basedOn?'common.based-on-links':null) ?? (p.type === 'SystemEnumeration' ? `system.${p.typeSE}` : text ? (formatted?'common.formatted-i8n-text':'common.i8n-text') : minMax ? (p.typedXML==='xs:string'?'common.min-max-value-text':'common.min-max-value') : fields ? (p.fieldsListXMLItem==='xr:Field'?'common.fields-list-readable':'common.fields-list') : genericReusable ? genericId : null);
  if (!id || !catalog.has(id)) return fail('unsupported-common');
  if(metadataValue && !catalog.get(id).inputs?.onlyStringType)return fail('metadata-value-contract');
  let implicitValue=p.implicitValueYAML;
  if(p.type==='boolean' && typeof implicitValue==='string') {
    const matches=(catalog.get(id).representations?.yaml?.values??[]).filter(row=>row.literal===implicitValue && typeof row.value==='boolean');
    if(matches.length!==1)return fail('boolean-yaml-default-profile');
    implicitValue=matches[0].value;
  }
  const required=Object.hasOwn(p,'required') && (simple.has(p.type) || p.type==='SystemEnumeration' || typeDescription);
  if(required && (p.required!==true || ['defaultValueXML','defaultValueXMLRaw','implicitValueYAML','implicitValueXML'].some(key=>Object.hasOwn(p,key))))return fail('required-default-profile');
  const inheritedPresence=(catalog.get(id).presence??[]).find(rule=>rule.target==='self');
  if(required && inheritedPresence && (Object.keys(inheritedPresence).some(key=>!['target','xml','yaml'].includes(key)) || ['xml','yaml'].some(format=>inheritedPresence[format] && JSON.stringify(inheritedPresence[format])!==JSON.stringify({missing:{denotes:{absent:true}}}))))return fail('required-common-presence-profile');
  const allowed = new Set([...commonKeys, ...(required?['required']:[]), ...(explicitDefault?['preserveExplicitDefaultXML']:[]), ...(implicitXML ? ['implicitValueXML'] : []), ...(p.type === 'SystemEnumeration' ? ['typeSE'] : []),
    ...(Object.hasOwn(p,'ownerFactRole')?['ownerFactRole']:[]),
    ...(metadataValue?['exportNilValue']:[]),
    ...(p.type === 'string' || text || minMax || fields || list || index || reference || basedOn ? ['defaultValueXMLRaw'] : []),
    ...(minMax || date ? ['typedXML'] : []),
    ...bounds,
    ...(purposes?['defaultValue','evaluateWhenYAMLMissing']:[]),
    ...(metadataFieldsEmptyDefaults?['defaultValue','defaultValueXMLEmpty']:[]),
    ...(fields ? ['fieldsListXMLItem'] : []),
    ...(index ? ['preserveExplicitDefaultXML'] : []),
    ...((reference || linkList) && !typeDescription ? ['metadataTarget'] : []),
    ...(typeDescription ? ['addTypeDescriptionAttributeToXML','declareTypeNamespaceXML','allowedTypes','preserveEmptyXML','defaultValueXMLEmpty','runtimeOnly'] : []),
    ...(text ? ['preserveEmptyXML','excludeIfEqualNameYAML','skipEmptyToXML','typedXML','defaultValueXMLEmpty'] : [])]);
  const unknown = Object.keys(p).filter(key => !allowed.has(key));
  if (unknown.length) return fail(`unsupported-parameters:${unknown.join(',')}`);
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
  const attribute=typeof xml==='string' && /^_[A-Za-z][A-Za-z0-9]*$/.test(xml)?xml.slice(1):undefined;
  if (!Array.isArray(parents) || [...parents,...(attribute?[]:xml?[xml]:[])].some(part => typeof part !== 'string' || !/^(?:[A-Za-z][A-Za-z0-9]*:)?[A-Za-z][A-Za-z0-9]*$/.test(part))) return fail('xml-path-profile');
  const namespaces={};
  if(metadataStringDefault) {
    namespaces.xs='http://www.w3.org/2001/XMLSchema';
    namespaces.xsi='http://www.w3.org/2001/XMLSchema-instance';
  }
  for(const part of [...parents,...(attribute?[]:xml?[xml]:[])].filter(part=>part.includes(':'))) {
    const prefix=part.split(':')[0];
    if(typeof xmlNamespaces[prefix]!=='string' || !xmlNamespaces[prefix])return fail(`unknown-xml-prefix:${prefix}`);
    namespaces[prefix]=xmlNamespaces[prefix];
  }
  if (Object.hasOwn(p,'noImplicitValueYAML') && p.noImplicitValueYAML !== true) return fail('no-implicit-profile');
  if (p.noImplicitValueYAML && Object.hasOwn(p,'implicitValueYAML')) return fail('conflicting-defaults');
  if (minMax && Object.hasOwn(p,'defaultValueXMLRaw') && !nilDefault) return fail('raw-default-profile');
  if (fields && (Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'defaultValueXML'))) return fail('collection-default-profile');
  const emptyTypeDescriptionRaw=typeDescription && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0;
  if (Object.hasOwn(p,'defaultValueXMLRaw') && p.defaultValueXMLRaw !== '' && !nilDefault && !metadataNilDefault && !metadataStringDefault && !metadataFieldsDefault && !rawEmptyList && !indexDefault && !basedOnDefault && !emptyTypeDescriptionRaw) return fail('raw-default-profile');
  if (!list && !purposes && !date && !xmlOnlyDefault && !emptyStringDefault && Object.hasOwn(p,'defaultValueXML') && (!Object.hasOwn(p,'implicitValueYAML') || p.defaultValueXML !== implicitValue)) return fail('asymmetric-defaults');
  if (text && !emptyTextDefault && (Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'defaultValueXML'))) return fail('text-default-needs-expression');
  if (p.defaultValueXMLRaw === '' && Object.hasOwn(p,'implicitValueYAML') && p.implicitValueYAML !== '') return fail('asymmetric-raw-default');
  const hasDefault = xmlOnlyDefault || (!list && !emptyTextDefault && !p.noImplicitValueYAML && ((Object.hasOwn(p,'implicitValueYAML') && !ineffectiveRecordDefault) || (p.type === 'string' && p.defaultValueXMLRaw === '')));
  const defaultValue = Object.hasOwn(p,'implicitValueYAML') ? implicitValue : xmlOnlyDefault ? p.defaultValueXML : '';
  if (hasDefault) {
    const expected = p.type === 'SystemEnumeration' ? 'string' : p.type;
    if (typeof defaultValue !== expected) return fail('default-type');
    if (p.type === 'number' && !Number.isSafeInteger(defaultValue)) return fail('exact-number-source-required');
    if (p.type === 'SystemEnumeration' && !Object.hasOwn(catalog.get(id).enum ?? {}, defaultValue)) return fail('unknown-enum-default');
  }
  const lifted=(grouped || reference || linkList)?commonInputs(catalog.get(id)):undefined;
  const type = {use:'value',...(lifted?{bind:lifted.bind}:{})};
  if(metadataValue && (metadataNilDefault || p.exportNilValue===true))type.with={exportNilValue:true};
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
  const mapped = {status:'candidate', id, type, ...(p.tag?{sourceTag:p.tag}:{}), ...(parameterEquivalences.length?{parameterEquivalences}:{}), ...(Object.hasOwn(p,'toEnterprise')?{excludedParameters:['toEnterprise']}:{}), path:runtimeOnly?[]:childSubsystemNames?parents:[...parents,...(attribute?[]:[xml])], ...(attribute?{attribute}:{}), ...(runtimeOnly?{yamlOnly:true}:{}), key:p.yaml, inputs:lifted?.inputs ?? (text ? textInputs : {}), ...(lifted?{imports:lifted.imports}:{}),
    presence:reference && !metadataValue ? {target:{field:property.name},xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{absent:true}}],...((p.defaultValueXMLRaw==='' || metadataFieldsDefault)?{canonical:[{when:{not:{present:{field:property.name}}},form:'empty-element'}]}:{})},yaml:{missing:{denotes:{absent:true}}}} : indexDefault ? {target:{field:property.name},xml:{canonical:[{when:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}},form:'empty-element'},{form:'ordinary'}]}} : (metadataValue || formatted || qname || index || grouped || linkList || scalarChoice || purposes) ? undefined : list ? {target:{field:property.name},
      xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}]},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}}}} : {target:{field:property.name}, xml:{missing:{denotes:{absent:true}},
      ...(((text || fields) && p.defaultValueXMLRaw === '') || nilDefault ? {canonical:[{when:{not:{present:{field:property.name}}},form:nilDefault?'nil':'empty-element'}]} : {})},
      ...((text || fields) && !p.noImplicitValueYAML ? {} : {yaml:hasDefault ? {default:{literal:defaultValue}} : {missing:{denotes:{absent:true}}}})}};
  if(indexedCommon)mapped.indexProviders={[indexInputs[0][0]]:targetProfile.index};
  if(reference && p.metadataTarget?.kind==='member' && p.metadataTarget.owner==='this' && mapped.inputs?.ownerName) {
    mapped.inputs.containingOwnerName=mapped.inputs.ownerName;
    delete mapped.inputs.ownerName;
    mapped.type.bind.ownerName={input:'containingOwnerName'};
  }
  if(metadataValue) {
    const profile=catalog.get('common.fill-value-profile');
    const defaultRule=profile?.presence?.find(rule=>rule.target?.field==='value');
    if(!defaultRule)return fail('fill-value-default-profile');
    mapped.presence=instantiateFieldProfile(defaultRule,{value:property.name,type:'type'});
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
  if(explicitDefault && hasDefault)mapped.presence.yaml={missing:{denotes:{literal:defaultValue}}};
  if(implicitXML)mapped.presence.xml={missing:{denotes:{literal:p.implicitValueXML}},canonical:[{when:{eq:[{field:property.name},{literal:p.implicitValueXML}]},form:'missing'}]};
  if(typeDescription && (emptyTypeDescriptionRaw || Object.hasOwn(p,'defaultValueXMLEmpty'))) {
    if(Object.hasOwn(p,'defaultValueXMLEmpty'))delete mapped.presence.xml.empty;
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
  if(typeDescription && Object.hasOwn(p,'declareTypeNamespaceXML'))mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),{parameter:'declareTypeNamespaceXML',equivalentTo:'canonical-owner-namespace-declarations',via:'common.type-description'}];
  if(required)mapped.constraints=[...(mapped.constraints??[]),{
    id:`${property.name}-required`,appliesTo:['xml-import','yaml-validation'],assert:{present:{field:property.name}},
    diagnostic:{code:'value.required',severity:'warning',at:{field:property.name},message:'Обязательное значение отсутствует'},
  }];
  for(const profile of profiles) {
    if((!mapped.presence?.xml && ['xml-when-property-present','xml-when-input-equals'].includes(profile.kind)) ||
      (!mapped.presence?.yaml && profile.kind==='yaml-default-when-input-equals'))return fail('common-presence-profile-composition');
    if(profile.kind==='xml-when-property-present' || profile.kind==='xml-when-input-equals') {
      const condition=profile.kind==='xml-when-property-present' ? {present:{field:property.name}} : {eq:[{input:profile.input},{literal:profile.value}]};
      const fallback=profile.kind==='xml-when-property-present' ? [] : (mapped.presence.xml.canonical??[]);
      mapped.presence.xml.canonical=[{when:{not:condition},form:'missing'},...fallback];
      if(profile.kind==='xml-when-input-equals')mapped.inputs={...(mapped.inputs??{}),[profile.input]:{type:{kind:'scalar',scalar:'text'}}};
    } else if(profile.kind==='yaml-default-when-input-equals') {
      mapped.presence.yaml.missing={denotes:{if:{eq:[{input:profile.input},{literal:profile.value}]},then:emptyTypeDescription(),else:{absent:true}}};
      mapped.inputs={...(mapped.inputs??{}),[profile.input]:{type:{kind:'scalar',scalar:'text'}}};
    } else if(profile.kind==='i8n-owner-name-default') {
      if(p.type!=='I8nText' || p.excludeIfEqualNameYAML!==true)return fail('i8n-owner-name-default-profile');
      mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
        {parameter:profile.parameter,equivalentTo:'owner-name-shorthand',via:'common.i8n-text'}];
    } else if(profile.kind==='value-declaration') {
      mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
        {parameter:profile.parameter,equivalentTo:'declared-value-representation',via:profile.id}];
    }
  }
  // Declared records now honor owner XML empty and canonical forms. YAML
  // empty/omit expressions still need a sequence backend before emission.
  const common=catalog.get(id);
  const itemId=common?.value?.kind==='sequence' && common.value.item?.use
    ? common.imports?.[common.value.item.use] : undefined;
  const declaredRecordCollection=itemId && catalog.get(itemId)?.value?.kind==='record' &&
    ['sequence','record-mapping'].includes(common.representations?.yaml?.kind);
  if(declaredRecordCollection && mapped.presence && (
    mapped.presence.yaml?.empty?.length || mapped.presence.yaml?.omitWhen
  ))return fail('declared-collection-presence-backend');
  if(emptyTextXMLDefault)mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-sequence',via:'common.i8n-text'}];
  return mapped;
}
