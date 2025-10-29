import { describe, it, expect } from "vitest"
import { createNameIdMapping, updateNameIdMapping } from "./nameIdMapping"
import { TClientApplicationForm } from "~/lib/metadata/forms/elements/сlientApplicationForm/types"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"

describe("nameMapping", () => {
  describe("createNameIdMapping", () => {
    it("should create empty mapping for empty form", () => {
      const form: TClientApplicationForm = {
        type: ZElementType.enum.Form,
        items: [],
      }

      const mapping = createNameIdMapping(form)

      expect(mapping.size).toBe(0)
    })

    it("should create mapping for elements with id", () => {
      const form: TClientApplicationForm = {
        type: ZElementType.enum.Form,
        items: [
          { name: "field1", id: "1", type: ZElementType.enum.InputField },
          { name: "field2", id: "2", type: ZElementType.enum.InputField },
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

      const form: TClientApplicationForm = {
        type: ZElementType.enum.Form,
        items: [
          { name: "field2", id: "2", type: ZElementType.enum.InputField },
          { name: "field1", id: "1", type: ZElementType.enum.InputField },
        ],
      }

      updateNameIdMapping(mapping, form)

      expect(form.items[0].id).toBe("2")
      expect(form.items[1].id).toBe("1")
    })

    it("should assign next available id", () => {
      const mapping = new Map([["1", "field1"]])
      const form: TClientApplicationForm = {
        type: ZElementType.enum.Form,
        items: [
          { name: "field1", id: "1", type: ZElementType.enum.InputField },
          { name: "field2", id: "2", type: ZElementType.enum.InputField },
        ],
      }

      updateNameIdMapping(mapping, form)

      expect(form.items[1].id).toBe("2")
      expect(mapping.get("2")).toBe("field2")
    })
  })
})
