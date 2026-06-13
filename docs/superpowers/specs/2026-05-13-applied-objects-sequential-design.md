# Applied Objects Sequential Design

## Context

Add the next applied metadata objects sequentially, expanding this design after each object is researched.
The target directories and XML fixtures already exist, but the objects still need normal implementation files,
registry entries, YAML fixtures, and the standard tests.

Planned order:

1. `metadataDataProcessor`
2. `metadataDocumentJournal`
3. `metadataHTTPService`
4. `metadataInformationRegister`
5. `metadataAccumulationRegister`
6. `metadataExchangePlan`

Existing XML fixtures are the first source of truth and must not be changed. For each object, inspect full/minimal
XML, sync XML, XDTO, 1C help files, `ru-en-map`, and neighboring implemented applied objects before implementation.

## Approach

Use the conservative `rules.ts` path for every object where current orchestration can represent the XML shape:

- add one declarative applied-object rule per object;
- infer `Metadata*` and `Metadata*YAML` through `MetadataTypeByRule` and `YAMLTypeByRule`;
- register the object in `MetadataItemTypeRegistry`, `PropertyTypeRegistry`, and `PropertyRuleTypeKeys`;
- call `registerMetadataItemRule` from the object `types.ts`;
- import the object from `packages/core/metadata/appliedObjects/index.ts`;
- include the object in `TopLevelMetadataItemRules` and migration path prefixes when configuration sync should see it;
- add the standard test set: `fromXML`, `toXML`, `fromYAML`, `toYAML`, `convertFromXML`, and `syncToXML`.

Do not add custom `fromXML`, `toXML`, `fromYAML`, or `toYAML` handlers unless a current fixture cannot round-trip
through existing common rules. Do not refactor common infrastructure as part of this series.

Placement policy for new nested metadata structures:

- put all new nested/external metadata structures from this series under `packages/core/metadata/commonObjects`;
- use domain-specific names, for example `metadataDocumentJournalColumn`, `metadataHTTPServiceMethod`,
  `metadataRegisterResource`, or `exchangePlanContent`, rather than generic names such as `Column` or `Method`;
- this applies even when the first consumer is a single applied object.

Default-value policy for new objects:

- when a scalar platform default is confirmed by `minimal.xml`, XDTO/help, or a dedicated default fixture, define both
  `defaultValueXML` and `implicitValueYAML`, including boolean, number, and system-enumeration fields;
- do not use existing implemented objects as proof that a missing `implicitValueYAML` is intentional, because some older
  rules may be incomplete or inconsistent;
- do not add `implicitValueYAML` for fixture-specific values, values inferred only from object names, or child rows that
  are real content rather than platform defaults;
- do not describe YAML defaults for `MetadataFields` in this series, even when the XML default is non-empty; keep such
  values explicit in YAML when they matter.
- external files are content, not YAML defaults. This includes `Help`, modules, forms, templates, additional indexes,
  `ExchangePlanContent`, `AccumulationRegisterAggregates`, and similar `Ext/*` files.

## Object: MetadataDataProcessor

Risk is medium.

- `itemType`: `MetadataDataProcessor`
- `itemTypePrefix`: `Обработка`
- `xmlDir`: `DataProcessors`
- XML container: `DataProcessor`
- XDTO source: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, types `DataProcessor`,
  `DataProcessorProperties`, and `DataProcessorChildObjects`
- `InternalInfo`: two generated types:
  - `DataProcessorObject`, category `Object`;
  - `DataProcessorManager`, category `Manager`
- child objects:
  - `Attribute[]` through existing `MetadataAttributes`;
  - `TabularSection[]` through a data-processor-specific tabular-section rule/type, backed by the common tabular-section
    property set;
  - `Form[]` through `ChildFormNames`;
  - `Template[]` through `ChildTemplateNames`;
  - `Command[]` through existing `MetadataCommands`
- external files:
  - `Ext/ObjectModule.bsl` -> `МодульОбъекта.bsl` through `Module`;
  - `Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl` through `Module`;
  - `Forms/<form>.xml` and optional `Forms/<form>/Ext/Form/Module.bsl` through `ChildFormNames`;
  - `Templates/<template>.xml` and optional `Templates/<template>/Ext/Template.txt` through `ChildTemplateNames`;
  - `Ext/Help.xml` and `Ext/Help/ru.html` -> `Справка/` through `Help`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `defaultForm` | `DefaultForm` | `ОсновнаяФорма` | `string` |
| `auxiliaryForm` | `AuxiliaryForm` | `ДополнительнаяФорма` | `string` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `extendedPresentation` | `ExtendedPresentation` | `РасширенноеПредставление` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

`defaultForm` and `auxiliaryForm` should use `referenceScope: { target: "this", kind: "Form" }`.

Default policy:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`;
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`;
- `comment`, `defaultForm`, `auxiliaryForm`, `extendedPresentation`, and `explanation` use XML raw empty defaults
  from `minimal.xml`;
- `objectBelonging`: hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `runtimeOnly: true`;
- no other normal `implicitValueYAML` values.

Implementation notes:

- `MetadataDataProcessor` can reuse the same child object types as `MetadataCatalog` and `MetadataDocument`, except
  tabular sections, where it should expose a data-processor-specific wrapper rule/type.
- `ChildFormNames` and `ChildTemplateNames` must be tested through sync both ways so paths contain the object name
  exactly once: `DataProcessors/<name>/Forms/...` and `DataProcessors/<name>/Templates/...`.
- Current `sync/nkdk/ОбработкаВсеСвойства/Свойства.yaml` and `sync/data.ts` are empty stubs. Implementation must
  generate model fixtures and expected YAML from XML instead of treating the stubs as a complete contract.

Problems and questions:

1. Parent properties are straightforward and match XDTO exactly. No new parent common object is needed.
2. Object-level `Help` exists in the reference fixture at `Ext/Help.xml` and `Ext/Help/ru.html`; add the usual `Help`
   external property and cover it in sync. Form-level help under `Forms/Форма/Ext/Help.xml` remains part of form sync.
3. The command has an external module at `Commands/Команда1/Ext/CommandModule.bsl`. The object rule must include
   `childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }]`, as `MetadataCatalog` does,
   otherwise convert/sync will miss command modules.
4. The object uses existing `MetadataAttributes`, `ChildFormNames`, `ChildTemplateNames`, and `MetadataCommands`.
   Tabular sections should get a data-processor-specific wrapper rule/type so generated `InternalInfo` type names stay
   explicit for this object.
