# Simple Applied Objects Batch Design

## Context

Continue adding applied metadata objects by analogy with `packages/core/metadata/appliedObjects/metadataConstant`.
This batch uses one shared design and one later implementation plan, but each object keeps its own local `rules.ts`,
`types.ts`, fixtures-based tests, and registry entries.

The implementation must not change existing XML fixtures. XML fixtures are the first source of truth; `minimal.xml`
is the source for `implicitValueYAML` only for boolean, number, and `SystemEnumeration` values. Empty strings, empty
lists, and `xsi:nil` values are XML defaults, not YAML defaults.

## Approach

Use the conservative `rules.ts` path:

- add one declarative applied-object rule per included object;
- infer model and YAML types through `MetadataTypeByRule` and `YAMLTypeByRule`;
- register each object in `MetadataItemTypeRegistry`, `PropertyTypeRegistry`, and `PropertyRuleTypeKeys`;
- call `registerMetadataItemRule` from the object `types.ts`;
- import each object from `packages/core/metadata/appliedObjects/index.ts`;
- add the standard test set: `fromXML`, `toXML`, `fromYAML`, `toYAML`, `convertFromXML`, and `syncToXML`.

Do not add custom `fromXML`, `toXML`, `fromYAML`, or `toYAML` handlers unless a current fixture cannot round-trip
through existing common rules. Do not refactor common infrastructure as part of this batch.

## Current Scope

Included:

- `metadataDefinedType`
- `metadataEventSubscription`
- `metadataFilterCriterion`
- `metadataCommonAttribute`
- `metadataBot`
- `metadataWSReference`
- `metadataStyleItem`
- `metadataSettingsStorage`
- `metadataSessionParameter`
- `metadataFunctionalOptionsParameter`

Explicitly excluded for this batch:

- `metadataExternalDataSource`

`metadataExternalDataSource` is skipped because its XDTO child objects include `Table`, `Cube`, and `Function`, while
the current fixtures only contain empty `<ChildObjects/>`. Supporting it properly is better left for a separate task.

## Object: MetadataDefinedType

Risk is low.

- `itemType`: `MetadataDefinedType`
- `itemTypePrefix`: `ОпределяемыйТип`
- `xmlDir`: `DefinedTypes`
- XML container: `DefinedType`
- `InternalInfo`: one generated type, category `DefinedType`
- properties: `name`, `synonym`, `comment`, `type`
- `type`: `TypeDescription`; short YAML form is allowed
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none
- external files: none

Default policy:

- no normal `implicitValueYAML` values;
- empty `Comment` and empty `Type` from `minimal.xml` are XML defaults, not YAML defaults.

Testing:

- standard XML/YAML/sync tests;
- sync only checks `Свойства.yaml` and the main XML file.

## Object: MetadataEventSubscription

Risk is low.

- `itemType`: `MetadataEventSubscription`
- `itemTypePrefix`: `ПодпискаНаСобытие`
- `xmlDir`: `EventSubscriptions`
- XML container: `EventSubscription`
- `InternalInfo`: absent in current fixtures
- properties: `name`, `synonym`, `comment`, `source`, `event`, `handler`
- `source`: `TypeDescription`
- `event`: `string`
- `handler`: `string`
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none
- external files: none

Default policy:

- no normal `implicitValueYAML` values;
- `Event` and `Handler` values from `minimal.xml` are fixture content, not platform defaults;
- empty `Comment` is an XML default, not a YAML default.

Testing:

- standard XML/YAML/sync tests;
- sync only checks `Свойства.yaml` and the main XML file.

## Object: MetadataSessionParameter

Risk is low.

- `itemType`: `MetadataSessionParameter`
- `itemTypePrefix`: `ПараметрСеанса`
- `xmlDir`: `SessionParameters`
- XML container: `SessionParameter`
- `InternalInfo`: absent in current fixtures
- properties: `name`, `synonym`, `comment`, `type`
- `type`: `TypeDescription`; short YAML form is allowed
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none
- external files: none

Default policy:

- no normal `implicitValueYAML` values;
- empty `Comment` from `minimal.xml` is an XML default, not a YAML default.

