# Form round-trip diffs: Presentation, Type, command ids

## Context

Short round-trip found the first diff in:

`Catalogs/АктыОтбораПробЗЕРНО/Forms/ФормаСписка/Ext/Form.xml`

The diff contains three independent causes:

- `FormChoiceListDesTimeValue` loses an empty `<Presentation/>`.
- `FormAttribute` loses an empty `<Type/>`.
- `FormCommand` ids are regenerated from `1`/`2` to `16`/`17`.

These should be fixed as separate, narrow behavioral cases. The reproducer and fixes should stay close to each owning rule instead of adding one broad full-form fixture with unrelated noise.

## Case A: FormChoiceListDesTimeValue Presentation

### Current behavior

`ChoiceParameters` delegates `app:value` import and export to `MetadataValue`. For `xsi:type="FormChoiceListDesTimeValue"`, behavior is owned by:

`packages/core/metadata/commonObjects/metadataValue/formChoiceList`

When the source XML has:

```xml
<app:value xsi:type="FormChoiceListDesTimeValue">
	<Presentation/>
	<Value xsi:type="xs:boolean">true</Value>
</app:value>
```

the model has no meaningful presentation text. This is acceptable. The problem is export: `FormChoiceListDesTimeValue` should still emit the required empty `<Presentation/>` before `<Value>`.

### Design

Add a focused test in `metadataValue/formChoiceList` for a value with `presentation === undefined`.

Expected XML:

```xml
<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation/>
	<Value xsi:type="xs:boolean">true</Value>
</Value>
```

Also update existing `ChoiceParameters` XML fixtures that currently encode the old expectation:

- `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/boolean.xml`
- `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/enum.xml`

Both should include `<Presentation/>` inside `app:value` before the nested `Value`.

### Data flow

`ChoiceParameters` remains only a container:

`ChoiceParameters` → `MetadataValue` → `formChoiceList`

The required empty presentation is emitted in `formChoiceList/toXML`, not in `ChoiceParameters`.

## Case B: FormAttribute empty Type

### Current behavior

`FormAttributeRules.type` maps the model field `type` to XML `<Type>` through `TypeDescription`.

An empty XML tag:

```xml
<Type/>
```

imports to no `type` in the model. This is the intended model shape. The missing behavior is on export: a `FormAttribute` without `type` should still emit an empty `<Type/>`.

### Design

Keep the model unchanged. Do not represent empty `<Type/>` as `type: { type: [] }`.

Add an XML default to `FormAttributeRules.type`, using the raw empty XML form:

```ts
defaultValueXMLRaw: {}
```

Add a focused FormAttribute fixture/test for an attribute without `type`, expecting `<Type/>` in XML.

### Data flow

`FormAttribute` exports properties through `exportPropertiesToXML`.

For `type === undefined`, the property rule should supply the raw empty XML value. The `TypeDescription` importer can continue returning `undefined` for empty type descriptions.

## Case C: FormCommand ids

### Current behavior

`FormCommandRules.id` is `forReferenceOnly`, with type `ElementId`. During export, `ElementId` registers the command in `metadataForNumbering`. Later, `setIdsToElements` copies `referenceElement.id` into XML if a reference was supplied; otherwise it assigns the next free id.

The observed diff:

```diff
- <Command name="ЗагрузитьАктыОтбораПробСОтбором" id="1">
+ <Command name="ЗагрузитьАктыОтбораПробСОтбором" id="16">
```

means commands were not matched to their reference commands by name.

### Design

Mirror the existing `FormAttribute` pattern:

- `exportFormAttributesToXML` finds a reference attribute by `name`.
- It passes that reference into single-attribute export.
- `metadataForNumbering` stores it as `referenceElement`.
- `setIdsToElements` preserves `referenceElement.id`.

Add the same behavior for form commands:

- introduce/register an explicit `FormCommands` XML export function;
- inside it, find the reference command by `name`;
- pass the reference command into single-command property export / `ElementId`;
- keep assigning new ids only when no matching reference command exists.

The reproducer should exercise the form export path, preferably at `clientApplicationForm` level, because the bug is the flow of `referenceForm.commands` into command numbering. Expected behavior: commands with matching names preserve ids from the reference form, just like form attributes.

## Testing

Use focused tests before changing behavior:

- `metadataValue/formChoiceList`: export without presentation emits `<Presentation/>`.
- `ChoiceParameters`: existing form boolean/enum fixtures expect `<Presentation/>`.
- `forms/commonObjects/formAttribute`: attribute without model `type` exports `<Type/>`.
- `clientApplicationForm` or `formCommand`: command ids are preserved from reference commands by `name`.

Avoid a full-form fixture that combines all three causes. It would make failures harder to diagnose and would not identify the owning rule for each behavior.

## Non-goals

- Do not change the model representation of empty `<Presentation/>` to `{ items: {} }`.
- Do not change the model representation of empty `<Type/>` to `type: []`.
- Do not add new fromXML/toXML imperative rules where existing `rules.ts` defaults can express the behavior.
- Do not mix the three original diff causes into a single reproducer.
