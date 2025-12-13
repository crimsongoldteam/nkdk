import { describe, expect, it } from "vitest"
import { ClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { createNameIdMapping, updateNameIdMapping } from "./nameIdMapping"

describe("nameMapping", () => {
  describe("createNameIdMapping", () => {
    it("should create empty mapping for empty form", () => {
      const form: ClientApplicationForm = {
        elementType: FormElementType.ClientApplicationForm,
        childItems: [],
      }

      const mapping = createNameIdMapping(form)

      expect(mapping.size).toBe(0)
    })

    it("should create mapping for elements with id", () => {
      const form: ClientApplicationForm = {
        elementType: FormElementType.ClientApplicationForm,
        childItems: [
          {
            name: "field1",
            id: "1",
            elementType: FormElementType.InputField,
          },
          {
            name: "field2",
            id: "2",
            elementType: FormElementType.InputField,
          },
        ],
      }

      const mapping = createNameIdMapping(form)

      expect(mapping.size).toBe(2)
      expect(mapping.get("1")).toBe("field1")
      expect(mapping.get("2")).toBe("field2")
    })
  })

  describe("updateNameIdMapping", () => {
    it("should update existing elements with id", () => {
      const mapping = new Map([
        ["1", "field1"],
        ["2", "field2"],
      ])

      const form: ClientApplicationForm = {
        elementType: FormElementType.ClientApplicationForm,
        childItems: [
          {
            name: "field2",
            id: "2",
            elementType: FormElementType.InputField,
          },
          {
            name: "field1",
            id: "1",
            elementType: FormElementType.InputField,
          },
        ],
      }

      updateNameIdMapping(mapping, form)

      expect(form.childItems[0].id).toBe("2")
      expect(form.childItems[1].id).toBe("1")
    })

    it("should assign next available id", () => {
      const mapping = new Map([["1", "field1"]])
      const form: ClientApplicationForm = {
        elementType: FormElementType.ClientApplicationForm,
        childItems: [
          {
            name: "field1",
            id: "1",
            elementType: FormElementType.InputField,
          },
          {
            name: "field2",
            id: "2",
            elementType: FormElementType.InputField,
          },
        ],
      }

      updateNameIdMapping(mapping, form)

      expect(form.childItems[1].id).toBe("2")
      expect(mapping.get("2")).toBe("field2")
    })
  })
})
