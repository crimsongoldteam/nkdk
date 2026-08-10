import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../property/types"
import {
  finalizeMetadataItemImportedYaml,
  registerMetadataItemImportedYamlFinalizer,
  requiresMetadataItemImportedYamlFinalization,
} from "./importedYamlFinalizerRegistry"

const rule = {
  itemType: "ImportedYamlFinalizerRegistryTest",
  properties: {},
} satisfies MetadataItemRule

describe("metadata item imported YAML finalizer registry", () => {
  it("требует второй проход и применяет обработчик типа metadata-item", () => {
    registerMetadataItemImportedYamlFinalizer(rule.itemType, {
      requiresFinalization: () => true,
      finalize: ({ yaml }) => {
        ;(yaml as Record<string, unknown>)["Уточнено"] = true
      },
    })
    const yaml: Record<string, unknown> = {}

    expect(requiresMetadataItemImportedYamlFinalization({ yaml, rule })).toBe(true)

    finalizeMetadataItemImportedYaml({
      yaml,
      rule,
      ownerMetadataCache: {} as never,
    })

    expect(yaml).toEqual({ Уточнено: true })
  })

  it("ничего не делает для незарегистрированного типа", () => {
    const otherRule = { itemType: "OtherImportedYamlFinalizerRegistryTest", properties: {} } satisfies MetadataItemRule
    const yaml: Record<string, unknown> = {}

    expect(requiresMetadataItemImportedYamlFinalization({ yaml, rule: otherRule })).toBe(false)
    finalizeMetadataItemImportedYaml({ yaml, rule: otherRule, ownerMetadataCache: {} as never })

    expect(yaml).toEqual({})
  })
})
