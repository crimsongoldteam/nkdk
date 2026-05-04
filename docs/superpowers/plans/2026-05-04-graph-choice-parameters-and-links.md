# Graph Choice Parameters And Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Выгружать `choiceParameters` и `choiceParameterLinks` в граф как дочерние узлы и рёбра, без `p_choiceParameters_*` и `p_choiceParameterLinks_*` на владельце.

**Architecture:** Добавляем два type-specific `buildGraphFromModel`-обработчика рядом с существующими commonObjects. Каждый обработчик создаёт owned-узлы через `GraphOps.children` и запускает рекурсивный обход дочерней модели через `GraphOps.recurse`; `ChoiceParameter.value` использует существующий `MetadataValue`, а `ChoiceParameterLink.dataPath` использует небольшой локальный графовый тип для global/form-local разрешения от узла link.

**Tech Stack:** TypeScript, Vitest, YAML AST из пакета `yaml`, существующие `GraphBuilder`, `buildGraphFromModel`, `applyGraphOps`, `registerTypeRule`, `edgeKinds`.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
  - Зарегистрировать owning-рёбра `CHOICE_PARAMETER` и `CHOICE_PARAMETER_LINK`.
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.ts`
  - Преобразует `ChoiceParameters` в дочерние узлы `ChoiceParameter`.
  - Рекурсивно обходит `value` через `MetadataValue`.
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts`
  - Тестирует owned-узлы, `index`, отсутствие дублирования props и `VALUE`-ребро от дочернего узла.
- Create: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts`
  - Преобразует `ChoiceParameterLinks` в дочерние узлы `ChoiceParameterLink`.
  - Рекурсивно обходит `dataPath` через локальный графовый тип `ChoiceParameterLinkDataPath`.
- Create: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`
  - Тестирует owned-узлы, `index`, props, global `DATA_PATH` и form-local `DATA_PATH`.
- Modify: `packages/core/metadata/commonObjects/index.ts`
  - Подключить оба новых `graphFromModel`-модуля для обычной регистрации commonObjects.
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
  - Подключить оба новых `graphFromModel`-модуля в CLI-контексте прямого импорта `buildGraph`.
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
  - Добавить smoke-тесты, что прямой импорт `buildGraph` поднимает регистрации и не создаёт `p_choiceParameters_*`/`p_choiceParameterLinks_*`.

---

### Task 1: Edge Kinds

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts`

- [ ] **Step 1: Write the failing test**

Add expectations to `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts` in the test that lists known owning kinds:

```ts
expect(getKnownKinds()).toContain("CHOICE_PARAMETER")
expect(getKnownKinds()).toContain("CHOICE_PARAMETER_LINK")
expect(isOwning("CHOICE_PARAMETER")).toBe(true)
expect(isOwning("CHOICE_PARAMETER_LINK")).toBe(true)
expect(getYamlByKind("CHOICE_PARAMETER")).toBe("ПараметрВыбора")
expect(getYamlByKind("CHOICE_PARAMETER_LINK")).toBe("СвязьПараметровВыбора")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
```

Expected: FAIL because `CHOICE_PARAMETER` and `CHOICE_PARAMETER_LINK` are unknown.

- [ ] **Step 3: Add edge kinds**

Modify `_byKind` in `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`:

```ts
  ["CHOICE_PARAMETER", { yaml: "ПараметрВыбора", owning: true }],
  ["CHOICE_PARAMETER_LINK", { yaml: "СвязьПараметровВыбора", owning: true }],
```

Place them near other owning child collections, after `STANDARD_ATTRIBUTE`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
git commit -m "feat: :sparkles: добавить виды рёбер параметров выбора"
```

---

### Task 2: ChoiceParameters Graph Handler

