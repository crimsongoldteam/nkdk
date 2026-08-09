# Form Element Current Data DataPath Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поддержать единым механизмом путь `Элементы.<ТаблицаИлиДерево>.ТекущиеДанные...` во всех операциях с DataPath и устранить ложные ошибки валидации вложенных колонок.

**Architecture:** Реализация формы публикует в нейтральный индекс DataPath объявления табличных элементов и диалект служебных сегментов. Общий resolver семантически распознаёт служебную конструкцию, разрешает источник строки и продолжает обычный обход без повторного разбора строки; тот же результат используется преобразованием имён, валидацией и поиском зависимостей.

**Tech Stack:** TypeScript, Vitest, TypeBox/Ajv, двоичное project state, pnpm.

## Global Constraints

- XML-фикстуры являются источником истины и не изменяются.
- `metadata/orchestration`, `metadata/validation` и `metadata/project` не знают конкретных имён `Items`, `CurrentData`, `Элементы`, `ТекущиеДанные` и видов элементов формы.
- Служебный смысл применяется только при полном совпадении: служебный корень, объявленный табличный элемент и служебный член текущей строки.
- Обычные реквизиты и параметры с именами `Элементы` и `ТекущиеДанные` сохраняют обычную семантику при отсутствии полного служебного совпадения.
- В проекцию метаданных входят только элементы формы, способные владеть текущей строкой; отсутствие `ПутьКДанным` не удаляет декларацию.
- Один resolver используется для XML → YAML, YAML → XML, validation, полной синхронизации, поиска ссылок и переименования.
- Формат двоичного project state остаётся совместимым с версией `0.5.0`: отсутствующий путь кодируется существующей строковой колонкой как пустая строка.
- Новые правила `fromXML`/`toXML`/`fromYAML`/`toYAML`, новые общие признаки rules.ts и новые применения `!xml` не добавляются.
- Каждый слой реализуется по TDD и завершается проверкой `pnpm duplicates -- --base origin/develop`.

---

### Task 1: Декларации табличных элементов в локальном индексе формы

**Files:**
- Modify: `packages/core/metadata/orchestration/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/validation/formDataPathProjection.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`
- Modify: `packages/core/metadata/orchestration/formElement/formTableDataPaths.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathProjection.ts`
- Test: `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts`
- Test: `packages/core/metadata/orchestration/formElement/formTableDataPaths.test.ts`

**Interfaces:**
- Produces: `FormDataPathTabularElementDeclaration { readonly kind: "tabularFormElement"; readonly dataPath?: string }`.
- Produces: `FormDataPathIndex.tabularElementsByName: ReadonlyMap<string, FormDataPathTabularElementDeclaration>`.
- Produces: `declareTabularElement(params: { name: string; dataPath?: string }): void` у сборщика.
- Replaces: `tableDataPathByElementName` и `acceptTableDataPath`.

- [ ] **Step 1: Write the failing tests**

Добавить проверки, что обход YAML возвращает объявления для вложенных элементов `Вид: ТаблицаФормы` с путём и без пути, для `Вид: ДеревоФормы`, не включает поле ввода и не путает реквизит верхнего уровня `Элементы` с разделом элементов формы. В тесте сборщика фактов передать `itemType: "Table"` до свойства `dataPath` и проверить итоговую запись с необязательным путём.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nakidka/core test -- formYamlIndex.test.ts formTableDataPaths.test.ts`

Expected: FAIL, потому что индекс хранит только таблицы с непустым путём и не умеет хранить декларации.

- [ ] **Step 3: Implement the declaration projection**

Заменить строковое соответствие на:

```ts
export interface FormDataPathTabularElementDeclaration {
  readonly kind: "tabularFormElement"
  readonly dataPath?: string
}

export interface FormDataPathIndex {
  // существующие поля
  tabularElementsByName: ReadonlyMap<string, FormDataPathTabularElementDeclaration>
}
```

Проекция конкретной формы задаёт `tabularElementItemTypes: readonly string[]` и функцию обхода YAML, возвращающую декларации. Сборщик объявляет `Table` уже по факту элемента, а последующее свойство `dataPath` только дополняет ту же запись. Рекурсивный YAML-обход принимает только `ТаблицаФормы` и `ДеревоФормы`.

- [ ] **Step 4: Run focused tests and duplicate check**

Run: `pnpm --filter @nakidka/core test -- formYamlIndex.test.ts formTableDataPaths.test.ts`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/dataPath/formIndex.ts packages/core/metadata/validation/formDataPathProjection.ts packages/core/metadata/validation/dataPath/formYamlIndex.ts packages/core/metadata/orchestration/formElement/formTableDataPaths.ts packages/core/metadata/forms/clientApplicationForm/formDataPathProjection.ts packages/core/metadata/validation/dataPath/formYamlIndex.test.ts packages/core/metadata/orchestration/formElement/formTableDataPaths.test.ts
git commit -m "feat: :sparkles: индексировать табличные элементы формы"
```

