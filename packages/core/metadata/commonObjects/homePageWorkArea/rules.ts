import {
  homePageWorkAreaColumnItemsRule,
  homePageWorkAreaCommandInterfaceDisplayRule,
  homePageWorkAreaTemplateRule,
} from "./builders"
import { xmlRootRule } from "../xmlRoot/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
const homePageWorkAreaRootAttributes = {
  _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  _version: "2.20",
}
export const HomePageWorkAreaRules = {
  itemType: "HomePageWorkArea",
  xmlOrder: [
    "workingAreaTemplate",
    "leftColumn",
    "rightColumn",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "HomePageWorkArea",
      rootAttributes: homePageWorkAreaRootAttributes,
      forReferenceOnly: true,
      isFileRoot: true,
      toYAML: false,
      fromYAML: false,
    }),
    workingAreaTemplate: homePageWorkAreaTemplateRule({
      yaml: "ШаблонРабочейОбласти",
      xml: "WorkingAreaTemplate",
    }),
    column: homePageWorkAreaColumnItemsRule({
      yaml: "Колонка",
      xml: "Column",
    }),
    leftColumn: homePageWorkAreaColumnItemsRule({
      yaml: "ЛеваяКолонка",
      xml: "LeftColumn",
    }),
    rightColumn: homePageWorkAreaColumnItemsRule({
      yaml: "ПраваяКолонка",
      xml: "RightColumn",
    }),
    maCommandInterfaceDisplays: homePageWorkAreaCommandInterfaceDisplayRule({
      yaml: "ОтображениеКомандногоИнтерфейса",
      xml: "MACommandInterfaceDisplays",
    }),
  },
} as const satisfies MetadataItemRule