**Files:**
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.ts`
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import "./graphFromModel"

const filePath = "Справочник/Товары/Свойства.yaml"
const parentNodeId = "Справочник.Товары.Реквизит.Владелец"

const ownerRule = {
  itemType: "MetadataAttribute",
  properties: {
    name: { type: "string", yaml: "Имя" },
    choiceParameters: { type: "ChoiceParameters", yaml: "ПараметрыВыбора" },
  },
} as const satisfies MetadataItemRule

describe("ChoiceParameters graphFromModel", () => {
  it("создаёт дочерние узлы с index и не дублирует коллекцию в props владельца", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Владелец",
      item: {
        itemType: "MetadataAttribute",
        name: "Владелец",
        choiceParameters: [
          { name: "Отбор.Владелец", value: { type: "string", value: "A" } },
          { name: "Отбор.Родитель", value: { type: "boolean", value: true } },
        ],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
    })

    const firstId = `${parentNodeId}.ПараметрВыбора[0]`
    const secondId = `${parentNodeId}.ПараметрВыбора[1]`
    expect(graph.hasNode(firstId)).toBe(true)
    expect(graph.hasNode(secondId)).toBe(true)

    const edges = [...graph.outEdgeEntries(parentNodeId)].filter(
      (edge) => edge.attributes.kind === "CHOICE_PARAMETER",
    )
    expect(edges.map((edge) => ({ target: edge.target, index: edge.attributes.index }))).toEqual([
      { target: firstId, index: 0 },
      { target: secondId, index: 1 },
    ])

    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const parent = file.nodes.find((node) => node.id === parentNodeId)!
    const first = file.nodes.find((node) => node.id === firstId)!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_choiceParameters_"))).toBe(false)
    expect(first.label).toBe("ChoiceParameter")
    expect(first.props.name).toBe("Отбор.Владелец")
    expect(first.props.p_value_type).toBe("string")
    expect(first.props.p_value_value).toBe("A")
  })

  it("создаёт VALUE-ребро от ChoiceParameter для ссылочного MetadataValue", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Владелец",
      item: {
        itemType: "MetadataAttribute",
        name: "Владелец",
        choiceParameters: [
          {
            name: "Отбор.Ссылка",
            value: { type: "ref", value: "Catalog.Товары.EmptyRef" },
          },
        ],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
    })

    const choiceNodeId = `${parentNodeId}.ПараметрВыбора[0]`
    const valueEdge = [...graph.outEdgeEntries(choiceNodeId)].find(
      (edge) => edge.attributes.kind === "VALUE",
    )
    expect(valueEdge?.target).toBe("Справочник.Товары.ПустаяСсылка")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts
```

Expected: FAIL because `./graphFromModel` does not exist or `ChoiceParameters` has no graph handler.

- [ ] **Step 3: Implement minimal graph handler**

Create `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.ts`:

```ts
import "~/metadata/commonObjects/metadataValue/graphFromModel"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { BuildGraphFromModelFunction, GraphOps, GraphOpsChild } from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ChoiceParameters } from "./types"

const EDGE_KIND = "CHOICE_PARAMETER"
const EDGE_YAML = "ПараметрВыбора"
const NODE_SEGMENT = "ПараметрВыбора"

const ChoiceParameterGraphRule = {
  itemType: "ChoiceParameter",
  properties: {
    name: { type: "string", yaml: "Имя" },
    value: { type: "MetadataValue", yaml: "Значение" },
  },
} as const satisfies MetadataItemRule

const buildChoiceParametersGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
}) => {
  const parameters = model as ChoiceParameters | undefined
  if (!Array.isArray(parameters) || parameters.length === 0) return undefined

  const children: GraphOpsChild[] = []
  const recurse: NonNullable<GraphOps["recurse"]> = []

  parameters.forEach((parameter, index) => {
    const childNodeId = `${parentNodeId}.${NODE_SEGMENT}[${index}]`
    const item = {
      itemType: "ChoiceParameter",
      name: parameter.name,
      value: parameter.value,
    }

    children.push({
      idSuffix: `${NODE_SEGMENT}[${index}]`,
      absoluteId: childNodeId,
      name: parameter.name,
      index,
      item,
    })

    recurse.push({
      model: item,
      rule: ChoiceParameterGraphRule,
      parentNodeId: childNodeId,
    })
  })

  return { children, recurse, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("ChoiceParameters", "buildGraphFromModel", buildChoiceParametersGraph)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.ts packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts
git commit -m "feat: :sparkles: выгружать choiceParameters в граф"
```

