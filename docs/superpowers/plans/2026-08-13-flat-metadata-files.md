# Flat Metadata Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Хранить десять строго однофайловых видов метаданных как `Вид/Имя.yaml` без каталога объекта и без поддержки прежнего пути.

**Architecture:** `RegisteredProjectSpec` явно объявляет `projectLayout: "flatFile"`; общий адаптер правил превращает этот договор в шаблон назначения топологии. Импорт, проверка, индексы и синхронизация продолжают работать только через скомпилированную топологию, а адаптер запрещает плоский режим для правил с дополнительными проектными ресурсами.

**Tech Stack:** TypeScript 7, Vitest, pnpm workspace, декларативная metadata resource topology.

## Global Constraints

- Плоский режим применяется только к `ГруппаКоманд`, `Нумератор`, `ОбщийРеквизит`, `ОпределяемыйТип`, `ПараметрСеанса`, `ПараметрФункциональныхОпций`, `ПодпискаНаСобытие`, `ФункциональнаяОпция`, `ЭлементСтиля`, `Язык`.
- `Константа` и все остальные виды сохраняют `Вид/Имя/Свойства.yaml`.
- Старый путь для десяти видов не распознаётся, не мигрируется и не удаляется автоматически.
- XML-пути и существующие XML-фикстуры не изменяются.
- Общие операции не получают условий по `itemType` или именам каталогов; единственный источник путей — скомпилированная топология.
- Новые правила fromXML/toXML/fromYAML/toYAML и новые поля общих типов правил свойств не добавляются.
- Размещение по умолчанию остаётся каталогом объекта, поэтому существующие регистрации не требуют массового изменения.
- После каждого законченного слоя выполнить `pnpm duplicates -- --base origin/develop`.

---

### Task 1: Явный договор размещения и защита плоского режима

**Files:**
- Modify: `packages/runtime/metadata/projectDefinition/projectSpecContracts.ts`
- Modify: `packages/rules/metadata/resourceTopology/adapters/ruleTopology.ts`
- Create: `packages/rules/metadata/resourceTopology/adapters/ruleTopology.test.ts`

**Interfaces:**
- Consumes: существующие `RegisteredProjectSpec`, `MetadataResourceDeclaration`, `collectSpecAssignment` и `compileMetadataResourceTopologyForProjectSpecs`.
- Produces: `ProjectFileLayout = "objectDirectory" | "flatFile"`, необязательное `RegisteredProjectSpec.projectLayout?: ProjectFileLayout`, а также поведение `describeProjectSpecResourceTopology(spec)` для обоих размещений.

- [ ] **Step 1: Написать падающий тест шаблонов назначения**

Создать `ruleTopology.test.ts` с минимальным правилом и заглушкой `exportSchema`. Проверить два случая через `describeProjectSpecResourceTopology`:

```ts
const rule = {
  itemType: "TestItem",
  itemTypePrefix: "Тест",
  xmlDir: "TestItems",
  properties: {},
} as MetadataItemRule

it.each([
  [undefined, "Тест/{ownerName}/Свойства.yaml"],
  ["flatFile", "Тест/{ownerName}.yaml"],
] as const)("строит назначение для projectLayout=%s", (projectLayout, projectPattern) => {
  const declarations = describeProjectSpecResourceTopology(projectSpec(projectLayout))
  expect(declarations).toEqual(expect.arrayContaining([
    expect.objectContaining({ kind: "content", projectPattern, role: "properties" }),
    expect.objectContaining({
      kind: "xmlDocument",
      assignmentProjectPattern: projectPattern,
      xmlPattern: "TestItems/{ownerName}.xml",
    }),
  ]))
})
```

- [ ] **Step 2: Написать падающие тесты ограничений**

В том же файле передать `projectLayout: "flatFile"` и по очереди породить дополнительный `content`, `yamlCompanion` и `externalFile` через `spec.resources`. Каждый случай должен завершаться ошибкой:

```ts
expect(() => describeProjectSpecResourceTopology(spec)).toThrow(
  "Плоское размещение Тест не допускает дополнительные проектные ресурсы"
)
```

