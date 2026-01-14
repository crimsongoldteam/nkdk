import { BaseElement } from "../forms/elements/baseElement/types"
import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise, ButtonXML } from "../forms/elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
  ButtonGroupXML,
} from "../forms/elements/buttonGroup/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
  CalendarFieldXML,
} from "../forms/elements/calendarField/types"
import {
  ChartField,
  ChartFieldPartialEnterprise,
  ChartFieldTypedEnterprise,
  ChartFieldXML,
} from "../forms/elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
  CheckBoxFieldXML,
} from "../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
  ColumnGroupXML,
} from "../forms/elements/columnGroup/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
  CommandBarXML,
} from "../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuXML } from "../forms/elements/contextMenu/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldTypedEnterprise,
  DendrogramFieldXML,
} from "../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldTypedEnterprise,
  FormattedDocumentFieldXML,
} from "../forms/elements/formattedDocumentField/types"
import {
  FormDecoration,
  FormDecorationPartialEnterprise,
  FormDecorationTypedEnterprise,
  FormDecorationXML,
} from "../forms/elements/formDecoration/types"
import { FormField, FormFieldXML } from "../forms/elements/formField/types"
import {
  FormGroup,
  FormGroupXML,
  FormGroupPartialEnterprise,
  FormGroupTypedEnterprise,
} from "../forms/elements/formGroup/types"
import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
  GanttChartFieldXML,
} from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldTypedEnterprise,
  GeographicalSchemaFieldXML,
} from "../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
  GraphicalSchemaFieldXML,
} from "../forms/elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldTypedEnterprise,
  HTMLDocumentFieldXML,
} from "../forms/elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
  InputFieldXML,
} from "../forms/elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
  LabelDecorationXML,
} from "../forms/elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
  LabelFieldXML,
} from "../forms/elements/labelField/types"
import { Page, PagePartialEnterprise, PageTypedEnterprise, PageXML } from "../forms/elements/page/types"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise, PagesXML } from "../forms/elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldTypedEnterprise,
  PdfDocumentFieldXML,
} from "../forms/elements/pdfDocumentField/types"
import {
  PeriodField,
  PeriodFieldPartialEnterprise,
  PeriodFieldTypedEnterprise,
  PeriodFieldXML,
} from "../forms/elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
  PictureDecorationXML,
} from "../forms/elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
  PictureFieldXML,
} from "../forms/elements/pictureField/types"
import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
  PlannerFieldXML,
} from "../forms/elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise, PopupXML } from "../forms/elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldTypedEnterprise,
  ProgressBarFieldXML,
} from "../forms/elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
  RadioButtonFieldXML,
} from "../forms/elements/radioButtonField/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
  SpreadSheetDocumentFieldXML,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise, TableXML } from "../forms/elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldPartialEnterprise,
  TextDocumentFieldTypedEnterprise,
  TextDocumentFieldXML,
} from "../forms/elements/textDocumentField/types"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
  TrackBarFieldXML,
} from "../forms/elements/trackBarField/types"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupTypedEnterprise,
  UsualGroupXML,
} from "../forms/elements/usualGroup/types"