5. The sync fixture currently has empty `Свойства.yaml` and `data.ts`; regenerate them from XML/YAML expectations
   during implementation.
6. User decision: keep `objectBelonging` hidden from YAML and `extendedConfigurationObject` runtime-only, exactly as
   neighboring objects do.
7. User correction: object-level data-processor help exists in
   `/Users/nikita/git/roundTripElements/DataProcessors/ОбработкаВсеСвойства`; the sync XML fixture now includes
   `Ext/Help.xml` and `Ext/Help/ru.html`.
8. User decision: data-processor object-level `Help` is normal external content, not a default, same as in neighboring
   applied objects.
9. User decision: create a data-processor-specific tabular-section object/rule, even if it reuses or extends the common
   `MetadataTabularSections` implementation.
10. User decision: generated type names for data-processor tabular sections are `DataProcessorTabularSection` and
    `DataProcessorTabularSectionRow`.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `full.xml` and `minimal.xml`;
- sync from XML verifies `Свойства.yaml`, `МодульОбъекта.bsl`, `МодульМенеджера.bsl`, object-level `Справка/`,
  `Формы/Форма/...`, `Шаблоны/Макет/Template.xml`, plus `Команды/Команда1.bsl`;
- sync to XML verifies `ОбработкаВсеСвойства.xml`, `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`,
  `Ext/Help.xml`, `Ext/Help/ru.html`, `Forms/Форма.xml`, `Forms/Форма/Ext/Form.xml`,
  `Forms/Форма/Ext/Form/Module.bsl`, `Forms/Форма/Ext/Help.xml`, `Templates/Макет.xml`,
  `Templates/Макет/Ext/Template.txt`, and `Commands/Команда1/Ext/CommandModule.bsl`.

## Object: MetadataDocumentJournal

Risk is medium to high.

- `itemType`: `MetadataDocumentJournal`
- `itemTypePrefix`: `ЖурналДокументов`
- `xmlDir`: `DocumentJournals`
- XML container: `DocumentJournal`
- XDTO source: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, types `DocumentJournal`,
  `DocumentJournalProperties`, `DocumentJournalChildObjects`, and `Column`
- `InternalInfo`: three generated types:
  - `DocumentJournalSelection`, category `Selection`;
  - `DocumentJournalList`, category `List`;
  - `DocumentJournalManager`, category `Manager`
- child objects:
  - `Column[]` through a new common-object collection type named for the domain, for example
    `MetadataDocumentJournalColumns`;
  - `Form[]` through `ChildFormNames`;
  - `Template[]` through `ChildTemplateNames`;
  - `Command[]` through existing `MetadataCommands`
- external files:
  - `Ext/AdditionalIndexes.xml` -> existing `AdditionalIndex`;
  - `Ext/Help.xml` -> `Справка/` through `Help`;
  - `Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl` through `Module`;
  - `Forms/<form>.xml` and optional `Forms/<form>/Ext/Form/Module.bsl` through `ChildFormNames`;
  - `Templates/<template>.xml` and optional `Templates/<template>/Ext/Template.txt` through `ChildTemplateNames`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `defaultForm` | `DefaultForm` | `ОсновнаяФорма` | `string` |
| `auxiliaryForm` | `AuxiliaryForm` | `ДополнительнаяФорма` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `registeredDocuments` | `RegisteredDocuments` | `РегистрируемыеДокументы` | `MetadataItemLinks` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

`defaultForm` and `auxiliaryForm` should use `referenceScope: { target: "this", kind: "Form" }`.
`registeredDocuments` should constrain references to top-level `Документ` values if the existing reference-scope
model supports that cleanly.

Standard attribute names:

- `Type`: `Тип`;
- `Ref`: `Ссылка`;
- `Date`: `Дата`;
- `Posted`: `Проведен`;
- `DeletionMark`: `ПометкаУдаления`;
- `Number`: `Номер`.

The shared `StandartAttributeNameToYAML` map currently lacks `Type`. Implementation should add a local
`MetadataDocumentJournalStandardAttributeNames` map for the journal, rather than expanding the global map for a name
that is not global.

New child object: `Column`.

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `indexing` | `Indexing` | `Индексирование` | `SystemEnumeration: Indexing` |
| `references` | `References` | `Ссылки` | `MetadataItemLinks` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Default policy:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`;
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`;
- parent `comment`, forms, list presentations, and `explanation` use XML raw empty defaults from `minimal.xml`;
- column `comment` and `synonym` use XML raw empty defaults;
- column `indexing`: `defaultValueXML: "DontIndex"`, `implicitValueYAML: "DontIndex"`;
- `objectBelonging`: hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `runtimeOnly: true`;
- `RegisteredDocuments` from `minimal.xml` is fixture content, not a default; keep it explicit in YAML.

Implementation notes:

- Add `MetadataDocumentJournalColumn` under `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/`
  and a collection rule for `Column[]`, mirroring existing child collections such as `MetadataCommands` and
  `MetadataAttributes`. The common object name must keep `DocumentJournal` in it; plain `Column` is too generic.
- Reuse `AdditionalIndex`, `Help`, `Module`, `ChildFormNames`, `ChildTemplateNames`, `MetadataCommands`,
  `MetadataItemLinks`, and `StandardAttributeDescriptions`.
- Add `childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }]`, otherwise
  `Commands/Команда1/Ext/CommandModule.bsl` will not be copied during convert/sync.
- Current `sync/nkdk/ЖурналДокументовВсеСвойства/Свойства.yaml` and `sync/data.ts` are empty stubs. Implementation
  must generate model fixtures and expected YAML from XML instead of treating the stubs as a complete contract.

Problems and questions:

1. `RegisteredDocuments` appears in `minimal.xml` with one document. Treat it as fixture content, not as a default;
   omitting it from YAML should export an empty/raw XML value only when the reference XML has no value.
2. `Column` is a real child object declared by XDTO, but it is not a top-level metadata item. Put it in
   `commonObjects/metadataDocumentJournalColumn` so the type/rule is reusable, while the name still states that this
   is specifically a document-journal column.
3. `Column.References` points to document attributes and should use `MetadataItemLinks`; no additional `referenceScope`
   for now.
4. `StandardAttributes.Type` needs an object-local standard-attribute-name map. Expanding the shared map would make
   `Type` look valid for unrelated objects.
5. External files include `AdditionalIndexes`, object-level `Help`, `ManagerModule`, form/template files, and command
   module. This object exercises every existing external sync path except object module.
