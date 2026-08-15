# File-Backed Child Partial Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить частичный XML-пакет для создания и удаления файловых подчинённых объектов так, чтобы платформа загружала XML владельца вместе с согласованным содержимым коллекции.

**Architecture:** Планировщик различает собственное объявление `fileBackedTarget`, запускающее структурную операцию, и принадлежность ресурса коллекции через его assignment. Добавление и удаление объявленного ресурса проходят через общую структурную ветку: владелец загружается, все текущие ресурсы коллекции включаются только в payload, а существующие структурные политики продолжают дополнять поведение форм.

**Tech Stack:** TypeScript 7, Vitest 4, нейтральная resource topology, ручной автономный partial e2e.

## Global Constraints

- Работать только в worktree `/Users/nikita/git/nkdk/.worktrees/partial-sync-resumable-test`.
- Согласованный договор: `docs/superpowers/specs/2026-08-15-file-backed-child-partial-sync-design.md`.
- Не изменять существующие XML-фикстуры.
- Не добавлять условия по metadata-типу, XML-корню или имени каталога.
- Не изменять общие типы правил и формат resource topology.
- Обычное изменение существующего внешнего файла не должно включать владельца.
- Полную матрицу partial e2e не начинать заново; продолжить текущий автономный сценарий с контрольной копии перед `templates:create`.
- После законченного слоя выполнить `pnpm duplicates -- --base 22ae13c99`.

---

### Task 1: Общий структурный договор `fileBackedTarget`

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/impactPlanner.ts`

**Interfaces:**
- Consumes: `MetadataProjectResourceMatch`, `CompiledMetadataFileBackedMemberTargetDeclaration`, `currentResources` и существующие функции включения assignment/external payload.
- Produces: локальные `declaredFileBackedTarget(resource)` и `collectionFileBackedTarget(resource)`; структурное включение добавленного или удалённого `content | externalFile` с собственным объявлением; прежний прямой путь для `changed`.

- [ ] **Step 1: Добавить в синтетическую топологию файловую коллекцию макетов**

В `impactPlanner.test.ts` рядом с внешними файлами объекта объявить два шаблона внешних ресурсов с общей файловой целью:

```ts
const templateTarget = {
  kind: "member" as const,
  memberKind: "Template" as const,
  itemNameParameter: "itemName",
  itemProjectPattern: "Объект/{ownerName}/Макеты/{itemName}",
  owner: "assignment" as const,
}

{
  kind: "externalFile" as const,
  assignmentProjectPattern: "Объект/{ownerName}/Свойства.yaml",
  projectPattern: "Объект/{ownerName}/Макеты/{itemName}/Template.xml",
  xmlPattern: "Objects/{ownerName}/Templates/{itemName}.xml",
  direction: "both" as const,
  transferCapabilityId: "test",
  compositionImpact: "none" as const,
  fileBackedTarget: templateTarget,
  source,
},
{
  kind: "externalFile" as const,
  assignmentProjectPattern: "Объект/{ownerName}/Свойства.yaml",
  projectPattern: "Объект/{ownerName}/Макеты/{itemName}/Template.txt",
  xmlPattern: "Objects/{ownerName}/Templates/{itemName}/Ext/Template.txt",
  direction: "both" as const,
  transferCapabilityId: "test",
  compositionImpact: "none" as const,
  fileBackedTarget: templateTarget,
  source,
}
```

Добавить константы путей `firstTemplateXml`, `firstTemplateText`,
`secondTemplateXml`, `secondTemplateText`. XML-фикстуры для этого unit-теста не
нужны: тест проверяет только план по классифицированным путям.

- [ ] **Step 2: Написать падающий тест создания**

Добавить отдельный договор для создания второго макета при уже существующем
первом:

```ts
it("при создании внешнего файлового объекта загружает владельца и передаёт всю коллекцию", () => {
  const result = plan(
    [
      root, language, owner,
      firstTemplateXml, firstTemplateText,
      secondTemplateXml, secondTemplateText,
    ],
    changes({ added: [secondTemplateXml, secondTemplateText] }),
  )

  expect(result.selection).toEqual({
    kind: "selected",
    projectPaths: [
      owner,
      firstTemplateXml, firstTemplateText,
      secondTemplateXml, secondTemplateText,
    ].sort(utf8),
  })
  expect(documentPaths(result)).toEqual(["Objects/Товары.xml"])
  expect(result.externalProjectPaths).toEqual([
    firstTemplateXml, firstTemplateText,
    secondTemplateXml, secondTemplateText,
  ].sort(utf8))
  expect(result.loadTargets).toEqual(["Objects/Товары.xml"])
})
```

- [ ] **Step 3: Написать падающий тест удаления и усилить проверку изменения**

Добавить удаление второго макета при сохранённом первом:

```ts
it("при удалении внешнего файлового объекта загружает владельца и оставшуюся коллекцию", () => {
  const result = plan(
    [root, language, owner, firstTemplateXml, firstTemplateText],
    changes({ deleted: [secondTemplateXml, secondTemplateText] }),
  )

  expect(result.selection).toEqual({
    kind: "selected",
    projectPaths: [owner, firstTemplateXml, firstTemplateText].sort(utf8),
  })
  expect(documentPaths(result)).toEqual(["Objects/Товары.xml"])
  expect(result.externalProjectPaths).toEqual([firstTemplateXml, firstTemplateText].sort(utf8))
  expect(result.loadTargets).toEqual(["Objects/Товары.xml"])
})
```

Добавить или расширить тест изменения `firstTemplateText`, чтобы точное ожидание
оставалось минимальным:

```ts
expect(result.selection).toEqual({ kind: "selected", projectPaths: [firstTemplateText] })
expect(result.externalProjectPaths).toEqual([firstTemplateText])
expect(result.loadTargets).toEqual([
  "Objects/Товары/Templates/Первый/Ext/Template.txt",
])
```

- [ ] **Step 4: Запустить RED**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts --project core-metadata packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts
```

