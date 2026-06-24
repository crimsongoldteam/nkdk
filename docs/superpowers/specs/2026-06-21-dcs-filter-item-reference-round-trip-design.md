# DCS FilterItem Reference Round-Trip Design

## Goal

Сохранить исходные XML-детали пользовательских настроек во вложенных элементах DCS filter при YAML round-trip.

Текущий YAML намеренно хранит не служебный GUID, а человекочитаемый флаг:

```yaml
ИспользоватьПользовательскуюНастройку: Истина
```

При обратном XML-экспорте этот флаг должен восстановиться по `referenceMetadata` в исходный `<dcsset:userSettingID>...`. Та же reference-связь нужна для `userSettingPresentation`: если в исходном XML была компактная форма `xsi:type="xs:string"`, экспорт должен сохранить именно её, а не разворачивать значение в `v8:LocalStringType`.

## Problem Example

Round-trip diff для вложенного `dcsset:FilterItemComparison`:

```diff
  <dcsset:item xsi:type="dcsset:FilterItemComparison">
    <dcsset:use>false</dcsset:use>
    <dcsset:left xsi:type="dcscor:Field">ТипОплаты</dcsset:left>
    <dcsset:comparisonType>Equal</dcsset:comparisonType>
-   <dcsset:userSettingID>6f0e2d67-8181-4539-aaf3-3a925839c031</dcsset:userSettingID>
-   <dcsset:userSettingPresentation xsi:type="xs:string">Способ оплаты</dcsset:userSettingPresentation>
+   <dcsset:userSettingPresentation xsi:type="v8:LocalStringType">
+     <v8:item>
+       <v8:lang>ru</v8:lang>
+       <v8:content>Способ оплаты</v8:content>
+     </v8:item>
+   </dcsset:userSettingPresentation>
  </dcsset:item>
```

Данные не потерялись в YAML. Потеря произошла на этапе XML-экспорта, когда вложенный `FilterItemComparison` не получил подходящий исходный XML-элемент как reference.

## Scope

В границы входит общий слой:

- `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/*`
- тесты для `FilterItemComparison` и вложенного filter round-trip

Вне границ:

- изменение XML-фикстур;
- добавление GUID пользовательских настроек в YAML;
- добавление XML-формы `userSettingPresentation` в YAML;
- точечная правка только `DynamicList`;
- изменение общего договора `UserSettingsID` и `DcsLocalStringType`, если тесты подтвердят, что они уже корректно работают при наличии reference.

## Recommended Approach

Рекомендуемый подход: исправить reference-сопоставление внутри `FilterItem.toXML`, чтобы каждый вложенный `FilterItemComparison` получал свой исходный `referenceMetadata`.

Именно `referenceMetadata` уже содержит обе нужные детали:

- реальный GUID для `UserSettingsID`, когда модель хранит `true`;
- исходный строковый вид `userSettingPresentation`, когда XML был `xsi:type="xs:string"`.

YAML при этом остаётся стабильным и предметным: он описывает смысл настройки, а не служебные XML-детали.

## Alternatives

### (А) Починить reference-сопоставление в `FilterItem`

Плюсы: закрывает причину, работает для всех потребителей `FilterItemComparison`, сохраняет чистый YAML.

Минусы: нужно аккуратно проверить ключ сопоставления, потому что разные элементы filter могут иметь похожие `left` и `comparisonType`.

### (Б) Сохранять GUID и форму строки в YAML

Плюсы: XML можно восстановить без reference.

Минусы: YAML станет хранить служебные детали исходного XML, появится шум в представлении и риск закрепить нестабильные идентификаторы как часть пользовательского формата.

### (В) Исправить только `DynamicList.filter`

Плюсы: может закрыть текущий первый diff минимальным изменением.

Минусы: проблема находится не в `DynamicList`, а в общем DCS filter item. Следующие похожие места будут проявляться по одному.

## Design

### Architecture

`FilterItem.toXML` должен отвечать за подбор reference для каждого элемента списка. После подбора reference свойства `userSettingID` и `userSettingPresentation` экспортируются обычным механизмом rules/property.

Граница ответственности:

- `FilterItem` сопоставляет текущий элемент модели с исходным XML/reference-элементом;
- `UserSettingsID.toXML` восстанавливает GUID из reference-строки;
- `DcsLocalStringType.toXML` сохраняет компактную форму `xs:string`, если reference был строкой;
- YAML-слой не знает о GUID и XML-представлении локализованной строки.

### Data Flow

1. `fromXML` читает исходный `FilterItemComparison`.
2. `toYAML` печатает `ИспользоватьПользовательскуюНастройку: Истина` вместо GUID.
3. `fromYAML` восстанавливает модель с `userSettingID: true`.
4. `FilterItem.toXML` ищет соответствующий исходный `FilterItemComparison` в `referenceMetadata`.
5. `UserSettingsID.toXML` получает reference-строку и экспортирует исходный GUID.
6. `DcsLocalStringType.toXML` получает reference-строку и экспортирует `xsi:type="xs:string"`, если так было в исходном XML.

### Matching Rules

Сопоставление должно использовать стабильные признаки самого filter item, а не `userSettingID`, потому что в модели после YAML хранится только `true`.

Базовые кандидаты для `FilterItemComparison`:

- тип элемента: `FilterItemComparison`;
- `leftValue`;
- `comparisonType`;
- при необходимости `rightValue`, если оно задано и помогает различать элементы;
- позиционный резерв внутри списка элементов одного типа, если ключ не уникален.

Если ключ неоднозначен, экспорт не должен брать случайный reference. Лучше сохранить существующее поведение без GUID для неоднозначного случая, чем подставить GUID от соседнего условия.

### Error Handling

Если reference не найден или найден неоднозначно, экспорт должен продолжить работу без падения и без подстановки чужого GUID.

Ошибки некорректной структуры YAML или XML остаются в существующих слоях импорта и экспорта. Новая логика не должна расширять набор исключений.

## Testing

Минимальные проверки:

- unit-тест `FilterItemComparison.toXML`: при `userSettingID: true` и reference с GUID экспортируется исходный `<dcsset:userSettingID>...`.
- unit-тест `FilterItemComparison.toXML`: при `userSettingPresentation` как однострочный `I8nText` и reference `xs:string` экспорт остаётся `xs:string`.
- тест на неоднозначные элементы: reference не должен подбираться случайно, если два элемента имеют одинаковый ключ.
- интеграционный тест для filter со вложенными `FilterItemComparison`, который воспроизводит исчезновение `userSettingID` и разворачивание `userSettingPresentation`.

Финальные проверки:

- точечные тесты затронутых common objects;
- `pnpm test` из корня перед закрытием реализации;
- повторный `round-trip-yaml`, чтобы убедиться, что класс diff'ов по `userSettingID` и `userSettingPresentation` в DCS filter исчез или существенно сократился.

## Risks

- Слишком слабый ключ сопоставления может подставить GUID от соседнего условия.
- Слишком строгий ключ может не найти reference после допустимых преобразований YAML.
- Позиционный резерв полезен только внутри уже суженного набора кандидатов; использовать одну позицию как основной ключ рискованно.

## Success Criteria

- YAML не получает новые служебные поля для GUID или XML-формы строки.
- Вложенный `FilterItemComparison` восстанавливает исходный `userSettingID`, если reference найден однозначно.
- `userSettingPresentation` сохраняет исходную компактную форму `xs:string`, если она была в XML.
- Неоднозначное сопоставление не приводит к подстановке чужого GUID.
