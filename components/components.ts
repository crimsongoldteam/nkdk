import {
  type TElementType,
  FormElementType,
} from "~/lib/metadata/forms/elements/types"
import { ButtonComponent } from "./button/button"
import { CheckBoxFieldComponent } from "./checkBoxField/checkBoxField"
import { InputField } from "./inputField/inputField"
import { LabelDecorationComponent } from "./labelDecoration/labelDecoration"
import { PagesComponent } from "./pages/pages"
import { PictureDecorationComponent } from "./pictureDecoration/pictureDecoration"
import { RadioButtonFieldComponent } from "./radioButtonField/radioButtonField"
import { TableComponent } from "./table/table"
import { UsualGroupComponent } from "./usualGroup/usualGroup"
import { CommandBarComponent } from "./commandBar/commandBar"
import { PageComponent } from "./pages/page"

export const components: Partial<
  Record<TElementType, React.ComponentType<any>>
> = {
  [FormElementType.InputField]: InputField,
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
