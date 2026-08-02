# Task 12: состояние проекта во время import

## Результат

- Import теперь ведёт отдельную двухфазную `ProjectStateImportSession`: первый проход наполняет основные индексные таблицы, затем индекс фиксируется только в памяти и становится неизменяемым.
- Каждый worker второго прохода получает отдельный одноразовый read token и уточняет deferred YAML через `ProjectStateReadSession`; прежние `componentReferenceIndex`, `metadataSnapshot` и холодные индексные снимки удалены.
- Готовый YAML сериализуется один раз, сразу записывается и хэшируется по тем же bytes. Локальная validation работает по уже разобранным данным, а окончательный YAML с диска не перечитывается.
- Окончательное состояние передаётся пачками `{ updates, hashBytes }`: один zero-offset `ArrayBuffer`, 8 big-endian байт на xxHash64, без `bigint`, `hashOffset` и индексных полей в DTO.
- После полной dependency validation записывается configuration-index и выполняется единственный checkpoint. Обычные validation errors возвращаются вызывающему коду, но не откатывают корректно записанный import; техническая ошибка отбрасывает кандидата и сохраняет прежнее состояние.

## TDD и договоры

- RED: исходный целевой прогон зафиксировал 6 ожидаемых падений на отсутствующей import session, едином потоке bytes, ранней записи и transferable DTO.
- Тест session подтверждает одинаковый неизменяемый индекс в двух независимых read sessions, запрет индексных записей после commit и сохранность lookup во время окончательных записей.
- Тесты worker/coordinator подтверждают раннюю запись готовых и сгенерированных файлов, удержание только deferred YAML, отсутствие повторного чтения, сохранение хэшей после transfer и один checkpoint после записи configuration-index.
- Итоговый связанный прогон `metadata/importFromXml` и `metadata/projectState/importSession.test.ts`: 13 файлов, 103/103.

## Сквозная проверка

- Источник `/Users/nikita/git/round-trip-compact/cf/all` использовался только для чтения; временный проект и XML-выход находились в `/private/tmp/nkdk-task12-e2e.g237Cu`.
- Import: 264 успешных элемента, 204 обычных validation diagnostics, 0 warnings. Прогретый refresh: 204 diagnostics и `changedFiles: 0`.
- Полная sync в новую пустую XML-копию: 455/455 файлов; project-state projection также содержит 455 файлов.
- SHA-256 исходной XML-выгрузки до и после совпал: `73a8da8bffa6e8cd32d3388303b64b2fe9b12c8c0335cef5598099b2ed1067a3`.
- Выборочная sync не выполнялась: публичный договор Task 11 намеренно отклоняет её с `full_xml_sync_operation_failed`; частичная sync не входит в Task 12.

## Итоговые проверки

- `pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38`: PASS, новых дубликатов нет.
- `pnpm type-check`: PASS.
- `git diff --check`: PASS.
- `pnpm test`: PASS, exit code 0; core 644 файла/5119 тестов, platform 18/165, MCP 24/138. Ограничитель длительности завершился успешно.
- Mutation testing не запускался согласно заданию.

## Оставшиеся границы

- Частичная sync по-прежнему намеренно не поддерживается.
- Долгоживущий MCP ProjectState handle остаётся границей Task 13.
