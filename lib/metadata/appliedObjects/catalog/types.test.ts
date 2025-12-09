import { expect, it } from "vitest"
import { Catalog } from "./types"
import typia from "typia"

it("should validate catalog case insensitive", () => {
  const catalog = {
    Name: "123",
    codelength: 12,
  }

  const result = typia.assertEquals<Catalog>(catalog)

  expect(result).toEqual(catalog)
})
