# Descripción de gráficos y visualizaciones del Dashboard principal

**Componente:** `src/app/shared/pages/shared-dashboard`  
**Tecnología:** Chart.js (gráficos en `<canvas>`) y visualizaciones complementarias en HTML  
**Fuente de datos:** perfiles de egresados con `perfil_completo = true` y APIs del módulo `/api/dashboard`

Los elementos se listan en el **mismo orden** en que aparecen al desplazarse por el dashboard, de arriba hacia abajo.

---

## Sección 1 — Resumen general (`id="resumen-general"`)

### 1. Composición del Mercado
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `estadisticasGeneralesChart` |
| **Tipo** | Gráfico de dona (*doughnut*) |
| **Título en pantalla** | Composición del Mercado |
| **Descripción** | Resume en un solo gráfico circular las métricas agregadas del ecosistema de egresados registrados. Cada segmento representa una dimensión del mercado laboral cubierto por el sistema. |
| **Variables mostradas** | Profesionales activos, empresas únicas e industrias únicas. En vista **administrador** se incluye además el segmento *Nuevos este mes*. |
| **Interpretación** | Permite comparar de un vistazo el tamaño de la base de egresados, la diversidad de empleadores y la dispersión sectorial. Un segmento mayor indica mayor concentración relativa de esa métrica en el conjunto total. |
| **Interacción** | Al pasar el cursor sobre un segmento, el tooltip muestra el valor absoluto de cada categoría. |

---

## Sección 2 — Tendencias del mercado (solo administrador, `id="tendencias-mercado"`)

### 2. Evolución temporal del mercado en registros y perfiles
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `tendenciasMercadoChart` |
| **Tipo** | Gráfico de líneas (*line*) con área rellena |
| **Título en pantalla** | Evolución temporal del mercado en registros y perfiles |
| **Descripción** | Muestra la evolución mensual del sistema durante los **últimos 6 meses**, comparando el crecimiento de la plataforma en dos indicadores clave. |
| **Series de datos** | **Nuevos registros:** cantidad de egresados que se incorporan cada mes. **Perfiles completos:** cantidad de usuarios que alcanzan el 100 % de completitud de perfil en cada mes. |
| **Interpretación** | Si la línea de nuevos registros supera a la de perfiles completos, existen usuarios pendientes de completar su información. La convergencia de ambas líneas sugiere buena adopción y calidad de los datos capturados. |
| **Ejes** | Eje X: meses del período. Eje Y: cantidad de usuarios. |

---

## Sección 3 — Análisis salarial y empresarial

### 3. Top Salarial por Industria
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `distribucionSalarialChart` |
| **ID sección (menú)** | `distribucion-salarial` |
| **Tipo** | Gráfico de barras verticales (*bar*) |
| **Título en pantalla** | Top Salarial por Industria / Top Industrias con Mejores Salarios |
| **Descripción** | Presenta las **7 industrias** con mayor salario promedio entre los egresados, ordenadas de mayor a menor remuneración. |
| **Variables mostradas** | Por industria: salario promedio (CLP), cantidad de profesionales y rango salarial (mínimo–máximo) en el tooltip. |
| **Interpretación** | Identifica los sectores económicos mejor remunerados dentro de la muestra de egresados. Útil para orientar expectativas salariales y detectar industrias de mayor retorno económico. |
| **Ejes** | Eje X: nombre de la industria. Eje Y: salario promedio en pesos chilenos. |

### 4. Top Empleadores
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `empresasContratantesChart` |
| **ID sección** | `empresas-contratantes` |
| **Tipo** | Gráfico de barras horizontales (*bar*, `indexAxis: 'y'`) |
| **Título en pantalla** | Top Empleadores / Top Empleadores del Mercado |
| **Descripción** | Ranking de las **7 empresas** que concentran mayor número de egresados empleados según los perfiles registrados. |
| **Variables mostradas** | Total de empleados por empresa; en tooltip: salario promedio y satisfacción laboral (escala 1–5 estrellas) cuando está disponible. |
| **Interpretación** | Revela los principales empleadores del mercado dentro de la comunidad de egresados. Barras más largas indican mayor presencia de profesionales de la muestra en esa organización. |

---

## Sección 4 — Información detallada de empresas

*Esta sección incluye listados HTML (no canvas). Se documentan por ser parte visual del dashboard.*

### 4a. Principales Empleadores del Mercado (listado)
Listado desplazable con nombre de empresa, cantidad de empleados, salario promedio y calificación de satisfacción. Complementa al gráfico **Top Empleadores** con más filas y detalle textual.

