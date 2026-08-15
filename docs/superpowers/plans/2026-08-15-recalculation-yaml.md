# Semantic YAML for Calculation Register Recalculations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Заменить копирование XML перерасчётов смысловым YAML, добавить узкие правила измерений и проверку полноты связей ведущих регистров с сохранением XML round-trip и поведения расширений.

**Architecture:** Перерасчёт становится обычным файловым дочерним объектом `MetadataCalculationRegister`: общая rule-topology читает и пишет `Recalculations/<Имя>.xml`, а его свойства и измерения преобразуются декларативными rules.ts. Ссылки выражаются существующим `metadataTarget`; предметная проверка полноты живёт рядом с перерасчётом как `dependentItems`-вклад и не добавляет частных условий в нейтральные runtime-слои.

**Tech Stack:** TypeScript, Vitest, typebox, существующие metadata rule-kit/resourceTopology/validation, pnpm, e2e XML/YAML fixtures, round-trip-yaml.

## Global Constraints

- Работать только в `/Users/nikita/git/nkdk/.worktrees/recalculation-yaml` на ветке `codex/recalculation-yaml`.
- Не переписывать XML-фикстуры вручную: актуальная выгрузка пользователя — источник истины. Не включать массовую смену CRLF/LF и посторонние изменения выгрузки.
- Не вводить `!xml`, новые поля общих типов правил или частные проверки в `ruleRuntime`, `validation`, `projectState` и `resourceTopology/core`.
- Не сравнивать типы `ИзмерениеРегистра` и `ДанныеВедущихРегистров`.
- Не вычислять ведущие регистры через планы видов расчёта: проверяется только прямоугольность явно указанных связей.
- После каждого завершённого слоя выполнять `pnpm duplicates -- --base origin/develop`.
- Перед каждым коммитом просматривать `git diff --check`, `git status --short` и добавлять в индекс только файлы текущей задачи.

---

## Task 1: Зафиксировать узкий договор измерения перерасчёта

**Files:**

- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/rules.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/types.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/register.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/fromXMLToYAML.integration.test.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/composition/staticFactoryRules.ts`

- [x] **Step 1: Написать падающий тест XML → YAML**

  Взять два `Dimension` из пользовательской фикстуры и ожидать только узкие поля:

  ```ts
  expect(yaml).toEqual({
    Синоним: "Синоним",
    Комментарий: "Комментарий",
    ИзмерениеРегистра: "ИзмерениеВсеСвойства",
    ДанныеВедущихРегистров: [
      "ИзмерениеВсеСвойства",
      "РегистрРасчета.РегистрРасчетаВедущий.Измерение.ИзмерениеПараметрыВыбора",
    ],
  })
  ```

  Передать owner-контекст `CalculationRegister.РегистрРасчетаВсеСвойства`; отдельным случаем проверить, что внешнее поле вида `Attribute` сохраняется полной русской ссылкой.

- [x] **Step 2: Убедиться, что тест падает**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/fromXMLToYAML.integration.test.ts`

  Expected: FAIL — правила и тип коллекции ещё не зарегистрированы.

- [x] **Step 3: Описать узкое правило**

  Создать `MetadataCalculationRegisterRecalculationDimensionRules` с `itemType: "MetadataCalculationRegisterRecalculationDimension"`, `metadataTargetOwner: { kind: "inherit" }`, `uuid`, `name`, `synonym`, `comment`, `objectBelonging`, `extendedConfigurationObject` и двумя ссылочными свойствами:

  ```ts
  registerDimension: metadataItemLinkRule({
    yaml: "ИзмерениеРегистра",
    xml: "RegisterDimension",
    xmlParents: ["Properties"],
    required: true,
    metadataTarget: {
      kind: "member",
      owner: "this",
      roots: ["CalculationRegister"],
      memberKinds: ["Dimension"],
    },
  })

  leadingRegisterData: metadataItemLinksRule({
    yaml: "ДанныеВедущихРегистров",
    xml: "LeadingRegisterData",
    xmlParents: ["Properties"],
    defaultValueXMLRaw: "",
    metadataTarget: {
      kind: "member",
      owner: "this",
      roots: ["CalculationRegister"],
      memberKinds: ["Dimension"],
      allowedMemberPaths: [
        ["CalculationRegister", "Dimension"],
        ["CalculationRegister", "Attribute"],
      ],
    },
  })
  ```

  Такой договор даёт короткое имя измерения текущего регистра и допускает полные ссылки на измерения/реквизиты любого регистра расчёта. Реквизит текущего регистра остаётся полной ссылкой, потому что без вида поля короткое имя неоднозначно.

