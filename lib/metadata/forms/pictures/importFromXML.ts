import { TPicture, TPictureXML } from "./types"

export default function importPictureFromXML(xml: TPictureXML | undefined): TPicture | undefined {
  if (!xml) return undefined

  // Parse Ref to extract type and reference
  const [type, ref] = xml.Ref.split(".")

  const result: TPicture = {
    ref: ref || xml.Ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent: xml.LoadTransparent,
  }

  return result
}
