# Валидация заимствованной формы — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проверять рабочую форму расширения относительно текущей `cf`, согласованность сохранённой основы с рабочей формой и локальную видимость реквизитов для `ПутьКДанным`.

**Architecture:** Формы публикуют в ProjectState нейтральные структурные факты с ролью представления и topology-связью. ProjectState хранит и запрашивает факты, а зарегистрированный validation-компонент формы выполняет предметное сравнение. Факты исторической основы доступны только этому сравнению и никогда не входят в metadata-target/owner/DataPath indexes рабочего компонента.

**Tech Stack:** TypeScript, Vitest, ProjectState typed facts, form validation, partial/full sync.

## Global Constraints

- Выполнять после двух предыдущих планов.
- Одноимённый элемент считается присутствующим независимо от `Вид`; матрица совместимости остаётся в `.agents/restrictions.md`.
- Не сравнивать `БазоваяФорма.yaml` с текущей `cf`.
- Не разрешать DataPath рабочей формы или основы через факты другого представления.
- Не добавлять частные `itemType`/пути в `projectState`; предметный код остаётся в `forms` и подключается через composition.

---

## Task 1: Выделить общий индекс компонентов формы

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/formComponentIndex.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/formComponentIndex.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts`

- [ ] Реализовать `indexClientApplicationFormComponents(yaml)`, возвращающий отдельные карты `elements`, `attributes`, `commands`, `parameters`; каждая запись содержит имя и YAML-путь. Элементы обходить рекурсивно и запрещать повтор имени во всём дереве.
- [ ] Перевести `validateBaseFormCompatibility` на общий индекс и расширить проверку с элементов на реквизиты, команды и параметры.
- [ ] Сохранить направление проверки: все компоненты основы должны существовать в рабочей форме; лишние компоненты рабочей формы допустимы; порядок, иерархия, свойства и `Вид` не сравниваются.
- [ ] Тестами проверить каждую категорию, путь диагностики в основе и отсутствие ошибки для собственного компонента рабочей формы.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/formComponentIndex.test.ts metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm/formComponentIndex.ts packages/core/metadata/forms/clientApplicationForm/formComponentIndex.test.ts packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.ts packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts
git commit -m "feat: :sparkles: индексировать компоненты формы"
```

## Task 2: Добавить структурные факты формы в ProjectState

**Files:**

- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/factTables.ts`
- Modify: `packages/core/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.test.ts`
- Modify: `packages/core/metadata/projectState/storeContract.ts`

- [ ] Ввести нейтральный `ProjectStateStructuredDocumentEntry`: `documentKind`, `representation`, `logicalAddress`, `workingProjectPath`, `componentKind`, `name`, `yamlPath`. Значения категорий задаются строками, ProjectState их не интерпретирует.
- [ ] Добавить массив `structuredDocuments` в YAML facts и двоичные таблицы; обеспечить round-trip fragment → snapshot → typed reader.
- [ ] Добавить query `readStructuredDocumentEntries({ componentPath, logicalAddress })`, возвращающий только точный компонент и не смешивающий `cf`/`cfe`.
- [ ] Проверить двоичный контракт, неизвестные поля и строгую компонентную выборку.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/fragment.test.ts metadata/projectState/binary/store.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/projectState
git commit -m "feat: :sparkles: хранить структурные факты документов"
```

## Task 3: Публиковать факты рабочей формы и изолированной основы

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/formStructureProjection.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/formStructureProjection.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.form.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`

- [ ] Реализовать в forms-проекции преобразование общего индекса компонентов в нейтральные `structuredDocuments` с `documentKind: "clientApplicationForm"`, `representation: "working" | "base"` и логическим адресом формы.
- [ ] Рабочую дочернюю и общую форму публиковать как `working`; YAML-спутник с `indexContribution: "isolated"` публиковать только как `base` и обнулять его обычные targets/owners/fields/forms/pendingReferences/pendingChecks.
- [ ] В `preparedYamlProjectWorker` получать логический адрес и роль представления из результата topology, без распознавания имени файла.
- [ ] Тестами проверить полный набор категорий, путь каждого компонента и отсутствие metadata/DataPath facts у основы.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/formStructureProjection.test.ts metadata/validation/yamlFactExtractor.form.test.ts metadata/project/preparedYamlProjectWorker.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/yamlFactExtractor.form.test.ts packages/core/metadata/project/preparedYamlProjectWorker.ts
git commit -m "feat: :sparkles: публиковать структуру формы"
```

