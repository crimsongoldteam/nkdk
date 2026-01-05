import { ConfigurationContext } from "~/metadata/context/types"
import { getUUID } from "../../helpers/uuid"
import { InternalInfoItemsXML, InternalInfoParam } from "./types"

export const exportInternalInfoToXML = <T extends InternalInfoParam[]>(
  context: ConfigurationContext,
  data: T
): InternalInfoItemsXML<T> => {
  return {
    "xr:GeneratedType": data.map((param) => ({
      _name: param.name,
      _category: param.category,
      "xr:TypeId": getUUID(context),
      "xr:ValueId": getUUID(context),
    })),
  }
}
