# Archive and Remove Rule Order Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Опубликовать полную копию временного анализатора в отдельной ветке, затем удалить его из рабочей ветки, сохранив заполненные `xmlOrder` и постоянный XML/YAML runtime.

**Architecture:** Текущий HEAD сначала закрепляется локальной и удалённой веткой `codex/rule-order-analyzer-archive`. После проверки удалённой ссылки из производственного кода вертикально удаляются CLI, модули анализа, worker-команда и необязательный collector обхода. Ограничение копирования XML перерасчётов фиксируется независимо в `.agents/restrictions.md`.

**Tech Stack:** Git, TypeScript 6, Node.js 26, Vitest 4, Piscina, pnpm.

## Global Constraints

- Работать в `/Users/nikita/git/nkdk/.worktrees/rule-order-analysis` на ветке `codex/rule-order-analysis`.
- Архивная ветка `codex/rule-order-analyzer-archive` должна быть опубликована до удаления.
- Не изменять заполненные `MetadataItemRule.xmlOrder`.
- Не изменять `getCompiledXMLPropertyOrder` и обработку `ConfigurationXmlNode.present`.
- Не удалять специальные `ConfigurationXmlNode.order` коллекций и интерфейсов.
- Исторические планы и спецификации анализа оставить в репозитории.
- Не изменять XML-фикстуры.
- Удаление анализатора и restriction оформить отдельными коммитами.
- Перед завершением выполнить `pnpm test` из корня worktree.

---

### Task 1: Опубликовать архивную ветку

**Files:**

- No source changes

**Interfaces:**

- Consumes: текущий чистый HEAD `codex/rule-order-analysis`
- Produces: локальную и удалённую ветку `codex/rule-order-analyzer-archive` на одном commit SHA

- [ ] **Step 1: Проверить исходное состояние**

Run:

```bash
test "$(git branch --show-current)" = "codex/rule-order-analysis"
test -z "$(git status --porcelain)"
git rev-parse HEAD
```

Expected: активна рабочая ветка, worktree чистый, напечатан SHA коммита спецификации.

- [ ] **Step 2: Создать архивную ветку на текущем HEAD**

Run:

```bash
git branch codex/rule-order-analyzer-archive HEAD
```

Expected: `git rev-parse codex/rule-order-analyzer-archive` совпадает с исходным SHA.

- [ ] **Step 3: Опубликовать архивную ветку**

Run:

```bash
git push -u origin codex/rule-order-analyzer-archive
```

Expected: push завершается успешно и устанавливает upstream.

- [ ] **Step 4: Проверить удалённую ссылку**

Run:

```bash
git ls-remote --heads origin refs/heads/codex/rule-order-analyzer-archive
git rev-parse codex/rule-order-analyzer-archive
```

Expected: обе команды показывают одинаковый SHA.

---

### Task 2: Зафиксировать ограничение перерасчётов

**Files:**

- Modify: `.agents/restrictions.md`

**Interfaces:**

- Produces: явный проектный договор для `Recalculations/Имя.xml`
- Preserves: текущее копирование файла без преобразования

- [ ] **Step 1: Добавить ограничение**

В конец `.agents/restrictions.md` добавить один пункт:

```markdown
- XML перерасчётов `Recalculations/Имя.xml` не преобразуется через `RecalculationRules`: при XML → YAML файл целиком копируется в `Перерасчеты/Имя/Recalculation.xml`, а при YAML → XML целиком копируется обратно. Поэтому `xmlOrder` в `RecalculationRules` не влияет на round-trip, пока действует этот договор.
```

- [ ] **Step 2: Проверить формулировку**

Run:

```bash
rg -n "Recalculations/Имя.xml|RecalculationRules|Recalculation.xml" .agents/restrictions.md
git diff --check
```

Expected: находится один новый пункт; ошибок пробелов нет.

- [ ] **Step 3: Создать отдельный коммит**

Run:

```bash
git add .agents/restrictions.md
git commit -m "docs: :memo: описать копирование XML перерасчётов"
```

Expected: создан документационный коммит, worktree чистый.

---

### Task 3: Удалить анализатор и его точки подключения

**Files:**

- Delete: `packages/core/metadata/ruleOrderAnalysis/**`
- Delete: `packages/core/scripts/rule-order-analysis/**`
- Modify: `packages/core/package.json`
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`
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
- Removes: worker-команду `{ kind: "analyzeRuleOrder"; ... }`
- Removes: `RuleOrderAnalysisFirstPassResult`
- Removes: `XmlImportWorkerPoolHandle.runRuleOrderAnalysisFirstPass(...)`
- Preserves: `MetadataItemRule.xmlOrder?: readonly string[]`
- Preserves: `getCompiledXMLPropertyOrder(rule: MetadataItemRule): readonly string[]`

- [ ] **Step 1: Зафиксировать текущую область временного договора**

Run:

```bash
rg -n "ruleOrderAnalysis|rule-order-analysis|RulePropertyOrderCollector|ruleOrderCollector|analyzeRuleOrder|RuleOrderAnalysis" \
  packages/core package.json pnpm-workspace.yaml
