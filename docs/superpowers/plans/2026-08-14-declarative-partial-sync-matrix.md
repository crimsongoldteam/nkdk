# Декларативная матрица частичной синхронизации — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Расширить ручной внешний сценарий до декларативной последовательной проверки создания всех 47 корневых типов, всех поддерживаемых комбинаций дочерних элементов и одной формы на владельца с последующим обратным удалением.

**Architecture:** Типизированная матрица описывает файлы, зависимости, дочерние элементы и формы, а чистый построитель превращает её в стабильный линейный план. Универсальный исполнитель применяет одну файловую операцию, проверяет её через публичный MCP и только после полного успеха атомарно заменяет `checkpoints/current`; состояние версии 2 связывается с SHA-256 плана.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, MCP SDK, YAML, файловая база, автономный сервер.

## Global Constraints

- Все изменения выполнять в `/Users/nikita/git/nkdk/.worktrees/partial-sync-resumable-test` на ветке `codex/partial-sync-resumable-test`.
- База ручного запуска: `/Users/nikita/Базы 1С/temp_test`; первый запуск новой версии выполнять только с явным `--reset`.
- Не изменять существующие XML-фикстуры.
- Все проверяемые validation, partial sync и контрольный import выполнять через настоящий MCP stdio-сервер.
- Изменять только `cf`; расширение не импортировать и не сравнивать после исходной подготовки.
- Одна операция матрицы равна одному этапу синхронизации, проверки и публикации контрольной копии.
- Хранить только `checkpoints/current`, журналы попыток не удалять.
- Не добавлять `!xml`, новые правила fromXML/toXML/fromYAML/toYAML или поля общих типов правил.
- Production-код писать только после правильно падающего теста.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 39310b80d`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и повторную проверку дублей.
- Реальный сценарий не включать в `pnpm test`, `pnpm test:e2e` или CI.

---

## Структура файлов

- `e2e/partial-sync/matrix/types.ts` — только типы деклараций и операций.
- `e2e/partial-sync/matrix/root-objects.ts` — 47 деклараций корневых объектов и их зависимостей.
- `e2e/partial-sync/matrix/children.ts` — явные комбинации владельца с дочерним элементом.
- `e2e/partial-sync/matrix/forms.ts` — одна минимальная форма для каждого допустимого владельца.
- `e2e/partial-sync/matrix/index.ts` — собирает и экспортирует неизменяемую матрицу.
- `e2e/partial-sync/matrix.test.ts` — полнота относительно правил, уникальность и корректность деклараций.
- `e2e/partial-sync/plan.ts` — проверяет зависимости, строит операции и вычисляет хэш.
- `e2e/partial-sync/plan.test.ts` — порядок создания/удаления и стабильность хэша.
- `e2e/partial-sync/operation.ts` — применяет одну декларативную операцию к NKDK-файлам.
- `e2e/partial-sync/operation.test.ts` — границы файловых изменений и обратное удаление.
- `e2e/partial-sync/workspace.ts` и тест — состояние версии 2 и безопасный `--reset`.
- `e2e/partial-sync/checkpoints.ts` и тест — единственная атомарно заменяемая копия.
- `e2e/partial-sync/scenario.ts` и тест — восстановление и продолжение по ключу операции.
- `e2e/partial-sync/steps.ts` и тест — исходная подготовка и универсальная MCP-проверка одной операции только для `cf`.
- `e2e/partial-sync/run.ts` и тест — параметр `--reset` и передача его дочернему процессу.
- `e2e/partial-sync/partial-sync.external.test.ts` — собирает матрицу и запускает весь план.

---

### Task 1: Типы деклараций и чистый построитель плана

**Files:**
- Create: `e2e/partial-sync/matrix/types.ts`
- Create: `e2e/partial-sync/plan.ts`
- Create: `e2e/partial-sync/plan.test.ts`

**Interfaces:**
- Produces: `ScenarioFileChange`, `RootObjectDeclaration`, `ChildDeclaration`, `FormDeclaration`, `ScenarioMatrix`, `ScenarioOperation`.
- Produces: `buildScenarioPlan(matrix): readonly ScenarioOperation[]`.
- Produces: `scenarioPlanHash(plan): string`.

- [ ] **Step 1: Написать падающие тесты порядка и устойчивого хэша**

В `plan.test.ts` задать малую матрицу `parent → child → form` и проверить точный порядок:

```ts
expect(buildScenarioPlan(matrix).map(({ key }) => key)).toEqual([
  "object:catalog",
  "object:document",
  "child:catalog:attribute",
  "form:catalog",
  "remove:form:catalog",
  "remove:child:catalog:attribute",
  "remove:object:document",
  "remove:object:catalog",
])
```

Отдельно проверить отсутствующую зависимость, цикл, повторяющийся ключ и одинаковый SHA-256 для структурно одинаковых матриц с разным порядком ключей объектов.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/plan.test.ts`

