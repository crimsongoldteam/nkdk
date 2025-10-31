import { TPicture, TPictureXML } from "./types"

export const importPictureFromXML = (xml: TPictureXML | undefined): TPicture | undefined => {
  if (!xml) return undefined

  // Parse Ref to extract type and reference
  const [type, ref] = xml["xr:Ref"].split(".")

  const result: TPicture = {
    ref: ref || xml["xr:Ref"],
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent: xml["xr:LoadTransparent"],
  }

  return result
}
