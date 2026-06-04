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
- если контейнер не объявлен, `xmlParents` продолжает создавать путь к XML-значению, но порядок такого пути определяется физическим положением первого свойства с этим путём.

При импорте из XML:

- `XMLContainer` не создаёт поле модели;
- порядок ключей модели для reference продолжает восстанавливаться по XML;
- контейнеры участвуют только как ориентиры обхода, чтобы свойства внутри `Properties` и `ChildObjects` шли после соответствующего якоря.

## InternalInfo

`InternalInfo` не является контейнером и не должен описываться через `XMLContainer`. Это обычное содержательное XML-свойство с типом `InternalInfo`, обычно `forReferenceOnly: true`. Его место в XML задаётся физическим положением свойства `internalInfo` перед `properties: { type: "XMLContainer" }`.

## Замена requiredXMLParents

`requiredXMLParents` удаляется. Его текущие случаи заменяются так:

- `requiredXMLParents: [["ChildObjects"]]` -> `childObjects: { type: "XMLContainer", xml: "ChildObjects", required: true }`;
- `requiredXMLParents: [["ListSettings"]]` -> `listSettings: { type: "XMLContainer", xml: "ListSettings", required: true }`.

Форма `{ path, tag }` удаляется вместе с `requiredXMLParents`, потому что в реальных правилах не используется. Если она понадобится позже, для `XMLContainer` можно добавить `tag`.

## Отношение к order

`order` остаётся способом явно описывать порядок XML-свойств внутри одного XML-пути. Это важно для общих spread-блоков вроде `commonTabularSectionProperties`, где физический порядок ключей в конкретном `MetadataItemRule` не всегда совпадает с XML-порядком.

`XMLContainer` отвечает только за порядок и обязательность XML-контейнеров: `InternalInfo`, `Properties`, `ChildObjects`, `ListSettings`. Внутри контейнера порядок по-прежнему может задаваться `order`; если `order` не указан, используется существующий порядок ключей правила с учётом reference.

1. Ввести `XMLContainer` и тесты на порядок контейнеров.
2. Перевести все правила с `requiredXMLParents` на `XMLContainer`.
3. Сохранять `order` в правилах, где он уже нужен для порядка XML-свойств внутри контейнера.
4. Оставить reference-порядок главным для round-trip с reference, но без reference использовать порядок контейнеров из `XMLContainer` и порядок свойств из `order`/ключей правил.

## Проверка

Нужны точечные тесты:

- `XMLContainer` создаёт пустой required-контейнер;
- `XMLContainer` не попадает в импортированную модель;
- без reference порядок XML равен `InternalInfo`, `Properties`, `ChildObjects`;
- старое `xmlParents` продолжает работать без объявленного контейнера.

После реализации прогоняется точечный набор тестов orchestration и повторная диагностика `round-trip-yaml-1c` на `all`.
