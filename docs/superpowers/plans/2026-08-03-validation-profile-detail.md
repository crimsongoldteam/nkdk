# Детальное профилирование валидации — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разложить `processFiles` на измеримые операции worker и главного процесса в отчёте `validation-profile --timing`.

**Architecture:** Существующий `createValidationProfiler()` записывает агрегированные отметки только при `NKDK_PROFILE=1`. Worker измеряет файловый и YAML-конвейер одной пачки, пул — ожидание worker и применение результата, а измерительный скрипт группирует эти отметки в отдельную таблицу Б1–Б4.

**Tech Stack:** TypeScript, Node.js `performance`, Vitest, существующий текстовый протокол `[nkdk-profile-step]`.

## Global Constraints

- Обычная валидация не меняет результат, двоичный формат и рабочий протокол.
- Не выводить отдельную строку профиля на каждый файл.
- Mutation testing не запускать.
- Целевые тесты должны укладываться в 50 мс, желательно в 10 мс.

---

### Task 1: Измерения worker для Б1–Б4

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Test: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`

**Interfaces:**
- Consumes: `createValidationProfiler({ scope: "worker", workerIndex })`.
- Produces: записи шага `Обработка файлов Б1–Б4` с подпунктами `Чтение файлов`, `Вычисление хэшей`, `Сравнение хэшей`, `Разбор YAML`, `Локальная проверка YAML`, `Сбор сведений файла`, `Двоичное кодирование результата`.

- [ ] **Step 1: Написать падающий тест профиля worker**

Перехватить `console.error`, временно установить `NKDK_PROFILE=1`, обработать одной задачей два YAML и проверить, что каждый новый подпункт присутствует ровно один раз, а `items=2`.

- [ ] **Step 2: Подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts -t "профилирует Б1–Б4 одной записью на подпункт" --no-isolate`

Expected: FAIL, новые `substep` отсутствуют.

- [ ] **Step 3: Добавить агрегированные таймеры**

В `refreshProjectStateFiles()` накапливать времена чтения, хэширования, сравнения и двоичного кодирования. В `ValidationFirstPassAccumulator` накапливать разбор YAML, вызов `validateProjectFileFirstPass()` и сбор `ProjectStateFileUpdate`. Перед возвратом задачи записать по одной строке каждого подпункта и вызвать `flush()`.

- [ ] **Step 4: Проверить worker**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts --no-isolate`

Expected: PASS; новый тест выполняется менее 50 мс.

### Task 2: Измерения главного процесса и отчёт скилла

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`
- Modify: `.agents/skills/validation-profile/SKILL.md`
- Test: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Create: `.agents/skills/validation-profile/validation-profile.test.mjs`

**Interfaces:**
- Consumes: записи `[nkdk-profile-step]` шага `Обработка файлов Б1–Б4`.
- Produces: записи главного процесса `Подготовка задания`, `Ожидание worker`, `Применение двоичных пачек`, `Применение удалений` и таблицу `Обработка файлов Б1–Б4`.

- [ ] **Step 1: Написать падающие тесты пула и форматирования**

Расширить существующий тест `project-state refresh pool`: при `NKDK_PROFILE=1` проверить единственную агрегированную запись применения двух пачек. В тесте скрипта импортировать чистую функцию форматирования и проверить порядок строк новой таблицы.

- [ ] **Step 2: Подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts -t "профилирует применение пачек" --no-isolate`

Run: `node --test .agents/skills/validation-profile/validation-profile.test.mjs`

Expected: FAIL из-за отсутствующих записей и экспортируемой функции.

- [ ] **Step 3: Реализовать измерения и таблицу**

Пул использует один `createValidationProfiler({ scope: "main" })` на `runProjectStateRefresh()`, суммирует операции всех lane и печатает записи после `Promise.allSettled()`. Скрипт экспортирует функции разбора/агрегации, запускает CLI только при прямом вызове и печатает отдельную таблицу отфильтрованных записей Б1–Б4. В `SKILL.md` перечислить новые строки отчёта и правило различать реальное и суммарное worker-время.

- [ ] **Step 4: Запустить быстрые проверки и типы**

Run: `node --test .agents/skills/validation-profile/validation-profile.test.mjs`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts --no-isolate`

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

### Task 3: Реальный профиль

**Files:** без изменений.

**Interfaces:**
- Consumes: собранный `packages/core/dist/index.js` и временный YAML-проект.
- Produces: фактическое разбиение холодного `processFiles`.

- [ ] **Step 1: Собрать core**

Run: `pnpm --filter @nkdk/core build`

- [ ] **Step 2: Запустить один профильный прогон под ограничителем**

Run: `/opt/homebrew/bin/timeout 115s node .agents/skills/validation-profile/validation-profile.mjs /private/tmp/nkdk-binary-validation-project --runs 1 --timing --json`

Expected: завершение до 115 секунд; JSON содержит новые записи Б1–Б4, а digest совпадает с прежним `75106694d1310a4abb65bc2323b58ca4c72765b38401faa6ea4007fc2ddf02d3`.

- [ ] **Step 3: Проверить изменения**

Run: `git diff --check`

Run: `pnpm check:duplicates -- --base 0e5403794b0d6694ee2f33d283cf0011478cb96c`

Expected: PASS. Полный `pnpm test` не запускать для изменения измерительного режима; mutation testing не запускать.

- [ ] **Step 4: Зафиксировать реализацию**

```bash
git add packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts packages/core/metadata/project/preparedYamlProjectWorker.test.ts .agents/skills/validation-profile/SKILL.md .agents/skills/validation-profile/validation-profile.mjs .agents/skills/validation-profile/validation-profile.test.mjs
git commit -m "perf: :stopwatch: детализировать профиль валидации"
```
