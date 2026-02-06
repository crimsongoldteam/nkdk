import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToPreview, registerMetadata } from "~/metadata/metadataFactory"
import { UsualGroup, UsualGroupPreview } from "./types"

export function exportUsualGroupToPreview<From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  data: From
): UsualGroupPreview | undefined {
  return exportElementToPreview(context, "UsualGroup", data) as UsualGroupPreview | undefined
}

registerMetadata("ExportToPreview", "UsualGroup", exportUsualGroupToPreview as any)
