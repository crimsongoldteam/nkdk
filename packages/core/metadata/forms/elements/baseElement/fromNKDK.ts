import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { importFormElementTypeFromYAML } from "~/metadata/metadataFactory/metadataType/fromYAML"
import { FormElementType, FormElementTypeYAML } from "~/metadata/orchestration"
import { OtherElement, OtherElementElementType } from "../../commonObjects/childItems/types"
import { SearchControlAddition } from "../searchControlAddition/types"
import { SearchStringAddition } from "../searchStringAddition/types"

export const importCommandAdditionFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandAdditionField
}): SearchStringAddition | SearchControlAddition => {
  const props = importFromNKDK(params)

  if (props.itemType === "SearchStringAddition") {
    return {
      itemType: "SearchStringAddition",
      name: props.name,
    } satisfies SearchStringAddition
  }

  return {
    itemType: "SearchControlAddition",
    name: props.name,
    childItems: [],
  } satisfies SearchControlAddition
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
}): { itemType: FormElementType; name: string } => {
  const { context, source } = params

  const sourceType = source.type.slice(1) as FormElementTypeYAML

  const itemType = importFormElementTypeFromYAML(context, sourceType) as FormElementType

  const name = importNameFromNKDK(source)
  return { itemType: itemType, name: name }
}
