# Diagrama de Secuencia - Visualizar métricas y reportes de egresados

## Descripción

Este diagrama representa la interacción entre el **Administrador**, el **Sistema (Frontend)**, el **Backend** y la **API de LinkedIn** para el caso de uso "Visualizar métricas y reportes de egresados".

## Cómo exportar a imagen

1. Copia el código del bloque `mermaid`
2. Ve a https://mermaid.live/
3. Pégalo y exporta como SVG/PNG
4. **Para blanco y negro**: En Mermaid Live, ve a "Configuration" y cambia `theme` a `base` o `neutral`

---

## Diagrama de Secuencia

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fff','primaryTextColor':'#000','primaryBorderColor':'#000','lineColor':'#000','secondaryColor':'#fff','tertiaryColor':'#fff'}}}%%
sequenceDiagram
    actor Admin as Administrador
    participant UI as Sistema (Frontend)
    participant Backend as Servidor Backend
    participant DB as Base de Datos
    participant LinkedIn as API LinkedIn

    Note over Admin,LinkedIn: Caso de Uso: Visualizar métricas y reportes de egresados

    %% Pre-condición
    Note over Admin,UI: Pre-condición: Administrador autenticado

    %% Curso Normal de Eventos
    Admin->>+UI: 1. Accede al panel principal
    UI->>Admin: 2. Muestra opciones del panel administrativo

    Admin->>UI: 3. Selecciona módulo de reportes de egresados
    UI->>+Backend: 4. Solicita datos de egresados para reportes

    Backend->>+DB: Consulta información de egresados
    DB-->>-Backend: Retorna datos almacenados

    Backend->>+LinkedIn: Solicita datos actualizados (si es necesario)
    LinkedIn-->>-Backend: Retorna información profesional actualizada

    Backend->>Backend: 5. Procesa y calcula métricas:<br/>- Análisis laboral<br/>- Experiencia y tecnologías<br/>- Indicadores avanzados

    Backend-->>-UI: Retorna métricas procesadas y datos para visualización

    UI->>UI: Genera gráficos dinámicos y visualizaciones

    UI->>-Admin: 5. Muestra métricas y visualizaciones

    Admin->>Admin: 6. Analiza la información presentada

    %% Curso Alternativo
    alt Sin datos suficientes
        Backend->>UI: No hay datos suficientes
        UI->>Admin: Muestra mensaje: "No hay información disponible"
    end

    Note over Admin,LinkedIn: Fin del caso de uso
```
