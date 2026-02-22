import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { InputField } from "./types"

export const importInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.InputField
}): InputField => {
  const { context, source } = params
  const result: InputField = {
    itemType: CollectionFormElementType.InputField,
    name: importNameFromNKDK(source.name),
    title: importI8nTextFromNKDK(context, source.title),
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
