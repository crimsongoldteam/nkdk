import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {yaml} from './candidate-catalog.mjs';
import {emitCandidates} from './emit.mjs';
import {allowedMetadataPaths} from './allowed-metadata-paths.mjs';

const entry='migration.metadata-item-links';
const typedItem=/<xr:Item\b[^>]*\bxsi:type="xr:MDObjectRef"[^>]*>([^<]+)<\/xr:Item>/g;
const typedOther=/<([\w:]+)\b[^>]*\bxsi:type="xr:MDObjectRef"[^>]*>([^<]+)<\/\1>/g;
const direct={format:'nkdk-declarations/1',kind:'object',id:'migration.metadata-direct-link',
  imports:{link:'common.metadata-item-link'},
  value:{kind:'record',fields:[{name:'link',type:{use:'link',with:{typedXML:true}}}]},
  representations:{xml:{kind:'record',fields:[{field:'link',path:['Root','Link']}]},
    yaml:{kind:'mapping',fields:[{field:'link',key:'Ссылка'}]}}};
const formIndex=yaml.load(readFileSync('rust/declarations/probes/metadata-form-index.yaml','utf8'));
const pathChildIndex={format:'nkdk-declarations/1',kind:'object',id:'migration.metadata-path-child-index',
  value:{kind:'record',fields:[
    {name:'parent',type:{kind:'scalar',scalar:'text'}},
    {name:'kind',type:{kind:'scalar',scalar:'text'}},
    {name:'name',type:{kind:'scalar',scalar:'text'}},
    {name:'identity',type:{kind:'scalar',scalar:'text'}},
  ]},
  representations:{xml:{kind:'record',fields:[
    {field:'parent',path:['Root','Parent']},{field:'kind',path:['Root','Kind']},
    {field:'name',path:['Root','Name']},{field:'identity',path:['Root','Identity']},
  ]},yaml:{kind:'mapping',fields:[
    {field:'parent',key:'parent'},{field:'kind',key:'kind'},
    {field:'name',key:'name'},{field:'identity',key:'identity'},
  ]}},
  contributions:[{index:'metadata.path-children',key:{record:{parent:{field:'parent'},kind:{field:'kind'},name:{field:'name'}}},value:{field:'identity'}}]};

