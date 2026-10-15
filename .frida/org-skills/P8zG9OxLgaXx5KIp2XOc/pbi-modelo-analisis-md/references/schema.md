# Esquema de operaciones MCP utilizadas

## `connection_operations`
- `ListLocalInstances`: lista instancias locales de Power BI Desktop.
- `Connect`: conecta a una instancia por `connectionString`.

## `table_operations`
- `List`: devuelve tablas, cantidad de columnas, particiones, modo de almacenamiento y medidas.

## `column_operations`
- `List`: devuelve columnas por tabla, incluyendo columnas calculadas (`isCalculated`).

## `measure_operations`
- `List`: lista medidas con displayFolder y formato.
- `Get`: devuelve la expresión DAX completa de una medida.
- `ExportTMDL`: alternativa para extraer medidas en bloque.

## `relationship_operations`
- `List`: devuelve relaciones entre tablas con cardinalidad, dirección y estado.

## `database_operations`
- `ExportTMDL`: exporta el modelo completo en formato TMDL.
- `ExportTMSL`: exporta el modelo en TMSL JSON.

## `model_operations`
- `GetStats`: devuelve estadísticas del modelo (cantidad de tablas, columnas, medidas, relaciones).
- `ExportTMDL`: exporta el modelo en formato TMDL.
- **Nota:** actualmente no expone layout de páginas/visuales del reporte.
