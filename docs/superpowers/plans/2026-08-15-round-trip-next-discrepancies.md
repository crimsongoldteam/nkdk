# Round-trip следующих расхождений Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить четыре согласованных класса расхождений: XML-псевдоним `CheckBoxType.Switcher`, битые ссылки прямых `metadataTarget`-свойств, пустой ссылочный ключ `UserVisible` и вариант `DataPathTableInfo.Registered`.

**Architecture:** Системное перечисление исправляется в существующей таблице XML-псевдонимов. Битые прямые ссылки получают переносчик уровня `metadataTargets`, который подключается к типам `string`, `MetadataItemLink` и `MetadataField`, но срабатывает только при наличии `metadataTarget`; синтаксис пустого тегированного ключа добавляется в YAML runtime, а допустимость ограничивается типом `UserVisible`. Проверка `Registered` расширяет существующую пограничную проверку переносимого состояния без изменения модели и двоичного формата.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, js-yaml 5, pnpm.

## Global Constraints

- Источник договора: `docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md`.
- Исходные XML-фикстуры не изменять.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не добавлять частные условия по форме, имени YAML-свойства или `itemType` в нейтральные слои.
- `!xml/reference` используется только для согласованных строгих внутренних форм и пустого ключа роли `UserVisible`.
- UUID и `число:UUID`, отмеченные `!xml/reference`, не разрешать через индекс, не включать в поиск ссылок и не переименовывать.
- Нетегированные внутренние формы и неверное содержимое тега должны оставаться структурными ошибками.
- Не менять зависимость `js-yaml` и `.agents/architecture.md`.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base ee7c54e7c`.
- Реализацию выполнять без субагентов; отдельный субагент допускается только для итогового ревью по спецификации и этому плану.

---

### Task 1: XML-псевдоним CheckBoxType.Switcher

**Files:**
- Modify: `packages/rules/metadata/systemEnumerations/xmlAliases.ts`
- Modify: `packages/rules/metadata/systemEnumerations/roundTrip.integration.test.ts`
- Modify: `packages/rules/tests/directConversion.ts`

**Interfaces:**
- Consumes: `applySystemEnumerationXMLAlias(type, direction, value)`.
- Produces: двусторонний псевдоним `CheckBoxType.Switcher` ↔ внутреннее значение `Switch`.

- [ ] **Step 1: Add the failing round-trip test**

Добавить самостоятельный договор рядом с тестами `RadioButtonType`:

```ts
it("преобразует XML Switcher в YAML Выключатель и обратно", () => {
  const contexts = createDirectRoundTripContexts()
  const rule = {
    itemType: "CheckBoxTypeAliasProbe",
    properties: {
      mode: {
        type: "SystemEnumeration",
        typeSE: "CheckBoxType",
        xml: "CheckBoxType",
        yaml: "ВидФлажка",
      },
    },
  } as const satisfies MetadataItemRule

  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    rule,
    xml: { CheckBoxType: "Switcher" },
  })
  const exported = testPropertyFromYAMLToXML({
    context: contexts.exportContext(),
    rule,
    yaml: imported.yaml,
  })

  expect(imported.yaml).toEqual({ ВидФлажка: "Выключатель" })
  expect(exported.xml).toEqual({ CheckBoxType: "Switcher" })
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/systemEnumerations/roundTrip.integration.test.ts
```

Expected: FAIL — импорт оставляет `Switcher` неизвестным либо обратный экспорт выдаёт `Switch`.

- [ ] **Step 3: Register the alias**

Добавить в `systemEnumerationXMLAliases`:

```ts
CheckBoxType: {
  toXML: { Switch: "Switcher" },
  fromXML: { Switcher: "Switch" },
},
```

- [ ] **Step 4: Verify GREEN and unchanged neighbors**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/systemEnumerations/roundTrip.integration.test.ts
pnpm duplicates -- --base ee7c54e7c
```

