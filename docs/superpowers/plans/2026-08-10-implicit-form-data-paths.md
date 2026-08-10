# Implicit Form Data Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не хранить в YAML основной `ПутьКДанным`, если он однозначно выводится из основного реквизита либо ближайшей таблицы, сохранив отдельную семантику собственных и заимствованных элементов.

**Architecture:** Формы получают один rule-driven обход и конкретный для форм подготовитель `FormDataPathContext`. Он материализует неявные пути только у собственных элементов, предоставляет те же кандидаты validation, а после XML → YAML выполняет обратное уплотнение. Для расширения текущая форма `cf` определяет заимствованность, основной реквизит и эффективные пути заимствованных таблиц; необязательная `БазоваяФорма.yaml` только дополняет множество исторически заимствованных имён. Нейтральные runtime-слои получают готовые YAML/индекс/структурные записи и не знают о формах или расширениях.

**Tech Stack:** TypeScript, Vitest, существующие `rules.ts`, DataPath resolver, ProjectState, `pnpm`.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не добавлять свойства в `BasePropertyRule`, `PropertyRule` или параметры `dataPathRule`.
- Не добавлять `!xml`.
- Обрабатывать только правило свойства `dataPath` с YAML-именем `ПутьКДанным`; не затрагивать вспомогательные пути и кнопку `Данные`.
- Не добавлять знания о формах в `ruleRuntime`, `project`, `projectState` и `resourceTopology/core`.
- Для формы расширения всегда использовать текущую форму `cf`: она определяет заимствованные элементы, основной реквизит и пути заимствованных таблиц. `БазоваяФорма.yaml` может только добавить исторические заимствованные имена и никогда не служит источником пути.
- Отсутствующий основной `ПутьКДанным` заимствованного элемента означает наследование текущей `cf` и не материализуется ни в YAML, ни в XML; неявный путь вычисляется только для собственного элемента.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base df2bf639c`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture`.

---

## Task 1: Расширить единый rule-driven обход элементов

**Files:**

- Modify: `packages/core/metadata/validation/dataPath/formYamlTraversal.ts`
- Modify: `packages/core/metadata/ruleRuntime/formElement/formTableDataPaths.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathProjection.ts`
- Create: `packages/core/metadata/validation/dataPath/formYamlTraversal.test.ts`

- [ ] **Step 1: Добавить падающий тест на ближайшую таблицу через группы**

Проверить одним деревом непосредственную колонку, колонку через две группы и колонку вложенной таблицы. Посетитель должен получить имя элемента, наличие ключа `ПутьКДанным`, его значение и ближайшую таблицу:

```ts
expect(visits.map(({ name, tableOwner }) => [name, tableOwner?.name])).toEqual([
  ["Таблица", undefined],
  ["ТаблицаКолонка", "Таблица"],
  ["Группа", "Таблица"],
  ["КолонкаЧерезГруппу", "Таблица"],
  ["ВложеннаяТаблица", "Таблица"],
  ["ВложеннаяТаблицаКолонка", "ВложеннаяТаблица"],
])
```

- [ ] **Step 2: Запустить целевой тест и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/formYamlTraversal.test.ts`

- [ ] **Step 3: Ввести описатель посещения элемента**

Добавить без изменения общих типов правил:

```ts
export interface FormYAMLElementVisit extends FormYAMLItemVisit {
  readonly name: string
  readonly itemType: string
  readonly primaryDataPath: {
    readonly yamlKey: string
    readonly present: boolean
    readonly value: unknown
  } | undefined
  readonly tableOwner?: { readonly name: string; readonly yamlPath: YamlPath }
}
```

Передавать имя из record-ключа коллекции в `collectNested`, а текущую таблицу — параметром рекурсии. Таблица становится владельцем только для потомков; вложенная таблица заменяет владельца, группы его сохраняют.

- [ ] **Step 4: Удалить второй ручной обход таблиц**

Переписать `collectFormTabularElementsFromYAML` как адаптер над тем же обходом. `clientApplicationFormDataPathProjection` продолжает экспортировать прежний договор, поэтому `formYamlIndex` не меняется.

- [ ] **Step 5: Запустить тесты обхода и существующей validation форм**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/formYamlTraversal.test.ts metadata/forms/clientApplicationForm/validate.test.ts metadata/validation/yamlFactExtractor.form.test.ts`

