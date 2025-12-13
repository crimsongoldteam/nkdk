import { Color, ColorXML, ColorEnterprise } from "~/lib/metadata/commonObjects/color/types";
import { I8nText, I8nTextXML, I8nTextEnterprise } from "~/lib/metadata/commonObjects/i8nText/types";
import { Picture, PictureXML, PictureEnterprise } from "~/lib/metadata/commonObjects/pictures/types";
import { UserVisible, UserVisibleXML, UserVisibleEnterprise } from "~/lib/metadata/commonObjects/userVisible/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { FormGroup, FormGroupXML, FormGroupEnterprise } from "../formGroup/types";
import { Table, TableXML, TableEnterprise } from "../table/types";
import { CommandBar, CommandBarXML, CommandBarEnterprise } from "../commandBar/types";
import { BaseElement, BaseElementXML, BaseElementEnterprise } from "../baseElement/types";
import { Font, FontXML, FontEnterprise } from "~/lib/metadata/commonObjects/font/types";
import { TypeDescription, TypeDescriptionXML, TypeDescriptionEnterprise } from "~/lib/metadata/commonObjects/typeDescription/types";
import { Border, BorderXML, BorderEnterprise } from "~/lib/metadata/commonObjects/border/types";
import { FormField, FormFieldXML, FormFieldEnterprise } from "../formField/types";
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { ChoiceList, ChoiceListXML, ChoiceListEnterprise } from "~/lib/metadata/commonObjects/choiceList/types"
import { FormItemAddition, FormItemAdditionXML, FormItemAdditionEnterprise } from "../formItemAddition/types"
import { TypeLink, TypeLinkXML, TypeLinkEnterprise } from "~/lib/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinksEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { SearchStringAddition, SearchStringAdditionXML, SearchStringAdditionEnterprise } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionXML, ViewStatusAdditionEnterprise } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { SearchControlAddition, SearchControlAdditionXML, SearchControlAdditionEnterprise } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { CommandSet, CommandSetXML, CommandSetEnterprise } from "~/lib/metadata/forms/commandSet/types"
import { EventsXML } from "~/lib/metadata/forms/events/types";
import { ChildItems, ChildItemsXML } from "../childItems/types";


export interface Button extends BaseElement {

  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  backColor?: Color,
  borderColor?: Color,
  commandName?: string,
  commandUniqueness?: boolean,
  dataPath?: string,
  defaultButton?: boolean,
  defaultItem?: boolean,
  displayImportance?: SE.DisplayImportance,
  enabled?: boolean,
  extendedTooltip?: FormDecoration,
  font?: Font,
  height?: number,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  horizontalStretch?: boolean,
  locationInCommandBar?: SE.ButtonLocationInCommandBar,
  maxHeight?: number,
  maxWidth?: number,
  onlyInAllActions?: boolean,
  picture?: Picture,
  pictureLocation?: SE.FormButtonPictureLocation,
  representation?: SE.ButtonRepresentation,
  shape?: SE.ButtonShape,
  shapeRepresentation?: SE.ButtonShapeRepresentation,
  shortcut?: string,
  skipOnInput?: boolean,
  textColor?: Color,
  title?: I8nText,
  titleHeight?: number,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormButtonType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  verticalStretch?: boolean,
  visible?: boolean,
  width?: number,
}

export interface ButtonXML extends BaseElementXML {
  
  AutoMaxHeight?: boolean,
  AutoMaxWidth?: boolean,
  BackColor?: ColorXML,
  BorderColor?: ColorXML,
  CommandName?: string,
  CommandUniqueness?: boolean,
  DataPath?: string,
  DefaultButton?: boolean,
  DefaultItem?: boolean,
  _DisplayImportance?: SE.DisplayImportance,
  Enabled?: boolean,
  ExtendedTooltip?: FormDecorationXML,
  Font?: FontXML,
  Height?: number,
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation,
  HorizontalStretch?: boolean,
  LocationInCommandBar?: SE.ButtonLocationInCommandBar,
  MaxHeight?: number,
  MaxWidth?: number,
  OnlyInAllActions?: boolean,
  Picture?: PictureXML,
  PictureLocation?: SE.FormButtonPictureLocation,
  Representation?: SE.ButtonRepresentation,
  Shape?: SE.ButtonShape,
  ShapeRepresentation?: SE.ButtonShapeRepresentation,
  Shortcut?: string,
  SkipOnInput?: boolean,
  TextColor?: ColorXML,
  Title?: I8nTextXML,
  TitleHeight?: number,
  ToolTipRepresentation?: SE.ToolTipRepresentation,
  Type?: SE.FormButtonType,
  UserVisible?: UserVisibleXML,
  VerticalAlignInGroup?: SE.ItemVerticalAlign,
  VerticalStretch?: boolean,
  Visible?: boolean,
  Width?: number,
}

export interface ButtonEnterprise extends BaseElementEnterprise {
  АвтоМаксимальнаяВысота?: boolean,
  АвтоМаксимальнаяШирина?: boolean,
  ЦветФона?: ColorEnterprise,
  ЦветРамки?: ColorEnterprise,
  ИмяКоманды?: string,
  УникальностьКоманды?: boolean,
  ПутьКДанным?: string,
  КнопкаПоУмолчанию?: boolean,
  АктивизироватьПоУмолчанию?: boolean,
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise,
  Доступность?: boolean,
  РасширеннаяПодсказка?: FormDecorationEnterprise,
  Шрифт?: FontEnterprise,
  Высота?: number,
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise,
  РастягиватьПоГоризонтали?: boolean,
  ПоложениеВКоманднойПанели?: SE.ButtonLocationInCommandBarEnterprise,
  МаксимальнаяВысота?: number,
  МаксимальнаяШирина?: number,
  ТолькоВоВсехДействиях?: boolean,
  Картинка?: PictureEnterprise,
  ПоложениеКартинки?: SE.FormButtonPictureLocationEnterprise,
  Отображение?: SE.ButtonRepresentationEnterprise,
  Фигура?: SE.ButtonShapeEnterprise,
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise,
  СочетаниеКлавиш?: string,
  ПропускатьПриВводе?: boolean,
  ЦветТекста?: ColorEnterprise,
  Заголовок?: I8nTextEnterprise,
  ВысотаЗаголовка?: number,
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise,
  Вид?: SE.FormButtonTypeEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise,
  РастягиватьПоВертикали?: boolean,
  Видимость?: boolean,
  Ширина?: number,
}