### 4b. Salarios por Industria (listado)
Panel lateral (`id="salarios-industria"`) con tarjetas por industria: nombre, cantidad de profesionales y salario promedio. Accesible desde el menú como *Satisfacción laboral* / análisis por industria. Complementa al gráfico **Top Salarial por Industria**.

---

## Sección 5 — Distribución general del mercado (`id="tecnologias-demandadas"`)

### 5. Tecnologías Más Demandadas (barras de progreso)
| Atributo | Detalle |
|----------|---------|
| **Tipo** | Visualización con barras de progreso (PrimeNG `p-progressBar`), no Chart.js |
| **Título en pantalla** | Tecnologías Más Demandadas |
| **Descripción** | Lista ordenada de las tecnologías, lenguajes o herramientas más declaradas por los egresados en sus perfiles. |
| **Variables mostradas** | Nombre de la tecnología, número de selecciones (*demanda*) y porcentaje relativo respecto a la tecnología líder. |
| **Interpretación** | Indica qué competencias técnicas predominan en la comunidad. Barras más largas reflejan mayor adopción o dominio reportado por los egresados. |

---

## Sección 6 — Satisfacción laboral (`id="satisfaccion-laboral"`)

### 6. Top Empresas con Mejor Satisfacción Laboral
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `satisfaccionLaboralChart` |
| **Tipo** | Gráfico de barras horizontales (*bar*) |
| **Título en pantalla** | Top Empresas con Mejor Satisfacción Laboral |
| **Descripción** | Muestra hasta **10 empresas** con mayor puntaje promedio de satisfacción laboral, en escala de **1 a 5 estrellas**. |
| **Variables mostradas** | Nombre de empresa, satisfacción promedio y total de respuestas que sustentan el promedio (tooltip). |
| **Interpretación** | Permite identificar empleadores con mejor percepción de bienestar laboral entre los egresados. El encabezado incluye el promedio general del mercado para contextualizar cada barra. |
| **Condición de visualización** | Solo se muestra si existen empresas con datos de satisfacción. |

---

## Sección 7 — Análisis de experiencia profesional

### 7. Evolución del Salario por Experiencia
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `evolucionSalarialChart` |
| **ID sección** | `evolucion-salarial` |
| **Tipo** | Gráfico de líneas múltiples (*line*) |
| **Título en pantalla** | Evolución del Salario por Experiencia |
| **Descripción** | Relaciona los **rangos de años de experiencia** con los niveles salariales de los egresados. |
| **Series de datos** | **Salario promedio** (línea continua rellena), **salario máximo** y **salario mínimo** (líneas punteadas) por rango de experiencia. |
| **Interpretación** | Visualiza la progresión salarial esperada conforme aumenta la experiencia profesional. Una pendiente ascendente confirma correlación positiva entre antigüedad y remuneración en la muestra. |

### 8. Distribución de Profesionales por Experiencia
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `distribucionExperienciaChart` |
| **ID sección (menú)** | `distribucion-experiencia` |
| **Tipo** | Gráfico de barras horizontales (*bar*) |
| **Título en pantalla** | Distribución de Profesionales por Años de Experiencia |
| **Descripción** | Cantidad de egresados agrupados por rango de años de experiencia laboral (por ejemplo: 0–1, 1–3, 3–5, 5+ años). |
| **Variables mostradas** | Cantidad y porcentaje del total por rango; en tooltip se indica el intervalo exacto de años. |
| **Interpretación** | Muestra la madurez profesional de la comunidad. El rango con barra más larga corresponde al segmento de experiencia más representativo (*rango más común*). |

---

## Sección 8 — Análisis tecnológico y salarial

### 9. Experiencia vs Número de Tecnologías Dominadas
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `experienciaVsTecnologiasChart` |
| **ID sección (menú)** | `experiencia-tecnologias` |
| **Tipo** | Gráfico de barras verticales (*bar*) |
| **Título en pantalla** | Experiencia vs Número de Tecnologías Dominadas |
| **Descripción** | Para cada rango de años de experiencia, calcula el **promedio de tecnologías** que los egresados declaran dominar en su perfil. |
| **Variables mostradas** | Promedio de tecnologías y cantidad de profesionales por rango (tooltip). |
| **Interpretación** | Permite analizar si la diversidad de stack tecnológico crece con la experiencia. Un aumento progresivo de las barras sugiere que profesionales más senior manejan más herramientas. |

