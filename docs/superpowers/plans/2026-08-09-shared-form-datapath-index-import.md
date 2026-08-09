# Shared Form DataPath Index Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить расхождение DataPath-индекса между XML-импортом и обычной валидацией, чтобы дополнительные колонки формы разрешались во втором проходе импорта.

**Architecture:** XML-импорт полностью формирует смысловой объект формы YAML и затем строит `FormDataPathIndex` общим `createFormDataPathIndexFromYAML`, уже используемым остальными операциями. Параллельный `formDataPathMetadataCollector` удаляется из пути импорта; resolver и формат отложенных значений не меняются.

**Tech Stack:** TypeScript, Vitest, XML → YAML import, двоичное project state, pnpm.

## Global Constraints

- XML-фикстуры являются источником истины и не изменяются.
- `metadata/orchestration`, `metadata/validation` и `metadata/project` не получают условий по конкретным формам, именам таблиц или дополнительным колонкам.
- XML-импорт, validation, YAML → XML, синхронизация, поиск ссылок и переименование используют один `createFormDataPathIndexFromYAML` по смысловому объекту YAML.
- Повторное чтение, разбор или сериализация YAML для построения индекса не добавляются.
- Неразрешимый путь не преобразуется вслепую и сохраняет существующую диагностику.
- Новые правила `fromXML`/`toXML`/`fromYAML`/`toYAML`, новые общие признаки rules.ts и новые применения `!xml` не добавляются.
- Существующие XML-фикстуры не изменяются; регрессия задаётся inline-входом теста.
- Перед завершением выполняются `pnpm test` и `pnpm duplicates -- --base origin/develop`.

---

### Task 1: Строить индекс импортированной формы единым механизмом

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: `createFormDataPathIndexFromYAML(yaml: unknown, tabularElementsByName?: ReadonlyMap<...>): FormDataPathIndex` из `formDataPathMetadata.ts`.
- Produces: `DirectImportResult.localIndexes.metadata.formDataPathIndex`, построенный по окончательному смысловому объекту формы YAML.
- Removes from import path: `createFormDataPathMetadataCollector({ filePath })` и параллельную передачу `acceptItem`, `acceptProperty`, `completeValue` двум сборщикам.
- Preserves: `createFormDataPathMetadataCollector` общего validation-слоя как внутреннюю реализацию `createFormDataPathIndexFromYAML`; resolver, форматтер и двоичный формат состояния проекта не меняются.

- [ ] **Step 1: Write the failing XML-import regression test**

В `fromXMLToYAML.test.ts` добавить тест `индексирует дополнительные колонки до уточнения CurrentData`. Он создаёт реквизит формы `Строки` типа `ValueTable`, дополнительную колонку `Дополнительная`, табличный элемент `Строки` и поле с путём текущей строки:

```ts
it("индексирует дополнительные колонки до уточнения CurrentData", () => {
  const ownerMetadataCache = {
    listRefs: () => [],
    get: () => ({ status: "not-found" as const, diagnostics: [] }),
  }
  const result = importClientApplicationFormFromXMLToYAML({
    context: {
      ...mockContextFromXML(),
      exportToYAML: { toTyped: false, ownerMetadataCache },
    },
    formName: "Форма",
    formXML: {
      Attributes: {
        Attribute: {
          _name: "Строки",
          _id: "1",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: {
            AdditionalColumns: {
              _table: "Строки",
              Column: {
                _name: "Дополнительная",
                _id: "1",
                Type: { "v8:Type": "xs:string" },
              },
            },
          },
        },
      },
      ChildItems: [
        { Table: { _name: "Строки", _id: "1", DataPath: "Строки" } },
        {
          InputField: {
            _name: "Поле",
            _id: "2",
            DataPath: "Items.Строки.CurrentData.Дополнительная",
          },
        },
      ],
    },
    metadataXML: { Form: { Properties: { FormType: "Managed" } } },
  })

  expect(
    result.localIndexes.metadata.formDataPathIndex
      ?.additionalColumnsByTablePath.get("Строки")
      ?.get("Дополнительная")
  ).toMatchObject({ name: "Дополнительная" })

  finalizeImportedYamlValues({
    yaml: result.yaml,
    rootRule: ClientApplicationFormRules,
    deferred: bindDeferredObjectValues(result.yaml, result.deferred),
    context: {
      ...mockContextFromXML(),
      exportToYAML: { toTyped: false, ownerMetadataCache },
    },
    formDataPathIndex: result.localIndexes.metadata.formDataPathIndex,
  })

  expect(JSON.stringify(result.yaml)).toContain(
    "Элементы.Строки.ТекущиеДанные.Дополнительная"
  )
})
```

- [ ] **Step 2: Run the test to verify the current split index fails**

Run:

```bash
pnpm --filter @nkdk/core test -- fromXMLToYAML.test.ts
```

Expected: FAIL — `additionalColumnsByTablePath.get("Строки")` возвращает `undefined`; без этой проверки финализация сохраняет `Items.Строки.CurrentData.Дополнительная` и сообщает неизвестную колонку.

- [ ] **Step 3: Replace the import-only collector with the shared YAML builder**

В `fromXMLToYAML.ts` импортировать локальную обёртку:

```ts
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
```

Удалить создание `formDataPathMetadataCollector` и составной объект `collector`.
В существующем вызове `importPropertiesFromXMLToYAML` заменить только значение
параметра `collector`:

```ts
collector: localIndexesCollector,
```

После `applyMetadataItemXmlImportAugmenter` и до возврата результата построить индекс по готовому объекту:

```ts
const localIndexes = localIndexesCollector.finish()
localIndexes.metadata.formDataPathIndex = createFormDataPathIndexFromYAML(yaml)
```

Не добавлять отдельное уведомление о `ДополнительныеКолонки` в `importFormAttributesFromXMLToYAML`: итоговый объект YAML является единственным источником DataPath-индекса.

- [ ] **Step 4: Remove the now-unused client-form collector adapter**

В `formDataPathMetadata.ts` оставить только обёртку `createFormDataPathIndexFromYAML`. Удалить импорт `createProjectedFormDataPathMetadataCollector` и экспорт:

```ts
export function createFormDataPathMetadataCollector(...)
```

Общий `createFormDataPathMetadataCollector` в `validation/dataPath/formYamlIndex.ts` не удалять: он остаётся внутренней реализацией общего построителя и извлечения validation-фактов.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core test -- fromXMLToYAML.test.ts formDataPathMetadata.test.ts formYamlIndex.test.ts formatter.test.ts
```

Expected: PASS. Существующий тест обычной колонки, новая дополнительная колонка, объявления таблиц/деревьев и двустороннее форматирование работают через общий индекс.

- [ ] **Step 6: Build and reimport the real configuration and extension**

Run:

```bash
pnpm --filter @nkdk/core build
rm -rf /Users/nikita/git/sed_nkdk/cf /Users/nikita/git/sed_nkdk/cfe/дкз
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
rm -f /Users/nikita/git/sed_nkdk/.nkdk/components/cf/configuration-index.bin
node --input-type=module -e 'import * as core from "./packages/core/dist/index.js"; const context={defaultLanguage:"ru",version:"2.20",exportToYAML:{toTyped:false},fromXML:{forReference:false}}; const state=core.createProjectStateService(); const runs=[{inputDir:"/Users/nikita/git/sed_xml/cf",requestedComponentPath:"cf"},{inputDir:"/Users/nikita/git/sed_xml/cfe/дкз",requestedComponentPath:"cfe/дкз"}]; try { for (const run of runs) { const result=await core.importConfigurationFromXml({context,inputDir:run.inputDir,projectDir:"/Users/nikita/git/sed_nkdk",requestedComponentPath:run.requestedComponentPath,concurrency:4,projectState:state}); console.log(JSON.stringify({componentPath:result.componentPath,failed:result.failed.length,warnings:result.warnings.length})); } } finally { await state.close(); }'
```

Expected: оба компонента импортированы; число ошибок основной конфигурации уменьшается на три; импорт не сообщает `unresolved_data_path` для `КомментарийПроверяющего`, `ДлительностьДня` и `ОсталосьПревышено`.

- [ ] **Step 7: Verify the three canonical paths and run clean validation**

Run:

```bash
rg -n 'Items\.(Исполнители|ДниНедели)\.CurrentData\.(КомментарийПроверяющего|ДлительностьДня|ОсталосьПревышено)' /Users/nikita/git/sed_nkdk/cf -g '*.yaml'
rg -n 'Элементы\.Исполнители\.ТекущиеДанные\.КомментарийПроверяющего|Элементы\.ДниНедели\.ТекущиеДанные\.(ДлительностьДня|ОсталосьПревышено)' /Users/nikita/git/sed_nkdk/cf -g '*.yaml'
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
node --input-type=module -e 'import * as core from "./packages/core/dist/index.js"; const state=core.createProjectStateService(); try { const result=await core.validateProject({projectDir:"/Users/nikita/git/sed_nkdk",projectState:state,concurrency:4}); const diagnostics=[...result.diagnostics]; result.diagnostics.release(); console.log(JSON.stringify({errors:diagnostics.filter(({severity})=>severity==="error").length,warnings:diagnostics.filter(({severity})=>severity==="warning").length,englishCurrentData:diagnostics.filter(({message})=>message.includes("в YAML используйте") && (message.includes("Items.Исполнители.CurrentData") || message.includes("Items.ДниНедели.CurrentData"))).length})); } finally { await state.close(); }'
```

Expected: первый `rg` не находит совпадений; второй находит ровно три канонических пути; `englishCurrentData` равно `0`. Остальные ранее признанные ошибки валидации не входят в границы этого изменения.

- [ ] **Step 8: Run full verification and duplicate detection**

Run:

```bash
pnpm test
pnpm duplicates -- --base origin/develop
git diff --check
```

Expected: все тесты PASS, проверка дублей не находит новых нарушений, `git diff --check` не выводит ошибок.

- [ ] **Step 9: Commit the implementation**

```bash
git add packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
git commit -m "fix: :bug: унифицировать индекс формы при XML-импорте" -m "Дополнительные колонки записывались в YAML, но отсутствовали в параллельном индексе первого прохода. Построение индекса по готовому смысловому объекту выравнивает XML-импорт с валидацией и остальными DataPath-операциями."
```
