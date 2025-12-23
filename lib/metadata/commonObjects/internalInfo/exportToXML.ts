import { v4 } from "uuid"
import { InternalInfoItemsXML, InternalInfoParam } from "./types"

export const exportInternalInfoToXML = <T extends InternalInfoParam[]>(data: T): InternalInfoItemsXML<T> => {
  return {
    "xr:GeneratedType": data.map((param) => ({
      _name: param.name,
      _category: param.category,
      "xr:TypeId": v4(),
      "xr:ValueId": v4(),
    })),
  }
}
