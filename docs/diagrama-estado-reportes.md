# Diagrama de Estados - Visualizar métricas y reportes de egresados

## Descripción

Este diagrama representa los estados por los que pasa el sistema durante el proceso de visualización de métricas y reportes de egresados, desde el estado inicial hasta el estado final, incluyendo estados intermedios.

## Cómo exportar a imagen

1. Copia el código del bloque `mermaid`
2. Ve a https://mermaid.live/
3. Pégalo y exporta como SVG/PNG
4. **Para blanco y negro**: En Mermaid Live, ve a "Configuration" y cambia `theme` a `base` o `neutral`

---

## Diagrama de Estados

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fff','primaryTextColor':'#000','primaryBorderColor':'#000','lineColor':'#000','secondaryColor':'#fff','tertiaryColor':'#fff'}}}%%
stateDiagram-v2
    [*] --> Autenticado : Administrador inicia sesión
    
    Autenticado --> PanelPrincipal : Accede al sistema
    
    PanelPrincipal --> SolicitandoDatos : Selecciona módulo de reportes
    
    SolicitandoDatos --> ConsultandoDB : Solicita información
    
    ConsultandoDB --> ConsultandoLinkedIn : Datos locales obtenidos
    
    ConsultandoLinkedIn --> ProcesandoMetricas : Datos de LinkedIn obtenidos
    
    ProcesandoMetricas --> GenerandoVisualizaciones : Métricas calculadas
    
    GenerandoVisualizaciones --> MostrandoReportes : Visualizaciones generadas
    
    MostrandoReportes --> AnalizandoInformacion : Administrador visualiza métricas
    
    AnalizandoInformacion --> PanelPrincipal : Regresa al panel
    AnalizandoInformacion --> [*] : Cierra sesión
    
    note right of SolicitandoDatos
        Estado intermedio:
        Sistema prepara
        la solicitud de datos
    end note
    
    note right of ProcesandoMetricas
        Estado intermedio:
        Cálculo de métricas:
        - Análisis laboral
        - Experiencia
        - Indicadores
    end note
```
