# File-Backed Metadata Targets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разрешать ссылки на формы и макеты по целям, внесённым хэшированными файлами в общий индекс метаданных `ProjectState`, одинаково для validation, XML-import, sync, поиска ссылок и переименования.

**Architecture:** `resourceTopology` декларативно помечает содержательные файлы, которые подтверждают цель `Form` или `Template`, и чистая проекция превращает классифицированный путь в переносимый вклад. Каждый вклад принадлежит хэшу файла и сохраняется в существующей таблице целей `ProjectState`; Б5 сопоставляет с ним существующие `pendingReferences`. Несколько файлов одного макета образуют одну логическую цель только при совпадении владельца и путей. Прямые `existsSync`/`readdirSync` для подтверждения файловых целей удаляются.

**Tech Stack:** TypeScript 7, Node.js, `structurae`, Vitest 4, pnpm.

## Global Constraints

- Следовать [утверждённой спецификации](../specs/2026-08-08-file-backed-metadata-targets-design.md).
- Не создавать третий индекс или отдельный файл рядом с `project-state.bin`: использовать существующие индекс метаданных, индекс зависимостей и таблицу хэшей.
- `packages/core/metadata/orchestration`, `validation` и `project` не должны содержать ветвлений по `Form`, `Template`, названиям `Формы`/`Макеты`/`Шаблоны` или конкретным `itemType`.
- Единственным источником классификации файловой цели является `resourceTopology`; отсутствие хэша означает отсутствие вклада цели.
- Не создавать diagnostic для отсутствующего файла, если на соответствующую цель нет смысловой ссылки.
- Б5 остаётся в главном процессе и вызывается через один `validateDependencyDiagnosticBatches()`; перенос в worker не входит в задачу.
- Передача внешних файлов import остаётся отдельным этапом после второго прохода. Оба режима `copy` и `move` используют один последующий путь классификации и хэширования.
- `rename_item` изменяет только YAML-проект; XML-выгрузка не читается и не переименовывается.
- Не изменять существующие XML-фикстуры.
- Для каждого production-изменения сначала получить падающий узкий тест, затем минимальную зелёную реализацию.
- После каждого завершённого слоя выполнять `pnpm duplicates -- --base 4f4a516c0`.

---

### Task 1: Декларация и чистая проекция файловой цели в `resourceTopology`

**Files:**
- Modify: `packages/core/metadata/resourceTopology/types.ts`
- Modify: `packages/core/metadata/resourceTopology/compiler.ts`
- Modify: `packages/core/metadata/resourceTopology/compiler.test.ts`
- Modify: `packages/core/metadata/resourceTopology/projectProjection.ts`
- Modify: `packages/core/metadata/resourceTopology/projectProjection.test.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/resourceTopology.ts`
- Modify: `packages/core/metadata/resourceTopology/contracts.test.ts`

**Interfaces:**
- Produces: `MetadataFileBackedMemberTargetDeclaration`.
- Produces: `MetadataFileBackedTargetContribution`.
- Produces: `projectMetadataFileBackedTargets(topology, match): readonly MetadataFileBackedTargetContribution[]`.
- Preserves: существующие `MetadataProjectResourceMatch` и классификацию путей без доступа проекции к файловой системе.

- [ ] **Step 1: Добавить падающие тесты договора декларации и проекции**

В `projectProjection.test.ts` собрать тестовую топологию с владельцем, содержательным файлом формы и внешними вариантами макета. Проверить:

```ts
expect(projectMetadataFileBackedTargets(topology, classify("Объект/Заказ/Формы/Основная/Форма.yaml")))
  .toEqual([{
    kind: "member",
    memberKind: "Form",
    owner: { root: "Document", objectName: "Заказ" },
    itemName: "Основная",
    evidenceProjectPath: "Объект/Заказ/Формы/Основная/Форма.yaml",
    itemProjectPath: "Объект/Заказ/Формы/Основная",
    ownerProjectPath: "Объект/Заказ/Свойства.yaml",
  }])
```

Тем же `it.each` проверить `Template.xml`, `Template.txt`, `Template.bin` и `Ext/Картинка.png`. Отдельно проверить, что модуль и справка формы, а также внешний файл без декларации возвращают пустой массив.

