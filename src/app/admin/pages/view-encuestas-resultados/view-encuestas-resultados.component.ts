import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EncuestaService } from '../../../core/services/encuesta/encuesta.service';
import { MessageService } from 'primeng/api';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

@Component({
  selector: 'app-view-encuestas-resultados',
  templateUrl: './view-encuestas-resultados.component.html',
  styleUrls: ['./view-encuestas-resultados.component.css']
})
export class ViewEncuestasResultadosComponent implements OnInit, OnDestroy {
  estadisticasGenerales: any = {};
  encuestasDisponibles: any[] = [];
  reporteEncuesta: any = {};
  loading = false;
  loadingEstadisticas = false;
  loadingReporte = false;
  encuestaIdSeleccionada: number | null = null;
  displayReporteDialog = false;
  private chartsRendered = false;
  private charts: { [key: string]: Chart } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private encuestaService: EncuestaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticasGenerales();
    this.cargarEncuestasDisponibles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destruirTodosLosGraficos();
  }

  cargarEstadisticasGenerales(): void {
    this.loadingEstadisticas = true;
    this.encuestaService.obtenerEstadisticasGenerales().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.estadisticasGenerales = response.data;
          // Renderizar gráficos solo una vez después de cargar los datos
          setTimeout(() => {
            this.renderizarGraficosPrincipales();
          }, 300);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar estadísticas generales'
          });
        }
        this.loadingEstadisticas = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar estadísticas'
        });
        this.loadingEstadisticas = false;
      }
    });
  }

  cargarEncuestasDisponibles(): void {
    this.loading = true;
    this.encuestaService.obtenerEncuestas(1, 100).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.encuestasDisponibles = response.data.encuestas;
          // Ordenar encuestas: las expiradas van al final
          this.ordenarEncuestas();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar encuestas'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar encuestas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar encuestas'
        });
        this.loading = false;
      }
    });
  }

  verReporteEncuesta(encuestaId: number): void {
    // Destruir solo los gráficos del modal anterior
    this.destruirGraficosModal();
    this.chartsRendered = false;

    this.encuestaIdSeleccionada = encuestaId;
    this.loadingReporte = true;

    this.encuestaService.obtenerReporteEncuesta(encuestaId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.reporteEncuesta = response.data;
          this.displayReporteDialog = true;

          console.log('Reporte cargado:', this.reporteEncuesta);
          console.log('Tiene preguntas:', !!this.reporteEncuesta.preguntas);
          console.log('Total preguntas:', this.reporteEncuesta.preguntas?.length);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar reporte'
          });
        }
        this.loadingReporte = false;
      },
      error: (error) => {
        console.error('Error al cargar reporte:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar reporte'
        });
        this.loadingReporte = false;
      }
    });
  }

  exportarDatosEncuesta(encuestaId: number): void {
    this.loading = true;

    this.encuestaService.exportarDatosEncuesta(encuestaId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.generarExcelReporte(response.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Datos exportados correctamente a Excel'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al exportar datos'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al exportar datos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al exportar datos'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Genera un archivo Excel con formato similar a Google Forms
   */
  private generarExcelReporte(data: any): void {
    const workbook = XLSX.utils.book_new();

    // Información de la encuesta
    const encuestaInfo = data.encuesta || {};
    const respuestas = data.datos || [];

    // Crear hoja de resumen
    const resumenData = [
      ['REPORTE DE ENCUESTA'],
      [],
      ['Título:', encuestaInfo.titulo || 'Sin título'],
      ['Descripción:', encuestaInfo.descripcion || 'Sin descripción'],
      ['Estado:', encuestaInfo.estado || 'N/A'],
      ['Total de respuestas:', respuestas.length],
      ['Fecha de exportación:', new Date().toLocaleDateString('es-ES')],
      []
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

    // Estilos para el resumen
    wsResumen['!cols'] = [{ width: 25 }, { width: 50 }];

    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

    // Crear hoja de respuestas detalladas (estilo Google Forms)
    if (respuestas.length > 0) {
      // Preparar datos en formato de tabla
      const respuestasFormateadas: any[] = [];

      respuestas.forEach((respuesta: any, index: number) => {
        const fila: any = {
          'N°': index + 1,
          'Marca temporal': respuesta.fecha_respuesta
            ? new Date(respuesta.fecha_respuesta).toLocaleString('es-ES')
            : 'N/A',
          'Usuario': respuesta.usuario_nombre || 'Anónimo'
        };

        // Agregar cada pregunta como columna
        if (respuesta.respuestas && Array.isArray(respuesta.respuestas)) {
          respuesta.respuestas.forEach((resp: any) => {
            const preguntaTexto = resp.pregunta || 'Pregunta';
            fila[preguntaTexto] = resp.respuesta || '';
          });
        }

        respuestasFormateadas.push(fila);
      });

      const wsRespuestas = XLSX.utils.json_to_sheet(respuestasFormateadas);

      // Ajustar ancho de columnas
      const columnWidths = [
        { width: 5 },  // N°
        { width: 20 }, // Marca temporal
        { width: 25 }  // Usuario
      ];

      // Ancho automático para columnas de preguntas
      if (respuestasFormateadas.length > 0) {
        const firstRow = respuestasFormateadas[0];
        Object.keys(firstRow).forEach((key, idx) => {
          if (idx >= 3) { // Después de N°, Marca temporal, Usuario
            columnWidths.push({ width: 30 });
          }
        });
      }

      wsRespuestas['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, wsRespuestas, 'Respuestas');
    }

    // Crear hoja de estadísticas por pregunta
    if (data.preguntas && data.preguntas.length > 0) {
      const estadisticasData: any[] = [];

      estadisticasData.push(['ESTADÍSTICAS POR PREGUNTA']);
      estadisticasData.push([]);

      data.preguntas.forEach((pregunta: any, index: number) => {
        estadisticasData.push([`Pregunta ${index + 1}:`, pregunta.texto]);
        estadisticasData.push(['Tipo:', this.getTipoPreguntaLabel(pregunta.tipo)]);
        estadisticasData.push(['Total respuestas:', pregunta.total_respuestas]);

        if (pregunta.analisis) {
          // Análisis de opciones
          if (pregunta.analisis.opciones_count) {
            estadisticasData.push(['']);
            estadisticasData.push(['Opción', 'Cantidad', 'Porcentaje']);
            Object.entries(pregunta.analisis.opciones_count).forEach(([opcion, cantidad]) => {
              const porcentaje = this.getPercentage(Number(cantidad), pregunta.total_respuestas);
              estadisticasData.push([opcion, cantidad, `${porcentaje}%`]);
            });
          }

          // Análisis de escala
          if (pregunta.analisis.promedio !== undefined) {
            estadisticasData.push(['']);
            estadisticasData.push(['Promedio:', pregunta.analisis.promedio]);
            estadisticasData.push(['Total valores:', pregunta.analisis.total_valores]);
          }

          // Análisis numérico
          if (pregunta.analisis.minimo !== undefined) {
            estadisticasData.push(['']);
            estadisticasData.push(['Promedio:', pregunta.analisis.promedio]);
            estadisticasData.push(['Mínimo:', pregunta.analisis.minimo]);
            estadisticasData.push(['Máximo:', pregunta.analisis.maximo]);
            estadisticasData.push(['Valores válidos:', pregunta.analisis.valores_validos]);
          }

          // Análisis de texto
          if (pregunta.analisis.respuestas_unicas !== undefined) {
            estadisticasData.push(['']);
            estadisticasData.push(['Respuestas únicas:', pregunta.analisis.respuestas_unicas]);
            estadisticasData.push(['Total respuestas:', pregunta.analisis.total_respuestas]);
          }
        }

        estadisticasData.push([]);
        estadisticasData.push([]);
      });

      const wsEstadisticas = XLSX.utils.aoa_to_sheet(estadisticasData);
      wsEstadisticas['!cols'] = [{ width: 30 }, { width: 40 }, { width: 15 }];

      XLSX.utils.book_append_sheet(workbook, wsEstadisticas, 'Estadísticas');
    }

    // Generar y descargar el archivo
    const nombreArchivo = `Reporte_${encuestaInfo.titulo || 'Encuesta'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  }

  cerrarReporteDialog(): void {
    this.displayReporteDialog = false;
    this.reporteEncuesta = {};
    this.encuestaIdSeleccionada = null;
    // Solo destruir gráficos del modal
    this.destruirGraficosModal();
    this.chartsRendered = false;
  }

  /**
   * Se ejecuta cuando se cambia de pestaña
   */
  onTabChange(event: any): void {
    console.log('Cambio de pestaña:', event.index);

    // Si se cambia a la pestaña de gráficos (index 1)
    if (event.index === 1) {
      console.log('Cambiando a pestaña de gráficos');

      // Destruir solo gráficos del modal antes de renderizar nuevos
      this.destruirGraficosModal();
      this.chartsRendered = false;

      // Esperar a que el DOM esté listo
      setTimeout(() => {
        this.renderizarGraficos();
      }, 300);
    }
  }

  actualizarDatos(): void {
    this.cargarEstadisticasGenerales();
    this.cargarEncuestasDisponibles();
  }

  ordenarEncuestas(): void {
    this.encuestasDisponibles.sort((a, b) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Función para determinar si una encuesta está expirada
      const esExpirada = (encuesta: any) => {
        if (encuesta.fecha_fin) {
          const fechaFin = new Date(encuesta.fecha_fin);
          fechaFin.setHours(23, 59, 59, 999);
          return fechaFin < hoy;
        }
        return false;
      };

      const aExpirada = esExpirada(a);
      const bExpirada = esExpirada(b);

      // Si una está expirada y la otra no, la expirada va al final
      if (aExpirada && !bExpirada) {
        return 1; // a va después de b
      }
      if (!aExpirada && bExpirada) {
        return -1; // a va antes de b
      }

      // Si ambas tienen el mismo estado de expiración, mantener orden original
      return 0;
    });
  }

  getEstadoBadgeClass(estado: string, encuesta?: any): string {
    if (encuesta) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día actual

      // Si la encuesta está expirada, usar clase específica
      if (encuesta.fecha_fin) {
        const fechaFin = new Date(encuesta.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);

        if (fechaFin < hoy) {
          return 'estado-expirada';
        }
      }

      // Si la encuesta tiene fecha de inicio en el futuro, usar clase específica
      // Solo si el estado es ACTIVA
      if (encuesta.fecha_inicio && estado === 'ACTIVA') {
        const fechaInicio = new Date(encuesta.fecha_inicio);
        fechaInicio.setHours(0, 0, 0, 0);

        if (fechaInicio > hoy) {
          return 'estado-proximamente';
        }
      }
    }

    switch (estado) {
      case 'BORRADOR':
        return 'estado-borrador';
      case 'ACTIVA':
        return 'estado-activa';
      default:
        return 'estado-borrador';
    }
  }

  getEstadoLabel(estado: string, encuesta?: any): string {
    if (encuesta) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día actual

      // Si la encuesta tiene fecha de fin y ya pasó, mostrar "Expirada"
      if (encuesta.fecha_fin) {
        const fechaFin = new Date(encuesta.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999); // Fin del día de expiración

        if (fechaFin < hoy) {
          return 'Expirada';
        }
      }

      // Si la encuesta tiene fecha de inicio en el futuro, mostrar "Próximamente"
      // Solo si el estado es ACTIVA
      if (encuesta.fecha_inicio && estado === 'ACTIVA') {
        const fechaInicio = new Date(encuesta.fecha_inicio);
        fechaInicio.setHours(0, 0, 0, 0); // Inicio del día de inicio

        if (fechaInicio > hoy) {
          return 'Próximamente';
        }
      }
    }

    switch (estado) {
      case 'BORRADOR':
        return 'Borrador';
      case 'ACTIVA':
        return 'Activa';
      default:
        return estado;
    }
  }

  getTipoPreguntaLabel(tipo: string): string {
    switch (tipo) {
      case 'TEXTO_CORTO':
        return 'Texto Corto';
      case 'TEXTO_LARGO':
        return 'Texto Largo';
      case 'OPCION_UNICA':
        return 'Opción Única';
      case 'OPCION_MULTIPLE':
        return 'Opción Múltiple';
      case 'ESCALA':
        return 'Escala';
      case 'FECHA':
        return 'Fecha';
      case 'NUMERO':
        return 'Número';
      default:
        return tipo;
    }
  }

  // Métodos auxiliares para resúmenes de datos
  getOpcionMasSeleccionada(opcionesCount: any): string {
    if (!opcionesCount) return 'N/A';

    let maxCount = 0;
    let opcionMasSeleccionada = '';

    Object.entries(opcionesCount).forEach(([opcion, cantidad]) => {
      if (Number(cantidad) > maxCount) {
        maxCount = Number(cantidad);
        opcionMasSeleccionada = opcion;
      }
    });

    return opcionMasSeleccionada || 'N/A';
  }

  getCantidadOpcionMasSeleccionada(opcionesCount: any): number {
    if (!opcionesCount) return 0;

    let maxCount = 0;

    Object.entries(opcionesCount).forEach(([opcion, cantidad]) => {
      if (Number(cantidad) > maxCount) {
        maxCount = Number(cantidad);
      }
    });

    return maxCount;
  }

  getInterpretacionEscala(promedio: number): string {
    if (promedio >= 4.5) return 'Excelente - Muy satisfecho';
    if (promedio >= 3.5) return 'Bueno - Satisfecho';
    if (promedio >= 2.5) return 'Regular - Neutral';
    if (promedio >= 1.5) return 'Malo - Insatisfecho';
    return 'Muy malo - Muy insatisfecho';
  }


  getDistribucionNumerica(minimo: number, maximo: number, promedio: number): string {
    if (!minimo && !maximo && !promedio) return 'Sin datos';

    const rango = maximo - minimo;
    const posicionPromedio = ((promedio - minimo) / rango) * 100;

    if (posicionPromedio >= 80) return 'Distribución alta';
    if (posicionPromedio >= 60) return 'Distribución media-alta';
    if (posicionPromedio >= 40) return 'Distribución media';
    if (posicionPromedio >= 20) return 'Distribución media-baja';
    return 'Distribución baja';
  }

  getFechaMinima(fechas: string[]): Date {
    if (!fechas || fechas.length === 0) return new Date();

    return new Date(Math.min(...fechas.map(fecha => new Date(fecha).getTime())));
  }

  getFechaMaxima(fechas: string[]): Date {
    if (!fechas || fechas.length === 0) return new Date();

    return new Date(Math.max(...fechas.map(fecha => new Date(fecha).getTime())));
  }

  // Métodos auxiliares para templates
  getOpcionKey(opcion: any): string {
    return String(opcion.key || '');
  }

  getOpcionKeyLength(opcion: any): number {
    return String(opcion.key || '').length;
  }

  getOpcionesCount(opcionesCount: any): number {
    if (!opcionesCount) return 0;
    return Object.keys(opcionesCount).length;
  }

  getPrioridadLabel(prioridad: string): string {
    switch (prioridad) {
      case 'BAJA':
        return 'Baja';
      case 'MEDIA':
        return 'Media';
      case 'ALTA':
        return 'Alta';
      case 'URGENTE':
        return 'Urgente';
      default:
        return prioridad;
    }
  }

  getPrioridadBadgeClass(prioridad: string): string {
    switch (prioridad) {
      case 'BAJA':
        return 'prioridad-baja';
      case 'MEDIA':
        return 'prioridad-media';
      case 'ALTA':
        return 'prioridad-alta';
      case 'URGENTE':
        return 'prioridad-urgente';
      default:
        return 'prioridad-media';
    }
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  asNumber(value: unknown): number {
    return Number(value) || 0;
  }

  /**
   * Renderiza los gráficos principales (Estado y Usuarios)
   * Solo se llama una vez al cargar la página
   */
  private renderizarGraficosPrincipales(): void {
    // Solo renderizar si no existen ya
    if (!this.charts['estadoEncuestas'] && !this.charts['usuariosParticipacion']) {
      this.renderEstadosEncuestasChart();
      this.renderUsuariosParticipacionChart();
    }
  }

  /**
   * Renderiza todos los gráficos de las preguntas
   */
  private renderizarGraficos(): void {
    if (!this.reporteEncuesta.preguntas || this.chartsRendered) {
      console.log('No se pueden renderizar gráficos:', {
        tienePreguntas: !!this.reporteEncuesta.preguntas,
        yaRenderizado: this.chartsRendered
      });
      return;
    }

    console.log('Renderizando gráficos para', this.reporteEncuesta.preguntas.length, 'preguntas');

    this.reporteEncuesta.preguntas.forEach((pregunta: any, index: number) => {
      console.log(`Pregunta ${index + 1}:`, pregunta.texto);
      console.log('Tipo:', pregunta.tipo);
      console.log('Total respuestas:', pregunta.total_respuestas);
      console.log('Tiene análisis:', !!pregunta.analisis);

      if (!pregunta.analisis || pregunta.total_respuestas === 0) {
        console.log('   Sin datos para graficar');
        return;
      }

      // Renderizar según tipo de pregunta
      if (pregunta.analisis.opciones_count) {
        console.log('Renderizando gráfico de dona');
        this.renderizarGraficoDona(pregunta, index);
      } else if (pregunta.tipo === 'ESCALA' && pregunta.analisis.promedio !== undefined) {
        console.log('Renderizando gráfico de escala');
        this.renderizarGraficoEscala(pregunta, index);
      } else if (pregunta.analisis.top_respuestas && pregunta.analisis.top_respuestas.length > 0) {
        console.log('Renderizando gráfico de texto');
        this.renderizarGraficoTexto(pregunta, index);
      } else if (pregunta.tipo === 'NUMERO' && pregunta.analisis.minimo !== undefined) {
        console.log('  Renderizando gráfico numérico');
        this.renderizarGraficoNumerico(pregunta, index);
      } else if (pregunta.tipo === 'FECHA' && pregunta.analisis.fechas_unicas !== undefined) {
        console.log('Renderizando gráfico de fechas');
        this.renderizarGraficoFechas(pregunta, index);
      }
    });

    this.chartsRendered = true;
    console.log('Gráficos renderizados');
  }

  /**
   * Renderiza gráfico de dona para preguntas de opción única/múltiple
   */
  private renderizarGraficoDona(pregunta: any, index: number): void {
    const canvas = document.getElementById(`chart-opciones-${index}`) as HTMLCanvasElement;
    console.log(`Buscando canvas: chart-opciones-${index}`, canvas ? 'Encontrado' : 'No encontrado');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    const chartKey = `opciones-${index}`;
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
    }

    const opciones = Object.entries(pregunta.analisis.opciones_count);
    const labels = opciones.map(([key]) => key);
    const data = opciones.map(([, value]) => Number(value));

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.charts[chartKey] = new Chart(ctx, config);
  }

  /**
   * Renderiza gráfico de barras horizontales para escala
   */
  private renderizarGraficoEscala(pregunta: any, index: number): void {
    const canvas = document.getElementById(`chart-escala-${index}`) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartKey = `escala-${index}`;
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
    }

    // Obtener distribución de valores si existe
    const valoresCount = pregunta.analisis.valores_count || {};
    const labels = Object.keys(valoresCount).sort((a, b) => Number(a) - Number(b));
    const data = labels.map(label => valoresCount[label]);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels.map(l => `Valor ${l}`),
        datasets: [{
          label: 'Cantidad de respuestas',
          data: data,
          backgroundColor: '#4F46E5',
          borderColor: '#4338CA',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x} respuestas`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    };

    this.charts[chartKey] = new Chart(ctx, config);
  }

  /**
   * Renderiza gráfico de barras horizontales para respuestas de texto
   */
  private renderizarGraficoTexto(pregunta: any, index: number): void {
    const canvas = document.getElementById(`chart-texto-${index}`) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartKey = `texto-${index}`;
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
    }

    const topRespuestas = pregunta.analisis.top_respuestas.slice(0, 10);
    const labels = topRespuestas.map((r: any) => {
      const texto = r.respuesta || '';
      return texto.length > 40 ? texto.substring(0, 40) + '...' : texto;
    });
    const data = topRespuestas.map((r: any) => r.count);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Frecuencia',
          data: data,
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const item = items[0];
                const respuesta = topRespuestas[item.dataIndex];
                return respuesta.respuesta;
              },
              label: (context) => `Frecuencia: ${context.parsed.x}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    };

    this.charts[chartKey] = new Chart(ctx, config);
  }

  /**
   * Renderiza gráfico de barras verticales para números
   */
  private renderizarGraficoNumerico(pregunta: any, index: number): void {
    const canvas = document.getElementById(`chart-numerico-${index}`) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartKey = `numerico-${index}`;
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Mínimo', 'Promedio', 'Máximo'],
        datasets: [{
          label: 'Valores',
          data: [
            pregunta.analisis.minimo || 0,
            pregunta.analisis.promedio || 0,
            pregunta.analisis.maximo || 0
          ],
          backgroundColor: ['#10B981', '#4F46E5', '#F59E0B'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    this.charts[chartKey] = new Chart(ctx, config);
  }

  /**
   * Renderiza gráfico de línea para fechas
   */
  private renderizarGraficoFechas(pregunta: any, index: number): void {
    const canvas = document.getElementById(`chart-fechas-${index}`) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartKey = `fechas-${index}`;
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
    }

    const fechasProporcionadas = pregunta.analisis.fechas_proporcionadas || [];

    // Agrupar por fecha y contar
    const fechasCount: { [key: string]: number } = {};
    fechasProporcionadas.forEach((fecha: string) => {
      const fechaKey = new Date(fecha).toLocaleDateString('es-ES');
      fechasCount[fechaKey] = (fechasCount[fechaKey] || 0) + 1;
    });

    const labels = Object.keys(fechasCount).sort();
    const data = labels.map(label => fechasCount[label]);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Respuestas por fecha',
          data: data,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    };

    this.charts[chartKey] = new Chart(ctx, config);
  }

  /**
   * Renderiza el gráfico de estado de encuestas (Total, Activas, Expiradas)
   */
  private renderEstadosEncuestasChart(): void {
    const ctx = document.getElementById('estadoEncuestasChart') as HTMLCanvasElement;
    if (!ctx || !this.estadisticasGenerales) return;

    // Solo destruir si el gráfico existe
    if (this.charts['estadoEncuestas']) {
      this.charts['estadoEncuestas'].destroy();
      delete this.charts['estadoEncuestas'];
    }

    // Verificar que el canvas esté visible antes de renderizar
    if (ctx.offsetParent === null) return;

    // Preparar datos para el gráfico
    const datos = {
      total: this.estadisticasGenerales.total_encuestas || 0,
      activas: this.estadisticasGenerales.encuestas_activas || 0,
      expiradas: this.estadisticasGenerales.encuestas_expiradas || 0
    };

    this.charts['estadoEncuestas'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total', 'Activas', 'Expiradas'],
        datasets: [{
          label: 'Encuestas',
          data: [datos.total, datos.activas, datos.expiradas],
          backgroundColor: ['#5DB3E0', '#8BE28B', '#FF6B6B'],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return `${context.label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * Renderiza el gráfico de usuarios y participación
   */
  private renderUsuariosParticipacionChart(): void {
    const ctx = document.getElementById('usuariosParticipacionChart') as HTMLCanvasElement;
    if (!ctx || !this.estadisticasGenerales) return;

    // Solo destruir si el gráfico existe
    if (this.charts['usuariosParticipacion']) {
      this.charts['usuariosParticipacion'].destroy();
      delete this.charts['usuariosParticipacion'];
    }

    // Verificar que el canvas esté visible antes de renderizar
    if (ctx.offsetParent === null) return;

    const totalUsuarios = this.estadisticasGenerales.total_usuarios || 0;
    const usuariosActivos = this.estadisticasGenerales.usuarios_activos || 0;
    const tasaParticipacion = this.estadisticasGenerales.tasa_participacion || 0;

    this.charts['usuariosParticipacion'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Total Usuarios', 'Participación de usuarios', 'Tasa Participación'],
        datasets: [{
          data: [totalUsuarios, usuariosActivos, tasaParticipacion],
          backgroundColor: ['#A78BFA', '#00a0b0', '#FF9B73'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 8,
              usePointStyle: true,
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                if (label === 'Tasa Participación') {
                  return `${label}: ${value}%`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        elements: {
          arc: {
            borderWidth: 0
          }
        },
        animation: {
          animateRotate: true,
          animateScale: false
        }
      }
    });
  }

  /**
   * Destruye solo los gráficos del modal (preguntas)
   */
  private destruirGraficosModal(): void {
    Object.keys(this.charts).forEach(key => {
      // Solo destruir gráficos que no son los principales
      if (key !== 'estadoEncuestas' && key !== 'usuariosParticipacion') {
        if (this.charts[key]) {
          this.charts[key].destroy();
          delete this.charts[key];
        }
      }
    });
  }

  /**
   * Destruye todos los gráficos (solo al destruir el componente)
   */
  private destruirTodosLosGraficos(): void {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        delete this.charts[key];
      }
    });
  }
}
