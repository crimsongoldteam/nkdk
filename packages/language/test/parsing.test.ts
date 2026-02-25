import { EmptyFileSystem, type LangiumDocument } from "langium"
import { parseHelper } from "langium/test"
import type { Form } from "nkdk-language"
import { createNkdkServices } from "nkdk-language"
import { beforeAll, describe, expect, it } from "vitest"
import { parsingFixtures } from "./parsing.fixtures"

let services: ReturnType<typeof createNkdkServices>
let parse: ReturnType<typeof parseHelper<Form>>
let document: LangiumDocument<Form> | undefined

const excludedKeys = ["$container", "$cstNode", "$containerProperty", "$containerIndex"]

beforeAll(async () => {
  services = createNkdkServices(EmptyFileSystem)
  parse = parseHelper<Form>(services.Nkdk)

  // activate the following if your linking test requires elements from a built-in library, for example
  // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
})

describe("Parsing nkdk language", () => {
  it.each(parsingFixtures)("parse $name", async ({ input, expected }) => {
    document = await parse(input)

    const parseResult = document.parseResult

    expect(parseResult.parserErrors).toHaveLength(0)

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

// %РеквизитФормы
// %%РеквизитОбъекта

// %Реквизит.Формы
// %%Реквизит.Объекта

// %ДругоеИмя(Реквизит.Формы)
// %%ДругоеИмя(Реквизит.Объекта)
