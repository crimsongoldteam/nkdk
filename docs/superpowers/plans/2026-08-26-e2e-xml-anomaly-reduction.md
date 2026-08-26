# E2E `!xml/string` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить 24 ложных DCS `!xml/raw` точным скалярным договором, получить во всём `e2e/fixtures/nkdk` ровно 13 `!xml/raw`, 9 `!xml/string` и 0 `!xml/invalid`.

**Architecture:** `!xml/string` становится out-of-band тегом формы YAML-скаляра рядом с существующими `!проверять`/`!изменять`, но не входит в `XmlAnomalyKind`. Нейтральный реестр типов разрешает этот тег только `DcsLocalStringType`; сам DCS-тип различает `xs:string` и `v8:LocalStringType`, а ручные вложенные преобразования сохраняют тот же тег общими помощниками.

**Tech Stack:** TypeScript 7, Vitest 4, `js-yaml`, общий runtime правил метаданных, pnpm e2e.

**Spec:** `docs/superpowers/specs/2026-08-26-e2e-xml-anomaly-reduction-design.md`

## Global Constraints

- Исходный коммит этой серии изменений: `bed932496f07abed2ee0d24873c6a9ca13839415`.
- Выполнять план в существующем worktree `/Users/nikita/git/nkdk/.worktrees/xml-proof-local-fallback` на ветке `codex/xml-proof-local-fallback`.
- Не изменять `e2e/fixtures/xml/**`: XML-фикстуры являются источником истины.
- Проверять только e2e; не запускать `round-trip-yaml` и не проверять `/Users/nikita/git/round-trip-compact/cf/doc`.
- Совместимость со старым YAML не нужна: обычный скаляр всегда означает `LocalStringType`, а `xs:string` требует `!xml/string`.
- Не добавлять поля в `PropertyRule`, `BasePropertyRule`, `YAMLPropertySource` и параметры построителей правил.
- Не добавлять условия по имени DCS-типа в нейтральный runtime: поддержка тега объявляется операцией реестра типа.
- `!xml/string` принимает только YAML-строку, не отключает смысловую проверку и не участвует в proof, подавлении диагностик или `XmlAnomalyKind`.
- Существующие `!проверять` и `!изменять` должны остаться единственными тегами, влияющими на PropertyState.
- Сохранять все уже существующие изменения worktree; в коммиты каждого слоя добавлять только перечисленные файлы.
- После каждого законченного слоя запускать `pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415`.
- Перед завершением запустить `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`; LMDB-команды выполнять вне песочницы.
- После завершения удалить `reports/e2e`; генератор `pnpm fixtures:e2e:nkdk` сам удаляет свой каталог `.nkdk-fixture-*` в `finally`.
- Реализацию выполнять без субагентов. После всех проверок вызвать одного субагента только для сверки результата со спекой и этим планом.

## Already implemented baseline

До этого плана в том же worktree уже реализованы и покрыты тестами остальные части feature spec: раздельные индексы `cf`/`cfe` в контрольном экспорте, ранний DataPath-переход по виду владельца, канонический пустой `AdditionalFields`, неявный `EmptyRef` стандартного реквизита, локализация родительского `#order` и явный `null` для `dataParameters`. Их не реализовывать повторно и не откатывать. Task 6 проверяет их совокупный e2e-результат точным raw-списком, а Task 8 повторно запускает полный набор тестов и архитектурных проверок.

## File map

- `packages/runtime/yaml/scalarTags.ts` — единый транспорт скалярных YAML-тегов и проверка вида PropertyState-тега.
- `packages/runtime/metadata/ruleRuntime/property/yamlScalarTagPolicy.ts` — нейтральная проверка допустимости тега для типа свойства.
- `packages/runtime/metadata/ruleRuntime/property/{ruleContracts.ts,fn.ts,typeRuleRegistry.ts,fromYAMLToXML.ts}` — новая операция реестра типа и её вызов перед `importFromYAML`.
- `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/*` — смысловой договор DCS-строки и регистрация поддержки `!xml/string`.
- `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/*` — сохранение скалярного тега в ручной вложенной проекции.
- `packages/rules/tests/canonicalizeDcsLocalStringXML*` и использующие его DCS-тесты — удаление тестовой подмены реального XML-договора.
- `e2e/metadata-project.test.ts` и `e2e/fixtures/nkdk/**/*.yaml` — точные списки всех оставшихся тегов и производный YAML-эталон.
- `.agents/xml-anomalies.md` и `docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md` — публичная документация трёх тегов аномалий и отдельного тега формы XML.

## Execution order

Выполнять задачи в числовом порядке: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8.

---

### Task 1: Скалярный транспорт `!xml/string` и изоляция PropertyState

