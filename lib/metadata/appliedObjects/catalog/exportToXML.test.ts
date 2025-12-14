import typia from "typia"
import { describe, expect, it } from "vitest"
import { CatalogEnterprise } from "./types"

describe("exportCatalogToXML", () => {
  it("should export catalog to XML", () => {
    const result = typia.json.schemas<CatalogEnterprise[]>()

    expect(result).toBeDefined()
  })
})
