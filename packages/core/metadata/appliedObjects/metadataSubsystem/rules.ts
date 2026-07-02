import { rootCommandInterfaceRule } from "~/metadata/appliedObjects/configuration/builders"
import { childSubsystemNamesRule } from "~/metadata/commonObjects/childSubsystemNames/types"
import { helpRule } from "~/metadata/commonObjects/help/types"
import { metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { pictureRule } from "~/metadata/commonObjects/metadataTargets/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import "~/metadata/commonObjects/rootCommandInterface/register"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
const contentObjectPaths = [
  ["Document"],
  ["DocumentNumerator"],
  ["InformationRegister"],
  ["ChartOfCharacteristicTypes"],
  ["Catalog"],
  ["CommonModule"],
  ["SessionParameter"],
  ["Role"],
  ["CommonAttribute"],
  ["ExchangePlan"],
  ["FilterCriterion"],
  ["EventSubscription"],
  ["ScheduledJob"],
  ["Bot"],
  ["FunctionalOption"],
  ["FunctionalOptionsParameter"],
  ["DefinedType"],
  ["SettingsStorage"],
  ["CommonCommand"],
  ["CommandGroup"],
  ["CommonForm"],
  ["CommonTemplate"],
  ["CommonPicture"],
  ["XDTOPackage"],
  ["WebService"],
  ["HTTPService"],
  ["WSReference"],
  ["WebSocketClient"],
  ["IntegrationService"],
  ["StyleItem"],
  ["Style"],
  ["Constant"],
  ["DocumentJournal"],
  ["Enum"],
  ["Report"],
  ["DataProcessor"],
  ["ChartOfAccounts"],
  ["ChartOfCalculationTypes"],
  ["AccumulationRegister"],
  ["AccountingRegister"],
  ["CalculationRegister"],
  ["BusinessProcess"],
  ["Task"],
  ["Sequence"],
  ["ExternalDataSource", "Table"],
  ["ExternalDataSource", "Cube", "DimensionTable"],
  ["ExternalDataSource", "Cube"],
] as const
export const MetadataSubsystemRules = {
  itemType: "MetadataSubsystem",
  metadataTargetOwner: { kind: "self", root: "Subsystem" },
  itemTypePrefix: "Подсистема",
  xmlDir: "Subsystems",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Subsystem",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      xml: "IncludeHelpInContents",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    includeInCommandInterface: booleanRule({
      yaml: "ВключатьВКомандныйИнтерфейс",
      xml: "IncludeInCommandInterface",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    useOneCommand: booleanRule({
      yaml: "ИспользоватьОднуКоманду",
      xml: "UseOneCommand",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xml: "Explanation",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    picture: pictureRule({
      yaml: "Картинка",
      xml: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    content: metadataItemLinksRule({
      yaml: "Состав",
      xml: "Content",
      metadataTarget: { kind: "object", allowedObjectPaths: contentObjectPaths, nestedObjectRoots: ["Subsystem"] },
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    subsystems: childSubsystemNamesRule({
      yaml: "Подсистемы",
      xml: "Subsystem",
      xmlParents: childObjects,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
    commandInterface: rootCommandInterfaceRule({
      yaml: "КомандныйИнтерфейс",
      filePath: "Ext/CommandInterface.xml",
      exportReferenceFileOnMissingValue: true,
    }),
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
