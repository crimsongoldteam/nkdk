# Extension Borrowing Diagnostic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить общую ошибку отсутствующей в расширении ссылки на точное сообщение о необходимости заимствовать существующую в основной конфигурации цель.

**Architecture:** Сохранить существующее разделение: `projectStateDependencyValidation` проверяет наличие цели в основной конфигурации, а `referenceNotIncludedInExtensionResult` только формирует диагностику для подтверждённого случая. Изменить текст этой диагностики без новых вариантов результата, условий по видам метаданных или изменений разрешения ссылок.

**Tech Stack:** TypeScript, Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-31-extension-borrowing-diagnostic-design.md`

## Global Constraints

- Совет о заимствовании показывается только тогда, когда цель найдена в основной конфигурации и отсутствует в расширении.
- Для цели, отсутствующей и в основной конфигурации, сохраняются сообщения `Не найден объект "…"` и `Не найдена ссылка "…"`.
- Точный новый текст: `Объект метаданных «<каноническая ссылка>» отсутствует в расширении. Заимствуйте его из основной конфигурации`.
- Не менять алгоритм разрешения ссылок, структуру `Diagnostic`, формат YAML/XML и XML-фикстуры.
- Не добавлять частные условия по виду метаданных в нейтральные слои.

---

## Карта файлов

- `packages/runtime/metadata/validation/projectReferenceIndex.ts` — единая фабрика диагностики цели, не включённой в расширение.
- `packages/rules/metadata/validation/projectReferenceIndex.test.ts` — узкий договор фабрики для объекта и свойства.
- `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts` — граница между незаимствованной и несуществующей целью на уровне состояния проекта.
- `packages/rules/metadata/project/validateProject.integration.test.ts` — итоговые сообщения полной проверки проекта и исчезновение ошибки по мере заимствования владельца и свойства.

### Task 1: Уточнить диагностику незаимствованной цели

**Files:**
- Modify: `packages/runtime/metadata/validation/projectReferenceIndex.ts:124-132`
- Test: `packages/rules/metadata/validation/projectReferenceIndex.test.ts:16-49`
- Test: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts:601-621`
- Test: `packages/rules/metadata/project/validateProject.integration.test.ts:102-124`

**Interfaces:**
- Consumes: `PendingMetadataTargetReference` с заполненными `canonical`, `filePath` и `yamlPath`; подтверждение существования цели в основной конфигурации остаётся обязанностью `projectStateDependencyValidation`.
- Produces: существующий результат `Extract<ProjectReferenceIndexResult, { ok: false }>` из `referenceNotIncludedInExtensionResult`; меняется только `diagnostics[0].message`.

- [ ] **Step 1: Обновить узкий тест фабрики диагностики**

В существующем параметризованном тесте для `object` и `member` заменить ожидание сообщения на:

```ts
message: `Объект метаданных «${reference.canonical}» отсутствует в расширении. `
  + `Заимствуйте его из основной конфигурации`,
```

- [ ] **Step 2: Обновить тест границы основной конфигурации**

В тесте `отличает незаимствованную цель cf от отсутствующей цели` ожидать новое сообщение до удаления `baseTarget`:

```ts
message: `Объект метаданных «${canonical}» отсутствует в расширении. `
  + `Заимствуйте его из основной конфигурации`,
```

Не менять вторую половину теста: после `store.deleteFiles([baseTarget.projectPath])` должна остаться проверка `missingMemberDiagnostic(source.projectPath)`. Аналогично заменить старый текст в остальных существующих ожиданиях `referenceNotIncludedInExtensionResult`, не добавляя новых тестовых сценариев.

- [ ] **Step 3: Обновить интеграционное ожидание итоговой проверки проекта**

В `validateProject.integration.test.ts` заменить старые сообщения для объекта и свойства на новый текст. Учесть лексикографическую сортировку итогового массива: ссылка `Catalog.Номенклатура.Attribute.Артикул` должна идти перед `Catalog.Номенклатура`.

