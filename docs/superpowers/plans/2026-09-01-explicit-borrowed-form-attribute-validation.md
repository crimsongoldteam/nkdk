# Explicit Borrowed Form Attribute Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проверять явное заимствование корневых реквизитов для всех путей формы расширения, сохранять ошибки импорта точечным `!xml/invalid` и согласованно восстанавливать XML-id заимствованных реквизитов во внешней форме и `BaseForm`.

**Architecture:** Общий `dataPath` resolver получает нейтральное происхождение корня `working | inherited`, а конкретный модуль `clientApplicationForm` применяет политику расширений к структурным фактам формы. Импорт использует ту же диагностику и существующую классификацию аномалий; синхронизация использует один сеанс назначения идентификаторов для двух XML-проекций формы.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm, YAML/XML metadata rules, project-state validation, configuration index.

**Spec:** `docs/superpowers/specs/2026-09-01-explicit-borrowed-form-attribute-validation-design.md`

**Comparison base:** `3c5c5df8988ef2aeabac8d0024ab6105ca1c091b`

## Global Constraints

- Не изменять существующие XML-фикстуры: отрицательные e2e-варианты строить как временные копии YAML.
- Не вводить `ЗаимствованныеРеквизиты`, числовые XML-id или отдельный признак `Объект` в пользовательский YAML.
- Не добавлять частные условия в нейтральные слои `validation`, `projectState`, `ruleRuntime` и `resourceTopology/core`.
- Обходить все свойства типа `DataPath` через реестр правил формы, не перечислять их вручную.
- Использовать `!xml/invalid`; не расширять применение `!xml/raw`.
- Не выполнять живые e2e с информационной базой 1С.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b`.

---

### Task 1: Происхождение корня в общем resolver

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/dataPath/types.ts`
- Modify: `packages/rules/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/rules/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`

**Interfaces:**
- Consumes: `FormDataPathIndex`, `FormDataPathSource`, `resolveDataPathCore`.
- Produces: `FormDataPathSource.origin?: "working" | "inherited"`; `ResolveDataPathCoreResult.root?: FormDataPathSource`; объединённый индекс формы возвращает происхождение без знания политики расширений.

- [ ] **Step 1: Write the failing provenance tests**

Добавить в `formDataPathContext.test.ts` два случая: одинаковый корень из рабочей YAML перекрывает `cf` и имеет `origin: "working"`; отсутствующий в рабочей YAML корень берётся из `cf` с `origin: "inherited"`.

```ts
expect(resolveDataPathCore({
  value: "Контрагент.Код",
  nameMode: "yaml",
  index: context.index,
  ownerCache,
})).toMatchObject({
  status: "ok",
  target: { source: { kind: "objectField" } },
  root: { kind: "formAttribute", name: "Контрагент", origin: expectedOrigin },
})
```

- [ ] **Step 2: Run the focused test and confirm the missing field**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`

Expected: FAIL because the root `FormDataPathSource` has no `origin`.

- [ ] **Step 3: Add neutral provenance and preserve it during merge**

Расширить источник формы:

```ts
export interface FormDataPathSource {
  kind: "formAttribute"
  name: string
  typeInfo: DataPathTypeInfo
  tableSource?: FormDataPathTableSource
  origin?: "working" | "inherited"
}
```

В `mergeFormDataPathIndexes` не копировать карты вслепую, а создать новые источники: fallback-корни получают `inherited`, primary-корни — `working`. Если fallback отсутствует, `prepareFormDataPathContextFromYAML` всё равно создаёт рабочее представление индекса с `origin: "working"`. Остальные поля источника и таблицы сохранять неизменными. Добавить в оба варианта `ResolveDataPathCoreResult` необязательное поле `root?: FormDataPathSource`, заполняемое для обычного корня формы. Расширить вариант `ResolvedDataPathTargetSource` для `formAttribute` тем же необязательным полем и переносить его в `stateFromRoot`, чтобы одно-сегментный путь также сохранял происхождение в `target`. Состав `targets` не менять: он остаётся списком разрешённых конечных целей.

- [ ] **Step 4: Run focused tests and type-check**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
```

