# YAML Value Validation Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить универсальный запуск локальных семантических проверок по item/property-типу и через него проверять уникальность имён элементов как в отдельной, так и во вложенной общей форме.

**Architecture:** Validation-слой хранит нейтральный реестр `type -> validator` и вызывает его для корня файла и каждого присутствующего типизированного свойства из снимка `rules.ts`. Модуль `ClientApplicationForm` регистрирует проверку имён и передаёт базовый YAML-путь; отдельная форма сохраняет существующий объединённый обход, а вложенная форма использует локальный обход того же сборщика. Профиль передаётся декларативными именованными подшагами, без условий по типу формы в общем слое.

**Tech Stack:** TypeScript 6, Vitest 4, js-yaml parser with source locations, существующие metadata rules/registries, compiled Ajv standalone validation.

## Global Constraints

- Общие слои `metadata/orchestration`, `metadata/validation` и `metadata/project` не содержат условий по `ОбщаяФорма`, YAML-ключу `Форма` или `ClientApplicationForm`.
- Реестр выполняет только локальные диагностики первого прохода; он не строит проектные индексы, ссылки или проверки второго прохода.
- JSON Schema/TypeBox/Ajv продолжает проверять структуру; семантическая проверка запускается после schema validation.
- Имена сравниваются глобально только в пределах одного значения формы, всегда без учёта регистра.
- Single-имена резервируются всегда, включая отсутствующие вложенные single-элементы.
- Существующий быстрый объединённый обход отдельного `Форма.yaml` сохраняется.
- Существующие XML-фикстуры и правила fromXML/toXML/fromYAML/toYAML не изменяются.
- Перед закрытием задачи выполняется `pnpm test`; профилирование затем выполняется отдельно только через compiled standalone runner.

---

### Task 1: Нейтральный реестр локальных YAML-проверок

**Files:**
- Create: `packages/core/metadata/validation/yamlValueValidationRegistry.ts`
- Create: `packages/core/metadata/validation/yamlValueValidationRegistry.test.ts`

**Interfaces:**
- Consumes: `ParsedYaml`, `Diagnostic`, `YamlPath`.
- Produces:

```ts
export interface LocalYamlValueValidationParams {
  filePath: string
  parsed: ParsedYaml
  value: unknown
  yamlPath: YamlPath
  owner: { dir: string; name: string }
}

export interface LocalYamlValueValidationProfile {
  substep: string
  timeMs: number
}

export interface LocalYamlValueValidationResult {
  diagnostics: Diagnostic[]
  profile?: LocalYamlValueValidationProfile
}

export type LocalYamlValueValidator = (
  params: LocalYamlValueValidationParams
) => Diagnostic[]

export function registerLocalYamlValueValidator(params: {
  type: string
  validator: LocalYamlValueValidator
  profileSubstep?: string
}): void
export function validateRegisteredLocalYamlValue(
  params: LocalYamlValueValidationParams & { type: string }
): LocalYamlValueValidationResult
```

- Для изоляции тестов также предоставляет `snapshotLocalYamlValueValidationRegistryForTests()` и `restoreLocalYamlValueValidationRegistryForTests(snapshot)`.

- [ ] **Step 1: Write the failing registry tests**

Проверить передачу значения, владельца и базового пути, а также пустой результат незарегистрированного типа:

```ts
it("dispatches a local validator by type with the base YAML path", () => {
  registerLocalYamlValueValidator({
    type: "NestedValue",
    validator: (params) => [
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: [...params.yamlPath, "Ошибка"],
        severity: "error",
        source: "structure",
        message: "registered value failure",
      }),
    ],
  })

  const result = validateRegisteredLocalYamlValue({
    type: "NestedValue",
    filePath: "/project/Свойства.yaml",
    parsed: parseMetadataYaml("Значение:\n  Ошибка: true\n"),
    value: { Ошибка: true },
    yamlPath: ["Значение"],
    owner: { dir: "Тест", name: "Объект" },
  })

  expect(result.diagnostics).toEqual([
    expect.objectContaining({ path: "/Значение/Ошибка", message: "registered value failure" }),
  ])
})

it("returns no diagnostics for an unregistered type", () => {
  expect(validateRegisteredLocalYamlValue({
    type: "Unknown",
    filePath: "/project/Свойства.yaml",
    parsed: parseMetadataYaml("{}\n"),
    value: {},
    yamlPath: [],
    owner: { dir: "Тест", name: "Объект" },
  })).toEqual({ diagnostics: [] })
})
```

