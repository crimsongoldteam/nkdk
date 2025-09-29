import { expect, it } from "vitest"
import importInputFieldFromXML from "./importFromXML"
import { ZClientApplicationFormXML } from "./types"

it("should import title from XML", () => {
  const mockXml = ZClientApplicationFormXML.parse({
    Title: {
      item: [{ lang: "ru", content: "Поле" }],
    },
  })

  const input = importInputFieldFromXML(mockXml)

  expect(input.title).toEqual({ ru: "Поле" })
})
