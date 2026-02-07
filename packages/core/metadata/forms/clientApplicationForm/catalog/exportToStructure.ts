import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { exportClientApplicationFormToStructure } from "../base/exportToStructure"
import { CatalogForm } from "./types"

export const exportCatalogFormToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: CatalogForm
): IFormatElementResult => {
  return exportClientApplicationFormToStructure(context, element)
}
