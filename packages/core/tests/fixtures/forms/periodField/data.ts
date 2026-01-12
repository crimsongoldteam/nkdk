import {
  PeriodField,
  PeriodFieldPartialEnterprise,
  PeriodFieldTypedEnterprise,
} from "~/metadata/forms/elements/periodField/types"
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

export const fullPeriodFieldPartialEnterprise: PeriodFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле периода",
}

export const fullPeriodFieldTypedEnterprise: PeriodFieldTypedEnterprise = {
  ...fullPeriodFieldPartialEnterprise,
  Тип: "ПолеПериода",
}

export const minimalPeriodField: PeriodField = {
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
}

export const minimalPeriodFieldPartialEnterprise: PeriodFieldPartialEnterprise = {}

export const minimalPeriodFieldTypedEnterprise: PeriodFieldTypedEnterprise = {
  Тип: "ПолеПериода",
}
