"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface MarketForecastProps {
  forecastData: {
    model_accuracy_mape?: number;
    scenarios?: {
      baseline?: number[];
      optimistic?: number[];
      pessimistic?: number[];
    };
  };
}

export function MarketForecast({ forecastData }: MarketForecastProps) {
  // Transform data for the chart
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Default forecast data if none provided
  const defaultScenarios = {
    baseline: [22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0],
    optimistic: [23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0, 28.5],
    pessimistic: [22.0, 22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5],
  };

  const scenarios = forecastData?.scenarios || defaultScenarios;
  const modelAccuracy = forecastData?.model_accuracy_mape || 0.24;

  const chartData = months.map((month, index) => ({
    month,
    baseline: scenarios.baseline?.[index] || defaultScenarios.baseline[index],
    optimistic: scenarios.optimistic?.[index] || defaultScenarios.optimistic[index],
    pessimistic: scenarios.pessimistic?.[index] || defaultScenarios.pessimistic[index],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{`${label} 2025`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: $${entry.value}M`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate growth percentages
  const baselineGrowth = scenarios.baseline
    ? ((scenarios.baseline[scenarios.baseline.length - 1] - scenarios.baseline[0]) /
        scenarios.baseline[0]) *
      100
    : 24;
  const optimisticGrowth = scenarios.optimistic
    ? ((scenarios.optimistic[scenarios.optimistic.length - 1] - scenarios.optimistic[0]) /
        scenarios.optimistic[0]) *
      100
    : 28;
  const pessimisticGrowth = scenarios.pessimistic
    ? ((scenarios.pessimistic[scenarios.pessimistic.length - 1] - scenarios.pessimistic[0]) /
        scenarios.pessimistic[0]) *
      100
    : 20;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5 text-accent" />
            Market Revenue Forecast
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Model Accuracy (MAPE): {(modelAccuracy * 100).toFixed(1)}%
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={value => `$${value}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                <Line
                  type="monotone"
                  dataKey="pessimistic"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Pessimistic"
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Baseline"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="optimistic"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Optimistic"
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-400">Pessimistic Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Q1 2025:</span>
                <span className="text-foreground">${scenarios.pessimistic?.[0] || 22}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Q4 2025:</span>
                <span className="text-foreground">${scenarios.pessimistic?.[11] || 27.5}M</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Growth:</span>
                <span className="text-red-400">+{pessimisticGrowth.toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-400">Baseline Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Q1 2025:</span>
                <span className="text-foreground">${scenarios.baseline?.[0] || 22.5}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Q4 2025:</span>
                <span className="text-foreground">${scenarios.baseline?.[11] || 28}M</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Growth:</span>
                <span className="text-blue-400">+{baselineGrowth.toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-400">
              Optimistic Scenario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Q1 2025:</span>
                <span className="text-foreground">${scenarios.optimistic?.[0] || 23.5}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Q4 2025:</span>
                <span className="text-foreground">${scenarios.optimistic?.[11] || 28.5}M</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Growth:</span>
                <span className="text-green-400">+{optimisticGrowth.toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Forecast Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Key Insights:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  All scenarios show consistent growth throughout 2025, indicating a stable and
                  expanding market for your target audience.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  The baseline scenario projects {baselineGrowth.toFixed(0)}% growth, suggesting
                  strong market fundamentals even under normal conditions.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Model accuracy of {(100 - modelAccuracy * 100).toFixed(1)}% provides high
                  confidence in these projections for strategic planning.
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium text-foreground mb-2">Strategic Implications:</h4>
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                The consistent upward trajectory across all scenarios supports aggressive marketing
                investment, particularly in high-ROAS keywords and brand awareness campaigns to
                capture this growing market demand.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
