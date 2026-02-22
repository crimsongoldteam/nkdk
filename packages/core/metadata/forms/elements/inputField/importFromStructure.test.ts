import { EmptyFileSystem, type LangiumDocument } from "langium"
import { clearDocuments, parseHelper } from "langium/test"
import type { Model } from "nkdk-language"
import { createNkdkServices } from "nkdk-language"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import {
  inputFieldStructureFixturesTable,
  type InputFieldStructureFixture,
} from "~/tests/fixtures/forms/inputField/data.ts"

let services: ReturnType<typeof createNkdkServices>
let parse: ReturnType<typeof parseHelper<Model>> // for potential document parsing in tests
let document: LangiumDocument<Model> | undefined

describe("importInputFieldFromStructure", () => {
  beforeAll(async () => {
    services = createNkdkServices(EmptyFileSystem)
    parse = parseHelper<Model>(services.Nkdk)
  })

  afterEach(async () => {
    document && clearDocuments(services.shared, [document])
  })

  it.each(inputFieldStructureFixturesTable)("should import input field $name", (async (
    row: InputFieldStructureFixture
  ) => {
    const { element: input, structured } = row
    const result = await parse(structured.strings.join("\n"))

    expect(result?.parseResult.value).toEqual(input)
  }) as (...args: unknown[]) => Promise<void>)
})

// const importInputFieldFromStructure = (mockContext: ConfigurationContext, mock: string[]) => {
//   const tokens = tokenize(mock[0])

//   const treeNodes = parseTree(mockContext, tokens)

//   return parseElement(mockContext, treeNodes[0])
// }