Expected: FAIL, модуль `plan.ts` отсутствует.

- [ ] **Step 3: Ввести точные типы модели**

```ts
export type ScenarioFileContents = string | Uint8Array
export type ScenarioFileChange = {
  readonly path: string
  readonly before: ScenarioFileContents | null
  readonly after: ScenarioFileContents | null
}

export type RootObjectDeclaration = {
  readonly key: string
  readonly itemType: string
  readonly name: string
  readonly changes: readonly ScenarioFileChange[]
  readonly dependsOn: readonly string[]
}

export type ChildDeclaration = {
  readonly key: string
  readonly ownerKey: string
  readonly propertyKey: string
  readonly childItemType: string
  readonly changes: readonly ScenarioFileChange[]
  readonly dependsOn: readonly string[]
}

export type FormDeclaration = {
  readonly key: string
  readonly ownerKey: string
  readonly changes: readonly ScenarioFileChange[]
}

export type ScenarioMatrix = {
  readonly roots: readonly RootObjectDeclaration[]
  readonly children: readonly ChildDeclaration[]
  readonly forms: readonly FormDeclaration[]
}

export type ScenarioOperation = {
  readonly key: string
  readonly kind: "create-object" | "add-child" | "add-form" | "remove"
  readonly ownerKey?: string
  readonly targetKey?: string
  readonly changes: readonly ScenarioFileChange[]
}
```

- [ ] **Step 4: Реализовать проверку графа, канонизацию и построение**

Создание корней сортировать топологически с сохранением порядка матрицы среди независимых узлов. Дочерние элементы и формы идут после всех корней; удаления строятся через `toReversed()` и меняют `before`/`after` каждой создающей операции местами. Для хэша рекурсивно сортировать ключи обычных объектов, не сортируя массив операций, затем использовать `createHash("sha256")`.