### Task 2: Совместимое хранение деклараций в project state

**Files:**
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Test: `packages/core/metadata/projectState/binary/readSession.test.ts`
- Test: `packages/core/metadata/projectState/fileUpdate.test.ts`

**Interfaces:**
- Consumes: `FormDataPathIndex.tabularElementsByName` из Task 1.
- Produces: `ProjectStateFormEntry` с `kind: "tabularElement"`, `name` и необязательным `dataPath`.
- Preserves: физический двоичный `kind === 3`; пустая строка декодируется как отсутствие `dataPath`.

- [ ] **Step 1: Write the failing persistence tests**

Добавить две записи одного владельца: `{ kind: "tabularElement", name: "Список", dataPath: "Объект.Строки" }` и `{ kind: "tabularElement", name: "Дерево" }`. Проверить двоичную запись/чтение, а также построение file update из локального индекса.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nakidka/core test -- readSession.test.ts fileUpdate.test.ts`

Expected: FAIL на неизвестном логическом виде `tabularElement` и отсутствующем `dataPath`.

- [ ] **Step 3: Implement compatible encoding and reconstruction**

Переименовать логический вариант записи, но оставить физический код `3`. При записи использовать `strings.intern(form.dataPath ?? "")`, при чтении не добавлять `dataPath`, если строка пуста. `dependencyFormIndex()` восстанавливает `tabularElementsByName`, а проверка договора разрешает необязательное строковое поле.

- [ ] **Step 4: Run focused tests and duplicate check**

Run: `pnpm --filter @nakidka/core test -- readSession.test.ts fileUpdate.test.ts projectStateDependencyValidation.test.ts`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/projectState packages/core/metadata/validation/projectStateDependencyValidation.ts
git commit -m "feat: :sparkles: сохранять элементы формы в индексе проекта"
```

### Task 3: Нейтральный диалект и однопроходное разрешение CurrentData

**Files:**
- Create: `packages/core/metadata/orchestration/dataPath/dialect.ts`
- Modify: `packages/core/metadata/orchestration/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathProjection.ts`
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces: `DataPathDialect` с парами имён `serviceRoot` и `currentRow` для internal/YAML.
- Produces: `ResolveDataPathCoreResult.internalValue`, `yamlValue`, `targets` и причины замен `serviceRoot | currentRow | standardMember`.
- Consumes: `tabularElementsByName` и необязательный `dataPath`.

- [ ] **Step 1: Write failing semantic resolver tests**

Покрыть обе стороны канонизации:

```text
Items.ВходящиеСообщения.CurrentData.Вложения.ИндексКартинки
Элементы.ВходящиеСообщения.ТекущиеДанные.Вложения.ИндексКартинки
```

Проверить: владельцем служебного перехода является объявленный элемент; продолжение разрешается через `dataPath` таблицы; `tableContext` сравнивается после того же семантического разрешения; таблица без пути получает отдельную машинную причину; английские служебные имена в YAML отклоняются; обычный реквизит `Элементы` и обычное поле `ТекущиеДанные` разрешаются как данные при неполном служебном совпадении.

- [ ] **Step 2: Run resolver tests to verify they fail**

Run: `pnpm --filter @nakidka/core test -- resolver.test.ts`

Expected: FAIL на русских служебных сегментах, коллизиях и ложном `table_context_mismatch`.

- [ ] **Step 3: Implement the neutral dialect**

Определить нейтральный договор:

```ts
export interface DataPathDialect {
  readonly serviceRoot: { readonly internal: string; readonly yaml: string }
  readonly currentRow: { readonly internal: string; readonly yaml: string }
}
```

Конкретная форма передаёт диалект в `FormDataPathIndex`; общий слой сравнивает только значения договора.

- [ ] **Step 4: Replace recursive expansion with semantic traversal**

