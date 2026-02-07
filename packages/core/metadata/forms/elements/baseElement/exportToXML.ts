import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { PropertyRule } from "../calendarField/rules"
import { BaseElementXML } from "./types"

/** @deprecated */
export const exportElementPropsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: { name: string }
): BaseElementXML => {
  const result: BaseElementXML = {
    _name: data.name,
    _id: getElementId(context),
  }

  return result
}
