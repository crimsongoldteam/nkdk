import { describe, it, expect } from "vitest"
import { createNameIdMapping, updateNameIdMapping } from "./nameIdMapping"
import { ClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
import { ElementType } from "~/lib/metadata/forms/elements/types"

describe("nameMapping", () => {
  describe("createNameIdMapping", () => {
    it("should create empty mapping for empty form", () => {
      const form: ClientApplicationForm = {
        elementType: ElementType.ClientApplicationForm,
        childItems: [],
      }

      const mapping = createNameIdMapping(form)

      expect(mapping.size).toBe(0)
    })

    it("should create mapping for elements with id", () => {
      const form: ClientApplicationForm = {
        elementType: ElementType.ClientApplicationForm,
        childItems: [
          {
            name: "field1",
            id: "1",
            elementType: ElementType.InputField,
          },
          {
            name: "field2",
            id: "2",
            elementType: ElementType.InputField,
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
        elementType: ElementType.ClientApplicationForm,
        childItems: [
          {
            name: "field2",
            id: "2",
            elementType: ElementType.InputField,
          },
          {
            name: "field1",
            id: "1",
            elementType: ElementType.InputField,
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
        elementType: ElementType.ClientApplicationForm,
        childItems: [
          {
            name: "field1",
            id: "1",
            elementType: ElementType.InputField,
          },
          {
            name: "field2",
            id: "2",
            elementType: ElementType.InputField,
          },
        ],
      }

      updateNameIdMapping(mapping, form)

      expect(form.childItems[1].id).toBe("2")
      expect(mapping.get("2")).toBe("field2")
    })
  })
})
