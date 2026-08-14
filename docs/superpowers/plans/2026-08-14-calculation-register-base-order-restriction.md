# Calculation Register Base Order Restriction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Зафиксировать ограничение платформенной частичной загрузки, переместить создаваемый тестовый регистр расчёта после существующих по имени и продолжить матричный сценарий с контрольной точки 39.

**Architecture:** Ограничение документируется без изменения механизма частичной синхронизации. Имя регистра становится единой экспортируемой константой матрицы и используется корневой декларацией и XML перерасчёта, чтобы будущие операции не расходились. Контрольная точка мигрирует только между планами с неизменным завершённым префиксом операций.

**Tech Stack:** TypeScript, Vitest, Markdown, MCP автономного сервера, JSON-состояние внешнего сценария.

## Global Constraints

- Не добавлять зависимую форму в частичный архив.
- Не ослаблять полное обратное сравнение.
- Не менять смысл операций 1–39.
- Сохранять единственную контрольную копию `checkpoints/current`.
- При несовпадении завершённого префикса не мигрировать состояние, а остановиться.

---

### Task 1: Документировать ограничение и переименовать объект матрицы

**Files:**
- Modify: `.agents/restrictions.md`
- Modify: `e2e/partial-sync/matrix/root-objects.ts`
- Modify: `e2e/partial-sync/matrix/children.ts`
- Test: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: `matrixObjectNames.calculationRegister: string`, единое имя регистра для корневых и дочерних деклараций.

- [ ] **Step 1: Write the failing test**

Добавить в `e2e/partial-sync/matrix.test.ts` проверку, что операция `object:calculation-register` использует имя `ЯПроверкаЧастичнойСинхронизацииРегистрРасчета`, не содержит старого имени в путях или строковом содержимом и остаётся непосредственно после `object:chart-of-calculation-types` в плане создания.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run --config e2e/partial-sync/vitest.config.ts e2e/partial-sync/matrix.test.ts`

Expected: FAIL, потому что корневая декларация ещё использует `ПроверкаЧастичнойСинхронизацииРегистрРасчета`.

- [ ] **Step 3: Write minimal implementation**

В `root-objects.ts` экспортировать объект `matrixObjectNames`, задать полю `calculationRegister` позднее имя и использовать его в корневой декларации. В `children.ts` импортировать эту константу и заменить ею путь и три имени `GeneratedType` перерасчёта. В `.agents/restrictions.md` добавить установленное опытом ограничение: вставка регистра перед существующими может оставить в форме техническую ссылку `11:<UUID>` на перестроенную таблицу `База`; до отдельной поддержки зависимых форм тестовые новые регистры должны добавляться после существующих.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run --config e2e/partial-sync/vitest.config.ts e2e/partial-sync/matrix.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify the finished layer**

Run: `pnpm type-check`

Run: `pnpm duplicates -- --base b98d40b35`

- [ ] **Step 6: Commit**

```bash
git add .agents/restrictions.md e2e/partial-sync/matrix/root-objects.ts e2e/partial-sync/matrix/children.ts e2e/partial-sync/matrix.test.ts
git commit -m "test: :white_check_mark: учесть порядок регистров расчета"
```

### Task 2: Мигрировать контрольную точку и продолжить внешний сценарий

**Files:**
- Modify outside repository: `/Users/nikita/Базы 1С/temp_test/state.json`
- Modify outside repository: `/Users/nikita/Базы 1С/temp_test/checkpoints/current/manifest.json`

**Interfaces:**
- Consumes: `buildScenarioPlan(partialSyncMatrix)` и `scenarioPlanHash(plan)`.
- Produces: одинаковый новый `planHash` в состоянии и манифесте при неизменной контрольной точке операции `object:chart-of-calculation-types`.

- [ ] **Step 1: Prove the completed prefix is unchanged**

Сравнить первые 39 операций нового плана с планом из коммита `b98d40b35`: ключи, виды и изменения должны быть побайтно равны. Проверить, что первая разница находится в операции 40 `object:calculation-register`.

- [ ] **Step 2: Compute and atomically publish the new hash**

Одноразовым скриптом проверить старый хэш `ae5cec751ba540bd4adbaaa1039e2fbc1e206b9f064ddaa47f289d7ee65d4661`, завершённую операцию `object:chart-of-calculation-types` и совпадение состояния с манифестом. Затем вычислить новый хэш через `scenarioPlanHash`, записать оба JSON через временные файлы и атомарное переименование.

- [ ] **Step 3: Verify checkpoint restoration**

Вызвать штатный `restoreCheckpoint`; ожидается успешная проверка хэшей файлов и восстановление проекта/базы без изменения содержимого контрольной точки.

- [ ] **Step 4: Continue the external scenario**

Run: `pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test'`

Expected: операция 40 с поздним именем проходит полную обратную выгрузку; сценарий продолжает следующие декларативные операции, заменяя контрольную копию после каждого успеха.

- [ ] **Step 5: Verify repository state**

Run: `git status --short`

Expected: рабочее дерево чистое; внешние состояние и контрольная копия соответствуют последней успешно завершённой операции.
