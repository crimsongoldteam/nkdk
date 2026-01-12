import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
} from "~/metadata/forms/elements/labelField/types"
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

export const fullLabelFieldPartialEnterprise: LabelFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле надписи",
}

export const fullLabelFieldTypedEnterprise: LabelFieldTypedEnterprise = {
  ...fullLabelFieldPartialEnterprise,
  Тип: "ПолеНадписи",
}

export const minimalLabelField: LabelField = {
  elementType: FormElementType.LabelField,
  name: "ПолеНадписи",
}

export const minimalLabelFieldPartialEnterprise: LabelFieldPartialEnterprise = {}

export const minimalLabelFieldTypedEnterprise: LabelFieldTypedEnterprise = {
  Тип: "ПолеНадписи",
}
