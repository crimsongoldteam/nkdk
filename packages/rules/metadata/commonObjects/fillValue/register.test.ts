import { describe,expect,it } from "vitest"

import { ordinaryFillValueItemTypes } from "./ordinaryItemTypes"

describe("регистрация FillValue обычных полей", () => {

  it("не включает StandardAttributeDescription в обычные поля", () => {
    expect(ordinaryFillValueItemTypes).not.toContain("StandardAttributeDescription")
  })
})
