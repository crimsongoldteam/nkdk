import { expect, it } from "vitest"
import { Catalog } from "./types"
import typia from "typia"

it("should validate catalog type correctly", () => {
  const catalog: Catalog = {
    name: "Test Catalog",
  }

  const result = typia.assert<Catalog>(catalog)

  expect(result).toBeDefined()
})
