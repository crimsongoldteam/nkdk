import { expect, it } from "vitest"
import { ZClientApplicationFormXML } from "./types"
import importClientApplicationFormFromXML from "./importFromXML"

it("should import title from XML", () => {
  const mockXml = ZClientApplicationFormXML.parse({
    Title: {
      item: [{ lang: "ru", content: "Поле" }],
    },
    ChildItems: [],
  })

  const input = importClientApplicationFormFromXML(mockXml)

  expect(input.title).toEqual({ ru: "Поле" })
})

it("should import items from XML", () => {
  const mockXml = ZClientApplicationFormXML.parse({
    ChildItems: [
      {
        _name: "ПолеВвода",
      },
    ],
  })

  const form = importClientApplicationFormFromXML(mockXml)

  expect(form.items).toEqual([{ name: "ПолеВвода" }])
})
