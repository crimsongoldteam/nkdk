import {
  homePageWorkAreaColumnItemsRule,
  homePageWorkAreaCommandInterfaceDisplayRule,
  homePageWorkAreaTemplateRule,
} from "~/metadata/commonObjects/homePageWorkArea/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const homePageWorkAreaRootAttributes = {
  _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  _version: "2.20",
}
export const HomePageWorkAreaRules = {
  itemType: "HomePageWorkArea",
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
      order: 10,
    }),
    column: homePageWorkAreaColumnItemsRule({
      yaml: "Колонка",
      xml: "Column",
      order: 20,
    }),
    leftColumn: homePageWorkAreaColumnItemsRule({
      yaml: "ЛеваяКолонка",
      xml: "LeftColumn",
      order: 30,
    }),
    rightColumn: homePageWorkAreaColumnItemsRule({
      yaml: "ПраваяКолонка",
      xml: "RightColumn",
      order: 40,
    }),
    maCommandInterfaceDisplays: homePageWorkAreaCommandInterfaceDisplayRule({
      yaml: "ОтображениеКомандногоИнтерфейса",
      xml: "MACommandInterfaceDisplays",
      order: 50,
    }),
  },
} as const satisfies MetadataItemRule
