# Unified Form YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split `Форма.yaml` + `Форма.nkdk` form format with one canonical `Форма.yaml` that stores both form properties and the visual element tree.

**Architecture:** Add a full tree YAML serializer/importer for form elements, then switch `ClientApplicationForm` import/export and form XML sync to use it directly. After forms are one-file sources, remove paired-file graph/watch handling and delete the NKDK language package and all NKDK import/export modules.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, yaml, existing `rules.ts` metadata orchestration, graph import registry, CLI watch/updateGraph.

---

## File Structure

Read before implementation:

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/knowledge/metadata/sources-of-truth.md`
- `.agents/knowledge/metadata/yaml-contract.md`
- `.agents/knowledge/metadata/round-trip-cycle.md`
- `.agents/architecture-orchestration.md`
- `docs/superpowers/specs/2026-05-20-unified-form-yaml-design.md`

Create:

- `packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts`  
  Owns the new nested element tree YAML format: `{ [name]: { Вид, ...props, Элементы? } }`.

Modify:

- `packages/core/metadata/forms/commonObjects/childItems/types.ts`  
  Add tree YAML types.
- `packages/core/metadata/forms/commonObjects/childItems/toYAML.ts`  
  Register child item export with the tree serializer.
- `packages/core/metadata/forms/commonObjects/childItems/fromYAML.ts`  
  Register child item import with the tree importer.
- `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`  
  Give `childItems` the YAML key `Элементы`; preserve `КоманднаяПанель` owner property behavior.
- `packages/core/metadata/forms/elements/usualGroup/rules.ts`
- `packages/core/metadata/forms/elements/table/rules.ts`
- `packages/core/metadata/forms/elements/page/rules.ts`
- `packages/core/metadata/forms/elements/pages/rules.ts`
- `packages/core/metadata/forms/elements/commandBar/rules.ts`
- `packages/core/metadata/forms/elements/columnGroup/rules.ts`  
  Give child item properties the YAML key `Элементы` and stop partial-YAML overlay behavior.
- `packages/core/metadata/forms/elements/table/rules.ts`  
  Re-enable YAML for `dataPath` so `ПутьКДанным` is explicit for tables.
- `packages/core/metadata/forms/clientApplicationForm/types.ts`  
  Replace `Элементы?: FormChildItemsPartialYAML` with tree YAML.
- `packages/core/metadata/forms/clientApplicationForm/rules.ts`  
  Make root `childItems` export/import through `yaml: "Элементы"`; make `autoCommandBar` import from YAML.
- `packages/core/metadata/forms/clientApplicationForm/toYAML.ts`  
  Stop collecting flat partial element YAML via `getAllElements`.
- `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts`  
  Stop requiring a source model from NKDK; import the full form from YAML.
- `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`  
  Read only `Форма.yaml`.
- `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`  
  Write only `Форма.yaml`.
- `packages/core/metadata/graphImport/projectFiles.ts`
- `packages/core/metadata/graphImport/registerFormGraphImport.ts`
- `packages/core/metadata/orchestration/buildGraph/types.ts`
- `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`
- `packages/core/metadata/orchestration/graphImport/registry.ts`
- `packages/cli/src/graph/projectFiles.ts`
- `packages/cli/src/graph/projectSources.ts`
- `packages/cli/src/commands/updateGraph.ts`
- `packages/cli/src/commands/watch.ts`
- `packages/cli/src/commands/updateGraph.test.ts`
- `packages/cli/src/commands/watch.test.ts`
- `packages/cli/src/graph/projectFiles.test.ts`
- `packages/cli/src/graph/projectSources.test.ts`  
  Remove paired form file behavior and `.nkdk` tracking.
- `packages/core/package.json`
- `packages/extension/package.json`
- `packages/core/tsconfig.json`
- `packages/cli/tsconfig.json`
- `packages/extension/tsconfig.json`
- `packages/core/vitest.config.ts`
- `packages/cli/vitest.config.ts`
- `pnpm-lock.yaml`
- `AGENTS.md`
- `.agents/architecture-orchestration.md`  
  Remove `nkdk-language`, Langium setup, and NKDK architectural notes.

Delete:

- `packages/language/**`
- `packages/core/metadata/forms/clientApplicationForm/fromNKDK.ts`
- `packages/core/metadata/forms/clientApplicationForm/parseNKDK.ts`
- `packages/core/metadata/forms/clientApplicationForm/toNKDK.ts`
- `packages/core/metadata/orchestration/formElement/fromNKDK/**`
- `packages/core/metadata/orchestration/formElement/toNKDK/**`
- `packages/core/metadata/forms/commonObjects/childItems/fromNKDK.ts`
- `packages/core/metadata/forms/commonObjects/childItems/toNKDK.ts`
- all `packages/core/metadata/forms/**/fromNKDK.ts`
- all `packages/core/metadata/forms/**/toNKDK.ts`
- all `packages/core/metadata/forms/**/*fromNKDK.test.ts`
- all `packages/core/metadata/forms/**/*toNKDK.test.ts`
- `packages/core/tests/fromNKDK.ts` if it has no remaining users.

Keep:

- Existing XML fixtures unchanged.
- Existing element XML/fromYAML/toYAML rule files unless this plan names a specific property change.

---

### Task 1: Add Nested Tree YAML For Child Items

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/fromYAML.ts`
- Test: `packages/core/metadata/forms/commonObjects/childItems/treeYAML.test.ts`

- [ ] **Step 1: Write failing tests for nested tree export/import**

