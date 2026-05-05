import { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface UserSettingPresentationPropertyRule extends Omit<BasePropertyRule, "type"> {
  type: "UserSettingPresentation"
}