- [ ] **Step 5: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/plan.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/matrix/types.ts e2e/partial-sync/plan.ts e2e/partial-sync/plan.test.ts
git commit -m "feat: :sparkles: построить декларативный план синхронизации"
```

---

### Task 2: Матрица всех корневых объектов

**Files:**
- Create: `e2e/partial-sync/matrix/root-objects.ts`
- Create: `e2e/partial-sync/matrix/index.ts`
- Create: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: `rootObjectDeclarations: readonly RootObjectDeclaration[]`.
- Produces: `partialSyncMatrix: ScenarioMatrix`.
- Consumes: `TopLevelMetadataItemRules` from `packages/rules/metadata/appliedObjects/configuration/topLevelRules.ts` in tests only.

- [ ] **Step 1: Написать падающую проверку точного покрытия 47 типов**

```ts
expect(new Set(rootObjectDeclarations.map(({ itemType }) => itemType))).toEqual(
  new Set(TopLevelMetadataItemRules.map(({ itemType }) => itemType))
)
expect(rootObjectDeclarations).toHaveLength(47)
```

Проверить уникальность `key`, `name`, отсутствие абсолютных путей, `..`, обратной косой черты и повторяющихся путей внутри одного объекта.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

Expected: FAIL, экспорт матрицы отсутствует.

- [ ] **Step 3: Добавить явные декларации всех типов**

Использовать префикс имени `ПроверкаЧастичнойСинхронизации` и короткий суффикс типа. Каталожные объекты описывать как `<Тип>/<Имя>/Свойства.yaml`, файловые — как `<Тип>/<Имя>.yaml`. В массив должны войти ровно следующие `itemType` из реестра:

```ts
const expectedRootTypes = [
  "MetadataCatalog", "MetadataDocument", "MetadataDataProcessor", "MetadataReport",
  "MetadataDocumentJournal", "MetadataHTTPService", "MetadataInformationRegister",
  "MetadataAccumulationRegister", "MetadataExchangePlan", "MetadataDocumentNumerator",
  "MetadataEnumeration", "MetadataSequence", "MetadataDefinedType",
  "MetadataSessionParameter", "MetadataEventSubscription", "MetadataFilterCriterion",
  "MetadataFunctionalOption", "MetadataFunctionalOptionsParameter", "MetadataRole",
  "MetadataScheduledJob", "MetadataLanguage", "MetadataCommonTemplate",
  "MetadataCommonModule", "MetadataXDTOPackage", "MetadataWebSocketClient",
  "MetadataExternalDataSource", "MetadataCommonForm", "MetadataCommonPicture",
  "MetadataStyle", "MetadataCommonCommand", "MetadataCommandGroup", "MetadataConstant",
  "MetadataSubsystem", "MetadataAccountingRegister", "MetadataSettingsStorage",
  "MetadataStyleItem", "MetadataCommonAttribute", "MetadataBusinessProcess",
  "MetadataCalculationRegister", "MetadataChartOfAccounts",
  "MetadataChartOfCalculationTypes", "MetadataChartOfCharacteristicTypes",
  "MetadataBot", "MetadataIntegrationService", "MetadataTask", "MetadataWebService",
  "MetadataWSReference",
] as const
```

Минимальные значения взять из соответствующих существующих вариантов `ПоУмолчанию`, но записать непосредственно в `changes.after`, не копируя фикстуры во время теста. Обязательные значения включают URL HTTP-сервиса, URL WS-ссылки, пространство имён Web-сервиса/XDTO, тип константы/общего реквизита/определяемого типа, задачу бизнес-процесса, план видов расчёта регистра расчёта, метод регламентного задания и минимальный числовой ресурс регистров, которым ресурс обязателен. Все ссылки должны указывать на ключи этой же матрицы и присутствовать в `dependsOn`.

- [ ] **Step 4: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/matrix e2e/partial-sync/matrix.test.ts
git commit -m "test: :white_check_mark: описать все корневые объекты"
```

---

### Task 3: Все комбинации дочерних элементов и формы

