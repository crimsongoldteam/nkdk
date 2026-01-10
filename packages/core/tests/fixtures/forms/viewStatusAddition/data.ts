import { ViewStatusAddition, ViewStatusAdditionEnterprise } from "~/metadata/forms/elements/viewStatusAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormItemAddition, fullFormItemAdditionEnterprise } from "../formItemAddition/data"

export const fullViewStatusAddition: ViewStatusAddition = {
  ...fullFormItemAddition,
  elementType: FormElementType.ViewStatusAddition,
  name: "ДополнениеСостоянияПросмотра",
}

export const fullViewStatusAdditionEnterprise: ViewStatusAdditionEnterprise = {
  ...fullFormItemAdditionEnterprise,
}

export const minimalViewStatusAddition: ViewStatusAddition = {
  elementType: FormElementType.ViewStatusAddition,
  name: "ДополнениеСостоянияПросмотра",
}

export const minimalViewStatusAdditionEnterprise: ViewStatusAdditionEnterprise = {}

