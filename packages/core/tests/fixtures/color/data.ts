import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"

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
