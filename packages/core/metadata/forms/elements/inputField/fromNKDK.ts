import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  importDataPathFromNKDK,
  importI8nTextFromNKDK,
  importNameFromNKDK,
} from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { InputField, TableInputField } from "./types"

export const importInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.InputField
}): InputField => {
  const { context, source } = params

  const dataPath = importDataPathFromNKDK(source)

  const result: InputField = {
    itemType: "InputField",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
    ...(dataPath ? { dataPath } : {}),
  }

  return result
}

export const importTableInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableInputField
}): TableInputField => ({
  ...importInputFieldFromNKDK({
    context: params.context,
    source: {
      elementName: params.source.elementName,
      dataPath: params.source.dataPath,
      title: params.source.title,
    } as NKDK.InputField,
  }),
  itemType: "TableInputField",
})
