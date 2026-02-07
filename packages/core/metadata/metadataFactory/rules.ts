import { AutoCommandBar, AutoCommandBarEnterprise } from "../forms/elements/autoCommandBar/types"
import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise } from "../forms/elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
} from "../forms/elements/buttonGroup/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
} from "../forms/elements/calendarField/types"
import {
  ChartField,
  ChartFieldPartialEnterprise,
  ChartFieldTypedEnterprise,
} from "../forms/elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
} from "../forms/elements/columnGroup/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
} from "../forms/elements/commandBar/types"
import { ContextMenu } from "../forms/elements/contextMenu/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldTypedEnterprise,
} from "../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldTypedEnterprise,
} from "../forms/elements/formattedDocumentField/types"
import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
} from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldTypedEnterprise,
} from "../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
} from "../forms/elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldTypedEnterprise,
} from "../forms/elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldPreview,
  InputFieldTypedEnterprise,
} from "../forms/elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
} from "../forms/elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldPreview,
  LabelFieldTypedEnterprise,
} from "../forms/elements/labelField/types"
import { Page, PagePartialEnterprise, PageTypedEnterprise } from "../forms/elements/page/types"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise } from "../forms/elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldTypedEnterprise,
} from "../forms/elements/pdfDocumentField/types"
import {
  PeriodField,
  PeriodFieldPartialEnterprise,
  PeriodFieldTypedEnterprise,
} from "../forms/elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
} from "../forms/elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
} from "../forms/elements/pictureField/types"
import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
} from "../forms/elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise } from "../forms/elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldTypedEnterprise,
} from "../forms/elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
} from "../forms/elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
} from "../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise } from "../forms/elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldPartialEnterprise,
  TextDocumentFieldTypedEnterprise,
} from "../forms/elements/textDocumentField/types"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
} from "../forms/elements/trackBarField/types"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupPreview,
  UsualGroupTypedEnterprise,
} from "../forms/elements/usualGroup/types"

