# Историческая основа заимствованной формы — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять отличающуюся XML-`BaseForm` в необязательном `БазоваяФорма.yaml` и выбирать этот файл либо актуальную проекцию `cf` при XML-sync.

**Architecture:** Модуль `ClientApplicationForm` регистрирует необязательный YAML-спутник основного задания формы. Спутник проходит схему формы в изолированном контуре, не публикует metadata facts в общий ProjectState и использует отдельный логический корень в снимке конфигурации. Нейтральная топология знает только общий договор YAML-спутника, но не имя `BaseForm` и не виды владельцев формы.

**Tech Stack:** TypeScript, Vitest, resourceTopology, XML import, full XML sync, configuration snapshot.

## Global Constraints

- Выполнять после успешного плана `2026-08-09-extension-metadata-visibility.md`.
- Не изменять XML-фикстуры и не вводить `!xml`.
- `БазоваяФорма.yaml` содержит тело `ClientApplicationForm`, без обёртки, UUID, числовых `id` и XML namespaces.
- Общие слои не получают проверок имени `БазоваяФорма.yaml`, каталогов `Формы`/`ОбщаяФорма` или `itemType` конкретного владельца.
- После каждого слоя запускать `pnpm duplicates -- --base 5774cca5fe5ec396cd4753c23fe0d6b2a691bd14`.

---

## Task 1: Ввести нейтральный YAML-спутник задания

**Files:**

- Modify: `packages/core/metadata/resourceTopology/core/types.ts`
- Modify: `packages/core/metadata/resourceTopology/core/compiler.ts`
- Modify: `packages/core/metadata/resourceTopology/core/projectProjection.ts`
- Modify: `packages/core/metadata/resourceTopology/core/compiler.test.ts`
- Modify: `packages/core/metadata/resourceTopology/core/projectProjection.test.ts`
- Modify: `packages/core/metadata/projectDefinition/resources.ts`
- Modify: `packages/core/metadata/projectDefinition/resources.test.ts`

- [ ] Добавить декларацию `MetadataYamlCompanionDeclaration` с полями `kind: "yamlCompanion"`, `assignmentProjectPattern`, `projectPattern`, `required`, `itemRule`, `projectRole: "form"`, `indexContribution: "isolated"`, `logicalAddressSegment` и `source`.
- [ ] Компилировать её в `CompiledMetadataAssignmentNode.yamlCompanions`; включить пути спутников в `projectIndex`, но не в `xmlIndex` и не создавать из них отдельные XML-задания.
- [ ] Проецировать совпадение как `MetadataProjectResourceMatch` вида `yamlCompanion`, сохраняя владельца основного задания, правило спутника и параметры пути.
- [ ] В адаптере `projectDefinition/resources.ts` представить спутник как YAML с ролью `form` и признаком `indexContribution: "isolated"`; протянуть признак в `PreparedYamlProjectFileDescriptor`, не добавляя новый `yamlRole` в ProjectState.
- [ ] Тестами доказать: путь спутника классифицируется как YAML формы, основной путь остаётся единственным XML assignment, неизвестный соседний YAML не классифицируется.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology/core/compiler.test.ts metadata/resourceTopology/core/projectProjection.test.ts metadata/projectDefinition/resources.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/projectDefinition
git commit -m "feat: :sparkles: добавить изолированный yaml-спутник"
```

## Task 2: Зарегистрировать основу дочерней и общей формы

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/childFormNamesResourceAdapter.ts`
- Modify: `packages/core/metadata/resourceTopology/adapters/registeredRules.test.ts`
- Modify: `packages/core/metadata/resourceTopology/contracts.test.ts`

- [ ] В `propertyRules.ts` вернуть `yamlCompanion` с `projectPattern: "БазоваяФорма.yaml"` для свойства `ClientApplicationForm`; это связывает файл со `Свойства.yaml` общей формы.
- [ ] В `childFormNamesResourceAdapter.ts` зарегистрировать тот же спутник для задания `${folderName}/{itemName}/Форма.yaml` по пути `${folderName}/{itemName}/БазоваяФорма.yaml`.
- [ ] Для обеих регистраций использовать `ClientApplicationFormRules`, `projectRole: "form"`, `indexContribution: "isolated"`, `logicalAddressSegment: "ОсноваФормы"`, `required: false`.
- [ ] Проверить точные пути `Справочник/.../Формы/<Имя>/БазоваяФорма.yaml` и `ОбщаяФорма/<Имя>/БазоваяФорма.yaml`, а также связь каждого спутника с правильным основным заданием.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology/adapters/registeredRules.test.ts metadata/resourceTopology/contracts.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm/propertyRules.ts packages/core/metadata/forms/clientApplicationForm/childFormNamesResourceAdapter.ts packages/core/metadata/resourceTopology/adapters/registeredRules.test.ts packages/core/metadata/resourceTopology/contracts.test.ts
git commit -m "feat: :sparkles: зарегистрировать основу формы"
```

## Task 3: Подготовить смысловую модель и сравнение XML-основы

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormYaml.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormYaml.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`

- [ ] Выделить функцию `importClientApplicationFormBodyFromXML`, которая преобразует произвольное тело `Form` теми же правилами, но принимает отдельные collector/deferred и не применяет metadata-свойства формы.
- [ ] В `baseFormYaml.ts` реализовать `importBaseFormYaml({ context, baseFormXML, formName, rule })`, использующую изолированный collector с логическим корнем `<адрес формы>.ОсноваФормы`, и `normalizeBaseFormYaml`, удаляющую только служебные детали, уже отсутствующие в YAML-модели.
- [ ] Реализовать `equalBaseFormYaml(left, right)` как глубокое смысловое сравнение: порядок ключей объектов незначим, порядок массивов и порядок/иерархия дерева элементов значимы.
- [ ] Тестами проверить игнорирование namespaces/UUID/id и различение значимого свойства, вида, состава, порядка и иерархии.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormYaml.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm/baseFormYaml.ts packages/core/metadata/forms/clientApplicationForm/baseFormYaml.test.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts
git commit -m "feat: :sparkles: преобразовать основу формы в yaml"
```

## Task 4: Записывать только отличающуюся основу при XML-import

**Files:**

- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`

