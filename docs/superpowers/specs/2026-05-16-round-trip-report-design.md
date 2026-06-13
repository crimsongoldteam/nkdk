# Round-Trip Report Design

## Context

This spec adds the `Report` applied metadata object to the round-trip coverage. The source fixtures are:

- `/Users/nikita/git/roundTripElements/Reports/ОтчетПоУмолчанию.xml`
- `/Users/nikita/git/roundTripElements/Reports/ОтчетСКД.xml`
- `/Users/nikita/git/roundTripElements/Reports/ОтчетВсеСвойства.xml`
- external files under `/Users/nikita/git/roundTripElements/Reports/ОтчетВсеСвойства/**`

The current codebase does not have `packages/core/metadata/appliedObjects/metadataReport`. The closest existing object is
`metadataDataProcessor`, which already covers attributes, tabular sections, forms, templates, commands, modules, and help.

## Sources

`/Users/nikita/git/1c_res/model.xdtobackend_root.res` defines `Report` as an `MDObjectBase` with:

- `Properties: ReportProperties`
- `ChildObjects: ReportChildObjects`

`ReportChildObjects` contains:

- repeated `Attribute`
- repeated `TabularSection`
- repeated `Form`
- repeated `Template`
- repeated `Command`

`ReportProperties` contains the same base properties as `DataProcessor` plus report-specific object references:

- `MainDataCompositionSchema`
- `DefaultSettingsForm`
- `AuxiliarySettingsForm`
- `DefaultVariantForm`
- `VariantsStorage`
- `SettingsStorage`

`/Users/nikita/git/1c_res/hlp/1/FileStorage/objects/catalog125/catalog279/Report form extension.ts` confirms that
`ReportResult` and `DetailsData` are form-extension properties, not report-object properties.

`/Users/nikita/git/1c_res/mobileForm.xsdconfig_root.res` confirms additional report form fields:

- `reportResult`: "Результат отчета"
- `detailsInformation`: "Данные расшифровки"
- `reportFormType`: "Тип формы отчета"
- `customSettingsFolder`: "Группа пользовательских настроек"
- `variantAppearance`: "Представление варианта"
- `reportResultViewMode`: "Режим отображения результата отчета"
- `viewModeApplicationOnSetReportResult`: "Применение режима отображения при установке результата отчета"

The fixture XML uses MDClasses/logform tag spelling:

- `ReportResult`
- `DetailsData`
- `ReportFormType`
- `CustomSettingsFolder`
- `VariantAppearance`
- `ReportResultViewMode`
- `ViewModeApplicationOnSetReportResult`

## Design

Add `metadataReport` as a top-level applied object using the existing `metadataDataProcessor` pattern as the baseline.

The report rule should use:

- `itemType: "MetadataReport"`
- `itemTypePrefix: "Отчет"`
- `xmlDir: "Reports"`
- XML root container `Report`
- internal info generated types:
  - `ReportObject`
  - `ReportManager`

Report properties:

| TS key | XML tag | YAML key | Type |
| --- | --- | --- | --- |
| `name` | `Name` | hidden/import default | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `defaultForm` | `DefaultForm` | `ОсновнаяФорма` | `string` |
| `auxiliaryForm` | `AuxiliaryForm` | `ДополнительнаяФорма` | `string` |
| `mainDataCompositionSchema` | `MainDataCompositionSchema` | `ОсновнаяСхемаКомпоновкиДанных` | `string` |
| `defaultSettingsForm` | `DefaultSettingsForm` | `ОсновнаяФормаНастроекОтчета` | `string` |
| `auxiliarySettingsForm` | `AuxiliarySettingsForm` | `ДополнительнаяФормаНастроекОтчета` | `string` |
| `defaultVariantForm` | `DefaultVariantForm` | `ОсновнаяФормаВариантаОтчета` | `string` |
| `variantsStorage` | `VariantsStorage` | `ХранилищеВариантовОтчетов` | `string` |
| `settingsStorage` | `SettingsStorage` | `ХранилищеПользовательскихНастроекОтчетов` | `string` |
| `includeHelpInContents` | `IncludeHelpInContents` | `ВключатьСправкуВСодержание` | `boolean` |
| `extendedPresentation` | `ExtendedPresentation` | `РасширенноеПредставление` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `objectBelonging` | `ObjectBelonging` | hidden | `SystemEnumeration/ObjectBelonging` |
| `extendedConfigurationObject` | `ExtendedConfigurationObject` | hidden | runtime-only string/UUID |

Defaults should match the XML fixtures:

- `useStandardCommands`: `true`
- `includeHelpInContents`: `false`
- define matching `implicitValueYAML` for every report property that has a platform default in the minimal XML fixture;
  at minimum this includes `useStandardCommands: true` and `includeHelpInContents: false`
