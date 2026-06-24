# DataPath Edges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all dataPath-like graph output with one `DATA_PATH` reference edge carrying `property`, `yaml`, `sourcePath`, and `pathMode`, while removing legacy dataPath edge kinds and duplicated node props.

**Architecture:** Extend `GraphOps` so reference-like operations can attach primitive edge props. Then route both form element `DataPath` and `ChoiceParameterLink.dataPath` through one helper that creates `DATA_PATH` edges for global and form-local paths. Legacy edge kinds and synthetic fields are removed after tests prove the unified contract.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core` graph builder, `GraphOps`, FalkorDB-compatible `FileGraphData`.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/fn.ts`
  Add `propertyName` to `BuildGraphFromModelFunction` params and add primitive `edgeProps` to `GraphOpsReference` and `GraphOpsFormLocalReference`.

- Modify `packages/core/metadata/orchestration/buildGraphFromModel.ts`
  Pass the JS property key into type-specific `buildGraphFromModel` handlers.

- Modify `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
  Merge `edgeProps` into reference and form-local reference edge attributes.

- Modify `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`
  Prove `edgeProps` are preserved on normal and form-local reference edges.

- Create `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`
  Central helper for building `DATA_PATH` graph operations from a source path.

- Modify `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts`
  Use the helper, always emit `DATA_PATH`, and stop registering legacy `*_DATA_PATH` kinds.

- Modify `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts`
  Assert unified `DATA_PATH` attributes and absence of legacy kinds.

- Modify `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts`
  Remove `ChoiceParameterLinkDataPath` and `dataPathReference`; recurse over real `dataPath` using the shared helper.

- Modify `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`
  Assert `p_dataPath` is absent and `DATA_PATH` has `property/sourcePath/pathMode`.

- Modify `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
  Remove `FOOTER_DATA_PATH`, `TITLE_DATA_PATH`, `ROW_PICTURE_DATA_PATH`.

- Modify `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts`
  Assert legacy dataPath kinds are not registered.

- Modify `.agents/architecture-orchestration.md`
  Add an explicit note that dataPath property names are represented by `DATA_PATH.property`, not separate edge kinds or synthetic model fields.

---

### Task 1: Allow GraphOps Reference Edge Props

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`

- [ ] **Step 1: Write failing tests for reference edge props**

Add these tests inside `describe("только references", ...)` and `describe("formLocalReferences", ...)` in `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`.

```ts
    it("пробрасывает edgeProps на reference-ребро", () => {
      const ctx = makeCtx()
      const ops: GraphOps = {
        references: [
          {
            id: "Справочник.Валюты",
            name: "Валюты",
            edgeProps: {
              property: "dataPath",
              sourcePath: "Catalog.Валюты",
              pathMode: "global",
            },
          },
        ],
      }

      applyGraphOps(ops, ctx)

      const edges = [...ctx.graph.outEdgeEntries(PARENT_NODE_ID)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes).toMatchObject({
        kind: "TYPE",
        yaml: "Тип",
        property: "dataPath",
        sourcePath: "Catalog.Валюты",
        pathMode: "global",
      })
    })