Testing:

- standard XML/YAML/sync tests;
- sync only checks `Свойства.yaml` and the main XML file.

## Object: MetadataFunctionalOptionsParameter

Risk is low to medium.

- `itemType`: `MetadataFunctionalOptionsParameter`
- `itemTypePrefix`: `ПараметрФункциональныхОпций`
- `xmlDir`: `FunctionalOptionsParameters`
- XML container: `FunctionalOptionsParameter`
- `InternalInfo`: absent in current fixtures
- properties: `name`, `synonym`, `comment`, `use`
- `use`: `MetadataItemLinks`
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none
- external files: none

Risk and decision:

- `Use` stores `xr:Item xsi:type="xr:MDObjectRef"` values and current fixtures include both a top-level object
  reference and a nested metadata path such as an information register dimension. Use the existing `MetadataItemLinks`
  type and verify both shapes with XML/YAML/sync tests.

Default policy:

- no normal `implicitValueYAML` values;
- empty `Comment` and empty `Use` from `minimal.xml` are XML defaults, not YAML defaults.

Testing:

- standard XML/YAML/sync tests;
- tests must include the nested `InformationRegister.*.Dimension.*` reference from the full fixture;
- sync only checks `Свойства.yaml` and the main XML file.

## Object: MetadataStyleItem

Risk is medium.

- `itemType`: `MetadataStyleItem`
- `itemTypePrefix`: `ЭлементСтиля`
- `xmlDir`: `StyleItems`
- XML container: `StyleItem`
- `InternalInfo`: absent in current fixtures
- properties: `name`, `synonym`, `comment`, `type`, `value`
- `type`: `SystemEnumeration: StyleElementType`
- `value`: local `StyleItemValue` adapter over existing `Font`, `Color`, and `Border` common types
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none
- external files: none

Risk and decision:

- `Value` changes shape according to `Type`: current fixtures cover `Font`, `Color`, and `Border`.
- Existing common types already implement the underlying XML/YAML behavior. Add only a minimal local adapter that picks
  `Font`, `Color`, or `Border` by XML `xsi:type` and by the model `type`, without changing these common types.

Default policy:

- do not set `implicitValueYAML` for `type`; `Type=Font` from the font fixture is not a general platform default;
- no normal `implicitValueYAML` values;
- empty `Comment` from color/border fixtures is an XML default, not a YAML default.

Testing:

- standard XML/YAML/sync tests;
- XML tests must cover `font.xml`, `color.xml`, and `border.xml`;
- sync checks the existing font sync fixture.

## Object: MetadataCommonAttribute

Risk is high.

- `itemType`: `MetadataCommonAttribute`
- `itemTypePrefix`: `ОбщийРеквизит`
- `xmlDir`: `CommonAttributes`
- XML container: `CommonAttribute`
- `InternalInfo`: absent in current fixtures
- child objects: none
- external files: none

Most properties reuse the same rule types as `MetadataConstant` and `MetadataAttribute`: `TypeDescription`,
`I8nText`, `MinMaxValue`, `MetadataValue`, `ChoiceParameterLinks`, `ChoiceParameters`, `TypeLink`, strings,
booleans, and system enumerations.

XDTO-confirmed special properties:

- `fillValue`: `MetadataValue`. Current fixtures use `xsi:type="xs:string"`, including an empty string value in
  `minimal.xml`. Use `defaultValueXMLRaw: { "_xsi:type": "xs:string" }`; do not set `implicitValueYAML`.
- `content`: new small common type `CommonAttributeContent`, matching XDTO `CommonAttributeContent`.
- `content.item[]`: XDTO `CommonAttributeContentItem` with:
  - `metadata`: `string` / `MDObjectRef`;
  - `use`: `SystemEnumeration: CommonAttributeUse`;
  - `conditionalSeparation`: `string` / `MDObjectRef`, with empty XML default.
- `dataSeparationValue`, `dataSeparationUse`, `conditionalSeparation`: `string` / `MDObjectRef`, with empty XML defaults.

System enumeration properties and defaults from `minimal.xml`:

| TS key | TypeSE | Default |
|---|---|---|
| `fillChecking` | `FillChecking` | `DontCheck` |
| `choiceFoldersAndItems` | `FoldersAndItemsUse` | `Items` |
| `quickChoice` | `UseQuickChoice` | `Auto` |
| `createOnInput` | `CreateOnInput` | `Auto` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `Auto` |
| `autoUse` | `CommonAttributeAutoUse` | `DontUse` |
| `dataSeparation` | `CommonAttributeDataSeparation` | `DontUse` |
| `separatedDataUse` | `CommonAttributeSeparatedDataUse` | `Independently` |
| `usersSeparation` | `CommonAttributeUsersSeparation` | `DontUse` |
| `authenticationSeparation` | `CommonAttributeAuthenticationSeparation` | `DontUse` |
| `configurationExtensionsSeparation` | `CommonAttributeConfigurationExtensionsSeparation` | `DontUse` |
| `indexing` | `Indexing` | `DontIndex` |
| `fullTextSearch` | `UseFullTextSearch` | `Use` |
| `dataHistory` | `DataHistoryUse` | `Use` |

Boolean defaults from `minimal.xml`:

| TS key | Default |
|---|---|
| `passwordMode` | `false` |
| `markNegatives` | `false` |
| `multiLine` | `false` |
| `extendedEdit` | `false` |
| `fillFromFillingValue` | `false` |

Default policy:

- set `implicitValueYAML` only for the boolean and system enumeration properties listed above;
- `minValue` and `maxValue` use XML raw `xsi:nil` defaults;
- empty `Comment`, formats, mask, choice links, choice parameters, choice form, link-by-type, `Content`, and separation
  references are XML defaults, not YAML defaults;
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`;
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`.

Testing:

- standard XML/YAML/sync tests;
- tests must cover `FillValue` as an empty and non-empty `xs:string`;
- tests must cover `CommonAttributeContent` with all three fixture items and empty `ConditionalSeparation`;
- sync only checks `Свойства.yaml` and the main XML file.

## Object: MetadataBot

Risk is low to medium.

XDTO confirms `BotProperties` contains only `Name`, `Synonym`, `Comment`, `ObjectBelonging`,
`ExtendedConfigurationObject`, `Predefined`, `Picture`, and external `Module`.

- `itemType`: `MetadataBot`
- `itemTypePrefix`: `Бот`
- `xmlDir`: `Bots`
- XML container: `Bot`
- `InternalInfo`: absent in current fixtures
- properties: `name`, `synonym`, `comment`, `predefined`, `picture`, `module`
- `predefined`: `boolean`
- `picture`: existing `Picture`
- `module`: existing `Module`, `nkdkPath: "Модуль.bsl"`, `xmlPath: "Ext/Module.bsl"`
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none

Default policy:

- `predefined`: `defaultValueXML: true`, `implicitValueYAML: true` from `minimal.xml`;
- empty `Comment` and empty `Picture` are XML defaults, not YAML defaults.

Testing:

- standard XML/YAML/sync tests;
- sync must check both the main XML file and `Ext/Module.bsl`.

## Object: MetadataWSReference

Risk is medium.

XDTO confirms `WSReferenceProperties` contains only `Name`, `Synonym`, `Comment`, `ObjectBelonging`,
`ExtendedConfigurationObject`, `LocationURL`, and external `WSDefinition`.

