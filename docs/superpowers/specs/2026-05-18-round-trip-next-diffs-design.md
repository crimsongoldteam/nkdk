# Round-trip XML: следующие расхождения

## Контекст

Работа идёт в отдельном worktree:

- путь: `/Users/nikita/git/nakidka-core/.worktrees/round-trip-problems-spec`
- ветка: `codex/round-trip-problems-spec`
- база: `ce6df361f fix: :bug: сохранить регистр событий формы отчета`

Базовая проверка worktree зелёная:

- `pnpm --filter nkdk-language langium:generate`
- `pnpm test`

`pnpm test` выводит существующее предупреждение Chevrotain в `metadata/appliedObjects/metadataReport/syncToXML.test.ts`, но тесты проходят.

## Общая стратегия

Разбираем проблемы последовательно. Для каждой фиксируем:

- XML-источник и короткий diff или ошибку;
- владельца правила;
- причину;
- выбранное решение;
- точечную проверку;
- статус.

XML-фикстуры считаются источником истины. YAML-изменения не добавляем, пока XML-цикл для конкретной проблемы не зелёный.

## Проблема 0: блокер `ChartsOfCharacteristicTypes/ВидыДоступа`

### Симптом

`round-trip.sh --triage --batch-size 5 --start-index 6` не доходит до списка diff: short round-trip падает на объекте `ChartsOfCharacteristicTypes/ВидыДоступа`.

Ошибка:

```text
Ошибка round-trip объекта "ChartsOfCharacteristicTypes/ВидыДоступа"
Error: MetadataValue: неподдерживаемый тип для экспорта в XML: undefined
```

Источник:

- `/Users/nikita/git/round-trip-source/doc/ChartsOfCharacteristicTypes/ВидыДоступа.xml`
- `StandardAttributes/xr:StandardAttribute[@name="ValueType"]/xr:FillValue`

Фрагмент источника:

```xml
<xr:StandardAttribute name="ValueType">
  ...
  <xr:FillValue xsi:type="v8:TypeDescription"/>
  ...
</xr:StandardAttribute>
```

### Владелец

Основной владелец поведения:

- `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`

Смежный общий механизм:

- `packages/core/metadata/commonObjects/metadataValue/toXML.ts`

### Причина

`MetadataValue.fromXML` в reference-режиме сохраняет неизвестный пустой `xsi:type` как сырой XML-объект. Для `xr:FillValue xsi:type="v8:TypeDescription"` это даёт значение без модельного поля `type`.

В `MetadataValue.toXML` уже есть правильный общий путь: если модельное `value === undefined`, экспорт берёт `_xsi:nil` или `_xsi:type` из `referenceMetadata`.

Падение возникает потому, что при экспорте стандартного реквизита `ValueType` в `exportMetadataItemToXML` попадает не `fillValue: undefined` с reference-значением, а сырой reference-объект как модельное значение. Дальше `MetadataValue.toXML` пытается сериализовать его как обычный `MetadataTypedValue` и падает на `value.type === undefined`.

### Выбранное решение

Берём значение `fillValue` из reference, как в уже существующем механизме `MetadataValue.toXML` для `value === undefined`.

Для стандартных реквизитов это означает:

- если модельное значение `fillValue` отсутствует или не должно переопределять источник;
- а в reference есть `xr:FillValue` с пустым неизвестным `xsi:type`;
- экспорт должен передать в `MetadataValue.toXML` `value: undefined` и `referenceMetadata: referenceFillValue`;
- результатом должен стать `<xr:FillValue xsi:type="v8:TypeDescription"/>`.

Не добавляем новый тип `MetadataValue` для `v8:TypeDescription`: это шире текущей проблемы и потребует отдельного решения по модельной форме и YAML.

### Проверка

Минимальная точечная проверка:

- reproducer или unit-тест на `StandardAttributeDescriptions`, где модель `ValueType` не задаёт `fillValue`, а reference содержит `xr:FillValue xsi:type="v8:TypeDescription"`;
- экспорт должен вернуть `xr:FillValue` с тем же `xsi:type`;
- short round-trip по `ChartsOfCharacteristicTypes/ВидыДоступа` не должен падать.

