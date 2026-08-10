import { describe, expect, it } from "vitest"
import { fullInputField } from "../elements/inputField/__fixtures__/data"
import { mockContextToEnterprise } from "../../../tests/mockContext"
import { exportClientApplicationFormToEnterprise } from "./toEnterprise"
import { ClientApplicationForm } from "./types"

describe("exportClientApplicationFormToEnterprise", () => {
  it("should export ClientApplicationForm to ClientApplicationFormEnterprise", () => {
    const form: ClientApplicationForm = {
      childItems: [fullInputField],
      commands: [],
      itemType: "ClientApplicationForm",
    }

    const preview = exportClientApplicationFormToEnterprise(mockContextToEnterprise, form)

    expect(preview.prefix).toBe("prefix_")
    expect(preview.attributes.map((attribute) => attribute.Name)).toEqual([
      "prefix_Реквизит",
      "prefix_РеквизитРеквизитТаблицы",
      "prefix_РеквизитПодвала",
    ])
    expect(preview.childItems).toHaveLength(1)
    expect(preview.childItems[0]).toMatchObject({
      Name: "prefix_ПолеВвода",
      DataPath: "prefix_Реквизит",
    })
  })
})
