# Позиция YAML-ссылок в графе

## Контекст

`packages/cli/src/commands/updateGraph.ts` читает YAML-файлы проекта и передаёт их в `buildGraph`.
Внутри `packages/core/metadata/orchestration/` позиция ссылки уже вычисляется по YAML AST как
`positionFrom: { offset }`, но при сборке `FileGraphData` объект не доходит до `@nakidka/graph`:
`walkGraphToFileData` переносит в свойства рёбер только примитивы, а вложенный объект `positionFrom`
отбрасывается.

Нужно восстановить передачу позиции и сразу закрепить полный набор координат: `offset`, `line`,
`column`.

## Цель

Для reference-рёбер, у которых известна позиция исходного YAML-значения, записывать в граф три
примитивных свойства:

- `positionFromOffset`
- `positionFromLine`
- `positionFromColumn`

Координаты относятся к началу YAML-значения, из которого извлечена ссылка.
Если ссылка извлечена из элемента YAML-массива, координаты относятся к конкретному элементу массива,
а не к началу массива или ключа свойства.

## Не входит в задачу

- Изменение существующих XML-фикстур.
- Новые правила `fromXML/toXML/fromYAML/toYAML`.
- Смена формата узлов графа.
- Позиции для рёбер, у которых сейчас нет `positionFrom`.

## Решение

Сохраняем внутреннюю модель позиции как объект `positionFrom`, потому что она удобна для обработчиков
графа и уже используется в тестах. Расширяем этот объект до:

```ts
{
  offset: number
  line: number
  column: number
  length?: number
}
```

`parseMetadataYaml` уже возвращает `LineCounter`. `importMetadataFileWithGraph` должен передавать
его вместе с корневым `yamlMap` в `buildGraphFromModel`. `computeValuePosition` будет принимать
`LineCounter` и вычислять строку/столбец через `lineCounter.linePos(offset)`.

Для массивов используется тот же принцип: per-element расчёт позиции должен брать `range[0]`
конкретного элемента YAML-последовательности и дополнять его строкой/столбцом через тот же
`LineCounter`. Уже существующий `findSeqItemOffset` остаётся основой для поиска `offset`, но
результат должен стать полной позицией.

На границе `walkGraphToFileData` вложенный объект разворачивается в свойства `EdgeData.props`.
Так графовый пакет продолжит получать только примитивы, совместимые с FalkorDB.

## Поток данных

1. `updateGraph.ts` читает YAML как текст без изменений.
2. `buildGraph` вызывает `importMetadataFileWithGraph`.
3. `importMetadataFileWithGraph` парсит YAML, получает `yamlMap` и `lineCounter`.
4. `buildGraphFromModel` передаёт `lineCounter` в расчёт позиции свойства.
5. `GraphBuilder` хранит `positionFrom` на внутреннем ребре.
6. `walkGraphToFileData` пишет в `EdgeData.props` плоские поля `positionFromOffset`,
   `positionFromLine`, `positionFromColumn`.
7. `@nakidka/graph.updateGraph` записывает эти свойства обычным путём через `mergeEdges`.

## Ошибки и крайние случаи

Если у YAML-узла нет `range`, позиция остаётся `undefined`, а поля позиции в граф не попадают.
Если `lineCounter` не передан, позиция также не вычисляется полностью; для нового пути импорта графа
это считается ошибкой покрытия тестами, а не отдельным режимом работы.

Строка и столбец берутся в нотации библиотеки `yaml`: 1-based координаты, совпадающие с диагностикой
валидации в проекте.

## Тестирование

Нужны точечные тесты:

- `computeValuePosition` возвращает `offset`, `line`, `column` для простого YAML.
- Позиция ссылки внутри YAML-массива указывает на конкретный элемент массива и содержит
  `offset`, `line`, `column`.
- `buildGraph` или `importMetadataFileWithGraph` сохраняет расширенный `positionFrom` на внутреннем
  reference-ребре.
- `walkGraphToFileData` разворачивает `positionFrom` в три примитивных свойства рёбер.

Перед закрытием задачи требуется `pnpm test` из корня проекта.
