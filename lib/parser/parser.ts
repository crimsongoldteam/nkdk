import type { Context } from "../metadata/context/types"
import type { ClientApplicationForm } from "../metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "../metadata/metadataFactory/types"
import { detectTreeNodes } from "./detector/detectTree"
import { parseElement } from "./elementsParser/parse"
import { parseTree } from "./treeParser/parseTree"

const configurationSettings: Context = {
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
    const element = parseElement(node, configurationSettings)
    result.childItems?.push(element)
  }

  return result
}
