import { PlannerField, PlannerFieldEnterprise } from "~/metadata/forms/elements/plannerField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullPlannerField: PlannerField = {
  elementType: FormElementType.PlannerField,
  name: "ПолеПланера",
  title: {
    items: { ru: "Поле планера" },
  },
}

export const fullPlannerFieldEnterprise: PlannerFieldEnterprise = {
  Заголовок: "Поле планера",
}

export const minimalPlannerField: PlannerField = {
  elementType: FormElementType.PlannerField,
  name: "ПолеПланера",
}

export const minimalPlannerFieldEnterprise: PlannerFieldEnterprise = {}

