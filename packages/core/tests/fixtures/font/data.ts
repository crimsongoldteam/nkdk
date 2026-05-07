import { Font, FontEnterprise, FontYAML } from "~/metadata/commonObjects/font/types"

// #region normalMinimalFont

export const normalMinimalFont: Font = {
  faceName: "Academy Engraved LET",
  kind: "Absolute",
}

export const normalMinimalFontYAML: FontYAML = "Academy Engraved LET"

// #endregion

// #region emptyFaceNameMinimalFont

export const emptyFaceNameMinimalFont: Font = {
  faceName: "",
  kind: "Absolute",
}

export const emptyFaceNameMinimalFontYAML: FontYAML = ""

// #endregion

// #region prefixedFaceNameFont

export const prefixedFaceNameFont: Font = {
  faceName: "style:TooltipTitleFont",
  kind: "Absolute",
}

export const prefixedFaceNameFontYAML: FontYAML = {
  Имя: "style:TooltipTitleFont",
}

// #endregion

// #region systemMinimalFont

export const systemMinimalFont: Font = {
  ref: "ANSIFixedFont",
  kind: "WindowsFont",
}

export const systemMinimalFontYAML: FontYAML = "ANSIШрифтМоноширинный"

// #endregion

// #region styleMinimalFont

export const styleMinimalFont: Font = {
  ref: "ExtraLargeTextFont",
  kind: "StyleItem",
}

export const styleMinimalFontYAML: FontYAML = "ОченьКрупныйШрифтТекста"

// #endregion

// #region unknownStyleMinimalFont

export const unknownStyleMinimalFont: Font = {
  ref: "style:TooltipTitleFont",
  kind: "StyleItem",
}

export const unknownStyleMinimalFontYAML: FontYAML = "style:TooltipTitleFont"

// #endregion

// #region unknownStyleWithFaceNameFont

export const unknownStyleWithFaceNameFont: Font = {
  ref: "style:TooltipTitleFont",
  kind: "StyleItem",
  faceName: "Arial",
}

export const unknownStyleWithFaceNameFontYAML: FontYAML = {
  Имя: "Arial",
  Вид: "style:TooltipTitleFont",
}

// #endregion

// #region styleFullFont

export const styleFullFont: Font = {
  ref: "LargeTextFont",
  kind: "StyleItem",
  faceName: "Times New Roman",
  height: 20,
  bold: true,
  italic: true,
  underline: true,
  strikeout: true,
  scale: 200,
}

export const styleFullFontYAML: FontYAML = {
  Имя: "Times New Roman",
  Размер: 20,
  Масштаб: 200,
  Наклонный: "Истина",
  Подчеркивание: "Истина",
  Полужирный: "Истина",
  Зачеркивание: "Истина",
  Вид: "КрупныйШрифтТекста",
}

// #endregion

// #region normalFullFont

export const normalFullFont: Font = {
  faceName: "Times New Roman",
  kind: "Absolute",
  height: 20,
  bold: true,
  italic: true,
  underline: true,
  strikeout: true,
  scale: 200,
}

export const normalFullFontYAML: FontYAML = {
  Имя: "Times New Roman",
  Размер: 20,
  Масштаб: 200,
  Наклонный: "Истина",
  Подчеркивание: "Истина",
  Полужирный: "Истина",
  Зачеркивание: "Истина",
}

// #region systemFullFont

export const systemFullFont: Font = {
  ref: "SystemFont",
  kind: "WindowsFont",
  faceName: "Times New Roman",
  height: 20,
  bold: true,
  italic: true,
  underline: true,
  strikeout: true,
  scale: 200,
}

export const systemFullFontYAML: FontYAML = {
  Имя: "Times New Roman",
  Размер: 20,
  Масштаб: 200,
  Наклонный: "Истина",
  Подчеркивание: "Истина",
  Полужирный: "Истина",
  Зачеркивание: "Истина",
  Вид: "СистемныйШрифт",
}

// #endregion

// #region emptyFaceNameFullFont

export const emptyFaceNameFullFont: Font = {
  faceName: "",
  kind: "Absolute",
  height: 12,
  bold: false,
  italic: false,
  underline: false,
  strikeout: false,
  scale: 100,
}

export const emptyFaceNameFullFontYAML: FontYAML = {
  Имя: "",
  Размер: 12,
  Масштаб: 100,
  Наклонный: "Ложь",
  Подчеркивание: "Ложь",
  Полужирный: "Ложь",
  Зачеркивание: "Ложь",
}

// #endregion

interface FontYAMLFixture {
  name: string
  xml: string
  font: Font
  yaml: FontYAML
  preview: FontEnterprise
}

