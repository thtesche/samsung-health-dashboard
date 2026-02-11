import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function DataChart({ title, description, data, type = "bar", dataKey, category, yAxisInterval }) {
    if (!data || data.length === 0) return null;

    const getYAxisProps = () => {
        if (!yAxisInterval) return { domain: ['auto', 'auto'] };

        const values = data.map(d => d[dataKey]).filter(v => typeof v === 'number');
        if (values.length === 0) return { domain: ['auto', 'auto'] };

        const dataMin = Math.min(...values);
        const dataMax = Math.max(...values);

        const min = Math.floor(dataMin / yAxisInterval) * yAxisInterval;
        const max = Math.ceil(dataMax / yAxisInterval) * yAxisInterval;

        const ticks = [];
        for (let i = min; i <= max; i += yAxisInterval) {
            ticks.push(i);
        }

        return { domain: [min, max], ticks };
    };

    const yAxisProps = getYAxisProps();

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 5, right: 5, left: 0, bottom: 5 }
        };

        const grid = <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />;
        const xAxis = (
            <XAxis
                dataKey={category}
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
            />
        );
        const yAxis = (
            <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                {...yAxisProps}
            />
        );
        const tooltip = (
            <Tooltip
                contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))'
                }}
                formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    name === 'trend_line' ? 'Trend (Poly 5°)' : title
                ]}
            />
        );

        const trendLine = data.some(d => d.trend_line !== undefined) && (
            <Line
                type="monotone"
                dataKey="trend_line"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="trend_line"
            />
        );

        if (type === "bar") {
            return (
                <BarChart {...commonProps}>
                    {grid}
                    {xAxis}
                    {yAxis}
                    {tooltip}
                    <Bar dataKey={dataKey} fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                    {trendLine}
                </BarChart>
            );
        }

        if (type === "area") {
            return (
                <AreaChart {...commonProps}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {grid}
                    {xAxis}
                    {yAxis}
                    {tooltip}
                    <Area type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                    {trendLine}
                </AreaChart>
            );
        }

        return (
            <LineChart {...commonProps}>
                {grid}
                {xAxis}
                {yAxis}
                {tooltip}
                <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                {trendLine}
            </LineChart>
        );
    };

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