**Files:**
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/yaml/export.test.ts`
- Modify: `packages/rules/metadata/validation/configurationExtensionPropertyStateFacts.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateFacts.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/multiState.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/multiState.test.ts`

**Interfaces:**
- Produces: `type XMLRepresentationYAMLTag = "xml/string"`.
- Produces: `isPropertyStateYAMLTag(tag: unknown): tag is "проверять" | "изменять"`.
- Preserves: `taggedYAMLScalar`, `markYAMLScalarTag`, `yamlScalarTagAt`, `copyYAMLScalarTags` and `TaggedYAMLScalar` as the only out-of-band transport.

- [ ] **Step 1: Add failing parser tests for a scalar-only XML representation tag**

  Add to `packages/runtime/yaml/jsYamlParser.test.ts`:

  ```ts
  it("разбирает !xml/string как строку и сохраняет скалярный тег", () => {
    const parsed = parseWithJsYaml("Представление: !xml/string Текст")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Представление: "Текст" })
    expect(yamlScalarTagAt(parsed.data, "Представление")).toBe("xml/string")
  })

  it.each([
    "Представление: !xml/string { ru: Текст }",
    "Представление: !xml/string [Текст]",
  ])("отклоняет нескалярный payload !xml/string: %s", (source) => {
    expect(parseWithJsYaml(source).syntaxErrors).toHaveLength(1)
  })
  ```

- [ ] **Step 2: Run the parser test and verify RED**

  Run:

  ```bash
  pnpm exec vitest run --config packages/runtime/vitest.config.ts packages/runtime/yaml/jsYamlParser.test.ts
  ```

  Expected: FAIL because `!xml/string` is not registered in `NKDK_YAML_SCHEMA`.

- [ ] **Step 3: Extend the shared scalar-tag transport**

  In `packages/runtime/yaml/scalarTags.ts`, define the tag families explicitly and register only a scalar form for `!xml/string`:

  ```ts
  export const PROPERTY_STATE_YAML_TAGS = ["проверять", "изменять"] as const
  export const XML_REPRESENTATION_YAML_TAGS = ["xml/string"] as const

  export type PropertyStateYAMLTag = (typeof PROPERTY_STATE_YAML_TAGS)[number]
  export type XMLRepresentationYAMLTag = (typeof XML_REPRESENTATION_YAML_TAGS)[number]
  export type YAMLScalarTag = PropertyStateYAMLTag | XMLRepresentationYAMLTag

  export function isPropertyStateYAMLTag(tag: unknown): tag is PropertyStateYAMLTag {
    return tag === "проверять" || tag === "изменять"
  }

  const xmlRepresentationTags = [
    defineScalarTag("!xml/string", {
      resolve(value) {
        return taggedYAMLScalar("xml/string", value)
      },
      identify(value) {
        return isTaggedYAMLScalar(value) && value.tag === "xml/string"
      },
      represent(value) {
        const payload = (value as TaggedYAMLScalar).value
        if (typeof payload !== "string") {
          throw new TypeError("!xml/string поддерживает только строку")
        }
        return payload
      },
    }),
  ]
  ```

  Include `xmlRepresentationTags` in `NKDK_YAML_SCHEMA`. Do not add `string` to `XML_ANNOTATION_TAGS` and do not create mapping/sequence tags for it.

- [ ] **Step 4: Add failing serialization and PropertyState isolation tests**

  Add to `packages/runtime/yaml/export.test.ts`:

  ```ts
  it("сериализует и повторно разбирает !xml/string", () => {
    const source = { Представление: "Текст" }
    markYAMLScalarTag(source, "Представление", "xml/string")

    const serialized = serializeYAMLDocument(source)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("Представление: !xml/string Текст")
    expect(reparsed.data).toEqual(source)
    expect(yamlScalarTagAt(reparsed.data, "Представление")).toBe("xml/string")
  })
  ```

  Add to `propertyStateFacts.test.ts`:

  ```ts
  it("does not treat !xml/string as an explicit PropertyState mode", () => {
    const parsed = parseMetadataYaml("Заголовок: !xml/string Новый\n")
    const documents = collectConfigurationExtensionPropertyStateDocuments({
      yaml: parsed.data as Record<string, unknown>,
      rule,
      capability,
      logicalAddress: "Example.Один",
      workingProjectPath: "Пример/Один/Свойства.yaml",
    })

    expect(JSON.parse(documents[0]!.payload!)).toEqual({
      version: 1,
      itemType: "MetadataExample",
      propertyKey: "title",
      mode: "control",
      value: "Новый",
    })
  })
  ```

  Import `isMultiStateTypeYAML` in `multiState.test.ts` and add:

  ```ts
  it("does not treat an XML representation tag as MultiState", () => {
    const yaml: unknown[] = ["Строка"]
    markYAMLScalarTag(yaml, 0, "xml/string")

    expect(isMultiStateTypeYAML(yaml)).toBe(false)
  })
  ```

- [ ] **Step 5: Make every PropertyState consumer test its own tag family**

  Import `isPropertyStateYAMLTag` from `@nkdk/runtime`. In `configurationExtensionPropertyStateFacts.ts`, replace both broad checks with:

  ```ts
  isPropertyStateYAMLTag(tag) || hasPropertyStateTaggedParts(value)
  ```

  and:

  ```ts
  function hasPropertyStateTaggedParts(value: unknown): boolean {
    return Array.isArray(value) && value.some(
      (_part, index) => isPropertyStateYAMLTag(yamlScalarTagAt(value, index)),
    )
  }
  ```

  In `multiState.ts`, make `isMultiStateTypeYAML` use `isPropertyStateYAMLTag(yamlScalarTagAt(value, index))`; retain the explicit error in `exportMultiStateType` for any non-PropertyState tag that is actually passed as MultiState.

  In `packages/runtime/yaml/export.ts`, replace the private `isPropertyStateTag` with the exported `isPropertyStateYAMLTag` so mapping-key composition also ignores `xml/string`.

- [ ] **Step 6: Run focused tests and verify GREEN**

  Run:

  ```bash
  pnpm exec vitest run --config packages/runtime/vitest.config.ts packages/runtime/yaml/jsYamlParser.test.ts packages/runtime/yaml/export.test.ts
  pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateFacts.test.ts packages/rules/metadata/appliedObjects/configurationExtension/multiState.test.ts
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: all focused tests and duplicate check PASS.

