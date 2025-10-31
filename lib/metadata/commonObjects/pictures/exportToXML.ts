import { TPicture, TPictureXML } from "./types"

export const exportPictureToXML = (picture: TPicture | undefined): TPictureXML | undefined => {
  if (!picture) return undefined

  const ref = picture.type === "StandardPicture" ? `StdPicture.${picture.ref}` : `CommonPicture.${picture.ref}`

  return {
    "xr:Ref": ref,
    "xr:LoadTransparent": picture.loadTransparent,
  }
}

