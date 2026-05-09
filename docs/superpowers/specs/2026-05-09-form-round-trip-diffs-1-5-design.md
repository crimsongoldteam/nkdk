# FormAttribute typed Settings: Chart and SpreadsheetDocument design

Дата: 2026-05-09

## Контекст

Short round-trip по XML-дампу `trade` показал пачку расхождений 1-5. В этой спецификации
зафиксирована согласованная часть этой пачки: большие типизированные `FormAttribute.Settings`,
которые сейчас полностью теряются при XML round-trip.

1. `Catalogs/ВариантыАнализаЦелевыхПоказателей/Forms/НастройкаДемоДанных/Ext/Form.xml`
2. `Catalogs/Номенклатура/Forms/ФормаЭлемента/Ext/Form.xml`

Остальные diff'ы из triage-пачки не входят в текущую реализацию и должны разбираться отдельно.

## Проблема 1: Settings Chart у FormAttribute

### Исходный diff

Файл:
`Catalogs/ВариантыАнализаЦелевыхПоказателей/Forms/НастройкаДемоДанных/Ext/Form.xml`

После round-trip у реквизита формы с типом `d5p1:Chart` полностью пропадает узел `Settings`
с настройками диаграммы:

```diff
 <Attribute name="Диаграмма" id="4">
   <Type>
     <v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>
   </Type>
-  <Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:Chart">
-    <d4p1:seriesCurId>1</d4p1:seriesCurId>
-    ...
-    <d4p1:valuesAxis/>
-    <d4p1:pointsAxis/>
-  </Settings>
 </Attribute>
```

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/formAttribute`.

### Текущая логика

`FormAttributeRules` использует XML-тег `Settings` для двух свойств:

- `valueType`: `TypeDescription`, экспортируется в `<Settings xsi:type="v8:TypeDescription">`;
- `dynamicList`: `DynamicList`, экспортируется в `<Settings xsi:type="DynamicList">`.

Настройки диаграммы имеют собственный `xsi:type="d4p1:Chart"` и не являются ни `TypeDescription`,
ни `DynamicList`. Поэтому import не кладёт их в модель, а export не может восстановить XML-узел.

### Цель

Сохранять `Settings xsi:type="...:Chart"` у `FormAttribute` без потери структуры и порядка XML.

`Chart` является отдельным большим типом. На этом этапе не нужно раскладывать его в доменную модель.
Нужно сохранить XML-фрагмент в модели как есть, чтобы round-trip возвращал исходный `Settings`
без изменений.

### Решение

Добавить отдельный тип `Chart` для настроек формы:

- модельное значение хранит внутренности `Settings` как XML-объект, включая имена узлов с префиксами
  и пустые элементы;
- import принимает `Settings`, у которого `xsi:type` указывает на chart-тип;
- export всегда восстанавливает каноническую оболочку
  `<Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:Chart">`
  и возвращает сохранённые внутренности без преобразования;
- YAML хранит `Chart` прямо в основном YAML формы как XML-фрагмент строкой, без смыслового
  преобразования структуры.

В `FormAttribute` должно появиться отдельное свойство `chart`, использующее тот же XML-тег
`Settings`, но обрабатывающее только chart-typed XML. YAML-ключ свойства: `Диаграмма`.
Существующая семантика `valueType` и `dynamicList` не меняется:

1. `Settings xsi:type="v8:TypeDescription"` остаётся `valueType`.
2. `Settings xsi:type="DynamicList"` остаётся `dynamicList`.
3. `Settings xsi:type="...:Chart"` становится новым `chart`-свойством.
4. При экспорте без chart в модели новый `Settings` не создаётся.

### YAML

Основной YAML формы хранит содержимое `Chart` в ключе `Диаграмма` как строковый XML-фрагмент без
внешнего тега `Settings`: только внутренние узлы (`<d4p1:seriesCurId>...</d4p1:seriesCurId>...`).
Это временное, но явное представление большого объекта, пока для `Chart` нет полноценной доменной
модели. Импорт из YAML должен разобрать эту строку обратно в XML-объект внутренностей `Settings`,
а export в XML должен снова обернуть его в канонический chart-`Settings`:
`xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:Chart"`.

