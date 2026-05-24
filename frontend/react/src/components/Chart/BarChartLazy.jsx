import { useEffect, useState } from 'react'

// Generic lazy chart loader. Pass `chart` prop as 'Bar' or 'Line'.
export default function BarChartLazy({ chart = 'Bar', data, options, className }) {
  const [Comp, setComp] = useState(null)

  useEffect(() => {
    let mounted = true
    // Dynamically import Chart.js (auto) and react-chartjs-2
    Promise.all([
      import('chart.js/auto'),
      import('react-chartjs-2')
    ]).then(([, reactChart]) => {
      if (!mounted) return
      const C = reactChart[chart]
      setComp(() => C || reactChart.Bar)
    }).catch(() => {})

    return () => { mounted = false }
  }, [chart])

  if (!Comp) return null
  return <Comp data={data} options={options} className={className} />
}
