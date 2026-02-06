interface MiniBarChartProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  color?: string
  label?: string
  gap?: number
}

export function MiniBarChart({ 
  data, 
  width = 120, 
  height = 32, 
  className = '',
  color = 'currentColor',
  label = 'Gráfico de barras',
  gap = 2
}: MiniBarChartProps) {
  if (data.length === 0) {
    return (
      <svg 
        width={width} 
        height={height} 
        className={className}
        role="img"
        aria-label={label}
      >
        <line 
          x1={0} 
          y1={height - 2} 
          x2={width} 
          y2={height - 2} 
          stroke="currentColor" 
          strokeOpacity={0.2}
        />
      </svg>
    )
  }

  const max = Math.max(...data, 1)
  const barWidth = (width - gap * (data.length - 1)) / data.length
  const padding = 2

  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      role="img"
      aria-label={`${label}: máximo de ${max}`}
    >
      <title>{label}</title>
      {data.map((value, index) => {
        const barHeight = Math.max(2, ((value / max) * (height - padding * 2)))
        const x = index * (barWidth + gap)
        const y = height - padding - barHeight
        
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            opacity={value === 0 ? 0.15 : 0.7}
            rx={1}
          />
        )
      })}
    </svg>
  )
}
