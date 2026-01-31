import { ConfigurationContext } from "../context/types"
import { SystemEnumerationPreview } from "./types"

export const exportSystemEnumerationToPreview = (
  _context: ConfigurationContext,
  value: string | undefined,
  enumerationName: string
): SystemEnumerationPreview | undefined => {
  if (!value) return undefined
  return {
    Type: enumerationName,
    Value: value,
  }
}