### 10. Mapa de Calor: Industria vs Nivel Salarial
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `mapaCalorIndustriaSalarialChart` |
| **ID sección (menú)** | `mapa-calor-industria` |
| **Tipo** | Gráfico de barras apiladas (*stacked bar*) |
| **Título en pantalla** | Mapa de Calor: Industria vs Nivel Salarial |
| **Descripción** | Cruza **industrias** con **rangos salariales** (por ejemplo: menor a $500.000, $500k–$1M, $1M–$1,5M, etc.). Cada color representa un tramo salarial y la altura del segmento indica cuántos profesionales de esa industria se ubican en ese rango. |
| **Variables mostradas** | Cantidad y porcentaje de profesionales por celda industria–rango; total por industria en tooltip. |
| **Interpretación** | Revela en qué sectores se concentran los salarios altos o bajos. Colores dominantes en la parte superior de una barra indican industrias con mayor proporción de remuneraciones elevadas. Incluye panel inferior con distribución global por rangos salariales. |

---

## Sección 9 — Estado del mercado laboral (`id="disponibilidad-cambio"`)

### 11. Disponibilidad para Cambio de Trabajo
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `disponibilidadCambioChart` |
| **Tipo** | Gráfico de dona (*doughnut*) |
| **Título en pantalla** | Disponibilidad para Cambio de Trabajo |
| **Descripción** | Distribuye a los egresados según su disposición actual para cambiar de empleo, según el campo *disponibilidad de cambio* del perfil. |
| **Categorías** | Activamente buscando, Abierto a oportunidades, No seguro, No disponible, Sin trabajo. |
| **Interpretación** | Cada porción muestra la proporción del mercado en cada estado de disponibilidad. Colores diferenciados facilitan leer la rotación potencial del talento. Se complementa con tarjetas laterales de métricas (usuarios activos, abiertos, indecisos, etc.). |
| **Uso institucional** | Indicador de dinamismo del mercado laboral y posible demanda de contacto por parte de empleadores. |

---

## Sección 10 — Métricas básicas del mercado (`id="metricas-avanzadas"`)

### 12. Años de Experiencia
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `experienciaChart` |
| **Tipo** | Gráfico de dona (*doughnut*) |
| **Título en pantalla** | Distribución por Años de Experiencia |
| **Descripción** | Distribución porcentual de egresados según los rangos de años de experiencia declarados en el perfil. |
| **Interpretación** | Complementa al gráfico de barras de experiencia (n.º 8) con una vista proporcional tipo *pie/doughnut* para comparar segmentos relativos. |

### 13. Nivel de Educación
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `educacionChart` |
| **Tipo** | Gráfico de barras verticales (*bar*) |
| **Título en pantalla** | Distribución por Nivel de Educación |
| **Descripción** | Cantidad de profesionales por nivel educativo (técnico, pregrado, postgrado u opciones personalizadas). |
| **Interpretación** | Muestra el perfil académico predominante de la comunidad de egresados. |

### 14. Rangos Salariales
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `salarioChart` |
| **Tipo** | Gráfico circular (*pie*) |
| **Título en pantalla** | Distribución de Rangos Salariales |
| **Descripción** | Proporción de egresados en cada banda salarial declarada en su perfil (rangos discretos definidos en el sistema). |
| **Interpretación** | Permite ver qué tramos de remuneración concentran mayor número de profesionales en la muestra total. |

### 15. Áreas de Interés
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `areasInteresChart` |
| **Tipo** | Gráfico de barras horizontales (*bar*) |
| **Título en pantalla** | Áreas de Interés Profesional |
| **Descripción** | Top **10 áreas de interés** más frecuentes entre los egresados (por ejemplo: desarrollo web, datos, ciberseguridad, etc.). |
| **Variables mostradas** | Cantidad de profesionales y porcentaje del total por área. |
| **Interpretación** | Refleja hacia qué dominios profesionales orientan su carrera los egresados, útil para diseño curricular y ofertas formativas. |

### 16. Tipos de Empleo
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `tiposEmpleoChart` |
| **Tipo** | Gráfico de dona (*doughnut*) |
| **Título en pantalla** | Tipos de Empleo Actual |
| **Descripción** | Distribución de egresados según modalidad de contrato o situación laboral actual (tiempo completo, part-time, freelance, etc.). |
| **Interpretación** | Caracteriza la estructura del empleo en la muestra: predominio de empleo formal vs. modalidades flexibles. |

*En la misma sección aparece un panel de **Resumen de métricas básicas** (tarjetas HTML) con total de profesionales, top tecnología y área principal; no es un gráfico Chart.js.*

---

## Sección 11 — Análisis de correlaciones avanzadas (`id="analisis-correlaciones"`)

### 17. Tecnologías con Mejores Salarios
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `tecnologiasVsSalarioChart` |
| **Tipo** | Gráfico de barras horizontales (*bar*) |
| **Título en pantalla** | Tecnologías con Mejores Salarios |
| **Descripción** | Ranking de tecnologías ordenadas por **salario promedio** de los egresados que las declaran en su perfil. |
| **Variables mostradas** | Salario promedio (CLP) y cantidad de profesionales por tecnología. |
| **Interpretación** | Identifica qué habilidades técnicas están asociadas a mayores remuneraciones en la muestra. Orienta decisiones de capacitación hacia skills mejor pagadas. |