- [ ] **Step 6: Проверить дубли и зафиксировать слой**

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `refactor: :recycle: объединить обход элементов формы`

---

## Task 2: Построить конкретный контекст неявных путей формы

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/formDataPathContext.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formComponentIndex.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formComponentIndex.test.ts`

- [ ] **Step 1: Добавить матричный тест кандидатов**

Покрыть обычное поле, `Наименование → Description`, таблицу, колонку с префиксом, колонку без префикса, группы, вложенную таблицу, явный путь таблицы, отсутствие основного реквизита и неразрешимое имя.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/formDataPathContext.test.ts`

- [ ] **Step 3: Реализовать неизменяемый результат подготовки**

```ts
export interface FormElementDataPathState {
  readonly name: string
  readonly yamlPath: readonly (string | number)[]
  readonly origin: "own" | "borrowed"
  readonly present: boolean
  readonly value: unknown
  readonly tableOwnerName?: string
  readonly candidateYaml?: string
  readonly candidateInternal?: string
  readonly currentConfigurationValue?: string
}

export interface FormDataPathContext {
  readonly index: FormDataPathIndex
  readonly elementsByName: ReadonlyMap<string, FormElementDataPathState>
  readonly effectiveMainAttribute?: string
}

export function prepareFormDataPathContextFromYAML(params: {
  readonly yaml: ClientApplicationFormYAML
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly savedBaseFormYaml?: ClientApplicationFormYAML
  readonly ownerCache: OwnerMetadataCache
  readonly rule?: MetadataItemRule
}): FormDataPathContext
```

Основной реквизит выбирать в порядке: рабочая форма,
`currentConfigurationFormYaml`. Происхождение определять по объединению имён
текущей формы `cf` и `savedBaseFormYaml`; имя только из сохранённой основы всё
равно получает `origin: "borrowed"`. `savedBaseFormYaml` не использовать как
источник пути. Для стандартных имён вызывать `resolveDataPathCore` с
`nameMode: "yaml"` и использовать `internalValue`; нерешённый путь не образует
кандидат.

- [ ] **Step 4: Вычислять таблицы лениво с мемоизацией**

Для каждого элемента таблицы хранить состояние `unresolved | resolving | resolved`; кандидат колонки строить только после получения эффективного пути владельца. У заимствованной таблицы без рабочего ключа брать эффективный путь одноимённой таблицы `currentConfigurationFormYaml`, подготовленной тем же алгоритмом как обычная форма. Сохранённую основу не читать как источник пути. Цикл должен давать отсутствие кандидата, а не рекурсию.

- [ ] **Step 5: Добавить счётчик обходов только в тестовом переходнике**

Тест должен доказывать один обход рабочей формы, один обход текущей формы `cf`, один обход имён сохранённой основы и не более одного разрешения пути каждой таблицы. Не добавлять счётчики в production-типы.

