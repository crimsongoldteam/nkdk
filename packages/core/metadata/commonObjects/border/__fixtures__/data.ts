import { Border, BorderEnterprise, BorderYAML } from "~/metadata/commonObjects/border/types"

export interface BorderTestCase {
  name: string
  border: Border
  preview: BorderEnterprise
  xml?: string
  yaml?: BorderYAML
}

export const borderTestCases: readonly BorderTestCase[] = [
  {
    name: "empty border",
    border: {},
    preview: { Type: "Border" },
  },
  {
    name: "border by style ref",
    border: { ref: "TestBorder" },
    preview: { Type: "Border" },
    xml: `<Border ref="style:TestBorder"/>`,
    yaml: { Имя: "ЭлементСтиля.TestBorder" },
  },
  {
    name: "border with width only",
    border: { width: 2 },
    preview: { Type: "Border", Width: 2 },
  },
  {
    name: "border with controlBorderType only",
    border: { controlBorderType: "Single" },
    preview: { Type: "Border", Value: "ControlBorderType.Single" },
  },
  {
    name: "border with width and controlBorderType",
    border: { width: 1, controlBorderType: "Indented" },
    preview: { Type: "Border", Width: 1, Value: "ControlBorderType.Indented" },
  },
  {
    name: "border WithoutBorder",
    border: { controlBorderType: "WithoutBorder" },
    preview: { Type: "Border", Value: "ControlBorderType.WithoutBorder" },
  },
] as const
