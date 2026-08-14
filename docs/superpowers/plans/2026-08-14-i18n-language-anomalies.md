# I18n Language Anomalies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять в YAML незарегистрированные языки, исходный неканонический порядок и поддержанные дубли `v8:item`, проверяя их тегами `!xml/language`, `!xml/order` и `!xml/duplicate` с обязательным реестром языков конфигурации.

**Architecture:** `ConfigurationContext` получает неизменяемый `languages` вместо отдельного `defaultLanguage`; concrete-сборщики конфигурации строят реестр до XML-import, YAML→XML и полной validation, а нейтральные слои только передают его. Runtime YAML хранит scalar-теги существующим sidecar и добавляет отдельный mapping-sidecar; предметная классификация, свёртка и диагностики остаются в `commonObjects/i8nText`. Инвалидация ProjectState остаётся общей: файл публикует зависимость от ключа контекста `languages`, а refresh повторно проверяет только такие файлы при изменении версии реестра.

**Tech Stack:** TypeScript 7, Node.js 26, js-yaml 5.2, TypeBox, Vitest, Piscina, LMDB, NKDK compiled runtime.

## Global Constraints

- Не изменять существующие XML-фикстуры: они остаются источником истины.
- `!xml/language` и `!xml/duplicate` допустимы только на scalar текста языка; `!xml/order` — только на mapping локализованной строки без payload.
- Канонический XML-порядок: присутствующий основной язык первым, затем остальные фактически присутствующие коды по возрастанию кода без системной локали; поддержанный дубль считается одной позицией.
- Строки с пустым `v8:lang` или `v8:lang` равным `#` полностью исключаются из новой классификации.
- Ровно два соседних одинаковых элемента зарегистрированного языка представляются `!xml/duplicate`; остальные повторы останавливают XML-import.
- JSON Schema проверяет только форму значений; регистрацию и порядок проверяет существующий рекурсивный обход rules во время первого прохода validation.
- Проверка порядка выполняется за `O(k)` без сортировки; поиск регистрации — через `ReadonlySet` за `O(1)`.
- Изменение реестра повторно проверяет только файлы, объявившие зависимость от `languages`.
- Базовые типы `BasePropertyRule` и `PropertyRule` не получают новых полей; используется существующий `excludeIfEqualNameYAML`.
- Профиль выполняется compiled-runtime инструментом на одной временной копии `e2e/fixtures/nkdk` без пользовательской `.nkdk`; результаты не коммитятся.
- После каждого слоя выполнить `pnpm duplicates -- --base 13ba5eac5`; перед завершением — `pnpm test`, `pnpm test:e2e`, `pnpm test:architecture:rules` и `pnpm test:architecture` вне песочницы там, где требуется LMDB.

---

### Task 1: Актуализировать validation-profile и зафиксировать baseline

**Files:**
- Modify: `.agents/skills/validation-profile/SKILL.md`
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`
- Modify: `.agents/skills/validation-profile/validation-profile.test.mjs`
- Create: `packages/rules/metadata/composition/validationProfile.ts`
- Modify: `packages/rules/scripts/build.mjs`
- Modify: `packages/rules/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: отдельную composition-точку production build `packages/rules/dist/validationProfile.js` и `packages/rules/dist/worker.js` пакета `@nkdk/rules`; корневой экспорт пакета не расширяется.
- Produces: неизменённый CLI `node .agents/skills/validation-profile/validation-profile.mjs <yaml-dir> ...`, работающий после переименования `packages/core` в `packages/rules`.

- [x] **Step 1: Добавить падающий контракт текущего пути production build**

В `validation-profile.test.mjs` импортировать экспортируемый helper пути и проверить:

```js
test("compiled runtime загружается из packages/rules", () => {
  assert.equal(compiledRuntimePaths(repoRoot).profile, resolve(repoRoot, "packages/rules/dist/validationProfile.js"))
  assert.equal(compiledRuntimePaths(repoRoot).worker, resolve(repoRoot, "packages/rules/dist/worker.js"))
})
```