6. User decision: create a common object, but name it specifically for document journals, not as a generic `Column`.
7. User decision: `RegisteredDocuments` is content, not a YAML default, even when it appears in `minimal.xml`.
8. User decision: keep `DocumentJournal.Column.References` as plain `MetadataItemLinks` without an additional
   `referenceScope` for now.
9. User decision: put `DocumentJournalColumn` under `commonObjects/metadataDocumentJournalColumn`, following the
   existing pattern for nested metadata objects while keeping the name domain-specific.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `full.xml` and `minimal.xml`;
- tests must cover `RegisteredDocuments`, both `Column` entries, and `StandardAttributes.Type`;
- sync from XML verifies `Свойства.yaml`, `МодульМенеджера.bsl`, `Справка/`, `Формы/ФормаСписка/...`,
  `Шаблоны/Макет/Template.xml`, `Команды/Команда1.bsl`, and `ДополнительныеИндексы`;
- sync to XML verifies `ЖурналДокументовВсеСвойства.xml`, `Ext/ManagerModule.bsl`, `Ext/Help.xml`,
  `Ext/AdditionalIndexes.xml`, `Commands/Команда1/Ext/CommandModule.bsl`, `Forms/ФормаСписка.xml`,
  `Forms/ФормаСписка/Ext/Form.xml`, `Templates/Макет.xml`, and `Templates/Макет/Ext/Template.txt`.

## Object: MetadataHTTPService

Risk is medium.

- `itemType`: `MetadataHTTPService`
- `itemTypePrefix`: `HTTPСервис`
- `xmlDir`: `HTTPServices`
- XML container: `HTTPService`
- XDTO source: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, types `HTTPService`,
  `HTTPServiceProperties`, `HTTPServiceChildObjects`, `URLTemplate`, and `Method`
- `InternalInfo`: absent in current fixtures and not declared by the XDTO object
- child objects:
  - `URLTemplate[]` through a new local collection type, for example `MetadataHTTPServiceURLTemplates`;
  - nested `Method[]` inside each URL template through a new local collection type, for example
    `MetadataHTTPServiceMethods`
- external files:
  - `Ext/Module.bsl` -> `Модуль.bsl` through `Module`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `rootURL` | `RootURL` | `КорневойURL` | `string` |
| `reuseSessions` | `ReuseSessions` | `ПовторноеИспользованиеСеансов` | `SystemEnumeration: SessionReuseMode` |
| `sessionMaxAge` | `SessionMaxAge` | `ВремяЖизниСеанса` | `number` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

New child object: `URLTemplate`.

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `template` | `Template` | `Шаблон` | `string` |
| `methods` | `Method` | `Методы` | local method collection |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

New nested child object: `Method`.

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `httpMethod` | `HTTPMethod` | `HTTPМетод` | `SystemEnumeration: HTTPMethod` |
| `handler` | `Handler` | `Обработчик` | `string` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Default policy:

- `reuseSessions`: `defaultValueXML: "AutoUse"`, `implicitValueYAML: "AutoUse"`;
- `sessionMaxAge`: `defaultValueXML: 20`, `implicitValueYAML: 20`;
- parent and child `comment` use XML raw empty defaults;
- method `httpMethod`: `defaultValueXML: "GET"`; no `implicitValueYAML` for now, so keep `HTTPMethod=GET` explicit in YAML
  until the platform default is confirmed by a dedicated minimal-method fixture;
- `objectBelonging`: hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `runtimeOnly: true`;
- do not treat `RootURL`, `Template`, or `Handler` from fixtures as YAML defaults.

Implementation notes:

- Add rules for `URLTemplate` and `Method`; prefer common-object paths named for the service domain, for example
  `metadataHTTPServiceURLTemplate` and `metadataHTTPServiceMethod`, so the names are explicit and not generic.
- Reuse existing `SystemEnumeration` values `SessionReuseMode` and `HTTPMethod`.
- Current `sync/nkdk/HTTPСервисВсеСвойства/Свойства.yaml` and `sync/data.ts` are empty stubs. Implementation must
  generate model fixtures and expected YAML from XML instead of treating the stubs as a complete contract.

Problems and questions:

1. `URLTemplate` and nested `Method` are XDTO child objects, but neither is a top-level metadata item. Following the
   document-journal decision, make them common objects with domain-specific names, not generic `URLTemplate`/`Method`.
2. The XML directory and item prefix must preserve the exact mixed spelling from fixtures: `HTTPServices` and
   `HTTPСервис`, where the `С` in `Сервис` is Cyrillic.
3. `Method.HTTPMethod=GET` appears in the default-named method in `full.xml`, but `minimal.xml` has no method.
   Use `defaultValueXML: "GET"` for XML restoration, but do not set `implicitValueYAML` until the platform default is
   confirmed during test generation; keep it explicit in generated YAML for the default method.
4. User decision: `SessionMaxAge` is an integer-valued number with `defaultValueXML: 20` and `implicitValueYAML: 20`;
   no custom decimal handling is needed.
5. External sync is only object-level `Ext/Module.bsl`; there are no forms, templates, help, commands, or additional
   indexes for this object.
6. User decision: put `URLTemplate` and `Method` in `commonObjects` with HTTP-service-specific names; preserve the
   exact `HTTPСервис` prefix with Cyrillic `С`; keep `HTTPMethod=GET` explicit in YAML until the platform default is
   confirmed by implementation tests.
7. User decision: set `Method.HTTPMethod` `defaultValueXML` to `"GET"` now, but keep YAML explicit until confirmed.
8. User decision: put HTTP service child objects under `commonObjects` as `metadataHTTPServiceURLTemplate` and
   `metadataHTTPServiceMethod`.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `full.xml` and `minimal.xml`;
- tests must cover both URL templates and both methods, including `HEAD` and default `GET`;
- sync from XML verifies `Свойства.yaml` and `Модуль.bsl`;
- sync to XML verifies `HTTPСервисВсеСвойства.xml` and `Ext/Module.bsl`.

## Object: MetadataInformationRegister

Risk is high.

- `itemType`: `MetadataInformationRegister`
- `itemTypePrefix`: `РегистрСведений`
- `xmlDir`: `InformationRegisters`
- XML container: `InformationRegister`
- XDTO source: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, types `InformationRegister`,
  `InformationRegisterProperties`, `InformationRegisterChildObjects`, `Dimension`, and `Resource`