Expected: all commands PASS.

- [ ] **Step 5: Commit the resolver layer and approved documents**

```powershell
git add docs/superpowers/specs/2026-09-01-explicit-borrowed-form-attribute-validation-design.md docs/superpowers/plans/2026-09-01-explicit-borrowed-form-attribute-validation.md packages/runtime/metadata/ruleRuntime/dataPath/types.ts packages/rules/metadata/validation/dataPath/coreResolver.ts packages/rules/metadata/validation/dataPath/resolver.test.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts
git commit -m "feat(forms): 🧭 различать источники реквизитов формы"
```

### Task 2: Единая политика путей заимствованной формы

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.test.ts`
- Modify: `packages/rules/metadata/project/projectStateYamlUpdate.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`

**Interfaces:**
- Consumes: структурные записи `attribute`, `element`, `dataPath`, `mainAttribute`; payload владельца из `ValidationPendingDataPathCheck`; `resolveProjectStateDataPathReferenceBatch`.
- Produces: `collectBorrowedFormDataPathChecks(...)` с одной проверкой на смысловой путь; нейтральный `resolveProjectStateDataPathReferenceResultBatch(...)`, сохраняющий полный результат resolver; `validateBorrowedFormDataPathChecks(...)` с точной диагностикой первого недоступного места.

- [ ] **Step 1: Write failing projection tests for every registered DataPath**

В `formStructureProjection.test.ts` добавить форму с первичным и дополнительным зарегистрированным путём. Проверить, что проекция содержит записи `dataPath` с `name`, `yamlPath` и payload версии 1:

```ts
{
  componentKind: "dataPath",
  name: "Контрагент.ИНН",
  yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
  payload: JSON.stringify({
    version: 1,
    mode: "explicit",
    owner: { kind: "Справочник", name: "Товары" },
  }),
}
```

Не дублировать первичный путь между `collectClientApplicationFormStructure` и `projectStateYamlUpdate`: последний должен обогащать уже собранные occurrence-факты владельцем, а не создавать параллельный несовместимый формат.

- [ ] **Step 2: Run projection tests and observe absent dataPath facts**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.test.ts`

Expected: FAIL because explicit registered paths are not part of the form projection payload.

- [ ] **Step 3: Project all registered paths through the rule registry**

Использовать `preparation.collected.occurrences`, создавая по одному `dataPath` component на occurrence. В `buildProjectStateYamlFileUpdate` сопоставлять pending-check по сериализованному `yamlPath` и добавлять в payload `owner`, не меняя нейтральный контракт структурного документа.

```ts
interface FormDataPathPayloadV1 {
  readonly version: 1
  readonly mode: "explicit"
  readonly owner?: { readonly kind: string; readonly name: string }
}
```

- [ ] **Step 4: Write failing policy tests**

В новых unit-тестах и `borrowedFormValidation.test.ts` покрыть:

```ts
it.each(["Объект", "Контрагент", "Таблица"])(
  "требует working-реквизит для нового пути через %s",
  (root) => expect(messagesFor(explicitPath(`${root}.Поле`))).toEqual([
    `Путь «${root}.Поле» использует реквизит формы «${root}», который не добавлен в «Реквизиты» заимствованной формы`,
  ]),
)
```

Добавить отдельные случаи: собственный реквизит working, неизменённый элемент cf, собственный неявный элемент, неявная колонка, `Таблица[4].Реквизит`, дополнительный DataPath, глубокий `Данные.Товары.Количество`, один результат на повторяющийся путь и только ошибка `ИНН` при доступном working-корне.

- [ ] **Step 5: Run policy tests and confirm inherited roots currently pass**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.test.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts
```

Expected: FAIL because the validator currently checks roots only for saved `БазоваяФорма.yaml` and does not classify working/inherited roots.

- [ ] **Step 6: Implement the concrete policy**

В `borrowedFormDataPathPolicy.ts`:

```ts
export interface BorrowedFormDataPathCheck {
  readonly value: string
  readonly yamlPath: readonly (string | number)[]
  readonly owner: { readonly kind: string; readonly name: string }
  readonly mode: "explicit" | "implicit-own"
}

