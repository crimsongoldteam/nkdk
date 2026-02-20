import { ClientApplicationFormRule } from "~/metadata/metadataFactory/form/types"
import { ClientApplicationFormRules } from "../base/rules"
import { FormRulesTags } from "../base/types"
import { CatalogForm } from "./types"

export const CatalogFormRules: ClientApplicationFormRule<CatalogForm> = {
  tags: ClientApplicationFormRules.tags,
  properties: {
    ...ClientApplicationFormRules.properties,
    // #region CatalogForm
    choiceAvailable: {
      yaml: "ВыборДоступен",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    useForFoldersAndItems: {
      yaml: "ИспользованиеДляГруппИЭлементов",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      tag: FormRulesTags.Form,
    },
    choiceParameters: {
      yaml: "ПараметрыВыбора",
      type: "ChoiceParameters",
      tag: FormRulesTags.Form,
    },
    choiceMode: {
      yaml: "РежимВыбора",
      type: "SystemEnumeration",
      typeSE: "ChoiceMode",
      tag: FormRulesTags.Form,
    },
    // #endregion
  },
  events: {
    ...ClientApplicationFormRules.events,
    valueChoice: "ВыборЗначения",
    beforeWrite: "ПередЗаписью",
    beforeWriteAtServer: "ПередЗаписьюНаСервере",
    afterWrite: "ПослеЗаписи",
    afterWriteAtServer: "ПослеЗаписиНаСервере",
    onWriteAtServer: "ПриЗаписиНаСервере",
    onReadAtServer: "ПриЧтенииНаСервере",
  },
}
