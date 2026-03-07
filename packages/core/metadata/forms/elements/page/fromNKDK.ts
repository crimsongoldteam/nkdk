import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { Page } from "./types"

export const importPageFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Page }): Page => {
  const { context, source } = params
  const result: Page = {
    itemType: "Page",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
    childItems: importChildItemsFromNKDK({ context, value: source.childItems }),
  }

  return result
}