---

### Task 3: ChoiceParameterLinks Graph Handler

**Files:**
- Create: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts`
- Create: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import "./graphFromModel"

const filePath = "Справочник/Товары/Свойства.yaml"
const parentNodeId = "Справочник.Товары.Реквизит.Характеристика"

const ownerRule = {
  itemType: "MetadataAttribute",
  properties: {
    name: { type: "string", yaml: "Имя" },
    choiceParameterLinks: { type: "ChoiceParameterLinks", yaml: "СвязиПараметровВыбора" },
  },
} as const satisfies MetadataItemRule

describe("ChoiceParameterLinks graphFromModel", () => {
  it("создаёт дочерние узлы с index и не дублирует коллекцию в props владельца", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Характеристика",
      item: {
        itemType: "MetadataAttribute",
        name: "Характеристика",
        choiceParameterLinks: [
          {
            name: "Отбор.Владелец",
            dataPath: "Catalog.Товары.Attribute.Владелец",
            valueChange: "DontChange",
          },
          {
            name: "Отбор.Родитель",
            dataPath: "Catalog.Товары.StandardAttribute.Parent",
          },
        ],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
    })

    const firstId = `${parentNodeId}.СвязьПараметровВыбора[0]`
    const secondId = `${parentNodeId}.СвязьПараметровВыбора[1]`
    expect(graph.hasNode(firstId)).toBe(true)
    expect(graph.hasNode(secondId)).toBe(true)

    const edges = [...graph.outEdgeEntries(parentNodeId)].filter(
      (edge) => edge.attributes.kind === "CHOICE_PARAMETER_LINK",
    )
    expect(edges.map((edge) => ({ target: edge.target, index: edge.attributes.index }))).toEqual([
      { target: firstId, index: 0 },
      { target: secondId, index: 1 },
    ])

    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const parent = file.nodes.find((node) => node.id === parentNodeId)!
    const first = file.nodes.find((node) => node.id === firstId)!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_choiceParameterLinks_"))).toBe(false)
    expect(first.label).toBe("ChoiceParameterLink")
    expect(first.props.name).toBe("Отбор.Владелец")
    expect(first.props.p_dataPath).toBe("Catalog.Товары.Attribute.Владелец")
    expect(first.props.p_valueChange).toBe("DontChange")
  })

  it("создаёт DATA_PATH-ребро от ChoiceParameterLink для глобального пути", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(parentNodeId, {
      name: "Характеристика",
      item: {
        itemType: "MetadataAttribute",
        name: "Характеристика",
        choiceParameterLinks: [
          { name: "Отбор.Владелец", dataPath: "Catalog.Товары.Attribute.Владелец" },
        ],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
    })

    const linkNodeId = `${parentNodeId}.СвязьПараметровВыбора[0]`
    const dataPathEdge = [...graph.outEdgeEntries(linkNodeId)].find(
      (edge) => edge.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdge?.target).toBe("Справочник.Товары.Реквизит.Владелец")
  })

  it("создаёт DATA_PATH-ребро от ChoiceParameterLink для form-local пути", () => {
    const graph = new GraphBuilder()
    const formNodeId = "Справочник.Товары.Форма.ФормаЭлемента"
    const footerAttrId = `${formNodeId}.РеквизитФормы.РеквизитПодвала`

    graph.ensureNode(formNodeId, { name: "ФормаЭлемента", item: { itemType: "ClientApplicationForm" } })
    graph.ensureNode(footerAttrId, { name: "РеквизитПодвала", item: { itemType: "FormAttribute", name: "РеквизитПодвала" } })
    graph.ensureEdge(formNodeId, footerAttrId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы", index: 0 })

    graph.ensureNode(parentNodeId, {
      name: "ПолеВвода",
      item: {
        itemType: "InputField",
        name: "ПолеВвода",
        choiceParameterLinks: [{ name: "РеквизитПодвала", dataPath: "РеквизитПодвала" }],
      },
    })
    graph.addFilePath(parentNodeId, filePath)

    buildGraphFromModel({
      model: graph.getNodeAttributes(parentNodeId).item as Record<string, unknown>,
      yamlMap: undefined,
      rule: ownerRule,
      graph,
      parentNodeId,
      filePath,
      extra: { formNodeId },
    })

    const linkNodeId = `${parentNodeId}.СвязьПараметровВыбора[0]`
    const dataPathEdge = [...graph.outEdgeEntries(linkNodeId)].find(
      (edge) => edge.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdge?.target).toBe(footerAttrId)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
```

