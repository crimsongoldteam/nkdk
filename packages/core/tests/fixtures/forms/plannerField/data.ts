import { PlannerField, PlannerFieldEnterprise } from "~/metadata/forms/elements/plannerField/types"
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

export const fullPlannerFieldEnterprise: PlannerFieldEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле планера",
}

export const minimalPlannerField: PlannerField = {
  elementType: FormElementType.PlannerField,
  name: "ПолеПланера",
}

export const minimalPlannerFieldEnterprise: PlannerFieldEnterprise = {}
