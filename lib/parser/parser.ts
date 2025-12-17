import type { ConfigurationSettings } from "../metadata/configurationSettings/types"
import type { ClientApplicationForm } from "../metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "../metadata/forms/elements/types"
import { parseElement } from "./elementsParser/parse"
import { detectTreeNodes } from "./detector/detectTree"
import { parseTree } from "./treeParser/parseTree"

const configurationSettings: ConfigurationSettings = {
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