Expected: PASS; существующие проверки `RadioButtonType` остаются зелёными. Полный набор форм проверяется в Task 6.

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/systemEnumerations/xmlAliases.ts packages/rules/metadata/systemEnumerations/roundTrip.integration.test.ts packages/rules/tests/directConversion.ts docs/superpowers/plans/2026-08-15-round-trip-next-discrepancies.md
git commit -m "fix: :bug: восстановить XML-псевдоним Switcher"
```

---

### Task 2: Пустой ключ с тегом !xml/reference в YAML runtime

**Files:**
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.test.ts`

**Interfaces:**
- Consumes: `markYAMLMappingKeyTag`, `yamlMappingKeyTagAt`, `serializeYAMLDocument`.
- Produces: синтаксический разбор и сериализация ключа `!xml/reference ""`; смысловую допустимость определяет тип свойства, а не YAML runtime.

- [ ] **Step 1: Add failing parser and serializer tests**

В `jsYamlParser.test.ts` заменить пустой тегированный ключ в таблице недопустимых случаев на отдельный положительный тест:

```ts
it("разбирает пустой скалярный ключ с !xml/reference", () => {
  const parsed = parseWithJsYaml('Роли:\n  !xml/reference "": Ложь')
  const roles = (parsed.data as { Роли: Record<string, string> }).Роли

  expect(parsed.syntaxErrors).toEqual([])
  expect(roles).toEqual({ "": "Ложь" })
  expect(yamlMappingKeyTagAt(roles, "")).toBe("xml/reference")
})
```

Сохранить отрицательные проверки составного ключа и `!xml/value`. В `export.test.ts` добавить:

```ts
it("сериализует пустой ключ с !xml/reference", () => {
  const roles = { "": "Ложь" }
  markYAMLMappingKeyTag(roles, "", "xml/reference")

  const serialized = serializeYAMLDocument({ Роли: roles })
  const reparsed = parseMetadataYaml(serialized.text)

  expect(serialized.text).toBe('Роли:\n  !xml/reference "": Ложь')
  expect(yamlMappingKeyTagAt(
    (reparsed.data as { Роли: Record<string, string> }).Роли,
    "",
  )).toBe("xml/reference")
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/jsYamlParser.test.ts yaml/export.test.ts
```

Expected: FAIL с сообщением, что `!xml/reference` поддерживает только непустой ключ.

- [ ] **Step 3: Permit an empty scalar payload syntactically**

В `collectMappingKeyTags` оставить запрет составного ключа, но убрать запрет `key.value === ""`:

```ts
if (key.kind !== "scalar") {
  throw new YAMLException("!xml/reference поддерживает только скалярный ключ")
}
```

Не добавлять сведения о `UserVisible` в YAML runtime.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/jsYamlParser.test.ts yaml/export.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm duplicates -- --base ee7c54e7c
```

Expected: PASS; составной ключ и чужая категория по-прежнему отклоняются.

- [ ] **Step 5: Commit**

```bash
git add packages/runtime/yaml/jsYamlParser.ts packages/runtime/yaml/jsYamlParser.test.ts packages/runtime/yaml/export.test.ts
git commit -m "feat: :sparkles: поддержать пустой тегированный ключ YAML"
```

---

### Task 3: Общий перенос прямых битых metadataTarget-ссылок

**Files:**
- Create: `packages/rules/metadata/commonObjects/metadataTargets/brokenDirectReference.ts`
- Create: `packages/rules/metadata/commonObjects/metadataTargets/brokenDirectReference.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/childFormNamesImportAdapter.integration.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: `BrokenXMLReferenceTypeCarrier`, `PropertyRule.metadataTarget`, `taggedYAMLScalar`, `xmlAnomalyTagPayload`, прямые `metadataTargetOccurrences` типов `string`, `MetadataItemLink`, `MetadataField`.
- Produces: `brokenDirectMetadataTargetReferenceCarrier` и `brokenDirectMetadataTargetReferenceRules`; строгие формы `UUID` и `число:UUID` переносятся без поиска.

