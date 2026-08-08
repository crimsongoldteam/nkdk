# Dependent Fill Value Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать единую зависимую проверку `ЗначениеЗаполнения`: удалять доказанные неявные значения при XML-import, выдавать одну предметную ошибку для такого YAML, проверять содержательные значения по эффективному типу и передавать ссылки в существующую Б5-проверку зависимостей.

**Architecture:** Предметный классификатор и декларации стандартных реквизитов живут ниже DataPath и не зависят от операций. Три тонких адаптера используют один результат: import нормализует итоговое дерево до сериализации, локальная validation формирует diagnostics и pending references, structural reference traversal обслуживает поиск и переименование. Примитивные значения остаются только в YAML; только распознанные ссылки материализуются существующим форматом `PendingMetadataTargetReference` и разрешаются Б5.

**Tech Stack:** TypeScript, TypeBox/JSON Schema, Vitest, существующие metadata rules.ts, configuration snapshot, project state dependency index.

## Global Constraints

- Источник требований: `docs/superpowers/specs/2026-08-08-dependent-fill-value-validation-design.md`.
- Не изменять существующие XML-фикстуры; новые случаи строить программно или добавлять отдельными минимальными фикстурами.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и построители rules.ts.
- Не добавлять частные проверки `itemType`, имён `Ссылка`/`Код`/`Владелец` или каталогов метаданных в `orchestration`, `validation` и `project`.
- Не использовать `!xml`, `existsSync`, `statSync` или обход файлов для проверки ссылок.
- Не сохранять примитивное или полное `ЗначениеЗаполнения` в project state; сохранять только обычные pending references для ссылок.
- Не изменять `.agents/architecture.md` во время реализации. Если код потребует расхождения со спецификацией архитектуры, остановиться и сообщить разработчику.
- После каждого завершённого слоя выполнять `pnpm check:duplicates -- --base 846109725`.

---

## Карта итоговых модулей

Новые предметные модули:

- `packages/core/metadata/standardMembers/declarations.ts` — нейтральные типы деклараций, реестр и `fillValue`-политики стандартных реквизитов.
- `packages/core/metadata/commonObjects/fillValue/types.ts` — эффективный тип, классификация и нормализованное ссылочное ограничение.
- `packages/core/metadata/commonObjects/fillValue/effectiveType.ts` — получение вариантов из `TypeDescription` и декларации стандартного реквизита.
- `packages/core/metadata/commonObjects/fillValue/classify.ts` — чистая классификация без diagnostics и мутации.
- `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts` — общий анализ `MetadataAttribute` и `StandardAttributeDescription`, возвращающий классификацию и ссылочную зависимость.
- `packages/core/metadata/commonObjects/fillValue/register.ts` — регистрация предметных адаптеров по `itemType`; этот файл знает конкретные типы, общие обходчики — нет.
- `packages/core/metadata/orchestration/property/dependentItemRegistry.ts` — нейтральный реестр обработчиков вложенного YAML-элемента.
- `packages/core/metadata/importFromXml/dependentItems.ts` — сбор XML-кандидатов и нормализация import после построения целого YAML.

Изменяемые общие точки:

- `packages/core/metadata/validation/dataPath/standardMembers.ts` становится DataPath-проекцией нейтральных деклараций.
- `packages/core/metadata/validation/rulesSnapshot.ts` сохраняет `itemType` вложенного правила.
- `packages/core/metadata/validation/yamlFactExtractor.ts` вызывает зарегистрированный анализ элемента и добавляет его diagnostics/references.
- `packages/core/metadata/validation/structuralReferences.ts` вызывает тот же предметный анализ для поиска и переименования.
- `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` только передаёт нейтральному сборщику XML/YAML-координаты зарегистрированных зависимых свойств.
- `packages/core/metadata/importFromXml/prepareYaml.ts` нормализует дерево до возврата `PreparedImportYaml`, пока доступен collector снимка.

---

### Task 1: Отделить декларации стандартных реквизитов от DataPath

**Files:**

- Create: `packages/core/metadata/standardMembers/declarations.ts`
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Modify: `packages/core/metadata/validation/dataPath/registry.ts`
- Modify: `packages/core/metadata/appliedObjects/*/standardMembers.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.coverage.test.ts`
- Test: `packages/core/metadata/standardMembers/declarations.test.ts`

