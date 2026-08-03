# Project State Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить единое сохраняемое состояние YAML-проекта, чтобы повторная validation хэшировала все ресурсы, но разбирала и локально проверяла только изменённые YAML, а import, sync, поиск ссылок и переименование использовали один актуальный индекс.

**Architecture:** Один project-state worker владеет именованной SQLite в памяти и является единственным писателем. Прикладные операции работают через `ProjectStateService`, `ProjectStateStore` и пакетный `ProjectStateReadSession`; только каталог `metadata/projectState/sqlite` знает о `node:sqlite`, SQL и физических таблицах. Согласованное состояние публикуется атомарным снимком `.nkdk/cache/project-state.sqlite` после каждой завершённой актуализации или import.

**Tech Stack:** TypeScript, Node.js 26 (`node:sqlite`, `worker_threads`), Vitest, TypeBox/Ajv, `@node-rs/xxhash`, pnpm, jscpd 5.0.12.

## Global Constraints

- Исходная спецификация: `docs/superpowers/specs/2026-08-01-validation-project-state-cache-design.md`.
- Исходный коммит для проверки новых дублей этой реализации: `e768ba6321fc99b2623e04f1fe72a06c77f07b38`.
- Начинать реализацию в отдельном worktree от указанного коммита. Не переносить туда незакоммиченные экспериментальные изменения текущего worktree и не удалять их.
- Не изменять существующие XML-фикстуры и не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML` без отдельного запроса.
- `metadata/projectState`, `metadata/validation`, `metadata/project` и `metadata/orchestration` не получают условий по конкретным `itemType`, именам XML-корней или папкам прикладных объектов.
- Только `packages/core/metadata/projectState/sqlite/**` импортирует `node:sqlite`, содержит SQL и знает имена таблиц.
- Путь проекта хранится относительно корня и ровно один раз в `project_files`; хэш хранится только в `file_hashes` как BLOB ровно из 8 big-endian байт; индексные строки ссылаются на `source_file_id`.
- Долгоживущие DTO и worker/store-протоколы не хранят xxHash64 как `bigint` или строку. Пакет файлов владеет одним переносимым `Uint8Array`/`ArrayBuffer`, где хэш позиции `i` занимает `[i * 8, i * 8 + 8)`; отдельные буферы и `hashOffset` на файл запрещены.
- Итоговые межфайловые диагностики не кэшируются: полная проверка зависимостей выполняется при каждой актуализации.
- Техническая ошибка всегда останавливает вызывающую операцию. `ignoreValidationErrors` разрешает продолжить только при обычных error-диагностиках проекта и никогда не пропускает саму проверку.
- Внутри задачи объединять связанные договоры в один TDD-блок. Для блока сначала запускать один набор RED-тестов, во время реализации повторять только быстрые целевые тесты. Mutation testing для оставшейся части реализации не запускать по прямому решению пользователя.
- `pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38`, `pnpm type-check`, сборку при необходимости и полный `pnpm test` выполнять один раз после всех TDD-блоков задачи непосредственно перед независимой рецензией. Повторный полный прогон нужен только после исправлений рецензии или воспроизводимого сбоя.
- До Task 9 выполнить отдельный план `docs/superpowers/plans/2026-08-02-fast-test-budget.md`: test case ≤ 50 мс, цель 10 мс, test file ≤ 1 000 мс; интеграционные тесты исключений не получают.

---

## Task 1: Добавить обязательную проверку новых дублей

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`
- Create: `.jscpd.json`
- Create: `packages/core/scripts/check-new-duplicates.mjs`
- Create: `packages/core/scripts/check-new-duplicates.test.ts`
- Create: `.github/workflows/duplicate-code.yml`
- Modify: `.agents/testing.md`
- Modify: `AGENTS.md`

**Contract:** Корневая команда получает обязательный `--base <commit>`, запускает jscpd по всему поддерживаемому вручную TS/JS-коду, читает JSON-отчёт и завершается с кодом 1 только тогда, когда хотя бы один из двух диапазонов клона пересекает добавленные строки относительно `base`. Переименование без новых строк проходит.

- [ ] **Step 1: Зафиксировать наблюдаемый договор переходника тестами**

  В `check-new-duplicates.test.ts` тестировать чистые функции без запуска Git и jscpd:

  ```ts
  import { describe, expect, it } from "vitest"
  import { findNewClones, parseAddedLineRanges } from "./check-new-duplicates.mjs"

  it.each([
    ["старый дубль", [], []],
    ["новый фрагмент против старого", [{ path: "a.ts", start: 10, end: 14 }], ["a.ts:10-14 <-> b.ts:1-5"]],
    ["два новых фрагмента", [
      { path: "a.ts", start: 10, end: 14 },
      { path: "b.ts", start: 20, end: 24 },
    ], ["a.ts:10-14 <-> b.ts:20-24"]],
  ])("%s", (_name, added, expected) => {
    expect(findNewClones(reportWithOneClone(), added)).toEqual(expected)
  })
  ```

  Отдельными тестами закрыть `git diff --unified=0 --find-renames`, чистое переименование, отсутствующий `--base`, неизвестный коммит, ненулевой код jscpd и повреждённый/неполный JSON.

- [ ] **Step 2: Убедиться, что тесты падают из-за отсутствия переходника**

  Run: `pnpm --filter @nakidka/core test -- scripts/check-new-duplicates.test.ts`

  Expected: FAIL с ошибкой импорта `check-new-duplicates.mjs`.

- [ ] **Step 3: Реализовать чистое сопоставление диапазонов**

  Экспортировать из сценария функции `parseArguments`, `parseAddedLineRanges`, `parseJscpdReport` и `findNewClones`. Диапазон считается новым при пересечении хотя бы с одной добавленной строкой; обе стороны клона проверяются независимо. Пути нормализовать к POSIX-виду относительно корня репозитория.

  ```js
  export function rangesIntersect(left, right) {
    return left.path === right.path && left.start <= right.end && right.start <= left.end
  }

  export function findNewClones(report, addedRanges) {
    return parseClones(report)
      .filter((clone) => [clone.left, clone.right].some((side) =>
        addedRanges.some((added) => rangesIntersect(side, added))))
      .map(formatClone)
  }
  ```

- [ ] **Step 4: Добавить запуск jscpd и жёсткую обработку ошибок**

  Сценарий должен:

  1. проверить существование `base` через `git cat-file -e <base>^{commit}`;
  2. получить добавленные строки через `git diff --unified=0 --find-renames <base> --`;
  3. удалить только собственный старый каталог `reports/jscpd` через `fs.rm`;
  4. запустить локальный `jscpd` с JSON reporter;
  5. проверить наличие всех обязательных полей отчёта;
  6. напечатать каждый новый клон и завершиться с кодом 1 при их наличии.

  Не интерпретировать общий процент дублей jscpd как результат переходной проверки.

- [ ] **Step 5: Закрепить зависимость и единую конфигурацию**

  Run: `pnpm add -DwE jscpd@5.0.12`

  Добавить скрипт:

  ```json
  {
    "scripts": {
      "check:duplicates": "node packages/core/scripts/check-new-duplicates.mjs"
    }
  }
  ```

  `.jscpd.json` должен сканировать `packages/**/*.ts`, `packages/**/*.tsx`, `packages/**/*.js`, `packages/**/*.mjs` и исключать `node_modules`, `dist`, `build`, `coverage`, `reports`, сгенерированные файлы и каталоги `__fixtures__`. Добавить `reports/jscpd/` в `.gitignore`.

- [ ] **Step 6: Добавить CI-проверку с правильным исходным коммитом**

  В workflow делать полный `fetch`, вычислять `git merge-base HEAD origin/${{ github.base_ref }}` и передавать результат в `pnpm check:duplicates -- --base`. Проверка должна выполняться рядом с `pnpm type-check` и `pnpm test`, а не заменять их.

- [ ] **Step 7: Обновить правила разработки**

  В `.agents/testing.md` и корневом `AGENTS.md` записать обязательный запуск после каждого слоя и перед завершением реализации. Не дублировать описание алгоритма: сослаться на `.jscpd.json` и команду.

- [ ] **Step 8: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- scripts/check-new-duplicates.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS; JSON-отчёт создан только в игнорируемом `reports/jscpd`, новых клонов нет.

- [ ] **Step 9: Commit**

  ```bash
  git add package.json pnpm-lock.yaml .gitignore .jscpd.json packages/core/scripts/check-new-duplicates.mjs packages/core/scripts/check-new-duplicates.test.ts .github/workflows/duplicate-code.yml .agents/testing.md AGENTS.md
  git commit -m "chore: :wrench: добавить проверку новых дублей"
  ```

---

## Task 2: Сделать вклад YAML-файла переносимым и минимальным

**Files:**

- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/dataPath/policies.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Create: `packages/core/metadata/projectState/fileUpdate.ts`
- Create: `packages/core/metadata/projectState/fileUpdate.test.ts`

**Contract:** Worker возвращает ограниченные структурно клонируемые `ProjectStateFileUpdateBatch`: DTO файлов, один общий буфер восьмибайтовых big-endian xxHash64, локальные диагностики, нормализованные reference/owner/field/form-вклады и минимальные отложенные проверки. Сами `ProjectStateFileUpdate` не содержат хэш или `hashOffset`; полные rule-объекты, функции, разобранный YAML и общий граф в пакет не входят.

- [ ] **Step 1: Тестом описать минимальную DataPath-политику**

  ```ts
  expect(toDataPathPolicyInput(rule)).toEqual({
    yaml: rule.yaml,
    allowedKinds: rule.allowedKinds,
    allowComposite: rule.allowComposite,
  })
  expect(structuredClone(batch)).toEqual(batch)
  expect(() => assertProjectStateFileUpdateBatch(batch)).not.toThrow()
  ```

  Явная проверка DTO должна проверять разрешённые поля и типы и отклонять функции, rule-объекты, разобранный YAML, общий граф, `hash`/`hashOffset` в update, ненулевой `hashBytes.byteOffset` и длину представления или его `ArrayBuffer`, не равную `updates.length * 8`. Добавить проверку, что восстановленная политика даёт тот же результат `validatePendingChecks`, что текущий `DataPathPropertyRule`. Не использовать `JSON.stringify` как доказательство переносимости: `bigint` он не поддерживает, а функции молча отбрасывает.

- [ ] **Step 2: Запустить тесты и увидеть падение нового договора**

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/fileUpdate.test.ts metadata/validation/projectValidationPasses.test.ts metadata/project/preparedYamlProjectWorker.test.ts`

  Expected: FAIL, потому что `ProjectStateFileUpdate` и преобразование политики отсутствуют.

