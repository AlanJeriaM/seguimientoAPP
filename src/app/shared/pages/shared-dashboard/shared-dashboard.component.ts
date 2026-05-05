import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import {DashboardService,EstadisticasMercado,TecnologiaDemandada,DistribucionSalarial,EmpresaContratante,TendenciasMercado,PerfilUsuario,MetricasAvanzadas,SatisfaccionLaboral,EvolucionSalarial,DistribucionExperienciaData,ExperienciaVsTecnologiasData,MapaCalorData,DisponibilidadCambioData,TecnologiaSalario,SalarioEducacion,TipoEmpleoSatisfaccion,ProyeccionTecnologias,IndiceEmpleabilidad} from '../../../core/services/dashboard/dashboard.service';
import { Router } from '@angular/router';
Chart.register(...registerables);



@Component({
  selector: 'app-shared-dashboard',
  templateUrl: './shared-dashboard.component.html',
  styleUrls: ['./shared-dashboard.component.scss']
})
export class SharedDashboardComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Data properties
  perfilUsuario: PerfilUsuario | null = null;
  estadisticasMercado: EstadisticasMercado | null = null;
  tecnologiasDemandadas: TecnologiaDemandada[] = [];
  distribucionSalarial: DistribucionSalarial[] = [];
  empresasContratantes: EmpresaContratante[] = [];
  tendenciasMercado: TendenciasMercado | null = null;

  // Nuevas métricas avanzadas
  metricasAvanzadas: MetricasAvanzadas | null = null;
  satisfaccionLaboral: SatisfaccionLaboral | null = null;
  evolucionSalarial: EvolucionSalarial | null = null;
  distribucionExperienciaProfesionales: DistribucionExperienciaData | null = null;
  experienciaVsTecnologias: ExperienciaVsTecnologiasData | null = null;
  mapaCalorIndustriaSalarial: MapaCalorData | null = null;
  disponibilidadCambioTrabajo: DisponibilidadCambioData | null = null;

  // Nuevas propiedades
  tecnologiasVsSalario: TecnologiaSalario[] = [];
  salarioVsEducacion: SalarioEducacion[] = [];
  tipoEmpleoVsSatisfaccion: TipoEmpleoSatisfaccion[] = [];
  proyeccionTecnologias: ProyeccionTecnologias | null = null;
  indiceEmpleabilidad: IndiceEmpleabilidad | null = null;

  loading = true;
  error: string | null = null;
  errores: string[] = [];
  imageError = false;

  // Chart references
  private charts: { [key: string]: Chart } = {};

  // Chart options
  private chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#0077b5',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: 'index' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif'
          }
        }
      }
    }
  };

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit() {
    this.loadDashboardData();
    // Cargar nuevos gráficos
    this.loadNuevosGraficos();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyAllCharts();
  }

  async loadDashboardData() {
    try {
      this.loading = true;
      this.error = null;
      this.errores = [];

      // Cargar todos los datos del dashboard
      this.dashboardService.obtenerDatosDashboard()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (datos) => {
            console.log('Datos recibidos del dashboard:', datos);

            // Asignar datos recibidos
            if (datos.estadisticasMercado) {
              this.estadisticasMercado = datos.estadisticasMercado;
            }
            if (datos.tecnologias) {
              this.tecnologiasDemandadas = datos.tecnologias;
            }
            if (datos.distribucionSalarial) {
              this.distribucionSalarial = datos.distribucionSalarial;
              console.log('Distribución salarial cargada:', this.distribucionSalarial);
            } else {
              console.warn('No se recibió distribución salarial');
            }
            if (datos.empresas) {
              this.empresasContratantes = datos.empresas;
            }
            if (datos.tendencias) {
              this.tendenciasMercado = datos.tendencias;
            }
            if (datos.perfilUsuario) {
              this.perfilUsuario = datos.perfilUsuario;
            }

            // Almacenar errores si los hay
            this.errores = datos.errores || [];
            if (this.errores.length > 0) {
              console.warn('Errores al cargar algunos datos:', this.errores);
            }

            // Renderizar gráficos una vez cargados los datos
            setTimeout(() => {
              this.renderAllCharts();
            }, 100);

            // Cargar métricas avanzadas
            this.loadMetricasAvanzadas();

            // Cargar datos de satisfacción laboral
            this.loadSatisfaccionLaboral();

            // Cargar datos de evolución salarial
            this.loadEvolucionSalarial();

            // Cargar datos de distribución de experiencia
            this.loadDistribucionExperiencia();

            // Cargar datos de experiencia vs tecnologías
            this.loadExperienciaVsTecnologias();

            // Cargar datos de mapa de calor industria vs salario
            this.loadMapaCalorIndustriaSalarial();

            // Cargar datos de disponibilidad para cambio de trabajo
            this.loadDisponibilidadCambioTrabajo();

            this.loading = false;
          },
          error: (error) => {
            console.error('Error cargando datos del dashboard:', error);
            this.error = 'Error al cargar los datos del dashboard';
            this.loading = false;
          }
        });

    } catch (error) {
      this.error = 'Error al cargar los datos del dashboard';
      console.error('Dashboard error:', error);
      this.loading = false;
    }
  }

  loadMetricasAvanzadas() {
    this.dashboardService.obtenerMetricasAvanzadas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.metricas) {
            this.metricasAvanzadas = response.metricas;
            console.log('Métricas avanzadas cargadas:', this.metricasAvanzadas);

            // Renderizar gráficos de métricas avanzadas
            setTimeout(() => {
              this.renderAdvancedCharts();
            }, 200);
          } else {
            console.warn('No se pudieron cargar las métricas avanzadas:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando métricas avanzadas:', error);
        }
      });
  }

  loadSatisfaccionLaboral() {
    this.dashboardService.obtenerSatisfaccionLaboral()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.satisfaccion) {
            this.satisfaccionLaboral = response.satisfaccion;
            console.log('Datos de satisfacción laboral cargados:', this.satisfaccionLaboral);

            // Renderizar gráfico de satisfacción
            setTimeout(() => {
              this.renderSatisfaccionLaboralChart();
            }, 200);
          } else {
            console.warn('No se pudieron cargar los datos de satisfacción laboral:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando satisfacción laboral:', error);
        }
      });
  }

  loadEvolucionSalarial() {
    this.dashboardService.obtenerEvolucionSalarial()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.evolucion) {
            this.evolucionSalarial = response.evolucion;
            console.log('Datos de evolución salarial cargados:', this.evolucionSalarial);

            // Renderizar gráfico de evolución salarial
            setTimeout(() => {
              this.renderEvolucionSalarialChart();
            }, 200);
          } else {
            console.warn('No se pudieron cargar los datos de evolución salarial:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando evolución salarial:', error);
        }
      });
  }

  loadDistribucionExperiencia() {
    this.dashboardService.obtenerDistribucionExperiencia()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.distribucion) {
            this.distribucionExperienciaProfesionales = response.distribucion;
            console.log('Datos de distribución de experiencia cargados:', this.distribucionExperienciaProfesionales);

            // Renderizar gráfico de distribución de experiencia
            setTimeout(() => {
              this.renderDistribucionExperienciaChart();
            }, 200);
          } else {
            console.warn('No se pudieron cargar los datos de distribución de experiencia:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando distribución de experiencia:', error);
        }
      });
  }

  loadExperienciaVsTecnologias() {
    this.dashboardService.obtenerExperienciaVsTecnologias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.experienciaVsTecnologias) {
            this.experienciaVsTecnologias = response.experienciaVsTecnologias;
            console.log('Datos de experiencia vs tecnologías cargados:', this.experienciaVsTecnologias);

            // Renderizar gráfico de experiencia vs tecnologías
            setTimeout(() => {
              this.renderExperienciaVsTecnologiasChart();
            }, 200);
          } else {
            console.warn('No se pudieron cargar los datos de experiencia vs tecnologías:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando experiencia vs tecnologías:', error);
        }
      });
  }

  loadMapaCalorIndustriaSalarial() {
    this.dashboardService.obtenerMapaCalorIndustriaSalarial()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.mapaCalor) {
            this.mapaCalorIndustriaSalarial = response.mapaCalor;
            console.log('Datos de mapa de calor industria vs salario cargados:', this.mapaCalorIndustriaSalarial);

            // Renderizar mapa de calor industria vs salario
            setTimeout(() => {
              this.renderMapaCalorIndustriaSalarialChart();
            }, 200);
          } else {
            console.warn('No se pudieron cargar los datos de mapa de calor industria vs salario:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando mapa de calor industria vs salario:', error);
        }
      });
  }

  loadDisponibilidadCambioTrabajo() {
    this.dashboardService.obtenerDisponibilidadCambioTrabajo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.disponibilidadCambio) {
            this.disponibilidadCambioTrabajo = response.disponibilidadCambio;
            console.log('Datos de disponibilidad de cambio cargados:', this.disponibilidadCambioTrabajo);

            // Renderizar gráfico de disponibilidad de cambio
            setTimeout(() => {
              this.renderDisponibilidadCambioChart();
            }, 200);
          } else {
            console.warn('No se pudieron cargar los datos de disponibilidad de cambio:', response.msj);
          }
        },
        error: (error) => {
          console.error('Error cargando disponibilidad de cambio:', error);
      }
    });
  }

  private renderAllCharts() {
    this.renderDistribucionSalarialChart();
    this.renderEmpresasContratantesChart();
    this.renderTendenciasMercadoChart();
    this.renderEstadisticasGeneralesChart();
  }

  navigateToProfile(): void {
    if (!this.isAdmin()) {
      this.router.navigate(['/user/mi-perfil']);
    }
  }

  isAdmin(): boolean {
    return this.router.url.startsWith('/admin/dashboard');
  }

  getNuevosRegistrosEsteMes(): number {
    return this.estadisticasMercado?.nuevosProfesionalesEsteMes || 0;
  }

  getRegistrosMesAnterior(): number {
    return this.estadisticasMercado?.profesionalesMesAnterior || 0;
  }


  private renderDistribucionSalarialChart() {
    console.log('Intentando renderizar gráfico de distribución salarial...');
    console.log('Datos disponibles:', this.distribucionSalarial?.length, this.distribucionSalarial);

    const ctx = document.getElementById('distribucionSalarialChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas distribucionSalarialChart no encontrado');
      return;
    }

    if (!this.distribucionSalarial.length) {
      console.warn('No hay datos de distribución salarial para mostrar');
      return;
    }

    this.destroyChart('distribucionSalarial');

    // Función para formatear números con puntos como separadores de miles
    const formatCurrency = (value: number): string => {
      return `$${value.toLocaleString('es-CL').replace(/,/g, '.')}`;
    };

    // TOP 7: Ordenar por salario promedio y tomar máximo 7 industrias
    const sortedData = [...this.distribucionSalarial]
      .sort((a, b) => b.salarioPromedio - a.salarioPromedio)
      .slice(0, 7); // Máximo 7 industrias (top 7)

    console.log(`Top industrias con mejores salarios: ${sortedData.length}`);

    if (sortedData.length === 0) {
      console.warn('No hay industrias para mostrar');
      return;
    }

    this.charts['distribucionSalarial'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.map(d => d.industria),
        datasets: [
          {
            label: 'Salario Promedio',
            data: sortedData.map(d => d.salarioPromedio),
            backgroundColor: [
              'rgba(52, 152, 219, 0.8)',  // Azul
              'rgba(46, 204, 113, 0.8)',  // Verde
              'rgba(155, 89, 182, 0.8)',  // Púrpura
              'rgba(241, 196, 15, 0.8)',  // Amarillo
              'rgba(231, 76, 60, 0.8)',   // Rojo
              'rgba(230, 126, 34, 0.8)',  // Naranja
              'rgba(52, 73, 94, 0.8)'     // Gris oscuro
            ],
            borderColor: [
              'rgba(52, 152, 219, 1)',
              'rgba(46, 204, 113, 1)',
              'rgba(155, 89, 182, 1)',
              'rgba(241, 196, 15, 1)',
              'rgba(231, 76, 60, 1)',
              'rgba(230, 126, 34, 1)',
              'rgba(52, 73, 94, 1)'
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              padding: 10,
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              callback: function(value) {
                return formatCurrency(Number(value));
              }
            },
            title: {
            display: true,
              text: 'Salario Promedio (CLP)',
              font: {
                size: 12,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#2c3e50'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#2c3e50'
            },
            title: {
              display: true,
              font: {
                size: 12,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#2c3e50'
            }
          }
        },
        plugins: {
          ...this.chartOptions.plugins,
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              }
            }
          },
          title: {
            display: true,
            text: 'Top Industrias con Mejores Salarios',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3498db',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(tooltipItems) {
                return `Industria: ${tooltipItems[0].label}`;
              },
              label: function(context) {
                const dataIndex = context.dataIndex;
                const industryData = sortedData[dataIndex];
                return [
                  `Salario Promedio: ${formatCurrency(industryData.salarioPromedio)}`,
                  `Profesionales: ${industryData.cantidad}`,
                  `Rango: ${formatCurrency(industryData.salarioMinimo)} - ${formatCurrency(industryData.salarioMaximo)}`
                ];
              }
            }
          }
        }
      }
    });
  }

  private renderEmpresasContratantesChart() {
    const ctx = document.getElementById('empresasContratantesChart') as HTMLCanvasElement;
    if (!ctx || !this.empresasContratantes.length) return;

    this.destroyChart('empresasContratantes');

    // TOP 7: Tomar las top 7 empresas con más empleados
    const topEmpresas = this.empresasContratantes.slice(0, 7);

    console.log(`Top empleadores: ${topEmpresas.length}`);

    this.charts['empresasContratantes'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topEmpresas.map(emp => emp.empresa),
        datasets: [{
          label: 'Total Empleados',
          data: topEmpresas.map(emp => emp.totalEmpleados),
          backgroundColor: [
            '#ff6b35',
            '#f7931e',
            '#0077b5',
            '#00a0b0',
            '#7b68ee',
            '#ff69b4',
            '#32cd32'
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top Empleadores del Mercado',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#374151'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context: any) {
                return topEmpresas[context[0].dataIndex].empresa;
              },
              label: function(context: any) {
                const emp = topEmpresas[context.dataIndex];

                // Función para formatear números con puntos
                const formatCurrency = (value: number): string => {
                  return `$${value.toLocaleString('es-CL').replace(/,/g, '.')}`;
                };

                // Función para crear estrellitas
                const formatStars = (rating: number | null): string => {
                  if (rating === null || rating === undefined) return 'Sin datos';
                  // Usar emojis de estrellas que se vean mejor en tooltips
                  const fullStars = '⭐'.repeat(Math.floor(rating));
                  const hasHalfStar = rating % 1 >= 0.5;
                  const halfStar = hasHalfStar ? '✨' : '';
                  const emptyStars = '☆'.repeat(5 - Math.floor(rating) - (hasHalfStar ? 1 : 0));
                  return `${fullStars}${halfStar}${emptyStars} (${rating}/5)`;
                };

                const tooltipLines = [
                  `Empleados: ${emp.totalEmpleados}`,
                  `Salario Promedio: ${formatCurrency(emp.promedioSalario)}`
                ];

                if (emp.satisfaccionPromedio !== null && emp.satisfaccionPromedio !== undefined) {
                  tooltipLines.push(`Satisfacción: ${formatStars(emp.satisfaccionPromedio)}`);
                }

                return tooltipLines;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6'
            },
            ticks: {
              color: '#6b7280'
            }
          },
          y: {
            grid: {
              color: '#f3f4f6'
            },
            ticks: {
              color: '#6b7280'
            }
          }
        }
      }
    });
  }

  private renderTendenciasMercadoChart() {
    const ctx = document.getElementById('tendenciasMercadoChart') as HTMLCanvasElement;
    if (!ctx || !this.tendenciasMercado) return;

    this.destroyChart('tendenciasMercado');

    const meses = this.tendenciasMercado.ultimosSeisMeses;

    this.charts['tendenciasMercado'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: meses.map(m => m.mes),
        datasets: [
          {
            label: 'Nuevos Registros',
            data: meses.map(m => m.nuevosRegistros),
            borderColor: '#0077b5',
            backgroundColor: 'rgba(0, 119, 181, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Perfiles Completos',
            data: meses.map(m => m.perfilesCompletos),
            borderColor: '#00d084',
            backgroundColor: 'rgba(0, 208, 132, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            title: {
            display: true,
              text: 'Cantidad de Usuarios'
            }
          },
          x: {
            grid: {
              display: false
            },
            title: {
              display: true,
              text: 'Período (Últimos 6 meses)'
            }
          }
        },
        plugins: this.chartOptions.plugins
      }
    });
  }

  private renderEstadisticasGeneralesChart() {
    const ctx = document.getElementById('estadisticasGeneralesChart') as HTMLCanvasElement;
    if (!ctx || !this.estadisticasMercado) return;

    this.destroyChart('estadisticasGenerales');

    const stats = this.estadisticasMercado;

    // Configurar labels y data según el rol del usuario
    let labels: string[];
    let data: number[];
    let backgroundColor: string[];

    if (this.isAdmin()) {
      // ADMIN: Muestra todas las métricas incluyendo "Nuevos Este Mes"
      labels = ['Profesionales Activos', 'Empresas Únicas', 'Industrias Únicas', 'Nuevos Este Mes'];
      data = [
        stats.totalProfesionales,
        stats.empresasUnicas,
        stats.industriasUnicas,
        stats.nuevosProfesionalesEsteMes
      ];
      backgroundColor = [
        '#0077b5',
        '#00a0b0',
        '#ff6b35',
        '#f7931e'
      ];
    } else {
      // USUARIO: Solo muestra métricas generales SIN "Nuevos Este Mes"
      labels = ['Profesionales Activos', 'Empresas Únicas', 'Industrias Únicas'];
      data = [
        stats.totalProfesionales,
        stats.empresasUnicas,
        stats.industriasUnicas
      ];
      backgroundColor = [
        '#0077b5',
        '#00a0b0',
        '#ff6b35'
      ];
    }

    this.charts['estadisticasGenerales'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          ...this.chartOptions.plugins,
          legend: {
            ...this.chartOptions.plugins.legend,
            position: 'bottom' as const,
            labels: {
              ...this.chartOptions.plugins.legend.labels,
              padding: 10,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            ...this.chartOptions.plugins.tooltip,
            callbacks: {
              label: function(context: any) {
                const label = context.label;
                let value = 0;
                switch(label) {
                  case 'Profesionales Activos':
                    value = stats.totalProfesionales;
                    break;
                  case 'Empresas Únicas':
                    value = stats.empresasUnicas;
                    break;
                  case 'Industrias Únicas':
                    value = stats.industriasUnicas;
                    break;
                  case 'Nuevos Este Mes':
                    value = stats.nuevosProfesionalesEsteMes;
                    break;
                }
                return `${label}: ${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }

  private destroyChart(chartKey: string) {
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
      delete this.charts[chartKey];
    }
  }

  private destroyAllCharts() {
    Object.keys(this.charts).forEach(key => {
      this.destroyChart(key);
    });
  }

  // Método para recargar datos
  reloadDashboard() {
    this.loadDashboardData();
  }

  getFullName(): string {
    return this.perfilUsuario?.nombre || 'Usuario';
  }

  getCurrentPosition(): string {
    return this.perfilUsuario?.posicion_actual || 'Posición no especificada';
  }

  getCurrentCompany(): string {
    return this.perfilUsuario?.empresa_actual || 'Empresa no especificada';
  }

  getLocation(): string {
    return this.perfilUsuario?.ubicacion || 'Ubicación no especificada';
  }

  getIndustry(): string {
    return this.perfilUsuario?.industria || 'Industria no especificada';
  }

  formatSatisfactionStars(rating: number | null): string {
    if (rating === null || rating === undefined) return 'Sin datos';

    // Usar caracteres Unicode de estrellas que se vean bien
    const fullStars = '★'.repeat(Math.floor(rating));
    const hasHalfStar = rating % 1 >= 0.5;
    const halfStar = hasHalfStar ? '★' : '';
    const emptyStars = '☆'.repeat(5 - Math.floor(rating) - (hasHalfStar ? 1 : 0));

    return `${fullStars}${halfStar}${emptyStars} (${rating}/5)`;
  }

  getNuevosProfesionales(): number {
    return this.estadisticasMercado?.nuevosProfesionalesEsteMes || 0;
  }

  getEmpresasUnicas(): number {
    return this.estadisticasMercado?.empresasUnicas || 0;
  }

  getIndustriasUnicas(): number {
    return this.estadisticasMercado?.industriasUnicas || 0;
  }

  getUserInitials(): string {
    const fullName = this.getFullName();
    if (!fullName || fullName === 'Usuario') return 'US';

    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getTechDemandPercentage(demanda: number): number {
    if (!this.tecnologiasDemandadas.length) return 0;
    const maxDemanda = this.tecnologiasDemandadas[0].demanda || 1;
    return (demanda / maxDemanda) * 100;
  }

  getSeleccionesText(cantidad: number): string {
    return cantidad === 1 ? '1 selección' : `${cantidad} selecciones`;
  }

  // Paleta de colores del gráfico "Top Empleadores"
  private empleadoresColors = [
    '#ff6b35',  // Naranja vibrante
    '#f7931e',  // Naranja dorado
    '#0077b5',  // Azul LinkedIn
    '#00a0b0',  // Azul turquesa
    '#7b68ee',  // Púrpura medio
    '#ff69b4',  // Rosa vibrante
    '#32cd32',  // Verde lima
    '#ffa500',  // Naranja estándar
    '#ff1493',  // Rosa profundo
    '#4169e1',  // Azul real
    '#ff4500',  // Rojo naranja
    '#9370db',  // Púrpura medio violeta
    '#00ced1',  // Turquesa oscuro
    '#ff6347',  // Tomate
    '#20b2aa'   // Turquesa claro
  ];

  getTechnologyColor(index: number): string {
    return this.empleadoresColors[index % this.empleadoresColors.length];
  }

  getEmpleadoText(cantidad: number): string {
    return cantidad === 1 ? '1 empleado' : `${cantidad} empleados`;
  }

  handleImageError(event: any): void {
    console.log('Error cargando imagen de perfil, usando iniciales');
    this.imageError = true;
  }

  getTotalProfesionales(): number {
    if (!this.metricasAvanzadas) return 0;

    // Sumar todas las cantidades de las distribuciones
    let total = 0;
    if (this.metricasAvanzadas.distribucionExperiencia) {
      total = this.metricasAvanzadas.distribucionExperiencia.reduce((acc, item) => acc + item.cantidad, 0);
    }

    return total;
  }

  private renderAdvancedCharts() {
    if (!this.metricasAvanzadas) return;

    this.renderExperienciaChart();
    this.renderEducacionChart();
    this.renderSalarioChart();
    this.renderAreasInteresChart();
    this.renderTiposEmpleoChart();
  }

  private renderSatisfaccionLaboralChart() {
    if (!this.satisfaccionLaboral?.empresas?.length) return;

    const canvas = document.getElementById('satisfaccionLaboralChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['satisfaccionLaboral']) {
      this.charts['satisfaccionLaboral'].destroy();
    }

    // Tomar las top 10 empresas con mejor satisfacción
    const topEmpresas = this.satisfaccionLaboral.empresas.slice(0, 10);

    this.charts['satisfaccionLaboral'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topEmpresas.map(emp => emp.empresa),
        datasets: [{
          label: 'Satisfacción Promedio',
          data: topEmpresas.map(emp => emp.satisfaccionPromedio),
          backgroundColor: [
            '#ff6b35',  // Naranja vibrante
            '#f7931e',  // Naranja dorado
            '#0077b5',  // Azul LinkedIn
            '#00a0b0',  // Azul turquesa
            '#7b68ee',  // Púrpura medio
            '#ff69b4',  // Rosa vibrante
            '#32cd32',  // Verde lima
            '#ffa500',  // Naranja estándar
            '#ff1493',  // Rosa profundo
            '#4169e1',  // Azul real
            '#ff4500',  // Rojo naranja
            '#9370db',  // Púrpura medio violeta
            '#00ced1',  // Turquesa oscuro
            '#ff6347',  // Tomate
            '#20b2aa'   // Turquesa claro
          ],
          borderColor: [
            '#ff6b35',  // Naranja vibrante
            '#f7931e',  // Naranja dorado
            '#0077b5',  // Azul LinkedIn
            '#00a0b0',  // Azul turquesa
            '#7b68ee',  // Púrpura medio
            '#ff69b4',  // Rosa vibrante
            '#32cd32',  // Verde lima
            '#ffa500',  // Naranja estándar
            '#ff1493',  // Rosa profundo
            '#4169e1',  // Azul real
            '#ff4500',  // Rojo naranja
            '#9370db',  // Púrpura medio violeta
            '#00ced1',  // Turquesa oscuro
            '#ff6347',  // Tomate
            '#20b2aa'   // Turquesa claro
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        scales: {
          x: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return `${value} ★`;
              }
            },
            title: {
              display: true,
              text: 'Satisfacción Promedio (1-5 estrellas)'
            }
          },
          y: {
            ticks: {
              font: {
                size: 10
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Satisfacción Laboral por Empresa',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const empresa = topEmpresas[context.dataIndex];
                const stars = '★'.repeat(Math.floor(empresa.satisfaccionPromedio)) +
                            '☆'.repeat(5 - Math.floor(empresa.satisfaccionPromedio));
                return [
                  `Satisfacción: ${stars}`,
                  `Respuestas: ${empresa.totalRespuestas}`
                ];
              }
            }
          }
        }
      }
    });
  }

  private renderEvolucionSalarialChart() {
    if (!this.evolucionSalarial?.datos?.length) return;

    const canvas = document.getElementById('evolucionSalarialChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['evolucionSalarial']) {
      this.charts['evolucionSalarial'].destroy();
    }

    const datos = this.evolucionSalarial.datos;

    // Función para formatear moneda
    const formatCurrency = (value: number): string => {
      return `$${value.toLocaleString('es-CL').replace(/,/g, '.')}`;
    };

    this.charts['evolucionSalarial'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.map(item => item.rangoExperiencia),
        datasets: [
          {
            label: 'Salario Promedio',
            data: datos.map(item => item.salarioPromedio),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Salario Máximo',
            data: datos.map(item => item.salarioMaximo),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.3
          },
          {
            label: 'Salario Mínimo',
            data: datos.map(item => item.salarioMinimo),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#F59E0B',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              padding: 15,
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              callback: function(value) {
                return formatCurrency(Number(value));
              }
            },
            title: {
              display: true,
              text: 'Salario (CLP)',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#6B7280',
              maxRotation: 45
            },
            title: {
              display: true,
              text: 'Años de Experiencia',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              }
            }
          },
          title: {
            display: true,
            text: 'Evolución del Salario según Años de Experiencia',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(tooltipItems) {
                return `Experiencia: ${tooltipItems[0].label}`;
              },
              label: function(context) {
                const dataIndex = context.dataIndex;
                const item = datos[dataIndex];

                if (context.datasetIndex === 0) {
                  return [
                    `Salario Promedio: ${formatCurrency(item.salarioPromedio)}`,
                    `Profesionales: ${item.cantidad}`,
                    `Rango: ${formatCurrency(item.salarioMinimo)} - ${formatCurrency(item.salarioMaximo)}`
                  ];
                } else if (context.datasetIndex === 1) {
                  return `Salario Máximo: ${formatCurrency(item.salarioMaximo)}`;
                } else {
                  return `Salario Mínimo: ${formatCurrency(item.salarioMinimo)}`;
                }
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private renderDistribucionExperienciaChart() {
    if (!this.distribucionExperienciaProfesionales?.datos?.length) return;

    const canvas = document.getElementById('distribucionExperienciaChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['distribucionExperiencia']) {
      this.charts['distribucionExperiencia'].destroy();
    }

    const datos = this.distribucionExperienciaProfesionales.datos;

    // Ordenar datos por cantidad de profesionales (mayor a menor)
    const datosOrdenados = [...datos].sort((a, b) => b.cantidad - a.cantidad);

    this.charts['distribucionExperiencia'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datosOrdenados.map(item => item.rangoExperiencia),
        datasets: [{
          label: 'Cantidad de Profesionales',
          data: datosOrdenados.map(item => item.cantidad),
          backgroundColor: [
            '#ff6b35',  // Naranja vibrante
            '#f7931e',  // Naranja dorado
            '#0077b5',  // Azul LinkedIn
            '#00a0b0',  // Azul turquesa
            '#7b68ee',  // Púrpura medio
            '#ff69b4',  // Rosa vibrante
            '#32cd32',  // Verde lima
            '#ffa500',  // Naranja estándar
            '#ff1493',  // Rosa profundo
            '#4169e1'   // Azul real
          ],
          borderColor: [
            '#ff6b35',  // Naranja vibrante
            '#f7931e',  // Naranja dorado
            '#0077b5',  // Azul LinkedIn
            '#00a0b0',  // Azul turquesa
            '#7b68ee',  // Púrpura medio
            '#ff69b4',  // Rosa vibrante
            '#32cd32',  // Verde lima
            '#ffa500',  // Naranja estándar
            '#ff1493',  // Rosa profundo
            '#4169e1'   // Azul real
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBorderWidth: 4,
          hoverBackgroundColor: [
            '#ff5722',  // Naranja más intenso al hacer hover
            '#ff9800',  // Naranja dorado más intenso
            '#1976d2',  // Azul LinkedIn más intenso
            '#0097a7',  // Azul turquesa más intenso
            '#673ab7',  // Púrpura medio más intenso
            '#e91e63',  // Rosa vibrante más intenso
            '#4caf50',  // Verde lima más intenso
            '#ff6f00',  // Naranja estándar más intenso
            '#c2185b',  // Rosa profundo más intenso
            '#303f9f'   // Azul real más intenso
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const, // Barras horizontales
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              callback: function(value) {
                return `${value} profesionales`;
              }
            },
            title: {
              display: true,
              text: 'Cantidad de Profesionales',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#6B7280'
            },
            title: {
              display: true,
              text: 'Años de Experiencia',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: false // No mostrar leyenda para un solo dataset
          },
          title: {
            display: true,
            text: 'Distribución de Profesionales por Años de Experiencia',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context: any) {
                return `Experiencia: ${context[0].label}`;
              },
              label: function(context: any) {
                const item = datosOrdenados[context.dataIndex];
                const total = datosOrdenados.reduce((sum, item) => sum + item.cantidad, 0);

                return [
                  `Profesionales: ${item.cantidad}`,
                  `Porcentaje: ${((item.cantidad / total) * 100).toFixed(1)}% del total`,
                  `Rango: ${item.añosMinimos}-${item.añosMaximos === 50 ? '50+' : item.añosMaximos} años`
                ];
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private renderExperienciaVsTecnologiasChart() {
    if (!this.experienciaVsTecnologias?.datos?.length) return;

    const canvas = document.getElementById('experienciaVsTecnologiasChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['experienciaVsTecnologias']) {
      this.charts['experienciaVsTecnologias'].destroy();
    }

    const datos = this.experienciaVsTecnologias.datos;

    // Paleta de colores del gráfico "Top Empleadores"
    const coloresEmpleadores = [
      '#ff6b35',  // Naranja vibrante
      '#f7931e',  // Naranja dorado
      '#0077b5',  // Azul LinkedIn
      '#00a0b0',  // Azul turquesa
      '#7b68ee',  // Púrpura medio
      '#ff69b4',  // Rosa vibrante
      '#32cd32',  // Verde lima
      '#ffa500',  // Naranja estándar
      '#ff1493',  // Rosa profundo
      '#4169e1',  // Azul real
      '#ff4500',  // Rojo naranja
      '#9370db',  // Púrpura medio violeta
      '#00ced1',  // Turquesa oscuro
      '#ff6347',  // Tomate
      '#20b2aa'   // Turquesa claro
    ];

    this.charts['experienciaVsTecnologias'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(item => item.rangoExperiencia),
        datasets: [
          {
            label: 'Promedio de Tecnologías Dominadas',
            data: datos.map(item => item.promedioTecnologias),
            backgroundColor: datos.map((_, index) => coloresEmpleadores[index % coloresEmpleadores.length]),
            borderColor: datos.map((_, index) => coloresEmpleadores[index % coloresEmpleadores.length]),
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#6B7280',
              maxRotation: 45
            },
            title: {
              display: true,
              text: 'Años de Experiencia',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              stepSize: 1,
              callback: function(value) {
                return `${value} tecnologías`;
              }
            },
            title: {
              display: true,
              text: 'Número de Tecnologías',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              }
            }
          },
          title: {
            display: true,
            text: 'Experiencia vs Número de Tecnologías Dominadas',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(tooltipItems) {
                return `Experiencia: ${tooltipItems[0].label}`;
              },
              label: function(context) {
                const dataIndex = context.dataIndex;
                const item = datos[dataIndex];

                return [
                  `Promedio: ${item.promedioTecnologias} tecnologías`,
                  `Profesionales: ${item.cantidad}`,
                  // `Rango de experiencia: ${item.rangoExperiencia}`
                ];
              },
              afterBody: function(tooltipItems) {
                const item = datos[tooltipItems[0].dataIndex];
                // return `Muestra la tendencia entre los años de experiencia y la cantidad de tecnologías manejadas.`;
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private renderMapaCalorIndustriaSalarialChart() {
    if (!this.mapaCalorIndustriaSalarial?.datos?.length) return;

    const canvas = document.getElementById('mapaCalorIndustriaSalarialChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['mapaCalorIndustriaSalarial']) {
      this.charts['mapaCalorIndustriaSalarial'].destroy();
    }

    const datos = this.mapaCalorIndustriaSalarial;
    const rangosSalariales = datos.rangosSalariales.sort((a, b) => a.orden - b.orden);

    // Filtrar industrias que tienen al menos un profesional
    const industriasConDatos = datos.datos.filter(fila => fila.totalProfesionales > 0);
    const industriasLabels = industriasConDatos.map(fila => fila.industria);

    // Crear datasets para cada rango salarial
    const datasets = rangosSalariales.map((rango, index) => {
      const colores = [
        '#EF4444', // Rojo para <500k
        '#F59E0B', // Ámbar para 500k-1M
        '#10B981', // Verde para 1M-1.5M
        '#3B82F6', // Azul para 1.5M-2M
        '#8B5CF6', // Púrpura para 2M-3M
        '#6366F1'  // Índigo para 3M+
      ];

      return {
        label: rango.label,
        data: industriasConDatos.map(fila => {
          const celda = fila.datos.find(d => d.rangoSalarial === rango.id);
          const cantidad = celda ? celda.cantidad : 0;
          // Retornar null en lugar de 0 para ocultar la barra
          return cantidad > 0 ? cantidad : null;
        }),
        backgroundColor: colores[index % colores.length],
        borderColor: '#ffffff',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        hoverBorderWidth: 3,
        hoverBackgroundColor: [
          '#DC2626', // Rojo más intenso para <500k
          '#D97706', // Ámbar más intenso para 500k-1M
          '#059669', // Verde más intenso para 1M-1.5M
          '#2563EB', // Azul más intenso para 1.5M-2M
          '#7C3AED', // Púrpura más intenso para 2M-3M
          '#4F46E5'  // Índigo más intenso para 3M+
        ][index % 6]
      };
    });

    this.charts['mapaCalorIndustriaSalarial'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: industriasLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10,
                family: 'Inter, sans-serif'
              },
              color: '#6B7280',
              maxRotation: 45
            },
            title: {
              display: true,
              text: 'Industrias',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              callback: function(value) {
                return `${value} profesionales`;
              }
            },
            title: {
              display: true,
              text: 'Número de Profesionales',
              font: {
                size: 13,
                weight: 'bold',
                family: 'Inter, sans-serif'
              },
              color: '#374151'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              }
            }
          },
          title: {
            display: true,
            text: 'Mapa de Calor: Industria vs Nivel Salarial',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(tooltipItems: any) {
                return `${tooltipItems[0].label}`;
              },
              label: function(context: any) {
                const industria = context.label;
                const rangoSalarial = context.dataset.label;
                const cantidad = (context.raw as number);

                // Solo mostrar si tiene datos (null o 0 no se muestran)
                if (!cantidad || cantidad === 0) return '';

                const filaIndustria = industriasConDatos.find(fila => fila.industria === industria);
                const totalIndustria = filaIndustria ? filaIndustria.totalProfesionales : 0;
                const porcentaje = totalIndustria > 0 ? Math.round((cantidad / totalIndustria) * 100) : 0;

                return [
                  `${rangoSalarial}: ${cantidad} profesionales`,
                  `${porcentaje}% de ${industria}`
                ];
              },
              afterBody: function(tooltipItems: any) {
                const industria = tooltipItems[0].label;
                const filaIndustria = industriasConDatos.find(fila => fila.industria === industria);
                const totalIndustria = filaIndustria ? filaIndustria.totalProfesionales : 0;

                return [
                  '',
                  `Total industria: ${totalIndustria} profesionales`
                ];
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private renderDisponibilidadCambioChart() {
    if (!this.disponibilidadCambioTrabajo?.datos) {
      console.warn('No hay datos de disponibilidad para renderizar el gráfico');
      return;
    }

    console.log('Datos de disponibilidad recibidos para renderizar:', this.disponibilidadCambioTrabajo.datos);

    const canvas = document.getElementById('disponibilidadCambioChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['disponibilidadCambio']) {
      this.charts['disponibilidadCambio'].destroy();
    }

    const datos = this.disponibilidadCambioTrabajo.datos;

    // Colores específicos para cada opción de disponibilidad
    const coloresDisponibilidad = {
      'Activamente buscando': '#EF4444', // Rojo - alta urgencia
      'Abierto a oportunidades': '#10B981', // Verde - disponible
      'No seguro': '#F59E0B', // Ámbar - indeciso
      'No disponible': '#6B7280', // Gris - no disponible
      'Sin trabajo': '#8B5CF6' // café - sin empleo
    };

    const backgroundColors = datos.map(item => coloresDisponibilidad[item.disponibilidad as keyof typeof coloresDisponibilidad] || '#8B5CF6');
    const borderColors = backgroundColors.map(color => color);

    this.charts['disponibilidadCambio'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: datos.map(item => item.disponibilidad),
        datasets: [{
          label: 'Profesionales',
          data: datos.map(item => item.cantidad),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '50%', // Hace el donut más ancho
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              },
              generateLabels: function(chart) {
                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                const labels = original.call(this, chart);

                // Agregar porcentajes a las etiquetas
                labels.forEach((label, index) => {
                  const item = datos[index];
                  label.text = `${item.disponibilidad} (${item.porcentaje}%)`;
                });

                return labels;
              }
            }
          },
          title: {
            display: true,
            text: 'Disponibilidad para Cambio de Trabajo',
            font: {
              size: 16,
              weight: 'bold',
              family: 'Inter, sans-serif'
            },
            color: '#111827',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                const item = datos[context.dataIndex];
                const total = datos.reduce((sum, d) => sum + d.cantidad, 0);

                return [
                  `Profesionales: ${item.cantidad}`,
                  `Porcentaje: ${item.porcentaje}%`,
                  `Del total: ${total} profesionales`
                ];
              },
              afterBody: function(tooltipItems) {
                const item = datos[tooltipItems[0].dataIndex];

                // Agregar contexto específico según la disponibilidad
                switch (item.disponibilidad) {
                  case 'Activamente buscando':
                    return 'Profesionales que buscan activamente nuevas oportunidades';
                  case 'Abierto a oportunidades':
                    return 'Profesionales dispuestos a considerar ofertas atractivas';
                  case 'No seguro':
                    return 'Profesionales indecisos sobre su situación laboral';
                  case 'No disponible':
                    return 'Profesionales satisfechos en sus trabajos actuales';
                  default:
                    return '';
                }
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private renderExperienciaChart() {
    if (!this.metricasAvanzadas?.distribucionExperiencia) return;

    const canvas = document.getElementById('experienciaChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir chart anterior si existe
    if (this.charts['experiencia']) {
      this.charts['experiencia'].destroy();
    }

    const data = this.metricasAvanzadas.distribucionExperiencia;

    this.charts['experiencia'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(item => item.rango),
        datasets: [{
          data: data.map(item => item.cantidad),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: true,
            text: 'Distribución por Años de Experiencia'
          }
        }
      }
    });
  }

  private renderEducacionChart() {
    if (!this.metricasAvanzadas?.distribucionEducacion) return;

    const canvas = document.getElementById('educacionChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['educacion']) {
      this.charts['educacion'].destroy();
    }

    const data = this.metricasAvanzadas.distribucionEducacion;

    // Paleta de colores del gráfico "Top Empleadores"
    const coloresEmpleadores = [
      '#ff6b35',  // Naranja vibrante
      '#f7931e',  // Naranja dorado
      '#0077b5',  // Azul LinkedIn
      '#00a0b0',  // Azul turquesa
      '#7b68ee',  // Púrpura medio
      '#ff69b4',  // Rosa vibrante
      '#32cd32',  // Verde lima
      '#ffa500',  // Naranja estándar
      '#ff1493',  // Rosa profundo
      '#4169e1',  // Azul real
      '#ff4500',  // Rojo naranja
      '#9370db',  // Púrpura medio violeta
      '#00ced1',  // Turquesa oscuro
      '#ff6347',  // Tomate
      '#20b2aa'   // Turquesa claro
    ];

    this.charts['educacion'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => item.nivel),
        datasets: [{
          label: 'Cantidad',
          data: data.map(item => item.cantidad),
          backgroundColor: data.map((_, index) => coloresEmpleadores[index % coloresEmpleadores.length]),
          borderColor: data.map((_, index) => coloresEmpleadores[index % coloresEmpleadores.length]),
          borderWidth: 1
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: true,
            text: 'Distribución por Nivel de Educación'
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


  private renderSalarioChart() {
    if (!this.metricasAvanzadas?.estadisticasSalariales) return;

    const canvas = document.getElementById('salarioChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['salario']) {
      this.charts['salario'].destroy();
    }

    const data = this.metricasAvanzadas.estadisticasSalariales;

    this.charts['salario'] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(item => item.rango),
        datasets: [{
          data: data.map(item => item.cantidad),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6B6B'
          ]
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: true,
            text: 'Distribución de Rangos Salariales'
          }
        }
      }
    });
  }


  private renderAreasInteresChart() {
    if (!this.metricasAvanzadas?.distribucionAreas) return;

    const canvas = document.getElementById('areasInteresChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['areasInteres']) {
      this.charts['areasInteres'].destroy();
    }

    // Ordenar por cantidad y tomar los top 10
    const data = this.metricasAvanzadas.distribucionAreas
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // Paleta de colores del gráfico "Top Empleadores"
    const coloresEmpleadores = [
      '#ff6b35',  // Naranja vibrante
      '#f7931e',  // Naranja dorado
      '#0077b5',  // Azul LinkedIn
      '#00a0b0',  // Azul turquesa
      '#7b68ee',  // Púrpura medio
      '#ff69b4',  // Rosa vibrante
      '#32cd32',  // Verde lima
      '#ffa500',  // Naranja estándar
      '#ff1493',  // Rosa profundo
      '#4169e1',  // Azul real
      '#ff4500',  // Rojo naranja
      '#9370db',  // Púrpura medio violeta
      '#00ced1',  // Turquesa oscuro
      '#ff6347',  // Tomate
      '#20b2aa'   // Turquesa claro
    ];

    this.charts['areasInteres'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => item.area),
        datasets: [{
          label: 'Profesionales Interesados',
          data: data.map(item => item.cantidad),
          backgroundColor: data.map((_, index) => coloresEmpleadores[index % coloresEmpleadores.length]),
          borderColor: data.map((_, index) => coloresEmpleadores[index % coloresEmpleadores.length]),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y', // Barras horizontales
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Ocultar leyenda para look más limpio
          },
          title: {
            display: true,
            text: 'Áreas de Interés Profesional',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#374151'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const total = data.reduce((sum, item) => sum + item.cantidad, 0);
                const percentage = total > 0 ? Math.round((context.parsed.x / total) * 100) : 0;
                return [
                  `Profesionales: ${context.parsed.x}`,
                  `Porcentaje: ${percentage}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de Profesionales',
              font: {
                size: 12,
                weight: 'bold'
              },
              color: '#6b7280'
            },
            ticks: {
              stepSize: 1,
              font: {
                size: 11
              },
              color: '#6b7280'
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Áreas de Interés',
              font: {
                size: 12,
                weight: 'bold'
              },
              color: '#6b7280'
            },
            ticks: {
              font: {
                size: 10
              },
              color: '#374151',
              maxRotation: 0,
              callback: function(value, index) {
                const label = data[index]?.area || '';
                // Truncar etiquetas largas en móvil
                if (window.innerWidth < 768 && label.length > 20) {
                  return label.substring(0, 17) + '...';
                }
                return label;
              }
            },
            grid: {
              display: false
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        }
      }
    });
  }

  private renderTiposEmpleoChart() {
    if (!this.metricasAvanzadas?.tiposEmpleo) return;

    const canvas = document.getElementById('tiposEmpleoChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['tiposEmpleo']) {
      this.charts['tiposEmpleo'].destroy();
    }

    const data = this.metricasAvanzadas.tiposEmpleo;

    this.charts['tiposEmpleo'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(item => item.tipo),
        datasets: [{
          data: data.map(item => item.cantidad),
          backgroundColor: [
            '#FF9F40', '#FF6384', '#36A2EB', '#4BC0C0', '#9966FF'
          ]
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: true,
            text: 'Tipos de Empleo Actual'
          }
        }
      }
    });
  }

  private renderTipoEmpleoVsSatisfaccionChart() {
    const canvas = document.getElementById('tipoEmpleoVsSatisfaccionChart') as HTMLCanvasElement;
    if (!canvas || !this.tipoEmpleoVsSatisfaccion.length) return;

    if (this.charts['tipoEmpleoVsSatisfaccion']) {
      this.charts['tipoEmpleoVsSatisfaccion'].destroy();
    }

    // Paleta de colores para cada tipo de empleo
    const coloresTipoEmpleo = [
      '#10B981', // Verde - Tiempo completo
      '#3B82F6', // Azul - Part-time
      '#F59E0B', // Ámbar - Freelance
      '#EF4444', // Rojo - Desempleado
      '#8B5CF6', // Púrpura - Estudiante
      '#6B7280'  // Gris - Otro
    ];

    this.charts['tipoEmpleoVsSatisfaccion'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.tipoEmpleoVsSatisfaccion.map(t => t.tipoEmpleo),
        datasets: [{
          label: 'Satisfacción Promedio',
          data: this.tipoEmpleoVsSatisfaccion.map(t => t.satisfaccionPromedio),
          backgroundColor: this.tipoEmpleoVsSatisfaccion.map((_, index) =>
            coloresTipoEmpleo[index % coloresTipoEmpleo.length]
          ),
          borderColor: this.tipoEmpleoVsSatisfaccion.map((_, index) =>
            coloresTipoEmpleo[index % coloresTipoEmpleo.length]
          ),
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: this.tipoEmpleoVsSatisfaccion.map((_, index) => {
            // Versiones más intensas para hover
            const hoverColors = [
              '#059669', // Verde más intenso
              '#2563EB', // Azul más intenso
              '#D97706', // Ámbar más intenso
              '#DC2626', // Rojo más intenso
              '#7C3AED', // Púrpura más intenso
              '#4B5563'  // Gris más intenso
            ];
            return hoverColors[index % hoverColors.length];
          }),
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Ocultar leyenda ya que cada barra tiene su propio color
          },
          title: {
            display: true,
            text: 'Satisfacción Laboral por Tipo de Empleo',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const item = this.tipoEmpleoVsSatisfaccion[context.dataIndex];
                const fullStars = '★'.repeat(Math.floor(item.satisfaccionPromedio));
                const emptyStars = '☆'.repeat(5 - Math.floor(item.satisfaccionPromedio));
                return [
                  `Satisfacción: ${fullStars}${emptyStars} (${item.satisfaccionPromedio}/5)`,
                  `Profesionales: ${item.cantidad}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            max: 5,
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value} ★`,
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            title: {
              display: true,
              text: 'Nivel de Satisfacción',
              font: {
                size: 12,
                weight: 'bold',
                family: 'Inter, sans-serif'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              maxRotation: 45,
              minRotation: 0
            },
            title: {
              display: true,
              text: 'Tipo de Empleo',
              font: {
                size: 12,
                weight: 'bold',
                family: 'Inter, sans-serif'
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  loadNuevosGraficos() {
    // 1. Tecnologías vs Salario
    this.dashboardService.obtenerTecnologiasVsSalario()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.tecnologiasVsSalario) {
            this.tecnologiasVsSalario = response.tecnologiasVsSalario;
            setTimeout(() => this.renderTecnologiasVsSalarioChart(), 200);
          }
        },
        error: (error) => console.error('Error cargando tecnologías vs salario:', error)
      });

    // 2. Salario vs Educación
    this.dashboardService.obtenerSalarioVsEducacion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.salarioVsEducacion) {
            this.salarioVsEducacion = response.salarioVsEducacion;
            setTimeout(() => this.renderSalarioVsEducacionChart(), 200);
          }
        },
        error: (error) => console.error('Error cargando salario vs educación:', error)
      });

    // 3. Tipo Empleo vs Satisfacción
    this.dashboardService.obtenerTipoEmpleoVsSatisfaccion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.tipoEmpleoVsSatisfaccion) {
            this.tipoEmpleoVsSatisfaccion = response.tipoEmpleoVsSatisfaccion;
            setTimeout(() => this.renderTipoEmpleoVsSatisfaccionChart(), 200);
          }
        },
        error: (error) => console.error('Error cargando tipo empleo vs satisfacción:', error)
      });

    // 4. Proyección Tecnologías
    this.dashboardService.obtenerProyeccionDemandaTecnologias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.proyeccion) {
            this.proyeccionTecnologias = response.proyeccion;
            setTimeout(() => this.renderProyeccionTecnologiasChart(), 200);
          }
        },
        error: (error) => console.error('Error cargando proyección tecnologías:', error)
      });

    // 5. Índice Empleabilidad
    this.dashboardService.obtenerIndiceEmpleabilidad()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.indiceEmpleabilidad) {
            this.indiceEmpleabilidad = response.indiceEmpleabilidad;
            setTimeout(() => this.renderIndiceEmpleabilidadChart(), 200);
          }
        },
        error: (error) => console.error('Error cargando índice empleabilidad:', error)
      });
  }

  // Métodos para renderizar los nuevos gráficos
  private renderTecnologiasVsSalarioChart() {
    const canvas = document.getElementById('tecnologiasVsSalarioChart') as HTMLCanvasElement;
    if (!canvas || !this.tecnologiasVsSalario.length) return;

    if (this.charts['tecnologiasVsSalario']) {
      this.charts['tecnologiasVsSalario'].destroy();
    }

    const formatCurrency = (value: number): string => {
      return `$${value.toLocaleString('es-CL').replace(/,/g, '.')}`;
    };

    this.charts['tecnologiasVsSalario'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.tecnologiasVsSalario.map(t => t.tecnologia),
        datasets: [{
          label: 'Salario Promedio',
          data: this.tecnologiasVsSalario.map(t => t.salarioPromedio),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Tecnologías con Mejores Salarios',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const item = this.tecnologiasVsSalario[context.dataIndex];
                return [
                  `Salario: ${formatCurrency(item.salarioPromedio)}`,
                  `Profesionales: ${item.cantidad}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { callback: (value) => formatCurrency(Number(value)) }
          }
        }
      }
    });
  }

  private renderSalarioVsEducacionChart() {
    const canvas = document.getElementById('salarioVsEducacionChart') as HTMLCanvasElement;
    if (!canvas || !this.salarioVsEducacion.length) return;

    if (this.charts['salarioVsEducacion']) {
      this.charts['salarioVsEducacion'].destroy();
    }

    const formatCurrency = (value: number): string => {
      return `$${value.toLocaleString('es-CL').replace(/,/g, '.')}`;
    };

    this.charts['salarioVsEducacion'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.salarioVsEducacion.map(e => e.nivelEducacion),
        datasets: [
          {
            label: 'Salario Promedio',
            data: this.salarioVsEducacion.map(e => e.salarioPromedio),
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Salario Máximo',
            data: this.salarioVsEducacion.map(e => e.salarioMaximo),
            backgroundColor: '#10B981',
            borderColor: '#059669',
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Impacto de la Educación en el Salario',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const item = this.salarioVsEducacion[context.dataIndex];
                return [
                  `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
                  `Profesionales: ${item.cantidad}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            ticks: { callback: (value) => formatCurrency(Number(value)) }
          }
        }
      }
    });
  }

  private renderProyeccionTecnologiasChart() {
    const canvas = document.getElementById('proyeccionTecnologiasChart') as HTMLCanvasElement;
    if (!canvas || !this.proyeccionTecnologias) return;

    if (this.charts['proyeccionTecnologias']) {
      this.charts['proyeccionTecnologias'].destroy();
    }

    const { historico, proyeccion, top5Tecnologias } = this.proyeccionTecnologias;
    const labels = [...historico.map(h => h.mes), ...proyeccion.map(p => p.mes)];

    const datasets = top5Tecnologias.map((tech, index) => {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const data = historico.map(h => h.tecnologias[tech] || 0);

      // Proyección simple (promedio de últimos 3 meses)
      const ultimos3 = data.slice(-3);
      const promedio = ultimos3.reduce((sum, val) => sum + val, 0) / 3;
      proyeccion.forEach(() => data.push(promedio));

      return {
        label: tech,
        data: data,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        borderWidth: 2,
        tension: 0.4,
        segment: {
          borderDash: (ctx: any) => ctx.p1DataIndex >= historico.length ? [5, 5] : undefined
        }
      };
    });

    this.charts['proyeccionTecnologias'] = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Proyección de Demanda de Tecnologías',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3B82F6',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: function(tooltipItems) {
                const index = tooltipItems[0].dataIndex;
                const isProyeccion = index >= historico.length;
                return `${tooltipItems[0].label}${isProyeccion ? ' (Proyección)' : ''}`;
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y} selecciones`;
              },
              afterLabel: function(context) {
                const index = context.dataIndex;
                if (index >= historico.length) {
                  return 'Dato proyectado';
                }
                return '';
              }
            }
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Número de Selecciones',
              font: {
                size: 12,
                weight: 'bold',
                family: 'Inter, sans-serif'
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private renderIndiceEmpleabilidadChart() {
    const canvas = document.getElementById('indiceEmpleabilidadChart') as HTMLCanvasElement;
    if (!canvas || !this.indiceEmpleabilidad) return;

    if (this.charts['indiceEmpleabilidad']) {
      this.charts['indiceEmpleabilidad'].destroy();
    }

    const { distribucion } = this.indiceEmpleabilidad;

    this.charts['indiceEmpleabilidad'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: distribucion.map(d => d.rango),
        datasets: [{
          data: distribucion.map(d => d.cantidad),
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Índice de Empleabilidad del Mercado',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  }
}
