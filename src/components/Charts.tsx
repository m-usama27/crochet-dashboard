'use client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#fb923c', '#a855f7', '#22c55e', '#facc15', '#ef4444', '#06b6d4'];

export function TrendChart({
  data,
}: {
  data: { month: string; revenue: number; expenditure: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #fed7aa',
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v: number) => v.toLocaleString()}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="revenue" stroke="#fb923c" strokeWidth={2.5} name="Revenue" />
        <Line
          type="monotone"
          dataKey="expenditure"
          stroke="#a855f7"
          strokeWidth={2.5}
          name="Expenditure"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopBarChart({
  data,
  dataKey,
  nameKey,
}: {
  data: { name: string; [k: string]: any }[];
  dataKey: string;
  nameKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
        <XAxis
          dataKey={nameKey}
          stroke="#9ca3af"
          fontSize={11}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #fed7aa',
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Bar dataKey={dataKey} fill="#fb923c" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: { category: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          label={(d: any) => d.category}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #fed7aa',
            borderRadius: 12,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}