Create `packages/core/metadata/forms/commonObjects/childItems/treeYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToYAML, mockContext } from "~/tests/mockContext"
import {
  exportChildItemsToTreeYAML,
  importChildItemsFromTreeYAML,
} from "./treeYAML"
import type { GroupChildItems } from "./types"

describe("child item tree YAML", () => {
  it("exports nested group, table, table command bar, and table column", () => {
    const items: GroupChildItems = [
      {
        itemType: "UsualGroup",
        name: "Основное",
        group: "Vertical",
        childItems: [
          {
            itemType: "InputField",
            name: "Товар",
            dataPath: "Объект.Товар",
          },
          {
            itemType: "Table",
            name: "Товары",
            dataPath: "Объект.Товары",
            childItems: [
              {
                itemType: "TableInputField",
                name: "Номенклатура",
                dataPath: "Объект.Товары.Номенклатура",
              },
            ],
            autoCommandBar: {
              itemType: "AutoCommandBar",
              autofill: true,
              childItems: [
                {
                  itemType: "Button",
                  name: "Добавить",
                  type: "UsualButton",
                  commandName: "ТоварыДобавить",
                },
              ],
            },
          },
        ],
      },
    ]

    expect(exportChildItemsToTreeYAML({ context: mockContextToYAML, items })).toEqual({
      Основное: {
        Вид: "Группа",
        Группировка: "Вертикальная",
        Элементы: {
          Товар: {
            Вид: "ПолеВвода",
            ПутьКДанным: "Объект.Товар",
          },
          Товары: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Объект.Товары",
            КоманднаяПанель: {
              Элементы: {
                Добавить: {
                  Вид: "Кнопка",
                  ТипКнопки: "ОбычнаяКнопка",
                  ИмяКоманды: "ТоварыДобавить",
                },
              },
            },
            Элементы: {
              Номенклатура: {
                Вид: "ПолеВвода",
                ПутьКДанным: "Объект.Товары.Номенклатура",
              },
            },
          },
        },
      },
    })
  })

  it("imports nested YAML without a source tree", () => {
    const result = importChildItemsFromTreeYAML<GroupChildItems>({
      context: mockContext,
      yaml: {
        Основное: {
          Вид: "Группа",
          Группировка: "Вертикальная",
          Элементы: {
            Товар: {
              Вид: "ПолеВвода",
              ПутьКДанным: "Объект.Товар",
            },
          },
        },
      },
    })

    expect(result).toEqual([
      {
        itemType: "UsualGroup",
        name: "Основное",
        group: "Vertical",
        childItems: [
          {
            itemType: "InputField",
            name: "Товар",
            dataPath: "Объект.Товар",
          },
        ],
      },
    ])
  })

  it("throws a clear error when Вид is missing", () => {
    expect(() =>
      importChildItemsFromTreeYAML({
        context: mockContext,
        yaml: {
          Товар: {
            ПутьКДанным: "Объект.Товар",
          },
        },
      }),
    ).toThrow('Элемент "Товар": обязательное поле "Вид" не задано')
  })

  it("throws a clear error when Вид is unknown", () => {
    expect(() =>
      importChildItemsFromTreeYAML({
        context: mockContext,
        yaml: {
          Товар: {
            Вид: "НесуществующийЭлемент",
          },
        },
      }),
    ).toThrow('Элемент "Товар": неизвестный Вид "НесуществующийЭлемент"')
  })
})
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/commonObjects/childItems/treeYAML.test.ts
```

Expected: FAIL because `treeYAML.ts` does not exist.

- [ ] **Step 3: Add tree YAML types**

Modify `packages/core/metadata/forms/commonObjects/childItems/types.ts` by adding these exports near the existing YAML type exports:

```ts
import { CollectableElementToYAML, CollectableElementType } from "~/metadata/orchestration"

export type FormElementTreeYAML = Record<string, FormElementTreeNodeYAML>

export type FormElementTreeNodeYAML = {
  Вид: CollectableElementToYAML<CollectableElementType>
  Элементы?: FormElementTreeYAML
} & Record<string, unknown>
```

If `CollectableElementToYAML` or `CollectableElementType` are already imported in this file, extend the existing import instead of adding a duplicate.

- [ ] **Step 4: Implement `treeYAML.ts`**

