import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { Page } from "./types"

export const importPageFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Page }): Page => {
  const { context, source } = params
  const result: Page = {
    itemType: CollectionFormElementType.Page,
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
    childItems: importChildItemsFromNKDK({ context, value: source.childItems }),
  }

  return result
}
