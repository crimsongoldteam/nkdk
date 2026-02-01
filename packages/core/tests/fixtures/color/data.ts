import { Color, ColorEnterprise, ColorPreview } from "~/metadata/commonObjects/color/types"

export interface ColorTestCase {
  name: string
  color: Color
  colorEnterprise: ColorEnterprise
  enterpriseExpected: ColorEnterprise
  fixture: string | undefined
}

export const colorTestCases: readonly ColorTestCase[] = [
  {
    name: "absolute color",
    color: {
      type: "Absolute",
      value: "#C3C0C3",
    } as Color,
    colorEnterprise: "#C3C0C3" as ColorEnterprise,
    enterpriseExpected: "#C3C0C3" as ColorEnterprise,
    fixture: "color/absolute.xml",
  },
  {
    name: "Windows color",
    color: {
      type: "WindowsColor",
      value: "ButtonLightShadow",
    } as Color,
    colorEnterprise: "ТеньКнопкиСветлая" as ColorEnterprise,
    enterpriseExpected: "ТеньКнопкиСветлая" as ColorEnterprise,
    fixture: "color/win.xml",
  },
  {
    name: "Web color",
    color: {
      type: "WebColor",
      value: "AliceBlue",
    } as Color,
    colorEnterprise: "АкварельноСиний" as ColorEnterprise,
    enterpriseExpected: "АкварельноСиний" as ColorEnterprise,
    fixture: "color/web.xml",
  },
  {
    name: "style color",
    color: {
      type: "StyleItem",
      value: "SpecialTextColor",
    } as Color,
    colorEnterprise: "ЦветОсобогоТекста" as ColorEnterprise,
    enterpriseExpected: "ЦветОсобогоТекста" as ColorEnterprise,
    fixture: "color/style.xml",
  },
  {
    name: "custom style color",
    color: {
      type: "StyleItem",
      value: "ПоясняющийТекст",
    } as Color,
    colorEnterprise: "ЭлементСтиля.ПоясняющийТекст" as ColorEnterprise,
    enterpriseExpected: "ЭлементСтиля.ПоясняющийТекст" as ColorEnterprise,
    fixture: "color/customStyle.xml",
  },
] as const
export interface ColorPreviewTestCase {
  name: string
  color: Color | undefined
  expected: ColorPreview | undefined
}

export const colorPreviewTestCases: readonly ColorPreviewTestCase[] = [
  {
    name: "undefined color returns undefined",
    color: undefined,
    expected: undefined,
  },
  {
    name: "WebColor with hex value",
    color: { type: "WebColor" as const, value: "#FF0000" },
    expected: { Type: "AbsoluteColor", Red: "255", Green: "0", Blue: "0" },
  },
  {
    name: "WindowsColor",
    color: { type: "WindowsColor" as const, value: "ActiveBorder" },
    expected: { Type: "Color" as const, Value: "WindowsColors.ActiveBorder" },
  },
  {
    name: "StyleItem",
    color: { type: "StyleItem" as const, value: "MyStyleItem" },
    expected: { Type: "Color" as const, Value: "StyleItems.MyStyleItem" },
  },
] as const
