import { TColor, TColorXML } from "./types"

export default function exportColorToXML(color: TColor): TColorXML {
  // Поскольку и TColor, и TColorXML являются строками,
  // просто возвращаем значение как есть
  return color
}
