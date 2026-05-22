# ACC round-trip YAML first diffs

## Context

The latest diagnostic run used:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

The run stopped on `/Users/nikita/git/round-trip-source/acc` and reported
`33` XML diffs. This spec tracks the first five diffs from that batch and
records decisions one by one.

The current batch is diagnostic only: XML source files are not changed, and
implementation should stay in the metadata YAML/XML converters.

## Batch

1. `CommonForms/ВыборФайловСведенийФизическихЛиц/Ext/Form.xml`
2. `CommonForms/НалогиИОтчеты/Ext/Form.xml`
3. `CommonForms/ФизическиеЛицаОбразованиеКвалификация/Ext/Form.xml`
4. `DataProcessors/ГрупповаяОтправкаЭПД/Forms/ФормаГрупповойОтправки/Ext/Form.xml`
5. `DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/ВыборСертификатаОтветственногоЛица/Ext/Form.xml`

## Accepted Decision: SettingsParameterValue explicit DCS value type

### Observed diffs

Diffs 1, 3, and 5 are the same problem group.

Source XML contains a `SettingsParameterValue` with an explicit DCS field
value:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
  <dcscor:parameter>Текст</dcscor:parameter>
  <dcscor:value xsi:type="dcscor:Field">ВидОбразования</dcscor:value>
</dcscor:item>
```

After full YAML round-trip it becomes a local string:

```xml
<dcscor:value xsi:type="v8:LocalStringType">
  <v8:item>
    <v8:lang>ru</v8:lang>
    <v8:content>ВидОбразования</v8:content>
  </v8:item>
</dcscor:value>
```

### Root cause

YAML already preserves the intended type:

```yaml
Текст:
  Значение:
    Тип: Поле
    Значение: ВидОбразования
```

During YAML import, `parameterValue/fromYAML.ts` treats the outer
`SettingsParameterValue` object as an expanded shape and passes only the inner
scalar `Значение` to `importDcsMetadataValueFromYAML`. The nested `Тип: Поле`
is no longer visible, so the DCS value importer interprets the scalar as a
local string and XML sync writes `xsi:type="v8:LocalStringType"`.

This was previously described in
`docs/superpowers/specs/2026-05-21-dcs-settings-parameter-value-explicit-type-yaml-design.md`,
but the corresponding implementation plan did not include this exact point.

### Decision

Keep the current YAML structure. It is readable and already carries the
required type information.

Fix import at the `SettingsParameterValue` boundary: when expanded
`SettingsParameterValue` has `Значение` shaped as an explicit DCS text value,
pass that whole object to `importDcsMetadataValueFromYAML`, not only its inner
scalar.

Explicit DCS text value means an object with `Тип` and `Значение`, currently
recognized by `dcsMetadataValue/fromYAML.ts` for:

- `Тип: Поле`
- `Тип: ЗначениеВремениПроектирования`

The recognition stays owned by `dcsMetadataValue/fromYAML.ts`.
`parameterValue/fromYAML.ts` only preserves the object boundary so the
downstream importer can make the semantic decision.

### Implementation shape

Change `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`:

- keep the existing expanded `SettingsParameterValue` handling;
- when the YAML key `Значение` is an object with both `Тип` and `Значение`,
  use that whole object as the raw value for DCS metadata import;
- keep existing behavior for scalars, arrays, nil-like values, fonts, child
  elements, and settings fields.

No XML fixtures should change.

### Tests

Add focused YAML import coverage for a `SettingsParameterValue` whose value is:

```yaml
Значение:
  Тип: Поле
  Значение: ВидОбразования
```

Expected model value:

```ts
{ type: "Field", value: "ВидОбразования" }
```

Also cover the sibling explicit value:

```yaml
Значение:
  Тип: ЗначениеВремениПроектирования
  Значение: Перечисление.ЧтоТо
```

Expected model value:

```ts
{ type: "DesignTimeValue", value: "Перечисление.ЧтоТо" }
```

Verification should include focused `parameterValue` YAML tests and then
`round-trip-yaml --triage --batch-size 5` for the current batch.

## Open Point: FormChoiceListDesTimeValue single non-default presentation

Diff 2 loses an English-only `Presentation` under
`FormChoiceListDesTimeValue` and writes `<Presentation/>`.

There is an existing candidate decision in
`docs/superpowers/specs/2026-05-21-form-choice-list-i8n-yaml-design.md`: use
the shared `I8nText` YAML exporter so a single non-default language is emitted
as a language map, for example:

```yaml
Представление:
  en: Labor compensation expenses
```

This point still needs confirmation in the context of the current batch before
it is treated as accepted here.

## Open Point: Empty v8:LocalStringType value in SettingsParameterValue

Diff 4 loses an explicitly present empty value:

```xml
<dcscor:value xsi:type="v8:LocalStringType"/>
```

The current round-trip removes the node entirely. This must be analyzed
separately from the explicit `dcscor:Field` group, because the value is empty
but still positionally and semantically present in the source XML.

Questions to settle:

- whether the empty typed value should be represented in YAML explicitly;
- whether reference XML should preserve this node when YAML omits a public
  value;
- whether this belongs in `parameterValue`, `dcsMetadataValue`, or
  `DcsLocalStringType`.

## Scope

This spec covers the first five diffs from the current `acc` YAML round-trip
batch. It does not cover the remaining `28` diffs until they are shown and
classified.

The first accepted implementation unit is only the `SettingsParameterValue`
explicit DCS value type group. Other points must be accepted before they are
included in an implementation plan.

## Verification

For each accepted implementation unit:

1. Run focused tests for the changed converter module.
2. Run `round-trip-yaml --triage --batch-size 5` from the repository root.
3. Confirm that the targeted diff group disappears or is replaced by the next
   independent diff.
4. Before closing the broader issue, run full `pnpm test` from the repository
   root.