- [ ] **Step 1: Add focused failing carrier tests**

В новом тесте получить переносчик из собранного исполнения и проверить оба направления для `MetadataItemLink` и `string`:

```ts
const uuid = "3062c54f-92ed-42c5-b62f-1c0e685cfe75"
const segmented = "1:93701593-5ac8-4266-b471-7e9ed35a9c3e"

it.each([
  ["MetadataItemLink", uuid],
  ["string", segmented],
] as const)("переносит прямую внутреннюю ссылку типа %s", (type, payload) => {
  const rule = {
    type,
    yaml: "Ссылка",
    metadataTarget: { kind: "object", roots: ["Catalog"] },
  } as const
  const carrier = execution.getTypeRule(type, "brokenXMLReferenceCarrier")!

  const imported = carrier.tryImport({ rule, xmlValue: payload, yamlValue: payload })
  expect(imported).toEqual({
    yamlValue: expect.objectContaining({ tag: "xml/reference" }),
    taggedLocations: [{ kind: "value", path: [] }],
  })

  const prepared = carrier.prepareExport({
    rule,
    yamlValue: `!xml/reference ${payload}`,
    isTagged: () => true,
  })
  expect(prepared?.transportedLocations).toEqual([{ kind: "value", path: [] }])
  expect(carrier.patchExportedXML({
    rule,
    yamlValue: `!xml/reference ${payload}`,
    xmlValue: "",
    transportedLocations: prepared!.transportedLocations,
  })).toBe(payload)
})
```

Добавить отрицательные случаи: нет `metadataTarget`; произвольная строка; `число:UUID` для нетегированного YAML; неверный payload тега.

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/metadataTargets/brokenDirectReference.test.ts
```

Expected: FAIL — общий переносчик прямых ссылок ещё не зарегистрирован.

- [ ] **Step 3: Implement the contextual direct carrier**

В `brokenDirectReference.ts` определить строгие грамматики и переносчик:

```ts
const DIRECT_BROKEN_REFERENCE_SOURCE =
  `(?:${MD_OBJECT_REF_UUID_SOURCE}|[0-9]+:${MD_OBJECT_REF_UUID_SOURCE})`
const DIRECT_BROKEN_REFERENCE = new RegExp(`^${DIRECT_BROKEN_REFERENCE_SOURCE}$`)