- `InternalInfo`: seven generated types:
  - `InformationRegisterRecord`, category `Record`;
  - `InformationRegisterManager`, category `Manager`;
  - `InformationRegisterSelection`, category `Selection`;
  - `InformationRegisterList`, category `List`;
  - `InformationRegisterRecordSet`, category `RecordSet`;
  - `InformationRegisterRecordKey`, category `RecordKey`;
  - `InformationRegisterRecordManager`, category `RecordManager`
- child objects:
  - `Resource[]` through a new collection type;
  - `Attribute[]` through existing `MetadataAttributes`;
  - `Dimension[]` through a new collection type;
  - `Form[]` through `ChildFormNames`;
  - `Template[]` through `ChildTemplateNames`;
  - `Command[]` through existing `MetadataCommands`
- external files:
  - `Ext/AdditionalIndexes.xml` -> existing `AdditionalIndex`;
  - optional `Ext/RecordSetModule.bsl` -> `МодульНабораЗаписей.bsl` through `Module`;
  - optional `Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl` through `Module`;
  - optional `Ext/Help.xml` -> `Справка/` through `Help`;
  - `Forms/<form>.xml` and optional `Forms/<form>/Ext/Form/Module.bsl` through `ChildFormNames`;
  - `Templates/<template>.xml` and optional `Templates/<template>/Ext/Template.txt` through `ChildTemplateNames`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `defaultRecordForm` | `DefaultRecordForm` | `ОсновнаяФормаЗаписи` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `auxiliaryRecordForm` | `AuxiliaryRecordForm` | `ДополнительнаяФормаЗаписи` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `informationRegisterPeriodicity` | `InformationRegisterPeriodicity` | `Периодичность` | `SystemEnumeration: InformationRegisterPeriodicity` |
