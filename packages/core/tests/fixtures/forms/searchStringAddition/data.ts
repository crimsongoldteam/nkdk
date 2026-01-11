import { SearchStringAddition, SearchStringAdditionEnterprise } from "~/metadata/forms/elements/searchStringAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormItemAddition, fullFormItemAdditionEnterprise } from "../formItemAddition/data"

export const fullSearchStringAddition: SearchStringAddition = {
  ...fullFormItemAddition,
  elementType: FormElementType.SearchStringAddition,
  name: "ДополнениеСтрокиПоиска",
  childItems: [],
}

export const fullSearchStringAdditionEnterprise: SearchStringAdditionEnterprise = {
  ...fullFormItemAdditionEnterprise,
}

export const minimalSearchStringAddition: SearchStringAddition = {
  elementType: FormElementType.SearchStringAddition,
  name: "ДополнениеСтрокиПоиска",
  childItems: [],
}

export const minimalSearchStringAdditionEnterprise: SearchStringAdditionEnterprise = {}

