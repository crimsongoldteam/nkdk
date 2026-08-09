# Configuration Extension `AnyRef` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Импортировать `cfg:AnyRef` как `ЛюбаяСсылка` и выбирать `cfg:AnyRef` либо `cfg:AnyIBRef` при XML-экспорте расширения по его режиму совместимости.

**Architecture:** Общий `TypeDescription` получает отдельный входной синоним `AnyRef → AnyIBRef` и необязательную нейтральную политику XML-имён типов. Профиль расширения читает режим совместимости из корневого YAML до запуска воркеров и передаёт политику всем воркерам; общая оркестрация не содержит условий по виду компонента.

**Tech Stack:** TypeScript 7, Vitest, TypeBox/JSON Schema, существующие metadata rules, full XML sync с worker pool, pnpm.

## Global Constraints

- Каноническое YAML-значение для `cfg:AnyRef` и `cfg:AnyIBRef` — `ЛюбаяСсылка`.
- `Версия8_3_22` и более ранние режимы расширения экспортируют `cfg:AnyRef`; `Версия8_3_23` и более поздние, `НеИспользовать` и отсутствующее поле — `cfg:AnyIBRef`.
- Выбор написания не зависит от `ObjectBelonging=Adopted`.
- Политика режима имеет приоритет над написанием из reference XML.
- Не использовать снимок конфигурации, индексы, `!xml` или второе YAML-представление типа.
- Не добавлять условия по `configurationExtension` в `metadata/orchestration`, `metadata/validation` или `metadata/project`.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` или параметры построителей правил.
- Не изменять существующие XML-фикстуры.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 1d20ab9ef`.

---

### Task 1: Нормализовать входной `AnyRef`

**Files:**
- Create: `packages/core/metadata/commonObjects/typeDescription/xmlTypeNames.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/fromXML.test.ts`

**Interfaces:**
- Produces: `normalizeImportedTypeDescriptionName(type: string): string`.
- Preserves: `AnyIBRef` остаётся каноническим ключом `TypeDescriptionRules`; нового правила для `AnyRef` нет.

- [ ] **Step 1: Добавить падающую таблицу импорта обоих написаний**

В `fromXML.test.ts` добавить один параметризованный договор:

```ts
it.each(["cfg:AnyRef", "cfg:AnyIBRef"])("imports %s as ЛюбаяСсылка", (xmlType) => {
  const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
    `<Type><v8:TypeSet>${xmlType}</v8:TypeSet></Type>`
  )

  const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

  expect(result).toEqual({ type: ["AnyIBRef"] })
  expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)).toBe("ЛюбаяСсылка")
})
```

- [ ] **Step 2: Убедиться, что случай `AnyRef` падает по исходной причине**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/typeDescription/fromXML.test.ts -t "imports .* as ЛюбаяСсылка"
```

Expected: строка `cfg:AnyRef` остаётся внутренним `AnyRef`, а `exportTypeDescriptionToYAML` сообщает `Type AnyRef not found in TypeDescriptionRules`.

- [ ] **Step 3: Реализовать входной синоним отдельно от реестра правил**

Создать `xmlTypeNames.ts`:

```ts
const IMPORTED_TYPE_DESCRIPTION_ALIASES: Readonly<Record<string, string>> = {
  AnyRef: "AnyIBRef",
}

export function normalizeImportedTypeDescriptionName(type: string): string {
  return IMPORTED_TYPE_DESCRIPTION_ALIASES[type] ?? type
}
```

В `fromXML.ts` применять функцию после `removeTypePrefix(text)` в `getType()`. Не добавлять `AnyRef` в `TypeDescriptionRules` и не менять обработку произвольных XDTO-значений вне `TypeDescription`.

- [ ] **Step 4: Запустить узкие тесты и проверку типов**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/typeDescription/fromXML.test.ts metadata/commonObjects/typeDescription/toYAML.test.ts
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 1d20ab9ef
```

