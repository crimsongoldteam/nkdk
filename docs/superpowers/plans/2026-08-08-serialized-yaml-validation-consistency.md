# Serialized YAML Validation Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать diagnostics XML-import полностью совпадающими с чистой validation записанного YAML без повторного чтения или разбора текста.

**Architecture:** YAML-слой за один подготовительный обход формирует неделимую пару окончательного текста и соответствующих ему смысловых данных. Import и файловая validation преобразуют свои входы в `ParsedYaml`, после чего используют один существующий `validateProjectFileFirstPass` для JSON Schema, локальных проверок и извлечения индекса.

**Tech Stack:** TypeScript, Vitest, js-yaml, TypeBox, двоичное ProjectState, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не изменять правила JSON Schema, состав содержательных diagnostics, Б5 или двоичный формат ProjectState.
- Не добавлять условия для `ExplicitYAMLString` в metadata-validation; транспортные значения знает только YAML-слой.
- Не читать записанный YAML и не разбирать сериализованный текст во время import.
- Сохранить раннюю запись YAML, вычисление хэша по записываемым байтам и ограниченное удержание объектов в worker.
- Существующие незакоммиченные изменения `packages/core/metadata/importFromXml/worker.ts` и `worker.test.ts` исправляют окончательный индекс форм; не удалять и не смешивать их с коммитами этого плана. Для пересекающихся файлов использовать `git add -p`.
- После каждого законченного слоя выполнить `pnpm duplicates -- --base 17f854a5a`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture` и полный повторный import/validation контрольного проекта.

---

## File Structure

- Modify: `packages/core/yaml/export.ts` — единственная подготовка печатного и смыслового представлений YAML.
- Modify: `packages/core/yaml/export.test.ts` — договор сериализованного документа с обычным YAML-парсером.
- Modify: `packages/core/metadata/importFromXml/writeOutput.ts` — добавление смысловых данных к сериализованному import-файлу.
- Modify: `packages/core/metadata/importFromXml/writeOutput.test.ts` — договор текста, данных, байтов и хэша.
- Create: `packages/core/metadata/validation/serializedYamlValidation.ts` — адаптер сериализованного документа к общему локальному validator.
- Create: `packages/core/metadata/validation/serializedYamlValidation.test.ts` — равенство быстрого и файлового путей на транспортных строках.
- Delete: `packages/core/metadata/validation/knownYamlValidation.ts` — небезопасный интерфейс независимых `text` и `yaml`.
- Delete: `packages/core/metadata/validation/knownYamlValidation.test.ts` — заменяется точным договорным тестом.
- Modify: `packages/core/metadata/importFromXml/worker.ts` — передача согласованного сериализованного документа вместо `prepared.yaml`.
- Modify: `packages/core/metadata/importFromXml/worker.test.ts` — регрессия на настоящем XML со строковым `FillValue`.
- Modify: `.agents/architecture.md` — уточнение понятия готового YAML-объекта.

---

## Execution Baseline

До изменения production-кода сохранить исходный профиль тем же инструментом и на том же входе:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/sed_xml/cf \
  /Users/nikita/git/sed_nkdk/cf \
  --runs 2 \
  --concurrency 4 \
  --json > /private/tmp/nkdk-import-profile-before-serialized-yaml.json
```

Перед запуском исполнитель обязан прочитать skill `import-profile`. Файл профиля хранится вне репозитория; YAML записывается непосредственно в `/Users/nikita/git/sed_nkdk/cf`.

---

### Task 1: Сериализованный YAML-документ

**Files:**
- Modify: `packages/core/yaml/export.ts`
- Test: `packages/core/yaml/export.test.ts`

**Interfaces:**
- Consumes: `explicitYAMLString`, `taggedScalarForDump`, существующие правила печати `exportToYAML`.
- Produces:

```ts
export interface SerializedYAMLDocument {
  readonly text: string
  readonly data: unknown
}

export function serializeYAMLDocument(source: unknown): SerializedYAMLDocument
export const exportToYAML: <T>(data: T) => string
```

- [ ] **Step 1: Написать падающий договорный тест смысловых данных**

