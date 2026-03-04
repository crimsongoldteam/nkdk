import { describe, expect, it } from "vitest"

import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("import other field from structure", () => {
  it("should import other element from structure", async () => {
    const result = await testImportElementFromNKDK(mockContext, "?ПолеПереключателя %ИмяПоля")

    expect(result).toEqual({
      itemType: CollectionFormElementType.RadioButtonField,
      name: "ИмяПоля",
    })
  })
})