- [ ] **Step 2: Добавить падающие проверки компилятора**

В `compiler.test.ts` проверить отклонение деклараций, где:

- `itemNameParameter` отсутствует в шаблоне ресурса;
- `itemProjectPattern` нельзя заполнить значениями классифицированного ресурса;
- выбран `assignmentOwner`, но assignment не имеет владельца;
- выбранный assignment не имеет декларации `metadataTargetOwner` либо его цепочка владельцев неразрешима.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology/compiler.test.ts metadata/resourceTopology/projectProjection.test.ts --no-isolate`

Expected: FAIL — типы и проекция ещё отсутствуют.

- [ ] **Step 3: Ввести переносимый договор декларации**

В `types.ts` добавить:

```ts
export interface MetadataFileBackedMemberTargetDeclaration {
  readonly kind: "member"
  readonly memberKind: MetadataMemberKind
  readonly itemNameParameter: string
  readonly itemProjectPattern: string
  readonly owner: "assignment" | "assignmentOwner"
}
```

Добавить необязательное поле `fileBackedTarget` к `MetadataContentDeclaration` и `MetadataExternalFileDeclaration`. В скомпилированных узлах хранить уже нормализованный относительно `projectBasePattern` `itemProjectPattern`.

- [ ] **Step 4: Проверить декларации при компиляции**

В `compiler.ts` вынести общий помощник компиляции `fileBackedTarget`, который:

- нормализует `itemProjectPattern` тем же `projectBasePattern`, что и путь ресурса;
- проверяет доступность `itemNameParameter` из параметров пути ресурса;
- выбирает assignment или его владельца без частных условий по виду цели;
- использует существующую цепочку `metadataTargetOwner` (`self`/`inherit`/`resolver`) без частных условий;
- проверяет, что все параметры `itemProjectPattern` и пути владельца достижимы из значений match.

- [ ] **Step 5: Реализовать чистую проекцию**

В `projectProjection.ts` добавить `MetadataFileBackedTargetContribution` и `projectMetadataFileBackedTargets`. Проекция должна использовать только compiled topology и `MetadataProjectResourceMatch`: раскрыть `itemProjectPattern`, путь выбранного assignment и владельца `{ root, objectName }`, не вызывая `stat`, `existsSync`, `readdir` или `resolve` для проверки существования.

- [ ] **Step 6: Объявить реальные цели форм и макетов**

В `ChildFormNames` пометить только content-декларацию `Форма.yaml`:

```ts
fileBackedTarget: {
  kind: "member",
  memberKind: "Form",
  itemNameParameter: "itemName",
  itemProjectPattern: `${folderName}/{itemName}`,
  owner: "assignmentOwner",
}
```

В `ChildTemplateNames` добавить одинаковую декларацию `Template` ко всем четырём внешним вариантам, включая fallback; владельцем является `assignment`. Не помечать модуль или справку формы.

- [ ] **Step 7: Получить зелёные тесты топологии и проверить дубли**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology/compiler.test.ts metadata/resourceTopology/projectProjection.test.ts metadata/resourceTopology/contracts.test.ts --no-isolate`

Expected: PASS.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts packages/core/metadata/commonObjects/childTemplateNames/resourceTopology.ts
git commit -m "feat(resource-topology): ✨ описать файловые цели метаданных"
```

### Task 2: Перенос целевых вкладов через общий договор файлов `ProjectState`

**Files:**
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.test.ts`
- Modify: `packages/core/metadata/projectState/importSession.ts`
- Modify: `packages/core/metadata/projectState/importSession.test.ts`
- Modify: `packages/core/metadata/projectState/binary/contribution.ts`
- Modify: `packages/core/metadata/projectState/binary/contribution.test.ts`
- Modify: `packages/core/metadata/projectState/binary/testData.ts`

**Interfaces:**
- Produces: `ProjectStateTargetEntry` с необязательным `fileBacked`.
- Changes: предметно неверное поле `references` в целевом вкладе переименовывается в `targets`; `pendingReferences` остаётся ребром индекса зависимостей.
- Changes: `ProjectStateResourceUpdate` получает `targets` наравне с YAML-update.
- Changes: `ProjectStateImportIndexContribution.targets` переносит все цели YAML, а resource-вариант `ProjectStateImportFinalFileState` — цели внешнего файла; отдельного import-индекса файловых целей нет.

