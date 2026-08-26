# Verified External XML Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не позволять резервной границе внешнего XML-свойства поглощать доказанные локальные расхождения и создавать корневой raw только после проверки остаточного расхождения.

**Architecture:** Обычные proof-границы и резервные границы документа хранятся раздельно. Proof собирает преобразования для исходного и экспортированного XML, применяет их к уже разобранным деревьям через production `mergeXmlRawFragments`, сравнивает нормализованные хэши корней и обращается к резервной границе только при остаточном различии; повторный экспорт по rules.ts не выполняется.

**Tech Stack:** TypeScript 7, Vitest, XML import audit, `mergeXmlRawFragments`, e2e metadata round-trip.

**Spec:** `docs/superpowers/specs/2026-08-25-semantic-xml-elision-design.md`

## Global Constraints

- Исходные XML-фикстуры не изменяются.
- Отсутствующий XML-узел и присутствующий пустой XML-узел считаются разными формами.
- Корневой fallback используется только после всех точечных raw и поправок порядка.
- Обычный контрольный экспорт по rules.ts выполняется один раз.
- Проверка на `cf/doc` в этой ветке не выполняется; результат проверяется на e2e-каталоге.
- Общие metadata-слои не получают условий по конкретному `itemType`, имени XML-корня или папке.

---

### Task 1: Отделить резервные границы внешних XML-свойств

**Files:**
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Test: `packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts`

**Interfaces:**
- Produces: тип `XmlAnomalyProofAuditBoundary` и необязательное поле `fallbackBoundaries` в `XmlAnomalyProofAudit` с тем же захваченным форматом, что и `boundaries`.
- Produces: `captureXmlAnomalyProofAudit({ ..., fallbackBoundaries })`, которое захватывает координаты и хэши резервных границ отдельно.
- Consumes: существующую корневую границу внешнего `PropertyRule.filePath` из `prepareYaml.ts`.

- [x] **Step 1: Написать падающий интеграционный тест подготовки общей формы**

  В тесте `imports a common form through the standard nested rules converter` добавить проверки:

  ```ts
  expect(prepared.proofAudit.fallbackBoundaries).toContainEqual(expect.objectContaining({
    sourceRole: "property",
    xmlPath: "/Form[1]",
    yamlPath: ["Форма"],
  }))
  expect(prepared.proofAudit.boundaries).not.toContainEqual(expect.objectContaining({
    sourceRole: "property",
    xmlPath: "/Form[1]",
    yamlPath: ["Форма"],
  }))
  ```

- [x] **Step 2: Запустить тест и подтвердить правильное падение**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/prepareYaml.integration.test.ts`

  Expected: FAIL, потому что `fallbackBoundaries` ещё отсутствует, а корень `Форма` находится среди обычных `boundaries`.

- [x] **Step 3: Добавить отдельное хранение резервных границ**

  В `anomalyProof.ts` расширить договор:

  ```ts
  export type XmlAnomalyProofAuditBoundary = XmlAnomalyProofBoundary & {
    readonly targets: readonly {
      readonly path: string
      readonly signature: bigint | string
      readonly span: XmlSourceSpan
    }[]
    readonly levels: readonly XmlAnomalyProofLevel[]
  }

  export interface XmlAnomalyProofAudit {
    readonly sources: readonly {
      readonly sourcePath: string
      readonly role: ImportXmlInput["role"]
      readonly roots: readonly {
        readonly xmlPath: string
        readonly elementName: string
        readonly structuralHash: bigint
        readonly span: XmlSourceSpan
      }[]
    }[]
    readonly boundaries: readonly XmlAnomalyProofAuditBoundary[]
    readonly fallbackBoundaries?: readonly XmlAnomalyProofAuditBoundary[]
    readonly itemAnchors?: readonly XmlAnomalyItemAnchor[]
  }
  ```

  `captureXmlAnomalyProofAudit` должен захватывать `boundaries` и `fallbackBoundaries` одной общей функцией без дублирования формата. В `prepareYaml.ts` заменить `appendExternalPropertyRootBoundaries(boundaries, ...)` на построение отдельного массива и передать его как `fallbackBoundaries`.

- [x] **Step 4: Запустить целевой тест**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/prepareYaml.integration.test.ts`

  Expected: PASS.

