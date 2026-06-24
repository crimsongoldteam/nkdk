# Round-trip TypeDescription ConditionalAppearance

## Контекст

При `round-trip --all-configs` экспорт `erp` падает на форме:

`DataProcessors/АналитическийБланкСводнаяТаблица/ФормаНастройкиУсловногоОформления`

Причина в типе колонки атрибута формы:

```xml
<Type>
  <v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>
</Type>
```

Импорт `TypeDescription` снимает XML-префикс и получает модельный тип
`ConditionalAppearance`. При экспорте `TypeDescriptionRules` не содержит такого
типа, поэтому `exportTypeDescriptionToXML` падает:

```text
Type ConditionalAppearance not found in TypeDescriptionRules
```

## Решение

Добавить `ConditionalAppearance` в `TypeDescriptionRules` как тип из namespace
`http://v8.1c.ru/8.3/data/entext`.

Это тип значения формы, который используется внутри `TypeDescription`. Его не
нужно смешивать с metadata-объектом DCS `ConditionalAppearance`, который уже
описан отдельными правилами для условного оформления.

Каноническое правило может использовать prefix `entext`, но round-trip должен
сохранять исходный XML-префикс из reference. Например, если reference содержит
`d7p1:ConditionalAppearance`, экспорт с reference должен вернуть именно
`d7p1:ConditionalAppearance` и его `xmlns:d7p1`.

## YAML

YAML остается обычным `TypeDescription`:

```yaml
Тип:
  - ConditionalAppearance
```

Отдельный YAML-формат для namespace не нужен.

## Границы

В рамках этой спеки:

- добавляется только поддержка типа `ConditionalAppearance` в
  `TypeDescriptionRules`;
- не меняется модель DCS `ConditionalAppearance`;
- не вводится сырой XML-fallback для всех неизвестных TypeDescription-типов;
- XML-фикстуры из source-репозитория не изменяются.

## Проверка

Для реализации нужны тесты:

- импорт XML с `d7p1:ConditionalAppearance` возвращает
  `type: ["ConditionalAppearance"]`;
- экспорт этой модели без reference пишет каноническое представление с namespace
  `entext`;
- экспорт с reference сохраняет исходный префикс `d7p1` и `xmlns:d7p1`;
- `round-trip --all-configs` больше не падает на форме
  `DataProcessors/АналитическийБланкСводнаяТаблица/ФормаНастройкиУсловногоОформления`.
