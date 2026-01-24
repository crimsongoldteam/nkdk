import { describe, expect, it } from "vitest"
import { fullFieldsList, fullFieldsListEnterprise } from "~/tests/fixtures/fieldsList/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFieldsListToEnterprise } from "./exportToEnterprise"

describe("exportFieldsListToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFieldsListToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFieldsListToEnterprise(mockСontext, fullFieldsList)

    expect(result).toEqual(fullFieldsListEnterprise)
  })
})