- [ ] **Step 2: Run the registry test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlValueValidationRegistry.test.ts
```

Expected: FAIL, потому что модуль и функции реестра ещё не существуют.

- [ ] **Step 3: Implement the minimal registry**

Хранить одну запись `{ validator, profileSubstep? }` на строковый тип. Повторная регистрация заменяет запись для того же типа; вызов незарегистрированного типа возвращает `{ diagnostics: [] }`. Если задан `profileSubstep`, реестр измеряет вызов через `performance.now()` и добавляет профиль; сам обработчик возвращает только diagnostics. Snapshot/restore копируют и восстанавливают карту без знания конкретных типов.

- [ ] **Step 4: Run the registry tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlValueValidationRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the registry**

```bash
git add packages/core/metadata/validation/yamlValueValidationRegistry.ts packages/core/metadata/validation/yamlValueValidationRegistry.test.ts
git commit -m "feat(validation): ✨ добавить реестр локальных YAML-проверок"
```

---

### Task 2: Универсальный вызов для корня и типизированных свойств

**Files:**
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.test.ts`

**Interfaces:**
- Consumes: `validateRegisteredLocalYamlValue()` из Task 1 и `ValidationRulesSpecSnapshot.itemType`.
- Produces:

```ts
export interface ValidationProjectFile {
  // existing fields
  itemType: string
}

export interface ValidationYamlFacts {
  // existing fields
  localValueValidationProfile: Record<string, { items: number; timeMs: number }>
}
```

- `itemType` формируется декларативно: для `form` из `MetadataProjectFormYamlRef.itemType`, для `properties/configuration` из `resource.owner.spec.rule.itemType`.

- [ ] **Step 1: Write failing project-file item type assertions**

Дополнить существующие тесты:

```ts
expect(resolveValidationProjectFile(projectDir, "Справочник/Товары/Свойства.yaml"))
  .toMatchObject({ kind: "properties", itemType: "MetadataCatalog" })

expect(resolveValidationProjectFile(projectDir, absoluteFormPath))
  .toMatchObject({ kind: "form", itemType: "ClientApplicationForm" })

expect(resolveValidationProjectFile(projectDir, "Конфигурация.yaml"))
  .toMatchObject({ kind: "configuration", itemType: "MetadataConfiguration" })
```

- [ ] **Step 2: Run the project-file tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectFiles.test.ts
```

Expected: FAIL по отсутствующему `itemType`.

- [ ] **Step 3: Add neutral item type propagation**

Добавить обязательное поле `itemType` в `ValidationProjectFile` и заполнить его во всех трёх ветвях `toValidationProjectFile()` без проверок конкретных типов.

- [ ] **Step 4: Write failing extractor dispatch tests**

В `yamlFactExtractor.test.ts` временно зарегистрировать тестовые обработчики со snapshot/restore:

```ts
registerLocalYamlValueValidator({
  type: spec.itemType,
  validator: ({ yamlPath, value }) => [testDiagnostic(yamlPath, value)],
})
```

Проверить два независимых договора:

- обработчик корневого `itemType` получает `parsed.data` и `yamlPath: []`;
- обработчик типа присутствующего свойства получает его значение и полный путь из снимка, например `["Реквизиты", "Артикул", "Тип"]`;
- отсутствующее свойство не вызывает обработчик;
- незарегистрированные типы не добавляют диагностик.

- [ ] **Step 5: Run extractor tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlFactExtractor.test.ts
```

Expected: FAIL, обработчики ещё не вызываются.

- [ ] **Step 6: Dispatch validators during the existing traversal**

В `extractValidationYamlFacts()`:

1. вызвать корневой обработчик по `file.itemType` и `yamlPath: []`;
2. передать аккумулятор diagnostics/profile в `collectPendingReferences()`;
3. сразу после обнаружения присутствующего `property.type` вызвать обработчик с `value` и рассчитанным `yamlPath`;
4. при рекурсивном обходе передавать тот же аккумулятор;
5. не вызывать обработчик при `validationDiagnostics: false`;
6. агрегировать профиль по `profile.substep`, увеличивая `items` на один вызов и суммируя `timeMs`.

