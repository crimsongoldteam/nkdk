<objectType name="DynamicList">
    <property name="ManualQuery" type="xs:boolean" lowerBound="0" default="true"/>
    <property name="DynamicDataRead" type="xs:boolean" lowerBound="0" default="true"/>
    <property name="AutoFillAvailableFields" type="xs:boolean" lowerBound="0" default="true"/>
    <property name="QueryText" type="xs:string" lowerBound="0" default=""/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="Field" type="d4p1:DataSetField" lowerBound="0" upperBound="-1"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="CalculatedField" type="d4p1:CalculatedField" lowerBound="0" upperBound="-1"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="Parameter" type="d4p1:Parameter" lowerBound="0" upperBound="-1"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.3/xcf/readable" name="MainTable" type="d4p1:MDObjectRef" lowerBound="0" default=""/>
    <property xmlns:d4p1="http://v8.1c.ru/8.2/managed-application/dynamic-list-data" name="KeyType" type="d4p1:DynamicListKeyType" lowerBound="0" default="Auto"/>
    <property name="KeyField" type="xs:string" lowerBound="0" upperBound="-1"/>
    <property name="AutoSaveUserSettings" type="xs:boolean" lowerBound="0" default="true"/>
    <property name="GetInvisibleFieldPresentations" type="xs:boolean" lowerBound="0" default="true"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/settings" name="ListSettings" type="d4p1:Settings" lowerBound="0"/>
</objectType>