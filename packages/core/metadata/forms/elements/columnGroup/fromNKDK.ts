import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { ColumnGroup } from "./types"

const importColumnGroupFromNKDKBase = (params: {
  context: ConfigurationContext
  name: string
  title?: string
}): ColumnGroup => {
  const { context, name, title } = params
  return {
    itemType: CollectionFormElementType.ColumnGroup,
    name: importNameFromNKDK(name),
    title: importI8nTextFromNKDK(context, title ?? ""),
    childItems: [],
  }
}

export const importTableHorizontalGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableHorizontalGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    name: params.source.name,
    title: params.source.title,
  })

export const importTableInCellGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableInCellGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    name: params.source.name,
    title: params.source.title,
  })

export const importTableVerticalGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableVerticalGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    name: params.source.name,
    title: params.source.title,
  })