Create `packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import {
  exportElementToYAML,
  exportFormElementTypeToYAML,
  importElementFromPartialYAML,
  importFormElementTypeFromYAML,
  type CollectableElement,
  type CollectableElementToYAML,
  type CollectableElementType,
  type ElementRule,
  type ToMetadata,
  type ToYAML,
} from "~/metadata/orchestration"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { ChildItem, FormElementTreeNodeYAML, FormElementTreeYAML } from "./types"

const TYPE_KEY = "Вид"

export function exportChildItemsToTreeYAML<From extends ChildItem>(params: {
  context: ConfigurationContext
  items: From[] | undefined
}): FormElementTreeYAML | undefined {
  const { context, items } = params
  if (!items || items.length === 0) return undefined

  const result: FormElementTreeYAML = {}
  for (const item of items) {
    result[item.name] = exportChildItemToTreeNodeYAML({ context, item })
  }
  return result
}

export function exportChildItemToTreeNodeYAML<From extends ChildItem>(params: {
  context: ConfigurationContext
  item: From
}): FormElementTreeNodeYAML {
  const { context, item } = params
  const rule = getElementRule(item.itemType) as ElementRule
  const yaml = exportElementToYAML({
    context,
    element: item as ToMetadata<typeof rule.itemType>,
    rule,
  }) as Record<string, unknown> | undefined

  return {
    [TYPE_KEY]: exportFormElementTypeToYAML(context, item.itemType as CollectableElementType),
    ...(yaml ?? {}),
  } as FormElementTreeNodeYAML
}

export function importChildItemsFromTreeYAML<To extends ChildItem[]>(params: {
  context: ConfigurationContext
  yaml: FormElementTreeYAML | undefined
}): To {
  const { context, yaml } = params
  if (yaml === undefined) return [] as unknown as To
  if (!isRecord(yaml)) {
    throw new Error(`Элементы: ожидался YAML-объект`)
  }

  return Object.entries(yaml).map(([name, node]) =>
    importChildItemFromTreeNodeYAML({ context, name, node }),
  ) as unknown as To
}

export function importChildItemFromTreeNodeYAML(params: {
  context: ConfigurationContext
  name: string
  node: FormElementTreeNodeYAML
}): CollectableElement {
  const { context, name, node } = params
  if (!isRecord(node)) {
    throw new Error(`Элемент "${name}": ожидался YAML-объект`)
  }

  const rawType = node[TYPE_KEY]
  if (typeof rawType !== "string") {
    throw new Error(`Элемент "${name}": обязательное поле "Вид" не задано`)
  }

  const itemType = importFormElementTypeFromYAML(
    context,
    rawType as CollectableElementToYAML<CollectableElementType>,
  )
  if (itemType === undefined) {
    throw new Error(`Элемент "${name}": неизвестный Вид "${rawType}"`)
  }

  const yaml = { ...node }
  delete yaml[TYPE_KEY]

  const imported = importElementFromPartialYAML({
    context,
    itemType,
    yaml: yaml as ToYAML<typeof itemType>,
  }) as CollectableElement

  return { ...imported, name }
}

export function exportChildItemsToTreeYAMLProperty(params: {
  context: ConfigurationContext
  value: ChildItem[] | undefined
}): FormElementTreeYAML | undefined {
  return exportChildItemsToTreeYAML({ context: params.context, items: params.value })
}

export function importChildItemsFromTreeYAMLProperty(params: {
  context: ConfigurationContext
  value: FormElementTreeYAML | undefined
}): ChildItem[] {
  return importChildItemsFromTreeYAML({ context: params.context, yaml: params.value })
}

export function isChildItemsTreeRule(rule: PropertyRule): boolean {
  return (
    rule.type === "GroupChildItems" ||
    rule.type === "CommandBarChildItems" ||
    rule.type === "TableChildItems" ||
    rule.type === "PagesChildItems"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
```

Adjust imports after TypeScript reports unused names. Keep the exported helper names; Tasks 2 and 3 call them directly.

- [ ] **Step 5: Register tree import/export for child item collections**

Modify `packages/core/metadata/forms/commonObjects/childItems/toYAML.ts` so child item collection registrations use the tree exporter:

```ts
import { exportChildItemsToTreeYAMLProperty } from "./treeYAML"

registerTypeRule("TableChildItems", "exportToYAML", ({ context, value }) =>
  exportChildItemsToTreeYAMLProperty({ context, value }),
)
registerTypeRule("GroupChildItems", "exportToYAML", ({ context, value }) =>
  exportChildItemsToTreeYAMLProperty({ context, value }),
)
registerTypeRule("CommandBarChildItems", "exportToYAML", ({ context, value }) =>
  exportChildItemsToTreeYAMLProperty({ context, value }),
)
registerTypeRule("PagesChildItems", "exportToYAML", ({ context, value }) =>
  exportChildItemsToTreeYAMLProperty({ context, value }),
)
```

Keep `exportChildItemsToTypedYAML` only if tests still use it directly. Remove the old registration lines that pass `exportChildItemsToTypedYAML`.

Modify `packages/core/metadata/forms/commonObjects/childItems/fromYAML.ts` so child item collection registrations use the tree importer:

```ts
import { importChildItemsFromTreeYAMLProperty } from "./treeYAML"

registerTypeRule("GroupChildItems", "importFromYAML", ({ context, value }) =>
  importChildItemsFromTreeYAMLProperty({ context, value }),
)
registerTypeRule("CommandBarChildItems", "importFromYAML", ({ context, value }) =>
  importChildItemsFromTreeYAMLProperty({ context, value }),
)
registerTypeRule("TableChildItems", "importFromYAML", ({ context, value }) =>
  importChildItemsFromTreeYAMLProperty({ context, value }),
)
registerTypeRule("PagesChildItems", "importFromYAML", ({ context, value }) =>
  importChildItemsFromTreeYAMLProperty({ context, value }),
)
```

Remove `importChildItemsFromPartialYAML` after no code imports it. Keep `importChildItemsTypedFromYAML` only if a test or public export still uses it directly.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/commonObjects/childItems/treeYAML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected: new tree tests pass. Existing element-level YAML tests may fail because they still assert partial/typed YAML helpers; update them in Task 2 when element rules are aligned.

- [ ] **Step 7: Commit Task 1**

```bash
git add packages/core/metadata/forms/commonObjects/childItems
git commit -m "feat: :sparkles: добавить дерево элементов в YAML форм"
```

---

### Task 2: Make Element Rules Emit Full Tree Properties