- [ ] **Step 1: Зафиксировать нейтральную границу падающим архитектурным тестом**

  Добавить проверки, что прикладные `standardMembers.ts` импортируют реестр из `metadata/standardMembers`, а нейтральный модуль не импортирует `validation/dataPath`. Запустить:

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts metadata/standardMembers/declarations.test.ts
  ```

  Ожидаемо: тест падает, потому что реестр и типы пока находятся в `validation/dataPath`.

- [ ] **Step 2: Перенести только декларации и состояние реестра**

  Перенести `StandardMemberDeclaration`, `registerStandardMembers`, `getStandardMembers`, revision и test snapshot/restore в `standardMembers/declarations.ts`. Добавить к базовой декларации стандартного атрибута необязательное дискриминированное поле:

  ```ts
  export type StandardMemberFillValuePolicy =
    | { readonly policy: "forbidden" }
    | { readonly policy: "byEffectiveType"; readonly implicitValue?: string | number | boolean }
    | {
        readonly policy: "codeFromOwner"
        readonly typeProperty: string
        readonly lengthProperty: string
        readonly allowedLengthProperty: string
      }
    | {
        readonly policy: "ownerReference"
        readonly ownersProperty: string
        readonly predefinedOnly: true
        readonly allowUnselectedTypeWhenComposite: true
      }
    | { readonly policy: "notSpecified" }
  ```

  Отсутствующую политику трактовать как `notSpecified`, чтобы неисследованные декларации не начали выдавать ошибки.

- [ ] **Step 3: Оставить DataPath только его проекцию**

  `validation/dataPath/standardMembers.ts` должен импортировать декларации и реестр, но сохранить функции `resolveIndexTimeStandardMember`, `resolveTraversalTimeStandardMember` и построение `DataPathTypeInfo`. В `validation/dataPath/registry.ts` временно переэкспортировать публичные имена, если это нужно для совместимости тестов, затем перевести прикладные импорты на нейтральный путь.

- [ ] **Step 4: Проверить существующее поведение DataPath**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/standardMembers.coverage.test.ts metadata/validation/dataPath/objectFields.test.ts metadata/importBoundaries.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 5: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/standardMembers packages/core/metadata/validation/dataPath packages/core/metadata/appliedObjects packages/core/metadata/importBoundaries.test.ts
  git commit -m "refactor: :recycle: отделить декларации стандартных реквизитов от DataPath"
  ```

---

### Task 2: Реализовать чистый эффективный тип и классификатор

**Files:**

- Create: `packages/core/metadata/commonObjects/fillValue/types.ts`
- Create: `packages/core/metadata/commonObjects/fillValue/effectiveType.ts`
- Create: `packages/core/metadata/commonObjects/fillValue/classify.ts`
- Test: `packages/core/metadata/commonObjects/fillValue/effectiveType.test.ts`
- Test: `packages/core/metadata/commonObjects/fillValue/classify.test.ts`

- [ ] **Step 1: Написать таблицу падающих тестов для обычных реквизитов**

  Покрыть программно построенными `TypeDescription` и `MetadataTypedValue`:

  - строку: содержательное значение, `""` как `implicit`, число как `invalid`, максимальную длину;
  - число: содержательное значение, `0` как `implicit`, строку как `invalid`;
  - boolean: `true` как `valid`, `false` как `implicit`;
  - одиночную ссылку: содержательную ссылку, `EmptyRef` как `implicit`, чужой тип как `invalid`;
  - составную ссылку: пустой `DesignTimeRef`, выбранную ветвь `EmptyRef`, чужую ветвь;
  - неизвестный класс типа как `unresolved`, без эвристического неявного значения.

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/fillValue/effectiveType.test.ts metadata/commonObjects/fillValue/classify.test.ts
  ```

- [ ] **Step 2: Ввести минимальные предметные типы**

  `FillValueEffectiveType` должен описывать только необходимые варианты (`string`, `number`, `boolean`, `reference`, composite alternatives), ограничения длины и `MetadataTargetConstraint`. `FillValueClassification` должен точно совпадать со спецификацией: `valid | implicit | invalid | unresolved | notSpecified`.

- [ ] **Step 3: Реализовать чистое преобразование `TypeDescription`**

  Не использовать `DataPathTypeInfo`. Переиспользовать существующий разбор `TypeDescription` и таблицы соответствия XML/YAML имён типов из `commonObjects/typeDescription` и `metadataTargets`. Для ссылок вернуть ограничение, достаточное существующему `parseMetadataTargetFromYAML` и Б5.

- [ ] **Step 4: Реализовать классификатор без diagnostics**

  Сначала определять неявное значение, затем форму/тип и ограничения. Для составной ссылки не считать `EmptyRef` выбранной ветви неявным значением всего составного типа.

- [ ] **Step 5: Запустить модульные проверки**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/fillValue/effectiveType.test.ts metadata/commonObjects/fillValue/classify.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 6: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/commonObjects/fillValue
  git commit -m "feat: :sparkles: классифицировать значение заполнения по типу"
  ```