- [ ] **Step 3: Ввести нейтральные типы пакета**

  В `fileUpdate.ts` определить типы без SQL и без знания конкретных metadata-объектов:

  ```ts
  export interface ProjectStateFileIdentity {
    readonly projectPath: string
    readonly componentPath: string
    readonly resourceKind: MetadataProjectResourceKind
    readonly yamlRole?: MetadataProjectYamlRole
  }

  export interface ProjectStateResourceUpdate extends ProjectStateFileIdentity {
    readonly kind: "resource"
  }

  export interface ProjectStateYamlFileUpdate extends ProjectStateFileIdentity {
    readonly kind: "yaml"
    readonly localValidation: ProjectStateLocalValidationResult
    readonly references: readonly ProjectStateReferenceEntry[]
    readonly pendingReferences: readonly ProjectStatePendingReference[]
    readonly owners: readonly ProjectStateOwnerFact[]
    readonly fields: readonly ProjectStateFieldEntry[]
    readonly forms: readonly ProjectStateFormEntry[]
    readonly pendingChecks: readonly ProjectStatePendingDependencyCheck[]
    readonly dependencies: readonly string[]
  }

  export type ProjectStateFileUpdate =
    | ProjectStateResourceUpdate
    | ProjectStateYamlFileUpdate

  export interface ProjectStateFileUpdateBatch {
    readonly updates: readonly ProjectStateFileUpdate[]
    readonly hashBytes: Uint8Array
  }
  ```

  `hashBytes` владеет одним переносимым `ArrayBuffer`: `byteOffset === 0`, а `hashBytes.byteLength === hashBytes.buffer.byteLength === updates.length * 8`; для update с индексом `i` хэш занимает `[i * 8, i * 8 + 8)`. Не создавать отдельный `Uint8Array`/`ArrayBuffer` и не хранить `hashOffset` на файл. Каждая строка хранит только данные, которые нельзя вывести через связь с исходным файлом. Не добавлять `componentPath`, `projectPath` или хэш во вложенные строки.

- [ ] **Step 4: Заменить полный rule минимальным входом политики**

  ```ts
  export interface DataPathPolicyInput {
    readonly yaml: string
    readonly allowedKinds?: readonly DataPathTargetKind[]
    readonly allowComposite?: boolean
  }

  export function evaluateDataPathPolicy(input: DataPathPolicyInput, value: ResolvedDataPath) {
    // Та же семантика, что у текущего правила, без зависимости от rule-объекта.
  }
  ```

  `ValidationPendingCheck` должен ссылаться на `DataPathPolicyInput`, а не на `DataPathPropertyRule`.

- [ ] **Step 5: Формировать общий буфер на границе первого прохода**

  Добавить построитель ограниченной пачки, который собирает `ProjectStateFileUpdate[]`, заполняет общий `hashBytes` big-endian байтами соответствующих файлов и возвращает `ProjectStateFileUpdateBatch`. Кодирование кратковременного локального `bigint` выполняется только на исходной границе хэширования; если байты уже находятся в общем буфере сканирования, построитель копирует нужные диапазоны без обратного декодирования и повторного кодирования. Prepared worker после локальной validation добавляет update в пачку и освобождает разобранный YAML после подтверждения приёма, если файл не нужен текущей второй фазе. При transfer передавать только общий `batch.hashBytes.buffer`; пачка обязана владеть всем буфером без отдельного view на файл.

