# Результат изоляции и ограничения длительности тестов

## Договор

- Обязательный предел: test case — 50 мс, test file с hooks — 1 000 мс, setup пакета — 3 000 мс.
- Unit-тест выполняется только в памяти. Ему прямо запрещены сеть, базы данных, файловая система, процессы и настоящие worker; все такие зависимости заменяются mock, fake или портом.
- Тест с настоящим адаптером получает имя `*.integration.test.ts` и запускается отдельным Vitest project без unit guard.
- Статическая проверка запрещает внешние импорты в unit-файлах, а runtime guard перехватывает вызовы, пришедшие через production-код или тестовые помощники.

## Исходная диагностика

| Группа | Исходный максимум |
| --- | ---: |
| runtime configuration index | 111,33 мс |
| rules native | 394,47 мс |
| MCP `syncToInfobase` | 11 836,80 мс |
| Russian metadata lifecycle | 5 411,65 мс |

## Изменения покрытия

- 296 тестовых путей переклассифицированы в integration. Причина едина: фактическое чтение XML/YAML, LMDB, временные каталоги, worker, процессы или другой настоящий адаптер. XML-фикстуры не изменялись.
- `runtime/configurationIndex/store.test.ts` разделён на быстрый in-memory contract и две integration-проверки: обычные операции LMDB и атомарная публикация поколения.
- Добавлены четыре независимых договора анализатора: прямой запрет, варианты файловых/сетевых/database/worker импортов, разрешение integration и защита от ложных совпадений.
- Добавлена проверка общего unit guard: запрещённые вызовы файловой системы, сети, БД, процессов и worker завершаются понятной ошибкой.
- Добавлена integration-проверка исходной точки MCP-сервера; она отделяет файловый договор сборки от unit-поведения сервера.
- Удалён полный `syncToInfobase.integration.test.ts`: его договоры публикации, повторного finalize, подтверждённого отказа, неизвестного результата, очереди и расширения перенесены в быстрый stateful fake. ZIP, LMDB pending state и публикация индекса остаются защищены integration-тестами rules.
- Узкий `forbidRealPiscina` удалён, поскольку его договор полностью включён в общий runtime guard.

## Итоговые длительности

Медианы трёх подтверждающих прогонов затронутых групп:

| Проверка | Медиана |
| --- | ---: |
| runtime `storePublication.integration.test.ts` | 776 мс на файл |
| rules `importConfigurationExtension.integration.test.ts` | 944 мс на файл |
| rules `fullSyncToXml/worker.integration.test.ts` | 601 мс на файл |
| rules `russianMetadataReferences.integration.test.ts` | 481 мс на файл |
| MCP `syncToInfobase.test.ts` | 5 мс на файл |

Во всех трёх запусках test cases остались в пределах 50 мс, файлы — 1 000 мс, setup — 3 000 мс. Предупреждения цели 10 мс сохранены как ориентир и не ослабляют обязательные пределы.

## Проверка

- `pnpm test:unit-boundaries` — PASS, запрещённых unit-зависимостей нет.
- `pnpm test:isolated` — PASS.
- `pnpm type-check` — PASS.
- `pnpm test` — PASS: platform 213, runtime 307, rules 7 104 и MCP 189 пройденных тестов; два платформозависимых MCP-сценария пропущены штатно.
- Затронутые unit/native/integration группы rules повторены с тремя seed — PASS.
- `pnpm test:architecture:rules` — PASS, 66 тестов.
- `pnpm test:architecture` — PASS, новых нарушений и циклов нет; baseline не изменялся.
- `pnpm duplicates -- --base a2156676f` — новых дубликатов нет.
