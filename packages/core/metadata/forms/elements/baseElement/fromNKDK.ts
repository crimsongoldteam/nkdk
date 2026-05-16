import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CollectableElementToYAML,
  CollectableElementType,
  importFormElementTypeFromYAML,
} from "~/metadata/orchestration"
import { importNameFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { OtherElement, OtherElementElementType } from "../../commonObjects/childItems/types"
import { SearchControlAddition } from "../searchControlAddition/types"
import { SearchStringAddition } from "../searchStringAddition/types"
import { ViewStatusAddition } from "../viewStatusAddition/types"

export const importCommandAdditionFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandAdditionField
}): SearchStringAddition | SearchControlAddition | ViewStatusAddition => {
  const props = importFromNKDK(params)

  if (props.itemType === "SearchStringAddition") {
    return {
      itemType: "SearchStringAddition",
      name: props.name,
    } satisfies SearchStringAddition
  }

  if (props.itemType === "SearchControlAddition") {
    return {
      itemType: "SearchControlAddition",
      name: props.name,
      childItems: [],
    } satisfies SearchControlAddition
  }

  return {
    itemType: "ViewStatusAddition",
    name: props.name,
  } satisfies ViewStatusAddition
}

export const importOtherFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.OtherField
}): OtherElement => {
  const props = importFromNKDK(params)

  return {
    itemType: props.itemType as OtherElementElementType,
    name: props.name,
  }
}

const importFromNKDK = <T extends NKDK.OtherField | NKDK.CommandAdditionField>(params: {
  context: ConfigurationContext
  source: T
}): { itemType: CollectableElementType; name: string } => {
  const { context, source } = params

  const sourceType = source.type.slice(1) as CollectableElementToYAML<CollectableElementType>

  const itemType = importFormElementTypeFromYAML(context, sourceType)

  const name = importNameFromNKDK(source)
  return { itemType: itemType, name: name }
}