- [x] **Step 2: Подтвердить RED**

Run: `node --test .agents/skills/validation-profile/validation-profile.test.mjs`

Expected: FAIL, потому что отдельная compiled-точка профильного runtime ещё не существует.

- [x] **Step 3: Перевести runner и документацию на текущий пакет**

В `validation-profile.mjs` определить и использовать:

```js
export function compiledRuntimePaths(root) {
  return {
    profile: resolve(root, "packages/rules/dist/validationProfile.js"),
    worker: resolve(root, "packages/rules/dist/worker.js"),
  }
}
```

Добавить `validationProfile.ts`, который собирает `metadataRules`, четыре compiled worker URL и экспортирует фабрику runtime вместе с `createValidationProfileResult`. Низкоуровневую профильную актуализацию выполнять в экземплярном rule-контексте, который обычная валидация получает через runtime API. Добавить эту точку в production build, external `lmdb` и прямую зависимость пакета. Заменить команды и сообщения runner на `pnpm --filter @nkdk/rules build`, не меняя формат результата профиля.

- [x] **Step 4: Проверить инструмент**

Run: `node --test .agents/skills/validation-profile/validation-profile.test.mjs`

Expected: PASS.

- [x] **Step 5: Подготовить временный профильный проект и baseline**

Создать временный каталог через `mktemp -d`, скопировать в него содержимое `e2e/fixtures/nkdk` без `.nkdk`, затем выполнить:

```bash
pnpm --filter @nkdk/rules build
node .agents/skills/validation-profile/validation-profile.mjs <temp-project> --runs 3 --timing --json
```

Сохранить JSON только в `/private/tmp/nkdk-i18n-validation-baseline.json`; записать путь временного проекта в `/private/tmp/nkdk-i18n-validation-project-path.txt`. Не добавлять оба файла в git.

- [x] **Step 6: Проверить дубли и закоммитить слой**

Run: `pnpm duplicates -- --base 13ba5eac5`

```bash
git add .agents/skills/validation-profile
git commit -m "fix: :wrench: актуализировать профиль validation"
```

### Task 2: Добавить scalar- и mapping-теги языковых аномалий в runtime YAML

**Files:**
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Create: `packages/runtime/yaml/mappingTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.test.ts`
- Modify: `packages/runtime/index.ts`

**Interfaces:**
- Consumes: существующие `markYAMLScalarTag`, `copyYAMLScalarTags`, `taggedYAMLScalar` и js-yaml `defineMappingTag`.
- Produces: `XMLAnomalyTag` с `xml/language | xml/duplicate`; тип `YAMLMappingTag = "xml/order"`; функции `markYAMLMappingTag(value, tag)`, `yamlMappingTagOf(value)`, `copyYAMLMappingTag(source, target)` и внутренний tagged mapping carrier.

- [x] **Step 1: Написать RED-тесты scalar-тегов**

Добавить к таблицам parser/export случаи:

```ts
Заголовок:
  en: !xml/language Buttons
  ru: !xml/duplicate Группа
```

Проверить `yamlScalarTagAt(Заголовок, "en") === "xml/language"`, `yamlScalarTagAt(..., "ru") === "xml/duplicate"` и точную обратную сериализацию.

- [x] **Step 2: Написать RED-тесты mapping-sidecar**

```ts
const parsed = parseMetadataYaml("Заголовок: !xml/order\n  en: Text\n  ru: Текст\n")
expect(yamlMappingTagOf(parsed.data.Заголовок)).toBe("xml/order")

const copied = { ...parsed.data.Заголовок }
copyYAMLMappingTag(parsed.data.Заголовок, copied)
expect(serializeYAMLDocument({ Заголовок: copied }).text)
  .toBe("Заголовок: !xml/order\n  en: Text\n  ru: Текст")
```

Также проверить, что `!xml/order payload` и применение `!xml/order` к scalar/sequence дают синтаксическую ошибку.

- [x] **Step 3: Подтвердить RED**

Run: `pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts`

Expected: FAIL с неизвестными тегами и отсутствующими mapping-sidecar API.

