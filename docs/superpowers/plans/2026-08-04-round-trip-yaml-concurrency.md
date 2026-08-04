# Round-trip YAML Concurrency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запускать XML → YAML и YAML → XML диагностику с четырьмя работниками и измерить полный ERP round-trip.

**Architecture:** Изменение остаётся внутри диагностического `round-trip.sh`: оба MCP-входа получают фиксированное `concurrency: 4`. Production sync и обязательный `refreshAndValidate` не меняются.

**Tech Stack:** POSIX shell, Node.js `node:test`, MCP `nkdk.import_from_xml` и `nkdk.sync_to_xml`.

## Global Constraints

- `refreshAndValidate` перед sync сохраняется.
- `ignoreValidationErrors: true` продолжает разрешать sync при diagnostics, но не отключает актуализацию состояния.
- Параметр командной строки или переменная окружения для параллелизма не добавляются.
- Предыдущие диагностические XML-diff'ы нельзя откатывать без явного согласия пользователя.

---

### Task 1: Четыре работника в round-trip-yaml

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.test.mjs`
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

**Interfaces:**
- Consumes: `write_mcp_input(path, xmlDir, projectDir)` и `write_mcp_sync_input(path, xmlDir, projectDir)`.
- Produces: JSON-входы MCP с `concurrency: 4` для импорта и sync.

- [ ] **Step 1: Добавить падающую проверку договора**

Добавить в `.agents/skills/round-trip-yaml/round-trip.test.mjs`:

```js
test("запускает импорт и sync с четырьмя работниками", () => {
  const concurrencyValues = [...script.matchAll(/componentPath:"cf",concurrency:(\d+)/gu)]
    .map((match) => Number(match[1]))

  assert.deepEqual(concurrencyValues, [4, 4])
})
```

- [ ] **Step 2: Подтвердить красный тест**

Run: `node --test .agents/skills/round-trip-yaml/round-trip.test.mjs`

Expected: FAIL; фактические значения `[1, 1]` не равны `[4, 4]`.

- [ ] **Step 3: Реализовать минимальное изменение**

В `write_mcp_input` и `write_mcp_sync_input` заменить только `concurrency:1` на `concurrency:4`. Остальные поля JSON оставить без изменений.

- [ ] **Step 4: Подтвердить зелёный тест**

Run: `node --test .agents/skills/round-trip-yaml/round-trip.test.mjs`

Expected: PASS, 3 теста.

- [ ] **Step 5: Проверить отсутствие новых дублей и корректность diff**

Run: `pnpm duplicates -- --base 644df4636`

Expected: `Новых дублей относительно 644df4636 нет`.

Run: `git diff --check`

Expected: exit 0.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add .agents/skills/round-trip-yaml/round-trip.test.mjs .agents/skills/round-trip-yaml/round-trip.sh docs/superpowers/plans/2026-08-04-round-trip-yaml-concurrency.md
git commit -m "perf: :zap: распараллелить round-trip-yaml"
```

---

### Task 2: Измерить ERP round-trip

**Files:**
- External diagnostic target: `/Users/nikita/git/round-trip-compact/cf/erp`

**Interfaces:**
- Consumes: `round-trip.sh` с четырьмя работниками и чистый активный XML-каталог.
- Produces: полное время round-trip, время импорта, время sync и диагностические diff'ы.

- [ ] **Step 1: Проверить состояние ERP-каталога**

Run: `git -C /Users/nikita/git/round-trip-compact status --short -- cf/erp`

Expected: предыдущие diff'ы round-trip присутствуют. Получить явное согласие пользователя на их откат; не выполнять `git restore` самостоятельно без согласия.

- [ ] **Step 2: После согласия восстановить только ERP-каталог**

Run: `git -C /Users/nikita/git/round-trip-compact restore -- cf/erp`

Expected: `git status --short -- cf/erp` не выводит изменений.

- [ ] **Step 3: Запустить измерение**

Run:

```bash
/usr/bin/time -p env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/erp \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: import и sync завершаются успешно; `real` показывает полную длительность.

- [ ] **Step 4: Сравнить с исходным прогоном**

Исходное время: около 12 минут 10 секунд при `concurrency: 1`. Сообщить новое полное время, ускорение в разах и изменение количества diff-файлов.