- [ ] **Step 7: Commit the scalar transport layer**

  Use the `commit` skill, stage only the eight files listed in this task, and create one Conventional Commit describing the `!xml/string` transport and PropertyState isolation.

---

### Task 2: Neutral per-type policy for XML representation tags

**Files:**
- Create: `packages/runtime/metadata/ruleRuntime/property/yamlScalarTagPolicy.ts`
- Create: `packages/runtime/metadata/ruleRuntime/property/yamlScalarTagPolicy.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/rule-kit.ts`

**Interfaces:**
- Consumes: `XMLRepresentationYAMLTag`, `isPropertyStateYAMLTag`, `yamlScalarTagAt` from Task 1.
- Produces: `interface YAMLScalarTagPolicy { readonly acceptedTags: readonly XMLRepresentationYAMLTag[] }`.
- Produces: type operation `yamlScalarTagPolicy` and neutral guard `assertYAMLScalarTagAllowed(params)`.

- [ ] **Step 1: Write the failing policy unit tests**

  Create `yamlScalarTagPolicy.test.ts`:

  ```ts
  import { describe, expect, it } from "vitest"
  import { assertYAMLScalarTagAllowed } from "./yamlScalarTagPolicy"

  describe("YAML scalar tag policy", () => {
    it.each([undefined, "проверять", "изменять"] as const)(
      "allows the shared tag %s without a type policy",
      (tag) => expect(() => assertYAMLScalarTagAllowed({ tag })).not.toThrow(),
    )

    it("allows a registered XML representation tag", () => {
      expect(() => assertYAMLScalarTagAllowed({
        tag: "xml/string",
        policy: { acceptedTags: ["xml/string"] },
      })).not.toThrow()
    })

    it("rejects an XML representation tag without type support", () => {
      expect(() => assertYAMLScalarTagAllowed({ tag: "xml/string" }))
        .toThrow("Тег !xml/string недопустим для этого типа свойства")
    })
  })
  ```

- [ ] **Step 2: Run the policy test and verify RED**

  Run:

  ```bash
  pnpm exec vitest run --config packages/runtime/vitest.config.ts packages/runtime/metadata/ruleRuntime/property/yamlScalarTagPolicy.test.ts
  ```

  Expected: FAIL because the module does not exist.

- [ ] **Step 3: Define the neutral descriptor and guard**

  Create `yamlScalarTagPolicy.ts`:

  ```ts
  import {
    isPropertyStateYAMLTag,
    type XMLRepresentationYAMLTag,
    type YAMLScalarTag,
  } from "../../../yaml/scalarTags"

  export interface YAMLScalarTagPolicy {
    readonly acceptedTags: readonly XMLRepresentationYAMLTag[]
  }

  export function assertYAMLScalarTagAllowed(params: {
    readonly tag: YAMLScalarTag | undefined
    readonly policy?: YAMLScalarTagPolicy
  }): void {
    if (params.tag === undefined || isPropertyStateYAMLTag(params.tag)) return
    if (params.policy?.acceptedTags.includes(params.tag) === true) return
    throw new Error(`Тег !${params.tag} недопустим для этого типа свойства`)
  }
  ```

  Export the module from `packages/runtime/rule-kit.ts`:

  ```ts
  export * from "./metadata/ruleRuntime/property/yamlScalarTagPolicy"
  ```

- [ ] **Step 4: Add `yamlScalarTagPolicy` to the type-operation contract**

  Add `"yamlScalarTagPolicy"` to `TypeRulesOperations` in `ruleContracts.ts`. Import `YAMLScalarTagPolicy` into `fn.ts`, add it to `TypeRule`, and add the exact conditional before the terminal `never` in `importExportFunction`:

  ```ts
  yamlScalarTagPolicy?: YAMLScalarTagPolicy

  // tail of importExportFunction<O>
  : O extends "yamlToXMLNestedRule"
    ? YAMLToXMLNestedRule | undefined
    : O extends "yamlScalarTagPolicy"
      ? YAMLScalarTagPolicy | undefined
      : never
  ```

  Import the descriptor into `typeRuleRegistry.ts` and mirror the same typed tail in `getTypeRule`:

  ```ts
  : O extends "yamlToXMLNestedRule"
    ? YAMLToXMLNestedRule | undefined
    : O extends "yamlScalarTagPolicy"
      ? YAMLScalarTagPolicy | undefined
      : never
  ```

  Do not add a property-specific field and do not change `propertyRuleRegistrySet.ts`: its existing `TypeRulesOperations`-indexed generic map stores the new descriptor automatically.

- [ ] **Step 5: Enforce the policy at the common atomic YAML import boundary**

  In `callAtomicFromYAML` before calling the type handler, read the tag from the immediate YAML parent and the rule's YAML key:

  ```ts
  const scalarTag = typeof rule.yaml === "string"
    ? yamlScalarTagAt(yaml, rule.yaml)
    : undefined
  const scalarTagPolicy = params.execution === undefined
    ? getTypeRule(rule.type, "yamlScalarTagPolicy")
    : params.execution.getTypeRule(rule.type, "yamlScalarTagPolicy")
  assertYAMLScalarTagAllowed({ tag: scalarTag, policy: scalarTagPolicy })
  ```

  Keep the check before `handler` and before fallback to `referenceValue`: an unsupported explicit tag is always an error even if no type importer exists.

