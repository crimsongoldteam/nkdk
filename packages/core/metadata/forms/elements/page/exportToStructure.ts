import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { registerIsOneLineElementCheck } from "~/metadata/forms/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { addSimpleIndent } from "~/metadata/forms/format/wrap/addIndents"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "../../../metadataFactory/types"
import { exportChildItemsToStructure } from "../../collections/childItems/exportToStructure"
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
  result.strings.push(header)

  const childResult = exportChildItemsToStructure(context, childItems)
  const indentedStrings = addSimpleIndent(childResult.strings)
  result.strings.push(...indentedStrings)
  result.haveSimpleHorizontalGroup = result.haveSimpleHorizontalGroup || childResult.haveSimpleHorizontalGroup
  return result
}

const getHeader = (context: ConfigurationContext, element: Page): string => {
  let result = t.Slash.LABEL as string

  result += formatElementTitleAndName(context, element)

  return result
}

registerIsOneLineElementCheck(FormElementType.Page, () => false)
registerMetadata("ExportToStructure", "Page", exportPageToStructure as ExportToStructureFn)