### Статус

Реализовано.

- `registerCollectionRule.ts` сохраняет raw reference XML, когда стандартный реквизит есть только в reference и отсутствует в модели.
- `toXML.test.ts` добавляет регрессию с `xr:FillValue xsi:type="v8:TypeDescription"` и `xr:Comment>reference-only</xr:Comment`; без новой ветки тест падает с исходной ошибкой `MetadataValue: неподдерживаемый тип для экспорта в XML: undefined`.
- Проверка: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/standardAttributeDescription/toXML.test.ts`.
- Review: соответствие спеке PASS, качество PASS.

## Проблема 1: пустой `Synonym` табличной части

### Симптом

В short round-trip пустой `Synonym` табличной части превращается в синоним по умолчанию `synonym`.

Diff 1:

- `/Users/nikita/git/round-trip-source/doc/BusinessProcesses/Исполнение.xml`
- `ChildObjects/TabularSection[Name="Исполнители"]/Properties/Synonym`

```diff
- <Synonym/>
+ <Synonym>
+   <v8:item>
+     <v8:lang>ru</v8:lang>
+     <v8:content>synonym</v8:content>
+   </v8:item>
+ </Synonym>
```

Diff 5 из той же пачки имеет ту же причину:

- `/Users/nikita/git/round-trip-source/doc/Catalogs/ПроектныеЗадачи.xml`
- `ChildObjects/TabularSection[Name="Предшественники"]/Properties/Synonym`

### Владелец

Основной владелец:

- `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`

Смежный уже исправленный пример:

- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- `packages/core/metadata/commonObjects/i8nText/fromXML.ts`
- `packages/core/metadata/commonObjects/i8nText/toXML.ts`

### Причина

Предыдущий фикс `654a318a5 fix: :bug: сохранить пустой Synonym реквизита` добавил поддержку пустого raw XML для `metadataAttribute.synonym`: `defaultValueXMLEmpty: { items: {} }`, `defaultValueXMLRaw: ""`, `emptyAsRawXML: true`.

У `metadataTabularSection.synonym` остался старый default:

```ts
defaultValue: ({ context, name }) => addDefaultLanguageNameToSynonym(context, undefined, name ?? "")
```

При XML-импорте пустой `<Synonym/>` становится `undefined`, затем default строит синоним из имени. Для внешнего объекта из `round-trip-source` это проявилось как `synonym`.

### Выбранное решение

Перенести поведение пустого XML-синонима на табличные части по аналогии с `metadataAttribute.synonym`:

- `defaultValueXMLEmpty: { items: {} }`;
- `defaultValueXMLRaw: ""`;
- `emptyAsRawXML: true`;
- default должен добавлять синоним из имени только для `importFromYAML`, а не для `importFromXML`.

Это не меняет YAML-цикл и не добавляет новые YAML-аннотации. Изменение ограничено XML round-trip табличных частей.

### Проверка

Минимальная точечная проверка:

- добавить XML-фикстуру или тест-кейс `MetadataTabularSections` с `<Synonym/>`;
- `fromXML` должен возвращать `synonym: { items: {} }`;
- `toXML` должен экспортировать `<Synonym/>`, а не локализованный синоним;
- после исправления short round-trip для `BusinessProcesses/Исполнение.xml` и `Catalogs/ПроектныеЗадачи.xml` не должен менять `Synonym` табличных частей.

### Статус

Реализовано.

- `metadataTabularSection.synonym` получил обработку пустого XML по аналогии с `metadataAttribute.synonym`: `defaultValueXMLEmpty`, `defaultValueXMLRaw`, `emptyAsRawXML`.
- Default синонима из имени ограничен `importFromYAML`.
- Добавлены focused проверки `fromXML` и `toXML` для явного `<Synonym/>`.
- Проверки: focused `fromXML`/`toXML`/`toYAML` тесты `metadataTabularSection`.
- Review: соответствие спеке PASS, качество PASS.

## Проблема 2: `FlowchartContextType` в `FormAttribute.Settings`

### Симптом

В short round-trip атрибут формы `Схема` теряет typed `Settings` с графической схемой. Полный фрагмент:

```xml
<Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/graphscheme" xsi:type="d4p1:FlowchartContextType">
  <d4p1:backColor>style:FieldBackColor</d4p1:backColor>
  ...
