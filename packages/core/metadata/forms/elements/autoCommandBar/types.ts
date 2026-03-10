import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { AutoCommandBarRules } from "./rules"

export type AutoCommandBar = FormTypeByRule<typeof AutoCommandBarRules>

export interface AutoCommandBarYAML {
  Автозаполнение?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
}

export type AutoCommandBarEnterprise = EnterpriseType<typeof AutoCommandBarRules>