## Task 4: Выполнить межфайловую проверку заимствованных форм

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/core/metadata/composition/projectState.ts`
- Delete: `packages/core/metadata/partialSyncToXml/borrowedFormValidation.ts`
- Modify: `packages/core/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts`

- [ ] Расширить `ProjectStateDependencyValidator` зарегистрированным `validateStructuredDocuments` и вызвать его в общей Б5 рядом с references/owners/dependencies. Контракт получает только query port и нейтральные записи.
- [ ] В forms-реализации сгруппировать working-формы `cfe/X` по логическому адресу. Для каждой запросить одноимённую working-форму `cf`: каждый элемент `cf` должен существовать в `cfe/X`; собственные элементы расширения допустимы.
- [ ] Для необязательной `base` того же `cfe/X` проверить наличие всех её элементов, реквизитов, команд и параметров в working-форме. Не запрашивать `cf` для проверки основы.
- [ ] Формировать диагностику отсутствующего элемента `cf` на рабочий файл расширения; диагностику компонента основы — на `БазоваяФорма.yaml` и её сохранённый YAML-путь.
- [ ] Зарегистрировать forms-валидатор только в `metadata/composition`. Удалить частную проверку из partial sync: он получает те же diagnostics из обязательной Б5.
- [ ] Тестами покрыть дочернюю и общую форму, новый элемент `cf`, собственный элемент cfe, устаревшую основу и все четыре категории компонентов основы.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/validation/projectStateDependencyValidation.ts packages/core/metadata/projectState/contracts/dependencyValidation.ts packages/core/metadata/composition/projectState.ts packages/core/metadata/partialSyncToXml
git commit -m "feat: :sparkles: проверять заимствованные формы"
```

## Task 5: Ограничить `ПутьКДанным` реквизитами своего представления

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathMetadata.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts`

- [ ] Добавить явный договор `createFormDataPathIndexFromYAML(yaml)`: корни берутся только из `Реквизиты` переданного YAML; никакой внешний индекс реквизитов формы не объединяется.
- [ ] Для working cfe проверить отказ `ПутьКДанным`, если корень есть только в соответствующей форме `cf`, и успех после явного добавления реквизита в working cfe.
- [ ] Для сохранённой основы проверить тот же договор относительно её собственных реквизитов; рабочие реквизиты cfe не должны дополнять основу.
- [ ] Убедиться, что стандартные поля объекта после явно присутствующего реквизита продолжают разрешаться обычным owner resolver строгого компонента.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/dataPath/formYamlIndex.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/validation
git commit -m "fix: :bug: изолировать пути к данным формы"
```

## Task 6: Обновить ограничения и выполнить полную проверку

**Files:**

- Modify: `.agents/restrictions.md`
- Modify: `docs/superpowers/specs/2026-08-09-extension-metadata-visibility-design.md` только при обнаружении фактического расхождения; изменение требует отдельного согласования.

- [ ] Удалить ограничение о полном отсутствии проверки согласованности заимствованной формы. Сохранить ограничение матрицы допустимых изменений `Вид` с учётом типа реквизита.
- [ ] Запустить `pnpm type-check`.
- [ ] Запустить `pnpm test`.
- [ ] Запустить `pnpm duplicates -- --base 5774cca5fe5ec396cd4753c23fe0d6b2a691bd14`.
- [ ] Перед PR запустить `pnpm test:architecture:rules` и `pnpm test:architecture`.
- [ ] Если все проверки успешны, создать завершающий коммит только для оставшихся документационных изменений:

```bash
git add .agents/restrictions.md
git commit -m "docs: :memo: уточнить ограничения форм расширения"
```
