import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { LabelField } from "./types"

export const importLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.LabelField
}): LabelField => {
  const { context, source } = params
  const result: LabelField = {
    itemType: CollectionFormElementType.LabelField,
    name: importNameFromNKDK(source.name),
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}

export const importTableLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableLabelField
}): LabelField =>
  importLabelFieldFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.title } as NKDK.LabelField,
  })