**Files:**
- Modify: `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`
- Modify: `packages/core/metadata/forms/elements/usualGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/forms/elements/page/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pages/rules.ts`
- Modify: `packages/core/metadata/forms/elements/commandBar/rules.ts`
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts`
- Modify tests under `packages/core/metadata/forms/elements/__tests__`

- [ ] **Step 1: Write focused expectations for tree properties**

Add a new test block to `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`:

```ts
import { exportChildItemToTreeNodeYAML } from "~/metadata/forms/commonObjects/childItems/treeYAML"

describe("exportChildItemToTreeNodeYAML", () => {
  it("exports Вид and nested Элементы for group", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "UsualGroup",
        name: "Основное",
        group: "Vertical",
        childItems: [
          {
            itemType: "InputField",
            name: "Товар",
            dataPath: "Объект.Товар",
          },
        ],
      },
    })

    expect(result).toEqual({
      Вид: "Группа",
      Группировка: "Вертикальная",
      Элементы: {
        Товар: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Товар",
        },
      },
    })
  })

  it("exports table ПутьКДанным explicitly", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "Table",
        name: "Товары",
        dataPath: "Объект.Товары",
        childItems: [],
      },
    })

    expect(result).toEqual({
      Вид: "ТаблицаФормы",
      ПутьКДанным: "Объект.Товары",
    })
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected: FAIL because `childItems` rules do not yet expose `yaml: "Элементы"` and `Table.dataPath` is not exported to YAML.

- [ ] **Step 3: Update child item property rules**

In each listed rules file, change child item properties to include `yaml: "Элементы"` and remove `fromPartialYAML`/`toPartialYAML` from those properties.

Examples:

```ts
// packages/core/metadata/forms/elements/usualGroup/rules.ts
childItems: {
  yaml: "Элементы",
  type: "GroupChildItems",
  defaultValue: [],
  required: true,
},
```

```ts
// packages/core/metadata/forms/elements/table/rules.ts
childItems: {
  yaml: "Элементы",
  type: "TableChildItems",
  defaultValue: [],
},
dataPath: {
  yaml: "ПутьКДанным",
  type: "DataPath",
  defaultType: "ValueTable",
},
```

```ts
// packages/core/metadata/forms/elements/autoCommandBar/rules.ts
childItems: {
  yaml: "Элементы",
  type: "CommandBarChildItems",
  required: true,
  defaultValue: [],
},
```

```ts
// packages/core/metadata/forms/elements/page/rules.ts
childItems: {
  yaml: "Элементы",
  type: "GroupChildItems",
  defaultValue: [],
},
```

```ts
// packages/core/metadata/forms/elements/pages/rules.ts
childItems: {
  yaml: "Элементы",
  type: "PagesChildItems",
  defaultValue: [],
  required: true,
},
```

```ts
// packages/core/metadata/forms/elements/commandBar/rules.ts
childItems: {
  yaml: "Элементы",
  type: "CommandBarChildItems",
  defaultValue: [],
  required: true,
},
```

```ts
// packages/core/metadata/forms/elements/columnGroup/rules.ts
childItems: {
  yaml: "Элементы",
  type: "TableChildItems",
  defaultValue: [],
},
```

Use the existing property type in each file. Do not change XML tags or model property names.

- [ ] **Step 4: Update typed YAML tests to the new key name**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, remove imports from `nkdk-language`. Replace fixture source types with local minimal types when needed:

```ts
type NkdkLikeNamed = {
  elementName?: string
  name?: { elementName?: string }
  title?: string
  childItems?: unknown[]
}
```

Then update expected YAML fixtures touched by this task:

- typed element discriminator remains `Тип` for `exportElementToTypedYAML`;
- tree node discriminator is `Вид`;
- child collections in full tree output use `Элементы`.

Keep old partial YAML expectations only for tests that still call `exportElementToPartialYAML` directly. Mark those tests as legacy only if they are still needed by code; otherwise remove the partial test suite after Task 3 no longer uses it.

- [ ] **Step 5: Run element YAML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts
```

Expected: PASS after fixtures are updated.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/core/metadata/forms/elements packages/core/metadata/forms/commonObjects/childItems
git commit -m "feat: :sparkles: сериализовать свойства элементов в дереве"
```

---