Expected: все команды завершаются успешно; оба XML-вида дают `ЛюбаяСсылка`.

- [ ] **Step 5: Зафиксировать слой импорта**

```bash
git add packages/core/metadata/commonObjects/typeDescription/xmlTypeNames.ts packages/core/metadata/commonObjects/typeDescription/fromXML.ts packages/core/metadata/commonObjects/typeDescription/fromXML.test.ts
git commit -m "fix: :bug: импортировать AnyRef как любую ссылку" \
  -m "Старые расширения используют входной синоним AnyRef. Каноническим внутренним типом и YAML-представлением остаются AnyIBRef и ЛюбаяСсылка."
```

### Task 2: Добавить нейтральную политику XML-имени `TypeDescription`

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`

**Interfaces:**
- Produces: `ToXMLConfigurationContext.typeDescriptionXMLNameByType?: Readonly<Record<string, string>>`.
- Consumes: ключ внутреннего типа, например `AnyIBRef`; значение — локальное XML-имя без префикса, например `AnyRef`.
- Preserves: префикс, namespace и выбор `v8:Type`/`v8:TypeSet` по каноническому `TypeDescriptionRule`.

- [ ] **Step 1: Написать падающие тесты политики и её приоритета**

В `toXML.test.ts` создать контекст поверх `mockContextToXML()` и проверить два варианта:

```ts
const contextWithTypeName = (xmlName: "AnyRef" | "AnyIBRef") => ({
  ...mockContextToXML(),
  exportToXML: {
    ...mockContextToXML().exportToXML,
    typeDescriptionXMLNameByType: { AnyIBRef: xmlName },
  },
})

it.each([
  ["AnyRef", "cfg:AnyRef"],
  ["AnyIBRef", "cfg:AnyIBRef"],
] as const)("exports AnyIBRef through %s policy", (xmlName, expected) => {
  expect(exportTypeDescriptionToXML(
    contextWithTypeName(xmlName),
    mockRule,
    { type: ["AnyIBRef"] }
  )).toEqual({ "v8:TypeSet": expected })
})
```

Добавить отдельный тест, передающий reference `TypeDescription` с сохранённым `cfg:AnyRef`, но политику `{ AnyIBRef: "AnyIBRef" }`; результат обязан быть `cfg:AnyIBRef`. Для создания reference использовать экспортируемый `TYPE_DESCRIPTION_SOURCE_TYPES`, не приводить значение через `as any`.

- [ ] **Step 2: Подтвердить отсутствие поддержки политики**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/typeDescription/toXML.test.ts -t "policy"
```

Expected: TypeScript либо assertions падают, потому что контекст и экспортёр ещё не знают новую политику.

- [ ] **Step 3: Добавить поле контекста и применить его только в `TypeDescription`**

В `ToXMLConfigurationContext` добавить:

```ts
readonly typeDescriptionXMLNameByType?: Readonly<Record<string, string>>
```

Передать карту из `exportTypeDescriptionToXML()` в `getTypesXML()`. В цикле типов определить канонический `baseType`; если карта содержит для него имя, вызвать канонический генератор с этим именем и не использовать `referenceSourceTypes` для данного типа. Сигнатуру канонического генератора сделать явной:

```ts
function getCanonicalTypeXML(
  type: string,
  rule: TypeDescriptionRule,
  declareTypeNamespace: boolean,
  xmlBaseType: string = type.includes(".") ? type.slice(0, type.indexOf(".")) : type,
): TypeDescriptionXMLType
```

При сложном типе сохранять суффикс после точки; политика заменяет только базовое имя. Для `AnyIBRef` суффикса нет. Префикс и namespace брать из правила `AnyIBRef`, поэтому результат остаётся `cfg:*`.