```

```ts
    it("пробрасывает edgeProps на formLocalReferences-ребро", () => {
      const { graph, formNodeId, attrId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Кнопка`
      ensureNodeWithFile(graph, elementId, "Кнопка", "test/Форма.yaml")

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }
      const ops: GraphOps = {
        formLocalReferences: [
          {
            formLocalPath: "Объект",
            formNodeId,
            edgeProps: {
              property: "dataPath",
              sourcePath: "Объект",
              pathMode: "formLocal",
            },
          },
        ],
      }

      applyGraphOps(ops, ctx)

      const edges = [...graph.outEdgeEntries(elementId)]
      expect(edges).toHaveLength(1)
      expect(edges[0].target).toBe(attrId)
      expect(edges[0].attributes).toMatchObject({
        kind: "DATA_PATH",
        yaml: "ПутьКДанным",
        property: "dataPath",
        sourcePath: "Объект",
        pathMode: "formLocal",
      })
    })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts
```

Expected: FAIL with TypeScript errors that `edgeProps` does not exist on `GraphOpsReference` and `GraphOpsFormLocalReference`.

- [ ] **Step 3: Add edge prop types and propertyName**

In `packages/core/metadata/orchestration/property/fn.ts`, add this import:

```ts
import type { GraphPrimitive } from "~/metadata/orchestration/buildGraph/types"
```

Then add this type above `BuildGraphFromModelFunction`:

```ts
export type GraphOpsEdgeProps = Record<string, GraphPrimitive>
```

Change `BuildGraphFromModelFunction` params to include `propertyName`:

```ts
export type BuildGraphFromModelFunction = (params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  lineCounter: LineCounter | undefined
  propRule: PropertyRule
  /** JS-ключ свойства из MetadataItemRule.properties. */
  propertyName: string
  /** Дополнительный контекст, пробрасываемый в кастомные обработчики (например, formNodeId). */
  extra?: Record<string, unknown>
}) => GraphOps | GraphOps[] | undefined | void
```

Extend `GraphOpsReference`:

```ts
export interface GraphOpsReference {
  id: string
  name: string
  positionFrom?: SourcePosition
  /** Дополнительные primitive props конкретного reference-ребра. */
  edgeProps?: GraphOpsEdgeProps
  // parentOverride намеренно не поддерживается: reference создаёт глобальный stub-узел
  // и ребро всегда от ctx.parentNodeId. Если нужен override-источник ребра — используй
  // formLocalReferences (с собственной семантикой резолвинга цели).
}
```

Extend `GraphOpsFormLocalReference`:

```ts
export interface GraphOpsFormLocalReference {
  /** Form-local путь, например "Объект.Договор.Владелец". */
  formLocalPath: string
  /** Корневой узел формы — стартовая точка резолвинга. */
  formNodeId: string
  positionFrom?: SourcePosition
  /** Дополнительные primitive props конкретного reference-ребра. */
  edgeProps?: GraphOpsEdgeProps
  /** Если задано — ребро идёт от этого узла к резолвимой цели вместо ctx.parentNodeId. */
  parentOverride?: string
}
```

- [ ] **Step 4: Pass propertyName from buildGraphFromModel**

In `packages/core/metadata/orchestration/buildGraphFromModel.ts`, update the `buildGraphFn` call:

```ts
      const result = buildGraphFn({
        model: model[key],
        parentNodeId,
        filePath,
        yamlMap,
        lineCounter,
        propRule,
        propertyName: key,
        extra,
      })
```

- [ ] **Step 5: Merge edgeProps in applyGraphOps**

In `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`, replace the `references` loop with:

```ts
  for (const ref of ops.references ?? []) {
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeAttrs: Record<string, unknown> = { ...(ref.edgeProps ?? {}), yaml: edgeYaml }
    if (ref.positionFrom !== undefined) edgeAttrs.positionFrom = ref.positionFrom
    graph.ensureEdge(parentNodeId, ref.id, edgeKind, edgeAttrs)
  }
```

Replace the `formLocalReferences` loop with:

```ts
  for (const local of ops.formLocalReferences ?? []) {
    const effectiveParent = local.parentOverride ?? parentNodeId
    const targetId = resolveFormLocalPath(graph, local.formNodeId, local.formLocalPath)
    if (targetId === undefined) continue
    const edgeAttrs: Record<string, unknown> = { ...(local.edgeProps ?? {}), yaml: edgeYaml }
    if (local.positionFrom !== undefined) edgeAttrs.positionFrom = local.positionFrom
    graph.ensureEdge(effectiveParent, targetId, edgeKind, edgeAttrs)
  }
```

- [ ] **Step 6: Run task tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/buildGraphFromModel.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts
git commit -m "feat: :sparkles: поддержать свойства reference-рёбер графа"
```

---

### Task 2: Add Shared DataPath GraphOps Helper

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`
- Test: `packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildDataPathGraphOps } from "./graphOps"

describe("buildDataPathGraphOps", () => {
  it("создаёт DATA_PATH reference для глобального пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Catalog.Товары.Attribute.Владелец",
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
    })

    expect(result).toEqual({
      references: [
        {
          id: "Справочник.Товары.Реквизит.Владелец",
          name: "Владелец",
          edgeProps: {
            property: "dataPath",
            sourcePath: "Catalog.Товары.Attribute.Владелец",
            pathMode: "global",
          },
        },
      ],
      edgeKind: "DATA_PATH",
      edgeYaml: "ПутьКДанным",
    })
  })

  it("создаёт DATA_PATH formLocalReference для form-local пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Объект.Наименование",
      propertyName: "footerDataPath",
      edgeYaml: "ПутьКДаннымПодвала",
      formNodeId: "Форма.Товар",
    })

    expect(result).toEqual({
      formLocalReferences: [
        {
          formLocalPath: "Объект.Наименование",
          formNodeId: "Форма.Товар",
          edgeProps: {
            property: "footerDataPath",
            sourcePath: "Объект.Наименование",
            pathMode: "formLocal",
          },
        },
      ],
      edgeKind: "DATA_PATH",
      edgeYaml: "ПутьКДаннымПодвала",
    })
  })

  it("не создаёт GraphOps для пустого пути", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "",
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
      formNodeId: "Форма.Товар",
    })

    expect(result).toBeUndefined()
  })

  it("не создаёт GraphOps для form-local пути без formNodeId", () => {
    const result = buildDataPathGraphOps({
      sourcePath: "Объект.Наименование",
      propertyName: "dataPath",
      edgeYaml: "ПутьКДанным",
    })

    expect(result).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts
```

Expected: FAIL with module resolution error for `./graphOps`.

- [ ] **Step 3: Create helper**

Create `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`:

```ts
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import type { GraphOps } from "~/metadata/orchestration/property/fn"

export const DATA_PATH_EDGE_KIND = "DATA_PATH"

export type DataPathMode = "global" | "formLocal"

export interface BuildDataPathGraphOpsParams {
  sourcePath: string
  propertyName: string
  edgeYaml: string
  formNodeId?: string
}

function edgeProps(params: {
  propertyName: string
  sourcePath: string
  pathMode: DataPathMode
}) {
  return {
    property: params.propertyName,
    sourcePath: params.sourcePath,
    pathMode: params.pathMode,
  }
}

export function buildDataPathGraphOps(
  params: BuildDataPathGraphOpsParams,
): GraphOps | undefined {
  const { sourcePath, propertyName, edgeYaml, formNodeId } = params
  if (!sourcePath) return undefined

  const globalRef = extractReferenceFromPath(sourcePath)
  if (globalRef) {
    return {
      references: [
        {
          ...globalRef,
          edgeProps: edgeProps({ propertyName, sourcePath, pathMode: "global" }),
        },
      ],
      edgeKind: DATA_PATH_EDGE_KIND,
      edgeYaml,
    }
  }

  if (!formNodeId) return undefined

  return {
    formLocalReferences: [
      {
        formLocalPath: sourcePath,
        formNodeId,
        edgeProps: edgeProps({ propertyName, sourcePath, pathMode: "formLocal" }),
      },
    ],
    edgeKind: DATA_PATH_EDGE_KIND,
    edgeYaml,
  }
}
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts
git commit -m "feat: :sparkles: добавить общий builder dataPath-рёбер"
```

---

### Task 3: Convert Form Element DataPath to Unified DATA_PATH

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts`

- [ ] **Step 1: Rewrite form DataPath tests to expect unified edges**

In `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts`, change the footer test body to assert `DATA_PATH` with edge props:

```ts
    const edges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.Товары.Количество")
    expect(edges[0].attributes).toMatchObject({
      yaml: "ПутьКДаннымПодвала",
      property: "footerDataPath",
      sourcePath: "Объект.Количество",
      pathMode: "formLocal",
    })
```

Change the title test body to assert `DATA_PATH` with edge props:

```ts
    const edges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.Товары.Наименование")
    expect(edges[0].attributes).toMatchObject({
      yaml: "ПутьКДаннымЗаголовка",
      property: "titleDataPath",
      sourcePath: "Объект.Наименование",
      pathMode: "formLocal",
    })
```

In the first `dataPath` happy-path test, add edge props assertions:

```ts
    expect(dataPathEdges[0].attributes).toMatchObject({
      yaml: "ПутьКДанным",
      property: "dataPath",
      sourcePath: "Объект.Наименование",
      pathMode: "formLocal",
    })
```

Add this test to the first describe block:

```ts
  it("не создаёт legacy-рёбра для footerDataPath и titleDataPath", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            footerDataPath: "Объект.Количество",
          },
          {
            name: "Группа1",
            itemType: "UsualGroup",
            titleDataPath: "Объект.Наименование",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const legacyEdges = [...graph.outEdgeEntries(`${FORM_NODE_ID}.Элемент.ПолеВвода1`)]
      .concat([...graph.outEdgeEntries(`${FORM_NODE_ID}.Элемент.Группа1`)])
      .filter((edge) =>
        ["FOOTER_DATA_PATH", "TITLE_DATA_PATH", "ROW_PICTURE_DATA_PATH"].includes(
          edge.attributes.kind,
        ),
      )

    expect(legacyEdges).toHaveLength(0)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts
```

Expected: FAIL because `footerDataPath` and `titleDataPath` still emit legacy edge kinds and `DATA_PATH` edges do not include `property/sourcePath/pathMode`.

- [ ] **Step 3: Update DataPath graphFromModel**

Replace `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts` with:

```ts
/**
 * Регистрирует buildGraphFromModel для типа DataPath.
 *
 * Все dataPath-подобные свойства создают одно reference-ребро DATA_PATH.
 * Имя JS-свойства и исходная строка пути хранятся в props ребра.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import type { BuildGraphFromModelFunction } from "~/metadata/orchestration/property/fn"
import { buildDataPathGraphOps } from "./graphOps"

registerEdgeKind("DATA_PATH", { yaml: "ПутьКДанным", owning: false })

const buildDataPathGraph: BuildGraphFromModelFunction = ({
  model,
  propRule,
  propertyName,
  extra,
}) => {
  if (typeof model !== "string") return undefined
  const edgeYaml = propRule.yaml
  if (!edgeYaml) return undefined

  return buildDataPathGraphOps({
    sourcePath: model,
    propertyName,
    edgeYaml,
    formNodeId: extra?.formNodeId as string | undefined,
  })
}

registerTypeRule("DataPath", "buildGraphFromModel", buildDataPathGraph)
```

- [ ] **Step 4: Run form DataPath tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts
git commit -m "feat: :sparkles: унифицировать dataPath-рёбра форм"
```

---

### Task 4: Convert ChoiceParameterLink.dataPath and Remove p_dataPath

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`

- [ ] **Step 1: Rewrite ChoiceParameterLinks tests**

In `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`, change the first test assertions for the first child node:

```ts
    expect(first.label).toBe("ChoiceParameterLink")
    expect(first.props.name).toBe("Отбор.Владелец")
    expect(first.props.p_dataPath).toBeUndefined()
    expect(first.props.p_valueChange).toBe("DontChange")
```

In the global path test, add edge props assertions:

```ts
    expect(dataPathEdge?.target).toBe("Справочник.Товары.Реквизит.Владелец")
    expect(dataPathEdge?.attributes).toMatchObject({
      yaml: "ПутьКДанным",
      property: "dataPath",
      sourcePath: "Catalog.Товары.Attribute.Владелец",
      pathMode: "global",
    })
```

In the form-local path test, add edge props assertions:

```ts
    expect(dataPathEdge?.target).toBe(footerAttrId)
    expect(dataPathEdge?.attributes).toMatchObject({
      yaml: "ПутьКДанным",
      property: "dataPath",
      sourcePath: "РеквизитПодвала",
      pathMode: "formLocal",
    })
```

Add this test:

```ts
  it("не добавляет синтетическое поле dataPathReference в props ChoiceParameterLink", () => {
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
    const file = walkGraphToFileData(graph).find((segment) => segment.filePath === filePath)!
    const link = file.nodes.find((node) => node.id === linkNodeId)!

    expect(Object.keys(link.props).some((key) => key.includes("dataPathReference"))).toBe(false)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
```

Expected: FAIL because `p_dataPath` still exists and `dataPathReference` is still used.

- [ ] **Step 3: Update ChoiceParameterLinks graph builder**

Replace `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts` with:

```ts
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import "~/metadata/forms/commonObjects/dataPath/graphFromModel"
import type {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsChild,
} from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ChoiceParameterLinks } from "./types"

const EDGE_KIND = "CHOICE_PARAMETER_LINK"
const EDGE_YAML = "СвязьПараметровВыбора"
const DATA_PATH_EDGE_YAML = "ПутьКДанным"
const NODE_SEGMENT = "СвязьПараметровВыбора"

const ChoiceParameterLinkGraphRule = {
  itemType: "ChoiceParameterLink",
  properties: {
    name: { type: "string", yaml: "Имя" },
    dataPath: { type: "DataPath", yaml: DATA_PATH_EDGE_YAML },
    valueChange: { type: "string", yaml: "ИзменениеЗначения" },
  },
} as unknown as MetadataItemRule

const buildChoiceParameterLinksGraph: BuildGraphFromModelFunction = ({ model, parentNodeId }) => {
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

registerTypeRule("ChoiceParameterLinks", "buildGraphFromModel", buildChoiceParameterLinksGraph)
```

- [ ] **Step 4: Run ChoiceParameterLinks tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run direct buildGraph smoke tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts --grep "choiceParameterLinks"
```

Expected: PASS. The direct build graph import must still register `ChoiceParameterLinks`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
git commit -m "feat: :sparkles: унифицировать dataPath связей выбора"
```

---

### Task 5: Remove Legacy DataPath Edge Kinds

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts`

- [ ] **Step 1: Write failing edgeKinds assertions**

In `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts`, replace assertions that expect old dataPath YAML keys to map to legacy kinds with:

```ts
  it("не регистрирует legacy dataPath kind по имени свойства", () => {
    expect(getKnownKinds()).not.toContain("FOOTER_DATA_PATH")
    expect(getKnownKinds()).not.toContain("TITLE_DATA_PATH")
    expect(getKnownKinds()).not.toContain("ROW_PICTURE_DATA_PATH")
    expect(getKindByYaml("ПутьКДаннымПодвала")).toBeUndefined()
    expect(getKindByYaml("ПутьКДаннымЗаголовка")).toBeUndefined()
    expect(getKindByYaml("ПутьКДаннымКартинкиСтроки")).toBeUndefined()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
```

Expected: FAIL because legacy edge kinds are still registered.

- [ ] **Step 3: Remove legacy edge kinds**

In `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`, delete these entries:

```ts
  ["FOOTER_DATA_PATH", { yaml: "ПутьКДаннымПодвала", owning: false }],
  ["TITLE_DATA_PATH", { yaml: "ПутьКДаннымЗаголовка", owning: false }],
  ["ROW_PICTURE_DATA_PATH", { yaml: "ПутьКДаннымКартинкиСтроки", owning: false }],
```

Keep this entry:

```ts
  ["DATA_PATH", { yaml: "ПутьКДанным", owning: false }],
```

- [ ] **Step 4: Run edgeKinds tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
```

Expected: PASS.

- [ ] **Step 5: Search for legacy kind usage**

Run:

```bash
rg -n "FOOTER_DATA_PATH|TITLE_DATA_PATH|ROW_PICTURE_DATA_PATH|dataPathReference" packages/core/metadata
```

Expected: output contains no production `.ts` files. Test files may contain only negative assertions from this plan.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.test.ts
git commit -m "refactor: :recycle: удалить legacy dataPath kind"
```

---

### Task 6: Add DATA_PATH_DEPENDS_ON for Form-Local Paths

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`

- [ ] **Step 1: Write failing dependency test**

Add this test inside `describe("formLocalReferences", ...)` in `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`:

```ts
    it("создаёт DATA_PATH_DEPENDS_ON для form-local пути", () => {
      const { graph, formNodeId, attrId } = makeFormGraph()
      const elementId = `${formNodeId}.Элемент.Поле`
      const typeId = "Справочник.Товары"
      const targetId = `${typeId}.Наименование`

      ensureNodeWithFile(graph, elementId, "Поле", "test/Форма.yaml")
      graph.ensureNode(typeId, { name: "Товары" })
      graph.ensureNode(targetId, { name: "Наименование" })
      graph.ensureEdge(attrId, typeId, "TYPE", { yaml: "Тип" })

      const ctx: ApplyGraphOpsContext = {
        graph,
        parentNodeId: elementId,
        filePath: "test/Форма.yaml",
        edgeKind: "DATA_PATH",
        edgeYaml: "ПутьКДанным",
      }

      applyGraphOps(
        {
          formLocalReferences: [
            {
              formLocalPath: "Объект.Наименование",
              formNodeId,
              edgeProps: {
                property: "dataPath",
                sourcePath: "Объект.Наименование",
                pathMode: "formLocal",
              },
              dependsOnEdgeKind: "DATA_PATH_DEPENDS_ON",
            },
          ],
        },
        ctx,
      )

      const dataPathEdges = [...graph.outEdgeEntries(elementId)].filter(
        (edge) => edge.attributes.kind === "DATA_PATH",
      )
      expect(dataPathEdges.map((edge) => edge.target)).toEqual([targetId])

      const dependencyEdges = [...graph.outEdgeEntries(elementId)].filter(
        (edge) => edge.attributes.kind === "DATA_PATH_DEPENDS_ON",
      )
      expect(dependencyEdges.map((edge) => edge.target)).toEqual([attrId, typeId])
      expect(dependencyEdges.every((edge) => edge.attributes.property === "dataPath")).toBe(true)
      expect(dependencyEdges.every((edge) => edge.attributes.sourcePath === "Объект.Наименование")).toBe(true)
    })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts --grep "DATA_PATH_DEPENDS_ON"
```

Expected: FAIL because `dependsOnEdgeKind` is not defined and dependency edges are not created.

- [ ] **Step 3: Extend GraphOpsFormLocalReference**

In `packages/core/metadata/orchestration/property/fn.ts`, add this field to `GraphOpsFormLocalReference`:

```ts
  /** Если задано — applyGraphOps создаёт dependency-рёбра от источника к узлам, участвовавшим в разрешении form-local пути. */
  dependsOnEdgeKind?: string
```

- [ ] **Step 4: Register DATA_PATH_DEPENDS_ON**

In `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`, add:

```ts
  ["DATA_PATH_DEPENDS_ON", { yaml: "ЗависимостьПутиКДанным", owning: false }],
```

Put it near `DATA_PATH`.

- [ ] **Step 5: Replace resolver with detailed resolver**

In `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`, replace `resolveFormLocalPath` with a detailed resolver that returns target and dependencies:

```ts
interface FormLocalPathResolution {
  targetId: string
  dependencyIds: string[]
}

function uniquePush(target: string[], value: string | undefined): void {
  if (value === undefined) return
  if (!target.includes(value)) target.push(value)
}

function resolveFormLocalPath(
  graph: GraphBuilder,
  formNodeId: string,
  path: string,
): FormLocalPathResolution | undefined {
  if (!path) return undefined
  if (!graph.hasNode(formNodeId)) return undefined

  const segments = path.split(".")
  const dependencyIds: string[] = []

  let currentNodeId: string | undefined
  for (const { attributes, target } of graph.outEdgeEntries(formNodeId)) {
    if (
      FORM_CHILD_KINDS.has(attributes.kind) &&
      graph.hasNode(target) &&
      graph.getNodeAttributes(target).name === segments[0]
    ) {
      currentNodeId = target
      uniquePush(dependencyIds, target)
      break
    }
  }
  if (currentNodeId === undefined) return undefined

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]!

    let typeTargetId: string | undefined
    for (const { attributes, target } of graph.outEdgeEntries(currentNodeId)) {
      if (attributes.kind === "TYPE") {
        typeTargetId = target
        uniquePush(dependencyIds, target)
        break
      }
    }
    if (typeTargetId === undefined) return undefined

    const childByEdge = findChildByName(graph, typeTargetId, segment)
    const nextNodeId = childByEdge ?? `${typeTargetId}.${segment}`

    if (childByEdge !== undefined) uniquePush(dependencyIds, childByEdge)

    if (i < segments.length - 1 && !graph.hasNode(nextNodeId)) return undefined

    currentNodeId = nextNodeId
  }

  if (!graph.hasNode(currentNodeId)) {
    const name = currentNodeId.split(".").pop() ?? currentNodeId
    graph.ensureNode(currentNodeId, { name })
  }

  return { targetId: currentNodeId, dependencyIds }
}
```

Then update the `formLocalReferences` loop:

```ts
  for (const local of ops.formLocalReferences ?? []) {
    const effectiveParent = local.parentOverride ?? parentNodeId
    const resolution = resolveFormLocalPath(graph, local.formNodeId, local.formLocalPath)
    if (resolution === undefined) continue
    const edgeAttrs: Record<string, unknown> = { ...(local.edgeProps ?? {}), yaml: edgeYaml }
    if (local.positionFrom !== undefined) edgeAttrs.positionFrom = local.positionFrom
    graph.ensureEdge(effectiveParent, resolution.targetId, edgeKind, edgeAttrs)

    if (local.dependsOnEdgeKind) {
      for (const dependencyId of resolution.dependencyIds) {
        graph.ensureEdge(effectiveParent, dependencyId, local.dependsOnEdgeKind, {
          ...(local.edgeProps ?? {}),
          yaml: "ЗависимостьПутиКДанным",
        })
      }
    }
  }
```

- [ ] **Step 6: Make DataPath helper request dependency edges**

In `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`, update the form-local return:

```ts
  return {
    formLocalReferences: [
      {
        formLocalPath: sourcePath,
        formNodeId,
        edgeProps: edgeProps({ propertyName, sourcePath, pathMode: "formLocal" }),
        dependsOnEdgeKind: "DATA_PATH_DEPENDS_ON",
      },
    ],
    edgeKind: DATA_PATH_EDGE_KIND,
    edgeYaml,
  }
```

- [ ] **Step 7: Run dependency tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts --grep "DATA_PATH_DEPENDS_ON"
```

Expected: PASS.

- [ ] **Step 8: Run affected graph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts
git commit -m "feat: :sparkles: добавить зависимости dataPath для watch"
```

---

### Task 7: Update Architecture Notes and Final Verification

**Files:**
- Modify: `.agents/architecture-orchestration.md`
- Test: project test suite

- [ ] **Step 1: Update architecture note**

In `.agents/architecture-orchestration.md`, in the `DataPath как пример границы` section, add this paragraph after the `DATA_PATH` example:

```md
Не вводи отдельные kind под имя свойства (`FOOTER_DATA_PATH`, `TITLE_DATA_PATH`, `ROW_PICTURE_DATA_PATH`). Имя свойства всегда хранится в `property` на `DATA_PATH`. Синтетические поля вроде `dataPathReference` не используются: если свойство представлено ребром, оно не должно дублироваться как `p_<property>` на узле.
```

- [ ] **Step 2: Search for legacy usage**

Run:

```bash
rg -n "FOOTER_DATA_PATH|TITLE_DATA_PATH|ROW_PICTURE_DATA_PATH|dataPathReference|p_dataPath" packages/core/metadata .agents docs/superpowers/specs/2026-05-04-data-path-binding-design.md
```

Expected: output may mention legacy names only in docs/spec text that says they are forbidden, and in tests that assert absence. No production `.ts` file should contain these strings.

- [ ] **Step 3: Run core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 4: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS. This is required before closing the issue.

- [ ] **Step 5: Commit**

```bash
git add .agents/architecture-orchestration.md
git commit -m "docs: :memo: закрепить инварианты dataPath-графа"
```

---

## Self-Review

Spec coverage:

- Unified `DATA_PATH` with `property/yaml/sourcePath/pathMode`: Tasks 1-4.
- No `DataPathBinding`: no task creates a binding node; helper creates direct reference edges.
- Global and form-local paths: Task 2 helper and Task 4 `ChoiceParameterLink` tests cover both.
- Stub targets: existing `applyGraphOps` behavior is preserved; Task 3 keeps the missing final segment test.
- `DATA_PATH_DEPENDS_ON`: Task 6 adds dependency edges for form-local resolution.
- Cypher-friendly contracts: direct owner-to-target `DATA_PATH` is asserted in Tasks 3 and 4.
- Legacy removal: Task 5 removes legacy kind registrations; Task 7 searches for remaining legacy usage.
- No `p_dataPath` duplication: Task 4 asserts absence on `ChoiceParameterLink`; Task 3 relies on existing `flattenSkipKeys` for form elements.

Placeholder scan:

- The plan contains no forbidden placeholder markers or open-ended implementation instructions.
- Every code-changing step includes concrete code or exact replacement snippets.

Type consistency:

- The edge prop field is consistently named `edgeProps`.
- The path mode field is consistently named `pathMode`.
- The dependency edge kind is consistently named `DATA_PATH_DEPENDS_ON`.
- The helper entry point is consistently named `buildDataPathGraphOps`.
