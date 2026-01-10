import { LabelField, LabelFieldEnterprise } from "~/metadata/forms/elements/labelField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullLabelField: LabelField = {
  ...fullFormField,
  elementType: FormElementType.LabelField,
  name: "ПолеНадписи",
  title: {
    items: { ru: "Поле надписи" },
  },
}

export const fullLabelFieldEnterprise: LabelFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле надписи",
}

export const minimalLabelField: LabelField = {
  elementType: FormElementType.LabelField,
  name: "ПолеНадписи",
}

export const minimalLabelFieldEnterprise: LabelFieldEnterprise = {}
