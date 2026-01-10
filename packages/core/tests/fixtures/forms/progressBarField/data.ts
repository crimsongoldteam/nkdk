import { ProgressBarField, ProgressBarFieldEnterprise } from "~/metadata/forms/elements/progressBarField/types"
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

export const fullProgressBarFieldEnterprise: ProgressBarFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле индикатора",
}

export const minimalProgressBarField: ProgressBarField = {
  elementType: FormElementType.ProgressBarField,
  name: "ПолеИндикатора",
}

export const minimalProgressBarFieldEnterprise: ProgressBarFieldEnterprise = {}
