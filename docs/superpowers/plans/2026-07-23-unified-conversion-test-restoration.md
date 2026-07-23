# Unified Conversion Test Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить всё поведенческое покрытие удалённых раздельных fromXML/toYAML/fromYAML/toXML-тестов в тестах единых XML→YAML и YAML→XML-преобразований, не возвращая промежуточную metadata-модель и старую оркестрацию.

**Architecture:** История feature-ветки преобразуется в проверяемую карту миграции на уровне отдельных сценариев. Объектные тесты вызывают настоящие единые обходы через небольшие тестовые помощники; атомарные тесты продолжают вызывать атомарные обработчики напрямую. Перенос выполняется по слоям, а проверка карты запрещает завершить работу с потерянным или необоснованно исключённым сценарием.

**Tech Stack:** TypeScript 6, Vitest 4, pnpm, встроенный TypeScript Compiler API, Git.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- `fromXML.test.ts + toYAML.test.ts` переносятся в `fromXMLToYAML.test.ts`; `fromYAML.test.ts + toXML.test.ts` — в `fromYAMLToXML.test.ts` рядом с правилами объекта.
- Переносить объединение сценариев, фикстур и проверок, а не только совпадающие по названию пары тестов.
- Объектные тесты обязаны вызывать настоящий единый обход; запрещены переходники, воспроизводящие удалённую общую оркестрацию или промежуточную metadata-модель.
- Атомарные `fromXML`, `toYAML`, `fromYAML`, `toXML` остаются отдельными и могут тестироваться напрямую.
- Допустимое исключение — только проверка существования удалённого API или внутреннего представления старой модели; для него обязательно конкретное обоснование в карте.
- Общие metadata-слои не получают условий по конкретному `itemType`, XML-корню или каталогу объекта.
- Не добавлять новые правила преобразований без обнаруженного падающего перенесённого теста; исправление держать в едином обходе, декларативном `rules.ts` или соответствующем атомарном обработчике.
- Не добавлять `order` в `rules.ts` без доказанной необходимости.
- Минимизировать `as any` и `as unknown`; неизбежное приведение держать внутри тестового помощника и покрывать его собственным тестом.
- После каждого каталога запускать его новые тесты, после слоя — весь `@nkdk/core`, перед завершением — `pnpm test`, type-check и `git diff --check`.
- Выполнение вести без субагентов, как выбрал пользователь.

---

## File map

- `packages/core/scripts/conversion-test-migration/types.ts` — формат источника и итоговой записи карты миграции.
- `packages/core/scripts/conversion-test-migration/readDeletedTests.ts` — чтение каждого события удаления из истории Git и исходного текста из родителя коммита.
- `packages/core/scripts/conversion-test-migration/extractScenarios.ts` — поиск обычных и параметризованных Vitest-сценариев через TypeScript Compiler API.
- `packages/core/scripts/conversion-test-migration/buildMap.ts` — создание и обновление карты без перезаписи уже заполненных решений.
- `packages/core/scripts/conversion-test-migration/auditMap.ts` — проверка полноты, допустимых состояний и существования нового теста.
- `packages/core/scripts/conversion-test-migration/*.test.ts` — проверки истории, извлечения сценариев и аудита.
- `packages/core/scripts/conversion-test-migration/migration-map.json` — зафиксированная карта каждого удалённого сценария.
- `packages/core/tests/directConversion.ts` — тестовые помощники, вызывающие единые обходы property/item и сравнивающие конечный YAML/XML.
- `packages/core/tests/directConversion.test.ts` — доказательство, что помощники вызывают пары атомарных операций в правильном порядке и не используют старую модель.
- `packages/core/metadata/**/fromXMLToYAML.test.ts` — восстановленные XML→YAML-сценарии рядом с объектами.
- `packages/core/metadata/**/fromYAMLToXML.test.ts` — восстановленные YAML→XML-сценарии рядом с объектами.
- `packages/core/metadata/**/*{convertFromXML,syncExternal,roundTrip,reference}*.test.ts` — самостоятельные интеграционные сценарии, переведённые на публичные единые операции.
- Производственные `packages/core/metadata/**/*.ts` меняются только при наличии падающего перенесённого сценария.

