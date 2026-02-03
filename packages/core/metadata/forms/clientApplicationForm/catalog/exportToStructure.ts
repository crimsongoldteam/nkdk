import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportClientApplicationFormToStructure } from "../base/exportToStructure"
import { CatalogForm } from "./types"
import { PropertyRule } from "../../elements/calendarField/rules"

export const exportCatalogFormToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  element: CatalogForm
): IFormatElementResult => {
  return exportClientApplicationFormToStructure(context, element)
}
