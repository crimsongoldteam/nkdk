export interface IFontXML {
  _ref?: string
  _faceName?: string
  _scale?: number
  _height?: number
  _bold?: boolean
  _italic?: boolean
  _underline?: boolean
  _strikeout?: boolean
  _kind: string
}

export interface IFont {
  ref?: string
  faceName?: string
  scale?: number
  height?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
  kind: string
}

export type TFont = IFont
export type TFontXML = IFontXML
