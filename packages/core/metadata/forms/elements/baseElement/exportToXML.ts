import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { BaseElementXML } from "./types"

export const exportElementPropsToXML = (context: ConfigurationContext, data: { name: string }): BaseElementXML => {
  const result: BaseElementXML = {
    _name: data.name,
    _id: getElementId(context),
  }

  return result
}
