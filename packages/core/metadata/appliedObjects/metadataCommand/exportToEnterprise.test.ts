import { describe, expect, it } from "vitest"
import {
  fullMetadataCommands,
  fullMetadataCommandsEnterprise,
  minimalMetadataCommands,
} from "~/tests/fixtures/metadataCommand/data"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataCommandsToEnterprise } from "./exportToEnterprise"

describe("exportMetadataCommandToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCommandsToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCommandsToEnterprise(mockСontext, fullMetadataCommands)

    expect(result).toEqual(fullMetadataCommandsEnterprise)
  })

  it("should export minimal", () => {
    const result = exportMetadataCommandsToEnterprise(mockСontext, minimalMetadataCommands)

    expect(result).toEqual({
      Глоссарий: {
        Группа: "ПанельНавигацииОбычное",
      },
    })
  })
})
