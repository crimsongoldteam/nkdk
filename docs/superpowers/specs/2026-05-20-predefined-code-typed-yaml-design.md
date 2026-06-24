# PredefinedCode typed YAML design

## Problem

Full metadata round-trip `XML -> YAML -> XML` currently loses `xsi:type="xs:decimal"` on `Ext/Predefined.xml` item codes.

Example diff:

```diff
-		<Code xsi:type="xs:decimal">0</Code>
+		<Code>0</Code>
```

The current rule describes `PredefinedItem.code` as a plain string. That cannot represent the difference between a numeric predefined code and a string predefined code in YAML.

## Goal

Represent predefined item codes as either `number` or `string` in YAML and preserve the XML form:

- `Код: 0` means a numeric code and exports to `<Code xsi:type="xs:decimal">0</Code>`.
- `Код: "0"` means a string code and exports to `<Code>0</Code>`.
- XML with numeric `xsi:type` imports as a YAML number.
- XML without `xsi:type` imports as a YAML string without normalization, including leading zeroes and spaces.

## Scope

Implement this only for predefined item codes.

Do not introduce a general `string | number` orchestration primitive in this change. Do not change XML fixtures. Do not change catalog-level rules.

## Design

Add a small common object type at `packages/core/metadata/commonObjects/predefinedCode/`.

The type should register import/export handlers for `PredefinedCode`:

- `fromXML`: accepts a plain string, number, or object with `#text` and optional `_xsi:type`.
- `fromXML`: if `_xsi:type` is a numeric XML type, returns `Number(#text)`.
- `fromXML`: otherwise returns the raw text as a string.
- `toXML`: if the value is a number, returns `{ "_xsi:type": "xs:decimal", "#text": String(value) }`.
- `toXML`: if the value is a string, returns the string unchanged.

Use the same numeric XML type set as `commonObjects/number/fromXML.ts`:

- `xs:decimal`
- `xs:integer`
- `xs:double`
- `xs:float`

Then update `packages/core/metadata/commonObjects/predefinedItem/rules.ts`:

```ts
code: {
  type: "PredefinedCode",
  xml: "Code",
  yaml: "Код",
  required: true,
}
```

## Data Flow

XML import:

```xml
<Code xsi:type="xs:decimal">0</Code>
```

becomes:

```yaml
Код: 0
```

XML import:

```xml
<Code>0</Code>
```

becomes:

```yaml
Код: "0"
```

YAML export follows the same distinction in reverse.

## Error Handling

Keep behavior permissive for existing metadata:

- Missing or empty code remains `undefined` if orchestration already treats the property as absent.
- Non-numeric text with numeric `xsi:type` follows the existing `number` conversion behavior.
- String codes are not trimmed or normalized.

## Testing

Add focused tests for the new `PredefinedCode` type:

- XML typed decimal imports to number.
- XML without `xsi:type` imports to string.
- Number exports to typed decimal XML.
- String exports to plain XML text.

Add or extend a predefined item/predefined round-trip test with both `0` and `"0"` to verify the rule integration.

After implementation, run the focused tests first. Then rerun `round-trip-yaml --triage --batch-size 5` and confirm that the first five `Predefined.xml` `Code xsi:type` diffs are gone or replaced by the next real differences.