export function metadataRefCases(catalog) {
  const probe=catalog.get(entry);
  if(!probe)throw new Error('Missing metadata-item-links probe');
  const paths=execFileSync('rg',['-l','xr:MDObjectRef','e2e/fixtures/xml/cf','e2e/fixtures/xml/cfe','-g','*.xml'],
    {encoding:'utf8'}).trim().split('\n').sort();
  const unique=new Map();
  const other=[];
  for(const path of paths) {
    const bytes=readFileSync(path);
    const source=bytes.toString('utf8');
    const sha256=createHash('sha256').update(bytes).digest('hex');
    for(const [,value] of source.matchAll(typedItem)) {
      if(!unique.has(value))unique.set(value,{path,sha256});
    }
    for(const [,tag,value] of source.matchAll(typedOther)) {
      if(tag!=='xr:Item')other.push({value,source:{path,sha256}});
    }
  }
  const cases=[...unique].map(([value,source],index)=>{
    return {
      id:`metadata-ref-e2e-${index}`,
      entry,
      xml:`<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Links><xr:Item xsi:type="xr:MDObjectRef">${value}</xr:Item></Links></Root>`,
      noRaw:true,
      source:[source],
    };
  });
  if(cases.length<50)throw new Error(`Only ${cases.length} unique e2e metadata links found`);
  for(const [index,{value,source}] of other.entries())cases.push({
    id:`metadata-ref-direct-e2e-${index}`,
    entry:direct.id,
    xml:`<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Link xsi:type="xr:MDObjectRef">${value}</Link></Root>`,
    noRaw:true,
    source:[source],
  });
  const role=catalog.get('migration.metadata-role-link');
  if(!role)throw new Error('Missing restricted role link probe');
  cases.push({id:'metadata-ref-wrong-role-root',entry:role.id,
    xml:'<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Link xsi:type="xr:MDObjectRef">Catalog.Контрагенты</Link></Root>',
    annotation:'Link: !xml/raw'});
  const owner={symbol:'MetadataTargetRootsProbe',path:'metadata-target-roots.xml',comparison:{status:'keys-match'},
    properties:[
      {name:'link',status:'static-parameters',source:{path:'metadata-target-roots.xml'},parameters:{type:'MetadataItemLink',yaml:'Ссылка',xml:'Link',xmlParents:['Properties'],metadataTarget:{kind:'object',roots:['Document']}}},
      {name:'links',status:'static-parameters',source:{path:'metadata-target-roots.xml'},parameters:{type:'MetadataItemLinks',yaml:'Ссылки',xml:'Links',xmlParents:['Properties'],metadataTarget:{kind:'object',roots:['Catalog']}}},
    ]};
  const emitted=emitCandidates([owner],catalog);
  if(emitted.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Metadata target roots were not emitted');
  const restricted=emitted.entries[0].projections[0]?.id;
  if(!restricted)throw new Error('Missing metadata target roots projection');
  const document=unique.get('Document.ДокументВсеСвойства');
  const catalogSource=unique.get('Catalog.СправочникПолный');
  if(!document || !catalogSource)throw new Error('Missing e2e metadata target roots');
  cases.push({id:'metadata-ref-owner-roots',entry:restricted,
    xml:'<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Link>Document.ДокументВсеСвойства</Link><Links><xr:Item xsi:type="xr:MDObjectRef">Catalog.СправочникПолный</xr:Item></Links></Properties>',
    noRaw:true,source:[document,catalogSource]});
  cases.push({id:'metadata-ref-owner-wrong-root',entry:restricted,
    xml:'<Properties><Link>Catalog.СправочникПолный</Link></Properties>',
    yaml:'Ссылка: !xml/invalid Справочник.СправочникПолный\n',source:[catalogSource]});
  cases.push({id:'metadata-ref-list-wrong-root',entry:restricted,
    xml:'<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Links><xr:Item xsi:type="xr:MDObjectRef">Document.ДокументВсеСвойства</xr:Item></Links></Properties>',
    yaml:'Ссылки: !xml/invalid\n  - Документ.ДокументВсеСвойства\n',source:[document]});
  const extracted=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
  const configuration=extracted.entries.find(entry=>entry.symbol==='MetadataConfigurationRules');
  if(!configuration)throw new Error('Missing configuration rules extraction');
  const defaults=emitCandidates([{...configuration,comparison:{status:'keys-match'},properties:configuration.properties.filter(property=>
    ['defaultInterface','defaultLanguage'].includes(property.name))}],catalog);
  if(defaults.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Configuration metadata links were not emitted');
  const defaultEntry=defaults.entries[0].projections[0]?.id;
  if(!defaultEntry)throw new Error('Missing configuration metadata link projection');
  const configurationPath='e2e/fixtures/xml/cf/Configuration.xml';
  const configurationSource={path:configurationPath,sha256:createHash('sha256').update(readFileSync(configurationPath)).digest('hex')};
  cases.push({id:'metadata-ref-configuration-defaults',entry:defaultEntry,
    xml:'<Properties><DefaultInterface/><DefaultLanguage>Language.Русский</DefaultLanguage></Properties>',
    noRaw:true,source:[configurationSource]});
  cases.push({id:'metadata-ref-configuration-required-missing',entry:defaultEntry,
    xml:'<Properties><DefaultInterface/></Properties>',
    annotation:'DefaultLanguage: !xml/raw',
    reverseYAML:'DefaultLanguage: !xml/raw\n  $xml: null\n',source:[configurationSource]});
  const documentRules=extracted.entries.find(entry=>entry.symbol==='MetadataDocumentRules');
  if(!documentRules)throw new Error('Missing document rules extraction');
  const registers=emitCandidates([{...documentRules,comparison:{status:'keys-match'},properties:documentRules.properties.filter(property=>
    property.name==='registerRecords')}],catalog);
  if(registers.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Document register links were not emitted');
  const registerEntry=registers.entries[0].projections[0]?.id;
  if(!registerEntry)throw new Error('Missing document register projection');
  const registerPath='e2e/fixtures/xml/cf/Documents/ДокументВсеСвойства.xml';
  const registerBytes=readFileSync(registerPath);
  const registerSource={path:registerPath,sha256:createHash('sha256').update(registerBytes).digest('hex')};
  const registerBlock=registerBytes.toString('utf8').match(/<RegisterRecords>([\s\S]*?)<\/RegisterRecords>/)?.[1];
  if(!registerBlock)throw new Error('Document fixture has no register records');
  const registerItems=[...registerBlock.matchAll(typedItem)].map(match=>match[1]);
  if(registerItems.length<4)throw new Error('Document fixture has too few register links');
  const chosen=[registerItems[0],registerItems.at(-1)];
  const xmlItems=chosen.map(value=>`<xr:Item xsi:type="xr:MDObjectRef">${value}</xr:Item>`).join('');
  const wrapped=body=>`<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${body}</Properties>`;
  const rootIndex=catalog.get('migration.metadata-root-index');
  if(!rootIndex)throw new Error('Missing metadata root index probe');
  const factSources=chosen.map((path,index)=>{
    const [kind,name]=path.split('.');
    return {entry:rootIndex.id,xml:`<Root><Kind>${kind}</Kind><Name>${name}</Name><Identity>register-${index}</Identity></Root>`};
  });
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Catalog</Kind><Name>СправочникСВладельцем</Name><Identity>other-root</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Role</Kind><Name>Администратор</Name><Identity>role-admin</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Role</Kind><Name>allext_ОсновнаяРоль</Name><Identity>extension-role</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Style</Kind><Name>СтильВсеСвойства</Name><Identity>main-style</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Document</Kind><Name>ДокументПоУмолчанию</Name><Identity>sequence-document-default</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Document</Kind><Name>ДокументВсеСвойства</Name><Identity>sequence-document-complete</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>InformationRegister</Kind><Name>РегистрСведений1</Name><Identity>sequence-register</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>ChartOfCalculationTypes</Kind><Name>ПланРасчетаВсеСвойстваExt</Name><Identity>base-calculation</Identity></Root>'});
  cases.push({id:'metadata-ref-document-registers',entry:registerEntry,
    xml:wrapped(`<RegisterRecords>${xmlItems}</RegisterRecords>`),
    yaml:`Движения:\n${chosen.map(value=>{
      const [kind,name]=value.split('.');
      const label=catalog.get('common.path-root').enum[kind];
      return `  - ${label}.${name}`;
    }).join('\n')}\n`,
    noRaw:true,factBindings:{roots:'metadata.roots'},source:[registerSource]});
  cases.push({id:'metadata-ref-document-empty-registers',entry:registerEntry,
    xml:wrapped('<RegisterRecords/>'),yaml:'',reverseYAML:'',
    noRaw:true,factBindings:{roots:'metadata.roots'},source:[registerSource]});
  cases.push({id:'metadata-ref-document-wrong-register-root',entry:registerEntry,
    xml:wrapped('<RegisterRecords><xr:Item xsi:type="xr:MDObjectRef">Catalog.СправочникСВладельцем</xr:Item></RegisterRecords>'),
    annotation:'Движения: !xml/invalid',factBindings:{roots:'metadata.roots'},source:[registerSource]});
  const unrestricted=emitCandidates([{...configuration,comparison:{status:'keys-match'},properties:configuration.properties.filter(property=>
    ['defaultRoles','defaultStyle'].includes(property.name))}],catalog);
  if(unrestricted.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Unrestricted configuration object links were not emitted');
  const unrestrictedEntry=unrestricted.entries[0].projections[0]?.id;
  if(!unrestrictedEntry)throw new Error('Missing unrestricted object-link projection');
  cases.push({id:'metadata-ref-configuration-object-links',entry:unrestrictedEntry,
    xml:'<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><DefaultRoles><xr:Item xsi:type="xr:MDObjectRef">Role.Администратор</xr:Item></DefaultRoles><DefaultStyle>Style.СтильВсеСвойства</DefaultStyle></Properties>',
    yaml:'ОсновныеРоли:\n  - Роль.Администратор\nОсновнойСтиль: Стиль.СтильВсеСвойства\n',
    noRaw:true,factBindings:{roots:'metadata.roots'},source:[configurationSource]});
  cases.push({id:'metadata-ref-configuration-missing-object',entry:unrestrictedEntry,
    xml:'<Properties><DefaultRoles/><DefaultStyle>Style.НеСуществует</DefaultStyle></Properties>',
    annotation:'ОсновнойСтиль: !xml/invalid Стиль.НеСуществует',factBindings:{roots:'metadata.roots'},source:[configurationSource]});
  const extension=extracted.entries.find(entry=>entry.symbol==='MetadataConfigurationExtensionRules');
  if(!extension)throw new Error('Missing extension configuration rules extraction');
  const extensionRoles=emitCandidates([{...extension,comparison:{status:'keys-match'},properties:extension.properties.filter(property=>
    property.name==='defaultRoles')}],catalog);
  if(extensionRoles.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Extension default roles were not emitted');
  const extensionEntry=extensionRoles.entries[0].projections[0]?.id;
  if(!extensionEntry)throw new Error('Missing extension default roles projection');
  const extensionPath='e2e/fixtures/xml/cfe/all-extension/Configuration.xml';
  const extensionSource={path:extensionPath,sha256:createHash('sha256').update(readFileSync(extensionPath)).digest('hex')};
  cases.push({id:'metadata-ref-extension-default-roles',entry:extensionEntry,
    xml:'<Properties xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><DefaultRoles><xr:Item xsi:type="xr:MDObjectRef">Role.allext_ОсновнаяРоль</xr:Item></DefaultRoles></Properties>',
    yaml:'ОсновныеРоли:\n  - Роль.allext_ОсновнаяРоль\n',noRaw:true,
    factBindings:{roots:'metadata.roots'},source:[extensionSource]});
  const sequence=extracted.entries.find(entry=>entry.symbol==='MetadataSequenceRules');
  if(!sequence)throw new Error('Missing sequence rules extraction');
  const sequenceLists=emitCandidates([{...sequence,comparison:{status:'keys-match'},properties:sequence.properties.filter(property=>
    ['documents','registerRecords'].includes(property.name))}],catalog);
  if(sequenceLists.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Sequence metadata links were not emitted');
  const sequenceEntry=sequenceLists.entries[0].projections[0]?.id;
  if(!sequenceEntry)throw new Error('Missing sequence object-link projection');
  for(const [name,body,yamlText] of [
    ['ПоследовательностьПоУмолчанию','<Documents><xr:Item xsi:type="xr:MDObjectRef">Document.ДокументПоУмолчанию</xr:Item></Documents><RegisterRecords/>','Документы:\n  - Документ.ДокументПоУмолчанию\n'],
    ['ПоследовательностьВсеПоля','<Documents><xr:Item xsi:type="xr:MDObjectRef">Document.ДокументВсеСвойства</xr:Item></Documents><RegisterRecords><xr:Item xsi:type="xr:MDObjectRef">InformationRegister.РегистрСведений1</xr:Item></RegisterRecords>','Документы:\n  - Документ.ДокументВсеСвойства\nДвижения:\n  - РегистрСведений.РегистрСведений1\n'],
  ]) {
    const path=`e2e/fixtures/xml/cf/Sequences/${name}.xml`;
    cases.push({id:`metadata-ref-sequence-${name}`,entry:sequenceEntry,xml:wrapped(body),yaml:yamlText,
      noRaw:true,factBindings:{roots:'metadata.roots'},source:[{path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}]});
  }
  const calculation=extracted.entries.find(entry=>entry.symbol==='MetadataChartOfCalculationTypesRules');
  if(!calculation)throw new Error('Missing calculation type rules extraction');
  const baseTypes=emitCandidates([{...calculation,comparison:{status:'keys-match'},properties:calculation.properties.filter(property=>
    property.name==='baseCalculationTypes')}],catalog);
  if(baseTypes.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Base calculation type links were not emitted');
  const baseEntry=baseTypes.entries[0].projections[0]?.id;
  if(!baseEntry)throw new Error('Missing base calculation type projection');
  const calculationPath='e2e/fixtures/xml/cfe/all-extension/ChartsOfCalculationTypes/ПланРасчетаВсеСвойстваExt.xml';
  cases.push({id:'metadata-ref-base-calculation-types',entry:baseEntry,
    xml:wrapped('<BaseCalculationTypes><xr:Item xsi:type="xr:MDObjectRef">ChartOfCalculationTypes.ПланРасчетаВсеСвойстваExt</xr:Item></BaseCalculationTypes>'),
    yaml:'БазовыеВидыРасчета:\n  - ПланВидовРасчета.ПланРасчетаВсеСвойстваExt\n',noRaw:true,
    factBindings:{roots:'metadata.roots'},source:[{path:calculationPath,sha256:createHash('sha256').update(readFileSync(calculationPath)).digest('hex')}]});
  const exchange=extracted.entries.find(entry=>entry.symbol==='ExchangePlanExtensionPropertyItemRules');
  if(!exchange)throw new Error('Missing exchange content rules extraction');
  const exchangeMetadata=emitCandidates([{...exchange,comparison:{status:'keys-match'},properties:exchange.properties.filter(property=>
    property.name==='metadata')}],catalog);
  if(exchangeMetadata.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Exchange content metadata link was not emitted');
  const exchangeEntry=exchangeMetadata.entries[0].projections[0]?.id;
  if(!exchangeEntry)throw new Error('Missing exchange content metadata projection');
  const exchangePath='e2e/fixtures/xml/cfe/all-extension/ExchangePlans/ПланОбменаВсеСвойства/Ext/Content.xml';
  cases.push({id:'metadata-ref-exchange-content',entry:exchangeEntry,
    xml:'<Metadata>Document.ДокументВсеСвойства</Metadata>',yaml:'metadata: Документ.ДокументВсеСвойства\n',noRaw:true,
    factBindings:{roots:'metadata.roots'},source:[{path:exchangePath,sha256:createHash('sha256').update(readFileSync(exchangePath)).digest('hex')}]});
  const cubeDimension=extracted.entries.find(entry=>entry.symbol==='MetadataExternalDataSourceCubeDimensionRules');
  if(!cubeDimension)throw new Error('Missing cube dimension rules extraction');
  const cubeLinks=emitCandidates([{...cubeDimension,comparison:{status:'keys-match'},properties:cubeDimension.properties.filter(property=>
    ['registerDimension','leadingRegisterData'].includes(property.name))}],catalog);
  if(cubeLinks.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Cube dimension links were not emitted');
  const cubeEntry=cubeLinks.entries[0].projections[0]?.id;
  if(!cubeEntry)throw new Error('Missing cube dimension links projection');
  const cubePath='e2e/fixtures/xml/cf/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml';
  const cubeSource={path:cubePath,sha256:createHash('sha256').update(readFileSync(cubePath)).digest('hex')};
  cases.push({id:'metadata-ref-cube-dimension-absent-links',entry:cubeEntry,
    xml:'<Properties/>',yaml:'',reverseYAML:'',noRaw:true,
    factBindings:{roots:'metadata.roots'},source:[cubeSource]});
  const registerSourcePath='e2e/fixtures/xml/cf/Sequences/ПоследовательностьВсеПоля.xml';
  const registerLinkSource={path:registerSourcePath,sha256:createHash('sha256').update(readFileSync(registerSourcePath)).digest('hex')};
  cases.push({id:'metadata-ref-cube-dimension-linked-value-contract',entry:cubeEntry,
    xml:wrapped('<RegisterDimension xsi:type="xr:MDObjectRef">InformationRegister.РегистрСведений1</RegisterDimension><LeadingRegisterData><xr:Item xsi:type="xr:MDObjectRef">InformationRegister.РегистрСведений1</xr:Item></LeadingRegisterData>'),
    yaml:'ИзмерениеРегистра: РегистрСведений.РегистрСведений1\nДанныеВедущихРегистров:\n  - РегистрСведений.РегистрСведений1\n',
    noRaw:true,factBindings:{roots:'metadata.roots'},source:[registerLinkSource]});
  const filterCriterion=extracted.entries.find(entry=>entry.symbol==='MetadataFilterCriterionRules');
  const sequenceDimension=extracted.entries.find(entry=>entry.symbol==='MetadataSequenceDimensionRules');
  if(!filterCriterion || !sequenceDimension)throw new Error('Missing explicit member collection rules');
  const memberCollections=emitCandidates([
    {...filterCriterion,comparison:{status:'keys-match'},properties:filterCriterion.properties.filter(property=>property.name==='content')},
    {...sequenceDimension,comparison:{status:'keys-match'},properties:sequenceDimension.properties.filter(property=>
      ['documentMap','registerRecordsMap'].includes(property.name))},
  ],catalog);
  for(const result of memberCollections.entries)if(result.properties.some(property=>property.status!=='candidate'))throw new Error('Explicit member collection was not emitted');
  const filterPath='e2e/fixtures/xml/cf/FilterCriteria/КритерийОтбораВсеСвойства.xml';
  const filterBytes=readFileSync(filterPath);
  const contentBlock=filterBytes.toString('utf8').match(/<Content>[\s\S]*?<\/Content>/)?.[0];
  if(!contentBlock)throw new Error('Filter criterion fixture has no content');
  cases.push({id:'metadata-ref-filter-criterion-member-content',entry:memberCollections.entries[0].projections[0].id,
    xml:wrapped(contentBlock),noRaw:true,
    source:[{path:filterPath,sha256:createHash('sha256').update(filterBytes).digest('hex')}]});
  const emptyFilterPath='e2e/fixtures/xml/cf/FilterCriteria/КритерийОтбораПоУмолчанию.xml';
  cases.push({id:'metadata-ref-filter-criterion-empty-content',entry:memberCollections.entries[0].projections[0].id,
    xml:wrapped('<Content/>'),noRaw:true,
    source:[{path:emptyFilterPath,sha256:createHash('sha256').update(readFileSync(emptyFilterPath)).digest('hex')}]});
  const sequenceBytes=readFileSync(registerSourcePath);
  const sequenceText=sequenceBytes.toString('utf8');
  const documentMap=sequenceText.match(/<DocumentMap>[\s\S]*?<\/DocumentMap>/)?.[0];
  const registerMap=sequenceText.match(/<RegisterRecordsMap>[\s\S]*?<\/RegisterRecordsMap>/)?.[0];
  if(!documentMap || !registerMap)throw new Error('Sequence fixture has no member maps');
  cases.push({id:'metadata-ref-sequence-dimension-member-maps',entry:memberCollections.entries[1].projections[0].id,
    xml:wrapped(documentMap+registerMap),noRaw:true,source:[registerLinkSource]});
  const report=extracted.entries.find(entry=>entry.symbol==='MetadataReportRules');
  if(!report)throw new Error('Missing report rules extraction');
  const formNames=['defaultForm','auxiliaryForm','defaultSettingsForm','auxiliarySettingsForm','defaultVariantForm'];
  const reportForms=emitCandidates([{...report,comparison:{status:'keys-match'},properties:report.properties.filter(property=>
    formNames.includes(property.name))}],catalog);
  if(reportForms.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Report form links were not emitted');
  const reportEntry=reportForms.entries[0].projections[0]?.id;
  if(!reportEntry)throw new Error('Missing report form projection');
  const reportPath='e2e/fixtures/xml/cf/Reports/ОтчетВсеСвойства.xml';
  const reportBytes=readFileSync(reportPath);
  const reportXml=reportBytes.toString('utf8');
  const reportSource={path:reportPath,sha256:createHash('sha256').update(reportBytes).digest('hex')};
  const formTags=['DefaultForm','AuxiliaryForm','DefaultSettingsForm','AuxiliarySettingsForm','DefaultVariantForm'];
  const formXml=formTags.map(tag=>reportXml.match(new RegExp(`<${tag}(?:>[\\s\\S]*?<\\/${tag}>|\\s*\\/>)`))?.[0]);
  if(formXml.some(value=>!value))throw new Error('Report fixture has incomplete form links');
  cases.push({id:'metadata-ref-report-forms',entry:reportEntry,xml:wrapped(formXml.join('')),noRaw:true,
    inputs:{owner:'Report.ОтчетВсеСвойства',forms:['ФормаОтчета','ФормаНастроек','ФормаВарианта']},
    factBindings:{roots:'metadata.roots'},source:[reportSource]});
  const auxiliaryForm=emitCandidates([{...report,comparison:{status:'keys-match'},properties:report.properties.filter(property=>
    property.name==='auxiliaryForm')}],catalog);
  const auxiliaryEntry=auxiliaryForm.entries[0].projections[0]?.id;
  if(!auxiliaryEntry)throw new Error('Missing report auxiliary form projection');
  cases.push({id:'metadata-ref-report-explicit-empty-form',entry:auxiliaryEntry,
    xml:wrapped('<AuxiliaryForm/>'),reverseYAML:'ДополнительнаяФорма: ""\n',noRaw:true,
    inputs:{owner:'Report.ОтчетВсеСвойства',forms:['ФормаОтчета','ФормаНастроек','ФормаВарианта']},
    factBindings:{roots:'metadata.roots'},source:[reportSource]});
  const reportTemplate=emitCandidates([{...report,comparison:{status:'keys-match'},properties:report.properties.filter(property=>
    property.name==='mainDataCompositionSchema')}],catalog);
  if(reportTemplate.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Report main template was not emitted');
  const templateEntry=reportTemplate.entries[0].projections[0]?.id;
  if(!templateEntry)throw new Error('Missing report main template projection');
  const templateInputs={ownerRoot:'Report',containingOwnerName:'ОтчетВсеСвойства',members:['ОсновнаяСхемаКомпоновкиДанных']};
  cases.push({id:'metadata-ref-report-main-template',entry:templateEntry,
    xml:wrapped('<MainDataCompositionSchema>Report.ОтчетВсеСвойства.Template.ОсновнаяСхемаКомпоновкиДанных</MainDataCompositionSchema>'),
    yaml:'ОсновнаяСхемаКомпоновкиДанных: ОсновнаяСхемаКомпоновкиДанных\n',noRaw:true,
    inputs:templateInputs,source:[reportSource],rejectedYAML:['ОсновнаяСхемаКомпоновкиДанных: НеСуществует\n']});
  const emptyReportTemplatePath='e2e/fixtures/xml/cf/Reports/ОтчетПоУмолчанию.xml';
  cases.push({id:'metadata-ref-report-empty-main-template',entry:templateEntry,
    xml:wrapped('<MainDataCompositionSchema/>'),noRaw:true,
    inputs:{ownerRoot:'Report',containingOwnerName:'ОтчетПоУмолчанию',members:[]},
    source:[{path:emptyReportTemplatePath,sha256:createHash('sha256').update(readFileSync(emptyReportTemplatePath)).digest('hex')}]});
  const documentChoice=emitCandidates([{...documentRules,comparison:{status:'keys-match'},properties:documentRules.properties.filter(property=>
    property.name==='defaultChoiceForm')}],catalog);
  if(documentChoice.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Document choice form was not emitted');
  const documentChoiceEntry=documentChoice.entries[0].projections[0]?.id;
  if(!documentChoiceEntry)throw new Error('Missing document choice form projection');
  cases.push({id:'metadata-ref-document-choice-form',entry:documentChoiceEntry,
    xml:wrapped('<DefaultChoiceForm>Document.ДокументВсеСвойства.Form.ФормаВыбора</DefaultChoiceForm>'),noRaw:true,
    inputs:{containingOwnerName:'ДокументВсеСвойства',forms:['ФормаВыбора']},
    factBindings:{roots:'metadata.roots',formTargets:'metadata.forms'},source:[registerSource]});
  const emptyDocumentPath='e2e/fixtures/xml/cf/Documents/ДокументПоУмолчанию.xml';
  cases.push({id:'metadata-ref-document-empty-choice-form',entry:documentChoiceEntry,
    xml:wrapped('<DefaultChoiceForm/>'),noRaw:true,
    inputs:{containingOwnerName:'ДокументПоУмолчанию',forms:[]},
    factBindings:{roots:'metadata.roots',formTargets:'metadata.forms'},
    source:[{path:emptyDocumentPath,sha256:createHash('sha256').update(readFileSync(emptyDocumentPath)).digest('hex')}]});
  const addressing=extracted.entries.find(entry=>entry.symbol==='MetadataTaskAddressingAttributeRules');
  if(!addressing)throw new Error('Missing task addressing attribute rules');
  const addressingLink=emitCandidates([{...addressing,comparison:{status:'keys-match'},properties:addressing.properties.filter(property=>
    property.name==='addressingDimension')}],catalog);
  if(addressingLink.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Addressing dimension was not emitted');
  const addressingEntry=addressingLink.entries[0].projections[0]?.id;
  if(!addressingEntry)throw new Error('Missing addressing dimension projection');
  const taskPath='e2e/fixtures/xml/cf/Tasks/ЗадачаВсеСвойства.xml';
  const taskSource={path:taskPath,sha256:createHash('sha256').update(readFileSync(taskPath)).digest('hex')};
  cases.push({id:'metadata-ref-task-addressing-dimension',entry:addressingEntry,
    xml:wrapped('<AddressingDimension>InformationRegister.РегистрСведенийАдресация.Dimension.ИзмерениеАдресации</AddressingDimension>'),
    noRaw:true,source:[taskSource],rejectedYAML:[
      'ИзмерениеАдресации: Документ.ДокументВсеСвойства.Измерение.ИзмерениеАдресации\n',
      'ИзмерениеАдресации: РегистрСведений.РегистрСведенийАдресация.Реквизит.ИзмерениеАдресации\n',
    ]});
  cases.push({id:'metadata-ref-task-empty-addressing-dimension',entry:addressingEntry,
    xml:wrapped('<AddressingDimension/>'),noRaw:true,source:[taskSource]});
  const recalculation=extracted.entries.find(entry=>entry.symbol==='MetadataCalculationRegisterRecalculationDimensionRules');
  if(!recalculation)throw new Error('Missing recalculation dimension rules');
  const recalculationDimension=emitCandidates([{...recalculation,comparison:{status:'keys-match'},properties:recalculation.properties.filter(property=>
    property.name==='registerDimension')}],catalog);
  if(recalculationDimension.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Recalculation register dimension was not emitted');
  const recalculationEntry=recalculationDimension.entries[0].projections[0]?.id;
  if(!recalculationEntry)throw new Error('Missing recalculation register dimension projection');
  const recalculationPath='e2e/fixtures/xml/cf/CalculationRegisters/РегистрРасчетаВсеСвойства/Recalculations/ПерерасчетВсеСвойства.xml';
  const recalculationSource={path:recalculationPath,sha256:createHash('sha256').update(readFileSync(recalculationPath)).digest('hex')};
  cases.push({id:'metadata-ref-recalculation-register-dimension',entry:recalculationEntry,
    xml:wrapped('<RegisterDimension>CalculationRegister.РегистрРасчетаВсеСвойства.Dimension.ИзмерениеВсеСвойства</RegisterDimension>'),
    yaml:'ИзмерениеРегистра: ИзмерениеВсеСвойства\n',noRaw:true,
    inputs:{containingOwnerName:'РегистрРасчетаВсеСвойства',members:['ИзмерениеВсеСвойства','ИзмерениеПоУмолчанию']},
    source:[recalculationSource],rejectedYAML:['ИзмерениеРегистра: НеСуществует\n']});
  const leadingData=emitCandidates([{...recalculation,comparison:{status:'keys-match'},properties:recalculation.properties.filter(property=>
    property.name==='leadingRegisterData')}],catalog);
  if(leadingData.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Recalculation leading data was not emitted');
  const leadingEntry=leadingData.entries[0].projections[0]?.id;
  if(!leadingEntry)throw new Error('Missing recalculation leading data projection');
  const leadingBlock=readFileSync(recalculationPath,'utf8').match(/<LeadingRegisterData>[\s\S]*?<\/LeadingRegisterData>/)?.[0];
  if(!leadingBlock)throw new Error('Missing leading data in recalculation XML fixture');
  cases.push({id:'metadata-ref-recalculation-leading-data',entry:leadingEntry,
    xml:wrapped(leadingBlock),
    yaml:'ДанныеВедущихРегистров:\n  - ИзмерениеВсеСвойства\n  - РегистрРасчета.РегистрРасчетаВедущий.Измерение.ИзмерениеПараметрыВыбора\n',
    noRaw:true,inputs:{containingOwnerName:'РегистрРасчетаВсеСвойства'},source:[recalculationSource],
    rejectedYAML:[
      'ДанныеВедущихРегистров:\n  - Документ.ДокументВсеСвойства.Измерение.ИзмерениеВсеСвойства\n',
      'ДанныеВедущихРегистров:\n  - РегистрРасчета.РегистрРасчетаВедущий.Ресурс.РесурсВсеСвойства\n',
    ]});
  const optionParameter=extracted.entries.find(entry=>entry.symbol==='MetadataFunctionalOptionsParameterRules');
  if(!optionParameter)throw new Error('Missing functional options parameter rules');
  const optionUse=emitCandidates([{...optionParameter,comparison:{status:'keys-match'},properties:optionParameter.properties.filter(property=>
    property.name==='use')}],catalog);
  if(optionUse.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Functional options usage was not emitted');
  const optionUseEntry=optionUse.entries[0].projections[0]?.id;
  if(!optionUseEntry)throw new Error('Missing functional options usage projection');
  for(const [name,expected] of [
    ['ПараметрФункциональныхОпцийПоУмолчанию','Использование:\n  - Справочник.СправочникВладелец\n'],
    ['ПараметрФункциональныхОпцийВсеСвойства','Использование:\n  - Справочник.СправочникПолный\n  - РегистрСведений.РегистрСведений1.Измерение.Измерение1\n'],
  ]) {
    const path=`e2e/fixtures/xml/cf/FunctionalOptionsParameters/${name}.xml`;
    const bytes=readFileSync(path);
    const block=bytes.toString('utf8').match(/<Use>[\s\S]*?<\/Use>/)?.[0];
    if(!block)throw new Error(`Missing Use in ${path}`);
    cases.push({id:`metadata-ref-functional-options-use-${name}`,entry:optionUseEntry,
      xml:wrapped(block),yaml:expected,noRaw:true,
      source:[{path,sha256:createHash('sha256').update(bytes).digest('hex')}]});
  }
  const standardAttribute=extracted.entries.find(entry=>entry.symbol==='StandardAttributeDescriptionRules');
  if(!standardAttribute)throw new Error('Missing standard attribute description rules');
  const standardChoice=emitCandidates([{...standardAttribute,comparison:{status:'keys-match'},properties:standardAttribute.properties.filter(property=>
    property.name==='choiceForm')}],catalog,undefined,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
  if(standardChoice.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Standard attribute choice form was not emitted');
  const standardChoiceEntry=standardChoice.entries[0].projections[0]?.id;
  if(!standardChoiceEntry)throw new Error('Missing standard attribute choice form projection');
  const catalogPath='e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml';
  const catalogBytes=readFileSync(catalogPath);
  const choiceBlock=catalogBytes.toString('utf8').match(/<xr:ChoiceForm>Catalog\.СправочникВладелец\.Form\.ФормаВыбора<\/xr:ChoiceForm>/)?.[0];
  if(!choiceBlock)throw new Error('Missing standard attribute choice form in catalog fixture');
  cases.push({id:'metadata-ref-standard-attribute-choice-form',entry:standardChoiceEntry,
    xml:choiceBlock.replace('<xr:ChoiceForm>','<xr:ChoiceForm xmlns:xr="http://v8.1c.ru/8.3/xcf/readable">'),
    yaml:'ФормаВыбора: Справочник.СправочникВладелец.Форма.ФормаВыбора\n',noRaw:true,
    factBindings:{roots:'metadata.roots',forms:'metadata.forms'},
    source:[{path:catalogPath,sha256:createHash('sha256').update(catalogBytes).digest('hex')}],
    rejectedYAML:['ФормаВыбора: Справочник.СправочникВладелец.Форма.НеСуществует\n']});
  if(!catalogBytes.toString('utf8').includes('<xr:ChoiceForm/>'))throw new Error('Missing empty standard attribute choice form in catalog fixture');
  cases.push({id:'metadata-ref-standard-attribute-empty-choice-form',entry:standardChoiceEntry,
    xml:'<xr:ChoiceForm xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"/>',
    yaml:'',reverseYAML:'',noRaw:true,
    factBindings:{roots:'metadata.roots',forms:'metadata.forms'},
    source:[{path:catalogPath,sha256:createHash('sha256').update(catalogBytes).digest('hex')}]});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Catalog</Kind><Name>СправочникВладелец</Name><Identity>catalog-owner</Identity></Root>'});
  factSources.push({entry:formIndex.id,xml:'<Root><Parent>catalog-owner</Parent><Name>ФормаВыбора</Name><Identity>catalog-choice-form</Identity></Root>'});
  const functionalOption=extracted.entries.find(entry=>entry.symbol==='MetadataFunctionalOptionRules');
  if(!functionalOption)throw new Error('Missing functional option rules');
  const optionLocation=emitCandidates([{...functionalOption,comparison:{status:'keys-match'},properties:functionalOption.properties.filter(property=>
    property.name==='location')}],catalog);
  if(optionLocation.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Functional option location was not emitted');
  const optionLocationEntry=optionLocation.entries[0].projections[0]?.id;
  if(!optionLocationEntry)throw new Error('Missing functional option location projection');
  for(const [name,expected] of [
    ['ФункциональнаяОпцияПоУмолчанию','Размещение: Константа.КонстантаБулево\n'],
    ['ФункциональныеОпцииПолный','Размещение: Справочник.СправочникПолный.Реквизит.РеквизитСправочника\n'],
  ]) {
    const path=`e2e/fixtures/xml/cf/FunctionalOptions/${name}.xml`;
    const bytes=readFileSync(path);
    const location=bytes.toString('utf8').match(/<Location>[^<]+<\/Location>/)?.[0];
    if(!location)throw new Error(`Missing Location in ${path}`);
    cases.push({id:`metadata-ref-functional-option-location-${name}`,entry:optionLocationEntry,
      xml:wrapped(location),yaml:expected,noRaw:true,
      source:[{path,sha256:createHash('sha256').update(bytes).digest('hex')}],
      rejectedYAML:['Размещение: Документ.ДокументВсеСвойства\n',
        'Размещение: Справочник.СправочникПолный.Команда.Команда1\n']});
  }
  const allowedContent=allowedMetadataPaths(functionalOption.properties.find(property=>property.name==='content').parameters.metadataTarget,
    catalog,{id:'migration.functional-option-allowed-content'});
  const contentProbe={format:'nkdk-declarations/1',kind:'object',id:'migration.metadata-root-or-structural-links',
    imports:{links:'migration.functional-option-allowed-content'},namespaces:{xr:'http://v8.1c.ru/8.3/xcf/readable'},
    value:{kind:'record',fields:[{name:'links',type:{use:'links'}}]},
    representations:{xml:{kind:'record',fields:[{field:'links',path:['Root','Content']}]},
      yaml:{kind:'mapping',fields:[{field:'links',key:'СоставФункциональнойОпции'}]}},
    presence:[{target:{field:'links'},xml:{missing:{denotes:{sequence:[]}},empty:[{form:'empty-element',denotes:{sequence:[]}}],canonical:[{when:{not:{exists:{in:{field:'links'},as:'row',where:{literal:true}}}},form:'empty-element'},{form:'ordinary'}]},
      yaml:{missing:{denotes:{sequence:[]}},omitWhen:{not:{exists:{in:{field:'links'},as:'row',where:{literal:true}}}}}}]};
  const contentPath='e2e/fixtures/xml/cf/FunctionalOptions/ФункциональнаяОпцияВсеСвойства.xml';
  const contentBytes=readFileSync(contentPath);
  const contentXML=contentBytes.toString('utf8');
  const selected=[
    'Catalog.СправочникПолный',
    'Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.Attribute.РеквизитТабличнойЧасти',
    'ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.DimensionTable.ТаблицаИзмеренияВсеСвойства.Field.ПолеВсеСвойства',
  ];
  for(const value of selected)if(!contentXML.includes(`<xr:Object>${value}</xr:Object>`))throw new Error(`Missing ${value} in ${contentPath}`);
  cases.push({id:'metadata-ref-functional-option-mixed-content',entry:contentProbe.id,
    xml:`<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content>${selected.map(value=>`<xr:Object>${value}</xr:Object>`).join('')}</Content></Root>`,
    yaml:'СоставФункциональнойОпции:\n  - Справочник.СправочникПолный\n  - Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.Реквизит.РеквизитТабличнойЧасти\n  - ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.ТаблицаИзмерения.ТаблицаИзмеренияВсеСвойства.Поле.ПолеВсеСвойства\n',
    noRaw:true,source:[{path:contentPath,sha256:createHash('sha256').update(contentBytes).digest('hex')}],
  });
  const verifiedTarget=functionalOption.properties.find(property=>property.name==='content').parameters.metadataTarget;
  const optionContent=emitCandidates([{...functionalOption,comparison:{status:'keys-match'},properties:functionalOption.properties.filter(property=>
    property.name==='content')}],catalog,undefined,{xr:'http://v8.1c.ru/8.3/xcf/readable'});
  if(optionContent.entries[0].properties.some(property=>property.status!=='candidate'))throw new Error('Functional option content was not emitted');
  const optionContentEntry=optionContent.entries[0].projections[0]?.id;
  if(!optionContentEntry)throw new Error('Missing functional option content projection');
  const verifiedContent=allowedMetadataPaths(verifiedTarget,
    catalog,{id:'migration.functional-option-indexed-content',verifyTargets:true});
  const rootOnlyContent=allowedMetadataPaths({kind:'member',owner:'explicit',
    allowedObjectPaths:[['Catalog']],allowedMemberPaths:[]},catalog,
  {id:'migration.functional-option-indexed-root-only',verifyTargets:true});
  const rootOnlyProbe={...contentProbe,id:'migration.metadata-indexed-root-only-content',
    imports:{links:'migration.functional-option-indexed-root-only'},
    inputs:{roots:{index:'metadata.roots'}},
    value:{kind:'record',fields:[{name:'links',type:{use:'links',bind:{roots:{input:'roots'}}}}]}};
  const verifiedProbe={...contentProbe,id:'migration.metadata-indexed-content',
    imports:{links:'migration.functional-option-indexed-content'},
    inputs:{roots:{index:'metadata.roots'},pathChildren:{index:'metadata.path-children'}},
    value:{kind:'record',fields:[{name:'links',type:{use:'links',bind:{roots:{input:'roots'},pathChildren:{input:'pathChildren'}}}}]}};
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Catalog</Kind><Name>СправочникПолный</Name><Identity>indexed-catalog</Identity></Root>'});
  cases.push({id:'metadata-ref-functional-option-indexed-root-only',entry:rootOnlyProbe.id,
    xml:'<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>Catalog.СправочникПолный</xr:Object></Content></Root>',
    yaml:'СоставФункциональнойОпции:\n  - Справочник.СправочникПолный\n',
    noRaw:true,factBindings:{roots:'metadata.roots'},
    rejectedYAML:['СоставФункциональнойОпции:\n  - Справочник.НеСуществует\n'],
    source:[{path:contentPath,sha256:createHash('sha256').update(contentBytes).digest('hex')}],
  });
  factSources.push({entry:pathChildIndex.id,xml:'<Root><Parent>indexed-catalog</Parent><Kind>TabularSection</Kind><Name>ТабличнаяЧасть</Name><Identity>indexed-table</Identity></Root>'});
  factSources.push({entry:pathChildIndex.id,xml:'<Root><Parent>indexed-table</Parent><Kind>Attribute</Kind><Name>РеквизитТабличнойЧасти</Name><Identity>indexed-attribute</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Subsystem</Kind><Name>ПодсистемаВсеСвойства</Name><Identity>indexed-subsystem</Identity></Root>'});
  factSources.push({entry:pathChildIndex.id,xml:'<Root><Parent>indexed-subsystem</Parent><Kind>Subsystem</Kind><Name>ПодчиненнаяПодсистема</Name><Identity>indexed-child-subsystem</Identity></Root>'});
  factSources.push({entry:pathChildIndex.id,xml:'<Root><Parent>indexed-child-subsystem</Parent><Kind>Subsystem</Kind><Name>ВложеннаяПодсистема</Name><Identity>indexed-grandchild-subsystem</Identity></Root>'});
  cases.push({id:'metadata-ref-functional-option-indexed-member',entry:verifiedProbe.id,
    xml:'<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.Attribute.РеквизитТабличнойЧасти</xr:Object></Content></Root>',
    yaml:'СоставФункциональнойОпции:\n  - Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.Реквизит.РеквизитТабличнойЧасти\n',
    noRaw:true,factBindings:{roots:'metadata.roots',pathChildren:'metadata.path-children'},
    rejectedYAML:['СоставФункциональнойОпции:\n  - Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.Реквизит.НеСуществует\n'],
    source:[{path:contentPath,sha256:createHash('sha256').update(contentBytes).digest('hex')}],
  });
  const nestedSource='e2e/fixtures/xml/cf/Subsystems/ПодсистемаВсеСвойства/Ext/CommandInterface.xml';
  const nestedBytes=readFileSync(nestedSource);
  const nestedPath='Subsystem.ПодсистемаВсеСвойства.Subsystem.ПодчиненнаяПодсистема';
  if(!nestedBytes.toString('utf8').includes(`<Subsystem>${nestedPath}</Subsystem>`))throw new Error('Missing nested subsystem fixture');
  cases.push({id:'metadata-ref-functional-option-indexed-nested-subsystem',entry:verifiedProbe.id,
    xml:'<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>Subsystem.ПодсистемаВсеСвойства.Subsystem.ПодчиненнаяПодсистема</xr:Object></Content></Root>',
    yaml:'СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.ПодчиненнаяПодсистема\n',
    noRaw:true,factBindings:{roots:'metadata.roots',pathChildren:'metadata.path-children'},
    rejectedYAML:['СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.НеСуществует\n'],
    source:[{path:nestedSource,sha256:createHash('sha256').update(nestedBytes).digest('hex')}],
  });
  cases.push({id:'metadata-ref-functional-option-indexed-subsystem-chain',entry:verifiedProbe.id,
    xml:`<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>${nestedPath}.Subsystem.ВложеннаяПодсистема</xr:Object></Content></Root>`,
    yaml:'СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.ПодчиненнаяПодсистема.Подсистема.ВложеннаяПодсистема\n',
    noRaw:true,factBindings:{roots:'metadata.roots',pathChildren:'metadata.path-children'},
    rejectedYAML:['СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.ПодчиненнаяПодсистема.Подсистема.НеСуществует\n'],
    source:[{path:nestedSource,sha256:createHash('sha256').update(nestedBytes).digest('hex')}],
    adaptation:'The fixture path gains one nested subsystem to test traversal across two parent identities',
  });
  cases.push({id:'metadata-ref-functional-option-emitted-content',entry:optionContentEntry,
    xml:wrapped(`<Content><xr:Object>${nestedPath}</xr:Object></Content>`),
    yaml:'СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.ПодчиненнаяПодсистема\n',
    noRaw:true,factBindings:{roots:'metadata.roots',pathChildren:'metadata.path-children'},
    rejectedYAML:['СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.НеСуществует\n'],
    source:[{path:nestedSource,sha256:createHash('sha256').update(nestedBytes).digest('hex')}],
  });
  const fullContent=contentXML.match(/<Content>[\s\S]*?<\/Content>/)?.[0];
  const yamlPath='e2e/fixtures/nkdk/cf/ФункциональнаяОпция/ФункциональнаяОпцияВсеСвойства.yaml';
  const yamlBytes=readFileSync(yamlPath);
  const yamlLines=yamlBytes.toString('utf8').split('\n');
  const start=yamlLines.indexOf('СоставФункциональнойОпции:');
  if(!fullContent || start<0)throw new Error('Missing complete functional option content fixture');
  let end=start+1;
  while(end<yamlLines.length && yamlLines[end].startsWith('  - '))end++;
  cases.push({id:'metadata-ref-functional-option-full-content',entry:contentProbe.id,
    xml:`<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable">${fullContent}</Root>`,
    yaml:`${yamlLines.slice(start,end).join('\n')}\n`,noRaw:true,
    rejectedYAML:['СоставФункциональнойОпции:\n  - Документ.ДокументВсеСвойства.Измерение.НеСуществует\n'],
    source:[{path:contentPath,sha256:createHash('sha256').update(contentBytes).digest('hex')},
      {path:yamlPath,sha256:createHash('sha256').update(yamlBytes).digest('hex')}],
  });
  const emptyContentPath='e2e/fixtures/xml/cf/FunctionalOptions/ФункциональнаяОпцияПоУмолчанию.xml';
  const emptyContentBytes=readFileSync(emptyContentPath);
  if(!emptyContentBytes.toString('utf8').includes('<Content/>'))throw new Error('Missing empty functional option content');
  cases.push({id:'metadata-ref-functional-option-empty-content',entry:contentProbe.id,
    xml:'<Root><Content/></Root>',yaml:'',noRaw:true,
    source:[{path:emptyContentPath,sha256:createHash('sha256').update(emptyContentBytes).digest('hex')}],
  });
  cases.push({id:'metadata-ref-functional-option-nested-subsystem',entry:contentProbe.id,
    xml:`<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable"><Content><xr:Object>${nestedPath}</xr:Object></Content></Root>`,
    yaml:'СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Подсистема.ПодчиненнаяПодсистема\n',noRaw:true,
    rejectedYAML:['СоставФункциональнойОпции:\n  - Подсистема.ПодсистемаВсеСвойства.Реквизит.ПодчиненнаяПодсистема\n'],
    source:[{path:nestedSource,sha256:createHash('sha256').update(nestedBytes).digest('hex')}],
    adaptation:'Existing nested subsystem path inserted into the functional option Content item permitted by nestedObjectRoots',
  });
  const formSettingsOwners=['ClientApplicationFormRules','ClientApplicationFormWithExtendedPresentationRules']
    .map(symbol=>extracted.entries.find(entry=>entry.symbol===symbol));
  if(formSettingsOwners.some(owner=>!owner))throw new Error('Missing form settings storage source rules');
  const formSettings=emitCandidates(formSettingsOwners.map(owner=>({...owner,comparison:{status:'keys-match'},
    properties:owner.properties.filter(property=>property.name==='settingsStorage')})),catalog);
  if(formSettings.entries.some(owner=>owner.properties.length!==1 || owner.properties[0].status!=='candidate'))throw new Error('Form settings storage was not emitted');
  const settingsEntry=formSettings.entries[0].projections[0]?.id;
  if(!settingsEntry || formSettings.entries.some(owner=>owner.projections[0]?.id!==settingsEntry))throw new Error('Form settings storage owners emitted different contracts');
  const storageSource='e2e/fixtures/xml/cf/Tasks/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml';
  const storageBytes=readFileSync(storageSource);
  if(!storageBytes.toString('utf8').includes('<SettingsStorage>SettingsStorage.ХранилищеНастроекВсеСвойства</SettingsStorage>'))throw new Error('Missing real settings storage link');
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>SettingsStorage</Kind><Name>ХранилищеНастроекВсеСвойства</Name><Identity>settings-storage-complete</Identity></Root>'});
  factSources.push({entry:rootIndex.id,xml:'<Root><Kind>Report</Kind><Name>ОтчетВсеСвойства</Name><Identity>report-complete</Identity></Root>'});
  factSources.push({entry:formIndex.id,xml:'<Root><Parent>report-complete</Parent><Name>ФормаОтчета</Name><Identity>report-form-main</Identity></Root>'});
  const storageFacts={roots:'metadata.roots',formTargets:'metadata.forms'};
  cases.push({id:'metadata-ref-form-settings-storage-object',entry:settingsEntry,
    xml:'<SettingsStorage>SettingsStorage.ХранилищеНастроекВсеСвойства</SettingsStorage>',
    yaml:'ХранилищеНастроек: ХранилищеНастроек.ХранилищеНастроекВсеСвойства\n',noRaw:true,
    inputs:{containingOwnerName:'ЗадачаВсеСвойства'},factBindings:storageFacts,source:[{path:storageSource,sha256:createHash('sha256').update(storageBytes).digest('hex')}],
    rejectedYAML:['ХранилищеНастроек: ХранилищеНастроек.НеСуществует\n']});
  cases.push({id:'metadata-ref-form-settings-storage-own-report-form',entry:settingsEntry,
    xml:'<SettingsStorage>Report.ОтчетВсеСвойства.Form.ФормаОтчета</SettingsStorage>',
    yaml:'ХранилищеНастроек: ФормаОтчета\n',noRaw:true,
    inputs:{containingOwnerName:'ОтчетВсеСвойства'},factBindings:storageFacts,source:[reportSource],
    rejectedYAML:['ХранилищеНастроек: НеСуществует\n'],
    adaptation:'Real report DefaultForm path used as the settings storage property of its own form'});
  cases.push({id:'metadata-ref-form-settings-storage-foreign-report-form',entry:settingsEntry,
    xml:'<SettingsStorage>Report.ОтчетВсеСвойства.Form.ФормаОтчета</SettingsStorage>',
    yaml:'ХранилищеНастроек: Отчет.ОтчетВсеСвойства.Форма.ФормаОтчета\n',noRaw:true,
    inputs:{containingOwnerName:'ОтчетПоУмолчанию'},factBindings:storageFacts,source:[reportSource],
    adaptation:'Real report DefaultForm path referenced from a different report form'});
  return {modules:[probe,direct,role,rootIndex,formIndex,pathChildIndex,contentProbe,verifiedProbe,rootOnlyProbe,...allowedContent,...verifiedContent,...rootOnlyContent,...optionContent.modules,...formSettings.modules,...emitted.modules,...defaults.modules,...registers.modules,...unrestricted.modules,...extensionRoles.modules,...sequenceLists.modules,...baseTypes.modules,...exchangeMetadata.modules,...cubeLinks.modules,...memberCollections.modules,...reportForms.modules,...auxiliaryForm.modules,...reportTemplate.modules,...documentChoice.modules,...addressingLink.modules,...recalculationDimension.modules,...leadingData.modules,...optionUse.modules,...standardChoice.modules,...optionLocation.modules],cases,factSources};
}