- [x] **Step 4: Реализовать scalar-категории и mapping-sidecar**

Расширить закрытый список:

```ts
export const XML_ANOMALY_TAGS = [
  "xml/present", "xml/absent", "xml/name", "xml/type", "xml/value", "xml/reference",
  "xml/language", "xml/duplicate",
] as const
```

В `mappingTags.ts` хранить тег в `WeakMap<object, YAMLMappingTag>`. `defineMappingTag("!xml/order", ...)` должен создавать обычный insertion-ordered object, маркировать его при `finalize`, а `represent` возвращать `new Map(Object.entries(value))`.

- [x] **Step 5: Перенести mapping-sidecar через parse, dump и копии**

В `visitYamlData` после рекурсивной подготовки mapping копировать тег с carrier на итоговый object. В `prepareForDump` копировать тег с предметного object на `dumpValue` и `data`, чтобы js-yaml выбрал `!xml/order` только по sidecar; payload в предметной модели не добавлять.

- [x] **Step 6: Проверить runtime и типы**

Run: `pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts`

Run: `pnpm --filter @nkdk/runtime exec tsc --noEmit`

Expected: PASS.

- [x] **Step 7: Проверить дубли и закоммитить слой**

Run: `pnpm duplicates -- --base 13ba5eac5`

```bash
git add packages/runtime/yaml packages/runtime/index.ts
git commit -m "feat: :label: добавить языковые XML-теги"
```

### Task 3: Ввести обязательный реестр языков и concrete-сборщики

**Files:**
- Modify: `packages/runtime/metadata/context/types.ts`
- Modify: `packages/runtime/metadata/helpers/excludeIfEqualNameYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/jsonSchemaRefs.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/schemaRuntime.ts`
- Create: `packages/rules/metadata/appliedObjects/configuration/languageRegistry.ts`
- Create: `packages/rules/metadata/appliedObjects/configuration/languageRegistry.test.ts`
- Modify: `packages/rules/metadata/operations/context.ts`
- Modify: all production and test context literals found by `rg -l "defaultLanguage" packages`

**Interfaces:**
- Produces:

```ts
export interface ConfigurationLanguages {
  readonly default: string
  readonly registered: readonly string[]
  readonly registeredSet: ReadonlySet<string>
  readonly version: string
}

export interface ConfigurationContext {
  readonly languages: ConfigurationLanguages
  readonly version: string
  // existing optional operation fields
}

export function createConfigurationLanguages(params: {
  default: string
  registered: readonly string[]
}): ConfigurationLanguages
```

- Consumes: `Configuration.xml` (`DefaultLanguage`, `ChildObjects/Language`) и `Languages/<Имя>.xml` (`LanguageCode`), либо `Конфигурация.yaml` (`ОсновнойЯзык`) и `Язык/*.yaml` (`КодЯзыка`).

- [x] **Step 1: Написать RED-тесты инвариантов реестра**

Проверить успешный `default=ru, registered=[ru,en]` и ошибки для пустого/повторного кода, отсутствующего основного объекта, двух объектов с именем основного языка и основного кода вне registered. Проверить стабильную `version` как `JSON.stringify([default, [...registered].sort(codeCompare)])`, чтобы не добавлять криптографию в runtime.

- [x] **Step 2: Написать RED-тесты XML- и YAML-сборщиков**

Во временных каталогах создать минимальные файлы без изменения fixture:

```xml
<DefaultLanguage>Language.Русский</DefaultLanguage>
<Language>Русский</Language><Language>Английский</Language>
```

```yaml
ОсновнойЯзык: Русский
# Язык/Русский.yaml: КодЯзыка: ru
# Язык/Английский.yaml: КодЯзыка: en
```

Ожидать одинаковый реестр и диагностичную ошибку с путём файла при каждом нарушенном инварианте.