Добавить в `packages/core/yaml/export.test.ts` импорт `parseMetadataYaml` и табличный тест:

```ts
import { parseMetadataYaml } from "./parseMetadataYaml"
import { serializeYAMLDocument } from "./export"

it.each([
  ["явная строка", { Значение: explicitYAMLString("001") }],
  ["пустая строка", { Значение: explicitYAMLString("") }],
  ["undefined в объекте", { Значение: undefined }],
  ["undefined в массиве", { Значения: [undefined] }],
  ["вложенное значение", { Внешний: { Значение: explicitYAMLString("456") } }],
] as const)("строит смысловые данные как штатный parser: %s", (_name, source) => {
  const serialized = serializeYAMLDocument(source)

  expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
})
```

Отдельным тестом пометить строку через `markYAMLScalarTag(source, "Значение", "xml")`, затем сравнить `serialized.data` с `parseMetadataYaml(serialized.text).data` и проверить `serialized.text === "Значение: !xml Авто"`.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/export.test.ts --no-isolate
```

Expected: FAIL, потому что `serializeYAMLDocument` ещё не экспортируется.

- [ ] **Step 3: Разделить подготовку YAML на печатное и смысловое представления**

В `packages/core/yaml/export.ts` заменить возврат одного значения из рекурсивной подготовки на пару:

```ts
interface PreparedYAMLNode {
  readonly dumpValue: unknown
  readonly data: unknown
}

function prepareForDump(
  value: unknown,
  explicitStrings: Map<string, string>,
  undefinedValues: Set<string>,
): PreparedYAMLNode {
  if (isExplicitYAMLString(value)) {
    const data = String(unwrapExplicitYAMLString(value))
    return { dumpValue: explicitStringMarker(data, explicitStrings), data }
  }
  if (typeof value === "string" && shouldExportAsExplicitString(value)) {
    return { dumpValue: explicitStringMarker(value, explicitStrings), data: value }
  }
  if (Array.isArray(value)) {
    const prepared = value.map((item, index) =>
      prepareChildForDump(value, index, item, explicitStrings, undefinedValues)
    )
    return {
      dumpValue: prepared.map(({ dumpValue }) => dumpValue),
      data: prepared.map(({ data }) => data),
    }
  }
  if (value !== null && typeof value === "object") {
    const prepared = Object.entries(value).map(([key, item]) => [
      key,
      prepareChildForDump(value, key, item, explicitStrings, undefinedValues),
    ] as const)
    return {
      dumpValue: Object.fromEntries(prepared.map(([key, item]) => [key, item.dumpValue])),
      data: Object.fromEntries(prepared.map(([key, item]) => [key, item.data])),
    }
  }
  return { dumpValue: value, data: value }
}
```

`prepareChildForDump` должен вернуть `PreparedYAMLNode` и сохранить текущую семантику:

```ts
if (value === undefined && !Array.isArray(parent)) {
  const marker = `${UNDEFINED_VALUE_MARKER_PREFIX}${undefinedValues.size}__`
  undefinedValues.add(marker)
  return { dumpValue: marker, data: undefined }
}
const prepared = value === undefined
  ? { dumpValue: null, data: null }
  : prepareForDump(value, explicitStrings, undefinedValues)
return {
  dumpValue: taggedScalarForDump(parent, key, prepared.dumpValue),
  data: prepared.data,
}
```

Не добавлять второй рекурсивный обход исходного объекта. Существующие WeakMap-пометки оформления не должны становиться значениями `data`.

- [ ] **Step 4: Добавить публичную сериализацию документа**

Вынести существующее формирование текста в новую функцию и оставить старый API оболочкой:

```ts
export function serializeYAMLDocument(source: unknown): SerializedYAMLDocument {
  const explicitStrings = new Map<string, string>()
  const undefinedValues = new Set<string>()
  const prepared = prepareForDump(source, explicitStrings, undefinedValues)
  const dumped = dump(prepared.dumpValue, {
    schema: NKDK_YAML_SCHEMA,
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    skipInvalid: false,
    sortKeys: false,
    forceQuotes: false,
    quoteStyle: "double",
  })
  const text = finishExportedYAML(dumped, explicitStrings, undefinedValues)
  return { text, data: prepared.data }
}

