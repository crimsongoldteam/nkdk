import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { Popup } from "./types"

export const importPopupFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Popup }): Popup => {
  const { context, source } = params
  const result: Popup = {
    itemType: CollectionFormElementType.Popup,
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title ?? ""),
    childItems: [],
  }

  return result
}
