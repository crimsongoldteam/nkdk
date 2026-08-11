import type { Table, TablePartialYAML } from "../types"

export const dcsComposerFilter: Table = {
  itemType: "Table",
  name: "КомпоновщикНастроекКомпоновкиДанныхНастройкиОтбор",
  representation: "Tree",
  autofill: true,
  width: 60,
  initialTreeView: "ExpandAllLevels",
  enableStartDrag: true,
  enableDrag: true,
  dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
  viewMode: "QuickAccess",
  settingsNamedItemDetailedRepresentation: false,
  childItems: [
    {
      itemType: "TableCheckBoxField",
      name: "КомпоновщикНастроекКомпоновкиДанныхНастройкиОтборИспользование",
      dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Use",
      editMode: "EnterOnInput",
      checkBoxType: "Auto",
    },
  ],
}

export const dcsComposerFilterYAML: TablePartialYAML = {
  АвтозаполнениеКолонок: "Истина",
  НачальноеОтображениеДерева: "РаскрыватьВсеУровни",
  Отображение: "Дерево",
  ПодробноеОтображениеИменованныхЭлементовНастройки: "Ложь",
  ПутьКДанным: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
  РежимОтображения: "БыстрыйДоступ",
  Ширина: 60,
  Элементы: {
    КомпоновщикНастроекКомпоновкиДанныхНастройкиОтборИспользование: {
      Вид: "ПолеФлажок",
      ПутьКДанным: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Use",
      РежимРедактирования: "ВходПриВводе",
    },
  },
}
