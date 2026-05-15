# Round-trip DCS DataSetField Appearance

## Контекст

В XML DCS-поля набора данных встречается оформление через
`dcssch:appearance`:

```xml
<Field xsi:type="dcssch:DataSetFieldField">
  <dcssch:dataPath>ВремяВыполнения</dcssch:dataPath>
  <dcssch:field>ВремяВыполнения</dcssch:field>
  <dcssch:appearance>
    <dcscor:item xsi:type="dcsset:SettingsParameterValue">
      <dcscor:parameter>Формат</dcscor:parameter>
      <dcscor:value xsi:type="xs:string">ЧЦ=15; ЧДЦ=3; ЧН=0,000</dcscor:value>
    </dcscor:item>
  </dcssch:appearance>
</Field>
```

После round-trip такой блок пропадает.

В соседнем `CalculatedField` свойство `appearance` уже описано как
`AppearanceFields`. Для `DataCompositionSchemaDataSetField` оно сейчас описано
как `string`, поэтому XML-объект с `dcscor:item` не превращается в модель
оформления.

## Решение

`DataCompositionSchemaDataSetField.appearance` должен использовать общий тип
`AppearanceFields`, как `CalculatedField.appearance`.

YAML-представление должно быть тем же, что для остальных DCS-оформлений:

```yaml
Оформление:
  Формат: "ЧЦ=15; ЧДЦ=3; ЧН=0,000"
```

Так `dcssch:appearance` сохраняется как структурированная модель, а не как
сырой XML или строка.

## Значения Параметров

Параметр `Формат` должен сохранять оба XML-вида, которые встречаются в
корпусе:

- `dcscor:value xsi:type="xs:string"` для простой строки формата;
- `dcscor:value xsi:type="v8:LocalStringType"` для локализованного текста.

Для модели и YAML это остается одним значением `Формат`. Если значение пришло
из `xs:string`, экспорт с `referenceMetadata` должен сохранить `xs:string`.
Если reference нет, можно использовать существующее каноническое поведение
`DesignTimeValue`.

Остальные параметры `AppearanceFields`, например `ЦветФона`, `ЦветТекста`,
`ВыделятьОтрицательные`, должны работать через уже существующие правила
`SettingsParameterValue`.

## Границы

В рамках этой спеки:

- меняется только тип правила `DataCompositionSchemaDataSetField.appearance`;
- `CalculatedField.appearance` не меняется;
- не вводится сырой XML-формат для `appearance`;
- XML-фикстуры из source-репозитория не изменяются;
- неизвестные параметры `AppearanceFields` продолжают обрабатываться по
  существующей политике.

## Проверка

Для реализации нужны тесты:

- импорт `DataSetFieldField` с `dcssch:appearance` и параметром `Формат`
  возвращает `appearance` как `AppearanceFields`;
- экспорт этой модели с reference сохраняет `dcssch:appearance`;
- `Формат` из `xs:string` сохраняется как `xs:string` при reference-aware
  экспорте;
- существующие тесты `CalculatedField.appearance` остаются зелеными.

После реализации нужно выборочно прогнать round-trip на файлах:

- `trade/InformationRegisters/ОперацииСПодключаемымОборудованием/Forms/ФормаСписка/Ext/Form.xml`;
- `trade/Catalogs/ТСПИоТ/Forms/ФормаСписка/Ext/Form.xml`.