- [x] **Step 4: Зарегистрировать коллекцию декларативно**

  В `dimension/register.ts` вызвать `defineMetadataItemCollectionRule`:

  ```ts
  export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
    propertyType: "MetadataCalculationRegisterRecalculationDimensions",
    itemRule: MetadataCalculationRegisterRecalculationDimensionRules,
    xmlElement: "Dimension",
    keyField: "name",
    collectionItemRule: true,
  })
  ```

  Добавить этот слой в `staticFactoryRules.ts`, не создавая ручных fromXML/toXML/fromYAML/toYAML-преобразователей.

- [x] **Step 5: Написать и провести тест YAML → XML**

  Ожидать `RegisterDimension` и `LeadingRegisterData/xr:Item` с `xsi:type="xr:MDObjectRef"` и каноническими значениями `CalculationRegister.<Имя>.<Dimension|Attribute>.<Поле>`.

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/fromXMLToYAML.integration.test.ts metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension/fromYAMLToXML.integration.test.ts`

  Expected: PASS.

- [x] **Step 6: Проверить ограничения схемы**

  Добавить случаи, отклоняющие локальный реквизит в `ИзмерениеРегистра`, измерение чужого объекта, ресурс регистра расчёта и поле объекта другого вида. Подтвердить, что внешние `Dimension` и `Attribute` принимаются.

- [x] **Step 7: Проверить дублирование и закоммитить слой**

  Run: `pnpm duplicates -- --base origin/develop`

  Commit: `feat: :sparkles: добавить измерения перерасчёта`

---

## Task 2: Сделать перерасчёт смысловым файловым дочерним объектом

**Files:**

- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/types.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/register.ts`
- Delete: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/builders.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/fromXMLToYAML.integration.test.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/rules.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts`

- [x] **Step 1: Расширить падающий тест перерасчёта**

  Импортировать XML-контейнер `MetaDataObject/Recalculation` из фикстуры и ожидать:

  ```ts
  {
    Синоним: { ru: "Синоним" },
    Комментарий: "Комментарий",
    РежимУправленияБлокировкойДанных: "Автоматический",
    Измерения: { /* два узких измерения */ },
  }
  ```

  Отдельно проверить отсутствие `Использование`.

- [x] **Step 2: Убедиться, что тест падает**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/metadataCalculationRegister/recalculation/fromXMLToYAML.integration.test.ts`

  Expected: FAIL — текущий `RecalculationRules` не имеет XML root и использует обычные измерения регистра.

- [x] **Step 3: Перевести `RecalculationRules` на файловый объект**

  Изменить `itemType` на `MetadataCalculationRegisterRecalculation`, добавить `metadataTargetOwner: { kind: "inherit" }` и корневое правило:

  ```ts
  xmlRoot: xmlRootRule({
    container: "Recalculation",
    rootAttributes: V8_MDCLASSES_ROOT,
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  })
  ```

  Удалить `use`; заменить `dimensions` на `MetadataCalculationRegisterRecalculationDimensions`; для модуля задать локальные пути:

  ```ts
  recordSetModule: moduleRule({
    nkdkPath: "МодульНабораЗаписей.bsl",
    xmlPath: "Ext/RecordSetModule.bsl",
    toXML: false,
    fromXML: false,
  })
  ```

