import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { MetadataConfigurationRules } from "../../appliedObjects/configuration/rules"
import { MetadataDocumentRules } from "../../appliedObjects/metadataDocument/rules"
import { MetadataEnumerationRules, MetadataEnumerationValueRules } from "../../appliedObjects/metadataEnumeration/rules"
import { MetadataStyleItemRules } from "../../appliedObjects/metadataStyleItem/rules"
import { AccumulationRegisterAggregateRules } from "../../commonObjects/accumulationRegisterAggregates/rules"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../../commonObjects/accountingFlag/rules"
import { MetadataExternalDataSourceCubeResourceRules } from "../../commonObjects/metadataExternalDataSourceCubeResource/rules"
import { MetadataIntegrationServiceChannelRules } from "../../commonObjects/metadataIntegrationServiceChannel/rules"
import { MetadataAttributeRules, MetadataCatalogAttributeRules } from "../../commonObjects/metadataAttribute/rules"
import { MetadataRegisterAttributeRules } from "../../commonObjects/metadataRegisterAttribute/rules"
import { MetadataRegisterDimensionRules } from "../../commonObjects/metadataRegisterDimension/rules"
import { MetadataRegisterResourceRules } from "../../commonObjects/metadataRegisterResource/rules"
import {
  MetadataBusinessProcessTabularSectionRules,
  MetadataChartOfAccountsTabularSectionRules,
  MetadataChartOfCalculationTypesTabularSectionRules,
  MetadataChartOfCharacteristicTypesTabularSectionRules,
  MetadataDataProcessorTabularSectionRules,
  MetadataDocumentTabularSectionRules,
  MetadataExchangePlanTabularSectionRules,
  MetadataReportTabularSectionRules,
  MetadataTabularSectionRules,
  MetadataTaskTabularSectionRules,
} from "../../commonObjects/metadataTabularSection/rules"
import { CalculatedFieldOrderExpressionRules } from "../../commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/rules"
import { DCSParameterRules } from "../../commonObjects/dataCompositionSystem/dcsParameter/rules"
import {
  FilterItemComparisonRules,
  FilterItemGroupRules,
} from "../../commonObjects/dataCompositionSystem/filterItem/rules"
import { ExchangePlanContentItemRules } from "../../commonObjects/exchangePlanContent/rules"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import { FormAttributeRules } from "../../forms/commonObjects/formAttribute/rules"
import { FormCommandRules } from "../../forms/commonObjects/formCommand/rules"
import { FormParameterRules } from "../../forms/commonObjects/formParameter/rules"
import { ButtonRules, CommandBarButtonRules } from "../../forms/elements/button/rules"
import { ButtonGroupRules } from "../../forms/elements/buttonGroup/rules"
import { CalendarFieldRules } from "../../forms/elements/calendarField/rules"
import { CheckBoxFieldRules, TableCheckBoxFieldRules } from "../../forms/elements/checkBoxField/rules"
import { AutoCommandBarRules } from "../../forms/elements/autoCommandBar/rules"
import { ChartFieldRules } from "../../forms/elements/chartField/rules"
import { ColumnGroupRules } from "../../forms/elements/columnGroup/rules"
import { CommandBarRules } from "../../forms/elements/commandBar/rules"
import { ContextMenuRules } from "../../forms/elements/contextMenu/rules"
import { DendrogramFieldRules } from "../../forms/elements/dendrogramField/rules"
import { DynamicListRules } from "../../forms/commonObjects/dynamicList/rules"
import { ExtendedTooltipRules } from "../../forms/elements/extendedTooltip/rules"
import { FormattedDocumentFieldRules } from "../../forms/elements/formattedDocumentField/rules"
import { GanttChartFieldRules } from "../../forms/elements/ganttChartField/rules"
import { GeographicalSchemaFieldRules } from "../../forms/elements/geographicalSchemaField/rules"
import { GraphicalSchemaFieldRules } from "../../forms/elements/graphicalSchemaField/rules"
import { GroupItemAutoRules } from "../../commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/rules"
import { HTMLDocumentFieldRules } from "../../forms/elements/htmlDocumentField/rules"
import { InputFieldRules, TableInputFieldRules } from "../../forms/elements/inputField/rules"
import { LabelDecorationRules } from "../../forms/elements/labelDecoration/rules"
import { LabelFieldRules, TableLabelFieldRules } from "../../forms/elements/labelField/rules"
import { PageRules } from "../../forms/elements/page/rules"
import { PagesRules } from "../../forms/elements/pages/rules"
import { PDFDocumentFieldRules } from "../../forms/elements/pdfDocumentField/rules"
import { PictureDecorationRules } from "../../forms/elements/pictureDecoration/rules"
import { PictureFieldRules } from "../../forms/elements/pictureField/rules"
import { PopupRules } from "../../forms/elements/popup/rules"
import { PeriodFieldRules } from "../../forms/elements/periodField/rules"
import { PlannerFieldRules } from "../../forms/elements/plannerField/rules"
import { ProgressBarFieldRules } from "../../forms/elements/progressBarField/rules"
import { RadioButtonFieldRules } from "../../forms/elements/radioButtonField/rules"
import {
  SearchControlAdditionRules,
  SingleSearchControlAdditionRules,
} from "../../forms/elements/searchControlAddition/rules"
import {
  SearchStringAdditionRules,
  SingleSearchStringAdditionRules,
} from "../../forms/elements/searchStringAddition/rules"
import { SingleViewStatusAdditionRules } from "../../forms/elements/viewStatusAddition/rules"
import { SpreadSheetDocumentFieldRules } from "../../forms/elements/spreadSheetDocumentField/rules"
import { TableRules } from "../../forms/elements/table/rules"
import { TextDocumentFieldRules } from "../../forms/elements/textDocumentField/rules"
import { TrackBarFieldRules } from "../../forms/elements/trackBarField/rules"
import { UsualGroupRules } from "../../forms/elements/usualGroup/rules"
import type { MetadataItemRule, PropertyRule } from "./types"

