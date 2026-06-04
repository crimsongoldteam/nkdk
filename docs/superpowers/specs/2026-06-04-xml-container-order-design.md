# XMLContainer для порядка XML-контейнеров

## Цель

XML без reference должен сохранять порядок контейнеров, который принимает 1С: `InternalInfo`, затем `Properties`, затем `ChildObjects`. Модель metadata остаётся линейной; XML-дерево не переносится внутрь `properties` как вложенные группы.

## Контекст

В `/home/nikita/git/round-trip/all` встречаются устойчивые верхние комбинации:

- `InternalInfo > Properties > ChildObjects`;
- `InternalInfo > Properties`;
- `Properties > ChildObjects`;
- `Properties`.

Текущий `requiredXMLParents` только создаёт пустой контейнер после экспорта. Он не задаёт порядок и в реальных правилах используется только как массив путей вроде `["ChildObjects"]` и `["ListSettings"]`. Форма `{ path, tag }` есть в типе и тестах, но в `rules.ts` не используется.

Проблема видна на XML без reference: вложенные `TabularSection` могут получить `Properties`, затем `InternalInfo`, затем `ChildObjects`, хотя 1С ожидает `InternalInfo`, затем `Properties`, затем `ChildObjects`.

## Решение

Добавить XML-only property type `XMLContainer`.

Пример целевого правила:

```ts
properties: {
  internalInfo: {
    type: "InternalInfo",
    forReferenceOnly: true,
  },
  properties: {
    type: "XMLContainer",
    xml: "Properties",
    required: true,
  },
  name: {
    type: "string",
    xmlParents: ["Properties"],
    required: true,
  },
  childObjects: {
    type: "XMLContainer",
    xml: "ChildObjects",
    required: true,
  },
  attributes: {
    type: "MetadataAttributes",
    xml: "Attribute",
    xmlParents: ["ChildObjects"],
  },
}
```

`XMLContainer` не попадает в модель, YAML, enterprise и граф. Он влияет только на XML-экспорт и XML-импорт порядка.

## Поведение XMLContainer

При экспорте в XML:

- `XMLContainer` создаёт XML-узел по своему XML-имени;
- если `required: true`, узел остаётся даже пустым;
- если `required` не задан и в контейнер не попали дочерние XML-свойства, узел не создаётся;
- физический порядок ключей в `rule.properties` задаёт порядок XML-узлов;
- обычные свойства с `xmlParents: ["Properties"]` попадают в контейнер, заданный `XMLContainer`;
- если контейнер не объявлен, старое поведение `xmlParents` сохраняется на переходный период.

При импорте из XML:

- `XMLContainer` не создаёт поле модели;
- порядок ключей модели для reference продолжает восстанавливаться по XML;
- контейнеры участвуют только как ориентиры обхода, чтобы свойства внутри `Properties` и `ChildObjects` шли после соответствующего якоря.

## InternalInfo

`InternalInfo` не является контейнером и не должен описываться через `XMLContainer`. Это обычное содержательное XML-свойство с типом `InternalInfo`, обычно `forReferenceOnly: true`. Его место в XML задаётся физическим положением свойства `internalInfo` перед `properties: { type: "XMLContainer" }`.

## Замена requiredXMLParents

`requiredXMLParents` становится устаревающим механизмом. Его текущие случаи заменяются так:

- `requiredXMLParents: [["ChildObjects"]]` -> `childObjects: { type: "XMLContainer", xml: "ChildObjects", required: true }`;
- `requiredXMLParents: [["ListSettings"]]` -> `listSettings: { type: "XMLContainer", xml: "ListSettings", required: true }`.

Форма `{ path, tag }` пока не мигрируется, потому что в реальных правилах не используется. Если она понадобится позже, для `XMLContainer` можно добавить `tag`.

## Отношение к order

`order` больше не должен быть основным способом описывать порядок XML. Целевая норма: порядок берётся из физического порядка ключей в `rule.properties`.

Удалять весь `order` сразу не нужно. Сейчас он используется шире, чем `requiredXMLParents`: внутри `MetadataAttribute`, `MetadataTabularSection`, `MetadataCommand`, СКД, регистров и форм. Поэтому миграция идёт по слоям:

1. Ввести `XMLContainer` и тесты на порядок контейнеров.
2. Перевести правила, которые ломают загрузку в 1С без reference: сначала `MetadataTabularSection` и связанные правила планов счетов, планов видов расчёта и обработок.
3. Для переведённых правил физически переупорядочить ключи: `internalInfo`, `properties`-контейнер, свойства `Properties`, `childObjects`-контейнер, свойства `ChildObjects`.
4. Удалять `order` только там, где физический порядок уже полностью совпадает с XML-порядком и тест это фиксирует.

## Проверка

Нужны точечные тесты:

- `XMLContainer` создаёт пустой required-контейнер;
- `XMLContainer` не попадает в импортированную модель;
- без reference порядок XML равен `InternalInfo`, `Properties`, `ChildObjects`;
- старое `xmlParents` продолжает работать без объявленного контейнера.

После реализации прогоняется точечный набор тестов orchestration и повторная диагностика `round-trip-yaml-1c` на `all`.
