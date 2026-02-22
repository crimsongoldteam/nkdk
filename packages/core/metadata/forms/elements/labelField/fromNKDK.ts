import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { LabelField } from "./types"

export const importLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.LabelField
}): LabelField => {
  const { context, source } = params
  const result: LabelField = {
    itemType: CollectionFormElementType.LabelField,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}

export const importOtherFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.OtherField
}): LabelField =>
  importLabelFieldFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.type } as NKDK.LabelField,
  })

export const importTableLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableLabelField
}): LabelField =>
  importLabelFieldFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.title } as NKDK.LabelField,
  })