---

### Task 3: Описать согласованные политики стандартных реквизитов

**Files:**

- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/standardMembers.ts`
- Create: `packages/core/metadata/commonObjects/fillValue/standardMember.test.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/effectiveType.ts`

- [ ] **Step 1: Написать падающие тесты политик**

  Проверить:

  - `Ссылка`, `ЭтоГруппа`, `Предопределенный`, `ИмяПредопределенныхДанных` → `forbidden`;
  - `ПометкаУдаления`: `true` → `valid`, `false` → `implicit`;
  - каталоговый `Код`: строковый/числовой режим, верхняя граница, пробельная строка любой длины, `0`, число с лишними цифрами, дробь;
  - `Владелец`: один и несколько владельцев, `predefinedOnly`, невыбранный составной `DesignTimeRef`, выбранная ветвь `EmptyRef`;
  - необъявленная политика → `notSpecified` без diagnostic.

- [ ] **Step 2: Заполнить декларации только исследованными правилами**

  Повторяющиеся исследованные атрибуты (`Ref`, `DeletionMark`, `IsFolder`, `Predefined`, `PredefinedDataName`) пометить во всех существующих декларациях, где они присутствуют. `Code` и `Owner` включить там, где согласованная семантика и необходимые свойства владельца действительно объявлены; остальные оставить неявным `notSpecified`.

- [ ] **Step 3: Читать свойства владельца по внутренним ключам rules.ts**

  Общий resolver получает корневое правило и итоговый YAML владельца, находит свойство по model key из политики (`codeType`, `codeLength`, `codeAllowedLength`, `owners`) и применяет существующий `importFromYAML`/implicit contract. Не ветвиться по имени объекта или YAML-поля.

- [ ] **Step 4: Проверить слой**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts metadata/validation/dataPath/standardMembers.coverage.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 5: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/appliedObjects packages/core/metadata/commonObjects/fillValue
  git commit -m "feat: :sparkles: описать заполнение стандартных реквизитов"
  ```

---

### Task 4: Добавить общий анализ вложенного элемента в локальную validation

**Files:**

