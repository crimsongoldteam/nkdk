# Extension Empty Property Representation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести пустые поля заимствованных объектов к согласованному YAML-договору: собственный пустой `Комментарий` опускается, изменяемое `plain`-свойство сохраняет `""`, а `ОбъектРасширяемойКонфигурации` представляет четыре сочетания UUID и режима без `Ложь`.

**Architecture:** Реестр `PropertyState` остаётся единственным источником класса свойства. Импорт присутствующих пустых значений применяется только к `availability: borrowed`; собственные поля проходят обычный путь `implicitValueYAML`. Кодирование служебного флажка изолируется в предметном модуле рядом с импортом и экспортом расширений; формат LMDB и общие типы правил не меняются.

**Tech Stack:** TypeScript 7, Vitest, TypeBox, `js-yaml`, локальные YAML-теги NKDK, LMDB configuration index, pnpm workspace.

## Global Constraints

- Не изменять `e2e/fixtures/xml/**`: XML остаётся источником истины.
- Не менять формат LMDB, `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Не хранить UUID основной конфигурации в YAML или снимке расширения; UUID вычисляется по логическому адресу.
- Не вводить новые YAML-теги и не использовать `!xml` для рассматриваемых состояний.
- `Комментарий: ""`, `ОбъектРасширяемойКонфигурации: Ложь`, `false`, `Истина` и `true` не являются допустимыми формами нового договора.
- `Подсказка: ""` и другие пустые `plain`-значения сохраняются, только когда присутствие свойства означает изменение.
- Поддержанный XML после XML → YAML + LMDB → XML обязан совпадать побайтово.
- После каждого законченного слоя запускать `pnpm duplicates -- --base origin/develop`.
- Перед завершением выполнить `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

## File Structure

- `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts` — импорт `PropertyState` и присутствующих пустых свойств.
- `packages/rules/metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.ts` — двустороннее кодирование четырёх состояний служебного флажка.
- `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts` — применение декодированного состояния при построении XML.
- `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts` — схема собственных, `plain`- и служебных свойств расширения.
- `packages/rules/metadata/appliedObjects/*/rules.ts` — обязательный пустой `Comment` профиля `adopted` для шести правил, где договор ещё не объявлен.
- `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts` — полный импорт реального расширения в YAML и LMDB.
- `e2e/fixtures/nkdk/cfe/**` — производный эталон YAML, пересобираемый из неизменных XML-фикстур.

---

### Task 1: Разделить собственные пустые поля и изменяемые `plain`-свойства

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataBot/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCommandGroup/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCommonForm/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataConstant/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataInformationRegister/rules.ts`

**Interfaces:**
- Consumes: `PropertyStatePropertyCapability.availability`, `defaultValueXMLRaw`, `defaultValueAdoptedXML`, `implicitValueYAML`.
- Produces: импорт, где пустое собственное поле отсутствует, а пустое заимствованное `plain`-свойство сохраняет естественное пустое значение своего YAML-типа.

- [ ] **Step 1: Исправить модульный тест собственного комментария на новый договор**

В `propertyStates.test.ts` заменить ожидание текущего теста собственных полей и сохранить соседний параметризованный тест `plain`-свойств:

В тесте `сохраняет явное пустое собственное свойство заимствованного объекта`
переименовать случай в `не переносит пустое собственное свойство
заимствованного объекта` и заменить единственное итоговое ожидание на:

```ts
expect(yaml).toEqual({})
```

Существующий параметризованный borrowed plain probe не менять: для
присутствующего `ToolTip` он обязан ожидать `{ Подсказка: "" }`, для
отсутствующего — `{}`.

- [ ] **Step 2: Добавить RED-проверку схемы для собственного и `plain`-свойства**

В `propertyStateSchema.test.ts` построить схему с двумя возможностями:

```ts
comment: {
  availability: "own",
  modes: [],
  representation: "plain",
},
toolTip: {
  availability: "borrowed",
  modes: ["extend"],
  representation: "plain",
},
```

Проверить:

```ts
expect(validator.Check({})).toBe(true)
expect(validator.Check({ Комментарий: "Текст" })).toBe(true)
expect(validator.Check({ Комментарий: "" })).toBe(false)
expect(validator.Check({ Подсказка: "" })).toBe(true)
```

Правило `comment` в тесте должно иметь `defaultValueXMLRaw: ""` и `defaultValueAdoptedXML: ""`; правило `toolTip` — естественный строковый или I8n-тип с пустым XML-default.

- [ ] **Step 3: Запустить RED-тесты**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/appliedObjects/configurationExtension/propertyStates.test.ts \
  metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts \
  --no-isolate --project core-metadata
```

Expected: FAIL — augmenter добавляет `Комментарий: ""`; схема принимает собственное пустое значение либо не различает собственное и заимствованное `plain`-свойство.