export type TypeRules<T extends BaseElement> = T extends Button
  ? {
      XML: ButtonXML
      Element: Button
      PartialEnterprise: ButtonPartialEnterprise
      TypedEnterprise: ButtonTypedEnterprise
    }
  : T extends ButtonGroup
    ? {
        XML: ButtonGroupXML
        Element: ButtonGroup
        PartialEnterprise: ButtonGroupPartialEnterprise
        TypedEnterprise: ButtonGroupTypedEnterprise
      }
    : T extends CalendarField
      ? {
          XML: CalendarFieldXML
          Element: CalendarField
          PartialEnterprise: CalendarFieldPartialEnterprise
          TypedEnterprise: CalendarFieldTypedEnterprise
        }
      : T extends ChartField
        ? {
            XML: ChartFieldXML
            Element: ChartField
            PartialEnterprise: ChartFieldPartialEnterprise
            TypedEnterprise: ChartFieldTypedEnterprise
          }
        : T extends CheckBoxField
          ? {
              XML: CheckBoxFieldXML
              Element: CheckBoxField
              PartialEnterprise: CheckBoxFieldPartialEnterprise
              TypedEnterprise: CheckBoxFieldTypedEnterprise
            }
          : T extends ColumnGroup
            ? {
                XML: ColumnGroupXML
                Element: ColumnGroup
                PartialEnterprise: ColumnGroupPartialEnterprise
                TypedEnterprise: ColumnGroupTypedEnterprise
              }
            : T extends CommandBar
              ? {
                  XML: CommandBarXML
                  Element: CommandBar
                  PartialEnterprise: CommandBarPartialEnterprise
                  TypedEnterprise: CommandBarTypedEnterprise
                }
              : T extends DendrogramField
                ? {
                    XML: DendrogramFieldXML
                    Element: DendrogramField
                    PartialEnterprise: DendrogramFieldPartialEnterprise
                    TypedEnterprise: DendrogramFieldTypedEnterprise
                  }
                : T extends FormattedDocumentField
                  ? {
                      XML: FormattedDocumentFieldXML
                      Element: FormattedDocumentField
                      PartialEnterprise: FormattedDocumentFieldPartialEnterprise
                      TypedEnterprise: FormattedDocumentFieldTypedEnterprise
                    }
                  : T extends GanttChartField
                    ? {
                        XML: GanttChartFieldXML
                        Element: GanttChartField
                        PartialEnterprise: GanttChartFieldPartialEnterprise
                        TypedEnterprise: GanttChartFieldTypedEnterprise
                      }
                    : T extends GeographicalSchemaField
                      ? {
                          XML: GeographicalSchemaFieldXML
                          Element: GeographicalSchemaField
                          PartialEnterprise: GeographicalSchemaFieldPartialEnterprise
                          TypedEnterprise: GeographicalSchemaFieldTypedEnterprise
                        }
                      : T extends GraphicalSchemaField
                        ? {
                            XML: GraphicalSchemaFieldXML
                            Element: GraphicalSchemaField
                            PartialEnterprise: GraphicalSchemaFieldPartialEnterprise
                            TypedEnterprise: GraphicalSchemaFieldTypedEnterprise
                          }
                        : T extends HTMLDocumentField
                          ? {
                              XML: HTMLDocumentFieldXML
                              Element: HTMLDocumentField
                              PartialEnterprise: HTMLDocumentFieldPartialEnterprise
                              TypedEnterprise: HTMLDocumentFieldTypedEnterprise
                            }
                          : T extends InputField
                            ? {
                                XML: InputFieldXML
                                Element: InputField
                                PartialEnterprise: InputFieldPartialEnterprise
                                TypedEnterprise: InputFieldTypedEnterprise
                              }
                            : T extends LabelDecoration
                              ? {
                                  XML: LabelDecorationXML
                                  Element: LabelDecoration
                                  PartialEnterprise: LabelDecorationPartialEnterprise
                                  TypedEnterprise: LabelDecorationTypedEnterprise
                                }
                              : T extends LabelField
                                ? {
                                    XML: LabelFieldXML
                                    Element: LabelField
                                    PartialEnterprise: LabelFieldPartialEnterprise
                                    TypedEnterprise: LabelFieldTypedEnterprise
                                  }
                                : T extends Page
                                  ? {
                                      XML: PageXML
                                      Element: Page
                                      PartialEnterprise: PagePartialEnterprise
                                      TypedEnterprise: PageTypedEnterprise
                                    }
                                  : T extends Pages
                                    ? {
                                        XML: PagesXML
                                        Element: Pages
                                        PartialEnterprise: PagesPartialEnterprise
                                        TypedEnterprise: PagesTypedEnterprise
                                      }
                                    : T extends PdfDocumentField
                                      ? {
                                          XML: PdfDocumentFieldXML
                                          Element: PdfDocumentField
                                          PartialEnterprise: PdfDocumentFieldPartialEnterprise
                                          TypedEnterprise: PdfDocumentFieldTypedEnterprise
                                        }
                                      : T extends PeriodField
                                        ? {
                                            XML: PeriodFieldXML
                                            Element: PeriodField
                                            PartialEnterprise: PeriodFieldPartialEnterprise
                                            TypedEnterprise: PeriodFieldTypedEnterprise
                                          }
                                        : T extends PictureDecoration
                                          ? {
                                              XML: PictureDecorationXML
                                              Element: PictureDecoration
                                              PartialEnterprise: PictureDecorationPartialEnterprise
                                              TypedEnterprise: PictureDecorationTypedEnterprise
                                            }
                                          : T extends PictureField
                                            ? {
                                                XML: PictureFieldXML
                                                Element: PictureField
                                                PartialEnterprise: PictureFieldPartialEnterprise
                                                TypedEnterprise: PictureFieldTypedEnterprise
                                              }
                                            : T extends PlannerField
                                              ? {
                                                  XML: PlannerFieldXML
                                                  Element: PlannerField
                                                  PartialEnterprise: PlannerFieldPartialEnterprise
                                                  TypedEnterprise: PlannerFieldTypedEnterprise
                                                }
                                              : T extends Popup
                                                ? {
                                                    XML: PopupXML
                                                    Element: Popup
                                                    PartialEnterprise: PopupPartialEnterprise
                                                    TypedEnterprise: PopupTypedEnterprise
                                                  }
                                                : T extends ProgressBarField
                                                  ? {
                                                      XML: ProgressBarFieldXML
                                                      Element: ProgressBarField
                                                      PartialEnterprise: ProgressBarFieldPartialEnterprise
                                                      TypedEnterprise: ProgressBarFieldTypedEnterprise
                                                    }
                                                  : T extends RadioButtonField
                                                    ? {
                                                        XML: RadioButtonFieldXML
                                                        Element: RadioButtonField
                                                        PartialEnterprise: RadioButtonFieldPartialEnterprise
                                                        TypedEnterprise: RadioButtonFieldTypedEnterprise
                                                      }
                                                    : T extends SpreadSheetDocumentField
                                                      ? {
                                                          XML: SpreadSheetDocumentFieldXML
                                                          Element: SpreadSheetDocumentField
                                                          PartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise
                                                          TypedEnterprise: SpreadSheetDocumentFieldTypedEnterprise
                                                        }
                                                      : T extends Table
                                                        ? {
                                                            XML: TableXML
                                                            Element: Table
                                                            PartialEnterprise: TablePartialEnterprise
                                                            TypedEnterprise: TablePartialEnterprise
                                                          }
                                                        : T extends TextDocumentField
                                                          ? {
                                                              XML: TextDocumentFieldXML
                                                              Element: TextDocumentField
                                                              PartialEnterprise: TextDocumentFieldPartialEnterprise
                                                              TypedEnterprise: TextDocumentFieldTypedEnterprise
                                                            }
                                                          : T extends TrackBarField
                                                            ? {
                                                                XML: TrackBarFieldXML
                                                                Element: TrackBarField
                                                                PartialEnterprise: TrackBarFieldPartialEnterprise
                                                                TypedEnterprise: TrackBarFieldTypedEnterprise
                                                              }
                                                            : T extends UsualGroup
                                                              ? {
                                                                  XML: UsualGroupXML
                                                                  Element: UsualGroup
                                                                  PartialEnterprise: UsualGroupPartialEnterprise
                                                                  TypedEnterprise: UsualGroupTypedEnterprise
                                                                }
                                                              : T extends FormDecoration
                                                                ? {
                                                                    XML: FormDecorationXML
                                                                    Element: FormDecoration
                                                                    PartialEnterprise: FormDecorationPartialEnterprise
                                                                    TypedEnterprise: FormDecorationTypedEnterprise
                                                                  }
                                                                : T extends FormField
                                                                  ? {
                                                                      XML: FormFieldXML
                                                                      Element: FormField
                                                                    }
                                                                  : T extends FormGroup
                                                                    ? {
                                                                        XML: FormGroupXML
                                                                        Element: FormGroup
                                                                        PartialEnterprise: FormGroupPartialEnterprise
                                                                        TypedEnterprise: FormGroupTypedEnterprise
                                                                      }
                                                                    : T extends ContextMenu
                                                                      ? {
                                                                          XML: ContextMenuXML
                                                                        }
                                                                      : T extends ExtendedTooltip
                                                                        ? {
                                                                            XML: ExtendedTooltipXML
                                                                            Element: ExtendedTooltip
                                                                            PartialEnterprise: ExtendedTooltipEnterprise
                                                                          }
                                                                        : never