| `writeMode` | `WriteMode` | `РежимЗаписи` | `SystemEnumeration: RegisterWriteMode` |
| `mainFilterOnPeriod` | `MainFilterOnPeriod` | `ОсновнойОтборПоПериоду` | `boolean` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: UseFullTextSearch` |
| `enableTotalsSliceFirst` | `EnableTotalsSliceFirst` | `ВключатьИтогиСрезПервых` | `boolean` |
| `enableTotalsSliceLast` | `EnableTotalsSliceLast` | `ВключатьИтогиСрезПоследних` | `boolean` |
| `recordPresentation` | `RecordPresentation` | `ПредставлениеЗаписи` | `I8nText` |
| `extendedRecordPresentation` | `ExtendedRecordPresentation` | `РасширенноеПредставлениеЗаписи` | `I8nText` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `dataHistory` | `DataHistory` | `ИсторияДанных` | `SystemEnumeration: DataHistoryUse` |
| `updateDataHistoryImmediatelyAfterWrite` | `UpdateDataHistoryImmediatelyAfterWrite` | `ОбновлятьИсториюДанныхСразуПослеЗаписи` | `boolean` |
| `executeAfterWriteDataHistoryVersionProcessing` | `ExecuteAfterWriteDataHistoryVersionProcessing` | `ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных` | `boolean` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Form references should use the current-object form scope. Standard attributes use the existing names:
`Active`, `LineNumber`, `Recorder`, and `Period`.

New child object: `Resource`.

Use a shared register-field property set based on the existing `MetadataAttribute` shape, plus fields that current
resource fixtures need:

- `indexing`: `SystemEnumeration: Indexing`;
- `fullTextSearch`: `SystemEnumeration: UseFullTextSearch`;
- `dataHistory`: `SystemEnumeration: DataHistoryUse`;
- `binaryDataStorageLocationUse`: `SystemEnumeration: BinaryDataStorageLocationUse`;
- `binaryDataStorageLocationUseField`: `string` / `MDObjectRef`.

New child object: `Dimension`.

Use the same shared register-field property set, plus fields that current dimension fixtures need:

- `master`: `boolean`;
- `mainFilter`: `boolean`;
- `denyIncompleteValues`: `boolean`;
- `indexing`: `SystemEnumeration: Indexing`;
- `fullTextSearch`: `SystemEnumeration: UseFullTextSearch`;
- `dataHistory`: `SystemEnumeration: DataHistoryUse`;
- `typeReductionMode`: `SystemEnumeration: TypeReductionMode`.

Properties outside current InformationRegister fixtures:

- XDTO `DimensionProperties` is shared with other register families and also declares `DocumentMap`,
  `RegisterRecordsMap`, `RegisterDimension`, `LeadingRegisterData`, `BaseDimension`, `ScheduleLink`,
  `UseInTotals`, `Balance`, and accounting-flag links.
- XDTO `ResourceProperties` also declares accounting-specific links and data-source names.
- Do not implement these outside-fixture fields for `MetadataInformationRegister` unless the next object in this
  series needs them. Reassess them during `MetadataAccumulationRegister` research.

Default policy:

- parent defaults from `minimal.xml`; all scalar platform defaults should get both `defaultValueXML` and
  `implicitValueYAML`:
  - `useStandardCommands: true`;
  - `editType: "InDialog"`;
  - `informationRegisterPeriodicity: "Nonperiodical"`;
  - `writeMode: "Independent"` (`defaultValueXML: "Independent"`, `implicitValueYAML: "Independent"`);
  - `mainFilterOnPeriod: false`;
  - `includeHelpInContents: false`;
  - `dataLockControlMode: "Managed"`;
  - `fullTextSearch: "DontUse"`;
  - `enableTotalsSliceFirst: false`;
  - `enableTotalsSliceLast: false`;
  - `dataHistory: "DontUse"`;
  - `updateDataHistoryImmediatelyAfterWrite: false`;
  - `executeAfterWriteDataHistoryVersionProcessing: false`;
- parent empty strings and presentations use XML raw empty defaults;
- child field defaults follow the existing `MetadataAttribute` defaults where the XML shape is identical; enum-like field
  defaults such as `fillChecking`, `choiceFoldersAndItems`, `quickChoice`, `createOnInput`, `choiceHistoryOnInput`,
  `indexing`, `fullTextSearch`, and `dataHistory` keep the same `implicitValueYAML` policy;
- dimension-specific defaults from `reg.xml`/default dimension fixture; confirmed scalar defaults should get both
  `defaultValueXML` and `implicitValueYAML`:
  - `master: false`;
  - `mainFilter: true`;
  - `denyIncompleteValues: false`;
  - `typeReductionMode: "TransformValues"`;
- resource from `minimal.xml` is fixture content, not a default; keep it explicit in YAML;
- dimension from `reg.xml` is fixture content, not a default; keep it explicit in YAML;
- `objectBelonging`: hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `runtimeOnly: true`.

Implementation notes:

- Add shared common objects for register `Resource` and `Dimension`, because XDTO uses the same `Resource` and
  `Dimension` object types for several register families. Use names that keep the domain clear, for example
  `metadataRegisterResource` and `metadataRegisterDimension`.
- Extract a shared register-field property structure, similar to `commonTabularSectionProperties` in
  `metadataTabularSection/rules.ts`. Reuse it from register `Resource`, register `Dimension`, and register-specific
  `Attribute` rules so the common metadata-field properties and register-only additions stay in one place.
- The `reg.xml` fixture is required, not optional: it covers an explicit non-default
  `WriteMode=RecorderSubordinate` and a dimension-only child set.
- Current `sync/nkdk/РегистрСведенийВсеСвойстваНезависимый/Свойства.yaml` and `sync/data.ts` are empty stubs.
  Implementation must generate model fixtures and expected YAML from XML instead of treating the stubs as a complete
  contract.

Problems and questions:

1. `Resource` and `Dimension` should be shared common objects, not information-register-specific objects. They are
   XDTO-level register child types and `MetadataAccumulationRegister` needs the same containers next.
2. The shared rules should include only the fields covered by Information/Accumulation register fixtures and common
   metadata-field behavior. Accounting/calculation-specific fields from XDTO (`AccountingFlag`, `BaseDimension`,
   `ScheduleLink`, `NameInDataSource`, and similar) should remain out of this series.
3. Current information-register fixtures show that `Resource` also needs `Indexing`, `FullTextSearch`, `DataHistory`,
   `BinaryDataStorageLocationUse`, and `BinaryDataStorageLocationUseField`; this is broader than the first draft.
4. User decision: create a shared register-field structure and reuse it for register `Resource`, `Dimension`, and
   `Attribute`, following the tabular-section pattern. Existing plain `MetadataAttributes` should not be used for
   register attributes if that would drop `Indexing`, `FullTextSearch`, `DataHistory`, or binary-storage fields.
5. `minimal.xml` is not an empty object: it contains a resource. `reg.xml` contains a dimension and explicit
   non-default `WriteMode=RecorderSubordinate`. Treat resource and dimension as required coverage, not defaults to omit
   from YAML.
6. External files in sync include `AdditionalIndexes`, forms, template, and command module. There is no current
   `Help`, `RecordSetModule`, or `ManagerModule` file in the sync fixture despite XDTO declaring them; include the
   rules, but tests should not expect files that are absent.
7. The concrete object names can be `metadataRegisterResource`, `metadataRegisterDimension`, and
   `metadataRegisterAttribute`, backed by one shared property-set constant.
8. User decision: the resource present in information-register `minimal.xml` is fixture content, not a YAML default.
9. User decision: the dimension present in information-register `reg.xml` is fixture content, not a YAML default.
10. User decision: information-register `WriteMode` default is `Independent`; `RecorderSubordinate` from `reg.xml` is
    an explicit non-default YAML value.
11. User decision: register attributes use separate `metadataRegisterAttribute`, not existing `metadataAttribute`,
    because register-only fields must be preserved.
12. User decision: `metadataRegisterResource`, `metadataRegisterDimension`, and `metadataRegisterAttribute` share one
    base field-property set; `UseInTotals` is added only by `metadataRegisterDimension`.
13. User decision: register `Resource`, `Dimension`, and `Attribute` live in `commonObjects`, as do all similar new
    nested metadata structures in this series.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `full.xml`, `minimal.xml`, and `reg.xml`;
- tests must cover resources, dimensions, attributes, standard attributes, `WriteMode=RecorderSubordinate`,
  binary-data-storage fields, and both `EnableTotalsSlice*` flags;
- sync from XML verifies `Свойства.yaml`, `Формы/ФормаЗаписи/...`, `Формы/ФормаСписка/...`,
  `Шаблоны/Макет/Template.xml`, `Команды/Команда1.bsl`, and `ДополнительныеИндексы`;
- sync to XML verifies `РегистрСведенийВсеСвойстваНезависимый.xml`, `Ext/AdditionalIndexes.xml`,
  `Commands/Команда1/Ext/CommandModule.bsl`, `Forms/ФормаЗаписи.xml`, `Forms/ФормаЗаписи/Ext/Form.xml`,
  `Forms/ФормаСписка.xml`, `Forms/ФормаСписка/Ext/Form.xml`, and `Templates/Макет.xml`.

## Object: MetadataAccumulationRegister

Risk is high.

- `itemType`: `MetadataAccumulationRegister`
- `itemTypePrefix`: `РегистрНакопления`
- `xmlDir`: `AccumulationRegisters`
- XML container: `AccumulationRegister`
- XDTO source: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, types `AccumulationRegister`,
  `AccumulationRegisterProperties`, `AccumulationRegisterChildObjects`, `Dimension`, and `Resource`
- `InternalInfo`: six generated types:
  - `AccumulationRegisterRecord`, category `Record`;
  - `AccumulationRegisterManager`, category `Manager`;
  - `AccumulationRegisterSelection`, category `Selection`;
  - `AccumulationRegisterList`, category `List`;
  - `AccumulationRegisterRecordSet`, category `RecordSet`;
  - `AccumulationRegisterRecordKey`, category `RecordKey`
- child objects:
  - `Resource[]` through a shared register-resource collection type;
  - `Attribute[]` through a shared register-attribute collection type;
  - `Dimension[]` through a shared register-dimension collection type;
  - `Form[]` through `ChildFormNames`;
  - `Template[]` through `ChildTemplateNames`;
  - `Command[]` through existing `MetadataCommands`
- external files:
  - `Ext/AdditionalIndexes.xml` -> existing `AdditionalIndex`;
  - `Ext/Help.xml` -> `Справка/` through `Help`;
  - `Ext/RecordSetModule.bsl` -> `МодульНабораЗаписей.bsl` through `Module`;
  - `Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl` through `Module`;
  - `Ext/Aggregates.xml` -> new `AccumulationRegisterAggregates` external property;
  - `Forms/<form>.xml` and optional `Forms/<form>/Ext/Form/Module.bsl` through `ChildFormNames`;
  - `Templates/<template>.xml` and optional `Templates/<template>/Ext/Template.txt` through `ChildTemplateNames`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `registerType` | `RegisterType` | `ВидРегистра` | `SystemEnumeration: AccumulationRegisterType` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: UseFullTextSearch` |
