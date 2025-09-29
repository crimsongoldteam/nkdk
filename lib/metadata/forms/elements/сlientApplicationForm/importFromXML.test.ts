import { expect, it } from "vitest"
import { ZClientApplicationFormXML } from "./types"
import importClientApplicationFormFromXML from "./importFromXML"

it("should import title from XML", () => {
  const mockXml = ZClientApplicationFormXML.parse({
    Title: {
      item: [{ lang: "ru", content: "Поле" }],
    },
  })

  const input = importClientApplicationFormFromXML(mockXml)

  expect(input.title).toEqual({ ru: "Поле" })
})
