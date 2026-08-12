# DataPath Worker Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать канонизацию зарегистрированных внутренних имён DataPath обязательной и одинаковой для прямого XML-импорта и производственного import worker.

**Architecture:** `formattingNamePairs` в общем `DataPathRegistrySet` остаётся единственным словарём имён. Существующие `requiresImportedYAMLFinalization`, `finalizeImportedYAML` и `resolveDataPathCore` используются в worker-контексте после построения полного индекса формы; затем `allowedKinds` проверяет уже канонический YAML, а сериализация не допускает зарегистрированное внутреннее имя.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm, существующие metadata rules и двухпроходный XML import worker.

## Global Constraints

- Работать только в `/Users/nikita/git/nkdk/.worktrees/data-path-worker-finalization` на ветке `codex/data-path-worker-finalization`.
- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не создавать отдельный resolver, собственную таблицу имён или собственную проверку типов.
- Не изменять общие таблицы `implicitValueYAML`.
- Не добавлять новые применения `!xml`.
- Не добавлять предметные условия по `SettingsComposer` в нейтральные runtime-слои.
- `formattingNamePairs`, общий предикат и `resolveDataPathCore` должны работать через один активный `DataPathRegistrySet`.
- Канонизация выполняется до `allowedKinds`; проверка совместимости не возвращает внутреннее имя после успешного преобразования.
- NKDK-фикстуры обновляются только командой штатного XML-импорта.
- После каждого законченного слоя запускать `pnpm duplicates -- --base origin/develop`.
- Перед завершением обязательны `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture`, `pnpm test:e2e` и финальная проверка дублей.

---

### Task 1: Зафиксировать единый реестр и расхождение worker