**Files:**
- Create: `e2e/partial-sync/matrix/children.ts`
- Create: `e2e/partial-sync/matrix/forms.ts`
- Modify: `e2e/partial-sync/matrix/index.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: `childDeclarations: readonly ChildDeclaration[]`.
- Produces: `formDeclarations: readonly FormDeclaration[]`.
- Produces test helper `collectRuleChildCapabilities()` returning stable strings `<ownerItemType>:<propertyKey>:<childItemType>`.

- [ ] **Step 1: Написать падающую проверку полноты дочерних комбинаций**

Создать локальный registry через `createRuleRegistrySet(metadataRules)` и для каждого `TopLevelMetadataItemRules.properties[propertyKey]` вызвать `registry.property.resolvePropertyItemRule(propertyRule)`. Учитывать правило, если полученный дочерний `itemType` имеет `externalMetadata.placement === "ownerChild"`. Сравнить множество со строками деклараций:

```ts
expect(declaredChildCapabilities).toEqual(discoveredChildCapabilities)
```

Формообразующих владельцев определить наличием свойства с `type === "ChildFormNames"`; проверить ровно одну декларацию формы на каждого такого владельца. Именованные исключения хранить как `{ capability, reason }`; тест отклоняет пустую причину и исключение для отсутствующей возможности.

- [ ] **Step 2: Запустить тест и увидеть перечень отсутствующих комбинаций**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

Expected: FAIL с симметричной разностью множеств владельцев и дочерних правил.

- [ ] **Step 3: Описать каждую комбинацию владельца и дочернего правила**

Для inline-коллекций файл дочерней операции совпадает со `Свойства.yaml` владельца и содержит прежние данные плюс одну именованную запись. Для внешних дочерних элементов декларация содержит отдельные файлы по правилам resource topology. Обязательно покрыть реквизиты, табличные части, реквизиты табличных частей, измерения, ресурсы, реквизиты регистров, адресацию задач, колонки журнала, команды, вложенные подсистемы, предопределённые элементы, HTTP URL/методы, Web-service операции/параметры, каналы интеграции и дочерние элементы внешнего источника данных, если они обнаружены правилами.

Каждая табличная часть получает отдельную следующую операцию добавления своего реквизита; каждый Web-service operation — отдельную следующую операцию параметра. Эти вложенные декларации ссылаются через `ownerKey` на ключ непосредственного родителя.

- [ ] **Step 4: Добавить одну минимальную форму на владельца**

Изменения формы задавать декларативно:

```ts
{
  key: "form:catalog",
  ownerKey: "object:catalog",
  changes: [{
    path: "Справочник/ПроверкаЧастичнойСинхронизацииСправочник/Формы/ПроверочнаяФорма/Форма.yaml",
    before: null,
    after: "ИспользоватьСтандартныеКоманды: Истина\n",
  }],
}
```

Если конкретный владелец требует тип формы или основной реквизит, значение указывается в его собственной декларации; общая фабрика не содержит условий по `itemType`.

- [ ] **Step 5: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/matrix e2e/partial-sync/matrix.test.ts
git commit -m "test: :white_check_mark: описать дочерние объекты и формы"
```

---

### Task 4: Состояние версии 2 и безопасный сброс

**Files:**
- Modify: `e2e/partial-sync/workspace.ts`
- Modify: `e2e/partial-sync/workspace.test.ts`
- Modify: `e2e/partial-sync/run.ts`
- Modify: `e2e/partial-sync/run.test.ts`

**Interfaces:**
- Produces: `ScenarioState { version: 2; scenario: "partial-sync-matrix"; completedOperation: string | null; checkpoint: "checkpoints/current" | null; planHash: string }`.
- Produces: `openScenarioWorkspace(root, { planHash, reset }): Promise<ScenarioWorkspace>`.
- Produces: `PartialSyncArgs { root: string; reset: boolean }`.

- [ ] **Step 1: Написать падающие тесты версии, хэша и `--reset`**

Проверить: новая пустая рабочая область получает version 2; старое состояние и другой `planHash` отклоняются без изменений; `--reset` разбирается один раз; сброс удаляет только `base`, `data`, `project`, `checkpoints`, `verification` и `state.json`, но оставляет `logs`; чужой непустой каталог и symlink по-прежнему отклоняются.

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/run.test.ts`

Expected: FAIL на версии состояния и неизвестном `--reset`.

- [ ] **Step 3: Реализовать новое состояние и передачу параметров**

`runPartialSyncCli` передаёт `NKDK_PARTIAL_SYNC_RESET=1` только при сбросе. Хэш вычисляет внешний тест из той же матрицы и передаёт прямо в `openScenarioWorkspace`. Функция сначала проверяет корень и все управляемые пути, затем при `reset: true` очищает только разрешённый список. Старое корректно распознанное состояние можно сбросить; неизвестный JSON нельзя считать разрешением на удаление.

- [ ] **Step 4: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/run.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/workspace.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/run.ts e2e/partial-sync/run.test.ts
git commit -m "feat: :sparkles: добавить состояние матричного сценария"
```

---

### Task 5: Атомарная заменяемая контрольная копия

**Files:**
- Modify: `e2e/partial-sync/checkpoints.ts`
- Modify: `e2e/partial-sync/checkpoints.test.ts`

**Interfaces:**
- Produces: `publishCheckpoint(workspace, { completedOperation, planHash }): Promise<ScenarioState>`.
- Preserves: `restoreCheckpoint(workspace, state): Promise<void>`.

