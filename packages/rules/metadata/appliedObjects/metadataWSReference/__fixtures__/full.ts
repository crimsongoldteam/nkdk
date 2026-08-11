import { MetadataWSReference, MetadataWSReferenceYAML } from "../types"

export const full: MetadataWSReference = {
  itemType: "MetadataWSReference",
  name: "WSСсылкаВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  locationURL: "http://www.dneonline.com/calculator.asmx?wsdl",
}

export const fullYAML: MetadataWSReferenceYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  URL: "http://www.dneonline.com/calculator.asmx?wsdl",
}
