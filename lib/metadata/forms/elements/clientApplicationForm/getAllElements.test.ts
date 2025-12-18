import { describe, expect, it } from "vitest"
import { FormElementType } from "../../../metadataFactory/types"
import { getAllElements } from "./getAllElements"
import { ClientApplicationForm } from "./types"

describe("getAllElements", () => {
  it("should return all elements", () => {
    const form: ClientApplicationForm = {
      elementType: FormElementType.ClientApplicationForm,
      childItems: [
        {
          name: "Группа",
          id: "1",
          elementType: FormElementType.UsualGroup,
          childItems: [
            {
              name: "ПолеВвода",
              id: "2",
              elementType: FormElementType.InputField,
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
