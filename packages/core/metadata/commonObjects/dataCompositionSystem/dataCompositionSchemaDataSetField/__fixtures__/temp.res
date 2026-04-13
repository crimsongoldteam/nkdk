<objectType xmlns:d3p1="http://v8.1c.ru/8.1/data-composition-system/schema" name="DataSetFieldField" base="d3p1:DataSetField">
    <property name="dataPath" type="xs:string"/>
    <property name="field" type="xs:string"/>
    <property name="title" lowerBound="0"/>
    <property name="useRestriction" type="d3p1:FieldUseRestriction" lowerBound="0"/>
    <property name="attributeUseRestriction" type="d3p1:FieldUseRestriction" lowerBound="0"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="role" type="d4p1:DataSetFieldRole" lowerBound="0"/>
    <property name="presentationExpression" type="xs:string" lowerBound="0"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/common" name="orderExpression" type="d4p1:OrderExpression" lowerBound="0" upperBound="-1"/>
    <property name="inHierarchyDataSet" type="xs:string" lowerBound="0"/>
    <property name="inHierarchyDataSetParameter" type="xs:string" lowerBound="0"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data/core" name="valueType" type="d4p1:TypeDescription" lowerBound="0"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="appearance" type="d4p1:Appearance" lowerBound="0"/>
    <property name="availableValue" type="d3p1:AvailableValue" lowerBound="0" upperBound="-1"/>
    <property xmlns:d4p1="http://v8.1c.ru/8.1/data-composition-system/core" name="inputParameters" type="d4p1:InputParameters" lowerBound="0"/>
</objectType>