- [ ] **Step 4: Ограничить сохранение присутствующего пустого XML свойствами `borrowed`**

В `importPresentProperties` итерироваться по возможностям и пропускать собственные поля:

```ts
for (const [propertyKey, capability] of Object.entries(item?.properties ?? {})) {
  if (capability.availability !== "borrowed") continue
  const propertyRule = params.rule.properties[propertyKey]
  if (propertyRule === undefined || typeof propertyRule.yaml !== "string") continue
}
```

После этих двух guards оставить существующее разрешение XML-имени, проверку
присутствия и преобразование пустого значения без изменений. Не добавлять
условие по имени `comment`: правило должно работать для любого
`availability: own`.

- [ ] **Step 5: Запретить собственное пустое значение схемой без запрета очищенного `plain`**

В `propertyStateSchema.ts` применять возврат неявного значения только к заимствованным свойствам. Для собственного строкового/I8n-поля, у которого `implicitValueYAML === ""` либо пустой `defaultValueXMLRaw` однозначно восстанавливается правилом, пересечь исходную схему с запретом пустой строки:

```ts
const withImplicitValue = capability?.availability === "own"
  ? ownPropertySchema(schema, propertyRule)
  : implicitValueSchema(
      capability?.representation === "plain"
        ? plainEmptySchema(schema, propertyRule)
        : isScalarMetadataTarget(propertyRule)
          ? Type.Union([schema, Type.Null()])
          : schema,
      getImplicitValueYAML(propertyRule),
    )
```

`ownPropertySchema` использует тип и объявленные defaults правила, а не `propertyKey === "comment"`. `preserveExplicitDefaultXML: true` остаётся исключением: такое правило вправе хранить явный default.

Добавить функцию с точной сигнатурой:

```ts
function ownPropertySchema(source: TSchema, rule: PropertyRule): TSchema {
  if (rule.preserveExplicitDefaultXML === true) return source
  const implicit = getImplicitValueYAML(rule) ?? (
    (rule.type === "string" || rule.type === "I8nText") && rule.defaultValueXMLRaw === ""
      ? ""
      : undefined
  )
  return implicit === undefined
    ? source
    : Type.Intersect([source, notSchema(Type.Literal(implicit))])
}
```

- [ ] **Step 6: Объявить обязательный пустой `Comment` для всех оставшихся adopted-правил**

В шести перечисленных `rules.ts` дополнить именно свойство `comment`:

```ts
comment: stringRule({
  yaml: "Комментарий",
  xmlParents: properties,
  defaultValueXMLRaw: "",
  defaultValueAdoptedXML: "",
}),
```

Если правило уже содержит остальные параметры, сохранить их без перестановки. Это обеспечивает `<Comment/>` при отсутствии YAML-поля и не переносит состояние в снимок.

- [ ] **Step 7: Подтвердить GREEN и отсутствие дублей**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/appliedObjects/configurationExtension/propertyStates.test.ts \
  metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts \
  --no-isolate --project core-metadata
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS; собственный комментарий отсутствует, `plain`-очистка сохранена, TypeScript и проверка дублей зелёные.

- [ ] **Step 8: Commit**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts \
  packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts \
  packages/rules/metadata/appliedObjects/metadataBot/rules.ts \
  packages/rules/metadata/appliedObjects/metadataCommandGroup/rules.ts \
  packages/rules/metadata/appliedObjects/metadataCommonForm/rules.ts \
  packages/rules/metadata/appliedObjects/metadataConstant/rules.ts \
  packages/rules/metadata/appliedObjects/metadataDataProcessor/rules.ts \
  packages/rules/metadata/appliedObjects/metadataInformationRegister/rules.ts
git commit -m "fix: 🐛 разделить собственные и изменяемые поля расширений"
```

---

### Task 2: Реализовать четыре состояния `ОбъектРасширяемойКонфигурации`

**Files:**
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.ts`
- Create: `packages/rules/metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts`

**Interfaces:**
- Consumes: `markYAMLScalarTag`, `yamlScalarTagAt`, наличие `ExtendedConfigurationObject` в XML и режим `Notify` из проверенного реестра.
- Produces:

```ts
export interface ExtendedConfigurationObjectState {
  readonly uuidPresent: boolean
  readonly mode: "control" | "notify"
}

export function writeExtendedConfigurationObjectYAML(
  yaml: Record<string, unknown>,
  state: ExtendedConfigurationObjectState,
): void

export function readExtendedConfigurationObjectYAML(
  yaml: Readonly<Record<string, unknown>>,
): ExtendedConfigurationObjectState
```

- [ ] **Step 1: Написать RED-тест кодека четырёх состояний**

