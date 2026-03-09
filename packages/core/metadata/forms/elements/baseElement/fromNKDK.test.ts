import { describe, expect, it } from "vitest"

import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("import other field from structure", () => {
  it("should import other element from structure", async () => {
    const result = await testimportElementFromNKDK(mockContext, "?ПолеПереключателя %ИмяПоля")

    expect(result).toEqual({
      itemType: "RadioButtonField",
      name: "ИмяПоля",
    })
  })
})