</Settings>
```

заменяется на:

```xml
<Settings xsi:type="v8:TypeDescription"/>
```

Затронуты два diff из пачки:

- `/Users/nikita/git/round-trip-source/doc/BusinessProcesses/КомплексныйПроцесс/Forms/КарточкаСхемы/Ext/Form.xml`
- `/Users/nikita/git/round-trip-source/doc/BusinessProcesses/КомплексныйПроцесс/Forms/ФормаБизнесПроцесса/Ext/Form.xml`

### Владелец

Основной владелец:

- `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`

Существующий паттерн:

- `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`
- `packages/core/metadata/forms/commonObjects/chart/types.ts`
- `packages/core/metadata/forms/commonObjects/planner/types.ts`

### Причина

`FormAttributeRules.valueType` использует XML-тег `Settings` как `TypeDescription`. При отсутствии более специфичного правила для `xsi:type="d4p1:FlowchartContextType"` round-trip воспринимает `Settings` как описание типа и экспортирует пустой `v8:TypeDescription`.

Для похожих typed settings уже есть механизм `registerSettingsFragmentType`: `Chart`, `GanttChart`, `Planner`, `SpreadsheetDocument`. Но для `FlowchartContextType` отдельный settings-fragment не зарегистрирован и не подключён к `FormAttributeRules`.

### Выбранное решение

Добавить typed settings для `FlowchartContextType` аналогично `Chart/Planner`:

- новый модуль в `packages/core/metadata/forms/commonObjects/flowchartContext/`;
- типы `FlowchartContext`, `FlowchartContextXML`, `FlowchartContextYAML`;
- регистрация через `registerSettingsFragmentType`:
  - canonical namespace `http://v8.1c.ru/8.2/data/graphscheme`;
  - canonical prefix, например `d4p1`;
  - `_xsi:type: "d4p1:FlowchartContextType"`;
  - `matchXsiType` должен принимать точный тип и любой префикс с суффиксом `:FlowchartContextType`;
- подключить свойство в `FormAttributeRules` на XML-тег `Settings`;
- расширить `FormAttributeXML` и `FormAttributeYAML` по аналогии с `Chart/Planner`.

Фрагмент `Settings` сохраняется как непрозрачный XML-фрагмент, без ручного разбора полей `backColor`, `enableGrid`, `printPropItem` и т.п.

### Проверка

Минимальная точечная проверка:

- добавить фикстуру `FormAttribute` с `Settings xsi:type="d4p1:FlowchartContextType"`;
- `fromXML` должен импортировать фрагмент в новое поле;
- `toXML` должен экспортировать тот же typed `Settings`, не `v8:TypeDescription`;
- short round-trip двух форм бизнес-процесса должен перестать менять `Settings`.

### Статус

Реализовано.

- Добавлен settings-fragment `FlowchartContext` через `registerSettingsFragmentType` с namespace `http://v8.1c.ru/8.2/data/graphscheme` и canonical `xsi:type="d4p1:FlowchartContextType"`.
- `FormAttribute.Settings` распознаёт `FlowchartContextType` и экспортирует поле `flowchartContext` по паттерну `Chart/Planner`.
- Добавлены точные проверки: `fromXML` ожидает `flowchartContext`, `toXML` экспортирует модель только с `flowchartContext`.
- Проверка: `pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts`.
- Review: соответствие спеке PASS, качество PASS после усиления тестов.

## Проблема 3: `AutofillHint` у `InputField`

### Симптом

В short round-trip у поля ввода пропадает XML-тег:

```xml
<AutofillHint>FullName</AutofillHint>
```

Источник:

- `/Users/nikita/git/round-trip-source/doc/Catalogs/ВидыДокументов/Forms/ФормаЭлемента/Ext/Form.xml`
- элемент `ТаблицаНастроекЭДОИдентификаторОтправителя`

