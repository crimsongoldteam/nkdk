import { FormElementType } from "~/lib/metadata/metadataFactory/types"
import { ButtonComponent } from "./button/button"
import { CheckBoxFieldComponent } from "./checkBoxField/checkBoxField"
import { CommandBarComponent } from "./commandBar/commandBar"
import { InputFieldComponent } from "./inputField/inputField"
import { LabelDecorationComponent } from "./labelDecoration/labelDecoration"
import { PageComponent } from "./pages/page"
import { PagesComponent } from "./pages/pages"
import { PictureDecorationComponent } from "./pictureDecoration/pictureDecoration"
import { RadioButtonFieldComponent } from "./radioButtonField/radioButtonField"
import { TableComponent } from "./table/table"
import { UsualGroupComponent } from "./usualGroup/usualGroup"

type FormElementTypeValue = (typeof FormElementType)[keyof typeof FormElementType]

export const components: Partial<Record<FormElementTypeValue, React.ComponentType<any>>> = {
  [FormElementType.InputField]: InputFieldComponent,
  [FormElementType.Button]: ButtonComponent,
  [FormElementType.Pages]: PagesComponent,
  [FormElementType.CheckBoxField]: CheckBoxFieldComponent,
  [FormElementType.LabelDecoration]: LabelDecorationComponent,
  [FormElementType.PictureDecoration]: PictureDecorationComponent,
  [FormElementType.Table]: TableComponent,
  [FormElementType.RadioButtonField]: RadioButtonFieldComponent,
  [FormElementType.CommandBar]: CommandBarComponent,
  [FormElementType.Page]: PageComponent,
  [FormElementType.UsualGroup]: UsualGroupComponent,
}
