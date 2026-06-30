import { dcsLocalStringTypeRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types"
import { orderItemFieldsRule } from "~/metadata/commonObjects/dataCompositionSystem/order/builders"
import { userSettingsIDRule } from "~/metadata/commonObjects/userSettingsID/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const OrderRules = {
  itemType: "Order",
  properties: {
    items: orderItemFieldsRule({
      xml: "dcsset:item",
      yaml: "Элементы",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
    }),
    userSettingID: userSettingsIDRule({
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
    }),
    userSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    }),
  },
} as const satisfies MetadataItemRule