---

### Task 1: Проверяемая карта всех удалённых сценариев

**Files:**
- Create: `packages/core/scripts/conversion-test-migration/types.ts`
- Create: `packages/core/scripts/conversion-test-migration/readDeletedTests.ts`
- Create: `packages/core/scripts/conversion-test-migration/readDeletedTests.test.ts`
- Create: `packages/core/scripts/conversion-test-migration/extractScenarios.ts`
- Create: `packages/core/scripts/conversion-test-migration/extractScenarios.test.ts`
- Create: `packages/core/scripts/conversion-test-migration/buildMap.ts`
- Create: `packages/core/scripts/conversion-test-migration/auditMap.ts`
- Create: `packages/core/scripts/conversion-test-migration/auditMap.test.ts`
- Create: `packages/core/scripts/conversion-test-migration/migration-map.json`

**Interfaces:**
- Produces: `readDeletedTests(range: string): DeletedTestSource[]`.
- Produces: `extractScenarios(source: DeletedTestSource): DeletedScenario[]`.
- Produces: `auditMigrationMap(rows: MigrationRow[], options: AuditOptions): AuditError[]`.
- Produces: JSON-массив `MigrationRow[]`, который используют все следующие задачи.

- [ ] **Step 1: Зафиксировать типы карты**

```ts
export type Direction = "fromXML" | "toYAML" | "fromYAML" | "toXML" | "standalone"
export type MigrationStatus = "pending" | "migrated" | "obsolete-internal"

export interface DeletedTestSource {
  deletingCommit: string
  parentCommit: string
  path: string
  sourceText: string
}

export interface DeletedScenario {
  id: string
  deletingCommit: string
  parentCommit: string
  sourcePath: string
  direction: Direction
  oldTitle: string
  declarationText: string
  fixtures: string[]
  line: number
}

export interface MigrationRow extends DeletedScenario {
  behavior: string
  targetPath: string
  targetTitle: string
  status: MigrationStatus
  justification?: string
}

export interface AuditOptions {
  repositoryRoot: string
  expectedScenarios: DeletedScenario[]
  requireComplete: boolean
}
```

- [ ] **Step 2: Написать падающие тесты чтения истории**

Создать временный Git-репозиторий, добавить `fromXML.test.ts`, удалить его вторым коммитом и проверить, что `readDeletedTests("base..HEAD")` возвращает удаляющий коммит, его родителя, путь и текст из родителя. Второй тест должен удалить, восстановить и снова удалить тот же путь и ожидать две разные записи.

Run: `pnpm --filter @nkdk/core exec vitest run scripts/conversion-test-migration/readDeletedTests.test.ts`

Expected: FAIL — модуль `readDeletedTests.ts` ещё отсутствует.

- [ ] **Step 3: Реализовать чтение всех событий удаления**

Использовать только аргументный запуск `git` через `execFileSync`: получить `git rev-list --reverse <range>`, для каждого коммита вызвать `git diff-tree --no-commit-id --name-only --diff-filter=D -r <commit> -- *.test.ts`, затем прочитать `<commit>^:<path>` командой `git show`. Не сводить события к уникальному пути: повторное удаление остаётся отдельным источником.

- [ ] **Step 4: Написать падающие тесты извлечения сценариев**

Покрыть четыре формы:

```ts
it("обычный", () => {})
test("обычный test", () => {})
it.each([[1], [2]])("параметр %s", () => {})
describe.each(["a", "b"])("группа %s", () => { it("вложенный", () => {}) })
```

Проверить устойчивый `id` из `deletingCommit/sourcePath/line`, текст заголовка или исходное выражение динамического заголовка, направление из имени файла и импорты/строки, содержащие `__fixtures__` либо расширения `.xml`, `.yaml`, `.json`.

Run: `pnpm --filter @nkdk/core exec vitest run scripts/conversion-test-migration/extractScenarios.test.ts`

