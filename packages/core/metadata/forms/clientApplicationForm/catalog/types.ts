import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ChoiceParameters, ChoiceParametersEnterprise, ChoiceParametersXML } from "~/metadata/commonObjects/сhoiceParameters/types"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormEvents,
  ClientApplicationFormXML,
} from "../base/types"

export interface CatalogFormEvents extends ClientApplicationFormEvents {
  valueChoice?: string
  beforeWrite?: string
  beforeWriteAtServer?: string
  afterWrite?: string
  afterWriteAtServer?: string
  onWriteAtServer?: string
  onReadAtServer?: string
}

export interface CatalogForm extends ClientApplicationForm {
  choiceAvailable?: boolean
  useForFoldersAndItems?: SE.FoldersAndItemsUse
  choiceParameters?: ChoiceParameters
  choiceMode?: SE.ChoiceMode
  events?: CatalogFormEvents
}

export interface CatalogFormXML extends ClientApplicationFormXML {
  ChoiceAvailable?: boolean
  UseForFoldersAndItems?: SE.FoldersAndItemsUse
  ChoiceParameters?: ChoiceParametersXML
  ChoiceMode?: SE.ChoiceMode
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
