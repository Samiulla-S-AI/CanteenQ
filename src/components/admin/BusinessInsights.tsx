import React from 'react';
import { TrendingUp, TrendingDown, Clock, Award, Target, Zap, Users, DollarSign } from 'lucide-react';

interface BusinessMetric {
    label: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

interface BusinessInsightsProps {
    metrics: {
        avgOrderValue: number;
        peakHour: string;
        conversionRate: number;
        customerRetention: number;
        avgPrepTime: string;
        topCategory: string;
    };
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({ metrics }) => {
    const insightCards: BusinessMetric[] = [
        {
            label: 'Avg Order Value',
            value: `₹${metrics.avgOrderValue.toFixed(0)}`,
            change: 0, // Removed hardcoded value - need historical data for real trends
            trend: 'up',
            icon: <DollarSign className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            label: 'Peak Hour',
            value: metrics.peakHour,
            change: 0,
            trend: 'up',
            icon: <Clock className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Conversion Rate',
            value: `${metrics.conversionRate.toFixed(1)}%`,
            change: 0, // Removed hardcoded value - need historical data for real trends
            trend: 'up',
            icon: <Target className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            label: 'Customer Retention',
            value: `${metrics.customerRetention.toFixed(0)}%`,
            change: 0, // Removed hardcoded value - need historical data for real trends
            trend: 'up',
            icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        },
        {
            label: 'Avg Prep Time',
            value: metrics.avgPrepTime,
            change: 0, // Removed hardcoded value - need historical data for real trends
            trend: 'down',
            icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50'
        },
        {
            label: 'Top Category',
            value: metrics.topCategory,
            change: 0,
            trend: 'up',
            icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {insightCards.map((card, index) => (
                <div
                    key={index}
                    className="group relative bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                    {/* Gradient background effect */}
                    <div className={`absolute inset-0 ${card.bgColor} rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                    <div className="relative">
                        {/* Icon */}
                        <div className={`inline-flex p-2 md:p-3 ${card.bgColor} ${card.color} rounded-lg md:rounded-xl mb-2 md:mb-4`}>
                            {card.icon}
                        </div>

                        {/* Label */}
                        <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">{card.label}</h3>

                        {/* Value */}
                        <div className="flex items-end justify-between">
                            <p className="text-xl md:text-3xl font-bold text-gray-900">{card.value}</p>

                            {/* Trend indicator */}
                            {card.change !== 0 && (
                                <div className={`flex items-center space-x-1 ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {card.trend === 'up' ? (
                                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                                    )}
                                    <span className="text-xs md:text-sm font-semibold">
                                        {Math.abs(card.change)}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bottom accent line */}
                        <div className={`h-1 ${card.bgColor} rounded-full mt-2 md:mt-4 group-hover:scale-x-110 transition-transform duration-300`}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Circular Progress Gauge
interface CircularGaugeProps {
    value: number;
    max: number;
    label: string;
    color: string;
    size?: number;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
    value,
    max,
    label,
    color,
    size = 120
}) => {
    // Ensure we never have NaN by providing fallbacks
    const safeValue = Number(value) || 0;
    const safeMax = Number(max) || 1; // Prevent division by zero
    const percentage = (safeValue / safeMax) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background circle */}
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r="45"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r="45"
                        stroke={color}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{safeValue}</span>
                    <span className="text-xs text-gray-500">of {safeMax}</span>
                </div>
            </div>

            <p className="mt-3 text-sm font-medium text-gray-700 text-center">{label}</p>
            <p className="text-xs text-gray-500">{isNaN(percentage) ? '0' : percentage.toFixed(0)}%</p>
        </div>
    );
};

// Heatmap for peak hours
interface PeakHoursHeatmapProps {
    hourlyData: { hour: number; count: number }[];
}

export const PeakHoursHeatmap: React.FC<PeakHoursHeatmapProps> = ({ hourlyData }) => {
    const maxCount = Math.max(...hourlyData.map(d => d.count), 1);

    const getIntensity = (count: number) => {
        const intensity = count / maxCount;
        if (intensity > 0.75) return 'bg-red-500';
        if (intensity > 0.5) return 'bg-orange-500';
        if (intensity > 0.25) return 'bg-yellow-500';
        if (intensity > 0) return 'bg-green-500';
        return 'bg-gray-200';
    };

    const getOpacity = (count: number) => {
        const baseOpacity = 0.3;
        const intensity = count / maxCount;
        return baseOpacity + (intensity * 0.7);
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Peak Hours Heatmap
            </h3>

            <div className="grid grid-cols-12 gap-2">
                {hourlyData.map(({ hour, count }) => {
                    const displayHour = hour % 12 || 12;
                    const ampm = hour < 12 ? 'AM' : 'PM';

                    return (
                        <div
                            key={hour}
                            className="flex flex-col items-center group relative"
                        >
                            <div
                                className={`w-full aspect-square ${getIntensity(count)} rounded-lg transition-all duration-300 hover:scale-110 cursor-pointer`}
                                style={{ opacity: getOpacity(count) }}
                                title={`${displayHour}${ampm}: ${count} orders`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                        {count}
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-gray-600 mt-1">
                                {displayHour}
                                <span className="text-[8px]">{ampm}</span>
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-4 text-xs">
                <span className="text-gray-600">Low</span>
                <div className="flex space-x-1">
                    {['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'].map((color, i) => (
                        <div key={i} className={`w-6 h-3 ${color} rounded`}></div>
                    ))}
                </div>
                <span className="text-gray-600">High</span>
            </div>
        </div>
    );
};

// Top Items Leaderboard
interface TopItem {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    category: string;
}

interface TopItemsLeaderboardProps {
    items: TopItem[];
}

export const TopItemsLeaderboard: React.FC<TopItemsLeaderboardProps> = ({ items }) => {
    const maxRevenue = Math.max(...items.map(i => i.revenue), 1);

    const getMedalColor = (index: number) => {
        if (index === 0) return 'from-yellow-400 to-yellow-600';
        if (index === 1) return 'from-gray-300 to-gray-500';
        if (index === 2) return 'from-orange-400 to-orange-600';
        return 'from-blue-400 to-blue-600';
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-600" />
                Top Performing Items
            </h3>

            <div className="space-y-3">
                {items.map((item, index) => {
                    const percentage = (item.revenue / maxRevenue) * 100;

                    return (
                        <div
                            key={item.id}
                            className="group relative overflow-hidden rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300"
                        >
                            {/* Progress background */}
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-50 to-transparent transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            ></div>

                            <div className="relative p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                    {/* Rank medal */}
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-white font-bold shadow-lg`}>
                                        {index + 1}
                                    </div>

                                    {/* Item info */}
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                {item.category}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {item.orders} orders
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-600">
                                        ₹{item.revenue.toFixed(0)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {percentage.toFixed(0)}% of top
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

export default BusinessInsights;
