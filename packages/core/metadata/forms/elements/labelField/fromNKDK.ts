import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import {
  importDataPathFromNKDK,
  importI8nTextFromNKDK,
  importNameFromNKDK,
} from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { LabelField, TableLabelField } from "./types"

export const importLabelFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.LabelField
}): LabelField => {
  const { context, source } = params
  const result: LabelField = {
    itemType: "LabelField",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
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
}): TableLabelField => ({
  ...importLabelFieldFromNKDK({
    context: params.context,
    source: {
      elementName: params.source.elementName,
      dataPath: params.source.dataPath,
      title: params.source.title,
    } as NKDK.LabelField,
  }),
  itemType: "TableLabelField",
})
