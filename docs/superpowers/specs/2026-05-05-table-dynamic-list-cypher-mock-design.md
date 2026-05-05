# Table DynamicList Cypher Predicate Mock Design

Дата: 2026-05-05

## Контекст

У `Table` свойства `Period` и `TopLevelParent` должны выгружаться в XML, когда `DataPath` таблицы указывает на реквизит формы с типом `DynamicList`.

Механизм уже переведён на `cypherPredicate`: перед синхронным экспортом XML результат Cypher-запроса складывается в `CypherCache`, а `shouldProcessProperty` во время обхода правил читает кеш и вызывает локальную `test`-функцию правила.

Для form-элементов уже есть общий XML-тестовый механизм через `ElementFixtures`; отдельный интеграционный тест формы для этого случая не нужен.

## Решение

Основным reproducer'ом остаётся существующая фикстура `dynamicList` в `packages/core/metadata/forms/elements/__tests__/fixtures.ts`.

Фикстура передаёт человекочитаемый мок окружения:

```ts
contextAttributes: [
  { itemType: "FormAttribute", name: "Список", type: { type: ["DynamicList"] }, columns: [] },
]
```

Тестовый помощник `packages/core/tests/element/exportElementToXML.ts` превращает `contextAttributes` в `CypherCache`. Он не поднимает графовую БД и не выполняет настоящий Cypher-запрос: element-тест проверяет XML-поведение элемента, а не работу FalkorDB.

Запрос в `TableRules` должен соответствовать текущей графовой модели:

```cypher
MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute)
WHERE "DynamicList" IN a.p_type_type
RETURN a.name AS name
```

Почему так:

- реквизиты формы связаны с формой ребром `FORM_ATTRIBUTE`, не `ATTRIBUTE`;
- простой тип `DynamicList` хранится как property узла, а не как ссылочное ребро;
- `type: { type: ["DynamicList"] }` после `flattenItem` становится `p_type_type: ["DynamicList"]`;
- локальная `test`-функция правила сравнивает найденные имена реквизитов с первой частью `Table.dataPath`.

## Тестирование

Нужны три проверки.

1. Element XML-test через существующую `dynamicList`-фикстуру:
   - `contextAttributes` содержит реквизит формы `Список` с типом `DynamicList`;
   - XML-фикстура `dynamicList.xml` ожидает `Period` и `TopLevelParent`;
   - `testExportElementToXML` мокирует `CypherCache` под новый текст запроса.

2. Unit-тест `table/cypherPredicate.test.ts` остаётся полезным как проверка локальной `test`-логики:
   - строки `[{ name: "Список" }]` включают `Period` и `TopLevelParent` для `dataPath: "Список"` и `dataPath: "Список.Поле"`;
   - строки с другим именем или пустой кеш не включают поля.

3. Графовые тесты для `TypeDescription` не должны требовать ребро `VALUE_TYPE` для простого типа `DynamicList`.
   - простые типы остаются в props узла;
   - ссылочные типы продолжают давать reference-рёбра.

## Не входит

- Не добавляем отдельный round-trip тест полной формы.
- Не поднимаем FalkorDB в element-тестах.
- Не меняем модель `TypeDescription`: простые типы остаются props, ссылочные типы остаются рёбрами.
