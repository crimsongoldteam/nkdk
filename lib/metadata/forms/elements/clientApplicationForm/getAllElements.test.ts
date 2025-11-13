import { describe, expect, it } from "vitest"
import { ZElementType } from "../types"
import { TClientApplicationForm } from "./types"
import { getAllElements } from "./getAllElements"

describe("getAllElements", () => {
  it("should return all elements", () => {
    const form: TClientApplicationForm = {
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [
        {
          name: "Группа",
          id: "1",
          elementType: ZElementType.enum.UsualGroup,
          childItems: [
            {
              name: "ПолеВвода",
              id: "2",
              elementType: ZElementType.enum.InputField,
            },
          ],
        },
      ],
    }

    const elements = getAllElements(form)

    expect(elements).toHaveLength(2)
    expect(elements[0]).toMatchObject({
      name: "Группа",
      id: "1",
    })
    expect(elements[1]).toMatchObject({
      name: "ПолеВвода",
      id: "2",
    })
  })
})
