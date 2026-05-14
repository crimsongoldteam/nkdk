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
- `metadataBusinessProcess`
- `metadataCalculationRegister`

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

## Object: MetadataBusinessProcess

- `itemType`: `MetadataBusinessProcess`
- `itemTypePrefix`: `БизнесПроцесс`
- XML directory: `BusinessProcesses`
- XML container: `BusinessProcess`
- implement through `rules.ts`
- use `/Users/nikita/git/roundTripElements/BusinessProcesses` as the reference fixture source for external files
- `InternalInfo` generated categories:
  - `Object`
  - `Ref`
  - `Selection`
  - `List`
  - `Manager`
  - `RoutePointRef`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `inputByString` | `InputByString` | `ВводПоСтроке` | `MetadataFields` |
| `createOnInput` | `CreateOnInput` | `СозданиеПриВводе` | `SystemEnumeration: CreateOnInput` |
| `searchStringModeOnInputByString` | `SearchStringModeOnInputByString` | `РежимСтрокиПоискаПриВводеПоСтроке` | `SystemEnumeration: SearchStringModeOnInputByString` |
| `choiceDataGetModeOnInputByString` | `ChoiceDataGetModeOnInputByString` | `РежимПолученияДанныхВыбораПриВводеПоСтроке` | `SystemEnumeration: ChoiceDataGetModeOnInputByString` |
| `fullTextSearchOnInputByString` | `FullTextSearchOnInputByString` | `ПолнотекстовыйПоискПриВводеПоСтроке` | `SystemEnumeration: FullTextSearchOnInputByString` |
| `defaultObjectForm` | `DefaultObjectForm` | `ОсновнаяФормаОбъекта` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `defaultChoiceForm` | `DefaultChoiceForm` | `ОсновнаяФормаВыбора` | `string` |
| `auxiliaryObjectForm` | `AuxiliaryObjectForm` | `ДополнительнаяФормаОбъекта` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `auxiliaryChoiceForm` | `AuxiliaryChoiceForm` | `ДополнительнаяФормаВыбора` | `string` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `numberType` | `NumberType` | `ТипНомера` | `SystemEnumeration: BusinessProcessNumberType` |
| `numberLength` | `NumberLength` | `ДлинаНомера` | `number` |
| `numberAllowedLength` | `NumberAllowedLength` | `ДопустимаяДлинаНомера` | `AllowedLength` |
| `checkUnique` | `CheckUnique` | `КонтрольУникальности` | `boolean` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `characteristics` | `Characteristics` | `Характеристики` | `CharacteristicsDescriptions` |
| `autonumbering` | `Autonumbering` | `Автонумерация` | `boolean` |
| `basedOn` | `BasedOn` | `ВводитсяНаОсновании` | `MetadataItemLinks` |
| `numberPeriodicity` | `NumberPeriodicity` | `ПериодичностьНомера` | `SystemEnumeration: BusinessProcessNumberPeriodicity` |
| `task` | `Task` | `Задача` | `string` / `MDObjectRef` |
| `createTaskInPrivilegedMode` | `CreateTaskInPrivilegedMode` | `ПривилегированныйРежимПриСозданииЗадач` | `boolean` |
| `dataLockFields` | `DataLockFields` | `ПоляБлокировкиДанных` | `MetadataFields` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: FullTextSearchUsing` |
| `objectPresentation` | `ObjectPresentation` | `ПредставлениеОбъекта` | `I8nText` |
| `extendedObjectPresentation` | `ExtendedObjectPresentation` | `РасширенноеПредставлениеОбъекта` | `I8nText` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `dataHistory` | `DataHistory` | `ИсторияДанных` | `SystemEnumeration: DataHistoryUse` |
| `updateDataHistoryImmediatelyAfterWrite` | `UpdateDataHistoryImmediatelyAfterWrite` | `ОбновлятьИсториюДанныхСразуПослеЗаписи` | `boolean` |
| `executeAfterWriteDataHistoryVersionProcessing` | `ExecuteAfterWriteDataHistoryVersionProcessing` | `ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных` | `boolean` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Child objects:

- `Attribute[]`: existing `MetadataAttributes`.
- `TabularSection[]`: business-process-specific wrapper over the common tabular-section property set, with generated
  type names `BusinessProcessTabularSection` and `BusinessProcessTabularSectionRow`.
- `Form[]`: existing `ChildFormNames`.
- `Template[]`: existing `ChildTemplateNames`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so command modules are copied if present.

External files:

- `objectModule`: existing `Module`, XML `Ext/ObjectModule.bsl`, nkdk `МодульОбъекта.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- `flowchart`: opaque `Template`, XML `Ext/Flowchart.xml`, nkdk `Flowchart.xml`
- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `defaultValueYAML: true`
- `editType`: `defaultValueXML: "InDialog"`, `defaultValueYAML: "InDialog"`
- `createOnInput`: `defaultValueXML: "DontUse"`, `defaultValueYAML: "DontUse"`
- `searchStringModeOnInputByString`: `defaultValueXML: "Begin"`, `defaultValueYAML: "Begin"`
- `choiceDataGetModeOnInputByString`: `defaultValueXML: "Directly"`, `defaultValueYAML: "Directly"`
- `fullTextSearchOnInputByString`: `defaultValueXML: "DontUse"`, `defaultValueYAML: "DontUse"`
- `choiceHistoryOnInput`: `defaultValueXML: "Auto"`, `defaultValueYAML: "Auto"`
- `numberType`: `defaultValueXML: "String"`, `defaultValueYAML: "String"`
- `numberLength`: `defaultValueXML: 9`, `defaultValueYAML: 9`
- `numberAllowedLength`: `defaultValueXML: "Variable"`, `defaultValueYAML: "Variable"`
- `checkUnique`: `defaultValueXML: true`, `defaultValueYAML: true`
- `autonumbering`: `defaultValueXML: true`, `defaultValueYAML: true`
- `numberPeriodicity`: `defaultValueXML: "Nonperiodical"`, `defaultValueYAML: "Nonperiodical"`
- `createTaskInPrivilegedMode`: `defaultValueXML: true`, `defaultValueYAML: true`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `defaultValueYAML: "Managed"`
- `includeHelpInContents`: `defaultValueXML: false`, `defaultValueYAML: false`
- `fullTextSearch`: `defaultValueXML: "Use"`, `defaultValueYAML: "Use"`
- `dataHistory`: `defaultValueXML: "DontUse"`, `defaultValueYAML: "DontUse"`
- `updateDataHistoryImmediatelyAfterWrite`: `defaultValueXML: false`, `defaultValueYAML: false`
- `executeAfterWriteDataHistoryVersionProcessing`: `defaultValueXML: false`, `defaultValueYAML: false`
- `objectBelonging`: hidden, `defaultValueYAML: "Native"`

