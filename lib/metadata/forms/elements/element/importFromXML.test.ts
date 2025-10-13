import { expect, it } from "vitest"
import { TNamedElement } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { importNamedElementFromXML } from "./importFromXML"

it("should import name from XML", () => {
  const mockXml = `<InputField name="ИмяПоля" id="16">`

  const mockResult: TNamedElement = {
    name: "ИмяПоля",
    type: ElementType.InputField,
    id: "16",
  }

  const input = importNamedElementFromXML(mockXml)

  expect(input).toEqual(mockResult)
})
