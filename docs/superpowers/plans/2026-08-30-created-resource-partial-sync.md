# Полная загрузка новых metadata-ресурсов — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Загружать в 1С все фактически сформированные XML-документы и внешние файлы нового metadata-поддерева, сохранив минимальные пакеты изменений и удалений.

**Architecture:** `impactPlanner` различает обычную загрузку по политике и полную загрузку сформированного представления нового ресурса. Он вычисляет кандидатов нейтрально по топологии; `preparePartialXmlSyncPackage` оставляет только реально записанные пути через существующий `writtenPayloadPaths`.

**Tech Stack:** TypeScript 7, Vitest 4, metadata resource topology, partial XML ZIP.

**Spec:** `docs/superpowers/specs/2026-08-30-reliable-long-mcp-operations-and-created-resource-sync-design.md`

## Global Constraints

- В нейтральных слоях нет условий по `itemType`, `Form`, `Макеты`, `ChildFormNames` или каталогам конкретных metadata-типов.
- Полная загрузка применяется только к созданному назначению или участнику, определённому по `changes.added` и топологии.
- Изменение и удаление продолжают использовать существующие `loadDocumentRoles` и structural policies.
- Необязательные отсутствующие файлы исключаются существующим пересечением с `writtenPayloadPaths`.
- `designer-agent` и `standalone-server` получают один рассчитанный `loadTargets` без адаптерных дополнений.
- Существующие XML-фикстуры не изменяются.
- База проверки дублей: `49024fc07141c1945ce169929984ed6b6126c0fe`.

---

### Task 1: Режим полной загрузки сформированного назначения

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts`

**Interfaces:**
- Consumes: `PartialXmlChanges.added`, `assignmentDocumentIds`, `CompiledMetadataAssignmentNode.xmlDocuments`.
- Produces: внутренний `LoadRequest = "none" | "policy" | "allPayload"`; `includeAssignment(resource, request)`.

- [ ] **Step 1: Add failing tests for a new multi-document assignment**

Расширить тестовую топологию назначением с ролями `metadata`, `body`, `property` и внешним файлом. Для добавленного основного YAML закрепить полный список:

```ts
expect(plan(current, changes({ added: [newItem] })).loadTargets).toEqual([
  "Objects/Новый.xml",
  "Objects/Новый/Ext/Body.xml",
  "Objects/Новый/Ext/Property.xml",
  "Objects/Новый/Ext/Module.bsl",
].sort(utf8))
```

Для изменения того же YAML закрепить прежний минимальный договор:

```ts
expect(plan(current, changes({ changed: [newItem] })).loadTargets)
  .toEqual(["Objects/Новый.xml"])
```

- [ ] **Step 2: Run the planner test and confirm the new-assignment failure**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml/impactPlanner.test.ts
```

Expected: новый тест FAIL — `body`, `property` и внешний файл отсутствуют в `loadTargets`; существующие тесты PASS.

- [ ] **Step 3: Replace the boolean load state with an ordered request**

В `impactPlanner.ts` добавить:

```ts
type LoadRequest = "none" | "policy" | "allPayload"

interface AssignmentState {
  payload: boolean
  load: LoadRequest
}

function strongerLoad(left: LoadRequest, right: LoadRequest): LoadRequest {
  const rank: Record<LoadRequest, number> = { none: 0, policy: 1, allPayload: 2 }
  return rank[left] >= rank[right] ? left : right
}
```

Заменить состояние `{ payload: boolean; load: boolean }` на `AssignmentState`. В `includeAssignment` после формирования payload вычислять требуемый уровень и добавлять:

```ts
const documentIds = request === "allPayload"
  ? assignmentDocumentIds.get(resource.projectPath) ?? new Set<string>()
  : new Set(policy?.loadDocumentIds ?? assignment.xmlDocuments.map(({ id }) => id))

for (const documentId of documentIds) {
  addDocument(resource, requiredDocument(assignment, documentId), true)
}
state.load = strongerLoad(state.load, request)
```

Вызовы с прежним `true` заменить на `"policy"`, с `false` — на `"none"`. Для добавленного основного `content` использовать `"allPayload"`; для добавленного внешнего файла существующего назначения оставить `"policy"`.

- [ ] **Step 4: Include external files of a new assignment as full-load candidates**

Добавить нейтральный помощник:

```ts
function includeAssignmentPayloadSubtree(resource: MetadataProjectResourceMatch): void {
  const directory = posix.dirname(resource.projectPath)
  for (const current of currentByPath.values()) {
    if (current.projectPath !== resource.projectPath && !current.projectPath.startsWith(`${directory}/`)) continue
    if (current.kind === "content") includeAssignment(current, "allPayload")
    if (current.kind === "externalFile") includeExternal(current, true)
  }
}
```

Вызывать его только когда основной `content`-путь назначения присутствует в `changes.added`.

- [ ] **Step 5: Run tests and type-check**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml/impactPlanner.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: все выбранные тесты PASS, type-check exit 0.

- [ ] **Step 6: Commit the generic assignment behavior**

```bash
git add packages/rules/metadata/partialSyncToXml/impactPlanner.ts packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts
git commit -m "fix: :bug: полностью загружать новое XML-задание"
```

