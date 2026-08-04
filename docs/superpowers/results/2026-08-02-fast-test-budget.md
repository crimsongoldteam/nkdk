# Результат внедрения бюджета тестов

## Итог

- Исходная длительность полного прогона: 10–15 минут.
- Итоговая длительность `pnpm test`: 12,35 с.
- Проверено 686 файлов и 5380 тестов: `core` — 644/5078, `platform` — 18/165, `mcp` — 24/137.
- Подготовка пакета `core`: 1,99 с при пределе 3 с.
- Ни один тест не превысил 50 мс, ни один файл — 1000 мс.
- Mutation testing не запускался по решению пользователя.

Пакеты проверяются последовательно, чтобы измерения одного пакета не искажались нагрузкой другого. Внутри `core` сохраняются `--no-isolate` и случайный порядок тестов.

## Самые долгие файлы

Контрольный прогон `core` без параллельной нагрузки:

| Время, мс | Файл |
| ---: | --- |
| 832 | `metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts` |
| 559 | `metadata/validation/projectFileSchema.test.ts` |
| 537 | `metadata/validation/schemaRegistry.test.ts` |
| 509 | `metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts` |
| 307 | `metadata/projectState/sqlite/readSession.test.ts` |
| 274 | `metadata/projectState/compatibility.test.ts` |
| 237 | `metadata/importBoundaries.test.ts` |
| 209 | `metadata/appliedObjects/__tests__/directRoundTrip.test.ts` |
| 181 | `metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts` |
| 168 | `metadata/forms/elements/__tests__/fromXMLToYAML.test.ts` |

## Самые долгие случаи

В том же контрольном прогоне:

| Время, мс | Проверка |
| ---: | --- |
| 45,58 | остановка новых задач и ожидание начатой записи после ошибки раздела |
| 29,37 | точный YAML → XML для полного `MetadataCatalog` |
| 27,39 | строгая JSON Schema доступных значений DCS |
| 26,76 | чтение владельца и страниц нужного вида при проверке зависимостей |
| 23,93 | отмена соседних задач после ошибки инициализации |
| 19,87 | обнаружение файлов проверки для всех верхнеуровневых объектов |
| 19,44 | атомарная публикация файла без оставшегося временного файла |
| 19,05 | обнаружение ресурсов всех верхнеуровневых объектов |
| 17,28 | JSON Schema строки со ссылкой на метаданные |
| 16,30 | построение `BaseForm` заимствованной общей формы |

## Обязательные проверки

- `pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38` — пройдено.
- `pnpm type-check` — пройдено.
- `pnpm build` — пройдено.
- `/usr/bin/time -p pnpm test` — пройдено, `real 12.35`.