- [ ] **Step 1: Сформулировать падающие проверки переносимого договора**

Расширить `fileUpdate.test.ts` и `importSession.test.ts` примерами resource- и YAML-update:

```ts
const target: ProjectStateTargetEntry = {
  kind: "member",
  canonical: "Document.Заказ.Template.Печать",
  fileBacked: {
    itemProjectPath: "cf/Документ/Заказ/Макеты/Печать",
    ownerProjectPath: "cf/Документ/Заказ/Свойства.yaml",
  },
}
```

Проверить structured clone/transfer, точный набор ключей, запрет абсолютных путей и функций, а также отклонение resource-update без `targets` после изменения договора.

- [ ] **Step 2: Убедиться в ожидаемом падении**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/fileUpdate.test.ts metadata/projectState/importSession.test.ts metadata/projectState/binary/contribution.test.ts --no-isolate`

Expected: FAIL — resource-update не принимает цели и используется старое имя `references`.

- [ ] **Step 3: Ввести единый тип цели файла**

В `fileUpdate.ts` переименовать `ProjectStateReferenceEntry` в `ProjectStateTargetEntry` и поле `references` в `targets`. Добавить:

```ts
export interface ProjectStateFileBackedTargetLocation {
  readonly itemProjectPath: string
  readonly ownerProjectPath: string
}
```

`ProjectStateResourceUpdate` должен содержать `targets: readonly ProjectStateTargetEntry[]`; обычный ресурс передаёт `[]`. `toProjectStateFileUpdate` принимает дополнительный массив файловых целей и объединяет его с object/member/value targets первого прохода.

- [ ] **Step 4: Обновить точную проверку переносимых данных**

В `fileUpdateValidation.ts` обновить списки допустимых ключей для полных и import-вкладов. Проверять относительные нормализованные `itemProjectPath`/`ownerProjectPath` и запрещать `..`, ведущий `/` и обратный слеш. Не добавлять абсолютные пути в идентичность вклада.

- [ ] **Step 5: Провести договор через import-пакеты**

`ProjectStateImportIndexContribution.targets` сохраняет обычные и файловые цели YAML после записи и вычисления его локального хэша. Окончательный YAML-state по-прежнему переносит только локальную validation, `pendingReferences`, `pendingChecks` и зависимости. Resource-вариант окончательного состояния получает `targets`, потому что внешний файл появляется только после передачи и хэширования.

Рабочий индекс может технически содержать цель уже хэшированного `Форма.yaml`, но не выполняет Б5 и не использует её для проверки существования ссылок. Окончательная проверка выполняется только после добавления всех resource-targets.

Обновить `encode/openProjectStateFileUpdateBatch` и import batch codec; они продолжают использовать общий `encodeBinaryValue`, новый параллельный кодек не создавать.

- [ ] **Step 6: Получить зелёные контрактные тесты и проверить дубли**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/fileUpdate.test.ts metadata/projectState/importSession.test.ts metadata/projectState/binary/contribution.test.ts --no-isolate`

