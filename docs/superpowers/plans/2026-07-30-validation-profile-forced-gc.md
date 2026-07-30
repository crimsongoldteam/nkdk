# Validation Profile Forced GC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в диагностический runner валидации явный режим принудительного GC между прогонами без изменений продуктового пути и обычного benchmark.

**Architecture:** Флаг разбирается только CLI runner. Runner проверяет наличие `global.gc` до загрузки compiled core, передаёт его в функцию снимка памяти и добавляет отметку режима только в диагностический результат. Тесты запускают настоящий CLI и отдельно проверяют порядок GC и снимка памяти через узкие зависимости функции.

**Tech Stack:** Node.js 26, ECMAScript modules, встроенные `node:test` и `node:assert`.

## Global Constraints

- Файлы `packages/*` не изменяются.
- Без `--gc-between-runs` существующее поведение и формат вывода не меняются.
- Принудительный GC не входит в `elapsedMs`.
- Режим запускается только через `node --expose-gc`.
- `--timing` остаётся отдельным прогоном без принудительного GC.
- В соответствии с `validation-profile` не запускать `pnpm test`.

---

### Task 1: CLI-договор и снимок памяти после GC

**Files:**
- Create: `.agents/skills/validation-profile/validation-profile.test.mjs`
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`

**Interfaces:**
- Consumes: `process.argv`, `globalThis.gc`, `process.memoryUsage`.
- Produces: параметр `gcBetweenRuns: boolean`; экспортируемая для теста функция `memorySnapshot({ gc, memoryUsage })`; условное поле результата `gcBetweenRuns: true`.

- [ ] **Step 1: Write the failing CLI tests**

Добавить тесты, запускающие настоящий runner:

```js
test("справка описывает режим принудительного GC", () => {
  const result = spawnSync(process.execPath, [runner, "--help"], { encoding: "utf8" })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /--gc-between-runs/)
})

test("режим требует запуска Node.js с --expose-gc", () => {
  const result = spawnSync(process.execPath, [runner, repoRoot, "--gc-between-runs"], {
    encoding: "utf8",
  })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /node --expose-gc/)
})
```

- [ ] **Step 2: Run the CLI tests to verify RED**

Run:

```bash
node --test .agents/skills/validation-profile/validation-profile.test.mjs
```

Expected: FAIL, потому что справка не содержит флаг, а CLI считает его неизвестным.

- [ ] **Step 3: Implement argument parsing and fail-fast validation**

В `usage()` добавить `--gc-between-runs`. В начальные параметры добавить:

```js
gcBetweenRuns: false,
```

В `parseArgs()` разобрать флаг и после проверки каталога вызвать:

```js
if (options.gcBetweenRuns && typeof globalThis.gc !== "function") {
  fail(
    "для --gc-between-runs запусти: node --expose-gc " +
      ".agents/skills/validation-profile/validation-profile.mjs ..."
  )
}
```

Перенести запуск CLI под защиту:

```js
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const options = parseArgs(process.argv.slice(2))
  const result = await runProfile(options)
  printResult(result, options)
}
```

- [ ] **Step 4: Run the CLI tests to verify GREEN**

Run:

```bash
node --test .agents/skills/validation-profile/validation-profile.test.mjs
```

Expected: 2 tests pass.

- [ ] **Step 5: Write failing behavior tests for snapshot ordering and disabled mode**

Добавить импорт `memorySnapshot` и два теста:

```js
test("принудительный GC выполняется перед снимком памяти", () => {
  const events = []
  memorySnapshot({
    gc: () => events.push("gc"),
    memoryUsage: () => {
      events.push("memory")
      return { rss: 20 * 1024 * 1024, heapUsed: 10 * 1024 * 1024 }
    },
  })
  assert.deepEqual(events, ["gc", "memory"])
})