Expected: FAIL — модуль `extractScenarios.ts` ещё отсутствует.

- [ ] **Step 5: Реализовать извлечение через TypeScript Compiler API**

Обходить все `CallExpression`; считать сценарием вызов `it`, `test`, `it.only`, `test.only`, `it.each(...)` или `test.each(...)`. Для динамического заголовка сохранять `getText(sourceFile)`, чтобы параметризованный сценарий не исчез из карты. Направление определять только по basename; остальные имена файлов отмечать как `standalone`.

- [ ] **Step 6: Написать падающие тесты аудита**

Проверить ошибки для: отсутствующего `id`, дубликата, `pending` при `requireComplete: true`, пустого `behavior`, несуществующего `targetPath`, отсутствующего `targetTitle` в тексте целевого теста и `obsolete-internal` без конкретного `justification`. Также проверить успешную карту с `migrated` и обоснованным `obsolete-internal`.

Run: `pnpm --filter @nkdk/core exec vitest run scripts/conversion-test-migration/auditMap.test.ts`

Expected: FAIL — модуль `auditMap.ts` ещё отсутствует.

- [ ] **Step 7: Реализовать сборку и аудит карты**

`buildMap.ts` принимает `--range origin/develop..HEAD`, перечитывает историю, сохраняет существующие заполненные поля по `id`, а новым строкам ставит `pending`. Целевой путь вычислять только для четырёх парных имён:

```ts
const targetName: Record<Exclude<Direction, "standalone">, string> = {
  fromXML: "fromXMLToYAML.test.ts",
  toYAML: "fromXMLToYAML.test.ts",
  fromYAML: "fromYAMLToXML.test.ts",
  toXML: "fromYAMLToXML.test.ts",
}
```

Для `standalone` исходный путь остаётся предлагаемым целевым путём. `auditMap.ts` сравнивает полный набор `id` с повторно извлечённым набором и применяет проверки Step 6.