Expected: PASS.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState
git commit -m "refactor(project-state): ♻️ унифицировать целевые вклады файлов"
```

### Task 3: Сохранение и разрешение файловых целей в двоичном индексе метаданных

**Files:**
- Modify: `packages/core/metadata/projectState/binary/layouts.ts`
- Modify: `packages/core/metadata/projectState/binary/factTables.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.test.ts`
- Modify: `packages/core/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.test.ts`
- Modify: `packages/core/metadata/projectState/binary/persistence.test.ts`
- Modify: `packages/core/metadata/projectState/storeContract.ts`
- Modify: `packages/core/metadata/projectState/contracts.test.ts`
- Modify: `packages/core/metadata/projectState/binary/store.test.ts`
- Modify: `packages/core/metadata/projectState/binary/format.ts`

**Interfaces:**
- Changes: физическая таблица целевых фактов хранит `itemProjectPathId` и `ownerProjectPathId` либо `NONE`.
- Changes: `ProjectTargetLookupResult.source` возвращает необязательные `itemProjectPath` и `ownerProjectPath`.
- Changes: `ProjectComponentTargetPage` возвращает те же пути для файловых целей.
- Preserves: компонентную видимость `cfe → cf`, приоритет локального компонента и каскадное владение вкладом по `sourceFileId`.

- [ ] **Step 1: Добавить контрактные сценарии логической цели**

В общий `runProjectStateStoreContract` добавить один набор тестов, который выполняется над двоичным store:

- resource-update с одной целью разрешается;
- цель расширения перекрывает цель `cf`, а при её отсутствии видна цель `cf`;
- два файла одного макета с одинаковыми `fileBacked` путями разрешаются как одна цель;
- одинаковый canonical с разными `itemProjectPath` или `ownerProjectPath` возвращает `ambiguous`;
- удаление одного доказательства сохраняет цель, удаление последнего возвращает `missing`;
- `readComponentTargetPage` выдаёт одну логическую строку с обоими путями.

- [ ] **Step 2: Добавить падающий тест повторной загрузки**

В `persistence.test.ts` сохранить состояние с двумя доказательствами макета, загрузить `project-state.bin` заново и проверить те же результаты `resolveTargets` и удаления. Это защищает именно дисковый договор, а не только сборку в памяти.

- [ ] **Step 3: Убедиться в ожидаемом падении**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/contracts.test.ts metadata/projectState/binary/readSession.test.ts metadata/projectState/binary/persistence.test.ts --no-isolate`

Expected: FAIL — resource targets не записываются в lookup, а несколько доказательств считаются неоднозначностью.

- [ ] **Step 4: Расширить двоичную таблицу целей**

Переименовать внутреннюю fact table `references` в `targets` и расширить запись двумя необязательными строковыми идентификаторами. `fragment.ts` должен добавлять targets и для YAML-, и для resource-update; source file остаётся владельцем строки и тем самым обеспечивает каскадное удаление по хэшу файла.

Поднять `PROJECT_STATE_FORMAT_VERSION`, потому что меняются layout и семантика lookup. Старый несовместимый снимок должен быть отвергнут существующим путём загрузки и перестроен.

- [ ] **Step 5: Сгруппировать только совместимые файловые доказательства**

В `typedBuilder.ts` продолжить хранить отдельную lookup-entry на каждый `sourceFileId`, но в `readSession.ts` считать несколько кандидатов одной логической целью только если каждый имеет `fileBacked` и совпадают:

```text
componentPath + canonical + kind + itemProjectPath + ownerProjectPath
```

Обычные дубли YAML-целей не объединять: они по-прежнему неоднозначны. Смешение обычной и файловой цели того же canonical также считать неоднозначностью.

- [ ] **Step 6: Вернуть проектные пути через публичные запросы**

Расширить `ProjectTargetLookupResult.source` и `ProjectComponentTargetPage.entries` необязательными `itemProjectPath`/`ownerProjectPath`. Не возвращать `evidenceProjectPath` отдельно: для диагностики и владения им уже является `source.projectPath`.

- [ ] **Step 7: Получить зелёный общий договор и проверить дубли**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/contracts.test.ts metadata/projectState/binary/fragment.test.ts metadata/projectState/binary/readSession.test.ts metadata/projectState/binary/persistence.test.ts metadata/projectState/binary/store.test.ts --no-isolate`

Expected: PASS.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/projectState
git commit -m "feat(project-state): ✨ сохранять файловые цели в индексе"
```

### Task 4: Общий путь вкладов при обычной актуализации и validation