- [x] **Step 4: Заменить родительское свойство и child collection**

  В `MetadataCalculationRegisterRules.properties.recalculations` использовать:

  ```ts
  childFileItemNamesRule({
    yaml: "Перерасчеты",
    xml: "Recalculation",
    xmlParents: ["ChildObjects"],
    folderName: "Перерасчеты",
    forReferenceOnly: true,
  })
  ```

  В `childCollections` задать:

  ```ts
  {
    propertyKey: "recalculations",
    configurationIndexUidSegment: "Перерасчёт",
    itemRule: RecalculationRules,
    fileItemRule: RecalculationRules,
    nkdkDir: ({ name }) => `Перерасчеты/${name}`,
    xmlDir: ({ name }) => `Recalculations/${name}`,
  }
  ```

  Это автоматически создаёт `РегистрРасчета/{owner}/Перерасчеты/{child}/Свойства.yaml` ↔ `CalculationRegisters/{owner}/Recalculations/{child}.xml`.

- [x] **Step 5: Удалить старый транспорт XML**

  Удалить `builders.ts`; в `register.ts` удалить `Recalculations` import/schema/yamlToXML/syncExternal handlers. Оставить файл только если он содержит новый предметный metadata-rule слой; иначе удалить и убрать пять старых импортов из `staticPropertyRules.ts`.

- [x] **Step 6: Провести прямые и схемные тесты**

  Добавить YAML → XML проверку всего перерасчёта, включая порядок `ObjectBelonging`, `Name`, `Synonym`, `Comment`, `DataLockControlMode`, `ExtendedConfigurationObject`, затем `ChildObjects/Dimension`. Переделать schema-тест на схему `RecalculationRules`, а не старого свойства `Recalculations`.

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/metadataCalculationRegister/recalculation`

  Expected: PASS.

- [x] **Step 7: Проверить дублирование и закоммитить слой**

  Run: `pnpm duplicates -- --base origin/develop`

  Commit: `feat: :sparkles: включить перерасчёты в основной YAML`

---

## Task 3: Подтвердить topology и внешние модули

**Files:**

- Modify: `packages/rules/metadata/resourceTopology/adapters/ruleTopology.test.ts`
- Modify: `packages/rules/metadata/resourceTopology/adapters/registeredRules.test.ts`
- Modify: `packages/rules/metadata/commonObjects/resourceTopology.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/topology.integration.test.ts`

- [x] **Step 1: Написать падающий topology-тест**

  Для `MetadataCalculationRegisterRules` ожидать назначения:

  ```text
  РегистрРасчета/{owner}/Перерасчеты/{child}/Свойства.yaml
    -> CalculationRegisters/{owner}/Recalculations/{child}.xml
  РегистрРасчета/{owner}/Перерасчеты/{child}/МодульНабораЗаписей.bsl
    -> CalculationRegisters/{owner}/Recalculations/{child}/Ext/RecordSetModule.bsl
  ```

  И явно проверить отсутствие проектного `Recalculation.xml`/`Свойства.xml`.

- [x] **Step 2: Убедиться, что тест падает из-за старой декларации**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/metadataCalculationRegister/recalculation/topology.integration.test.ts`

- [x] **Step 3: Удалить специальную декларацию `Recalculations`**

  Из `commonObjects/resourceTopology.ts` удалить `Recalculations` из transfer-capabilities и `metadataPropertyRule006`. Удалить соответствующий импорт из `staticPropertyRules.ts` и устаревшее ожидание из `registeredRules.test.ts`. Общую topology не менять: файловая child collection уже покрывает XML-файл и модуль.

- [x] **Step 4: Провести topology-тесты**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/resourceTopology/adapters/ruleTopology.test.ts metadata/appliedObjects/metadataCalculationRegister/recalculation/topology.integration.test.ts`

  Expected: PASS.

- [x] **Step 5: Проверить дублирование и закоммитить слой**

  Run: `pnpm duplicates -- --base origin/develop`

  Commit: `refactor: :recycle: убрать транспорт XML перерасчётов`

---

## Task 4: Добавить проверку полноты связей ведущих регистров

**Files:**

- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/validation.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/validation.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/register.ts`
- Modify: `packages/rules/metadata/composition/staticFactoryRules.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/dependentItemRegistry.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/projectState/**`

