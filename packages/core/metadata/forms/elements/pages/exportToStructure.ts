import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { exportChildItemsToStructure } from "../../commonObjects/childItems/exportToStructure"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { addSimpleIndent } from "../../format/wrap/addIndents"
import { Pages } from "./types"

const SLASH = (t.Slash.LABEL as string).repeat(2)

export const exportPagesToStructure = (context: ConfigurationContext, element: Pages): ToNKDKResult => {
  const pagesElement = element as Pages
  const childItems = pagesElement.childItems ?? []
  const result: ToNKDKResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(pagesElement)
  result.strings.push(header)

  const childResult = exportChildItemsToStructure(context, childItems)

  const indentedStrings = addSimpleIndent(childResult.strings)

  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (element: Pages): string => {
  let result = SLASH

  result += element.title?.items.ru ?? ""

  result += formatElementName(element)

  return result
}

registerIsOneLineElementCheck(CollectionFormElementType.Pages, () => false)
registerElementOperation("ExportToStructure", "Pages", exportPagesToStructure as ExportToStructureFn)