**Files:**
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/projectState/projectFiles.ts`
- Modify: `packages/core/metadata/projectState/projectFiles.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndexRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`
- Modify: `packages/core/metadata/importFromXml/validationContribution.ts`
- Modify: `packages/core/metadata/projectState/service.test.ts`

**Interfaces:**
- Produces: общий переходник из `MetadataFileBackedTargetContribution` в `ProjectStateTargetEntry`.
- Changes: `ProjectStateValidationFileTask` несёт уже спроецированные targets вместе с классифицированным путём.
- Removes: `buildFormFileMemberIndexEntries`, `buildTemplateFileMemberIndexEntries` и параметр `hasFile` у index contributor.
- Removes: регистрации `Form`/`Template`, создававшие цели из `existsSync` или коллекций родительского YAML.

- [ ] **Step 1: Добавить падающие тесты классификации файла для состояния**

В `projectFiles.test.ts` проверить, что обнаруженные `Форма.yaml` и все варианты содержимого макета получают переносимые targets, а модуль формы — нет. Проверить пути с префиксом компонента `cf` и `cfe/<Имя>`.

- [ ] **Step 2: Добавить падающие validation-сценарии**

Расширить `projectValidationPasses.test.ts` и/или `service.test.ts` минимальными временными YAML-проектами:

- ссылка на существующую форму разрешается;
- ссылка на существующий макет разрешается;
- имя в `Макеты` родительского YAML без файла не создаёт цель;
- отсутствующий файл со ссылкой даёт обычную reference diagnostic;
- отсутствующий файл без ссылки не даёт diagnostic;
- удаление единственного файла между двумя `refreshAndValidate` удаляет цель без повторного разбора неизменённого YAML;
- удаление одного из двух файлов одного макета сохраняет цель.

- [ ] **Step 3: Убедиться в ожидаемом падении**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/projectFiles.test.ts metadata/validation/projectValidationPasses.test.ts metadata/projectState/service.test.ts --no-isolate`

Expected: FAIL — ресурсные updates пока не получают topology targets, а validation использует обход диска.

- [ ] **Step 4: Передать проекцию вместе с классификацией**

В `project/resources.ts` выполнить чистую проекцию в момент, когда уже получен `MetadataProjectResourceMatch`, и сохранить её в общем описании ресурса. В `projectState/projectFiles.ts` преобразовать вклад в component-prefixed `ProjectStateTargetEntry` и передать его в `ProjectStateValidationFileTask`.

Для ранее известного пути `classifyChangedProjectStateFile` должен повторно использовать тот же классификатор и тот же переходник; отдельной логики восстановления по расширению файла не добавлять.

- [ ] **Step 5: Добавлять targets в worker после успешного чтения и хэширования**

В `refreshProjectStateFiles`:

- для resource-update передать спроецированные `targets`;
- для YAML-update объединить topology targets с целями первого прохода;
- ничего не добавлять до успешного чтения и вычисления `currentHash`;
- для неизменённого хэша оставить прежний вклад нетронутым.

- [ ] **Step 6: Удалить параллельные механизмы validation**

Удалить `buildFormFileMemberIndexEntries`, `buildTemplateFileMemberIndexEntries`, `hasTemplateContent`, `isDirectory` и файловые импорты из `projectValidationPasses.ts`. Удалить `hasFile` из `ProjectReferenceMemberIndexContributor` и вызывающих мест.

В `metadataTargetProjectResolvers/register.ts` убрать обе регистрации с `existsSync` и регистрации `Form`/`Template`, строящие index entries по коллекциям владельца. Остальные предметные contributors (`Command`, поля, флаги и т. п.) сохранить.

- [ ] **Step 7: Подтвердить общую Б5 без новой реализации**

В `service.test.ts` зафиксировать порядок `writeFragment → deleteUnseenFiles → validateDependencyDiagnosticBatches → commit` и тот факт, что файловые targets уже находятся в candidate state к моменту существующего вызова Б5. Не добавлять второй валидатор и не переносить Б5 в worker.

- [ ] **Step 8: Получить зелёную validation и проверить отсутствие обходов**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/project/resources.test.ts metadata/projectState/projectFiles.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/validation/projectValidationPasses.test.ts metadata/projectState/service.test.ts --no-isolate`

Expected: PASS.

Run: `rg -n 'buildFormFileMemberIndexEntries|buildTemplateFileMemberIndexEntries|registerProjectReferenceMemberContributor\("(Form|Template)"|collectionMemberIndexContributor\(\{ modelName: "(forms|templates)"' packages/core/metadata`

Expected: нет совпадений.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

- [ ] **Step 9: Зафиксировать слой**

```bash
git add packages/core/metadata/project packages/core/metadata/projectState packages/core/metadata/validation packages/core/metadata/commonObjects/metadataTargetProjectResolvers packages/core/metadata/importFromXml/validationContribution.ts
git commit -m "refactor(validation): ♻️ строить файловые цели из топологии"
```

### Task 5: Те же файловые вклады после передачи файлов XML-import

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/projectState/importSession.test.ts`

