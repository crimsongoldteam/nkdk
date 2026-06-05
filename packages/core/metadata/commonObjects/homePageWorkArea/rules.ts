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
    xmlRoot: {
      type: "XMLRoot",
      container: "HomePageWorkArea",
      rootAttributes: homePageWorkAreaRootAttributes,
      forReferenceOnly: true,
      isFileRoot: true,
      toYAML: false,
      fromYAML: false,
    },
    workingAreaTemplate: {
      yaml: "ШаблонРабочейОбласти",
      xml: "WorkingAreaTemplate",
      type: "HomePageWorkAreaTemplate",
      order: 10,
    },
    column: {
      yaml: "Колонка",
      xml: "Column",
      type: "HomePageWorkAreaColumnItems",
      order: 20,
    },
    leftColumn: {
      yaml: "ЛеваяКолонка",
      xml: "LeftColumn",
      type: "HomePageWorkAreaColumnItems",
      order: 30,
    },
    rightColumn: {
      yaml: "ПраваяКолонка",
      xml: "RightColumn",
      type: "HomePageWorkAreaColumnItems",
      order: 40,
    },
    maCommandInterfaceDisplays: {
      yaml: "ОтображениеКомандногоИнтерфейса",
      xml: "MACommandInterfaceDisplays",
      type: "HomePageWorkAreaCommandInterfaceDisplay",
      order: 50,
    },
  },
} as const satisfies MetadataItemRule
