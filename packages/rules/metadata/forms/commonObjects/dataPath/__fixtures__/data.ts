import { EnterpriseAttributesMap } from "../../../clientApplicationForm/types"

export interface GetAttributeNameFixture {
  name: string
  attributes: EnterpriseAttributesMap
  dataPath: string | undefined
  tableDataPathEnterprise?: string | undefined
  tableDataPath?: string | undefined

  expectedDataPath: string | undefined
  expectedAttributes: EnterpriseAttributesMap
}

export const getAttributeNameFixtures: GetAttributeNameFixture[] = [
  {
    name: "return undefined if dataPath is undefined",
    attributes: {},
    dataPath: undefined,
    expectedDataPath: undefined,
    expectedAttributes: {},
  },
  {
    name: "return dataPath if attribute doesn't exists",
    attributes: {},
    dataPath: "Test",
    expectedDataPath: "p_Test",
    expectedAttributes: {
      test: { name: "p_Test", title: "Test", type: { Type: ["string"] } },
    },
  },
  {
    name: "return dataPath with number if attribute already exists",
    attributes: {
      objecttest: { name: "p_ObjectTest", title: "Test title", type: { Type: ["string"] } },
      "obj.ecttest": {
        name: "p_ObjectTest1",
        title: "Test title",
        // table: "p_ObjectTest1",
        type: { Type: ["string"] },
      },
    },
    dataPath: "Object.Test",
    expectedDataPath: "p_ObjectTest2",
    expectedAttributes: {
      objecttest: { name: "p_ObjectTest", title: "Test title", type: { Type: ["string"] } },
      "obj.ecttest": {
        name: "p_ObjectTest1",
        title: "Test title",
        // table: "p_ObjectTest1",
        type: { Type: ["string"] },
      },
      "object.test": { name: "p_ObjectTest2", title: "Test", type: { Type: ["string"] } },
    },
  },
  {
    name: "return dataPath for table",
    attributes: {},
    tableDataPathEnterprise: "p_Table",
    tableDataPath: "Table",
    dataPath: "Table.Test",
    expectedDataPath: "p_Table.Test",
    expectedAttributes: {
      "table.test": {
        name: "Test",
        title: "Test",
        path: "p_Table",
        type: { Type: ["string"] },
      },
    },
  },
  {
    name: "return dataPath for object table",
    attributes: {
      "object.table": { name: "p_ObjectTable1", type: { Type: ["Table"] } },
    },
    tableDataPathEnterprise: "p_ObjectTable1",
    tableDataPath: "Object.Table",
    dataPath: "Object.Table.Test",
    expectedDataPath: "p_ObjectTable1.Test",
    expectedAttributes: {
      "object.table": { name: "p_ObjectTable1", type: { Type: ["Table"] } },
      "object.table.test": {
        name: "Test",
        title: "Test",
        path: "p_ObjectTable1",
        type: { Type: ["string"] },
      },
    },
  },
]
