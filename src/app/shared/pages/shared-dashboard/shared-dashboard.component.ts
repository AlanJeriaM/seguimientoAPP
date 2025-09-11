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
  PerfilUsuario 
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



  private renderAllCharts() {
    this.renderTecnologiasDemandadasChart();
    this.renderDistribucionSalarialChart();
    this.renderEmpresasContratantesChart();
    this.renderTendenciasMercadoChart();
    this.renderEstadisticasGeneralesChart();
  }

  private renderTecnologiasDemandadasChart() {
    const ctx = document.getElementById('tecnologiasDemandadasChart') as HTMLCanvasElement;
    if (!ctx || !this.tecnologiasDemandadas.length) return;

    this.destroyChart('tecnologiasDemandadas');

    // Tomar las top 10 tecnologías
    const topTecnologias = this.tecnologiasDemandadas.slice(0, 10);

    this.charts['tecnologiasDemandadas'] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: topTecnologias.map(t => t.nombre),
        datasets: [{
          label: 'Demanda en el mercado',
          data: topTecnologias.map(t => t.demanda),
          backgroundColor: 'rgba(0, 119, 181, 0.15)',
          borderColor: '#0077b5',
          borderWidth: 3,
          pointBackgroundColor: '#0077b5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        ...this.chartOptions,
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 119, 181, 0.1)'
            },
            pointLabels: {
              font: {
                family: 'Inter, sans-serif',
                size: 12,
                weight: 500
              }
            },
            ticks: {
              display: false
            }
          }
        }
      }
    });
  }

  private renderDistribucionSalarialChart() {
    const ctx = document.getElementById('distribucionSalarialChart') as HTMLCanvasElement;
    if (!ctx || !this.distribucionSalarial.length) return;

    this.destroyChart('distribucionSalarial');

    this.charts['distribucionSalarial'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.distribucionSalarial.map(d => d.industria),
        datasets: [
          {
            label: 'Salario Promedio (CLP)',
            data: this.distribucionSalarial.map(d => d.salarioPromedio),
            backgroundColor: 'rgba(0, 119, 181, 0.8)',
            borderRadius: 6
          },
          {
            label: 'Profesionales',
            data: this.distribucionSalarial.map(d => d.cantidad * 100000), // Escalar para visualización
            backgroundColor: 'rgba(255, 107, 53, 0.8)',
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0
                }).format(Number(value));
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: function(value) {
                return Math.round(Number(value) / 100000);
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: this.chartOptions.plugins
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
                return [
                  `Empleados: ${emp.totalEmpleados}`,
                  `Vacantes: ${emp.vacantesAbiertas}`,
                  `Tipo: ${emp.tipoEmpresa}`,
                  `Satisfacción: ${emp.satisfaccionLaboral.toFixed(1)}/5.0`
                ];
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
            yAxisID: 'y'
          },
          {
            label: 'Demanda Laboral (%)',
            data: meses.map(m => m.demandaLaboral),
            borderColor: '#00d084',
            backgroundColor: 'rgba(0, 208, 132, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Satisfacción Promedio',
            data: meses.map(m => m.satisfaccionPromedio * 20), // Escalar para visualización
            borderColor: '#ff6b35',
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left'
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            }
          },
          x: {
            grid: {
              display: false
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

  getTotalProfesionales(): number {
    return this.estadisticasMercado?.totalProfesionales || 0;
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
}