Keep `InputByString`, `Task`, `BasedOn`, `Characteristics`, child attributes, tabular sections, and forms as explicit
content, not YAML defaults. The `Task.ЗадачаВсеСвойства` reference does not require `metadataTask` to be implemented
first.

Implementation notes:

- Reuse existing common behavior from `metadataDocument`, `metadataCatalog`, and `metadataExchangePlan`.
- `Flowchart.xml` is preserved opaquely in the first implementation; parsing route points and graphical schema is
  outside the first scope.
- The updated reference fixture source includes `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`, and
  `Ext/Flowchart.xml`; sync tests must include these files.
- Standard attribute names include business-process-specific names from fixtures: `Started`, `HeadTask`, `Completed`,
  plus common `Ref`, `DeletionMark`, `Date`, and `Number`.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover `InputByString`, `Characteristics`, `BasedOn`, `Task`, all forms, tabular sections, and standard
  attributes;
- sync from XML verifies `Свойства.yaml`, `МодульОбъекта.bsl`, `МодульМенеджера.bsl`, `Flowchart.xml`, `Справка/`,
  `ДополнительныеИндексы`, `Формы/*`, and `Шаблоны/Макет/Template.txt`;
- sync to XML verifies `BusinessProcesses/<name>.xml`, `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`,
  `Ext/Flowchart.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`, `Ext/Help/ru.html`, form XML, and template XML.

## Object: MetadataCalculationRegister

- `itemType`: `MetadataCalculationRegister`
- `itemTypePrefix`: `РегистрРасчета`
- XML directory: `CalculationRegisters`
- XML container: `CalculationRegister`
- implement through `rules.ts`
- `InternalInfo` generated categories:
  - `Record`
  - `Manager`
  - `Selection`
  - `List`
  - `RecordSet`
  - `RecordKey`
  - `Recalcs`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `periodicity` | `Periodicity` | `Периодичность` | `SystemEnumeration: CalculationRegisterPeriodicity` |
