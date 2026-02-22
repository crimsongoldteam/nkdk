import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import type { ImportFromNKDKFnMap } from "~/metadata/metadataFactory/elements/fromNKDKFactory/types"
import { UsualGroup } from "./types"

export const importUsualGroupFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Group }): UsualGroup => {
  const { context, source } = params
  const result: UsualGroup = {
    itemType: CollectionFormElementType.UsualGroup,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: [],
  }

  return result
}

export const importGroupFromNKDK = importUsualGroupFromNKDK

export const createOneLineGroupFieldFromNKDK =
  (fnMap: ImportFromNKDKFnMap) =>
  (params: { context: ConfigurationContext; source: NKDK.OneLineGroupField }): BaseElement =>
    fnMap[params.source.$type]({
      context: params.context,
      source: params.source as never,
    })
