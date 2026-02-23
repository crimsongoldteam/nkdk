import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import * as SE from "~/metadata/systemEnumerations/types"
import { ColumnGroup } from "./types"

const importColumnGroupFromNKDKBase = (params: {
  context: ConfigurationContext
  name: string
  group: SE.ColumnsGroup
  title?: string
}): ColumnGroup => {
  const { context, name, title, group } = params

  const titleText = importI8nTextFromNKDK(context, title)

  const result: ColumnGroup = {
    itemType: CollectionFormElementType.ColumnGroup,
    name: importNameFromNKDK(name),
    group: group,
    childItems: [],
  }

  if (title !== undefined) {
    result.title = titleText
  }

  return result
}

export const importTableHorizontalGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableHorizontalGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    name: params.source.name,
    group: "Horizontal",
    title: params.source.title,
  })

export const importTableInCellGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableInCellGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    name: params.source.name,
    group: "InCell",
    title: params.source.title,
  })

export const importTableVerticalGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableVerticalGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    name: params.source.name,
    group: "Vertical",
    title: params.source.title,
  })
