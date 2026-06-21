// Analytics calculation worker
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'CALCULATE_ANALYTICS':
            const result = calculateAnalytics(data);
            self.postMessage({ type: 'ANALYTICS_RESULT', data: result });
            break;

        case 'CALCULATE_REVENUE':
            const revenue = calculateRevenue(data);
            self.postMessage({ type: 'REVENUE_RESULT', data: revenue });
            break;

        default:
            break;
    }
});

function calculateAnalytics(orders) {
    // Heavy calculations for analytics
    const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        averageOrderValue: 0,
        statusDistribution: {},
        topItems: []
    };

    if (orders.length > 0) {
        stats.averageOrderValue = stats.totalRevenue / orders.length;
    }

    // Status distribution
    const statusCounts = {
        Pending: orders.filter(o => o.status === 'Pending').length,
        Ready: orders.filter(o => o.status === 'Ready').length,
        Completed: orders.filter(o => o.status === 'Completed').length
    };
    stats.statusDistribution = statusCounts;

    // Calculate top items
    const itemStats = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!itemStats[item.id]) {
                itemStats[item.id] = {
                    id: item.id,
                    name: item.name,
                    count: 0,
                    revenue: 0
                };
            }
            itemStats[item.id].count += item.cartQuantity || item.quantity;
            itemStats[item.id].revenue += item.price * (item.cartQuantity || item.quantity);
        });
    });

    stats.topItems = Object.values(itemStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    return stats;
}

function calculateRevenue(orders) {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
}