- [ ] **Step 8: Построить исходную карту feature-ветки**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/buildMap.ts --range origin/develop..HEAD
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --range origin/develop..HEAD --allow-pending
```

Expected: карта содержит все события удаления, включая сценарии из 47 параметризованных/нестандартных файлов; аудит сообщает точное число строк и `0 missing source scenarios`.

- [ ] **Step 9: Проверить инструменты и зафиксировать коммит**

Run: `pnpm --filter @nkdk/core exec vitest run scripts/conversion-test-migration`

Expected: PASS.

```bash
git add packages/core/scripts/conversion-test-migration
git commit -m "test: 🧪 добавить карту переноса тестов преобразований"
```

---

### Task 2: Помощники настоящих единых преобразований

**Files:**
- Create: `packages/core/tests/directConversion.ts`
- Create: `packages/core/tests/directConversion.test.ts`
- Modify: `packages/core/scripts/conversion-test-migration/migration-map.json`

**Interfaces:**
- Produces: `testPropertyFromXMLToYAML(params): { yaml: unknown; indexes: LocalIndexes }`.
- Produces: `testPropertyFromYAMLToXML(params): { xml: Record<string, unknown>; externalWrites: readonly ExternalWrite[] }`.
- Produces: `testMetadataItemFromXMLToYAML(params): { yaml: unknown; indexes: LocalIndexes }`.
- Produces: `testMetadataItemFromYAMLToXML(params): { xml: Record<string, unknown>; externalWrites: readonly ExternalWrite[] }`.
- Produces: `testAppliedObjectFromXMLToYAML(params): { yaml: unknown; indexes: LocalIndexes }` с чтением существующей XML-фикстуры.
- Produces: `testAppliedObjectFromYAMLToXML(params): { result: string; expected: string; externalWrites: readonly ExternalWrite[] }` с reference XML из той же фикстуры.
- Produces: `readAppliedObjectFixture(importMetaUrl, fixture): Record<string, unknown>` и `serializeDirectXML(xml): string`.

- [ ] **Step 1: Написать падающий тест порядка атомарных вызовов**

Зарегистрировать тестовый property type, где `importFromXML` возвращает `{ parsed: value }`, `exportToYAML` превращает его в строку, а обратная пара делает симметричное преобразование. Через помощники проверить вызовы `fromXML → toYAML` и `fromYAML → toXML`, итоговые YAML/XML, собранные индексы и внешние записи.

Run: `pnpm --filter @nkdk/core exec vitest run tests/directConversion.test.ts`

Expected: FAIL — `directConversion.ts` ещё отсутствует.

- [ ] **Step 2: Реализовать property-помощники**

`testPropertyFromXMLToYAML` должен создать `createLocalIndexesCollector()`, передать его как `traversal.collector` в `importPropertiesFromXMLToYAML` и вернуть `collector.finish()`. `testPropertyFromYAMLToXML` должен вызвать `convertPropertiesFromYAMLToXML` с одним output `owner` и вернуть `result.outputs.get("owner")!` вместе с `externalWrites`.

- [ ] **Step 3: Написать падающий тест metadata-item и XMLRoot**

Использовать правило с `XMLRoot`, `xsiType`, именем элемента и неизвестным полем reference XML. Проверить, что XML→YAML читает тело, YAML→XML возвращает полный `MetaDataObject`, сохраняет неизвестное поле reference и не создаёт объект старой metadata-модели.

Run: `pnpm --filter @nkdk/core exec vitest run tests/directConversion.test.ts`

Expected: FAIL на проверке полного корня до реализации item-помощников.

- [ ] **Step 4: Реализовать metadata-item и fixture-помощники**

XML→YAML вызывает `importMetadataItemFromXMLToYAML`; YAML→XML — `convertMetadataItemFromYAMLToXML`. Обёртки applied object читают XML через существующую `readAndParseXMLFixture`, сохраняют полный reference XML и сравнивают сериализацию через `xmlExport`. Приведение парсинга к `Record<string, unknown>` допускается только в `readAppliedObjectFixture` после проверки, что значение является объектом.

- [ ] **Step 5: Проверить и зафиксировать коммит**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run tests/directConversion.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

```bash
git add packages/core/tests/directConversion.ts packages/core/tests/directConversion.test.ts packages/core/scripts/conversion-test-migration/migration-map.json
git commit -m "test: 🧪 добавить помощники единых преобразований"
```

---

### Task 3: Orchestration-сценарии

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromYAMLToXML.test.ts`
- Modify or Create: standalone targets listed by the map under `packages/core/metadata/orchestration/**`
- Modify: `packages/core/scripts/conversion-test-migration/migration-map.json`
- Modify only after a failing migrated test: `packages/core/metadata/orchestration/**/*.ts`

**Interfaces:**
- Consumes: четыре помощника из Task 2 и `MigrationRow[]` из Task 1.
- Produces: карта без `pending`-строк слоя `orchestration`.

- [ ] **Step 1: Получить точный список строк слоя и убедиться, что аудит красный**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer orchestration
```

Expected: FAIL с перечнем всех `pending`-сценариев семи удалённых файлов; ни один сценарий не должен быть скрыт группировкой по файлу.

- [ ] **Step 2: Перенести property-сценарии**

Для каждой строки старых `property/fromXML.test.ts`, `property/toYAML.test.ts`, `property/fromYAML.test.ts`, а также самостоятельных `metadataTargetString.test.ts` проверить уже существующий единый тест. Если конечное поведение не проверяется, добавить отдельный `it` с исходными входами и утверждениями над итоговым YAML/XML, вызовами атомарных обработчиков, путями диагностики, индексами и reference XML. В карте записать конкретное поведение, точный новый заголовок и `migrated`; проверки только внутренней модели отметить `obsolete-internal` с названием удалённого типа/поля.

- [ ] **Step 3: Запустить property-тесты и исправить только обнаруженные разрывы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: PASS. Если новый сценарий падает, сначала сохранить его как регрессионный, затем внести минимальную правку в прямой обход или атомарный обработчик; старые `importPropertiesFromYAML`/`exportPropertiesToXML` не создавать.

- [ ] **Step 4: Перенести metadataItem и metadataCollection**

Повторить процедуру Step 2 для старых `metadataItem/toXML.test.ts`, `metadataItem/yamlInline.test.ts` и `metadataCollection/ruleFactory.test.ts`. Сохранить утверждения о yamlInline, XMLRoot, xsi:type, коллекциях, именах элементов, пустых значениях, нескольких источниках/выходах и reference XML.

- [ ] **Step 5: Проверить слой и завершить его карту**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer orchestration
pnpm --filter @nkdk/core test
```

