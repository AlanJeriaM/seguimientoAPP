import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import {
  DashboardService,
  EstadisticasMercado,
  TecnologiaDemandada,
  DistribucionSalarial,
  EmpresaContratante,
  TendenciasMercado,
  PerfilUsuario,
  MetricasAvanzadas,
  DistribucionExperiencia,
  DistribucionEducacion,
  TecnologiaPopular,
  EstadisticasSalariales,
  DistribucionAreas,
  SatisfaccionLaboral
} from '../../../core/services/dashboard/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-linkedin-dashboard',
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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
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



  private renderAllCharts() {
    this.renderDistribucionSalarialChart();
    this.renderEmpresasContratantesChart();
    this.renderTendenciasMercadoChart();
    this.renderEstadisticasGeneralesChart();
  }


  private renderDistribucionSalarialChart() {
    console.log('🎨 Intentando renderizar gráfico de distribución salarial...');
    console.log('📊 Datos disponibles:', this.distribucionSalarial?.length, this.distribucionSalarial);

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

    // Ordenar datos por salario promedio para mejor visualización
    const sortedData = [...this.distribucionSalarial].sort((a, b) => b.salarioPromedio - a.salarioPromedio);

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
              'rgba(52, 73, 94, 0.8)',    // Gris oscuro
              'rgba(26, 188, 156, 0.8)'   // Turquesa
            ],
            borderColor: [
              'rgba(52, 152, 219, 1)',
              'rgba(46, 204, 113, 1)',
              'rgba(155, 89, 182, 1)',
              'rgba(241, 196, 15, 1)',
              'rgba(231, 76, 60, 1)',
              'rgba(230, 126, 34, 1)',
              'rgba(52, 73, 94, 1)',
              'rgba(26, 188, 156, 1)'
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
              text: 'Industrias',
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
                  `Profesionales: ${industryData.cantidad}`
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

    // Tomar las top 8 empresas
    const topEmpresas = this.empresasContratantes.slice(0, 8);

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
            '#32cd32',
            '#ffa500'
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        ...this.chartOptions,
        indexAxis: 'y' as const,
        plugins: {
          ...this.chartOptions.plugins,
          tooltip: {
            ...this.chartOptions.plugins.tooltip,
            callbacks: {
              label: function(context: any) {
                const emp = topEmpresas[context.dataIndex];
                // Función para formatear números con puntos
                const formatCurrency = (value: number): string => {
                  return `$${value.toLocaleString('es-CL').replace(/,/g, '.')}`;
                };
                
                // Función para crear estrellitas
                const formatStars = (rating: number | null): string => {
                  if (rating === null || rating === undefined) return 'Sin datos';
                  const fullStars = '★'.repeat(Math.floor(rating));
                  const hasHalfStar = rating % 1 >= 0.5;
                  const halfStar = hasHalfStar ? '☆' : '';
                  const emptyStars = '☆'.repeat(5 - Math.floor(rating) - (hasHalfStar ? 1 : 0));
                  return `${fullStars}${halfStar}${emptyStars} (${rating}/5)`;
                };
                
                const tooltipLines = [
                  `Empleados: ${emp.totalEmpleados}`,
                  `Salario Promedio: ${formatCurrency(emp.promedioSalario)}`,
                  `Tipo: ${emp.tipoEmpresa}`
                ];
                
                if (emp.satisfaccionPromedio !== null && emp.satisfaccionPromedio !== undefined) {
                  tooltipLines.push(`Satisfacción: ${formatStars(emp.satisfaccionPromedio)}`);
                }
                
                return tooltipLines;
              }
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

    this.charts['estadisticasGenerales'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Profesionales Activos', 'Empresas Únicas', 'Industrias Únicas', 'Nuevos Este Mes'],
        datasets: [{
          data: [
            stats.totalProfesionales,
            stats.empresasUnicas * 10, // Escalar para mejor visualización
            stats.industriasUnicas * 50, // Escalar para mejor visualización
            stats.nuevosProfesionalesEsteMes * 5 // Escalar para mejor visualización
          ],
          backgroundColor: [
            '#0077b5',
            '#00a0b0',
            '#ff6b35',
            '#f7931e'
          ],
          borderWidth: 0
        }]
      },
      options: {
        ...this.chartOptions,
        cutout: '60%',
        plugins: {
          ...this.chartOptions.plugins,
          legend: {
            ...this.chartOptions.plugins.legend,
            position: 'right' as const
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
    const fullStars = '★'.repeat(Math.floor(rating));
    const hasHalfStar = rating % 1 >= 0.5;
    const halfStar = hasHalfStar ? '☆' : '';
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
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500',
            '#FF1493', '#DA70D6', '#9370DB', '#7B68EE', '#6495ED'
          ],
          borderColor: [
            '#B8860B', '#CD853F', '#D2691E', '#DC143C', '#B22222',
            '#C71585', '#BA55D3', '#8A2BE2', '#483D8B', '#4682B4'
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
                  `Satisfacción: ${empresa.satisfaccionPromedio}/5`,
                  `Estrellas: ${stars}`,
                  `Respuestas: ${empresa.totalRespuestas}`
                ];
              }
            }
          }
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

    this.charts['educacion'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => item.nivel),
        datasets: [{
          label: 'Cantidad',
          data: data.map(item => item.cantidad),
          backgroundColor: '#36A2EB',
          borderColor: '#2E8BC0',
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

    const data = this.metricasAvanzadas.distribucionAreas.slice(0, 8); // Top 8

    this.charts['areasInteres'] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: data.map(item => item.area),
        datasets: [{
          label: 'Profesionales',
          data: data.map(item => item.cantidad),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 2
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          title: {
            display: true,
            text: 'Áreas de Interés Profesional'
          }
        },
        scales: {
          r: {
            beginAtZero: true
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
}