```

Expected: вывод содержит только анализатор, worker-команду, collector propagation и их тесты.

- [ ] **Step 2: Повторно применить ранее проверенный срез удаления**

Run:

```bash
git revert --no-commit ff1dfcca6
```

Expected: Git подготавливает удаление версии анализатора, существовавшей до её восстановления. Если изменённые после `ff1dfcca6` файлы конфликтуют, не завершать revert до выполнения следующих шагов.

- [ ] **Step 3: Удалить части анализатора, добавленные после восстановления**

Полностью удалить оставшиеся файлы:

```text
packages/core/metadata/ruleOrderAnalysis/
packages/core/scripts/rule-order-analysis/
```

Из `packages/core/package.json` удалить команды:

```json
"analyze-rule-order": "tsx scripts/rule-order-analysis/index.ts",
"rewrite-rule-order": "tsx scripts/rule-order-analysis/index.ts --apply",
```

- [ ] **Step 4: Удалить collector из постоянного XML-обхода**

Удалить `RulePropertyOrderCollector` и поле `DirectImportTraversal.ruleOrderCollector`.

Из следующих файлов удалить параметры и передачу `ruleOrderCollector`:

```text
metadata/orchestration/property/fromXMLToYAML.ts
metadata/orchestration/metadataItem/fromXMLToYAML.ts
metadata/orchestration/metadataCollection/fromXMLToYAML.ts
metadata/forms/clientApplicationForm/fromXMLToYAML.ts
metadata/forms/elements/orchestration/fromXMLToYAML.ts
metadata/importFromXml/prepareYaml.ts
```

В `metadataCollection/fromXMLToYAML.ts` удалить локальный переходник `remapItemRuleCollector`.

В `property/fromXMLToYAML.ts` удалить только отправку наблюдения:

```ts
params.ruleOrderCollector.accept({
  rule,
  fields: [...observation.keys],
  sourceXmlPath,
  logicalAddress: xmlNodeLogicalAddress,
})
```

Сбор `present` оставить. Внутреннее состояние сократить до:

```ts
{
  collector: ConfigurationIndexCollector
  present: Set<string>
}
```

- [ ] **Step 5: Удалить анализ из worker и worker pool**

В `importFromXml/types.ts` удалить импорт `RawRuleOrderObservation`, вариант команды
`analyzeRuleOrder`, `RuleOrderAnalysisFirstPassResult` и его участие в результате worker.

В `importFromXml/worker.ts` удалить:

- импорты каталога и fingerprint;
- `RuleOrderAnalysisOptions`;
- ветку анализа в `runFirstPass`;
- накопление `observations`, `unmatchedObservationCount`, `unmatchedItemTypes`;
- возврат `ruleOrderAnalysisFirstPassResult`.

В `importFromXml/workerPool.ts` удалить `runRuleOrderAnalysisFirstPass` из интерфейса и реализации.
Рабочие фазы `firstPass` и `secondPass` оставить без изменений.

- [ ] **Step 6: Удалить только временные тесты**

Удалить сценарии, которые проверяют:

- факты порядка в property, metadataCollection и элементах форм;
- `ruleOrderAnalysisFirstPassResult` в worker;
- `runRuleOrderAnalysisFirstPass` в worker pool;
- заглушку анализа в `importConfiguration.test.ts`.

Сохранить тесты `present`, обычного XML-import, вложенных metadata-коллекций и форм.

- [ ] **Step 7: Завершить revert без отдельного revert-коммита**

После разрешения всех конфликтов добавить разрешённые файлы в индекс и завершить служебное
состояние revert без создания коммита:

```bash
git add packages/core
git revert --quit
```

Затем проверить:

```bash
git status --short
git diff --check
```

Expected: нет unmerged-файлов; изменения содержат только удаление временного анализатора и его договора. `git revert --continue` не вызывать: итог будет зафиксирован обычным `refactor`-коммитом.

- [ ] **Step 8: Проверить отсутствие временного договора**

Run:

```bash
test -z "$(rg -l 'ruleOrderAnalysis|rule-order-analysis|RulePropertyOrderCollector|ruleOrderCollector|analyzeRuleOrder|RuleOrderAnalysis' packages/core package.json pnpm-workspace.yaml || true)"
```

Expected: команда завершается успешно.

Проверить сохранённый runtime:

```bash
rg -n "xmlOrder|getCompiledXMLPropertyOrder" \
  packages/core/metadata/orchestration/property \
  packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts
```

Expected: находятся тип `xmlOrder`, компилятор, XML-export и BaseForm-проекция.

- [ ] **Step 9: Выполнить целевые проверки**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/property \
  metadata/orchestration/metadataCollection \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm \
  metadata/importFromXml
pnpm --dir packages/core type-check
```

Expected: PASS без тестов анализатора и ошибок типов.

- [ ] **Step 10: Выполнить полную проверку**

Run:

```bash
git diff --check
pnpm test
```

Expected: все workspace-тесты проходят.

- [ ] **Step 11: Создать отдельный коммит удаления**

Run:

```bash
git add packages/core/package.json packages/core/metadata packages/core/scripts/rule-order-analysis
git commit \
  -m "refactor: :recycle: удалить временный анализатор порядка" \
  -m "Порядок XML перенесён в rules.ts, поэтому сбор наблюдений и worker-команда больше не нужны. Runtime-механизм xmlOrder и специальный порядок коллекций сохранены."
```

Expected: создан один коммит удаления, worktree чистый.

---

### Task 4: Проверить разделение веток

**Files:**

- No source changes

**Interfaces:**

- Consumes: опубликованную архивную ветку и очищенную рабочую ветку
- Produces: доказательство, что анализатор доступен только в архивной ветке

- [ ] **Step 1: Проверить архивную ветку**

Run:

```bash
git ls-tree -r --name-only codex/rule-order-analyzer-archive -- \
  packages/core/metadata/ruleOrderAnalysis \
  packages/core/scripts/rule-order-analysis
```

Expected: перечислены файлы обоих каталогов.

- [ ] **Step 2: Проверить рабочую ветку**

Run:

```bash
test -z "$(git ls-tree -r --name-only HEAD -- packages/core/metadata/ruleOrderAnalysis packages/core/scripts/rule-order-analysis)"
test -z "$(git status --porcelain)"
```

Expected: в рабочей ветке анализатора нет, worktree чистый.
