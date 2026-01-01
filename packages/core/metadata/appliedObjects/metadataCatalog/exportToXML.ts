import { v4 } from "uuid"
import {
  CatalogInternalInfoParamsXML,
  MetadataCatalog,
  MetadataCatalogStandardAttributeNames,
  MetadataCatalogXML,
} from "~/metadata/appliedObjects/metadataCatalog/types"
import { exportMetadataCommandsToXML } from "~/metadata/appliedObjects/metadataCommand/exportToXML"
import { exportAdditionalIndexesToXML } from "~/metadata/commonObjects/additionalIndex/exportToXML"
import { exportCharacteristicsDescriptionsToXML } from "~/metadata/commonObjects/characteristicsDescription/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataFieldsToXML } from "~/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataTabularSectionsToXML } from "~/metadata/commonObjects/metadataTabularSection/exportToXML"
import { exportMetadataValueCollectionToXML } from "~/metadata/commonObjects/metadataValueCollection/exportToXML"
import { exportPredefinedItemsToXML } from "~/metadata/commonObjects/predifined/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { exportInternalInfoToXML } from "../../commonObjects/internalInfo/exportToXML"
import { exportMetadataAttributesToXML } from "../../commonObjects/metadataAttribute/exportToXML"
import { getDefaults } from "./defaults"

export interface MetadataCatalogContext extends Context {
  context: {
    forms: string[]
    templates: string[]
    parentName: string
  }
}