**Interfaces:**
- Changes: `externalFileStateBatch` классифицирует каждый уже переданный и хэшированный файл общей topology-проекцией.
- Changes: окончательный YAML-state import переносит topology target содержательного файла формы.
- Preserves: `first pass → working index → second pass → transfer → hash → final state → Б5 → publication`.

- [ ] **Step 1: Добавить падающий тест порядка и видимости цели**

В `importConfiguration.test.ts` расширить существующий координаторный сценарий событиями:

```text
firstPass
commitWorkingIndex
secondPass
transferExternalFiles
hashProject
writeExternalTargets
validateDependencyDiagnosticBatches
publish
```

До `hashProject` запрос цели макета должен возвращать `missing`; после записи окончательного фрагмента и перед Б5 — `found`.

- [ ] **Step 2: Добавить интеграционные случаи copy/move и расширения**

Одним `it.each(["copy", "move"])` проверить, что оба режима дают одинаковый target contribution. В тесте расширения проверить локальный макет `cfe`, перекрывающий одноимённую цель `cf`, без частного условия в import coordinator.

- [ ] **Step 3: Убедиться в ожидаемом падении**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfiguration.test.ts metadata/importFromXml/importConfigurationExtension.test.ts metadata/importFromXml/worker.test.ts --no-isolate`

Expected: FAIL — `externalFileStateBatch` пишет resource identity без targets.

- [ ] **Step 4: Спроецировать окончательные YAML-цели import**

В `worker.ts` использовать тот же переходник topology contribution, что и validation worker, когда сформированный YAML уже записан и вычислен его локальный хэш. `splitImportYamlUpdate` переносит эти цели вместе с остальными `targets` в `ProjectStateImportIndexContribution`; рабочий индекс второго прохода может их хранить, но не запускает по ним Б5 и не использует их для проверки существования ссылок.

- [ ] **Step 5: Спроецировать переданные внешние файлы**

После `transferExternalFiles` и `hashProject` классифицировать каждый `targetProjectPath` топологией выбранного компонента и добавить targets в соответствующий resource-update. Не строить цель из `discovered.assignments` или исходного XML-пути.

Если передача, чтение или хэширование падает, существующий `importSession.abort` должен оставить candidate state неопубликованным. Не добавлять откат уже переданных файлов.

- [ ] **Step 6: Проверить равенство diagnostics import и чистой validation**

Добавить интеграционный тест: выполнить import в новый проект, сохранить его diagnostics, удалить один подтверждающий файл макета, затем выполнить чистую validation и сравнить нормализованные dependency diagnostics по `filePath`, `yamlPath`, координатам и canonical-цели. Для одинакового окончательного набора файлов результаты должны совпадать.

- [ ] **Step 7: Получить зелёный import и проверить дубли**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfiguration.test.ts metadata/importFromXml/importConfigurationExtension.test.ts metadata/importFromXml/worker.test.ts metadata/projectState/importSession.test.ts --no-isolate`

Expected: PASS.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/projectState/importSession.test.ts
git commit -m "fix(import): 🐛 проверять ссылки после хэширования файлов"
```

### Task 6: Использование индексированных путей в поиске ссылок и переименовании

**Files:**
- Modify: `packages/core/metadata/workerPool/projectQueries.ts`
- Modify: `packages/core/metadata/workerPool/projectQueries.test.ts`
- Modify: `packages/core/metadata/operations/indexReferences.ts`
- Modify: `packages/core/metadata/operations/indexReferences.test.ts`
- Modify: `packages/core/metadata/operations/targetResolver.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`

**Interfaces:**
- Changes: `IndexedOperationReferencesResult.source` переносит `itemProjectPath` и `ownerProjectPath` файловой цели.
- Produces: список занятых однотипных имён из `readComponentTargetPage`, а не из `readdirSync`.
- Changes: `resolveMetadataOperationPath` принимает уже подтверждённую индексом файловую цель и не проверяет её через `existsSync`.

- [ ] **Step 1: Расширить падающий двоичный договор project query**

В `projectQueries.test.ts` проверить кодирование/декодирование source с `itemProjectPath`, `ownerProjectPath` и списком занятых имён того же canonical-префикса. Обычная YAML-цель должна сохранять прежний компактный результат без этих полей.

- [ ] **Step 2: Добавить падающие сценарии операций**

В тестах операций проверить реальную файловую цель макета, у которой доказательством является `Ext/Картинка.png`, а ожидаемого `Template.xml` нет:

- `find_references` отличает внутреннюю ссылку внутри `itemProjectPath` от внешней;
- `rename_item` загружает `ownerProjectPath`, переписывает ссылки и переименовывает весь `itemProjectPath`;
- конфликт имени находится по странице общего индекса;
- вызов не использует прямой `existsSync`/`readdirSync` для файловой цели;
- XML-каталог вне YAML-проекта не меняется.

- [ ] **Step 3: Убедиться в ожидаемом падении**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/workerPool/projectQueries.test.ts metadata/operations/indexReferences.test.ts metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts --no-isolate`

