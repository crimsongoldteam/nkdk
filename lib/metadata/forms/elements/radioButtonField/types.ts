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


export interface RadioButtonField extends FormField {

  backColor?: Color,
  borderColor?: Color,
  choiceList?: ChoiceList,
  columnsCount?: number,
  equalColumnsWidth?: boolean,
  font?: Font,
  itemHeight?: number,
  itemTitleHeight?: number,
  itemWidth?: number,
  radioButtonType?: SE.RadioButtonType,
  textColor?: Color,
  userVisible?: UserVisible,
  events?: {
    onChange?: string,
  },
}

export interface RadioButtonFieldXML extends FormFieldXML {
  
  BackColor?: ColorXML,
  BorderColor?: ColorXML,
  ChoiceList?: ChoiceListXML,
  ColumnsCount?: number,
  EqualColumnsWidth?: boolean,
  Font?: FontXML,
  ItemHeight?: number,
  ItemTitleHeight?: number,
  ItemWidth?: number,
  RadioButtonType?: SE.RadioButtonType,
  TextColor?: ColorXML,
  UserVisible?: UserVisibleXML,
  Events?: EventsXML,
}

export interface RadioButtonFieldEnterprise extends FormFieldEnterprise {
  ЦветФона?: ColorEnterprise,
  ЦветРамки?: ColorEnterprise,
  СписокВыбора?: ChoiceListEnterprise,
  КоличествоКолонок?: number,
  ОдинаковаяШиринаКолонок?: boolean,
  Шрифт?: FontEnterprise,
  ВысотаЭлемента?: number,
  ВысотаЗаголовкаЭлемента?: number,
  ШиринаЭлемента?: number,
  ВидПереключателя?: SE.RadioButtonTypeEnterprise,
  ЦветТекста?: ColorEnterprise,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  События?: {
    ПриИзменении?: string,
  },
}