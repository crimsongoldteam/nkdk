import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { CommandBarChildItems } from "../../commonObjects/childItems/types"
import { BaseElement } from "../baseElement/types"
import { AutoCommandBarRules } from "./rules"

export interface AutoCommandBar extends BaseElement {
  itemType: "AutoCommandBar"
  autofill: boolean
  displayImportance?: SE.DisplayImportance
  horizontalAlign?: SE.ItemHorizontalLocation
  childItems: CommandBarChildItems
}

export interface AutoCommandBarYAML {
  Автозаполнение?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
}

export type AutoCommandBarEnterprise = EnterpriseType<typeof AutoCommandBarRules>