Expected: PASS; `pending=0`, `missing=0` для orchestration.

- [ ] **Step 6: Зафиксировать коммит**

```bash
git add packages/core/metadata/orchestration packages/core/scripts/conversion-test-migration/migration-map.json
git commit -m "test: 🧪 восстановить тесты единой оркестрации"
```

---

### Task 4: CommonObjects-сценарии

**Files:**
- Create or Modify: целевые `packages/core/metadata/commonObjects/**/fromXMLToYAML.test.ts`, вычисленные картой для прежних `fromXML.test.ts` и `toYAML.test.ts`.
- Create or Modify: целевые `packages/core/metadata/commonObjects/**/fromYAMLToXML.test.ts`, вычисленные картой для прежних `fromYAML.test.ts` и `toXML.test.ts`.
- Create or Modify: самостоятельные цели прежних `syncExternal*.test.ts`, `roundTrip*.test.ts` и иных `standalone`-строк внутри `commonObjects`.
- Modify: `packages/core/scripts/conversion-test-migration/migration-map.json`
- Modify only after a failing migrated test: соответствующий `packages/core/metadata/commonObjects/**/{rules,types,register,fromXMLToYAML,fromYAMLToXML}.ts`

**Interfaces:**
- Consumes: property/item-помощники из Task 2.
- Produces: карта без `pending`-строк слоя `commonObjects`.

- [ ] **Step 1: Зафиксировать красный аудит commonObjects**

Run: `pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer commonObjects`

Expected: FAIL с 147 удалёнными файлами, разложенными на отдельные сценарии.

- [ ] **Step 2: Перенести обычные commonObjects по каталогам**

Обрабатывать каталоги в лексикографическом порядке, исключив пока `dataCompositionSystem`. Для каждого каталога:

1. Вывести все его строки карты.
2. Объединить старые XML→модель и модель→YAML ожидания в наблюдаемый YAML; объединить YAML→модель и модель→XML ожидания в наблюдаемый XML.
3. Сохранить каждый самостоятельный граничный случай отдельным `it`, включая `undefined`, пустые коллекции, defaultValue, алиасы, ссылки, порядок и ошибки.
4. Для атомарного файла, который уже существует и вызывает атомарный обработчик напрямую, оставить тест на месте и сослаться на него в карте; не оборачивать его искусственно в object-тест.
5. Выполнить `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects` и только после PASS отметить строки каталога `migrated`. Команда намеренно запускает весь слой, чтобы не подставлять вручную вычисленные пути из карты.

Expected: каждый каталог независимо зелёный; XML-фикстуры не изменены.

- [ ] **Step 3: Перенести поддерево dataCompositionSystem**

Выполнить ту же процедуру отдельно для `packages/core/metadata/commonObjects/dataCompositionSystem/**`, сохранив параметризованные случаи и точные утверждения о типизированных значениях, порядке, фильтрах, полях, настройках и вложенных структурах. Существующие атомарные тесты `fromYAML.test.ts`/`toXML.test.ts`, изменённые ранее на прямой вызов обработчика, не переименовывать.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem`

Expected: PASS.

- [ ] **Step 4: Восстановить самостоятельные commonObjects-интеграции**

Перенести `childFormNames/syncExternalFromXML.test.ts`, `recalculation/syncExternal.test.ts` и все прочие `standalone`-строки карты на текущие публичные операции. Проверять не промежуточную модель, а созданные YAML/XML и внешние файлы/действия.

- [ ] **Step 5: Проверить полноту слоя и весь core**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer commonObjects
pnpm --filter @nkdk/core test
git diff --name-only origin/develop...HEAD -- 'packages/core/metadata/commonObjects/**/__fixtures__/*.xml'
```