export type TypeRules<T> = T extends Button
  ? {
      PartialEnterprise: ButtonPartialEnterprise
      TypedEnterprise: ButtonTypedEnterprise
    }
  : T extends ButtonGroup
    ? {
        PartialEnterprise: ButtonGroupPartialEnterprise
        TypedEnterprise: ButtonGroupTypedEnterprise
      }
    : T extends CalendarField
      ? {
          PartialEnterprise: CalendarFieldPartialEnterprise
          TypedEnterprise: CalendarFieldTypedEnterprise
        }
      : T extends ChartField
        ? {
            PartialEnterprise: ChartFieldPartialEnterprise
            TypedEnterprise: ChartFieldTypedEnterprise
          }
        : T extends CheckBoxField
          ? {
              PartialEnterprise: CheckBoxFieldPartialEnterprise
              TypedEnterprise: CheckBoxFieldTypedEnterprise
            }
          : T extends ColumnGroup
            ? {
                PartialEnterprise: ColumnGroupPartialEnterprise
                TypedEnterprise: ColumnGroupTypedEnterprise
              }
            : T extends CommandBar
              ? {
                  PartialEnterprise: CommandBarPartialEnterprise
                  TypedEnterprise: CommandBarTypedEnterprise
                }
              : T extends DendrogramField
                ? {
                    PartialEnterprise: DendrogramFieldPartialEnterprise
                    TypedEnterprise: DendrogramFieldTypedEnterprise
                  }
                : T extends FormattedDocumentField
                  ? {
                      PartialEnterprise: FormattedDocumentFieldPartialEnterprise
                      TypedEnterprise: FormattedDocumentFieldTypedEnterprise
                    }
                  : T extends GanttChartField
                    ? {
                        PartialEnterprise: GanttChartFieldPartialEnterprise
                        TypedEnterprise: GanttChartFieldTypedEnterprise
                      }
                    : T extends GeographicalSchemaField
                      ? {
                          PartialEnterprise: GeographicalSchemaFieldPartialEnterprise
                          TypedEnterprise: GeographicalSchemaFieldTypedEnterprise
                        }
                      : T extends GraphicalSchemaField
                        ? {
                            PartialEnterprise: GraphicalSchemaFieldPartialEnterprise
                            TypedEnterprise: GraphicalSchemaFieldTypedEnterprise
                          }
                        : T extends HTMLDocumentField
                          ? {
                              PartialEnterprise: HTMLDocumentFieldPartialEnterprise
                              TypedEnterprise: HTMLDocumentFieldTypedEnterprise
                            }
                          : T extends InputField
                            ? {
                                Preview: InputFieldPreview
                                PartialEnterprise: InputFieldPartialEnterprise
                                TypedEnterprise: InputFieldTypedEnterprise
                              }
                            : T extends LabelDecoration
                              ? {
                                  PartialEnterprise: LabelDecorationPartialEnterprise
                                  TypedEnterprise: LabelDecorationTypedEnterprise
                                }
                              : T extends LabelField
                                ? {
                                    Preview: LabelFieldPreview
                                    PartialEnterprise: LabelFieldPartialEnterprise
                                    TypedEnterprise: LabelFieldTypedEnterprise
                                  }
                                : T extends Page
                                  ? {
                                      PartialEnterprise: PagePartialEnterprise
                                      TypedEnterprise: PageTypedEnterprise
                                    }
                                  : T extends Pages
                                    ? {
                                        PartialEnterprise: PagesPartialEnterprise
                                        TypedEnterprise: PagesTypedEnterprise
                                      }
                                    : T extends PdfDocumentField
                                      ? {
                                          PartialEnterprise: PdfDocumentFieldPartialEnterprise
                                          TypedEnterprise: PdfDocumentFieldTypedEnterprise
                                        }
                                      : T extends PeriodField
                                        ? {
                                            PartialEnterprise: PeriodFieldPartialEnterprise
                                            TypedEnterprise: PeriodFieldTypedEnterprise
                                          }
                                        : T extends PictureDecoration
                                          ? {
                                              PartialEnterprise: PictureDecorationPartialEnterprise
                                              TypedEnterprise: PictureDecorationTypedEnterprise
                                            }
                                          : T extends PictureField
                                            ? {
                                                PartialEnterprise: PictureFieldPartialEnterprise
                                                TypedEnterprise: PictureFieldTypedEnterprise
                                              }
                                            : T extends PlannerField
                                              ? {
                                                  PartialEnterprise: PlannerFieldPartialEnterprise
                                                  TypedEnterprise: PlannerFieldTypedEnterprise
                                                }
                                              : T extends Popup
                                                ? {
                                                    PartialEnterprise: PopupPartialEnterprise
                                                    TypedEnterprise: PopupTypedEnterprise
                                                  }
                                                : T extends ProgressBarField
                                                  ? {
                                                      PartialEnterprise: ProgressBarFieldPartialEnterprise
                                                      TypedEnterprise: ProgressBarFieldTypedEnterprise
                                                    }
                                                  : T extends RadioButtonField
                                                    ? {
                                                        PartialEnterprise: RadioButtonFieldPartialEnterprise
                                                        TypedEnterprise: RadioButtonFieldTypedEnterprise
                                                      }
                                                    : T extends SpreadSheetDocumentField
                                                      ? {
                                                          PartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise
                                                          TypedEnterprise: SpreadSheetDocumentFieldTypedEnterprise
                                                        }
                                                      : T extends Table
                                                        ? {
                                                            PartialEnterprise: TablePartialEnterprise
                                                          }
                                                        : T extends SearchControlAddition
                                                          ? {
                                                              PartialEnterprise: SearchControlAdditionEnterprise
                                                            }
                                                          : T extends SearchStringAddition
                                                            ? {
                                                                PartialEnterprise: SearchStringAdditionEnterprise
                                                              }
                                                            : T extends TextDocumentField
                                                              ? {
                                                                  PartialEnterprise: TextDocumentFieldPartialEnterprise
                                                                  TypedEnterprise: TextDocumentFieldTypedEnterprise
                                                                }
                                                              : T extends TrackBarField
                                                                ? {
                                                                    PartialEnterprise: TrackBarFieldPartialEnterprise
                                                                    TypedEnterprise: TrackBarFieldTypedEnterprise
                                                                  }
                                                                : T extends UsualGroup
                                                                  ? {
                                                                      PartialEnterprise: UsualGroupPartialEnterprise
                                                                      TypedEnterprise: UsualGroupTypedEnterprise
                                                                      Preview: UsualGroupPreview
                                                                    }
                                                                  : T extends ContextMenu
                                                                    ? {}
                                                                    : T extends AutoCommandBar
                                                                      ? {
                                                                          PartialEnterprise: AutoCommandBarEnterprise
                                                                        }
                                                                      : T extends ExtendedTooltip
                                                                        ? {
                                                                            PartialEnterprise: ExtendedTooltipEnterprise
                                                                          }
                                                                        : never
