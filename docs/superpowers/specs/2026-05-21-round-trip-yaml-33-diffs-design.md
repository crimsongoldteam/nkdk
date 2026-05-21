# Round-Trip YAML 33 Diffs Design

## Context

Fresh `round-trip-yaml` triage for `acc` completes without import or sync errors, but reports 33 XML diffs after `XML -> model -> YAML -> model -> XML`.

The active source directory is:

```text
/Users/nikita/git/round-trip-source/acc
```

The 33 diffs collapse into eight repeating behavioral groups. This spec records the agreed design for all groups in one place. Source XML fixtures from the external repository remain the source of truth and must not be edited to hide diffs.

## Goals

- Remove the current 33 YAML round-trip XML diffs by fixing loss of meaning in the metadata/YAML/XML pipeline.
- Preserve concise YAML where it is safe, but switch to explicit YAML when concise form cannot round-trip XML intent.
- Keep fixes focused on the observed object families and reusable local helpers where the same rule already exists.
- Add focused regression tests before implementation changes for each group.

## Non-Goals

- Do not redesign the whole DCS YAML model.
- Do not change source XML files under `/Users/nikita/git/round-trip-source`.
- Do not add new handwritten fromXML/toXML rules where existing `rules.ts` and orchestration can express the behavior.
- Do not solve XML-only round-trip problems in this task unless they are directly exposed by YAML round-trip.

## Design

### 1. Preserve Explicit DCS Field Values

Observed diff: `dcscor:value xsi:type="dcscor:Field"` in DCS appearance settings is exported back as `v8:LocalStringType`.

Example source:

```xml
<dcscor:parameter>Текст</dcscor:parameter>
<dcscor:value xsi:type="dcscor:Field">СписокФайлов.ФормаРСВ_Представление</dcscor:value>
```

Current YAML already has enough meaning:

```yaml
Текст:
  Тип: Поле
  Значение: СписокФайлов.ФормаРСВ_Представление
```

Decision: preserve explicit `Тип: Поле` for DCS `DesignTimeValue`, especially `AppearanceFields.Текст`. YAML import must reconstruct a DCS field typed value, not a localized string.

Criterion: `dcscor:Field` remains `dcscor:Field` after full YAML round-trip.

### 2. Preserve Empty Typed DCS Values

Observed diff: an explicit empty typed DCS value disappears:

```xml
<dcscor:value xsi:type="v8:LocalStringType"/>
```

Current path:

- XML import sees an empty `v8:LocalStringType` as empty `I8nText`.
- YAML export omits `Значение`.
- YAML import cannot distinguish "value omitted intentionally" from "explicit empty typed XML value existed".
- XML export omits `dcscor:value`.

Decision: preserve explicit empty typed DCS values from source metadata when YAML does not provide `Значение`. This is a reference-preservation case, but only for the empty typed value fragment, not for ordinary text values.

The minimum preserved shape is the original XML type marker:

```ts
{ "_xsi:type": "v8:LocalStringType" }
```

If YAML provides `Значение`, YAML wins and the reference empty value must not overwrite the user's explicit value.

Criterion: an explicit empty `<dcscor:value xsi:type="v8:LocalStringType"/>` remains present after YAML round-trip.

### 3. Preserve Single Non-Default FormChoiceList Presentation Language

Observed diff: `FormChoiceListDesTimeValue/Presentation` with only English text becomes `<Presentation/>`.

Source shape:

```xml
<Presentation>
  <v8:item>
    <v8:lang>en</v8:lang>
    <v8:content>Labor compensation expenses</v8:content>
  </v8:item>
</Presentation>
```

Current local exporter in `metadataValue/formChoiceList/toYAML.ts` picks only `context.defaultLanguage` or `ru`, so a single `en` item becomes an empty string.

Decision: use the shared `I8nText` YAML contract for this field:

- one default-language item stays a short string;
- multiple languages stay a language map;
- one non-default-language item also stays a language map.

Expected YAML:

```yaml
Представление:
  en: Labor compensation expenses
```

Criterion: single `en` presentation round-trips back to the same `v8:item`.

### 4. Make Metadata Path Conversion Positional

Observed diffs: Russian path/reference segments that are user object names are canonicalized as metadata type names.

Examples:

```diff
- CommonCommand.ПланСчетов
+ CommonCommand.ChartOfAccounts
```

The same class also affects names like `Характеристика` and `Документ` when they appear as user-defined names after path segments such as `Attribute` or inside command names.

Decision: metadata path conversion must be positional. Convert Russian/English aliases only in positions where the segment is known by grammar to be a metadata category/type segment. Do not convert arbitrary user names in `DataPath`, `MDObjectRef`, `DesignTimeRef`, command names, attribute names, field names, or other value positions.

Criterion: `CommonCommand.ПланСчетов` stays exactly `CommonCommand.ПланСчетов`, while real type/category segments continue to normalize as before.

### 5. Preserve Extra Attributes For Raw Picture References

Observed diff: `xr:LoadTransparent` disappears for raw picture references such as `0:...`.

Current path:

- XML import stores `{ rawRef, loadTransparent }`.
- YAML export returns only the raw string for `isRawPictureRef(picture)`.
- YAML import reconstructs only `{ rawRef }`.
- XML export has no `loadTransparent` value left.

Decision: short raw picture YAML is allowed only when the raw reference has no additional XML attributes. If a raw picture reference has `LoadTransparent` or `TransparentPixel`, export an expanded form.

Example:

```yaml
Картинка:
  Ссылка: 0:some-guid
  ПрозрачныйФон: Ложь
```

Criterion: raw picture refs with `xr:LoadTransparent` or transparent pixel metadata keep those XML nodes after YAML round-trip.

