import { expect, it } from "vitest"
import { parseXmlDocumentWithSaxes, parseXmlWithSaxes } from "./saxesParser"

it("оставляет прежнее объектное представление доступным без структурных полей", () => {
  const xml = '<Root b="2" a="1"><Value/><Value>2</Value><Future x="y"/></Root>'
  const document = parseXmlDocumentWithSaxes(xml)
  const compatibility = parseXmlWithSaxes(xml)

  expect(compatibility).toEqual(document.compatibility)
  expect(compatibility).toEqual({
    Root: {
      Value: [undefined, "2"],
      Future: { _x: "y" },
      _b: "2",
      _a: "1",
    },
  })
  expect(compatibility).not.toHaveProperty("roots")
  expect(compatibility).not.toHaveProperty("sourceLength")
})