export const exportMetadataCatalogToXML = (
  context: MetadataCatalogContext,
  data: MetadataCatalog | undefined
): MetadataCatalogXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const internalInfo = exportInternalInfoToXML<CatalogInternalInfoParamsXML>([
    { name: `CatalogObject.${mergedData.name}`, category: "Object" },
    { name: `CatalogRef.${mergedData.name}`, category: "Ref" },
    { name: `CatalogSelection.${mergedData.name}`, category: "Selection" },
    { name: `CatalogList.${mergedData.name}`, category: "List" },
    { name: `CatalogManager.${mergedData.name}`, category: "Manager" },
  ])

  const properties: MetadataCatalogXML["Catalog"]["Properties"] = {} as MetadataCatalogXML["Catalog"]["Properties"]

  const additionalIndexes = exportAdditionalIndexesToXML(context, mergedData.additionalIndexes)
  if (additionalIndexes) properties.AdditionalIndexes = additionalIndexes

  if (mergedData.autonumbering !== undefined) properties.Autonumbering = mergedData.autonumbering

  if (mergedData.auxiliaryChoiceForm !== undefined) properties.AuxiliaryChoiceForm = mergedData.auxiliaryChoiceForm

  if (mergedData.auxiliaryFolderChoiceForm !== undefined)
    properties.AuxiliaryFolderChoiceForm = mergedData.auxiliaryFolderChoiceForm

  if (mergedData.auxiliaryFolderForm !== undefined) properties.AuxiliaryFolderForm = mergedData.auxiliaryFolderForm

  if (mergedData.auxiliaryListForm !== undefined) properties.AuxiliaryListForm = mergedData.auxiliaryListForm

  if (mergedData.auxiliaryObjectForm !== undefined) properties.AuxiliaryObjectForm = mergedData.auxiliaryObjectForm

  const basedOn = exportMetadataValueCollectionToXML(context, mergedData.basedOn)
  if (basedOn) properties.BasedOn = basedOn

  const characteristics = exportCharacteristicsDescriptionsToXML(context, mergedData.characteristics)
  if (characteristics) properties.Characteristics = characteristics

  if (mergedData.checkUnique !== undefined) properties.CheckUnique = mergedData.checkUnique

  if (mergedData.choiceDataGetModeOnInputByString !== undefined)
    properties.ChoiceDataGetModeOnInputByString = mergedData.choiceDataGetModeOnInputByString

  if (mergedData.choiceHistoryOnInput !== undefined) properties.ChoiceHistoryOnInput = mergedData.choiceHistoryOnInput

  if (mergedData.choiceMode !== undefined) properties.ChoiceMode = mergedData.choiceMode

  if (mergedData.codeAllowedLength !== undefined) properties.CodeAllowedLength = mergedData.codeAllowedLength

  if (mergedData.codeLength !== undefined) properties.CodeLength = mergedData.codeLength

  if (mergedData.codeSeries !== undefined) properties.CodeSeries = mergedData.codeSeries

  if (mergedData.codeType !== undefined) properties.CodeType = mergedData.codeType

  if (mergedData.comment !== undefined) properties.Comment = mergedData.comment

  if (mergedData.createOnInput !== undefined) properties.CreateOnInput = mergedData.createOnInput

  if (mergedData.dataHistory !== undefined) properties.DataHistory = mergedData.dataHistory

  if (mergedData.dataLockControlMode !== undefined) properties.DataLockControlMode = mergedData.dataLockControlMode

  const dataLockFields = exportMetadataFieldsToXML(context, mergedData.dataLockFields)
  if (dataLockFields) properties.DataLockFields = dataLockFields

  if (mergedData.defaultChoiceForm !== undefined) properties.DefaultChoiceForm = mergedData.defaultChoiceForm

  if (mergedData.defaultFolderChoiceForm !== undefined)
    properties.DefaultFolderChoiceForm = mergedData.defaultFolderChoiceForm

  if (mergedData.defaultFolderForm !== undefined) properties.DefaultFolderForm = mergedData.defaultFolderForm

  if (mergedData.defaultListForm !== undefined) properties.DefaultListForm = mergedData.defaultListForm

  if (mergedData.defaultObjectForm !== undefined) properties.DefaultObjectForm = mergedData.defaultObjectForm

  if (mergedData.defaultPresentation !== undefined) properties.DefaultPresentation = mergedData.defaultPresentation

  if (mergedData.descriptionLength !== undefined) properties.DescriptionLength = mergedData.descriptionLength

  if (mergedData.editType !== undefined) properties.EditType = mergedData.editType

  if (mergedData.executeAfterWriteDataHistoryVersionProcessing !== undefined)
    properties.ExecuteAfterWriteDataHistoryVersionProcessing = mergedData.executeAfterWriteDataHistoryVersionProcessing

  const explanation = exportI8nTextToXML(context, mergedData.explanation)
  if (explanation !== undefined) properties.Explanation = explanation

  const extendedListPresentation = exportI8nTextToXML(context, mergedData.extendedListPresentation)
  if (extendedListPresentation !== undefined) properties.ExtendedListPresentation = extendedListPresentation

  const extendedObjectPresentation = exportI8nTextToXML(context, mergedData.extendedObjectPresentation)
  if (extendedObjectPresentation !== undefined) properties.ExtendedObjectPresentation = extendedObjectPresentation

  if (mergedData.foldersOnTop !== undefined) properties.FoldersOnTop = mergedData.foldersOnTop

  if (mergedData.fullTextSearch !== undefined) properties.FullTextSearch = mergedData.fullTextSearch

  if (mergedData.fullTextSearchOnInputByString !== undefined)
    properties.FullTextSearchOnInputByString = mergedData.fullTextSearchOnInputByString

  if (mergedData.hierarchical !== undefined) properties.Hierarchical = mergedData.hierarchical

  if (mergedData.hierarchyType !== undefined) properties.HierarchyType = mergedData.hierarchyType

  if (mergedData.includeHelpInContents !== undefined)
    properties.IncludeHelpInContents = mergedData.includeHelpInContents

  const inputByString = exportMetadataFieldsToXML(context, mergedData.inputByString)
  if (inputByString) properties.InputByString = inputByString

  if (mergedData.levelCount !== undefined) properties.LevelCount = mergedData.levelCount

  if (mergedData.limitLevelCount !== undefined) properties.LimitLevelCount = mergedData.limitLevelCount

  const listPresentation = exportI8nTextToXML(context, mergedData.listPresentation)
  if (listPresentation !== undefined) properties.ListPresentation = listPresentation

  properties.Name = mergedData.name

  if (mergedData.objectBelonging !== undefined) properties.ObjectBelonging = mergedData.objectBelonging

  const objectPresentation = exportI8nTextToXML(context, mergedData.objectPresentation)
  if (objectPresentation !== undefined) properties.ObjectPresentation = objectPresentation

  const owners = exportMetadataValueCollectionToXML(context, mergedData.owners)
  if (owners) properties.Owners = owners

  const predefined = exportPredefinedItemsToXML(context, mergedData.predefined)
  if (predefined) properties.Predefined = predefined

  if (mergedData.predefinedDataUpdate !== undefined) properties.PredefinedDataUpdate = mergedData.predefinedDataUpdate

  if (mergedData.quickChoice !== undefined) properties.QuickChoice = mergedData.quickChoice

  if (mergedData.searchStringModeOnInputByString !== undefined)
    properties.SearchStringModeOnInputByString = mergedData.searchStringModeOnInputByString

  const standardAttributes = exportStandardAttributeDescriptionsToXML(
    context,
    mergedData.standardAttributes,
    MetadataCatalogStandardAttributeNames
  )
  if (standardAttributes) properties.StandardAttributes = standardAttributes

  if (mergedData.subordinationUse !== undefined) properties.SubordinationUse = mergedData.subordinationUse

  const synonym = exportI8nTextToXML(context, mergedData.synonym)
  if (synonym !== undefined) properties.Synonym = synonym

  if (mergedData.updateDataHistoryImmediatelyAfterWrite !== undefined)
    properties.UpdateDataHistoryImmediatelyAfterWrite = mergedData.updateDataHistoryImmediatelyAfterWrite

  if (mergedData.useStandardCommands !== undefined) properties.UseStandardCommands = mergedData.useStandardCommands

  const attributes = exportMetadataAttributesToXML(context, mergedData.attributes)
  const commands = exportMetadataCommandsToXML(context, mergedData.commands)
  const tabularSections = exportMetadataTabularSectionsToXML(context, mergedData.tabularSections)
  const forms = getFormsFromContext(context)
  const templates = getTemplatesFromContext(context)

  const childObjects: MetadataCatalogXML["Catalog"]["ChildObjects"] = {}
  if (attributes) childObjects.Attribute = attributes
  if (tabularSections) childObjects.TabularSection = tabularSections
  if (forms) childObjects.Form = forms
  if (templates) childObjects.Template = templates
  if (commands) childObjects.Command = commands

  const result: MetadataCatalogXML = {
    "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "_xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
    "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
    "_xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _xmlns: "http://v8.1c.ru/8.3/MDClasses",
    _version: "2.20",
    Catalog: {
      _uuid: v4(),
      InternalInfo: internalInfo,
      Properties: properties,
      ...(Object.keys(childObjects).length > 0 ? { ChildObjects: childObjects } : {}),
    },
  }

  return compactObject<MetadataCatalogXML>(result)
}

const getFormsFromContext = (context: MetadataCatalogContext): string[] | undefined => {
  if (!context.context) throw new Error("Context is not defined")

  return context.context.forms.length > 0 ? context.context.forms : undefined
}

const getTemplatesFromContext = (context: MetadataCatalogContext): string[] | undefined => {
  if (!context.context) throw new Error("Context is not defined")

  return context.context.templates.length > 0 ? context.context.templates : undefined
}
