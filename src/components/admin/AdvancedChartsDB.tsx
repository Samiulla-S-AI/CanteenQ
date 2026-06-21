import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BusinessInsights, CircularGauge, PeakHoursHeatmap } from './BusinessInsights';

interface MonthlyMetric {
    id: string;
    year: number;
    month: number;
    total_revenue: number;
    revenue_change_percent: number;
    total_orders: number;
    order_change_percent: number;
    revenue_percentile: number;
    order_percentile: number;
    is_revenue_peak: boolean;
    is_order_peak: boolean;
    completed_orders: number;
    commission_revenue?: number;
}

interface AdvancedChartsDBProps {
    canteenId?: string;
    isMasterAdmin?: boolean;
    monthsToShow?: number;
    peakHour?: string;
    hourlyOrders?: Record<number, number>;
}

const AdvancedChartsDB: React.FC<AdvancedChartsDBProps> = ({
    canteenId,
    isMasterAdmin = false,
    monthsToShow = 6,
    peakHour = '12 PM - 1 PM',
    hourlyOrders = {}
}) => {
    const [metrics, setMetrics] = useState<MonthlyMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = async () => {
        console.log('🔍 Fetching analytics...', { canteenId, isMasterAdmin });
        setLoading(true);
        setError(null);

        try {
            if (isMasterAdmin) {
                console.log('📊 Calculating MASTER ADMIN metrics from ALL orders with commission');

                // Fetch ALL orders across all canteens for master admin
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (ordersError) {
                    console.error('❌ Orders fetch error:', ordersError);
                    throw ordersError;
                }

                console.log(`✅ Fetched ${orders?.length || 0} total orders for master admin`);

                // Calculate monthly metrics from orders with commission rate
                const monthlyData = new Map<string, any>();
                const commissionRate = 1; // 1% commission + extra fees

                orders?.forEach(order => {
                    const orderTime = order.timestamp || order.created_at || new Date();
                    const date = new Date(orderTime);

                    if (isNaN(date.getTime())) {
                        console.warn('Invalid date for order:', order.id);
                        return;
                    }

                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const key = `${year}-${month}`;

                    if (!monthlyData.has(key)) {
                        monthlyData.set(key, {
                            year,
                            month,
                            total_orders: 0,
                            total_revenue: 0, // This will be commission revenue
                            actual_revenue: 0, // Track actual order amounts too
                            completed_orders: 0
                        });
                    }

                    const metrics = monthlyData.get(key);
                    metrics.total_orders++;

                    // Calculate commission revenue (4% of order amount)
                    const orderAmount = order.total_amount || 0;
                    metrics.total_revenue += (orderAmount * (commissionRate / 100));
                    metrics.actual_revenue += orderAmount;

                    if (order.status === 'Completed') {
                        metrics.completed_orders++;
                    }
                });

                // Convert to array and sort
                let metricsArray = Array.from(monthlyData.values())
                    .sort((a, b) => {
                        if (a.year !== b.year) return b.year - a.year;
                        return b.month - a.month;
                    })
                    .slice(0, monthsToShow)
                    .reverse();

                // Calculate change percentages and identify peaks
                metricsArray = metricsArray.map((metric, index) => {
                    let revenue_change_percent = 0;
                    let order_change_percent = 0;

                    if (index > 0) {
                        const prevMetric = metricsArray[index - 1];
                        revenue_change_percent = prevMetric.total_revenue > 0
                            ? ((metric.total_revenue - prevMetric.total_revenue) / prevMetric.total_revenue) * 100
                            : 0;
                        order_change_percent = prevMetric.total_orders > 0
                            ? ((metric.total_orders - prevMetric.total_orders) / prevMetric.total_orders) * 100
                            : 0;
                    }

                    return {
                        ...metric,
                        revenue_change_percent,
                        order_change_percent,
                        is_revenue_peak: false,
                        is_order_peak: false,
                        revenue_percentile: 50,
                        order_percentile: 50
                    };
                });

                // Identify peaks
                const maxRevenue = Math.max(...metricsArray.map(m => m.total_revenue));
                const maxOrders = Math.max(...metricsArray.map(m => m.total_orders));

                metricsArray = metricsArray.map(m => ({
                    ...m,
                    is_revenue_peak: m.total_revenue === maxRevenue && maxRevenue > 0,
                    is_order_peak: m.total_orders === maxOrders && maxOrders > 0
                }));

                console.log(`📊 Calculated ${metricsArray.length} months of master admin metrics`);
                console.log(`💰 Total commission revenue: ₹${metricsArray.reduce((sum, m) => sum + m.total_revenue, 0).toFixed(2)}`);
                setMetrics(metricsArray);


            } else if (canteenId) {
                console.log('🏪 Calculating LIVE metrics from orders for:', canteenId);

                // Fetch all orders for this canteen
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('canteen_id', canteenId)
                    .order('created_at', { ascending: false }); // Changed from 'timestamp' to 'created_at'

                if (ordersError) {
                    console.error('❌ Orders fetch error:', ordersError);
                    throw ordersError;
                }

                console.log(`✅ Fetched ${orders?.length || 0} orders for canteen`);

                // Calculate monthly metrics from orders in real-time
                const monthlyData = new Map<string, any>();

                orders?.forEach(order => {
                    // Safe timestamp handling - check both timestamp and created_at
                    const orderTime = order.timestamp || order.created_at || new Date();
                    const date = new Date(orderTime);

                    // Validate date
                    if (isNaN(date.getTime())) {
                        console.warn('Invalid date for order:', order.id);
                        return;
                    }

                    const year = date.getFullYear();
                    const month = date.getMonth() + 1; // 1-12
                    const key = `${year}-${month}`;

                    if (!monthlyData.has(key)) {
                        monthlyData.set(key, {
                            year,
                            month,
                            total_orders: 0,
                            total_revenue: 0,
                            completed_orders: 0
                        });
                    }

                    const metrics = monthlyData.get(key);
                    metrics.total_orders++;
                    metrics.total_revenue += order.total_amount || 0;
                    if (order.status === 'Completed') {
                        metrics.completed_orders++;
                    }
                });

                // Convert to array and sort by date (most recent first)
                let metricsArray = Array.from(monthlyData.values())
                    .sort((a, b) => {
                        if (a.year !== b.year) return b.year - a.year;
                        return b.month - a.month;
                    })
                    .slice(0, monthsToShow) // Limit to requested months
                    .reverse(); // Reverse for chart display (oldest to newest)

                // Calculate change percentages and identify peaks
                metricsArray = metricsArray.map((metric, index) => {
                    let revenue_change_percent = 0;
                    let order_change_percent = 0;

                    if (index > 0) {
                        const prevMetric = metricsArray[index - 1];
                        revenue_change_percent = prevMetric.total_revenue > 0
                            ? ((metric.total_revenue - prevMetric.total_revenue) / prevMetric.total_revenue) * 100
                            : 0;
                        order_change_percent = prevMetric.total_orders > 0
                            ? ((metric.total_orders - prevMetric.total_orders) / prevMetric.total_orders) * 100
                            : 0;
                    }

                    return {
                        ...metric,
                        revenue_change_percent,
                        order_change_percent,
                        is_revenue_peak: false, // Will be set below
                        is_order_peak: false, // Will be set below
                        revenue_percentile: 50,
                        order_percentile: 50
                    };
                });

                // Identify peaks
                const maxRevenue = Math.max(...metricsArray.map(m => m.total_revenue));
                const maxOrders = Math.max(...metricsArray.map(m => m.total_orders));

                metricsArray = metricsArray.map(m => ({
                    ...m,
                    is_revenue_peak: m.total_revenue === maxRevenue && maxRevenue > 0,
                    is_order_peak: m.total_orders === maxOrders && maxOrders > 0
                }));

                console.log(`📊 Calculated ${metricsArray.length} months of metrics from orders`);
                setMetrics(metricsArray);


            } else {
                console.warn('⚠️ No canteenId and not masterAdmin - cannot fetch data');
                setError('No canteen specified');
            }
        } catch (err: any) {
            console.error('💥 Error fetching metrics:', err);
            setError(err.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔄 Component mounted/updated', { canteenId, isMasterAdmin });
        fetchMetrics();

        // Listen to orders table for live analytics updates
        const subscription = supabase
            .channel('analytics-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders', // Changed from metrics tables to orders
                    filter: canteenId ? `canteen_id=eq.${canteenId}` : undefined
                },
                () => {
                    console.log('🔔 Orders changed, recalculating analytics...');
                    fetchMetrics(); // Recalculate from orders
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [canteenId, isMasterAdmin, monthsToShow]);

    const latestMetric = metrics[metrics.length - 1];
    const revenueChange = latestMetric?.revenue_change_percent || 0;
    const ordersChange = latestMetric?.order_change_percent || 0;

    const getMonthLabel = (year: number, month: number) => {
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short' });
    };

    const maxRevenue = Math.max(...metrics.map(m => m.total_revenue), 1);
    const maxOrders = Math.max(...metrics.map(m => m.total_orders), 1);

    const LineChart = ({
        data,
        type
    }: {
        data: MonthlyMetric[],
        type: 'revenue' | 'orders'
    }) => {
        // Safety check: Don't render if no data
        if (!data || data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>No data available for chart</p>
                    </div>
                </div>
            );
        }

        const chartWidth = 700;
        const chartHeight = 300;
        const padding = { top: 40, right: 40, bottom: 50, left: 60 };
        const innerWidth = chartWidth - padding.left - padding.right;
        const innerHeight = chartHeight - padding.top - padding.bottom;

        const maxValue = type === 'revenue' ? maxRevenue : maxOrders;
        const getValue = (d: MonthlyMetric) => type === 'revenue' ? d.total_revenue : d.total_orders;
        const getChangePercent = (d: MonthlyMetric) => type === 'revenue' ? d.revenue_change_percent : d.order_change_percent;
        const isPeak = (d: MonthlyMetric) => type === 'revenue' ? d.is_revenue_peak : d.is_order_peak;

        // Safety check for division
        const xScale = (index: number) => {
            const divisor = Math.max(data.length - 1, 1);
            return padding.left + (index / divisor) * innerWidth;
        };

        const yScale = (value: number) => {
            if (maxValue === 0) return padding.top + innerHeight;
            return padding.top + innerHeight - (value / maxValue) * innerHeight;
        };

        const linePath = data.map((d, i) => {
            const x = xScale(i);
            const y = yScale(getValue(d));
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(' ');

        const areaPath = `${linePath} L ${xScale(data.length - 1)} ${padding.top + innerHeight} L ${xScale(0)} ${padding.top + innerHeight} Z`;

        const yTicks = 5;
        const yTickValues = Array.from({ length: yTicks }, (_, i) => (maxValue / (yTicks - 1)) * i);

        const gridColor = type === 'revenue' ? '#d1fae5' : '#dbeafe';
        const lineColor = type === 'revenue' ? '#10b981' : '#3b82f6';
        const gradientId = `gradient-${type}`;

        return (
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {yTickValues.map((tick, i) => (
                    <line
                        key={i}
                        x1={padding.left}
                        y1={yScale(tick)}
                        x2={chartWidth - padding.right}
                        y2={yScale(tick)}
                        stroke={gridColor}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={padding.top + innerHeight}
                    stroke="#9ca3af"
                    strokeWidth="2"
                />

                <line
                    x1={padding.left}
                    y1={padding.top + innerHeight}
                    x2={chartWidth - padding.right}
                    y2={padding.top + innerHeight}
                    stroke="#9ca3af"
                    strokeWidth="2"
                />

                {yTickValues.map((tick, i) => (
                    <text
                        key={i}
                        x={padding.left - 10}
                        y={yScale(tick)}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="text-xs fill-gray-600"
                    >
                        {type === 'revenue' ? `₹${tick.toFixed(0)}` : tick.toFixed(0)}
                    </text>
                ))}

                <path
                    d={areaPath}
                    fill={`url(#${gradientId})`}
                />

                <path
                    d={linePath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                />

                {data.map((d, i) => {
                    const x = xScale(i);
                    const y = yScale(getValue(d));
                    const value = getValue(d);
                    const change = getChangePercent(d);
                    const peak = isPeak(d);

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r={peak ? 8 : 6}
                                fill="white"
                                stroke={lineColor}
                                strokeWidth={peak ? 4 : 3}
                                className="cursor-pointer hover:r-8 transition-all"
                            >
                                <title>
                                    {getMonthLabel(d.year, d.month)}: {type === 'revenue' ? `₹${value.toFixed(0)}` : `${value} orders`}
                                    {'\n'}Change: {change.toFixed(1)}%
                                </title>
                            </circle>

                            {peak && (
                                <text
                                    x={x}
                                    y={y - 20}
                                    textAnchor="middle"
                                    className="text-xl"
                                >
                                    🏆
                                </text>
                            )}

                            {i > 0 && (
                                <g>
                                    <rect
                                        x={x - 30}
                                        y={y - 45}
                                        width="60"
                                        height="20"
                                        rx="10"
                                        fill={change >= 0 ? '#10b981' : '#ef4444'}
                                        className="drop-shadow-md"
                                    />
                                    <text
                                        x={x}
                                        y={y - 32}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-xs font-bold fill-white"
                                    >
                                        {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(0)}%
                                    </text>
                                </g>
                            )}

                            <text
                                x={x}
                                y={padding.top + innerHeight + 20}
                                textAnchor="middle"
                                className="text-sm font-semibold fill-gray-700"
                            >
                                {getMonthLabel(d.year, d.month)}
                            </text>

                            <text
                                x={x}
                                y={padding.top + innerHeight + 40}
                                textAnchor="middle"
                                className="text-xs fill-gray-500"
                            >
                                {type === 'revenue' ? `₹${value.toFixed(0)}` : `${value}`}
                            </text>
                        </g>
                    );
                })}

                <text
                    x={padding.left}
                    y={20}
                    className="text-sm font-semibold fill-gray-700"
                >
                    {type === 'revenue' ? 'Revenue (₹)' : 'Orders Count'}
                </text>
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading analytics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-red-600">⚠️ {error}</p>
                <button
                    onClick={fetchMetrics}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (metrics.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No analytics data available yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                    CanteenID: {canteenId || 'none'} | MasterAdmin: {isMasterAdmin ? 'yes' : 'no'}
                </p>
                <button
                    onClick={fetchMetrics}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Refresh Data
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-xl p-5 border border-green-100 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {isMasterAdmin ? 'Commission Revenue' : 'Revenue Trend'}
                                    </h3>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        ₹{latestMetric?.total_revenue?.toFixed(2) || '0.00'}
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${revenueChange >= 0
                                ? 'bg-green-100 text-green-700 shadow-sm'
                                : 'bg-red-100 text-red-700 shadow-sm'
                                }`}>
                                {revenueChange >= 0 ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                                <span className="text-sm font-bold">{Math.abs(revenueChange).toFixed(1)}%</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            vs previous period
                        </p>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Orders Trend</h3>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                        {latestMetric?.total_orders || 0}
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${ordersChange >= 0
                                ? 'bg-blue-100 text-blue-700 shadow-sm'
                                : 'bg-red-100 text-red-700 shadow-sm'
                                }`}>
                                {ordersChange >= 0 ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                                <span className="text-sm font-bold">{Math.abs(ordersChange).toFixed(1)}%</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center">
                            <Activity className="w-3 h-3 mr-1" />
                            vs previous period
                        </p>
                    </div>
                </div>
            </div>

            {/* Revenue Line Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                Revenue Trend
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">X-Y coordinate visualization</p>
                        </div>
                        <button
                            onClick={fetchMetrics}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw className="w-4 h-4 text-green-600" />
                        </button>
                    </div>
                </div>
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white overflow-x-auto">
                    <LineChart data={metrics} type="revenue" />
                </div>
            </div>

            {/* Orders Line Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                                Orders Trend
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">X-Y coordinate visualization</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white overflow-x-auto">
                    <LineChart data={metrics} type="orders" />
                </div>
            </div>

            {/* Business Insights Section - Mobile Optimized */}
            <div className="mt-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center px-2 md:px-0">
                    <Target className="w-5 h-5 md:w-7 md:h-7 mr-2 md:mr-3 text-purple-600" />
                    Business Intelligence
                </h2>

                <BusinessInsights
                    metrics={{
                        avgOrderValue: latestMetric?.total_revenue / (latestMetric?.total_orders || 1) || 0,
                        peakHour: peakHour,
                        conversionRate: (latestMetric?.completed_orders / (latestMetric?.total_orders || 1)) * 100 || 0,
                        customerRetention: 75,
                        avgPrepTime: '12 mins',
                        topCategory: 'Food'
                    }}
                />
            </div>

            {/* Performance Metrics Grid - Side by Side on Mobile */}
            <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {/* Completion Rate Gauge */}
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-3 md:mb-6 text-center">
                        Order Completion
                    </h3>
                    <div className="flex justify-center">
                        <CircularGauge
                            value={latestMetric?.completed_orders || 0}
                            max={latestMetric?.total_orders || 100}
                            label="Completed"
                            color="#10b981"
                            size={100}
                        />
                    </div>
                </div>

                {/* Revenue Target Gauge */}
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-3 md:mb-6 text-center">
                        Revenue Target
                    </h3>
                    <div className="flex justify-center">
                        <CircularGauge
                            value={Math.round(latestMetric?.total_revenue || 0)}
                            max={Math.round((latestMetric?.total_revenue || 0) * 1.2)}
                            label="Monthly Goal"
                            color="#3b82f6"
                            size={100}
                        />
                    </div>
                </div>

                {/* Growth Rate Gauge - Full Width on Mobile */}
                <div className="col-span-2 md:col-span-1 bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-3 md:mb-6 text-center">
                        Growth Rate
                    </h3>
                    <div className="flex justify-center">
                        <CircularGauge
                            value={Math.max(0, Math.min(100, Math.round(revenueChange)))}
                            max={100}
                            label="Monthly Growth"
                            color="#f59e0b"
                            size={100}
                        />
                    </div>
                </div>
            </div>



            {/* Peak Hours Heatmap */}
            <div className="mt-6 md:mt-8">
                <PeakHoursHeatmap
                    hourlyData={Array.from({ length: 24 }, (_, hour) => ({
                        hour,
                        count: hourlyOrders[hour] || 0
                    }))}
                />
            </div>
        </div>
    );
};

export default AdvancedChartsDB;
