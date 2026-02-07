import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToPreview, registerMetadata } from "~/metadata/metadataFactory"
import { Button, ButtonPreview } from "./types"

export function exportButtonToPreview<From extends Button | undefined>(
  context: ConfigurationContext,
  data: From
): ButtonPreview | undefined {
  return exportElementToPreview(context, "Button", data)
}

registerMetadata("ExportToPreview", "Button", exportButtonToPreview as any)