- `itemType`: `MetadataWSReference`
- `itemTypePrefix`: `WSСсылка`
- `xmlDir`: `WSReferences`
- XML container: `WSReference`
- `InternalInfo`: absent in current fixtures
- properties: `name`, `synonym`, `comment`, `locationURL`, `wsDefinition`
- `locationURL`: `string`
- `wsDefinition`: external XML file copied as-is, without parsing
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`
- child objects: none

Risk and decision:

- `Ext/WSDefinition.xml` must remain an opaque external file, like modules or templates. Do not parse it into the
  metadata model and do not normalize its XML content.
- Prefer an existing external-file rule if it can copy arbitrary files without parsing. If existing `Template` is too
  template-specific, add a minimal `ExternalFile`/`ExternalXMLFile` property type for opaque sync.

Default policy:

- no normal `implicitValueYAML` values;
- empty `Comment` is an XML default, not a YAML default;
- `LocationURL` from `minimal.xml` is fixture content, not a platform default.

Testing:

- standard XML/YAML/sync tests;
- sync must check both the main XML file and `Ext/WSDefinition.xml` byte-for-byte/text-for-text after normalizing line
  endings only if the existing sync test helper does that.

## Object: MetadataFilterCriterion

Risk is medium.

XDTO confirms `FilterCriterionProperties` contains `Name`, `Synonym`, `Comment`, `ObjectBelonging`,
`ExtendedConfigurationObject`, `Type`, `UseStandardCommands`, `Content`, `DefaultForm`, `AuxiliaryForm`,
`ManagerModule`, `ListPresentation`, `ExtendedListPresentation`, and `Explanation`. XDTO child objects are `Form[]`
and `Command[]`.

- `itemType`: `MetadataFilterCriterion`
- `itemTypePrefix`: `КритерийОтбора`
- `xmlDir`: `FilterCriteria`
- XML container: `FilterCriterion`
- `InternalInfo`: absent in current fixtures
- `type`: `TypeDescription`; short YAML form is allowed only if tests show this stays readable and unambiguous
- `useStandardCommands`: `boolean`
- `content`: `MetadataItemLinks`
- `defaultForm`, `auxiliaryForm`: `string` with `referenceScope` to forms of this object
- `managerModule`: existing `Module`, `nkdkPath: "МодульМенеджера.bsl"`, `xmlPath: "Ext/ManagerModule.bsl"`
- `listPresentation`, `extendedListPresentation`, `explanation`: `I8nText`
- `commands`: existing `MetadataCommands` under `ChildObjects/Command`
- `forms`: existing `ChildFormNames` under `ChildObjects/Form`
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`

Default policy:

- `useStandardCommands`: `defaultValueXML: true`, `implicitValueYAML: true` from `minimal.xml`;
- empty `Comment`, `Type`, `Content`, form references, presentations, and `Explanation` are XML defaults, not YAML
  defaults.

Testing:

- standard XML/YAML/sync tests;
- sync must check the main XML file, `Ext/ManagerModule.bsl`, child command module, child form XML, and child form
  module.

## Object: MetadataSettingsStorage

Risk is medium.

XDTO confirms `SettingsStorageProperties` contains `Name`, `Synonym`, `Comment`, `ObjectBelonging`,
`ExtendedConfigurationObject`, `DefaultSaveForm`, `DefaultLoadForm`, `AuxiliarySaveForm`, `AuxiliaryLoadForm`, and
`ManagerModule`. XDTO child objects are `Form[]` and `Template[]`.

- `itemType`: `MetadataSettingsStorage`
- `itemTypePrefix`: `ХранилищеНастроек`
- `xmlDir`: `SettingsStorages`
- XML container: `SettingsStorage`
- `InternalInfo`: absent in current fixtures
- `defaultSaveForm`, `defaultLoadForm`, `auxiliarySaveForm`, `auxiliaryLoadForm`: `string` with `referenceScope` to
  forms of this object
- `managerModule`: existing `Module`, `nkdkPath: "МодульМенеджера.bsl"`, `xmlPath: "Ext/ManagerModule.bsl"`
- `forms`: existing `ChildFormNames` under `ChildObjects/Form`
- `templates`: existing `ChildTemplateNames` under `ChildObjects/Template`
- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, hidden from YAML, `implicitValueYAML: "Native"`
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`

Risk and decision:

- XDTO includes `ManagerModule`, but current fixtures do not include `Ext/ManagerModule.bsl`. Keep the property in the
  rule so future XML can round-trip it, but current sync tests must not expect this file.
- Forms and templates are child names with external content, not inline child object models.

Default policy:

- no normal `implicitValueYAML` values;
- empty `Comment` and form references are XML defaults, not YAML defaults.

Testing:

- standard XML/YAML/sync tests;
- sync must check the main XML file, both child form XML files, and the template file;
- sync must not expect `Ext/ManagerModule.bsl` until a fixture contains it.