function directReferencePayload(value: unknown): string | undefined {
  const text = typeof value === "string"
    ? value
    : isRecord(value) && typeof value["#text"] === "string"
      ? value["#text"]
      : undefined
  return text !== undefined && DIRECT_BROKEN_REFERENCE.test(text) ? text : undefined
}
```

`tryImport` обязан:

```ts
if (rule.metadataTarget === undefined) return undefined
const payload = directReferencePayload(xmlValue)
if (payload === undefined) return undefined
return {
  yamlValue: taggedYAMLScalar("xml/reference", xmlAnomalyTagValue("xml/reference", payload)),
  taggedLocations: [{ kind: "value", path: [] }],
}
```

`prepareExport` обязан принимать только тегированное корневое значение, проверять payload по той же грамматике и временно передавать пустую строку штатному преобразованию. `patchExportedXML` восстанавливает payload в исходной скалярной XML-форме. `validationSchema` добавляет `Type.String({ pattern: '^!xml/reference ...$' })` только для validation graph и правила с `metadataTarget`; `matchesTaggedYAML` повторяет те же границы.

Экспортировать правила для трёх прямых типов:

```ts
export const brokenDirectMetadataTargetReferenceRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule("string", "brokenXMLReferenceCarrier", brokenDirectMetadataTargetReferenceCarrier),
    definePropertyTypeRule("MetadataItemLink", "brokenXMLReferenceCarrier", brokenDirectMetadataTargetReferenceCarrier),
    definePropertyTypeRule("MetadataField", "brokenXMLReferenceCarrier", brokenDirectMetadataTargetReferenceCarrier),
  ]),
})
```

Подключить набор в `legacyCoreRules` рядом с существующими переносчиками.

- [ ] **Step 4: Teach direct occurrences to recognize transported scalar wrappers**

В `collectDirectMetadataTargetOccurrences` до проверки строки распаковать `TaggedYAMLScalar` только при теге `xml/reference` и вернуть представление битой ссылки:

```ts
const tagged = isTaggedYAMLScalar(params.value) && params.value.tag === "xml/reference"
const value = tagged ? params.value.value : params.value
if (constraint === undefined || typeof value !== "string" || value === "") return []
return [{
  location: { kind: "value", path: params.yamlPath },
  constraint,
  representation: tagged
    ? {
        kind: "brokenXMLReference",
        payload: xmlAnomalyTagPayload("xml/reference", value),
        grammar: "uuid",
      }
    : { kind: "canonical", canonical: value },
  setValue: (_nextValue) => undefined,
}]
```

Если существующий тип `grammar` различает `uuid` и сегментированную форму, использовать соответствующее уже объявленное значение; не расширять общий тип ради строки `число:UUID`, если проверка целиком принадлежит переносчику.

- [ ] **Step 5: Add property-level integration regressions**

Для формы добавить прямой XML → YAML → XML случай `SettingsStorage` с UUID и проверить тег через `yamlScalarTagAt`. Для `DynamicList` добавить `MainTable: "1:93701593-5ac8-4266-b471-7e9ed35a9c3e"`, ожидать смысловое значение `!xml/reference ...`, отметку `xml/reference` и точный обратный XML.

Проверить отдельно, что обычные ссылки `SettingsStorage.Имя` и `Catalog.Справочник1` сохраняют прежнее преобразование и что нетегированная внутренняя форма выдаёт структурную диагностику.

- [ ] **Step 6: Verify GREEN and no lookup**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/metadataTargets/brokenDirectReference.test.ts metadata/commonObjects/metadataTargets/validationHandlers.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/childFormNamesImportAdapter.integration.test.ts metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ee7c54e7c
```

Expected: PASS; тесты с поддельным индексом дополнительно утверждают отсутствие вызовов разрешения и поиска для обеих внутренних форм.

- [ ] **Step 7: Commit**

```bash
git add packages/rules/metadata/commonObjects/metadataTargets packages/rules/metadata/composition/metadataRules.ts packages/rules/metadata/forms/clientApplicationForm/childFormNamesImportAdapter.integration.test.ts packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts
git commit -m "feat: :sparkles: переносить прямые битые ссылки"
```

---

### Task 4: Пустая битая ссылка роли UserVisible

**Files:**
- Modify: `packages/rules/metadata/commonObjects/userVisible/brokenReference.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/brokenReference.test.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/metadataTargetOccurrences.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/types.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/toXML.test.ts`

**Interfaces:**
- Consumes: YAML runtime из Task 2, `userVisibleRoleTarget`, `BrokenXMLReferenceTypeCarrier`.
- Produces: пустой ключ роли является битой ссылкой только с `!xml/reference`; XML `<xr:Value name="">false</xr:Value>` восстанавливается дословно.

- [ ] **Step 1: Add failing carrier and conversion tests**

Расширить таблицы существующих UUID-проверок пустым ключом:

```ts
const xml = { "xr:Value": { _name: "", "#text": false } }
const yaml = { Роли: { "": "Ложь" } }

expect(carrier.tryImport({ rule, xmlValue: xml, yamlValue: yaml })).toEqual({
  yamlValue: yaml,
  taggedLocations: [{ kind: "key", path: ["Роли"], key: "" }],
})
expect(yamlMappingKeyTagAt(yaml.Роли, "")).toBe("xml/reference")
```