- [x] **Step 5: Проверить отсутствие новых дубликатов**

  Run: `pnpm duplicates -- --base 9c9abbb9d`

  Expected: PASS.

- [x] **Step 6: Создать первый commit через навык `commit`**

  Run: `git add docs/superpowers/specs/2026-08-25-semantic-xml-elision-design.md docs/superpowers/plans/2026-08-26-verified-external-xml-fallback.md packages/rules/metadata/importFromXml/anomalyProof.ts packages/rules/metadata/importFromXml/prepareYaml.ts packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts && git commit`

  Expected: отдельный Conventional Commit о разделении точечных и резервных proof-границ.

---

### Task 2: Проверять точечные XML-преобразования до fallback

**Files:**
- Create: `packages/rules/metadata/importFromXml/xmlProofVerification.ts`
- Create: `packages/rules/metadata/importFromXml/xmlProofVerification.test.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Test: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`

**Interfaces:**
- Produces:

  ```ts
  export interface XmlProofTransformation {
    readonly sourcePath: string
    readonly side: "source" | "exported"
    readonly xmlPath: string
    readonly value: XmlRawValue
    readonly hasSemanticValue: boolean
    readonly terminal?: "order"
  }

  export function transformedXmlRootsAreExact(params: {
    readonly sourcePath: string
    readonly source: XmlDocument
    readonly exported: XmlDocument
    readonly transformations: readonly XmlProofTransformation[]
  }): boolean
  ```

- Consumes: `mergeXmlRawFragments` для применения concrete XML-путей с физическими occurrence.
- Consumes: выбранный `selected.xmlPath`, вычисленный raw/patch и поправки `#order` из `proveXmlAnomalyBoundaries`.

- [x] **Step 1: Написать падающие модульные тесты XML-проверки**

  В `xmlProofVerification.test.ts` зафиксировать три поведения:

  ```ts
  it("удаляет добавленный экспортом вложенный узел по physical XML-пути", () => {
    const source = parseXmlDocumentWithSaxes("<Form><Attribute/></Form>")
    const exported = parseXmlDocumentWithSaxes("<Form><Attribute><Settings/></Attribute></Form>")
    expect(transformedXmlRootsAreExact({
      sourcePath: "/source/Ext/Form.xml",
      source,
      exported,
      transformations: [{
        sourcePath: "/source/Ext/Form.xml",
        side: "exported",
        xmlPath: "/Form[1]/Attribute[1]/Settings[1]",
        value: null,
        hasSemanticValue: false,
      }],
    })).toBe(true)
  })

  it("учитывает согласованное исключение присутствующего исходного узла", () => {
    const source = parseXmlDocumentWithSaxes("<Root><Empty/></Root>")
    const exported = parseXmlDocumentWithSaxes("<Root/>")
    expect(transformedXmlRootsAreExact({
      sourcePath: "/source/Root.xml",
      source,
      exported,
      transformations: [{
        sourcePath: "/source/Root.xml",
        side: "source",
        xmlPath: "/Root[1]/Empty[1]",
        value: null,
        hasSemanticValue: false,
      }],
    })).toBe(true)
  })

  it("не скрывает независимое остаточное расхождение", () => {
    const source = parseXmlDocumentWithSaxes("<Form><Attribute/><Future/></Form>")
    const exported = parseXmlDocumentWithSaxes("<Form><Attribute><Settings/></Attribute></Form>")
    expect(transformedXmlRootsAreExact({
      sourcePath: "/source/Ext/Form.xml",
      source,
      exported,
      transformations: [{
        sourcePath: "/source/Ext/Form.xml",
        side: "exported",
        xmlPath: "/Form[1]/Attribute[1]/Settings[1]",
        value: null,
        hasSemanticValue: false,
      }],
    })).toBe(false)
  })
  ```

- [x] **Step 2: Запустить новый тест и подтвердить отсутствие модуля**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/xmlProofVerification.test.ts`

  Expected: FAIL с ошибкой импорта `xmlProofVerification`.

- [x] **Step 3: Реализовать применение преобразований без второго rules-экспорта**

  `xmlProofVerification.ts` должен:

  1. Разобрать путь вида `/Form[1]/Attributes[1]/Attribute[2]/Settings[1]`.
  2. Исключить единственный корневой сегмент.
  3. Передать имена в `XmlRawMergeBoundary.path`, а номера в `occurrencePath`.
  4. Для `terminal: "order"` добавить сегмент `#order` и `null` occurrence.
  5. Применить source/exported-преобразования отдельными вызовами `mergeXmlRawFragments`.
  6. Сравнить число, имена, пути и `structuralHash` итоговых корней.

  Конвертер concrete-пути должен отклонять путь без корня, нечисловой occurrence и преобразование самого корня, чтобы fallback не маскировался этим API.

