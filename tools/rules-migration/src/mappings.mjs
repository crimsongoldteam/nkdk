import {mapIdentity} from './identity-property.mjs';
import { commonInputs } from './common-inputs.mjs';
import { reviewedPropertyExpression } from './reviewed-property-expressions.mjs';
const simple = new Map([['boolean','common.boolean'], ['string','common.string'], ['number','common.exact-decimal']]);
const lists = new Map([['WebSocketClientHeaders','common.web-socket-client-headers'],['XDTOPackages','common.xdto-packages']]);
const basedOnPaths=[['ChartOfAccounts'],['ExternalDataSource','Table'],['ExchangePlan'],['Catalog'],['Document'],['ChartOfCharacteristicTypes'],['BusinessProcess'],['ChartOfCalculationTypes'],['Task']];
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
  const ownerForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='this' && JSON.stringify(target.memberKinds)==='["Form"]' && JSON.stringify(target.objectRoots)==='["CommonForm"]' && Object.keys(target).every(key=>['kind','owner','memberKinds','objectRoots'].includes(key));
  const typeForm=p.type==='MetadataItemLink' && target?.kind==='member' && target.owner==='type' && target.typeProperty==='type' && JSON.stringify(target.memberKinds)==='["Form"]' && Object.keys(target).every(key=>['kind','owner','typeProperty','memberKinds'].includes(key));
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
  const metadataValue=p.type==='MetadataValue';
  const metadataNilDefault=metadataValue && p.defaultValueXMLRaw &&
    !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' &&
    Object.keys(p.defaultValueXMLRaw).length===1 && p.defaultValueXMLRaw['_xsi:nil']===true;
  const metadataStringDefault=metadataValue && p.defaultValueXMLRaw &&
    !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' &&
    Object.keys(p.defaultValueXMLRaw).length===1 && p.defaultValueXMLRaw['_xsi:type']==='xs:string';
  if(metadataValue && Object.hasOwn(p,'exportNilValue') &&
    (typeof p.exportNilValue!=='boolean' || p.exportNilValue!==metadataNilDefault))return fail('metadata-value-profile');
  if(metadataValue && !metadataNilDefault && !metadataStringDefault)return fail('metadata-value-profile');
  if(metadataStringDefault)return fail('metadata-value-typed-empty-profile');
  const runtimeOnly=p.runtimeOnly===true;
  if(Object.hasOwn(p,'runtimeOnly') && !runtimeOnly)return fail('runtime-only-profile');
  if(runtimeOnly && (!typeDescription || ['xml','xmlParents','defaultValueXML','defaultValueXMLRaw','defaultValueAdoptedXML'].some(key=>Object.hasOwn(p,key))))return fail('runtime-only-profile');
  if(typeLink && Object.hasOwn(p,'metadataTarget'))return fail('type-link-target-profile');
  const reference=ownerForm || typeForm || ownBooleanAttribute || numerator || typeLink || typeDescription || choiceValue || metadataValue;
  if(reference && (Object.hasOwn(p,'defaultValueXML') || Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'noImplicitValueYAML')))return fail('form-default-profile');
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
  const id = simple.get(p.type) ?? list ?? (date?(p.typedXML?'common.typed-date-time':'common.date-time'):null) ?? (purposes?'common.use-purposes':scalarChoice?'common.string-or-number':qname?'common.xdto-type-name':index?'common.index-field':grouped?'common.metadata-command-group':ownerForm?'common.owner-or-common-form-link':typeForm?'common.metadata-form-link':ownBooleanAttribute?'common.owner-attribute-link':numerator?'common.document-numerator-link':typeLink?'common.type-link':typeDescription?'common.type-description':metadataValue?'common.metadata-value':p.type==='ChoiceParameterLinks'?'common.choice-parameter-links':p.type==='ChoiceParameters'?'common.choice-parameters':documentList?'common.journal-document-links':basedOn?'common.based-on-links':null) ?? (p.type === 'SystemEnumeration' ? `system.${p.typeSE}` : text ? (formatted?'common.formatted-i8n-text':'common.i8n-text') : minMax ? (p.typedXML==='xs:string'?'common.min-max-value-text':'common.min-max-value') : fields ? (p.fieldsListXMLItem==='xr:Field'?'common.fields-list-readable':'common.fields-list') : null);
  if (!id || !catalog.has(id)) return fail('unsupported-common');
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
  if (!Array.isArray(parents) || [...parents,...(xml?[xml]:[])].some(part => typeof part !== 'string' || !/^(?:[A-Za-z][A-Za-z0-9]*:)?[A-Za-z][A-Za-z0-9]*$/.test(part))) return fail('xml-path-profile');
  const namespaces={};
  for(const part of [...parents,...(xml?[xml]:[])].filter(part=>part.includes(':'))) {
    const prefix=part.split(':')[0];
    if(typeof xmlNamespaces[prefix]!=='string' || !xmlNamespaces[prefix])return fail(`unknown-xml-prefix:${prefix}`);
    namespaces[prefix]=xmlNamespaces[prefix];
  }
  if (Object.hasOwn(p,'noImplicitValueYAML') && p.noImplicitValueYAML !== true) return fail('no-implicit-profile');
  if (p.noImplicitValueYAML && Object.hasOwn(p,'implicitValueYAML')) return fail('conflicting-defaults');
  if (minMax && Object.hasOwn(p,'defaultValueXMLRaw') && !nilDefault) return fail('raw-default-profile');
  if (fields && (Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'defaultValueXML'))) return fail('collection-default-profile');
  const emptyTypeDescriptionRaw=typeDescription && p.defaultValueXMLRaw && !Array.isArray(p.defaultValueXMLRaw) && typeof p.defaultValueXMLRaw==='object' && Object.keys(p.defaultValueXMLRaw).length===0;
  if (Object.hasOwn(p,'defaultValueXMLRaw') && p.defaultValueXMLRaw !== '' && !nilDefault && !metadataNilDefault && !metadataStringDefault && !rawEmptyList && !indexDefault && !basedOnDefault && !emptyTypeDescriptionRaw) return fail('raw-default-profile');
  if (!list && !purposes && !date && !xmlOnlyDefault && !emptyStringDefault && Object.hasOwn(p,'defaultValueXML') && (!Object.hasOwn(p,'implicitValueYAML') || p.defaultValueXML !== implicitValue)) return fail('asymmetric-defaults');
  if (text && !emptyTextDefault && (Object.hasOwn(p,'implicitValueYAML') || Object.hasOwn(p,'defaultValueXML'))) return fail('text-default-needs-expression');
  if (p.defaultValueXMLRaw === '' && Object.hasOwn(p,'implicitValueYAML') && p.implicitValueYAML !== '') return fail('asymmetric-raw-default');
  const hasDefault = xmlOnlyDefault || (!list && !emptyTextDefault && !p.noImplicitValueYAML && (Object.hasOwn(p,'implicitValueYAML') || (p.type === 'string' && p.defaultValueXMLRaw === '')));
  const defaultValue = Object.hasOwn(p,'implicitValueYAML') ? implicitValue : xmlOnlyDefault ? p.defaultValueXML : '';
  if (hasDefault) {
    const expected = p.type === 'SystemEnumeration' ? 'string' : p.type;
    if (typeof defaultValue !== expected) return fail('default-type');
    if (p.type === 'number' && !Number.isSafeInteger(defaultValue)) return fail('exact-number-source-required');
    if (p.type === 'SystemEnumeration' && !Object.hasOwn(catalog.get(id).enum ?? {}, defaultValue)) return fail('unknown-enum-default');
  }
  const lifted=(grouped || reference || linkList)?commonInputs(catalog.get(id)):undefined;
  const type = {use:'value',...(lifted?{bind:lifted.bind}:{})};
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
  const mapped = {status:'candidate', id, type, ...(p.tag?{sourceTag:p.tag}:{}), ...(parameterEquivalences.length?{parameterEquivalences}:{}), ...(Object.hasOwn(p,'toEnterprise')?{excludedParameters:['toEnterprise']}:{}), path:runtimeOnly?[]:[...parents,xml], ...(runtimeOnly?{yamlOnly:true}:{}), key:p.yaml, inputs:lifted?.inputs ?? (text ? textInputs : {}), ...(lifted?{imports:lifted.imports}:{}),
    presence:reference ? {target:{field:property.name},xml:{missing:{denotes:{absent:true}},empty:[{form:'empty-element',denotes:{absent:true}}],...(p.defaultValueXMLRaw===''?{canonical:[{when:{not:{present:{field:property.name}}},form:'empty-element'}]}:{})},yaml:{missing:{denotes:{absent:true}}}} : indexDefault ? {target:{field:property.name},xml:{canonical:[{when:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}},form:'empty-element'},{form:'ordinary'}]}} : (formatted || qname || index || grouped || linkList || scalarChoice || purposes) ? undefined : list ? {target:{field:property.name},
      xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}]},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:property.name},as:'row',where:{literal:true}}}}}} : {target:{field:property.name}, xml:{missing:{denotes:{absent:true}},
      ...(((text || fields) && p.defaultValueXMLRaw === '') || nilDefault ? {canonical:[{when:{not:{present:{field:property.name}}},form:nilDefault?'nil':'empty-element'}]} : {})},
      ...((text || fields) && !p.noImplicitValueYAML ? {} : {yaml:hasDefault ? {default:{literal:defaultValue}} : {missing:{denotes:{absent:true}}}})}};
  if(metadataValue && Object.hasOwn(lifted?.inputs??{},'valueType')) {
    mapped.siblingBindings={valueType:'type'};
  }
  if(metadataValue) {
    mapped.presence.xml.canonical=[
      {when:{not:{present:{field:property.name}}},form:metadataNilDefault?'nil':'empty-element'},
      {form:'ordinary'},
    ];
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
    }
  }
  if(emptyTextXMLDefault)mapped.parameterEquivalences=[...(mapped.parameterEquivalences??[]),
    {parameter:'defaultValueXMLEmpty',equivalentTo:'empty-sequence',via:'common.i8n-text'}];
  return mapped;
}
