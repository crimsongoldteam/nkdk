import type { TConfigurationSettings } from "../metadata/configurationSettings/types"
import type { TClientApplicationForm } from "../metadata/forms/elements/clientApplicationForm/types"
import { FormElementType } from "../metadata/forms/elements/types"
import { parseElement } from "./elementsParser/parse"
import { detectTreeNodes } from "./detector/detectTree"
import { parseTree } from "./treeParser/parseTree"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

export const parse = (text: string): TClientApplicationForm => {
  const treeNodes = parseTree(text)
  const detectedNodes = detectTreeNodes(treeNodes)

  const result: TClientApplicationForm = {
    elementType: FormElementType.Form,
    childItems: [],
  }

  for (const node of detectedNodes) {
    const element = parseElement(node, configurationSettings)
    result.childItems.push(element)
  }

  return result
}