| `actionPeriod` | `ActionPeriod` | `ПериодДействия` | `boolean` |
| `basePeriod` | `BasePeriod` | `БазовыйПериод` | `boolean` |
| `schedule` | `Schedule` | `График` | `string` / `MDObjectRef` |
| `scheduleValue` | `ScheduleValue` | `ЗначениеГрафика` | `string` / `MDObjectRef` |
| `scheduleDate` | `ScheduleDate` | `ДатаГрафика` | `string` / `MDObjectRef` |
| `chartOfCalculationTypes` | `ChartOfCalculationTypes` | `ПланВидовРасчета` | `string` / `MDObjectRef` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: FullTextSearchUsing` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Child objects:

- `Resource[]`: use shared `metadataRegisterResource` collection.
- `Attribute[]`: use shared `metadataRegisterAttribute` collection, extended with calculation-register fields where
  needed.
- `Dimension[]`: use shared `metadataRegisterDimension` collection, extended with calculation-register fields.
- `Recalculation[]`: new common object under `packages/core/metadata/commonObjects/metadataRecalculation/`, not inside
  the applied-object folder.
- `Form[]`: existing `ChildFormNames`.
- `Template[]`: existing `ChildTemplateNames`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so command modules are copied.

Calculation-specific child fields:

- `denyIncompleteValues`: `boolean`, XML `DenyIncompleteValues`, YAML `ЗапретНезаполненныхЗначений`
- `baseDimension`: `boolean`, XML `BaseDimension`, YAML `БазовоеИзмерение`
- `scheduleLink`: `string` / `MDObjectRef`, XML `ScheduleLink`, YAML `СвязьСГрафиком`

`baseDimension` and `scheduleLink` are present on calculation-register dimensions. `scheduleLink` is also present on
calculation-register attributes in current fixtures. These fields should be optional extensions to shared register
common objects.

New common object: `metadataRecalculation`

- XML container: `Recalculation`
- collection XML path under parent: `ChildObjects/Recalculation`
- sync XML directory under parent: `Recalculations`
- properties: `name`, `synonym`, `comment`, `dataLockControlMode`
- `dataLockControlMode`: `SystemEnumeration: DefaultDataLockControlMode`, YAML
  `РежимУправленияБлокировкойДанных`, default from the default recalculation fixture is `Managed`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `defaultValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- external file:
  - `recordSetModule`: existing `Module`
  - XML `Recalculations/<name>/Ext/RecordSetModule.bsl`
  - nkdk `Перерасчеты/<name>/МодульНабораЗаписей.bsl`
- generated categories: `Record`, `Manager`, `RecordSet`
- XDTO also allows child `Dimension[]`; current fixtures do not contain recalculation dimensions, so this is deferred
  until a fixture requires it.

External files:

- `recordSetModule`: existing `Module`, XML `Ext/RecordSetModule.bsl`, nkdk `МодульНабораЗаписей.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- recalculation record-set modules through `metadataRecalculation`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`
- command modules through `MetadataCommands`

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `defaultValueYAML: true`
- `periodicity`: `defaultValueXML: "Month"`, `defaultValueYAML: "Month"`
- `actionPeriod`: `defaultValueXML: false`, `defaultValueYAML: false`
- `basePeriod`: `defaultValueXML: false`, `defaultValueYAML: false`
- `includeHelpInContents`: `defaultValueXML: false`, `defaultValueYAML: false`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `defaultValueYAML: "Managed"`
- `fullTextSearch`: `defaultValueXML: "DontUse"`, `defaultValueYAML: "DontUse"`
- `objectBelonging`: hidden, `defaultValueYAML: "Native"`

Keep `chartOfCalculationTypes`, `schedule`, `scheduleValue`, `scheduleDate`, resources, dimensions, attributes, and
recalculations as explicit content, not YAML defaults. References to `ChartOfCalculationTypes.*` and
`InformationRegister.*` do not require those target objects to be implemented first.

Implementation notes:

- Reuse the shared register common objects planned for information, accumulation, and accounting registers.
- Put `metadataRecalculation` in `commonObjects`, following the project pattern for nested metadata structures.
- Do not parse missing recalculation child dimensions in the first implementation; current sync fixtures only need
  recalculation names/properties and the recalculation record-set module.
- Standard attribute names include calculation-register-specific names from fixtures: `RegistrationPeriod`,
  `ReversingEntry`, `Active`, `EndOfBasePeriod`, `BegOfBasePeriod`, `EndOfActionPeriod`, `BegOfActionPeriod`,
  `ActionPeriod`, `CalculationType`, `LineNumber`, and `Recorder`.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover `Periodicity=Quarter`, action/base periods, schedule links, chart of calculation types, all calculation
  standard attributes, register resources/attributes/dimensions, and both recalculations;
- sync from XML verifies `Свойства.yaml`, `МодульНабораЗаписей.bsl`, `МодульМенеджера.bsl`, `Справка/`,
  `ДополнительныеИндексы`, `Перерасчеты/ПерерасчетВсеСвойства/МодульНабораЗаписей.bsl`, forms, templates, and command
  modules;
- sync to XML verifies `CalculationRegisters/<name>.xml`, `Ext/RecordSetModule.bsl`, `Ext/ManagerModule.bsl`,
  `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`, `Ext/Help/ru.html`, `Recalculations/<name>.xml`,
  `Recalculations/<name>/Ext/RecordSetModule.bsl`, form XML, template XML, and command module.

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

- `metadataChartOfAccounts`
- `metadataChartOfCalculationTypes`
- `metadataChartOfCharacteristicTypes`
- `metadataCommonForm`
- `metadataIntegrationService`
- `metadataTask`
- `metadataWebService`