- empty MDObjectRef fields export as empty XML elements when present in reference XML
- `synonym`, `comment`, `extendedPresentation`, and `explanation` follow the same defaults as `metadataDataProcessor`

Reference scopes:

- form references target this report's `Form` children;
- `mainDataCompositionSchema` targets this report's `Template` children;
- storage references remain plain metadata links because the target is `SettingsStorage`.

Child objects:

- `attributes`: reuse `MetadataAttributes` with the data-processor override that declares type namespaces in XML;
- `tabularSections`: reuse the data-processor tabular-section collection pattern;
- `forms`: reuse `ChildFormNames`, folder `Формы`;
- `templates`: reuse `ChildTemplateNames`, folder `Шаблоны`;
- `commands`: reuse `MetadataCommands`, with command modules at `Reports/<report>/Commands/<command>/Ext/CommandModule.bsl`.

External files:

- object module: `Ext/ObjectModule.bsl` -> `МодульОбъекта.bsl`;
- manager module: `Ext/ManagerModule.bsl` -> `МодульМенеджера.bsl`;
- help: `Ext/Help.xml` and pages under `Ext/Help/` -> `Справка/`;
- forms: standard form metadata, form body, module, and form help through `ChildFormNames`;
- templates: standard template metadata and template body through `ChildTemplateNames`.

## Report Form Extension

Add report-form fields to `ClientApplicationFormRules` separately from `metadataReport`. These are properties of
`Forms/<form>/Ext/Form.xml`, not properties of `Reports/<name>.xml`.

| TS key | XML tag | YAML key | Type |
| --- | --- | --- | --- |
| `reportResult` | `ReportResult` | `РезультатОтчета` | `string` |
| `detailsData` | `DetailsData` | `ДанныеРасшифровки` | `string` |
| `reportFormType` | `ReportFormType` | `ТипФормыОтчета` | `SystemEnumeration/ReportFormType` |
| `variantAppearance` | `VariantAppearance` | `ПредставлениеВарианта` | `string` |
| `customSettingsFolder` | `CustomSettingsFolder` | `ГруппаПользовательскихНастроек` | `string` |
| `reportResultViewMode` | `ReportResultViewMode` | `РежимОтображенияРезультатаОтчета` | `SystemEnumeration/ReportResultViewMode` |
| `viewModeApplicationOnSetReportResult` | `ViewModeApplicationOnSetReportResult` | `ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета` | `SystemEnumeration/ViewModeApplicationOnSetReportResult` |

`customSettingsFolder` already exists in `ClientApplicationFormRules`; keep that property and do not duplicate it.

`DetailsData` is the spelling used by the real desktop form XML fixture. The mobile XSD name `detailsInformation` is
only evidence for the Russian property meaning, not the XML tag to emit for MDClasses/logform round-trip.

Report form defaults should also be explicit in YAML rules where the platform default is known from fixtures or
neighboring form behavior. For the current report fixtures:

- `reportResultViewMode`: `implicitValueYAML: "Auto"`
- `viewModeApplicationOnSetReportResult`: `implicitValueYAML: "Auto"`
- `reportFormType` should not have one universal YAML default because the fixture uses different values for main,
  settings, and variant report forms.
- `customSettingsFolder`, `reportResult`, `detailsData`, and `variantAppearance` stay absent from YAML when absent in
  XML; do not invent defaults for object-specific field paths.

## Registries

Add `metadataReport` to the same registry set as other top-level applied objects:

- runtime applied objects index;
- `TopLevelMetadataItemRules`;
- `MetadataItemTypeRegistry`;
- `PropertyTypeRegistry`;
- `PropertyRuleTypeKeys`;
- configuration top-level tests;
- any migration/top-level path mapping that enumerates applied-object prefixes.

## Tests

Add the standard test set for `metadataReport`:

- `fromXML.test.ts`
- `toXML.test.ts`
- `fromYAML.test.ts`
- `toYAML.test.ts`
- `convertFromXML.test.ts`
- `syncToXML.test.ts`

Use copied report fixtures from `/Users/nikita/git/roundTripElements/Reports`. Do not modify existing XML fixtures in
other metadata objects.

Required coverage:

- minimal report with empty `ChildObjects`;
- report with a main data composition schema template;
- full report with attributes, tabular sections, forms, templates, commands, object module, manager module, help, and
  command module;
- sync from XML writes `Свойства.yaml`, modules, help pages, form files, and template files;
- sync to XML restores `Reports/<name>.xml` and all external files;
- report form properties round-trip through `Forms/<form>/Ext/Form.xml` and `Форма.yaml`;
- `ReportResult` and `DetailsData` are covered as form properties, not report properties.

## Out Of Scope

- Implementing a new data composition schema model. `Templates/<name>/Ext/Template.xml` remains an external template
  file handled by the existing template sync path.
- Reworking all form rules. Only the report-form extension fields listed above are in scope.
- Changing existing XML fixtures.
