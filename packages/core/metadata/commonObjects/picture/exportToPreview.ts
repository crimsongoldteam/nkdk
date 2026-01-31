import { ConfigurationContext } from "../../context/types"
import { Picture, PictureEnterprisePreview } from "./types"

export const exportPictureToPreview = (
  _context: ConfigurationContext,
  picture: Picture | undefined
): PictureEnterprisePreview | undefined => {
  if (!picture || !picture.ref) return undefined
  return {
    type: picture.type,
    value: picture.ref,
  }
}
