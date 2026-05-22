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

## Decision 2: `GroupItemField` YAML shape for non-default fields

### Observed diff

File:

- `Catalogs/ВидыЦен/Forms/ФормаНастройкиРасписанияАвтообновленияЦен/Ext/Form.xml`

Round-trip changes the DCS group item type:

```diff
- <dcsset:groupType>Hierarchy</dcsset:groupType>
+ <dcsset:groupType>Items</dcsset:groupType>
```

### Current behavior

`GroupItemField` currently exports to a compact string:

```yaml
Группировка:
  - СсылкаВидЦен
```

The string stores only `field`.
Other XML properties, including `groupType`, have no place in this YAML shape.
On YAML import, `groupType` falls back to `Items`, so explicit `Hierarchy` is lost.

The old YAML syntax also encodes disabled fields as a parenthesized string:

```yaml
Группировка:
  - (СсылкаВидЦен)
```

### Accepted design

Keep the compact string only for the full default case:

```yaml
Группировка:
  - Валюта
```

This means:

- `Поле: Валюта`
- `Использование: Истина`
- `ТипГруппировки: Элементы`
- `ТипДополнения: Нет`
- default period dates

When any meaningful property differs from the default, export an object:

```yaml
Группировка:
  - Поле: СсылкаВидЦен
    ТипГруппировки: Иерархия
```

For disabled fields, export an object instead of the old parenthesized string:

```yaml
Группировка:
  - Поле: СсылкаВидЦен
    Использование: Ложь
```

Rules:

- String YAML stays supported on import as the default shorthand.
- Parenthesized string YAML stays supported on import for compatibility and imports as `Использование: Ложь`.
- New exports should not use the parenthesized string form.
- Object YAML may contain `Поле`, `Использование`, `ТипГруппировки`, `ТипДополнения`, `НачалоПериода`, and `КонецПериода`.
- Object export omits default-valued properties where the existing YAML default rules allow it.
- XML export keeps the existing defaults and still writes explicit non-default `dcsset:groupType`.

### Testing

Add focused tests for:

- Default `GroupItemField` still exports as a string.
- `groupType: "Hierarchy"` exports as an object with `ТипГруппировки: Иерархия`.
- Object YAML with `ТипГруппировки: Иерархия` imports to `groupType: "Hierarchy"`.
- `use: false` exports as an object with `Использование: Ложь`.
- Old `(Поле)` YAML still imports to `use: false`.
- XML export writes `Hierarchy` when the YAML object contains `ТипГруппировки: Иерархия`.

## Decision 3: typed enum values inside `FormChoiceListDesTimeValue`

### Observed diff

File:

- `Catalogs/Запросы/Forms/НастройкаОтборов/Ext/Form.xml`

Round-trip changes `ChoiceList` values:

```diff
- <Value xsi:type="dcsset:DataCompositionComparisonType">Equal</Value>
+ <Value xsi:type="xs:string">Равно</Value>
```

The same happens for `NotEqual`, `InList`, `NotInList`, `InHierarchy`, and `InListByHierarchy`.

### Current behavior

The XML value is imported as a typed metadata value:

```ts
{ type: "DataCompositionComparisonType", value: "Equal" }
```

YAML export currently writes only the localized scalar:

```yaml
СписокВыбора:
  - Представление: Равно
    Значение: Равно
```

On YAML import, the nested `Значение` has no type context.
The generic metadata value importer treats `Равно` as a string, so XML export writes `xs:string`.

### Accepted design

When a `FormChoiceListDesTimeValue` nested `Значение` has a type that cannot be recovered from scalar syntax,
export the value with an explicit type wrapper.

For `DataCompositionComparisonType`, use:

```yaml
СписокВыбора:
  - Представление: Равно
    Значение:
      Тип: ВидСравненияКомпоновкиДанных
      Значение: Равно
```

Rules:

- `Тип: ВидСравненияКомпоновкиДанных` maps to internal type `DataCompositionComparisonType`.
- The nested `Значение` uses the existing `DataCompositionComparisonType` YAML names, for example `Равно` -> `Equal`.
- YAML import must preserve the typed value as `{ type: "DataCompositionComparisonType", value: "Equal" }`.
- XML export must restore `xsi:type="dcsset:DataCompositionComparisonType"`.
- Plain scalar `Значение` remains supported for values that are intentionally strings or can be inferred safely.

### Testing

Add focused tests for:

- YAML export of `FormChoiceListDesTimeValue` with `DataCompositionComparisonType` uses `Тип/Значение`.
- YAML import of that shape restores `type: "DataCompositionComparisonType"` and the internal enum value.
- XML export from imported YAML writes `dcsset:DataCompositionComparisonType`.
- Existing plain string form choice values remain plain strings.

## Decision 4: form help external files

### Observed diffs

The full ERP triage has 139 deleted files under form help directories:

```text
Ext/Help/_files/*
```

Examples:

- `Catalogs/ИсточникиДанныхДляРасчетов/Forms/ФормаЭлемента/Ext/Help/_files/001.png`
- `DataProcessors/СхемыСправки/Forms/ЗакупкиОбщаяСхема/Ext/Help/_files/ЗакупкиОбщаяСхема.png`
- `Documents/ЭтапПроизводства2_2/Forms/Диспетчирование/Ext/Help/_files/Кнопка.png`

Round-trip deletes these binary/image files during YAML -> XML sync.

### Current behavior

Form help content itself is handled, but files nested in `Ext/Help/_files` are not preserved by the current
external-file sync path for forms.

These files are opaque external files. They are not metadata model properties and should not be parsed into YAML.

### Accepted design

Preserve form help files as raw external files:

- During XML -> YAML import, copy every file under form `Ext/Help/_files/**` to the YAML tree.
- During YAML -> XML sync, copy those files back to the XML tree.
- Preserve file names, extensions, nested paths, and bytes exactly.
- Do not derive model fields from these files.
- Do not require a corresponding YAML scalar/object entry for each file.

This is the same kind of behavior as other form external files that must survive round-trip without semantic parsing.

### Testing

Add focused sync tests for:

- A form with `Ext/Help/_files/001.png` keeps the file after XML -> YAML -> XML.
- The copied file is byte-identical.
- Multiple files in the same help `_files` directory are preserved.
- The behavior is limited to external file copying and does not add YAML model properties for help images.

## Decision 5: raw `Ext/Form.bin` for every form

### Observed diff

File:

- `CommonForms/ФормаРедактированияСпискаЗначений/Ext/Form.bin`

Round-trip deletes the binary form file:

```diff
deleted file mode 100644
Binary files .../Ext/Form.bin and /dev/null differ
```

The temporary YAML tree contains only:

```text
ОбщаяФорма/ФормаРедактированияСпискаЗначений/Свойства.yaml
```

No `Form.bin` is copied to YAML for this form.

### Current behavior

`Ext/Form.bin` is already handled for some ordinary-form paths, but the preservation is not applied uniformly
to every form owner/type.

### Accepted design

Preserve `Ext/Form.bin` as a raw external file for every form:

- common forms;
- object forms;
- report/data processor forms;
- any other form represented by `Forms/<name>/Ext/Form.bin` or `<form>/Ext/Form.bin`.

Rules:

- During XML -> YAML import, copy `Ext/Form.bin` to the form's YAML directory.
- During YAML -> XML sync, copy it back to the form `Ext/Form.bin`.
- Preserve bytes exactly.
- Do not parse `Form.bin`.
- Do not require `Ext/Form.xml` to be present.
- The rule applies to all forms, not only ordinary forms or a specific owner metadata item.

### Testing

Add focused sync tests for:

- CommonForm with only `Ext/Form.bin` preserves the file through XML -> YAML -> XML.
- A nested owner form with `Forms/<name>/Ext/Form.bin` preserves the file through XML -> YAML -> XML.
- `Form.bin` bytes are identical after round-trip.
- The behavior works when `Ext/Form.xml` is absent.
