import { describe, expect, it } from "vitest"
import {
  fullMetadataCommands,
  fullMetadataCommandsEnterprise,
  minimalMetadataCommands,
} from "~/tests/fixtures/metadataCommand/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataCommandsToEnterprise } from "./exportToEnterprise"

describe("exportMetadataCommandToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCommandsToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCommandsToEnterprise(mockContext, mockRule, fullMetadataCommands)

    expect(result).toEqual(fullMetadataCommandsEnterprise)
  })

  it("should export minimal", () => {
    const result = exportMetadataCommandsToEnterprise(mockContext, mockRule, minimalMetadataCommands)

    expect(result).toEqual({
      Глоссарий: {
        Группа: "ПанельНавигацииОбычное",
      },
    })
  })
})
