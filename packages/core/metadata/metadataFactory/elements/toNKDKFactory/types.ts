import {
  Button,
  CheckBoxField,
  CheckBoxFieldSwitch,
  CheckBoxFieldTumbler,
  ChildItem,
  CommandBar,
  CommandBarButton,
  CommandBarChildItem,
  CommandGroup,
  Form,
  Group,
  LabelDecoration,
  LabelField,
  NkdkAstType,
  OneLineGroupField,
  OtherField,
  Page,
  Pages,
  PictureDecoration,
  PictureField,
  Popup,
  Table,
  TableCheckbox,
  TableField,
  TableHorizontalGroup,
  TableInCellGroup,
  TableInputField,
  TableLabelField,
  TablePictureField,
  TableVerticalGroup,
} from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { AllChildItems } from "~/metadata/forms/commonObjects/childItems/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { importInputFieldFromNKDK } from "~/metadata/forms/elements/inputField/fromNKDK"

type ImportFromNKDKFnMap = {
  [AstType in keyof NkdkAstType]: (params: {
    context: ConfigurationContext
    source: NkdkAstType[AstType]
  })
}

export const importFromNKDKFn = {
  InputField: importInputFieldFromNKDK,
  Button: function (params: { context: ConfigurationContext; source: Button }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CheckBoxField: function (params: { context: ConfigurationContext; source: CheckBoxField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CheckBoxFieldSwitch: function (params: { context: ConfigurationContext; source: CheckBoxFieldSwitch }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CheckBoxFieldTumbler: function (params: {
    context: ConfigurationContext
    source: CheckBoxFieldTumbler
  }): BaseElement {
    throw new Error("Function not implemented.")
  },
  ChildItem: function (params: { context: ConfigurationContext; source: ChildItem }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CommandBar: function (params: { context: ConfigurationContext; source: CommandBar }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CommandBarButton: function (params: { context: ConfigurationContext; source: CommandBarButton }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CommandBarChildItem: function (params: { context: ConfigurationContext; source: CommandBarChildItem }): BaseElement {
    throw new Error("Function not implemented.")
  },
  CommandGroup: function (params: { context: ConfigurationContext; source: CommandGroup }): BaseElement {
    throw new Error("Function not implemented.")
  },
  Form: function (params: { context: ConfigurationContext; source: Form }): BaseElement {
    throw new Error("Function not implemented.")
  },
  Group: function (params: { context: ConfigurationContext; source: Group }): BaseElement {
    throw new Error("Function not implemented.")
  },
  LabelDecoration: function (params: { context: ConfigurationContext; source: LabelDecoration }): BaseElement {
    throw new Error("Function not implemented.")
  },
  LabelField: function (params: { context: ConfigurationContext; source: LabelField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  OneLineGroupField: function (params: { context: ConfigurationContext; source: OneLineGroupField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  OtherField: function (params: { context: ConfigurationContext; source: OtherField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  Page: function (params: { context: ConfigurationContext; source: Page }): BaseElement {
    throw new Error("Function not implemented.")
  },
  Pages: function (params: { context: ConfigurationContext; source: Pages }): BaseElement {
    throw new Error("Function not implemented.")
  },
  PictureDecoration: function (params: { context: ConfigurationContext; source: PictureDecoration }): BaseElement {
    throw new Error("Function not implemented.")
  },
  PictureField: function (params: { context: ConfigurationContext; source: PictureField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  Popup: function (params: { context: ConfigurationContext; source: Popup }): BaseElement {
    throw new Error("Function not implemented.")
  },
  Table: function (params: { context: ConfigurationContext; source: Table }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableCheckbox: function (params: { context: ConfigurationContext; source: TableCheckbox }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableField: function (params: { context: ConfigurationContext; source: TableField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableHorizontalGroup: function (params: {
    context: ConfigurationContext
    source: TableHorizontalGroup
  }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableInCellGroup: function (params: { context: ConfigurationContext; source: TableInCellGroup }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableInputField: function (params: { context: ConfigurationContext; source: TableInputField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableLabelField: function (params: { context: ConfigurationContext; source: TableLabelField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TablePictureField: function (params: { context: ConfigurationContext; source: TablePictureField }): BaseElement {
    throw new Error("Function not implemented.")
  },
  TableVerticalGroup: function (params: { context: ConfigurationContext; source: TableVerticalGroup }): BaseElement {
    throw new Error("Function not implemented.")
  },
} satisfies Partial<ImportFromNKDKFnMap>