| `enableTotalsSplitting` | `EnableTotalsSplitting` | `РазделениеИтогов` | `boolean` |
| `aggregates` | `Aggregates` | `Агрегаты` | `AccumulationRegisterAggregates` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Form references should use the current-object form scope. Standard attributes use the same names as the register
fixtures already supported by the shared map: `Active`, `LineNumber`, `Recorder`, and `Period`.

Shared register child objects:

- Extract a shared register-field property structure and reuse it for register `Resource`, `Dimension`, and
  register-specific `Attribute`, because both `MetadataInformationRegister` and `MetadataAccumulationRegister` need
  the same XML field containers and register-only field additions.
- The first shared `Resource` rule should cover the common metadata-field shape plus optional `fullTextSearch`,
  `indexing`, `dataHistory`, `binaryDataStorageLocationUse`, and `binaryDataStorageLocationUseField`.
- The first shared `Dimension` rule should cover the common metadata-field shape plus optional `master`,
  `mainFilter`, `denyIncompleteValues`, `indexing`, `fullTextSearch`, `dataHistory`, `typeReductionMode`, and
  `useInTotals`.
- The first shared register `Attribute` rule should reuse the same shared field structure and allow optional
  `indexing`, `fullTextSearch`, `dataHistory`, `binaryDataStorageLocationUse`, and
  `binaryDataStorageLocationUseField`.
- Accounting- and calculation-specific XDTO fields remain outside this series until their objects are implemented.

Default policy:

- parent defaults from `minimal.xml`; all scalar platform defaults should get both `defaultValueXML` and
  `implicitValueYAML`:
  - `useStandardCommands: true`;
  - `registerType: "Balance"` (`defaultValueXML: "Balance"`, `implicitValueYAML: "Balance"`);
  - `includeHelpInContents: false`;
  - `dataLockControlMode: "Managed"`;
  - `fullTextSearch: "DontUse"`;
  - `enableTotalsSplitting: true`;
- parent empty strings and presentations use XML raw empty defaults;
- register-field defaults follow the shared register field policy from `MetadataInformationRegister`;
- accumulation dimension `useInTotals`: `defaultValueXML: true`, `implicitValueYAML: true`;
- resource from `minimal.xml` is fixture content, not a default; keep it explicit in YAML;
- `objectBelonging`: hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `runtimeOnly: true`.

Implementation notes:

- Implement `MetadataInformationRegister` and `MetadataAccumulationRegister` through shared register field rules
  rather than duplicating `Dimension`, `Resource`, and register `Attribute` behavior.
- Implement `AccumulationRegisterAggregates` under `commonObjects` for `Ext/Aggregates.xml`. The forgotten sync fixture
  is now present and contains `AccumulationRegisterAggregates/Aggregate[]` with `Use`, `Periodicity`, and per-dimension
  boolean flags. The shape is small enough to parse rather than preserve as opaque XML.
  - `Use` uses existing `SystemEnumeration: AccumulationRegisterAggregateUse` (`Auto`, `Always`);
  - `Periodicity` uses existing `SystemEnumeration: AccumulationRegisterAggregatePeriodicity`;
  - `Dimensions/Dimension` is a list of `{ ref: MDObjectRef, use: boolean }` XML flags.
- Current `sync/nkdk/РегистрНакопленияВсеСвойстваОбороты/Свойства.yaml` and `sync/data.ts` are empty stubs.
  Implementation must generate model fixtures and expected YAML from XML instead of treating the stubs as a complete
  contract.

Problems and questions:

1. The shared register-field structure fits `AccumulationRegister`: resources and attributes use the same base field
   shape, while dimensions add `UseInTotals`.
2. `UseInTotals` appears only on accumulation-register dimensions in current fixtures. Keep it optional on the shared
   register dimension rule, not on the base shared field structure.
3. `Resource` in accumulation fixtures has `FullTextSearch` but not `Indexing`/`DataHistory`; those fields still must
   remain optional because information-register resources need them.
4. User correction: `Ext/Aggregates.xml` is part of the current sync fixture. Add a typed external property for it,
   with root `AccumulationRegisterAggregates` and child `Aggregate[]`.
5. User correction: `RecordSetModule` and `ManagerModule` are also part of the current sync fixture and must be
   copied through the usual `Module` external sync path.
6. `minimal.xml` contains a resource and default `RegisterType=Balance`; `full.xml` contains explicit non-default
   `RegisterType=Turnovers`. Cover both as fixture variants, not as values inferred from names.
7. User decision: `UseInTotals` stays an optional field of register dimension only, not part of the base shared
   register-field structure.
8. User decision: aggregate dimensions use a YAML map keyed by current-register dimension name, for example
   `ИзмерениеВсеСвойства: Истина`. Full XML refs are restored from the current accumulation register context.
9. User decision: accumulation-register dimension `UseInTotals=true` is a scalar default and should be hidden from YAML
   with `implicitValueYAML: true`.
10. User decision: the resource present in accumulation-register `minimal.xml` is fixture content, not a YAML default.
11. User decision: accumulation-register `RegisterType=Balance` is the XML/YAML default; `Turnovers` remains explicit.
12. User decision: put `AccumulationRegisterAggregates` in `commonObjects`, not under the applied object.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `full.xml` and `minimal.xml`;
- tests must cover `RegisterType=Turnovers`, `RegisterType=Balance`, resources, dimensions, attributes,
  `UseInTotals`, `EnableTotalsSplitting`, aggregates, modules, help, and additional indexes;
- sync from XML verifies `Свойства.yaml`, `Справка/`, `Формы/ФормаСписка/...`, `Шаблоны/Макет/Template.xml`,
  `Команды/Команда1.bsl`, `МодульМенеджера.bsl`, `МодульНабораЗаписей.bsl`, `Агрегаты`, and
  `ДополнительныеИндексы`;
- sync to XML verifies `РегистрНакопленияВсеСвойстваОбороты.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`,
  `Ext/Aggregates.xml`, `Ext/ManagerModule.bsl`, `Ext/RecordSetModule.bsl`,
  `Commands/Команда1/Ext/CommandModule.bsl`, `Forms/ФормаСписка.xml`, `Forms/ФормаСписка/Ext/Form.xml`, and
  `Templates/Макет.xml`.

## Object: MetadataExchangePlan

Risk is high.

- `itemType`: `MetadataExchangePlan`
- `itemTypePrefix`: `ПланОбмена`
- `xmlDir`: `ExchangePlans`
- XML container: `ExchangePlan`
- XDTO source: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, types `ExchangePlan`,
  `ExchangePlanProperties`, `ExchangePlanChildObjects`, `ExchangePlanContent`, and `ExchangePlanContentItem`
