import { describe, expect, it } from "vitest"
import { parseAutoCommandBar } from "~/metadata/forms/commonObjects/childItems/parser/elementsParser/parse"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { tokenize } from "../../commonObjects/childItems/parser/tokenizer/tokenizer"
import { ParseElementType } from "../../commonObjects/childItems/parser/treeParser/types"

describe("importAutoCommandBarFromStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should import auto command bar $name from structure",
    ({ element: input, structured: expected }) => {
      const tokens = tokenize(expected.strings[0])
      const result = parseAutoCommandBar(mockContext, {
        tokens,
        type: ParseElementType.AutoCommandBar,
        childItems: [],
      })
      expect(result).toEqual(input)
    }
  )
})
