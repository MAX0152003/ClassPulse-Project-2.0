import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js/auto';
import { AttendanceRecord } from '../types';
import { Activity, Award, TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Register standard Chart.js modules just in case
try {
  Chart.register(...registerables);
} catch(e) {
  // Silent fallback if already registered
}

interface AttendanceGraphProps {
  classId: string;
  classCode: string;
  className: string;
  records: AttendanceRecord[];
}

export default function AttendanceGraph({ classId, classCode, className, records }: AttendanceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Filter records for this class
  const classRecords = records
    .filter(r => r.classId === classId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate metrics
  const total = classRecords.length;
  const present = classRecords.filter(r => r.status === 'present').length;
  const late = classRecords.filter(r => r.status === 'late').length;
  const absent = classRecords.filter(r => r.status === 'absent').length;

  const presentPercent = total > 0 ? Math.round((present / total) * 100) : 100;
  const latePercent = total > 0 ? Math.round((late / total) * 100) : 0;
  const absentPercent = total > 0 ? Math.round((absent / total) * 100) : 0;

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart if existing to prevent canvas re-use errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Prepare chronological data
    const labels = classRecords.map(r => {
      // Format YYYY-MM-DD to prettier format (e.g., "May 12")
      try {
        const d = new Date(r.date);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } catch {
        return r.date;
      }
    });

    // If empty classRecords, provide dummy trend points so it looks complete
    const finalLabels = labels.length > 0 ? labels : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    // Convert status to value for trending (Present = 100, Late = 70, Absent = 0)
    const trendValues = classRecords.map(r => {
      if (r.status === 'present') return 100;
      if (r.status === 'late') return 70;
      return 0;
    });
    const finalTrendValues = trendValues.length > 0 ? trendValues : [100, 100, 100, 100];

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Create Gradient fill for Line Chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: finalLabels,
        datasets: [
          {
            label: 'Class Attendance Pulse (%)',
            data: finalTrendValues,
            borderColor: '#10b981',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#09090b',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1c1c1f',
            titleColor: '#f4f4f5',
            bodyColor: '#10b981',
            borderColor: '#27272a',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                if (classRecords[index]) {
                  const r = classRecords[index];
                  return `Status: ${r.status.toUpperCase()} (${r.time})`;
                }
                return 'Active Session Standard: PRESENT';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#a1a1aa',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 9
              }
            }
          },
          y: {
            min: 0,
            max: 110,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#a1a1aa',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 9
              },
              callback: (value) => {
                if (value === 100) return 'Present';
                if (value === 70) return 'Late';
                if (value === 0) return 'Absent';
                return '';
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [classId, classRecords.length]);

  return (
    <div className="space-y-4">
      {/* Tally Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-left">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Present</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">{present}</span>
            <span className="text-xs text-zinc-400 font-mono">({presentPercent}%)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-left">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Late</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">{late}</span>
            <span className="text-xs text-zinc-400 font-mono">({latePercent}%)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-left">
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">{absent}</span>
            <span className="text-xs text-zinc-400 font-mono">({absentPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Graph Box */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850">
        <div className="flex items-center justify-between mb-3 text-left">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Attendance Pulse Rate Trend</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            {total} logs analyzed
          </div>
        </div>

        <div className="h-44 relative">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
