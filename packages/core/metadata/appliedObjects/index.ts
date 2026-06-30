import "./metadataCommand/register"
import "./metadataCommonCommand"

import "./metadataCatalog/register"
import "./metadataCatalog/fromYAML"
import "./metadataCatalog/toYAML"

import "./metadataConstant"
import "./metadataBot"
import "./metadataCommonAttribute"
import "./metadataDefinedType"
import "./metadataEventSubscription"
import "./metadataFilterCriterion"
import "./metadataFunctionalOptionsParameter"
import "./metadataSettingsStorage"

import "./metadataDocument/register"
import "./metadataDocument"
import "./metadataDataProcessor"
import "./metadataReport"
import "./metadataDocumentJournal"
import "./metadataHTTPService"
import "./metadataInformationRegister"
import "./metadataAccumulationRegister"
import "./metadataExchangePlan"
import "./metadataDocumentNumerator"

import "./metadataEnumeration/register"
import "./metadataEnumeration"

import "./metadataSequence"
import "./metadataSessionParameter"
import "./metadataStyleItem/register"
import "./metadataWSReference"

import "./metadataFunctionalOption"
import "./metadataRole"
import "./metadataScheduledJob"
import "./metadataLanguage"
import "./metadataCommonTemplate"
import "./metadataCommonModule"
import "./metadataXDTOPackage"
import "./metadataWebSocketClient"
import "./metadataExternalDataSource/register"
import "./metadataCommonPicture/register"
import "./metadataStyle"
import "./metadataCommandGroup"
import "./metadataSubsystem/register"
import "./metadataAccountingRegister"
import "./metadataBusinessProcess"
import "./metadataCalculationRegister"
import "./metadataChartOfAccounts"
import "./metadataChartOfCalculationTypes"
import "./metadataChartOfCharacteristicTypes"
import "./metadataCommonForm"
import "./metadataIntegrationService"
import "./metadataTask"
import "./metadataWebService"

let appliedObjectsRegistered = false

export function registerAppliedObjects(): void {
  if (appliedObjectsRegistered) return
  appliedObjectsRegistered = true
}
