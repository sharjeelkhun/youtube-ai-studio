import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function TopVideosChart({ videos }: { videos: { title: string; views: number }[] }) {
  const data = {
    labels: videos.map((video) => video.title),
    datasets: [
      {
        label: 'Views',
        data: videos.map((video) => video.views),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top Videos by Views',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `Views: ${value.toLocaleString()}`; // Format with commas
          },
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
