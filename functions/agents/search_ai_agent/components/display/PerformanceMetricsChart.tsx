import React from "react";
import { Line } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";
import "chart.js/auto";

interface PerformanceMetricsChartProps {
  metrics: Array<{
    name: string;
    data: number[];
    labels: string[];
  }>;
}

const PerformanceMetricsChart: React.FC<PerformanceMetricsChartProps> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) {
    console.error("No metrics data provided to PerformanceMetricsChart component");
    return <div className="text-red-500">Error: No metrics data provided</div>;
  }

  const chartData: ChartData<"line"> = {
    labels: metrics[0].labels,
    datasets: metrics.map((metric, index) => ({
      label: metric.name,
      data: metric.data,
      fill: false,
      borderColor: getRandomColor(),
      backgroundColor: getRandomColor(),
      tension: 0.1,
    })),
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Agency Performance Metrics",
      },
    },
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default PerformanceMetricsChart;