**Files:**
- Modify: `packages/rules/metadata/validation/dataPath/finalizationPredicate.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: `createDataPathRegistrySet(contributions)`, `withDataPathRegistrySet(registry, execute)`, `requiresDataPathStandardMemberFormatting(value, direction)`, производственный XML import worker.
- Produces: регрессии, которые требуют `КомпоновщикНастроек.Settings.ReportStructurePicture` → `КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета` без ручного вызова финализатора.

- [ ] **Step 1: Расширить модульный тест предиката реальными `formattingNamePairs`**

Добавить в `finalizationPredicate.test.ts` проверку активного реестра с `settingsComposerDataPathRules`:

```ts
it("обнаруживает каждое зарегистрированное внутреннее имя SettingsComposer", () => {
  const registry = createDataPathRegistrySet(settingsComposerDataPathRules)
  withDataPathRegistrySet(registry, () => {
    expect(
      requiresDataPathStandardMemberFormatting(
        "КомпоновщикНастроек.Settings.ReportStructurePicture",
        "internal-to-yaml",
      ),
    ).toBe(true)
    expect(
      requiresDataPathStandardMemberFormatting(
        "КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета",
        "yaml-to-internal",
      ),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Добавить интеграционный тест производственного worker**

В `worker.integration.test.ts` построить реальное задание общей формы из XML с реквизитом `dcsset:SettingsComposer` и элементом с `DataPath` ниже. Запустить оба прохода worker через тот же metadata execution context, что и `composition/workers/importFromXml.ts`, и проверить записанный YAML:

```ts
expect(formYaml).toContain(
  "ПутьКДанным: КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета",
)
expect(formYaml).not.toContain("Settings.ReportStructurePicture")
```

Тест не должен вызывать `finalizeImportedYamlValues` или другой финализатор вручную. Ломающее изменение, которое он ловит: worker выполняет преобразование вне активного `DataPathRegistrySet` либо не сохраняет DataPath в очередь второго прохода.

- [ ] **Step 3: Добавить E2E-проверку наблюдаемого результата**

В первом тесте `e2e/metadata-project.test.ts` прочитать импортированный файл общей формы и добавить буквальные ожидания:

```ts
const settingsComposerYaml = await readFile(join(
  baseline.projectDir,
  "cf/ОбщаяФорма/КомпоновщикНастроек/Свойства.yaml",
), "utf8")
expect(settingsComposerYaml).toContain(
  "ПутьКДанным: КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета",
)
expect(settingsComposerYaml).not.toContain("Settings.ReportStructurePicture")
```

- [ ] **Step 4: Запустить новые проверки и подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/validation/dataPath/finalizationPredicate.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
pnpm exec vitest run --config e2e/vitest.config.ts e2e/metadata-project.test.ts -t "imports cf and every cfe with real workers"
```

Expected: предикат проходит; worker/E2E падают, потому что YAML содержит `Settings.ReportStructurePicture`. Если worker-регрессия проходит, сузить её до того производственного entrypoint, на котором падает E2E, не меняя ожидаемый договор.

- [ ] **Step 5: Зафиксировать падающие регрессии отдельным коммитом**

```bash
git add packages/rules/metadata/validation/dataPath/finalizationPredicate.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: воспроизвести пропуск имён DataPath в worker"
```

---

### Task 2: Провести worker через общий DataPath-контекст

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify only if the failing test proves context is lost at the entry boundary: `packages/rules/metadata/composition/workers/importFromXml.ts`
- Test: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: `requiresImportedYAMLFinalization`, `finalizeImportedYamlValues({ yaml, rootRule, deferred, context, formDataPathIndex, execution? })`, active metadata execution registry sets, `resolveDataPathCore` via `formatDataPathStandardMembersWithIndex`.
- Produces: worker сохраняет все DataPath, найденные общим предикатом, до второго прохода и вызывает тот же property-rule finalizer с полным индексом формы.

- [ ] **Step 1: Проследить RED до одной из двух существующих границ**

Использовать падающий worker-тест и проверить два наблюдаемых состояния без production-инструментирования: наличие формы в `preparedYamlIds` после первого прохода и итоговый текст после второго. Выбрать минимальную границу:

```ts
expect(workerStateForTests().preparedYamlIds).toContain(formAssignment.id)
```

Если ожидание не выполняется, исправление относится к отбору `requiresImportedYAMLFinalization`; если выполняется, исправление относится к вызову `finalizeImportedYamlValues` во втором проходе.

- [ ] **Step 2: Передать существующее выполнение правил при финализации**

На выбранной границе использовать уже собранное выполнение property rules, не создавая новый реестр. Вызов второго прохода должен иметь следующий договор:

```ts
finalizeImportedYamlValues({
  yaml: prepared.yaml,
  rootRule: prepared.rule,
  deferred: prepared.deferred,
  context: contextWithOwners,
  formDataPathIndex: prepared.formDataPathIndex,
  execution: state.context.fromXML.execution,
})
```

Если `XmlImportConfigurationContext` уже гарантирует ambient execution и не предоставляет поле `execution`, оставить сигнатуру контекста без расширения и обернуть ровно команду worker в существующий `withMetadataExecutionRegistrySets`; не добавлять параллельный способ регистрации.

- [ ] **Step 3: Не позволить `allowedKinds` отменить канонизацию**

Сохранить порядок в `writePreparedYamlToOutput`: сначала `finalizeImportedYamlValues`, затем `finalizeImportedFormDataPaths`. Расширить существующий тест SettingsComposer путём с `allowedKinds` и проверить, что совместимый результат остаётся русским и не получает `!xml`:

```ts
expect(formYaml).toContain(
  "ПутьКДанным: КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета",
)
expect(formYaml).not.toContain("ПутьКДанным: !xml")
```

- [ ] **Step 4: Запустить целевые тесты и подтвердить GREEN**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/validation/dataPath/finalizationPredicate.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
```

Expected: PASS; worker и прямой импорт формируют одинаковый канонический путь.

- [ ] **Step 5: Проверить слой на новые дубли**

Run: `pnpm duplicates -- --base origin/develop`

Expected: новых дублей нет.

- [ ] **Step 6: Зафиксировать исправление**

```bash
git add packages/rules/metadata/importFromXml/worker.ts packages/rules/metadata/composition/workers/importFromXml.ts packages/rules/metadata/importFromXml/worker.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
git commit -m "fix: :bug: финализировать DataPath в контексте worker"
```

Добавлять `packages/rules/metadata/composition/workers/importFromXml.ts` в индекс только если он действительно изменён.

---

### Task 3: Отклонять внутренние имена перед записью обычного YAML

**Files:**
- Modify: `packages/rules/metadata/validation/dataPath/formatter.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataPath/toYAML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`

**Interfaces:**
- Consumes: результат `resolveDataPathCore({ value, nameMode: "yaml", index, ownerCache })` и те же пары `formattingNamePairs` активного `DataPathRegistrySet`.
- Produces: диагностируемая ошибка импорта с `targetProjectPath`, YAML-путём свойства, исходным DataPath и ожидаемым каноническим значением; неизвестные пользовательские сегменты сохраняют прежнее поведение.

- [ ] **Step 1: Написать отрицательный тест**

Добавить worker-сценарий, в котором зарегистрированное внутреннее имя остаётся после финализации, и ожидать `xml_import_yaml_failed`, а не warning или записанный английский путь:

```ts
expect(second.diagnostics).toEqual([
  expect.objectContaining({
    severity: "error",
    code: "xml_import_yaml_failed",
    message: expect.stringContaining("Settings.ReportStructurePicture"),
  }),
])
expect(second.files).not.toContainEqual(
  expect.objectContaining({ targetProjectPath: formAssignment.targetProjectPath }),
)
```

В `toYAML.test.ts` добавить узкий тест общей функции: зарегистрированное внутреннее имя в режиме обычного YAML вызывает ошибку, а `КомпоновщикНастроек.ПользовательскоеПоле` не переводится по совпадению текста.

- [ ] **Step 2: Запустить отрицательные тесты и подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/commonObjects/metadataPath/toYAML.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
```

Expected: FAIL, потому что остаточное внутреннее имя сейчас сохраняется или понижает проблему до warning.

- [ ] **Step 3: Усилить существующий formatter без отдельного checker**

В `formatDataPathStandardMembers` после вызова `resolveDataPathCore` использовать его канонические значения. Для направления `internal-to-yaml` успешный результат обязан вернуть YAML-форму; если resolver в YAML-режиме всё ещё распознаёт зарегистрированное внутреннее имя в разрешимой позиции, бросить `Error` с исходным и ожидаемым значениями. Не сканировать строку отдельной таблицей и не проверять типы вне resolver.

Форма ошибки:

```ts
throw new Error(
  `ПутьКДанным "${params.value}" содержит внутреннее имя; используйте "${expectedYaml}"`,
)
```

Существующий `unresolved_data_path` оставить warning только для действительно неразрешимых пользовательских путей; согласованные `!xml` продолжают проходить через внутренний режим и не попадают под эту ошибку.

- [ ] **Step 4: Запустить целевые тесты и подтвердить GREEN**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/commonObjects/metadataPath/toYAML.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: PASS; канонический путь пишется, остаточное зарегистрированное имя прерывает импорт, round-trip восстанавливает внутренний XML-путь.

- [ ] **Step 5: Проверить слой на новые дубли**

Run: `pnpm duplicates -- --base origin/develop`

Expected: новых дублей нет.

- [ ] **Step 6: Зафиксировать проверку каноничности**

```bash
git add packages/rules/metadata/validation/dataPath/formatter.ts packages/rules/metadata/commonObjects/metadataPath/toYAML.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
git commit -m "fix: :bug: отклонять внутренние имена DataPath в YAML"
```

---

### Task 4: Перегенерировать NKDK-фикстуры и проверить round-trip

**Files:**
- Modify generated: `e2e/fixtures/nkdk/**`
- Do not modify: `e2e/fixtures/xml/**`

**Interfaces:**
- Consumes: штатная команда `pnpm fixtures:e2e:nkdk`, существующие XML-фикстуры.
- Produces: канонические NKDK-фикстуры без зарегистрированных внутренних сегментов DataPath и неизменяемый XML round-trip.

- [ ] **Step 1: Сохранить контрольные хэши XML**

Run:

```bash
git status --short e2e/fixtures/xml
git diff -- e2e/fixtures/xml
```

Expected: XML-фикстуры не изменены.

- [ ] **Step 2: Перегенерировать NKDK-фикстуры штатным импортом**

Run: `pnpm fixtures:e2e:nkdk`

Expected: команда завершается успешно; изменяются только ожидаемые YAML DataPath и служебные снимки, создаваемые штатным обновлением.

- [ ] **Step 3: Проверить ключевую фикстуру и отсутствие известных внутренних имён**

Run:

```bash
rg -n "Settings\.ReportStructurePicture|FixedSettings\.ReportStructurePicture" e2e/fixtures/nkdk
rg -n "Настройки\.КартинкаСтруктурыОтчета|ФиксированныеНастройки\.КартинкаСтруктурыОтчета" e2e/fixtures/nkdk/cf/ОбщаяФорма/КомпоновщикНастроек/Свойства.yaml
git diff -- e2e/fixtures/xml
```

Expected: первая команда не находит совпадений; вторая находит русские пути; XML diff пуст.

- [ ] **Step 4: Запустить E2E import и round-trip**

Run: `pnpm test:e2e`

Expected: импорт совпадает с обновлёнными NKDK-фикстурами, а YAML → XML восстанавливает исходные XML побайтно.

- [ ] **Step 5: Проверить слой на новые дубли**

Run: `pnpm duplicates -- --base origin/develop`

Expected: новых дублей нет.

- [ ] **Step 6: Зафиксировать сгенерированные YAML**

```bash
git add e2e/fixtures/nkdk e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: обновить канонические DataPath в фикстурах"
```

---

### Task 5: Полная приёмка

**Files:**
- Verify only: all changed files

**Interfaces:**
- Consumes: все предыдущие изменения.
- Produces: доказательство типовой, функциональной, архитектурной и E2E-корректности ветки.

- [ ] **Step 1: Проверить типы**

Run: `pnpm type-check`

Expected: PASS.

- [ ] **Step 2: Запустить все пакетные тесты**

Run: `pnpm test`

Expected: PASS. Если повторится только известное превышение лимитов длительности при зелёных тестах, выполнить три профильных прогона по `.agents/testing.md` и не объявлять проверку успешной без отдельного решения пользователя.

- [ ] **Step 3: Запустить самопроверку архитектурных правил**

Run: `pnpm test:architecture:rules`

Expected: PASS.

- [ ] **Step 4: Запустить архитектурную проверку**

Run: `pnpm test:architecture`

Expected: PASS без изменения baseline dependency-cruiser.

- [ ] **Step 5: Повторить E2E после полной матрицы**

Run: `pnpm test:e2e`

Expected: PASS.

- [ ] **Step 6: Выполнить финальную проверку дублей**

Run: `pnpm duplicates -- --base origin/develop`

Expected: новых дублей нет.

- [ ] **Step 7: Проверить чистоту XML и состава diff**

Run:

```bash
git diff --check
git diff origin/develop -- e2e/fixtures/xml
git status --short
```

Expected: ошибки пробелов отсутствуют, XML diff пуст, в ветке только план, тесты, минимальная реализация и сгенерированные NKDK-фикстуры.

- [ ] **Step 8: Зафиксировать оставшиеся проверочные правки при наличии**

```bash
git add docs/superpowers/plans/2026-08-12-data-path-worker-finalization.md
git commit -m "docs: :memo: уточнить план финализации DataPath"
```

Коммит выполнять только если после исполнения задач план действительно был уточнён и имеет незакоммиченные изменения.

