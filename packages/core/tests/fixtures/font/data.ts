import { Font, FontEnterprise, FontPreview } from "~/metadata/commonObjects/font/types"

// #region normalMinimalFont

export const normalMinimalFont: Font = {
  faceName: "Academy Engraved LET",
  kind: "Absolute",
}

export const normalMinimalFontEnterprise: FontEnterprise = "Academy Engraved LET"

// #endregion

// #region systemMinimalFont

export const systemMinimalFont: Font = {
  ref: "ANSIFixedFont",
  kind: "WindowsFont",
}

export const systemMinimalFontEnterprise: FontEnterprise = "ANSIШрифтМоноширинный"

// #endregion

// #region styleMinimalFont

export const styleMinimalFont: Font = {
  ref: "ExtraLargeTextFont",
  kind: "StyleItem",
}

export const styleMinimalFontEnterprise: FontEnterprise = "ОченьКрупныйШрифтТекста"

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

export const styleFullFontEnterprise: FontEnterprise = {
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

export const normalFullFontEnterprise: FontEnterprise = {
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

export const systemFullFontEnterprise: FontEnterprise = {
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

interface FontEnterpriseFixture {
  name: string
  xml: string
  font: Font
  enterprise: FontEnterprise
  preview: FontPreview
}

export const fontEnterpriseFixtures: FontEnterpriseFixture[] = [
  {
    name: "faceName",
    xml: `<Font faceName="Academy Engraved LET" kind="Absolute"/>`,
    font: normalMinimalFont,
    enterprise: normalMinimalFontEnterprise,
  },
  {
    name: "system minimal",
    xml: `<Font ref="sys:ANSIFixedFont" kind="WindowsFont"/>`,
    font: systemMinimalFont,
    enterprise: systemMinimalFontEnterprise,
  },
  {
    name: "style minimal",
    xml: `<Font ref="style:ExtraLargeTextFont" kind="StyleItem"/>`,
    font: styleMinimalFont,
    enterprise: styleMinimalFontEnterprise,
  },
  {
    name: "style full",
    xml: `<Font ref="style:LargeTextFont" faceName="Times New Roman" height="20" bold="true" italic="true" underline="true" strikeout="true" kind="StyleItem" scale="200"/>`,
    font: styleFullFont,
    enterprise: styleFullFontEnterprise,
  },
  {
    name: "normal full",
    xml: `<Font faceName="Times New Roman" height="20" bold="true" italic="true" underline="true" strikeout="true" kind="Absolute" scale="200"/>`,
    font: normalFullFont,
    enterprise: normalFullFontEnterprise,
  },
  {
    name: "system full",
    xml: `<Font ref="sys:SystemFont" faceName="Times New Roman" height="20" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont" scale="200"/>`,
    font: systemFullFont,
    enterprise: systemFullFontEnterprise,
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
    enterprise: {
      Вид: "ШрифтДиалоговИМеню",
      Полужирный: "Истина",
      Наклонный: "Ложь",
      Подчеркивание: "Ложь",
      Зачеркивание: "Ложь",
    },
  },
]
