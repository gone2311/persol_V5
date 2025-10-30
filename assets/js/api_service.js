const API_BASE_URL = 'api/v1';

async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
            }
            throw new Error(errorMsg);
        }
        const result = await response.json();
        if (result.success !== undefined && !result.success) {
            throw new Error(result.message || 'API request failed');
        }
        return result;
    } catch (error) {
        console.error('Fetch API error:', error);
        return { success: false, message: error.message, data: null };
    }
}

export const api = {
    getTemplate: (page) => fetch(`templates/${page}.html`).then(res => res.text()),

    getProducts: ({ brand_id = '', category_id = '', min_price = '', max_price = '', search = '' } = {}) => {
        const params = new URLSearchParams();
        if (brand_id) params.append('brand_id', brand_id);
        if (category_id) params.append('category_id', category_id);
        if (min_price) params.append('min_price', min_price);
        if (max_price) params.append('max_price', max_price);
        if (search) params.append('search', search);
        return fetchAPI(`${API_BASE_URL}/products.php?${params.toString()}`);
    },

    getProductById: (id) => {
        return fetchAPI(`${API_BASE_URL}/products.php?id=${id}`);
    },

    getProductsByIds: (ids) => {
        return fetchAPI(`${API_BASE_URL}/products.php?ids=${ids.join(',')}`);
    },

    getCategories: () => {
        return fetchAPI(`${API_BASE_URL}/categories.php`);
    },

    getBrands: () => {
        return fetchAPI(`${API_BASE_URL}/brands.php`);
    },

    getSiteInfo: () => {
        return fetchAPI(`${API_BASE_URL}/site_info.php`);
    },

    login: (email, password) => {
        return fetchAPI(`${API_BASE_URL}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        });
    },

    register: (email, password, fullName) => {
        return fetchAPI(`${API_BASE_URL}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', email, password, full_name: fullName })
        });
    },

    createOrder: (cart, shipping, token) => {
        return fetchAPI(`${API_BASE_URL}/orders.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cart, shipping })
        });
    },

    getMyOrders: (token) => {
        return fetchAPI(`${API_BASE_URL}/orders.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    admin_getAllOrders: (token) => {
        return fetchAPI(`${API_BASE_URL}/admin/orders.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    admin_updateOrderStatus: (order_id, order_status, token) => {
        return fetchAPI(`${API_BASE_URL}/admin/orders.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ _method: 'PUT', order_id, order_status })
        });
    },

    admin_createProduct: (formData, token) => {
        return fetchAPI(`${API_BASE_URL}/admin/products.php`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
    },

    admin_updateProduct: (formData, token) => {
        formData.append('_method', 'PUT');
        return fetchAPI(`${API_BASE_URL}/admin/products.php`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
    },

    admin_toggleProductStatus: (product_id, new_status, token) => {
        return fetchAPI(`${API_BASE_URL}/admin/products.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _method: 'TOGGLE_STATUS',
                product_id: product_id,
                new_status: new_status
            })
        });
    },

    admin_uploadDocument: async (productId, file, token) => {
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('product_document_file', file);
        formData.append('product_document_name', file.name);

        return fetchAPI(`${API_BASE_URL}/admin/upload_document.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
    },

    admin_uploadProductImage: async (productId, file, token) => {
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('main_image_file', file);

        return fetchAPI(`${API_BASE_URL}/admin/upload_product_image.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
    },

    admin_getAllUsers: (token) => {
        return fetchAPI(`${API_BASE_URL}/admin/users.php`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    admin_toggleUserStatus: (user_id, new_status, token) => {
        return fetchAPI(`${API_BASE_URL}/admin/users.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _method: 'TOGGLE_STATUS',
                user_id: user_id,
                new_status: new_status
            })
        });
    }
};