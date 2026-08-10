# Пустой синоним стандартного реквизита — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не выводить пустой синоним стандартного реквизита при XML → YAML, запрещать его явное указание в YAML и восстанавливать пустой `Synonym` при YAML → XML.

**Architecture:** Договор задаётся в `StandardAttributeDescriptionRules`: пустая строка становится `implicitValueYAML`, а восстановление имени через `excludeIfEqualNameYAML` отключается. Общий построитель JSON-схем расширяется для строкового YAML-представления I8nText, чтобы существующий механизм `implicitValueYAML` запрещал пустую строку.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` или параметры построителей правил.
- Не добавлять частные условия по стандартным реквизитам в нейтральные слои runtime или validation.
- Пустой синоним обычного реквизита остаётся допустимым и сохраняется в YAML.
- Базовый коммит для проверки дублей: `c2b5d9a91c41a05a61b478486bb3278a81c23902`.
- Исходный `pnpm test` на холодном worktree завершился только из-за контроля длительности; функциональных падений до порога не обнаружено.

---

### Task 1: XML/YAML-договор стандартного реквизита

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts:175-180`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/__fixtures__/data.ts:51-100`
- Test: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts:13-77`
- Test: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts:83-109`

**Interfaces:**
- Consumes: `i8nTextRule`, `implicitValueYAML`, `defaultValueXMLRaw`.
- Produces: XML → YAML без пустого `Синоним`; YAML → XML с пустым `<xr:Synonym/>` при отсутствии ключа.

- [ ] **Step 1: Написать падающие ожидания XML → YAML**

В `allYAML` удалить записи, содержащие только `Синоним: ""`; у `Наименование` и `Родитель` оставить только значимые свойства. Непустой `Синоним: "Синоним"` у `Владелец` сохранить. В тесте `fillValueEmptyRefTypeLoss.xml` ожидать:

```ts
expect(result).toEqual({
  СтандартныеРеквизиты: {
    Ссылка: { ЗначениеЗаполнения: "." },
  },
})
```

Это защищает две границы: элемент только со значением по умолчанию исчезает целиком, а у содержательного элемента исчезает только пустой синоним.

- [ ] **Step 2: Написать падающий тест YAML → XML**

После теста минимальной фикстуры добавить:

```ts
it("restores empty default synonym when YAML omits it", () => {
  const { result } = testExportPropertyModelThroughYAMLToXML({
    rule: {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: { Number: "Номер" },
    },
    value: undefined,
    yaml: { Номер: { ПроверкаЗаполнения: "ВыдаватьОшибку" } },
    xmlRootTag: "StandardAttributes",
  })

  expect(result).toContain('<xr:StandardAttribute name="Number">')
  expect(result).toContain("<xr:Synonym/>")
  expect(result).not.toContain("<v8:content>Номер</v8:content>")
})
```

Возврат `excludeIfEqualNameYAML: true` должен ломать этот тест, восстанавливая текст из имени.

- [ ] **Step 3: Запустить RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts
```

Expected: FAIL — YAML содержит `Синоним: ""`, а XML получает синоним из имени.

- [ ] **Step 4: Реализовать минимальное правило**

В `StandardAttributeDescriptionRules.properties.synonym` установить:

```ts
synonym: i8nTextRule({
  yaml: "Синоним",
  xml: "xr:Synonym",
  defaultValueXMLRaw: "",
  implicitValueYAML: "",
}),
```

Не менять `i8nText/fromXML.ts` и collection runtime.

- [ ] **Step 5: Запустить GREEN и защиту обычного реквизита**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/metadataAttribute/fromXMLToYAML.test.ts
pnpm duplicates -- --base c2b5d9a91c41a05a61b478486bb3278a81c23902
```

Expected: PASS; существующий тест обычного реквизита сохраняет явно пустой синоним, новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts packages/core/metadata/commonObjects/standardAttributeDescription/__fixtures__/data.ts packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts
git commit -m "fix: :bug: скрыть пустой синоним стандартного реквизита"
```

---

