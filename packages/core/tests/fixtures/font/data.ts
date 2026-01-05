import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"

// #region normalMinimalFont

export const normalMinimalFont: Font = {
  ref: "NormalTextFont",
  faceName: "Academy Engraved LET",
  kind: "StyleItem",
  scale: 100,
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
