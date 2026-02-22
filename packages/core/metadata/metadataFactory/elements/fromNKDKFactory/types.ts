import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { importButtonFromNKDK, importCommandBarButtonFromNKDK } from "~/metadata/forms/elements/button/fromNKDK"
import { importCommandGroupFromNKDK } from "~/metadata/forms/elements/buttonGroup/fromNKDK"
import {
  importCheckBoxFieldFromNKDK,
  importCheckBoxFieldRightTitledFromNKDK,
  importCheckBoxFieldSwitchFromNKDK,
  importCheckBoxFieldSwitchRightTitledFromNKDK,
  importCheckBoxFieldTumblerFromNKDK,
  importCheckBoxFieldTumblerRightTitledFromNKDK,
  importTableCheckboxFromNKDK,
} from "~/metadata/forms/elements/checkBoxField/fromNKDK"
import {
  importTableHorizontalGroupFromNKDK,
  importTableInCellGroupFromNKDK,
  importTableVerticalGroupFromNKDK,
} from "~/metadata/forms/elements/columnGroup/fromNKDK"
import { importCommandBarFromNKDK } from "~/metadata/forms/elements/commandBar/fromNKDK"
import { importInputFieldFromNKDK, importTableInputFieldFromNKDK } from "~/metadata/forms/elements/inputField/fromNKDK"
import { importLabelDecorationFromNKDK } from "~/metadata/forms/elements/labelDecoration/fromNKDK"
import {
  importLabelFieldFromNKDK,
  importOtherFieldFromNKDK,
  importTableLabelFieldFromNKDK,
} from "~/metadata/forms/elements/labelField/fromNKDK"
import { importPageFromNKDK } from "~/metadata/forms/elements/page/fromNKDK"
import { importPagesFromNKDK } from "~/metadata/forms/elements/pages/fromNKDK"
import { importPictureDecorationFromNKDK } from "~/metadata/forms/elements/pictureDecoration/fromNKDK"
import {
  importPictureFieldFromNKDK,
  importTablePictureFieldFromNKDK,
} from "~/metadata/forms/elements/pictureField/fromNKDK"
import { importPopupFromNKDK } from "~/metadata/forms/elements/popup/fromNKDK"
import { importTableFromNKDK } from "~/metadata/forms/elements/table/fromNKDK"
import { importUsualGroupFromNKDK } from "~/metadata/forms/elements/usualGroup/fromNKDK"

export type NkdkChildItem = NKDK.ChildItem | NKDK.CommandBarChildItem | NKDK.TableField | NKDK.Page

export type ImportFromNKDKFnMap = {
  [Item in NkdkChildItem as Item extends { $type: infer AstType } ? AstType : never]: (params: {
    context: ConfigurationContext
    source: Item
  }) => BaseElement
}

type ImportFromNKDKFn = typeof importFromNKDKFn
type ImportFromNKDKResultMap = {
  [K in keyof ImportFromNKDKFn]: ReturnType<ImportFromNKDKFn[K]>
}
export type FromNKDKResult<NkdkItem extends NkdkChildItem> = NkdkItem extends {
  $type: infer AstType extends keyof ImportFromNKDKFn
}
  ? ImportFromNKDKResultMap[AstType]
  : never

export const importFromNKDKFn = {
  InputField: importInputFieldFromNKDK,
  Button: importButtonFromNKDK,
  CheckBoxField: importCheckBoxFieldFromNKDK,
  CheckBoxFieldRightTitled: importCheckBoxFieldRightTitledFromNKDK,
  CheckBoxFieldSwitch: importCheckBoxFieldSwitchFromNKDK,
  CheckBoxFieldSwitchRightTitled: importCheckBoxFieldSwitchRightTitledFromNKDK,
  CheckBoxFieldTumbler: importCheckBoxFieldTumblerFromNKDK,
  CheckBoxFieldTumblerRightTitled: importCheckBoxFieldTumblerRightTitledFromNKDK,
  CommandBar: importCommandBarFromNKDK,
  CommandBarButton: importCommandBarButtonFromNKDK,
  CommandGroup: importCommandGroupFromNKDK,
  Group: importUsualGroupFromNKDK,
  LabelDecoration: importLabelDecorationFromNKDK,
  LabelField: importLabelFieldFromNKDK,
  OtherField: importOtherFieldFromNKDK,
  Page: importPageFromNKDK,
  Pages: importPagesFromNKDK,
  PictureDecoration: importPictureDecorationFromNKDK,
  PictureField: importPictureFieldFromNKDK,
  Popup: importPopupFromNKDK,
  Table: importTableFromNKDK,
  TableCheckbox: importTableCheckboxFromNKDK,
  TableHorizontalGroup: importTableHorizontalGroupFromNKDK,
  TableInCellGroup: importTableInCellGroupFromNKDK,
  TableInputField: importTableInputFieldFromNKDK,
  TableLabelField: importTableLabelFieldFromNKDK,
  TablePictureField: importTablePictureFieldFromNKDK,
  TableVerticalGroup: importTableVerticalGroupFromNKDK,
} satisfies Required<ImportFromNKDKFnMap>
