import { ConfigurationContext } from "~/metadata/context/types"
import { detectTreeNodes } from "./parser/detector/detectTree"
import { parseElement } from "./parser/elementsParser/parse"
import { tokenize } from "./parser/tokenizer/tokenizer"
import { parseTree } from "./parser/treeParser/treeParser"
import { ChildItems } from "./types"

export const importChildItemsFromStructure = (context: ConfigurationContext, text: string): ChildItems => {
  const tokens = tokenize(text)
  const treeNodes = parseTree(context, tokens)
  const detectedNodes = detectTreeNodes(treeNodes)

  return detectedNodes.map((node) => parseElement(context, node))
}
