# Cycle Component Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Показывать производственные циклы dependency-cruiser как компактный список связных компонент.

**Architecture:** Существующий Tarjan-анализ остаётся единственным источником определения циклов. Новый чистый форматтер группирует модули компоненты по верхним областям, а `architecture:report` печатает сводку перед созданием HTML-отчёта.

**Tech Stack:** Node.js, dependency-cruiser, `node:test`.

## Global Constraints

- Не изменять архитектурные правила и `.dependency-cruiser-known-violations.json`.
- Не изменять production-код пакетов `packages/*`.
- Сохранить существующий формат отдельных cycle violations для CI.

---

### Task 1: Компактный отчёт циклических компонент

**Files:**
- Modify: `tools/dependency-cruiser/src/cycle-analysis.mjs`
- Create: `tools/dependency-cruiser/src/cycle-report.mjs`
- Modify: `tools/dependency-cruiser/src/report.mjs`
- Create: `tools/dependency-cruiser/test/cycle-report.test.mjs`

**Interfaces:**
- Produces: `findProductionCycleComponents(result)` возвращает отсортированные циклические компоненты.
- Produces: `formatProductionCycleReport(components)` возвращает русскоязычную текстовую сводку.

- [x] **Step 1: Write the failing formatter and component tests**

Проверить одну компоненту из двух модулей, детерминированную сортировку, число внутренних зависимостей и группировку по верхней области.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tools/dependency-cruiser/test/cycle-report.test.mjs`

Expected: FAIL из-за отсутствующего `cycle-report.mjs` или экспортируемой функции.

- [x] **Step 3: Implement component extraction and formatting**

Расширить результат Tarjan-анализатора списком членов компоненты. Форматтер должен выводить общий итог, затем для каждой компоненты размер, число внутренних зависимостей, распределение по областям и до трёх файлов-примеров.

- [x] **Step 4: Connect the formatter to the existing report command**

`report.mjs` получает результат `createCruiseResult`, печатает `formatProductionCycleReport(findProductionCycleComponents(result))`, затем создаёт прежний HTML без изменения его формата.

- [ ] **Step 5: Verify targeted and architecture-rule tests**

Run: `node --test 'tools/dependency-cruiser/test/*.test.mjs'`

Expected: PASS.

- [ ] **Step 6: Generate the current report**

Run: `pnpm architecture:report`

Expected: терминал содержит компактную сводку компонент, `reports/dependency-cruiser/violations.html` создаётся как прежде.

- [x] **Step 7: Check duplicates and formatting**

Run: `pnpm duplicates -- --base HEAD`

Expected: новых дублей нет.

Run: `git diff --check`

Expected: ошибок форматирования нет.
