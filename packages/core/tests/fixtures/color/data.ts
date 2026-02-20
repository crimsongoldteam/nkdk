import { Color, ColorPreview, ColorYAML } from "~/metadata/commonObjects/color/types"

export interface ColorTestCase {
  name: string
  color: Color
  colorYAML: ColorYAML
  expectedYAML: ColorYAML
  fixture: string | undefined
}

export const colorTestCases: readonly ColorTestCase[] = [
  {
    name: "absolute color",
    color: {
      type: "Absolute",
      value: "#C3C0C3",
    } as Color,
    colorYAML: "#C3C0C3" as ColorYAML,
    expectedYAML: "#C3C0C3" as ColorYAML,
    fixture: "color/absolute.xml",
  },
  {
    name: "Windows color",
    color: {
      type: "WindowsColor",
      value: "ButtonLightShadow",
    } as Color,
    colorYAML: "ТеньКнопкиСветлая" as ColorYAML,
    expectedYAML: "ТеньКнопкиСветлая" as ColorYAML,
    fixture: "color/win.xml",
  },
  {
    name: "Web color",
    color: {
      type: "WebColor",
      value: "AliceBlue",
    } as Color,
    colorYAML: "АкварельноСиний" as ColorYAML,
    expectedYAML: "АкварельноСиний" as ColorYAML,
    fixture: "color/web.xml",
  },
  {
    name: "style color",
    color: {
      type: "StyleItem",
      value: "SpecialTextColor",
    } as Color,
    colorYAML: "ЦветОсобогоТекста" as ColorYAML,
    expectedYAML: "ЦветОсобогоТекста" as ColorYAML,
    fixture: "color/style.xml",
  },
  {
    name: "custom style color",
    color: {
      type: "StyleItem",
      value: "ПоясняющийТекст",
    } as Color,
    colorYAML: "ЭлементСтиля.ПоясняющийТекст" as ColorYAML,
    expectedYAML: "ЭлементСтиля.ПоясняющийТекст" as ColorYAML,
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
    expected: { Type: "AbsoluteColor", Red: 255, Green: 0, Blue: 0 },
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