Expected: аудит PASS с `pending=0`, core PASS, последняя команда не показывает изменённых XML-фикстур.

- [ ] **Step 6: Зафиксировать коммит**

```bash
git add packages/core/metadata/commonObjects packages/core/scripts/conversion-test-migration/migration-map.json
git commit -m "test: 🧪 восстановить единые тесты общих объектов"
```

---

### Task 5: AppliedObjects-сценарии

**Files:**
- Create or Modify: целевые `packages/core/metadata/appliedObjects/**/fromXMLToYAML.test.ts` из строк прежних `fromXML.test.ts` и `toYAML.test.ts`.
- Create or Modify: целевые `packages/core/metadata/appliedObjects/**/fromYAMLToXML.test.ts` из строк прежних `fromYAML.test.ts` и `toXML.test.ts`.
- Create or Modify: самостоятельные цели прежних `convertFromXML.test.ts`, `syncExternal*.test.ts`, `roundTrip*.test.ts` и иных `standalone`-строк внутри `appliedObjects`.
- Modify: `packages/core/scripts/conversion-test-migration/migration-map.json`
- Modify only after a failing migrated test: соответствующий `packages/core/metadata/appliedObjects/**/{rules,register,fromXMLToYAML,fromYAMLToXML,syncToXML}.ts`

**Interfaces:**
- Consumes: metadata-item и fixture-помощники из Task 2.
- Produces: карта без `pending`-строк слоя `appliedObjects`.

- [ ] **Step 1: Зафиксировать красный аудит appliedObjects**

Run: `pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer appliedObjects`

Expected: FAIL с 169 удалёнными файлами, разложенными на отдельные сценарии.

- [ ] **Step 2: Перенести каждый applied object в обоих направлениях**

Обрабатывать каталоги лексикографически. Для каждой XML-фикстуры объединить прежние проверки так:

```ts
it("преобразует full.xml в полный YAML", () => {
  const { yaml } = testAppliedObjectFromXMLToYAML({
    rule: MetadataObjectRules,
    importMetaUrl: import.meta.url,
    fixture: "full.xml",
  })
  expect(yaml).toEqual(fullYAML)
})

it("преобразует полный YAML в full.xml", () => {
  const { result, expected } = testAppliedObjectFromYAMLToXML({
    rule: MetadataObjectRules,
    importMetaUrl: import.meta.url,
    fixture: "full.xml",
    yaml: fullYAML,
  })
  expect(result).toBe(expected)
})
```

Названия `MetadataObjectRules`, `fullYAML` и fixture заменять реальными экспортами конкретного каталога. Дополнительные старые сценарии не поглощать двумя fixture-тестами: ограничения типов, ошибки, ссылки, short format, default и sparse случаи должны остаться отдельными утверждениями над конечным YAML/XML.

- [ ] **Step 3: После каждого каталога запускать его тесты**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects`

Expected: PASS после каждого завершённого каталога. Команда намеренно проверяет весь слой; при несовпадении XML не обновлять fixture, а локализовать разрыв в едином обходе/rules/атомарном обработчике и добавить минимальную производственную правку.

- [ ] **Step 4: Перенести appliedObjects-интеграции**

Для каждой строки `convertFromXML`, sync, round-trip и external sync использовать текущие публичные `prepareYaml`, `syncToXML` либо соответствующую операцию объекта. Сохранить сравнения содержимого файлов, дерева элементов, UUID, ConfigDumpInfo, зависимостей, нескольких XML-файлов и диагностик. Если сценарий уже полностью покрыт существующим `syncToXML.test.ts`, указать точный заголовок этого теста в карте.

- [ ] **Step 5: Проверить полноту слоя и core**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer appliedObjects
pnpm --filter @nkdk/core test
git diff --name-only origin/develop...HEAD -- 'packages/core/metadata/appliedObjects/**/__fixtures__/*.xml'
```

