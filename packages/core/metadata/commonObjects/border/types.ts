import * as SE from "~/metadata/systemEnumerations/types"

export interface Border {
  ref?: string
  width?: number
  controlBorderType?: SE.ControlBorderType
}

export interface BorderStyleObject {
  "#text"?: string
  "_xsi:type"?: string
}

export interface BorderXML {
  _ref?: string
  _width?: number
  "v8ui:style"?: string | BorderStyleObject
}

export interface BorderYAML {
  Имя?: string
  Ширина?: number
  ТипРамки?: SE.ControlBorderTypeYAML
}

export interface BorderEnterprise {
  type: "border"
  width?: number
  borderType?: string
}
