# FormAttribute round-trip с колонками

Дата: 2026-05-06

## Контекст

Short round-trip формы показал три связанных расхождения в `FormAttribute` с колонками:

- `id` колонок пересчитываются глобально по форме, хотя уникальны только внутри одного `Attribute`.
- Порядок `<Type>` и `<Columns>` меняется при экспорте, хотя round-trip должен сохранять исходный XML байт-в-байт.
- Пустой `<Type/>` у колонки теряется, хотя для самого `FormAttribute` уже используется подход с пустым XML-тегом без отдельного состояния в модели.

Целевой модуль: `packages/core/metadata/forms/commonObjects/formAttribute`.

## Цели

- Сохранять `id` колонок по `name` внутри конкретного `Attribute`.
- Сохранять исходный порядок XML-свойств `FormAttribute` через reference-значения.
- Экспортировать пустой `<Type/>` для колонки без `type` по аналогии с `FormAttribute.type`.
- Перенести новые XML/TS reproducer'ы в локальный `__fixtures__` целевого модуля и оформить их по новым правилам: один slug, один XML, один TS-файл, один именованный экспорт.

## Не цели

- Не менять YAML-представление `FormAttribute`.
- Не вводить отдельное доменное состояние для пустого `TypeDescription`.
- Не переписывать весь механизм `orchestration` шире, чем нужно для областей нумерации и reference-порядка.
- Не оставлять новые reproducer'ы в `packages/core/tests/fixtures/formAttributes`.

## Решение 1: области нумерации

Текущий `setIdsToElements` работает с одним общим списком `metadataForNumbering`, поэтому `FormAttributeColumn` получает следующий свободный `id` после всех предыдущих элементов формы. Это неверно для колонок атрибута: их `id` уникальны только внутри родительского `Attribute`.

Нужно расширить запись в `metadataForNumbering` понятием области нумерации. Для `FormAttributeColumn` областью является родительский `FormAttribute`; для остальных элементов сохраняется существующее поведение. `setIdsToElements` должен группировать записи по области:

1. Внутри группы сначала занять `id` из `referenceElement`, если он есть.
2. Затем назначить новым элементам свободные локальные `id`, начиная с `1`.
3. Сопоставление reference-колонок остаётся по `name` внутри своего `Attribute`.

Проверки:

- `tableWithColumns.xml` и `treeWithColumn.xml` должны ожидать `Column id="1"`.
- `twoTables.xml` должен закреплять две таблицы, где в каждой первая колонка имеет `id="1"`.

## Решение 2: порядок `Type` и `Columns`

Round-trip должен сохранять исходный порядок XML-свойств. Для примера из формы это означает, что если исходный XML содержит `<Type>` перед `<Columns>`, экспорт должен вернуть тот же порядок.

Решение: использовать reference-значения. Импорт `FormAttribute` должен сохранять порядок XML-свойств в данных, которые затем доступны как `referenceMetadata`. `getOrderedKeysToXML` уже учитывает порядок ключей reference-модели; задача реализации - гарантировать, что для `FormAttribute` этот порядок действительно соответствует исходному XML, включая относительную позицию `type` и `columns`.

Если reference-значения нет, экспорт остаётся на обычном порядке правил.

Проверки:

- Fixture с `ValueTable`, где `<Type>` идёт перед `<Columns>`, должен экспортироваться в том же порядке.
- Существующие round-trip fixture не должны получить новый канонический порядок вместо исходного reference-порядка.

## Решение 3: пустой `Type` у колонки

Для `FormAttribute.type` уже принят подход: пустой `<Type/>` импортируется как отсутствие `type` в модели, а экспорт может восстановить пустой тег через `defaultValueXMLRaw: {}`.

Для `FormAttributeColumnRules.type` нужно повторить этот подход: добавить `defaultValueXMLRaw: {}`. Модель колонки без типа остаётся без поля `type`, но XML-экспорт пишет `<Type/>`.

Проверки:

- `attributeAnyType.xml` фиксирует существующий подход для самого `FormAttribute`.
- `columnAnyType.xml` фиксирует новый случай для `FormAttributeColumn`: атрибут имеет `type: ValueTable`, колонка не имеет `type`, экспорт возвращает `<Type/>` у колонки.

## Fixture-структура

Новые reproducer'ы должны находиться рядом с целевым модулем:

- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/twoTables.xml`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/twoTables.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/attributeAnyType.xml`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/attributeAnyType.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/columnAnyType.xml`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/columnAnyType.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/tableWithColumns.xml`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/tableWithColumns.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/treeWithColumn.xml`
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/treeWithColumn.ts`

Общие fixture из `packages/core/tests/fixtures/formAttributes` после переноса не должны оставаться источником для этих новых XML round-trip тестов.

Каждый TS-файл содержит ровно один именованный экспорт с именем slug и типизацией:

```typescript
import type { FormAttributes } from "../types"

export const twoTables = [
  // expected model
] as const satisfies FormAttributes
```

## Тесты

`fromXML.test.ts` и `toXML.test.ts` целевого модуля должны читать локальные `__fixtures__` через `importMetaUrl: import.meta.url`, как в новых metadataItem-тестах.

Для каждого slug добавляется пара:

- `it("import <slug>")`
- `it("export <slug>")`

Минимальный обязательный набор:

- `twoTables`
- `attributeAnyType`
- `columnAnyType`
- `tableWithColumns`
- `treeWithColumn`

## Риски

- Области нумерации затрагивают общий экспорт формы. Нужно держать изменение совместимым: без явно заданной области поведение остаётся прежним.
- Reference-порядок должен быть локальным для XML round-trip и не должен протекать в YAML или пользовательскую модель.
- `defaultValueXMLRaw: {}` у колонки может начать экспортировать `<Type/>` для колонок, у которых раньше тег отсутствовал. Это принято как проектный подход, согласованный по аналогии с `FormAttribute.type`.

## Критерии готовности

- Узкие import/export тесты для новых slug проходят.
- `tableWithColumns` и `treeWithColumn` экспортируют локальные `id` колонок.
- `twoTables` экспортирует `Column id="1"` независимо в каждом `Attribute`.
- `columnAnyType` экспортирует пустой `<Type/>` у колонки без `type`.
- Порядок `<Type>` / `<Columns>` сохраняется из reference XML.