type RuleModule = Record<string, unknown>

type ImportMetaWithGlob = ImportMeta & {
  glob<T>(pattern: string, options: { eager: true }): Record<string, T>
}

const ruleModules = (import.meta as ImportMetaWithGlob).glob<RuleModule>("../../**/rules.ts", { eager: true })

describe("implicitValueYAML contract", () => {
  it("accepts explicit noImplicitValueYAML for boolean and SystemEnumeration YAML properties", () => {
    const rule = {
      itemType: "MetadataConfiguration",
      properties: {
        flag: { type: "boolean", yaml: "Флаг", noImplicitValueYAML: true },
        mode: { type: "SystemEnumeration", typeSE: "ModalityUseMode", yaml: "Режим", noImplicitValueYAML: true },
      },
    } as const satisfies MetadataItemRule

    expect(collectMissingImplicitValueYAML(rule, "TestRules")).toEqual([])
  })

  it("requires configuration boolean and SystemEnumeration YAML properties to document implicit value decision", () => {
    expect(collectMissingImplicitValueYAML(MetadataConfigurationRules, "MetadataConfigurationRules")).toEqual([])
  })

  it("requires catalog boolean and SystemEnumeration YAML properties to document implicit value decision", () => {
    expect(collectMissingImplicitValueYAML(MetadataCatalogRules, "MetadataCatalogRules")).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for catalog lengths and hierarchy level count", () => {
    const expected = {
      codeLength: 10,
      descriptionLength: 30,
      levelCount: 2,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(MetadataCatalogRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `MetadataCatalogRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for document number length", () => {
    expect(MetadataDocumentRules.properties.numberLength.implicitValueYAML).toBe(11)
  })

  it("keeps enumeration object belonging service fields explicit in YAML", () => {
    const rules = [
      ["MetadataEnumerationRules", MetadataEnumerationRules],
      ["MetadataEnumerationValueRules", MetadataEnumerationValueRules],
    ] as const

    const unexpected = rules
      .filter(([, rule]) => rule.properties.objectBelonging.noImplicitValueYAML !== true)
      .map(([ruleName]) => `${ruleName}.objectBelonging`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for style items", () => {
    expect(MetadataStyleItemRules.properties.type.implicitValueYAML).toBe("Font")
  })

  it("documents implicit YAML decisions for page form elements", () => {
    const expectedImplicitValues = {
      childItemsHorizontalAlign: "Auto",
      childItemsVerticalAlign: "Auto",
      displayImportance: "Auto",
      group: "Vertical",
      height: 0,
      horizontalSpacing: "Auto",
      itemsAndTitlesAlign: "Auto",
      showTitle: true,
      verticalScrollOnReduceSize: false,
      verticalSpacing: "Auto",
      visible: true,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PageRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PageRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = [
      "horizontalStretch",
      "scrollOnCompress",
      "slaveItemsWidth",
      "verticalAlign",
    ] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(PageRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `PageRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("documents implicit YAML decisions for pages form elements", () => {
    const expectedImplicitValues = {
      height: 0,
      visible: true,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PagesRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PagesRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(PagesRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `PagesRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for PDF document fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      height: 10,
      horizontalStretch: true,
      output: "Auto",
      titleHeight: 0,
      verticalStretch: true,
      viewStatusLocation: "Auto",
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PDFDocumentFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PDFDocumentFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("documents implicit YAML decisions for picture decorations", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      displayImportance: "Auto",
      enableDrag: false,
      enabled: true,
      enableStartDrag: false,
      fileDragMode: "AsFileRef",
      height: 0,
      horizontalAlignInGroup: "Auto",
      hyperlink: false,
      pictureSize: "RealSize",
      scale: 100,
      toolTipRepresentation: "Auto",
      verticalAlignInGroup: "Auto",
      visible: true,
      width: 0,
      zoomable: false,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PictureDecorationRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PictureDecorationRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch", "skipOnInput", "verticalStretch"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter(
        (propertyKey) => getRuleProperty(PictureDecorationRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `PictureDecorationRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for picture fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      enableDrag: false,
      enableStartDrag: false,
      fileDragMode: "AsFileRef",
      height: 0,
      horizontalStretch: true,
      hyperlink: false,
      scale: 100,
      titleHeight: 0,
      verticalStretch: true,
      width: 0,
      zoomable: false,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PictureFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PictureFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("documents implicit YAML decisions for popup form elements", () => {
    const expectedImplicitValues = {
      displayImportance: "Auto",
      height: 0,
      representation: "Auto",
      shape: "Auto",
      shapeRepresentation: "Auto",
      visible: true,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PopupRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PopupRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(PopupRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `PopupRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for progress bar fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      height: 1,
      horizontalStretch: true,
      orientation: "Horizontal",
      representation: "Smooth",
      showPercent: false,
      titleHeight: 0,
      verticalStretch: false,
      width: 32,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(ProgressBarFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ProgressBarFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for radio button fields", () => {
    const expected = {
      columnsCount: 0,
      itemHeight: 0,
      itemTitleHeight: 0,
      itemWidth: 0,
      radioButtonType: "Auto",
      titleHeight: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(RadioButtonFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `RadioButtonFieldRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["equalColumnsWidth"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter(
        (propertyKey) => getRuleProperty(RadioButtonFieldRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `RadioButtonFieldRules.${propertyKey}`)

    expect([...unexpected, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("documents implicit YAML decisions for search additions", () => {
    const searchControlRules = [
      ["SearchControlAdditionRules", SearchControlAdditionRules],
      ["SingleSearchControlAdditionRules", SingleSearchControlAdditionRules],
    ] as const
    const searchStringRules = [
      ["SearchStringAdditionRules", SearchStringAdditionRules],
      ["SingleSearchStringAdditionRules", SingleSearchStringAdditionRules],
    ] as const

    const expectedSearchControlImplicitValues = {
      autoMaxWidth: true,
      displayImportance: "Auto",
      enabled: true,
      horizontalAlignInGroup: "Auto",
      toolTipRepresentation: "Auto",
      verticalAlignInGroup: "Auto",
      width: 0,
    } as const
    const expectedSearchStringImplicitValues = {
      autoMaxWidth: true,
      enabled: true,
      width: 0,
    } as const

    const unexpectedSearchControlImplicitValues = searchControlRules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedSearchControlImplicitValues)
        .filter(
          ([propertyKey, implicitValueYAML]) =>
            getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )
    const unexpectedSearchStringImplicitValues = searchStringRules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedSearchStringImplicitValues)
        .filter(
          ([propertyKey, implicitValueYAML]) =>
            getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )

    const expectedNoImplicitValueYAML = ["horizontalStretch", "visible"] as const
    const unexpectedSearchControlNoImplicitValueYAML = searchControlRules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )
    const unexpectedSearchStringNoImplicitValueYAML = searchStringRules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([
      ...unexpectedSearchControlImplicitValues,
      ...unexpectedSearchStringImplicitValues,
      ...unexpectedSearchControlNoImplicitValueYAML,
      ...unexpectedSearchStringNoImplicitValueYAML,
    ]).toEqual([])
  })

  it("documents implicit YAML decisions for single view status additions", () => {
    const expectedImplicitValues = {
      autoMaxWidth: true,
      displayImportance: "Auto",
      enabled: true,
      horizontalAlign: "Auto",
      toolTipRepresentation: "Auto",
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(SingleViewStatusAdditionRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `SingleViewStatusAdditionRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch", "visible"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter(
        (propertyKey) =>
          getRuleProperty(SingleViewStatusAdditionRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `SingleViewStatusAdditionRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("keeps required accumulation register aggregate fields explicit in YAML", () => {
    const explicitRequiredFields = ["use", "periodicity"] as const

    const unexpected = explicitRequiredFields
      .filter(
        (propertyKey) =>
          getRuleProperty(AccumulationRegisterAggregateRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `AccumulationRegisterAggregateRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("keeps binary data storage location explicit for accounting flags because configurator does not expose it", () => {
    const rules = [
      ["AccountingFlagRules", AccountingFlagRules],
      ["ExtDimensionAccountingFlagRules", ExtDimensionAccountingFlagRules],
      ["MetadataExternalDataSourceCubeResourceRules", MetadataExternalDataSourceCubeResourceRules],
      ["MetadataRegisterAttributeRules", MetadataRegisterAttributeRules],
      ["MetadataRegisterDimensionRules", MetadataRegisterDimensionRules],
      ["MetadataRegisterResourceRules", MetadataRegisterResourceRules],
    ] as const

    const unexpected = rules
      .filter(([, rule]) => rule.properties.binaryDataStorageLocationUse.noImplicitValueYAML !== true)
      .map(([ruleName]) => `${ruleName}.binaryDataStorageLocationUse`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for metadata attribute binary data storage", () => {
    const rules = [
      ["MetadataAttributeRules", MetadataAttributeRules],
      ["MetadataCatalogAttributeRules", MetadataCatalogAttributeRules],
    ] as const

    const unexpected = rules
      .filter(([, rule]) => rule.properties.binaryDataStorageLocationUse.implicitValueYAML !== "Use")
      .map(([ruleName]) => `${ruleName}.binaryDataStorageLocationUse`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for integration service channels", () => {
    const expected = {
      messageDirection: "Send",
      transactioned: true,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(MetadataIntegrationServiceChannelRules.properties, propertyKey).implicitValueYAML !==
          implicitValueYAML
        )
      })
      .map(([propertyKey]) => `MetadataIntegrationServiceChannelRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("documents implicit YAML decisions for metadata tabular sections", () => {
    const rules = [
      ["MetadataBusinessProcessTabularSectionRules", MetadataBusinessProcessTabularSectionRules],
      ["MetadataChartOfAccountsTabularSectionRules", MetadataChartOfAccountsTabularSectionRules],
      ["MetadataChartOfCalculationTypesTabularSectionRules", MetadataChartOfCalculationTypesTabularSectionRules],
      ["MetadataChartOfCharacteristicTypesTabularSectionRules", MetadataChartOfCharacteristicTypesTabularSectionRules],
      ["MetadataDataProcessorTabularSectionRules", MetadataDataProcessorTabularSectionRules],
      ["MetadataDocumentTabularSectionRules", MetadataDocumentTabularSectionRules],
      ["MetadataExchangePlanTabularSectionRules", MetadataExchangePlanTabularSectionRules],
      ["MetadataReportTabularSectionRules", MetadataReportTabularSectionRules],
      ["MetadataTabularSectionRules", MetadataTabularSectionRules],
      ["MetadataTaskTabularSectionRules", MetadataTaskTabularSectionRules],
    ] as const

    const unexpectedLineNumberLength = rules
      .filter(([, rule]) => rule.properties.lineNumberLength.implicitValueYAML !== 5)
      .map(([ruleName]) => `${ruleName}.lineNumberLength`)

    const unexpectedObjectBelonging = rules
      .filter(([, rule]) => rule.properties.objectBelonging.noImplicitValueYAML !== true)
      .map(([ruleName]) => `${ruleName}.objectBelonging`)

    expect([...unexpectedLineNumberLength, ...unexpectedObjectBelonging]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for calculated field order expressions", () => {
    const expected = {
      autoOrder: false,
      orderType: "Asc",
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(CalculatedFieldOrderExpressionRules.properties, propertyKey).implicitValueYAML !==
          implicitValueYAML
        )
      })
      .map(([propertyKey]) => `CalculatedFieldOrderExpressionRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for DCS parameters", () => {
    expect(DCSParameterRules.properties.denyIncompleteValues.implicitValueYAML).toBe(false)
  })

  it("uses configurator defaults as implicit YAML values for DCS filter items", () => {
    const expectedComparisonValues = {
      application: "Items",
    } as const
    const expectedGroupValues = {
      application: "Items",
      groupType: "AndGroup",
      use: true,
    } as const

    const unexpectedComparisonValues = Object.entries(expectedComparisonValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(FilterItemComparisonRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `FilterItemComparisonRules.${propertyKey}`)

    const unexpectedGroupValues = Object.entries(expectedGroupValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(FilterItemGroupRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `FilterItemGroupRules.${propertyKey}`)

    expect([...unexpectedComparisonValues, ...unexpectedGroupValues]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for exchange plan content items", () => {
    expect(ExchangePlanContentItemRules.properties.autoRecord.implicitValueYAML).toBe("Allow")
  })

  it("uses configurator defaults as implicit YAML values for extended tooltips", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      displayImportance: "Auto",
      height: 0,
      horizontalAlign: "Left",
      horizontalAlignInGroup: "Auto",
      hyperlink: false,
      titleHeight: 0,
      verticalAlign: "Auto",
      verticalAlignInGroup: "Auto",
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(ExtendedTooltipRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ExtendedTooltipRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = [
      "enabled",
      "horizontalStretch",
      "skipOnInput",
      "toolTipRepresentation",
      "verticalStretch",
      "visible",
    ] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter(
        (propertyKey) => getRuleProperty(ExtendedTooltipRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `ExtendedTooltipRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for formatted document fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      height: 10,
      horizontalStretch: true,
      output: "Auto",
      titleHeight: 0,
      verticalStretch: true,
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(FormattedDocumentFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `FormattedDocumentFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for text document fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      height: 10,
      horizontalStretch: true,
      titleHeight: 0,
      verticalStretch: true,
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(TextDocumentFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `TextDocumentFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for track bar fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      height: 2,
      horizontalStretch: true,
      markingAppearance: "BottomRight",
      orientation: "Horizontal",
      verticalStretch: false,
      width: 32,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(TrackBarFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `TrackBarFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("documents implicit YAML decisions for usual groups", () => {
    const expectedImplicitValues = {
      collapsed: false,
      height: 0,
      horizontalStretch: false,
      showLeftMargin: true,
      united: true,
      visible: true,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(UsualGroupRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `UsualGroupRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["slaveItemsWidth"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(UsualGroupRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `UsualGroupRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for form attributes", () => {
    const expected = {
      mainAttribute: false,
      storedData: false,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(FormAttributeRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `FormAttributeRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for form commands", () => {
    const expected = {
      currentRowUse: "Auto",
      modifiesSavedData: false,
      representation: "Auto",
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(FormCommandRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `FormCommandRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for form parameters", () => {
    expect(FormParameterRules.properties.keyParameter.implicitValueYAML).toBe(false)
  })

  it("uses YAML shorthand default as implicit YAML value for automatic DCS group items", () => {
    expect(GroupItemAutoRules.properties.use.implicitValueYAML).toBe(true)
  })

  it("uses configurator defaults as implicit YAML values for gantt chart fields", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      height: 10,
      horizontalStretch: true,
      intervalsSelectionMode: "Auto",
      tableLocation: "Auto",
      titleHeight: 0,
      valuesSelectionMode: "Auto",
      verticalStretch: true,
      width: 50,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(GanttChartFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `GanttChartFieldRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalLines", "verticalLines"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter(
        (propertyKey) => getRuleProperty(GanttChartFieldRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `GanttChartFieldRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for dynamic lists", () => {
    const expected = {
      autoFillAvailableFields: true,
      itemsViewMode: "Normal",
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(DynamicListRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `DynamicListRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses enabled size flags as implicit YAML values for chart-like form fields", () => {
    const sizeFlags = ["autoMaxHeight", "autoMaxWidth", "horizontalStretch", "verticalStretch"] as const
    const rules = [
      ["ChartFieldRules", ChartFieldRules],
      ["DendrogramFieldRules", DendrogramFieldRules],
      ["GeographicalSchemaFieldRules", GeographicalSchemaFieldRules],
      ["GraphicalSchemaFieldRules", GraphicalSchemaFieldRules],
      ["HTMLDocumentFieldRules", HTMLDocumentFieldRules],
    ] as const

    const unexpected = rules.flatMap(([ruleName, rule]) =>
      sizeFlags
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for chart field size properties", () => {
    const expected = {
      height: 10,
      titleHeight: 0,
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(ChartFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ChartFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for dendrogram field size properties", () => {
    const expected = {
      height: 10,
      titleHeight: 0,
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(DendrogramFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `DendrogramFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for geographical schema field size properties", () => {
    const expected = {
      height: 10,
      titleHeight: 0,
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(GeographicalSchemaFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `GeographicalSchemaFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for graphical schema field size properties", () => {
    const expected = {
      height: 10,
      titleHeight: 0,
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(GraphicalSchemaFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `GraphicalSchemaFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for HTML document field size properties", () => {
    const expected = {
      height: 0,
      titleHeight: 0,
      width: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(HTMLDocumentFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `HTMLDocumentFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for calendar field flags", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      border: "Single",
      calendarNavigation: true,
      enableDrag: false,
      enableStartDrag: false,
      height: 9,
      heightInMonths: 1,
      horizontalStretch: true,
      selectionMode: "Single",
      showCurrentDate: true,
      showMonthsPanel: false,
      titleHeight: 0,
      verticalStretch: true,
      width: 16,
      widthInMonths: 1,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(CalendarFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `CalendarFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for period field size properties", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      border: "Single",
      height: 0,
      titleHeight: 0,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PeriodFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PeriodFieldRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch", "verticalStretch"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(PeriodFieldRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `PeriodFieldRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for form buttons", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      check: false,
      commandUniqueness: true,
      defaultButton: false,
      defaultItem: false,
      enabled: true,
      height: 0,
      horizontalStretch: false,
      maxHeight: 0,
      maxWidth: 0,
      titleHeight: 0,
      verticalStretch: false,
      visible: true,
      width: 0,
    } as const
    const expectedNoImplicitValueYAML = ["onlyInAllActions", "skipOnInput"] as const
    const rules = [
      ["ButtonRules", ButtonRules],
      ["CommandBarButtonRules", CommandBarButtonRules],
    ] as const

    const unexpectedImplicitValues = rules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedImplicitValues)
        .filter(([propertyKey, implicitValueYAML]) => {
          return getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        })
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )

    const unexpectedNoImplicitValueYAML = rules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for button groups", () => {
    const expected = {
      height: 0,
      horizontalStretch: false,
      representation: "Auto",
      visible: true,
      width: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(ButtonGroupRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ButtonGroupRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for automatic command bars", () => {
    const expected = {
      autofill: "Истина",
      displayImportance: "Auto",
      horizontalAlign: "Left",
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(AutoCommandBarRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `AutoCommandBarRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for command bars", () => {
    const expected = {
      autofill: false,
      displayImportance: "Auto",
      height: 0,
      horizontalAlign: "Left",
      horizontalStretch: false,
      visible: true,
      width: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(CommandBarRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `CommandBarRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("keeps hidden context menu properties explicit in YAML", () => {
    const explicitFields = ["autofill", "displayImportance"] as const

    const unexpected = explicitFields
      .filter((propertyKey) => getRuleProperty(ContextMenuRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `ContextMenuRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for document forms", () => {
    const expected = {
      autoTime: "CurrentOrLast",
      repostOnWrite: true,
      usePostingMode: "Auto",
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(ClientApplicationFormRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `ClientApplicationFormRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("keeps hidden or specialized client form state properties explicit in YAML", () => {
    const explicitFields = [
      "choiceAvailable",
      "choiceMode",
      "closeOnChoice",
      "closeOnOwnerClose",
      "modalMode",
      "modified",
      "readOnly",
      "reportFormType",
      "savedInSettingsDataModified",
    ] as const

    const unexpected = explicitFields
      .filter(
        (propertyKey) =>
          getRuleProperty(ClientApplicationFormRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `ClientApplicationFormRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for progress bar field limits", () => {
    const expected = {
      maxHeight: 0,
      maxValue: 100,
      maxWidth: 0,
      minValue: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(ProgressBarFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ProgressBarFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for input fields", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      choiceListHeight: 0,
      chooseType: true,
      dropListWidth: 0,
      height: 0,
      listChoiceMode: false,
      textEdit: true,
      titleHeight: 0,
      width: 0,
      wrap: true,
    } as const
    const expectedNoImplicitValueYAML = [
      "autoChoiceIncomplete",
      "autoMarkIncomplete",
      "allowInputEmptyMultipleValues",
      "allowMultipleValuesDuplicates",
      "choiceButton",
      "choiceListButton",
      "clearButton",
      "createButton",
      "dropListButton",
      "extendedEdit",
      "horizontalStretch",
      "markNegatives",
      "multiLine",
      "multipleValuesExtendedEdit",
      "multipleValuesHyperlink",
      "openButton",
      "passwordMode",
      "quickChoice",
      "showCheckBoxesInDropListWhenInputMultipleValues",
      "skipOnInput",
      "spinButton",
      "verticalStretch",
    ] as const
    const rules = [
      ["InputFieldRules", InputFieldRules],
      ["TableInputFieldRules", TableInputFieldRules],
    ] as const

    const unexpectedImplicitValues = rules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedImplicitValues)
        .filter(([propertyKey, implicitValueYAML]) => {
          return getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        })
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )

    const unexpectedNoImplicitValueYAML = rules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for label decorations", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      displayImportance: "Auto",
      enabled: true,
      height: 0,
      horizontalAlign: "Left",
      horizontalAlignInGroup: "Auto",
      hyperlink: false,
      titleHeight: 0,
      toolTipRepresentation: "Auto",
      verticalAlign: "Auto",
      verticalAlignInGroup: "Auto",
      visible: true,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(LabelDecorationRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `LabelDecorationRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["horizontalStretch", "skipOnInput", "verticalStretch"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter(
        (propertyKey) => getRuleProperty(LabelDecorationRules.properties, propertyKey).noImplicitValueYAML !== true
      )
      .map((propertyKey) => `LabelDecorationRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for label fields", () => {
    const expectedImplicitValues = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      border: "WithoutBorder",
      height: 0,
      hyperlink: false,
      titleHeight: 0,
      width: 0,
    } as const
    const expectedNoImplicitValueYAML = [
      "horizontalStretch",
      "markNegatives",
      "passwordMode",
      "verticalStretch",
    ] as const
    const rules = [
      ["LabelFieldRules", LabelFieldRules],
      ["TableLabelFieldRules", TableLabelFieldRules],
    ] as const

    const unexpectedImplicitValues = rules.flatMap(([ruleName, rule]) =>
      Object.entries(expectedImplicitValues)
        .filter(([propertyKey, implicitValueYAML]) => {
          return getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        })
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )

    const unexpectedNoImplicitValueYAML = rules.flatMap(([ruleName, rule]) =>
      expectedNoImplicitValueYAML
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for checkbox fields", () => {
    const expected = {
      checkBoxType: "Auto",
      enabled: true,
      equalItemsWidth: false,
      itemHeight: 0,
      itemTitleHeight: 0,
      itemWidth: 0,
      readOnly: false,
      threeState: false,
      titleHeight: 0,
      titleLocation: "Auto",
      toolTipRepresentation: "Auto",
      verticalAlign: "Auto",
      verticalAlignInGroup: "Auto",
      visible: true,
    } as const
    const rules = [
      ["CheckBoxFieldRules", CheckBoxFieldRules],
      ["TableCheckBoxFieldRules", TableCheckBoxFieldRules],
    ] as const

    const unexpectedImplicitValues = rules.flatMap(([ruleName, rule]) =>
      Object.entries(expected)
        .filter(([propertyKey, implicitValueYAML]) => {
          return getRuleProperty(rule.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        })
        .map(([propertyKey]) => `${ruleName}.${propertyKey}`)
    )
    const unexpectedNoImplicitValueYAML = rules.flatMap(([ruleName, rule]) =>
      ["skipOnInput"]
        .filter((propertyKey) => getRuleProperty(rule.properties, propertyKey).noImplicitValueYAML !== true)
        .map((propertyKey) => `${ruleName}.${propertyKey}`)
    )

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for column groups", () => {
    const expectedImplicitValues = {
      height: 0,
      horizontalStretch: false,
      showInHeader: false,
      visible: true,
      width: 0,
    } as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(ColumnGroupRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `ColumnGroupRules.${propertyKey}`)

    const expectedNoImplicitValueYAML = ["showTitle"] as const
    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(ColumnGroupRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `ColumnGroupRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for tables", () => {
    const expectedImplicitValues = {
      autoInsertNewRow: true,
      autoMaxHeight: true,
      autoMaxHeightInTableRows: true,
      autoMaxWidth: true,
      autoRefreshPeriod: 60,
      autofill: false,
      behaviorOnHorizontalCompression: "Auto",
      changeRowOrder: true,
      changeRowSet: true,
      choiceFoldersAndItems: "Items",
      choiceMode: false,
      commandBarLocation: "Auto",
      currentRowUse: "Auto",
      defaultItem: false,
      displayImportance: "Auto",
      enabled: true,
      enableDrag: true,
      enableStartDrag: true,
      fileDragMode: "AsFileRef",
      footer: false,
      footerHeight: 1,
      header: true,
      headerHeight: 1,
      height: 0,
      heightControlVariant: "Auto",
      heightInTableRows: 0,
      horizontalAlignInGroup: "Auto",
      horizontalLines: true,
      horizontalStretch: true,
      initialListView: "Auto",
      initialTreeView: "NoExpand",
      maxHeightInTableRows: 0,
      multipleChoice: false,
      onMainServerUnavalableBehavior: "Auto",
      output: "Auto",
      readOnly: false,
      refreshRequest: "None",
      representation: "List",
      allowGettingCurrentRowURL: true,
      allowRootChoice: false,
      restoreCurrentRow: false,
      rowInputMode: "EndOfList",
      rowSelectionMode: "Cell",
      searchControlLocation: "Auto",
      searchOnInput: "Auto",
      searchStringLocation: "Auto",
      selectionMode: "MultiRow",
      showRoot: true,
      titleHeight: 0,
      titleLocation: "None",
      toolTipRepresentation: "Auto",
      updateOnDataChange: "Auto",
      useAlternationRowColor: false,
      verticalLines: true,
      verticalStretch: true,
      viewStatusLocation: "Auto",
      visible: true,
      width: 0,
    } as const
    const expectedNoImplicitValueYAML = [
      "autoAddIncomplete",
      "autoMarkIncomplete",
      "settingsNamedItemDetailedRepresentation",
      "skipOnInput",
      "viewMode",
    ] as const

    const unexpectedImplicitValues = Object.entries(expectedImplicitValues)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(TableRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `TableRules.${propertyKey}`)

    const unexpectedNoImplicitValueYAML = expectedNoImplicitValueYAML
      .filter((propertyKey) => getRuleProperty(TableRules.properties, propertyKey).noImplicitValueYAML !== true)
      .map((propertyKey) => `TableRules.${propertyKey}`)

    expect([...unexpectedImplicitValues, ...unexpectedNoImplicitValueYAML]).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for client application forms", () => {
    const expected = {
      autoFillCheck: true,
      autoSaveDataInSettings: "DontUse",
      autoTitle: true,
      autoURL: true,
      childItemsHorizontalAlign: "Auto",
      childItemsVerticalAlign: "Auto",
      collapseItemsByImportance: "Auto",
      commandBarLocation: "Auto",
      conversationsRepresentation: "Auto",
      customizable: true,
      enabled: true,
      enterKeyBehavior: "ControlNavigation",
      formWindowOpeningMode: "DontBlock",
      group: "Vertical",
      height: 0,
      horizontalSpacing: "Auto",
      itemsAndTitlesAlign: "Auto",
      saveDataInSettings: "DontUse",
      saveWindowSettings: true,
      scale: 100,
      scalingMode: "Auto",
      showCloseButton: true,
      showTitle: true,
      verticalScroll: "auto",
      verticalSpacing: "Auto",
      width: 0,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(ClientApplicationFormRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `ClientApplicationFormRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for planner fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      dimensionItemHyperlink: false,
      enableDrag: false,
      enableStartDrag: false,
      height: 10,
      horizontalStretch: true,
      timeScaleItemHyperlink: false,
      titleHeight: 0,
      verticalStretch: true,
      width: 50,
      wrappedTimeScaleHeaderHyperlink: false,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return getRuleProperty(PlannerFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
      })
      .map(([propertyKey]) => `PlannerFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("uses configurator defaults as implicit YAML values for spreadsheet document fields", () => {
    const expected = {
      autoMaxHeight: true,
      autoMaxWidth: true,
      blackAndWhiteView: false,
      drawingSelectionShowMode: "Auto",
      edit: false,
      enableDrag: true,
      enableStartDrag: true,
      height: 10,
      horizontalStretch: true,
      output: "Auto",
      pointerType: "Special",
      protection: false,
      selectionShowMode: "Always",
      showCellNames: false,
      showGrid: false,
      showGroups: true,
      showHeaders: false,
      showRowAndColumnNames: false,
      titleHeight: 0,
      verticalStretch: true,
      viewScalingMode: "Auto",
      width: 50,
    } as const

    const unexpected = Object.entries(expected)
      .filter(([propertyKey, implicitValueYAML]) => {
        return (
          getRuleProperty(SpreadSheetDocumentFieldRules.properties, propertyKey).implicitValueYAML !== implicitValueYAML
        )
      })
      .map(([propertyKey]) => `SpreadSheetDocumentFieldRules.${propertyKey}`)

    expect(unexpected).toEqual([])
  })

  it("requires boolean and SystemEnumeration YAML properties with defaultValueXML to have implicitValueYAML", () => {
    const missing = collectRules().flatMap(({ exportName, rule }) =>
      collectMissingImplicitValueYAMLForXMLDefault(rule, exportName)
    )

    expect(missing).toEqual([])
  })

  it("uses zero as implicit YAML value for unset max size form properties", () => {
    const missing = collectRules().flatMap(({ exportName, rule }) =>
      collectMissingMaxSizeImplicitValueYAML(rule, exportName)
    )

    expect(missing).toEqual([])
  })
})

function collectRules(): Array<{ exportName: string; rule: MetadataItemRule }> {
  const rules: Array<{ exportName: string; rule: MetadataItemRule }> = []

  for (const module of Object.values(ruleModules)) {
    for (const [exportName, value] of Object.entries(module)) {
      if (exportName.endsWith("Rules") && isMetadataItemRule(value)) {
        rules.push({ exportName, rule: value })
      }
    }
  }

  return rules
}

function collectMissingImplicitValueYAML(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([, propertyRule]) => needsImplicitValueDecision(propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingImplicitValueYAML(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function collectMissingImplicitValueYAMLForXMLDefault(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([, propertyRule]) => needsImplicitValueForXMLDefault(propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingImplicitValueYAMLForXMLDefault(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function collectMissingMaxSizeImplicitValueYAML(rule: MetadataItemRule, path: string): string[] {
  const propertyMissing = Object.entries(rule.properties)
    .filter(([key, propertyRule]) => needsMaxSizeImplicitValueYAML(key, propertyRule))
    .map(([key]) => `${path}.${key}`)

  const childMissing =
    rule.childCollections?.flatMap(({ propertyKey, itemRule }) =>
      collectMissingMaxSizeImplicitValueYAML(itemRule, `${path}.${propertyKey}`)
    ) ?? []

  return [...propertyMissing, ...childMissing]
}

function getRuleProperty(properties: MetadataItemRule["properties"], key: string): PropertyRule {
  return properties[key]
}

function needsImplicitValueDecision(rule: PropertyRule): boolean {
  if (rule.type !== "boolean" && rule.type !== "SystemEnumeration") return false
  if (!rule.yaml) return false
  if (rule.runtimeOnly === true || rule.syncExternalOnly === true) return false
  if (rule.toYAML === false && rule.fromYAML === false) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function needsImplicitValueForXMLDefault(rule: PropertyRule): boolean {
  if (rule.type !== "boolean" && rule.type !== "SystemEnumeration") return false
  if (!rule.yaml) return false
  if (!("defaultValueXML" in rule)) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function needsMaxSizeImplicitValueYAML(key: string, rule: PropertyRule): boolean {
  if (key !== "maxHeight" && key !== "maxWidth") return false
  if (rule.type !== "number") return false
  if (!rule.yaml) return false
  if (rule.runtimeOnly === true || rule.syncExternalOnly === true) return false
  if (rule.toYAML === false && rule.fromYAML === false) return false
  if ("implicitValueYAML" in rule) return false
  if ("noImplicitValueYAML" in rule) return false
  return true
}

function isMetadataItemRule(value: unknown): value is MetadataItemRule {
  if (value === null || typeof value !== "object") return false
  const candidate = value as Partial<MetadataItemRule>
  return typeof candidate.itemType === "string" && candidate.properties !== undefined
}
