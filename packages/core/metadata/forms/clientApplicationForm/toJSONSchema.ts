import { TSchema } from "@sinclair/typebox"
import { exportChildItemsToJSONSchema } from "../commonObjects/childItems/toJSONSchema"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToJSONSchema = (form: ClientApplicationForm): TSchema => {
  const childItems = exportChildItemsToJSONSchema(form.childItems)

  return {
    Элементы: childItems,
  }
}
