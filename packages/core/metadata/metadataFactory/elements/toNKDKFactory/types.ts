import type {
  CheckBoxField,
  CommandBarChildItem,
  Group,
  LabelField,
  OneLineGroupField,
  OtherField,
  TableCheckbox,
  TableField,
  TableInputField,
  TableLabelField,
  TablePictureField,
} from "nkdk-language"
import { NkdkAstType } from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { importButtonFromNKDK, importCommandBarButtonFromNKDK } from "~/metadata/forms/elements/button/fromNKDK"
import { importCommandGroupFromNKDK } from "~/metadata/forms/elements/buttonGroup/fromNKDK"
import {
  importCheckBoxFieldFromNKDK,
  importCheckBoxFieldSwitchFromNKDK,
  importCheckBoxFieldTumblerFromNKDK,
} from "~/metadata/forms/elements/checkBoxField/fromNKDK"
import {
  importTableHorizontalGroupFromNKDK,
  importTableInCellGroupFromNKDK,
  importTableVerticalGroupFromNKDK,
} from "~/metadata/forms/elements/columnGroup/fromNKDK"
import { importCommandBarFromNKDK } from "~/metadata/forms/elements/commandBar/fromNKDK"
import { importInputFieldFromNKDK } from "~/metadata/forms/elements/inputField/fromNKDK"
import { importLabelDecorationFromNKDK } from "~/metadata/forms/elements/labelDecoration/fromNKDK"
import { importLabelFieldFromNKDK } from "~/metadata/forms/elements/labelField/fromNKDK"
import { importPageFromNKDK } from "~/metadata/forms/elements/page/fromNKDK"
import { importPagesFromNKDK } from "~/metadata/forms/elements/pages/fromNKDK"
import { importPictureDecorationFromNKDK } from "~/metadata/forms/elements/pictureDecoration/fromNKDK"
import { importPictureFieldFromNKDK } from "~/metadata/forms/elements/pictureField/fromNKDK"
import { importPopupFromNKDK } from "~/metadata/forms/elements/popup/fromNKDK"
import { importTableFromNKDK } from "~/metadata/forms/elements/table/fromNKDK"
import { importUsualGroupFromNKDK } from "~/metadata/forms/elements/usualGroup/fromNKDK"

type ImportFromNKDKFnMap = {
  [AstType in keyof NkdkAstType]: (params: {
    context: ConfigurationContext
    source: NkdkAstType[AstType]
  }) => BaseElement
}

export const importFromNKDKFn = {
  InputField: importInputFieldFromNKDK,
  Button: importButtonFromNKDK,
  CheckBoxField: importCheckBoxFieldFromNKDK,
  CheckBoxFieldSwitch: importCheckBoxFieldSwitchFromNKDK,
  CheckBoxFieldTumbler: importCheckBoxFieldTumblerFromNKDK,
  CommandBar: importCommandBarFromNKDK,
  CommandBarButton: importCommandBarButtonFromNKDK,
  CommandBarChildItem: (params: { context: ConfigurationContext; source: CommandBarChildItem }): BaseElement =>
    (importFromNKDKFn as ImportFromNKDKFnMap)[params.source.$type]({
      context: params.context,
      source: params.source as never,
    }),
  CommandGroup: importCommandGroupFromNKDK,
  Group: (params: { context: ConfigurationContext; source: Group }): BaseElement =>
    importUsualGroupFromNKDK({ context: params.context, source: params.source }),
  LabelDecoration: importLabelDecorationFromNKDK,
  LabelField: importLabelFieldFromNKDK,
  OneLineGroupField: (params: { context: ConfigurationContext; source: OneLineGroupField }): BaseElement =>
    (importFromNKDKFn as ImportFromNKDKFnMap)[params.source.$type]({
      context: params.context,
      source: params.source as never,
    }),
  OtherField: (params: { context: ConfigurationContext; source: OtherField }): BaseElement =>
    importLabelFieldFromNKDK({
      context: params.context,
      source: { name: params.source.name, title: params.source.type } as LabelField,
    }),
  Page: importPageFromNKDK,
  Pages: importPagesFromNKDK,
  PictureDecoration: importPictureDecorationFromNKDK,
  PictureField: importPictureFieldFromNKDK,
  Popup: importPopupFromNKDK,
  Table: importTableFromNKDK,
  TableCheckbox: (params: { context: ConfigurationContext; source: TableCheckbox }): BaseElement =>
    importCheckBoxFieldFromNKDK({
      context: params.context,
      source: { name: params.source.name, title: params.source.title } as CheckBoxField,
    }),
  TableField: (params: { context: ConfigurationContext; source: TableField }): BaseElement =>
    (importFromNKDKFn as ImportFromNKDKFnMap)[params.source.$type]({
      context: params.context,
      source: params.source as never,
    }),
  TableHorizontalGroup: importTableHorizontalGroupFromNKDK,
  TableInCellGroup: importTableInCellGroupFromNKDK,
  TableInputField: (params: { context: ConfigurationContext; source: TableInputField }): BaseElement =>
    importInputFieldFromNKDK({
      context: params.context,
      source: { name: params.source.name, title: params.source.title } as Parameters<
        typeof importInputFieldFromNKDK
      >[0]["source"],
    }),
  TableLabelField: (params: { context: ConfigurationContext; source: TableLabelField }): BaseElement =>
    importLabelFieldFromNKDK({
      context: params.context,
      source: { name: params.source.name, title: params.source.title } as LabelField,
    }),
  TablePictureField: (params: { context: ConfigurationContext; source: TablePictureField }): BaseElement =>
    importPictureFieldFromNKDK({
      context: params.context,
      source: { name: params.source.name, title: params.source.title } as Parameters<
        typeof importPictureFieldFromNKDK
      >[0]["source"],
    }),
  TableVerticalGroup: importTableVerticalGroupFromNKDK,
} satisfies Partial<ImportFromNKDKFnMap>
