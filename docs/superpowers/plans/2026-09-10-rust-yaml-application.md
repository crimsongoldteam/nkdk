# Этап В: проектные операции, MCP и окончательный отказ от TypeScript — план реализации

> **Для исполнителя:** использовать `superpowers:executing-plans`, без субагентов. Вход — принятый этап Б. Выполнять В1–В6 последовательно. Публикация, merge и действия с рабочими базами пользователя не входят в автоматическое исполнение.

**Goal:** Перенести на Rust оставшиеся функции приложения, подтвердить совместимость и производительность, затем удалить TypeScript и зависимость конечных сборки/тестов от Node.js.

**Architecture:** Project runtime выполняет операции над компактными индексами и файлами через нейтральные порты; generated-rules подключается в композиции приложений. Platform управляет внешними процессами/сеансами. MCP является адаптером существующих контрактов к этим же операциям, без промежуточного TS-процесса.

**Tech Stack:** Crates project-runtime/platform, приложения nkdk/nkdk-mcp, Cargo CI и Rust dev-tools. JSON допустим на границе MCP и отчётов. Выбор конкретных системных адаптеров проверяется на действующих форматах и поддерживаемых ОС перед включением зависимости.

**Spec:** [Единая спецификация деклараций](../specs/2026-09-10-declaration-language-design.md), D-02, D-03, D-16, D-20–D-24; [архитектура действующих операций](../../../.agents/architecture.md), [ограничения](../../../.agents/restrictions.md). Все условия [главного плана](2026-09-10-rust-yaml-declarations.md) обязательны.

## Файлы и проверяемая граница

| Файлы | Ответственность |
|---|---|
| `rust/crates/project-runtime/src/{lib,ports,import,validation,publication}.rs` | Импорт/проверка проекта и публикация файлов |
| `rust/crates/project-runtime/src/state/{mod,cache,snapshot,migration}.rs` | Различение восстановимого кэша и данных точного восстановления |
| `rust/crates/project-runtime/src/{sync,rename,references,operations}.rs` | Общие пользовательские операции и фоновые состояния |
| `rust/crates/platform/src/{lib,process,local,ssh,session}.rs` | Адаптеры процессов и жизненный цикл соединений |
| `rust/apps/nkdk/src/{main,composition,commands}.rs` | Сборка каталога, runtime и платформы, самостоятельный CLI |
| `rust/apps/mcp/src/{main,contracts,tools,resources,prompts,transport}.rs` | Существующие MCP-контракты и транспорты |
| `rust/tools/dev/src/{public_contracts,performance,acceptance,no_ts}.rs` | Проверка покрытия API, измерений и итоговой сборки |
| `tests/migration/public-contracts.json` | Проверенный исходный каталог tools/resources/prompts/CLI и операций |
| `tests/project-corpus/`, `tests/platform-corpus/`, `tests/mcp-corpus/` | Независимые входы, результаты и последовательности событий |
| `tests/performance/e2e-scenarios.json` | Входы, параметры, ревизии, команды и счётчики измерений |
| `.github/workflows/rust.yml`, `README.md` | Итоговые команды сборки/проверки и поддерживаемые способы запуска |

Приложение сохраняет действующий публичный MCP API. Новые технические CLI-команды для приёмки:

```text
nkdk project import --xml DIR --output DIR --component cf|cfe/NAME
nkdk project export --project DIR --output DIR --component cf|cfe/NAME
nkdk project validate --project DIR
nkdk-dev project-corpus run --manifest PATH
nkdk-dev platform-corpus run --manifest PATH
nkdk-dev mcp-corpus run --manifest PATH --server PATH
nkdk-dev benchmark --manifest PATH --output DIR
nkdk-dev acceptance --manifest PATH --without-node
```

Эти CLI определяются и тестируются в соответствующих задачах. Каждый manifest перечисляет case-id/сценарии явно; отсутствие обязательного теста или пустой набор даёт ошибку. Коды возврата: 0 — проверенный успех, ненулевой — отказ/неполное покрытие; точные пользовательские ошибки сохраняют действующий контракт.

### В1. Перенести импорт/валидацию проекта и состояние

