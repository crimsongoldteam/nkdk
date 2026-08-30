# XML Import Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Освобождать тяжёлое состояние каждого XML-import assignment во втором проходе и перечитывать только файлы с решениями проверки.

**Architecture:** Второй проход становится владельцем первой записи YAML и сразу освобождает разобранное дерево. Третий проход остаётся фазой окончательных решений, но выполняет работу только для затронутых файлов и восстанавливает их из записанного YAML.

**Tech Stack:** TypeScript, Vitest, Piscina, LMDB, compiled MCP stdio profiler.

**Spec:** `docs/superpowers/specs/2026-08-30-xml-import-memory-design.md`

## Global Constraints

- Peak RSS полного импорта: не более 4 ГиБ.
- Допустимое замедление относительно 74,973 с на `cf/doc`: не более 10%.
- XML-фикстуры не изменять; новые применения `!xml` не добавлять.

---

### Task 1: Немедленная запись и освобождение YAML

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`

**Interfaces:**
- Consumes: `prepareYamlForFinalPass(...)`, `writeMainImportYaml(...)`.
- Produces: `secondPassBatch` возвращает записанные файлы и не удерживает `DeferredImportYaml` после задания.

- [ ] **Step 1: Изменить существующий тест трёх проходов**

Закрепить, что `secondPassBatch` возвращает один файл, файл уже существует, а
`stateForTests().preparedYamlIds` пуст после пачки.

- [ ] **Step 2: Запустить тест и увидеть ожидаемое падение**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/importFromXml/worker.integration.test.ts -t "публикует смысловой индекс"`

Expected: FAIL, потому что файл пока записывается только третьим проходом.

- [ ] **Step 3: Перенести запись в `processSecondPass`**

Записать `main` и необязательный `base`, добавить файлы в аккумулятор, затем в
`finally` удалить тяжёлую запись из `preparedYaml` и обнулить счётчики удержания.
Сохранить только компактное описание assignment, необходимое третьему проходу.

- [ ] **Step 4: Запустить целевой тест**

Expected: PASS.

### Task 2: Выборочная обработка решений третьего прохода

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`

**Interfaces:**
- Consumes: записанный YAML и `issueDecisionsByProjectPath`.
- Produces: третий проход без решений не читает и не пишет YAML; с решением перечитывает, применяет решение, валидирует и перезаписывает файл.

- [ ] **Step 1: Усилить существующий тест межфайлового invalid**

Закрепить отсутствие работы для assignment без решения, повторную локальную
проверку только формы с решением и корректное окончательное состояние.

- [ ] **Step 2: Запустить тест и увидеть ожидаемое падение**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/importFromXml/worker.integration.test.ts -t "назначает межфайловый invalid"`

Expected: FAIL по новому счётчику выборочного перечитывания.

- [ ] **Step 3: Реализовать выборочное перечитывание**

По компактному описанию получить целевой путь и правило, пропустить assignment
без решений. Для затронутого файла разобрать YAML, применить решения,
сериализовать, выполнить локальную проверку для нового index/final и
перезаписать файл без добавления дубликата в список файлов результата.

- [ ] **Step 4: Запустить целевые тесты worker**

Expected: PASS.

### Task 3: Проверка памяти и времени

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts`

**Interfaces:**
- Consumes: checkpoints профиля и `createXmlImportWorkerPoolOptions()`.
- Produces: ограничение heap worker, достаточное для общего бюджета 4 ГиБ.

- [ ] **Step 1: Изменить профильный тест**

Закрепить нулевые `items` и `bytes` удерживаемого входа/output после пачки.

- [ ] **Step 2: Запустить профильный тест и увидеть ожидаемое падение**

Expected: FAIL до освобождения тяжёлых записей.

- [ ] **Step 3: После реального профиля выбрать минимальный подтверждённый лимит worker**

Изменить `maxOldGenerationSizeMb` только по результату `cf/doc`; не снижать
лимит, если это вызывает OOM или превышает общий бюджет.

- [ ] **Step 4: Запустить compiled MCP профиль**

Run: `node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-profile-doc-optimized --runs 1 --concurrency 4 --json`

Expected: Peak RSS ≤ 4096 МиБ, response ≤ 82,470 с, warnings/errors совпадают с базой 1/0.

- [ ] **Step 5: Выполнить проверки репозитория**

Run: `pnpm type-check`, `pnpm test`, `pnpm duplicates -- --base 394b746e4`, `pnpm test:architecture`.