- `InternalInfo`: `xr:ThisNode` plus five generated types:
  - `ExchangePlanObject`, category `Object`;
  - `ExchangePlanRef`, category `Ref`;
  - `ExchangePlanSelection`, category `Selection`;
  - `ExchangePlanList`, category `List`;
  - `ExchangePlanManager`, category `Manager`
- child objects:
  - `Attribute[]` through existing `MetadataAttributes`;
  - `TabularSection[]` through an exchange-plan-specific tabular-section wrapper rule/type, backed by the common
    tabular-section property set;
  - `Form[]` through `ChildFormNames`;
  - `Template[]` through `ChildTemplateNames`;
  - `Command[]` through existing `MetadataCommands`
- external files:
  - `Ext/AdditionalIndexes.xml` -> existing `AdditionalIndex`;
  - `Ext/Content.xml` -> new small `ExchangePlanContent` property type;
  - `Ext/ObjectModule.bsl` -> `МодульОбъекта.bsl` through `Module`;
  - `Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl` through `Module`;
  - `Ext/Help.xml` -> `Справка/` through `Help`;
  - `Forms/<form>.xml` and optional `Forms/<form>/Ext/Form/Module.bsl` through `ChildFormNames`;
  - `Templates/<template>.xml` and optional `Templates/<template>/Ext/Template.txt` through `ChildTemplateNames`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `codeLength` | `CodeLength` | `ДлинаКода` | `number` |