- [x] **Step 1: Написать таблицу падающих и проходящих тестов**

  Вызвать обработчик для каждого измерения одного `rootYaml` и проверить:

  - два регистра представлены в обоих измерениях — ошибок нет;
  - разные типы полей между строками — ошибок нет;
  - ведущий регистр есть только в первом измерении — одна ошибка на втором;
  - регистр отсутствует во всех измерениях — ошибок нет;
  - битая полная ссылка — предметной каскадной ошибки нет;
  - пустые связи заимствованного измерения — ошибок нет.

- [x] **Step 2: Убедиться, что тест падает**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/appliedObjects/metadataCalculationRegister/recalculation/validation.test.ts`

  Expected: FAIL — обработчик отсутствует.

- [x] **Step 3: Реализовать чистый анализ прямоугольности**

  В `validation.ts` экспортировать `analyzeRecalculationDimensionLinks: DependentYamlItemHandler`. Алгоритм:

  1. Прочитать `rootYaml.Измерения` как record; при иной форме вернуть пустой анализ — структурная схема сообщит свою ошибку.
  2. Для каждого элемента `ДанныеВедущихРегистров` определить владельца: короткое имя измерения — служебный ключ текущего регистра; полная русская/модельная ссылка — разобрать существующим metadata-target parser с `CalculationRegister/Dimension|Attribute`.
  3. Ссылки, которые parser не разобрал, исключить из предметного анализа: их обработает обычная ссылочная диагностика. Если `params.metadataTargetLookup` передан и возвращает `missing` или `ambiguous`, также не учитывать владельца этой ссылки; unit-тест передаёт lookup явно и подтверждает отсутствие каскадной ошибки.
  4. Построить объединение владельцев по всем измерениям.
  5. При явном `metadataTargetLookup` выдать для текущего измерения по одной диагностике на каждого отсутствующего владельца:

     ```text
     В «ДанныеВедущихРегистров» требуется измерение или реквизит регистра расчёта «<Имя>»: этот регистр указан в других измерениях перерасчёта
     ```

     Диагностику создать через `diagnosticAtYamlPath`, передав `params.filePath`, `params.parsed`, путь `params.itemYamlPath.concat("ДанныеВедущихРегистров")`, severity `error` и source `cross-file`.

  6. В обычной проверке проекта вернуть нейтральную отложенную проверку
     `referenceCoverage`: `candidates` содержат ссылки владельца во всей
     матрице, `coveredBy` — ссылки владельца в текущем измерении. На втором
     проходе требование действует, только если разрешилась хотя бы одна ссылка
     из `candidates`; непустой `coveredBy` подавляет каскадную предметную ошибку,
     оставляя диагностику битой ссылки общему ссылочному валидатору.

- [x] **Step 4: Зарегистрировать предметный вклад**

  В `register.ts` добавить слой:

  ```ts
  export const metadataRuleLayer000 = defineMetadataRules({
    ...emptyMetadataRules,
    dependentItems: {
      MetadataCalculationRegisterRecalculationDimension: {
        yaml: analyzeRecalculationDimensionLinks,
      },
    },
  })
  ```

  Подключить его в `staticFactoryRules.ts`. По согласованию расширить общий
  `DependentProjectCheckCandidate` вариантом `referenceCoverage`, провести его
  через обычный второй проход и бинарный `ProjectState`, не добавляя в
  нейтральные слои условий по типу объекта перерасчёта.

- [x] **Step 5: Провести unit и integration-проверку проекта**

  Добавить интеграционный случай в `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`, который проверяет путь и текст диагностики через обычный `validateProject`.

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/appliedObjects/metadataCalculationRegister/recalculation/validation.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/validation/projectValidationPasses.integration.test.ts`

  Expected: PASS.

- [x] **Step 6: Проверить дублирование и закоммитить слой**

  Run: `pnpm duplicates -- --base origin/develop`

  Commit: `feat: :sparkles: проверять полноту связей перерасчёта`

---

## Task 5: Сохранить семантику расширений

**Files:**

- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/propertyStates.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateRules.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/fromYAMLToXML.integration.test.ts`

- [x] **Step 1: Написать падающие тесты заимствованного перерасчёта**

  По `cfe/all-extension` ожидать, что заимствованный `Recalculation` и его `Dimension` принимаются без `ИзмерениеРегистра` и `ДанныеВедущихРегистров`, а YAML → XML не материализует их. Проверить сохранение `ObjectBelonging=Adopted` и `ExtendedConfigurationObject`.

- [x] **Step 2: Зарегистрировать capabilities**

  Экспортировать две декларации через `definePropertyStateItemCapabilities`:

  ```ts
  definePropertyStateItemCapabilities(RecalculationRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
  })

  definePropertyStateItemCapabilities(MetadataCalculationRegisterRecalculationDimensionRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
  })
  ```

  Подключить их в `configurationExtension/propertyStateRules.ts`. Не делать ссылочные поля обязательными в borrowed schema.

- [x] **Step 3: Провести extension-тесты**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/metadataCalculationRegister/recalculation/fromXMLToYAML.integration.test.ts metadata/appliedObjects/metadataCalculationRegister/recalculation/fromYAMLToXML.integration.test.ts metadata/appliedObjects/configurationExtension/structureValidation.test.ts`

  Expected: PASS.

- [x] **Step 4: Проверить дублирование и закоммитить слой**

  Run: `pnpm duplicates -- --base origin/develop`

  Commit: `feat: :sparkles: поддержать перерасчёты расширений`

---

## Task 6: Обновить ожидаемый e2e YAML из пользовательских XML

**Files:**

- Modify: `e2e/fixtures/nkdk/cf/РегистрРасчета/РегистрРасчетаВсеСвойства/Свойства.yaml`
- Create: `e2e/fixtures/nkdk/cf/РегистрРасчета/РегистрРасчетаВсеСвойства/Перерасчеты/ПерерасчетВсеСвойства/Свойства.yaml`
- Create: `e2e/fixtures/nkdk/cf/РегистрРасчета/РегистрРасчетаВсеСвойства/Перерасчеты/ПерерасчетПоУмолчанию/Свойства.yaml`
- Modify: `e2e/fixtures/nkdk/cfe/Расширение_All/РегистрРасчета/РегистрРасчетаВсеСвойства/Свойства.yaml`
- Modify: `e2e/fixtures/nkdk/cfe/Расширение_All/РегистрРасчета/РегистрРасчетаВсеСвойстваExt/Свойства.yaml`
- Create: `e2e/fixtures/nkdk/cfe/Расширение_All/РегистрРасчета/РегистрРасчетаВсеСвойства/Перерасчеты/ПерерасчетВсеСвойства/Свойства.yaml`
- Create: `e2e/fixtures/nkdk/cfe/Расширение_All/РегистрРасчета/РегистрРасчетаВсеСвойства/Перерасчеты/ПерерасчетПоУмолчанию/Свойства.yaml`
- Create: `e2e/fixtures/nkdk/cfe/Расширение_All/РегистрРасчета/РегистрРасчетаВсеСвойстваExt/Перерасчеты/ПерерасчетВсеСвойства/Свойства.yaml`
- Create: `e2e/fixtures/nkdk/cfe/Расширение_All/РегистрРасчета/РегистрРасчетаВсеСвойстваExt/Перерасчеты/ПерерасчетПоУмолчанию/Свойства.yaml`
- Modify: `e2e/**/*.test.ts` only if an assertion enumerates the old inline/opaque layout
- Modify: `.agents/restrictions.md`

- [x] **Step 1: Снять список только смысловых XML-изменений**

  Использовать `git diff --ignore-space-at-eol --name-only` и отдельно просмотреть `CalculationRegisters`, `ConfigDumpInfo.xml`, `Configuration.xml`. Не восстанавливать и не нормализовать пользовательские файлы; в индекс позднее добавлять только подтверждённые смысловые файлы перерасчёта, ведущего регистра и обязательных манифестов.

- [x] **Step 2: Запустить генерацию ожидаемых NKDK-фикстур**

  Run: `pnpm fixtures:e2e:nkdk`

  Затем проверить, что у родительского регистра нет inline `Перерасчеты`, а каждый перерасчёт имеет отдельный `Свойства.yaml` и сохранённый `МодульНабораЗаписей.bsl`.

- [x] **Step 3: Просмотреть полученный YAML вручную**

  Сверить с утверждённой спецификацией: два измерения, короткие текущие измерения, полные русские ссылки внешнего регистра, отсутствие `Использование` и `Recalculation.xml`.