- [ ] **Step 1: Заменить старые ожидания падающими тестами `current`**

Проверить первую публикацию, замену существующей копии, восстановление последней версии, сохранение прежней `current` при ошибке копирования, проверки manifest, переименования и записи state. Отдельный тест оставляет согласованную `.previous` как имитацию аварийного завершения между переключением каталога и записью состояния; следующее открытие должно вернуть её в `current`. После двух обычных успехов в `checkpoints` должен оставаться только каталог `current`.

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/checkpoints.test.ts`

Expected: FAIL, текущая реализация создаёт каталог на каждый stage.

- [ ] **Step 3: Реализовать двухфазную замену**

Использовать имена `.current-<operationId>.tmp` и `.current-<operationId>.previous`. Проверить временную копию до переключения. Если `writeScenarioState` падает после переключения, удалить новую `current`, вернуть `previous`, затем пробросить исходную ошибку. `restoreCheckpoint` перед обычным восстановлением возвращает согласованную `.previous`, если manifest `current` опережает `state.json`; неизвестные служебные каталоги не удаляются автоматически. Manifest хранит `completedOperation` и `planHash`; восстановление сверяет их с состоянием.

- [ ] **Step 4: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/checkpoints.test.ts e2e/partial-sync/workspace.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/checkpoints.ts e2e/partial-sync/checkpoints.test.ts
git commit -m "feat: :sparkles: заменять единственную контрольную копию"
```

---

### Task 6: Универсальное применение файловой операции

**Files:**
- Create: `e2e/partial-sync/operation.ts`
- Create: `e2e/partial-sync/operation.test.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: `applyScenarioOperation(projectDir, operation): Promise<readonly string[]>`.

- [ ] **Step 1: Написать падающие проверки четырёх видов операций**

Проверить создание нескольких файлов, замену существующего `Свойства.yaml`, восстановление его прежнего содержимого обратной операцией, удаление созданного файла, очистку опустевших каталогов до `cf`, отказ от абсолютного пути/`..`/symlink и возврат отсортированного списка изменённых путей. Отдельно проверить отказ, когда фактическое содержимое не равно `before`.

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/operation.test.ts`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 3: Реализовать исполнитель без знаний о типах метаданных**

Сначала проверить все пути и побайтовое совпадение каждого фактического файла с `change.before`, где `null` означает отсутствие. Затем для `after !== null` атомарно писать через соседний `.tmp` и `rename`, а для `after === null` удалять точный файл. После удаления поднимать очистку пустых каталогов, но остановиться на `cf`. При любой ошибке вернуть уже изменённые файлы к `before`.

- [ ] **Step 4: Добавить проверку обратимости всех деклараций**

В `matrix.test.ts` применить весь блок создания к временному клону NKDK-фикстуры, затем весь блок удаления и сравнить дерево с исходным клоном. Смысловую валидацию каждого промежуточного состояния выполняет публичный MCP в реальном сценарии.

- [ ] **Step 5: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/operation.test.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/operation.ts e2e/partial-sync/operation.test.ts e2e/partial-sync/matrix.test.ts
git commit -m "feat: :sparkles: применять операции матричного сценария"
```

---

### Task 7: Универсальная MCP-проверка одного этапа

**Files:**
- Modify: `e2e/partial-sync/steps.ts`
- Modify: `e2e/partial-sync/steps.test.ts`

**Interfaces:**
- Produces: `prepareBaseline(): Promise<void>`.
- Produces: `executeOperation(operation, progress): Promise<void>`.
- Consumes: `applyScenarioOperation` and public MCP tools.

- [ ] **Step 1: Переписать тесты на новый договор и подтвердить RED**

Проверить, что baseline импортирует и сравнивает только `cf`; одна операция вызывает validation, два sync со статусами `synchronized`/`unchanged`, закрытие рабочей связи, один контрольный import `cf`, одно сравнение и лог прогресса. Ошибка должна включать `operation.key`, изменённые пути и `attemptLogDir`.

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts`

Expected: FAIL, API всё ещё содержит `baseline/catalog/attribute` и два компонента.

- [ ] **Step 2: Выделить общий исполнитель шага**

