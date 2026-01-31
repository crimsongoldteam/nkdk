import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText } from "./types"
import { exportI8nTextDefaultToEnterprise } from "./exportToEnterprise"

export const exportI8nTextToPreview = (
  context: ConfigurationContext,
  text: I8nText | undefined
): string | undefined => {
  return exportI8nTextDefaultToEnterprise(context, text)
}
