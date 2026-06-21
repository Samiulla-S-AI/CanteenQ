import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface Order {
    id: string;
    timestamp: string;
    status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
    totalAmount: number;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        cartQuantity: number;
    }>;
}

interface SmartInsightsProps {
    orders: Order[];
    dateFilter: 'today' | 'week' | 'month' | 'all';
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ orders, dateFilter }) => {
    const insights = useMemo(() => {
        if (orders.length === 0) return [];

        const now = new Date();
        const insights: Array<{
            type: 'success' | 'warning' | 'info' | 'trend';
            icon: any;
            title: string;
            description: string;
            value?: string;
        }> = [];

        // Calculate metrics
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const avgOrderValue = totalRevenue / orders.length;
        const completionRate = (orders.filter(o => o.status === 'Completed').length / orders.length) * 100;

        // Peak hour analysis
        const hourlyOrders: Record<number, number> = {};
        orders.forEach(order => {
            const hour = new Date(order.timestamp).getHours();
            hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
        });
        const peakHour = Object.entries(hourlyOrders).sort((a, b) => b[1] - a[1])[0];
        if (peakHour) {
            const hour = parseInt(peakHour[0]);
            const displayHour = hour % 12 || 12;
            const ampm = hour < 12 ? 'AM' : 'PM';
            insights.push({
                type: 'trend',
                icon: Zap,
                title: 'Peak Business Hour',
                description: `Most orders received at ${displayHour} ${ampm} with ${peakHour[1]} orders`,
                value: `${displayHour} ${ampm}`,
            });
        }

        // Completion rate insight
        if (completionRate >= 80) {
            insights.push({
                type: 'success',
                icon: CheckCircle,
                title: 'Excellent Completion Rate',
                description: `${completionRate.toFixed(1)}% of orders are being completed successfully`,
                value: `${completionRate.toFixed(0)}%`,
            });
        } else if (completionRate < 50) {
            insights.push({
                type: 'warning',
                icon: AlertCircle,
                title: 'Low Completion Rate',
                description: `Only ${completionRate.toFixed(1)}% of orders completed. Consider reviewing order processing`,
                value: `${completionRate.toFixed(0)}%`,
            });
        }

        // Average order value insight
        if (avgOrderValue > 100) {
            insights.push({
                type: 'success',
                icon: TrendingUp,
                title: 'High Average Order Value',
                description: `Customers are spending ₹${avgOrderValue.toFixed(2)} per order on average`,
                value: `₹${avgOrderValue.toFixed(0)}`,
            });
        }

        // Pending orders insight
        const pendingOrders = orders.filter(o => o.status === 'Pending').length;
        if (pendingOrders > 5) {
            insights.push({
                type: 'warning',
                icon: Clock,
                title: 'Pending Orders Alert',
                description: `${pendingOrders} orders are waiting to be processed`,
                value: `${pendingOrders}`,
            });
        }

        // Top-selling item
        const itemStats: Record<string, { name: string; count: number; revenue: number }> = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!itemStats[item.id]) {
                    itemStats[item.id] = { name: item.name, count: 0, revenue: 0 };
                }
                itemStats[item.id].count += item.cartQuantity;
                itemStats[item.id].revenue += item.price * item.cartQuantity;
            });
        });
        const topItem = Object.values(itemStats).sort((a, b) => b.revenue - a.revenue)[0];
        if (topItem) {
            insights.push({
                type: 'info',
                icon: TrendingUp,
                title: 'Best Seller',
                description: `"${topItem.name}" is your top performer with ₹${topItem.revenue.toFixed(2)} in revenue`,
                value: topItem.name,
            });
        }

        // Growth comparison (if applicable)
        if (dateFilter !== 'all') {
            // Calculate previous period
            let previousPeriodOrders: Order[] = [];
            const filterDays = dateFilter === 'today' ? 1 : dateFilter === 'week' ? 7 : 30;

            const currentPeriodStart = new Date(now);
            currentPeriodStart.setDate(currentPeriodStart.getDate() - filterDays);

            const previousPeriodStart = new Date(currentPeriodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - filterDays);

            previousPeriodOrders = orders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= previousPeriodStart && orderDate < currentPeriodStart;
            });

            if (previousPeriodOrders.length > 0) {
                const currentRevenue = totalRevenue;
                const previousRevenue = previousPeriodOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

                if (Math.abs(growth) > 5) {
                    insights.push({
                        type: growth > 0 ? 'success' : 'warning',
                        icon: growth > 0 ? TrendingUp : TrendingDown,
                        title: growth > 0 ? 'Revenue Growth' : 'Revenue Decline',
                        description: `${Math.abs(growth).toFixed(1)}% ${growth > 0 ? 'increase' : 'decrease'} compared to previous period`,
                        value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
                    });
                }
            }
        }

        return insights;
    }, [orders, dateFilter]);

    if (insights.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Smart Insights</h3>
                <p className="text-sm text-gray-500">AI-powered analytics to help you make better decisions</p>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((insight, index) => {
                        const Icon = insight.icon;
                        const colorClasses = {
                            success: {
                                bg: 'bg-green-50',
                                border: 'border-green-200',
                                icon: 'text-green-600',
                                text: 'text-green-700',
                            },
                            warning: {
                                bg: 'bg-yellow-50',
                                border: 'border-yellow-200',
                                icon: 'text-yellow-600',
                                text: 'text-yellow-700',
                            },
                            info: {
                                bg: 'bg-blue-50',
                                border: 'border-blue-200',
                                icon: 'text-blue-600',
                                text: 'text-blue-700',
                            },
                            trend: {
                                bg: 'bg-purple-50',
                                border: 'border-purple-200',
                                icon: 'text-purple-600',
                                text: 'text-purple-700',
                            },
                        };

                        const colors = colorClasses[insight.type];

                        return (
                            <div
                                key={index}
                                className={`${colors.bg} ${colors.border} border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-105`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 bg-white rounded-lg ${colors.icon}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-semibold ${colors.text} mb-1`}>
                                            {insight.title}
                                        </h4>
                                        <p className="text-sm text-gray-600">{insight.description}</p>
                                        {insight.value && (
                                            <div className={`mt-2 inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-bold border ${colors.border}`}>
                                                {insight.value}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SmartInsights;