Expected: FAIL because `./graphFromModel` does not exist or `ChoiceParameterLinks` has no graph handler.

- [ ] **Step 3: Implement graph handler**

Create `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts`:

```ts
import "~/metadata/forms/commonObjects/dataPath/graphFromModel"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { BuildGraphFromModelFunction, GraphOps, GraphOpsChild } from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ChoiceParameterLinks } from "./types"

const EDGE_KIND = "CHOICE_PARAMETER_LINK"
const EDGE_YAML = "СвязьПараметровВыбора"
const DATA_PATH_EDGE_KIND = "DATA_PATH"
const DATA_PATH_EDGE_YAML = "ПутьКДанным"
const NODE_SEGMENT = "СвязьПараметровВыбора"

const buildChoiceParameterLinkDataPathGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}) => {
  if (typeof model !== "string" || !model) return undefined

  const globalRef = extractReferenceFromPath(model)
  if (globalRef) {
    return {
      references: [globalRef],
      edgeKind: DATA_PATH_EDGE_KIND,
      edgeYaml: DATA_PATH_EDGE_YAML,
    }
  }

  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  return {
    formLocalReferences: [{ formLocalPath: model, formNodeId }],
    edgeKind: DATA_PATH_EDGE_KIND,
    edgeYaml: DATA_PATH_EDGE_YAML,
  }
}

const ChoiceParameterLinkGraphRule = {
  itemType: "ChoiceParameterLink",
  properties: {
    name: { type: "string", yaml: "Имя" },
    dataPath: { type: "ChoiceParameterLinkDataPath", yaml: DATA_PATH_EDGE_YAML },
    valueChange: { type: "SystemEnumeration", yaml: "ИзменениеЗначения" },
  },
} as const satisfies MetadataItemRule

const buildChoiceParameterLinksGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
}) => {
  const links = model as ChoiceParameterLinks | undefined
  if (!Array.isArray(links) || links.length === 0) return undefined

  const children: GraphOpsChild[] = []
  const recurse: NonNullable<GraphOps["recurse"]> = []

  links.forEach((link, index) => {
    const childNodeId = `${parentNodeId}.${NODE_SEGMENT}[${index}]`
    const item = {
      itemType: "ChoiceParameterLink",
      name: link.name,
      dataPath: link.dataPath,
      valueChange: link.valueChange,
    }

    children.push({
      idSuffix: `${NODE_SEGMENT}[${index}]`,
      absoluteId: childNodeId,
      name: link.name,
      index,
      item,
    })

    recurse.push({
      model: item,
      rule: ChoiceParameterLinkGraphRule,
      parentNodeId: childNodeId,
    })
  })

  return { children, recurse, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("ChoiceParameterLinkDataPath", "buildGraphFromModel", buildChoiceParameterLinkDataPathGraph)
registerTypeRule("ChoiceParameterLinks", "buildGraphFromModel", buildChoiceParameterLinksGraph)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
git commit -m "feat: :sparkles: выгружать choiceParameterLinks в граф"
```

