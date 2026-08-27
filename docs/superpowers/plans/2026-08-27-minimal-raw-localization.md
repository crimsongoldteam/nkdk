# Minimal Raw Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Локализовать каждое невосстанавливаемое XML-отличие на самой глубокой границе rules, не превращая целые формы, командные панели, контекстные меню и другие rule-объекты в `!xml/raw`.

**Architecture:** Сравнение XML выдаёт атомарные отличия. Единый нейтральный индекс, построенный из уже выполняемых rules и журнала импорта, связывает физический XML-путь с логическим YAML-адресом. Proof применяет существующий механизм привязки экземпляров и экспортных claim к точной границе; порядок хранится отдельным `#order`. Нелокализованный остаток временно сохраняется широким raw, но обязательно создаёт диагностическое предупреждение.

**Tech Stack:** TypeScript 7, Vitest, XML document model, metadata rule runtime, YAML annotations, e2e metadata round-trip.

**Spec:** `docs/superpowers/specs/2026-08-27-standard-attributes-xml-representation-design.md`, раздел «Минимальная область `!xml/raw`».

## Global Constraints

- Исходные XML-фикстуры не изменяются.
- Новые YAML-теги и публичные служебные поля не вводятся.
- XML `id`, UUID и другие индексируемые значения не записываются в raw.
- Производственный код не получает условий по типам форм, именам XML-корней, `itemType` или папкам metadata.
- Обычный импорт, контрольный экспорт и proof используют одну карту адресов, полученную из rules; параллельный сопоставитель по эвристикам не создаётся.
- Канонические вычисляемые узлы не появляются в YAML. Наличие реального неканонического отличия сохраняется минимальным raw.
- Порядок повторяющихся элементов хранится только в минимальном `#order`, без копирования содержимого коллекции.
- Совместимость с промежуточной формой сгенерированного YAML не требуется; существующий договор `!xml/raw` сохраняется.
- Широкий fallback пока остаётся разрешённым только вместе с диагностическим предупреждением; импорт не завершается ошибкой.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base 9cdcb73b9`.

---

### Task 1: Представить XML-расхождения атомарно

**Files:**
- Modify: `packages/runtime/xml/structure/compare.ts`
- Modify: `packages/runtime/xml/structure/compare.test.ts`

**Interfaces:**

```ts
export type XmlStructureDifferenceKind = "value" | "presence" | "order"

export interface XmlStructureDifference {
  readonly path: string
  readonly ownerPath: string
  readonly kind: XmlStructureDifferenceKind
}

export function compareXmlStructureDifferences(
  expected: readonly XmlContentNode[],
  actual: readonly XmlContentNode[],
): readonly XmlStructureDifference[]
```

`compareXmlStructures` на этом слое становится тонкой проекцией `differences.map(({ path }) => path)`, чтобы все вызывающие места получили прежний текстовый отчёт без второго алгоритма сравнения.

- [ ] **Step 1: Написать падающие тесты атомарных различий**

  Добавить случаи значения атрибута, присутствия узла, изменения текста и порядка второго одноимённого элемента:

  ```ts
  expect(compareXmlStructureDifferences(expected, actual)).toEqual([
    {
      kind: "value",
      path: "/Root[1]/Item[2]/@name",
      ownerPath: "/Root[1]/Item[2]",
    },
  ])
  ```

  Для перестановки ожидать одно отличие `kind: "order"` с владельцем непосредственной коллекции, а не полный массив `Item`.

- [ ] **Step 2: Запустить тест и подтвердить падение из-за отсутствующего API**

  Run: `pnpm --filter @nkdk/runtime test -- --run xml/structure/compare.test.ts`

- [ ] **Step 3: Выделить единый обход сравнения**

  Сохранить occurrence в путях (`Item[2]`), классифицировать терминалы и не строить копии XML-поддеревьев. `createXmlElementPatch` пока не меняет публичный договор; новый результат нужен для выбора границы до построения patch.

- [ ] **Step 4: Запустить целевой тест и проверку дубликатов**

  Run: `pnpm --filter @nkdk/runtime test -- --run xml/structure/compare.test.ts`

  Run: `pnpm duplicates -- --base 9cdcb73b9`

- [ ] **Step 5: Создать commit через навык `commit`**

  Expected message: `refactor: :recycle: выделить атомарные различия XML`

---

### Task 2: Построить единый индекс XML- и YAML-адресов rules

**Files:**
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/addressIndex.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/addressIndex.test.ts`
- Modify: `packages/runtime/index.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`

