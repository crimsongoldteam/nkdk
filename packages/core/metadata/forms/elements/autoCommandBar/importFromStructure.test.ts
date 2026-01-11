import { describe, expect, it } from "vitest"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { parseElement } from "../../collections/childItems/parser/elementsParser/parse"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importAutoCommandBarFromStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should import auto command bar $name from structure",
    ({ element: input, structured: expected }) => {
      const tokens = tokenize(expected.strings[0])
      const nodes = parseTree(mockСontext, tokens)
      const result = parseElement(mockСontext, nodes[0])
      expect(result).toEqual(input)
    }
  )
})
