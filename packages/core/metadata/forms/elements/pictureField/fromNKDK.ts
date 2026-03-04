import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"

import { importDataPathFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { PictureField } from "./types"

export const importPictureFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.PictureField
}): PictureField => {
  const { context, source } = params
  const result: PictureField = {
    itemType: CollectionFormElementType.PictureField,
    name: importNameFromNKDK(source),
    title: importI8nTextFromString({ context, value: source.title }),
  }

  const dataPath = importDataPathFromNKDK(source)
  if (dataPath) {
    result.dataPath = dataPath
  }

  return result
}

export const importTablePictureFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TablePictureField
}): PictureField =>
  importPictureFieldFromNKDK({
    context: params.context,
    source: {
      elementName: params.source.elementName,
      dataPath: params.source.dataPath,
      title: params.source.title,
    } as NKDK.PictureField,
  })
