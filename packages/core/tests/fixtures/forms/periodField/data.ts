import { PeriodField, PeriodFieldEnterprise } from "~/metadata/forms/elements/periodField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullPeriodField: PeriodField = {
  ...fullFormField,
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
  title: {
    items: { ru: "Поле периода" },
  },
}

export const fullPeriodFieldEnterprise: PeriodFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле периода",
}

export const minimalPeriodField: PeriodField = {
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
}

export const minimalPeriodFieldEnterprise: PeriodFieldEnterprise = {}