### Task 3: Switch ClientApplicationForm To One YAML Source

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/types.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
- Fixtures: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/*.ts`

- [ ] **Step 1: Add one-source form YAML tests**

Add these tests to `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`:

```ts
it("exports form command bar and elements in one YAML tree", () => {
  const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, {
    itemType: "ClientApplicationForm",
    commands: [],
    autoCommandBar: {
      itemType: "AutoCommandBar",
      autofill: true,
      childItems: [
        {
          itemType: "Button",
          name: "Записать",
          type: "UsualButton",
          commandName: "Записать",
        },
      ],
    },
    childItems: [
      {
        itemType: "InputField",
        name: "Товар",
        dataPath: "Объект.Товар",
      },
    ],
  })

  expect(yaml).toMatchObject({
    КоманднаяПанель: {
      Элементы: {
        Записать: {
          Вид: "Кнопка",
          ИмяКоманды: "Записать",
        },
      },
    },
    Элементы: {
      Товар: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Объект.Товар",
      },
    },
  })
})
```

Add this test to `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`:

```ts
it("imports a complete form from YAML without NKDK source", () => {
  const result = importClientApplicationFormFromYAML(mockContext, {
    КоманднаяПанель: {
      Элементы: {
        Записать: {
          Вид: "Кнопка",
          ИмяКоманды: "Записать",
        },
      },
    },
    Элементы: {
      Товар: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Объект.Товар",
      },
    },
  })

  expect(result).toEqual({
    itemType: "ClientApplicationForm",
    commands: [],
    autoCommandBar: {
      itemType: "AutoCommandBar",
      autofill: true,
      childItems: [
        {
          itemType: "Button",
          name: "Записать",
          commandName: "Записать",
        },
      ],
    },
    childItems: [
      {
        itemType: "InputField",
        name: "Товар",
        dataPath: "Объект.Товар",
      },
    ],
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts
```

Expected: FAIL because current import requires a source form and current export still produces flat partial `Элементы`.

- [ ] **Step 3: Update form types and rules**

Modify `packages/core/metadata/forms/clientApplicationForm/types.ts`:

```ts
import { FormElementTreeYAML } from "../commonObjects/childItems/types"

export type ClientApplicationFormYAML = YAMLTypeByRule<typeof ClientApplicationFormRules> & {
  Элементы?: FormElementTreeYAML
}
```

Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`:

```ts
autoCommandBar: {
  yaml: "КоманднаяПанель",
  type: "AutoCommandBar",
  tag: FormRulesTags.Form,
},
childItems: {
  yaml: "Элементы",
  type: "GroupChildItems",
  tag: FormRulesTags.Form,
  defaultValue: [],
  required: true,
},
```

Remove `fromYAML: false`, `fromPartialYAML`, and `toPartialYAML` from those two properties.

- [ ] **Step 4: Simplify form export**

Modify `packages/core/metadata/forms/clientApplicationForm/toYAML.ts` to stop using `getAllElements` and `exportChildItemsToPartialYAML`.

The function body should become:

```ts
export const exportClientApplicationFormToYAML = (
  context: ConfigurationContext,
  data: ClientApplicationForm
): FormYAMLExportResult => {
  const externalFilesCollector: ExternalFileEntry[] = []

  const contextWithCollector: ConfigurationContext = context.exportToYAML
    ? {
        ...context,
        exportToYAML: {
          ...context.exportToYAML,
          externalFilesCollector,
        },
      }
    : context

  const yaml = exportPropertiesToYAML({
    context: contextWithCollector,
    data,
    rule: ClientApplicationFormRules,
  }) as ClientApplicationFormYAML

  return { yaml, externalFiles: externalFilesCollector }
}
```

Remove now-unused imports.

- [ ] **Step 5: Simplify form import**

Modify `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts` to make `source` optional and import directly from YAML:

```ts
export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  source?: ClientApplicationForm,
): ClientApplicationForm => {
  const properties = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: ClientApplicationFormRules,
    source,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return properties
}
```

Remove direct `importPropertyFromYAML`, `PropertyRule`, `allElements`, and manual `autoCommandBar` merging.

- [ ] **Step 6: Update client form YAML fixtures**

Update fixture objects in:

- `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`

Convert flat partial `Элементы` entries into nested tree nodes with `Вид`. Example:

```ts
Элементы: {
  ФормаГруппа1: {
    Вид: "Группа",
    Группировка: "Вертикальная",
    Элементы: {
      ПолеВвода1: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Объект.ПолеВвода1",
      },
    },
  },
}
```

Convert command bar YAML to:

```ts
КоманднаяПанель: {
  Элементы: {
    ФормаКоманда1: {
      Вид: "КнопкаКоманднойПанели",
      ИмяКоманды: "Form.Command.Команда1",
    },
  },
}
```

- [ ] **Step 7: Run client form YAML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/forms/commonObjects/childItems packages/core/metadata/forms/elements
git commit -m "feat: :sparkles: сделать Форма.yaml полным источником формы"
```

---

### Task 4: Switch Form XML Import/Sync To YAML Only

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Modify fixtures under `packages/core/metadata/forms/clientApplicationForm/__fixtures__/sync/nkdk`

- [ ] **Step 1: Update sync/convert tests to assert no NKDK file**

In `convertFromXML.test.ts`, replace the first test body with:

```ts
await convertFormFromXML({
  context: mockContextFromXML(),
  inputDir,
  formName,
  outputDir,
})

const expectedYaml = readXMLFixtureAsString(import.meta.url, join("sync/nkdk/Формы", formName, "Форма.yaml"))
const formOutputPath = join(outputDir, "Формы", formName)
const resultYaml = fs.readFileSync(join(formOutputPath, "Форма.yaml"), "utf-8")

expect(fs.existsSync(join(formOutputPath, "Форма.nkdk"))).toBe(false)
expect(resultYaml).toBe(expectedYaml)
```

In `syncToXML.test.ts`, rename the test to:

```ts
it("should read form from YAML and export to XML files in output dir", async () => {
```

Keep XML assertions unchanged.

- [ ] **Step 2: Run focused tests and verify failures**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: FAIL because `convertFormFromXML` still writes `Форма.nkdk` and `syncFormToXML` still reads it.

- [ ] **Step 3: Modify `syncToXML.ts`**

Remove imports:

```ts
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { importClientApplicationFromFromNKDK } from "./fromNKDK"
```

Change form reading to:

```ts
const { yamlContent, formDir } = await readFormFiles({ inputDir, formName })
const yamlObj = importFromYAML<ClientApplicationFormYAML>(yamlContent)
const contextWithFormDir = createFormScopedContext({ context, formDir })
const form = importClientApplicationFormFromYAML(contextWithFormDir, yamlObj)
```

Change `readFormFiles` to:

```ts
async function readFormFiles(params: { inputDir: string; formName: string }): Promise<{
  yamlContent: string
  formDir: string
}> {
  const { inputDir, formName } = params
  const formsDir = join(inputDir, "Формы")
  const formDir = join(formsDir, formName)
  const yamlPath = join(formDir, "Форма.yaml")
  const yamlContent = await fs.promises.readFile(yamlPath, "utf-8")

  return { yamlContent, formDir }
}
```

Delete `parseHelperCached`, `getNkdKParse`, and `parseFormFromNkdKString`.

- [ ] **Step 4: Modify `convertFromXML.ts`**

Remove:

```ts
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
```

Change `ReadFormFromXMLResult`:

```ts
export type ReadFormFromXMLResult = {
  yaml: string | undefined
  externalFiles: ExternalFileEntry[]
}
```

Change `convertFormToYAMLAndNKDK` to `convertFormToYAML`:

```ts
const convertFormToYAML = async (params: {
  context: ConfigurationContext
  form: ClientApplicationForm
}): Promise<ReadFormFromXMLResult> => {
  const { context, form } = params

  const { yaml: yamlObj, externalFiles } = exportClientApplicationFormToYAML(context, form)
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  return { yaml, externalFiles }
}
```

Change writer params and body:

```ts
const { yaml, externalFiles } = await convertFormToYAML({ context, form })
await writeFormToYAML({ context, formYAML: yaml, externalFiles, formName, outputDir })
```

```ts
const writeFormToYAML = async (params: {
  context: ConfigurationContext
  formYAML: string | undefined
  externalFiles: ExternalFileEntry[]
  formName: string
  outputDir: string
}): Promise<void> => {
  const { formYAML, externalFiles, formName, outputDir } = params

  const formOutputPath = join(outputDir, "Формы", formName)
  await fs.promises.mkdir(formOutputPath, { recursive: true })

  if (formYAML) {
    const yamlFilePath = join(formOutputPath, "Форма.yaml")
    await fs.promises.writeFile(yamlFilePath, formYAML, "utf-8")
  }

  for (const { relativePath, content } of externalFiles) {
    const filePath = join(formOutputPath, relativePath)
    await fs.promises.mkdir(join(filePath, ".."), { recursive: true })
    await fs.promises.writeFile(filePath, content, "utf-8")
  }
}
```

- [ ] **Step 5: Regenerate form YAML fixtures**

Run the focused conversion test once to produce output in `packages/core/metadata/forms/clientApplicationForm/__fixtures__/sync/out`. Copy only `Форма.yaml` from output into `sync/nkdk/Формы/<formName>/Форма.yaml`; do not modify XML fixtures.

Use shell copy commands, not manual editing, for generated YAML:

```bash
cp packages/core/metadata/forms/clientApplicationForm/__fixtures__/sync/out/Формы/ФормаЭлемента/Форма.yaml packages/core/metadata/forms/clientApplicationForm/__fixtures__/sync/nkdk/Формы/ФормаЭлемента/Форма.yaml
```

Repeat for `withDynamicList` if its expected YAML fixture is asserted.

- [ ] **Step 6: Run focused form sync tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add packages/core/metadata/forms/clientApplicationForm
git commit -m "feat: :sparkles: синхронизировать формы без NKDK"
```

---

### Task 5: Remove Paired Form Files From Graph And CLI

**Files:**
- Modify: `packages/core/metadata/graphImport/projectFiles.ts`
- Modify: `packages/core/metadata/graphImport/projectFiles.test.ts`
- Modify: `packages/core/metadata/graphImport/registerFormGraphImport.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/types.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`
- Modify: `packages/core/metadata/orchestration/graphImport/registry.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`
- Modify: `packages/cli/src/graph/projectFiles.ts`
- Modify: `packages/cli/src/graph/projectFiles.test.ts`
- Modify: `packages/cli/src/graph/projectSources.ts`
- Modify: `packages/cli/src/graph/projectSources.test.ts`
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Modify: `packages/cli/src/commands/updateGraph.test.ts`
- Modify: `packages/cli/src/commands/watch.ts`
- Modify: `packages/cli/src/commands/watch.test.ts`

- [ ] **Step 1: Update graph project file tests first**

In `packages/core/metadata/graphImport/projectFiles.test.ts`, change expectations:

```ts
expect(discoverProjectGraphFiles(root)).toEqual([
  "Обработка/ЗагрузкаДанных/Свойства.yaml",
  "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
])

expect(isSupportedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBe(true)
expect(isSupportedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")).toBe(false)
expect(pairedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBeUndefined()
```

Keep the exported `pairedProjectGraphFile` test until the function is removed in Step 3; after Step 3 delete that import and assertion.

- [ ] **Step 2: Run graph project file tests and verify failures**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/graphImport/projectFiles.test.ts
```

Expected: FAIL because discovery still includes `Форма.nkdk`.

- [ ] **Step 3: Remove paired project file support in core**

Modify `packages/core/metadata/graphImport/projectFiles.ts`:

- delete `pairedProjectGraphFile`;
- in `discoverChildProjectGraphFiles`, replace the inner file loop with:

```ts
const fullPath = join(formsRoot, entry.name, "Форма.yaml")
if (existsSync(fullPath)) {
  files.push(ownerFile(owner, `${rule.folderName}/${entry.name}/Форма.yaml`))
}
```

- in `isExactChildFormFilePath`, require only `parts[2] === "Форма.yaml"`.

Update core tests to remove imports/assertions for `pairedProjectGraphFile`.

- [ ] **Step 4: Remove paired source fields from graph contracts**

Modify `packages/core/metadata/orchestration/buildGraph/types.ts`:

```ts
export interface ProjectGraphSource {
  filePath: string
  text: string
  fileStats?: FileStats
}
```

Delete `PairedGraphSourceText`.

Modify `packages/core/metadata/orchestration/graphImport/registry.ts`:

```ts
export interface GraphImportSources {
  yaml: string
}
```

Modify `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`:

- delete `source.pairedText` stat handling;
- pass `sources: { yaml: source.text }`.

Modify `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`:

- remove `pairedText` from params;
- pass `sources: { yaml: text }`.

- [ ] **Step 5: Simplify form graph import**

Modify `packages/core/metadata/graphImport/registerFormGraphImport.ts`:

```ts
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
```

Change `importModel`:

```ts
importModel: ({ context, parsed }) => {
  const model = importClientApplicationFormFromYAML(context, parsed.data)
  return {
    model,
    graphModel: toGraphModel(model),
    rule: ClientApplicationFormRules,
  }
},
```

Delete `afterBuildGraph`; `Форма.yaml` now owns visual nodes directly.

- [ ] **Step 6: Simplify CLI graph file wrappers**

Modify `packages/cli/src/graph/projectFiles.ts`:

- remove import/export of `pairedProjectGraphFile`;
- delete `pairedFormPath`.

Modify `packages/cli/src/graph/projectSources.ts`:

```ts
const readSource = (projectPath: string, filePath: string): ProjectGraphSource => {
  const fullPath = absoluteProjectFile(projectPath, filePath)
  return {
    filePath,
    text: readFileSync(fullPath, "utf-8"),
    fileStats: readFileStats(fullPath),
  }
}

const deletedPathsFor = (filePath: string): string[] => [filePath]
```

In `readChangedProjectSources`, remove normalization from `Форма.nkdk` to `Форма.yaml`. Unsupported `.nkdk` files should not become sources or deleted paths.

- [ ] **Step 7: Simplify updateGraph/watch**

Modify `packages/cli/src/commands/watch.ts`:

```ts
const WATCH_PATTERNS = [
  "**/Свойства.yaml",
  "**/Форма.yaml",
]