Expected: аудит PASS с `pending=0`, core PASS, XML-фикстуры не изменены.

- [ ] **Step 6: Зафиксировать коммит**

```bash
git add packages/core/metadata/appliedObjects packages/core/scripts/conversion-test-migration/migration-map.json
git commit -m "test: 🧪 восстановить единые тесты прикладных объектов"
```

---

### Task 6: Формы и элементы форм

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Create or Modify: `packages/core/metadata/forms/commonObjects/**/fromXMLToYAML.test.ts`
- Create or Modify: `packages/core/metadata/forms/commonObjects/**/fromYAMLToXML.test.ts`
- Create or Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Create or Modify: `packages/core/metadata/forms/elements/__tests__/fromYAMLToXML.test.ts`
- Restore under current names: standalone reference/tree/singleton targets selected by the map in `packages/core/metadata/forms/elements/**`
- Modify: `packages/core/scripts/conversion-test-migration/migration-map.json`
- Modify only after a failing migrated test: соответствующий `packages/core/metadata/forms/**/*.ts`

**Interfaces:**
- Consumes: прямые property/item-помощники и публичные form-операции.
- Produces: карта без `pending`-строк слоя `forms`.

- [ ] **Step 1: Зафиксировать красный аудит forms**

Run: `pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer forms`

Expected: FAIL с 32 удалёнными файлами, разложенными на отдельные сценарии.

- [ ] **Step 2: Дополнить clientApplicationForm**

Перенести все сценарии из старых `convertFromXML`, `fromXML`, `toYAML`, `fromYAML`, `toXML` в два текущих direct-файла. Сохранить проверки нескольких XML-частей формы, дерева элементов, атрибутов, команд, событий, внешних модулей, порядка и reference XML.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

Expected: PASS.

- [ ] **Step 3: Перенести form commonObjects и общие element-сценарии**

Для `childItems`, `dynamicList`, `formAttribute`, `formCommand` и `elements/__tests__` создать два направленных direct-файла. Проверять конечное дерево YAML либо XML; старые массивы промежуточных элементов не сравнивать буквально, но сохранить их порядок, имена, типы и вложенность в конечном результате.

- [ ] **Step 4: Восстановить самостоятельные reference-сценарии элементов**

Перенести `preserveAutoColorFromReferenceXML`, `preserveFromReferenceXML`, `singletonNameReference`, `singletonNonCanonicalNameReference`, `treeYAML` и прочие standalone-строки. Каждый тест должен вызвать единый обход формы/элемента и проверить исходное наблюдаемое свойство в конечном YAML/XML.

- [ ] **Step 5: Проверить слой и зафиксировать коммит**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --layer forms
pnpm --filter @nkdk/core test
git diff --name-only origin/develop...HEAD -- 'packages/core/metadata/forms/**/__fixtures__/*.xml'
```

Expected: PASS, `pending=0`, XML-фикстуры не изменены.

```bash
git add packages/core/metadata/forms packages/core/scripts/conversion-test-migration/migration-map.json
git commit -m "test: 🧪 восстановить единые тесты форм"
```

---

### Task 7: Оставшиеся самостоятельные сценарии и атомарная граница

**Files:**
- Create or Modify: цели всех оставшихся `standalone`-строк карты, включая `packages/core/metadata/configurationIndex/referenceView.test.ts`.
- Modify: существующие атомарные `packages/core/metadata/commonObjects/**/{fromXML,toYAML,fromYAML,toXML}.test.ts` только если карта ссылается на уже сохранённое атомарное поведение.
- Modify: `packages/core/scripts/conversion-test-migration/migration-map.json`

**Interfaces:**
- Consumes: полная карта предыдущих задач.
- Produces: глобальная карта без `pending` и с обоснованием каждого `obsolete-internal`.

- [ ] **Step 1: Вывести все оставшиеся строки и получить красный аудит**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --remaining
```

Expected: FAIL, если хотя бы одна строка любого слоя ещё `pending`, не имеет цели или ссылается на отсутствующий заголовок.

