import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ChoiceParameters, ChoiceParametersEnterprise } from "~/metadata/commonObjects/сhoiceParameters/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ClientApplicationForm, ClientApplicationFormEnterprise } from "../base/types"

export interface CatalogForm extends Omit<ClientApplicationForm, "itemType" | "events"> {
  itemType: "CatalogForm"
  choiceAvailable?: boolean
  useForFoldersAndItems?: SE.FoldersAndItemsUse
  choiceParameters?: ChoiceParameters
  choiceMode?: SE.ChoiceMode
  events?: {
    ...ClientApplicationForm["events"],
    valueChoice?: string
    beforeWrite?: string
    beforeWriteAtServer?: string
    afterWrite?: string
    afterWriteAtServer?: string
    onWriteAtServer?: string
    onReadAtServer?: string
  }
}

export interface CatalogFormEnterprise extends ClientApplicationFormEnterprise {
  ВыборДоступен?: StringboolEnterprise
  ИспользованиеДляГруппИЭлементов?: SE.FoldersAndItemsUseEnterprise
  ПараметрыВыбора?: ChoiceParametersEnterprise
  РежимВыбора?: SE.ChoiceModeEnterprise
  События?: ClientApplicationFormEnterprise["События"] & {
    ВыборЗначения?: string
    ПередЗаписью?: string
    ПередЗаписьюНаСервере?: string
    ПослеЗаписи?: string
    ПослеЗаписиНаСервере?: string
    ПриЗаписиНаСервере?: string
    ПриЧтенииНаСервере?: string
  }
}
