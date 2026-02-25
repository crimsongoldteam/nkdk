import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import {
  importDataPathFromNKDK,
  importI8nTextFromNKDK,
  importNameFromNKDK,
} from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { InputField } from "./types"

export const importInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.InputField
}): InputField => {
  const { context, source } = params
  const result: InputField = {
    itemType: CollectionFormElementType.InputField,
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
  }

  const dataPath = importDataPathFromNKDK(source)
  if (dataPath) {
    result.dataPath = dataPath
  }

  return result
}

export const importTableInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableInputField
}): InputField =>
  importInputFieldFromNKDK({
    context: params.context,
    source: {
      elementName: params.source.elementName,
      dataPath: params.source.dataPath,
      title: params.source.title,
    } as NKDK.InputField,
  })
