import { AutoCommandBar, AutoCommandBarEnterprise } from "../forms/elements/autoCommandBar/types"
import { Button, ButtonPartialEnterprise } from "../forms/elements/button/types"
import { ButtonGroup, ButtonGroupPartialEnterprise } from "../forms/elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialEnterprise } from "../forms/elements/calendarField/types"
import { ChartField, ChartFieldPartialEnterprise } from "../forms/elements/chartField/types"
import { CheckBoxField, CheckBoxFieldPartialEnterprise } from "../forms/elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupPartialEnterprise } from "../forms/elements/columnGroup/types"
import { CommandBar, CommandBarPartialEnterprise } from "../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuEnterprise } from "../forms/elements/contextMenu/types"
import { DendrogramField, DendrogramFieldPartialEnterprise } from "../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
} from "../forms/elements/formattedDocumentField/types"
import { GanttChartField, GanttChartFieldPartialEnterprise } from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
} from "../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
} from "../forms/elements/graphicalSchemaField/types"
import { HTMLDocumentField, HTMLDocumentFieldPartialEnterprise } from "../forms/elements/htmlDocumentField/types"
import { InputField, InputFieldPartialEnterprise, InputFieldPreview } from "../forms/elements/inputField/types"
import { LabelDecoration, LabelDecorationPartialEnterprise } from "../forms/elements/labelDecoration/types"
import { LabelField, LabelFieldPartialEnterprise, LabelFieldPreview } from "../forms/elements/labelField/types"
import { Page, PagePartialEnterprise } from "../forms/elements/page/types"
import { Pages, PagesPartialEnterprise } from "../forms/elements/pages/types"
import { PdfDocumentField, PdfDocumentFieldPartialEnterprise } from "../forms/elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldPartialEnterprise } from "../forms/elements/periodField/types"
import { PictureDecoration, PictureDecorationPartialEnterprise } from "../forms/elements/pictureDecoration/types"
import { PictureField, PictureFieldPartialEnterprise } from "../forms/elements/pictureField/types"
import { PlannerField, PlannerFieldPartialEnterprise } from "../forms/elements/plannerField/types"
import { Popup, PopupPartialEnterprise } from "../forms/elements/popup/types"
import { ProgressBarField, ProgressBarFieldPartialEnterprise } from "../forms/elements/progressBarField/types"
import { RadioButtonField, RadioButtonFieldPartialEnterprise } from "../forms/elements/radioButtonField/types"
import { SearchControlAddition, SearchControlAdditionEnterprise } from "../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
} from "../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise } from "../forms/elements/table/types"
import { TextDocumentField, TextDocumentFieldPartialEnterprise } from "../forms/elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldPartialEnterprise } from "../forms/elements/trackBarField/types"
import { UsualGroup, UsualGroupPartialEnterprise, UsualGroupPreview } from "../forms/elements/usualGroup/types"

