import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/metadataTargets/validationHandlers"
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

  it("validates string member targets with current owner context", () => {
    const calls: unknown[] = []
    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        formRef: {
          type: "string",
          yaml: "ФормаСсылки",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: { doc: { contents: undefined }, lineCounter: { linePos: () => ({ line: 1, col: 1 }) } } as never,
      model: { itemType: "MetadataDocument", formRef: "Document.АвансовыйОтчет.Form.ФормаДокумента" } as never,
      rule,
      resolver: {
        resolveMember(params: unknown) {
          calls.push(params)
          return { ok: true }
        },
      } as never,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual([
      expect.objectContaining({
        target: expect.objectContaining({
          kind: "member",
          root: "Document",
          objectName: "АвансовыйОтчет",
          segments: [{ kind: "Form", name: "ФормаДокумента" }],
        }),
      }),
    ])
  })
})
