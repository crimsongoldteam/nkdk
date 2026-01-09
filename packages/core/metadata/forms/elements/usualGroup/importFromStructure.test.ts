import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { detectTreeNodes } from "../childItems/parser/detector/detectTree"
import { parseElement } from "../childItems/parser/elementsParser/parse"
import { parseTree } from "../childItems/parser/treeParser/parseTree"

describe("importUsualGroupFromStructure", () => {
  it.each(usualGroupStructureFixtures)("should import $name from structure", ({ element, structured }) => {
    const treeNodes = parseTree(structured)
    const detectedNodes = detectTreeNodes(treeNodes)
    const result = parseElement(mockСontext, detectedNodes[0])

    expect(result).toEqual(element)
  })
})
