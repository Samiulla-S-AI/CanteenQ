import React from 'react';
import { Package, CheckCircle, Clock, Award } from 'lucide-react';

// Order Status Distribution Component
interface OrderStatusData {
    pending: number;
    ready: number;
    completed: number;
    total: number;
}

interface OrderStatusDistributionProps {
    stats: OrderStatusData;
}

export const OrderStatusDistribution: React.FC<OrderStatusDistributionProps> = ({ stats }) => {
    const statuses = [
        {
            label: 'Pending',
            count: stats.pending,
            percentage: (stats.pending / stats.total) * 100,
            icon: <Clock className="w-5 h-5" />,
            color: 'bg-yellow-500',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-700'
        },
        {
            label: 'Ready',
            count: stats.ready,
            percentage: (stats.ready / stats.total) * 100,
            icon: <Package className="w-5 h-5" />,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700'
        },
        {
            label: 'Completed',
            count: stats.completed,
            percentage: (stats.completed / stats.total) * 100,
            icon: <CheckCircle className="w-5 h-5" />,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700'
        }
    ];

    return (
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center">
                <Package className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600" />
                Order Status Distribution
            </h3>

            <div className="space-y-3 md:space-y-4">
                {statuses.map((status, index) => (
                    <div key={index} className="group">
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div className={`p-2 ${status.bgColor} ${status.textColor} rounded-lg`}>
                                    {status.icon}
                                </div>
                                <span className="text-sm md:text-base font-semibold text-gray-700">
                                    {status.label}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg md:text-2xl font-bold text-gray-900">{status.count}</p>
                                <p className="text-xs text-gray-500">{status.percentage.toFixed(0)}%</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 md:h-4 overflow-hidden">
                            <div
                                className={`${status.color} h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-90`}
                                style={{ width: `${status.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="mt-4 md:mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Total Orders</span>
                    <span className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</span>
                </div>
            </div>
        </div>
    );
};

// Top Selling Items Component - Improved Mobile UI
interface TopItem {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    category: string;
}

interface TopSellingItemsProps {
    items: TopItem[];
}

export const TopSellingItems: React.FC<TopSellingItemsProps> = ({ items }) => {
    const maxRevenue = Math.max(...items.map(i => i.revenue), 1);

    const getGradient = (index: number) => {
        if (index === 0) return 'from-yellow-400 to-yellow-600'; // Gold
        if (index === 1) return 'from-gray-300 to-gray-500'; // Silver
        if (index === 2) return 'from-orange-400 to-orange-600'; // Bronze
        return 'from-blue-400 to-blue-600';
    };

    return (
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6 flex items-center">
                <Award className="w-4 h-4 md:w-5 md:h-5 mr-2 text-yellow-600" />
                Top Selling Items
            </h3>

            <div className="space-y-2 md:space-y-3">
                {items.map((item, index) => {
                    const percentage = (item.revenue / maxRevenue) * 100;

                    return (
                        <div
                            key={item.id}
                            className="group relative bg-gradient-to-r from-gray-50 to-transparent rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex items-center justify-between gap-3">
                                {/* Rank Badge */}
                                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center shadow-lg`}>
                                    <span className="text-sm md:text-base font-bold text-white">
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Item Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                                            {item.category}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {item.orders} orders
                                        </span>
                                    </div>

                                    {/* Revenue Progress Bar */}
                                    <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-700"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-base md:text-xl font-bold text-green-600">
                                        ₹{item.revenue.toFixed(0)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {percentage.toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default { OrderStatusDistribution, TopSellingItems };
