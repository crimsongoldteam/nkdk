import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
// import type { Form } from "nkdk-language"
// import { createNkdkServices } from "nkdk-language"
import { describe, expect, it } from "vitest"
import { createNkdkServices, Form } from "../src"
import { parsingFixtures } from "./parsing.fixtures"

const excludedKeys = ["$container", "$cstNode", "$containerProperty", "$containerIndex"]

describe("Parsing nkdk language", async () => {
  it("parses leading auto command bar before table as table auto command bar", async () => {
    const services = createNkdkServices(EmptyFileSystem)
    const parse = parseHelper<Form>(services.Nkdk)
    const document = await parse("<<>>\n| Колонка | Список")

    expect(document.parseResult.parserErrors).toHaveLength(0)
    expect(document.parseResult.value?.autoCommandBar).toBeUndefined()
    expect(document.parseResult.value?.childItems).toHaveLength(1)
    expect(document.parseResult.value?.childItems[0]?.$type).toBe("Table")
    expect(document.parseResult.value?.childItems[0]).toMatchObject({
      autoCommandBar: { $type: "AutoCommandBar" },
    })
  })

  it("parses leading auto command bar before non-table element as form auto command bar", async () => {
    const services = createNkdkServices(EmptyFileSystem)
    const parse = parseHelper<Form>(services.Nkdk)
    const document = await parse("<<>>\nРеквизит:")

    expect(document.parseResult.parserErrors).toHaveLength(0)
    expect(document.parseResult.value?.autoCommandBar).toMatchObject({ $type: "AutoCommandBar" })
    expect(document.parseResult.value?.childItems).toHaveLength(1)
    expect(document.parseResult.value?.childItems[0]?.$type).toBe("InputField")
  })

  it.sequential.each(parsingFixtures)("parse $name $input", async ({ input, expected }) => {
    const services = createNkdkServices(EmptyFileSystem)
    const parse = parseHelper<Form>(services.Nkdk)
    const document = await parse(input)

    const parseResult = document.parseResult

    expect(parseResult.parserErrors).toHaveLength(0)

    expect(parseResult.value?.childItems).toHaveLength(1)

    const element = parseResult.value?.childItems?.[0]
    const cleanedElement = cleanElement(element)

    expect(cleanedElement).toEqual(expected)
  })
})

const cleanElement = (element: any): any => {
  if (element == null || typeof element !== "object") return element
  if (Array.isArray(element)) return element.map(cleanElement)
  const cleaned = Object.fromEntries(
    Object.entries(element)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([k, v]) => [k, cleanElement(v)])
  )
  return cleaned
}