- [ ] Расширить `PreparedImportYaml` необязательным `baseFormCandidate`: смысловой YAML импортированного `BaseForm`, собственные deferred values, его изолированный фрагмент снимка и относительный путь спутника из topology.
- [ ] Для задания формы расширения извлекать `Form.BaseForm`; при отсутствии узла не создавать candidate и не добавлять диагностику.
- [ ] Candidate всегда удерживать до второго прохода. Сначала завершить его deferred values тем же owner cache, но с formDataPathIndex, построенным только из candidate. Затем прочитать соответствующий текущий YAML `cf` по тому же относительному пути основного задания, проверить его через `prepareYamlFiles`, построить `projectClientApplicationBaseForm({ baseYaml, extensionYaml })` и сравнить с candidate.
- [ ] При равенстве не записывать файл и отбросить изолированный фрагмент. При различии сериализовать YAML через общий exporter, записать по пути topology-спутника, добавить его хэш в состояние и фрагмент снимка с `sourceProjectPath` спутника.
- [ ] Убедиться, что validation contribution спутника содержит только локальные schema diagnostics: `targets`, `owners`, `fields`, `forms`, `pendingReferences` и `pendingChecks` не попадают в общий ProjectState.
- [ ] Расширить интеграционный тест тремя сценариями без изменения XML-фикстуры: исходная равная проекция не создаёт файл; программно изменённое значимое поле `BaseForm` создаёт; программно удалённый XML-узел не создаёт файл и сообщение.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/prepareYaml.test.ts metadata/importFromXml/importConfigurationExtension.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/importFromXml
git commit -m "feat: :sparkles: сохранять историческую основу формы"
```

## Task 5: Выбирать сохранённую основу при полном XML-sync

**Files:**

- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/core/metadata/fullSyncToXml/baseFormSource.ts`
- Modify: `packages/core/metadata/fullSyncToXml/baseFormSource.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`

- [ ] В задании заимствованной формы передавать два возможных пути: зарегистрированный спутник `cfe` и основной YAML формы `cf`; наличие спутника определять по подтверждённой структуре/хэшам компонента.
- [ ] Расширить `BaseFormSource.read` возвращаемым discriminated union: `{ kind: "saved"; prepared; projectPath }` либо `{ kind: "projected"; prepared; projectPath }`. Для `saved` читать и повторно хэшировать `БазоваяФорма.yaml`; для `projected` сохранять текущую проверку YAML `cf`.
- [ ] В `buildClientApplicationBaseForm` разделить ветви: `buildProjectedClientApplicationBaseForm` сохраняет текущую проекцию `cf`; `buildSavedClientApplicationBaseForm` конвертирует YAML спутника напрямую, с `dataPathYaml` равным самому спутнику.
- [ ] Для сохранённой основы создать configuration-index runtime поверх снимка целевого расширения (`state.index`), с `targetProjectPath` спутника и логическим корнем `<адрес формы>.ОсноваФормы`; не использовать для этой ветви `state.baseIndex` основной конфигурации. Собирать её entities в отдельный фрагмент результата assignment. Для построенной основы оставить текущую пару `baseIndex`/`state.index` и отбрасываемый collector.
- [ ] Расширить `PreparedXMLAssignment` массивом index collectors с их `targetProjectPath`; `writeAssignment.ts` должен вернуть отдельный fragment рабочего YAML и отдельный fragment сохранённой основы, чтобы последующее удаление спутника удаляло только его entities.
- [ ] При отсутствии спутника не материализовать его. Тестом изменить YAML `cf` между двумя синхронизациями и проверить, что XML-`BaseForm` меняется, а файл не появляется.
- [ ] Тестами проверить дочернюю и общую форму, приоритет сохранённой основы и успешное назначение свободных локальных `id` при отсутствии записей снимка.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/baseFormSource.test.ts metadata/fullSyncToXml/worker.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/forms/clientApplicationForm
git commit -m "feat: :sparkles: выбирать источник основы формы"
```

## Task 6: Поддержать основу в частичной XML-синхронизации

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/partialXmlPackage.ts`
- Modify: `packages/core/metadata/partialSyncToXml/impactPlanner.test.ts`
- Modify: `packages/core/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`

- [ ] Зарегистрировать YAML-спутник как вход задания формы: изменение или удаление спутника должно включать основное задание формы; сам спутник не создаёт самостоятельный XML-документ.
- [ ] При наличии спутника включать его подтверждённые байты в пакет; при удалении выбирать текущую `cf`.
- [ ] Проверить план изменения, удаления и отсутствия `БазоваяФорма.yaml`.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/impactPlanner.test.ts metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/forms/clientApplicationForm/partialXmlPackage.ts packages/core/metadata/partialSyncToXml
git commit -m "feat: :sparkles: учесть основу в частичной синхронизации"
```

## Task 7: Завершающая проверка слоя

- [ ] Запустить `pnpm --filter @nkdk/core type-check`.
- [ ] Запустить `pnpm --filter @nkdk/core test`.
- [ ] Запустить `pnpm duplicates -- --base 5774cca5fe5ec396cd4753c23fe0d6b2a691bd14`.
- [ ] Не переходить к плану `2026-08-09-borrowed-form-validation.md`, пока проверки не завершатся успешно.