- [x] **Step 4: Запустить модульный тест XML-проверки**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/xmlProofVerification.test.ts`

  Expected: PASS.

- [x] **Step 5: Написать падающий proof-тест при совместном наличии локальной и резервной границ**

  В `anomalyProof.test.ts` создать source `<Form><Attribute/></Form>`, exported `<Form><Attribute><Settings/></Attribute></Form>`, обычную отсутствующую границу `Settings` и захваченную резервную границу `/Form[1] → ["Форма"]`. Проверить:

  ```ts
  expect(result.annotations.entries).toContainEqual(expect.objectContaining({
    parentPath: ["Форма", "Реквизиты", "Список"],
    key: "ТипЗначения",
    annotation: expect.objectContaining({ kind: "raw", xml: null }),
  }))
  expect(result.annotations.entries).not.toContainEqual(expect.objectContaining({
    parentPath: [],
    key: "Форма",
  }))
  ```

  Второй тест добавляет в source независимый `<Future/>` без точечной границы и ожидает резервный raw на `Форма`.

- [x] **Step 6: Запустить proof-тест и подтвердить отсутствие проверки остатка**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/anomalyProof.test.ts`

  Expected: тест с независимым `<Future/>` FAIL, потому что отделённый fallback пока не применяется после проверки остатка.

- [x] **Step 7: Интегрировать проверку преобразований в proof**

  В `proveXmlAnomalyBoundaries` накапливать `XmlProofTransformation`:

  - `semanticallyElided` добавляет удаление на стороне `source`;
  - `presentInSource: false`, найденный в exported, добавляет `value: null` на стороне `exported`;
  - выбранный raw существующего узла добавляет фактический raw/patch на стороне `exported` по `selected.xmlPath`;
  - уже существующий raw на границе покрывает исходное поддерево этой границы;
  - поправка порядка добавляет transformation с `terminal: "order"`.

  После обработки порядка для каждого первоначально несовпавшего source вызвать `transformedXmlRootsAreExact`. При совпадении не применять `fallbackBoundaries`. При остаточном несовпадении выбрать резервную границу с тем же `sourcePath`: ноль совпадений означает существующий скрытый fallback документа `@`/`@Form`, одно — fallback внешнего свойства, больше одного — явную ошибку неоднозначности.