- [ ] **Step 6: Run runtime tests and type-level registry tests**

  Run:

  ```bash
  pnpm exec vitest run --config packages/runtime/vitest.config.ts packages/runtime/metadata/ruleRuntime/property/yamlScalarTagPolicy.test.ts
  pnpm --filter @nkdk/runtime test
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: runtime package and duplicate check PASS; no `as any` is added for the new operation.

- [ ] **Step 7: Commit the neutral policy layer**

  Use the `commit` skill, stage only the seven files listed in this task, and create a separate Conventional Commit for per-type scalar-tag validation.

---

### Task 3: Exact `DcsLocalStringType` XML/YAML contract

**Files:**
- Create: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/yamlScalarTagPolicy.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.integration.test.ts`
- Create: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.test.ts`

**Interfaces:**
- Consumes: `yamlScalarTagPolicy` operation from Task 2.
- Preserves: `DcsLocalStringValue = I8nText | { kind: "xmlString"; text: string }`.
- Produces: ordinary scalar/map as `I8nText`; tagged scalar as `xmlString`; `TaggedYAMLScalar("xml/string", text)` only for the latter.

- [ ] **Step 1: Replace old canonicalization expectations with the approved RED contract**

  In `fromXML.integration.test.ts`, add the `xs:string` fixture assertion:

  ```ts
  it("imports xs:string as !xml/string", () => {
    expect(importAndSerialize("string.xml")).toBe(
      "Заголовок: !xml/string Один язык - string",
    )
  })
  ```

  Keep the existing one- and two-language `LocalStringType` tests ordinary. In `toXML.integration.test.ts`, replace the first two expectations with:

  ```ts
  it("exports an ordinary scalar as one-language LocalStringType", () => {
    const xml = convert("Заголовок: Текст")

    expect(xml).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
    expect(xml).toContain("<v8:lang>ru</v8:lang>")
    expect(xml).toContain("<v8:content>Текст</v8:content>")
  })

  it("exports !xml/string as xs:string", () => {
    expect(convert("Заголовок: !xml/string Текст")).toContain(
      '<dcsset:userSettingPresentation xsi:type="xs:string">Текст</dcsset:userSettingPresentation>',
    )
  })

  it("exports a one-language mapping as LocalStringType", () => {
    const xml = serializeDirectXML(testPropertyFromYAMLToXML({
      rule,
      execution,
      yaml: { Заголовок: fixtureDcsLocalStringSingleLang.items },
    }).xml)

    expect(xml).toContain('xsi:type="v8:LocalStringType"')
    expect(xml).not.toContain('xsi:type="xs:string"')
  })
  ```

  Add this unsupported-type test:

  ```ts
  it("rejects !xml/string on an ordinary string property", () => {
    const ordinaryRule = {
      itemType: "OrdinaryStringProbe",
      properties: {
        presentation: {
          type: "string",
          yaml: "Представление",
          xml: "Presentation",
        },
      },
    } as const satisfies MetadataItemRule

    expect(() => testMetadataItemFromYAMLToXML({
      rule: ordinaryRule,
      execution,
      yaml: importFromYAML("Представление: !xml/string Текст"),
    })).toThrow("Тег !xml/string недопустим для этого типа свойства")
  })
  ```

  Create `toJSONSchema.test.ts` to prove that the tag does not weaken or alter value validation:

  ```ts
  import { parseMetadataYaml } from "@nkdk/runtime"
  import { describe, expect, it } from "vitest"
  import { mockContext } from "../../../../tests/mockContext"
  import { compileValidationSchema } from "../../../validation/compileValidationSchema"
  import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
  import "./toJSONSchema"

  describe("DcsLocalStringType JSON Schema", () => {
    it.each([
      "Представление: Текст",
      "Представление: !xml/string Текст",
    ])("validates tagged and ordinary scalar equally: %s", (source) => {
      const schema = exportPropertyToJSONSchema({
        context: mockContext,
        rule: { type: "DcsLocalStringType", yaml: "Представление" },
        value: undefined,
      })
      const compiled = compileValidationSchema(schema!)
      const yaml = parseMetadataYaml(source).data as Record<string, unknown>

      expect(compiled.Check(yaml.Представление)).toBe(true)
    })
  })
  ```

- [ ] **Step 2: Run the DCS tests and verify RED**

  Run:

  ```bash
  pnpm exec vitest run --config packages/rules/vitest.config.ts --project integration packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.integration.test.ts packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.integration.test.ts
  ```

  Expected: FAIL because the current implementation writes ordinary one-language values as `xs:string` and emits no `!xml/string`.

- [ ] **Step 3: Register the tag policy only on `DcsLocalStringType`**

  Create `dcsLocalStringType/yamlScalarTagPolicy.ts`:

  ```ts
  import type { YAMLScalarTagPolicy } from "@nkdk/runtime/rule-kit"
  import { definePropertyTypeRule } from "../../../ruleRuntime"

  export const metadataPropertyRule000 = definePropertyTypeRule(
    "DcsLocalStringType",
    "yamlScalarTagPolicy",
    { acceptedTags: ["xml/string"] } satisfies YAMLScalarTagPolicy,
  )
  ```

  Import this module from `index.ts`. In `metadataRules.test.ts`, assert:

  ```ts
  expect(metadataRules.propertyTypes.DcsLocalStringType?.yamlScalarTagPolicy)
    .toEqual({ acceptedTags: ["xml/string"] })
  expect(metadataRules.propertyTypes.string?.yamlScalarTagPolicy).toBeUndefined()
  ```

- [ ] **Step 4: Make YAML import depend on the explicit tag, not scalar shape**

  Replace the scalar shortcut in `fromYAML.ts` with:

  ```ts
  import { yamlScalarTagAt } from "@nkdk/runtime"

  const importDcsLocalStringTypeFromYAML: ImportFromYAMLFunctionNew = (params) => {
    const tag = typeof params.rule.yaml === "string"
      ? yamlScalarTagAt(params.yaml, params.rule.yaml)
      : undefined
    if (tag === "xml/string") {
      if (typeof params.value !== "string") {
        throw new TypeError("!xml/string поддерживает только строку")
      }
      return { kind: "xmlString", text: params.value }
    }
    return importI8nTextFromYAML(params)
  }
  ```

  The parser rejects mapping/sequence payloads; this explicit guard also rejects a programmatically marked non-string value. The common policy guarantees that no other XML representation tag reaches this handler.

- [ ] **Step 5: Emit `!xml/string` only from the internal `xmlString` variant**

  In `toYAML.ts` return `taggedYAMLScalar("xml/string", value.text)` for `{ kind: "xmlString" }`; continue delegating every `I8nText` to `exportI8nTextToYAML`.

  In `toXML.ts`, keep the existing `xmlString → xs:string` branch and remove the one-language canonicalization branch. Every non-empty `I8nText` must execute:

  ```ts
  const base = exportI8nTextToXML(
    context,
    { type: "I8nText" } as PropertyRule,
    data as I8nText,
  )
  return base === undefined
    ? undefined
    : { "_xsi:type": "v8:LocalStringType", ...base }
  ```

- [ ] **Step 6: Run the full DCS contract tests and verify GREEN**

  Run:

  ```bash
  pnpm exec vitest run --config packages/rules/vitest.config.ts --project integration packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.integration.test.ts packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.integration.test.ts
  pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.test.ts
  pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/composition/metadataRules.test.ts
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: ordinary scalar and both language maps produce `LocalStringType`; only `!xml/string` produces `xs:string`; unsupported property types reject the tag.

