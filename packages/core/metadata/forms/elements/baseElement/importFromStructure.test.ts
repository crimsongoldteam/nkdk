import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { mockContext } from "~/tests/mockContext"
import { parseElement } from "../../collections/childItems/parser/elementsParser/parse"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("import other field from structure", () => {
  it("should import other element from structure", () => {
    const structure = "?ПолеПереключателя {ИмяПоля}"

    const tokens = tokenize(structure)
    const treeNodes = parseTree(mockContext, tokens)
    const result = parseElement(mockContext, treeNodes[0])

    expect(result).toEqual({
      elementType: FormElementType.RadioButtonField,
      name: "ИмяПоля",
    })
  })
})