export const exportToYAML = <T>(data: T): string => serializeYAMLDocument(data).text
```

Добавить точное завершение текста без изменения существующего порядка преобразований:

```ts
function finishExportedYAML(
  yaml: string,
  explicitStrings: Map<string, string>,
  undefinedValues: Set<string>,
): string {
  return removeDocumentFinalLineEnding(
    normalizeQuotedTypeLinkValues(
      quoteExplicitStrings(
        restoreUndefinedValues(yaml, undefinedValues),
        explicitStrings,
      ),
    ),
  )
}
```

- [ ] **Step 5: Запустить YAML-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/export.test.ts yaml/jsYamlParser.test.ts yaml/parseMetadataYaml.test.ts --no-isolate
```

Expected: PASS; существующие строки YAML совпадают побайтно.

- [ ] **Step 6: Проверить новые дубли и создать коммит**

```bash
pnpm duplicates -- --base 17f854a5a
git add packages/core/yaml/export.ts packages/core/yaml/export.test.ts
git commit -m "refactor: :recycle: согласовать текст и данные YAML"
```

---

### Task 2: Общий адаптер локальной validation

**Files:**
- Modify: `packages/core/metadata/importFromXml/writeOutput.ts`
- Test: `packages/core/metadata/importFromXml/writeOutput.test.ts`
- Create: `packages/core/metadata/validation/serializedYamlValidation.ts`
- Create: `packages/core/metadata/validation/serializedYamlValidation.test.ts`
- Delete: `packages/core/metadata/validation/knownYamlValidation.ts`
- Delete: `packages/core/metadata/validation/knownYamlValidation.test.ts`

**Interfaces:**
- Consumes: `SerializedYAMLDocument`, `parsedYamlFromKnownData`, `validateProjectFileFirstPass`.
- Produces:

```ts
export interface SerializedImportYaml extends SerializedYAMLDocument {
  readonly file: ImportResultFile
  readonly bytes: Uint8Array<ArrayBuffer>
  readonly localHash: bigint
}

export function validateSerializedProjectYaml(params: {
  readonly projectDir: string
  readonly file: ValidationProjectFile
  readonly document: SerializedYAMLDocument
  readonly context: ConfigurationContext
  readonly schemaCache: ValidationSchemaCache
  readonly rulesSnapshot: ValidationRulesSnapshot
}): ProjectValidationFirstPassResult
```

- [ ] **Step 1: Написать падающий тест import-сериализации**

В `writeOutput.test.ts` добавить:

```ts
import { explicitYAMLString } from "../../yaml/explicitString"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"

it("возвращает смысловые данные тех же YAML-байтов", () => {
  const serialized = serializeImportYaml({
    output: {
      sourceKind: "worker",
      sourcePath: "/project/cf/Справочник/Товары/Свойства.yaml",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    },
    yaml: { ЗначениеЗаполнения: explicitYAMLString("001") },
  })

  expect(serialized.text).toBe('ЗначениеЗаполнения: "001"')
  expect(serialized.data).toEqual({ ЗначениеЗаполнения: "001" })
  expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/writeOutput.test.ts --no-isolate
```

Expected: FAIL — у `SerializedImportYaml` отсутствует `data`.

- [ ] **Step 3: Использовать сериализованный YAML-документ в writeOutput**

В `serializeImportYaml` вызвать `serializeYAMLDocument` один раз:

```ts
const document = file.yaml === undefined
  ? { text: "", data: undefined }
  : serializeYAMLDocument(file.yaml)
const bytes = textEncoder.encode(document.text)
return {
  file: file.output,
  ...document,
  bytes,
  localHash: hashFileBytes(bytes),
}
```

Не вызывать отдельно `exportToYAML`, чтобы `text` и `data` нельзя было получить из разных обходов.

- [ ] **Step 4: Написать падающий тест общего адаптера**

Создать `serializedYamlValidation.test.ts`. Построить схему, ожидающую строковое `ЗначениеЗаполнения`, через `compileValidationSchema(Type.Object(...))`, затем сравнить файловый и сериализованный пути:

```ts
const document = serializeYAMLDocument({
  Реквизиты: {
    Артикул: {
      Тип: "Строка",
      ЗначениеЗаполнения: explicitYAMLString("001"),
    },
  },
})
writeFileSync(absolutePath, document.text)

const fromFile = validateProjectFileFirstPass({
  projectDir,
  file,
  cache: createProjectYamlCache(),
  context: mockContext,
  schemaCache,
  rulesSnapshot,
})
const fromSerialized = validateSerializedProjectYaml({
  projectDir,
  file,
  document,
  context: mockContext,
  schemaCache,
  rulesSnapshot,
})

expect(withoutProfile(fromSerialized)).toEqual(withoutProfile(fromFile))
expect(fromSerialized.schemaDiagnostics).toEqual([])
```

Локальный `schemaCache` теста должен возвращать одну и ту же скомпилированную схему для `form` и `properties`, чтобы тест проверял только согласованность входных данных.

- [ ] **Step 5: Запустить тест и подтвердить отсутствие нового интерфейса**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/serializedYamlValidation.test.ts --no-isolate
```

Expected: FAIL — модуль `serializedYamlValidation` ещё отсутствует.

- [ ] **Step 6: Реализовать тонкий адаптер без логики validation**

Перенести общий вызов из `knownYamlValidation.ts` в новый файл и заменить независимые параметры парой:

```ts
export function validateSerializedProjectYaml(
  params: ValidateSerializedProjectYamlParams,
): ProjectValidationFirstPassResult {
  const entry = {
    filePath: params.file.absolutePath,
    text: params.document.text,
    parsed: parsedYamlFromKnownData(params.document.text, params.document.data),
  }
  return validateProjectFileFirstPass({
    projectDir: params.projectDir,
    file: params.file,
    cache: createProjectYamlCacheFromEntries([entry]),
    context: params.context,
    schemaCache: params.schemaCache,
    rulesSnapshot: params.rulesSnapshot,
  })
}
```

Удалить `knownYamlValidation.ts` и его прежний тест. Не переносить в новый адаптер никаких правил JSON Schema, ссылок или индексов.

- [ ] **Step 7: Запустить тесты слоя**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/writeOutput.test.ts metadata/validation/serializedYamlValidation.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Проверить дубли и создать коммит**

```bash
pnpm duplicates -- --base 17f854a5a
git add packages/core/metadata/importFromXml/writeOutput.ts \
  packages/core/metadata/importFromXml/writeOutput.test.ts \
  packages/core/metadata/validation/serializedYamlValidation.ts \
  packages/core/metadata/validation/serializedYamlValidation.test.ts \
  packages/core/metadata/validation/knownYamlValidation.ts \
  packages/core/metadata/validation/knownYamlValidation.test.ts
git commit -m "refactor: :recycle: унифицировать вход локальной validation"
```

---

### Task 3: Подключение import worker и регрессия XML → YAML

**Files:**
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`

**Interfaces:**
- Consumes: `SerializedImportYaml`, `validateSerializedProjectYaml` из Task 2.
- Produces: ProjectState, построенное из смысловых данных окончательного YAML; сигнатуры публичного import не меняются.

- [ ] **Step 1: Добавить падающую регрессию на настоящий XML FillValue**

В существующем тесте `writes ready YAML and returns the complete local validation contribution` временно отключить быстрый поддельный schema cache перед повторной инициализацией worker:

```ts
setImportWorkerSchemaCacheForTests(undefined)
await initializeWorker(outputDir)
```

Использовать существующий `catalogFullXmlPath`, содержащий `<FillValue xsi:type="xs:string"/>`. После первого прохода применить `stateFragment` через существующий `createReadToken(result)`, затем получить локальные diagnostics вызовом `sharedStateFixture.store.readLocalDiagnostics()`. Отфильтровать их по `filePath`, оканчивающемуся на `assignment.targetProjectPath`.

Файловый результат получить общим вызовом:

```ts
const context = mockXmlImportContext()
const file = resolveValidationProjectFile(outputDir, join(outputDir, assignment.targetProjectPath))
if (file === undefined) throw new Error("Не удалось классифицировать импортированный YAML")
const fromFile = validateProjectFileFirstPass({
  projectDir: outputDir,
  file,
  cache: createProjectYamlCache(),
  context,
  schemaCache: createValidationSchemaCache(context),
  rulesSnapshot: createValidationRulesSnapshot(context),
})
```

