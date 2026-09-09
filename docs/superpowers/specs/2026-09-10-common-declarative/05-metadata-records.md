# Составные объекты метаданных

Эти common уже во многом описаны properties/fragments. Переносить нужно не только поля, но и регистрации коллекций, propertyStates, источники defaults, проекции identity и внешних файлов. Композиция деклараций использует явные параметры и проверяемое переопределение поля; не копирует весь набор атрибутов в каждый вид.

| Common | Состав и особенность существующего договора | Целевое выражение и проверки |
|---|---|---|
| `metadataAttribute` | Общие фрагменты identity, представления/типа, FillValue, выбора, поиска/истории, двоичного хранения, UUID; синоним из имени, форма выбора определяется типом. | Record из use-фрагментов; входы name/type/owner, фильтр boolean-ссылки поля хранения; проверить declared/effective type, defaults и borrowed propertyStates. |
| `metadataRegisterField` | Общая база поля регистра; отдельная accountingProperties с условиями owner и наличия YAML-поля. | Профили подключения вместо обхода стека владельцев; учитывать фактическое наличие поля, не только его значение. |
| `metadataRegisterAttribute` | База поля + ScheduleLink и набор фрагментов атрибутов. | Record composition; профиль возможностей owner. Проверить доступность поля и состояния заимствования. |
| `metadataRegisterDimension` | Master/MainFilter/DenyIncompleteValues/BaseDimension/ScheduleLink/UseInTotals/TypeReductionMode с owner-specific экспортом. | Конечные профили + present(field), отдельно adopted/full. Проверить каждый класс условия, а не произвольные перестановки всех boolean. |
| `metadataRegisterResource` | База + balance/accountingFlag/extDimensionAccountingFlag. | Тот же record с профилем учёта и typed reference; проверить явное поле против материализуемого default. |
| `metadataTabularSection` | Вложенные реквизиты, стандартные реквизиты, длина номера строки, использование, UUID, InternalInfo. | Record + named collections + декларативные identity contributions; проверить пустую табличную часть, имя, стандартный состав, borrowed. |
| `metadataDocumentJournalColumn` | Имя/синоним, список ссылок, тип, индексирование, принадлежность. | Record + reference list + TypeDescription; проверить разрешение ссылок, отсутствие type, состояния расширения. |
| `metadataSequenceDimension` | Имя/синоним/тип и сопоставления реквизитам документов/движений. | Record и ссылки с явными constraints; проверить оба набора сопоставлений и допустимый состав типов. |
| `metadataTaskAddressingAttribute` | Композиция фрагментов атрибута + ссылка AddressingDimension. | Дополнительное ограничение цели в record; проверить owner explicit и поддержку FillValue. |
| `metadataCommand` | Тип параметра, группа/представление/картинка и прочие поля; отдельный BSL-модуль по шаблону пути; propertyStates для внешнего ресурса. | Record + resource declaration. Проверить command type, группу, пути модуля и состояние ресурса. |
| `metadataCommandGroup` | Стандартная группа перечисления либо ссылка на объект группы. | Choice enum/reference с проверкой неоднозначности; не принимать произвольную строку за проверенную цель. |
| `metadataHTTPServiceMethod` | Метод HTTP, обработчик, имя/синоним, UUID и принадлежность. | Record в Properties; не добавлять проверку существования BSL-обработчика, которой не задаёт текущий договор. |
| `metadataHTTPServiceURLTemplate` | Шаблон и вложенная коллекция методов. | Record + named collection; проверить пустые методы, имена, XML ChildObjects. |
| `metadataIntegrationServiceChannel` | Направление, внешнее имя, обработка получения и транзакционность; составное имя InternalInfo по родителю. | Переданный qualified name, enum и conditional/default; проверить Send/transactioned defaults и manager identity. |
| `metadataWebServiceOperation` | Operation и Parameter: QName XDTO-типа, nillable, направление передачи; у операции процедура, транзакция, блокировка и коллекция параметров. | Два record, collection, разные namespace-профили XDTO. Проверить входящий/возвращаемый тип, пустые параметры, default In/Managed. |
| `metadataExternalDataSourceField` | Синоним, тип, FillValue, имя в источнике, ReadOnly/AllowNull, принадлежность. | Переиспользуемая база external-field; проверить DBNull/nil и строковое typed-empty без частного обхода владельца. |
| `metadataExternalDataSourceTable` | Поля, формы/команды/макеты, представления и настройка таблицы внешнего источника; составные имена ресурсов. | Record + topology declarations, named collections и квалифицированный owner input; проверить file layout и references на вложенные члены. |
| `metadataExternalDataSourceCube` | Измерения, ресурсы, таблицы измерений, формы/команды/макеты, представления, InternalInfo. | Композиция существующих common, никакой зависимости на реализации forms. Имена/пути передаются декларативно через topology. |
| `metadataExternalDataSourceDimensionTable` | Поля, иерархия, представление, незаполненный родитель, формы/команды/макеты; трёхчастное имя источника/куба/таблицы. | Record, type/reference, templates квалифицированных имён. Проверить глубину owner, hierarchy и paths. |
| `metadataExternalDataSourceCubeDimension` | Общая база измерения с дополнительными признаками; ряд полей выводится только при фактическом наличии. | Record-профиль с present; проверить различие отсутствия и явного default. |
| `metadataExternalDataSourceCubeResource` | База external-field с признаками учёта и условным экспортом общих свойств. | Composition/overrides и present; проверить доступность полей, тип источника, inherited/default. |
| `metadataExternalDataSourceFunction` | Имя, комментарий, имя в источнике, возвращаемый TypeDescription. | Record и разрешённый набор типов; проверить QName/types и состояния расширения. |

## Общие обязательства языка

- Фрагмент объявляет поля и необходимые входы. При подключении компилятор отвергает коллизии без явного override, несовместимые типы и циклы зависимостей.
- `Properties`, `ChildObjects` и typed-оболочки принадлежат представлению; модель не получает промежуточные копии только ради этих контейнеров.
- Профили `full/adopted` и `cf/cfe` независимы. Матрицы propertyStates остаются предметными данными, а соединение состояния со значением — общей конструкцией.
- Факт «поле явно задано в YAML» нельзя заменить сравнением с default: он влияет на экспорт у регистров и внешних источников.
- Формы и appliedObjects подключают common через composition и параметры. Общие реализации не получают зависимости на виды потребителей.