export function collectBorrowedFormDataPathChecks(params: {
  workingEntries: readonly ProjectStateStructuredDocumentEntry[]
  currentEntries: readonly ProjectStateStructuredDocumentEntry[]
}): readonly BorrowedFormDataPathCheck[]
```

Алгоритм: собрать working/cf-реквизиты; добавить все явные `dataPath`; вычислить primary path только для собственного элемента или колонки без явного пути; исключить унаследованные неизменённые элементы; дедуплицировать по `yamlPath + value`. Перед resolver проверить корень: если он есть только в cf — выдать ошибку явного заимствования и не запускать дальнейшую проверку. Корни `Элементы` и `ТекущиеДанные` оставить действующей платформенной проверке.

В `projectStateDependencyValidation.ts` выделить из существующего batch-resolver нейтральную функцию, которая возвращает для каждого запроса исходный `ResolveDataPathCoreResult`, включая `issues`, `targets` и первый неразрешённый сегмент; существующий `resolveProjectStateDataPathReferenceBatch` оставить совместимой обёрткой, фильтрующей успешные результаты. Конкретная политика формы использует подробный результат: при working-корне и `unknown_field` формирует сообщение `Путь «Контрагент.ИНН» обращается к реквизиту «ИНН», который недоступен в компоненте расширения`. По `segmentIndex` последнего успешного target определяется первый недоступный сегмент. Для одного `yamlPath + value` возвращается только первая ошибка.

Подключить модуль из `validateBorrowedClientApplicationForms`; старую `baseDataPathDiagnostics` оставить только для сохранённой основы.

- [ ] **Step 7: Run policy, projection and existing validation suites**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.test.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.test.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
```

Expected: all commands PASS; no test exceeds 50 ms.

- [ ] **Step 8: Commit the policy layer**

```powershell
git add packages/rules/metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormDataPathPolicy.test.ts packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.ts packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.test.ts packages/rules/metadata/project/projectStateYamlUpdate.ts packages/rules/metadata/validation/projectStateDependencyValidation.ts packages/rules/metadata/validation/projectStateDependencyValidation.test.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts
git commit -m "feat(forms): 🔒 проверять заимствование реквизитов путей"
```

### Task 3: Точечная аномалия при импорте

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/importedYamlFinalizer.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`
- Modify: `packages/rules/metadata/importFromXml/applyImportedIssueDecisions.test.ts`
- Test: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts`

**Interfaces:**
- Consumes: `FormDataPathContext`, конкретная проверка `working | inherited`, общий `classifyImportedIssues` / `applyImportedIssueDecisions`.
- Produces: импортированный ошибочный явный или материализованный неявный путь с `!xml/invalid` на значении.

- [ ] **Step 1: Write failing finalizer and import tests**

Проверить три результата сериализации:

```yaml
ПутьКДанным: !xml/invalid Объект.ДатаАктуальности
```

- явный ошибочный путь остаётся на месте и получает `invalid`;
- вычисляемый путь собственного элемента не уплотняется, если его корень только `inherited`, затем получает `invalid`;
- корректный working-корень уплотняется как прежде и не получает ни `invalid`, ни `raw`.

Интеграционный тест строит временную XML/YAML-копию из существующей формы и не меняет XML-фикстуру.

- [ ] **Step 2: Run import tests and observe loss of the implicit boundary**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts packages/rules/metadata/importFromXml/applyImportedIssueDecisions.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts
```

Expected: FAIL because `compactImportedFormDataPaths` currently removes the implicit path before cross-file classification.

- [ ] **Step 3: Preserve only diagnostically necessary implicit paths**

Добавить в контекст проверку корня эффективного пути через `resolved.root?.origin`. В `compactImportedFormDataPaths` удалять вычисляемый путь только при `origin !== "inherited"`; ошибочный путь остаётся обычным смысловым значением. Общий импортный конвейер затем получает точный `ValidationIssueTarget.path` и существующий `applyImportedIssueDecisions` ставит `!xml/invalid`. Не добавлять новый kind решения и не помечать всю форму.

- [ ] **Step 4: Run import regression tests**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts packages/rules/metadata/importFromXml/applyImportedIssueDecisions.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts
pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
```