**Interfaces:**

```ts
export interface XmlRuleAddress {
  readonly sourcePath: string
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly DeferredRulePathSegment[]
  readonly kind: "property" | "item"
}

export interface XmlRuleAddressIndex {
  deepest(sourcePath: string, xmlPath: string): XmlRuleAddress | undefined
}

export function createXmlRuleAddressIndex(
  addresses: readonly XmlRuleAddress[],
): XmlRuleAddressIndex
```

- [ ] **Step 1: Написать падающий тест индексирования**

  Проверить, что запрос `/Form[1]/ChildItems[1]/Button[2]/ExtendedTooltip[1]/@name` выбирает адрес второго `Button`, а не `ChildItems` или всю форму. Проверить одинаковые XML-пути в разных `sourcePath` и отсутствие зависимости от `id`.

- [ ] **Step 2: Реализовать нейтральный префиксный индекс**

  Индекс разбирает occurrence-aware пути один раз при построении. `deepest` выполняет проход по сегментам пути; он не сканирует все адреса для каждого отличия и не знает конкретных metadata-типов.

- [ ] **Step 3: Наполнить индекс из существующего import audit**

  В `deriveXmlAnomalyProofPlan` и `captureXmlAnomalyProofAudit` преобразовать зарегистрированные property boundaries и `itemAnchors` в один массив `XmlRuleAddress`. Не выполнять повторный обход XML и не создавать отдельные правила распознавания для форм.

  Проверка интеграции:

  ```ts
  expect(audit.addressIndex.deepest(sourcePath, tooltipXmlPath)).toMatchObject({
    yamlPath: ["Форма", "Элементы", "Кнопка", "РасширеннаяПодсказка"],
    kind: "item",
  })
  ```

- [ ] **Step 4: Запустить тесты runtime и proof**

  Run: `pnpm --filter @nkdk/runtime test -- --run metadata/ruleRuntime/xmlAnomaly/addressIndex.test.ts`

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/anomalyProof.test.ts`

  Run: `pnpm duplicates -- --base 9cdcb73b9`

- [ ] **Step 5: Создать commit через навык `commit`**

  Expected message: `refactor: :recycle: переиспользовать адреса rules для XML`

---

### Task 3: Локализовать остаточные расхождения до конкретного правила

**Files:**
- Create: `packages/rules/metadata/importFromXml/xmlDifferenceLocalization.ts`
- Create: `packages/rules/metadata/importFromXml/xmlDifferenceLocalization.test.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.test.ts`

**Interfaces:**

```ts
export interface LocalizedXmlDifference {
  readonly difference: XmlStructureDifference
  readonly address: XmlRuleAddress
}

export interface UnlocalizedXmlDifference {
  readonly difference: XmlStructureDifference
  readonly nearestAddress?: XmlRuleAddress
  readonly reason: "no-rule-address" | "ambiguous-item" | "unresolved-export-claim"
}

