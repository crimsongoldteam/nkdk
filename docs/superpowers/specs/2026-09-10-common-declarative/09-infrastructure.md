# Файлы в корне commonObjects и связанные механизмы

| Файл | Назначение и судьба в декларативном интерфейсе |
|---|---|
| `childNamesXML.ts` | Чтение имён одиночного/повторного XML; общее представление элемента коллекции. |
| `dcsText.ts` | Обязательный XML-текст с диагностикой отсутствия/неверной формы; scalar grammar + presence. |
| `index.ts` | Импорты регистраций с побочными эффектами; заменить проверяемым manifest модулей при сборке. |
| `schemaRegister.ts` | Отдельные schema contributions; порождать из деклараций, сохраняя публичные имена/ref. |
| `metadataIdentityProperties.ts` | Переиспользуемые поля идентичности; декларативный fragment. |
| `metadataObjectBelongingProperties.ts` | Общая принадлежность объекта; конечный профиль состояния, не private logic ядра. |
| `metadataExternalDataSourceShared.ts` | Общие именованные поля и borrowed presentations; use-фрагмент с входами. |
| `metadataRuleFragment.ts` | Композиция, проверки повторов и порядка; сохранить compile-time проверки полноты/коллизий вместо runtime конструкторов. |
| `metadataRuleTestHelpers.ts` | Вспомогательная проверка тестов; не common value и не часть runtime grammar. |
| `metadataTargetOwnerResolver.ts` | Извлекает owner по стеку; целевой owner приходит как связанный типизированный вход. Частные условия ExternalDataSource/parent itemType остаются в декларациях владельцев. |
| `omittedChildren.ts` | Канонический/сохранённый состав, сортировка UTF-8, merge и persistence; явный order/reconstruction contract + topology facts. |
| `resourceTopology.ts` | Описания внешних ресурсов и capabilities; убрать функции построения путей, оставить шаблоны и общий исполнитель. |
| `roleVisibilityXML.ts` | Общий разбор visibility role/common; вынести состав в декларацию и использовать всеми потребителями, сохраняя адреса occurrence. |
| `ruleBuilder.ts` | Реэкспорт runtime builder; в целевом варианте проверку формы выполняет компилятор YAML. |

## Что учитывается вне каталога

В `source-inventory.json` исходный охват — TS-файлы commonObjects. Это не весь граф зависимостей. Внешние владельцы регистраций и смысловых проверок учитываются отдельным перечнем `external-evidence.json`; перед переносом конкретного компонента он дополняется до нужного набора вызовов/контрактов. В частности, форматы metadataTarget и FillValue имеют реализации и в runtime, а проверки DataPath связаны с нейтральными реестрами owner facts.

Исторические дизайн-документы не сильнее текущих ограничений и кода. Пример: старые языковые теги в прежней I8nText-спеке заменены общими тегами; их нельзя вернуть при переносе.