Expected: PASS; корректный импорт не содержит новых `!xml/raw`.

- [ ] **Step 5: Commit the import layer**

```powershell
git add packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts packages/rules/metadata/forms/clientApplicationForm/importedYamlFinalizer.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts packages/rules/metadata/importFromXml/applyImportedIssueDecisions.test.ts packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts
git commit -m "fix(import): 🩹 сохранять ошибочные пути формы точечно"
```

### Task 4: Общий сеанс XML-id внешней формы и BaseForm

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/convertYAMLToXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts`

**Interfaces:**
- Consumes: смысловые logical address из `FormXmlIdReservation`, snapshot/reference IDs и фактические занятые ID.
- Produces: `createFormXmlIdAssignmentSession(...)` и необязательный `xmlIdSession` в обеих конверсиях; один logical address получает один ID в outer Form и BaseForm.

- [ ] **Step 1: Write failing shared-session tests**

Добавить тест без сохранённого ID: base и extension содержат одноимённый реквизит `Контрагент`, проекция классифицирует его как заимствованный, а две последовательные конверсии с одним сеансом получают одинаковый допустимый ID. Добавить занятые ID в обеих проекциях и проверить выбор свободного значения, а также приоритет допустимого snapshot ID.

```ts
const session = createFormXmlIdAssignmentSession({
  references: [baseReference, outerReference],
})
assignFormXmlIds(baseForm, baseReference, session)
assignFormXmlIds(outerForm, outerReference, session)
expect(baseAttribute._id).toBe(outerAttribute._id)
expect(baseAttribute._id).toMatch(/^(?:0|[1-9]\d*|-[1-9]\d*)$/)
```

- [ ] **Step 2: Run assignment and conversion tests and confirm divergence**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts
```

Expected: FAIL because each conversion currently owns an independent allocator and the projected BaseForm requires an existing extension identity.

- [ ] **Step 3: Implement a shared semantic assignment session**

```ts
export interface FormXmlIdAssignmentSession {
  readonly idsByLogicalAddress: Map<string, string>
  readonly occupiedBySpace: Map<FormXmlIdSpace, Set<string>>
}

export function createFormXmlIdAssignmentSession(params: {
  readonly references?: readonly unknown[]
} = {}): FormXmlIdAssignmentSession {
  return {
    idsByLogicalAddress: new Map(),
    occupiedBySpace: collectOccupiedFormXmlIds(params.references ?? []),
  }
}

export function assignFormXmlIds(
  generated: unknown,
  reference?: unknown,
  session: FormXmlIdAssignmentSession = createFormXmlIdAssignmentSession(),
): void
```

Ключ брать из `reservation.runtime.logicalAddress`. Приоритет: ID сеанса, допустимый snapshot, допустимый reference, затем свободный ID с учётом всех реально занятых ID данного пространства в обеих XML-проекциях. Некорректный snapshot/reference не прерывает синхронизацию и не попадает в результат. Выбранный ID зарегистрировать в сеансе до записи в collector. `specialId` не помещать в сеанс. Коллизии разных logical address по-прежнему отклонять.

Создавать один сеанс в `clientApplicationFormYamlToXmlNestedRule`, передавать его в `buildClientApplicationBaseForm` и `convertClientApplicationFormYAMLToXMLCore`. Для projected BaseForm разрешить allocator создать отсутствующую extension identity, но продолжать запрещать исчезновение требуемых UUID и прочих существующих идентичностей. Классификация реквизита остаётся смысловым пересечением имён `baseYaml.Реквизиты` и `extensionYaml.Реквизиты` в `projectClientApplicationBaseForm`.