### Task 2: Полное поддерево нового file-backed участника

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts`

**Interfaces:**
- Consumes: `CompiledMetadataFileBackedMemberTargetDeclaration.itemProjectPattern` и `changes.added`.
- Produces: `isCreatedMember(resource, declaration)` и загрузка только файлов нового участника при сохранении payload соседей.

- [ ] **Step 1: Add failing created-member tests**

Для новой формы/табличного file-backed участника с `metadata`, `body` и модулем ожидать владельца и все файлы нового участника, но не файлы существующего соседа:

```ts
expect(result.loadTargets).toEqual([
  "Objects/Товары.xml",
  "Objects/Товары/Forms/Новая.xml",
  "Objects/Товары/Forms/Новая/Ext/Form.xml",
  "Objects/Товары/Forms/Новая/Ext/Form/Module.bsl",
].sort(utf8))
expect(result.loadTargets).not.toContain("Objects/Товары/Forms/Старая/Ext/Form.xml")
```

Отдельно закрепить: добавление только модуля существующего участника не переводит весь участник в режим создания.

- [ ] **Step 2: Verify both regressions fail**

Run the unit command from Task 1. Expected: у нового участника отсутствуют body/module; тест добавленного модуля фиксирует прежний минимальный путь.

- [ ] **Step 3: Identify creation by the member evidence path**

В начале planner создать `addedProjectPaths`. Добавить:

```ts
function isCreatedMember(
  resource: MetadataProjectResourceMatch,
  declaration: CompiledMetadataFileBackedMemberTargetDeclaration,
): boolean {
  return addedProjectPaths.has(expandMetadataPathPattern(declaration.itemProjectPattern, resource.values))
}
```

Это отличает добавление главного YAML участника от добавления внешнего файла уже существующего участника.

- [ ] **Step 4: Preserve collection payload but load only the created member**

В `includeMemberCollection` вычислить `targetItemPath`. При обходе соседей продолжать добавлять их в payload с `"none"`, а ресурсы с тем же развернутым `itemProjectPattern` включать с `"allPayload"`/`true`, только если `isCreatedMember` вернул `true`:

```ts
const sameMember = expandMetadataPathPattern(currentDeclaration.itemProjectPattern, current.values)
  === targetItemPath
const createdLoad = sameMember && isCreatedMember(resource, declaration)
if (current.kind === "content") includeAssignment(current, createdLoad ? "allPayload" : "none")
if (current.kind === "externalFile") includeExternal(current, createdLoad)
```

Тот же договор применить в `includeFileItemCollection`: новый основной file-item получает `allPayload`, изменение существующего — `policy`.

- [ ] **Step 5: Run planner tests, rules type-check and duplicate check**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml/impactPlanner.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 49024fc07141c1945ce169929984ed6b6126c0fe
```

Expected: PASS и отсутствие новых дублей.

- [ ] **Step 6: Commit the member-subtree behavior**

```bash
git add packages/rules/metadata/partialSyncToXml/impactPlanner.ts packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts
git commit -m "fix: :bug: загружать поддерево нового metadata-участника"
```

### Task 3: Фильтрация необязательных файлов и реальный договор формы

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/partialXmlPackage.test.ts`
- Verify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts`

**Interfaces:**
- Consumes: `impact.loadTargets` и `writtenPayloadPaths`.
- Produces: архив и `load.lst`, содержащие только реально записанные цели.

- [ ] **Step 1: Add a package-level filtering test**

Создать boundary, где impact содержит обязательный XML и отсутствующий необязательный модуль, а writer записывает только XML. Закрепить:

```ts
expect(writer.close).toHaveBeenCalledWith(["Objects/Новый.xml"])
expect(writePending).toHaveBeenCalledWith(expect.objectContaining({
  state: expect.objectContaining({ loadTargets: ["Objects/Новый.xml"] }),
}))
```

- [ ] **Step 2: Strengthen the form policy test**

Не менять `loadDocumentIds: [metadata.id]` для существующей формы. Добавить утверждение, что assignment содержит `body`, а внешние файлы формы разрешены к загрузке; полнота создания обеспечивается общим planner, не формовой политикой.

- [ ] **Step 3: Run package and form tests**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/partialXmlPackage.test.ts
```

Expected: PASS; production-фильтр остаётся `impact.loadTargets.filter((target) => writtenPayloadPaths.has(target))`.

- [ ] **Step 4: Commit the package contract tests**

```bash
git add packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts packages/rules/metadata/forms/clientApplicationForm/partialXmlPackage.test.ts
git commit -m "test: :white_check_mark: закрепить полный пакет нового ресурса"
```

### Task 4: Документация, полная проверка и приёмка

**Files:**
- Modify after explicit approval: `.agents/architecture.md`
- Verify: `packages/platform/src/sessions/manager.test.ts`
- Verify: repository-wide checks.

**Interfaces:**
- Consumes: единый `loadTargets` из Core.
- Produces: документированный договор создания и проверенный одинаковый путь двух режимов платформы.

- [ ] **Step 1: Document the creation closure after explicit approval**

Добавить в раздел partial metadata operations нейтральный договор: при создании назначение/участник передаёт все записанные документы и external resources нового поддерева; update/delete остаются policy-driven; platform adapters не изменяют список.

- [ ] **Step 2: Verify the platform manager forwards one list unchanged**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/manager.test.ts
```

Expected: оба session doubles получают массив `loadTargets` без преобразования.

- [ ] **Step 3: Run mandatory repository checks**

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 49024fc07141c1945ce169929984ed6b6126c0fe
```

Expected: все команды exit 0.

- [ ] **Step 4: Commit architecture documentation**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: описать загрузку нового metadata-поддерева"
```

- [ ] **Step 5: Perform the real sed_nkdk acceptance check**

На свежей сборке MCP запустить `sync_to_infobase` для расширения, выгрузить расширение обратно и проверить наличие непустого `Ext/Form.xml`, исходных элементов формы и незакоммиченной надписи. Не изменять историю `sed_nkdk` и не коммитить приветствие.
