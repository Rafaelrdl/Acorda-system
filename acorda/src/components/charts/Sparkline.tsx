interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  color?: string
  fillColor?: string
  label?: string
}

export function Sparkline({ 
  data, 
  width = 120, 
  height = 32, 
  className = '',
  color = 'currentColor',
  fillColor,
  label = 'Gráfico de linha'
}: SparklineProps) {
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
          y1={height / 2} 
          x2={width} 
          y2={height / 2} 
          stroke="currentColor" 
          strokeOpacity={0.2}
          strokeDasharray="4 4"
        />
      </svg>
    )
  }

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  
  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return { x, y }
  })

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    return `${acc} L ${point.x} ${point.y}`
  }, '')

  // Área preenchida abaixo da linha
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      role="img"
      aria-label={`${label}: valores de ${min} a ${max}`}
    >
      <title>{label}</title>
      {fillColor && (
        <path 
          d={areaD} 
          fill={fillColor} 
          opacity={0.15}
        />
      )}
      <path 
        d={pathD} 
        fill="none" 
        stroke={color} 
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ponto no último valor */}
      {points.length > 0 && (
        <circle 
          cx={points[points.length - 1].x} 
          cy={points[points.length - 1].y} 
          r={2.5} 
          fill={color}
        />
      )}
    </svg>
  )
}
