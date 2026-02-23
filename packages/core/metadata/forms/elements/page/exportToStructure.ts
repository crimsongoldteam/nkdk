import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { registerIsOneLineElementCheck } from "~/metadata/forms/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { addSimpleIndent } from "~/metadata/forms/format/wrap/addIndents"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { exportChildItemsToStructure } from "../../commonObjects/childItems/exportToStructure"
import { NamedElement } from "../baseElement/types"
import { Page } from "./types"

export const exportPageToStructure = (context: ConfigurationContext, element: NamedElement): IFormatElementResult => {
  const pageElement = element as Page
  const childItems = pageElement.childItems ?? []

  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const header = getHeader(context, pageElement)
  result.push(header)

  const childResult = exportChildItemsToStructure(context, childItems)
  const indentedStrings = addSimpleIndent(childResult)
  result.push(...indentedStrings)
  return result
}

const getHeader = (context: ConfigurationContext, element: Page): string => {
  let result = t.Slash.LABEL as string

  result += formatElementTitleAndName(context, element)

  return result
}

registerIsOneLineElementCheck(CollectionFormElementType.Page, () => false)
registerElementOperation("ExportToStructure", "Page", exportPageToStructure as ExportToStructureFn)
