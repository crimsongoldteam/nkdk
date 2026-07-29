# Remove Rule Order Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью удалить временный анализатор порядка XML-свойств, сохранив готовый runtime-механизм `xmlOrder` и `present`.

**Architecture:** Анализатор удаляется вертикальным срезом: CLI и модули анализа, отдельная worker-команда и необязательный collector в XML-обходе. Рабочий XML-импорт после удаления остаётся единственным потребителем traversal-интерфейсов, а порядок XML продолжает определяться только `MetadataItemRule.xmlOrder`.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, Piscina, pnpm.

## Global Constraints

- Работать в `/Users/nikita/git/nkdk/.worktrees/rule-order-analysis` на ветке `codex/rule-order-analysis`.
- Не изменять заполненные `xmlOrder`, `getCompiledXMLPropertyOrder` и обработку `ConfigurationXmlNode.present`.
- Не удалять специальные `ConfigurationXmlNode.order` коллекций и интерфейсов.
- Исторические планы и спецификации анализа оставить как историю решения.
- Всё удаление оформить одним отдельным коммитом.
- Перед коммитом выполнить `pnpm test` из корня worktree.

---

### Task 1: Удалить анализатор и его точки подключения

**Files:**

- Delete: `packages/core/metadata/ruleOrderAnalysis/**`
- Delete: `packages/core/scripts/rule-order-analysis/**`
- Modify: `packages/core/package.json`
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**

- Removes: `RulePropertyOrderCollector`
- Removes: `DirectImportTraversal.ruleOrderCollector`
- Removes: `ImportWorkerCommand` variant `{ kind: "analyzeRuleOrder"; ... }`
- Removes: `RuleOrderAnalysisWorkerResult`
- Removes: `XmlImportOperationPool.analyzeRuleOrder(...)`
- Preserves: `MetadataItemRule.xmlOrder?: readonly string[]`
- Preserves: `getCompiledXMLPropertyOrder(rule: MetadataItemRule): readonly string[]`

- [ ] **Step 1: Зафиксировать исходную область удаления**

Run:

```bash
rg -n "ruleOrderAnalysis|rule-order-analysis|RulePropertyOrderCollector|ruleOrderCollector|analyzeRuleOrder|ruleOrderAnalysisResult" \
  packages/core package.json pnpm-workspace.yaml
```

Expected: вывод содержит только модули анализатора, package scripts, worker-команду, collector propagation и их тесты.

- [ ] **Step 2: Удалить самостоятельные модули и CLI**

Удалить все файлы под:

```text
packages/core/metadata/ruleOrderAnalysis/
packages/core/scripts/rule-order-analysis/
```

Из `packages/core/package.json` удалить:

```json
"analyze-rule-order": "tsx scripts/rule-order-analysis/index.ts",
"rewrite-rule-order": "tsx scripts/rule-order-analysis/index.ts --apply",
```

- [ ] **Step 3: Проверить ожидаемый RED после удаления модулей**

Run:

```bash
pnpm --dir packages/core type-check
```

Expected: FAIL на оставшихся импортах `../ruleOrderAnalysis/*` и ссылках worker на типы анализа. Это подтверждает, что рабочие точки подключения ещё не удалены.

- [ ] **Step 4: Удалить collector из XML-обхода**

В `importYamlTypes.ts` удалить интерфейс `RulePropertyOrderCollector` и поле
`DirectImportTraversal.ruleOrderCollector`.

Из сигнатур и вызовов удалить `ruleOrderCollector` в:

```text
orchestration/property/fromXMLToYAML.ts
orchestration/metadataItem/fromXMLToYAML.ts
forms/clientApplicationForm/fromXMLToYAML.ts
forms/elements/orchestration/fromXMLToYAML.ts
importFromXml/prepareYaml.ts
```

В `orchestration/property/fromXMLToYAML.ts` удалить только блок:

```ts
if (params.ruleOrderCollector !== undefined) {
  params.ruleOrderCollector.accept(...)
}
```

Сбор, необходимый для стабильного заполнения `present`, сохранить и переименовать из
`observedOrderByXmlNode` в `configurationPresenceByXmlNode`. Из его внутреннего значения удалить
ставшие ненужными `keys`, `seen`, `sourceXmlPath` и `logicalAddress`, оставив:

```ts
{
  collector: ConfigurationIndexCollector
  present: Set<string>
}
```

Из тестов удалить только проверки передачи фактов порядка:

```text
orchestration/property/fromXMLToYAML.test.ts
forms/elements/__tests__/fromXMLToYAML.test.ts
```

Остальные проверки `present`, aliases и вложенного импорта сохранить.

- [ ] **Step 5: Удалить анализ из XML-import worker**

В `importFromXml/types.ts`:

- удалить импорт `RawRuleOrderObservation`;
- удалить variant `ImportWorkerCommand` с `kind: "analyzeRuleOrder"`;
- удалить `RuleOrderAnalysisWorkerResult`;
- убрать его из `ImportWorkerCommandResult`.

В `importFromXml/worker.ts`:

- удалить импорты `buildRuntimeRuleOrderCatalog`, `fingerprintMetadataItemRule` и связанных типов;
- удалить кэш `ruleOrderCatalog`;
- удалить ветку `command.kind === "analyzeRuleOrder"`;
- удалить `runRuleOrderAnalysis` и `getRuleOrderCatalog`.

В `importFromXml/workerPool.ts` удалить метод `analyzeRuleOrder` целиком. Рабочие переходы фаз
`initialized → firstPassReady → secondPassRunning` не менять.

В тестах удалить только сценарии и заглушки `analyzeRuleOrder`/`ruleOrderAnalysisResult`:

```text
importFromXml/worker.test.ts
importFromXml/workerPool.test.ts
importFromXml/importConfiguration.test.ts
```

- [ ] **Step 6: Проверить отсутствие временного договора**

Run:

```bash
rg -n "ruleOrderAnalysis|rule-order-analysis|RulePropertyOrderCollector|ruleOrderCollector|analyzeRuleOrder|ruleOrderAnalysisResult" \
  packages/core package.json pnpm-workspace.yaml
```

Expected: команда завершается с кодом 1 и ничего не выводит.

Отдельно проверить сохранённый runtime:

```bash
rg -n "xmlOrder|getCompiledXMLPropertyOrder" \
  packages/core/metadata/orchestration/property \
  packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts
```

Expected: находятся тип `xmlOrder`, компилятор, XML-export и BaseForm-проекция.

- [ ] **Step 7: Выполнить целевые проверки**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/property \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm \
  metadata/importFromXml
pnpm --dir packages/core type-check
```

Expected: PASS без тестов анализатора и без ошибок типов.

- [ ] **Step 8: Выполнить полную проверку**

Run:

```bash
git diff --check
pnpm test
```

Expected: `git diff --check` не выводит ошибок; все workspace-тесты проходят.

- [ ] **Step 9: Создать отдельный коммит**

Run:

```bash
git add packages/core/package.json \
  packages/core/metadata \
  packages/core/scripts/rule-order-analysis
git commit -m "refactor: :recycle: удалить временный анализатор порядка" \
  -m "Порядок XML уже перенесён в rules.ts, поэтому сбор наблюдений и worker-команда больше не нужны. Runtime-механизм xmlOrder и специальный порядок коллекций сохраняются."
```

Expected: один коммит удаления поверх `ff8c291d8`, рабочее дерево чистое.
