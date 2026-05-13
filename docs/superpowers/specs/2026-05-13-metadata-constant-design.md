# Metadata Constant Design

## Context

Add `packages/core/metadata/appliedObjects/metadataConstant` as the first object in the next applied-object batch. The directory already has XML fixtures:

- `__fixtures__/full.xml`
- `__fixtures__/minimal.xml`
- `__fixtures__/sync/xml/КонстантаВсеСвойства.xml`
- external modules under `__fixtures__/sync/xml/КонстантаВсеСвойства/Ext/`

The implementation must not change XML fixtures. XML fixtures remain the first source of truth. For platform property names and defaults, use these sources in order:

1. XML fixtures, especially `minimal.xml` for default values.
2. XSD/XDTO resources under `/Users/nikita/git/1c_res/`.
3. 1C help catalog `/Users/nikita/git/1c_res/hlp/1/FileStorage/objects`.
4. `~/.cache/mcp-bsl/ru-en-map.json`.
5. Neighboring implemented metadata items.

For this object, the effective XDTO source is `/Users/nikita/git/1c_res/model.xdtobackend_root.res`, object type `Constant`, property type `ConstantProperties`.

## Approach

Use the conservative `rules.ts` path. Add a normal metadata item based on existing orchestration primitives:

- `MetadataConstantRules`
- `MetadataConstant` / `MetadataConstantYAML` inferred through `MetadataTypeByRule` and `YAMLTypeByRule`
- `registerMetadataItemRule({ propertyType: "MetadataConstant", itemRule: MetadataConstantRules })`
- registry entries in `MetadataItemTypeRegistry`, `PropertyTypeRegistry`, and `PropertyRuleTypeKeys`
- import from `packages/core/metadata/appliedObjects/index.ts`

Do not add custom `fromXML`, `toXML`, `fromYAML`, or `toYAML` handlers. Do not refactor common infrastructure while adding this object.

## XML Shape

The XML container is `<Constant>` under `<MetaDataObject>`.

Use:

- `itemType: "MetadataConstant"`
- `itemTypePrefix: "Константа"`
- `xmlDir: "Constants"`
- `xmlRoot.container: "Constant"`
- `xmlRoot.rootAttributes: V8_MDCLASSES_ROOT`

`InternalInfo` contains three generated types:

- `ConstantManager`, category `Manager`
- `ConstantValueManager`, category `ValueManager`
- `ConstantValueKey`, category `ValueKey`

All metadata properties live under `Properties`. There is no `ChildObjects` section for this object.

## Properties

Implement the parent properties from `ConstantProperties`.

| TS key | XML tag | YAML key | Rule type |
|---|---|---|---|
| `name` | `Name` | `Имя` | `string` |
| `synonym` | `Synonym` | `Синоним` | `I8nText` |
| `comment` | `Comment` | `Комментарий` | `string` |
| `type` | `Type` | `Тип` | `TypeDescription` |
| `useStandardCommands` | `UseStandardCommands` | `ИспользоватьСтандартныеКоманды` | `boolean` |
| `defaultForm` | `DefaultForm` | `ОсновнаяФорма` | `string` |
| `extendedPresentation` | `ExtendedPresentation` | `РасширенноеПредставление` | `I8nText` |
| `explanation` | `Explanation` | `Пояснение` | `I8nText` |
| `passwordMode` | `PasswordMode` | `РежимПароля` | `boolean` |
| `format` | `Format` | `Формат` | `I8nText` |
| `editFormat` | `EditFormat` | `ФорматРедактирования` | `I8nText` |
| `toolTip` | `ToolTip` | `Подсказка` | `I8nText` |
| `markNegatives` | `MarkNegatives` | `ВыделятьОтрицательные` | `boolean` |
| `mask` | `Mask` | `Маска` | `string` |
| `multiLine` | `MultiLine` | `МногострочныйРежим` | `boolean` |
| `extendedEdit` | `ExtendedEdit` | `РасширенноеРедактирование` | `boolean` |
| `minValue` | `MinValue` | `МинимальноеЗначение` | `MinMaxValue` |
| `maxValue` | `MaxValue` | `МаксимальноеЗначение` | `MinMaxValue` |
| `fillChecking` | `FillChecking` | `ПроверкаЗаполнения` | `SystemEnumeration: FillChecking` |
| `choiceFoldersAndItems` | `ChoiceFoldersAndItems` | `ВыборГруппИЭлементов` | `SystemEnumeration: FoldersAndItemsUse` |
| `choiceParameterLinks` | `ChoiceParameterLinks` | `СвязиПараметровВыбора` | `ChoiceParameterLinks` |
| `choiceParameters` | `ChoiceParameters` | `ПараметрыВыбора` | `ChoiceParameters` |
| `quickChoice` | `QuickChoice` | `БыстрыйВыбор` | `SystemEnumeration: UseQuickChoice` |
| `choiceForm` | `ChoiceForm` | `ФормаВыбора` | `string` |
| `linkByType` | `LinkByType` | `СвязьПоТипу` | `TypeLink` |
| `choiceHistoryOnInput` | `ChoiceHistoryOnInput` | `ИсторияВыбораПриВводе` | `SystemEnumeration: ChoiceHistoryOnInput` |
| `dataLockControlMode` | `DataLockControlMode` | `РежимУправленияБлокировкойДанных` | `SystemEnumeration: DefaultDataLockControlMode` |
| `dataHistory` | `DataHistory` | `ИсторияДанных` | `SystemEnumeration: DataHistoryUse` |
| `updateDataHistoryImmediatelyAfterWrite` | `UpdateDataHistoryImmediatelyAfterWrite` | `ОбновлятьИсториюДанныхСразуПослеЗаписи` | `boolean` |
| `executeAfterWriteDataHistoryVersionProcessing` | `ExecuteAfterWriteDataHistoryVersionProcessing` | `ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных` | `boolean` |

