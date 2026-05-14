# Applied Objects Agreed Design

## Context

This document records the applied metadata objects already agreed in the current sequential brainstorming pass.

Worktree:

`/Users/nikita/git/nakidka-core/.worktrees/applied-objects-spec`

Existing XML fixtures remain the source of truth and must not be changed. New expected YAML/model fixtures and tests may
be added only in this worktree.

The implementation policy is common for all objects below:

- prefer declarative `rules.ts`;
- do not add custom `fromXML`, `toXML`, `fromYAML`, or `toYAML` handlers unless a fixture cannot round-trip through
  current common rules;
- take YAML defaults for boolean, number, and `SystemEnumeration` fields from `minimal.xml`, `.res`, or a confirmed
  default fixture;
- do not treat empty strings, empty lists, empty `I8nText`, or external files as YAML defaults;
- preserve external XML files opaquely when their inner structure is out of the first implementation scope.

## Included Objects

- `metadataFunctionalOption`
- `metadataRole`
- `metadataScheduledJob`
- `metadataLanguage`
- `metadataCommonTemplate`
- `metadataStyle`
- `metadataCommandGroup`
- `metadataSubsystem`
- `metadataAccountingRegister`

## Deferred Objects

- `metadataExternalDataSource`: skipped for now because external data sources are complex and not currently demanded.
- `metadataCommonPicture`: skipped for now because sync contains both `Ext/Picture.xml` and
  `Ext/Picture/Picture.zip`; current external-file helpers copy a file, not an external folder with a nested archive.

## Object: MetadataFunctionalOption

- `itemType`: `MetadataFunctionalOption`
- `itemTypePrefix`: `ФункциональнаяОпция`
- XML container: `FunctionalOption`
- `.res` properties: `Name`, `Synonym`, `Comment`, `ObjectBelonging`, `ExtendedConfigurationObject`, `Location`,
  `PrivilegedGetMode`, `Content`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- `location`: use the property type already used by neighboring metadata where applicable
- `privilegedGetMode`: `boolean`, YAML `ПривилегированныйРежимПриПолучении`, `defaultValueXML: true`,
  `defaultValueYAML: true`
- `content`: existing `MetadataItemLinks`, YAML `СоставФункциональнойОпции`

Implementation should use `rules.ts`. `Content` is the `.res` `FuncOptionContentType` with repeated `Object` /
`MDObjectRef` values, so the existing `MetadataItemLinks` behavior is the right first implementation.

Testing:

- standard XML/YAML/sync tests;
- verify `PrivilegedGetMode=true` is omitted from YAML as a default;
- verify `Content` preserves all referenced metadata paths.

## Object: MetadataRole

- `itemType`: `MetadataRole`
- `itemTypePrefix`: `Роль`
- XML container: `Role`
- main object through `rules.ts`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- external rights file is copied opaquely:
  - property: `rights`
  - type: `Template`
  - `nkdkPath: "Rights.xml"`
  - `xmlPath: "Ext/Rights.xml"`

The first implementation does not parse `Rights.xml`; it only preserves it during XML -> YAML and YAML -> XML sync.

Testing:

- standard XML/YAML/sync tests;
- sync from XML copies `Ext/Rights.xml` to `Rights.xml`;
- sync to XML restores `Rights.xml` to `Ext/Rights.xml`.

## Object: MetadataScheduledJob

- `itemType`: `MetadataScheduledJob`
- `itemTypePrefix`: `РегламентноеЗадание`
- XML container: `ScheduledJob`
- `.res` properties: `MethodName`, `Description`, `Key`, `Schedule`, `Use`, `Predefined`,
  `RestartCountOnFailure`, `RestartIntervalOnFailure`
- `methodName`: YAML `ИмяМетода`
- `description`: YAML `Описание`
- `key`: YAML `Ключ`
- `use`: `boolean`, YAML `Использование`, `defaultValueXML: true`, `defaultValueYAML: true`
- `predefined`: `boolean`, YAML `Предопределенное`, `defaultValueXML: false`, `defaultValueYAML: false`
- `restartCountOnFailure`: `number`, YAML `КоличествоПовторовПриАварийномЗавершении`,
  `defaultValueXML: 3`, `defaultValueYAML: 3`
- `restartIntervalOnFailure`: `number`, YAML `ИнтервалПовтораПриАварийномЗавершении`,
  `defaultValueXML: 10`, `defaultValueYAML: 10`
- `schedule`: opaque external file:
  - type: `Template`
  - `nkdkPath: "Schedule.xml"`
  - `xmlPath: "Ext/Schedule.xml"`

The first implementation does not parse the schedule model.

Testing:

- standard XML/YAML/sync tests;
- verify scalar defaults above;
- sync from XML copies `Ext/Schedule.xml` to `Schedule.xml`;
- sync to XML restores `Schedule.xml` to `Ext/Schedule.xml`.

## Object: MetadataLanguage