Expected: тест создания падает, потому что в payload и `loadTargets` попадают
только два новых внешних файла; тест удаления падает с ошибкой «Удалённый
внешний файл нельзя включить в XML-пакет». Тест обычного изменения проходит.

- [ ] **Step 5: Ввести единое извлечение файловой цели**

В `impactPlanner.ts` импортировать тип
`CompiledMetadataFileBackedMemberTargetDeclaration` и добавить два локальных
помощника:

```ts
function declaredFileBackedTarget(
  resource: MetadataProjectResourceMatch,
): CompiledMetadataFileBackedMemberTargetDeclaration | undefined {
  if (resource.kind === "content") return resource.assignment?.fileBackedTarget
  if (resource.kind === "externalFile") return resource.externalFile?.fileBackedTarget
  return undefined
}

function collectionFileBackedTarget(
  resource: MetadataProjectResourceMatch,
): CompiledMetadataFileBackedMemberTargetDeclaration | undefined {
  return declaredFileBackedTarget(resource)
    ?? (resource.kind === "externalFile" ? resource.assignment?.fileBackedTarget : undefined)
}
```

`declaredFileBackedTarget` использовать только для запуска структурной
операции. `collectionFileBackedTarget` использовать в `memberCollectionKey`,
при перечислении текущих участников коллекции и при проверке, что удалённый
внешний файл поглощён уже обработанным удалением коллекции. Не добавлять новое
поле в `MetadataProjectResourceMatch`.

- [ ] **Step 6: Обобщить структурное включение коллекции**

Изменить `includeMemberCollection` так, чтобы он принимал ресурс и найденное
объявление, а policy был необязательным дополнением:

```ts
function includeMemberCollection(
  resource: MetadataProjectResourceMatch,
  declaration: CompiledMetadataFileBackedMemberTargetDeclaration,
): void {
  const policy = resource.assignment === undefined
    ? undefined
    : params.policies.assignments.get(resource.assignment.id)
  const structural = policy?.structural
  const ownerPath = expandMetadataPathPattern(declaration.ownerProjectPattern, resource.values)
  const owner = currentByPath.get(ownerPath)
  if (owner?.kind !== "content") {
    throw new Error(`Не найден текущий владелец файлового metadata: ${ownerPath}`)
  }

  if (structural?.includeOwnerAssignment !== false) includeAssignment(owner, true)
  if (structural?.includeOwnerAssignment === true) includeAssignmentExternalFiles(owner)
  if (structural?.includeCurrentMemberSubtree === false) return

  for (const current of currentByPath.values()) {
    const currentDeclaration = collectionFileBackedTarget(current)
    if (currentDeclaration?.memberKind !== declaration.memberKind) continue
    if (expandMetadataPathPattern(currentDeclaration.ownerProjectPattern, current.values) !== ownerPath) continue
    if (current.kind === "content") includeAssignment(current, false)
    if (current.kind === "externalFile") includeExternal(current, false)
  }
}
```

Явная структурная политика форм сохраняет прежнее включение внешних файлов
владельца. При отсутствии политики, как у макетов, действуют нейтральные
значения по умолчанию: включить владельца и всю текущую коллекцию.