Удалить `resolveDataPathCoreWithCurrentData`, `resolveCurrentDataPath` и `rebaseCurrentDataResult`. При полном служебном совпадении разрешить `declaration.dataPath` во внутреннее состояние таблицы один раз, записать цель элемента формы, пропустить служебный член и продолжить основной цикл с оставшимися сегментами. Сформировать одновременно `internalValue` и `yamlValue`; formatter берёт нужное представление без повторного разбора.

- [ ] **Step 5: Run resolver tests and duplicate check**

Run: `pnpm --filter @nakidka/core test -- resolver.test.ts formatter.test.ts`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/dataPath packages/core/metadata/forms/clientApplicationForm/formDataPathProjection.ts packages/core/metadata/validation/dataPath
git commit -m "feat: :sparkles: разрешать текущие данные элементов формы"
```

### Task 4: Единое использование при импорте, валидации и зависимостях

**Files:**
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Test: `packages/core/metadata/operations/dataPathReferences.test.ts`
- Test: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

**Interfaces:**
- Consumes: `ResolveDataPathCoreResult.targets`, `internalValue`, `yamlValue` из Task 3.
- Produces: цель `{ kind: "formElement"; name: string }` для элемента-владельца и прежнюю конечную цель поля.
- Preserves: validation-обёртка добавляет координаты только после общего анализа.

- [ ] **Step 1: Write failing operation-parity tests**

Для одного пути проверить, что XML → YAML записывает русские служебные имена, YAML → XML восстанавливает английские, валидация не выдаёт ошибку, а разрешённые зависимости содержат элемент `ВходящиеСообщения` и поле `ИндексКартинки`. Отдельно проверить, что поиск/переименование элемента формы меняет только второй сегмент служебного пути.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nakidka/core test -- fromXMLToYAML.test.ts fromYAMLToXML.test.ts dataPathReferences.test.ts projectStateDependencyValidation.test.ts`

Expected: FAIL, потому что операции используют только одиночную конечную цель.

- [ ] **Step 3: Connect all consumers to the unified result**

Добавить `formElement` в нейтральное объединение целей. В `resolveProjectStateDataPathReferenceBatch` возвращать все цели разрешения с корректным `segmentIndex`; в `dataPathReferences` сопоставлять канонический префикс с каждой целью и применять замену к соответствующему сегменту. Преобразователи XML/YAML выбирают готовое каноническое значение результата.

- [ ] **Step 4: Run focused tests and duplicate check**

Run: `pnpm --filter @nakidka/core test -- fromXMLToYAML.test.ts fromYAMLToXML.test.ts dataPathReferences.test.ts projectStateDependencyValidation.test.ts`

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation packages/core/metadata/operations packages/core/metadata/forms/clientApplicationForm
git commit -m "feat: :sparkles: переиспользовать цели путей формы"
```

### Task 5: Реальная регрессия и полная проверка

**Files:**
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Test: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

**Interfaces:**
- Consumes: завершённый общий resolver и project state из Tasks 1–4.
- Produces: регрессионный договор для вложенной таблицы `ВходящиеСообщения.Вложения`.

- [ ] **Step 1: Add the real nested-column regression**

Добавить неизменяемые входные данные, соответствующие реальному пути:

```yaml
ПутьКДанным: Элементы.ВходящиеСообщения.ТекущиеДанные.Вложения.ИндексКартинки
```

Индекс должен связать элемент `ВходящиеСообщения` с `Объект.ВходящиеСообщения`, затем разрешить табличную часть `Вложения` и поле `ИндексКартинки` без `table_context_mismatch`.

- [ ] **Step 2: Run the regression test**

Run: `pnpm --filter @nakidka/core test -- resolver.test.ts projectStateDependencyValidation.test.ts`

Expected: PASS.

- [ ] **Step 3: Validate both representative projects**

Удалить только внутренние файлы снимков `.nkdk` в `/Users/nikita/git/sed_nkdk` и `/Users/nikita/git/round-trip-compact`, затем запустить собранный standalone validator. Проверить, что четыре ошибки `Items.…CurrentData` исчезли, а коллизии реквизитов `Элементы`/`ТекущиеДанные` в `round-trip-compact` не породили новых ошибок.

- [ ] **Step 4: Run complete verification**

Run: `pnpm test`

Run: `pnpm duplicates -- --base origin/develop`

Expected: все функциональные тесты PASS; проверка времени не должна скрывать функциональный результат.

- [ ] **Step 5: Commit the regression tests**

```bash
git add packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "test: :white_check_mark: закрепить путь текущих данных формы"
```
