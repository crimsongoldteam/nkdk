import { LabelField, LabelFieldEnterprise } from "~/metadata/forms/elements/labelField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullLabelField: LabelField = {
  elementType: FormElementType.LabelField,
  name: "ПолеНадписи",
  title: {
    items: { ru: "Поле надписи" },
  },
}

export const fullLabelFieldEnterprise: LabelFieldEnterprise = {
  Заголовок: "Поле надписи",
}

export const minimalLabelField: LabelField = {
  elementType: FormElementType.LabelField,
  name: "ПолеНадписи",
}

export const minimalLabelFieldEnterprise: LabelFieldEnterprise = {}

