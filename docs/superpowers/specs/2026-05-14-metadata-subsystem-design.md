# MetadataSubsystem Design

## Context

Add the top-level applied object `metadataSubsystem` in
`packages/core/metadata/appliedObjects/metadataSubsystem`.

The work happens in the isolated worktree:

`/Users/nikita/git/nakidka-core/.worktrees/applied-objects-spec`

Existing XML fixtures are the source of truth and must not be changed. New expected TS/YAML fixtures and tests may be
added in this worktree.

Relevant sources checked:

- XML fixtures: `minimal.xml`, `full.xml`, and `__fixtures__/sync/xml/ПодсистемаВсеСвойства/**`.
- XDTO `.res`: `/Users/nikita/git/1c_res/model.xdtobackend_root.res`.
- `ru-en-map`: `/Users/nikita/.cache/mcp-bsl/ru-en-map.json`.
- Neighbor rules: existing top-level `rules.ts` objects with external `Template`, `Help`, `Picture`,
  and `MetadataItemLinks` properties.

## Scope

Implement `metadataSubsystem` as a regular top-level metadata item through `rules.ts`.

Included:

- XML import/export through the generic metadata item orchestration.
- YAML import/export through generated rule-based types.
- Configuration sync from XML to YAML.
- Configuration sync from YAML to XML.
- Opaque copying of external files:
  - `Ext/CommandInterface.xml`;
  - `Ext/Help.xml`;
  - `Ext/Help/ru.html`.

Excluded from the first implementation:

- Parsing the command interface model from `Ext/CommandInterface.xml`.
- Parsing help contents.
- Recursive implementation of nested subsystem XML files as separate child metadata items.

Nested subsystem names from `ChildObjects/Subsystem` are preserved as a list of names in the parent object through a
small common property type. The fixture `Subsystems/ПодчиненнаяПодсистема.xml` is not parsed in this first step.

## Metadata Item

- `itemType`: `MetadataSubsystem`
- `itemTypePrefix`: `Подсистема`
- `xmlDir`: `Subsystems`
- XML container under `MetaDataObject`: `Subsystem`
- `InternalInfo`: absent in current fixtures and not required by the XDTO fragment.
- Child XML container: `ChildObjects`

## Properties

Root and service properties:

- `xmlRoot`: `XMLRoot`, container `Subsystem`, `V8_MDCLASSES_ROOT`, hidden from YAML.
- `uuid`: `uuid`, XML attribute `_uuid`, reference-only.
- `objectBelonging`: `SystemEnumeration`, `ObjectBelonging`, hidden from YAML, `defaultValueYAML: "Native"`.
- `extendedConfigurationObject`: `string`, runtime-only.

Normal properties:

- `name`: `string`, XML `Properties/Name`, required.
- `synonym`: `I8nText`, YAML `Синоним`, XML default is an empty tag.
- `comment`: `string`, YAML `Комментарий`, XML default is an empty tag.
- `includeHelpInContents`: `boolean`, YAML `ВключатьСправкуВСодержание`, XML `IncludeHelpInContents`,
  `defaultValueXML: true`, `defaultValueYAML: true`.
- `includeInCommandInterface`: `boolean`, YAML `ВключатьВКомандныйИнтерфейс`,
  XML `IncludeInCommandInterface`, `defaultValueXML: true`, `defaultValueYAML: true`.
- `useOneCommand`: `boolean`, YAML `ИспользоватьОднуКоманду`, XML `UseOneCommand`,
  `defaultValueXML: false`, `defaultValueYAML: false`.
- `explanation`: `I8nText`, YAML `Пояснение`, XML `Explanation`, XML default is an empty tag.
- `picture`: `Picture`, YAML `Картинка`, XML `Picture`, XML default is an empty tag.
- `content`: `MetadataItemLinks`, YAML `Состав`, XML `Content`, XML default is an empty tag.
- `subsystems`: `ChildSubsystemNames`, YAML `Подсистемы`, XML `ChildObjects/Subsystem`.

External files:

- `commandInterface`: `Template`, `nkdkPath: "CommandInterface.xml"`,
  `xmlPath: "Ext/CommandInterface.xml"`.
- `help`: `Help`, `filePath: "Ext/Help.xml"`, `xmlPath: "Ext/Help.xml"`, `nkdkDir: "Справка"`.

## Default Values

Default YAML values come from `minimal.xml` and `.res` only where the property is boolean, number, or
`SystemEnumeration`.

Use these normal YAML defaults:

- `ВключатьСправкуВСодержание: true`
- `ВключатьВКомандныйИнтерфейс: true`
- `ИспользоватьОднуКоманду: false`
- hidden `ПринадлежностьОбъекта: Native`

Do not set normal YAML defaults for empty string, empty `I8nText`, empty `Picture`, or empty `Content`; those are XML
defaults only.

## Common Property Type

Add a tiny common property type `ChildSubsystemNames` only for `ChildObjects/Subsystem`.

Behavior:

- XML import accepts `undefined`, a single string, or a string array.
- YAML/model shape is `string[]`.
- XML export returns a single string or string array according to normal XML exporter behavior.
- Empty arrays are omitted unless the object rule needs `requiredXMLParents` to create an empty `ChildObjects` tag.

Do not reuse `ChildFormNames` or `ChildTemplateNames`: their names and sync behavior are tied to form/template folders.
Do not use plain `string`: XDTO allows multiple `<Subsystem>` entries.

## Registries

Add `MetadataSubsystem` to:

- `MetadataItemTypeRegistry`;
- `PropertyTypeRegistry`;
- `PropertyRuleTypeKeys`;
- runtime registration through `registerMetadataItemRule`;
- `ChildSubsystemNames` registration in `PropertyTypeRegistry` and `PropertyRuleTypeKeys`;
- `packages/core/metadata/appliedObjects/index.ts`;
- `TopLevelMetadataItemRules`;
- migration top-level prefixes in `configuration/migrations/paths.ts`.

The migration prefix is `Подсистема`. The first implementation only needs object-level paths:

`Подсистема.<name>`

Nested subsystem migration paths can be designed separately when recursive subsystem implementation is added.

## Tests

Add the standard test set:

- `fromXML.test.ts`;
- `toXML.test.ts`;
- `fromYAML.test.ts`;
- `toYAML.test.ts`;
- `convertFromXML.test.ts`;
- `syncToXML.test.ts`.

Coverage requirements:

- XML tests cover both `minimal.xml` and `full.xml`.
- YAML tests cover the non-default values from `full.xml`.
- `content` test includes all `xr:Item xsi:type="xr:MDObjectRef"` values from `full.xml`.
- `subsystems` test includes `ПодчиненнаяПодсистема` from `ChildObjects`.
- `convertFromXML` copies `CommandInterface.xml`, `Help.xml`, and `Справка/ru.html` into the nkdk object folder.
- `syncToXML` copies the same external files back to `Ext/CommandInterface.xml`, `Ext/Help.xml`, and `Ext/Help/ru.html`.
- Existing XML fixtures are not modified.

## Risks

- `CommandInterface.xml` contains command visibility and ordering that deserves a model later, but the first
  implementation intentionally preserves it as an opaque file.
- Nested subsystem XML exists under `Subsystems/<name>.xml`. The first implementation records the child name in the
  parent and leaves recursive child processing for a later task.
- `metadataSubsystem` references objects not all implemented yet, such as chart objects. `MetadataItemLinks` should
  preserve references as strings without requiring those target objects to be implemented first.
