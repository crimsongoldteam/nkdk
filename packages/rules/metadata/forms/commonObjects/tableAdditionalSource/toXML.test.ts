import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../../tests/mockContext"
import { tableAdditionalSourceRule } from "./types"
import { exportTableAdditionalSourceToXML } from "./toXML"

describe("TableAdditionalSource toXML", () => {
  it("использует подготовленное значение до вычисления по контексту родителя", () => {
    expect(exportTableAdditionalSourceToXML(
      mockContextToXML(),
      tableAdditionalSourceRule({
        additionalSourceType: "SearchStringRepresentation",
        forSingleElement: true,
      }),
      "ТабличнаяЧасть",
    )).toEqual({
      Item: "ТабличнаяЧасть",
      Type: "SearchStringRepresentation",
    })
  })
})