### 18. Impacto de la Educación en el Salario
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `salarioVsEducacionChart` |
| **Tipo** | Gráfico de barras agrupadas (*bar*, dos series) |
| **Título en pantalla** | Impacto de la Educación en el Salario |
| **Descripción** | Compara, por **nivel educativo**, el salario promedio y el salario máximo reportado por los egresados. |
| **Interpretación** | Permite evaluar el retorno económico asociado a mayor formación académica. Barras más altas en niveles superiores sugieren correlación positiva entre educación y remuneración. |

### 19. Satisfacción Laboral por Tipo de Empleo
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `tipoEmpleoVsSatisfaccionChart` |
| **Tipo** | Gráfico de barras verticales (*bar*) |
| **Título en pantalla** | Satisfacción Laboral por Tipo de Empleo |
| **Descripción** | Promedio de satisfacción (1–5 estrellas) según la modalidad de empleo actual de cada egresado. |
| **Variables mostradas** | Satisfacción promedio y cantidad de profesionales por tipo de empleo. |
| **Interpretación** | Compara el bienestar laboral entre modalidades (por ejemplo, freelance vs. tiempo completo). Útil para recomendar tipos de contrato según satisfacción histórica de la muestra. |

---

## Sección 12 — Proyecciones y análisis predictivo (`id="proyecciones-predictivas"`)

### 20. Proyección de Demanda de Tecnologías
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `proyeccionTecnologiasChart` |
| **Tipo** | Gráfico de líneas múltiples (*line*) |
| **Título en pantalla** | Proyección de Demanda de Tecnologías |
| **Descripción** | Para las **5 tecnologías** más relevantes, muestra la evolución histórica de selecciones durante **6 meses** y una **proyección a 3 meses** (línea punteada), calculada como promedio de los últimos tres meses históricos. |
| **Interpretación** | Línea sólida: comportamiento observado. Línea punteada: tendencia estimada. Permite anticipar qué tecnologías ganarán o mantendrán relevancia en el mercado de egresados. |

### 21. Índice de Empleabilidad
| Atributo | Detalle |
|----------|---------|
| **ID canvas** | `indiceEmpleabilidadChart` |
| **Tipo** | Gráfico de dona (*doughnut*) |
| **Título en pantalla** | Índice de Empleabilidad del Mercado |
| **Descripción** | Distribuye los perfiles según su **score de empleabilidad** (escala 0–100), calculado a partir de cuatro criterios ponderados: experiencia (máx. 25 pts), educación (máx. 25 pts), tecnologías (máx. 25 pts) y satisfacción laboral (máx. 25 pts). |
| **Interpretación** | Cada segmento agrupa egresados en rangos de puntuación (por ejemplo: alto, medio, bajo). El panel lateral muestra el **score promedio del mercado** y el total de perfiles analizados. Indicador sintético de empleabilidad colectiva de la comunidad. |

---

## Resumen: correspondencia con el menú lateral

| Opción del menú | Gráfico / sección principal |
|-----------------|----------------------------|
| Dashboard principal | Resumen general (n.º 1) |
| Análisis salarial | Top Salarial por Industria (n.º 3) |
| Tecnologías más demandadas | Tecnologías Más Demandadas (n.º 5) |
| Satisfacción laboral | Salarios por Industria / Satisfacción por empresa (n.º 4b, 6) |
| Análisis de experiencia | Distribución por Experiencia (n.º 8) |
| Tecnologías vs Experiencia | Experiencia vs Tecnologías (n.º 9) |
| Mapa de calor | Mapa de Calor Industria–Salario (n.º 10) |
| Estado del mercado | Disponibilidad para Cambio (n.º 11) |
| Métricas básicas y avanzadas | Sección métricas (n.º 12–16) y correlaciones (n.º 17–21) |

---

## Notas para la tesis

1. **Visibilidad condicional:** Varios gráficos solo se renderizan si el backend devuelve datos (`*ngIf`). En muestras pequeñas, algunas secciones pueden no aparecer.
2. **Rol administrador:** El gráfico de *Tendencias del mercado* (n.º 2) y la tarjeta *Nuevos este mes* en *Composición del Mercado* son exclusivos del administrador.
3. **Moneda:** Los valores salariales se expresan en **pesos chilenos (CLP)** con formato local (`es-CL`).
4. **Total de gráficos Chart.js:** **21** instancias en canvas, más visualizaciones complementarias en HTML (listados y barras de progreso).