Такой подход не использует `externalFile` и не требует обобщения механики внешних файлов.

### Тесты

Нужен focused reproducer в `packages/core/metadata/forms/commonObjects/formAttribute`:

- XML-фикстура `chartSettings.xml`: один `Attribute` с `Type` = `Chart` и полным
  `Settings xsi:type="...:Chart"` с несколькими характерными узлами, включая вложенные элементы,
  атрибуты namespace и пустые элементы.
- TS-фикстура `chartSettings.ts`: ожидаемая модель `FormAttributes`, где `chart` содержит внутренности
  `Settings` как XML-структуру.

Проверки:

- import читает chart-settings в отдельное свойство модели и не смешивает его с `valueType`;
- export возвращает `Settings xsi:type="...:Chart"` байт-в-байт для фикстуры;
- export to YAML кладёт chart-settings в YAML как XML-фрагмент строкой без внешнего тега `Settings`;
- import from YAML восстанавливает chart-settings из XML-фрагмента строки;
- XML с `Settings xsi:type="v8:TypeDescription"` продолжает работать как `valueType`;
- XML с `Settings xsi:type="DynamicList"` продолжает работать как `dynamicList`;
- без chart-settings export не создаёт новый `Settings`.

### Не входит

- Полная доменная модель `Chart`.
- Человеческое YAML-представление отдельных свойств диаграммы.
- Вынесение `Chart` во внешний файл.
- Изменение поведения пустого `Settings xsi:type="v8:TypeDescription"` для `ValueListType`.
- Человеческое YAML-представление отдельных свойств `SpreadsheetDocument`.

## Проблема 3: Settings SpreadsheetDocument у FormAttribute

### Исходный diff

Файл:
`Catalogs/Номенклатура/Forms/ФормаЭлемента/Ext/Form.xml`

После round-trip у реквизита формы с типом `mxl:SpreadsheetDocument` полностью пропадает большой
узел `Settings` с настройками табличного документа:

```diff
 <Attribute name="..." id="...">
   <Type>
     <v8:Type xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet">mxl:SpreadsheetDocument</v8:Type>
   </Type>
-  <Settings xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet" xsi:type="mxl:SpreadsheetDocument">
-    <mxl:languageSettings>
-      ...
-    </mxl:languageSettings>
-    ...
-  </Settings>
 </Attribute>
```

Владеющий модуль:
`packages/core/metadata/forms/commonObjects/formAttribute`.

### Решение

Для `SpreadsheetDocument` используется тот же подход, что и для `Chart`, но с отдельным типом:

- в `FormAttribute` появляется отдельное свойство `spreadsheetDocument`;
- YAML-ключ: `ТабличныйДокумент`;
- YAML хранит строкой только внутренние XML-узлы `Settings`, без внешнего тега `Settings`;
- import из XML принимает `Settings` с `xsi:type="mxl:SpreadsheetDocument"`;
- export в XML всегда восстанавливает каноническую оболочку
  `<Settings xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet" xsi:type="mxl:SpreadsheetDocument">`
  и возвращает сохранённые внутренности без преобразования.

### Тесты

Нужен focused reproducer в `packages/core/metadata/forms/commonObjects/formAttribute`:

- XML-фикстура `spreadsheetDocumentSettings.xml`: один `Attribute` с `Type` =
  `SpreadsheetDocument` и характерными внутренними узлами `Settings`.
- TS-фикстура `spreadsheetDocumentSettings.ts`: ожидаемая модель `FormAttributes`, где
  `spreadsheetDocument` содержит внутренности `Settings` как XML-структуру.

Проверки аналогичны `Chart`:

- import читает spreadsheet-settings в отдельное свойство модели и не смешивает его с `valueType`;
- export возвращает `Settings xsi:type="mxl:SpreadsheetDocument"` для фикстуры;
- export to YAML кладёт spreadsheet-settings в YAML как XML-фрагмент строкой без внешнего тега
  `Settings`;
- import from YAML восстанавливает spreadsheet-settings из XML-фрагмента строки.
