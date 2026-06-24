# CharacteristicsDescription Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать первый `round-trip-yaml` diff, где отсутствующие XML-default поля `CharacteristicsDescription` со значением `-1` материализуются в XML.

**Architecture:** Использовать существующий декларативный механизм `preserveFromReferenceXML` для четырёх полей `CharacteristicsDescription`. Поле должно экспортироваться, только если оно явно есть в текущей модели или было явно в reference XML; отсутствующий XML-default не должен создаваться заново.

**Tech Stack:** TypeScript, Vitest, `rules.ts`, общий orchestration property XML/YAML слой, `pnpm`.

---

### File Structure

- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/rules.ts`
  - Добавить `preserveFromReferenceXML: true` четырём XML-default полям: `dataPathField`, `multipleValuesUseField`, `multipleValuesKeyField`, `multipleValuesOrderField`.
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/toXML.test.ts`
  - Добавить тест, который экспортирует модель без четырёх полей и reference без этих полей; результат не должен содержать соответствующие XML-теги.
  - Добавить тест, который экспортирует модель без четырёх полей, но с reference, где эти поля присутствуют; результат должен сохранять теги из reference.
- No XML fixture changes.

### Task 1: Зафиксировать отсутствие default-тегов без reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/toXML.test.ts`

- [ ] **Step 1: Add failing test for absent reference tags**

Add this import near existing imports:

```ts
import { importPropertyFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
```

Add this test inside `describe("export CharacteristicsDescriptions to XML", () => { ... })`:

```ts
  it("does not materialize missing XML default fields without reference tags", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: singleCharacteristic,
      xmlRootTag: "Characteristics",
      referenceMetadata: [
        {
          itemType: "CharacteristicsDescription",
          characteristicTypes: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
          keyField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
          characteristicValues: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
          objectField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
          typeField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
        },
      ],
    })

    expect(result).not.toContain("<xr:DataPathField>-1</xr:DataPathField>")
    expect(result).not.toContain("<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>")
    expect(result).not.toContain("<xr:MultipleValuesKeyField>-1</xr:MultipleValuesKeyField>")
    expect(result).not.toContain("<xr:MultipleValuesOrderField>-1</xr:MultipleValuesOrderField>")
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm --dir packages/core exec vitest run metadata/commonObjects/characteristicsDescription/toXML.test.ts
```

Expected: FAIL, because current export still writes at least one of the four `-1` XML tags.

### Task 2: Preserve explicit default tags from reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/toXML.test.ts`

- [ ] **Step 1: Add reference preservation test**

Add this test after the previous one:

```ts
  it("preserves explicit XML default fields from reference", () => {
    const referenceMetadata = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: {
        "xr:Characteristic": {
          "xr:CharacteristicTypes": {
            _from: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
            "xr:KeyField": "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
            "xr:TypesFilterField": "-1",
            "xr:TypesFilterValue": { "_xsi:nil": "true" },
            "xr:DataPathField": "-1",
            "xr:MultipleValuesUseField": "-1",
          },
          "xr:CharacteristicValues": {
            _from: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
            "xr:ObjectField": "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
            "xr:TypeField": "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
            "xr:ValueField": "-1",
            "xr:MultipleValuesKeyField": "-1",
            "xr:MultipleValuesOrderField": "-1",
          },
        },
      },
    })

    const { result } = testExportPropertyToXML({
      rule,
      value: singleCharacteristic,
      xmlRootTag: "Characteristics",
      referenceMetadata,
    })

    expect(result).toContain("<xr:DataPathField>-1</xr:DataPathField>")
    expect(result).toContain("<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>")
    expect(result).toContain("<xr:MultipleValuesKeyField>-1</xr:MultipleValuesKeyField>")
    expect(result).toContain("<xr:MultipleValuesOrderField>-1</xr:MultipleValuesOrderField>")
  })
```

- [ ] **Step 2: Run the focused test and verify current behavior**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm --dir packages/core exec vitest run metadata/commonObjects/characteristicsDescription/toXML.test.ts
```

Expected: at least Task 1 test still FAILS before implementation. Task 2 may pass or fail depending on current reference fallback; implementation must make both pass.

### Task 3: Update declarative rules

**Files:**
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/rules.ts`

- [ ] **Step 1: Add `preserveFromReferenceXML` to four fields**

Change the four property rules to this shape:

```ts
    dataPathField: {
      yaml: "ПолеПутиКДанным",
      xml: "xr:DataPathField",
      xmlParents: ["xr:CharacteristicTypes"],
      type: "string",
      defaultValueXML: "-1",
      preserveFromReferenceXML: true,
      order: 5,
    },
    multipleValuesUseField: {
      yaml: "ПолеИспользованияМножественныхЗначений",
      xml: "xr:MultipleValuesUseField",
      xmlParents: ["xr:CharacteristicTypes"],
      type: "string",
      defaultValueXML: "-1",
      preserveFromReferenceXML: true,
      order: 6,
    },
```

And:

```ts
    multipleValuesKeyField: {
      yaml: "ПолеКлючаМножественныхЗначений",
      xml: "xr:MultipleValuesKeyField",
      xmlParents: ["xr:CharacteristicValues"],
      type: "string",
      defaultValueXML: "-1",
      preserveFromReferenceXML: true,
      order: 11,
    },
    multipleValuesOrderField: {
      yaml: "ПолеПорядкаМножественныхЗначений",
      xml: "xr:MultipleValuesOrderField",
      xmlParents: ["xr:CharacteristicValues"],
      type: "string",
      defaultValueXML: "-1",
      preserveFromReferenceXML: true,
      order: 12,
    },
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm --dir packages/core exec vitest run metadata/commonObjects/characteristicsDescription/toXML.test.ts
```

Expected: PASS.

### Task 4: Check related YAML/XML behavior

**Files:**
- Test only.

- [ ] **Step 1: Run all CharacteristicsDescription tests**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm --dir packages/core exec vitest run metadata/commonObjects/characteristicsDescription
```

Expected: PASS.

- [ ] **Step 2: Repeat round-trip-yaml single diagnostic**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH NODE_OPTIONS=--dns-result-order=ipv4first NKDK_XML_REPO=/home/codexwsl/round-trip ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: `Catalogs/ДополнительныеОтчетыИОбработки.xml` is no longer the selected first diff for the four added `xr:*Field` tags. The total diff count may remain non-zero because the task covers only the first diff.

### Task 5: Commit implementation

**Files:**
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/rules.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/toXML.test.ts`

- [ ] **Step 1: Review local diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/characteristicsDescription/rules.ts packages/core/metadata/commonObjects/characteristicsDescription/toXML.test.ts
```

Expected: only the two planned files changed.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/characteristicsDescription/rules.ts packages/core/metadata/commonObjects/characteristicsDescription/toXML.test.ts
git commit -m "fix: :bug: не добавлять XML-default характеристик"
```

Expected: commit succeeds.

### Self-Review

- Spec coverage: план покрывает цель, ограничения и проверку `round-trip-yaml` для первого diff.
- Placeholder scan: placeholders absent.
- Type consistency: property names match `CharacteristicsDescriptionRules`; test helper imports exist in current codebase.