- [ ] **Step 6: Проверить структурное клонирование и семантическое равенство**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/fileUpdate.test.ts metadata/validation/projectValidationPasses.test.ts metadata/project/preparedYamlProjectWorker.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  ```

  Expected: PASS; старые диагностики совпадают полностью, `structuredClone(batch)` успешен, transfer общего `ArrayBuffer` работает, длины `updates.length * 8 - 1` и `updates.length * 8 + 1` отклоняются.

- [ ] **Step 7: Commit**

  ```bash
  git add packages/core/metadata/validation packages/core/metadata/project packages/core/metadata/projectState/fileUpdate.ts packages/core/metadata/projectState/fileUpdate.test.ts
  git commit -m "refactor: :recycle: сериализовать вклады YAML-файлов"
  ```

---

## Task 3: Определить независимые договоры состояния проекта

**Files:**

- Create: `packages/core/metadata/projectState/contracts.ts`
- Create: `packages/core/metadata/projectState/readSession.ts`
- Create: `packages/core/metadata/projectState/store.ts`
- Create: `packages/core/metadata/projectState/storeContract.ts`
- Create: `packages/core/metadata/projectState/index.ts`
- Modify: `packages/core/index.ts`
- Create: `packages/core/metadata/projectState/contracts.test.ts`

**Contract:** Прикладная логика видит только пакетные предметные запросы. Каждый запрос и ответ содержит `requestId`; одиночных lookup-методов, SQL, таблиц и SQLite-объектов в договоре нет.

- [ ] **Step 1: Написать архитектурные и типовые тесты договора**

  Проверить, что:

  - read session принимает только массивы;
  - ответы можно сопоставить по `requestId`;
  - разрешение на чтение непрозрачно;
  - после `close()` любой метод завершается контролируемой ошибкой;
  - нейтральные договоры не импортируют `node:sqlite` и не содержат имён обязательных таблиц;
  - `structuredClone` сохраняет `ProjectStateFileUpdateBatch`, а явная проверка DTO отклоняет функции/rule-объекты и общий буфер неправильной длины;
  - xxHash64 отсутствует как `bigint` или строка во всех долгоживущих DTO и протоколах.

  ```ts
  const result = session.resolveTargets([
    { requestId: "r1", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
  ])
  expect(result).toEqual([{ requestId: "r1", status: "found", target: expect.any(Object) }])
  ```

- [ ] **Step 2: Запустить тест и увидеть отсутствие договоров**

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/contracts.test.ts`

  Expected: FAIL на отсутствующих модулях.

- [ ] **Step 3: Определить пакетный `ProjectStateReadSession`**

  ```ts
  export interface ProjectStateQueryPort {
    resolveTargets(requests: readonly ProjectTargetLookup[]): readonly ProjectTargetLookupResult[]
    readOwners(requests: readonly ProjectOwnerLookup[]): readonly ProjectOwnerLookupResult[]
    findReferences(requests: readonly ProjectReferenceLookup[]): readonly ProjectReferenceLookupResult[]
    readDependencyInputs(requests: readonly ProjectDependencyInputQuery[]): readonly ProjectDependencyInputResult[]
  }

  export interface ProjectStateReadSession extends ProjectStateQueryPort {
    close(): void
  }
  ```

  Все четыре вида запросов получают `requestId` и `componentPath`. Сеанс применяет видимость `cf`/своего `cfe`, но не форматирует DataPath и не создаёт diagnostics.

- [ ] **Step 4: Определить `ProjectStateStore`**

  ```ts
  export interface ProjectStateFileHashBatch {
    readonly files: readonly ProjectStateFileIdentity[]
    readonly hashBytes: Uint8Array
  }

  export interface ProjectStateStore {
    readCompatibility(): ProjectStateCompatibility | undefined
    compareFiles(current: ProjectStateFileHashBatch): ProjectStateFileChanges
    beginUpdate(): void
    replaceFiles(batch: ProjectStateFileUpdateBatch): void
    deleteFiles(projectPaths: readonly string[]): void
    readLocalDiagnostics(): readonly Diagnostic[]
    readDependencyCheckBatch(params: ProjectDependencyBatchQuery): ProjectDependencyBatch
    validateDependencies(params: ProjectDependencyValidationParams): readonly Diagnostic[]
    readComponentProjection(componentPath: string): ProjectStateComponentProjection
    createReadToken(): ProjectStateReadToken
    commitUpdate(): void
    rollbackUpdate(): void
    checkpoint(): Promise<void>
    close(): void
  }
  ```

  `ProjectStateFileHashBatch` использует ту же позиционную схему: хэш `files[i]` лежит в `[i * 8, i * 8 + 8)`. Store требует нулевой `byteOffset` и точное равенство `hashBytes.byteLength === hashBytes.buffer.byteLength === files.length * 8`; `replaceFiles` аналогично проверяет длину по `batch.updates`. `ProjectStateFileChanges` возвращает только идентичности/позиции изменений и не дублирует хэши. `ProjectStateReadToken` сделать номинальным `Uint8Array`; декодирование разрешено только SQLite-адаптеру.

- [ ] **Step 5: Создать повторно используемый набор проверок хранилища**

  `runProjectStateStoreContract(factory)` должен принимать фабрику реализации и проверять наблюдаемый договор: замена файла, big-endian round-trip всех восьми байт (включая значения с установленным старшим битом), отказ при коротком/длинном общем буфере, каскадное удаление, откат, видимость компонентов, одинаковый порядок результатов, закрытый/чужой token, отсутствие записи из read session.

- [ ] **Step 6: Экспортировать только нейтральный внешний API**

  Из `packages/core/index.ts` экспортировать нейтральные типы store/token/session и фабрику открытия read session по непрозрачному token. `ProjectStateService` и его production-фабрика появятся и будут экспортированы в Task 6. Не экспортировать SQLite store, URI, схему или физические строки.

- [ ] **Step 7: Проверить границу**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/contracts.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  ```

  Expected: PASS.

- [ ] **Step 8: Commit**

  ```bash
  git add packages/core/metadata/projectState packages/core/index.ts
  git commit -m "feat: :sparkles: определить договор состояния проекта"
  ```

---

## Task 4: Реализовать нормализованное SQLite-хранилище

**Files:**

- Create: `packages/core/metadata/projectState/sqlite/schema.ts`
- Create: `packages/core/metadata/projectState/sqlite/store.ts`
- Create: `packages/core/metadata/projectState/sqlite/readSession.ts`
- Create: `packages/core/metadata/projectState/sqlite/readToken.ts`
- Create: `packages/core/metadata/projectState/sqlite/store.test.ts`
- Create: `packages/core/metadata/projectState/sqlite/readSession.test.ts`
- Modify: `packages/core/metadata/projectState/storeContract.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/scripts/build.mjs`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentProducer.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentProducer.test.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentProtocol.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentSession.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentSession.test.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentStore.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentStore.test.ts`
- Delete: `packages/core/metadata/validation/sqliteFirstPassExperimentWorker.ts`

**Contract:** SQLite является единственным полным runtime-представлением индексов. Замена вклада файла атомарно удаляет его старые дочерние строки и добавляет новые; удаление файла каскадно удаляет весь вклад. Отдельные соединения read session видят одну именованную базу и не могут записывать.

- [ ] **Step 1: Подключить общую проверку договора к SQLite-фабрике**

  ```ts
  runProjectStateStoreContract(() => createSqliteProjectStateStore({
    projectDir: fixtureDir,
    compatibility: testCompatibility,
  }))
  ```

  Добавить SQLite-специфичные тесты: два read-only соединения, параллельная запись неиндексных таблиц, чужой token, повторное использование закрытого token. Проверить общий буфер с несколькими разными хэшами, точное позиционное соответствие и отказ при длине, отличной от количества файлов, умноженного на 8. Через `PRAGMA table_info/foreign_key_list` проверить, что `project_path` есть только в `project_files`, `hash` — только в `file_hashes`, а все индексные таблицы ссылаются на `source_file_id` и не повторяют `component_id`.

  Нормализованные reference-запросы сверить с read-only копией успешного эксперимента в исходном worktree: `/Users/nikita/.codex/worktrees/1c87/nkdk/packages/core/metadata/validation/sqliteReferenceExperimentStore.ts`. Не копировать экспериментальный модуль и не изменять исходный worktree.

- [ ] **Step 2: Увидеть падение тестов до реализации**

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/sqlite/store.test.ts metadata/projectState/sqlite/readSession.test.ts`

  Expected: FAIL на отсутствующей фабрике.

- [ ] **Step 3: Создать схему без дублирования**

  В одной транзакции создать таблицы:

  ```text
  cache_meta(key PRIMARY KEY, value)
  components(id PRIMARY KEY, path UNIQUE)
  project_files(id PRIMARY KEY, project_path UNIQUE, component_id FK, resource_kind, yaml_role)
  file_hashes(file_id PRIMARY KEY FK, hash BLOB CHECK(length(hash) = 8))
  file_validation_results(file_id PRIMARY KEY FK, checked, schema_ready, contributed_facts)
  local_diagnostics(id PRIMARY KEY, source_file_id FK, ordinal, severity, source, message, line, col, yaml_path)
  reference_entries(id PRIMARY KEY, source_file_id FK, entry_kind, canonical_key, owner_key, member_key, value_key, yaml_path)
  pending_references(id PRIMARY KEY, source_file_id FK, ordinal, canonical_target, filter_kind, filter_value, line, col, yaml_path)
  owner_facts(id PRIMARY KEY, source_file_id FK, owner_key, fact_kind, fact_key, fact_value)
  field_entries(id PRIMARY KEY, source_file_id FK, owner_key, field_kind, field_name, type_key)
  form_entries(id PRIMARY KEY, source_file_id FK, owner_key, form_key, source_kind, source_value)
  pending_dependency_checks(id PRIMARY KEY, source_file_id FK, ordinal, check_kind, payload_json, line, col, yaml_path)
  file_dependencies(source_file_id FK, target_file_id FK, dependency_kind, PRIMARY KEY(...))
  ```

  `component_id` не повторять в дочерних таблицах. Пути и канонические ключи сравнивать с `COLLATE BINARY`. xxHash64 хранить теми же восемью big-endian байтами из пакетного буфера, а не SQLite `INTEGER`, строкой или JSON, чтобы значения с установленным старшим битом не меняли представление. JSON допускается только для небольшого типизированного payload отложенной проверки и YAML path, но не для целого графа или списка индексных строк.

- [ ] **Step 4: Реализовать транзакционную замену файлов**

  `replaceFiles(batch)` сначала проверяет нулевой `byteOffset` и равенство `batch.hashBytes.byteLength === batch.hashBytes.buffer.byteLength === batch.updates.length * 8`, и должен пакетно:

  1. upsert компонента и файла;
  2. удалить старые дочерние строки данного `file_id`;
  3. для `kind: "resource"` записать только соответствующие 8 байт общего буфера, а для `kind: "yaml"` — те же байты, локальный результат, diagnostics и нормализованные вклады;
  4. сохранить порядок диагностик через `ordinal`.

  Использовать подготовленные выражения и одну внешнюю транзакцию на операцию, а не транзакцию на строку. Не создавать отдельный `Uint8Array`/`ArrayBuffer` для каждого файла: SQLite-адаптер привязывает общий BLOB пачки и выделяет восьмибайтовый диапазон по позиции средствами SQL/адаптера без объектного массива хэшей.

- [ ] **Step 5: Реализовать пакетные предметные запросы**

  Каждый метод read session загружает запросы во внутреннюю временную таблицу с `request_id`, выполняет один или ограниченное число запросов и возвращает результаты в порядке входных request IDs. Видимость:

  ```text
  запрос из cf       -> только cf
  запрос из cfe/x    -> сначала cfe/x, затем cf
  запрос из cfe/x    -> никогда cfe/y
  ```

  SQL определения найдено/не найдено/неоднозначно перенести из успешного reference-эксперимента, но возвращать нейтральные DTO.

- [ ] **Step 6: Реализовать непрозрачный token и read-only открытие**

  Token кодирует случайный идентификатор состояния, имя именованной базы и nonce жизненного цикла. Read adapter открывает соединение и сверяет идентификатор/nonce со строками `cache_meta`; поэтому token проверяется и в отдельном worker thread. После закрытия базы старый token либо не открывает соединение, либо попадает в пустую базу и отклоняется проверкой метаданных. `close()` закрывает соединение и запрещает последующие вызовы.

- [ ] **Step 7: Удалить отклонённый эксперимент и закрепить архитектурную границу**

  После прохождения production store contract удалить tracked-файлы `sqliteFirstPassExperiment*` и их entry point из `packages/core/scripts/build.mjs`. В `importBoundaries.test.ts` запретить production-импорты `node:sqlite`, SQL-выражения и обязательные имена таблиц вне `metadata/projectState/sqlite/**`; сам тест входит в явный allowlist. Проверка должна сканировать также новые worker-файлы.

- [ ] **Step 8: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/sqlite/store.test.ts metadata/projectState/sqlite/readSession.test.ts metadata/importBoundaries.test.ts
  pnpm --filter @nakidka/core build
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS; общий store contract проходит на SQLite.

- [ ] **Step 9: Commit**

  ```bash
  git add -A packages/core/metadata/projectState packages/core/metadata/validation packages/core/metadata/importBoundaries.test.ts packages/core/scripts/build.mjs
  git commit -m "feat: :sparkles: реализовать SQLite-состояние проекта"
  ```

---

## Task 5: Добавить снимок на диск и единственного писателя

**Files:**

- Create: `packages/core/metadata/projectState/sqlite/persistence.ts`
- Create: `packages/core/metadata/projectState/sqlite/persistence.test.ts`
- Create: `packages/core/metadata/projectState/writerProtocol.ts`
- Create: `packages/core/metadata/projectState/writerWorker.ts`
- Create: `packages/core/metadata/projectState/writerHandle.ts`
- Create: `packages/core/metadata/projectState/writerHandle.test.ts`
- Create: `packages/core/metadata/projectState/compatibility.ts`
- Create: `packages/core/files/atomicPublication.ts`
- Create: `packages/core/files/atomicPublication.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/scripts/build.mjs`

**Contract:** Один worker владеет пишущим соединением и обрабатывает команды последовательно. Совместимый снимок лениво загружается целиком в память. Checkpoint создаёт проверенный временный файл и атомарно заменяет `.nkdk/cache/project-state.sqlite`; ошибка сохраняет предыдущий снимок.

- [ ] **Step 1: Написать тесты жизненного цикла и публикации**

  Проверить: отсутствующий снимок, совместимая загрузка, повреждение, несовместимость по каждому отпечатку, успешный round-trip, ошибка backup/`quick_check`/rename, удаление временного файла, восстановление старого снимка.

  Для worker проверить ограниченную очередь, подтверждение каждой пачки и отмену во время заполненной очереди:

  ```ts
  await handle.beginUpdate(projectDir)
  await Promise.all(batches.map((batch) => handle.writeBatch(batch)))
  const result = await handle.commitAndCheckpoint()
  expect(result.snapshotPath).toBe(join(projectDir, ".nkdk/cache/project-state.sqlite"))
  ```

  `writeBatch` принимает `ProjectStateFileUpdateBatch`, переносит его единственный `hashBytes.buffer` и до отправки worker отклоняет ненулевой `byteOffset` либо длину представления/буфера, не равную `updates.length * 8`. Проверить, что после transfer исходный буфер отсоединён, а worker видит все восьмибайтовые диапазоны без отдельных буферов. После `AbortController.abort()` незавершённые `writeBatch` должны отклониться одной технической ошибкой отмены, а повторное открытие store — видеть только предыдущее согласованное состояние.

- [ ] **Step 2: Убедиться в исходном падении**

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/sqlite/persistence.test.ts metadata/projectState/writerHandle.test.ts`

  Expected: FAIL на отсутствующих модулях.

- [ ] **Step 3: Определить совместимость**

  ```ts
  export interface ProjectStateCompatibility {
    readonly schemaVersion: 1
    readonly producerVersion: string
    readonly rulesFingerprint: string
    readonly hashAlgorithm: "xxhash64-be-v1"
  }
  ```

  `rulesFingerprint` вычислять из стабильных снимков зарегистрированных project specs, схем и локальных правил после `registerCoreMetadata()`. Не использовать время, абсолютные пути и порядок регистрации как случайные входы.

- [ ] **Step 4: Реализовать загрузку в именованную базу**

  Новый store создаётся в именованной SQLite в памяти. Если файл существует, прочитать bytes, выполнить `deserialize`, затем проверить `quick_check` и точное равенство compatibility. При любой несовместимости закрыть базу и создать пустую; повреждение кэша не превращать в диагностику проекта.

- [ ] **Step 5: Реализовать атомарный checkpoint**

  Вынести из `configurationIndex/fileIO.ts` общий помощник `publishFileAtomically` в `packages/core/files/atomicPublication.ts`, сохранив прежний договор configuration index. Помощник принимает функцию записи временного файла и функцию его проверки. Последовательность для SQLite: backup во временный файл того же каталога, `quick_check`, `fsync` файла, rename, лучший возможный `fsync` каталога. Старый файл не удалять заранее.

- [ ] **Step 6: Реализовать протокол единственного писателя**

  Команды должны иметь корреляционный идентификатор и исчерпывающий union:

  ```ts
  type ProjectStateWriterCommand =
    | { kind: "openProject"; requestId: string; projectDir: string; compatibility: ProjectStateCompatibility }
    | { kind: "beginUpdate"; requestId: string; operationId: string }
    | { kind: "writeBatch"; requestId: string; operationId: string; batch: ProjectStateFileUpdateBatch }
    | { kind: "deleteFiles"; requestId: string; operationId: string; projectPaths: readonly string[] }
    | { kind: "commitUpdate"; requestId: string; operationId: string }
    | { kind: "rollbackUpdate"; requestId: string; operationId: string }
    | { kind: "checkpoint"; requestId: string }
    | { kind: "cancelOperation"; requestId: string; operationId: string }
    | { kind: "reset"; requestId: string; projectDir: string }
    | { kind: "close"; requestId: string }
  ```

  До `postMessage` handle выполняет явную проверку DTO и точной длины общего буфера, затем передаёт `batch.hashBytes.buffer` в transfer list. Worker повторяет проверку как недоверенная граница протокола; ни одна сторона не принимает `bigint`, строковый хэш, массив буферов или `hashOffset`.

  Перенести ограниченную batch/ack-механику из `sqliteFirstPassExperimentProducer`, не сохраняя экспериментальные имена.

  `beginUpdate` и все последующие команды пачки связываются одним `operationId`. `cancelOperation` прекращает приём пачек этого operation, откатывает открытую транзакцию и подтверждает отмену только после перехода store в согласованное состояние.

  Добавить `metadata/projectState/writerWorker.ts` отдельным entry point `projectStateWriterWorker.js` в core build. `writerHandle` выбирает `.ts` в исходном режиме и соседний `.js` в собранном пакете тем же способом, что prepared/import worker pools.

- [ ] **Step 7: Проверить технический откат**

  Инъекционным тестом оборвать worker после `commitUpdate`, но до checkpoint: handle должен закрыть read sessions, отбросить незавершённую память и при следующем открытии восстановить предыдущий дисковый снимок.

- [ ] **Step 8: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/sqlite/persistence.test.ts metadata/projectState/writerHandle.test.ts metadata/configurationIndex
  pnpm --filter @nakidka/core build
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS.

- [ ] **Step 9: Commit**

  ```bash
  git add packages/core/metadata/projectState packages/core/files packages/core/metadata/configurationIndex/fileIO.ts packages/core/index.ts packages/core/scripts/build.mjs
  git commit -m "feat: :floppy_disk: сохранять состояние проекта атомарно"
  ```

---

## Task 6: Реализовать инкрементальную актуализацию файлов

**Files:**

- Create: `packages/core/metadata/projectState/service.ts`
- Create: `packages/core/metadata/projectState/refresh.ts`
- Create: `packages/core/metadata/projectState/projectFiles.ts`
- Create: `packages/core/metadata/projectState/service.test.ts`
- Create: `packages/core/metadata/projectState/refresh.test.ts`
- Modify: `packages/core/metadata/projectState/contracts.ts`
- Modify: `packages/core/metadata/projectState/index.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`

**Contract:** Каждая актуализация один раз читает bytes и вычисляет xxHash64 всех управляемых project specs ресурсов. Только новые/изменённые YAML передаются на parse и локальную validation. Неизменённые локальные diagnostics читаются из store; удалённые файлы каскадно удаляются. Состояние относится к фактически прочитанным байтам и не объявляется атомарным снимком файловой системы.

- [ ] **Step 1: Написать тесты инкрементальности**

  Через счётчики инъецируемых `hashBytes`, `parseYaml` и `validateLocal` проверить:

  - холодный проход: хэшируются все ресурсы, разбираются все YAML;
  - прогретый проход: хэшируются все ресурсы, разбирается 0 YAML;
  - изменение одного YAML: разбирается только он;
  - изменение внешнего управляемого файла: меняется хэш, но YAML не разбирается;
  - удаление YAML удаляет старые diagnostics и вклады;
  - изменение файла после чтения не вызывает повтор всей validation, а обнаруживается следующим вызовом по новому хэшу;
  - чтение не вызывает `stat`/`fstat` и не создаёт `dev`/`inode`/`size`/`mtimeNs`;
  - локальный результат хэширования кодируется в big-endian один раз, а все границы получают общий буфер правильной длины без `bigint` в DTO.

- [ ] **Step 2: Запустить тесты до реализации**

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/refresh.test.ts metadata/projectState/service.test.ts`

  Expected: FAIL.

- [ ] **Step 3: Объединить обнаружение ресурсов и хэширование bytes**

  `discoverMetadataProjectResources` остаётся источником состава. Новый слой читает каждый ресурс один раз и вызывает существующий `hashFileBytes(bytes)`:

  ```ts
  export interface HashedProjectResource {
    readonly ref: MetadataProjectResourceRef
    readonly bytes: Uint8Array
    readonly localHash: bigint
  }
  ```

  `localHash` — кратковременное локальное значение одного процесса, не DTO и не часть worker/store-протокола. Сразу после хэширования он кодируется в позицию общего `ProjectStateFileHashBatch.hashBytes` в big-endian; при подготовке writer-пачки нужные восемь байт копируются между общими пакетными буферами без обратного декодирования в `bigint`. Bytes неизменённых ресурсов освобождаются сразу после сравнения. Bytes изменённых YAML передаются worker как transferable buffer, чтобы worker не перечитывал файл. Метаданные файловой системы не читаются и не сохраняются.

- [ ] **Step 4: Добавить режим обработки только выбранных YAML**

  В prepared pool добавить метод `runLocalValidation(files, producer)`, который:

  - принимает уже прочитанные bytes и идентичность;
  - парсит и локально проверяет только входной список;
  - отправляет `ProjectStateFileUpdateBatch` ограниченными пачками writer handle;
  - не создаёт общий `ProjectValidationGraph` и не удерживает YAML после подтверждения writer.

- [ ] **Step 5: Реализовать транзакцию актуализации**

  `refreshProjectState` выполняет:

  ```text
  открыть/лениво загрузить состояние
  -> прочитать и захэшировать все ресурсы
  -> один раз закодировать локальные xxHash64 в общий ProjectStateFileHashBatch и сравнить с file_hashes
  -> beginUpdate
  -> удалить исчезнувшие
  -> записать изменённые не-YAML как ProjectStateResourceUpdate внутри ProjectStateFileUpdateBatch
  -> локально обработать и записать изменённые YAML
  -> передать открытую транзакцию полной проверке Task 7
  ```

  Diagnostics проекта не откатывают транзакцию. Параллельное изменение после чтения не отменяет транзакцию и не запускает повтор: следующий вызов заново читает все ресурсы и обнаруживает новый хэш. Ошибка самого чтения или другая техническая ошибка вызывает `rollbackUpdate`.

- [ ] **Step 6: Реализовать один активный проект**

  `ProjectStateService` сериализует изменяющие операции. При обращении к другому `projectDir` закрывает предыдущее состояние только после окончания текущей операции и лениво открывает новое. Нормализовать projectDir через `realpath`, чтобы разные записи одного пути не создавали два проекта.

  ```ts
  export interface ProjectStateService {
    refreshAndValidate(params: ProjectStateRefreshParams): Promise<ProjectStateRefreshResult>
    readComponentProjection(params: {
      readonly projectDir: string
      readonly componentPath: string
    }): Promise<ProjectStateComponentProjection>
    reset(projectDir: string): Promise<void>
    rebuild(params: ProjectStateRefreshParams): Promise<ProjectStateRefreshResult>
    close(): Promise<void>
  }

  export interface ProjectStateRefreshParams {
    readonly projectDir: string
    readonly context?: ConfigurationContext
    readonly concurrency?: number
    readonly signal?: AbortSignal
  }

  export interface ProjectStateRefreshResult {
    readonly diagnostics: readonly Diagnostic[]
    readonly readToken: ProjectStateReadToken
    readonly stats: ProjectStateRefreshStats
  }

  export interface ProjectStateComponentProjection {
    readonly componentPath: string
    readonly projectFiles: readonly { readonly projectPath: string }[]
    readonly hashBytes: Uint8Array
  }
  ```

  В проекции хэш `projectFiles[i]` находится в `[i * 8, i * 8 + 8)`; `hashBytes` владеет всем буфером с нулевым смещением, а его длина обязана равняться `projectFiles.length * 8`. Два параллельных `refreshAndValidate` одного проекта в тесте должны выполняться последовательно. `rebuild` строит отдельную память и меняет активное состояние только после успешного checkpoint.

- [ ] **Step 7: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/refresh.test.ts metadata/projectState/service.test.ts metadata/project/preparedYamlProjectWorker.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  ```

  Expected: PASS; прогретый тест подтверждает 0 разборов YAML.

- [ ] **Step 8: Commit**

  ```bash
  git add packages/core/metadata/projectState packages/core/metadata/project packages/core/metadata/validation/projectFiles.ts packages/core/metadata/validation/projectFiles.test.ts packages/core/index.ts
  git commit -m "feat: :zap: обновлять только изменённые YAML"
  ```

---

## Task 7: Выполнять полную проверку зависимостей из состояния

**Files:**

- Create: `packages/core/metadata/projectState/dependencyValidation.ts`
- Create: `packages/core/metadata/projectState/dependencyValidation.test.ts`
- Modify: `packages/core/metadata/projectState/refresh.ts`
- Modify: `packages/core/metadata/projectState/sqlite/store.ts`
- Modify: `packages/core/metadata/projectState/sqlite/readSession.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/projectMetadataReferences.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/projectValidationGraph.test.ts`

**Contract:** После каждого обновления файлов полная reference-, owner-, field-, data-path- и form-validation выполняется для всего проекта по актуальным строкам store. Она не сохраняется в кэше и не строит долгоживущий полный объектный граф.

- [ ] **Step 1: Создать таблицу семантического равенства**

  Расширить существующие validation-тесты `it.each`: для каждой фикстуры выполнить текущий shared-graph путь и новый store-путь, затем сравнить полный отсортированный массив diagnostics. Обязательно включить:

  - found/missing/ambiguous reference;
  - filter failure;
  - `cf -> cf`, `cfe/x -> cfe/x`, fallback `cfe/x -> cf`, запрет `cfe/x -> cfe/y`;
  - owner/field/DataPath/form;
  - неготовый первый проход `cf` и деградацию расширения.

- [ ] **Step 2: Запустить новый путь и увидеть расхождение**

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/dependencyValidation.test.ts metadata/validation/projectValidationGraph.test.ts`

  Expected: FAIL, пока store-проверка не реализована.

- [ ] **Step 3: Реализовать reference-проверки массовым запросом**

  Прочитать все pending reference rows порциями, разрешить их одним пакетным lookup на порцию и преобразовать ответы существующим formatter/registry-кодом. Сохранить прежние координаты, source, message и порядок.

- [ ] **Step 4: Реализовать owner/field/DataPath/form-проверки**

  `dependencyValidation.ts` группирует отложенные проверки по `checkKind`, запрашивает минимальные входы через нейтральный `ProjectStateQueryPort`, затем вызывает существующие policy/resolver-функции. При обычной актуализации store реализует этот порт на пишущем соединении и поэтому видит открытую транзакцию; worker read session реализует тот же порт на отдельном read-only соединении. Не материализовать весь store в `Map`; размер порции — внутренняя константа адаптера.

  ```ts
  for (const batch of store.readPendingDependencyChecks({ batchSize: 2_000 })) {
    diagnostics.push(...validateDependencyBatch(batch, readSession))
  }
  ```

- [ ] **Step 5: Встроить проверку после обновления**

  `refreshProjectState` после замены вкладов, но до `commitUpdate`, всегда выполняет `validateDependencies` на пишущем соединении, которое видит строки открытой транзакции. После этого без повторного discovery и `stat` выполняются `commitUpdate`, выдача read token и checkpoint. Опубликованное состояние относится к прочитанным в начале операции байтам; следующий вызов снова читает и хэширует весь состав. Итог результата:

  ```ts
  export interface ProjectStateRefreshResult {
    readonly diagnostics: readonly Diagnostic[]
    readonly readToken: ProjectStateReadToken
    readonly stats: {
      readonly hashedFiles: number
      readonly parsedYamlFiles: number
      readonly changedFiles: number
      readonly deletedFiles: number
    }
  }
  ```

  Diagnostics объединяются как сохранённые локальные + текущие межфайловые, дедуплицируются и сортируются прежним способом.

- [ ] **Step 6: Публиковать только после полной проверки**

  Обычные diagnostics не блокируют `commitUpdate` и checkpoint. Исключение/отмена dependency validation является технической ошибкой: обычная актуализация делает `rollbackUpdate`, а снимок не заменяется. Только import после специальной in-memory фиксации рабочего индекса требует отбросить всю незавершённую базу и восстановить предыдущий снимок.

- [ ] **Step 7: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/dependencyValidation.test.ts metadata/validation/projectValidationGraph.test.ts metadata/validation/projectValidationPendingChecks.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS; массивы diagnostics совпадают полностью.

- [ ] **Step 8: Commit**

  ```bash
  git add packages/core/metadata/projectState packages/core/metadata/validation
  git commit -m "feat: :white_check_mark: проверять зависимости из состояния проекта"
  ```

---

## Task 8: Ввести бюджет быстрых тестов

**Plan:** `docs/superpowers/plans/2026-08-02-fast-test-budget.md`

**Contract:** До следующего функционального изменения каждый test case ограничен 50 мс, превышения 10 мс попадают в отчёт, а полный test file вместе с hooks ограничен 1 000 мс. Writer unit-тесты используют нейтральный transport mock, SQLite-интеграции остаются реальными и также быстрыми, полная JSON Schema не строится ради проверки отдельного свойства.

- [ ] **Step 1: Выполнить Tasks 1–4 отдельного плана**

  Следовать TDD и не запускать mutation testing. Не продолжать Task 9, пока `pnpm test` и встроенная проверка бюджета не проходят.

---

## Task 9: Перевести публичную validation и удалить экспериментальные пути

**Files:**

- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/index.ts`

**Contract:** `validateProject` без ключа всегда актуализирует и проверяет весь проект через `ProjectStateService`. Прогретая validation неизменённого проекта возвращает тот же массив diagnostics, но разбирает 0 YAML. Старые переменные окружения, shared graph как основное состояние и оба экспериментальных SQLite-пути отсутствуют.

- [ ] **Step 1: Усилить существующие интеграционные тесты**

  Добавить холодный/прогретый запуск одной фикстуры с инъецированным одним `ProjectStateService`; сравнить массивы diagnostics, статистику parse и созданный снимок. Добавить изменение, удаление и локальную ошибку неизменённого файла.

- [ ] **Step 2: Запустить тесты и зафиксировать исходное падение прогретого договора**

  Run: `pnpm --filter @nakidka/core test -- metadata/validation/validateProject.test.ts`

  Expected: FAIL: второй проход всё ещё разбирает YAML или не принимает project-state service.

- [ ] **Step 3: Упростить внешний orchestration**

  ```ts
  export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
    const state = params.projectState ?? createProjectStateService()
    const result = await state.refreshAndValidate({
      projectDir: params.projectDir,
      context: params.context,
      concurrency: params.concurrency,
    })
    return { diagnostics: [...result.diagnostics] }
  }
  ```

  Временная фабрика закрывается в `finally`; инъецированный долгоживущий сервис не закрывается вызываемой функцией.

- [ ] **Step 4: Удалить второй shared-graph проход из prepared pool**

  Удалить API, передающие `SharedValidationGraph`/`SharedValidationSnapshot` для validation. Сохранить только локальную обработку выбранных YAML и writer producer. Не удалять shared-типы, пока Task 11/12 не переведут sync/import; пометить их внутренними legacy-экспортами без новых потребителей.

- [ ] **Step 5: Удалить экспериментальные флаги и ветвления**

  Удалить `SQLITE_*` переменные окружения и ветвления, которые могли остаться в `validateProject` и prepared workers после удаления файлов в Task 4. Полезные нормализованные запросы и backpressure уже должны находиться в production-модулях Tasks 4–5; не оставлять два варианта одной реализации.

- [ ] **Step 6: Проверить полный validation-договор**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/validateProject.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/project/preparedYamlProject.test.ts
  pnpm --filter @nakidka/core exec vitest run metadata/validation --reporter=dot
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS; `rg "sqlite(FirstPass|Reference)Experiment|SQLITE_" packages/core` ничего не находит.

- [ ] **Step 7: Commit**

  ```bash
  git add -A packages/core/metadata/validation packages/core/metadata/project packages/core/index.ts
  git commit -m "refactor: :recycle: перевести validation на состояние проекта"
  ```

---

## Task 10: Перевести поиск ссылок и переименование

**Files:**

- Modify: `packages/core/metadata/operations/types.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Modify: `packages/core/metadata/operations/references.ts`

**Contract:** Поиск ссылок всегда выполняет одну актуализацию перед запросом индекса. Предварительный просмотр переименования актуализирует один раз; фактическое переименование — до изменения и после него. По умолчанию error-диагностики блокируют операции. `ignoreValidationErrors: true` разрешает продолжить, но diagnostics возвращаются и проверка не пропускается.

- [ ] **Step 1: Расширить таблицы операций тестами**

  Для обеих операций добавить `it.each` по `ignoreValidationErrors` и наличию error diagnostics. Поиск, продолженный с ошибками, должен сохранять исходные diagnostics и добавлять warning с кодом `search_result_may_be_incomplete`. Для rename отдельно проверить порядок вызовов:

  ```ts
  expect(calls).toEqual([
    "refresh-before",
    "read-target-and-references",
    "write-affected-yaml",
    "refresh-after",
  ])
  ```

  Техническая ошибка должна блокировать при обоих значениях флага. Preview rename не делает второй refresh. Если запись фактического rename успела изменить хотя бы один YAML и затем завершилась ошибкой, второй refresh всё равно выполняется перед возвратом failure, чтобы кэш соответствовал фактической файловой системе.

- [ ] **Step 2: Увидеть исходное падение**

  Run: `pnpm --filter @nakidka/core test -- metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts`

  Expected: FAIL на новом порядке и параметре.

- [ ] **Step 3: Расширить нейтральные параметры и результаты**

  ```ts
  export interface FindMetadataReferencesParams {
    readonly projectDir: string
    readonly path: string
    readonly ignoreValidationErrors?: boolean
    readonly projectState: ProjectStateService
  }
  ```

  Аналогично для rename. Успешный результат обеих операций получает `diagnostics: Diagnostic[]`; при продолжении с ошибками они не скрываются.

- [ ] **Step 4: Перевести поиск на read session**

  После refresh разрешить цель и получить обращения пакетными методами store. Не читать все YAML и не собирать metadata-модели. Если поиск продолжен при error diagnostics, добавить `search_result_may_be_incomplete`, не заменяя исходные ошибки. `allowWrite` не влияет на поиск; оставить его только на MCP-границе для совместимости до Task 13, затем удалить из core-параметров поиска.

- [ ] **Step 5: Перевести rename на план по индексу**

  Индекс возвращает исходный файл и YAML path обращения. Прочитать и изменить только эти файлы и путь переименовываемого объекта. После начала первой записи обязательно выполнить второй refresh в защищённой завершающей ветви и вернуть его diagnostics, даже если `ignoreValidationErrors` включён или последующая запись завершилась ошибкой. Ошибка второго refresh является технической и имеет приоритет над обычным результатом rename.

- [ ] **Step 6: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  ```

  Expected: PASS.

- [ ] **Step 7: Commit**

  ```bash
  git add packages/core/metadata/operations
  git commit -m "feat: :mag: использовать состояние в операциях ссылок"
  ```

---

## Task 11: Перевести полную sync на обязательную актуализацию

**Files:**

- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/testHelpers.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/project/componentState/types.ts`
- Modify: `packages/core/metadata/project/componentState/hashes.ts`
- Modify: `packages/core/metadata/project/componentState/indexes.ts`
- Modify: `packages/core/metadata/project/componentState/confirm.ts`
- Modify: `packages/core/metadata/project/componentState/indexes.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Contract:** Полная sync сначала выполняет общую актуализацию всего YAML-проекта. При error diagnostics sync блокируется, если не указан `ignoreValidationErrors: true`. Sync использует проекцию нужного компонента и read token из состояния, не холодно перестраивает validation snapshot. Частичная sync пока не реализуется; договор не должен мешать добавить её позднее.

- [ ] **Step 1: Добавить тесты блокировки и порядка**

  Проверить полную sync при: чистом проекте, error diagnostics по умолчанию, error diagnostics с ignore, технической ошибке. До построения плана должен завершиться refresh. Отдельно проверить `planSyncConfigurationToXml`: предварительный план также актуализирует состояние, потому что иначе он может выбрать устаревшие assignments.

- [ ] **Step 2: Увидеть исходное падение**

  Run: `pnpm --filter @nakidka/core test -- metadata/fullSyncToXml/syncConfiguration.test.ts metadata/project/componentState/indexes.test.ts`

  Expected: FAIL.

- [ ] **Step 3: Добавить параметры и единое отображение diagnostics**

  ```ts
  export interface SyncConfigurationToXmlParams {
    // существующие поля
    readonly projectState: ProjectStateService
    readonly ignoreValidationErrors?: boolean
  }
  ```

  `FullXmlSyncResult` и `FullXmlSyncPlanResult` возвращают diagnostics актуализации вместе с sync diagnostics, сохраняя различимый `code/source`.

- [ ] **Step 4: Проецировать component state из project state**

  `readComponentProjection(componentPath)` возвращает список project paths и один общий `hashBytes` нужного компонента из `project_files`/`file_hashes`; хэш позиции `i` занимает `[i * 8, i * 8 + 8)`, представление владеет всем буфером с нулевым смещением, а длина равна числу файлов, умноженному на 8. Если sync кратковременно нуждается в числовом значении, оно декодируется локально и не попадает в DTO. `componentState/indexes.ts` продолжает читать отдельный `ConfigurationSnapshot`, нужный sync, но больше не вызывает `runValidationFactPass` и не строит metadata `SharedValidationSnapshot`. Индекс validation доступен workers только через read token.

- [ ] **Step 5: Перевести sync workers на read token**

  В `FullXmlSyncWorkerCommand.initialize` заменить:

  ```ts
  localMetadata: SharedValidationSnapshot
  baseMetadata?: SharedValidationSnapshot
  ```

  на:

  ```ts
  projectStateReadToken: ProjectStateReadToken
  componentPath: string
  ```

  Worker открывает `ProjectStateReadSession`, пакетно получает нужные owner/target сведения при подготовке assignments и закрывает session в `dispose`. `SharedConfigurationIndexSnapshot` target/base sync остаётся отдельным договором и не смешивается с project state.

- [ ] **Step 6: Сохранить подтверждение состояния sync**

  `confirmComponentState` продолжает подтверждать configuration-index и XML sync state только после успешной sync. Project-state checkpoint уже выполнен актуализацией и не заменяет этот снимок.

- [ ] **Step 7: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/fullSyncToXml/syncConfiguration.test.ts metadata/fullSyncToXml/worker.test.ts metadata/project/componentState
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS.

  Дополнительно выполнить локальную сквозную проверку на компактной XML-выгрузке `/Users/nikita/git/round-trip-compact/cf/all`: импортировать её во временный YAML-проект, выполнить полную sync во временную XML-копию и подтвердить, что операция сначала завершила актуализацию состояния. Исходный каталог открывается только для чтения; абсолютный путь передаётся проверке явно и не попадает в production-код или обязательные CI-тесты.

- [ ] **Step 8: Commit**

  ```bash
  git add packages/core/metadata/fullSyncToXml packages/core/metadata/project/componentState
  git commit -m "feat: :arrows_counterclockwise: актуализировать состояние перед sync"
  ```

---

## Task 12: Интегрировать import без замедления ранней записи

**Files:**

- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/metadata/importFromXml/writeOutput.ts`
- Modify: `packages/core/metadata/importFromXml/writeOutput.test.ts`
- Modify: `packages/core/metadata/importFromXml/validationContribution.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Delete: `packages/core/metadata/importFromXml/componentReferenceIndex.ts`
- Delete: `packages/core/metadata/importFromXml/componentReferenceIndex.test.ts`
- Delete: `packages/core/metadata/importFromXml/metadataSnapshot.ts`
- Delete: `packages/core/metadata/importFromXml/metadataSnapshot.test.ts`
- Create: `packages/core/metadata/projectState/importSession.ts`
- Create: `packages/core/metadata/projectState/importSession.test.ts`
- Modify: `packages/core/metadata/projectState/contracts.ts`
- Modify: `packages/core/metadata/projectState/service.ts`
- Modify: `packages/core/metadata/projectState/index.ts`

**Contract:** Import сохраняет текущую раннюю запись. Готовый YAML сериализуется один раз, его запись начинается сразу, хэш считается по тем же bytes, локальная validation работает по уже имеющимся данным, а пакет состояния отправляется писателю без повторного чтения. Рабочий индекс фиксируется в основных таблицах в памяти до второго прохода, затем остаётся неизменным; второй проход только читает его отдельными read sessions.

- [ ] **Step 1: Усилить тесты текущего договора ранней записи**

  Существующие тесты должны явно проверять:

  - готовый YAML записан до окончания первого прохода остальных workers;
  - отложенный YAML удерживается только до второго прохода;
  - сгенерированные файлы пишутся сразу;
  - `serialize`, `write`, `hash`, local validation вызываются по одним bytes;
  - ни один окончательный YAML не перечитывается с диска;
  - после подтверждения writer пакет и YAML освобождаются;
  - хэши нескольких файлов кодируются в один общий big-endian буфер пачки без `bigint`, строки, отдельного буфера или `hashOffset` в передаваемых DTO.

- [ ] **Step 2: Добавить тест двухфазного import session**

  ```ts
  const session = await state.beginImport({ projectDir, workerCount: 2 })
  await session.writeFirstPassBatch(batch)
  const token = await session.commitWorkingIndex()
  expect(() => session.writeIndexBatch(otherBatch)).rejects.toThrow(/индекс.*неизменяем/i)
  await session.writeFinalFileState(finalBatch)
  await session.finalize()
  ```

  Два workers должны видеть одинаковый индекс через отдельные sessions. Параллельная запись хэшей/локальных diagnostics после фиксации индекса не меняет ответы lookup.

  Для пачек окончательного состояния из обоих проходов проверить успешный `structuredClone`, transfer единственного общего `ArrayBuffer`, big-endian порядок нескольких разных хэшей и отказ при ненулевом смещении либо длине на один байт меньше/больше требуемой.

  Расширение `ProjectStateService` и договор session зафиксировать явно:

  ```ts
  export interface ProjectStateService {
    // методы из Task 6
    beginImport(params: ProjectStateImportParams): Promise<ProjectStateImportSession>
  }

  export interface ProjectStateImportSession {
    writeFirstPassBatch(batch: readonly ProjectStateImportIndexContribution[]): Promise<void>
    commitWorkingIndex(): Promise<ProjectStateReadToken>
    writeFinalFileState(batch: ProjectStateImportFinalFileStateBatch): Promise<void>
    finalize(): Promise<ProjectStateRefreshResult>
    abort(cause: unknown): Promise<void>
  }
  ```

  `ProjectStateImportFinalFileStateBatch` имеет поля `{ updates; hashBytes }` с тем же договором: update не содержит хэш/`hashOffset`, `byteOffset` равен нулю, а длина общего представления и его буфера равна `updates.length * 8`; big-endian xxHash64 определяется позицией. `ProjectStateImportFinalFileState` намеренно не содержит reference/owner/field/form-вкладов, поэтому второй проход не может переписать уже зафиксированный индекс.

- [ ] **Step 3: Запустить тесты до интеграции**

  Run: `pnpm --filter @nakidka/core test -- metadata/importFromXml/writeOutput.test.ts metadata/importFromXml/worker.test.ts metadata/projectState/importSession.test.ts`

  Expected: FAIL на session и едином bytes-потоке.

- [ ] **Step 4: Сделать запись bytes главным результатом сериализации**

  ```ts
  export interface SerializedImportYaml {
    readonly file: ImportOutputFile
    readonly bytes: Uint8Array
    readonly localHash: bigint
  }

  export function serializeImportYaml(file: PreparedImportYaml): SerializedImportYaml {
    const bytes = textEncoder.encode(exportToYAML(file.yaml))
    const localHash = hashFileBytes(bytes)
    return { file: file.output, bytes, localHash }
  }
  ```

  `localHash` — кратковременное локальное значение внутри import worker, а не переносимый DTO. Сборщик ограниченной пачки ровно один раз кодирует его в общий `ProjectStateImportFinalFileStateBatch.hashBytes` в big-endian до передачи writer; после этого `bigint` освобождается. `writeOutput` принимает bytes, а не сериализует повторно. Локальная validation получает уже разобранный объект и location index, не читает записанный файл.

- [ ] **Step 5: Записывать первый проход в основные индексные таблицы**

  `ProjectStateImportSession` начинает новую отдельную память, очищает состояние путей, принадлежащих import-выводу, и принимает first-pass index rows по мере готовности. Для ещё не завершённых файлов допустимо отсутствие `file_hashes`/`file_validation_results`. Временные дублирующие индексные таблицы не создавать.

- [ ] **Step 6: Зафиксировать рабочий индекс только в памяти**

  После окончания первого прохода выполнить внутренний commit, выдать token и запретить дальнейшие изменения `reference_entries`, `owner_facts`, `field_entries`, `form_entries`. На этом этапе не выполнять checkpoint на диск.

- [ ] **Step 7: Перевести второй проход workers на `ProjectStateReadSession`**

  Каждый worker открывает собственную session из token. Уточнение deferred DataPath и прочих полей делает пакетные lookup. Результат второго прохода содержит окончательные bytes, DTO local diagnostics/pending checks и общий буфер big-endian хэшей пачки, но не повторяет уже записанный индекс. После перевода удалить `LayeredImportReferenceSnapshot`, `componentReferenceIndex` и `metadataSnapshot`: их сведения уже находятся в основных таблицах project state.

- [ ] **Step 8: Завершить import полной проверкой и одним checkpoint**

  После второго прохода:

  1. дождаться всех файловых записей и пакетов состояния;
  2. закрыть read sessions;
  3. выполнить полную dependency validation;
  4. записать configuration index import;
  5. выполнить `quick_check` и checkpoint project state;
  6. вернуть diagnostics, не откатывая корректный import из-за обычных validation errors.

  При технической ошибке после in-memory commit закрыть sessions, отбросить незавершённую память и восстановить прежний снимок.

- [ ] **Step 9: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/importFromXml metadata/projectState/importSession.test.ts
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS; тест подтверждает раннюю запись и отсутствие повторного чтения.

  Затем выполнить локальную сквозную проверку import на `/Users/nikita/git/round-trip-compact/cf/all` во временный YAML-проект. На том же временном проекте выполнить прогретую полную sync во временную XML-копию. Зафиксировать, что исходная XML-выгрузка не изменена, import не перечитывает окончательные YAML, а sync использует актуальное project state. Путь задаётся только параметром локального запуска и не встраивается в тесты или production-код.

- [ ] **Step 10: Commit**

  ```bash
  git add packages/core/metadata/importFromXml packages/core/metadata/projectState/importSession.ts packages/core/metadata/projectState/importSession.test.ts
  git commit -m "feat: :inbox_tray: сохранять состояние во время import"
  ```

---

## Task 13: Подключить единый жизненный цикл и команды MCP

**Files:**

- Create: `packages/mcp/src/services/projectStateHandle.ts`
- Create: `packages/mcp/src/services/projectStateHandle.test.ts`
- Delete: `packages/mcp/src/services/validationHandle.ts`
- Modify: `packages/mcp/src/server.ts`
- Modify: `packages/mcp/src/server.test.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/contracts/validateProject.ts`
- Modify: `packages/mcp/src/contracts/syncToXml.ts`
- Modify: `packages/mcp/src/contracts/operations.ts`
- Create: `packages/mcp/src/contracts/projectCache.ts`
- Modify: `packages/mcp/src/services/validateProject.ts`
- Modify: `packages/mcp/src/services/validateProject.test.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.test.ts`
- Modify: `packages/mcp/src/services/findReferences.ts`
- Modify: `packages/mcp/src/services/findReferences.test.ts`
- Modify: `packages/mcp/src/services/renameItem.ts`
- Modify: `packages/mcp/src/services/renameItem.test.ts`
- Modify: `packages/mcp/src/services/importFromXml.ts`
- Modify: `packages/mcp/src/services/importFromXml.test.ts`
- Create: `packages/mcp/src/services/projectCache.ts`
- Create: `packages/mcp/src/services/projectCache.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/index.ts`

**Contract:** Один `ProjectStateService` живёт весь срок MCP и лениво обслуживает один активный проект. Все пять операций получают его через сервисный слой. MCP добавляет `nkdk.reset_project_cache` и `nkdk.rebuild_project_cache`; обе требуют `allowWrite: true`. Сервер всегда закрывает project-state worker.

- [ ] **Step 1: Написать тесты общего handle**

  Проверить ленивое создание, переиспользование между validation/sync/find/rename/import, переключение projectDir, единственное закрытие при shutdown и повторный безопасный `close()`.

- [ ] **Step 2: Написать контракты reset/rebuild**

  ```ts
  export const ProjectCacheInput = Type.Object({
    projectDir: Type.String(),
    allowWrite: Type.Literal(true),
  }, { additionalProperties: false })
  ```

  Reset удаляет только `.nkdk/cache/project-state.sqlite` и runtime-состояние. Rebuild строит отдельное состояние всего проекта, выполняет полную validation и атомарно меняет активное/дисковое состояние; обычные diagnostics не мешают замене.

  Тест reset проверяет, что прежний read token становится недействительным, configuration index `.nkdk/components/**/configuration-index.bin` остаётся на месте и новый snapshot не создаётся. Тест rebuild проверяет сохранение прежнего runtime/disk state при технической ошибке и успешную замену при обычных error diagnostics.

- [ ] **Step 3: Запустить MCP-тесты до реализации**

  Run: `pnpm --filter @nakidka/mcp test -- src/services/projectStateHandle.test.ts src/services/projectCache.test.ts src/tools/registerTools.test.ts`

  Expected: FAIL.

- [ ] **Step 4: Заменить validation handle общим project-state handle**

  Handle создаёт core `ProjectStateService` и предоставляет один метод `get()`. В `server.ts` закрыть его в том же `finally`, где закрывается platform manager. Validation worker pool становится внутренней частью core service. После перевода MCP удалить устаревший публичный `createValidationWorkerPoolHandle` из `validateProject.ts`, `packages/core/index.ts` и `CoreApi`. MCP build должен собирать `projectStateWriterWorker.js` рядом с остальными worker-файлами; `server.test.ts` проверяет его наличие в `dist/bin`.

- [ ] **Step 5: Передать корень проекта, а не каталог компонента**

  `findReferences.ts` и `renameItem.ts` должны передавать core корневой `projectDir`; компонент выражается разрешённым operation path. Не открывать отдельное состояние для `cf` и `cfe`.

- [ ] **Step 6: Добавить `ignoreValidationErrors` в публичные контракты**

  Поле добавить в sync, find references и rename. Для validation и import поле отсутствует. Описания инструментов явно говорят: проверки выполняются всегда; флаг только разрешает продолжение при их diagnostics.

- [ ] **Step 7: Зарегистрировать служебные команды**

  В `registerTools.ts` добавить `nkdk.reset_project_cache` и `nkdk.rebuild_project_cache`. Reset требует подтверждения записи и не запускает validation. Rebuild возвращает diagnostics и статистику холодного построения.

- [ ] **Step 8: Проверить MCP-жизненный цикл**

  Run:

  ```bash
  pnpm --filter @nakidka/mcp test
  pnpm --filter @nakidka/mcp build
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS.

- [ ] **Step 9: Commit**

  ```bash
  git add -A packages/mcp packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts packages/core/index.ts
  git commit -m "feat: :electric_plug: подключить состояние проекта к MCP"
  ```

---

## Task 14: Удалить старое полное представление индекса

**Files:**

- Delete: `packages/core/metadata/validation/sharedProjectReferenceIndex.ts`
- Delete: `packages/core/metadata/validation/sharedProjectReferenceIndex.test.ts`
- Delete: `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`
- Delete: `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`
- Delete: `packages/core/metadata/validation/sharedValidationSnapshot.ts`
- Delete: `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`
- Delete: `packages/core/metadata/validation/persistedSharedValidationSnapshot.ts`
- Delete: `packages/core/metadata/validation/persistedSharedValidationSnapshot.test.ts`
- Delete: `packages/core/metadata/validation/validationSnapshotProvider.ts`
- Delete: `packages/core/metadata/validation/validationSnapshotProvider.test.ts`
- Delete: `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Contract:** В production-пути нет полного дубликата project-state индекса в `SharedArrayBuffer`, BLOB, `Map` или объектном графе. Малые временные пакеты запросов/ответов и отдельный `SharedConfigurationIndexSnapshot` sync не считаются дубликатом project-state.

- [ ] **Step 1: Получить исчерпывающий список потребителей**

  Run:

  ```bash
  rg -n "SharedValidationSnapshot|SharedProjectReferenceIndex|PersistedSharedValidation|validationSnapshotProvider|ProjectValidationGraph" packages/core packages/mcp
  ```

  Expected: только определения/тесты старого пути. Если остаётся production-потребитель, перевести его на пакетный `ProjectStateReadSession` в рамках этой задачи до удаления файлов.

- [ ] **Step 2: Добавить архитектурную проверку отсутствия полного дубля**

  В `importBoundaries.test.ts` проверить отсутствие production-импортов старых shared-модулей и запрет полей `validationSnapshot`, `sharedValidation`, `sharedReferenceIndex` в новых worker-командах. Сам архитектурный тест входит в явный список разрешённых файлов, потому что обязан назвать запрещённые строки.

- [ ] **Step 3: Запустить проверку до удаления**

  Run: `pnpm --filter @nakidka/core test -- metadata/importBoundaries.test.ts`

  Expected: FAIL, пока старый путь доступен production-коду.

- [ ] **Step 4: Удалить старые модули и точечно перенести полезные чистые функции**

  Переносить только форматирование, сортировку и policy-функции. Не переносить код упаковки/распаковки полного графа. Повторно выполнить `rg` из Step 1.

- [ ] **Step 5: Проверить слой**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/importBoundaries.test.ts metadata/validation metadata/importFromXml metadata/fullSyncToXml
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS; `rg` не находит production-потребителей старого полного графа.

- [ ] **Step 6: Commit**

  ```bash
  git add -A packages/core
  git commit -m "refactor: :wastebasket: удалить дублирующий общий индекс"
  ```

---

## Task 15: Актуализировать архитектурные документы и ограничения

**Files:**

- Modify: `.agents/architecture.md`
- Modify: `.agents/restrictions.md`
- Create: `packages/mcp/README.md`

**Contract:** Документация соответствует фактическому коду: единый внутренний блок актуализации, ранняя запись import, read-only второй проход, обязательные pre/post refresh, ignore-флаг, reset/rebuild, SQLite за промежуточным слоем и обязательный jscpd.

- [ ] **Step 1: Сверить документацию с экспортируемыми типами**

  Run:

  ```bash
  rg -n "ProjectState(Service|Store|ReadSession)|ignoreValidationErrors|reset_project_cache|rebuild_project_cache" packages/core packages/mcp .agents docs/superpowers/specs
  ```

  Составить список расхождений до редактирования.

- [ ] **Step 2: Обновить архитектуру без смены согласованной схемы**

  Сохранить читаемое расположение диаграммы: слева вертикальные пользовательские операции, по центру вертикальный import, справа вертикально раскрытый блок «Актуализация и проверка состояния проекта». Одинаковые блоки должны иметь одинаковые названия Б1–Б6.

- [ ] **Step 3: Снять устаревшие ограничения**

  В `.agents/restrictions.md` удалить утверждение, что ранняя запись import не реализована. Добавить только реально оставшиеся ограничения; не переносить туда описание архитектуры целиком.

- [ ] **Step 4: Описать публичные MCP-параметры**

  В README привести короткие примеры `ignoreValidationErrors`, reset и rebuild, подчеркнуть отсутствие ключа файла/компонента у validation.

- [ ] **Step 5: Проверить ссылки и тесты документации**

  Run:

  ```bash
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  ```

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add .agents/architecture.md .agents/restrictions.md packages/mcp/README.md
  git commit -m "docs: :memo: актуализировать архитектуру состояния проекта"
  ```

---

## Task 15A: Упростить согласованность чтения и защитить изменяющие операции по хэшу

**Files:**

- Modify: `packages/core/metadata/projectState/projectFiles.ts`
- Modify: `packages/core/metadata/projectState/refresh.ts`
- Modify: `packages/core/metadata/projectState/refresh.test.ts`
- Modify: `packages/core/metadata/projectState/projectFilesConcurrency.test.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Modify: `packages/core/metadata/operations/filePlan.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`

**Contract:** Validation и поиск ссылок строят состояние по фактически прочитанным байтам без `stat`/`fstat`, полей стабильности и повторного полного прохода. Полная sync сохраняет существующее сравнение ожидаемого хэша с хэшем непосредственно используемых байтов. Переименование сохраняет ожидаемые хэши затронутых YAML и до первой записи отклоняет весь план, если хотя бы один файл изменился.

- [ ] **Step 1: Тестом закрепить одно чтение без метаданных файловой системы**

  Удалить тесты ограниченного stability retry и заменить их наблюдаемыми договорами:

  - каждый ресурс читается один раз и хэшируется по прочитанным байтам;
  - результат не содержит `stability`, `dev`, `inode`, `size` или `mtimeNs`;
  - после локальной и dependency validation не выполняются повторные discovery/stat;
  - исчезновение до или во время самого чтения остаётся обычной технической ошибкой чтения и откатывает транзакцию.

  Run: `pnpm --filter @nakidka/core test -- metadata/projectState/refresh.test.ts metadata/projectState/projectFilesConcurrency.test.ts`

  Expected: FAIL до упрощения production-кода.

- [ ] **Step 2: Удалить общий механизм stability**

  Перевести чтение на один `readFile` внутри существующего ограничителя параллелизма. Удалить `ProjectResourceStability`, `isProjectStateFileCollectionStable`, `ProjectStateFilesChangedError`, две попытки refresh и все `stat`/`fstat`. Не менять вычисление xxHash64, передачу bytes изменённых YAML, транзакцию SQLite или диагностики.

- [ ] **Step 3: Тестом закрепить оптимистическую защиту переименования**

  Расширить существующий тест наблюдаемого договора: после построения плана изменить один из затронутых YAML и проверить, что фактическое переименование не записывает и не перемещает ни одного файла, возвращает технический конфликт и всё равно не скрывает исходные diagnostics. Не проверять внутреннее устройство плана.

  Run: `pnpm --filter @nakidka/core test -- metadata/operations/renameItem.test.ts metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/transferExternalFiles.test.ts`

  Expected: новый rename case FAIL; существующие sync-проверки подтверждают хэширование непосредственно используемых байтов.

- [ ] **Step 4: Добавить ожидаемые хэши в границу применения плана**

  Снимок затронутого YAML хранит xxHash64 прочитанных байтов. Перед первым изменяющим шагом `applyMetadataOperationFilePlan` одним предварительным проходом читает и хэширует все затронутые исходные файлы. При любом расхождении план не применяется. После начала применения сохраняется существующий договор частичного результата при технической ошибке; атомарную многофайловую запись не вводить.

- [ ] **Step 5: Проверить границы и производительность**

  Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/projectState/refresh.test.ts metadata/projectState/projectFilesConcurrency.test.ts metadata/operations/renameItem.test.ts metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/transferExternalFiles.test.ts
  pnpm --filter @nakidka/core type-check
  rg -n "ProjectResourceStability|ProjectStateFilesChangedError|mtimeNs|handle\.stat|isProjectStateFileCollectionStable" packages/core/metadata/projectState
  ```

  Expected: тесты и type-check PASS; `rg` не находит production-механизма stability.

- [ ] **Step 6: Commit**

  ```bash
  git add packages/core/metadata/projectState packages/core/metadata/operations
  git commit -m "perf: :zap: убрать повторную проверку файлов validation"
  ```

---

## Task 16: Выполнить приёмочное профилирование и полную проверку

**Files:**

- Modify: `.agents/skills/validation-profile/validation-profile.mjs`
- Modify: `.agents/skills/validation-profile/SKILL.md`
- Modify: `packages/core/metadata/validation/profile.ts`
- Modify: `packages/core/metadata/validation/profile.test.ts`
- Create: `docs/superpowers/results/2026-08-01-validation-project-state-cache-profile.md`

**Contract:** Профиль отдельно показывает cold/warm время, Peak RSS, число хэшированных ресурсов, число разобранных YAML, размер снимка, время загрузки и checkpoint. Результат validation сравнивается по полному содержимому diagnostics, не только по количеству.

- [ ] **Step 1: Сначала тестом расширить машинный результат профиля**

  ```ts
  expect(result).toMatchObject({
    hashedFiles: expect.any(Number),
    parsedYamlFiles: expect.any(Number),
    snapshotBytes: expect.any(Number),
    loadMs: expect.any(Number),
    checkpointMs: expect.any(Number),
  })
  ```

  Добавить сериализацию полного стабильного digest diagnostics для сравнения cold/warm.

- [ ] **Step 2: Запустить профильные тесты до изменения**

  Run: `pnpm --filter @nakidka/core test -- metadata/validation/profile.test.ts`

  Expected: FAIL на новых полях.

- [ ] **Step 3: Добавить измерения без влияния на production-путь**

  Передавать счётчики из `ProjectStateRefreshResult`; время измерять вокруг load/checkpoint в service и включать только в profile result. Не добавлять глобальные переменные окружения, меняющие алгоритм validation.

- [ ] **Step 4: Прогнать cold и warm профиль на целевом проекте**

  Использовать skill `validation-profile` и каталог `/Users/nikita/git/nkdk-yaml`. Первый запуск — после reset копии кэша, второй — без изменения YAML. Не удалять пользовательский кэш без явного подтверждения: профиль должен работать с временной копией проекта либо отдельным путём снимка.

  Expected acceptance:

  - cold и warm diagnostics полностью равны эталонному холодному пути;
  - warm: `parsedYamlFiles === 0`;
  - cold slowdown не более 10%;
  - отсутствует второй полный индекс;
  - зафиксированы время, Peak RSS, snapshot size, load и checkpoint.

  Отдельно повторить компактный сквозной сценарий import + полная sync на `/Users/nikita/git/round-trip-compact/cf/all`. Все изменяемые результаты и кэш размещать во временном каталоге; исходную XML-выгрузку использовать только для чтения. Частичная sync пока не реализуется и в приёмочный сценарий не входит.

- [ ] **Step 5: Выполнить окончательную проверку**

  Run:

  ```bash
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm test
  git diff --check e768ba6321fc99b2623e04f1fe72a06c77f07b38..HEAD
  git status --short
  ```

  Expected: все команды PASS; status содержит только намеренные результаты профилирования, если они ещё не закоммичены.

- [ ] **Step 6: Запросить code review**

  Использовать `superpowers:requesting-code-review`. Проверяющему передать спецификацию, этот план, исходный jscpd commit и профиль. Особо попросить проверить отсутствие скрытого полного индекса, семантическое равенство diagnostics и технический откат import.

- [ ] **Step 7: Commit результата профиля**

  ```bash
  git add .agents/skills/validation-profile packages/core/metadata/validation/profile.ts packages/core/metadata/validation/profile.test.ts docs/superpowers/results/2026-08-01-validation-project-state-cache-profile.md
  git commit -m "perf: :chart_with_upwards_trend: проверить кэш состояния проекта"
  ```

---

## Final Acceptance Checklist

- [ ] Validation не имеет ключа файла/компонента и всегда проверяет весь проект.
- [ ] Прогретая validation хэширует все управляемые ресурсы и разбирает 0 неизменённых YAML.
- [ ] Локальные diagnostics неизменённых файлов возвращаются из SQLite; межфайловые всегда пересчитываются.
- [ ] Import записывает готовые файлы рано, не перечитывает YAML и не обновляет индекс во втором проходе.
- [ ] Sync, поиск ссылок и rename всегда актуализируют состояние; rename после записи делает второй refresh.
- [ ] Import, полная sync и выборочная sync прошли компактный сквозной сценарий на `/Users/nikita/git/round-trip-compact/cf/all` без изменения исходной выгрузки.
- [ ] `ignoreValidationErrors` не скрывает и не пропускает проверки; технические ошибки всегда блокируют.
- [ ] MCP держит один project-state worker и закрывает его при завершении.
- [ ] Reset и rebuild соблюдают `allowWrite` и не затрагивают configuration sync snapshot.
- [ ] В production нет полного дубликата project-state индекса в shared buffer, BLOB, `Map` или объектном графе.
- [ ] SQL и `node:sqlite` находятся только в `metadata/projectState/sqlite`.
- [ ] Все долгоживущие DTO и протоколы представляют xxHash64 одним общим 8-byte-per-file big-endian буфером пачки; store и writer отклоняют неверную длину.
- [ ] Все contract, integration, jscpd, type-check и workspace tests проходят; test cases соблюдают 50 мс, test files — 1 000 мс.
- [ ] Профиль `/Users/nikita/git/nkdk-yaml` удовлетворяет критериям спецификации.
