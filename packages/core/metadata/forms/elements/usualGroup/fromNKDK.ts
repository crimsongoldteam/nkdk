import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { UsualGroup } from "./types"

const groupFromGroupText = (groupText: string | undefined): SE.ChildFormItemsGroup => {
  const first = groupText?.[0]
  if (first === "=") return "AlwaysHorizontal"
  if (first === "+") return "Vertical"

  return "HorizontalIfPossible"
}

export const importUsualGroupFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Group }): UsualGroup => {
  const { context, source } = params
  const groupText = source.group

  const childItems = importChildItemsFromNKDK({ context, value: source.childItems })

  const title = importI8nTextFromNKDK(context, source.title)
  const result: UsualGroup = {
    group: groupFromGroupText(groupText),
    itemType: CollectionFormElementType.UsualGroup,
    name: importNameFromNKDK(source.name),
    showTitle: source.title !== undefined,
    childItems: childItems,
  }

  if (title !== undefined) {
    result.title = title
  }

  return result
}
