import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler
);

interface ChartData {
  type: string;
  title: string;
  labels?: string[];
  data?: number[];
  datasets?: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    yAxisID?: string;
  }>;
  backgroundColor?: string | string[];
  borderColor?: string;
  stages?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  value?: number;
  max?: number;
  thresholds?: Array<{
    value: number;
    color: string;
    label: string;
  }>;
}

interface ChartRendererProps {
  chartData: ChartData;
  width?: number;
  height?: number;
  className?: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ 
  chartData, 
  width = 400, 
  height = 300, 
  className = "" 
}) => {
  // Get CSS custom properties for theming
  const getCSSVar = (varName: string): string => {
    if (typeof window !== 'undefined') {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value ? `hsl(${value})` : '#ffffff';
    }
    return '#ffffff';
  };

  // Theme-aware colors
  const themeColors = {
    foreground: getCSSVar('--foreground'),
    mutedForeground: getCSSVar('--muted-foreground'),
    border: getCSSVar('--border'),
    card: getCSSVar('--card'),
    background: getCSSVar('--background'),
    chart1: getCSSVar('--chart-1'),
    chart2: getCSSVar('--chart-2'), 
    chart3: getCSSVar('--chart-3'),
    chart4: getCSSVar('--chart-4'),
    chart5: getCSSVar('--chart-5')
  };

  const chartColorPalette = [
    themeColors.chart1,
    themeColors.chart2,
    themeColors.chart3,
    themeColors.chart4,
    themeColors.chart5
  ];

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: themeColors.foreground,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: chartData.title,
        color: themeColors.foreground,
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: themeColors.card,
        titleColor: themeColors.foreground,
        bodyColor: themeColors.foreground,
        borderColor: themeColors.border,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 13,
          weight: '600'
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 12
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: themeColors.mutedForeground,
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          padding: 5
        },
        grid: {
          color: themeColors.border + '40', // Add transparency
          lineWidth: 1
        },
        border: {
          color: themeColors.border
        }
      },
      y: {
        ticks: {
          color: themeColors.mutedForeground,
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          padding: 10
        },
        grid: {
          color: themeColors.border + '40', // Add transparency
          lineWidth: 1
        },
        border: {
          color: themeColors.border
        }
      }
    }
  };

  const renderBarChart = () => {
    const data = {
      labels: chartData.labels || [],
      datasets: chartData.datasets || [
        {
          label: chartData.title,
          data: chartData.data || [],
          backgroundColor: chartData.backgroundColor || chartColorPalette.slice(0, chartData.data?.length || 1),
          borderColor: chartData.borderColor || chartColorPalette.slice(0, chartData.data?.length || 1),
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };

    return <Bar data={data} options={defaultOptions as any} />;
  };

  const renderLineChart = () => {
    const data = {
      labels: chartData.labels || [],
      datasets: chartData.datasets ? chartData.datasets.map((dataset, index) => ({
        ...dataset,
        borderColor: dataset.borderColor || chartColorPalette[index],
        backgroundColor: dataset.backgroundColor || (chartColorPalette[index] + '20'),
        tension: 0.4,
        fill: chartData.type === 'area',
        pointBackgroundColor: dataset.borderColor || chartColorPalette[index],
        pointBorderColor: themeColors.background,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      })) : [
        {
          label: chartData.title,
          data: chartData.data || [],
          borderColor: chartColorPalette[0],
          backgroundColor: chartColorPalette[0] + '20',
          tension: 0.4,
          fill: chartData.type === 'area',
          pointBackgroundColor: chartColorPalette[0],
          pointBorderColor: themeColors.background,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };

    const options = {
      ...defaultOptions,
      scales: {
        ...defaultOptions.scales,
        // Handle multiple y-axes for dual-axis charts
        ...(chartData.datasets && chartData.datasets.some(d => d.yAxisID) && {
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            ticks: {
              color: themeColors.mutedForeground,
              font: {
                family: 'Inter, sans-serif',
                size: 11
              }
            },
            grid: {
              drawOnChartArea: false,
            },
            border: {
              color: themeColors.border
            }
          }
        })
      }
    };

    return <Line data={data} options={options as any} />;
  };

  const renderPieChart = () => {
    const data = {
      labels: chartData.labels || [],
      datasets: [
        {
          data: chartData.data || [],
          backgroundColor: chartData.backgroundColor || chartColorPalette,
          borderColor: themeColors.background,
          borderWidth: 3,
          hoverOffset: 4
        }
      ]
    };

    const options = {
      ...defaultOptions,
      scales: undefined, // Remove scales for pie charts
      plugins: {
        ...defaultOptions.plugins,
        legend: {
          ...defaultOptions.plugins.legend,
          position: 'right' as const,
          labels: {
            ...defaultOptions.plugins.legend.labels,
            padding: 15,
            generateLabels: (chart: any) => {
              const datasets = chart.data.datasets;
              if (datasets.length > 0) {
                return chart.data.labels.map((label: string, i: number) => ({
                  text: label,
                  fillStyle: datasets[0].backgroundColor[i],
                  strokeStyle: datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: 'circle',
                  index: i
                }));
              }
              return [];
            }
          }
        }
      }
    };

    return <Pie data={data} options={options as any} />;
  };

  const renderDoughnutChart = () => {
    const data = {
      labels: chartData.labels || [],
      datasets: [
        {
          data: chartData.data || [],
          backgroundColor: chartData.backgroundColor || chartColorPalette,
          borderColor: themeColors.background,
          borderWidth: 3,
          hoverOffset: 6,
          cutout: '60%'
        }
      ]
    };

    const options = {
      ...defaultOptions,
      scales: undefined, // Remove scales for doughnut charts
      plugins: {
        ...defaultOptions.plugins,
        legend: {
          ...defaultOptions.plugins.legend,
          position: 'bottom' as const,
          labels: {
            ...defaultOptions.plugins.legend.labels,
            padding: 20,
            generateLabels: (chart: any) => {
              const datasets = chart.data.datasets;
              if (datasets.length > 0) {
                return chart.data.labels.map((label: string, i: number) => ({
                  text: label,
                  fillStyle: datasets[0].backgroundColor[i],
                  strokeStyle: datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: 'circle',
                  index: i
                }));
              }
              return [];
            }
          }
        }
      }
    };

    return <Doughnut data={data} options={options as any} />;
  };

  const renderFunnelChart = () => {
    const stages = chartData.stages || [];
    const maxValue = Math.max(...stages.map(s => s.value));

    return (
      <div className="w-full p-4">
        <h3 className="text-base font-semibold text-foreground mb-6 text-center">
          {chartData.title}
        </h3>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const percentage = (stage.value / maxValue) * 100;
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-muted-foreground text-right font-medium">
                  {stage.name}
                </div>
                <div className="flex-1 relative">
                  <div 
                    className="h-10 rounded-lg transition-all duration-500 shadow-sm border border-border/20"
                    style={{
                      backgroundColor: stage.color,
                      width: `${percentage}%`,
                      minWidth: '80px'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow-sm">
                    {stage.value.toLocaleString()}
                  </div>
                </div>
                <div className="w-16 text-sm text-muted-foreground font-mono">
                  {((stage.value / stages[0].value) * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGaugeChart = () => {
    const value = chartData.value || 0;
    const max = chartData.max || 5;
    const percentage = (value / max) * 100;
    const thresholds = chartData.thresholds || [];
    
    let gaugeColor = themeColors.chart1;
    let currentLabel = 'Average';
    
    // Determine color based on thresholds
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) {
        gaugeColor = thresholds[i].color;
        currentLabel = thresholds[i].label;
        break;
      }
    }

    return (
      <div className="w-full flex flex-col items-center p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">
          {chartData.title}
        </h3>
        <div className="relative w-56 h-28">
          {/* Gauge Background */}
          <div className="absolute inset-0">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
                className="transition-all duration-1000 ease-out drop-shadow-sm"
              />
            </svg>
          </div>
          {/* Value Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <div className="text-3xl font-bold text-foreground">
              {value.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {currentLabel}
            </div>
          </div>
        </div>
        {/* Threshold Legend */}
        <div className="flex space-x-6 mt-6">
          {thresholds.map((threshold, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full border border-border/20 shadow-sm"
                style={{ backgroundColor: threshold.color }}
              />
              <span className="text-sm text-muted-foreground font-medium">
                {threshold.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (chartData.type?.toLowerCase()) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'doughnut':
        return renderDoughnutChart();
      case 'funnel':
        return renderFunnelChart();
      case 'gauge':
        return renderGaugeChart();
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Unsupported chart type: {chartData.type}</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-lg ${className}`}
      style={{ 
        width, 
        height: chartData.type === 'funnel' || chartData.type === 'gauge' ? 'auto' : height,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}
    >
      {renderChart()}
    </div>
  );
};

export default ChartRenderer;