- [x] **Step 4: Удалить выполненное ограничение**

  Удалить из `.agents/restrictions.md` пункт о непрозрачном копировании `Recalculations/Имя.xml`.

- [x] **Step 5: Провести e2e-тесты**

  Run outside sandbox: `pnpm test:e2e`

  Результат: 24/25 проверок прошли; побайтовое сравнение всей выгрузки
  осталось красным из-за пользовательской смены CRLF/LF. Все шесть XML перерасчётов
  основной конфигурации и расширения совпали после смысловой нормализации.

- [x] **Step 6: Проверить дублирование и закоммитить слой выборочно**

  Run: `pnpm duplicates -- --base origin/develop`

  Перед `git add` ещё раз проверить `git diff --cached --check` и отсутствие чистых CRLF/LF-изменений.

  Commit: `test: :white_check_mark: обновить фикстуры перерасчётов`

---

## Task 7: Провести round-trip и отрицательную валидацию

**Files:**

- Modify: только код/ожидания, для которых проверка обнаружит воспроизводимое расхождение; XML-источник вручную не менять

- [x] **Step 1: Выполнить узкий XML → YAML → XML round-trip**

  Использовать навык `round-trip-yaml` на `e2e/fixtures/xml/cf` и отдельно на `e2e/fixtures/xml/cfe/all-extension`. Проверить single/triage diff для всех путей `CalculationRegisters/{register}/Recalculations/{recalculation}.xml` и соседних каталогов модулей.

  Результат: `cf` прошёл чистый round-trip; расширение подтверждено общим e2e
  с явным `componentPath`, поскольку отдельный сценарий навыка жёстко ожидает `cf`.

- [x] **Step 2: Устранить только смысловые расхождения**

  Допустимы различия служебных идентификаторов, уже нормализуемые проектом. Любое новое `!xml` остановить и согласовать с разработчиком; по текущему плану оно не требуется.

- [x] **Step 3: Проверить отрицательный пример**

  Во временной копии YAML удалить ссылку `РегистрРасчетаВедущий` из одного измерения и убедиться, что `nkdk validate` выдаёт предметную диагностику до запуска 1С. Временный файл не добавлять в репозиторий.

- [x] **Step 4: Проверить дублирование и закоммитить исправления, если они потребовались**

  Run: `pnpm duplicates -- --base origin/develop`

  Commit when needed: `fix: :bug: сохранить round-trip перерасчётов`

---

## Task 8: Полная проверка ветки

**Files:**

- Review: all files changed relative to `origin/develop`

- [x] **Step 1: Проверить типы**

  Run: `pnpm type-check`

  Expected: PASS.

- [x] **Step 2: Выполнить полный набор тестов**

  Run outside sandbox: `pnpm test`

  Expected: PASS. Если duration-check единственный сбой после холодного запуска, повторить один раз вне песочницы и зафиксировать оба результата; функциональные падения исправить.

  Результат после исправления замечания ревью: полный запуск завершился кодом 0.
  В частности, rules прошёл 4439 unit/core-проверок, 41 native LMDB-проверку и
  2752 integration-проверки; MCP прошёл 122 unit и 67 integration-проверок,
  ещё 2 integration-проверки пропущены штатно. Предупреждения о превышении
  целевого времени остались информационными.

- [x] **Step 3: Проверить архитектуру**

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Expected: PASS; baseline dependency-cruiser не перезаписывать.

- [x] **Step 4: Финально проверить дублирование**

  Run: `pnpm duplicates -- --base origin/develop`

  Expected: PASS.

- [x] **Step 5: Проверить чистоту изменения**

  Run: `git diff --check origin/develop..HEAD`

  Run: `git status --short`

  Убедиться, что массовые пользовательские изменения окончаний строк остались незакоммиченными, а все смысловые изменения перерасчётов находятся в коммитах.

- [x] **Step 6: Подготовить итог реализации**

  Кратко перечислить новый YAML-договор, диагностику полноты, результаты e2e/round-trip/1С и отдельно отметить оставшиеся незакоммиченные пользовательские XML-файлы.