- [ ] **Step 4: Run ID, BaseForm and round-trip tests**

Run:

```powershell
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
```

Expected: PASS; outer Form и BaseForm используют один ID, а YAML ID не содержит.

- [ ] **Step 5: Commit the synchronization layer**

```powershell
git add packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts packages/rules/metadata/forms/clientApplicationForm/convertYAMLToXML.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts
git commit -m "fix(sync): 🔗 согласовать ID заимствованных реквизитов формы"
```

### Task 5: E2E-регрессия проекта и полная проверка

**Files:**
- Modify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: существующие фикстуры `ОбщаяФорма.InputField`, `ДокументВсеСвойства.ФормаДокумента`, `ФормаДокументаВсеСвойства`.
- Produces: e2e-доказательство корректного round-trip и отрицательных производных YAML без изменения XML-источника истины.

- [ ] **Step 1: Add fixture-derived validation cases**

В тестовой копии проекта:

- удалить `Таблица` из `Реквизиты` `ОбщаяФорма.InputField` и ожидать ошибки для `Таблица.Реквизит`, `Таблица[4].Реквизит` и дополнительного зарегистрированного пути;
- оставить `ТаблицаExt` и проверить отсутствие ошибки заимствования для собственного реквизита;
- проверить, что `ФормаДокумента` без working-`Объект` валидна для неизменённых базовых элементов;
- проверить положительный working-`Объект` в `ФормаДокументаВсеСвойства`;
- восстановить временную копию между вариантами, не записывая изменения в `e2e/fixtures/xml`.

- [ ] **Step 2: Run e2e without live 1C**

Run: `pnpm test:e2e`

Expected: PASS for metadata import/validation/round-trip tests; no information-base command is started.

- [ ] **Step 3: Run all repository-required checks**

Run:

```powershell
pnpm type-check
pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
git diff --check 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
git status --short
```

Expected: every command PASS; status contains only implementation changes intended for review.

- [ ] **Step 4: Commit the e2e coverage**

```powershell
git add e2e/metadata-project.test.ts
git commit -m "test(forms): 🧪 покрыть заимствование реквизитов e2e"
```

- [ ] **Step 5: Re-run final checks on the committed tree**

Run:

```powershell
pnpm type-check
pnpm duplicates -- --base 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
pnpm test
pnpm test:e2e
pnpm test:architecture:rules
pnpm test:architecture
git diff --check 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
git status --short
```

Expected: all checks PASS and the worktree is clean.

### Task 6: Independent conformance review

**Files:**
- Review only: every committed, staged, unstaged and implementation-related untracked change since `3c5c5df8988ef2aeabac8d0024ab6105ca1c091b`.

**Interfaces:**
- Consumes: spec, this plan, pinned base SHA, complete worktree.
- Produces: exactly one independent review verdict in the `executing-plans-with-review` contract.

- [ ] **Step 1: Dispatch exactly one review-only subagent**

Передать:

```text
Spec: docs/superpowers/specs/2026-09-01-explicit-borrowed-form-attribute-validation-design.md
Plan: docs/superpowers/plans/2026-09-01-explicit-borrowed-form-attribute-validation.md
Base: 3c5c5df8988ef2aeabac8d0024ab6105ca1c091b
Worktree: C:\git\nkdk\.worktrees\form-attribute-borrow-validation
```

Требовать просмотр полного состояния Git и ответ формата `VERDICT`, `Findings`, `Verification gaps`; запретить редактирование файлов.

- [ ] **Step 2: Close findings with the same reviewer**

При `CHANGES_REQUIRED` исправить все замечания основным агентом, выполнить затронутые и полные проверки, затем отправить тому же reviewer полный обновлённый diff. Повторять до `APPROVED`.

- [ ] **Step 3: Verify the approved tree did not change**

После `APPROVED` повторить команды Task 5 Step 5. Если какая-либо команда меняет файл, считать approval недействительным и вернуть тот же reviewer к полному diff.