- [ ] **Step 7: Commit the DCS type contract**

  Use the `commit` skill, stage only the nine files listed in this task, and create a separate Conventional Commit for exact DCS string representation.

---

### Task 4: Preserve `!xml/string` in manually nested `availableValues`

**Files:**
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.test.ts`

**Interfaces:**
- Consumes: `callAtomicFromYAML({ yaml, rule, value })` and `exportPropertyToYAML` tag transport.
- Produces: each `DcsAvailableValue` item preserves the tag on its own `Представление` key without adding fields to the model.

- [ ] **Step 1: Write failing nested round-trip tests**

  In `fromYAML.test.ts`, parse the tagged scalar through the real parser and assert the internal variant:

  ```ts
  it("imports tagged presentation as xmlString", () => {
    const yaml = importFromYAML<unknown[]>([
      "- Значение: 2",
      "  Представление: !xml/string 2 знака",
    ].join("\n"))

    expect(callAtomicFromYAML({ context: mockContext, rule, value: yaml })).toEqual([
      {
        itemType: "DcsAvailableValue",
        value: { type: "number", value: 2 },
        presentation: { kind: "xmlString", text: "2 знака" },
      },
    ])
  })
  ```

  Update the existing ordinary scalar expectation to `presentation: { items: { ru: "2 знака" } }`.

  In `toYAML.test.ts`, export a value whose presentation is `{ kind: "xmlString", text: "2 знака" }`, serialize the result, and assert the exact line `Представление: !xml/string 2 знака` plus `yamlScalarTagAt(item, "Представление") === "xml/string"`.

- [ ] **Step 2: Run the available-values tests and verify RED**

  Run:

  ```bash
  pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.test.ts packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.test.ts
  ```

  Expected: import rejects or loses the tag because it does not pass the immediate YAML parent; export loses the tag by extracting only `.Представление`.

- [ ] **Step 3: Pass the immediate YAML parent on nested import**

  Give `presentationRule` the public key and pass each item as `yaml`:

  ```ts
  const presentationRule = {
    type: "DcsLocalStringType",
    yaml: "Представление",
  } as const

  const presentation = callAtomicFromYAML({
    context,
    rule: presentationRule,
    yaml: item,
    value: item.Представление,
  }) as DcsAvailableValue["presentation"]
  ```

- [ ] **Step 4: Merge the complete property projection on nested export**

  Keep the record returned by `exportPropertyToYAML` instead of extracting the scalar, then copy its out-of-band marks:

  ```ts
  const presentation = item.presentation === undefined
    ? undefined
    : exportPropertyToYAML({ context, rule: presentationRule, value: item.presentation })
  const result = {
    ...(value !== undefined ? { Значение: value } : {}),
    ...(presentation ?? {}),
  }
  if (presentation !== undefined) copyYAMLScalarTags(presentation, result)
  return result
  ```

  Import `copyYAMLScalarTags` from `@nkdk/runtime`. Do not manually call `markYAMLScalarTag`; the same projection-copy mechanism must work for future scalar tags.

- [ ] **Step 5: Run nested and neighboring DCS tests**

  Run:

  ```bash
  pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.test.ts packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.test.ts
  pnpm exec vitest run --config packages/rules/vitest.config.ts --project integration packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.integration.test.ts
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: tagged and ordinary presentations both round-trip with their intended XML shape; all focused tests PASS.