export type TypeRules<T> = T extends Button
  ? {
      PartialEnterprise: ButtonPartialEnterprise
    }
  : T extends ButtonGroup
    ? {
        PartialEnterprise: ButtonGroupPartialEnterprise
      }
    : T extends CalendarField
      ? {
          PartialEnterprise: CalendarFieldPartialEnterprise
        }
      : T extends ChartField
        ? {
            PartialEnterprise: ChartFieldPartialEnterprise
          }
        : T extends CheckBoxField
          ? {
              PartialEnterprise: CheckBoxFieldPartialEnterprise
            }
          : T extends ColumnGroup
            ? {
                PartialEnterprise: ColumnGroupPartialEnterprise
              }
            : T extends CommandBar
              ? {
                  PartialEnterprise: CommandBarPartialEnterprise
                }
              : T extends DendrogramField
                ? {
                    PartialEnterprise: DendrogramFieldPartialEnterprise
                  }
                : T extends FormattedDocumentField
                  ? {
                      PartialEnterprise: FormattedDocumentFieldPartialEnterprise
                    }
                  : T extends GanttChartField
                    ? {
                        PartialEnterprise: GanttChartFieldPartialEnterprise
                      }
                    : T extends GeographicalSchemaField
                      ? {
                          PartialEnterprise: GeographicalSchemaFieldPartialEnterprise
                        }
                      : T extends GraphicalSchemaField
                        ? {
                            PartialEnterprise: GraphicalSchemaFieldPartialEnterprise
                          }
                        : T extends HTMLDocumentField
                          ? {
                              PartialEnterprise: HTMLDocumentFieldPartialEnterprise
                            }
                          : T extends InputField
                            ? {
                                Preview: InputFieldPreview
                                PartialEnterprise: InputFieldPartialEnterprise
                              }
                            : T extends LabelDecoration
                              ? {
                                  PartialEnterprise: LabelDecorationPartialEnterprise
                                }
                              : T extends LabelField
                                ? {
                                    Preview: LabelFieldPreview
                                    PartialEnterprise: LabelFieldPartialEnterprise
                                  }
                                : T extends Page
                                  ? {
                                      PartialEnterprise: PagePartialEnterprise
                                    }
                                  : T extends Pages
                                    ? {
                                        PartialEnterprise: PagesPartialEnterprise
                                      }
                                    : T extends PdfDocumentField
                                      ? {
                                          PartialEnterprise: PdfDocumentFieldPartialEnterprise
                                        }
                                      : T extends PeriodField
                                        ? {
                                            PartialEnterprise: PeriodFieldPartialEnterprise
                                          }
                                        : T extends PictureDecoration
                                          ? {
                                              PartialEnterprise: PictureDecorationPartialEnterprise
                                            }
                                          : T extends PictureField
                                            ? {
                                                PartialEnterprise: PictureFieldPartialEnterprise
                                              }
                                            : T extends PlannerField
                                              ? {
                                                  PartialEnterprise: PlannerFieldPartialEnterprise
                                                }
                                              : T extends Popup
                                                ? {
                                                    PartialEnterprise: PopupPartialEnterprise
                                                  }
                                                : T extends ProgressBarField
                                                  ? {
                                                      PartialEnterprise: ProgressBarFieldPartialEnterprise
                                                    }
                                                  : T extends RadioButtonField
                                                    ? {
                                                        PartialEnterprise: RadioButtonFieldPartialEnterprise
                                                      }
                                                    : T extends SpreadSheetDocumentField
                                                      ? {
                                                          PartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise
                                                        }
                                                      : T extends Table
                                                        ? {
                                                            PartialEnterprise: TablePartialEnterprise
                                                          }
                                                        : T extends SearchControlAddition
                                                          ? {
                                                              PartialEnterprise: SearchControlAdditionEnterprise
                                                            }
                                                          : T extends SingleSearchStringAddition
                                                            ? {
                                                                PartialEnterprise: SingleSearchStringAdditionEnterprise
                                                              }
                                                            : T extends SingleSearchStringAddition
                                                              ? {
                                                                  PartialEnterprise: SingleSearchStringAdditionEnterprise
                                                                }
                                                              : T extends SearchStringAddition
                                                                ? {
                                                                    PartialEnterprise: SearchStringAdditionEnterprise
                                                                  }
                                                                : T extends TextDocumentField
                                                                  ? {
                                                                      PartialEnterprise: TextDocumentFieldPartialEnterprise
                                                                    }
                                                                  : T extends TrackBarField
                                                                    ? {
                                                                        PartialEnterprise: TrackBarFieldPartialEnterprise
                                                                      }
                                                                    : T extends UsualGroup
                                                                      ? {
                                                                          PartialEnterprise: UsualGroupPartialEnterprise
                                                                          Preview: UsualGroupPreview
                                                                        }
                                                                      : T extends ContextMenu
                                                                        ? {
                                                                            PartialEnterprise: ContextMenuEnterprise
                                                                          }
                                                                        : T extends AutoCommandBar
                                                                          ? {
                                                                              PartialEnterprise: AutoCommandBarEnterprise
                                                                            }
                                                                          : T extends ExtendedTooltip
                                                                            ? {
                                                                                PartialEnterprise: ExtendedTooltipEnterprise
                                                                              }
                                                                            : never
