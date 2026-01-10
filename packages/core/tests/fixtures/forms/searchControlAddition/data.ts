import { SearchControlAddition, SearchControlAdditionEnterprise } from "~/metadata/forms/elements/searchControlAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormItemAddition, fullFormItemAdditionEnterprise } from "../formItemAddition/data"

export const fullSearchControlAddition: SearchControlAddition = {
  ...fullFormItemAddition,
  elementType: FormElementType.SearchControlAddition,
  name: "ДополнениеУправленияПоиском",
}

export const fullSearchControlAdditionEnterprise: SearchControlAdditionEnterprise = {
  ...fullFormItemAdditionEnterprise,
}

export const minimalSearchControlAddition: SearchControlAddition = {
  elementType: FormElementType.SearchControlAddition,
  name: "ДополнениеУправленияПоиском",
}

export const minimalSearchControlAdditionEnterprise: SearchControlAdditionEnterprise = {}