- [ ] **Step 6: Запустить тесты и проверку типов**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/formDataPathContext.test.ts metadata/forms/clientApplicationForm/formComponentIndex.test.ts`

Run: `pnpm --filter @nakidka/core exec tsc --noEmit`

- [ ] **Step 7: Проверить дубли и зафиксировать слой**

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `feat: :sparkles: вычислять неявные пути элементов формы`

---

## Task 3: Материализовать неявные пути при YAML → XML

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathContext.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

- [ ] **Step 1: Добавить падающие проверки YAML → XML**

В существующий набор добавить:

```ts
it.each([
  { title: "обычное поле", elementName: "Поле", expected: "Object.Field" },
  { title: "таблица", elementName: "Таблица", expected: "Object.Table" },
  { title: "колонка через группу", elementName: "ТаблицаКолонка", expected: "Object.Table.Column" },
])("восстанавливает $title без ПутьКДанным", ({ elementName, expected }) => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context,
    yaml: formWithoutElementDataPath(elementName),
    name: "ФормаЭлемента",
  })
  expect(findElementByName(result.formXML, elementName)?.DataPath).toBe(expected)
})
```

Отдельно проверить, что `ПутьКДанным: ""` не создаёт XML `DataPath`, а `ПутьКДаннымШапки` и кнопка `Данные` не изменяются.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

- [ ] **Step 3: Добавить materialized YAML без мутации входа**

```ts
export function materializeImplicitFormDataPaths(
  yaml: ClientApplicationFormYAML,
  context: FormDataPathContext,
): ClientApplicationFormYAML
```

Клонировать только ветви элементов, где реально добавляется `ПутьКДанным`. Для borrowed-элемента с отсутствующим ключом ничего не добавлять; пустую строку сохранять для штатного подавления XML-тега.

- [ ] **Step 4: Передавать один подготовленный контекст в core**

Добавить в конкретный параметр `ConvertClientApplicationFormFromYAMLToXMLParams` поле `formDataPathContext?`. Если его нет, core строит контекст обычной формы один раз. Использовать materialized YAML и для `createFormDataPathIndexFromYAML`, и для `convertPropertiesFromYAMLToXML`.

- [ ] **Step 5: Запустить тесты формы**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts`

- [ ] **Step 6: Проверить дубли и зафиксировать слой**

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `feat: :sparkles: восстанавливать пути формы из YAML`

---

## Task 4: Уплотнить обычную форму при XML → YAML

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/formDataPathContext.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

- [ ] **Step 1: Добавить падающие проверки XML → YAML**

Проверить три состояния собственного элемента: совпадающий `DataPath` удаляется; отсутствующий XML-тег при наличии кандидата становится `ПутьКДанным: ""`; отличный путь остаётся явным.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts metadata/importFromXml/worker.test.ts`

- [ ] **Step 3: Реализовать обратное уплотнение после deferred-finalization**

```ts
export function compactImportedFormDataPaths(params: {
  readonly yaml: ClientApplicationFormYAML
  readonly context: FormDataPathContext
}): void
```

Сравнивать `candidateInternal` с internal-значением явного пути через тот же resolver. Для определения отсутствовавшего XML-тега использовать `present`, собранный до мутации. Функцию вызывать только для `ClientApplicationForm` после `finalizeImportedYamlValues` и до сериализации.

- [ ] **Step 4: Убедиться, что правила других DataPath не затронуты**

Добавить отрицательные ожидания для вспомогательного пути и `Данные` кнопки в существующий интеграционный тест worker.

- [ ] **Step 5: Запустить тесты, дубли и зафиксировать слой**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts metadata/importFromXml/worker.test.ts`

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `feat: :sparkles: уплотнять пути формы при импорте XML`

---

## Task 5: Передать текущую `cf` независимо от YAML-спутника

**Files:**