export function localizeXmlDifferences(params: {
  readonly sourcePath: string
  readonly differences: readonly XmlStructureDifference[]
  readonly addressIndex: XmlRuleAddressIndex
}): {
  readonly localized: readonly LocalizedXmlDifference[]
  readonly unlocalized: readonly UnlocalizedXmlDifference[]
}
```

- [ ] **Step 1: Написать падающие тесты локализации повторяющихся элементов**

  Зафиксировать два одноимённых элемента, отличие только во втором и ожидать локальный адрес второго элемента. Отдельно проверить неоднозначный адрес: результат должен попасть в `unlocalized`, а не молча подняться к коллекции.

- [ ] **Step 2: Встроить локализацию перед внешним fallback**

  В `proveXmlAnomalyBoundaries` после обработки известных boundaries сравнить остаточный XML через `compareXmlStructureDifferences`. Каждое локализованное отличие повторно пропустить через существующий выбор `selectXmlAnomalyRawLevel`; только `unlocalized` передавать внешнему fallback.

- [ ] **Step 3: Переиспользовать экспортные claim для конкретного экземпляра**

  `xmlAnomalyAssignment.ts` уже связывает raw-элемент с XML occurrence через временный export claim. Расширить этот путь так, чтобы локализатор передавал существующий `rulePath`/claim, а не строил селектор из XML `id`. После сериализации временные атрибуты claim не должны оставаться в XML.

  Проверка:

  ```ts
  expect(serializedRaw).not.toContain("id:")
  expect(serializedRaw).not.toContain("_id")
  expect(serializedRaw).not.toContain("ChildItems:")
  expect(serializedRaw).toContain("НестандартноеСвойство")
  ```

- [ ] **Step 4: Оставить raw только на самой глубокой границе**

  Если различается атрибут/текст скрытого узла, patch содержит только этот терминал. Если несколько отличий относятся к разным дочерним правилам, они не объединяются на общем родителе.

- [ ] **Step 5: Запустить целевые тесты и проверку дубликатов**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/xmlDifferenceLocalization.test.ts metadata/importFromXml/anomalyProof.test.ts metadata/fullSyncToXml/xmlAnomalyAssignment.test.ts`

  Run: `pnpm duplicates -- --base 9cdcb73b9`

- [ ] **Step 6: Создать commit через навык `commit`**

  Expected message: `fix: :bug: локализовать raw на границе rules`

---

### Task 4: Отделить порядок и диагностировать широкий fallback

**Files:**
- Modify: `packages/runtime/xml/structure/compare.test.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`

**Interfaces:**

```ts
export interface XmlRawScopeWarning {
  readonly sourcePath: string
  readonly xmlPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly nearestYamlPath?: readonly (string | number)[]
  readonly reason: UnlocalizedXmlDifference["reason"]
  readonly rawBytes: number
}

export interface ProveXmlAnomalyBoundariesResult {
  readonly data: unknown
  readonly warnings: readonly XmlRawScopeWarning[]
}
```

- [ ] **Step 1: Написать падающий тест минимального порядка**

  Для переставленных соседей ожидать:

  ```ts
  expect(rawPatch).toEqual({ "#order": ["Button:Вторая", "Button:Первая"] })
  ```

  Patch не должен содержать объекты кнопок или весь массив `Button`.

- [ ] **Step 2: Написать падающий тест диагностики широкого fallback**

  Искусственно передать отличие без rule-адреса. Proof должен сохранить текущий широкий raw и вернуть одно предупреждение с XML-путём, ближайшим YAML-путём, причиной и размером.

- [ ] **Step 3: Протянуть предупреждение в результат импорта**

  `worker.ts` преобразует его в существующий `ImportDiagnostic`:

  ```ts
  {
    severity: "warning",
    code: "xml_raw_scope_too_broad",
    message: "Непредметное XML-отличие сохранено на более широкой границе",
    targetProjectPath,
    sourcePath,
    value: JSON.stringify({ xmlPath, yamlPath, nearestYamlPath, reason, rawBytes }),
  }
  ```

  Диагностика не меняет успешность импорта и не создаётся для точно локализованного raw.

