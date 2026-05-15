# DCS ent:* system enumeration import

## Context

Short round-trip stops while importing a form DCS value:

```xml
<dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>
```

`MetadataDcsMetadataValue` already supports system enumerations when a rule explicitly says
`valueType: "SystemEnumeration"` and provides `typeSE`. The failing DCS value is parsed through a
generic `Primitive` rule, so the importer reaches the unsupported `xsi:type` branch before any XML
diff can be produced.

## Decision

Use approach B1: add a generic import fallback for known `ent:*` system enumerations.

When `dcsMetadataValue/fromXML.ts` sees an unknown `xsi:type` with the `ent:` prefix, it should:

1. extract the type name after `ent:`;
2. verify that the name exists in `SystemEnumerationTypeMap`;
3. import the value through the existing `importSystemEnumerationFromDcsXML` helper with
   `valueType: "SystemEnumeration"` and the inferred `typeSE`;
4. leave truly unknown `ent:*` values on the current explicit error path.

The model remains unchanged: the imported value is still the raw enumeration value string, for
example `"Expense"` or `"Receipt"`.

## Export

Do not add heuristic export for raw strings in generic `MetadataDcsMetadataValue`. A generic string
value does not carry `typeSE`, so choosing an `ent:*` type during export would be ambiguous.

Generic export remains the supported explicit path:

```ts
{ type: "MetadataDcsMetadataValue", valueType: "SystemEnumeration", typeSE: "AccumulationRecordType" }
```

For DCS parameters, export has additional local context: the same item contains `dcssch:valueType`.
When that `valueType` is a single known `ent:*` system enumeration, `dcsParameter/toXML.ts` should
export the parameter value through a temporary `SystemEnumeration` rule for that item. This keeps
the generic value model unchanged while allowing XML -> model -> XML round-trip for parameters like
`AccumulationRecordType`.

## SettingsParameterValueCollection Reference Export

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` also found the same semantic
loss inside dynamic list settings:

```diff
-<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
+<dcscor:value xsi:type="dcscor:Field">Receipt</dcscor:value>
```

Example path:

- `DataProcessors/ПомощникРасчетаНалогаУСН/Forms/РасшифровкаУменьшенияНалогаИнтеграцияСБанком/Ext/Form.xml`
- XML node: `ListSettings/dcsset:dataParameters/dcscor:item[dcscor:parameter="ВидДвижения"]`

Here `SettingsParameterValueCollection` uses a default item rule with `valueType: "Field"`, so the
model stores the imported value as the raw string `"Receipt"`. That string is ambiguous without the
original XML: it could be a field path or an enumeration value.

Decision: for XML round-trip with `referenceMetadata`, `SettingsParameterValue` value export should
preserve a reference `dcscor:value` typed as a known `ent:*` system enumeration when all of these
conditions hold:

1. the current model value is the same scalar text as the reference value;
2. the reference value has `_xsi:type` with the `ent:` prefix;
3. the type name after `ent:` is a known system enumeration in `SystemEnumerationTypeMap`;
4. the reference value is a single value, not a nested `ChoiceParameters`/value list structure.

When those conditions hold, export should reuse the reference XML value shape for `dcscor:value`,
including the `ent:*` `xsi:type`, instead of exporting through the default `Field` rule.

For new YAML/model export without `referenceMetadata`, keep the current behavior:

- default dynamic-list data parameters still export as `dcscor:Field`;
- explicit `SystemEnumeration` rules still export through `exportSystemEnumerationToDcsXML`;
- no `typeSE` field is added to the public `SettingsParameterValue` model solely for this case.

## Tests

Add a focused XML import fixture for `ent:AccumulationRecordType` under
`packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue`.

Expected behavior:

- `xsi:type="ent:AccumulationRecordType"` imports as `"Expense"`;
- a DCS parameter with `valueType` `ent:AccumulationRecordType` exports the value back as
  `xsi:type="ent:AccumulationRecordType"`;
- a `SettingsParameterValueCollection` item imported with reference
  `xsi:type="ent:AccumulationRecordType"` and value `"Receipt"` exports back with the same
  `ent:AccumulationRecordType` type when reference XML is available;
- the existing unsupported-type error still applies to unknown `ent:*` names;
- export tests continue to cover the explicit `SystemEnumeration` rule path.

## Scope

This change is limited to DCS metadata values. It does not add YAML behavior, change fixture XML from
the source repository, or alter broader metadata orchestration rules.
