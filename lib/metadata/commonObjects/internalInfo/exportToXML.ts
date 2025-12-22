import { v4 } from "uuid"
import { InternalInfoItemsXML, InternalInfoParams } from "./types"

export const exportInternalInfoToXML = (data: InternalInfoParams): InternalInfoItemsXML => {
  const result = data.map((param) => ({
    _name: param.name,
    _category: param.category,
    "xr:TypeId": v4(),
    "xr:ValueId": v4(),
  }))

  return { "xr:GeneratedType": result }
}
