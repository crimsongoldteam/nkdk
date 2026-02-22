import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { Popup } from "./types"

export const importPopupFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Popup }): Popup => {
  const { context, source } = params
  const result: Popup = {
    itemType: CollectionFormElementType.Popup,
    name: importNameFromNKDK(source.name),
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: [],
  }

  return result
}
