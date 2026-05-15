# Round-trip: FunctionalOptions Empty Item

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `DataProcessors/ПособияВыплачиваемыеФСС/Forms/Форма/Ext/Form.xml`
- XML node: `Attribute[name="Организация"]/FunctionalOptions`

The generated XML drops an empty functional option item:

```diff
-<FunctionalOptions>
-  <Item/>
-</FunctionalOptions>
```

## Current Behavior

`FunctionalOptionsProperty` is shared by form attributes and form commands.

Current import returns `undefined` when `xml.Item` is falsy:

```ts
if (!xml || !xml.Item) return undefined
```

For `<Item/>`, the parsed `Item` value is an empty string. The falsy check treats it as missing,
so the whole `FunctionalOptions` node is lost.

Current export also omits empty arrays:

```ts
if (!data || data.length === 0) return undefined
```

This is correct for an absent collection, but not for a present collection with one empty item.

## Decision

An empty `<Item/>` is a real element of the `FunctionalOptions` collection.

Represent it directly in both model and YAML as an empty string:

```ts
functionalOptions: [""]
```

```yaml
ФункциональныеОпции:
  - ""
```

XML export of that model must preserve:

```xml
<FunctionalOptions>
  <Item/>
</FunctionalOptions>
```

No private reference-only marker is needed.

## Proposed Approach

1. Change `importFunctionalOptionsFromXML` so it distinguishes missing `Item` from empty-string
   `Item`:
   - missing `Item` -> `undefined`;
   - `Item: ""` -> `[""]`;
   - `Item: ["", "FunctionalOption.X"]` -> `["", "FunctionalOption.X"]`.

2. Keep `FunctionalOptions = string[]` and `FunctionalOptionsYAML = string[]`.

3. Ensure `exportFunctionalOptionsToXML` treats `[""]` as a non-empty collection and writes a single
   empty `Item`.

4. Keep absent/empty-array semantics unchanged:
   - `undefined` -> no XML node;
   - `[]` -> no XML node.

## Tests To Add Later

1. XML import:
   - `<FunctionalOptions><Item/></FunctionalOptions>` imports as `[""]`.

2. XML export:
   - `[""]` exports as `<FunctionalOptions><Item/></FunctionalOptions>`.

3. YAML import/export:
   - `ФункциональныеОпции: [""]` round-trips as `functionalOptions: [""]`.

4. Regression fixture:
   - the round-trip for
     `DataProcessors/ПособияВыплачиваемыеФСС/Forms/Форма/Ext/Form.xml` keeps the empty
     functional option item.

## Non-goals

- Do not add a separate sentinel type for empty functional options.
- Do not treat empty `FunctionalOptions` arrays as present XML nodes.
- Do not implement the fix as part of this brainstorming pass.
