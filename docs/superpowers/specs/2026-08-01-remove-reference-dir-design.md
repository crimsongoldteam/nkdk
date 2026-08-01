# Удаление legacy referenceDir

## Цель

Удалить устаревшую ветку YAML → XML и механизм `referenceDir`. Единственным поддерживаемым путём полной синхронизации в XML остаётся `metadata/fullSyncToXml`, который строит результат из YAML, topology и configuration index без чтения эталонного XML-каталога.

## Причина сохранения механизма

Новый full sync уже опубликован как `syncConfigurationToXML`, но предыдущая реализация не была удалена целиком. Её продолжают удерживать три группы потребителей:

- публичные `shortRoundTripXML` и `syncConfigurationIncrementallyToXML`;
- старый конфигурационный конвейер `appliedObjects/configuration/syncToXML.ts`;
- прямые вызовы `syncAppliedObjectToXML` и `syncAppliedObjectAreaToXML` в тестах и обработчиках вложенных объектов.

Через эти точки `referenceDir` распространяется в orchestration свойств, формы и обработчики внешних файлов. Поэтому удаление только параметра или публичных экспортов оставило бы недостижимый второй конвейер и его договоры внутри общих слоёв.

## Публичный договор

Из `@nakidka/core` удаляются:

- `shortRoundTripXML`;
- `syncConfigurationIncrementallyToXML`.

Из внутреннего API MCP удаляется `syncConfigurationIncrementallyToXML`. Публичный `syncConfigurationToXML` не меняется: он уже указывает на новый full sync.

Это намеренное несовместимое изменение. Совместимые обёртки и автоматическая переадресация старых вызовов не добавляются.

## Архитектура

Старая реализация `appliedObjects/configuration/syncToXML.ts`, частичный исполнитель и их исключительно служебные модули удаляются. `syncState` сохраняется, поскольку его данные входят в configuration index и остаются самостоятельным публичным договором. `incrementalPlan` и `xmlChangeTracker` удаляются вместе с частичным исполнителем: других production-потребителей у них нет.

В `orchestration/appliedObject/syncToXML.ts` сохраняются только функции подготовки и записи подготовленного XML, которые использует новый full sync. Удаляются `syncAppliedObjectToXML`, `syncAppliedObjectAreaToXML`, рекурсивное чтение reference XML и передача `referenceDir`/`externalReferenceDir` в свойства.

Из реестра типов свойств удаляются операции старого исполнителя `syncExternalToXML` и `xmlSyncWriter`. В файлах конкретных типов сохраняются преобразования и XML-prepare capabilities нового full sync; удаляются только ставшие недостижимыми обработчики старого договора. Аналогично в коде форм остаются `prepareFormXML` и запись подготовленной формы, но удаляется `syncFormToXML` с чтением reference XML.

Общие metadata-слои после изменения не знают об эталонном каталоге XML. В production-коде под `packages` отсутствуют `referenceDir` и `externalReferenceDir`.

## Поток данных

YAML-проект проходит только через `syncConfigurationToXML` нового full sync:

1. состояние компонента подтверждается по структуре, хэшам и configuration index;
2. topology формирует полный набор заданий;
3. задания готовят XML из YAML и снимка конфигурации;
4. внешние файлы переносятся из проекта;
5. записанный состав проверяется и configuration index обновляется.

Исходный XML-каталог не используется как источник отсутствующих полей, порядка или внешних файлов.

## Ошибки

Ошибки нового full sync продолжают возвращаться через `FullXmlSyncResult`. Специальные ошибки старого частичного плана, отсутствующего `.nakidka-sync-state` и legacy `ConfigurationSyncResult` для YAML → XML исчезают вместе с удалёнными API.

## Тестирование

Удаляются тесты, единственный наблюдаемый договор которых — поведение `shortRoundTripXML`, `syncConfigurationIncrementallyToXML`, старого конфигурационного sync или прямого `syncAppliedObjectToXML` с reference XML. XML-фикстуры не изменяются.

Проверки функций подготовки и записи, используемых новым full sync, сохраняются либо переносятся на их актуальные точки входа. Перед удалением тестов фиксируется mutation-отчёт для затронутого production-кода; после изменения отчёт повторяется с теми же применимыми целями, чтобы не потерять защиту сохраняемого поведения.

Итоговая проверка:

- поиск `referenceDir` и `externalReferenceDir` в production-коде `packages` не находит совпадений;
- `pnpm type-check` проходит;
- `pnpm test` проходит;
- mutation testing изменённых диапазонов не содержит содержательных выживших мутантов и недостоверных статусов.

## Вне границ

- добавление новой частичной синхронизации;
- сохранение совместимости удаляемых API;
- изменение XML-фикстур;
- изменение формата configuration index или нового full sync, кроме удаления случайных зависимостей от legacy-кода.
