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
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SearchControlAdditionXML,
} from "../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionXML,
} from "../forms/elements/searchStringAddition/types"
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

export type TypeRules<T> = T extends Button
  ? {
      XML: ButtonXML
      PartialEnterprise: ButtonPartialEnterprise
      TypedEnterprise: ButtonTypedEnterprise
    }
  : T extends ButtonGroup
    ? {
        XML: ButtonGroupXML
        PartialEnterprise: ButtonGroupPartialEnterprise
        TypedEnterprise: ButtonGroupTypedEnterprise
      }
    : T extends CalendarField
      ? {
          XML: CalendarFieldXML
          PartialEnterprise: CalendarFieldPartialEnterprise
          TypedEnterprise: CalendarFieldTypedEnterprise
        }
      : T extends ChartField
        ? {
            XML: ChartFieldXML
            PartialEnterprise: ChartFieldPartialEnterprise
            TypedEnterprise: ChartFieldTypedEnterprise
          }
        : T extends CheckBoxField
          ? {
              XML: CheckBoxFieldXML
              PartialEnterprise: CheckBoxFieldPartialEnterprise
              TypedEnterprise: CheckBoxFieldTypedEnterprise
            }
          : T extends ColumnGroup
            ? {
                XML: ColumnGroupXML
                PartialEnterprise: ColumnGroupPartialEnterprise
                TypedEnterprise: ColumnGroupTypedEnterprise
              }
            : T extends CommandBar
              ? {
                  XML: CommandBarXML
                  PartialEnterprise: CommandBarPartialEnterprise
                  TypedEnterprise: CommandBarTypedEnterprise
                }
              : T extends DendrogramField
                ? {
                    XML: DendrogramFieldXML
                    PartialEnterprise: DendrogramFieldPartialEnterprise
                    TypedEnterprise: DendrogramFieldTypedEnterprise
                  }
                : T extends FormattedDocumentField
                  ? {
                      XML: FormattedDocumentFieldXML
                      PartialEnterprise: FormattedDocumentFieldPartialEnterprise
                      TypedEnterprise: FormattedDocumentFieldTypedEnterprise
                    }
                  : T extends GanttChartField
                    ? {
                        XML: GanttChartFieldXML
                        PartialEnterprise: GanttChartFieldPartialEnterprise
                        TypedEnterprise: GanttChartFieldTypedEnterprise
                      }
                    : T extends GeographicalSchemaField
                      ? {
                          XML: GeographicalSchemaFieldXML
                          PartialEnterprise: GeographicalSchemaFieldPartialEnterprise
                          TypedEnterprise: GeographicalSchemaFieldTypedEnterprise
                        }
                      : T extends GraphicalSchemaField
                        ? {
                            XML: GraphicalSchemaFieldXML
                            PartialEnterprise: GraphicalSchemaFieldPartialEnterprise
                            TypedEnterprise: GraphicalSchemaFieldTypedEnterprise
                          }
                        : T extends HTMLDocumentField
                          ? {
                              XML: HTMLDocumentFieldXML
                              PartialEnterprise: HTMLDocumentFieldPartialEnterprise
                              TypedEnterprise: HTMLDocumentFieldTypedEnterprise
                            }
                          : T extends InputField
                            ? {
                                XML: InputFieldXML
                                PartialEnterprise: InputFieldPartialEnterprise
                                TypedEnterprise: InputFieldTypedEnterprise
                              }
                            : T extends LabelDecoration
                              ? {
                                  XML: LabelDecorationXML
                                  PartialEnterprise: LabelDecorationPartialEnterprise
                                  TypedEnterprise: LabelDecorationTypedEnterprise
                                }
                              : T extends LabelField
                                ? {
                                    XML: LabelFieldXML
                                    PartialEnterprise: LabelFieldPartialEnterprise
                                    TypedEnterprise: LabelFieldTypedEnterprise
                                  }
                                : T extends Page
                                  ? {
                                      XML: PageXML
                                      PartialEnterprise: PagePartialEnterprise
                                      TypedEnterprise: PageTypedEnterprise
                                    }
                                  : T extends Pages
                                    ? {
                                        XML: PagesXML
                                        PartialEnterprise: PagesPartialEnterprise
                                        TypedEnterprise: PagesTypedEnterprise
                                      }
                                    : T extends PdfDocumentField
                                      ? {
                                          XML: PdfDocumentFieldXML
                                          PartialEnterprise: PdfDocumentFieldPartialEnterprise
                                          TypedEnterprise: PdfDocumentFieldTypedEnterprise
                                        }
                                      : T extends PeriodField
                                        ? {
                                            XML: PeriodFieldXML
                                            PartialEnterprise: PeriodFieldPartialEnterprise
                                            TypedEnterprise: PeriodFieldTypedEnterprise
                                          }
                                        : T extends PictureDecoration
                                          ? {
                                              XML: PictureDecorationXML
                                              PartialEnterprise: PictureDecorationPartialEnterprise
                                              TypedEnterprise: PictureDecorationTypedEnterprise
                                            }
                                          : T extends PictureField
                                            ? {
                                                XML: PictureFieldXML
                                                PartialEnterprise: PictureFieldPartialEnterprise
                                                TypedEnterprise: PictureFieldTypedEnterprise
                                              }
                                            : T extends PlannerField
                                              ? {
                                                  XML: PlannerFieldXML
                                                  PartialEnterprise: PlannerFieldPartialEnterprise
                                                  TypedEnterprise: PlannerFieldTypedEnterprise
                                                }
                                              : T extends Popup
                                                ? {
                                                    XML: PopupXML
                                                    PartialEnterprise: PopupPartialEnterprise
                                                    TypedEnterprise: PopupTypedEnterprise
                                                  }
                                                : T extends ProgressBarField
                                                  ? {
                                                      XML: ProgressBarFieldXML
                                                      PartialEnterprise: ProgressBarFieldPartialEnterprise
                                                      TypedEnterprise: ProgressBarFieldTypedEnterprise
                                                    }
                                                  : T extends RadioButtonField
                                                    ? {
                                                        XML: RadioButtonFieldXML
                                                        PartialEnterprise: RadioButtonFieldPartialEnterprise
                                                        TypedEnterprise: RadioButtonFieldTypedEnterprise
                                                      }
                                                    : T extends SpreadSheetDocumentField
                                                      ? {
                                                          XML: SpreadSheetDocumentFieldXML
                                                          PartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise
                                                          TypedEnterprise: SpreadSheetDocumentFieldTypedEnterprise
                                                        }
                                                      : T extends Table
                                                        ? {
                                                            XML: TableXML
                                                            PartialEnterprise: TablePartialEnterprise
                                                          }
                                                        : T extends SearchControlAddition
                                                          ? {
                                                              XML: SearchControlAdditionXML
                                                              PartialEnterprise: SearchControlAdditionEnterprise
                                                            }
                                                          : T extends SearchStringAddition
                                                            ? {
                                                                XML: SearchStringAdditionXML
                                                                PartialEnterprise: SearchStringAdditionEnterprise
                                                              }
                                                            : T extends TextDocumentField
                                                              ? {
                                                                  XML: TextDocumentFieldXML
                                                                  PartialEnterprise: TextDocumentFieldPartialEnterprise
                                                                  TypedEnterprise: TextDocumentFieldTypedEnterprise
                                                                }
                                                              : T extends TrackBarField
                                                                ? {
                                                                    XML: TrackBarFieldXML
                                                                    PartialEnterprise: TrackBarFieldPartialEnterprise
                                                                    TypedEnterprise: TrackBarFieldTypedEnterprise
                                                                  }
                                                                : T extends UsualGroup
                                                                  ? {
                                                                      XML: UsualGroupXML
                                                                      PartialEnterprise: UsualGroupPartialEnterprise
                                                                      TypedEnterprise: UsualGroupTypedEnterprise
                                                                    }
                                                                  : T extends ContextMenu
                                                                    ? {
                                                                        XML: ContextMenuXML
                                                                      }
                                                                    : T extends ExtendedTooltip
                                                                      ? {
                                                                          XML: ExtendedTooltipXML
                                                                          PartialEnterprise: ExtendedTooltipEnterprise
                                                                        }
                                                                      : never
