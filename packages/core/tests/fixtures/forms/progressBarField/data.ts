import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldTypedEnterprise,
} from "~/metadata/forms/elements/progressBarField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullProgressBarField: ProgressBarField = {
  ...fullFormField,
  elementType: FormElementType.ProgressBarField,
  name: "ПолеИндикатора",
  title: {
    items: { ru: "Поле индикатора" },
  },
}

export const fullProgressBarFieldPartialEnterprise: ProgressBarFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле индикатора",
}

export const fullProgressBarFieldTypedEnterprise: ProgressBarFieldTypedEnterprise = {
  ...fullProgressBarFieldPartialEnterprise,
  Тип: "ПолеИндикатора",
}

export const minimalProgressBarField: ProgressBarField = {
  elementType: FormElementType.ProgressBarField,
  name: "ПолеИндикатора",
}

export const minimalProgressBarFieldPartialEnterprise: ProgressBarFieldPartialEnterprise = {}

export const minimalProgressBarFieldTypedEnterprise: ProgressBarFieldTypedEnterprise = {
  Тип: "ПолеИндикатора",
}