- Create: `packages/core/metadata/orchestration/property/dependentItemRegistry.ts`
- Create: `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts`
- Create: `packages/core/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/registerValidationMetadata.ts`
- Test: `packages/core/metadata/validation/rulesSnapshot.test.ts`
- Create: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`

- [ ] **Step 1: Зафиксировать обход вложенных item rules падающим тестом**

  В снимке правил ожидать `itemType` для `MetadataAttribute` и `StandardAttributeDescription`. В extractor проверить вызов зарегистрированного обработчика ровно один раз на каждый вложенный элемент с его record, YAML-путём, именем элемента, корневым YAML и корневым rules.ts.

- [ ] **Step 2: Реализовать нейтральный реестр**

  Реестр индексируется по `itemType` и хранит обработчик, возвращающий:

  ```ts
  interface DependentYamlItemAnalysis {
    readonly diagnostics: readonly Diagnostic[]
    readonly references: readonly PendingMetadataTargetReferenceCandidate[]
  }
  ```

  Общий реестр не знает о `ЗначениеЗаполнения`. Добавить snapshot/restore для изоляции тестов.

- [ ] **Step 3: Сохранить вложенный `itemType` в validation snapshot**

  Расширить `ValidationRulesPropertySnapshot` полем `nestedItemType?: string` и заполнить его в `childrenSnapshot`. При обходе массива/словаря вызывать обработчик вложенного элемента до обхода его свойств. Корневой обработчик продолжает вызываться существующим механизмом.

- [ ] **Step 4: Реализовать предметный адаптер diagnostics**

  Зарегистрировать обработчики только из `commonObjects/fillValue/register.ts`:

  - `MetadataAttribute`: тип из соседнего `Тип`;
  - `StandardAttributeDescription`: декларация по имени элемента и владельцу.

  `implicit` выдаёт одну ошибку «поле содержит неявное значение; удалите `ЗначениеЗаполнения`», `invalid` — одну предметную ошибку из reason, `unresolved` — warning для разработчика, `notSpecified` — ничего. Путь diagnostic оканчивается на `ЗначениеЗаполнения`.

- [ ] **Step 5: Проверить отсутствие восьми schema diagnostics**

  Добавить случай `Тип: Строка(250)` + `ЗначениеЗаполнения: ""` через `validateKnownProjectYaml`: ожидается одна зависимая diagnostic и ни одной ошибки от ветвей union `MetadataValue`.

- [ ] **Step 6: Запустить проверки**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/validation/rulesSnapshot.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/validation/knownYamlValidation.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 7: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/orchestration/property/dependentItemRegistry.ts packages/core/metadata/commonObjects/fillValue packages/core/metadata/validation
  git commit -m "feat: :sparkles: проверять зависимые значения YAML"
  ```

---

### Task 5: Материализовать ссылки `ЗначениеЗаполнения` для Б5

**Files:**

- Modify: `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Create: `packages/core/metadata/validation/fillValueReferences.test.ts`
- Modify: `packages/core/metadata/validation/projectMetadataReferences.test.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.test.ts`

- [ ] **Step 1: Написать падающий тест фактов зависимости**

  Для обычного ссылочного реквизита и стандартного `Владелец` ожидать один `pendingReferences` с точным YAML-путём и ограничением типа. Для строки, числа и boolean ожидать отсутствие pending reference и отсутствие полного значения в project state.

- [ ] **Step 2: Выделить общий материализатор ссылки**

  Из `metadataTargets/validationHandlers.ts` извлечь функцию, которая принимает `MetadataTypedValue`, динамический `MetadataTargetConstraint`, owner и YAML-путь и возвращает существующий `PendingMetadataTargetReferenceCandidate` либо одну diagnostic разбора. Статические metadataTarget handlers и fill-value analyzer должны вызывать её, а не дублировать parse/canonical logic.

- [ ] **Step 3: Обработать `notSpecified` честно**

  Если форма значения явно ссылочная, вывести минимальное ограничение из самой распознанной canonical-формы и создать pending reference. Не объявлять неизвестную примитивную строку ссылкой. Это сохраняет Б5, поиск и rename без выдумывания предметной политики.

- [ ] **Step 4: Проверить Б5 интеграционно**

  В `projectMetadataReferences.test.ts` построить проект, где ссылка допустимого типа существует и где предопределённой цели нет. Ожидать, что локальная проверка не ищет файлы, а Б5 возвращает стандартную dependency diagnostic для отсутствующей цели.

- [ ] **Step 5: Проверить двоичный project state**

  После `toProjectStateFileUpdate` ссылка должна находиться в `pendingReferences`; примитивное значение не должно появляться ни в `pendingReferences`, ни в `pendingChecks`, ни в `dependencies`.

- [ ] **Step 6: Запустить проверки**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/validation/fillValueReferences.test.ts metadata/validation/projectMetadataReferences.test.ts metadata/projectState/fileUpdate.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 7: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/commonObjects/fillValue packages/core/metadata/commonObjects/metadataTargets packages/core/metadata/validation packages/core/metadata/projectState
  git commit -m "feat: :sparkles: индексировать ссылки значения заполнения"
  ```

---

### Task 6: Переиспользовать ссылки в поиске и переименовании

**Files:**

- Modify: `packages/core/metadata/validation/structuralReferences.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/register.ts`
- Create: `packages/core/metadata/validation/structuralReferences.fillValue.test.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`

