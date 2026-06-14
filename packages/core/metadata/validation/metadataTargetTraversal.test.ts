import { describe, expect, it } from "vitest"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { validateMetadataTargetsInModel } from "./metadataTargetTraversal"

describe("validateMetadataTargetsInModel", () => {
  it("calls registered validation handler for properties with metadataTarget", () => {
    const calls: unknown[] = []
    const testType = "__MetadataTargetTraversalUnit" as never

    registerTypeRule(testType, "validateMetadataTarget", (params) => {
      calls.push(params.value)
      return []
    })

    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        inputByString: {
          type: testType,
          yaml: "ВводПоСтроке",
          metadataTarget: { kind: "object", roots: ["Catalog"] },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Свойства.yaml",
      parsed: { doc: { contents: undefined }, lineCounter: { linePos: () => ({ line: 1, col: 1 }) } } as never,
      model: { itemType: "MetadataCatalog", inputByString: "Catalog.Контрагенты" } as never,
      rule,
      resolver: {} as never,
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual(["Catalog.Контрагенты"])
  })
})
