import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"

export const exportButtonToXML = (context: ConfigurationContext, data?: Button) => {
  return exportElementToXML(context, "Button", data)
}

registerMetadata("ExportToXML", "Button", exportButtonToXML)
