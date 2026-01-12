import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
} from "~/metadata/forms/elements/plannerField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullPlannerField: PlannerField = {
  ...fullFormField,
  elementType: FormElementType.PlannerField,
  name: "ПолеПланера",
  title: {
    items: { ru: "Поле планера" },
  },
}

export const fullPlannerFieldPartialEnterprise: PlannerFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле планера",
}

export const fullPlannerFieldTypedEnterprise: PlannerFieldTypedEnterprise = {
  ...fullPlannerFieldPartialEnterprise,
  Тип: "ПолеПланировщика",
}

export const minimalPlannerField: PlannerField = {
  elementType: FormElementType.PlannerField,
  name: "ПолеПланера",
}

export const minimalPlannerFieldPartialEnterprise: PlannerFieldPartialEnterprise = {}

export const minimalPlannerFieldTypedEnterprise: PlannerFieldTypedEnterprise = {
  Тип: "ПолеПланировщика",
}