`executeOperation` сначала применяет файловую операцию, затем открывает MCP-сеанс. Проверочный проект всегда очищается и получает `.nkdk/project.yaml`. Удалить `extensionName`, `extensionNkdkDir`, `expectOnlyExtension` и цикл `componentPaths`; во всех import-вызовах явно использовать `componentPath: "cf"`.

- [ ] **Step 3: Добавить измерение времени и структурированную ошибку**

Зависимость `now(): number` позволяет тестировать длительность. Строка успеха имеет вид `[38/214] child:catalog:attribute — 12.34s`. При ошибке оборачивать её через `new Error(message, { cause })`, не теряя исходную причину.

- [ ] **Step 4: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/operation.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/steps.ts e2e/partial-sync/steps.test.ts
git commit -m "test: :white_check_mark: выполнять один матричный этап через MCP"
```

---

### Task 8: Возобновляемая координация полного плана

**Files:**
- Modify: `e2e/partial-sync/scenario.ts`
- Modify: `e2e/partial-sync/scenario.test.ts`
- Modify: `e2e/partial-sync/partial-sync.external.test.ts`

**Interfaces:**
- Produces: `runPartialSyncScenario({ workspace, plan, planHash, steps }): Promise<void>`.

- [ ] **Step 1: Написать падающие тесты продолжения по ключу**

Проверить: пустое состояние готовит baseline и публикует `completedOperation: null`; состояние после третьей операции восстанавливается и начинает с четвёртой; последняя операция ничего не запускает; неизвестный ключ и другой plan hash отклоняются; сбой операции не публикует checkpoint, а повторный запуск повторяет именно её.

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/scenario.test.ts`

Expected: FAIL, координатор ожидает фиксированные три stage.

- [ ] **Step 3: Реализовать координацию и подключить внешний тест**

Координатор ищет `completedOperation` через `findIndex`, восстанавливает `current`, выполняет `plan.slice(index + 1)` и публикует checkpoint только после `executeOperation`. Внешний тест вычисляет `plan` и `planHash` из `partialSyncMatrix`, передаёт `reset` из `NKDK_PARTIAL_SYNC_RESET === "1"` при открытии workspace и запускает координатор.

- [ ] **Step 4: Получить GREEN и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/scenario.test.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/run.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/scenario.ts e2e/partial-sync/scenario.test.ts e2e/partial-sync/partial-sync.external.test.ts
git commit -m "test: :white_check_mark: выполнить полный матричный сценарий"
```

---

### Task 9: Полная проверка и первый реальный прогон

**Files:**
- Modify only if a correctly failing test identifies a defect in the scenario or partial-sync production path.

**Interfaces:**
- Verifies all contracts from Tasks 1–8.

- [ ] **Step 1: Выполнить быстрые проверки сценария**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts 'e2e/partial-sync/**/*.test.ts'
pnpm type-check
```

Expected: PASS.

- [ ] **Step 2: Выполнить обязательные проверки репозитория**

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 39310b80d
```

Expected: PASS без изменения baseline архитектуры.

- [ ] **Step 3: Запустить новую матрицу с явным сбросом**

Run: `pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test' --reset`

Expected: baseline, все операции создания, дочерние элементы, формы и обратные удаления завершаются; `state.json.completedOperation` равен ключу последней операции; `checkpoints` содержит только `current`.

- [ ] **Step 4: Подтвердить завершённое состояние и возможность повторного запуска**

Снова запустить без сброса:

Run: `pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test'`

Expected: сценарий восстанавливает последнюю контрольную копию, не выполняет уже завершённые операции и успешно завершается; `project/cf` после удаления совпадает с исходным baseline. Если первый реальный прогон обнаруживает дефект, Task 9 остаётся незавершённой до отдельного цикла systematic-debugging → падающий тест → минимальное исправление → повтор этой команды.

- [ ] **Step 5: Проверить чистоту и итоговые коммиты**

```bash
git status --short
git log --oneline --decorate -12
```

Expected: worktree чистый; каждый законченный слой имеет отдельный коммит.
