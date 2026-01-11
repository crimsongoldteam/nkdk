import { describe, expect, it } from "vitest"
import { parseAutoCommandBar } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { ParseElementType } from "../../collections/childItems/parser/treeParser/types"

describe("importAutoCommandBarFromStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should import auto command bar $name from structure",
    ({ element: input, structured: expected }) => {
      const tokens = tokenize(expected.strings[0])
      const result = parseAutoCommandBar(mockСontext, {
        tokens,
        type: ParseElementType.AutoCommandBar,
        childItems: [],
      })
      expect(result).toEqual(input)
    }
  )
})
