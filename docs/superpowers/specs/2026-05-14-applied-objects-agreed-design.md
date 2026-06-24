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
- `metadataCommonPicture`
- `metadataStyle`
- `metadataCommandGroup`
- `metadataSubsystem`
- `metadataAccountingRegister`
- `metadataBusinessProcess`
- `metadataCalculationRegister`
- `metadataChartOfAccounts`
- `metadataChartOfCalculationTypes`
- `metadataChartOfCharacteristicTypes`
- `metadataCommonForm`
- `metadataIntegrationService`
- `metadataTask`
- `metadataWebService`

## Deferred Objects

- `metadataExternalDataSource`: skipped for now because external data sources are complex and not currently demanded.

## Object: MetadataFunctionalOption

- `itemType`: `MetadataFunctionalOption`
- `itemTypePrefix`: `ФункциональнаяОпция`
- XML container: `FunctionalOption`
- `.res` properties: `Name`, `Synonym`, `Comment`, `ObjectBelonging`, `ExtendedConfigurationObject`, `Location`,
  `PrivilegedGetMode`, `Content`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`
- `location`: use the property type already used by neighboring metadata where applicable
- `privilegedGetMode`: `boolean`, YAML `ПривилегированныйРежимПриПолучении`, `defaultValueXML: true`,
  `implicitValueYAML: true`
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
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
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
- `use`: `boolean`, YAML `Использование`, `defaultValueXML: true`, `implicitValueYAML: true`
- `predefined`: `boolean`, YAML `Предопределенное`, `defaultValueXML: false`, `implicitValueYAML: false`
- `restartCountOnFailure`: `number`, YAML `КоличествоПовторовПриАварийномЗавершении`,
  `defaultValueXML: 3`, `implicitValueYAML: 3`
- `restartIntervalOnFailure`: `number`, YAML `ИнтервалПовтораПриАварийномЗавершении`,
  `defaultValueXML: 10`, `implicitValueYAML: 10`
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
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
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
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
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

## Object: MetadataCommonPicture

- `itemType`: `MetadataCommonPicture`
- `itemTypePrefix`: `ОбщаяКартинка`
- XML directory: `CommonPictures`
- XML container: `CommonPicture`
- implement through `rules.ts`

Properties from `.res`:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `picture` | `Picture` | `Картинка` | new `ExternalPicture` folder-preserving type |
| `availabilityForChoice` | `AvailabilityForChoice` | `ДоступностьДляВыбора` | `boolean` |
| `availabilityForAppearance` | `AvailabilityForAppearance` | `ДоступностьДляОформления` | `boolean` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

External picture files:

- XML descriptor: `CommonPictures/<name>/Ext/Picture.xml`
- XML payload folder: `CommonPictures/<name>/Ext/Picture/*`
- nkdk descriptor: `Картинка/Picture.xml`
- nkdk payload folder: `Картинка/*`

The descriptor uses `ExtPicture/Picture/xr:Abs` to point to the payload filename. Current fixtures cover:

- collection mode: `xr:Abs=Picture.zip`, payload `Picture.zip`;
- single picture mode: `xr:Abs=Picture.png`, payload `Picture.png`.

Implementation notes:

- Do not parse the image payload in the first implementation.
- Add a small `ExternalPicture` common property type for sync copying of `Picture.xml` and every regular file under the
  sibling `Ext/Picture/` directory. This is different from `Template`, which copies a single file.
- Preserve `Picture.xml` opaquely so `xr:Abs` and `xr:LoadTransparent` round-trip exactly.
- Copy payload files as bytes, not UTF-8 text; `Picture.zip` and `Picture.png` are binary.
- The existing common object `picture` is for references to pictures in metadata fields, not for this top-level common
  picture payload.

Default policy from `minimal.xml`:

- `availabilityForChoice`: `defaultValueXML: false`, `implicitValueYAML: false`
- `availabilityForAppearance`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml`, `full.xml`, `single.xml`, and `collection.xml`;
- sync from XML copies `Ext/Picture.xml` to `Картинка/Picture.xml` and payload files such as `Picture.zip`;
- sync to XML restores `Картинка/Picture.xml` to `Ext/Picture.xml` and payload files to `Ext/Picture/`;
- include binary-byte comparison for the copied payload.

## Object: MetadataStyle

- `itemType`: `MetadataStyle`
- `itemTypePrefix`: `Стиль`
- XML container: `Style`
- main object through `rules.ts`
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
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
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
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

- `itemType`: `MetadataSubsystem`
- `itemTypePrefix`: `Подсистема`
- XML directory: `Subsystems`
- XML container: `Subsystem`
- implement through `rules.ts`
- `InternalInfo`: absent in current fixtures and not required by the XDTO fragment

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `includeInCommandInterface` | `IncludeInCommandInterface` | `ВключатьВКомандныйИнтерфейс` | `boolean` |
| `useOneCommand` | `UseOneCommand` | `ИспользоватьОднуКоманду` | `boolean` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `picture` | `Picture` | `Картинка` | `Picture` |
| `content` | `Content` | `Состав` | `MetadataItemLinks` |
| `subsystems` | `ChildObjects/Subsystem` | `Подсистемы` | new `ChildSubsystemNames` common type |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

External files:

- `commandInterface`: opaque `Template`, XML `Ext/CommandInterface.xml`, nkdk `CommandInterface.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`

Default policy from `minimal.xml`:

- `includeHelpInContents`: `defaultValueXML: true`, `implicitValueYAML: true`
- `includeInCommandInterface`: `defaultValueXML: true`, `implicitValueYAML: true`
- `useOneCommand`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Do not set YAML defaults for empty string, empty `I8nText`, empty `Picture`, empty `Content`, or external files.

`ChildSubsystemNames`:

- add a tiny common property type only for `ChildObjects/Subsystem`;
- XML import accepts `undefined`, a single string, or a string array;
- YAML/model shape is `string[]`;
- XML export returns a single string or string array according to normal XML exporter behavior;
- do not reuse `ChildFormNames` or `ChildTemplateNames`, because their names and sync behavior are tied to
  form/template folders;
- do not use plain `string`, because XDTO allows multiple `<Subsystem>` entries.

Implementation notes:

- Preserve `Content` with `MetadataItemLinks`; references may point to objects not implemented yet and should remain
  strings.
- Preserve command interface and help opaquely in the first implementation.
- Preserve nested subsystem names in the parent object, but do not parse nested subsystem XML files as separate child
  metadata items in this step.
- Add `ChildSubsystemNames` to `PropertyTypeRegistry` and `PropertyRuleTypeKeys`.
- Add the migration prefix `Подсистема`; object-level paths are `Подсистема.<name>`. Nested subsystem migration paths
  can be designed separately when recursive subsystem implementation is added.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- YAML tests cover the non-default values from `full.xml`;
- `content` test includes all `xr:Item xsi:type="xr:MDObjectRef"` values from `full.xml`;
- `subsystems` test includes `ПодчиненнаяПодсистема` from `ChildObjects`;
- sync from XML copies `Ext/CommandInterface.xml`, `Ext/Help.xml`, and `Ext/Help/ru.html` into the nkdk object folder;
- sync to XML restores those files back to `Ext/CommandInterface.xml`, `Ext/Help.xml`, and `Ext/Help/ru.html`.

Risks:

- `CommandInterface.xml` contains command visibility and ordering that deserves a model later.
- Nested subsystem XML exists under `Subsystems/<name>.xml`; recursive child processing is deferred.

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

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `correspondence`: `defaultValueXML: false`, `implicitValueYAML: false`
- `periodAdjustmentLength`: `defaultValueXML: 0`, `implicitValueYAML: 0`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `enableTotalsSplitting`: `defaultValueXML: true`, `implicitValueYAML: true`
- `fullTextSearch`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

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

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `editType`: `defaultValueXML: "InDialog"`, `implicitValueYAML: "InDialog"`
- `createOnInput`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `searchStringModeOnInputByString`: `defaultValueXML: "Begin"`, `implicitValueYAML: "Begin"`
- `choiceDataGetModeOnInputByString`: `defaultValueXML: "Directly"`, `implicitValueYAML: "Directly"`
- `fullTextSearchOnInputByString`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceHistoryOnInput`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `numberType`: `defaultValueXML: "String"`, `implicitValueYAML: "String"`
- `numberLength`: `defaultValueXML: 9`, `implicitValueYAML: 9`
- `numberAllowedLength`: `defaultValueXML: "Variable"`, `implicitValueYAML: "Variable"`
- `checkUnique`: `defaultValueXML: true`, `implicitValueYAML: true`
- `autonumbering`: `defaultValueXML: true`, `implicitValueYAML: true`
- `numberPeriodicity`: `defaultValueXML: "Nonperiodical"`, `implicitValueYAML: "Nonperiodical"`
- `createTaskInPrivilegedMode`: `defaultValueXML: true`, `implicitValueYAML: true`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `fullTextSearch`: `defaultValueXML: "Use"`, `implicitValueYAML: "Use"`
- `dataHistory`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `updateDataHistoryImmediatelyAfterWrite`: `defaultValueXML: false`, `implicitValueYAML: false`
- `executeAfterWriteDataHistoryVersionProcessing`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

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
- `objectBelonging`: hidden `SystemEnumeration: ObjectBelonging`, `implicitValueYAML: "Native"`
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

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `periodicity`: `defaultValueXML: "Month"`, `implicitValueYAML: "Month"`
- `actionPeriod`: `defaultValueXML: false`, `implicitValueYAML: false`
- `basePeriod`: `defaultValueXML: false`, `implicitValueYAML: false`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `fullTextSearch`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

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

## Object: MetadataChartOfAccounts

- `itemType`: `MetadataChartOfAccounts`
- `itemTypePrefix`: `ПланСчетов`
- XML directory: `ChartOfAccounts`
- XML container: `ChartOfAccounts`
- implement through `rules.ts`
- `InternalInfo` generated categories:
  - `Object`
  - `Ref`
  - `Selection`
  - `List`
  - `Manager`
  - `ExtDimensionTypes`
  - `ExtDimensionTypesRow`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `basedOn` | `BasedOn` | `ВводитсяНаОсновании` | `MetadataItemLinks` |
| `extDimensionTypes` | `ExtDimensionTypes` | `ВидыСубконто` | `string` / `MDObjectRef` |
| `maxExtDimensionCount` | `MaxExtDimensionCount` | `МаксКоличествоСубконто` | `number` |
| `codeMask` | `CodeMask` | `МаскаКода` | `string` |
| `codeLength` | `CodeLength` | `ДлинаКода` | `number` |
| `descriptionLength` | `DescriptionLength` | `ДлинаНаименования` | `number` |
| `codeSeries` | `CodeSeries` | `СерииКодов` | `SystemEnumeration: CharOfAccountCodeSeries` |
| `checkUnique` | `CheckUnique` | `КонтрольУникальности` | `boolean` |
| `defaultPresentation` | `DefaultPresentation` | `ОсновноеПредставление` | `SystemEnumeration: AccountMainPresentation` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `characteristics` | `Characteristics` | `Характеристики` | `CharacteristicsDescriptions` |
| `standardTabularSections` | `StandardTabularSections` | `СтандартныеТабличныеЧасти` | `StandardTabularSectionDescriptions` |
| `predefinedDataUpdate` | `PredefinedDataUpdate` | `ОбновлениеПредопределенныхДанных` | `SystemEnumeration: PredefinedDataUpdate` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `quickChoice` | `QuickChoice` | `БыстрыйВыбор` | `boolean` |
| `choiceMode` | `ChoiceMode` | `РежимВыбора` | `SystemEnumeration: ChoiceMode` |
| `inputByString` | `InputByString` | `ВводПоСтроке` | `MetadataFields` |
| `searchStringModeOnInputByString` | `SearchStringModeOnInputByString` | `РежимСтрокиПоискаПриВводеПоСтроке` | `SystemEnumeration: SearchStringModeOnInputByString` |
| `fullTextSearchOnInputByString` | `FullTextSearchOnInputByString` | `ПолнотекстовыйПоискПриВводеПоСтроке` | `SystemEnumeration: FullTextSearchOnInputByString` |
| `choiceDataGetModeOnInputByString` | `ChoiceDataGetModeOnInputByString` | `РежимПолученияДанныхВыбораПриВводеПоСтроке` | `SystemEnumeration: ChoiceDataGetModeOnInputByString` |
| `createOnInput` | `CreateOnInput` | `СозданиеПриВводе` | `SystemEnumeration: CreateOnInput` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `defaultObjectForm` | `DefaultObjectForm` | `ОсновнаяФормаОбъекта` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `defaultChoiceForm` | `DefaultChoiceForm` | `ОсновнаяФормаВыбора` | `string` |
| `auxiliaryObjectForm` | `AuxiliaryObjectForm` | `ДополнительнаяФормаОбъекта` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `auxiliaryChoiceForm` | `AuxiliaryChoiceForm` | `ДополнительнаяФормаВыбора` | `string` |
| `autoOrderByCode` | `AutoOrderByCode` | `АвтоПорядокПоКоду` | `boolean` |
| `orderLength` | `OrderLength` | `ДлинаПорядка` | `number` |
| `dataLockFields` | `DataLockFields` | `ПоляБлокировкиДанных` | `MetadataFields` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `fullTextSearch` | `FullTextSearch` | `ПолнотекстовыйПоиск` | `SystemEnumeration: FullTextSearchUsing` |
| `dataHistory` | `DataHistory` | `ИсторияДанных` | `SystemEnumeration: DataHistoryUse` |
| `objectPresentation` | `ObjectPresentation` | `ПредставлениеОбъекта` | `I8nText` |
| `extendedObjectPresentation` | `ExtendedObjectPresentation` | `РасширенноеПредставлениеОбъекта` | `I8nText` |
| `listPresentation` | `ListPresentation` | `ПредставлениеСписка` | `I8nText` |
| `extendedListPresentation` | `ExtendedListPresentation` | `РасширенноеПредставлениеСписка` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `updateDataHistoryImmediatelyAfterWrite` | `UpdateDataHistoryImmediatelyAfterWrite` | `ОбновлятьИсториюДанныхСразуПослеЗаписи` | `boolean` |
| `executeAfterWriteDataHistoryVersionProcessing` | `ExecuteAfterWriteDataHistoryVersionProcessing` | `ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных` | `boolean` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Child objects:

- `Attribute[]`: existing `MetadataAttributes`.
- `TabularSection[]`: chart-of-accounts-specific wrapper over the common tabular-section property set, with generated
  type names `ChartOfAccountsTabularSection` and `ChartOfAccountsTabularSectionRow`.
- `AccountingFlag[]`: new common object under `packages/core/metadata/commonObjects/metadataAccountingFlag/`.
- `ExtDimensionAccountingFlag[]`: new common object under
  `packages/core/metadata/commonObjects/metadataExtDimensionAccountingFlag/`.
- `Form[]`: existing `ChildFormNames`.
- `Template[]`: existing `ChildTemplateNames`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so command modules are copied.

New common objects: accounting flags

`metadataAccountingFlag` and `metadataExtDimensionAccountingFlag` share the same field-like property set:

- XML containers: `AccountingFlag` and `ExtDimensionAccountingFlag`.
- properties: `name`, `synonym`, `comment`, `type`, `passwordMode`, `format`, `editFormat`, `toolTip`,
  `markNegatives`, `mask`, `multiLine`, `extendedEdit`, `minValue`, `maxValue`, `fillFromFillingValue`, `fillValue`,
  `fillChecking`, `choiceFoldersAndItems`, `choiceParameterLinks`, `choiceParameters`, `quickChoice`, `createOnInput`,
  `choiceForm`, `linkByType`, `choiceHistoryOnInput`, `dataHistory`.
- `type`: `TypeDescription`
- `fillValue`: `MetadataValue`
- `linkByType`: existing `TypeLink`
- hidden `objectBelonging`, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: runtime-only `string`

These common objects are real nested metadata structures referenced by accounting registers through
`AccountingFlag.*` and `ExtDimensionAccountingFlag.*` paths. They should not be represented as plain names.

External files:

- `objectModule`: existing `Module`, XML `Ext/ObjectModule.bsl`, nkdk `МодульОбъекта.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- `predefined`: opaque `Template`, XML `Ext/Predefined.xml`, nkdk `Predefined.xml`
- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`
- command modules through `MetadataCommands`

`Predefined.xml` contains predefined chart-of-accounts items with accounting flags and ext-dimension types. The first
implementation preserves it opaquely; parsing predefined accounts is deferred.

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `maxExtDimensionCount`: `defaultValueXML: 0`, `implicitValueYAML: 0`
- `codeLength`: `defaultValueXML: 9`, `implicitValueYAML: 9`
- `descriptionLength`: `defaultValueXML: 25`, `implicitValueYAML: 25`
- `codeSeries`: `defaultValueXML: "WholeChartOfAccounts"`, `implicitValueYAML: "WholeChartOfAccounts"`
- `checkUnique`: `defaultValueXML: true`, `implicitValueYAML: true`
- `defaultPresentation`: `defaultValueXML: "AsCode"`, `implicitValueYAML: "AsCode"`
- `predefinedDataUpdate`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `editType`: `defaultValueXML: "InDialog"`, `implicitValueYAML: "InDialog"`
- `quickChoice`: `defaultValueXML: false`, `implicitValueYAML: false`
- `choiceMode`: `defaultValueXML: "BothWays"`, `implicitValueYAML: "BothWays"`
- `searchStringModeOnInputByString`: `defaultValueXML: "Begin"`, `implicitValueYAML: "Begin"`
- `fullTextSearchOnInputByString`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceDataGetModeOnInputByString`: `defaultValueXML: "Directly"`, `implicitValueYAML: "Directly"`
- `createOnInput`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceHistoryOnInput`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `autoOrderByCode`: `defaultValueXML: false`, `implicitValueYAML: false`
- `orderLength`: `defaultValueXML: 0`, `implicitValueYAML: 0`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `fullTextSearch`: `defaultValueXML: "Use"`, `implicitValueYAML: "Use"`
- `dataHistory`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `updateDataHistoryImmediatelyAfterWrite`: `defaultValueXML: false`, `implicitValueYAML: false`
- `executeAfterWriteDataHistoryVersionProcessing`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Keep `basedOn`, `extDimensionTypes`, `inputByString`, `dataLockFields`, `characteristics`, standard tabular sections,
child attributes, tabular sections, accounting flags, and predefined data as explicit content, not YAML defaults.

Implementation notes:

- Reuse existing common behavior from `metadataCatalog`, `metadataDocument`, and `metadataExchangePlan`.
- Use the same shared field-property shape for `metadataAccountingFlag` and `metadataExtDimensionAccountingFlag`; avoid
  copy-pasting two divergent rules.
- Standard attribute names include chart-of-accounts-specific names from fixtures: `PredefinedDataName`, `Order`,
  `OffBalance`, `Type`, `Description`, `Code`, `Parent`, `Predefined`, `DeletionMark`, and `Ref`.
- `StandardTabularSections/ExtDimensionTypes` should use existing `StandardTabularSectionDescriptions` if it already
  supports the fixture shape; otherwise add the smallest common-object extension needed by this fixture.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover `BasedOn`, `ExtDimensionTypes`, code settings, standard attributes, `StandardTabularSections`,
  characteristics, accounting flags, ext-dimension accounting flags, and all form/template/command names;
- sync from XML verifies `Свойства.yaml`, `МодульОбъекта.bsl`, `МодульМенеджера.bsl`, `Predefined.xml`, `Справка/`,
  `ДополнительныеИндексы`, forms, templates, and command modules;
- sync to XML verifies `ChartOfAccounts/<name>.xml`, `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`,
  `Ext/Predefined.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`, `Ext/Help/ru.html`, form XML, template XML, and
  command module.

## Object: MetadataChartOfCalculationTypes

- `itemType`: `MetadataChartOfCalculationTypes`
- `itemTypePrefix`: `ПланВидовРасчета`
- XML directory: `ChartsOfCalculationTypes`
- XML container: `ChartOfCalculationTypes`
- implement through `rules.ts`
- `InternalInfo` generated categories:
  - `Object`
  - `Ref`
  - `Selection`
  - `List`
  - `Manager`
  - `DisplacingCalculationTypes`
  - `DisplacingCalculationTypesRow`
  - `BaseCalculationTypes`
  - `BaseCalculationTypesRow`
  - `LeadingCalculationTypes`
  - `LeadingCalculationTypesRow`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `codeLength` | `CodeLength` | `ДлинаКода` | `number` |
| `descriptionLength` | `DescriptionLength` | `ДлинаНаименования` | `number` |
| `codeType` | `CodeType` | `ТипКода` | `SystemEnumeration: ChartOfCalculationTypesCodeType` |
| `codeAllowedLength` | `CodeAllowedLength` | `ДопустимаяДлинаКода` | `AllowedLength` |
| `defaultPresentation` | `DefaultPresentation` | `ОсновноеПредставление` | `SystemEnumeration: CalculationTypeMainPresentation` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `quickChoice` | `QuickChoice` | `БыстрыйВыбор` | `boolean` |
| `choiceMode` | `ChoiceMode` | `РежимВыбора` | `SystemEnumeration: ChoiceMode` |
| `inputByString` | `InputByString` | `ВводПоСтроке` | `MetadataFields` |
| `searchStringModeOnInputByString` | `SearchStringModeOnInputByString` | `РежимСтрокиПоискаПриВводеПоСтроке` | `SystemEnumeration: SearchStringModeOnInputByString` |
| `fullTextSearchOnInputByString` | `FullTextSearchOnInputByString` | `ПолнотекстовыйПоискПриВводеПоСтроке` | `SystemEnumeration: FullTextSearchOnInputByString` |
| `choiceDataGetModeOnInputByString` | `ChoiceDataGetModeOnInputByString` | `РежимПолученияДанныхВыбораПриВводеПоСтроке` | `SystemEnumeration: ChoiceDataGetModeOnInputByString` |
| `createOnInput` | `CreateOnInput` | `СозданиеПриВводе` | `SystemEnumeration: CreateOnInput` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `defaultObjectForm` | `DefaultObjectForm` | `ОсновнаяФормаОбъекта` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `defaultChoiceForm` | `DefaultChoiceForm` | `ОсновнаяФормаВыбора` | `string` |
| `auxiliaryObjectForm` | `AuxiliaryObjectForm` | `ДополнительнаяФормаОбъекта` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `auxiliaryChoiceForm` | `AuxiliaryChoiceForm` | `ДополнительнаяФормаВыбора` | `string` |
| `basedOn` | `BasedOn` | `ВводитсяНаОсновании` | `MetadataItemLinks` |
| `dependenceOnCalculationTypes` | `DependenceOnCalculationTypes` | `ЗависимостьОтВидовРасчета` | `SystemEnumeration: ChartOfCalculationTypesBaseUse` |
| `baseCalculationTypes` | `BaseCalculationTypes` | `БазовыеВидыРасчета` | `MetadataItemLinks` |
| `actionPeriodUse` | `ActionPeriodUse` | `ПериодДействияБазовый` | `boolean` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `characteristics` | `Characteristics` | `Характеристики` | `CharacteristicsDescriptions` |
| `standardTabularSections` | `StandardTabularSections` | `СтандартныеТабличныеЧасти` | `StandardTabularSectionDescriptions` |
| `predefinedDataUpdate` | `PredefinedDataUpdate` | `ОбновлениеПредопределенныхДанных` | `SystemEnumeration: PredefinedDataUpdate` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `dataLockFields` | `DataLockFields` | `ПоляБлокировкиДанных` | `MetadataFields` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
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
- `TabularSection[]`: chart-of-calculation-types-specific wrapper over the common tabular-section property set, with
  generated type names `ChartOfCalculationTypesTabularSection` and `ChartOfCalculationTypesTabularSectionRow`.
- `Form[]`: existing `ChildFormNames`.
- `Template[]`: existing `ChildTemplateNames`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so command modules are copied.

There are no new unique child metadata objects in current fixtures. Calculation-type dependency tables are represented
through `StandardTabularSectionDescriptions`, not as separate child objects.

External files:

- `objectModule`: existing `Module`, XML `Ext/ObjectModule.bsl`, nkdk `МодульОбъекта.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- `predefined`: opaque `Template`, XML `Ext/Predefined.xml`, nkdk `Predefined.xml`
- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`
- command modules through `MetadataCommands`

`Predefined.xml` contains predefined calculation types. The first implementation preserves it opaquely; parsing
predefined calculation types is deferred.

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `codeLength`: `defaultValueXML: 9`, `implicitValueYAML: 9`
- `descriptionLength`: `defaultValueXML: 40`, `implicitValueYAML: 40`
- `codeType`: `defaultValueXML: "String"`, `implicitValueYAML: "String"`
- `codeAllowedLength`: `defaultValueXML: "Variable"`, `implicitValueYAML: "Variable"`
- `defaultPresentation`: `defaultValueXML: "AsDescription"`, `implicitValueYAML: "AsDescription"`
- `editType`: `defaultValueXML: "InDialog"`, `implicitValueYAML: "InDialog"`
- `quickChoice`: `defaultValueXML: false`, `implicitValueYAML: false`
- `choiceMode`: `defaultValueXML: "BothWays"`, `implicitValueYAML: "BothWays"`
- `searchStringModeOnInputByString`: `defaultValueXML: "Begin"`, `implicitValueYAML: "Begin"`
- `fullTextSearchOnInputByString`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceDataGetModeOnInputByString`: `defaultValueXML: "Directly"`, `implicitValueYAML: "Directly"`
- `createOnInput`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceHistoryOnInput`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `dependenceOnCalculationTypes`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `actionPeriodUse`: `defaultValueXML: false`, `implicitValueYAML: false`
- `predefinedDataUpdate`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `fullTextSearch`: `defaultValueXML: "Use"`, `implicitValueYAML: "Use"`
- `dataHistory`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `updateDataHistoryImmediatelyAfterWrite`: `defaultValueXML: false`, `implicitValueYAML: false`
- `executeAfterWriteDataHistoryVersionProcessing`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Keep `inputByString`, `basedOn`, `baseCalculationTypes`, `characteristics`, standard tabular sections, child
attributes, tabular sections, and predefined data as explicit content, not YAML defaults.

Implementation notes:

- Reuse existing common behavior from `metadataChartOfAccounts`, `metadataDocument`, and `metadataCatalog`.
- `StandardTabularSections` must preserve `LeadingCalculationTypes`, `DisplacingCalculationTypes`, and
  `BaseCalculationTypes`.
- Standard attribute names include calculation-type-specific names from fixtures: `PredefinedDataName`, `Predefined`,
  `Ref`, `DeletionMark`, `ActionPeriodIsBasic`, `Description`, and `Code`.
- References to `Document.*` and `ChartOfCalculationTypes.*` in `BasedOn` and `BaseCalculationTypes` are stored as
  strings; target object implementation is not required first.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover code settings, `BasedOn`, `DependenceOnCalculationTypes`, `BaseCalculationTypes`, `ActionPeriodUse`,
  standard tabular sections, characteristics, child attributes, tabular sections, and all form/template/command names;
- sync from XML verifies `Свойства.yaml`, `МодульОбъекта.bsl`, `МодульМенеджера.bsl`, `Predefined.xml`, `Справка/`,
  `ДополнительныеИндексы`, forms, templates, and command modules;
- sync to XML verifies `ChartsOfCalculationTypes/<name>.xml`, `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`,
  `Ext/Predefined.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`, `Ext/Help/ru.html`, form XML, template XML, and
  command module.

## Object: MetadataChartOfCharacteristicTypes

- `itemType`: `MetadataChartOfCharacteristicTypes`
- `itemTypePrefix`: `ПланВидовХарактеристик`
- XML directory: `ChartsOfCharacteristicTypes`
- XML container: `ChartOfCharacteristicTypes`
- implement through `rules.ts`
- `InternalInfo` generated categories:
  - `Object`
  - `Ref`
  - `Selection`
  - `List`
  - `Characteristic`
  - `Manager`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `characteristicExtValues` | `CharacteristicExtValues` | `ДополнительныеЗначенияХарактеристик` | `string` / `MDObjectRef` |
| `type` | `Type` | `ТипЗначения` | `TypeDescription` |
| `hierarchical` | `Hierarchical` | `Иерархический` | `boolean` |
| `foldersOnTop` | `FoldersOnTop` | `ГруппыСверху` | `boolean` |
| `codeLength` | `CodeLength` | `ДлинаКода` | `number` |
| `codeAllowedLength` | `CodeAllowedLength` | `ДопустимаяДлинаКода` | `AllowedLength` |
| `descriptionLength` | `DescriptionLength` | `ДлинаНаименования` | `number` |
| `codeSeries` | `CodeSeries` | `СерииКодов` | `SystemEnumeration: CharacteristicKindCodesSeries` |
| `checkUnique` | `CheckUnique` | `КонтрольУникальности` | `boolean` |
| `autonumbering` | `Autonumbering` | `Автонумерация` | `boolean` |
| `defaultPresentation` | `DefaultPresentation` | `ОсновноеПредставление` | `SystemEnumeration: CharacteristicTypeMainPresentation` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `characteristics` | `Characteristics` | `Характеристики` | `CharacteristicsDescriptions` |
| `predefinedDataUpdate` | `PredefinedDataUpdate` | `ОбновлениеПредопределенныхДанных` | `SystemEnumeration: PredefinedDataUpdate` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `quickChoice` | `QuickChoice` | `БыстрыйВыбор` | `boolean` |
| `choiceMode` | `ChoiceMode` | `РежимВыбора` | `SystemEnumeration: ChoiceMode` |
| `inputByString` | `InputByString` | `ВводПоСтроке` | `MetadataFields` |
| `createOnInput` | `CreateOnInput` | `СозданиеПриВводе` | `SystemEnumeration: CreateOnInput` |
| `searchStringModeOnInputByString` | `SearchStringModeOnInputByString` | `РежимСтрокиПоискаПриВводеПоСтроке` | `SystemEnumeration: SearchStringModeOnInputByString` |
| `choiceDataGetModeOnInputByString` | `ChoiceDataGetModeOnInputByString` | `РежимПолученияДанныхВыбораПриВводеПоСтроке` | `SystemEnumeration: ChoiceDataGetModeOnInputByString` |
| `fullTextSearchOnInputByString` | `FullTextSearchOnInputByString` | `ПолнотекстовыйПоискПриВводеПоСтроке` | `SystemEnumeration: FullTextSearchOnInputByString` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `defaultObjectForm` | `DefaultObjectForm` | `ОсновнаяФормаОбъекта` | `string` |
| `defaultFolderForm` | `DefaultFolderForm` | `ОсновнаяФормаГруппы` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `defaultChoiceForm` | `DefaultChoiceForm` | `ОсновнаяФормаВыбора` | `string` |
| `defaultFolderChoiceForm` | `DefaultFolderChoiceForm` | `ОсновнаяФормаВыбораГруппы` | `string` |
| `auxiliaryObjectForm` | `AuxiliaryObjectForm` | `ДополнительнаяФормаОбъекта` | `string` |
| `auxiliaryFolderForm` | `AuxiliaryFolderForm` | `ДополнительнаяФормаГруппы` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `auxiliaryChoiceForm` | `AuxiliaryChoiceForm` | `ДополнительнаяФормаВыбора` | `string` |
| `auxiliaryFolderChoiceForm` | `AuxiliaryFolderChoiceForm` | `ДополнительнаяФормаВыбораГруппы` | `string` |
| `basedOn` | `BasedOn` | `ВводитсяНаОсновании` | `MetadataItemLinks` |
| `dataLockFields` | `DataLockFields` | `ПоляБлокировкиДанных` | `MetadataFields` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
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
- `TabularSection[]`: chart-of-characteristic-types-specific wrapper over the common tabular-section property set, with
  generated type names `ChartOfCharacteristicTypesTabularSection` and `ChartOfCharacteristicTypesTabularSectionRow`.
- `Form[]`: existing `ChildFormNames`, including object, folder, list, choice, and folder-choice forms.
- `Template[]`: existing `ChildTemplateNames`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so both command modules are copied.

There are no new unique child metadata objects in current fixtures.

External files:

- `objectModule`: existing `Module`, XML `Ext/ObjectModule.bsl`, nkdk `МодульОбъекта.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- `predefined`: opaque `Template`, XML `Ext/Predefined.xml`, nkdk `Predefined.xml`
- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`
- command modules through `MetadataCommands`

`Predefined.xml` contains predefined characteristic values. The first implementation preserves it opaquely; parsing
predefined characteristic values is deferred.

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `hierarchical`: `defaultValueXML: false`, `implicitValueYAML: false`
- `foldersOnTop`: `defaultValueXML: true`, `implicitValueYAML: true`
- `codeLength`: `defaultValueXML: 9`, `implicitValueYAML: 9`
- `codeAllowedLength`: `defaultValueXML: "Variable"`, `implicitValueYAML: "Variable"`
- `descriptionLength`: `defaultValueXML: 25`, `implicitValueYAML: 25`
- `codeSeries`: `defaultValueXML: "WholeCharacteristicKind"`, `implicitValueYAML: "WholeCharacteristicKind"`
- `checkUnique`: `defaultValueXML: true`, `implicitValueYAML: true`
- `autonumbering`: `defaultValueXML: true`, `implicitValueYAML: true`
- `defaultPresentation`: `defaultValueXML: "AsDescription"`, `implicitValueYAML: "AsDescription"`
- `predefinedDataUpdate`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `editType`: `defaultValueXML: "InDialog"`, `implicitValueYAML: "InDialog"`
- `quickChoice`: `defaultValueXML: false`, `implicitValueYAML: false`
- `choiceMode`: `defaultValueXML: "BothWays"`, `implicitValueYAML: "BothWays"`
- `createOnInput`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `searchStringModeOnInputByString`: `defaultValueXML: "Begin"`, `implicitValueYAML: "Begin"`
- `choiceDataGetModeOnInputByString`: `defaultValueXML: "Directly"`, `implicitValueYAML: "Directly"`
- `fullTextSearchOnInputByString`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceHistoryOnInput`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `fullTextSearch`: `defaultValueXML: "Use"`, `implicitValueYAML: "Use"`
- `dataHistory`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `updateDataHistoryImmediatelyAfterWrite`: `defaultValueXML: false`, `implicitValueYAML: false`
- `executeAfterWriteDataHistoryVersionProcessing`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Keep `characteristicExtValues`, `type`, `inputByString`, `basedOn`, `characteristics`, `dataLockFields`, child
attributes, tabular sections, and predefined data as explicit content, not YAML defaults.

Implementation notes:

- Reuse existing common behavior from `metadataCatalog`, `metadataChartOfAccounts`, and `metadataChartOfCalculationTypes`.
- `Type` is normal `TypeDescription`, and its default-looking string fixture remains explicit YAML content.
- Standard attribute names include characteristic-kind-specific names from fixtures; validate the full fixture names
  during implementation rather than relying only on the shared global standard-attribute map.
- Command sync must cover both `Commands/ПолнаяКоманда` and `Commands/ПоУмолчанию`.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover `CharacteristicExtValues`, `Type`, hierarchy/code settings, all object/folder/list/choice form references,
  `BasedOn`, `Characteristics`, child attributes, tabular sections, and both commands;
- sync from XML verifies `Свойства.yaml`, `МодульОбъекта.bsl`, `МодульМенеджера.bsl`, `Predefined.xml`, `Справка/`,
  `ДополнительныеИндексы`, forms, templates, and both command modules;
- sync to XML verifies `ChartsOfCharacteristicTypes/<name>.xml`, `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`,
  `Ext/Predefined.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`, `Ext/Help/ru.html`, form XML, template XML, and
  both command modules.

## Object: MetadataCommonForm

- `itemType`: `MetadataCommonForm`
- `itemTypePrefix`: `ОбщаяФорма`
- XML directory: `CommonForms`
- XML container: `CommonForm`
- implement through `rules.ts`

Properties from `.res`:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `form` | `Form` | `Форма` | `ClientApplicationForm` external file |
| `formType` | `FormType` | `ТипФормы` | `SystemEnumeration: FormType` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `help` | `Help` | `Справка` | `Help` |
| `usePurposes` | `UsePurposes` | `НазначенияИспользования` | `UsePurposes` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `extendedPresentation` | `ExtendedPresentation` | `РасширенноеПредставление` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

External files:

- `form`: parse and export through the existing `ClientApplicationForm` model:
  - XML `CommonForms/<name>/Ext/Form.xml`
  - nkdk `Форма/Форма.yaml` and `Форма/Форма.nkdk`
- form module is preserved with the form:
  - XML `CommonForms/<name>/Ext/Form/Module.bsl`
  - nkdk `Форма/Модули/МодульФормы.bsl`, following the current `ClientApplicationForm` external-file convention
- `help`: existing `Help`, XML `CommonForms/<name>/Ext/Help.xml` and `CommonForms/<name>/Ext/Help/ru.html`,
  nkdk `Справка/`

Default policy:

- `formType`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `useStandardCommands`: fixture default is `true`; set YAML default to `true` only after confirming it from
  `minimal.xml` or another default fixture during implementation
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Implementation notes:

- Common form is a top-level metadata item; do not merge it with child form lists such as `ChildFormNames`.
- The external form XML should reuse the existing form parser/exporter rather than being stored as an opaque
  `Template`, because `ClientApplicationForm` already models form metadata and form body.
- Some reference fixtures contain nested form resources such as `Ext/Form/Items/.../*.zip`. Preserve support for
  `Ext/Form.xml` and `Ext/Form/Module.bsl` in the first implementation; recursive binary resources under `Ext/Form/**`
  are a separate extension unless the current form external-file helper already handles them.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover the existing common-form fixtures such as constant, search, report settings, report option, history,
  and dialog forms;
- sync from XML verifies `Свойства.yaml`, `Форма/Форма.yaml`, `Форма/Форма.nkdk`, and form module when present;
- sync to XML verifies `CommonForms/<name>.xml`, `CommonForms/<name>/Ext/Form.xml`, and
  `CommonForms/<name>/Ext/Form/Module.bsl` when present.

## Object: MetadataIntegrationService

- `itemType`: `MetadataIntegrationService`
- `itemTypePrefix`: `СервисИнтеграции`
- XML directory: `IntegrationServices`
- XML container: `IntegrationService`
- implement through `rules.ts`
- `InternalInfo` generated category: `Manager`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `externalIntegrationServiceAddress` | `ExternalIntegrationServiceAddress` | `АдресВнешнегоСервисаИнтеграции` | `string` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Child objects:

- `IntegrationServiceChannel[]`: new child object collection under `ChildObjects/IntegrationServiceChannel`.

Channel properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `externalIntegrationServiceChannelName` | `ExternalIntegrationServiceChannelName` | `ИмяКаналаВнешнегоСервисаИнтеграции` | `string` |
| `messageDirection` | `MessageDirection` | `НаправлениеСообщения` | `SystemEnumeration: IntegrationServiceChannelMessageDirection` |
| `receiveMessageProcessing` | `ReceiveMessageProcessing` | `ОбработкаПолученияСообщения` | `string` |
| `transactioned` | `Transactioned` | `Транзакционный` | `boolean` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

External files:

- `module`: existing `Module`, XML `IntegrationServices/<name>/Ext/Module.bsl`, nkdk `Модуль.bsl`

Default policy from `minimal.xml` copied from
`/Users/nikita/git/roundTripElements/IntegrationServices/СервисИнтеграцииПоУмолчанию.xml`:

- the minimal object has no channels and no module;
- `ExternalIntegrationServiceAddress` is an empty string in XML and remains explicit content if present, not a YAML
  default;
- do not set YAML defaults for `messageDirection` or `transactioned` from the full fixture: it contains both
  `Receive/false` and `Send/true`, so those values are meaningful channel content;
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`.

Implementation notes:

- Reuse the existing child-collection pattern from `metadataHTTPService`: parent `ChildObjects`, a separate child rule,
  and `requiredXMLParents: [["ChildObjects"]]`.
- The manager module contains the receive-message handler procedures referenced by channels, so it must be preserved
  with normal `Module` external-file handling.
- No external data-source implementation is required for this object.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover empty `ChildObjects`, multiple channels, both message directions, transaction flag, and
  `ReceiveMessageProcessing`;
- sync from XML verifies `Свойства.yaml` and `Модуль.bsl` when present;
- sync to XML verifies `IntegrationServices/<name>.xml` and `IntegrationServices/<name>/Ext/Module.bsl` when present.

## Object: MetadataTask

- `itemType`: `MetadataTask`
- `itemTypePrefix`: `Задача`
- XML directory: `Tasks`
- XML container: `Task`
- implement through `rules.ts`
- `InternalInfo` generated categories:
  - `Object`
  - `Ref`
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
| `numberType` | `NumberType` | `ТипНомера` | `SystemEnumeration: TaskNumberType` |
| `numberLength` | `NumberLength` | `ДлинаНомера` | `number` |
| `numberAllowedLength` | `NumberAllowedLength` | `ДопустимаяДлинаНомера` | `AllowedLength` |
| `checkUnique` | `CheckUnique` | `КонтрольУникальности` | `boolean` |
| `autonumbering` | `Autonumbering` | `Автонумерация` | `boolean` |
| `taskNumberAutoPrefix` | `TaskNumberAutoPrefix` | `АвтоПрефиксНомераЗадачи` | `SystemEnumeration: TaskNumberAutoPrefix` |
| `descriptionLength` | `DescriptionLength` | `ДлинаНаименования` | `number` |
| `addressing` | `Addressing` | `Адресация` | `string` / `MDObjectRef` |
| `mainAddressingAttribute` | `MainAddressingAttribute` | `ОсновнойРеквизитАдресации` | `string` / `MDObjectRef` |
| `currentPerformer` | `CurrentPerformer` | `ТекущийИсполнитель` | `string` / `MDObjectRef` |
| `basedOn` | `BasedOn` | `ВводитсяНаОсновании` | `MetadataItemLinks` |
| `standardAttributes` | `StandardAttributes` | `СтандартныеРеквизиты` | `StandardAttributeDescriptions` |
| `characteristics` | `Characteristics` | `Характеристики` | `CharacteristicsDescriptions` |
| `defaultPresentation` | `DefaultPresentation` | `ОсновноеПредставление` | `SystemEnumeration: TaskMainPresentation` |
| `editType` | `EditType` | `СпособРедактирования` | `SystemEnumeration: EditType` |
| `inputByString` | `InputByString` | `ВводПоСтроке` | `MetadataFields` |
| `searchStringModeOnInputByString` | `SearchStringModeOnInputByString` | `РежимСтрокиПоискаПриВводеПоСтроке` | `SystemEnumeration: SearchStringModeOnInputByString` |
| `fullTextSearchOnInputByString` | `FullTextSearchOnInputByString` | `ПолнотекстовыйПоискПриВводеПоСтроке` | `SystemEnumeration: FullTextSearchOnInputByString` |
| `choiceDataGetModeOnInputByString` | `ChoiceDataGetModeOnInputByString` | `РежимПолученияДанныхВыбораПриВводеПоСтроке` | `SystemEnumeration: ChoiceDataGetModeOnInputByString` |
| `createOnInput` | `CreateOnInput` | `СозданиеПриВводе` | `SystemEnumeration: CreateOnInput` |
| `defaultObjectForm` | `DefaultObjectForm` | `ОсновнаяФормаОбъекта` | `string` |
| `defaultListForm` | `DefaultListForm` | `ОсновнаяФормаСписка` | `string` |
| `defaultChoiceForm` | `DefaultChoiceForm` | `ОсновнаяФормаВыбора` | `string` |
| `auxiliaryObjectForm` | `AuxiliaryObjectForm` | `ДополнительнаяФормаОбъекта` | `string` |
| `auxiliaryListForm` | `AuxiliaryListForm` | `ДополнительнаяФормаСписка` | `string` |
| `auxiliaryChoiceForm` | `AuxiliaryChoiceForm` | `ДополнительнаяФормаВыбора` | `string` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `dataLockFields` | `DataLockFields` | `ПоляБлокировкиДанных` | `MetadataFields` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
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
- `TabularSection[]`: task-specific wrapper over the common tabular-section property set, with generated type names
  `TaskTabularSection` and `TaskTabularSectionRow`.
- `Form[]`: existing `ChildFormNames`, including object, list, and choice forms.
- `Template[]`: existing `ChildTemplateNames`.
- `AddressingAttribute[]`: new task child object; reuse attribute rules and add `AddressingDimension`.
- `Command[]`: existing `MetadataCommands`, and include `childCollections` so command modules are copied.

Addressing attribute specifics:

- base fields match normal metadata attributes: type, formats, filling, choice links/parameters, quick choice,
  `CreateOnInput`, link by type, indexing, full-text search, and data history;
- extra field `addressingDimension`: XML `AddressingDimension`, YAML `ИзмерениеАдресации`, type `string` / `MDObjectRef`;
- generated type is not emitted for addressing attributes in current fixtures.

External files:

- `objectModule`: existing `Module`, XML `Ext/ObjectModule.bsl`, nkdk `МодульОбъекта.bsl`
- `managerModule`: existing `Module`, XML `Ext/ManagerModule.bsl`, nkdk `МодульМенеджера.bsl`
- `additionalIndexes`: existing `AdditionalIndex`, XML `Ext/AdditionalIndexes.xml`
- `help`: existing `Help`, XML `Ext/Help.xml` and `Ext/Help/ru.html`, nkdk `Справка/`
- child forms through `ChildFormNames`
- child templates through `ChildTemplateNames`
- command modules through `MetadataCommands`

Default policy from `minimal.xml`:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true`
- `numberType`: `defaultValueXML: "String"`, `implicitValueYAML: "String"`
- `numberLength`: `defaultValueXML: 9`, `implicitValueYAML: 9`
- `numberAllowedLength`: `defaultValueXML: "Variable"`, `implicitValueYAML: "Variable"`
- `checkUnique`: `defaultValueXML: true`, `implicitValueYAML: true`
- `autonumbering`: `defaultValueXML: true`, `implicitValueYAML: true`
- `taskNumberAutoPrefix`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `descriptionLength`: `defaultValueXML: 25`, `implicitValueYAML: 25`
- `defaultPresentation`: `defaultValueXML: "AsDescription"`, `implicitValueYAML: "AsDescription"`
- `editType`: `defaultValueXML: "InDialog"`, `implicitValueYAML: "InDialog"`
- `searchStringModeOnInputByString`: `defaultValueXML: "Begin"`, `implicitValueYAML: "Begin"`
- `fullTextSearchOnInputByString`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceDataGetModeOnInputByString`: `defaultValueXML: "Directly"`, `implicitValueYAML: "Directly"`
- `createOnInput`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `choiceHistoryOnInput`: `defaultValueXML: "Auto"`, `implicitValueYAML: "Auto"`
- `includeHelpInContents`: `defaultValueXML: false`, `implicitValueYAML: false`
- `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- `fullTextSearch`: `defaultValueXML: "Use"`, `implicitValueYAML: "Use"`
- `dataHistory`: `defaultValueXML: "DontUse"`, `implicitValueYAML: "DontUse"`
- `updateDataHistoryImmediatelyAfterWrite`: `defaultValueXML: false`, `implicitValueYAML: false`
- `executeAfterWriteDataHistoryVersionProcessing`: `defaultValueXML: false`, `implicitValueYAML: false`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Keep `addressing`, `mainAddressingAttribute`, `currentPerformer`, `basedOn`, `standardAttributes`, `characteristics`,
`inputByString`, `dataLockFields`, child attributes, tabular sections, addressing attributes, forms, templates, commands,
and additional indexes as explicit content, not YAML defaults.

Implementation notes:

- Reuse existing common behavior from `metadataDocument`, `metadataBusinessProcess`, and register-specific objects.
- `AdditionalIndexes.xml` is parsed through the existing `AdditionalIndex` common object, not copied as an opaque
  template.
- The full sync fixture already contains forms, form modules, one template file, one command module, help, and
  additional indexes; object and manager modules should be handled by rules when present even if the current fixture
  does not include them.
- `Task.ЗадачаВсеСвойства` is referenced by `metadataBusinessProcess`; adding this object lets that reference resolve
  naturally in later round-trip coverage.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and `full.xml`;
- tests cover number settings, addressing links, default/auxiliary form references, input by string, data lock fields,
  standard attributes, characteristics, attributes, tabular sections, addressing attributes, and commands;
- sync from XML verifies `Свойства.yaml`, `ДополнительныеИндексы`, `Справка/`, forms, templates, and command modules;
- sync to XML verifies `Tasks/<name>.xml`, `Ext/AdditionalIndexes.xml`, `Ext/Help.xml`, `Ext/Help/ru.html`, form XML,
  template XML, and command module.

## Object: MetadataWebService

- `itemType`: `MetadataWebService`
- `itemTypePrefix`: `WebСервис`
- XML directory: `WebServices`
- XML container: `WebService`
- implement through `rules.ts`

Parent properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `namespace` | `Namespace` | `ПространствоИмен` | `string` |
| `xdtoPackages` | `XDTOPackages` | `ПакетыXDTO` | new `XDTOPackages` common type |
| `descriptorFileName` | `DescriptorFileName` | `ИмяФайлаДескриптора` | `string` |
| `reuseSessions` | `ReuseSessions` | `ПовторноеИспользованиеСеансов` | `SystemEnumeration: SessionReuseMode` |
| `sessionMaxAge` | `SessionMaxAge` | `ВремяЖизниСеанса` | `number` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Child objects:

- `Operation[]`: new child object collection under `ChildObjects/Operation`.
- `Parameter[]`: new operation child object collection under `Operation/ChildObjects/Parameter`.

Operation properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `xdtoReturningValueType` | `XDTOReturningValueType` | `ТипВозвращаемогоЗначенияXDTO` | `string` / QName |
| `nillable` | `Nillable` | `МожетБытьНеопределено` | `boolean` |
| `transactioned` | `Transactioned` | `Транзакционный` | `boolean` |
| `procedureName` | `ProcedureName` | `ИмяПроцедуры` | `string` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

Parameter properties:

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `xdtoValueType` | `XDTOValueType` | `ТипЗначенияXDTO` | `string` / QName |
| `nillable` | `Nillable` | `МожетБытьНеопределено` | `boolean` |
| `transferDirection` | `TransferDirection` | `НаправлениеПередачи` | `SystemEnumeration: TransferDirection` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration: ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only `string` |

External files:

- `module`: existing `Module`, XML `WebServices/<name>/Ext/Module.bsl`, nkdk `Модуль.bsl`

`XDTOPackages`:

- do not reuse `MetadataValueCollection`: the XML item shape is not plain `xr:Item xsi:type=...`; it contains
  `xr:Presentation`, `xr:CheckState`, and nested `xr:Value`;
- the first implementation should preserve `Presentation` and `CheckState` fields even when presentation is empty and
  check state is `0`;
- `xr:Value` can be either `xr:MDObjectRef` such as `XDTOPackage.ПакетXDTO1` or plain string namespace URI.

Default policy from `minimal.xml`:

- `reuseSessions`: `defaultValueXML: "AutoUse"`, `implicitValueYAML: "AutoUse"`
- `sessionMaxAge`: `defaultValueXML: 20`, `implicitValueYAML: 20`
- the minimal object has empty `XDTOPackages` and no operations;
- `namespace` and `descriptorFileName` remain explicit content, not YAML defaults;
- operation defaults from the full fixture:
  - `nillable`: `defaultValueXML: false`, `implicitValueYAML: false`
  - `transactioned`: `defaultValueXML: false`, `implicitValueYAML: false`
  - `dataLockControlMode`: `defaultValueXML: "Managed"`, `implicitValueYAML: "Managed"`
- parameter defaults from the updated fixture copied from `/Users/nikita/git/roundTripElements/WebServices`:
  - `nillable`: `defaultValueXML: false`, `implicitValueYAML: false`
  - `transferDirection`: `defaultValueXML: "In"`, `implicitValueYAML: "In"`
- `objectBelonging`: hidden, `implicitValueYAML: "Native"`

Implementation notes:

- Reuse the existing child-collection pattern from `metadataHTTPService` and `metadataIntegrationService`.
- The updated `full.xml` and sync XML fixtures include two parameters under `ОперацияВсеСвойства`; use them for
  `Parameter[]` round-trip coverage.
- The module contains handlers named by `Operation.ProcedureName`, so it must be preserved with normal `Module`
  external-file handling.

Testing:

- standard XML/YAML/sync tests;
- XML tests cover `minimal.xml` and updated `full.xml`;
- tests cover XDTO package references, string namespace package values, operation return type, operation defaults, and
  operation parameters with both `InOut` and default `In` transfer directions;
- sync from XML verifies `Свойства.yaml` and `Модуль.bsl` when present;
- sync to XML verifies `WebServices/<name>.xml` and `WebServices/<name>/Ext/Module.bsl` when present.

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

Sync tests must cover opaque external-file copying for role, scheduled job, common template, style, and subsystem, plus
external form files for common forms.

## Open Queue

Objects still needing brainstorming in this pass: none.