| `codeAllowedLength` | `CodeAllowedLength` | `ДопустимаяДлинаКода` | `SystemEnumeration: AllowedLength` |
| `descriptionLength` | `DescriptionLength` | `ДлинаНаименования` | `number` |
| `content` | `Content` | `Состав` | `ExchangePlanContent` |
| `defaultPresentation` | `DefaultPresentation` | `ОсновноеПредставление` | `SystemEnumeration: DataExchangeMainPresentation` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `quickChoice` | `QuickChoice` | `БыстрыйВыбор` | `boolean` |
| `choiceMode` | `ChoiceMode` | `РежимВыбора` | `SystemEnumeration: ChoiceMode` |
| `inputByString` | `InputByString` | `ВводПоСтроке` | `MetadataFields` |
| `searchStringModeOnInputByString` | `SearchStringModeOnInputByString` | `РежимСтрокиПоискаПриВводеПоСтроке` | `SystemEnumeration: SearchStringModeOnInputByString` |
| `fullTextSearchOnInputByString` | `FullTextSearchOnInputByString` | `ПолнотекстовыйПоискПриВводеПоСтроке` | `SystemEnumeration: FullTextSearchOnInputByString` |
| `choiceDataGetModeOnInputByString` | `ChoiceDataGetModeOnInputByString` | `РежимПолученияДанныхВыбораПриВводеПоСтроке` | `SystemEnumeration: ChoiceDataGetModeOnInputByString` |
| `defaultObjectForm` | `DefaultObjectForm` | `ОсновнаяФормаОбъекта` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `defaultChoiceForm` | `DefaultChoiceForm` | `ОсновнаяФормаВыбора` | `string` |
| `auxiliaryObjectForm` | `AuxiliaryObjectForm` | `ДополнительнаяФормаОбъекта` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `auxiliaryChoiceForm` | `AuxiliaryChoiceForm` | `ДополнительнаяФормаВыбора` | `string` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `characteristics` | `Characteristics` | `Характеристики` | `CharacteristicsDescriptions` |
| `basedOn` | `BasedOn` | `ОснованНа` | `MetadataItemLinks` |
| `distributedInfoBase` | `DistributedInfoBase` | `РаспределеннаяИнформационнаяБаза` | `boolean` |
| `includeConfigurationExtensions` | `IncludeConfigurationExtensions` | `ВключатьРасширенияКонфигурации` | `boolean` |
| `createOnInput` | `CreateOnInput` | `СозданиеПриВводе` | `SystemEnumeration: CreateOnInput` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `dataLockFields` | `DataLockFields` | `ПоляБлокировкиДанных` | `MetadataFields` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: UseFullTextSearch` |
| `objectPresentation` | `ObjectPresentation` | `ПредставлениеОбъекта` | `I8nText` |
| `extendedObjectPresentation` | `ExtendedObjectPresentation` | `РасширенноеПредставлениеОбъекта` | `I8nText` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `dataHistory` | `DataHistory` | `ИсторияДанных` | `SystemEnumeration: DataHistoryUse` |
| `updateDataHistoryImmediatelyAfterWrite` | `UpdateDataHistoryImmediatelyAfterWrite` | `ОбновлятьИсториюДанныхСразуПослеЗаписи` | `boolean` |
| `executeAfterWriteDataHistoryVersionProcessing` | `ExecuteAfterWriteDataHistoryVersionProcessing` | `ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных` | `boolean` |
| `objectBelonging` | `ObjectBelonging` | `ПринадлежностьОбъекта` | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Form references should use the current-object form scope. `InputByString` and `DataLockFields` should keep using the
existing `MetadataFields` type; current fixtures cover `Description`, `Code`, and `Description` data-lock fields.

Standard attribute names:

- `ExchangeDate`: `ДатаОбмена`;
- `ThisNode`: `ЭтотУзел`;
- `ReceivedNo`: `НомерПринятого`;
- `SentNo`: `НомерОтправленного`;
- `Ref`: `Ссылка`;
- `DeletionMark`: `ПометкаУдаления`;
- `Description`: `Наименование`;
- `Code`: `Код`.

The shared `StandartAttributeNameToYAML` map currently lacks `ExchangeDate`, `ThisNode`, `ReceivedNo`, and `SentNo`.
Implementation should add an object-local map for exchange plans, as `MetadataDocument` and `MetadataCatalog` do,
instead of expanding the global map for names that are not global.

New external property: `ExchangePlanContent`.

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `metadata` | `Metadata` | `Метаданные` | `string` / `MDObjectRef` |
| `autoRecord` | `AutoRecord` | `Авторегистрация` | `SystemEnumeration: AutoChangeRecord` |

`Ext/Content.xml` has root `ExchangePlanContent` and `Item[]`. The fixture values prove both
`AutoRecord=Allow` and `AutoRecord=Deny`; system enumeration YAML already contains `Разрешить` and `Запретить`.
Parse this property rather than preserving it as opaque XML, because the XDTO shape is small and stable.

Default policy:

- parent defaults from `minimal.xml`; all scalar platform defaults should get both `defaultValueXML` and
  `implicitValueYAML`, even where older `MetadataCatalog` rules do not:
  - `useStandardCommands: true`;
  - `codeLength: 9`;
  - `codeAllowedLength: "Variable"`;
  - `descriptionLength: 25`;
  - `defaultPresentation: "AsDescription"`;
  - `editType: "InDialog"`;
  - `quickChoice: false`;
  - `choiceMode: "BothWays"`;
  - `searchStringModeOnInputByString: "Begin"`;
  - `fullTextSearchOnInputByString: "DontUse"`;
  - `choiceDataGetModeOnInputByString: "Directly"`;
  - `distributedInfoBase: false`;
  - `includeConfigurationExtensions: false`;
  - `createOnInput: "DontUse"`;
  - `choiceHistoryOnInput: "Auto"`;
  - `includeHelpInContents: false`;
  - `dataLockControlMode: "Managed"`;
  - `fullTextSearch: "Use"`;
  - `dataHistory: "DontUse"`;
  - `updateDataHistoryImmediatelyAfterWrite: false`;
  - `executeAfterWriteDataHistoryVersionProcessing: false`;
- `InputByString` default comes from `minimal.xml` as `Description` and `Code`, but it is a `MetadataFields` collection;
  do not describe a YAML default for this type in the current series, so keep the value explicit in YAML when needed;
- `Content` is external fixture content, not a default; keep it explicit when `Ext/Content.xml` exists;
- `Characteristics`, `BasedOn`, `DataLockFields`, form refs, presentations, and `explanation` are empty raw XML defaults,
  not YAML defaults;
- `objectBelonging`: hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `runtimeOnly: true`.

Implementation notes:

- Add `MetadataExchangePlanStandardAttributeNames` locally instead of relying only on the shared standard-attribute
  map.
- Add `ExchangePlanContent` under `commonObjects`, following the rule that new nested/external metadata structures in
  this series live in common objects even when the first consumer is a single applied object.
- Extend `InternalInfo` handling or its rule options to preserve `xr:ThisNode`, because existing
  `commonObjects/internalInfo` imports/exports only `xr:GeneratedType`. On export, `xr:ThisNode` should come from
  reference data when a reference XML exists; otherwise it should be generated/preserved through the same UUID path as
  other reference-only internal values.
- Add an exchange-plan tabular-section rule variant, similar to the catalog/document variants in
  `metadataTabularSection/rules.ts`, so generated type names are `ExchangePlanTabularSection` and
  `ExchangePlanTabularSectionRow`.
- Add `childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }]`, otherwise
  `Commands/Команда1/Ext/CommandModule.bsl` will not be copied during convert/sync.
- Add `ObjectModule` and `ManagerModule` external module rules; the updated sync fixture contains both files.
- `DataExchangeMainPresentation` and `AutoChangeRecord` already exist in `systemEnumerations/types.ts`.
- Current `sync/nkdk/ПланОбменаВсеСвойства/Свойства.yaml` and `sync/data.ts` are empty stubs. Implementation must
  generate model fixtures and expected YAML from XML instead of treating the stubs as a complete contract.

Problems and questions:

1. `xr:ThisNode` is part of `InternalInfo`, present in both `full.xml` and `minimal.xml`, and is referenced by
   attributes/rights. Existing `InternalInfo` support drops it. Add explicit generic support and read the value from
   reference XML when available.
2. `ExchangePlanContent` XDTO also declares `ExtensionProperty`, but current `Ext/Content.xml` does not contain it.
   Add the property to `rules.ts` as a commented-out rule so the XDTO shape is documented without enabling an
   untested YAML/XML surface.
3. Exchange-plan attributes use the existing `MetadataAttribute` rule: it already includes `Indexing`,
   `FullTextSearch`, `DataHistory`, and binary-storage-location fields.
4. Exchange-plan tabular sections cannot use the current catalog/document tabular-section rule unchanged, because
   `InternalInfo` generated type names must use `ExchangePlanTabularSection` and `ExchangePlanTabularSectionRow`.
5. The updated sync fixture includes `ObjectModule` and `ManagerModule`; both must be copied through the usual
   `Module` external sync path and included in sync tests.
6. External files include `Content`, `AdditionalIndexes`, object-level `Help`, object module, manager module, forms,
   template, and command module.
7. User decision: extend `InternalInfo` with optional `ThisNode` support as a generic capability, not an
   exchange-plan-only workaround. On export, prefer the `ThisNode` value from reference XML when it exists.
8. User decision: `ExchangePlan.Content` is external content, not a YAML default; export it when `Ext/Content.xml`
   exists.
9. User decision: `BasedOn`, `Characteristics`, and `DataLockFields` stay empty XML defaults and should not get
   `implicitValueYAML`.
10. User decision: exchange-plan tabular sections should use an object-specific wrapper rule/type with generated type
    names `ExchangePlanTabularSection` and `ExchangePlanTabularSectionRow`.
11. User decision: put `ExchangePlanContent` in `commonObjects`, not under the applied object.
12. User decision: `ExchangePlanContent.ExtensionProperty` stays documented as a commented-out rule; do not enable it
    without a fixture.
13. User decision: `InternalInfo.ThisNode` is implemented as a generic `commonObjects/internalInfo` capability; on
    export, prefer the reference XML value and otherwise preserve/generate it through the existing UUID path.
14. User decision: exchange-plan external files (`Help`, `AdditionalIndexes`, modules, forms, templates, command module,
    and `Content`) are external content, not defaults.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `full.xml` and `minimal.xml`;
- tests must cover `xr:ThisNode`, `Ext/Content.xml`, all exchange-plan standard attributes, attributes,
  tabular sections, forms, templates, help, object/manager/command modules, and additional indexes;
- sync from XML verifies `Свойства.yaml`, `Состав`, `Справка/`, `Формы/ФормаУзла/...`,
  `Формы/ФормаСписка/...`, `Формы/ФормаВыбора/...`, `Шаблоны/Макет/Template.xml`, and
  `МодульОбъекта.bsl`, `МодульМенеджера.bsl`, `Команды/Команда1.bsl`, `ДополнительныеИндексы`;
- sync to XML verifies `ПланОбменаВсеСвойства.xml`, `Ext/Content.xml`, `Ext/AdditionalIndexes.xml`,
  `Ext/Help.xml`, `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`, `Commands/Команда1/Ext/CommandModule.bsl`,
  all three form XML files, `Templates/Макет.xml`, and `Templates/Макет/Ext/Template.txt`.

## Research Status

All planned objects have been researched and added to this design.