### Task 2: Запрет пустого implicit I8nText в YAML-схеме

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts:43-59`
- Test: `packages/core/metadata/ruleRuntime/property/toJSONSchemaImplicitValue.test.ts:1-8,155-168`
- Test: `packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts:1-46`

**Interfaces:**
- Consumes: `PropertyRule.implicitValueYAML`, `I8nTextJSONSchema`, `excludeImplicitValueFromSchema`.
- Produces: строковый `implicitValueYAML` для `I8nText` исключается из итоговой JSON Schema.

- [ ] **Step 1: Написать падающий unit-тест общего механизма**

Зарегистрировать `../../commonObjects/i8nText/toJSONSchema`, затем добавить:

```ts
it("excludes implicit empty string from an I8nText schema", () => {
  const schema = exportPropertyToJSONSchema({
    context: validationContext,
    rule: { type: "I8nText", implicitValueYAML: "" },
    value: undefined,
  })
  if (schema === undefined) throw new Error("Expected I8nText schema")
  const check = compileValidationSchema(schema)

  expect(check.Check("")).toBe(false)
  expect(check.Check("Явный синоним")).toBe(true)
  expect(check.Check({ ru: "Явный синоним", en: "Explicit synonym" })).toBe(true)
})
```

- [ ] **Step 2: Написать падающий доменный тест**

В `standardAttributeDescription/toJSONSchema.test.ts` импортировать `compileValidationSchema` и добавить:

```ts
it("запрещает явный пустой синоним как значение по умолчанию", () => {
  const schema = exportStandardAttributeDescriptionToJSONSchema({
    context: {
      ...mockContext,
      exportToJSONSchema: {
        mode: "inline",
        refs: new Set<string>(),
        excludeImplicitValueYAML: true,
      },
    },
    rule: standardAttributesRule,
    value: undefined,
  })
  const check = compileValidationSchema(schema)

  expect(check.Check({ Код: { Синоним: "" } })).toBe(false)
  expect(check.Check({ Код: { Синоним: "Код товара" } })).toBe(true)
  expect(check.Check({ Код: {} })).toBe(true)
})
```

- [ ] **Step 3: Запустить RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/property/toJSONSchemaImplicitValue.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts
```

Expected: FAIL — обе схемы принимают пустую строку I8nText.

- [ ] **Step 4: Расширить существующий механизм**

В `getImplicitValueYAML` заменить строковую ветку на:

```ts
if ((rule.type === "string" || rule.type === "I8nText") && typeof v === "string") return v
```

Новый параметр правила и частную проверку стандартного реквизита не добавлять.

- [ ] **Step 5: Запустить GREEN и проверки слоя**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/property/toJSONSchemaImplicitValue.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/metadataAttribute/fromXMLToYAML.test.ts
pnpm type-check
pnpm duplicates -- --base c2b5d9a91c41a05a61b478486bb3278a81c23902
```

Expected: все команды PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/ruleRuntime/property/toJSONSchema.ts packages/core/metadata/ruleRuntime/property/toJSONSchemaImplicitValue.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts
git commit -m "fix: :bug: запретить пустой синоним стандартного реквизита"
```

---

### Task 3: Итоговая проверка

**Files:**
- Verify only: изменённые файлы Task 1 и Task 2.

**Interfaces:**
- Consumes: два законченных слоя реализации.
- Produces: подтверждение отсутствия регрессий и чистая ветка.

- [ ] **Step 1: Запустить обязательные проверки**

```bash
pnpm test
pnpm test:architecture
pnpm duplicates -- --base c2b5d9a91c41a05a61b478486bb3278a81c23902
```

Expected: все команды PASS. Если первое повторное падение `pnpm test` вызвано только контролем длительности холодного запуска, повторить его в прогретом worktree; функциональное падение исследовать через `superpowers:systematic-debugging`.

- [ ] **Step 2: Проверить рабочее дерево и историю**

```bash
git status --short
git log --oneline --decorate -4
```

Expected: рабочее дерево чистое; после коммита плана находятся два implementation-коммита из Task 1 и Task 2.