В новом тесте проверить сериализованный текст и обратный разбор:

```ts
it.each([
  [{ uuidPresent: true, mode: "control" }, ""],
  [{ uuidPresent: false, mode: "control" }, "ОбъектРасширяемойКонфигурации:"],
  [{ uuidPresent: true, mode: "notify" }, "ОбъектРасширяемойКонфигурации: !проверять"],
  [{ uuidPresent: false, mode: "notify" }, 'ОбъектРасширяемойКонфигурации: !проверять ""'],
] as const)("кодирует %#", (state, expectedYAML) => {
  const yaml: Record<string, unknown> = {}
  writeExtendedConfigurationObjectYAML(yaml, state)
  expect(exportToYAML(yaml)).toBe(expectedYAML)
  expect(readExtendedConfigurationObjectYAML(parseMetadataYaml(expectedYAML).data as Record<string, unknown>))
    .toEqual(state)
})
```

Добавить отрицательные случаи для `Ложь`, `false`, `Истина`, `true`, строкового UUID, `!изменять` и пустой строки без `!проверять`; ошибка должна называть `ОбъектРасширяемойКонфигурации` и допустимые формы.

- [ ] **Step 2: Запустить тест кодека и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.test.ts \
  --no-isolate --project core-metadata
```

Expected: FAIL — модуль и функции ещё не существуют.

- [ ] **Step 3: Реализовать предметный кодек**

В `extendedConfigurationObjectYAML.ts` использовать константу YAML-имени и следующую таблицу внутренних значений:

```ts
// control + UUID     -> ключ отсутствует
// control + no UUID  -> yaml[key] = {}
// notify + UUID      -> yaml[key] = {}; tag = "проверять"
// notify + no UUID   -> yaml[key] = ""; tag = "проверять"
```

`readExtendedConfigurationObjectYAML` обязан различать отсутствие ключа, пустой объект, тег и явную пустую строку. Он не принимает UUID или логические литералы из YAML.

- [ ] **Step 4: Перевести XML → YAML на кодек**

В `propertyStates.ts` не пропускать `ExtendedConfigurationObject` через обычное строковое преобразование и не записывать UUID. После проверки `PropertyState` собрать:

```ts
writeExtendedConfigurationObjectYAML(yaml, {
  uuidPresent: serviceProperties.hasExtendedConfigurationObject,
  mode: extendedConfigurationObjectNotify ? "notify" : "control",
})
```

Вызов выполняется только для поддерживаемого заимствованного объекта. Корневой
`MetadataConfigurationExtension` использует тот же кодек: отсутствие
`ExtendedConfigurationObject` в исходном XML даёт состояние
`uuidPresent: false, mode: "control"` и YAML `ОбъектРасширяемойКонфигурации:`.
Из статистики прикладных объектов корень исключается, но отдельного YAML-формата
для него нет.

- [ ] **Step 5: Перевести YAML → XML на кодек**

В `exportPropertyStates.ts` заменить сравнение с `"Ложь"`:

```ts
const extensionObject = readExtendedConfigurationObjectYAML(yaml)
if (extensionObject.uuidPresent) {
  if (adoptedUuid === undefined) {
    throw new Error(`Не найден UUID основной конфигурации: ${logicalAddress}`)
  }
  writeServiceProperty(/* ExtendedConfigurationObject, adoptedUuid */)
}
```

Режим `notify` добавляет ровно один `PropertyState` со значением `Notify` независимо от наличия UUID. Режим `control` отдельный `PropertyState` не создаёт.

- [ ] **Step 6: Обновить TypeBox-схему служебного поля**

В `propertyStateSchema.ts` удалить `Type.Literal("Ложь")`. Подлежащие проверке значения локальных тегов представлены как пустой объект и пустая строка, поэтому специальная схема принимает:

```ts
Type.Optional(Type.Union([
  Type.Object({}, { additionalProperties: false, maxProperties: 0 }),
  Type.Literal(""),
]))
```

Семантический кодек дополнительно требует `!проверять` у пустой строки; TypeBox не должен разрешать логические литералы и UUID.

- [ ] **Step 7: Расширить импортные и экспортные тесты четырьмя комбинациями**

В `propertyStates.test.ts` и `exportPropertyStates.test.ts` использовать `it.each` с таблицей из спецификации. Для импорта проверять значение и `yamlScalarTagAt`; для экспорта — наличие XML UUID и точную запись:

```ts
{ "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" }
```

Отдельно проверить отсутствие UUID основной конфигурации только для состояний `uuidPresent: true`.

- [ ] **Step 8: Запустить целевые тесты и проверки слоя**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.test.ts \
  metadata/appliedObjects/configurationExtension/propertyStates.test.ts \
  metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts \
  metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts \
  --no-isolate --project core-metadata
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS; все четыре состояния симметричны, `Ложь` и JS boolean отсутствуют в публичном YAML.

- [ ] **Step 9: Commit**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/extendedConfigurationObjectYAML.test.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts \
  packages/rules/metadata/appliedObjects/configurationExtension/propertyStateSchema.test.ts \
  packages/rules/metadata/ruleRuntime/property/propertyStateSchema.ts
git commit -m "fix: 🐛 закодировать состояния объекта расширяемой конфигурации"
```

