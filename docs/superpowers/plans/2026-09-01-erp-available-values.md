# План чистого ERP round-trip

**Цель:** устранить обнаруженные полным ERP round-trip потери XML и ложный diff
служебного файла, не изменяя XML-фикстуры и не вводя новые виды `!xml`.

**Спецификация:** `docs/superpowers/specs/2026-09-01-erp-available-values-design.md`

## Выполненные слои

- [x] Добавить регрессию и включить `repeatedXMLNodes` для `DcsAvailableValues`.
- [x] Добавить регрессию и локализовать `AdditionalColumns` через корректный `rulePath`.
- [x] Добавить регрессии разбора и worker-переноса двойных кавычек `!xml/invalid`.
- [x] Добавить регрессию и сохранить присутствующий пустой `RootCommandInterface`.
- [x] Проверить полный набор интеграционных тестов rules и type-check изменённых пакетов.
- [x] Проверить чистый round-trip конфигурации `doc`.
- [x] Выполнить ERP round-trip и классифицировать четыре оставшихся предупреждения.
- [x] Добавить тест и сохранить `.nakidka-migrations.yaml` как reference-only файл.

## Завершающая проверка

- [x] Повторить итоговый ERP round-trip обновлённым навыком.
- [x] Выполнить `pnpm duplicates -- --base origin/develop`.
- [x] Выполнить `pnpm test:architecture:rules` и `pnpm test:architecture`.
- [x] Выполнить `pnpm test`.
- [x] Проверить итоговый diff и создать коммит.
