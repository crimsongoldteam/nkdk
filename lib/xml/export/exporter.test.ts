import { expect, it } from "vitest"
import xmlExport from "./exporter"

const mockForm = {
  items: [{ name: "ПолноеНаименование", id: "16" }],
}
const mockResult = {
  Form: {
    ChildItems: [
      {
        InputField: { name: "ПолноеНаименование", id: "16" },
      },
    ],
  },
}

it("should export form to XML", () => {
  const xml = xmlExport(mockForm)

  expect(xml).toEqual(mockResult)
})
