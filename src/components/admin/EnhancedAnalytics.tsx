import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, Download, Calendar, DollarSign, Package, Users, PieChart as PieChartIcon, BarChart3, X, Percent } from 'lucide-react';
import AdvancedChartsDB from './AdvancedChartsDB';
import SmartInsights from './SmartInsights';
import { exportAnalyticsReport } from '../../utils/exportUtils';

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
        cartQuantity: number;
    }>;
    canteenId?: string;
}

interface EnhancedAnalyticsProps {
    orders: Order[];
    canteens: Array<{ id: string; name: string }>;
    isMasterAdmin?: boolean;
    commissionRate?: number;
}

const EnhancedAnalytics: React.FC<EnhancedAnalyticsProps> = ({ orders, canteens, isMasterAdmin = false, commissionRate = 1 }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
    const [canteenFilter, setCanteenFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'items'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [modalChart, setModalChart] = useState<'revenue' | 'orders' | 'peak' | 'heatmap' | null>(null);

    // Filtered and sorted orders
    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        // Date filter
        const now = new Date();
        if (dateFilter === 'today') {
            filtered = filtered.filter(order =>
                new Date(order.timestamp).toDateString() === now.toDateString()
            );
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(order => new Date(order.timestamp) >= weekAgo);
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(order => new Date(order.timestamp) >= monthAgo);
        }

        // Canteen filter
        if (canteenFilter !== 'all') {
            filtered = filtered.filter(order => order.canteenId === canteenFilter);
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'date') {
                comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            } else if (sortBy === 'amount') {
                comparison = a.totalAmount - b.totalAmount;
            } else if (sortBy === 'items') {
                comparison = a.items.length - b.items.length;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [orders, searchQuery, dateFilter, canteenFilter, sortBy, sortOrder]);

    // Calculate analytics
    const analytics = useMemo(() => {
        // Calculate revenue based on user role
        const totalRevenue = isMasterAdmin
            ? filteredOrders.reduce((sum, order) => sum + (order.totalAmount * (commissionRate / 100)), 0)
            : filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

        // Status distribution
        const statusCounts = {
            Pending: filteredOrders.filter(o => o.status === 'Pending').length,
            Ready: filteredOrders.filter(o => o.status === 'Ready').length,
            Completed: filteredOrders.filter(o => o.status === 'Completed').length,
        };

        // Food items analysis
        const itemStats: Record<string, { count: number; revenue: number; name: string }> = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemStats[item.id]) {
                    itemStats[item.id] = { count: 0, revenue: 0, name: item.name };
                }
                itemStats[item.id].count += item.cartQuantity;
                itemStats[item.id].revenue += item.price * item.cartQuantity;
            });
        });

        const topItems = Object.entries(itemStats)
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Peak hours analysis - Enhanced with debugging
        const hourlyOrders: Record<number, number> = {};
        console.log('📊 Calculating hourly distribution from', filteredOrders.length, 'orders');

        filteredOrders.forEach((order, index) => {
            // Handle both timestamp and created_at field names
            const orderTime = order.timestamp || (order as any).created_at || (order as any).createdAt;

            if (!orderTime) {
                if (index === 0) console.warn('⚠️ First order has no timestamp field:', Object.keys(order));
                return;
            }

            try {
                const orderDate = new Date(orderTime);
                const hour = orderDate.getHours();

                // Validate hour is valid (0-23)
                if (hour >= 0 && hour <= 23) {
                    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
                } else {
                    console.warn(`⚠️ Invalid hour ${hour} from timestamp:`, orderTime);
                }
            } catch (error) {
                console.error(`❌ Error parsing timestamp:`, orderTime, error);
            }
        });

        console.log('📊 Hourly distribution:', hourlyOrders);
        const topHours = Object.entries(hourlyOrders)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour, count]) => `${hour}:00 (${count} orders)`);
        console.log('📊 Top 3 peak hours:', topHours);

        // Calculate peak hour from hourly data
        const peakHourEntry = Object.entries(hourlyOrders).sort((a, b) => b[1] - a[1])[0];
        let peakHourDisplay = '12 PM - 1 PM'; // default
        if (peakHourEntry) {
            const hour = parseInt(peakHourEntry[0]);
            const displayHour = hour % 12 || 12;
            const ampm = hour < 12 ? 'AM' : 'PM';
            const nextHour = (hour + 1) % 12 || 12;
            const nextAmpm = (hour + 1) < 12 ? 'AM' : 'PM';
            peakHourDisplay = `${displayHour} ${ampm} - ${nextHour} ${nextAmpm}`;
        }

        return {
            totalRevenue,
            avgOrderValue,
            totalOrders: filteredOrders.length,
            statusCounts,
            topItems,
            hourlyOrders,
            peakHour: peakHourDisplay,
        };
    }, [filteredOrders]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setDateFilter('all');
        setCanteenFilter('all');
        setSortBy('date');
        setSortOrder('desc');
    };

    return (
        <div className="space-y-6 pb-20 md:pb-6 max-w-full overflow-x-hidden">
            {/* Filters and Search Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col gap-4">
                    {/* Search */}
                    <div className="w-full">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-[#FC8A14] outline-none"
                            />
                        </div>
                    </div>

                    {/* Filters Row - Horizontal Scroll on Mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

                        {/* Date Filter */}
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-[#FC8A14] outline-none"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>

                        {/* Canteen Filter - Only show for Master Admin */}
                        {isMasterAdmin && canteens.length > 1 && (
                            <div className="flex items-center space-x-2">
                                <Filter className="w-5 h-5 text-gray-500" />
                                <select
                                    value={canteenFilter}
                                    onChange={(e) => setCanteenFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-[#FC8A14] outline-none"
                                >
                                    <option value="all">All Canteens</option>
                                    {canteens.map(canteen => (
                                        <option key={canteen.id} value={canteen.id}>{canteen.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Sort Options */}
                        <div className="flex items-center space-x-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC8A14] focus:border-[#FC8A14] outline-none"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="amount">Sort by Amount</option>
                                <option value="items">Sort by Items</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                        {/* Clear Filters */}
                        {(searchQuery || dateFilter !== 'all' || canteenFilter !== 'all' || sortBy !== 'date') && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Smart Insights */}
            <SmartInsights orders={filteredOrders} dateFilter={dateFilter} />

            {/* Key Metrics - Mobile Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
                            <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-[#FC8A14]" />
                        </div>
                        <TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-green-500" />
                    </div>
                    <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">
                        {isMasterAdmin ? 'Commission Revenue' : 'Total Revenue'}
                    </h3>
                    <p className="text-xl md:text-3xl font-bold text-[#FC8A14] truncate">₹{analytics.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">
                        {isMasterAdmin ? `${commissionRate}% from ${analytics.totalOrders} orders` : `From ${analytics.totalOrders} orders`}
                    </p>
                </div>

                {/* Commission Rate Card - Only for Master Admin */}
                {isMasterAdmin && (
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
                                <Percent className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">Commission Rate</h3>
                        <p className="text-xl md:text-3xl font-bold text-purple-600">{commissionRate}%</p>
                        <p className="text-xs text-gray-500 mt-1 md:mt-2 truncate">
                            Total orders: ₹{filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                        </p>
                    </div>
                )}

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">Avg. Order Value</h3>
                    <p className="text-xl md:text-3xl font-bold text-blue-600 truncate">₹{analytics.avgOrderValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">Per order average</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-green-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                            <Package className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
                    <p className="text-xl md:text-3xl font-bold text-green-600">{analytics.totalOrders}</p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">In selected period</p>
                </div>

                <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
                            <Users className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">Completion Rate</h3>
                    <p className="text-xl md:text-3xl font-bold text-purple-600">
                        {analytics.totalOrders > 0
                            ? ((analytics.statusCounts.Completed / analytics.totalOrders) * 100).toFixed(1)
                            : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">{analytics.statusCounts.Completed} completed</p>
                </div>
            </div>

            {/* Advanced Trend Charts - Line Chart Visualization */}
            <AdvancedChartsDB
                canteenId={
                    isMasterAdmin
                        ? (canteenFilter !== 'all' ? canteenFilter : undefined)
                        : (canteens[0]?.id || undefined)
                }
                isMasterAdmin={isMasterAdmin && canteenFilter === 'all'}
                monthsToShow={6}
                peakHour={analytics.peakHour}
                hourlyOrders={analytics.hourlyOrders}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution - Improved UI */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 md:p-5 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-gray-800">Order Status Distribution</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {Object.entries(analytics.statusCounts).map(([status, count]) => {
                                const percentage = analytics.totalOrders > 0
                                    ? (count / analytics.totalOrders) * 100
                                    : 0;
                                const colors = {
                                    Pending: { bg: 'bg-yellow-500', text: 'text-yellow-700' },
                                    Ready: { bg: 'bg-blue-500', text: 'text-blue-700' },
                                    Completed: { bg: 'bg-green-500', text: 'text-green-700' },
                                };

                                return (
                                    <div key={status} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center space-x-2 md:space-x-3">
                                                <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${colors[status as keyof typeof colors].bg} group-hover:scale-110 transition-transform duration-200`}></div>
                                                <span className="text-sm md:text-base font-semibold text-gray-700">{status}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 md:space-x-3">
                                                <span className="text-xs md:text-sm text-gray-500 font-medium">{count} orders</span>
                                                <span className={`text-sm md:text-base font-bold ${colors[status as keyof typeof colors].text} min-w-[50px] text-right`}>
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 md:h-4 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${colors[status as keyof typeof colors].bg} transition-all duration-700 ease-out group-hover:opacity-90`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total Summary */}
                        <div className="mt-4 md:mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-600">Total Orders</span>
                                <span className="text-2xl md:text-3xl font-bold text-gray-900">{analytics.totalOrders}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Selling Items - Improved UI */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 md:p-5 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-gray-800">Top Selling Items</h3>
                        </div>
                    </div>
                    <div className="p-4 md:p-6">
                        {analytics.topItems.length > 0 ? (
                            <div className="space-y-2 md:space-y-3">
                                {analytics.topItems.map((item, index) => {
                                    const maxRevenue = Math.max(...analytics.topItems.map(i => i.revenue), 1);
                                    const percentage = (item.revenue / maxRevenue) * 100;

                                    // Medal colors for top 3
                                    const getMedalGradient = () => {
                                        if (index === 0) return 'from-yellow-400 to-yellow-600'; // Gold
                                        if (index === 1) return 'from-gray-300 to-gray-500'; // Silver
                                        if (index === 2) return 'from-orange-400 to-orange-600'; // Bronze
                                        return 'from-blue-400 to-blue-600';
                                    };

                                    return (
                                        <div key={item.id} className="group relative bg-gradient-to-r from-gray-50 to-transparent rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300">
                                            <div className="flex items-center justify-between gap-2 md:gap-3">
                                                {/* Rank Badge */}
                                                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gradient-to-br ${getMedalGradient()} text-white rounded-full text-sm md:text-base font-bold shadow-lg`}>
                                                    {index + 1}
                                                </div>

                                                {/* Item Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm md:text-base font-semibold text-gray-800 truncate">{item.name}</p>
                                                    <p className="text-xs md:text-sm text-gray-500">{item.count} units sold</p>

                                                    {/* Progress Bar */}
                                                    <div className="mt-1 md:mt-2 w-full bg-gray-100 rounded-full h-1.5 md:h-2 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Revenue */}
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-base md:text-lg font-bold text-green-600">₹{item.revenue.toFixed(0)}</p>
                                                    <p className="text-xs text-gray-500">{percentage.toFixed(0)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 md:py-12 text-gray-500">
                                <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm md:text-base">No data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Peak Hours Analysis - Scatter Plot Line Visualization */}
            <div
                id="peak-hours-chart"
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => setModalChart('peak')}
            >
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-4 md:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <div className="p-2 md:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                                <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-xl font-bold text-gray-900">Peak Hours Analysis</h3>
                                <p className="text-xs md:text-sm text-gray-600">24-hour order trend visualization</p>
                            </div>
                        </div>
                        {/* Summary Stats */}
                        <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm">
                            <div className="text-center px-2 md:px-3 py-1 md:py-2 bg-white rounded-lg shadow-sm">
                                <div className="font-bold text-indigo-600">{analytics.totalOrders}</div>
                                <div className="text-gray-500 text-xs">Total</div>
                            </div>
                            <div className="text-center px-2 md:px-3 py-1 md:py-2 bg-white rounded-lg shadow-sm">
                                <div className="font-bold text-purple-600">{analytics.peakHour}</div>
                                <div className="text-gray-500 text-xs">Peak</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white">
                    {/* Scatter Plot Line Chart */}
                    <div className="relative bg-white rounded-xl p-4 md:p-6 shadow-inner border border-gray-100">
                        <svg
                            viewBox="0 0 1200 400"
                            className="w-full h-80 md:h-96"
                            style={{ overflow: 'visible' }}
                        >
                            {/* Grid Lines */}
                            <defs>
                                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.3 }} />
                                    <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.05 }} />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Background grid */}
                            {[0, 1, 2, 3, 4].map(i => {
                                const y = 50 + (i * 75);
                                return (
                                    <g key={`grid-${i}`}>
                                        <line
                                            x1="60"
                                            y1={y}
                                            x2="1180"
                                            y2={y}
                                            stroke="#E5E7EB"
                                            strokeWidth="1"
                                            strokeDasharray="4 4"
                                        />
                                    </g>
                                );
                            })}

                            {/* Calculate data points */}
                            {(() => {
                                const maxCount = Math.max(...Object.values(analytics.hourlyOrders), 1);
                                const points: Array<{ x: number; y: number; count: number; hour: number }> = [];

                                for (let i = 0; i < 24; i++) {
                                    const count = analytics.hourlyOrders[i] || 0;
                                    const x = 60 + (i * (1120 / 23));
                                    const y = 350 - ((count / maxCount) * 300);
                                    points.push({ x, y, count, hour: i });
                                }

                                // Create smooth path
                                const createSmoothPath = () => {
                                    if (points.length === 0) return '';

                                    let path = `M ${points[0].x} ${points[0].y}`;

                                    for (let i = 0; i < points.length - 1; i++) {
                                        const current = points[i];
                                        const next = points[i + 1];
                                        const controlX = (current.x + next.x) / 2;

                                        path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
                                        path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
                                    }

                                    return path;
                                };

                                // Create area path for gradient fill
                                const createAreaPath = () => {
                                    if (points.length === 0) return '';
                                    const linePath = createSmoothPath();
                                    return `${linePath} L ${points[points.length - 1].x} 350 L ${points[0].x} 350 Z`;
                                };

                                return (
                                    <>
                                        {/* Area under curve */}
                                        <path
                                            d={createAreaPath()}
                                            fill="url(#areaGradient)"
                                            opacity="0.5"
                                        />

                                        {/* Main line */}
                                        <path
                                            d={createSmoothPath()}
                                            fill="none"
                                            stroke="url(#lineGradient)"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            filter="url(#glow)"
                                        />

                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" style={{ stopColor: '#6366F1' }} />
                                                <stop offset="50%" style={{ stopColor: '#8B5CF6' }} />
                                                <stop offset="100%" style={{ stopColor: '#EC4899' }} />
                                            </linearGradient>
                                        </defs>

                                        {/* Scatter points */}
                                        {points.map((point, i) => {
                                            const intensity = point.count / maxCount;
                                            const hour = i % 12 || 12;
                                            const ampm = i < 12 ? 'AM' : 'PM';
                                            const timeLabel = `${hour} ${ampm}`;

                                            const getPointColor = () => {
                                                if (intensity >= 0.8) return '#EF4444'; // Red
                                                if (intensity >= 0.6) return '#F97316'; // Orange
                                                if (intensity >= 0.4) return '#EAB308'; // Yellow
                                                if (intensity >= 0.2) return '#10B981'; // Green
                                                if (point.count > 0) return '#3B82F6'; // Blue
                                                return '#9CA3AF'; // Gray
                                            };

                                            return (
                                                <g key={`point-${i}`} className="group cursor-pointer">
                                                    {/* Hover area */}
                                                    <circle
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r="20"
                                                        fill="transparent"
                                                        className="hover:fill-purple-50 transition-all duration-200"
                                                    />

                                                    {/* Outer glow/halo */}
                                                    <circle
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r={intensity >= 0.8 ? '12' : '8'}
                                                        fill={getPointColor()}
                                                        opacity="0.2"
                                                        className="group-hover:opacity-40 transition-all duration-200"
                                                    />

                                                    {/* Main point */}
                                                    <circle
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r={intensity >= 0.8 ? '6' : '5'}
                                                        fill={getPointColor()}
                                                        stroke="white"
                                                        strokeWidth="2"
                                                        className="group-hover:r-8 transition-all duration-200"
                                                    />

                                                    {/* Pulsing effect for peak */}
                                                    {intensity >= 0.8 && (
                                                        <circle
                                                            cx={point.x}
                                                            cy={point.y}
                                                            r="6"
                                                            fill="none"
                                                            stroke={getPointColor()}
                                                            strokeWidth="2"
                                                            opacity="0.6"
                                                        >
                                                            <animate
                                                                attributeName="r"
                                                                from="6"
                                                                to="15"
                                                                dur="2s"
                                                                repeatCount="indefinite"
                                                            />
                                                            <animate
                                                                attributeName="opacity"
                                                                from="0.6"
                                                                to="0"
                                                                dur="2s"
                                                                repeatCount="indefinite"
                                                            />
                                                        </circle>
                                                    )}

                                                    {/* Tooltip on hover */}
                                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                        <rect
                                                            x={point.x - 40}
                                                            y={point.y - 65}
                                                            width="80"
                                                            height="50"
                                                            rx="6"
                                                            fill="#1F2937"
                                                            filter="url(#glow)"
                                                        />
                                                        <text
                                                            x={point.x}
                                                            y={point.y - 45}
                                                            textAnchor="middle"
                                                            fill="white"
                                                            fontSize="11"
                                                            fontWeight="bold"
                                                        >
                                                            {timeLabel}
                                                        </text>
                                                        <text
                                                            x={point.x}
                                                            y={point.y - 30}
                                                            textAnchor="middle"
                                                            fill="#FCD34D"
                                                            fontSize="18"
                                                            fontWeight="bold"
                                                        >
                                                            {point.count}
                                                        </text>
                                                        <text
                                                            x={point.x}
                                                            y={point.y - 18}
                                                            textAnchor="middle"
                                                            fill="#D1D5DB"
                                                            fontSize="9"
                                                        >
                                                            orders
                                                        </text>
                                                    </g>
                                                </g>
                                            );
                                        })}

                                        {/* X-axis labels */}
                                        {points.map((point, i) => {
                                            if (i % 2 !== 0) return null;
                                            const hour = i % 12 || 12;
                                            const ampm = i < 12 ? 'A' : 'P';

                                            return (
                                                <text
                                                    key={`label-${i}`}
                                                    x={point.x}
                                                    y="380"
                                                    textAnchor="middle"
                                                    fill="#6B7280"
                                                    fontSize="11"
                                                    fontWeight="500"
                                                >
                                                    {hour}{ampm}
                                                </text>
                                            );
                                        })}

                                        {/* Y-axis labels */}
                                        {[0, 1, 2, 3, 4].map(i => {
                                            const value = Math.round((maxCount / 4) * (4 - i));
                                            const y = 50 + (i * 75);
                                            return (
                                                <text
                                                    key={`y-label-${i}`}
                                                    x="45"
                                                    y={y + 4}
                                                    textAnchor="end"
                                                    fill="#6B7280"
                                                    fontSize="10"
                                                    fontWeight="500"
                                                >
                                                    {value}
                                                </text>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </svg>
                    </div>

                    {/* Enhanced Legend */}
                    <div className="mt-4 md:mt-6 bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-center flex-wrap gap-3 md:gap-6">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full shadow-sm"></div>
                                <span className="text-xs md:text-sm font-medium text-gray-700">Low (1-20%)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full shadow-sm"></div>
                                <span className="text-xs md:text-sm font-medium text-gray-700">Medium (20-40%)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                                <span className="text-xs md:text-sm font-medium text-gray-700">High (40-60%)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-orange-500 rounded-full shadow-sm"></div>
                                <span className="text-xs md:text-sm font-medium text-gray-700">Very High (60-80%)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full shadow-sm animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-900">🔥 Peak (80-100%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-[#FC8A14] to-[#D7263D] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Analytics Summary</h3>
                        <p className="text-white/90">
                            Showing {filteredOrders.length} orders with {isMasterAdmin ? 'commission' : 'total'} revenue of ₹{analytics.totalRevenue.toFixed(2)}
                        </p>
                    </div>
                    <button
                        onClick={() => exportAnalyticsReport(filteredOrders, dateFilter, isMasterAdmin, commissionRate)}
                        className="flex items-center space-x-2 px-6 py-3 bg-white text-[#FC8A14] rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                    >
                        <Download className="w-5 h-5" />
                        <span className="font-semibold">Export Report</span>
                    </button>
                </div>
            </div>

            {/* Enlarged Visualization Modal */}
            {modalChart && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 md:p-4 animate-fadeIn"
                    onClick={() => setModalChart(null)}
                >
                    <div
                        className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 p-4 md:p-6 flex items-center justify-between rounded-t-2xl">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 md:p-3 bg-white/20 rounded-lg">
                                    <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-2xl font-bold text-white">
                                        {modalChart === 'peak' && 'Peak Hours Analysis'}
                                        {modalChart === 'revenue' && 'Revenue Trend'}
                                        {modalChart === 'orders' && 'Orders Trend'}
                                        {modalChart === 'heatmap' && 'Peak Hours Heatmap'}
                                    </h3>
                                    <p className="text-xs md:text-sm text-white/80">Enlarged view</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModalChart(null)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 md:w-8 md:h-8 text-white" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 md:p-8">
                            {modalChart === 'peak' && (
                                <div className="bg-gradient-to-b from-gray-50 to-white p-4 md:p-6 rounded-xl">
                                    <svg
                                        viewBox="0 0 1200 500"
                                        className="w-full"
                                        style={{ height: 'auto', minHeight: '400px', maxHeight: '600px' }}
                                    >
                                        {/* Grid Lines */}
                                        <defs>
                                            <linearGradient id="modalAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.3 }} />
                                                <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.05 }} />
                                            </linearGradient>
                                            <filter id="modalGlow">
                                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>

                                        {/* Background grid */}
                                        {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                            const y = 50 + (i * 60);
                                            return (
                                                <g key={`modal-grid-${i}`}>
                                                    <line
                                                        x1="60"
                                                        y1={y}
                                                        x2="1180"
                                                        y2={y}
                                                        stroke="#E5E7EB"
                                                        strokeWidth="1"
                                                        strokeDasharray="4 4"
                                                    />
                                                </g>
                                            );
                                        })}

                                        {/* Calculate data points for modal */}
                                        {(() => {
                                            const maxCount = Math.max(...Object.values(analytics.hourlyOrders), 1);
                                            const points: Array<{ x: number; y: number; count: number; hour: number }> = [];

                                            for (let i = 0; i < 24; i++) {
                                                const count = analytics.hourlyOrders[i] || 0;
                                                const x = 60 + (i * (1120 / 23));
                                                const y = 450 - ((count / maxCount) * 380);
                                                points.push({ x, y, count, hour: i });
                                            }

                                            // Create smooth path
                                            const createSmoothPath = () => {
                                                if (points.length === 0) return '';

                                                let path = `M ${points[0].x} ${points[0].y}`;

                                                for (let i = 0; i < points.length - 1; i++) {
                                                    const current = points[i];
                                                    const next = points[i + 1];
                                                    const controlX = (current.x + next.x) / 2;

                                                    path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
                                                    path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
                                                }

                                                return path;
                                            };

                                            // Create area path
                                            const createAreaPath = () => {
                                                if (points.length === 0) return '';
                                                const linePath = createSmoothPath();
                                                return `${linePath} L ${points[points.length - 1].x} 450 L ${points[0].x} 450 Z`;
                                            };

                                            return (
                                                <>
                                                    {/* Area under curve */}
                                                    <path
                                                        d={createAreaPath()}
                                                        fill="url(#modalAreaGradient)"
                                                        opacity="0.5"
                                                    />

                                                    {/* Main line */}
                                                    <path
                                                        d={createSmoothPath()}
                                                        fill="none"
                                                        stroke="url(#modalLineGradient)"
                                                        strokeWidth="4"
                                                        strokeLinecap="round"
                                                        filter="url(#modalGlow)"
                                                    />

                                                    <defs>
                                                        <linearGradient id="modalLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" style={{ stopColor: '#6366F1' }} />
                                                            <stop offset="50%" style={{ stopColor: '#8B5CF6' }} />
                                                            <stop offset="100%" style={{ stopColor: '#EC4899' }} />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* Scatter points */}
                                                    {points.map((point, i) => {
                                                        const intensity = point.count / maxCount;
                                                        const hour = i % 12 || 12;
                                                        const ampm = i < 12 ? 'AM' : 'PM';
                                                        const timeLabel = `${hour} ${ampm}`;

                                                        const getPointColor = () => {
                                                            if (intensity >= 0.8) return '#EF4444';
                                                            if (intensity >= 0.6) return '#F97316';
                                                            if (intensity >= 0.4) return '#EAB308';
                                                            if (intensity >= 0.2) return '#10B981';
                                                            if (point.count > 0) return '#3B82F6';
                                                            return '#9CA3AF';
                                                        };

                                                        return (
                                                            <g key={`modal-point-${i}`} className="group">
                                                                <circle
                                                                    cx={point.x}
                                                                    cy={point.y}
                                                                    r={intensity >= 0.8 ? '14' : '10'}
                                                                    fill={getPointColor()}
                                                                    opacity="0.2"
                                                                    className="group-hover:opacity-40 transition-all"
                                                                />

                                                                <circle
                                                                    cx={point.x}
                                                                    cy={point.y}
                                                                    r={intensity >= 0.8 ? '8' : '6'}
                                                                    fill={getPointColor()}
                                                                    stroke="white"
                                                                    strokeWidth="3"
                                                                    className="transition-all"
                                                                />

                                                                {intensity >= 0.8 && (
                                                                    <circle
                                                                        cx={point.x}
                                                                        cy={point.y}
                                                                        r="8"
                                                                        fill="none"
                                                                        stroke={getPointColor()}
                                                                        strokeWidth="3"
                                                                        opacity="0.6"
                                                                    >
                                                                        <animate
                                                                            attributeName="r"
                                                                            from="8"
                                                                            to="20"
                                                                            dur="2s"
                                                                            repeatCount="indefinite"
                                                                        />
                                                                        <animate
                                                                            attributeName="opacity"
                                                                            from="0.6"
                                                                            to="0"
                                                                            dur="2s"
                                                                            repeatCount="indefinite"
                                                                        />
                                                                    </circle>
                                                                )}

                                                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                    <rect
                                                                        x={point.x - 50}
                                                                        y={point.y - 80}
                                                                        width="100"
                                                                        height="65"
                                                                        rx="8"
                                                                        fill="#1F2937"
                                                                        filter="url(#modalGlow)"
                                                                    />
                                                                    <text
                                                                        x={point.x}
                                                                        y={point.y - 55}
                                                                        textAnchor="middle"
                                                                        fill="white"
                                                                        fontSize="14"
                                                                        fontWeight="bold"
                                                                    >
                                                                        {timeLabel}
                                                                    </text>
                                                                    <text
                                                                        x={point.x}
                                                                        y={point.y - 35}
                                                                        textAnchor="middle"
                                                                        fill="#FCD34D"
                                                                        fontSize="24"
                                                                        fontWeight="bold"
                                                                    >
                                                                        {point.count}
                                                                    </text>
                                                                    <text
                                                                        x={point.x}
                                                                        y={point.y - 20}
                                                                        textAnchor="middle"
                                                                        fill="#D1D5DB"
                                                                        fontSize="12"
                                                                    >
                                                                        orders
                                                                    </text>
                                                                </g>
                                                            </g>
                                                        );
                                                    })}

                                                    {/* X-axis labels */}
                                                    {points.map((point, i) => {
                                                        if (i % 2 !== 0) return null;
                                                        const hour = i % 12 || 12;
                                                        const ampm = i < 12 ? 'A' : 'P';

                                                        return (
                                                            <text
                                                                key={`modal-label-${i}`}
                                                                x={point.x}
                                                                y="480"
                                                                textAnchor="middle"
                                                                fill="#6B7280"
                                                                fontSize="14"
                                                                fontWeight="600"
                                                            >
                                                                {hour}{ampm}
                                                            </text>
                                                        );
                                                    })}

                                                    {/* Y-axis labels */}
                                                    {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                                        const value = Math.round((maxCount / 6) * (6 - i));
                                                        const y = 50 + (i * 60);
                                                        return (
                                                            <text
                                                                key={`modal-y-label-${i}`}
                                                                x="45"
                                                                y={y + 5}
                                                                textAnchor="end"
                                                                fill="#6B7280"
                                                                fontSize="13"
                                                                fontWeight="600"
                                                            >
                                                                {value}
                                                            </text>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </svg>

                                    {/* Legend */}
                                    <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-center flex-wrap gap-4 md:gap-8">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                                                <span className="text-sm font-medium text-gray-700">Low (1-20%)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                                                <span className="text-sm font-medium text-gray-700">Medium (20-40%)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                                                <span className="text-sm font-medium text-gray-700">High (40-60%)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
                                                <span className="text-sm font-medium text-gray-700">Very High (60-80%)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm animate-pulse"></div>
                                                <span className="text-sm font-bold text-gray-900">🔥 Peak (80-100%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedAnalytics;