- [x] **Step 3: Подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/appliedObjects/configuration/languageRegistry.test.ts`

Expected: FAIL, модуль отсутствует.

- [x] **Step 4: Реализовать неизменяемый реестр**

`createConfigurationLanguages` обязан копировать и замораживать `registered`, создать `ReadonlySet`, проверить инварианты и вычислить стабильную `version`. Сборщики читают только необходимые поля существующим XML/YAML parser и не запускают полный import/validation.

- [x] **Step 5: Мигрировать контекст без совместимого alias**

Заменить `context.defaultLanguage` на `context.languages.default` во всём production-коде и тестах. `defaultMetadataOperationsContext()` временно создаёт полный реестр `ru/[ru]`; внешние API больше не принимают отдельный `defaultLanguage`.

JSON Schema cache key использует только `languages.default`, потому что схема не зависит от registered; `languages.version` в ключ схемы не добавлять.

- [x] **Step 6: Проверить отсутствие старого поля и целевые тесты**

Run: `rg -n "\\.defaultLanguage\\b|Pick<ConfigurationContext, \"defaultLanguage\">" packages --glob '!**/*.map'`

Expected: нет обращений к старому полю контекста; одноимённое предметное свойство `Configuration.defaultLanguage` и имена legacy-fixture не затрагиваются.

Run: `pnpm --filter @nkdk/runtime test`

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit --project core-metadata metadata/commonObjects/i8nText metadata/commonObjects/formattedI8nText metadata/context metadata/composition/runtimeSchemaContract.test.ts`

Expected: PASS.

- [x] **Step 7: Проверить дубли и закоммитить слой**

Run: `pnpm duplicates -- --base 13ba5eac5`

```bash
git add packages/runtime packages/rules packages/mcp
git commit -m "refactor: :recycle: ввести реестр языков конфигурации"
```

### Task 4: Классифицировать порядок, незарегистрированные языки и дубли в I8nText

**Files:**
- Create: `packages/rules/metadata/commonObjects/i8nText/anomalies.ts`
- Create: `packages/rules/metadata/commonObjects/i8nText/anomalies.test.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/fromXML.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/toXML.ts`
- Modify: corresponding `fromXML.test.ts`, `toYAML.test.ts`, `fromYAML.test.ts`, `toXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/formattedI8nText/{fromXML,toYAML,fromYAML,toXML}.test.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts` — вернуть отсутствовавшие `toXML` contributions для I8nText и FormattedI8nText, без которых operation registry обходит эти exporters.

**Interfaces:**
- Consumes: `context.languages`, scalar-sidecar на `I8nText.items`, mapping-sidecar `xml/order`, `excludeIfEqualNameYAML`.
- Produces:

```ts
export function importLocalizedItems(params: {
  context: ConfigurationContext
  items: readonly I8nTextLanguageXML[]
}): Record<string, string>

export function exportLocalizedItems(params: {
  context: ConfigurationContext
  items: Record<string, string>
}): I8nTextLanguageXML[]

export function isCanonicalLanguageOrder(codes: readonly string[], defaultCode: string): boolean
```

- [x] **Step 1: Перенести матрицу спецификации в parameterized RED-тест XML → YAML**

Добавить все строки матрицы: канонические `ru→en`, отсутствующий основной, `en→ru`, зарегистрированные/незарегистрированные коды, `!xml/order + !xml/language`, обычные и сворачиваемые свойства. Проверять не только object, но и sidecar и точный `serializeYAMLDocument`.

- [x] **Step 2: Добавить RED-тесты дублей и неподдержанных XML**

Проверить:

```ts
ru, ru, en       -> ru: !xml/duplicate ... без !xml/order
en, ru, ru       -> !xml/order + ru: !xml/duplicate ...
ru, ru, ru       -> throw
ru:A, ru:B       -> throw
ru:A, en:B, ru:A -> throw
unregistered en,en -> throw
```

- [x] **Step 3: Добавить RED-тесты YAML → XML и свёртки**

Проверить два элемента для `!xml/duplicate`, сохранение insertion order при `!xml/order`, каноническую сортировку без тега, отсутствие `v8:item` для маркера `default: ""`, запрет восстановления имени при `!xml/order` и `!xml/duplicate`, восстановление имени только без запрещающего маркера.

