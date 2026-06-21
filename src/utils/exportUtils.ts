interface Order {
    id: string;
    orderNumber: string;
    userEmail: string;
    timestamp: string;
    status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
    totalAmount: number;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    canteenId?: string;
}

/**
 * Convert data to CSV format
 */
export const exportToCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => row.map(cell => {
        // Escape special characters and wrap in quotes if needed
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
    }).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Format analytics data for export
 */
export const formatDataForExport = (
    orders: Order[],
    dateFilter: string,
    isMasterAdmin: boolean,
    commissionRate: number
): string[][] => {
    const now = new Date();
    const dateRangeText = dateFilter === 'today' ? 'Today'
        : dateFilter === 'week' ? 'Last 7 Days'
            : dateFilter === 'month' ? 'Last 30 Days'
                : 'All Time';

    // Calculate metrics
    const totalRevenue = isMasterAdmin
        ? orders.reduce((sum, order) => sum + (order.totalAmount * (commissionRate / 100)), 0)
        : orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Status distribution
    const statusCounts = {
        Pending: orders.filter(o => o.status === 'Pending').length,
        Preparing: orders.filter(o => o.status === 'Preparing').length,
        Ready: orders.filter(o => o.status === 'Ready').length,
        Completed: orders.filter(o => o.status === 'Completed').length,
    };

    // Top items - Fixed to match analytics visualization
    const itemStats: Record<string, { count: number; revenue: number; name: string }> = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!itemStats[item.id]) {
                itemStats[item.id] = { count: 0, revenue: 0, name: item.name };
            }
            // Use cartQuantity to match the analytics visualization calculation
            const itemQuantity = (item as any).cartQuantity || item.quantity || 0;
            itemStats[item.id].count += itemQuantity;
            itemStats[item.id].revenue += item.price * itemQuantity;
        });
    });

    const topItems = Object.entries(itemStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    // Calculate hourly distribution
    const hourlyOrders: Record<number, number> = {};
    orders.forEach(order => {
        const orderTime = order.timestamp || (order as any).created_at || (order as any).createdAt;
        if (orderTime) {
            try {
                const hour = new Date(orderTime).getHours();
                if (hour >= 0 && hour <= 23) {
                    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
                }
            } catch (e) {
                // Skip invalid timestamps
            }
        }
    });

    const maxHourlyOrders = Math.max(...Object.values(hourlyOrders), 1);

    // Build CSV data
    const csvData: string[][] = [
        ['CanteenQ Analytics Report'],
        ['Generated on', now.toLocaleDateString() + ' ' + now.toLocaleTimeString()],
        ['Date Range', dateRangeText],
        [''],
        ['SUMMARY METRICS'],
        ['Metric', 'Value'],
        [isMasterAdmin ? 'Commission Revenue' : 'Total Revenue', `₹${totalRevenue.toFixed(2)}`],
        ['Average Order Value', `₹${avgOrderValue.toFixed(2)}`],
        ['Total Orders', orders.length.toString()],
        ['Completion Rate', `${orders.length > 0 ? ((statusCounts.Completed / orders.length) * 100).toFixed(1) : 0}%`],
        [''],
        ['ORDER STATUS DISTRIBUTION'],
        ['Status', 'Count', 'Percentage'],
        ['Pending', statusCounts.Pending.toString(), `${orders.length > 0 ? ((statusCounts.Pending / orders.length) * 100).toFixed(1) : 0}%`],
        ['Preparing', statusCounts.Preparing.toString(), `${orders.length > 0 ? ((statusCounts.Preparing / orders.length) * 100).toFixed(1) : 0}%`],
        ['Ready', statusCounts.Ready.toString(), `${orders.length > 0 ? ((statusCounts.Ready / orders.length) * 100).toFixed(1) : 0}%`],
        ['Completed', statusCounts.Completed.toString(), `${orders.length > 0 ? ((statusCounts.Completed / orders.length) * 100).toFixed(1) : 0}%`],
        [''],
        ['PEAK HOURS ANALYSIS'],
        ['Hour', 'Time Period', 'Orders', 'Percentage of Peak', 'Activity Level', 'Bar Chart'],
    ];

    // Add hourly data
    for (let hour = 0; hour < 24; hour++) {
        const count = hourlyOrders[hour] || 0;
        const percentage = (count / maxHourlyOrders) * 100;
        const displayHour = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const timePeriod = `${displayHour}:00 ${ampm} - ${((hour + 1) % 12) || 12}:00 ${(hour + 1) < 12 ? 'AM' : 'PM'}`;

        const activityLevel = percentage >= 80 ? '🔥 Peak' :
            percentage >= 60 ? '📈 Very High' :
                percentage >= 40 ? '⚡ High' :
                    percentage >= 20 ? '📊 Medium' :
                        count > 0 ? '💤 Low' : '⬜ None';

        // Create ASCII bar chart
        const barLength = Math.round((percentage / 100) * 20);
        const barChart = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

        csvData.push([
            hour.toString().padStart(2, '0'),
            timePeriod,
            count.toString(),
            `${percentage.toFixed(1)}%`,
            activityLevel,
            barChart
        ]);
    }

    csvData.push(['']);
    csvData.push(['TOP SELLING ITEMS']);
    csvData.push(['Rank', 'Item Name', 'Units Sold', 'Revenue']);

    topItems.forEach((item, index) => {
        csvData.push([
            (index + 1).toString(),
            item.name,
            item.count.toString(),
            `₹${item.revenue.toFixed(2)}`
        ]);
    });

    return csvData;
};

/**
 * Export comprehensive analytics report
 */
export const exportAnalyticsReport = (
    orders: Order[],
    dateFilter: string,
    isMasterAdmin: boolean = false,
    commissionRate: number = 1
) => {
    const data = formatDataForExport(orders, dateFilter, isMasterAdmin, commissionRate);
    const now = new Date();
    const filename = `CanteenQ_Analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.csv`;

    exportToCSV(data, filename);
};

/**
 * Export orders list
 */
export const exportOrdersList = (orders: Order[]) => {
    const csvData: string[][] = [
        ['Order Number', 'Customer Email', 'Date', 'Time', 'Status', 'Total Amount', 'Items Count']
    ];

    orders.forEach(order => {
        const date = new Date(order.timestamp);
        csvData.push([
            order.orderNumber,
            order.userEmail,
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            order.status,
            `₹${order.totalAmount.toFixed(2)}`,
            order.items.length.toString()
        ]);
    });

    const now = new Date();
    const filename = `CanteenQ_Orders_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.csv`;

    exportToCSV(csvData, filename);
};