- [ ] **Step 4: Запустить все тесты `TypeDescription`**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/typeDescription
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 1d20ab9ef
```

Expected: политика меняет только явно перечисленный тип; существующие проверки namespace, reference source и контейнера проходят.

- [ ] **Step 5: Зафиксировать общий механизм**

```bash
git add packages/core/metadata/context/types.ts packages/core/metadata/commonObjects/typeDescription/toXML.ts packages/core/metadata/commonObjects/typeDescription/toXML.test.ts
git commit -m "feat: :sparkles: добавить политику XML-имен типов" \
  -m "Компонент может выбрать техническое XML-имя, не меняя семантический TypeDescription и не добавляя частные условия в общий экспортёр."
```

### Task 3: Вычислять политику расширения по режиму совместимости

**Files:**
- Create: `packages/core/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts`

**Interfaces:**
- Produces: `configurationExtensionTypeDescriptionXMLNameByType(rootYaml: unknown): Readonly<Record<string, string>>`.
- Consumes: корневой YAML с полем `РежимСовместимостиРасширенияКонфигурации` в локализованном виде системного перечисления.
- Returns: всегда явную карту `{ AnyIBRef: "AnyRef" | "AnyIBRef" }`, чтобы режим имел приоритет над reference XML.

- [ ] **Step 1: Написать таблицу граничных режимов**

```ts
it.each([
  ["Версия8_1", "AnyRef"],
  ["Версия8_3_20", "AnyRef"],
  ["Версия8_3_22", "AnyRef"],
  ["Версия8_3_23", "AnyIBRef"],
  ["Версия8_3_27", "AnyIBRef"],
  ["НеИспользовать", "AnyIBRef"],
  [undefined, "AnyIBRef"],
] as const)("maps compatibility mode %s to %s", (mode, expected) => {
  const yaml = mode === undefined ? {} : {
    РежимСовместимостиРасширенияКонфигурации: mode,
  }
  expect(configurationExtensionTypeDescriptionXMLNameByType(yaml)).toEqual({
    AnyIBRef: expected,
  })
})
```

Добавить проверку неизвестной строки: ошибка должна содержать имя поля и само значение.

- [ ] **Step 2: Запустить тест и увидеть отсутствие resolver**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts
```

Expected: FAIL из-за отсутствующего модуля/экспорта.

- [ ] **Step 3: Реализовать чистый resolver**

Использовать `CompatibilityModeFromYAML` из `systemEnumerations/types.ts`, а не собственную копию допустимых строк. После преобразования `Версия…` в `Version…`:

```ts
const DEFAULT_MODE = "Version8_3_27"
const ANY_REF_LAST_MODE = [8, 3, 22] as const

export function configurationExtensionTypeDescriptionXMLNameByType(
  rootYaml: unknown,
): Readonly<Record<string, string>> {
  const yamlMode = readOptionalStringProperty(
    rootYaml,
    "РежимСовместимостиРасширенияКонфигурации",
  )
  const mode = yamlMode === undefined ? DEFAULT_MODE : CompatibilityModeFromYAML[yamlMode]
  if (mode === undefined) {
    throw new Error(
      `Неизвестный РежимСовместимостиРасширенияКонфигурации: ${String(yamlMode)}`,
    )
  }
  return { AnyIBRef: usesLegacyAnyRef(mode) ? "AnyRef" : "AnyIBRef" }
}
```

`DontUse` возвращает современное имя. Остальные значения `Version…` сравнивать как числовой кортеж, а не лексикографически (`8.3.9` не должно оказаться новее `8.3.22`). Экспортировать только публичную функцию карты; вспомогательные функции оставить локальными.

- [ ] **Step 4: Выполнить тесты расширения и проверку типов**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts metadata/appliedObjects/configurationExtension/rules.test.ts
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 1d20ab9ef
```

Expected: все границы проходят; правила корневого объекта не изменены.

- [ ] **Step 5: Зафиксировать политику версии**

```bash
git add packages/core/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.ts packages/core/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.test.ts
git commit -m "feat: :sparkles: выбирать AnyRef по совместимости" \
  -m "Старые и новые режимы расширения используют одно YAML-значение, но разные технические имена в XML."
