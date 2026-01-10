import { ProgressBarField, ProgressBarFieldEnterprise } from "~/metadata/forms/elements/progressBarField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullProgressBarField: ProgressBarField = {
  elementType: FormElementType.ProgressBarField,
  name: "ПолеИндикатора",
  title: {
    items: { ru: "Поле индикатора" },
  },
}

export const fullProgressBarFieldEnterprise: ProgressBarFieldEnterprise = {
  Заголовок: "Поле индикатора",
}

export const minimalProgressBarField: ProgressBarField = {
  elementType: FormElementType.ProgressBarField,
  name: "ПолеИндикатора",
}

export const minimalProgressBarFieldEnterprise: ProgressBarFieldEnterprise = {}
