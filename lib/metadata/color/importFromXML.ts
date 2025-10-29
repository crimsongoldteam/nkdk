import { TColor, TColorXML } from "./types"

export default function importColorFromXML(xml: TColorXML): TColor {
  // Поскольку и TColor, и TColorXML являются строками,
  // просто возвращаем значение как есть
  return xml
}