Сравнить сохранённые import diagnostics с `fromFile.diagnostics` и `fromFile.schemaDiagnostics`, предварительно добавив к файловым diagnostics ожидаемый `filePath`. Сравнивать `message`, `path`, `line`, `col`, `severity` и `source`.

Минимальная проверка регрессии должна явно запрещать прежние ложные сообщения:

```ts
expect(importDiagnostics.map(({ message }) => message)).not.toEqual(
  expect.arrayContaining([
    "Expected string",
    "Expected union value",
    'Отсутствует обязательное свойство "Тип"',
  ]),
)
expect(importDiagnostics).toEqual(fileDiagnostics)
```

Не декодировать двоичный формат вручную и не добавлять JSON-представление состояния.

- [ ] **Step 2: Запустить worker-тест и подтвердить расхождение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts --no-isolate
```

Expected: FAIL — worker передаёт `prepared.yaml` с `ExplicitYAMLString`, поэтому import diagnostics отличаются от файловых.

- [ ] **Step 3: Переключить worker на согласованный документ**

Заменить импорт и вызов:

```ts
import { validateSerializedProjectYaml } from "../validation/serializedYamlValidation"

const first = validateSerializedProjectYaml({
  projectDir: state.projectDir,
  file,
  document: serialized,
  context: state.context,
  schemaCache: state.schemaCache,
  rulesSnapshot: state.rulesSnapshot,
})
```

Сузить параметр `prepared` у `validateSerializedImportYaml` и `measureSerializedImportYamlValidation` до `Pick<DeferredImportYaml, "targetProjectPath">`: исходный `yaml` больше не является входом validation.

- [ ] **Step 4: Запустить worker и import-тесты**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/importFromXml/importConfiguration.test.ts \
  metadata/importFromXml/importConfigurationExtension.test.ts \
  --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Проверить типы и дубли**

```bash
pnpm type-check
pnpm duplicates -- --base 17f854a5a
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 6: Создать отдельный коммит только для нового изменения worker**

В `worker.ts` и `worker.test.ts` уже находятся незакоммиченные изменения предыдущего исправления индекса. Просмотреть diff и интерактивно добавить только участки этого Task:

```bash
git diff -- packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/worker.test.ts
git add -p packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/worker.test.ts
git diff --cached --check
git commit -m "fix: :bug: проверять смысловые данные импортированного YAML"
```

После коммита убедиться, что прежние изменения индекса всё ещё находятся в рабочем дереве:

```bash
git status --short
```

---

### Task 4: Уточнение архитектурного договора

**Files:**
- Modify: `.agents/architecture.md:205-208`

**Interfaces:**
- Consumes: утверждённый design `docs/superpowers/specs/2026-08-08-serialized-yaml-validation-consistency-design.md`.
- Produces: архитектурное описание, соответствующее фактической границе YAML и metadata-validation.

- [ ] **Step 1: Исправить две формулировки import**

В строке первого прохода заменить «уже готовый объект YAML» на «смысловые данные окончательного YAML, сформированные YAML-сериализатором».

В строке ранней записи записать дословно:

> Если YAML не содержит отложенных значений, worker сериализует его в окончательный текст и согласованные смысловые данные, записывает текст в первом проходе, вычисляет хэш по записываемым байтам и передаёт смысловые данные в общий модуль локальной validation без повторного чтения или разбора текста.

В описании второго прохода уточнить, что после отложенного преобразования выполняется та же сериализация согласованной пары.

- [ ] **Step 2: Проверить отсутствие противоречащих формулировок**

```bash
rg -n "тот же объект|готовый объект YAML|повторного.*разбор" \
  .agents/architecture.md \
  docs/superpowers/specs/2026-08-04-universal-metadata-worker-pool-design.md \
  docs/superpowers/specs/2026-08-08-serialized-yaml-validation-consistency-design.md
```

