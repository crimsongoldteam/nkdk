import { MetadataWebServiceOperations } from "../types"

export const operationsWithXDTOTypeNamespace: MetadataWebServiceOperations = [
  {
    itemType: "MetadataWebServiceOperation",
    name: "ОперацияXDTO",
    comment: "",
    xdtoReturningValueType: "d4p1:CustomerResponse",
    nillable: false,
    transactioned: false,
    procedureName: "ОперацияXDTO",
    dataLockControlMode: "Managed",
    parameters: [
      {
        itemType: "MetadataWebServiceParameter",
        name: "ПараметрXDTO",
        comment: "",
        xdtoValueType: "d4p1:Customer",
        nillable: false,
        transferDirection: "In",
      },
    ],
  },
]
