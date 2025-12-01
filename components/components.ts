import {
  type TElementType,
  ZElementType,
} from "~/lib/metadata/forms/elements/types"
import { ButtonComponent } from "./button/button"
import { CheckBoxFieldComponent } from "./checkBoxField/checkBoxField"
import { InputField } from "./inputField/inputField"
import { LabelDecorationComponent } from "./labelDecoration/labelDecoration"
import { PagesComponent } from "./pages/pages"
import { PictureDecorationComponent } from "./pictureDecoration/pictureDecoration"
import { RadioButtonFieldComponent } from "./radioButtonField/radioButtonField"
import { TableComponent } from "./table/table"
import { UsualGroup } from "./usualGroup/usualGroup"
import { CommandBarComponent } from "./commandBar/commandBar"

export const components: Partial<
  Record<TElementType, React.ComponentType<any>>
> = {
  [ZElementType.enum.InputField]: InputField,
  [ZElementType.enum.UsualGroup]: UsualGroup,
  [ZElementType.enum.Button]: ButtonComponent,
  [ZElementType.enum.Pages]: PagesComponent,
  [ZElementType.enum.CheckBoxField]: CheckBoxFieldComponent,
  [ZElementType.enum.LabelDecoration]: LabelDecorationComponent,
  [ZElementType.enum.PictureDecoration]: PictureDecorationComponent,
  [ZElementType.enum.Table]: TableComponent,
  [ZElementType.enum.RadioButtonField]: RadioButtonFieldComponent,
  [ZElementType.enum.CommandBar]: CommandBarComponent,
}
