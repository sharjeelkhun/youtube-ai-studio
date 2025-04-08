import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import {
  GridComponent,
  TooltipComponent,
  AxisPointerComponent
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Register ECharts components
echarts.use([
  GridComponent,
  TooltipComponent,
  AxisPointerComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

interface AnalyticsChartProps {
  data: {
    date: string;
    views: number;
    likes: number;
  }[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const date = format(new Date(params[0].axisValue), 'MMM d, yyyy');
        return `
          <div class="font-medium">${date}</div>
          ${params.map((param: any) => `
            <div class="flex items-center gap-2">
              <span style="color: ${param.color}">●</span>
              ${param.seriesName}: ${param.value.toLocaleString()}
            </div>
          `).join('')}
        `;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date),
      axisLabel: {
        formatter: (value: string) => format(new Date(value), 'MMM d')
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => value.toLocaleString()
      }
    },
    series: [
      {
        name: 'Views',
        type: 'line',
        smooth: true,
        data: data.map(item => item.views),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
            ]
          }
        },
        itemStyle: {
          color: '#3b82f6'
        },
        lineStyle: {
          width: 2
        }
      },
      {
        name: 'Likes',
        type: 'line',
        smooth: true,
        data: data.map(item => item.likes),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.01)' }
            ]
          }
        },
        itemStyle: {
          color: '#10b981'
        },
        lineStyle: {
          width: 2
        }
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[400px]"
    >
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        notMerge={true}
        lazyUpdate={true}
        theme="theme_name"
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
      />
    </motion.div>
  );
}
