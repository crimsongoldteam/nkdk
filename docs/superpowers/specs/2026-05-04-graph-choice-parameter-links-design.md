# Дизайн: `choiceParameterLinks` в графе

Тип: дизайн-документ.

## Контекст

`ChoiceParameterLinks` в JS-модели представлены массивом элементов:

```ts
interface ChoiceParameterLink {
  name: string
  dataPath: string
  valueChange?: LinkedValueChangeMode
}
```

В YAML это одна строка со списком связей:

```yaml
СвязиПараметровВыбора: "Отбор.Владелец(Справочник.Номенклатура.Реквизит.Владелец, НеИзменять)"
```

`choiceParameterLinks` и `choiceParameters` имеют разный смысл.
`choiceParameters` задают значения параметров выбора, а `choiceParameterLinks`
задают связь параметра выбора с другим полем или путём данных и режим изменения
значения.

## Решение

`ChoiceParameterLinks` регистрируется как type-specific `buildGraphFromModel`.
Если обработчик создаёт графовые операции, оркестратор добавляет
`choiceParameterLinks` в `skipKeys` родительского узла, поэтому
`p_choiceParameterLinks_*` не появляется.

Каждый элемент `ChoiceParameterLink` становится самостоятельным owned-узлом:

```text
(:MetadataAttribute {id: "Справочник.Номенклатура.Реквизит.Характеристика"})
  -[:CHOICE_PARAMETER_LINK {yaml: "СвязьПараметровВыбора", index: 0}]->
(:ChoiceParameterLink {
  id: "Справочник.Номенклатура.Реквизит.Характеристика.СвязьПараметровВыбора[0]",
  name: "Отбор.Владелец",
  dataPath: "Catalog.Номенклатура.Attribute.Владелец",
  valueChange: "DontChange"
})
```

`CHOICE_PARAMETER_LINK` добавляется в реестр `edgeKinds` как owning-ребро.
Атрибут `index` обязателен, потому что YAML хранит список связей в одной строке,
и порядок нужен для стабильного восстановления.

## DataPath

`dataPath` сохраняется как свойство узла `ChoiceParameterLink`, чтобы
round-trip не зависел от успешности разрешения ссылки.

Если `dataPath` можно разрешить в узел графа, дополнительно создаётся
reference-ребро от узла `ChoiceParameterLink`:

```text
(:ChoiceParameterLink)-[:DATA_PATH]->(:MetadataAttribute)
```

Для прикладных объектов `dataPath` может быть глобальным путём, например
`Catalog.Номенклатура.Attribute.Владелец`.

Для форм `dataPath` может быть form-local путём, например `РеквизитПодвала`.
В этом случае разрешение должно использовать существующий механизм
`formLocalReferences` и контекст формы.

## Границы

Этот дизайн не связывает `ChoiceParameterLink` с узлом `ChoiceParameter`, даже
если имена совпадают. Это разные понятия:

- `ChoiceParameter` хранит значение параметра выбора;
- `ChoiceParameterLink` описывает, от какого поля или пути зависит параметр
  выбора и как менять значение.

Этот дизайн не реализует восстановление `граф -> модель`, но фиксирует контракт
для него:

- `choiceParameterLinks` не дублируются в props владельца;
- порядок задаётся `index` на `CHOICE_PARAMETER_LINK`;
- YAML-строка восстанавливается из `name`, `dataPath` и `valueChange`;
- reference-ребро `DATA_PATH` является дополнительной графовой связью, а не
  единственным источником восстановления.

## Проверка

Нужны тесты на контракт:

1. Родительский узел с `choiceParameterLinks` не содержит ключей
   `p_choiceParameterLinks_*`.
2. Для каждой связи создаётся узел `ChoiceParameterLink` и owning-ребро
   `CHOICE_PARAMETER_LINK` с `index`.
3. `valueChange: "DontChange"` сохраняется в props узла; отсутствие режима
   не должно ломать построение графа.
4. Разрешаемый `dataPath` создаёт `DATA_PATH`-ребро от узла
   `ChoiceParameterLink`.
5. Прямой импорт `buildGraph` из CLI-контекста поднимает регистрацию
   `ChoiceParameterLinks`.