Добавить положительный случай с дополнительным `xmlDocument`, подтверждающий, что XML-ресурс не нарушает однофайловый проектный договор.

- [ ] **Step 3: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/resourceTopology/adapters/ruleTopology.test.ts
```

Expected: FAIL — `projectLayout` отсутствует в типе и плоский шаблон ещё не строится.

- [ ] **Step 4: Добавить тип договора**

В `projectSpecContracts.ts` определить и экспортировать:

```ts
export type ProjectFileLayout = "objectDirectory" | "flatFile"
```

и добавить в `RegisteredProjectSpec`:

```ts
projectLayout?: ProjectFileLayout
```

- [ ] **Step 5: Реализовать выбор шаблона и проверку ограничений**

В `describeProjectSpecResourceTopology` для некорневого объекта вычислить:

```ts
const projectBase = spec.projectLayout === "flatFile"
  ? spec.dir
  : `${spec.dir}/{ownerName}`
const assignmentProjectPattern = spec.projectLayout === "flatFile"
  ? `${spec.dir}/{ownerName}.yaml`
  : `${projectBase}/Свойства.yaml`
```

Передать готовый `assignmentProjectPattern` в `collectSpecAssignment`, не меняя XML-базу. После добавления `spec.resources` проверить декларации плоского вида: разрешить ровно один корневой `content` и любые `xmlDocument`/`ignore`, но отклонить второй `content`, `yamlCompanion` и `externalFile`. Сообщение ошибки должно содержать `spec.dir`.

- [ ] **Step 6: Запустить узкий тест и type-check затронутых пакетов**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/resourceTopology/adapters/ruleTopology.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: PASS.

- [ ] **Step 7: Проверить новые дубли**

Run:

```bash
pnpm duplicates -- --base origin/develop
```

Expected: exit 0, новых дублей нет.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/runtime/metadata/projectDefinition/projectSpecContracts.ts packages/rules/metadata/resourceTopology/adapters/ruleTopology.ts packages/rules/metadata/resourceTopology/adapters/ruleTopology.test.ts
git commit -m "feat!: :sparkles: добавить плоское размещение metadata-файлов" -m "Однофайловые ProjectSpec получают явный договор размещения. Компиляция отклоняет плоский вид, если он порождает дополнительные проектные ресурсы.

BREAKING CHANGE: ProjectSpec с projectLayout=flatFile использует путь Вид/Имя.yaml вместо Вид/Имя/Свойства.yaml."
```

### Task 2: Зарегистрировать десять однофайловых видов

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/projectRules.ts`
- Modify: `packages/rules/metadata/resourceTopology/adapters/registeredRules.test.ts`
- Modify: `packages/rules/metadata/resourceTopology/contracts.test.ts`

**Interfaces:**
- Consumes: `RegisteredProjectSpec.projectLayout` из Task 1 и динамическое создание ProjectSpec в `defineAppliedObjectProjectRules`.
- Produces: зарегистрированные назначения `Вид/{ownerName}.yaml` для десяти согласованных `itemType` и отсутствие прежних назначений.

- [ ] **Step 1: Добавить падающий табличный тест зарегистрированных путей**

В `registeredRules.test.ts` добавить таблицу пар каталога и `itemType`:

```ts
const flatProjectSpecs = [
  ["ГруппаКоманд", "MetadataCommandGroup"],
  ["Нумератор", "MetadataDocumentNumerator"],
  ["ОбщийРеквизит", "MetadataCommonAttribute"],
  ["ОпределяемыйТип", "MetadataDefinedType"],
  ["ПараметрСеанса", "MetadataSessionParameter"],
  ["ПараметрФункциональныхОпций", "MetadataFunctionalOptionsParameter"],
  ["ПодпискаНаСобытие", "MetadataEventSubscription"],
  ["ФункциональнаяОпция", "MetadataFunctionalOption"],
  ["ЭлементСтиля", "MetadataStyleItem"],
  ["Язык", "MetadataLanguage"],
] as const
```

Для каждой строки проверить наличие `Вид/{ownerName}.yaml`, правильный `itemRule.itemType`, XML `xmlDir/{ownerName}.xml` и отсутствие `Вид/{ownerName}/Свойства.yaml`.

- [ ] **Step 2: Добавить падающий тест классификации без совместимости**

В `contracts.test.ts` добавить:

```ts
expect(classifyMetadataProjectPath(topology, "Нумератор/НумераторЗаказов.yaml")).toMatchObject({
  kind: "content",
  role: "properties",
  values: { ownerName: "НумераторЗаказов" },
})
expect(classifyMetadataProjectPath(topology, "Нумератор/НумераторЗаказов/Свойства.yaml")).toBeUndefined()
```

- [ ] **Step 3: Запустить тесты и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/resourceTopology/adapters/registeredRules.test.ts metadata/resourceTopology/contracts.test.ts
```