---

### Task 4: Registration In CommonObjects And CLI BuildGraph

**Files:**
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`

- [ ] **Step 1: Write the failing CLI-context tests**

Add to `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`:

```ts
  it("не дублирует choiceParameters в props при прямом импорте buildGraph", () => {
    const yaml = `\
Реквизиты:
  Характеристика:
    Тип: Справочник.Характеристики
    ПараметрыВыбора:
      Отбор.Владелец: '"A"'
`
    const filePath = "Справочник/Товары/Свойства.yaml"
    const result = buildGraph(new Map([[filePath, yaml]]), ctx)
    const fileSegment = result.find((f) => f.filePath === filePath)!

    const attr = fileSegment.nodes.find((n) => n.id === "Справочник.Товары.Реквизит.Характеристика")!
    const choice = fileSegment.nodes.find(
      (n) => n.id === "Справочник.Товары.Реквизит.Характеристика.ПараметрВыбора[0]",
    )!

    expect(Object.keys(attr.props).some((key) => key.startsWith("p_choiceParameters_"))).toBe(false)
    expect(choice.label).toBe("ChoiceParameter")
    expect(choice.props.name).toBe("Отбор.Владелец")
    expect(fileSegment.edges).toContainEqual(
      expect.objectContaining({
        src: "Справочник.Товары.Реквизит.Характеристика",
        tgt: "Справочник.Товары.Реквизит.Характеристика.ПараметрВыбора[0]",
        kind: "CHOICE_PARAMETER",
        props: expect.objectContaining({ index: 0 }),
      }),
    )
  })

  it("не дублирует choiceParameterLinks в props при прямом импорте buildGraph", () => {
    const yaml = `\
Реквизиты:
  Характеристика:
    Тип: Справочник.Характеристики
    СвязиПараметровВыбора: "Отбор.Владелец(Справочник.Товары.Реквизит.Владелец, НеИзменять)"
`
    const filePath = "Справочник/Товары/Свойства.yaml"
    const result = buildGraph(new Map([[filePath, yaml]]), ctx)
    const fileSegment = result.find((f) => f.filePath === filePath)!

    const attr = fileSegment.nodes.find((n) => n.id === "Справочник.Товары.Реквизит.Характеристика")!
    const link = fileSegment.nodes.find(
      (n) => n.id === "Справочник.Товары.Реквизит.Характеристика.СвязьПараметровВыбора[0]",
    )!

    expect(Object.keys(attr.props).some((key) => key.startsWith("p_choiceParameterLinks_"))).toBe(false)
    expect(link.label).toBe("ChoiceParameterLink")
    expect(link.props.name).toBe("Отбор.Владелец")
    expect(link.props.p_valueChange).toBe("DontChange")
    expect(fileSegment.edges).toContainEqual(
      expect.objectContaining({
        src: "Справочник.Товары.Реквизит.Характеристика",
        tgt: "Справочник.Товары.Реквизит.Характеристика.СвязьПараметровВыбора[0]",
        kind: "CHOICE_PARAMETER_LINK",
        props: expect.objectContaining({ index: 0 }),
      }),
    )
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: FAIL if direct `buildGraph` does not import the new registrations.

- [ ] **Step 3: Register modules in commonObjects index**

Modify `packages/core/metadata/commonObjects/index.ts` near existing imports:

```ts
import "./сhoiceParameterLinks/graphFromModel"
import "./сhoiceParameters/graphFromModel"
```

Place each import near the corresponding `fromYAML`/`toYAML` block.

- [ ] **Step 4: Register modules in direct buildGraph entrypoint**

Modify `packages/core/metadata/orchestration/buildGraph/buildGraph.ts` side-effect imports:

```ts
import "~/metadata/commonObjects/сhoiceParameterLinks/graphFromModel"
import "~/metadata/commonObjects/сhoiceParameters/graphFromModel"
```

Keep the existing imports for child collections:

```ts
import "~/metadata/appliedObjects/metadataCommand/register"
import "~/metadata/commonObjects/metadataAttribute/register"
import "~/metadata/commonObjects/metadataTabularSection/register"
import "~/metadata/commonObjects/standardAttributeDescription/registerCollectionRule"
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/buildGraph/buildGraph.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
git commit -m "fix: :bug: подключить графовые регистрации выбора"
```

---

### Task 5: Focused Regression Suite

**Files:**
- No file changes expected.

- [ ] **Step 1: Run focused graph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts metadata/orchestration/importMetadataFileWithGraph.test.ts metadata/orchestration/buildGraph/walkGraphToFileData.test.ts metadata/orchestration/buildGraph/flattenItem.test.ts metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
```

Expected: PASS.

- [ ] **Step 2: If a test fails, fix only the failing contract**

Use this decision table:

```text
FAIL: parent has p_choiceParameters_* or p_choiceParameterLinks_*
Fix: ensure the type handler returns at least one child/recurse operation so buildGraphFromModel calls graph.addFlattenSkipKeys.

FAIL: child label is Unknown
Fix: child item must contain itemType: "ChoiceParameter" or itemType: "ChoiceParameterLink".

FAIL: VALUE edge starts from parent instead of ChoiceParameter
Fix: ChoiceParameters handler must add recurse with parentNodeId equal to childNodeId.

FAIL: DATA_PATH edge starts from parent instead of ChoiceParameterLink
Fix: ChoiceParameterLinks handler must add recurse with parentNodeId equal to childNodeId.
```

- [ ] **Step 3: Commit any focused fix**

If Step 2 changed files:

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters packages/core/metadata/commonObjects/сhoiceParameterLinks packages/core/metadata/orchestration
git commit -m "fix: :bug: стабилизировать граф параметров выбора"
```

If Step 2 made no changes, do not commit.

---

### Task 6: Full Verification

**Files:**
- No file changes expected.

- [ ] **Step 1: Run package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 2: Run full project tests before closing work**

Run from repository root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Optional ERP smoke check**

Only after the user confirms FalkorDB is clean, run:

```bash
pnpm --filter @nakidka/cli exec tsx src/cli.ts update-graph /Users/nikita/git/erp_nkdk
```

Expected: command completes without `p_choiceParameters_*`, `p_choiceParameterLinks_*`, or Cypher-map key errors.

- [ ] **Step 4: Final commit if verification required changes**

If verification revealed and fixed issues:

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/orchestration
git commit -m "fix: :bug: исправить загрузку параметров выбора в граф"
```

If verification made no changes, do not commit.

---

## Self-Review

**Spec coverage:**
- `choiceParameters` become owned `ChoiceParameter` nodes: Task 2.
- `choiceParameters` do not duplicate into parent props: Task 2 and Task 4.
- `ChoiceParameter.value` primitive props and `VALUE`/`OBJECT` refs originate from child node: Task 2.
- `choiceParameterLinks` become owned `ChoiceParameterLink` nodes: Task 3.
- `choiceParameterLinks` do not duplicate into parent props: Task 3 and Task 4.
- `ChoiceParameterLink.dataPath` stays in props and adds optional `DATA_PATH` edge: Task 3.
- Direct CLI `buildGraph` imports registrations: Task 4.
- Focused and full verification: Tasks 5 and 6.

**Placeholder scan:** Запрещённых заглушек и неопределённых шагов нет.

**Type consistency:** Node labels use `itemType: "ChoiceParameter"` and `itemType: "ChoiceParameterLink"` consistently. Edge kinds are `CHOICE_PARAMETER`, `CHOICE_PARAMETER_LINK`, `DATA_PATH`; YAML names are `ПараметрВыбора`, `СвязьПараметровВыбора`, `ПутьКДанным`.
