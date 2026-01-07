import { PeriodField, PeriodFieldEnterprise } from "~/metadata/forms/elements/periodField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullPeriodField: PeriodField = {
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
  id: "1",
  title: {
    items: { ru: "Поле периода" },
  },
}

export const fullPeriodFieldEnterprise: PeriodFieldEnterprise = {
  Заголовок: "Поле периода",
}

export const minimalPeriodField: PeriodField = {
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
  id: "1",
}

export const minimalPeriodFieldEnterprise: PeriodFieldEnterprise = {}