- Modify: `packages/core/metadata/fullSyncToXml/baseFormSource.ts`
- Modify: `packages/core/metadata/fullSyncToXml/baseFormSource.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/resourceTopology/adapters/capabilities.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/core/metadata/ruleRuntime/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

- [ ] **Step 1: Зафиксировать тестом выбор источников**

Для `savedProjectPath` результат должен содержать сохранённую форму для сборки
XML `BaseForm` и подтверждённую текущую форму `cf` для `DataPath`. Без спутника
оба назначения ссылаются на один подготовленный файл `cf`.

```ts
expect(result).toMatchObject({
  kind: "saved",
  baseForm: { projectPath: savedPath },
  currentConfigurationForm: { projectPath: basePath },
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/fullSyncToXml/baseFormSource.test.ts`

- [ ] **Step 3: Расширить конкретный результат `BaseFormSource`**

Изменить `BaseFormSourceResult` на два именованных назначения:

```ts
export type BaseFormSourceResult = {
  readonly kind: "saved" | "projected"
  readonly baseForm: { readonly prepared: PreparedYamlFile; readonly projectPath: string }
  readonly currentConfigurationForm: {
    readonly prepared: PreparedYamlFile
    readonly projectPath: string
  }
}
```

`readVerifiedYaml` должен читать каждый подтверждённый файл один раз. Для
projected-ветви использовать один объект `prepared` в обоих назначениях. Для
saved-ветви дополнительно прочитать текущую `cf`; проверка хэшей остаётся
обязательной.

- [ ] **Step 4: Протянуть нейтральные подготовленные YAML до обработчика формы**

В capability использовать имена `basePreparedYamlFile` и
`currentConfigurationFormPreparedYamlFile`. Не добавлять новое поле в общий тип
правила. Существующий `baseYAML?: unknown` получает нейтральный конверт только
когда переданы оба назначения:

```ts
export interface SelectedBaseYAMLInput {
  readonly kind: "selectedBaseYAML"
  readonly baseFormSourceKind: "saved" | "projected"
  readonly baseFormYAML: unknown
  readonly currentConfigurationFormYAML: unknown
}
```

`clientApplicationForm/fromYAMLToXML.ts` распознаёт конверт, строит XML
`BaseForm` из `baseFormYAML`, а `FormDataPathContext` — из текущей `cf` и, только
для `kind: "saved"`, сохранённой основы. Остальные nested-конвертеры продолжают
получать прежнее сырое `baseYAML`.

- [ ] **Step 5: Проверить расширение**

Добавить случаи: borrowed без ключа не создаёт XML-тег при наличии и отсутствии
`БазоваяФорма.yaml`; own использует основной реквизит текущей `cf`; собственная
колонка внутри borrowed-таблицы использует путь таблицы из текущей `cf`; явный
override сохраняется, даже если совпадает с текущей `cf`.

- [ ] **Step 6: Запустить целевые тесты**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/fullSyncToXml/baseFormSource.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts metadata/fullSyncToXml/prepareAssignment.test.ts`

- [ ] **Step 7: Проверить архитектуру, дубли и зафиксировать слой**

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `feat: :sparkles: учитывать основу путей формы при синхронизации`

---

## Task 6: Распознать заимствованную форму без `БазоваяФорма.yaml`

**Files:**

- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts`

- [ ] **Step 1: Добавить интеграционный тест порядка и семантики**

Добавить два случая одной заимствованной формы: со встроенным `BaseForm` и без
него. В обоих случаях borrowed-поле без XML `DataPath` остаётся без YAML-ключа,
хотя в текущей `cf` путь явный; own-поле с вычисляемым путём уплотняется, а
отсутствующий XML `DataPath` own-поля становится `""`. Несовпадающий встроенный
`BaseForm` по-прежнему сохраняется спутником.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/importFromXml/worker.test.ts metadata/importFromXml/importConfigurationExtension.test.ts`

- [ ] **Step 3: Удерживать формы расширения до второго прохода**

Добавить в `DeferredImportYaml` `logicalAddress: string`. Форму
`ClientApplicationForm` компонента `cfe/*` нельзя записывать досрочно даже при
пустых `deferred` и отсутствии `baseFormCandidate`: определение соответствующей
формы `cf` требует открытой read-session второго прохода.

- [ ] **Step 4: Найти текущую форму `cf` независимо от BaseForm**

В `ActiveSecondPass.readSession` вызвать существующий
`readStructuredDocumentEntries({ componentPath: "cf", logicalAddress })`.
`workingProjectPath` записи `document` задаёт единственный подтверждённый путь
формы `cf`. Прочитать и подготовить этот YAML ровно один раз; отсутствие записи
означает собственную форму расширения. Несколько разных путей для одного адреса
— техническая ошибка.

- [ ] **Step 5: Разделить текущую форму и необязательный кандидат основы**

До `serializePreparedYaml` выполнить:

```ts
const currentConfigurationForm = await readCurrentConfigurationForm({
  queryPort: secondPass.readSession,
  logicalAddress: prepared.logicalAddress,
  projectDir: state.projectDir,
})
const savedBaseForm = await prepareBaseFormCandidate({
  candidate: prepared.baseFormCandidate,
  extensionYaml: prepared.yaml,
  contextWithOwners,
  state,
  profiler,
})
const formDataPathContext = prepareFormDataPathContextFromYAML({
  yaml: clientApplicationFormYaml(prepared.yaml, prepared.targetProjectPath),
  ...(currentConfigurationForm === undefined
    ? {}
    : { currentConfigurationFormYaml: currentConfigurationForm.yaml }),
  ...(savedBaseForm === undefined
    ? {}
    : { savedBaseFormYaml: savedBaseForm.candidateYaml }),
  ownerCache: requireOwnerMetadataCache(contextWithOwners),
  rule: prepared.rule,
})
compactImportedFormDataPaths({ yaml: prepared.yaml, context: formDataPathContext })
```

`prepareBaseFormCandidate` принимает `undefined` и возвращает `undefined`; при
наличии кандидата он возвращает финализированный YAML и признак необходимости
спутника. `writeBaseFormCandidate` только сериализует и записывает подготовленный
результат после основной формы.

- [ ] **Step 6: Сохранить прежний порядок публикации файлов и индексов**

Основная форма остаётся первой в `files`, `indexContributions` и `finalStates`; меняется только вычислительный порядок до записи.

- [ ] **Step 7: Проверить отсутствие лишних чтений**

Расширить существующий счётчик чтений worker: текущая форма `cf` читается ровно
один раз и в случае без спутника, встроенный XML повторно не разбирается.

- [ ] **Step 8: Запустить тесты, дубли и зафиксировать слой**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/importFromXml/worker.test.ts metadata/importFromXml/importConfigurationExtension.test.ts metadata/importFromXml/prepareYaml.test.ts`

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `feat: :sparkles: уплотнять пути заимствованных форм при импорте`

---

## Task 7: Добавить validation без повторного обхода

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.test.ts`
- Modify: `packages/core/metadata/validation/formContracts.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/formStructureProjection.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/contracts.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`

- [ ] **Step 1: Добавить локальные падающие проверки**

Для обычной формы проверить ошибку на явный путь, семантически равный кандидату, включая `Наименование/Description`. Другой явный путь и пустая строка собственного элемента допустимы.

- [ ] **Step 2: Добавить межфайловые падающие проверки**

Для расширения с `БазоваяФорма.yaml` и без неё проверить ошибку
`ПутьКДанным: ""` borrowed-элемента и отсутствие ошибки у own-элемента.
Borrowed-имена брать из объединения текущей формы `cf` и сохранённой основы.
Имя, которое осталось только в сохранённой основе, должно дать отдельную ошибку:
элемент считается заимствованным, но отсутствует в текущей `cf`.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/validate.test.ts metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`

- [ ] **Step 4: Переиспользовать подготовленный контекст локальной validation**

`validateClientApplicationFormFirstPass` строит `FormDataPathContext` один раз; из него получает `index`, occurrences и diagnostics. Явную эквивалентность сравнивать по `candidateInternal`, не по строке YAML.

- [ ] **Step 5: Расширить структурную запись нейтральной строковой нагрузкой**

Добавить в `ProjectStateStructuredDocumentEntry` необязательное `payload?: string`. Двоичный слой только сохраняет/читает строку и не интерпретирует её. Конкретная проекция формы кодирует версионированный JSON:

```ts
type FormElementDataPathPayloadV1 = {
  readonly version: 1
  readonly primaryDataPath: "missing" | "empty" | "explicit"
  readonly value?: string
  readonly tableOwnerName?: string
  readonly owner: { readonly kind: string; readonly name: string }
}
```

Основной реквизит представить отдельным concrete-компонентом
`componentKind: "mainAttribute"`. `projectState` хранит эти строки как
непрозрачные данные.

- [ ] **Step 6: Выполнить borrowed-проверку в существующем Б5**

`validateBorrowedClientApplicationForms` группирует существующие
working/cf/saved-base entries по логическому адресу. Текущая `cf` всегда задаёт
актуальные borrowed-имена и данные для кандидатов; сохранённая основа только
добавляет имена. Для имени только из сохранённой основы выдавать диагностическое
сообщение об отсутствии элемента в текущей `cf`. Отсутствующий путь borrowed-
элемента не проверять на равенство кандидату и не материализовать.

Для проверки явного пути собственного элемента расширения построить
синтетический `ProjectStatePendingDependencyCheck` и вызвать существующий
`resolveProjectStateDataPathReferenceBatch`; для этого расширить нейтральный
`queryPort` структурной validation методами
`readDependencyInputs/readDependencyOwnerInputs`. Конкретный валидатор берёт
основной реквизит и эффективный путь borrowed-таблицы только из записей текущей
`cf`, затем сравнивает полученное internal-представление с кандидатом. Не читать
YAML с диска и не создавать новый индекс базовых форм.

- [ ] **Step 7: Проверить двоичный round-trip ProjectState**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/projectState/contracts.test.ts metadata/projectState/binary/fragment.test.ts metadata/projectState/binary/readSession.test.ts`

- [ ] **Step 8: Запустить validation-тесты, архитектуру и дубли**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/validate.test.ts metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts metadata/validation/yamlFactExtractor.form.test.ts metadata/project/preparedYamlProjectWorker.test.ts`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base df2bf639c`

Commit: `feat: :sparkles: валидировать неявные пути формы`

---

## Task 8: Проверить round-trip и производительность

**Files:**

- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `docs/superpowers/specs/2026-08-09-implicit-form-data-paths-design.md` only if implementation exposes a verified discrepancy; otherwise do not change the approved design.

- [ ] **Step 1: Добавить сквозные round-trip-проверки**

Покрыть обычную форму, расширение без `БазоваяФорма.yaml`, расширение со
спутником и ошибочный элемент только из сохранённой основы. Отдельно проверить
собственную колонку внутри borrowed-таблицы: кандидат строится из пути таблицы
текущей `cf`. Существующие XML-фикстуры только читать; ожидаемый YAML проверять
объектными ожиданиями либо временным каталогом.

- [ ] **Step 2: Запустить профиль затронутых операций на `erp`**

После одного прогрева выполнить по три прогона XML-import, standalone validation и YAML → XML. Сохранить команды и медианы в комментарии к реализации; каждый этап должен укладываться в +5%. Не превращать шумный временной порог в unit-тест.

- [ ] **Step 3: Выполнить полную проверку**

Run: `pnpm type-check`

Run: `pnpm test`

Run: `pnpm duplicates -- --base df2bf639c`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Expected: функциональные проверки зелёные. Если останутся только известные пороги длительности setup/dynamic-list, зафиксировать точные тесты и времена отдельно; не объявлять весь `pnpm test` зелёным.

- [ ] **Step 4: Проверить границы реализации**

Run: `git diff --check df2bf639c...HEAD`

Run: `git status --short`

Убедиться, что XML-фикстуры, общие типы правил, `!xml` и `.agents/architecture.md` не изменены.

- [ ] **Step 5: Зафиксировать итоговый интеграционный слой**

Commit: `test: :white_check_mark: проверить неявные пути формы`