```

### Task 4: Подготовить профиль до запуска воркеров

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/prepareProfileRuntime.ts`
- Create: `packages/core/metadata/fullSyncToXml/prepareProfileRuntime.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/componentProfile.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Test: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Interfaces:**
- Adds to `FullXmlSyncWorkerProfileRuntime`: `typeDescriptionXMLNameByType?: Readonly<Record<string, string>>`.
- Adds optional `FullXmlSyncComponentProfile.prepareRuntime({ runtime, rootYaml }): FullXmlSyncProfileRuntime`.
- Produces: `prepareFullXmlSyncProfileRuntime({ profile, runtime, readFile }): Promise<FullXmlSyncProfileRuntime>`.
- Consumes: единственный content-resource роли `configuration` из полной структуры компонента, независимо от частичного selection.

- [ ] **Step 1: Написать падающий тест нейтральной подготовки профиля**

В `prepareProfileRuntime.test.ts` создать runtime с корневым ресурсом `Конфигурация.yaml`, профиль с `prepareRuntime` и внедрённый `readFile`. Проверить:

```ts
expect(readPaths).toEqual(["/project/cfe/Дополнение/Конфигурация.yaml"])
expect(prepared.workerProfile.typeDescriptionXMLNameByType).toEqual({
  AnyIBRef: "AnyRef",
})
```

Отдельная проверка: профиль без `prepareRuntime` возвращается без чтения файла. Ещё одна проверка: отсутствие/дублирование корневого configuration-resource сообщает понятную ошибку с component path.

- [ ] **Step 2: Подтвердить отсутствие фазы подготовки**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/prepareProfileRuntime.test.ts
```

Expected: FAIL из-за отсутствующего модуля и интерфейса.

- [ ] **Step 3: Реализовать нейтральную фазу подготовки**

В `componentProfile.ts` добавить:

```ts
export interface FullXmlSyncComponentProfile {
  // существующие поля
  readonly prepareRuntime?: (params: {
    readonly runtime: FullXmlSyncProfileRuntime
    readonly rootYaml: unknown
  }) => FullXmlSyncProfileRuntime
}
```

В `prepareProfileRuntime.ts`:

1. Если hook отсутствует, вернуть runtime без I/O.
2. Найти в `runtime.target.structure.resources` ровно один ресурс с `kind === "content"` и `role === "configuration"`.
3. Прочитать его относительно `componentDir` через внедрённый `readFile`.
4. Разобрать содержимое общей `parseMetadataYamlData`.
5. При syntax diagnostics выбросить ошибку с абсолютным путём и первой позицией.
6. Передать `parsed.data` в `profile.prepareRuntime`.

Не читать корень из списка выбранных assignments: при частичном sync его там может не быть.

- [ ] **Step 4: Подключить политику в профиль расширения**

В `configurationExtensionFullXmlSyncProfile` реализовать hook:

```ts
prepareRuntime({ runtime, rootYaml }) {
  return {
    ...runtime,
    workerProfile: {
      ...runtime.workerProfile,
      typeDescriptionXMLNameByType:
        configurationExtensionTypeDescriptionXMLNameByType(rootYaml),
    },
  }
}
```

В тесте профиля проверить `Версия8_3_20`, `Версия8_3_27` и отсутствие поля. Не связывать результат с `adoptedUuids`.

- [ ] **Step 5: Вызывать подготовку и в sync, и в режиме plan**

В `FullXmlSyncCoordinatorDependencies` добавить необязательное внедряемое чтение, чтобы существующие профили без подготовки не требовали I/O:

```ts
readonly readFile?: (path: string) => Promise<Uint8Array>
```