### 6. Preserve Explicit Empty Synonym From Reference

Observed diff: explicit empty attribute synonym becomes a generated synonym from the attribute name.

Source shape:

```xml
<Synonym/>
```

Current rule for metadata attributes has `emptyAsRawXML: true`, which is enough for XML-only handling, but YAML round-trip loses the distinction:

- XML import stores explicit empty `I8nText` as `{ items: {} }`;
- YAML export omits `Синоним`;
- YAML import sees missing `Синоним` and `defaultValue` generates text from the property name.

Decision: for `I8nText`/`Synonym`, when YAML omits the key and source metadata had the XML field explicitly, source value must win over `defaultValue`, including explicit empty `{ items: {} }`.

The generated default synonym from the name is allowed only when the reference source did not have that field.

Criterion: explicit empty `<Synonym/>` remains empty and does not become `Правила отправки документов` or another generated name-based synonym.

### 7. Preserve Newline-Only YAML Block Scalars

Observed diff: multiline empty `v8:content` becomes a self-closing tag:

```diff
- <v8:content>
- </v8:content>
+ <v8:content/>
```

This is not a reference problem and not an XML serializer problem. Direct `xmlExport` of `"\n"` writes an expanded tag. The value is lost earlier in YAML export.

Root cause:

- `yaml.stringify({ Пояснение: "\n" })` writes a meaningful block scalar:

  ```yaml
  Пояснение: |+
    
  ```

- `packages/core/yaml/export.ts` applies `.trim()`;
- `.trim()` removes the trailing blank content line of the block scalar;
- YAML becomes `Пояснение: |+`;
- YAML parse reads that as `""`, not `"\n"`;
- XML export then writes `<v8:content/>`.

Decision: YAML export must not use a document-wide `.trim()` that can change block scalar values. The original need for trimming is cosmetic/stability-oriented: avoid an extra service newline at the end of the YAML document. The replacement must therefore be narrow: remove at most the document-level final line ending added by the YAML serializer, and never remove whitespace that belongs to the last scalar value.

Criterion: `Пояснение: "\n"` survives YAML export/import as `"\n"` and XML stays:

```xml
<v8:content>
</v8:content>
```

### 8. Preserve Explicit Asc Order Type In Dynamic List Calculated Fields

Observed diff: explicit `orderType Asc` under a dynamic list calculated field disappears.

Source shape:

```xml
<dcssch:orderExpression>
  <expression xmlns="http://v8.1c.ru/8.1/data-composition-system/common">Дата</expression>
  <orderType xmlns="http://v8.1c.ru/8.1/data-composition-system/common">Asc</orderType>
  <autoOrder xmlns="http://v8.1c.ru/8.1/data-composition-system/common">false</autoOrder>
</dcssch:orderExpression>
```

The isolated `CalculatedFieldOrderExpression` tests already preserve `Asc -> Возр -> Asc`, so the problem should be tested through the real path:

```text
DynamicList -> CalculatedFields -> CalculatedField -> orderExpressions
```

Decision: keep YAML concise and restore the explicit XML node from reference metadata when it was present in source XML. `Asc` may remain omitted from YAML as a default value, but XML export must not drop an existing `<orderType>Asc</orderType>` node during round-trip.

Expected YAML may stay short:

```yaml
ВыраженияУпорядочивания:
  - Выражение: Дата
    Автоупорядочивание: Ложь
```

Criterion: both observed `<orderType ...>Asc</orderType>` nodes remain present after full YAML round-trip.

## Implementation Shape

Implement the fixes as focused changes in the existing modules:

- DCS typed values: `metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/*` and `parameterValue/*`.
- Form choice list presentation: `metadata/commonObjects/metadataValue/formChoiceList/*`.
- Metadata paths/refs: `metadata/commonObjects/metadataPath/*` and `metadataRef/*`.
- Raw pictures: `metadata/commonObjects/picture/*`.
- Empty synonym source preservation: orchestration property YAML import and `I8nText` handling, with tests around `metadataAttribute`.
- YAML document trimming: `packages/core/yaml/export.ts`.
- Dynamic list calculated field order: `dataCompositionSystem/calculatedFieldOrderExpression/*`, `calculatedFields/*`, and `forms/commonObjects/dynamicList` integration tests.

Do not change external XML fixtures.

## Testing Strategy

Add focused regression tests for each group before implementation:

- DCS appearance `Текст` with `Тип: Поле` exports back as `dcscor:Field`.
- Empty `dcscor:value xsi:type="v8:LocalStringType"` remains present when YAML omits `Значение`.
- `FormChoiceListDesTimeValue` with only `en` presentation exports YAML as a language map and imports back.
- Metadata path conversion keeps user names such as `CommonCommand.ПланСчетов` literal.
- Raw picture reference with `LoadTransparent` exports expanded YAML and restores XML attributes.
- Explicit empty metadata attribute `Synonym` does not generate a default synonym from name.
- YAML export/import preserves a newline-only `I8nText` value.
- Dynamic list calculated field `orderExpression/orderType Asc` remains present through reference-aware XML export even when YAML omits `ТипУпорядочивания`.

After focused tests pass, run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Then run the project tests according to `AGENTS.md` before closing the implementation work:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

## Risks

- Broad path conversion changes can accidentally affect valid metadata type aliases. Keep conversion positional and test both converted and literal cases.
- Reference preservation for empty DCS values and empty synonyms must not override explicit YAML edits.
- Replacing `.trim()` in YAML export can change final newline formatting. Keep the output stable by removing only the serializer-added document newline, without touching scalar content.
- Reference-aware restoration of `Asc` must be limited to cases where the source XML explicitly had `orderType`; newly authored YAML without `ТипУпорядочивания` should keep existing default-generation behavior.