Корневой вызов для отдельной формы не должен создавать второй обход: ветка `extractFormYamlFacts()` продолжает использовать объединённый сборщик и только публикует совместимый именованный профиль.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectFiles.test.ts metadata/validation/yamlFactExtractor.test.ts metadata/validation/yamlFactExtractor.form.test.ts
```

Expected: PASS; поведение отдельной формы не изменилось.

- [ ] **Step 8: Commit generic dispatch**

```bash
git add packages/core/metadata/validation/projectFiles.ts packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/yamlFactExtractor.test.ts
git commit -m "feat(validation): ✨ запускать локальные проверки по типу YAML"
```

---

### Task 3: Регистрация проверки управляемой формы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/validateElementNames.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/register.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.form.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`

**Interfaces:**
- Consumes: `registerLocalYamlValueValidator()` и `LocalYamlValueValidationParams`.
- Produces:

```ts
export const FORM_ELEMENT_NAMES_PROFILE_SUBSTEP =
  "Проверка уникальности имён элементов формы"

export function validateFormElementNames(params: {
  filePath: string
  parsed: ParsedYaml
  value: unknown
  yamlPath: YamlPath
  rule: MetadataItemRule
}): Diagnostic[]
```

- Диагностические пути строятся от `yamlPath`: отдельная форма передаёт `[]`, общая форма — `["Форма"]`.

- [ ] **Step 1: Write failing common-form behavior tests**

В `projectValidationPasses.test.ts` добавить проверку первого прохода:

```ts
writeProjectFile(projectDir, "ОбщаяФорма/РабочийСтол/Свойства.yaml", [
  "Форма:",
  "  Элементы:",
  "    Поле:",
  "      Вид: ПолеВвода",
  "    полерасширеннаяподсказка:",
  "      Вид: ПолеВвода",
])

expect(first.diagnostics).toEqual(expect.arrayContaining([
  expect.objectContaining({
    source: "structure",
    path: "/Форма/Элементы/полерасширеннаяподсказка",
    message: expect.stringContaining("занято"),
  }),
]))
```

Добавить ещё три случая:

- одинаковые имена в двух разных файлах `ОбщаяФорма/*/Свойства.yaml` не конфликтуют;
- `Форма: строка` не приводит к аварии локального обработчика и остаётся schema diagnostic;
- существующий тест отдельного `Форма.yaml` по-прежнему возвращает путь `/Элементы/...`, без префикса `/Форма`.

- [ ] **Step 2: Run common-form tests and verify the semantic case fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationPasses.test.ts metadata/validation/yamlFactExtractor.form.test.ts
```

Expected: структурный Ajv-тест проходит, а новый семантический конфликт общей формы пока не найден.

- [ ] **Step 3: Make the form-name traversal base-path aware**

Изменить `validateFormElementNames()` так, чтобы он читал `params.value`, безопасно возвращал `[]` для не-объекта и начинал `ownerPath` с `params.yamlPath`. Все существующие вызовы в `validate.ts` передают `value: entry.parsed.data` и `yamlPath: []`.

- [ ] **Step 4: Register the ClientApplicationForm validator**

В `clientApplicationForm/register.ts` добавить:

```ts
registerLocalYamlValueValidator({
  type: "ClientApplicationForm",
  profileSubstep: FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
  validator: (params) =>
    validateFormElementNames({
      ...params,
      rule: ClientApplicationFormRules,
    }),
})
```

Регистрация живёт в модуле формы; общий validation-код не импортирует `ClientApplicationFormRules` ради определения типа свойства.

- [ ] **Step 5: Run form and common-form tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm metadata/validation/yamlFactExtractor.form.test.ts metadata/validation/projectValidationPasses.test.ts
```

Expected: PASS для отдельной и общей формы, изоляции файлов и невалидной вложенной структуры.

- [ ] **Step 6: Commit form registration**

```bash
git add packages/core/metadata/forms/clientApplicationForm/validateElementNames.ts packages/core/metadata/forms/clientApplicationForm/register.ts packages/core/metadata/forms/clientApplicationForm/validate.ts packages/core/metadata/validation/yamlFactExtractor.form.test.ts packages/core/metadata/validation/projectValidationPasses.test.ts
git commit -m "feat(forms): ✨ проверять имена элементов общей формы"
```

---