- `itemType`: `MetadataLanguage`
- `itemTypePrefix`: `Язык`
- XML directory: `Languages`
- XML container: `Language`
- properties: `name`, `synonym`, `comment`, `languageCode`
- `languageCode`: YAML `КодЯзыка`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- no external files

Important sync path behavior from `/Users/nikita/git/roundTripElements/Languages`:

- XML files are named by object `Name`, for example `Languages/Русский.xml` and `Languages/Английский.xml`;
- the implementation must not derive file names from `LanguageCode` such as `ru.xml` or `en.xml`;
- nkdk path is `Язык/<Name>/Свойства.yaml`.

Testing:

- standard XML/YAML/sync tests;
- include a fixture with `Name=Русский`, `LanguageCode=ru`;
- sync must preserve `Languages/Русский.xml`.

## Object: MetadataCommonTemplate

- `itemType`: `MetadataCommonTemplate`
- `itemTypePrefix`: `ОбщийМакет`
- XML directory: `CommonTemplates`
- XML container: `CommonTemplate`
- `templateType`: `SystemEnumeration: TemplateType`, YAML `ВидМакета`, default `SpreadsheetDocument`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- external template file:
  - property: `template`
  - type: `Template`
  - `nkdkPath: "Template.xml"`
  - `xmlPath: "Ext/Template.xml"`

The current reference fixture in `/Users/nikita/git/roundTripElements/CommonTemplates` contains
`ТабличныйДокументВсеСвойства/Ext/Template.xml`. The file is preserved opaquely.

Testing:

- standard XML/YAML/sync tests;
- verify `TemplateType=SpreadsheetDocument` default;
- sync from XML copies `Ext/Template.xml` to `Template.xml`;
- sync to XML restores `Template.xml` to `Ext/Template.xml`.

## Object: MetadataStyle

- `itemType`: `MetadataStyle`
- `itemTypePrefix`: `Стиль`
- XML container: `Style`
- main object through `rules.ts`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- external style file:
  - property: `style`
  - type: `Template`
  - `nkdkPath: "Style.xml"`
  - `xmlPath: "Ext/Style.xml"`

The first implementation preserves `Ext/Style.xml` opaquely and does not parse style internals.

Testing:

- standard XML/YAML/sync tests;
- sync from XML copies `Ext/Style.xml` to `Style.xml`;
- sync to XML restores `Style.xml` to `Ext/Style.xml`.

## Object: MetadataCommandGroup

- `itemType`: `MetadataCommandGroup`
- `itemTypePrefix`: `ГруппаКоманд`
- XML directory: `CommandGroups`
- XML container: `CommandGroup`
- properties: `name`, `synonym`, `comment`, `representation`, `toolTip`, `picture`, `category`
- `representation`: `SystemEnumeration: ButtonRepresentation`, YAML `Представление`, default `Auto`
- `toolTip`: `I8nText`, YAML `Подсказка`
- `picture`: `Picture`, YAML `Картинка`
- `category`: `SystemEnumeration: CommandGroupCategory`, YAML `Категория`, default `NavigationPanel`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`

Do not merge this top-level object with `packages/core/metadata/commonObjects/metadataCommandGroup`. The common object is
a helper for `Command.Group`: it preserves both standard command groups such as `NavigationPanelOrdinary` and metadata
references such as `CommandGroup.<name>`. It is not the full top-level `CommandGroup` metadata item.

Do not replace that helper with `metadataValue`; `metadataValue` expects typed values with `_xsi:type` and does not
model this mixed standard-group-or-reference shape.

Testing:

- standard XML/YAML/sync tests;
- verify defaults for `representation` and `category`;
- verify top-level command group XML/YAML is independent from the existing command `group` helper.

## Object: MetadataSubsystem

Detailed design is kept in
`docs/superpowers/specs/2026-05-14-metadata-subsystem-design.md`.

Summary:

- `itemType`: `MetadataSubsystem`
- `itemTypePrefix`: `Подсистема`
- XML directory: `Subsystems`
- XML container: `Subsystem`
- implement through `rules.ts`
- preserve `Content` with `MetadataItemLinks`
- preserve child subsystem names through a small `ChildSubsystemNames` common property type
- copy external files opaquely:
  - `Ext/CommandInterface.xml` -> `CommandInterface.xml`
  - `Ext/Help.xml` and `Ext/Help/ru.html` -> `Справка/`

The first implementation does not parse command interface contents, help contents, or nested subsystem XML files as
separate child metadata items.

## Object: MetadataAccountingRegister

- `itemType`: `MetadataAccountingRegister`
- `itemTypePrefix`: `РегистрБухгалтерии`
- XML directory: `AccountingRegisters`
- XML container: `AccountingRegister`
- implement through `rules.ts`
- `InternalInfo` generated categories:
  - `Record`
  - `ExtDimensions`
  - `RecordSet`
  - `RecordKey`
  - `Selection`
  - `List`
  - `Manager`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `chartOfAccounts` | `ChartOfAccounts` | `ПланСчетов` | `string` / `MDObjectRef` |
| `correspondence` | `Correspondence` | `Корреспонденция` | `boolean` |
| `periodAdjustmentLength` | `PeriodAdjustmentLength` | `ДлинаУточненияПериода` | `number` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `enableTotalsSplitting` | `EnableTotalsSplitting` | `РазрешитьРазделениеИтогов` | `boolean` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: FullTextSearchUsing` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Child objects:

- `Dimension[]`: use shared `metadataRegisterDimension` collection, extended with accounting-specific fields.
- `Resource[]`: use shared `metadataRegisterResource` collection, extended with accounting-specific fields.
- `Attribute[]`: use shared `metadataRegisterAttribute` collection.
- `Form[]`: existing `ChildFormNames`.
- `Template[]`: existing `ChildTemplateNames`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so command modules are copied.

Accounting-specific child fields:

- `balance`: `boolean`, XML `Balance`, YAML `Балансовый`
- `accountingFlag`: `string` / `MDObjectRef`, XML `AccountingFlag`, YAML `ПризнакУчета`
- `extDimensionAccountingFlag`: `string` / `MDObjectRef`, XML `ExtDimensionAccountingFlag`,
  YAML `ПризнакУчетаСубконто`
- `denyIncompleteValues`: `boolean`, XML `DenyIncompleteValues`, YAML `ЗапретНезаполненныхЗначений`

`denyIncompleteValues` is present on accounting-register dimensions. `extDimensionAccountingFlag` is present on
accounting-register resources. The shared register common objects should allow object-specific extra fields instead of
forcing unrelated register families to expose every accounting-only field.

External files:

- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- `recordSetModule`: existing `Module`, XML `Ext/RecordSetModule.bsl`, nkdk `МодульНабораЗаписей.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`
- command modules through `MetadataCommands`

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `defaultValueYAML: true`
- `includeHelpInContents`: `defaultValueXML: false`, `defaultValueYAML: false`
- `correspondence`: `defaultValueXML: false`, `defaultValueYAML: false`
- `periodAdjustmentLength`: `defaultValueXML: 0`, `defaultValueYAML: 0`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `defaultValueYAML: "Managed"`
- `enableTotalsSplitting`: `defaultValueXML: true`, `defaultValueYAML: true`
- `fullTextSearch`: `defaultValueXML: "DontUse"`, `defaultValueYAML: "DontUse"`
- `objectBelonging`: hidden, `defaultValueYAML: "Native"`

Keep `chartOfAccounts`, resource rows, and dimension rows as explicit content, not YAML defaults. Empty strings,
presentations, empty form references, and empty standard-attribute values are XML defaults only.

Implementation notes:

- Preserve links to `ChartOfAccounts.*`, `AccountingFlag.*`, and `ExtDimensionAccountingFlag.*` as strings; the
  `metadataChartOfAccounts` object does not need to be implemented first.
- Reuse the register common objects already planned for information/accumulation registers. Add accounting-specific
  extension fields in a way that does not pollute non-accounting register YAML.
- Standard attribute names include accounting-specific names from fixtures: `PeriodAdjustment`, `Account`, `Active`,
  `LineNumber`, `Recorder`, `Period`, `ExtDimension1..4`, and `ExtDimensionType1..4`.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover `ChartOfAccounts`, `Correspondence`, `PeriodAdjustmentLength`, all accounting standard attributes,
  dimension/resource accounting flags, and `EnableTotalsSplitting=false` from the full fixture;
- sync from XML verifies `Свойства.yaml`, `МодульНабораЗаписей.bsl`, `МодульМенеджера.bsl`, `Справка/`,
  `ДополнительныеИндексы`, `Формы/ФормаСписка/...`, `Шаблоны/Макет/Template.xml`, and `Команды/Команда1.bsl`;
- sync to XML verifies `AccountingRegisters/<name>.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`,
  `Ext/Help/ru.html`, `Ext/RecordSetModule.bsl`, `Ext/ManagerModule.bsl`, form XML, template XML, and command module.

## Registries And Tests

Every included object should be added to the same registry set as other top-level applied objects:

- `MetadataItemTypeRegistry`;
- `PropertyTypeRegistry`;
- `PropertyRuleTypeKeys`;
- runtime `registerMetadataItemRule`;
- `packages/core/metadata/appliedObjects/index.ts`;
- `TopLevelMetadataItemRules`;
- migration top-level prefixes where configuration sync needs the object path.

Every included object gets the standard test set:

- `fromXML.test.ts`;
- `toXML.test.ts`;
- `fromYAML.test.ts`;
- `toYAML.test.ts`;
- `convertFromXML.test.ts`;
- `syncToXML.test.ts`.

Sync tests must cover opaque external-file copying for role, scheduled job, common template, style, and subsystem.

## Open Queue

Objects still needing brainstorming in this pass:

- `metadataBusinessProcess`
- `metadataCalculationRegister`
- `metadataChartOfAccounts`
- `metadataChartOfCalculationTypes`
- `metadataChartOfCharacteristicTypes`
- `metadataCommonForm`
- `metadataIntegrationService`
- `metadataTask`
- `metadataWebService`
