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
