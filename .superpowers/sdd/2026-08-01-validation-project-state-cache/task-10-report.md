# Task 10: поиск ссылок и переименование через ProjectState

## Результат

- `findMetadataReferences` выполняет один обязательный `refreshAndValidate`, затем пакетно разрешает цель и ссылки через read session.
- `renameMetadataItem` строит план только по исходному YAML и YAML найденных ссылок; preview выполняет один refresh, запись — refresh до и после изменения.
- Error diagnostics по умолчанию блокируют операции. `ignoreValidationErrors: true` сохраняет diagnostics; поиск дополнительно возвращает warning `search_result_may_be_incomplete`.
- Ссылки содержат точный `projectPath` и `yamlPath`; MetadataTarget берутся из `pending_references`, DataPath разрешаются пакетно из сохранённых фактов владельцев, полей и форм без чтения всего YAML-проекта.
- После начавшейся записи второй refresh выполняется и при ошибке следующего шага; его техническая ошибка имеет приоритет.
- Структурные ссылки одного YAML индексируются и материализуются одной пачкой, без повторного обхода на каждую ссылку; видимость cf не включает обращения из cfe.

## TDD

- RED: `pnpm --filter @nkdk/core test -- metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts metadata/projectState/sqlite/store.test.ts` — 16 ожидаемых падений, 5069 успешных тестов.
- GREEN: целевой итоговый прогон восьми файлов операций, контрактов ProjectState, SQLite и validation — 8 файлов, 122 теста, все успешны.
- Изолированный итоговый прогон тестов операций: 28 тестов, 312 мс; отдельные проверки занимали 1–26 мс, включая пачку из 100 ссылок за 26 мс.

## Проверки

- `pnpm type-check` — успешно.
- `pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38` — успешно, новых дубликатов нет.
- Полная команда 1: `pnpm test` — 5085/5085 functional PASS, затем массовый duration-gate failure; setup пакета 16909,77 мс при лимите 3000 мс.
- Полная команда 2: `pnpm test` — 5085/5085 functional PASS, затем повторный массовый duration-gate failure.
- Полная команда 3: `pnpm --workspace-concurrency=1 -r run test --maxWorkers=1` — 5085/5085 functional PASS, затем повторный массовый duration-gate failure; `maxWorkers: 1` также уже задан в `vitest.config.ts`, тесты и пороги не менялись.
- После полных прогонов независимая проверка выявила квадратичную обработку ссылок; исправление пакетной материализации и отдельная проверка границы cf→cfe подтверждены итоговыми targeted 122/122, `type-check`, jscpd и `git diff --check`. По указанию контроллера четвёртый полный прогон не запускался.
- Mutation testing не запускался согласно заданию.