- [ ] **Step 1: Написать падающие structural reference тесты**

  Проверить, что ссылка в `ЗначениеЗаполнения` возвращается с тем же canonical и YAML-путём, что pending reference, а `setCanonical` меняет только значение этого поля и сохраняет его YAML-представление.

- [ ] **Step 2: Расширить нейтральный обход item rules**

  `collectStructuralYamlReferences` должен вызывать зарегистрированный item handler с корневым YAML/rule и текущим record. Он не должен проверять конкретные `itemType`. Контракт по-прежнему требует, чтобы каждая structural reference имела соответствующий индексируемый candidate с тем же canonical и путём.

- [ ] **Step 3: Проверить операции**

  Добавить один тест поиска блокирующей ссылки и один тест rename предопределённого элемента/объекта, на который ссылается `ЗначениеЗаполнения`. Проверить фактическое содержимое переписанного YAML.

- [ ] **Step 4: Запустить проверки**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/validation/structuralReferences.fillValue.test.ts metadata/operations/findMetadataReferences.test.ts metadata/operations/renameItem.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 5: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/validation/structuralReferences.ts packages/core/metadata/commonObjects/fillValue packages/core/metadata/operations
  git commit -m "feat: :sparkles: учитывать значения заполнения в операциях ссылок"
  ```

---

### Task 7: Нормализовать XML-import и сохранить точную XML-форму

**Files:**

- Create: `packages/core/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/collectProperty.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/writer.ts`
- Create: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Create: `packages/core/metadata/importFromXml/fillValueImport.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`

- [ ] **Step 1: Написать падающий тест момента нормализации**

  Программно импортировать корневую модель с обычным реквизитом, где `Тип` расположен до или после `ЗначениеЗаполнения`. После полного `prepareImportYaml` ожидать отсутствие доказанного `implicit` и сохранение `valid`/`invalid`. Этим зафиксировать, что решение принимается после построения целого YAML, а не при чтении одного XML-свойства.

- [ ] **Step 2: Добавить нейтральный сбор кандидатов**

  В `fromXMLToYAML.ts` при обходе зарегистрированного item handler собирать только координаты зависимого свойства:

  ```ts
  interface ImportedDependentPropertyCandidate {
    readonly itemType: string
    readonly itemYamlPath: readonly (string | number)[]
    readonly itemName?: string
    readonly propertyKey: string
    readonly yamlPath: readonly (string | number)[]
    readonly logicalAddress?: string
    readonly xmlValue: unknown
    readonly presentInXML: boolean
  }
  ```

  Общий обход получает список отслеживаемых model keys из регистрации, а не сравнивает `fillValue` или `ЗначениеЗаполнения` самостоятельно.

- [ ] **Step 3: Нормализовать до извлечения fragment снимка**

  В конце `prepareImportYaml`, после построения root YAML и local indexes, вызвать import adapter для всех кандидатов. Он повторно использует `analyzeItem`:

  - `implicit` удаляет YAML-ключ;
  - остальные результаты не меняют YAML;
  - diagnostics не формируются здесь: сохранённые `invalid`/`unresolved` проверит существующая «Локальная валидация готового YAML» тем же analyzer.

  Это должно произойти до `collector.fragment(...)` в worker и до сериализации как ранних, так и отложенных YAML.

- [ ] **Step 4: Сохранить XML только при фактическом удалении**

  Добавить в collector узкую операцию сохранения raw XML-состояния по уже вычисленному logical address. Для удалённого `implicit` записать в существующие поля:

  - `_xsi:nil` → `xsiNil`;
  - `_xsi:type` → `xsiType`;
  - `#text` строкой, включая точные пробелы → `xmlText`;
  - явную пустую форму → `explicitEmpty`.

  Не сохранять дополнительные xml-поля для `valid`, `invalid` и `notSpecified`. Формат `ConfigurationSnapshotEntity` не менять.

- [ ] **Step 5: Проверить точный round-trip без reference XML**

  Покрыть три случая: `xsi:nil`, пустой типизированный `DesignTimeRef`, типизированная строка из точного количества пробелов. После import удалить reference XML, выполнить YAML → XML со снимком и сравнить узел побайтно/глубоко. Затем явно задать новое YAML-значение и проверить, что оно имеет приоритет над снимком.

