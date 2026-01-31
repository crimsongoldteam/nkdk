import { ConfigurationContext } from "../../context/types"
import { PictureEnterprisePreview } from "./types"

export const exportPictureToPreview = (
  _context: ConfigurationContext,
  value: string | undefined,
  pictureType: "StandardPicture" | "CommonPicture" | "AbsolutePicture"
): PictureEnterprisePreview | undefined => {
  if (!value) return undefined
  return {
    type: pictureType,
    value: value,
  }
}
