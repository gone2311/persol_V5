const adminDashboard = {
    ordersChart: null,
    visitsChart: null,

    async init() {
        await this.loadStats();
    },

    async loadStats() {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await api.admin_getDashboardStats(token);

            if (response.success) {
                const stats = response.data;
                this.updateStatCards(stats);
                this.renderOrdersChart(stats.orders_by_month);
                this.renderVisitsChart(stats.weekly_visits);
                this.renderLowStockTable(stats.low_stock_products);
                this.renderRecentOrders(stats.recent_orders);
            } else {
                console.error('Failed to load stats:', response.message);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    },

    updateStatCards(stats) {
        document.getElementById('stat-products').textContent = stats.active_products_count || 0;
        document.getElementById('stat-revenue').textContent = '$' + (stats.monthly_revenue || 0).toFixed(2);
        document.getElementById('stat-orders').textContent = stats.monthly_orders || 0;
        document.getElementById('stat-customers').textContent = stats.total_customers || 0;
    },

    renderOrdersChart(data) {
        const ctx = document.getElementById('orders-chart');
        if (!ctx) return;

        const labels = data.map(item => item.month);
        const orderCounts = data.map(item => item.order_count);

        if (this.ordersChart) {
            this.ordersChart.destroy();
        }

        this.ordersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders',
                    data: orderCounts,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    renderVisitsChart(data) {
        const ctx = document.getElementById('visits-chart');
        if (!ctx) return;

        const labels = data.map(item => item.week);
        const visits = data.map(item => item.visits);
        const total = visits.reduce((a, b) => a + b, 0);

        if (this.visitsChart) {
            this.visitsChart.destroy();
        }

        this.visitsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: visits,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} visits (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    renderLowStockTable(products) {
        const tbody = document.getElementById('low-stock-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #28a745;">All products are well stocked!</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            const stockClass = product.stock_quantity < 5 ? 'stock-critical' : 'stock-low';

            row.innerHTML = `
                <td>#${product.product_id}</td>
                <td>${product.product_name}</td>
                <td>${product.brand_name || 'N/A'}</td>
                <td class="${stockClass}">${product.stock_quantity}</td>
                <td>
                    <button class="btn-sm" onclick="window.location.hash='admin_products'">
                        Restock
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    renderRecentOrders(orders) {
        const tbody = document.getElementById('recent-orders-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent orders</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const statusClass = `status-${order.order_status.toLowerCase()}`;
            const date = new Date(order.order_date).toLocaleDateString();

            row.innerHTML = `
                <td>${order.order_code}</td>
                <td>${order.customer_name || 'N/A'}</td>
                <td>${date}</td>
                <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${order.order_status}</span></td>
            `;

            tbody.appendChild(row);
        });
    }
};

window.adminDashboard = adminDashboard;