Старый design универсального пула является историческим решением и не переписывается. Новая спецификация и актуальный `.agents/architecture.md` должны явно фиксировать уточнённый договор.

- [ ] **Step 3: Запустить архитектурные и дублирующие проверки**

```bash
pnpm test:architecture
pnpm duplicates -- --base 17f854a5a
```

Expected для duplicates: код 0. Для architecture сравнить результат с исходным запуском: изменение документа не должно добавлять нарушений; известные 177 нарушений текущей ветки фиксируются отдельно и не маскируются как успех.

- [ ] **Step 4: Создать коммит документации**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: уточнить validation сериализованного YAML"
```

---

### Task 5: Полная проверка и контрольный проект

**Files:**
- Verify only: `/Users/nikita/git/sed_xml/cf`
- Regenerate: `/Users/nikita/git/sed_nkdk/cf`
- Delete before validation: `/Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin`

**Interfaces:**
- Consumes: публичные `syncConfigurationFromXML` и `validateProject` собранного `@nkdk/core`.
- Produces: подтверждение равенства import и чистой validation на основной конфигурации и `cfe/дкз`.

- [ ] **Step 1: Запустить все обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm duplicates -- --base 17f854a5a
```

Expected: type-check, tests и duplicates завершаются с кодом 0. Architecture не должна содержать нарушений, добавленных изменёнными production-файлами; отдельно приложить исходный и итоговый список известных нарушений, если общий baseline ветки остаётся красным.

- [ ] **Step 2: Собрать core**

```bash
pnpm --filter @nkdk/core build
```

Expected: `dist/index.js` и worker-сборки создаются без ошибок.

- [ ] **Step 3: Удалить прежний результат cf и внутренний снимок**

Пользователь заранее разрешил удалять эти восстанавливаемые файлы:

```bash
rm -rf /Users/nikita/git/sed_nkdk/cf
rm -rf /Users/nikita/git/sed_nkdk/.nkdk/components/cf
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
```

Не удалять `cfe/дкз`.

- [ ] **Step 4: Выполнить import основной конфигурации**

Через публичный `syncConfigurationFromXML` выполнить:

```ts
await syncConfigurationFromXML({
  context: mockContextFromXML(),
  inputDir: "/Users/nikita/git/sed_xml/cf",
  projectDir: "/Users/nikita/git/sed_nkdk",
})
```

Сохранить полный список diagnostics import и их распределение по компонентам и сообщениям. Expected: 68 diagnostics, а не 5 903; расширение `cfe/дкз` включено в итоговую Б5.

- [ ] **Step 5: Удалить созданный снимок и выполнить чистую validation**

```bash
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
```

Затем выполнить:

```ts
const result = await validateProject({
  projectDir: "/Users/nikita/git/sed_nkdk",
  concurrency: 4,
})
```

Expected:

```text
total: 68
cf: 65
cfe/дкз: 3
```

Сравнить нормализованные diagnostics import и validation по `filePath`, `line`, `col`, `message`, `severity`, `source` и `path`. Они должны совпасть полностью, а не только количеством.

- [ ] **Step 6: Измерить стоимость нового смыслового результата**

Повторить исходный замер с теми же параметрами:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/sed_xml/cf \
  /Users/nikita/git/sed_nkdk/cf \
  --runs 2 \
  --concurrency 4 \
  --json > /private/tmp/nkdk-import-profile-after-serialized-yaml.json
```

Сравнить `coldMs`, `warmAvgMs`, `runs[].phases.firstPassMs`, `runs[].phases.secondPassMs` и строки сериализации в `profileRows` двух JSON-файлов. `warmAvgMs` после изменения не должен превышать исходный более чем на 10%. Профиль не должен содержать нового этапа разбора YAML или второго обхода предметной модели.

- [ ] **Step 7: Проверить рабочее дерево и подготовить отчёт**

```bash
git status --short
git log -5 --oneline
```

Убедиться, что сгенерированный `/Users/nikita/git/sed_nkdk` не попал в индекс репозитория `nkdk`, а прежние незакоммиченные изменения индекса форм сохранены. В итоговом отчёте отдельно указать результаты тестов, совпадение diagnostics, профиль и известное состояние architecture baseline.
