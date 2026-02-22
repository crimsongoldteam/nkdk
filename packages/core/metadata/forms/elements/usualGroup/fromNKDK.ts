import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { UsualGroup } from "./types"

export const importUsualGroupFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Group }): UsualGroup => {
  const { context, source } = params

  const childItems = importChildItemsFromNKDK({ context, value: source.childItems })
  const result: UsualGroup = {
    itemType: CollectionFormElementType.UsualGroup,
    name: importNameFromNKDK(source.name),
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: childItems,
  }

  return result
}