`defaultForm` and `choiceForm` should use `referenceScope` for a form of the current object.

Use `type` as the short YAML value, following `MetadataAttribute`.

## Defaults

For `boolean` and `SystemEnumeration` properties, set both `defaultValueXML` and `defaultValueYAML` from `minimal.xml`:

| TS key | Default |
|---|---|
| `useStandardCommands` | `true` |
| `passwordMode` | `false` |
| `markNegatives` | `false` |
| `multiLine` | `false` |
| `extendedEdit` | `false` |
| `fillChecking` | `"DontCheck"` |
| `choiceFoldersAndItems` | `"Items"` |
| `quickChoice` | `"Auto"` |
| `choiceHistoryOnInput` | `"Auto"` |
| `dataLockControlMode` | `"Managed"` |
| `dataHistory` | `"DontUse"` |
| `updateDataHistoryImmediatelyAfterWrite` | `false` |
| `executeAfterWriteDataHistoryVersionProcessing` | `false` |

For empty XML text nodes and local strings, use `defaultValueXMLRaw: ""` where `minimal.xml` emits an empty element, for example `Comment`, `DefaultForm`, `ExtendedPresentation`, `Explanation`, `Format`, `EditFormat`, `ToolTip`, `Mask`, and `ChoiceForm`.

For `minValue` and `maxValue`, use `defaultValueXMLRaw: { "_xsi:nil": true }` and do not set `defaultValueYAML`. This is the documented exception because the XML default is `xsi:nil`, not a number.

## Properties Outside Fixtures

`ConstantProperties` also declares fields that are not present in the current XML fixtures:

- `objectBelonging`: `SystemEnumeration: ObjectBelonging`, `xmlParents: ["Properties"]`, `defaultValueYAML: "Native"`, `toYAML: false`, `fromYAML: false`.
- `extendedConfigurationObject`: `string`, `runtimeOnly: true`.

This follows `MetadataSequence` and keeps extension-only data out of normal YAML.

## External Files

There are no child objects, but there are two external modules:

- `Ext/ManagerModule.bsl` maps to `МодульМенеджера.bsl` through `managerModule: { type: "Module" }`.
- `Ext/ValueManagerModule.bsl` maps to `МодульМенеджераЗначения.bsl` through `valueManagerModule: { type: "Module" }`.

Use the existing `Module` sync behavior. Do not add custom file-copy logic.

## Testing

Add the standard applied-object test set:

- `fromXML.test.ts`: imports `full.xml` and `minimal.xml`; also verifies XML round-trip for both fixtures.
- `toXML.test.ts`: exports `full.ts` and `minimal.ts` back to XML.
- `fromYAML.test.ts`: imports YAML from `sync/data.ts`.
- `toYAML.test.ts`: exports model to YAML.
- `convertFromXML.test.ts`: writes `Свойства.yaml` and copies `МодульМенеджера.bsl` and `МодульМенеджераЗначения.bsl`.
- `syncToXML.test.ts`: writes `КонстантаВсеСвойства.xml`, `Ext/ManagerModule.bsl`, and `Ext/ValueManagerModule.bsl`.

Before implementation is considered complete, run:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

## Documentation For The Series

This is the first object in a larger batch of about 30 applied metadata objects. To keep later objects predictable, update metadata documentation as part of this design cycle:

- `sources-of-truth.md`: use the 1C help catalog instead of MCP `bsl-platform`.
- `object-research.md`: require Deep Scan to capture `xmlDir`, `itemTypePrefix`, `InternalInfo`, `Properties`, `ChildObjects`, external files, registry delta, and tests.
- `yaml-contract.md`: document that `defaultValueYAML` for `boolean`, `number`, and `SystemEnumeration` normally comes from `minimal.xml`, then XSD/XDTO `default`, then direct neighbors.
- `new-applied-object` skill local resources: point to `/Users/nikita/git/1c_res/hlp/1/FileStorage/objects` as a directory.

A new `applied-object-implementation.md` knowledge document captures the reusable applied-object implementation reference. It maps common XML properties to existing rule types: `Synonym -> I8nText`, `Type -> TypeDescription`, `ChoiceParameterLinks`, `ChoiceParameters`, `LinkByType`, `MinValue/MaxValue`, `Module`, `ObjectBelonging`, and `ExtendedConfigurationObject`.

## Accepted Decisions

- Use approach A: a thin `rules.ts` implementation with existing common types.
- Do not introduce child objects for constants.
- Do include both manager modules through `Module`.
- Use existing infrastructure only; do not refactor shared orchestration in this task.
- Use `minimal.xml` as the source for `defaultValueYAML` values.

## Risks

- `LinkByType`, `ChoiceParameterLinks`, and `ChoiceParameters` already exist but are less frequently used at the top-level applied-object property level. Tests must cover full XML and sync XML.
- `MinValue` and `MaxValue` need the explicit `xsi:nil` default. Treat them as the documented exception to the `defaultValueYAML` rule.
- External module sync should be verified in both directions because `ValueManagerModule` is new for this object even though `Module` itself already exists.
