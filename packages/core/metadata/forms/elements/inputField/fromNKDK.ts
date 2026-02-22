import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { InputField } from "./types"

export const importInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.InputField
}): InputField => {
  const { context, source } = params
  const result: InputField = {
    itemType: CollectionFormElementType.InputField,
    name: importNameFromNKDK(source.name),
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}

export const importTableInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableInputField
}): InputField =>
  importInputFieldFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.title } as NKDK.InputField,
  })