test("обычный снимок памяти не вызывает GC", () => {
  const events = []
  memorySnapshot({
    memoryUsage: () => {
      events.push("memory")
      return { rss: 20 * 1024 * 1024, heapUsed: 10 * 1024 * 1024 }
    },
  })
  assert.deepEqual(events, ["memory"])
})
```

- [ ] **Step 6: Run the behavior tests to verify RED**

Run:

```bash
node --test .agents/skills/validation-profile/validation-profile.test.mjs
```

Expected: FAIL, потому что `memorySnapshot` не экспортируется и не принимает зависимости.

- [ ] **Step 7: Implement GC immediately before memory sampling**

Изменить функцию:

```js
export function memorySnapshot({ gc, memoryUsage = process.memoryUsage } = {}) {
  gc?.()
  const memory = memoryUsage()
  return {
    rssMiB: Math.round(memory.rss / 1024 / 1024),
    heapUsedMiB: Math.round(memory.heapUsed / 1024 / 1024),
    rssBytes: memory.rss,
  }
}
```

После вычисления `elapsedMs` вызывать:

```js
const memory = memorySnapshot({
  gc: options.gcBetweenRuns ? globalThis.gc : undefined,
})
```

Условно добавить к результату:

```js
if (options.gcBetweenRuns) result.gcBetweenRuns = true
```

- [ ] **Step 8: Run all runner tests to verify GREEN**

Run:

```bash
node --test .agents/skills/validation-profile/validation-profile.test.mjs
```

Expected: 4 tests pass.

- [ ] **Step 9: Commit Task 1**

```bash
git add .agents/skills/validation-profile/validation-profile.mjs \
  .agents/skills/validation-profile/validation-profile.test.mjs
git commit -m "feat: :sparkles: добавить принудительный GC в профиль"
```

### Task 2: Явная отметка режима и документация

**Files:**
- Modify: `.agents/skills/validation-profile/validation-profile.test.mjs`
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`
- Modify: `.agents/skills/validation-profile/SKILL.md`

**Interfaces:**
- Consumes: условное поле результата `gcBetweenRuns: true`.
- Produces: строка `Принудительный GC: между прогонами` только в диагностическом текстовом выводе; инструкция запуска с `--expose-gc`.

- [ ] **Step 1: Write failing output tests**

Экспортировать `printResult`, перехватить `console.log` внутри теста и проверить два результата с одинаковым минимальным набором полей:

```js
assert.match(renderResult({ ...result, gcBetweenRuns: true }), /Принудительный GC: между прогонами/)
assert.doesNotMatch(renderResult(result), /Принудительный GC/)
```

Для JSON проверить условность поля:

```js
assert.equal(JSON.parse(renderResult(result, { jsonOnly: true })).gcBetweenRuns, undefined)
```

- [ ] **Step 2: Run output tests to verify RED**

Run:

```bash
node --test .agents/skills/validation-profile/validation-profile.test.mjs
```

Expected: FAIL, потому что `printResult` не экспортируется и отметка режима не печатается.

- [ ] **Step 3: Implement conditional output marker**

Экспортировать `printResult` и после строки режима добавить:

```js
if (result.gcBetweenRuns === true) {
  console.log("Принудительный GC: между прогонами")
}
```

Не добавлять поле `gcBetweenRuns` к обычному результату.

- [ ] **Step 4: Update skill instructions**

В `.agents/skills/validation-profile/SKILL.md` добавить:

```bash
node --expose-gc .agents/skills/validation-profile/validation-profile.mjs \
  /path/to/yaml --runs 20 --gc-between-runs
```

Описать, что:

- режим диагностический и не предназначен для сравнения скорости;
- `heapUsedMiB` снимается после GC;
- отсутствие плато указывает на возможное удержание объектов, но не доказывает утечку без heap snapshot;
- продуктовый путь не меняется.

- [ ] **Step 5: Run focused verification**

Run:

```bash
node --test .agents/skills/validation-profile/validation-profile.test.mjs
node .agents/skills/validation-profile/validation-profile.mjs --help
node --expose-gc .agents/skills/validation-profile/validation-profile.mjs --help
git diff --check
```

Expected: тесты проходят; обе команды справки завершаются с кодом 0 и содержат `--gc-between-runs`; `git diff --check` не выводит ошибок.

- [ ] **Step 6: Commit Task 2**

```bash
git add .agents/skills/validation-profile/validation-profile.mjs \
  .agents/skills/validation-profile/validation-profile.test.mjs \
  .agents/skills/validation-profile/SKILL.md
git commit -m "docs: :memo: описать диагностику памяти validation"
```