export const fontYAMLFixtures: FontYAMLFixture[] = [
  {
    name: "faceName",
    xml: `<Font faceName="Academy Engraved LET" kind="Absolute"/>`,
    font: normalMinimalFont,
    yaml: normalMinimalFontYAML,
    preview: { Type: "Font", Name: "Academy Engraved LET" },
  },
  {
    name: "empty faceName minimal",
    xml: `<Font faceName="" kind="Absolute"/>`,
    font: emptyFaceNameMinimalFont,
    yaml: emptyFaceNameMinimalFontYAML,
    preview: { Type: "Font", Name: "" },
  },
  {
    name: "prefixed faceName",
    xml: `<Font faceName="style:TooltipTitleFont" kind="Absolute"/>`,
    font: prefixedFaceNameFont,
    yaml: prefixedFaceNameFontYAML,
    preview: { Type: "Font", Name: "style:TooltipTitleFont" },
  },
  {
    name: "system minimal",
    xml: `<Font ref="sys:ANSIFixedFont" kind="WindowsFont"/>`,
    font: systemMinimalFont,
    yaml: systemMinimalFontYAML,
    preview: { Type: "Font", Value: "WindowsFonts.ANSIFixedFont" },
  },
  {
    name: "style minimal",
    xml: `<Font ref="style:ExtraLargeTextFont" kind="StyleItem"/>`,
    font: styleMinimalFont,
    yaml: styleMinimalFontYAML,
    preview: { Type: "Font", Value: "StyleFonts.ExtraLargeTextFont" },
  },
  {
    name: "unknown style minimal",
    xml: `<Font ref="style:TooltipTitleFont" kind="StyleItem"/>`,
    font: unknownStyleMinimalFont,
    yaml: unknownStyleMinimalFontYAML,
    preview: { Type: "Font", Value: "style:TooltipTitleFont" },
  },
  {
    name: "unknown style with faceName",
    xml: `<Font ref="style:TooltipTitleFont" faceName="Arial" kind="StyleItem"/>`,
    font: unknownStyleWithFaceNameFont,
    yaml: unknownStyleWithFaceNameFontYAML,
    preview: { Type: "Font", Value: "style:TooltipTitleFont", Name: "Arial" },
  },
  {
    name: "style full",
    xml: `<Font ref="style:LargeTextFont" faceName="Times New Roman" height="20" bold="true" italic="true" underline="true" strikeout="true" kind="StyleItem" scale="200"/>`,
    font: styleFullFont,
    yaml: styleFullFontYAML,
    preview: {
      Type: "Font",
      Value: "StyleFonts.LargeTextFont",
      Name: "Times New Roman",
      Scale: 200,
      Height: 20,
      Bold: true,
      Italic: true,
      Underline: true,
      Strikeout: true,
    },
  },
  {
    name: "normal full",
    xml: `<Font faceName="Times New Roman" height="20" bold="true" italic="true" underline="true" strikeout="true" kind="Absolute" scale="200"/>`,
    font: normalFullFont,
    yaml: normalFullFontYAML,
    preview: {
      Type: "Font",
      Name: "Times New Roman",
      Scale: 200,
      Height: 20,
      Bold: true,
      Italic: true,
      Underline: true,
      Strikeout: true,
    },
  },
  {
    name: "empty faceName full",
    xml: `<Font faceName="" height="12" bold="false" italic="false" underline="false" strikeout="false" kind="Absolute" scale="100"/>`,
    font: emptyFaceNameFullFont,
    yaml: emptyFaceNameFullFontYAML,
    preview: {
      Type: "Font",
      Name: "",
      Scale: 100,
      Height: 12,
      Bold: false,
      Italic: false,
      Underline: false,
      Strikeout: false,
    },
  },
  {
    name: "system full",
    xml: `<Font ref="sys:SystemFont" faceName="Times New Roman" height="20" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont" scale="200"/>`,
    font: systemFullFont,
    yaml: systemFullFontYAML,
    preview: {
      Type: "Font",
      Value: "WindowsFonts.SystemFont",
      Name: "Times New Roman",
      Scale: 200,
      Height: 20,
      Bold: true,
      Italic: true,
      Underline: true,
      Strikeout: true,
    },
  },
  {
    name: "WindowsFont without faceName",
    xml: `<Font ref="sys:DefaultGUIFont" bold="true" italic="false" underline="false" strikeout="false" kind="WindowsFont"/>`,
    font: {
      ref: "DefaultGUIFont",
      kind: "WindowsFont",
      bold: true,
      italic: false,
      underline: false,
      strikeout: false,
    },
    yaml: {
      Вид: "ШрифтДиалоговИМеню",
      Полужирный: "Истина",
      Наклонный: "Ложь",
      Подчеркивание: "Ложь",
      Зачеркивание: "Ложь",
    },
    preview: {
      Type: "Font",
      Value: "WindowsFonts.DefaultGUIFont",
      Bold: true,
      Italic: false,
      Underline: false,
      Strikeout: false,
    },
  },
]
