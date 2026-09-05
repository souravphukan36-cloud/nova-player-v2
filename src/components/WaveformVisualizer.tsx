import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { usePlayer } from '../context/PlayerContext';

interface WaveformVisualizerProps {
  className?: string;
  barsCount?: number;
  mode?: 'bars' | 'wave' | 'mirror';
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ 
  className = 'w-full h-16', 
  barsCount = 32,
  mode = 'mirror'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying, settings } = usePlayer();

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getVisualizerData();
      const waveData = audioEngine.getWaveformData();

      const accent = settings.accentColor || '#7C6EFF';

      if (mode === 'mirror' || mode === 'bars') {
        const barWidth = width / barsCount;
        const halfHeight = height / 2;

        for (let i = 0; i < barsCount; i++) {
          const dataIndex = Math.floor((i / barsCount) * (freqData.length * 0.7));
          // If playing, use actual frequency, else slight gentle resting breathing effect
          let value = isPlaying ? freqData[dataIndex] / 255 : Math.sin(Date.now() * 0.003 + i * 0.2) * 0.08 + 0.1;
          value = Math.max(0.04, value);

          const barHeight = value * (mode === 'mirror' ? halfHeight * 0.95 : height * 0.9);
          const x = i * barWidth;

          // Gradient fill
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, accent);
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, accent);

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (mode === 'mirror') {
            const yTop = halfHeight - barHeight;
            const yBottom = halfHeight + barHeight;
            ctx.roundRect(x + 1.5, yTop, Math.max(2, barWidth - 3), barHeight * 2, [3]);
          } else {
            const y = height - barHeight;
            ctx.roundRect(x + 1.5, y, Math.max(2, barWidth - 3), barHeight, [3, 3, 0, 0]);
          }
          ctx.fill();
        }
      } else {
        // Waveform oscilloscope line
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, settings.accentColor, barsCount, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      width={360} 
      height={80} 
      className={`rounded-lg ${className}`} 
    />
  );
};