Expected: FAIL — source содержит только evidence path, а resolver требует конкретный YAML-файл.

- [ ] **Step 4: Передать индексированные пути через worker query**

В `runProjectQuery` взять оба пути из `resolveTargets`. Для поиска занятых имён прочитать `ProjectComponentTargetPage` постранично и выбрать targets с тем же canonical owner/member prefix; не обходить каталоги. Расширить существующий двоичный ответ, не вводя JSON-ответ для большого списка ссылок.

- [ ] **Step 5: Перестроить snapshot от содержательного владельца**

В `renameItem.ts` для файловой цели передавать в `buildMetadataOperationSnapshotFromProjectPaths` `ownerProjectPath`, а не случайный evidence file. Ссылочные YAML по-прежнему добавлять по их индексированным `projectPath`.

- [ ] **Step 6: Убрать файловые проверки из resolver**

Удалить `existsSync`, `fileItemNames` и файловый `readdirSync` из `targetResolver.ts`. Для file item использовать подтверждённые `itemProjectPath`, `ownerProjectPath` и занятые имена результата project query. Сохранить предметную operation-target декларацию только для разбора пользовательского пути и canonical kind.

В `findMetadataReferences.ts` определять внутреннее дерево файловой цели по `itemProjectPath`; для object оставить каталог владельца, для named collection — прежнее отсутствие внутреннего дерева.

- [ ] **Step 7: Получить зелёные операции и проверить отсутствие обходов**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/workerPool/projectQueries.test.ts metadata/operations/indexReferences.test.ts metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts --no-isolate`

Expected: PASS.

Run: `rg -n 'existsSync|readdirSync' packages/core/metadata/operations/targetResolver.ts`

Expected: нет совпадений.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/workerPool/projectQueries.ts packages/core/metadata/workerPool/projectQueries.test.ts packages/core/metadata/operations
git commit -m "refactor(operations): ♻️ использовать пути файловых целей из индекса"
```

### Task 7: Полная sync и сквозной договор одной Б5

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/selection.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**
- Preserves: sync начинает с `refreshAndValidate` и использует его diagnostics.
- Verifies: validation и import вызывают один `ProjectStateWriterHandle.validateDependencyDiagnosticBatches()` в главном процессе.
- Verifies: sync выбирает внешние файлы по общей topology/hash-проекции после успешной Б5.

- [ ] **Step 1: Добавить падающий сквозной тест отсутствующей цели**

В `failureIntegration.test.ts` создать проект со ссылкой на макет, выполнить успешную актуализацию, удалить все подтверждающие файлы и запустить full sync. Проверить:

- обычный режим блокируется существующей reference diagnostic;
- `ignoreValidationErrors: true` разрешает продолжить и возвращает ту же diagnostic;
- отсутствие несвязанного файла не блокирует sync.

- [ ] **Step 2: Зафиксировать общий вызов Б5**

В тестах validation и import использовать один поддельный `ProjectStateWriterHandle`, считающий вызовы `validateDependencyDiagnosticBatches`. Для каждой операции ожидается ровно один вызов после окончательных файловых вкладов и до публикации. Не тестировать внутренности валидатора второй раз.

