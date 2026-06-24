# Round-trip: DCS AvailableFields SelectedItem

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `DataProcessors/СверкаДанныхУчетаНДС/Forms/Форма/Ext/Form.xml`
- XML node: `dcsset:conditionalAppearance/dcsset:item/dcsset:selection`

The generated XML drops `use=false` from one selected field:

```diff
 <dcsset:item>
-  <dcsset:use>false</dcsset:use>
   <dcsset:field>ВходящиеРеестрыДатаФормирования</dcsset:field>
 </dcsset:item>
```

## Current Behavior

`AvailableFields` is currently a compact string collection:

```ts
export type AvailableFields = string[]
export type AvailableFieldsYAML = string[]
```

Import reads only `dcsset:field`; export writes only `dcsset:field`.

This is enough for simple selected fields, but it cannot represent additional `SelectedItemField`
properties.

## Source Of Truth

`/Users/nikita/git/1c_res/model.xdtodcscore_root.res` defines `Selection.item` as `SelectedItem`:

```xml
<objectType name="Selection">
  <property name="item" type="d4p1:SelectedItem" lowerBound="0" upperBound="-1"/>
</objectType>
```

`/Users/nikita/git/1c_res/settings.xsddcscore_root.res` defines `SelectedItemField` with:

- `use?: boolean`;
- `field: dcscore:Field`;
- `title?: string`;
- `lwsTitle?: core:LocalStringType`;
- `viewMode?: DataCompositionSettingsItemViewMode`;
- optional `iID` attribute.

## Decision

Extend `AvailableFields` from a pure string list to a mixed short/full item list:

```ts
type AvailableField =
  | string
  | {
      field: string
      use?: boolean
      title?: string
      lwsTitle?: I8nText
      viewMode?: DataCompositionSettingsItemViewMode
    }

type AvailableFields = AvailableField[]
```

The short string form remains the default for simple fields:

```yaml
Поля:
  - Наименование
  - ПометкаУдаления
```

The object form is used when XML contains any non-field property:

```yaml
Поля:
  - Наименование
  - Поле: ВходящиеРеестрыДатаФормирования
    Использование: Ложь
```

XML export must preserve:

```xml
<dcsset:item>
  <dcsset:use>false</dcsset:use>
  <dcsset:field>ВходящиеРеестрыДатаФормирования</dcsset:field>
</dcsset:item>
```

## Proposed Approach

1. Add an `AvailableFieldRules`/equivalent local rule for full selected-field objects:
   - `use`: `xml: "dcsset:use"`, `yaml: "Использование"`, `type: "boolean"`;
   - `field`: `xml: "dcsset:field"`, `yaml: "Поле"`, `type: "string"`;
   - `title`: `xml: "dcsset:title"`, `yaml: "Заголовок"`, `type: "string"`;
   - `lwsTitle`: `xml: "dcsset:lwsTitle"`, `yaml: "МногоязычныйЗаголовок"`, `type: "I8nText"`;
   - `viewMode`: `xml: "dcsset:viewMode"`, `yaml: "РежимОтображения"`, `type: "SystemEnumeration"`,
     `typeSE: "DataCompositionSettingsItemViewMode"`.

2. Keep short import/export:
   - if an XML item has only `dcsset:field`, import it as a string;
   - if a model item is a string, export it as the current minimal XML.

3. Use full object import/export when the item has `dcsset:use`, `dcsset:title`, `dcsset:lwsTitle`,
   `dcsset:viewMode`, or other supported selected-field properties.

4. Keep `AvailableFields` as the shared property type used by:
   - conditional appearance selection;
   - filter available fields;
   - dynamic list DCS selection.

5. Defer `iID` unless a round-trip diff requires preserving it; the project usually avoids modeling
   XML attributes that are default `0` until they appear in real diffs.

## Tests To Add Later

1. XML import:
   - a simple field item imports as a string;
   - an item with `dcsset:use>false</dcsset:use>` imports as `{ field, use: false }`.

2. XML export:
   - a string item keeps the existing minimal XML;
   - `{ field, use: false }` exports with `dcsset:use` before `dcsset:field`.

3. YAML import/export:
   - string list keeps the current compact shape;
   - object item supports `Поле` and `Использование`.

4. Regression fixture:
   - the round-trip for
     `DataProcessors/СверкаДанныхУчетаНДС/Forms/Форма/Ext/Form.xml` keeps
     `dcsset:use>false</dcsset:use>` inside `dcsset:selection`.

## Non-goals

- Do not replace all existing string YAML fields with object YAML.
- Do not model `iID` until a real diff requires it.
- Do not implement the fix as part of this brainstorming pass.
