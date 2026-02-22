import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { Pages } from "./types"

export const importPagesFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Pages }): Pages => {
  const { context, source } = params

  const childItems = importChildItemsFromNKDK({ context, value: source.childItems })
  const result: Pages = {
    itemType: CollectionFormElementType.Pages,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: childItems,
  }

  return result
}
