import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { parseElement } from "../../commonObjects/childItems/parser/elementsParser/parse"
import { tokenize } from "../../commonObjects/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../commonObjects/childItems/parser/treeParser/treeParser"

describe("importUsualGroupFromStructure", () => {
  it.each(usualGroupStructureFixtures)("should import $name from structure", ({ element, structured }) => {
    const tokens = tokenize(structured)
    const treeNodes = parseTree(mockContext, tokens)
    const result = parseElement(mockContext, treeNodes[0])

    expect(result).toEqual(element)
  })
})