const PROJECT_FILE_ORDER = ["Свойства.yaml", "Форма.yaml"] as const
```

Modify `packages/cli/src/commands/updateGraph.ts` to remove code that creates graph tombstones for `source.pairedText`.

- [ ] **Step 8: Update graph/CLI tests**

Update tests to assert `.nkdk` is ignored:

```ts
expect(isSupportedProjectFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")).toBe(false)
```

Update changed source tests:

```ts
const result = readChangedProjectSources(projectPath, [nkdkPath])
expect(result).toEqual({ sources: [], deletedFilePaths: [] })
```

Update watch tests to remove `.nkdk` events and assertions.

- [ ] **Step 9: Run graph and CLI tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/graphImport/projectFiles.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
pnpm --filter @nakidka/cli test -- src/graph/projectFiles.test.ts src/graph/projectSources.test.ts src/commands/updateGraph.test.ts src/commands/watch.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 5**

```bash
git add packages/core/metadata/graphImport packages/core/metadata/orchestration/buildGraph packages/core/metadata/orchestration/graphImport packages/cli/src
git commit -m "refactor: :recycle: убрать paired-файлы форм из графа"
```

---

### Task 6: Delete NKDK Language And Form NKDK Modules

**Files:**
- Delete: `packages/language/**`
- Delete: NKDK-specific form modules and tests listed in File Structure
- Modify: `packages/core/package.json`
- Modify: `packages/extension/package.json`
- Modify: `packages/core/tsconfig.json`
- Modify: `packages/cli/tsconfig.json`
- Modify: `packages/extension/tsconfig.json`
- Modify: `packages/core/vitest.config.ts`
- Modify: `packages/cli/vitest.config.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Verify no remaining runtime imports should survive**

Run:

```bash
rg -n "nkdk-language|fromNKDK|toNKDK|parseNKDK|Форма\\.nkdk" packages/core packages/cli packages/extension package.json -S
```

Expected before deletion: many matches. Use this list as the deletion checklist.

- [ ] **Step 2: Delete NKDK package and modules**

Use non-interactive deletion:

```bash
rm -rf packages/language
find packages/core/metadata/forms -name 'fromNKDK.ts' -delete
find packages/core/metadata/forms -name 'toNKDK.ts' -delete
find packages/core/metadata/forms -name '*fromNKDK.test.ts' -delete
find packages/core/metadata/forms -name '*toNKDK.test.ts' -delete
rm -rf packages/core/metadata/orchestration/formElement/fromNKDK
rm -rf packages/core/metadata/orchestration/formElement/toNKDK
rm -f packages/core/metadata/forms/clientApplicationForm/parseNKDK.ts
rm -f packages/core/metadata/forms/clientApplicationForm/fromNKDK.ts
rm -f packages/core/metadata/forms/clientApplicationForm/toNKDK.ts
rm -f packages/core/metadata/forms/commonObjects/childItems/fromNKDK.ts
rm -f packages/core/metadata/forms/commonObjects/childItems/toNKDK.ts
rm -f packages/core/tests/fromNKDK.ts
```

- [ ] **Step 3: Remove workspace and dependency references**

Do not edit `pnpm-workspace.yaml`: it currently includes `packages/*`, so deleting `packages/language` removes the package from the workspace.

Modify `packages/core/package.json`:

- remove devDependency `"nkdk-language": "workspace:*"`;
- remove devDependency `"langium": "~4.2.0"` if no core file imports `langium`.

Modify `packages/extension/package.json`:

- remove dependency `"nkdk-language": "workspace:*"`;
- remove dependency `"langium": "~4.2.0"` if extension no longer imports Langium;
- change build script from:

```json
"build": "pnpm --filter nkdk-language run build && tsc -b tsconfig.json && node esbuild.mjs && pnpm run copy-l10n"
```

to:

```json
"build": "tsc -b tsconfig.json && node esbuild.mjs && pnpm run copy-l10n"
```

Modify `packages/core/tsconfig.json` and `packages/cli/tsconfig.json` to remove `"nkdk-language": ["../language/src/index.ts"]`.

Modify `packages/extension/tsconfig.json`:

- remove the reference to `../language/tsconfig.src.json`.

Modify `packages/core/vitest.config.ts` and `packages/cli/vitest.config.ts` to remove aliases for `nkdk-language`.

Run:

```bash
pnpm install
```

Expected: lockfile updates and no workspace resolution error for `nkdk-language`.

- [ ] **Step 4: Remove extension NKDK language contribution**

Modify `packages/extension/package.json`:

- remove the `languages` entry with `"id": "nkdk"`;
- remove the grammar entry with `"language": "nkdk"`;
- keep the YAML language contribution.

Delete or stop packaging NKDK syntax files under `packages/extension/syntaxes/` if they exist.

Modify extension code:

- `packages/extension/src/language/main.ts`
- `packages/extension/src/documentCache.ts`

Remove `createNkdkServices` usage. If these files only support NKDK language features, delete them and remove imports from the extension entrypoint. If YAML language server still imports `documentCache.ts`, keep only YAML-related code.

- [ ] **Step 5: Remove orchestration exports**

Modify `packages/core/metadata/orchestration/index.ts` and remove:

```ts
export * from "./formElement/fromNKDK/fromNKDK"
export * from "./formElement/toNKDK/types"
```

Run:

```bash
rg -n "fromNKDK|toNKDK|nkdk-language|parseNKDK" packages package.json -S
```

Expected: no matches in active source files. Historical docs under `docs/superpowers/` may still mention NKDK; do not rewrite old specs/plans.

- [ ] **Step 6: Run type checks and package tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/cli exec tsc --noEmit
pnpm --filter nkdk exec tsc --noEmit
pnpm --filter @nakidka/core test
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 7: Commit Task 6**

```bash
git add pnpm-lock.yaml packages
git commit -m "refactor: :recycle: удалить NKDK-язык"
```

---

### Task 7: Update Documentation And Project Instructions

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/architecture-orchestration.md`
- Modify: `docs/superpowers/specs/2026-05-20-unified-form-yaml-design.md` only if implementation revealed a concrete correction
- Optional: `README.md` if it lists `.nkdk`

- [ ] **Step 1: Update `AGENTS.md` test instructions**

Remove:

```md
- в свежем worktree перед `pnpm test` нужно сгенерировать Langium-файлы командой `pnpm --filter nkdk-language langium:generate`
```

Keep:

```md
- весь проект тестируется командой `pnpm test` из корня - она рекурсивно запускает тесты во всех пакетах `packages/*`
```

- [ ] **Step 2: Update orchestration architecture**

Modify `.agents/architecture-orchestration.md`.

Replace the form graph paragraph that says:

```md
Для форм `Форма.yaml` является обязательным владельцем корня `ClientApplicationForm` и YAML-частей формы. `Форма.nkdk` владеет визуальными элементами формы и contributes в корневой узел формы.
```

with:

```md
Для форм `Форма.yaml` является единственным владельцем корня `ClientApplicationForm`, свойств формы, визуальных элементов, командных панелей и связей формы. Парных `.nkdk`-файлов нет: изменение `Форма.yaml` пересобирает весь сегмент формы, удаление `Форма.yaml` удаляет форму и все объявленные ею узлы.
```

Also update the `ChildFormNames` section so it says form sync scans form directories containing `Форма.yaml`; it must not require `Форма.nkdk`.

- [ ] **Step 3: Search active docs for current instructions**

Run:

```bash
rg -n "nkdk-language|Форма\\.nkdk|Langium|\\.nkdk" AGENTS.md README.md .agents packages -S
```

Update active instructions and README references. Do not edit old dated specs/plans under `docs/superpowers/` unless they are directly linked from current instructions.

- [ ] **Step 4: Commit Task 7**

```bash
git add AGENTS.md .agents README.md docs/superpowers/specs/2026-05-20-unified-form-yaml-design.md
git commit -m "docs: :memo: обновить инструкции после удаления NKDK"
```

If `README.md` or the spec did not change, omit them from `git add`.

---

### Task 8: Final Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run active source search**

Run:

```bash
rg -n "nkdk-language|fromNKDK|toNKDK|parseNKDK|Форма\\.nkdk" packages package.json AGENTS.md .agents -S
```

Expected: no matches in active source, package config, or active instructions. If matches remain in source/config, fix them before proceeding. If only old dated docs under `docs/superpowers/` mention NKDK, leave them.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Run full type check**

Run:

```bash
pnpm run type-check
```

Expected: PASS.

- [ ] **Step 4: Run git status and inspect deletions**

Run:

```bash
git status --short
git diff --stat HEAD
```

Expected: worktree clean if every task committed. If uncommitted changes remain, inspect them and commit with the task they belong to.

- [ ] **Step 5: Final implementation summary**

Prepare a short summary with:

- commits created;
- tests run and results;
- confirmation that `Форма.nkdk` and `packages/language` are gone from active code;
- any intentionally retained historical mentions in dated docs.