```ts
[
  'Объект метаданных «Catalog.Номенклатура.Attribute.Артикул» '
    + 'отсутствует в расширении. Заимствуйте его из основной конфигурации',
  'Объект метаданных «Catalog.Номенклатура» отсутствует в расширении. '
    + 'Заимствуйте его из основной конфигурации',
]
```

- [ ] **Step 4: Запустить целевые тесты и подтвердить красную стадию**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/projectReferenceIndex.test.ts \
  metadata/validation/projectStateDependencyValidation.test.ts \
  metadata/project/validateProject.integration.test.ts
```

Expected: FAIL только в ожиданиях нового текста; фактическая диагностика содержит `Ссылка "…" не включена в расширение`.

- [ ] **Step 5: Изменить единственную фабрику сообщения**

В `referenceNotIncludedInExtensionResult` сохранить `ok`, `reason` и вызов `referenceDiagnostic`, заменив только сообщение:

```ts
diagnostics: [referenceDiagnostic(
  reference,
  `Объект метаданных «${reference.canonical}» отсутствует в расширении. `
    + `Заимствуйте его из основной конфигурации`,
)],
```

- [ ] **Step 6: Запустить целевые тесты и подтвердить зелёную стадию**

Повторить команду из Step 4.

Expected: PASS для трёх файлов; тест границы по-прежнему подтверждает старую диагностику после удаления цели из основной конфигурации.

- [ ] **Step 7: Проверить типы, дубли и весь проект**

Run:

```bash
pnpm type-check
pnpm duplicates -- --base 396ef3d7d
pnpm test
pnpm test:architecture
```

Expected: все команды завершаются с кодом `0`; проверка дублей не находит новых клонов относительно коммита e2e-фикстур.

- [ ] **Step 8: Закоммитить реализацию**

```bash
git add \
  packages/runtime/metadata/validation/projectReferenceIndex.ts \
  packages/rules/metadata/validation/projectReferenceIndex.test.ts \
  packages/rules/metadata/validation/projectStateDependencyValidation.test.ts \
  packages/rules/metadata/project/validateProject.integration.test.ts
git commit -m "fix: :bug: уточнить диагностику заимствования объектов"
```

Коммит не должен включать файлы спецификации, плана или e2e-фикстур: они фиксируются отдельными предшествующими коммитами.

### Task 2: Независимо проверить соответствие результата

**Files:**
- Inspect: все изменения после базового коммита, включая committed, staged, unstaged и относящиеся к реализации untracked-файлы.
- Modify: none — независимый проверяющий только сообщает замечания.

**Interfaces:**
- Consumes: спецификацию, этот план, закреплённый базовый SHA и путь worktree.
- Produces: `VERDICT: APPROVED` либо `VERDICT: CHANGES_REQUIRED` с замечаниями и пробелами проверок.

- [ ] **Step 1: Закрепить поверхность сравнения**

Передать проверяющему:

```text
Spec: docs/superpowers/specs/2026-08-31-extension-borrowing-diagnostic-design.md
Plan: docs/superpowers/plans/2026-08-31-extension-borrowing-diagnostic.md
Base SHA: 396ef3d7d
Worktree: /Users/nikita/git/nkdk/.worktrees/fix-inherited-extension-references
```

- [ ] **Step 2: Получить независимый вердикт по полному результату**

Проверяющий должен прочитать спецификацию и план, исследовать `git status --short`, все коммиты и весь diff после `396ef3d7d`, затем ответить по договору `executing-plans-with-review`.

Expected: `VERDICT: APPROVED` без замечаний и пробелов проверок.

- [ ] **Step 3: Закрыть замечания или выполнить финальные проверки**

При `CHANGES_REQUIRED` исправить каждое замечание, повторить затронутые проверки и вернуть тому же проверяющему полный обновлённый результат. После `APPROVED` повторить обязательные проверки из Task 1 Step 7; если дерево изменилось, снова запросить проверку.