Expected: FAIL — реестр ещё создаёт каталоги объектов.

- [ ] **Step 4: Явно зарегистрировать список видов**

В `projectRules.ts` объявить локальный неизменяемый набор `itemType`:

```ts
const flatFileItemTypes = new Set([
  "MetadataCommandGroup",
  "MetadataDocumentNumerator",
  "MetadataCommonAttribute",
  "MetadataDefinedType",
  "MetadataSessionParameter",
  "MetadataFunctionalOptionsParameter",
  "MetadataEventSubscription",
  "MetadataFunctionalOption",
  "MetadataStyleItem",
  "MetadataLanguage",
])
```

При создании динамического `ProjectSpec` добавить только для элементов набора:

```ts
...(flatFileItemTypes.has(rule.itemType) ? { projectLayout: "flatFile" as const } : {})
```

Не добавлять проверок списка в общие модули топологии.

- [ ] **Step 5: Запустить тесты реестра**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/resourceTopology/adapters/registeredRules.test.ts metadata/resourceTopology/contracts.test.ts
```

Expected: PASS.

- [ ] **Step 6: Проверить новые дубли**

Run:

```bash
pnpm duplicates -- --base origin/develop
```

Expected: exit 0, новых дублей нет.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/rules/metadata/appliedObjects/projectRules.ts packages/rules/metadata/resourceTopology/adapters/registeredRules.test.ts packages/rules/metadata/resourceTopology/contracts.test.ts
git commit -m "feat!: :sparkles: разместить однофайловые объекты без каталогов" -m "Десять явно перечисленных видов используют путь Вид/Имя.yaml. Старый путь Вид/Имя/Свойства.yaml больше не входит в зарегистрированную топологию.

BREAKING CHANGE: YAML-файлы десяти однофайловых видов нужно перенести из Вид/Имя/Свойства.yaml в Вид/Имя.yaml."
```

### Task 3: Перевести сквозные договоры и тестовые данные на плоские пути

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/writeAssignment.integration.test.ts`
- Modify: тесты под `packages/rules/metadata/validation/`, `packages/rules/metadata/importFromXml/`, `packages/rules/metadata/project/` и `packages/rules/metadata/appliedObjects/configurationExtension/`, найденные точным поиском старых путей десяти видов.
- Move: существующие YAML-файлы `packages/rules/metadata/appliedObjects/*/__fixtures__/sync/yaml/<Имя>/Свойства.yaml` соответствующих однофайловых видов в `packages/rules/metadata/appliedObjects/*/__fixtures__/sync/yaml/<Имя>.yaml`.

**Interfaces:**
- Consumes: новые зарегистрированные назначения из Task 2 и существующие `syncConfigurationFromXMLForTest`, `fullXmlSyncTestTopologyFields`, `prepareYamlFiles`, `prepareFullXmlSyncAssignment`, `writeFullXmlSyncAssignment`.
- Produces: сквозное подтверждение XML → `Нумератор/Имя.yaml` → XML и согласованные тестовые пути во всех потребителях.

- [ ] **Step 1: Обновить проверку XML → YAML**

В `configuration/convertFromXML.test.ts` заменить проверку нумератора на:

```ts
hasNumerator: fs.existsSync(join(outputDir, "Нумератор", "НумераторПоУмолчанию.yaml")),
```

и добавить отрицательную проверку отсутствия старого `Нумератор/НумераторПоУмолчанию/Свойства.yaml` в существующий тест основного импорта.

- [ ] **Step 2: Добавить сквозной тест YAML → XML для нумератора**

В `writeAssignment.integration.test.ts` создать временный файл
`Нумератор/НумераторЗаказов.yaml`, подготовить его с ролью `properties`,
`itemType: "MetadataDocumentNumerator"`, владельцем
`{ dir: "Нумератор", name: "НумераторЗаказов" }` и назначением из
`fullXmlSyncTestTopologyFields(sourceProjectPath)`. Проверить:

```ts
expect(result.diagnostics).toEqual([])
expect(result.writtenFiles).toEqual([
  expect.objectContaining({ targetXmlPath: "DocumentNumerators/НумераторЗаказов.xml" }),
])
expect(fs.readFileSync(
  join(outputDir, "DocumentNumerators", "НумераторЗаказов.xml"),
  "utf-8",
)).toContain("<Name>НумераторЗаказов</Name>")
```

- [ ] **Step 3: Запустить два сквозных теста и зафиксировать текущее падение зависимых ожиданий**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/fullSyncToXml/writeAssignment.integration.test.ts
```