- [ ] **Step 6: Commit the nested projection fix**

  Use the `commit` skill, stage only the four files listed in this task, and create a separate Conventional Commit for preserving scalar tags in nested DCS projections.

---

### Task 5: Remove the test-only DCS XML canonicalizer

**Files:**
- Delete: `packages/rules/tests/canonicalizeDcsLocalStringXML.ts`
- Delete: `packages/rules/tests/canonicalizeDcsLocalStringXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedField/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filter/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/order/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: exact DCS shape contract from Tasks 3–4.
- Produces: integration tests compare real XML directly with fixture XML and cannot hide `LocalStringType ↔ xs:string` changes.

- [ ] **Step 1: Replace canonicalized expectations with exact fixture expectations**

  In every listed integration test, remove the `canonicalizeDcsLocalStringXML` import. Replace:

  ```ts
  expect(result).toEqual(canonicalizeDcsLocalStringXML(expectedResult))
  ```

  with:

  ```ts
  expect(result).toEqual(expectedResult)
  ```

  Replace normalized variants with direct equivalent normalization:

  ```ts
  expect(normalize(result.result)).toBe(normalize(result.expected))
  ```

  In `calculatedFields/fromYAMLToXML.integration.test.ts`, replace both canonicalized title assertions with:

  ```ts
  expect(result).toContain('<dcssch:title xsi:type="v8:LocalStringType">')
  expect(result).toContain("<v8:content>Рабочее место</v8:content>")
  expect(result).toContain("<v8:content>Настройки</v8:content>")
  ```

  In `dynamicList/fromXMLToYAML.integration.test.ts`, use these direct expectations in both test bodies:

  ```ts
  expect(withoutDeclaration(xmlExport(xml, false))).toBe(expected.trim())
  ```

- [ ] **Step 2: Delete the obsolete helper and its unit test**

  Delete both `packages/rules/tests/canonicalizeDcsLocalStringXML.ts` and `.test.ts`. Verify no reference remains:

  ```bash
  rg -n 'canonicalizeDcsLocalStringXML' packages/rules
  ```

  Expected: no output.

- [ ] **Step 3: Run all affected DCS integration tests**

  Run:

  ```bash
  pnpm exec vitest run --config packages/rules/vitest.config.ts --project integration \
    packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedField/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/filter/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/commonObjects/dataCompositionSystem/order/fromYAMLToXML.integration.test.ts \
    packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: every test compares exact fixture XML and PASS; duplicate check PASS.

- [ ] **Step 4: Commit the test-contract cleanup**

  Use the `commit` skill. Stage the two exact deletions and the nine exact test files listed above; do not stage all of `packages/rules/tests`.

---

### Task 6: Exact e2e allowlists and regenerated NKDK fixtures

**Files:**
- Modify: `e2e/metadata-project.test.ts`
- Modify generated: `e2e/fixtures/nkdk/**/*.yaml`
- Do not modify: `e2e/fixtures/xml/**`

**Interfaces:**
- Consumes: parsed YAML `yamlScalarTagAt` marks and existing `snapshotXmlAnomalyAnnotations`.
- Produces: `{ raw, invalid, string }`, each as a sorted list of `relative-file#/<yaml-path>`.
- Enforces: exact 13 raw entries, exact 9 string entries and empty invalid entries.