- [x] **Step 4: Подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/i8nText metadata/commonObjects/formattedI8nText`

Expected: FAIL на новой матрице.

- [x] **Step 5: Реализовать линейную классификацию XML**

`importLocalizedItems` сначала возвращает исходное поведение без классификации, если встречен `""` или `"#"`. Иначе один линейный проход:

```ts
for (let index = 0; index < items.length;) {
  const current = items[index]!
  const next = items[index + 1]
  if (sameLanguage(current, next)) {
    if (!sameText(current, next) || items[index + 2]?.["v8:lang"] === current["v8:lang"])
      throw unsupportedDuplicate(...)
    if (!context.languages.registeredSet.has(current["v8:lang"])) throw unsupportedDuplicate(...)
    markYAMLScalarTag(result, current["v8:lang"], "xml/duplicate")
    index += 2
  } else {
    index += 1
  }
}
```

Повтор уже встреченного кода после другой позиции также отклонять. После свёртки определить порядок за `O(k)` и поставить mapping-sidecar только при неканоничности; незарегистрированные scalar пометить `xml/language`.

- [x] **Step 6: Реализовать экспорт YAML и XML**

При копировании `items` обязательно переносить оба sidecar. Без `xml/order` строить новый object: необходимый пустой default-маркер первым, затем явные коды через `Object.keys(...).sort(codeCompare)`; с тегом сохранять insertion order. `xml/duplicate` разворачивать в две одинаковые пары; пустой маркер пропускать.

- [x] **Step 7: Проверить I8nText и FormattedI8nText**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/i8nText metadata/commonObjects/formattedI8nText`

Expected: PASS для всей матрицы и прежних случаев.

- [x] **Step 8: Проверить дубли и закоммитить слой**

Run: `pnpm duplicates -- --base 13ba5eac5`

```bash
git add packages/rules/metadata/commonObjects/i8nText packages/rules/metadata/commonObjects/formattedI8nText
git commit -m "feat: :sparkles: сохранять языковые XML-аномалии"
```

### Task 5: Строить реестр до операций и валидировать YAML за существующий обход

**Files:**
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/rules/metadata/project/validateProject.ts`
- Modify: `packages/rules/metadata/project/validateProject.test.ts`
- Create: `packages/runtime/metadata/validation/localizedTextYAML.ts`
- Create: `packages/runtime/metadata/validation/localizedTextYAML.test.ts`
- Modify: `packages/runtime/metadata/validation/excludeIfEqualNameYAML.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/validation/excludeIfEqualNameYAML.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`
- Modify: `packages/runtime/metadata/context/types.ts`
- Modify: `packages/rules/metadata/workerPool/workerState.ts`
- Modify: `packages/rules/metadata/workerPool/workerState.test.ts`
- Modify: `packages/rules/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/rules/metadata/project/preparedYamlProjectWorker.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/types.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/toJSONSchema.ts`
- Create: `packages/rules/metadata/commonObjects/i8nText/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/commonObjects/formattedI8nText/types.ts`
- Modify: `packages/rules/metadata/commonObjects/formattedI8nText/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: concrete XML/YAML registry builders from Task 3 and existing recursive `validateExcludedEqualNameYAML` traversal.
- Produces: подготовленный `ConfigurationContext` до worker; `validateLocalizedTextYAMLProperty(...)` invoked inside that existing traversal; diagnostics at exact language paths.

- [x] **Step 1: Написать RED-интеграции обязательного реестра**

Проверить, что XML-import строит registry до создания worker pool; full sync и `validateProject` строят его из YAML до первого файла; пустой/повторный `КодЯзыка` и неразрешимый `ОсновнойЯзык` прекращают операцию до обработки локализованных строк.

- [x] **Step 2: Написать RED-таблицу semantic validation**

Для сворачиваемого и обычного rules проверить диагностики:

- незарегистрированный код без `!xml/language`;
- избыточный `!xml/language` у registered;
- `!xml/duplicate` у unregistered;
- неканонический порядок без `!xml/order`;
- избыточный `!xml/order` у канонического mapping;
- основной текст, равный вычисляемому имени, остаётся допустимым только при `!xml/order` или `!xml/duplicate`;
- пустой default-marker не первым;
- marker при `!xml/order`;
- пустое значение у несворачиваемого rules;
- строка с `#` или пустым ключом не получает новых diagnostics.

- [x] **Step 3: Подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/project/validateProject.test.ts metadata/validation/excludeIfEqualNameYAML.test.ts metadata/importFromXml/importConfiguration.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/validation/projectValidationPasses.integration.test.ts`

Expected: FAIL на отсутствующем построении реестра и языковых diagnostics.

- [x] **Step 4: Подготовить контекст в границах операций**

До запуска worker вызывать XML- или YAML-сборщик и заменять только `context.languages`. Нейтральные worker/pool получают готовый сериализуемый реестр; после structured clone восстанавливать `registeredSet` один раз при инициализации worker из `registered`.

- [x] **Step 5: Объединить языковую проверку с существующим обходом правил**

Расширить существующий рекурсивный валидатор сворачиваемых имён обработкой каждого `I8nText`/`FormattedI8nText` свойства в той же итерации `Object.values(rule.properties)`. Вынести только предметную функцию одного значения в runtime helper; не добавлять второй обход файла и не добавлять private-условия в `projectState`.

Проверка порядка использует insertion order и состояние:

```ts
let sawDefault = false
let previousOther: string | undefined
for (const code of effectiveCodes) {
  if (code === languages.default) {
    if (sawDefault || previousOther !== undefined) return false
    sawDefault = true
  } else if (previousOther !== undefined && previousOther >= code) {
    return false
  } else {
    previousOther = code
  }
}
return true
```

- [x] **Step 6: Проверить JSON Schema границы**

Добавить проверки, что обычная пользовательская схема по-прежнему принимает string/mapping и не кодирует список registered или порядок, а внутренняя схема принимает форму значений с sidecar только через parser/runtime. Пустой marker разрешён формой только у `excludeIfEqualNameYAML`.

- [x] **Step 7: Проверить операции и validation**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/project/validateProject.test.ts metadata/validation/excludeIfEqualNameYAML.test.ts metadata/importFromXml/importConfiguration.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/validation/projectValidationPasses.integration.test.ts metadata/project/preparedYamlProjectWorker.integration.test.ts`

Expected: PASS.

- [x] **Step 8: Проверить дубли и закоммитить слой**

Run: `pnpm duplicates -- --base 13ba5eac5`

```bash
git add packages/runtime/metadata/validation packages/rules/metadata/importFromXml packages/rules/metadata/fullSyncToXml packages/rules/metadata/project packages/rules/metadata/validation
git commit -m "feat: :white_check_mark: проверять языковые аномалии"
```

### Task 6: Инвалидировать только language-sensitive файлы

**Files:**
- Modify: `packages/rules/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/rules/metadata/projectState/contracts.ts`
- Modify: `packages/rules/metadata/projectState/fileUpdate.ts`
- Modify: `packages/rules/metadata/projectState/binary/fragment.ts`
- Modify: `packages/rules/metadata/projectState/binary/factTables.ts`
- Modify: `packages/rules/metadata/projectState/binary/layouts.ts`
- Modify: `packages/rules/metadata/projectState/binary/store.ts`
- Modify: `packages/rules/metadata/projectState/binary/store.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/rules/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/rules/metadata/projectState/refresh.ts`
- Modify: `packages/rules/metadata/projectState/refresh.test.ts`
- Modify: `packages/runtime/metadata/validation/excludeIfEqualNameYAML.ts`
- Create: `packages/rules/metadata/context/validationContextVersions.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts`
- Modify: `packages/rules/metadata/project/validateProject.ts`
- Modify: `packages/rules/metadata/project/validateProject.test.ts`
- Modify: `packages/rules/metadata/project/preparedYamlProject.integration.test.ts`
- Modify: `packages/rules/metadata/project/preparedYamlProjectWorker.integration.test.ts`
- Modify: `packages/rules/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`