---

### Task 3: Подтвердить полный импорт и обновить производный e2e YAML

**Files:**
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`
- Modify: `e2e/fixtures/nkdk/cfe/**` only through `pnpm fixtures:e2e:nkdk`
- Test: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: кодек `ExtendedConfigurationObjectState` из Task 2 и правила собственных/`plain`-полей из Task 1.
- Produces: актуальный производный YAML и доказательство побайтового XML round-trip через LMDB.

- [ ] **Step 1: Обновить интеграционные ожидания импорта**

В `importConfigurationExtension.integration.test.ts` заменить `"Ложь"` пустым управляющим значением и добавить проверки текста через `exportToYAML`:

```ts
expect(configuration).toEqual(expect.objectContaining({
  ОбъектРасширяемойКонфигурации: {},
}))
expect(exportToYAML(configuration)).toContain("ОбъектРасширяемойКонфигурации:")
expect(exportToYAML(configuration)).not.toContain("Ложь")
```

Для `borrowedAttribute` с `Notify` сохранить точную проверку
`yamlScalarTagAt(borrowedAttribute, "ОбъектРасширяемойКонфигурации") ===
"проверять"`; значение зависит от наличия UUID согласно таблице Task 2.
Добавить утверждение, что пустые собственные комментарии отсутствуют, а
`Подсказка: ""` остаётся у изменённого очищенного свойства.

- [ ] **Step 2: Обновить интеграционную проверку валидации проекта**

В `projectValidationPasses.integration.test.ts` заменить строку `ОбъектРасширяемойКонфигурации: Ложь` на документ с пустым ключом. Добавить рядом документ `ОбъектРасширяемойКонфигурации: !проверять ""` и подтвердить отсутствие структурной ошибки. Для `Ложь` и `false` ожидать структурную ошибку по пути `/ОбъектРасширяемойКонфигурации`.

- [ ] **Step 3: Запустить интеграционные тесты до обновления фикстур**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/importFromXml/importConfigurationExtension.integration.test.ts \
  --no-isolate --project native-lmdb-integration
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/projectValidationPasses.integration.test.ts \
  --no-isolate --project integration
```

Expected: PASS. Если локальный native LMDB аварийно завершается до выполнения теста, зафиксировать это как ограничение среды и не подменять проверку; обязательное свидетельство получить в CI на Linux, macOS и Windows.

- [ ] **Step 4: Пересобрать только производный NKDK fixture из неизменного XML**

Run:

```bash
pnpm fixtures:e2e:nkdk
```

После команды проверить:

```bash
git status --short
git diff -- e2e/fixtures/xml
rg -n 'ОбъектРасширяемойКонфигурации: (Ложь|false)' e2e/fixtures/nkdk/cfe
```

Expected: XML diff пуст; изменения находятся в `e2e/fixtures/nkdk/cfe`, пустые собственные комментарии исчезли, `plain`-очистки `Подсказка: ""` сохранились, логические литералы служебного флажка не найдены. Любые изменения `e2e/fixtures/nkdk/cf` считаются несвязанными и не включаются в этот task.

- [ ] **Step 5: Запустить полный e2e round-trip**

Run:

```bash
pnpm test:e2e
```

Expected: 25/25 tests PASS; импорт совпадает с обновлённым NKDK fixture, а `restores every XML component byte for byte` не содержит изменённых XML-файлов.

- [ ] **Step 6: Выполнить полную обязательную проверку проекта**

Run:

```bash
pnpm test
pnpm duplicates -- --base origin/develop
pnpm test:architecture:rules
pnpm test:architecture
git diff --check
```

Expected: все команды PASS; новых дублей, архитектурных нарушений и ошибок пробелов нет.

- [ ] **Step 7: Commit**

```bash
git add packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts \
  packages/rules/metadata/validation/projectValidationPasses.integration.test.ts \
  e2e/fixtures/nkdk/cfe
git commit -m "test: ✅ обновить пустые поля e2e расширений"
```

- [ ] **Step 8: Проверить итоговый diff относительно актуального develop**

Run:

```bash
git fetch origin develop
git diff --stat origin/develop...HEAD
git diff --check origin/develop...HEAD
```

Expected: diff содержит только согласованный договор расширений, ранее реализованный LMDB и связанные тесты; XML-фикстуры не изменены.
