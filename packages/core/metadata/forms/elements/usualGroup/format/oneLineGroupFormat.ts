import { formatElementName, formatElementTitleAndName } from "~/format/helpers"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { exportOtherElementToStructure } from "../../baseElement/exportToStructure"
import { BaseElement } from "../../baseElement/types"
import { UsualGroup } from "../types"

export const formatOneLineGroup = (element: UsualGroup, context: ConfigurationContext): IFormatElementResult => {
  const separatorSymbol = ";"
  const separator = separatorSymbol + " "

  let result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  if (element.childItems?.length === 0) {
    result.strings.push(separatorSymbol)
    return result
  }

  let groupItems: string[][] = []

  if (element.childItems) {
    for (const item of element.childItems) {
      const exportFunction = getOperationFunction("ExportToStructure", item.elementType)
      let itemResult: IFormatElementResult
      if (!exportFunction) {
        itemResult = exportOtherElementToStructure(context, item as BaseElement)
      } else {
        itemResult = exportFunction(context, item) as IFormatElementResult
      }
      groupItems.push(itemResult.strings)
    }
  }

  // Форматируем заголовок для one-line группы
  let header: string
  if (element.showTitle === false) {
    // Без заголовка - только имя
    header = formatElementName(element)
  } else {
    // С заголовком - используем formatElementTitleAndName
    const title = element.title?.items?.["ru"] ?? ""
    if (title === "") {
      // Пустой заголовок - формат: "" {Группа}
      header = `"" ${formatElementName(element)}`
    } else {
      header = formatElementTitleAndName(element)
    }
  }

  let resultLine = "%" + header + "% " + groupItems.join(separator)

  result.strings.push(resultLine)

  return result
}
