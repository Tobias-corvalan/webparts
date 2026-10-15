---
name: pbi-modelo-analisis-md
description: >-
  Conecta a Power BI Desktop, extrae tablas, columnas, relaciones y medidas
  (con DAX completo), y analiza el modelo como consultor senior. Presenta el
  resultado en Markdown con tablas. Use cuando el usuario pida analizar,
  revisar o auditar un modelo de Power BI conectado.
metadata:
  version: "1.0.0"
---

# pbi-modelo-analisis-md

Analiza un modelo de Power BI Desktop conectado y entrega un informe técnico en Markdown.

## Pasos

1. **Detectar instancias de Power BI Desktop**
   - Llamar `connection_operations` con `operation: ListLocalInstances`.
   - Si hay una sola instancia, usar su `connectionString` para conectar con `operation: Connect`.
   - Si hay varias, preguntar al usuario cuál usar.
   - Si `ListLocalInstances` o `Connect` fallan, intentar conexión puerto por puerto usando cadenas del tipo:
     `data source=localhost:<puerto>;Application Name=MCP-PBIModeling`.
     Puertos típicos: 52999, 53000, 53001, 53002, 53003, 53999, 54000.

2. **Extraer metadatos del modelo**
   - `table_operations` → `List`: tablas, columnas y modo de almacenamiento.
   - `column_operations` → `List`: columnas por tabla, incluyendo calculadas.
   - `relationship_operations` → `List`: relaciones con cardinalidad, dirección y estado.
   - `measure_operations` → `List`: medidas.
   - `measure_operations` → `Get`: expresión DAX completa de cada medida.

3. **Analizar el modelo como consultor senior**
   - Identificar tablas de hechos (granularidad baja, muchas relaciones M:1 entrantes, columnas numéricas/medidas).
   - Identificar tablas de dimensiones (relaciones 1:M salientes, atributos descriptivos).
   - Detectar tabla de fechas (columnas de fecha, nombres como Date, Calendar, Fecha, Calendario).
   - Señalar riesgos de calidad:
     - Relaciones inactivas, bidireccionales o M:M.
     - Medidas sin descripción, sin formato o con nombres poco descriptivos.
     - Columnas calculadas que podrían ser medidas.
     - Tablas sin clave única.
     - Nombres con espacios innecesarios o inconsistentes.
   - Proponer oportunidades de mejora:
     - Uso de medidas base + medidas de inteligencia de tiempo.
     - Agrupar medidas en carpetas de visualización.
     - Desactivar relaciones no usadas o reemplazar bidireccionales por medidas con CROSSFILTER.
     - Validar modelo estrella/snowflake.

4. **Presentar resultados**
   - Usar Markdown con tablas.
   - Estructurar en secciones:
     1. **Resumen ejecutivo del modelo** (tablas, relaciones, medidas, modo de almacenamiento, riesgos críticos).
     2. **Resumen por tipo de tabla** (hechos, dimensiones, fecha, desconectadas/ocultas) con métricas clave.
     3. **Tablas y columnas detalladas**:
        - Para cada tabla: nombre, tipo inferido, modo de almacenamiento, cantidad de columnas/medidas, oculta/visible.
        - Para cada columna: nombre, tipo de dato, calculada (sí/no), clave primaria (sí/no), clave foránea (sí/no), oculta (sí/no).
        - En modelos grandes, presentar primero un índice de tablas y luego el detalle agrupado por tipo.
     4. **Relaciones detalladas**:
        - Tabla resumen de todas las relaciones: `Origen[Columna]` → `Destino[Columna]`, cardinalidad, dirección de filtro, estado (activa/inactiva), tipo de relación.
        - Agrupar relaciones por tabla de hechos o dimensión central para facilitar lectura.
        - Destacar con emoji/leyenda relaciones inactivas ⚠️, bidireccionales ↔️ y M:M 🔴.
     5. **Medidas (con DAX completo)**.
     6. **Análisis de consultoría** (hechos, dimensiones, fecha, riesgos, oportunidades).
   - No generar archivos de salida salvo que el usuario lo solicite explícitamente.
   - Si el modelo tiene más de 15 tablas, incluir índice con enlaces a secciones y resumir tablas de fecha locales automáticas en una sub-sección aparte.

## Success criteria
- Se conecta al modelo de Power BI Desktop.
- Se listan tablas, columnas, relaciones y medidas.
- Cada tabla incluye tipo inferido, modo de almacenamiento y columnas detalladas.
- Cada relación incluye cardinalidad, dirección, campos y estado.
- Cada medida incluye su expresión DAX completa.
- Se entrega análisis senior con hallazgos accionables.
- La salida está en Markdown con tablas y secciones claras.

## References (load only if needed)
- Esquema detallado de operaciones MCP: leer `references/schema.md` si el usuario necesita detalles técnicos del MCP.
