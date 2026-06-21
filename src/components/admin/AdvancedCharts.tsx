import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface Order {
    id: string;
    orderNumber: string;
    userEmail: string;
    timestamp: string;
    status: 'Pending' | 'Ready' | 'Completed';
    totalAmount: number;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
    }>;
}

interface AdvancedChartsProps {
    orders: Order[];
    dateFilter: 'today' | 'week' | 'month' | 'all';
    isMasterAdmin?: boolean;
    commissionRate?: number; // Percentage (e.g., 10 for 10%)
}

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ orders, dateFilter, isMasterAdmin = false, commissionRate = 1 }) => {
    // Calculate trend data based on date filter
    const trendData = useMemo(() => {
        const now = new Date();
        let periods: { label: string; start: Date; end: Date }[] = [];

        if (dateFilter === 'today') {
            // Hourly data for today
            for (let i = 0; i < 24; i++) {
                const start = new Date(now);
                start.setHours(i, 0, 0, 0);
                const end = new Date(now);
                end.setHours(i, 59, 59, 999);

                const hour = i % 12 || 12;
                const ampm = i < 12 ? 'AM' : 'PM';
                periods.push({
                    label: `${hour} ${ampm}`,
                    start,
                    end
                });
            }
        } else if (dateFilter === 'week') {
            // Daily data for last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);

                periods.push({
                    label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    start,
                    end
                });
            }
        } else if (dateFilter === 'month') {
            // Daily data for last 30 days (grouped by 5 days)
            for (let i = 29; i >= 0; i -= 5) {
                const endDate = new Date(now);
                endDate.setDate(endDate.getDate() - i);
                const startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 4);

                periods.push({
                    label: `${startDate.getDate()}-${endDate.getDate()}`,
                    start: startDate,
                    end: endDate
                });
            }
        } else {
            // Monthly data for all time (last 12 months)
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                const start = new Date(date.getFullYear(), date.getMonth(), 1);
                const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

                periods.push({
                    label: date.toLocaleDateString('en-US', { month: 'short' }),
                    start,
                    end
                });
            }
        }

        // Calculate metrics for each period
        return periods.map(period => {
            const periodOrders = orders.filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate >= period.start && orderDate <= period.end;
            });

            // Calculate revenue based on user role
            const revenue = isMasterAdmin
                ? periodOrders.reduce((sum, order) => sum + (order.totalAmount * (commissionRate / 100)), 0)
                : periodOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            const orderCount = periodOrders.length;
            const completedOrders = periodOrders.filter(o => o.status === 'Completed').length;

            return {
                label: period.label,
                revenue,
                orderCount,
                completedOrders,
            };
        });
    }, [orders, dateFilter]);

    // Calculate max values for scaling
    const maxRevenue = Math.max(...trendData.map(d => d.revenue), 1);
    const maxOrders = Math.max(...trendData.map(d => d.orderCount), 1);

    // Calculate percentage changes
    const revenueChange = useMemo(() => {
        if (trendData.length < 2) return 0;
        const current = trendData[trendData.length - 1].revenue;
        const previous = trendData[trendData.length - 2].revenue;
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }, [trendData]);

    const ordersChange = useMemo(() => {
        if (trendData.length < 2) return 0;
        const current = trendData[trendData.length - 1].orderCount;
        const previous = trendData[trendData.length - 2].orderCount;
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }, [trendData]);

    return (
        <div className="space-y-6">
            {/* Trend Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 shadow-sm border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-600">Revenue Trend</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{trendData[trendData.length - 1]?.revenue.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${revenueChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {revenueChange >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-semibold">{Math.abs(revenueChange).toFixed(1)}%</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Latest period vs previous</p>
                </div>

                {/* Orders Trend */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-600">Orders Trend</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {trendData[trendData.length - 1]?.orderCount || 0}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${ordersChange >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {ordersChange >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-semibold">{Math.abs(ordersChange).toFixed(1)}%</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Latest period vs previous</p>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
                    <p className="text-sm text-gray-500">Track revenue performance over time</p>
                </div>
                <div className="p-6 overflow-x-auto">
                    <div className="flex items-end justify-between space-x-2 h-80" style={{ minWidth: `${Math.max(trendData.length * 60, 600)}px` }}>
                        {trendData.map((data, index) => {
                            const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                            const isLatest = index === trendData.length - 1;

                            return (
                                <div key={index} className="flex flex-col items-center group" style={{ width: `${100 / trendData.length}%`, minWidth: '50px' }}>
                                    {/* Value label */}
                                    <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                            ₹{data.revenue.toFixed(0)}
                                        </span>
                                    </div>

                                    {/* Bar */}
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 relative ${isLatest
                                            ? 'bg-gradient-to-t from-green-600 to-green-400'
                                            : 'bg-gradient-to-t from-green-500 to-green-300'
                                            } hover:from-green-700 hover:to-green-500`}
                                        style={{ height: `${height}%`, minHeight: data.revenue > 0 ? '8px' : '0px' }}
                                    >
                                        {/* Glow effect for latest */}
                                        {isLatest && data.revenue > 0 && (
                                            <div className="absolute inset-0 bg-green-400 opacity-50 blur-sm animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className="text-xs text-gray-500 mt-2 font-medium">{data.label}</span>

                                    {/* Order count */}
                                    <span className="text-xs text-gray-400 mt-1">{data.orderCount} orders</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Orders Count Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Orders Trend</h3>
                    <p className="text-sm text-gray-500">Monitor order volume patterns</p>
                </div>
                <div className="p-6 overflow-x-auto">
                    <div className="flex items-end justify-between space-x-2 h-80" style={{ minWidth: `${Math.max(trendData.length * 60, 600)}px` }}>
                        {trendData.map((data, index) => {
                            const height = maxOrders > 0 ? (data.orderCount / maxOrders) * 100 : 0;
                            const isLatest = index === trendData.length - 1;

                            return (
                                <div key={index} className="flex flex-col items-center group" style={{ width: `${100 / trendData.length}%`, minWidth: '50px' }}>
                                    {/* Value label */}
                                    <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            {data.orderCount} orders
                                        </span>
                                    </div>

                                    {/* Bar */}
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 relative ${isLatest
                                            ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                                            : 'bg-gradient-to-t from-blue-500 to-blue-300'
                                            } hover:from-blue-700 hover:to-blue-500`}
                                        style={{ height: `${height}%`, minHeight: data.orderCount > 0 ? '8px' : '0px' }}
                                    >
                                        {/* Glow effect for latest */}
                                        {isLatest && data.orderCount > 0 && (
                                            <div className="absolute inset-0 bg-blue-400 opacity-50 blur-sm animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className="text-xs text-gray-500 mt-2 font-medium">{data.label}</span>

                                    {/* Completed count */}
                                    <span className="text-xs text-gray-400 mt-1">
                                        {data.completedOrders} completed
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Combined Sales Performance Chart - Last 3 Months */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Sales Performance Overview</h3>
                    <p className="text-sm text-gray-500">Last 3 months performance (including current month)</p>
                </div>
                <div className="p-6">
                    <div className="space-y-6">
                        {(() => {
                            // Get last 3 months data
                            const now = new Date();
                            const last3Months = [];

                            for (let i = 2; i >= 0; i--) {
                                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

                                const monthOrders = orders.filter(order => {
                                    const orderDate = new Date(order.timestamp);
                                    return orderDate >= monthStart && orderDate <= monthEnd;
                                });

                                const revenue = isMasterAdmin
                                    ? monthOrders.reduce((sum, order) => sum + (order.totalAmount * (commissionRate / 100)), 0)
                                    : monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

                                last3Months.push({
                                    label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                                    revenue,
                                    orderCount: monthOrders.length
                                });
                            }

                            const maxRevenue = Math.max(...last3Months.map(d => d.revenue), 1);
                            const maxOrders = Math.max(...last3Months.map(d => d.orderCount), 1);

                            return last3Months.map((data, index) => {
                                const revenueWidth = (data.revenue / maxRevenue) * 100;
                                const ordersWidth = (data.orderCount / maxOrders) * 100;

                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 min-w-[100px]">{data.label}</span>
                                            <div className="flex-1 mx-4 space-y-2">
                                                {/* Revenue bar */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(revenueWidth, 2)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-green-600 min-w-[50px] text-right">
                                                        ₹{data.revenue.toFixed(0)}
                                                    </span>
                                                </div>

                                                {/* Orders bar */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(ordersWidth, 2)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-blue-600 min-w-[50px] text-right">
                                                        {data.orderCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
                            <span className="text-sm text-gray-600">{isMasterAdmin ? 'Commission Revenue' : 'Revenue'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
                            <span className="text-sm text-gray-600">Orders</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedCharts;