- [ ] **Step 3: Убедиться в ожидаемом падении или сразу подтвердить существующий поток**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/failureIntegration.test.ts metadata/fullSyncToXml/selection.test.ts metadata/validation/validateProject.test.ts metadata/importFromXml/importConfiguration.test.ts --no-isolate`

Expected before последней связки: новый сценарий удаления макета FAIL. После задач 1–6: PASS без отдельного production-валидатора для sync.

- [ ] **Step 4: Внести только необходимую связку sync**

Если тест выявит остаточную прямую проверку существования цели в sync, заменить её запросом уже актуализированного `ProjectState`; саму передачу внешних файлов оставить на существующей `resourceTopology`-классификации и хэшах. Если тест уже зелёный, production-код sync не менять.

- [ ] **Step 5: Проверить слой и зафиксировать**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/failureIntegration.test.ts metadata/fullSyncToXml/selection.test.ts metadata/validation/validateProject.test.ts metadata/importFromXml/importConfiguration.test.ts --no-isolate`

Expected: PASS.

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS.

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/importFromXml/importConfiguration.test.ts
git commit -m "test(metadata): ✅ закрепить общую проверку файловых целей"
```

### Task 8: Архитектурное описание и окончательная проверка

**Files:**
- Modify: `.agents/architecture.md`
- Verify: все файлы задач 1–7.

**Interfaces:**
- Documents: файловые цели как часть индекса метаданных и их принадлежность хэшу файла.
- Documents: окончательный порядок XML-import с отдельной передачей файлов до Б5.
- Removes: остаточные специальные механизмы подтверждения `Form`/`Template`.

- [ ] **Step 1: Обновить утверждённое архитектурное описание**

Без изменения порядка Б1–Б6 уточнить в `.agents/architecture.md`:

- Б1 хэширует все ресурсы topology;
- Б4 включает в индекс метаданных цели хэшированных файлов и удаляет их вместе с файлом;
- Б5 разрешает `pendingReferences` по окончательным YAML- и файловым целям;
- import передаёт внешние файлы отдельным этапом после второго прохода, затем хэширует их и только после этого выполняет общую Б5;
- прямые проверки существования файловой цели вне `ProjectState` запрещены.

- [ ] **Step 2: Проверить отсутствие отменённых механизмов**

Run:

```bash
rg -n 'buildFormFileMemberIndexEntries|buildTemplateFileMemberIndexEntries' packages/core/metadata
rg -n 'registerProjectReferenceMemberContributor\("(Form|Template)"' packages/core/metadata
rg -n 'existsSync|readdirSync' packages/core/metadata/operations/targetResolver.ts
```

Expected: нет совпадений.

- [ ] **Step 3: Проверить типы**

Run: `pnpm type-check`

Expected: PASS.

- [ ] **Step 4: Запустить все тесты**

Run: `pnpm test`

Expected: функциональные тесты PASS. Если контроль длительности снова падает на исходных порогах, выполнить три профильных прогона по `.agents/testing.md`, сравнить медиану с исходным состоянием и отдельно зафиксировать результат; не маскировать регрессию повышением порогов.

- [ ] **Step 5: Проверить архитектурные границы**

Run: `pnpm test:architecture`

Expected: PASS; общие metadata-слои не импортируют декларации конкретных форм или макетов.

- [ ] **Step 6: Проверить новые дубли**

Run: `pnpm duplicates -- --base 4f4a516c0`

Expected: PASS, новых дублей относительно базового коммита worktree нет.

- [ ] **Step 7: Выполнить контрольную validation и import**

Удалить разрешённый внутренний `.nkdk`-снимок перед каждым чистым прогоном. Проверить:

- validation `/Users/nikita/git/sed_nkdk/cf` вместе с расширением;
- XML-import `/Users/nikita/git/sed_xml/cf` непосредственно в `/Users/nikita/git/sed_nkdk/cf` в режиме `copy`;
- отсутствие прежней группы ложных неразрешённых ссылок на формы и макеты;
- совпадение dependency diagnostics import и следующей чистой validation.

- [ ] **Step 8: Зафиксировать документацию и финальную проверку**

```bash
git add .agents/architecture.md
git commit -m "docs(architecture): 📝 описать файловые цели ProjectState"
```
