import type { Table, TablePartialYAML } from "../types"

export const dcsComposerSettings: Table = {
  itemType: "Table",
  name: "КомпоновщикНастроекКомпоновкиДанныхНастройки",
  representation: "Tree",
  horizontalLines: false,
  useAlternationRowColor: true,
  initialTreeView: "ExpandAllLevels",
  enableStartDrag: true,
  enableDrag: true,
  dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings",
  childItems: [
    {
      itemType: "TableCheckBoxField",
      name: "КомпоновщикНастроекКомпоновкиДанныхНастройкиИспользование",
      dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings.Use",
      editMode: "EnterOnInput",
      checkBoxType: "Auto",
    },
  ],
}

export const dcsComposerSettingsYAML: TablePartialYAML = {
  ГоризонтальныеЛинии: "Ложь",
  НачальноеОтображениеДерева: "РаскрыватьВсеУровни",
  Отображение: "Дерево",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  ЧередованиеЦветовСтрок: "Истина",
}
