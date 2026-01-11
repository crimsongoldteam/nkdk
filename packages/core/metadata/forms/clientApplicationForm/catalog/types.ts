import { ChoiceParameters } from "~/metadata/commonObjects/сhoiceParameters/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ClientApplicationForm } from "../base/types"

// ВыборДоступен (ChoiceAvailable)
// ИспользованиеДляГруппИЭлементов (UseForFoldersAndItems)
// ПараметрыВыбора (ChoiceParameters)
// РежимВыбора (ChoiceMode)
export interface CatalogForm extends ClientApplicationForm {
  choiceAvailable?: boolean
  useForFoldersAndItems?: SE.FoldersAndItemsUse
  choiceParameters?: ChoiceParameters
  choiceMode?: SE.ChoiceMode
}