- [ ] **Step 6: Проверить одинаковое поведение раннего и отложенного YAML**

  Один тест должен пройти путь без `deferred`, второй — с существующим `finalizeImportedYAML`; оба нормализуются до сериализации и дают одинаковую локальную validation.

- [ ] **Step 7: Запустить проверки**

  ```bash
  pnpm --filter @nakidka/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/importFromXml/prepareYaml.test.ts
  pnpm --filter @nakidka/core exec tsc --noEmit
  pnpm check:duplicates -- --base 846109725
  ```

- [ ] **Step 8: Зафиксировать слой**

  ```bash
  git add packages/core/metadata/importFromXml packages/core/metadata/orchestration/property packages/core/metadata/configurationIndex
  git commit -m "feat: :sparkles: нормализовать значения заполнения при импорте"
  ```

---

### Task 8: Интеграционная проверка и документация ограничения

**Files:**

- Modify: `.agents/restrictions.md`
- Modify: `docs/superpowers/specs/2026-08-08-dependent-fill-value-validation-design.md` only if implementation exposed an already-approved factual correction; otherwise leave unchanged.
- Test: existing repository test suites.

- [ ] **Step 1: Проверить массовый import на чистом целевом каталоге**

  С разрешения пользователя удалить внутренний `.nkdk`-снимок в `/Users/nikita/git/sed_nkdk/cf`, затем выполнить реальный import из `/Users/nikita/git/sed_xml/cf` в `/Users/nikita/git/sed_nkdk/cf` штатной CLI-командой проекта. Не создавать временную копию проекта.

- [ ] **Step 2: Запустить штатную validation целевого проекта**

  Проверить отдельно:

  - исчезла массовая группа schema diagnostics по `ЗначениеЗаполнения`;
  - явные неявные значения не остались в импортированном YAML;
  - реальные несовместимые значения дают по одной предметной ошибке;
  - отсутствующие ссылочные цели выдаются Б5;
  - расширение конфигурации входит в validation тем же штатным путём.

- [ ] **Step 3: Зафиксировать известное неполное покрытие**

  В `.agents/restrictions.md` оставить нейтральную запись: неисследованные стандартные реквизиты используют `notSpecified`, не создают собственных diagnostics, но распознаваемые ссылки продолжают участвовать в Б5, поиске и переименовании.

- [ ] **Step 4: Выполнить полную проверку репозитория**

  ```bash
  pnpm type-check
  pnpm test
  pnpm test:architecture
  pnpm check:duplicates -- --base 846109725
  git diff --check
  ```

- [ ] **Step 5: Просмотреть расхождение со спецификацией**

  Сопоставить каждый критерий готовности спецификации с тестом или результатом реального import/validation. Если реализация потребовала изменить архитектурный договор, не править `.agents/architecture.md`, а перечислить расхождения разработчику.

- [ ] **Step 6: Зафиксировать документацию и интеграционные правки**

  ```bash
  git add .agents/restrictions.md docs/superpowers/specs/2026-08-08-dependent-fill-value-validation-design.md
  git commit -m "docs: :memo: описать ограничения проверки значения заполнения"
  ```

---

## Самопроверка плана

- [ ] Все пять классификаций (`valid`, `implicit`, `invalid`, `unresolved`, `notSpecified`) покрыты модульно и операционно.
- [ ] Обычный и стандартный реквизит используют один `classifyFillValue`.
- [ ] Import удаляет только `implicit`; validation считает явно записанный `implicit` ошибкой.
- [ ] Примитивы не попадают в индекс зависимостей; ссылки используют существующий `PendingMetadataTargetReference` и Б5.
- [ ] `notSpecified` молчит локально, но не отключает Б5, поиск и rename.
- [ ] XML-форма сохраняется существующими `xsiNil`/`xsiType`/`xmlText`/`explicitEmpty`, без нового формата и `!xml`.
- [ ] В общих слоях нет частных условий по именам и типам метаданных.
- [ ] В плане нет `TODO`, псевдокода без владельца или неуказанных файлов.
- [ ] Все новые интерфейсы согласованы с существующими `MetadataTypedValue`, `MetadataTargetConstraint`, `Diagnostic`, `PendingMetadataTargetReferenceCandidate` и `ConfigurationIndexCollector`.