Добавить YAML → XML проверку тегированного пустого ключа и отрицательную проверку того же ключа без тега. В проверках вхождений убедиться, что тегированный пустой ключ получает `brokenXMLReference`, а нетегированный — `canonical` и далее структурную ошибку отсутствующей роли.

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/userVisible/brokenReference.test.ts metadata/commonObjects/userVisible/fromXML.test.ts metadata/commonObjects/userVisible/toXML.test.ts
```

Expected: FAIL — переносчик и validation graph разрешают только UUID.

- [ ] **Step 3: Extend only the UserVisible carrier grammar**

Ввести локальную проверку:

```ts
function isBrokenUserVisibleRoleName(value: string): boolean {
  return value === "" || isMDObjectRefUuid(value)
}
```

Использовать её в `tryImport`, `prepareExport` и `matchesTaggedYAML`. Временное непустое имя создавать прежней `temporaryRoleName`; `patchExportedXML` возвращает исходный пустой `_name`.

Расширить validation graph только для переносчика `UserVisible`: шаблон ключа допускает `""` или UUID, тогда как обычная `UserVisibleJSONSchema` продолжает требовать непустое имя.

- [ ] **Step 4: Mark empty tagged occurrences as broken**

В `collectUserVisibleMetadataTargetOccurrences` использовать единый предикат пустого имени/UUID и наличие `yamlMappingKeyTagAt(...)= "xml/reference"`:

```ts
representation: isBrokenUserVisibleRoleName(key)
  && yamlMappingKeyTagAt(roles, key) === "xml/reference"
  ? { kind: "brokenXMLReference", payload: key, grammar: "uuid" }
  : { kind: "canonical", canonical: key }
```

Для model-представления пустое `item.name` также считать битой ссылкой до разбора цели. Не добавлять пустую строку в общий UUID-предикат.

- [ ] **Step 5: Verify GREEN and semantic boundary**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/userVisible/brokenReference.test.ts metadata/commonObjects/userVisible/fromXML.test.ts metadata/commonObjects/userVisible/toXML.test.ts metadata/commonObjects/userVisible/metadataTargetOccurrences.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ee7c54e7c
```

Expected: PASS; пустой тегированный ключ допустим только в `UserVisible`, пустой нетегированный ключ и произвольное содержимое тега отклоняются.

- [ ] **Step 6: Commit**

```bash
git add packages/rules/metadata/commonObjects/userVisible
git commit -m "feat: :sparkles: переносить пустую ссылку роли"
```

---

### Task 5: Пограничная проверка DataPathTableInfo.Registered

**Files:**
- Modify: `packages/rules/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/rules/metadata/projectState/fileUpdate.test.ts`

**Interfaces:**
- Consumes: существующий вариант `DataPathTableInfo` `{ kind: "Registered"; type: string }` и `assertExactKeys`.
- Produces: одинаковая проверка `Registered` в `typeInfo.table`, поле `table` и `source.table`.

- [ ] **Step 1: Add failing boundary tests**

В существующую таблицу переносимых `DataPath`-данных добавить три положительных варианта расположения `Registered`:

```ts
const registered = {
  kind: "Registered" as const,
  type: "DataCompositionSettingsComposer",
}
```

Проверить его в `typeInfo.table`, самостоятельном `table` поля и `source.table`. Добавить отрицательную таблицу:

```ts
it.each([
  ["без type", { kind: "Registered" }],
  ["type не строка", { kind: "Registered", type: 1 }],
  ["лишнее поле", { kind: "Registered", type: "X", extra: true }],
  ["неизвестный kind", { kind: "Unknown", type: "X" }],
])("отклоняет неверный Registered: %s", (_name, table) => {
  expect(() => assertProjectStateFileUpdateBatch(batchWithTable(table))).toThrow()
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/projectState/fileUpdate.test.ts
```

Expected: FAIL только для трёх положительных вариантов с `kind: "Registered"`.

- [ ] **Step 3: Extend the exact boundary validator**

