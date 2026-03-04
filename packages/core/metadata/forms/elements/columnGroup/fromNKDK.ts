import * as NKDK from "nkdk-language"
import { title } from "process"
import { ConfigurationContext } from "~/metadata/context/types"

import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import * as SE from "~/metadata/systemEnumerations/types"
import { ColumnGroup } from "./types"

const importColumnGroupFromNKDKBase = (params: {
  context: ConfigurationContext
  source: NKDK.TableHorizontalGroup | NKDK.TableInCellGroup | NKDK.TableVerticalGroup
  group: SE.ColumnsGroup
  // title?: string
}): ColumnGroup => {
  const { context, source, group } = params

  const titleText = importI8nTextFromNKDK(context, source.title)

  const result: ColumnGroup = {
    itemType: CollectionFormElementType.ColumnGroup,
    name: importNameFromNKDK(source),
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
    source: params.source,
    group: "Horizontal",
  })

export const importTableInCellGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableInCellGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    source: params.source,
    group: "InCell",
  })

export const importTableVerticalGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableVerticalGroup
}): ColumnGroup =>
  importColumnGroupFromNKDKBase({
    context: params.context,
    source: params.source,
    group: "Vertical",
  })