- [ ] **Step 7: Подключить добавление и удаление внешнего ресурса**

В первом цикле удалений сначала получить `const declaration =
declaredFileBackedTarget(match)`. При наличии объявления вызвать
`includeMemberCollection(match, declaration)`, сохранить ключ коллекции и
пометить удалённый путь обработанным независимо от `match.kind`.

В цикле добавлений разделить прямую и структурную доставку:

```ts
const declaration = declaredFileBackedTarget(current)
if (declaration !== undefined) {
  if (current.kind === "content") includeDirectCurrent(current)
  includeMemberCollection(current, declaration)
} else {
  includeDirectCurrent(current)
  // существующие ветки fileItem и configurationComposition
}
```

Так новый внешний файл не становится самостоятельным `loadTarget`, но новый
`content` формы сохраняет прежнюю загрузку собственного XML. Цикл `changed` не
переводить на структурную ветку.

Во втором цикле удалений использовать `collectionFileBackedTarget(match)` и
ключ коллекции, чтобы уже обработанные внешние пути не попадали в общую ошибку.

- [ ] **Step 8: Запустить GREEN и регрессии планировщика**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts --project core-metadata packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts
pnpm type-check
pnpm duplicates -- --base 22ae13c99
```

Expected: все тесты планировщика проходят; TypeScript не сообщает ошибок;
новых блокирующих дублей нет.

- [ ] **Step 9: Закоммитить production-исправление и тесты**

```bash
git add packages/rules/metadata/partialSyncToXml/impactPlanner.ts packages/rules/metadata/partialSyncToXml/impactPlanner.test.ts
git commit -m "fix: :bug: загружать владельца файлового подобъекта"
```

### Task 2: Проверка исправления на текущем автономном partial e2e

**Files:**
- Verify only: `e2e/partial-sync/partial-sync.external.test.ts`
- Verify only: `/Users/nikita/Базы 1С/temp_test/retry`

**Interfaces:**
- Consumes: контрольную копию после блока `form-content:remove-content:probe` и следующий блок `templates:create:probe`.
- Produces: применённый ZIP текстового макета без повторного начального импорта конфигурации.

- [ ] **Step 1: Проверить точку продолжения без изменения состояния**

Прочитать `state.json` и manifest текущей контрольной копии. Ожидать завершённый
блок `form-content:remove-content:probe` и одинаковый `planHash`. Если сценарий
уже продвинулся дальше, использовать фактическую последнюю успешную точку и не
откатывать её.

- [ ] **Step 2: Продолжить автономный сценарий без `--reset`**

Run outside sandbox:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test/retry' --mode standalone-server
```

Expected: подготовка использует контрольную копию; блок
`templates:create:probe` возвращает `synchronized`, повторная отправка —
`unchanged`. Не останавливать успешно продолжающийся сценарий; зафиксировать
следующий реальный сбой отдельной диагностикой.

- [ ] **Step 3: Зафиксировать время платформенной части**

По журналу сценария записать длительность подготовки, первой отправки
`templates:create:probe`, проверки `unchanged` и контрольной копии. Сравнить с
предыдущим сбоем только как диагностику; жёсткий порог времени не вводить.

### Task 3: Итоговая проверка ветки

**Files:**
- Verify only: repository test and architecture configuration.

**Interfaces:**
- Consumes: коммит исправления Task 1 и результат платформенной проверки Task 2.
- Produces: доказательство отсутствия регрессий перед дальнейшим прохождением матрицы.

- [ ] **Step 1: Запустить обязательные проверки**

Run:

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 22ae13c99
```

`pnpm test` выполнять вне песочницы из-за LMDB. Expected: все команды
завершаются с кодом 0, архитектурный baseline не изменяется.

- [ ] **Step 2: Проверить чистоту рабочей ветки**

Run:

```bash
git status --short --branch
git log -3 --oneline
```

Expected: нет незакоммиченных файлов; последний production-коммит —
`fix: :bug: загружать владельца файлового подобъекта`, перед ним находятся
спецификация и план.

- [ ] **Step 3: Подготовить итог**

Сообщить:

- какие три наблюдаемых договора защищают новые тесты — создание, удаление и
  минимальное изменение содержимого;
- прошёл ли `templates:create:probe` на платформе и до какого блока дошёл
  продолжающийся сценарий;
- фактическое время платформенных стадий;
- результаты `pnpm test`, архитектурных проверок и проверки дублей;
- следующий обнаруженный сбой матрицы, если сценарий продолжился до него.
