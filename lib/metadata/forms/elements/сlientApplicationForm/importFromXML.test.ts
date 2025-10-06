import { expect, it } from "vitest"
import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import importClientApplicationFormFromXML from "./importFromXML"

it("should import title from XML", () => {
  const mockXml: TClientApplicationFormXML = {
    Form: {
      Title: [{ "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } }],
      ChildItems: [],
    },
  }

  const mockElement: TClientApplicationForm = {
    title: { ru: "Поле" },
    items: [],
  }

  const element = importClientApplicationFormFromXML(mockXml)

  expect(element).toEqual(mockElement)
})

it("should import items from XML", () => {
  const mockXml: TClientApplicationFormXML = {
    Form: {
      ChildItems: [
        {
          InputField: {
            _name: "ПолеВвода",
            _id: "1",
          },
        },
      ],
    },
  }

  const mockElement: TClientApplicationForm = {
    items: [{ name: "ПолеВвода", id: "1" }],
  }

  const form = importClientApplicationFormFromXML(mockXml)

  expect(form).toEqual(mockElement)
})
