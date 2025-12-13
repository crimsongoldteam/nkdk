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


export interface PdfDocumentField extends FormField {

  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  borderColor?: Color,
  currentPageNumber?: number,
  height?: number,
  horizontalStretch?: boolean,
  maxHeight?: number,
  maxWidth?: number,
  orientation?: number,
  output?: SE.UseOutput,
  scale?: number,
  usedFileName?: string,
  userVisible?: UserVisible,
  verticalStretch?: boolean,
  viewStatusLocation?: SE.ViewStatusLocation,
  width?: number,
  events?: {
    onChange?: string,
    uRLClick?: string,
  },
}

export interface PdfDocumentFieldXML extends FormFieldXML {
  
  AutoMaxHeight?: boolean,
  AutoMaxWidth?: boolean,
  BorderColor?: ColorXML,
  CurrentPageNumber?: number,
  Height?: number,
  HorizontalStretch?: boolean,
  MaxHeight?: number,
  MaxWidth?: number,
  Orientation?: number,
  Output?: SE.UseOutput,
  Scale?: number,
  UsedFileName?: string,
  UserVisible?: UserVisibleXML,
  VerticalStretch?: boolean,
  ViewStatusLocation?: SE.ViewStatusLocation,
  Width?: number,
  Events?: EventsXML,
}

export interface PdfDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean,
  АвтоМаксимальнаяШирина?: boolean,
  ЦветРамки?: ColorEnterprise,
  НомерТекущейСтраницы?: number,
  Высота?: number,
  РастягиватьПоГоризонтали?: boolean,
  МаксимальнаяВысота?: number,
  МаксимальнаяШирина?: number,
  Ориентация?: number,
  Вывод?: SE.UseOutputEnterprise,
  Масштаб?: number,
  ИспользуемоеИмяФайла?: string,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  РастягиватьПоВертикали?: boolean,
  ПоложениеСостоянияПросмотра?: SE.ViewStatusLocationEnterprise,
  Ширина?: number,
  События?: {
    ПриИзменении?: string,
    НажатиеНаНавигационнойСсылке?: string,
  },
}