- [ ] **Step 2: Перенести оставшиеся интеграционные проверки**

Для `configurationIndex/referenceView.test.ts` и каждого remaining target восстановить исходные наблюдаемые утверждения через текущий публичный путь. Проверки индексов и ссылочных представлений должны сравнивать итоговый индекс/представление, а не старый metadata-объект.

- [ ] **Step 3: Проверить решения obsolete-internal**

Для каждой такой строки открыть старый тест из `parentCommit:sourcePath` и убедиться, что он проверял только удалённую функцию, тип или поле модели. В `justification` указать точное имя удалённого API/поля и почему конечный YAML/XML не имеет отдельного наблюдаемого поведения. Если в тесте есть хотя бы одно наблюдаемое значение, перевести строку в `migrated` и добавить соответствующую проверку.

- [ ] **Step 4: Проверить атомарные тесты**

Убедиться, что существующие атомарные тесты вызывают зарегистрированные обработчики напрямую, например `callAtomicFromYAML`/`callAtomicToXML`, а не удалённые общие property/item/collection-операции. Не объединять атомарные тесты между собой.

Run:

```bash
rg 'importPropertiesFromYAML|exportPropertiesToXML|importMetadataItemFromYAML|exportMetadataItemToXML' packages/core --glob '*.test.ts'
```

Expected: нет обращений к удалённой общей оркестрации; допустимы только названия, являющиеся частью текущего прямого API.

- [ ] **Step 5: Завершить карту и зафиксировать коммит**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --range origin/develop..HEAD --complete
pnpm --filter @nkdk/core test
```

Expected: PASS; `missing=0`, `extra=0`, `pending=0`, каждый target существует и содержит указанный test title.

```bash
git add packages/core/metadata packages/core/scripts/conversion-test-migration/migration-map.json
git commit -m "test: 🧪 завершить перенос сценариев преобразований"
```

---

### Task 8: Итоговая проверка ветки

**Files:**
- Modify only if verification finds an issue: corresponding test, map row, direct traversal, `rules.ts`, or atomic handler.
- Do not modify: any existing XML fixture.

**Interfaces:**
- Consumes: завершённую карту и весь восстановленный набор тестов.
- Produces: проверенную ветку, готовую вернуться к прерванному finish-pr-cycle.

- [ ] **Step 1: Повторно построить инвентарь без потери заполненных решений**

Run:

```bash
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/buildMap.ts --range origin/develop..HEAD --check
pnpm --filter @nkdk/core exec tsx scripts/conversion-test-migration/auditMap.ts --range origin/develop..HEAD --complete
```

Expected: карта не меняется; аудит PASS.

- [ ] **Step 2: Проверить отсутствие legacy-оркестрации и изменений XML-фикстур**

Run:

```bash
rg 'importPropertiesFromYAML|exportPropertiesToXML|importMetadataItemFromYAML|exportMetadataItemToXML' packages/core
git diff --name-only origin/develop...HEAD -- '*.xml'
```

Expected: первый поиск не находит удалённых общих операций; второй не показывает изменённых существующих XML-фикстур.

- [ ] **Step 3: Запустить статические проверки**

Run:

```bash
pnpm --filter @nkdk/core type-check
git diff --check
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 4: Запустить весь проект**

Run: `pnpm test`

Expected: PASS во всех пакетах `packages/*`.

- [ ] **Step 5: Зафиксировать только реальные исправления итоговой проверки**

Если Steps 1–4 не изменили дерево, коммит не создавать. Если потребовались исправления:

```bash
git add packages/core
git commit -m "test: 🧪 завершить проверку единых преобразований"
```

- [ ] **Step 6: Подготовить отчёт перед возобновлением PR-цикла**

Сообщить: число исходных сценариев; число `migrated`; число `obsolete-internal` с кратким перечнем причин; количество новых direct-файлов; результаты core, полного `pnpm test`, type-check, аудита карты и `git diff --check`. PR-цикл не возобновлять без отдельного подтверждения пользователя.
