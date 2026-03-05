import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { Pages } from "./types"

export const importPagesFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Pages }): Pages => {
  const { context, source } = params

  const childItems = importChildItemsFromNKDK({ context, value: source.childItems })
  const result: Pages = {
    itemType: "Pages",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
    childItems: childItems,
  }

  return result
}