**Files:** project-runtime/import.rs, validation.rs, publication.rs, state/*.rs; tests/project-corpus/manifest.json; project-runtime/tests/project_operations.rs. Читать packages/runtime/metadata/configurationIndex, projectState, projectDefinition и пакеты services MCP для project-cache/import/validation.

**Interfaces:** project-runtime принимает порт каталога: выбор EntryId, подготовку facts, convert_file, validate_file и resource contributions из этапов А/Б. Порт возвращает типизированные планы, не живые объекты TS; конкретный каталог связывается в apps/nkdk/src/composition.rs.

- [ ] Перечислить реально сохраняемые файлы .nkdk, версии и обязательные сведения восстановления в public-contracts.json. Разделить project-state cache, configuration-index/snapshot и журнал операций. Сброс кэша не удаляет данные обратимости.
- [ ] Добавить временный проект из e2e: импорт cf, отдельное cfe с базой, экспорт из нового процесса, повторная validation без изменения файлов, изменение одного языка. Ожидания записать из текущих операций; исходные e2e не переписывать.
- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-project-runtime --test project_operations`; реализовать компактную подготовку facts и ограниченную очередь файлов. Бюджет ограничивает суммарные входные/выходные буферы, а не только число потоков; shared индексы не копируются каждому работнику.

  ```rust
  #[test]
  fn cache_reset_preserves_reconstruction_state() {
      let report = run_project_case("reset-cache-then-new-process-export");
      assert!(report.snapshot_unchanged);
      assert!(report.xml_matches && report.diagnostics_match);
  }
  ```

  `run_project_case(&str) -> ProjectCaseReport` — helper integration-теста с временным каталогом и настоящим Rust-процессом. Поля отчёта snapshot_unchanged/xml_matches/diagnostics_match проверяют хэши до/после и независимые ожидания, а не приватные структуры.

- [ ] Реализовать чтение существующего состояния либо явную версионированную миграцию с резервной копией и атомарной публикацией. Несовместимая версия сообщает ошибку до записи; нельзя считать snapshot пересоздаваемым кэшем. После прерывания до публикации предыдущий снимок остаётся пригодным.
- [ ] Учитывать при измерении фактов и преобразования каждый проход XML. При необходимости предварительного прохода не сохранять DOM всего проекта: компактные факты общие, удерживаемые буферы ограничены бюджетом; повторный разбор входит в время операции.
- [ ] Получить зелёный project-corpus, выполнить проверки слоя и коммит. Состояние после нового процесса обязательно проверяется отдельно от повторного вызова в той же памяти.

### В2. Перенести sync, rename, references и фоновые операции

**Files:** project-runtime/{sync,rename,references,operations}.rs; project-runtime/tests/project_mutations.rs; tests/project-corpus/cases/; читать MCP services syncToXml, initSyncState, renameItem, findReferences, backgroundOperation* и соответствующие runtime-потребители.

**Interfaces:** методы каталога для reference occurrences и resource topology получены из тех же деклараций. Состояния фоновой операции: queued/running/completed/failed/cancelled и идентификаторы отображаются в точном публичном договоре исходного приложения.

- [ ] Создать независимые случаи полного/частичного sync, изменения одного файла, удаления объекта, rename со ссылками, поиска ссылок, отмены до и во время публикации, восстановления после аварийного завершения. Ограничения текущих неподдержанных случаев сохраняются явно.
- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-project-runtime --test project_mutations`; реализовать построение плана изменений отдельно от публикации, используя факты и occurrences из каталога.

  ```rust
  #[test]
  fn cancellation_does_not_publish_a_partial_rename() {
      let report = run_mutation_case("cancel-rename-before-publish");
      assert_eq!(report.changed_files, 0);
      assert_eq!(report.final_status, "cancelled");
  }
  ```

  `run_mutation_case(&str) -> MutationCaseReport` — helper integration-теста с управляемой точкой отмены перед публикацией; поля changed_files и final_status проверяются по файлам и публичному журналу. Добавить отдельный случай сбоя после одного шага публикации с восстановлением/откатом согласно принятому договору.

- [ ] Проверить, что rename не вызывает отдельный повторно написанный metadata resolver. Инвалидировать зависимые проверки и topology по заявленным в декларации вкладам; неизменённые файлы не перепарсивать без причины.
- [ ] Прогнать project-corpus целиком и новые процессные случаи; проверки слоя и коммит. Не удалять старые TS-тесты до перехода CI в В6.

### В3. Перенести платформенные сеансы и вспомогательные проекции

**Files:** platform/src/*.rs; platform/tests/{session_contract,process_io}.rs; tests/platform-corpus/manifest.json. Источники: packages/platform/src/sessions и их test-файлы.

**Interfaces:** PlatformSession — нейтральный порт процесса/соединения, получает типизированную команду и возвращает последовательность output/error/exit; имена и аргументы команд определяются текущими contracts.ts/commands.ts. Generated-rules предоставляет нужное представление данных, а не готовый shell-код.

- [ ] Зафиксировать командные аргументы, quoting, кодировки, журнал stdout/stderr, тайм-ауты, отмену, очистку временных файлов, повторное использование и закрытие сеансов. Внести поддерживаемые платформы/локальные и SSH-режимы из текущих контрактов в public-contracts.json.
Enterprise / `toEnterprise` исключены из реализации по решению пользователя. Дополнительное представление, его декларации и тесты не требуются; поддерживаемые преобразования — только XML ↔ YAML.
- [ ] Создать in-memory тесты протокола/состояний и отдельные integration-тесты реального дочернего тестового процесса. Для SSH использовать изолированный тестовый endpoint/управляемый транспорт, а не рабочие соединения пользователя.

  ```rust
  #[test]
  fn closing_a_session_reaps_its_process() {
      let report = run_platform_case("close-active-session");
      assert!(report.child_exited && report.temporary_files_removed);
      assert_eq!(report.open_sessions, 0);
  }
  ```

  `run_platform_case(&str) -> PlatformCaseReport` — helper process_io.rs, который запускает специальный дочерний тестовый бинарник; поля child_exited/temporary_files_removed/open_sessions сверяются после завершения. Реализация не выполняет команду над пользовательской информационной базой.

- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-platform --all-targets`; реализовать Rust-адаптеры, затем platform-corpus. Проверить границы stderr/ошибок и сохранение кодов выхода.
- [ ] Приёмку реального ibcmd/агента 1С выполнять на изолированной e2e-базе по существующему тестовому договору. Если нужная среда недоступна, фиксировать непроверенное покрытие; нельзя объявлять платформу полностью перенесённой по фейкам. Проверки слоя и коммит.

### В4. Перенести MCP с сохранением всех публичных контрактов

**Files:** apps/mcp/src/*.rs; apps/mcp/tests/{contracts,transport}.rs; tests/mcp-corpus/manifest.json; dev/public_contracts.rs. Источники: packages/mcp/src/tools/registerTools.ts, contracts, prompts, guides, transport integration-тесты.

**Interfaces:** Rust-MCP вызывает те же project/platform-операции, что CLI. Входные и выходные схемы, фоновый operationId, ошибки и ресурсы сохраняются; допустимые значения проверяются на границе JSON-RPC.

В проверенной базе зарегистрированы 18 tools: `nkdk.get_schema`, `nkdk.describe_project_structure`, `nkdk.list_infobases`, `nkdk.list_infobase_extensions`, `nkdk.validate_project`, `nkdk.reset_project_cache`, `nkdk.rebuild_project_cache`, `nkdk.import_from_xml`, `nkdk.import_from_infobase`, `nkdk.sync_to_infobase`, `nkdk.close_platform_connection`, `nkdk.close_all_platform_connections`, `nkdk.sync_to_xml`, `nkdk.get_operation`, `nkdk.cancel_operation`, `nkdk.init_sync_state`, `nkdk.rename_item`, `nkdk.find_references`. Перед переносом реестр заново сверяется с ревизией исполнения; список 18 не заменяет учёт resources/prompts и транспортов.

- [ ] Сохранить независимые request/response/notification последовательности текущих tests в mcp-corpus: initialization, список возможностей, happy/error tools, фоновые start/get/cancel, ресурсы и prompts, legacy/modern stdio/HTTP в пределах текущей поддержки.
- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-mcp --all-targets`; получить содержательные несовпадения контрактов, реализовать Rust адаптеры без вызова TS-сервера.

  ```rust
  #[test]
  fn exported_tools_match_the_recorded_public_contract() {
      let expected = recorded_tool_names();
      let actual = query_rust_tool_names();
      assert_eq!(actual, expected);
  }
  ```

  `recorded_tool_names() -> BTreeSet<String>` читает include_bytes реестра; `query_rust_tool_names() -> BTreeSet<String>` в transport integration-тесте обращается к запущенному тестовому серверу. Набор имён дополняется сравнением входных/выходных схем и реальных ответов, он сам по себе недостаточен.

- [ ] Проверить сохранение safety-флагов вроде allowWrite, путей компонентов cf/cfe и cancellation. Ошибочная команда не должна выполнять побочный эффект до отказа контракта.
- [ ] Выполнить mcp-corpus против Rust и зафиксированного TS отдельно; проверить поведение stdio без постороннего текста в stdout и HTTP-сеансы. Затем workspace tests, архитектурные проверки, дубли и коммит.

### В5. Подтвердить производительность законченных операций

**Files:** tests/performance/e2e-scenarios.json; dev/performance.rs; dev/tests/performance_contract.rs; `docs/superpowers/reports/2026-09-10-rust-yaml-performance/`.

**Interfaces:** benchmark manifest задаёт сценарий, ревизии, бинарники, команды и argv, хэши входов, число прогонов, условия кэша, критерии эквивалентности и результаты времени/RSS. Запуск использует argv, а не небезопасную интерполяцию команды shell.

- [ ] Зафиксировать производственные сборки TS и Rust с одинаковым функциональным покрытием. Сценарии: полный XML→YAML для cf, cfe+base, YAML→XML и отдельная validation. Для cf/cfe включить аномальные случаи e2e; других конфигураций пока не брать. Внешнее время исполнения 1С измерять отдельно от конвертера.
- [ ] Добавить тест методики на фиктивных процессных результатах: нормализация единиц RSS, учёт дочерних процессов эталона, отсутствие/ненулевой exit, неверный выход, неполная серия. Для TS-воркеров максимум одного процесса не выдавать за память всего дерева процессов; метод агрегирования зафиксировать одинаково.

  ```rust
  #[test]
  fn fast_but_incorrect_run_is_not_a_successful_measurement() {
      let report = evaluate_benchmark_fixture("wrong-output-fast-run");
      assert!(!report.accepted);
      assert!(report.speedup.is_none());
  }
  ```

  `evaluate_benchmark_fixture(&str) -> BenchmarkReport { accepted: bool, speedup: Option<f64> }` — helper проверки отчёта на заранее заданных результатах. Корректность каждого реального прогона подтверждается до включения его в сравнение.

- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-dev --test performance_contract`, затем `nkdk-dev benchmark --manifest tests/performance/e2e-scenarios.json --output <новый-каталог>`. Сделать пять отдельных прогонов каждого варианта с чередованием порядка; входы и выходы расположить на сопоставимом носителе.
- [ ] Измерять end-to-end от запуска до завершения записи: чтение, факты, разбор, преобразование, proof, диагностика и публикация входят в операцию. Отдельно записать cold-process и повторный процесс/тёплый кэш; не называть неизменённый файловый кэш холодным. Принудительный GC у TS не вводить для улучшения сравнения.
- [ ] Для каждого сценария сравнить медианы wall-time и суммарный пиковый RSS: `rust/ts <= 0.10` по обоим показателям. Записать разброс всех прогонов, размер бинарника, время сборки и фактическое число чтений/выделений/lookup. Сумма несинхронных индивидуальных пиков не является измеренным пиком дерева процессов.
- [ ] Если цель не достигнута, профилировать доминирующую стадию и оптимизировать общие механизмы по одному изменению: буферы/интернирование, пакетный lookup, повторный разбор, очередь файлов, сравнение proof, запись. После изменения снова выполнить соответствующий корпус корректности и ту же серию. Проверки/аннотации/IO не исключать из измеряемой операции.
- [ ] Сохранить воспроизводимый отчёт; при недостигнутых 10× оставить приёмку производительности открытой. Успешный e2e не объявлять доказательством скорости на больших конфигурациях вне измерений. Проверки слоя и коммит.

### В6. Переключить сборку, удалить TypeScript и провести итоговую приёмку

**Files:** .github/workflows/rust.yml, README.md, dev/acceptance.rs, no_ts.rs; существующие package.json/pnpm-workspace.yaml/pnpm-lock.yaml/tsconfig* и packages/* после проверки точного состава; tests/migration/public-contracts.json и coverage.json. Исходные XML остаются по прежним путям.

**Interfaces:** `nkdk-dev acceptance --manifest tests/migration/public-contracts.json --without-node` проверяет полное покрытие и вызывает Rust-эквиваленты проверок. Перед удалением проверяются Cargo-граф, runtime spawn и скрипты сборки на Node/pnpm/tsx/TS-зависимости.

- [ ] Сверить весь список tracked TS/JS build/test/CLI/MCP/tool-файлов с manifest замены. До удаления перенести оставшиеся средства генерации схем, e2e, fixture-layout, архитектуры, поиска дублей и проверки корпуса на Rust. JavaScript/BSL/текст, являющийся пользовательскими ресурсами фикстуры, не удалять по расширению файла.
- [ ] Выполнить полный существующий набор TS-проверок до удаления: `pnpm type-check`, `pnpm test` вне песочницы, `pnpm test:architecture:rules`, `pnpm test:architecture`, `pnpm test:e2e` вне песочницы и `pnpm duplicates -- --base <SHA>`. Зафиксировать результат и наличие Rust-защиты для каждой удаляемой группы тестов.
- [ ] Собрать и проверить отдельный Rust checkout в окружении без установленных Node/pnpm/tsx; наличие старого TS-эталона в другом каталоге не должно быть необходимо. Не имитировать отсутствие Node только поиском строки в Cargo.toml.

  ```rust
  #[test]
  fn node_spawn_is_rejected_by_the_acceptance_environment() {
      let report = run_no_node_fixture("hidden-node-build-step");
      assert!(!report.passed);
  }
  ```

  `run_no_node_fixture(&str) -> AcceptanceReport { passed: bool, failures: Vec<String> }` — integration-helper dev/tests/no_ts.rs; он запускает изолированный процесс сборки с запретом доступа к Node и проверяет содержательную причину отказа. Реальный Rust build и тесты в том же окружении обязаны пройти.

- [ ] Только после паритета операций и подтверждённой производительности удалить точный проверенный список TS-реализации, временных мостов и Node-инструментов. Не применять массовое удаление неизвестного каталога. Обновить README и CI на Cargo; прекращение сравнения с TS не удаляет независимые ожидания и историю источников.
- [ ] Повторить fmt/clippy/workspace tests, декларации, coverage, architecture, Rust/YAML duplicates, полный project/platform/MCP-corpus и e2e без Node. Повторно проверить запуск бинарников на поддерживаемых платформах. Для недоступной платформы приёмка остаётся неподтверждённой.
- [ ] Сохранить итоговый отчёт: какие тесты расширены/объединены/удалены, где осталась защита, текущие форматы состояния, результаты измерений, оставшиеся ограничения. О расхождении `.agents/architecture.md` с реализацией сообщить; не переписывать документ самовольно. Инструкции запуска проверок должны соответствовать конечному состоянию перед завершением согласованного цикла.
- [ ] Сделать локальный коммит и проверить чистоту worktree. Применить `superpowers:finishing-a-development-branch` для отчёта о готовности и выбора дальнейшей интеграции; не публиковать и не сливать ветку без пользовательского поручения.

## Приёмка этапа В и всего проекта

- [ ] Полные и частичные операции, кэш/снимок, перезапуск процесса, rename/references, платформа и MCP покрыты независимо от конвертера одного файла.
- [ ] Все обязательные целевые сценарии подтвердили корректность и 10× одновременно по времени и памяти на e2e.
- [ ] Конечные сборка, тесты, инструменты разработки и рабочие приложения не требуют TypeScript/Node.js.
- [ ] Согласованные пользовательские форматы, ошибки и регистрация аномалий сохранены.
- [ ] Исходные XML-фикстуры не изменены, нет скрытых преобразователей common/rules на Rust.
- [ ] Публикация или merge выполняются отдельным явно порученным действием.
