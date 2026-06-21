# Nested MetadataValue Quoted String YAML Design

## Goal

Сохранить тип строковых значений `MetadataValue` при YAML round-trip во вложенных структурах.

После перехода на double-quoted scalars строковое значение вроде `"2"` печатается корректно, но при импорте может потерять внутренний признак явной строки, если значение лежит не в прямом свойстве metadata item, а внутри составного YAML-объекта. В результате эвристика `MetadataValue` видит обычную строку `2`, распознаёт её как число и экспортирует обратно в XML как `xs:decimal` вместо исходного `xs:string`.

## Problem Example

Round-trip diff:

```diff
- <Value xsi:type="xs:string">2</Value>
+ <Value xsi:type="xs:decimal">2</Value>
```

Соответствующий YAML выглядит правильно:

```yaml
СписокВыбора:
  - Представление: 2 знака
    Значение: "2"
```

Ошибка появляется не при печати YAML, а при обратном импорте. YAML-парсер хранит признак double-quoted scalar отдельно от значения, в `WeakMap` на родительском объекте. Поэтому вложенный импорт должен явно восстановить его через `asExplicitYAMLStringIfMarked(parent, key, value)`.

## Scope

В границы входят ручные импортеры, которые передают вложенные YAML-фрагменты в `importMetadataValueFromYAML` или совместимые DCS value-обработчики.

Минимально затрагиваемые места:

- `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
- `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts`, если тест подтвердит потерю marker для элементов массива
- ветки `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, где `MetadataValue` импортируется напрямую из вложенного значения

Соседние места, которые уже решают эту задачу и должны использоваться как образец:

- `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`
- `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.ts`

Вне границ:

- изменение XML-фикстур;
- изменение общей эвристики `MetadataValue`, которая распознаёт plain string `2` как число;
- перевод строк на объектный YAML-формат `{ Тип, Значение }`;
- изменение договора для обычных свойств типа `string`.

## Recommended Approach

Рекомендуемый подход: сделать единый маленький helper для восстановления явной строки у вложенных YAML-значений и применить его во всех ручных импортерах `MetadataValue`.

Например, helper может быть обёрткой над существующим `asExplicitYAMLStringIfMarked` с именем, отражающим домен:

```ts
restoreExplicitMetadataValueYAMLString(parent, key, value)
```

Он не должен менять семантику: если `value` не строка или scalar не был double-quoted, значение возвращается как есть. Его задача только сделать намерение видимым и убрать копирование низкоуровневой YAML-детали по разным common object.

## Alternatives

### (А) Точечно поправить `FormChoiceList`

Плюсы: самый маленький diff, сразу закрывает текущий первый round-trip diff.

Минусы: оставляет тот же класс ошибок в соседних ручных импортерах. Следующие round-trip diff'ы могут проявиться по одному и потребовать повторять одно и то же расследование.

### (Б) Единый helper для ручных вложенных `MetadataValue`

Плюсы: закрывает класс ошибок, делает код читаемее, следует уже существующему паттерну из `fixedArray` и DCS `parameterValue`.

Минусы: нужно аккуратно пройти несколько мест и не менять ветки, где строка намеренно трактуется как plain string, field path или I8nText.

### (В) Перенести восстановление marker внутрь `importMetadataValueFromYAML`

Плюсы: потребители не думают о YAML-style marker.

Минусы: функция получает только `data`, без родителя и ключа, поэтому ей нечего восстанавливать. Для этого пришлось бы менять сигнатуру и большое число вызовов, что не соответствует размеру проблемы.

## Design

### Architecture

YAML-слой остаётся владельцем технической информации о стиле scalar. Common object, который разбирает вложенный `MetadataValue`, обязан передать в импорт не сырой `value`, а значение после восстановления marker из родителя и ключа.

Граница ответственности:

- `yaml/import.ts` помечает double-quoted scalars на родителе;
- helper восстанавливает `ExplicitYAMLString` для конкретного `parent + key`;
- `MetadataValue/fromYAML` потребляет `ExplicitYAMLString` и выбирает тип `string`;
- составные объекты отвечают за вызов helper перед ручным импортом вложенного `MetadataValue`.

### Data Flow

Для `FormChoiceList`:

1. YAML-парсер читает `Значение: "2"` и помечает ключ `Значение` у объекта элемента списка.
2. `importFormChoiceListFromYAML` берёт `data.Значение`.
3. Перед вызовом `importMetadataValueFromYAML` он восстанавливает marker по `data` и `"Значение"`.
4. `importMetadataValueFromYAML` получает `ExplicitYAMLString("2")` и возвращает `{ type: "string", value: "2" }`.
5. `toXML` сохраняет `<Value xsi:type="xs:string">2</Value>`.

Для массивов:

1. Если элемент массива был `"2"`, marker хранится на массиве по числовому индексу.
2. Импортёр передаёт в helper родительский массив и индекс.
3. Дальше работает тот же путь через `ExplicitYAMLString`.

### Error Handling

Helper не должен бросать ошибки. Он только восстанавливает marker, когда это возможно. Все ошибки несовместимого типа остаются в существующих местах:

- `assertValueType` в `MetadataValue`;
- специализированные DCS-обработчики;
- проверки формы YAML-объекта в конкретных импортерах.

Если ручной импортер намеренно различает строку как путь метаданных, поле DCS или I8nText, marker нужно восстанавливать только перед веткой, которая действительно вызывает `MetadataValue`.

## Testing

Тесты должны проверять не только TS-фикстуры с `explicitYAMLString`, но и путь через реальный YAML-текст, потому что проблема находится между YAML-парсером и вложенным импортом.

Минимальные проверки:

- `yaml/import` уже должен сохранять marker для double-quoted scalar в объекте и массиве; если покрытия не хватает, добавить точечный тест.
- `metadataValue/formChoiceList/fromYAML.test.ts`: импорт из объекта, полученного через `importFromYAML('Значение: "2"')`, должен дать строковый `MetadataValue`.
- `choiceList/fromYAML.test.ts`: список выбора из YAML-текста с `Значение: "2"` должен восстановить `xs:string`-модель, а plain `Значение: 2` должен остаться числом.
- `mobileDeviceCommandBarContent/fromYAML.test.ts`: если элемент массива может быть вложенным `MetadataValue`, проверить `"2"` внутри массива.
- DCS value tests: добавить только там, где есть ручной вызов `importMetadataValueFromYAML` из вложенного YAML и где quoted numeric string является допустимым значением.

Интеграционные проверки:

- точечные тесты затронутых common objects;
- `pnpm test` из корня перед закрытием задачи;
- повторный `round-trip-yaml` после коммита реализации, чтобы убедиться, что diff `xs:string` -> `xs:decimal` для `ChoiceList` исчез.

## Risks

- Чрезмерное применение helper может сломать места, где строка `"Справочник.Имя"` должна быть распознана как путь или поле, а не как строковый `MetadataValue`.
- DCS-ветки имеют разные семантики `Field`, `DesignTimeValue`, `Primitive`; там нужно добавлять marker только рядом с фактическим импортом `MetadataValue`.
- Тесты на TS-объектах могут дать ложную уверенность, потому что они обходят YAML parser style-map. Нужны тесты через `importFromYAML`.

## Success Criteria

- Вложенный `FormChoiceList` сохраняет quoted numeric string как `{ type: "string", value: "2" }`.
- Plain YAML number `2` по-прежнему импортируется как decimal.
- Существующие защищённые места продолжают работать без изменения договора.
- Первый новый `round-trip-yaml` diff по `ChoiceList` больше не меняет `xs:string` на `xs:decimal`.
