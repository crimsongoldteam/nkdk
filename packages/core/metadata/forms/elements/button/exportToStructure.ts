import { registerFormat } from "~/format/formatFactory"
import { formatElementName } from "~/format/helpers"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { Button } from "./types"

export const exportButtonToStructure = (_context: ConfigurationContext, element: Button): IFormatElementResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let resultString: string
  if (hasTitle) {
    resultString = "<" + element.title!.items.ru + " " + formatElementName(element) + ">"
  } else {
    resultString = "<" + formatElementName(element) + ">"
  }

  const result: IFormatElementResult = {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerFormat<Button>(exportButtonToStructure, (element: Button) => element.elementType === FormElementType.Button)
registerIsOneLineElementCheck<Button>(FormElementType.Button, () => true)