Expected: новый путь проходит через топологию; старые ожидания или тестовые данные, если остались, дают точный список для перевода.

- [ ] **Step 4: Переместить YAML-фикстуры без изменения содержимого**

Использовать rename-патч для имеющихся sync-фикстур следующих групп: `metadataCommandGroup`, `metadataCommonAttribute`, `metadataDefinedType`, `metadataDocumentNumerator`, `metadataEventSubscription`, `metadataFunctionalOption`, `metadataFunctionalOptionsParameter`, `metadataSessionParameter`, `metadataStyleItem`. Проверить неизменность содержимого через `git diff --summary` и отсутствие содержательных строк diff для переименований.

- [ ] **Step 5: Перевести только относящиеся к десяти видам старые пути**

Найти остатки:

```bash
rg -n '(ГруппаКоманд|Нумератор|ОбщийРеквизит|ОпределяемыйТип|ПараметрСеанса|ПараметрФункциональныхОпций|ПодпискаНаСобытие|ФункциональнаяОпция|ЭлементСтиля|Язык)/[^/]+/Свойства\.yaml' packages --glob '*.ts' --glob '*.yaml'
```

Для каждого результата, описывающего верхнеуровневый объект проекта, заменить путь на `Вид/Имя.yaml`. Не менять ссылки на XML, вложенные объекты других видов и строки, которые специально проверяют отсутствие поддержки старого пути.

- [ ] **Step 6: Запустить затронутые наборы тестов**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/resourceTopology metadata/validation metadata/importFromXml metadata/project metadata/appliedObjects/configurationExtension
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/fullSyncToXml/writeAssignment.integration.test.ts
```

Expected: PASS.

- [ ] **Step 7: Проверить отсутствие случайной совместимости и изменения XML-фикстур**

Run:

```bash
git diff --name-only origin/develop...HEAD -- 'packages/**/*.xml'
rg -n '(ГруппаКоманд|Нумератор|ОбщийРеквизит|ОпределяемыйТип|ПараметрСеанса|ПараметрФункциональныхОпций|ПодпискаНаСобытие|ФункциональнаяОпция|ЭлементСтиля|Язык)/[^/]+/Свойства\.yaml' packages --glob '*.ts' --glob '*.yaml'
```

Expected: XML-файлов в diff нет; единственное допустимое старое вхождение — отрицательная проверка классификатора.

- [ ] **Step 8: Выполнить полную проверку**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base origin/develop
```

Expected: все команды завершаются с exit 0.

- [ ] **Step 9: Зафиксировать сквозные договоры и тестовые данные**

```bash
git add packages/rules
git commit -m "test: :white_check_mark: перевести проверки на плоские metadata-файлы"
```

- [ ] **Step 10: Проверить чистоту ветки и историю**

Run:

```bash
git status --short --branch
git log --oneline origin/develop..HEAD
```

Expected: рабочее дерево чистое; история содержит спецификацию, план и законченные слои реализации.
