import type { ConfigurationContext } from "../metadata/context/types"
import type { ClientApplicationForm } from "../metadata/forms/clientApplicationForm/types"
import { FormElementType } from "../metadata/metadataFactory/types"
import { detectTreeNodes } from "./detector/detectTree"
import { parseElement } from "./elementsParser/parse"
import { parseTree } from "./treeParser/parseTree"

const context: ConfigurationContext = {
  defaultLanguage: "ru",
}

export const parse = (text: string): ClientApplicationForm => {
  const treeNodes = parseTree(text)
  const detectedNodes = detectTreeNodes(treeNodes)

  const result: ClientApplicationForm = {
    elementType: FormElementType.Form,
    childItems: [],
  }

  for (const node of detectedNodes) {
    const element = parseElement(node, context)
    result.childItems?.push(element)
  }

  return result
}
