# CommandInterface: поле index

## Контекст

Round-trip reproducer `commandBarIndexInsertion` показал, что текущий `toXML` всегда добавляет `<Index>` по позиции элемента в массиве `CommandBar` или `NavigationPanel`. Это неверно: если в исходном XML `Index` отсутствует, экспорт не должен его выдумывать.

Дополнительная проверка XML из `/Users/nikita/git/round-trip-source/{small,acc,trade}` показала, что физический порядок `<Item>` в XML не является простым порядком по `Index`. `Index` выглядит как отдельный ранг элемента внутри командной группы, но точную семантику порядка элементов решаем не фиксировать в этом шаге.

## Решение

Добавить `index?: number` в модель `CommandInterfaceItem` и в YAML-представление.

Правила импорта и экспорта:

- `fromXML` читает `<Index>` в `item.index`, если тег есть.
- `toXML` пишет `<Index>` только если `item.index !== undefined`.
- `fromYAML` читает YAML-поле `Индекс` в `item.index`, если поле есть.
- `toYAML` пишет `Индекс` только если `item.index !== undefined`.

Существующую сортировку в `fromXML` по `Index` в этом изменении не трогаем. Это отдельный доменный вопрос: физический порядок XML и пользовательский порядок команд требуют отдельного анализа и отдельного решения.

## Тесты

Нужно обновить существующие фикстуры `commandInterface`, чтобы элементы с `<Index>` ожидали `index` в TS-модели и `Индекс` в YAML.

Reproducer `commandBarIndexInsertion` должен измениться так:

- `import commandBarIndexInsertion` остаётся зелёным: в XML нет `<Index>`, значит в модели нет `index`.
- `export commandBarIndexInsertion` становится зелёным: `toXML` больше не добавляет `<Index>` без `item.index`.

Дополнительно нужен тестовый случай с явным `index`, чтобы проверить, что заданный индекс сохраняется в XML и YAML.

## Границы

В этом шаге не меняем алгоритм упорядочивания элементов `CommandInterface`. Не пытаемся вычислять `Index` из позиции элемента, `CommandGroup` или порядка XML. Поле `index` является явным значением из модели.
