"use client";

export function RevenueChart() {
  // Mock data - substituir por dados reais de gráfico
  const data = [
    { mes: "Jan", valor: 7200 },
    { mes: "Fev", valor: 7800 },
    { mes: "Mar", valor: 8200 },
    { mes: "Abr", valor: 8450 },
  ];

  const maxValue = Math.max(...data.map((d) => d.valor));

  return (
    <div className="h-64 flex items-end justify-between gap-4">
      {data.map((item, index) => {
        const height = (item.valor / maxValue) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center justify-end h-full">
              <div
                className="w-full bg-black rounded-t transition-all hover:bg-gray-800"
                style={{ height: `${height}%` }}
                title={`R$ ${item.valor.toLocaleString("pt-BR")}`}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">{item.mes}</div>
            <div className="text-xs font-semibold">
              R$ {(item.valor / 1000).toFixed(1)}k
            </div>
          </div>
        );
      })}
    </div>
  );
}
