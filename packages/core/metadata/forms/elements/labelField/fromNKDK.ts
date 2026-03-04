import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"

import { importDataPathFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { LabelField } from "./types"

export const importLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.LabelField
}): LabelField => {
  const { context, source } = params
  const result: LabelField = {
    itemType: "LabelField",
    name: importNameFromNKDK(source),
    title: importI8nTextFromString({ context, value: source.title }),
  }

  const dataPath = importDataPathFromNKDK(source)
  if (dataPath) {
    result.dataPath = dataPath
  }

  return result
}

export const importTableLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableLabelField
}): LabelField =>
  importLabelFieldFromNKDK({
    context: params.context,
    source: {
      elementName: params.source.elementName,
      dataPath: params.source.dataPath,
      title: params.source.title,
    } as NKDK.LabelField,
  })