- [ ] **Step 1: Extend the e2e collector with representation-tag traversal**

  Import `yamlScalarTagAt` from `@nkdk/runtime`. Extend the collector result type with `readonly string: readonly string[]`, and recursively inspect arrays and records:

  ```ts
  function collectXmlStringLocations(params: {
    readonly value: unknown
    readonly file: string
    readonly path: readonly (string | number)[]
    readonly result: string[]
  }): void {
    if (params.value === null || typeof params.value !== "object") return
    const entries = Array.isArray(params.value)
      ? params.value.map((value, index) => [index, value] as const)
      : Object.entries(params.value)
    for (const [key, value] of entries) {
      const path = [...params.path, key]
      if (yamlScalarTagAt(params.value, key) === "xml/string") {
        params.result.push(`${params.file}#/${path.map(String).join("/")}`)
      }
      collectXmlStringLocations({ ...params, value, path })
    }
  }
  ```

  Call it once for every parsed YAML file. Keep anomaly collection and scalar-tag collection separate: `xml/string` must never enter `anomalyBucket`.

- [ ] **Step 2: Replace the old DCS raw group with the exact agreed lists**

  Keep the existing eight `RARE_FILL_VALUE_XML_RAW_LOCATIONS` entries (four `cf`, four `cfe`) and three `VALUE_LIST_SETTINGS_XML_RAW_LOCATIONS` entries. Replace `DCS_XML_SHAPE_RAW_LOCATIONS` with:

  ```ts
  const FORM_TITLE_XML_RAW_LOCATIONS = [
    "cf/ОбщаяФорма/ФормаПоиска/Свойства.yaml#/Форма/Элементы/СтраницыРезультатов/Элементы/СтраницаПодсказки/Элементы/СтрокаПодсказки/@Form\\Заголовок",
    "cf/ОбщаяФорма/ФормаПоиска/Свойства.yaml#/Форма/Элементы/СтраницыРезультатов/Элементы/СтраницаРезультатаПоиска/Элементы/СтраницыРезультатаПоиска/Элементы/СтраницаРезультатаПоискаПрокрутка/Элементы/РезультатыПоиска/@Form\\Заголовок",
  ] as const

  const EXPECTED_XML_RAW_LOCATIONS = [
    ...RARE_FILL_VALUE_XML_RAW_LOCATIONS,
    ...VALUE_LIST_SETTINGS_XML_RAW_LOCATIONS,
    ...FORM_TITLE_XML_RAW_LOCATIONS,
  ].sort(compareUtf8)
  ```

  Add the exact representation-tag allowlist:

  ```ts
  const DYNAMIC_LIST_FILE = "cf/ОбщаяФорма/ДинамическийСписок/Свойства.yaml"
  const EXPECTED_XML_STRING_LOCATIONS = [
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/Отбор/ПредставлениеПользовательскойНастройки`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/Отбор/Элементы/1/Представление`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/Порядок/ПредставлениеПользовательскойНастройки`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/УсловноеОформление/ПредставлениеПользовательскойНастройки`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/СОсновнойТаблицей/ДинамическийСписок/Отбор/Элементы/0/Представление`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/СОсновнойТаблицей/ДинамическийСписок/Отбор/Элементы/0/ПредставлениеПользовательскойНастройки`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПоУмолчанию1/ДинамическийСписок/Отбор/ПредставлениеПользовательскойНастройки`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПоУмолчанию1/ДинамическийСписок/Отбор/Элементы/0/Представление`,
    `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/УсловноеОформлениеНесколькоСтрок/ДинамическийСписок/УсловноеОформление/ПредставлениеПользовательскойНастройки`,
  ].sort(compareUtf8)
  ```

  In the import assertion use:

  ```ts
  expect(tags.invalid).toEqual([])
  expect(tags.raw).toEqual(EXPECTED_XML_RAW_LOCATIONS)
  expect(tags.string).toEqual(EXPECTED_XML_STRING_LOCATIONS)
  ```

- [ ] **Step 3: Run e2e before regenerating the committed YAML and verify RED**

  Run outside the sandbox:

  ```bash
  pnpm test:e2e
  ```

  Expected: the real import satisfies the new exact tag lists, while `matches the committed NKDK project byte for byte` fails because the committed YAML still contains old DCS raw blocks.

- [ ] **Step 4: Regenerate only NKDK e2e fixtures through the project generator**

  Run outside the sandbox:

  ```bash
  pnpm fixtures:e2e:nkdk
  ```

  Expected: generated changes are confined to `e2e/fixtures/nkdk/**`; the generator removes its `.nkdk-fixture-*` staging directory in `finally`.

- [ ] **Step 5: Verify exact counts and absence of XML-source changes**

  Run:

  ```bash
  test "$(rg -o '!xml/raw' e2e/fixtures/nkdk --glob '*.yaml' | wc -l | tr -d ' ')" = 13
  test "$(rg -o '!xml/string' e2e/fixtures/nkdk --glob '*.yaml' | wc -l | tr -d ' ')" = 9
  test "$(rg -o '!xml/invalid' e2e/fixtures/nkdk --glob '*.yaml' | wc -l | tr -d ' ')" = 0
  git diff --exit-code -- e2e/fixtures/xml
  ```

  Expected: all four commands exit 0. If `e2e/fixtures/xml` already contains user changes from before this task, compare `git diff --name-only` before/after generation and prove the generator added none; never restore those user changes.

- [ ] **Step 6: Run the complete e2e suite and duplicate check**

  Run outside the sandbox:

  ```bash
  pnpm test:e2e
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: all e2e tests PASS, including byte-for-byte NKDK import and XML reconstruction; exact lists report 13 raw, 9 string and 0 invalid.

- [ ] **Step 7: Commit the e2e contract**

  Use the `commit` skill and stage only `e2e/metadata-project.test.ts` plus generated changes under `e2e/fixtures/nkdk`. Do not stage anything under `e2e/fixtures/xml`.

---

### Task 7: Document the separate XML representation tag

**Files:**
- Modify: `.agents/xml-anomalies.md`
- Modify: `docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md`

**Interfaces:**
- Consumes: final runtime semantics proved by Tasks 1–6.
- Produces: documentation that retains exactly three anomaly tags and names `!xml/string` as a separate scalar XML-form tag.

- [ ] **Step 1: Update the concise anomaly registry**

  After the opening paragraph of `.agents/xml-anomalies.md`, add:

  ```md
  Отдельно поддерживается скалярный тег формы XML `!xml/string`. Он не является
  XML-аномалией: значение остаётся обычной строкой и проходит ту же смысловую
  проверку. Тег разрешён только типам, которые явно зарегистрировали такую
  форму; сейчас это `DcsLocalStringType`, где обычный YAML строит
  `v8:LocalStringType`, а `!xml/string` — `xs:string`.
  ```

  State explicitly that it does not suppress diagnostics and does not participate in proof/raw assignment.

- [ ] **Step 2: Add the full representation-tag contract to the framework spec**

  In `2026-08-23-common-types-xml-anomaly-framework-design.md`, after the invariant listing the three public anomaly tags, add a subsection `### Скалярные теги формы XML` containing this exact contract:

  ```md
  `!xml/string` хранится в общей out-of-band таблице скалярных YAML-тегов, но
  не входит в `XmlAnomalyKind`. Парсер принимает только scalar payload;
  mapping и sequence являются синтаксической ошибкой. Нейтральная операция
  типа `yamlScalarTagPolicy` разрешает тег конкретному типу свойства, а общая
  граница `callAtomicFromYAML` отклоняет его у остальных типов. Теги
  `!проверять` и `!изменять` остаются единственными тегами PropertyState.
  ```

  Append the exact DCS table and nested-projection rule:

  ```md
  | YAML | XML |
  | --- | --- |
  | `Представление: Текст` | `v8:LocalStringType` с основным языком проекта |
  | `Представление: { ru: Текст, en: Text }` | многоязычный `v8:LocalStringType` |
  | `Представление: !xml/string Текст` | `xs:string` |

  Ручная вложенная проекция вызывает атомарный импорт с непосредственным
  YAML-родителем и публичным ключом правила. При пересборке объекта она
  переносит out-of-band теги через `copyYAMLScalarTags`, а не ставит
  конкретный тег вручную.
  ```

- [ ] **Step 3: Check terminology and references**

  Run:

  ```bash
  rg -n '!xml/string|yamlScalarTagPolicy|три общих тега' .agents/xml-anomalies.md docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: both documents distinguish anomaly tags from the representation tag; duplicate check PASS.

- [ ] **Step 4: Commit documentation**

  Use the `commit` skill, stage only these two documentation files, and create a separate documentation commit.

---

### Task 8: Full verification, cleanup and independent review

**Files:**
- Verify only; no expected production edits.
- Remove temporary output: `reports/e2e`.

**Interfaces:**
- Consumes: every task and the exact e2e contract from the feature spec.
- Produces: evidence-backed completion report and one independent review against both documents.

- [ ] **Step 1: Run the required project verification**

  Run outside the sandbox where LMDB is involved:

  ```bash
  pnpm test
  pnpm test:architecture:rules
  pnpm test:architecture
  pnpm duplicates -- --base bed932496f07abed2ee0d24873c6a9ca13839415
  ```

  Expected: every command exits 0. Do not update dependency-cruiser baselines to hide a failure.

- [ ] **Step 2: Recheck the public tag inventory and XML source safety**

  Run:

  ```bash
  test "$(rg -o '!xml/raw' e2e/fixtures/nkdk --glob '*.yaml' | wc -l | tr -d ' ')" = 13
  test "$(rg -o '!xml/string' e2e/fixtures/nkdk --glob '*.yaml' | wc -l | tr -d ' ')" = 9
  test "$(rg -o '!xml/invalid' e2e/fixtures/nkdk --glob '*.yaml' | wc -l | tr -d ' ')" = 0
  rg -n 'canonicalizeDcsLocalStringXML' packages/rules
  ```

  Expected: the first three checks exit 0 and the final search has no output. Compare the current XML-fixture change list with the pre-task snapshot; the implementation and generator must add no XML changes.

- [ ] **Step 3: Remove temporary e2e output**

  Remove only the known generated report directory:

  ```bash
  rm -rf reports/e2e
  test ! -e reports/e2e
  ```

  Confirm there is no `.nkdk-fixture-*` directory directly under `e2e/fixtures`:

  ```bash
  find e2e/fixtures -maxdepth 1 -type d -name '.nkdk-fixture-*' -print
  ```

  Expected: no output. Do not delete any user-owned XML fixture changes.

- [ ] **Step 4: Request one final review subagent**

  Spawn exactly one review subagent with this task, and do not let it edit files:

  ```text
  Проведи read-only ревью изменений ветки codex/xml-proof-local-fallback.
  Сверь реализацию с docs/superpowers/specs/2026-08-26-e2e-xml-anomaly-reduction-design.md
  и docs/superpowers/plans/2026-08-26-e2e-xml-anomaly-reduction.md. Особо проверь:
  1) !xml/string не входит в XmlAnomalyKind и разрешён только DcsLocalStringType;
  2) обычный скаляр/карта всегда дают LocalStringType, тег — xs:string;
  3) PropertyState игнорирует xml/string;
  4) nested availableValues сохраняет тег общим транспортом;
  5) e2e закрепляет точные 13 raw, 9 string, 0 invalid;
  6) XML-фикстуры не изменялись этой реализацией.
  Верни замечания с приоритетом и ссылками на файлы/строки; если замечаний нет,
  явно напиши, что спеке и плану соответствует.
  ```

- [ ] **Step 5: Resolve review findings and rerun affected checks**

  For every actionable finding, use `superpowers:receiving-code-review`, reproduce it, add or adjust a focused test, make the smallest fix, rerun that layer's tests and the duplicate check. If production code changes after Step 1, rerun all four commands from Step 1.

- [ ] **Step 6: Final status and handoff**

  Run `git status --short` and report:

  - exact test commands and outcomes;
  - exact final counts `13 / 9 / 0`;
  - review result;
  - confirmation that temporary directories were removed;
  - any pre-existing user-owned changes intentionally left unstaged.

  Do not start `finish-pr-cycle` unless the user asks for it explicitly.