В `assertDataPathTableInfo` перед `RegisterRecordSet` добавить:

```ts
if (table["kind"] === "Registered") {
  assertExactKeys(table, ["kind", "type"], path)
  assertString(table["type"], `${path}.type`)
  return
}
```

Не менять `DataPathTableInfo`, двоичный writer/reader или правила DataPath.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/projectState/fileUpdate.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/projectState/importSession.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ee7c54e7c
```

Команду с `native-lmdb` выполнить вне песочницы. Expected: PASS; неизвестные варианты и неточные поля по-прежнему отклоняются.

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/projectState/fileUpdateValidation.ts packages/rules/metadata/projectState/fileUpdate.test.ts
git commit -m "fix: :bug: принять Registered в состоянии DataPath"
```

---

### Task 6: Интеграционная сверка, документация и полный набор проверок

**Files:**
- Modify: `.agents/xml-anomalies.md`
- Modify: `docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md` only to mark verified evidence; do not change the approved contract.
- Modify: `docs/superpowers/plans/2026-08-15-round-trip-next-discrepancies.md` to mark completed checkboxes.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: доказанный round-trip для CashdeskDev, Contracts и Conversion, перечень известных XML-аномалий и полностью отмеченный план.

- [ ] **Step 1: Run targeted configuration checks**

Run the round-trip skill outside the sandbox, one configuration at a time and without `all`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/CashdeskDev_3_32_26_0_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Contracts_1_0_7_2_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Conversion_3_1_6_15_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected:

- CashdeskDev проходит прежний блок четырёх UUID и `Switcher` до следующего независимого расхождения либо завершается без расхождений;
- Contracts больше не останавливается на `SettingsStorage`, пустой роли и `MainTable`;
- Conversion больше не выдаёт 11 ошибок `typeInfo.table.kind имеет неизвестное значение`.

Если имя каталога отличается, выбрать его точное имя командой `find /Users/nikita/git/round-trip-compact/cf -maxdepth 1 -type d -name '<prefix>*'`; каталог `all` не использовать.

- [ ] **Step 2: Record only verified anomaly evidence**

В `.agents/xml-anomalies.md` добавить четыре уже подтверждённых случая `FunctionalOptionsProperty` CashdeskDev и общую запись:

```markdown
- `!xml/reference` — строго распознанное внутреннее представление ссылки,
  которое сохраняется дословно и исключается из разрешения, поиска и
  переименования. Поддержанные формы перечислены в действующей спецификации;
  пустое значение разрешено только ключу роли `UserVisible`.
```

В спецификации добавить только фактические результаты команд: какие проверки прошли и на каком следующем независимом расхождении остановилась каждая конфигурация.

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base ee7c54e7c
```

`pnpm test` выполнить вне песочницы из-за LMDB. Expected: все команды завершаются с кодом 0; новые дубли отсутствуют.

- [ ] **Step 4: Mark plan completion and commit documentation**

Отметить выполненные пункты `- [x]`, затем:

```bash
git add .agents/xml-anomalies.md docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md docs/superpowers/plans/2026-08-15-round-trip-next-discrepancies.md
git commit -m "docs: :memo: зафиксировать проверенные XML-аномалии"
```

- [ ] **Step 5: Request final conformance review in one subagent**

После всех коммитов создать ровно одного субагента с задачей:

```text
Проведи только ревью ветки относительно origin/develop. Проверь соответствие
docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md и
docs/superpowers/plans/2026-08-15-round-trip-next-discrepancies.md, архитектурные
границы, отрицательные случаи и достаточность тестов. Не изменяй файлы.
Сначала перечисли замечания по приоритету с файлами и строками; если замечаний
нет, явно напиши APPROVED.
```

При замечаниях применить `superpowers:receiving-code-review`, проверить каждое замечание, исправить подтверждённые проблемы через TDD, повторить целевые и полные проверки и запросить повторное ревью у того же субагента.
