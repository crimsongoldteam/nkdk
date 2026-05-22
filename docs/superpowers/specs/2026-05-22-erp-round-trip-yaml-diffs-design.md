# ERP round-trip YAML diffs

## Context

After merging `codex/round-trip-yaml-33-diffs`, `acc` and `doc` pass the YAML round-trip.
The next failing catalog is `erp` with 169 XML diffs.

This spec records accepted decisions for those diffs one group at a time.

## Decision 1: `ChoiceParameterLinks` YAML shape

### Observed diffs

Files:

- `AccountingRegisters/Международный/Forms/ФормаСписка/Ext/Form.xml`
- `Catalogs/БланкиОтчетов/Forms/ГенерацияСтрок/Ext/Form.xml`
- `Catalogs/ВидыВыручкиМСФО/Forms/ФормаЭлемента/Ext/Form.xml`

Round-trip changes `xr:DataPath` inside `ChoiceParameterLinks`:

```diff
- <xr:DataPath xsi:type="xs:string">ПланСчетов</xr:DataPath>
+ <xr:DataPath xsi:type="xs:string">ChartOfAccounts</xr:DataPath>
```

### Current behavior

`ChoiceParameterLinks` currently exports to a compact string:

```yaml
СвязиПараметровВыбора: Отбор.ПланСчетов(ПланСчетов)
```

On YAML import, `ПланСчетов` is passed through the shared `MetadataField` converter.
The converter treats the single segment as a metadata type name and imports it as `ChartOfAccounts`.

The compact syntax is ambiguous: a single word inside parentheses may be either a metadata path token
or an ordinary form attribute/parameter name that must remain unchanged.

### Accepted design

Replace the compact string syntax with structured YAML:

```yaml
СвязиПараметровВыбора:
  - Имя: Отбор.ПланСчетов
    ПутьКДанным: ПланСчетов
```

For `DontChange`:

```yaml
СвязиПараметровВыбора:
  - Имя: Отбор.ПланСчетов
    ПутьКДанным: ПланСчетов
    РежимИзменения: НеИзменять
```

Rules:

- `ПутьКДанным` is imported and exported as a raw string for `ChoiceParameterLinks`.
- Do not translate `ПутьКДанным` through `MetadataField` in this YAML contract.
- `РежимИзменения` is omitted for `Clear`.
- Missing `РежимИзменения` imports as `Clear`.
- `РежимИзменения: НеИзменять` imports as `DontChange`.
- Existing XML `xr:DataPath xsi:type="xs:string"` stays `xs:string`.

### Testing

Add focused tests for:

- YAML export of a single link with `ПутьКДанным: ПланСчетов`.
- YAML import preserves `ПланСчетов` as `dataPath: "ПланСчетов"`.
- `Clear` is omitted on YAML export and restored on import.
- `DontChange` is exported as `РежимИзменения: НеИзменять` and imported back.
- XML export still writes `xr:DataPath xsi:type="xs:string"` with the raw data path.
