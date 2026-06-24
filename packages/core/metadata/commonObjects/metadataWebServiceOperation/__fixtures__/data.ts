import { MetadataWebServiceOperations } from "../types"

export const operationsWithXDTOTypeNamespace: MetadataWebServiceOperations = [
  {
    itemType: "MetadataWebServiceOperation",
    name: "ОперацияXDTO",
    comment: "",
    xdtoReturningValueType: {
      namespace: "http://example.org/schema",
      name: "CustomerResponse",
    },
    nillable: false,
    transactioned: false,
    procedureName: "ОперацияXDTO",
    dataLockControlMode: "Managed",
    parameters: [
      {
        itemType: "MetadataWebServiceParameter",
        name: "ПараметрXDTO",
        comment: "",
        xdtoValueType: {
          namespace: "http://example.org/schema",
          name: "Customer",
        },
        nillable: false,
        transferDirection: "In",
      },
    ],
  },
]