- [ ] **Step 4: Запустить целевые тесты и проверку дубликатов**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/anomalyProof.test.ts metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/worker.integration.test.ts`

  Run: `pnpm duplicates -- --base 9cdcb73b9`

- [ ] **Step 5: Создать commit через навык `commit`**

  Expected message: `feat: :sparkles: диагностировать широкий raw`

---

### Task 5: Закрепить общий договор на формах без особого производственного кода

**Files:**
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify if a missing common registration is proven: `packages/rules/metadata/forms/commonObjects/childItems/fromXMLToYAML.ts`
- Modify if a missing common registration is proven: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts`
- Modify corresponding test only if production registration changes: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`

- [ ] **Step 1: Добавить регрессионный тест канонической формы**

  Использовать существующий `createCatalogAndFormAssignments`: форма содержит `ContextMenu` и пустой канонический `ExtendedTooltip` с XML `id`. После импорта:

  ```ts
  expect(yaml).not.toContain("@Form\\\\РасширеннаяПодсказка")
  expect(yaml).not.toContain("!xml/raw")
  expect(result.warnings).not.toContainEqual(
    expect.objectContaining({ code: "xml_raw_scope_too_broad" }),
  )
  ```

  Контрольный XML должен восстановить исходные `id` через индекс конфигурации, хотя в YAML/raw их нет.

- [ ] **Step 2: Добавить тест реального неканонического отличия**

  Изменённое внутреннее имя `ExtendedTooltip` сохраняется как короткий raw на адресе самой подсказки. В YAML не должно быть raw всей `КоманднаяПанель`, `КонтекстноеМеню`, `ChildItems` или формы.

- [ ] **Step 3: Исправить только доказанный разрыв общего механизма**

  Если тест показывает потерю адреса или `id`, дополнить общую регистрацию логического адреса/индекса в существующем пути `fromXMLToYAML` или `formXmlIdAssignment`. Не добавлять проверок на конкретный вид формы, командной панели или имя поля.

- [ ] **Step 4: Запустить интеграционные тесты и проверку дубликатов**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`

  Run: `pnpm duplicates -- --base 9cdcb73b9`

- [ ] **Step 5: Создать commit через навык `commit`**

  Expected message: `test: :white_check_mark: закрепить минимальный raw формы`

---

### Task 6: Запретить широкие raw в e2e и проверить полный round-trip

**Files:**
- Modify: `e2e/metadata-project.test.ts`
- Modify generated YAML fixtures only if the tested import intentionally regenerates them: `e2e/fixtures/nkdk/cf/**`
- Do not modify: `e2e/fixtures/xml/cf/**`

- [ ] **Step 1: Добавить структурную e2e-проверку без списка исключений**

  После импорта проверить отсутствие диагностики `xml_raw_scope_too_broad`. Для каждого `!xml/raw` разобрать `$xml` и отклонять patch, который содержит целый повторяющийся rule-объект вместо терминала или `#order`. Проверка использует сведения rules/аудита, а не имена `КоманднаяПанель` и `КонтекстноеМеню` и не задаёт допустимое количество raw.

- [ ] **Step 2: Запустить целевой e2e вне песочницы**

  Run: `pnpm test:e2e`

  Expected: XML совпадает точно, список исключений отсутствует, широких raw и соответствующих предупреждений нет.

- [ ] **Step 3: Запустить обязательные проверки слоя**

  Run: `pnpm duplicates -- --base 9cdcb73b9`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

- [ ] **Step 4: Запустить полный набор тестов вне песочницы**

  Run: `pnpm test`

  Expected: PASS во всех `packages/*` и e2e.

- [ ] **Step 5: Выполнить диагностический round-trip `cf/doc`**

  Run: `NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh`

  Acceptance:

  - итоговое XML-различие равно нулю;
  - нет предупреждений `xml_raw_scope_too_broad`;
  - канонические пустые `ExtendedTooltip` отсутствуют в YAML;
  - ни один raw не поглощает целый rule-объект при наличии более глубокой границы;
  - порядок повторяющихся элементов представлен только `#order`;
  - временные каталоги диагностики удалены после подсчёта результата.

- [ ] **Step 6: Создать заключительный commit через навык `commit`**

  Expected message: `test: :white_check_mark: запретить широкий raw в e2e`

---

## Final Review Checklist

- [ ] Сверить каждый пункт раздела спецификации «Минимальная область `!xml/raw`» с тестом или явным ограничением кода.
- [ ] Убедиться, что runtime-слой не импортирует concrete metadata-модули.
- [ ] Убедиться, что в production-коде нет проверок имён форм, `itemType`, XML-корней и папок.
- [ ] Убедиться, что ни raw, ни его селектор не хранят XML `id`/UUID.
- [ ] Убедиться, что fallback всегда сопровождается диагностикой и никогда не скрывает локализованное отличие.
- [ ] Перечитать план и убедиться, что в нём нет заглушек и неопределённых шагов.
- [ ] Run: `git diff --check`
- [ ] Запросить отдельное ревью реализации и сверку со спецификацией перед PR-циклом.