**Interfaces:**
- Produces generic cache contract:

```ts
interface ProjectStateValidationContextDependency {
  readonly key: string
  readonly version: string
}

interface ProjectStateYamlFileUpdate {
  readonly validationContextDependencies?: readonly ProjectStateValidationContextDependency[]
}
```

- Consumes: текущая версия `context.languages.version`; worker публикует зависимость `{ key: "languages", version }` только если traversal встретил `I8nText` или `FormattedI8nText`.

- [x] **Step 1: Написать RED-тест выбора файлов при смене контекста**

Создать baseline из трёх файлов: один с I8nText, один без него, один изменённый по байтам. При новой `languages.version` ожидать повторную обработку первого и третьего, но не второго. При неизменной версии не перечитывать первые два.

- [x] **Step 2: Написать RED-тест двоичного round-trip зависимости**

Закодировать/прочитать fragment и проверить точное сохранение пары `languages/<version>` без изменения старых записей, у которых зависимость отсутствует.

- [x] **Step 3: Подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/projectState/refresh.test.ts metadata/projectState/binary metadata/project/preparedYamlProjectWorker.integration.test.ts`

Expected: FAIL, зависимость контекста пока не хранится.

- [x] **Step 4: Добавить общий механизм версии контекста**

Baseline reader возвращает сохранённые зависимости файла. `selectValidationFiles` сравнивает их с переданным общим `ReadonlyMap<string,string>` текущих версий; файл выбирается при изменении байтов, отсутствии файла или несовпадении любой объявленной версии. Код ProjectState не проверяет имя `languages` и не знает типы свойств.

- [x] **Step 5: Публиковать зависимость из существующего traversal**

Предметный валидатор увеличивает счётчик `localizedTextProperties`; first-pass worker добавляет зависимость `languages` только при значении больше нуля. Файл без локализованных свойств остаётся независимым от реестра.

- [x] **Step 6: Проверить cold/warm поведение**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/projectState metadata/project/preparedYamlProjectWorker.integration.test.ts`

Expected: PASS; тест явно проверяет `parsedYamlFiles` для трёх описанных случаев.

- [x] **Step 7: Проверить дубли и закоммитить слой**

Run: `pnpm duplicates -- --base 13ba5eac5`

```bash
git add packages/rules/metadata/projectState packages/rules/metadata/project/preparedYamlProjectWorker.ts packages/rules/metadata/project/preparedYamlProjectWorker.integration.test.ts
git commit -m "perf: :zap: точечно обновлять языковую validation"
```

### Task 7: Проверить реальные конфигурации, ограничения и полный проект

**Files:**
- Modify: `.agents/restrictions.md`
- Modify: `.agents/xml-anomalies.md`
- Create: `packages/rules/metadata/commonObjects/i8nText/roundTrip.integration.test.ts`
- Modify: snapshots/ожидания тестов только там, где новый договор намеренно меняет YAML; XML fixtures не менять.

**Interfaces:**
- Consumes: все предыдущие слои.
- Produces: подтверждённый round-trip для Storekeeper, SMTL, ERP и Mhcsk; публичный реестр трёх новых тегов и окончательное ограничение обязательного реестра/порядка.

- [x] **Step 1: Добавить интеграционные проверки исследованных XML-фрагментов**

Копировать только необходимые `Configuration.xml`, `Languages/*.xml` и XML владельца во временный каталог. Проверить:

- Storekeeper: незарегистрированный `en` получает `!xml/language` и round-trip сохраняет XML;
- SMTL и ERP: реальные нарушения порядка получают `!xml/order` и сохраняют порядок;
- Mhcsk: три реальные пары одинакового `ru` получают `!xml/duplicate` и экспортируют по два соседних item.

- [x] **Step 2: Подтвердить RED или сразу зафиксировать GREEN интеграцию**

Run: `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/commonObjects/i8nText/roundTrip.integration.test.ts`

