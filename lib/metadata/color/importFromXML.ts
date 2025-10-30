import { TColor, TColorXML } from "./types"

export default function importColorFromXML(xml: TColorXML | undefined): TColor | undefined {
  if (!xml) return undefined
  return xml
}