### Task 4: Сквозной профиль и compiled standalone regression

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`

**Interfaces:**
- Consumes: `ValidationYamlFacts.localValueValidationProfile`.
- Produces: именованные показатели локальных проверок проходят через `ProjectValidationFileFacts.profile`, `ProjectValidationFirstPassProfile` и сводку worker без частных полей/условий.

- [ ] **Step 1: Write failing worker regression tests**

Добавить в `preparedYamlProjectWorker.test.ts`:

1. first-pass задача с `ОбщаяФорма/РабочийСтол/Свойства.yaml`, содержащей конфликт `Поле` / `полерасширеннаяподсказка`, возвращает диагностику `/Форма/Элементы/полерасширеннаяподсказка`;
2. при `NKDK_PROFILE=1` профиль содержит строку `Проверка уникальности имён элементов формы` с `items=1` для одного значения общей формы;
3. два файла общих форм дают `items=2`, но не объединяют состояния имён.

- [ ] **Step 2: Run worker tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts
```

Expected: FAIL по отсутствующей сквозной передаче именованного профиля и/или диагностике общей формы.

- [ ] **Step 3: Replace the hard-coded timing field with a named profile map**

Протащить `Record<string, { items: number; timeMs: number }>` через профили первого прохода. Объединять карты функцией, которая суммирует `items` и `timeMs` по ключу. В `recordFirstPassProfile()` обходить записи и вызывать:

```ts
profiler.record("Первичная проверка YAML", substep, {
  items: value.items,
  timeMs: value.timeMs,
})
```

Удалить специальный `formElementNamesMs` после переноса всех существующих вызовов. Для объединённого обхода отдельной формы публиковать тот же `FORM_ELEMENT_NAMES_PROFILE_SUBSTEP`; для зарегистрированного обработчика общей формы имя приходит из результата реестра.

- [ ] **Step 4: Run worker and validation-pass tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts metadata/validation/projectValidationPasses.test.ts metadata/validation/yamlFactExtractor.form.test.ts
```

Expected: PASS; профиль сохраняет прежнее русское имя подшага и корректное число проверенных форм.

- [ ] **Step 5: Commit profiling integration**

```bash
git add packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorker.test.ts
git commit -m "refactor(validation): ♻️ обобщить профиль локальных YAML-проверок"
```

---

### Task 5: Архитектурная фиксация и полная проверка

**Files:**
- Modify: `.agents/architecture.md`
- Modify: `docs/superpowers/specs/2026-07-29-yaml-value-validation-registry-design.md` only if implementation reveals an approved-contract clarification.

**Interfaces:**
- Consumes: готовый реестр и точки вызова из Tasks 1–4.
- Produces: документированная граница ответственности schema validation и локальных property/item-type validators.

- [ ] **Step 1: Update the architecture document**

Добавить короткий раздел:

```md
### Локальные проверки YAML-значений

Локальные семантические проверки первого прохода регистрируются по property/item-типу.
Общий validation-слой вызывает регистрацию для корня файла и присутствующих свойств
из снимка rules.ts, не зная конкретных metadata-типов. JSON Schema отвечает за форму
данных; зарегистрированный обработчик — за локальные инварианты значения.
```

Зафиксировать запрет проектных индексов, ссылок и второго прохода внутри такого обработчика.

- [ ] **Step 2: Run focused tests and type checking**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlValueValidationRegistry.test.ts metadata/validation/projectFiles.test.ts metadata/validation/yamlFactExtractor.test.ts metadata/validation/yamlFactExtractor.form.test.ts metadata/validation/projectValidationPasses.test.ts metadata/project/preparedYamlProjectWorker.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: все тесты PASS, TypeScript без ошибок.

- [ ] **Step 3: Run the required full project test before profiling**

Run:

```bash
pnpm test
```

Expected: все пакеты `packages/*` проходят. Этот шаг завершается до входа в процедуру `validation-profile`, поскольку она запрещает запуск `pnpm test`.

- [ ] **Step 4: Build and profile the compiled standalone path**

Следовать skill `validation-profile`:

```bash
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml/cf --runs 5 --timing
```

Expected:

- режим `compiled standalone`;
- итоговые diagnostics разделены на errors/warnings и не называются числом конфликтов имён;
- отдельная строка `Проверка уникальности имён элементов формы` показывает время нового шага;
- в отчёте сохранены cold, warm avg/min/max, peak RSS, RSS по прогонам и worker timing.

- [ ] **Step 5: Inspect the diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: нет пробельных ошибок; меняются только файлы реализации, тестов, плана и архитектуры этой задачи.

- [ ] **Step 6: Commit documentation and final adjustments**

```bash
git add .agents/architecture.md docs/superpowers/specs/2026-07-29-yaml-value-validation-registry-design.md
git commit -m "docs(architecture): 📝 описать локальные YAML-проверки"
```

Не добавлять в commit результаты профилирования.
