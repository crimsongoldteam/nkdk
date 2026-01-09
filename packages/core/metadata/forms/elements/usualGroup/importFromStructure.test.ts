import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { parseElement } from "../childItems/parser/elementsParser/parse"
import { tokenize } from "../childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../childItems/parser/treeParser/treeParser"

describe("importUsualGroupFromStructure", () => {
  it.each(usualGroupStructureFixtures)("should import $name from structure", ({ element, structured }) => {
    const tokens = tokenize(structured)
    const treeNodes = parseTree(mockСontext, tokens)
    const result = parseElement(mockСontext, treeNodes[0])

    expect(result).toEqual(element)
  })
})
