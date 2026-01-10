import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { mockСontext } from "~/tests/mockContext"
import { parseElement } from "../childItems/parser/elementsParser/parse"
import { tokenize } from "../childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../childItems/parser/treeParser/treeParser"

describe("importOtherElementFromStructure", () => {
  it("should import other element from structure", () => {
    const structure = "?ПолеПереключателя {ИмяПоля}"

    const tokens = tokenize(structure)
    const treeNodes = parseTree(mockСontext, tokens)
    const result = parseElement(mockСontext, treeNodes[0])

    expect(result).toEqual({
      elementType: FormElementType.RadioButtonField,
      name: "ИмяПоля",
    })
  })
})
