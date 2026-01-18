import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
  CheckBoxFieldXML,
} from "../../elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
  ColumnGroupXML,
} from "../../elements/columnGroup/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
  InputFieldXML,
} from "../../elements/inputField/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
  LabelFieldXML,
} from "../../elements/labelField/types"

export type TableChildItem = CheckBoxField | ColumnGroup | InputField | LabelField

export type TableChildItems = TableChildItem[]

export type TableChildItemXML = CheckBoxFieldXML | ColumnGroupXML | InputFieldXML | LabelFieldXML

export type TableChildItemRecordXML = Record<FormElementType, TableChildItemXML>
export type TableChildItemsXML = TableChildItemRecordXML | TableChildItemRecordXML[]

export type TableChildItemPartialEnterprise =
  | CheckBoxFieldPartialEnterprise
  | ColumnGroupPartialEnterprise
  | InputFieldPartialEnterprise
  | LabelFieldPartialEnterprise

export type TableChildItemTypedEnterprise =
  | CheckBoxFieldTypedEnterprise
  | ColumnGroupTypedEnterprise
  | InputFieldTypedEnterprise
  | LabelFieldTypedEnterprise

export type TableChildItemsPartialEnterprise = Record<string, TableChildItemPartialEnterprise>
export type TableChildItemsEnterprise = Record<string, TableChildItemTypedEnterprise>