Expected: PASS после Tasks 2–6; если тест выявляет расхождение, остановиться, установить причину через systematic-debugging и исправить минимальный слой с новым RED-тестом.

- [x] **Step 3: Обновить публичные ограничения**

В `.agents/xml-anomalies.md` добавить строки `!xml/language`, `!xml/order`, `!xml/duplicate` с точной грамматикой и местом. В `.agents/restrictions.md` заменить формулировку «согласованные будущие теги» на реализованный закрытый список и сохранить все ограничения из спецификации без расширения на `#`, пустой код или namespace.

- [x] **Step 4: Выполнить целевые проверки и type-check**

Run: `pnpm type-check`

Run: `pnpm --filter @nkdk/runtime test`

Run: `pnpm --filter @nkdk/rules test:native` вне песочницы.

Expected: PASS.

- [x] **Step 5: Выполнить итоговый compiled-runtime профиль**

На том же пути из `/private/tmp/nkdk-i18n-validation-project-path.txt` удалить только `.nkdk/cache/project-state.bin` через `--timing-only`, затем выполнить свежую сборку и тот же трёхкратный профиль:

```bash
pnpm --filter @nkdk/rules build
node .agents/skills/validation-profile/validation-profile.mjs <same-temp-project> --timing-only --json
node .agents/skills/validation-profile/validation-profile.mjs <same-temp-project> --runs 3 --timing --json
```

Сохранить результат только в `/private/tmp/nkdk-i18n-validation-after.json`. Сравнить cold/warm, hashed/parsed, snapshot, diagnostics digest и peak RSS с baseline; устойчивое ухудшение вне разброса повторных прогонов считать блокером и показать пользователю.

- [x] **Step 6: Выполнить обязательные полные проверки**

Run вне песочницы: `pnpm test`

Run вне песочницы: `pnpm test:e2e`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 13ba5eac5`

Expected: все команды PASS, новых дублей и архитектурных нарушений нет.

- [x] **Step 7: Закоммитить итоговый слой**

```bash
git add .agents/restrictions.md .agents/xml-anomalies.md packages/rules
git commit -m "docs: :memo: зарегистрировать языковые XML-аномалии"
```

### Task 8: Независимое ревью и сверка с договором

**Files:**
- Review: `git diff 13ba5eac5...HEAD`
- Review: `docs/superpowers/specs/2026-08-14-i18n-language-anomalies-design.md`
- Review: this plan

**Interfaces:**
- Consumes: завершённая реализация и результаты всех проверок.
- Produces: один независимый отчёт с приоритетами P0–P2, таблицей покрытия требований и перечнем отклонений от плана.

- [x] **Step 1: Запустить одного review-субагента только после реализации**

Поручить ему read-only ревью диапазона `13ba5eac5...HEAD`: искать потерю XML, неверную грамматику тегов, нарушение архитектурных границ, лишние обходы/сортировки, неполную инвалидацию и расхождения со спецификацией/планом. Запретить редактирование файлов.

- [x] **Step 2: Самостоятельно сопоставить план и фактические изменения**

Составить таблицу `требование → задача плана → файлы реализации → тест`; отдельно перечислить осознанные отклонения. Любое несогласованное изменение поведения считать замечанием, а не молча принимать.

- [x] **Step 3: Исправить подтверждённые замечания через TDD**

Для каждого P0/P1 или подтверждённого расхождения сначала добавить RED-тест, затем минимальное исправление, целевые тесты и `pnpm duplicates -- --base 13ba5eac5`. Не принимать спорное решение без вопроса пользователю.

- [x] **Step 4: Повторить итоговые проверки после исправлений**

Run вне песочницы: `pnpm test`

Run вне песочницы: `pnpm test:e2e`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 13ba5eac5`

Expected: PASS.

- [x] **Step 5: Закоммитить только реальные исправления ревью**

Если изменения понадобились:

```bash
git add <точные исправленные файлы>
git commit -m "fix: :bug: устранить замечания языкового ревью"
```

Если замечаний нет, новый пустой коммит не создавать.