Diff:

```diff
- <AutofillHint>FullName</AutofillHint>
```

### Владелец

Основной владелец:

- `packages/core/metadata/forms/elements/inputField/rules.ts`
- `packages/core/metadata/forms/elements/inputField/__fixtures__/`

### Причина

У `InputField` есть два разных XML-свойства:

- `SpecialTextInputMode` — специальный режим ввода текста: `Email`, `PhoneNumber`, `Digits` и т.п.;
- `AutofillHint` — подсказка автозаполнения: `FullName`, `FamilyName`, `City`, `PostalCode` и т.п.

В коде тоже есть два разных модельных поля:

- `specialTextInputMode` с перечислением `SpecialTextInputMode`;
- `autoFillHint` с перечислением `InputFieldAutofillHint`.

Но сейчас `autoFillHint` ошибочно читает XML-тег `SpecialTextInputMode`:

```ts
autoFillHint: {
  typeSE: "InputFieldAutofillHint",
  xml: "SpecialTextInputMode",
}
```

Существующие XML-фикстуры проекта маскируют баг: в них есть только `<SpecialTextInputMode>Email</SpecialTextInputMode>`, а TS-фикстура одновременно ожидает `specialTextInputMode: "Email"` и `autoFillHint: "Email"`. Из-за этого одно XML-поле заполняет два модельных свойства, а реальный `<AutofillHint>` остаётся непокрытым.

### Выбранное решение

Развести свойства по фактическим XML-тегам:

- для `autoFillHint` использовать `xml: "AutofillHint"`;
- `specialTextInputMode` оставить на каноническом `SpecialTextInputMode`;
- обновить или добавить фикстуру `InputField`, где одновременно присутствуют оба тега с разными значениями, например:

```xml
<SpecialTextInputMode>Email</SpecialTextInputMode>
<AutofillHint>FullName</AutofillHint>
```

Ожидаемая модель:

```ts
specialTextInputMode: "Email"
autoFillHint: "FullName"
```

### Проверка

Минимальная точечная проверка:

- `fromXML` для `InputField` должен импортировать оба свойства раздельно;
- `toXML` должен экспортировать оба тега раздельно;
- round-trip внешнего файла формы `ВидыДокументов/ФормаЭлемента` не должен удалять `<AutofillHint>FullName</AutofillHint>`.

### Статус

Реализовано.

- `InputField.autoFillHint` переведён на XML-тег `AutofillHint`.
- `specialTextInputMode` остался на `SpecialTextInputMode`.
- Локальные fixture `InputField` теперь содержат оба XML-тега с разными значениями: `Email` и `FullName`.
- Обновлены ожидаемые YAML/Enterprise значения для `FullName`.
- Проверки: focused `InputField` fromXML/toXML/fromYAML/toYAML/toEnterprise, плюс полный `metadata/forms/elements`.
- Review: соответствие спеке PASS, качество PASS.

## Итоговая проверка

- `pnpm --filter nkdk-language langium:generate` — PASS.
- `round-trip.sh --triage --batch-size 5 --start-index 6` для `/Users/nikita/git/round-trip-source/doc` — PASS: список diff теперь короче шести элементов, прежняя пачка из пяти расхождений отсутствует.
- `round-trip.sh --triage --batch-size 5 --start-index 1` — осталось 2 diff, оба вне этой пачки:
  - `Catalogs/ПроектныеЗадачи/Forms/ФормаПланаПроекта/Ext/Form.xml`: удаление вложенной таблицы `ДиаграммаГантаТаблица`;
  - `DataProcessors/КартаМаршрутаБизнесПроцесса/Forms/Форма/Ext/Form.xml`: удаление `CommandSet`.
- `pnpm test` — PASS после повторного запуска: graph 53, language 60, core 3649 passed / 13 skipped, cli 43.

Первый полный `pnpm test` один раз упал на `metadata/forms/elements/inputField/fromNKDK.test.ts` с `nkdkParse is not a function`; focused воспроизведение и повторный полный прогон прошли. Код для этого не менялся.