- [x] **Step 8: Запустить целевые proof-тесты**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/anomalyProof.test.ts metadata/importFromXml/xmlProofVerification.test.ts`

  Expected: PASS.

- [x] **Step 9: Запустить интеграционные тесты контрольного экспорта**

  Run: `pnpm --filter @nkdk/rules test -- --run metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/prepareYaml.integration.test.ts`

  Expected: PASS; `ordinaryExporter` по-прежнему вызывается один раз.

- [x] **Step 10: Проверить отсутствие новых дубликатов**

  Run: `pnpm duplicates -- --base 9c9abbb9d`

  Expected: PASS.

- [x] **Step 11: Создать второй commit через навык `commit`**

  Run: `git add packages/rules/metadata/importFromXml/anomalyProof.ts packages/rules/metadata/importFromXml/anomalyProof.test.ts packages/rules/metadata/importFromXml/xmlProofVerification.ts packages/rules/metadata/importFromXml/xmlProofVerification.test.ts && git commit`

  Expected: отдельный Conventional Commit о проверке точечных XML-преобразований до fallback.

---

### Task 3: Зафиксировать результат на e2e-каталоге

**Files:**
- Modify: `e2e/metadata-project.test.ts`
- Modify: generated YAML files under `e2e/fixtures/nkdk/`
- Do not modify: files under `e2e/fixtures/xml/`

**Interfaces:**
- Consumes: production `importMetadataProject` и полный e2e round-trip.
- Produces: эталонный YAML с локальным отсутствующим `Settings` и без корневого raw общей формы `СписокЗначений`.

**Уточнение по фактическому выполнению:** e2e выявил три общих класса,
не видимых на синтетическом proof: повторяемые атомарные `dcscor:item`,
канонический `xsi:type` вложенного значения и альтернативные свойства одного
`Settings`. Они исправляются общими договорами runtime без условий по виду
формы: `repeatedXMLNodes`, заявление канонического атрибута и выбор единственной
альтернативы, создавшей непустой YAML. Временные аннотации отброшенной
альтернативы удаляются до сериализации.

- [x] **Step 1: Добавить e2e-проверку минимальной границы**

  После импорта `cf` прочитать `cf/ОбщаяФорма/СписокЗначений/Свойства.yaml` и проверить:

  ```ts
  expect(valueListYaml).not.toContain("Форма: !xml/raw")
  expect(valueListYaml).toContain("ТипЗначения: !xml/raw")
  expect(valueListYaml).toContain("$xml: null")
  ```

- [x] **Step 2: Запустить e2e и подтвердить падение старого эталона/поведения**

  Run: `pnpm test:e2e`

  Expected: FAIL на новой проверке либо byte-for-byte сравнении до обновления YAML-эталона.

- [x] **Step 3: Обновить только NKDK e2e-фикстуры штатным импортом**

  Run: `pnpm fixtures:e2e:nkdk`

  Expected: изменяются только `e2e/fixtures/nkdk/**`; `e2e/fixtures/xml/**` остаются без изменений.

- [x] **Step 4: Проверить изменения крупных raw**

  Run: `git diff -- e2e/fixtures/nkdk && git diff --exit-code -- e2e/fixtures/xml`

  Expected: у `ОбщаяФорма/СписокЗначений` исчезает корневой `Форма: !xml/raw`, а отличие отсутствующего `Settings` остаётся локальным. Остальные уменьшившиеся raw принимаются только если полный round-trip остаётся точным.

- [x] **Step 5: Запустить полный e2e-набор**

  Run: `pnpm test:e2e`

  Expected: 19 test files PASS, включая byte-for-byte импорт и XML round-trip.

- [x] **Step 6: Проверить отсутствие новых дубликатов**

  Run: `pnpm duplicates -- --base 9c9abbb9d`

  Expected: PASS.

- [x] **Step 7: Создать третий commit через навык `commit`**

  Run: `git add e2e/metadata-project.test.ts e2e/fixtures/nkdk && git commit`

  Expected: отдельный Conventional Commit об e2e-эталоне минимальных XML-границ.

---

### Task 4: Итоговая проверка ветки

**Files:**
- Verify only; no expected production edits.

**Interfaces:**
- Consumes: все результаты Tasks 1–3.
- Produces: доказательство соответствия спецификации и архитектурным ограничениям.

- [x] **Step 1: Проверить типы**

  Run: `pnpm type-check`

  Expected: PASS.

- [x] **Step 2: Проверить архитектуру rules**

  Run: `pnpm test:architecture:rules`

  Expected: PASS.

- [x] **Step 3: Проверить архитектуру проекта**

  Run: `pnpm test:architecture`

  Expected: PASS без изменения baseline.

- [x] **Step 4: Запустить весь набор тестов проекта**

  Run: `pnpm test`

  Expected: PASS. Команда не использует внешний каталог `cf/doc`.

- [x] **Step 5: Повторить e2e как окончательное доказательство**

  Run: `pnpm test:e2e`

  Expected: PASS.

- [x] **Step 6: Проверить дубликаты относительно базового commit**

  Run: `pnpm duplicates -- --base 9c9abbb9d`

  Expected: PASS.

- [x] **Step 7: Проверить чистоту и границы diff**

  Run: `git status --short && git diff --stat origin/develop...HEAD && git diff --exit-code -- e2e/fixtures/xml`

  Expected: только спецификация, план, proof/verification-код, тесты и обновлённые NKDK YAML-фикстуры; XML-фикстуры не изменены.

---

## Self-Review

- Спецификация покрыта задачами: разделение fallback — Task 1; проверка после точечных поправок без второго rules-экспорта — Task 2; различение отсутствующего и пустого `Settings` — Task 3; e2e и архитектурные ограничения — Task 4.
- План не содержит `TBD`, `TODO`, «implement later» или неуказанных проверок.
- Имена `fallbackBoundaries`, `XmlProofTransformation` и `transformedXmlRootsAreExact` используются последовательно во всех задачах.
- `cf/doc` отсутствует во всех командах плана.