Значение по умолчанию — `fs.promises.readFile`; в вызов helper передавать `deps.readFile ?? defaultDependencies.readFile!`. После `profile.confirm(...)` и до `pool.initialize(...)` вызвать `prepareFullXmlSyncProfileRuntime`. Тот же вызов выполнить в `planSyncConfigurationToXml`, чтобы plan не скрывал ошибку корневого YAML.

В `syncConfiguration.test.ts` расширить harness: вернуть YAML старого режима из `readFile`, захватить профиль из `pool.initialize` и проверить карту. Добавить selection, не включающий `Конфигурация.yaml`, и убедиться, что режим всё равно прочитан из структуры компонента.

- [ ] **Step 6: Передать карту из worker profile общему XML-контексту**

В `worker.ts`, в `exportContext(state)`, добавить:

```ts
typeDescriptionXMLNameByType: state.profile.typeDescriptionXMLNameByType,
```

В `worker.test.ts` проверить, что инициализация с `{ AnyIBRef: "AnyRef" }` приводит к `cfg:AnyRef` для тестового `TypeDescription`; контрольная инициализация без карты оставляет `cfg:AnyIBRef`. Использовать существующий assignment/helper файла, не создавать новую XML-фикстуру.

- [ ] **Step 7: Запустить слой full sync**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/prepareProfileRuntime.test.ts metadata/fullSyncToXml/profiles/configurationExtension.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts metadata/fullSyncToXml/worker.test.ts
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base 1d20ab9ef
```

Expected: карта вычисляется один раз до воркеров, работает при частичном sync и доходит до общего экспортёра.

- [ ] **Step 8: Зафиксировать интеграцию профиля**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/appliedObjects/configurationExtension/typeDescriptionPolicy.ts
git commit -m "feat: :sparkles: передавать политику типов воркерам" \
  -m "Профиль расширения читает корневой режим до параллельного экспорта. Оркестрация переносит нейтральную настройку без знания конкретного компонента."
```

### Task 5: Закрепить публичный импорт и реальный round-trip расширения

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Temporarily create and delete: `packages/core/scripts/run-sed-any-reference-check.ts`
- Regenerate: `/Users/nikita/git/sed_nkdk/cfe/дкз`
- Verify only: `/Users/nikita/git/sed_xml/cfe/дкз`

**Interfaces:**
- Consumes: публичные `syncConfigurationFromXML`, `syncConfigurationToXML`, `validateProject`, `createProjectStateService`.
- Produces: доказательство, что восемь объектов больше не пропускаются, validation не содержит `AnyRef`, а старый режим выгружается обратно как `cfg:AnyRef`.

- [ ] **Step 1: Усилить публичный import-тест без изменения XML-фикстуры**

В `importConfigurationExtension.test.ts` скопировать существующий каталог fixture во временный каталог теста. Только в копии заменить по одному типу прикладного реквизита и реквизита формы на:

```xml
<v8:TypeSet>cfg:AnyRef</v8:TypeSet>
```

Добавить в копию корневого XML режим `Version8_3_20`. Импортировать копию публичным `importConfigurationFromXml` и проверить в двух YAML-файлах:

```ts
expect(catalog).toMatchObject({
  Реквизиты: { РеквизитСправочника: { Тип: "ЛюбаяСсылка" } },
})
expect(form).toMatchObject({
  Реквизиты: { СобственныйРеквизитФормы: { Тип: "ЛюбаяСсылка" } },
})
```

Исходный каталог `__fixtures__/configurationExtension` не изменять.

- [ ] **Step 2: Запустить публичный import-тест**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: прикладной объект и форма импортируются как `ЛюбаяСсылка`; ошибок `AnyRef` нет.

- [ ] **Step 3: Создать временный штатный проверочный запуск**

Создать `packages/core/scripts/run-sed-any-reference-check.ts`, который:

```ts
import { writeFile } from "node:fs/promises"
import {
  createProjectStateService,
  syncConfigurationFromXML,
  syncConfigurationToXML,
  validateProject,
} from "../index"

const projectDir = "/Users/nikita/git/sed_nkdk"
const xmlDir = "/Users/nikita/git/sed_xml/cfe/дкз"
const outputXmlDir = "/private/tmp/nkdk-sed-cfe-anyref"
const importContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
  fromXML: { forReference: false },
} as const
const exportContext = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

const imported = await syncConfigurationFromXML({
  context: importContext,
  inputDir: xmlDir,
  projectDir,
})
const validation = await validateProject({ projectDir, concurrency: 4 })
const projectState = createProjectStateService()
try {
  const exported = await syncConfigurationToXML({
    context: exportContext,
    projectDir,
    componentPath: "cfe/дкз",
    xmlDir: outputXmlDir,
    projectState,
  })
  await writeFile("/private/tmp/nkdk-sed-anyref-result.json", JSON.stringify({
    imported,
    exported,
    diagnostics: [...validation.diagnostics],
  }, null, 2))
} finally {
  await projectState.close()
}
```

- [ ] **Step 4: Удалить только восстанавливаемый результат расширения и внутренние снимки**

Пользователь ранее разрешил повторную загрузку этого расширения и постоянно разрешил удаление внутренних `.nkdk`-снимков:

```bash
rm -rf /Users/nikita/git/sed_nkdk/cfe/дкз
rm -rf /Users/nikita/git/sed_nkdk/.nkdk/components/cfe/дкз
rm -f /Users/nikita/git/sed_nkdk/.nkdk/cache/project-state.bin
rm -rf /private/tmp/nkdk-sed-cfe-anyref
pnpm --filter @nkdk/core exec tsx scripts/run-sed-any-reference-check.ts
```

Не изменять `/Users/nikita/git/sed_xml/cfe/дкз`.

- [ ] **Step 5: Проверить результат реального импорта и экспорта**

Проверить наличие восьми ранее пропущенных YAML-файлов и отсутствие исходной ошибки:

```bash
jq '[.imported.failed[] | select((.message // "") | contains("AnyRef"))] | length' /private/tmp/nkdk-sed-anyref-result.json
jq '[.diagnostics[] | select((.message // "") | contains("AnyRef"))] | length' /private/tmp/nkdk-sed-anyref-result.json
rg -l -S 'cfg:AnyRef' /private/tmp/nkdk-sed-cfe-anyref | wc -l
rg -n -S 'cfg:AnyIBRef' /private/tmp/nkdk-sed-cfe-anyref
```

Expected: обе jq-проверки дают `0`; экспорт старого режима содержит `cfg:AnyRef` и не содержит `cfg:AnyIBRef`. Отдельно перечислить оставшиеся validation errors и warnings — не маскировать их общим числом.

- [ ] **Step 6: Удалить временный скрипт и запустить полную проверку**

```bash
rm packages/core/scripts/run-sed-any-reference-check.ts
pnpm type-check
pnpm test
pnpm duplicates -- --base 1d20ab9ef
pnpm test:architecture:rules
pnpm test:architecture
git diff --check 1d20ab9ef..HEAD
```

Expected: все команды exit 0; новых дублей и нарушений архитектурных границ нет.

- [ ] **Step 7: Зафиксировать интеграционный тест**

```bash
git add packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
git commit -m "test: :white_check_mark: проверить AnyRef в расширении" \
  -m "Публичный импорт прикладного объекта и формы должен сводить старое XML-написание к канонической ЛюбаяСсылка."
```

- [ ] **Step 8: Проверить чистоту ветки и сформировать итог**

```bash
git status --short
git log --oneline 1d20ab9ef..HEAD
```

Expected: в worktree нет незакоммиченных файлов; временный скрипт отсутствует. В отчёте перечислить изменённые тесты и уникальный договор каждого, результаты реального импорта/экспорта, полных тестов, duplicates и architecture.
