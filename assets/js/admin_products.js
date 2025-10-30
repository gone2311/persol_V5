const adminProducts = {
    products: [],
    brands: [],
    categories: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: 10,

    async init() {
        await this.loadData();
        await this.loadDocuments();
        this.setupEventListeners();
        this.renderTable();
    },

    async loadDocuments() {
        try {
            const response = await fetch('uploads/');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'));
            const documents = links
                .map(a => a.getAttribute('href'))
                .filter(href => href && (href.endsWith('.pdf') || href.endsWith('.docx') || href.endsWith('.doc') || href.endsWith('.txt')))
                .map(href => href.split('/').pop());

            const select = document.getElementById('product-document-select');
            if (select) {
                documents.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc;
                    option.textContent = doc;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Could not load documents list:', error);
        }
    },

    async loadData() {
        try {
            const token = localStorage.getItem('jwt_token');
            const [productsRes, brandsRes, categoriesRes] = await Promise.all([
                api.admin_getAllProducts(token),
                api.getBrands(),
                api.getCategories()
            ]);

            if (productsRes.success) {
                this.products = productsRes.data || [];
                this.filteredProducts = [...this.products];
            }

            if (brandsRes.success) {
                this.brands = brandsRes.data || [];
                this.populateBrandFilters();
            }

            if (categoriesRes.success) {
                this.categories = categoriesRes.data || [];
                this.populateCategoryFilters();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data: ' + error.message);
        }
    },

    populateBrandFilters() {
        const filterBrand = document.getElementById('filter-brand');
        const productBrand = document.getElementById('product-brand');

        this.brands.forEach(brand => {
            const option1 = document.createElement('option');
            option1.value = brand.brand_id;
            option1.textContent = brand.brand_name;
            filterBrand.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = brand.brand_id;
            option2.textContent = brand.brand_name;
            productBrand.appendChild(option2);
        });
    },

    populateCategoryFilters() {
        const filterCategory = document.getElementById('filter-category');
        const productCategory = document.getElementById('product-category');

        this.categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category.category_id;
            option1.textContent = category.category_name;
            filterCategory.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = category.category_id;
            option2.textContent = category.category_name;
            productCategory.appendChild(option2);
        });
    },

    setupEventListeners() {
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterProducts();
        });

        document.getElementById('filter-brand').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('filter-category').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('filter-status').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
    },

    filterProducts() {
        const search = document.getElementById('product-search').value.toLowerCase();
        const brandId = document.getElementById('filter-brand').value;
        const categoryId = document.getElementById('filter-category').value;
        const status = document.getElementById('filter-status').value;

        this.filteredProducts = this.products.filter(product => {
            const matchSearch = !search ||
                product.product_name.toLowerCase().includes(search) ||
                (product.product_code && product.product_code.toLowerCase().includes(search)) ||
                (product.brand_name && product.brand_name.toLowerCase().includes(search));

            const matchBrand = !brandId || product.brand_id == brandId;
            const matchCategory = !categoryId || product.category_id == categoryId;
            const matchStatus = status === '' || product.is_active == status;

            return matchSearch && matchBrand && matchCategory && matchStatus;
        });

        this.currentPage = 1;
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = '';

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(start, end);

        if (pageProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No products found</td></tr>';
            return;
        }

        pageProducts.forEach(product => {
            const row = document.createElement('tr');

            const imageUrl = product.image_filename
                ? `api/v1/get_product_image.php?id=${product.product_id}`
                : 'assets/images/placeholder.png';

            const stockClass = product.stock_quantity < 10 ? 'stock-warning' : '';
            const statusClass = product.is_active == 1 ? 'status-active' : 'status-inactive';
            const statusText = product.is_active == 1 ? 'Active' : 'Inactive';

            row.innerHTML = `
                <td><img src="${imageUrl}" class="product-image-cell" alt="${product.product_name}" /></td>
                <td>${product.product_name}</td>
                <td>${product.brand_name || 'N/A'}</td>
                <td>${product.category_name || 'N/A'}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td class="${stockClass}">${product.stock_quantity}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="adminProducts.editProduct(${product.product_id})">Edit</button>
                        <button class="btn-icon btn-doc" onclick="adminProducts.showDocumentModal(${product.product_id})">Docs</button>
                        <button class="btn-icon btn-delete" onclick="adminProducts.deleteProduct(${product.product_id})">Delete</button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        this.updatePagination();
    },

    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages}`;
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages || totalPages === 0;
    },

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
        }
    },

    nextPage() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    },

    showCreateModal() {
        document.getElementById('modal-title').textContent = 'Add New Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('current-image-preview').innerHTML = '';
        document.getElementById('product-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('product-modal').classList.remove('active');
    },

    async editProduct(productId) {
        const product = this.products.find(p => p.product_id == productId);
        if (!product) return;

        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.product_id;
        document.getElementById('product-name').value = product.product_name;
        document.getElementById('product-brand').value = product.brand_id || '';
        document.getElementById('product-category').value = product.category_id || '';
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock_quantity;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-specs').value = product.specifications || '';

        if (product.image_filename) {
            const imageUrl = `api/v1/get_product_image.php?id=${product.product_id}`;
            document.getElementById('current-image-preview').innerHTML =
                `<img src="${imageUrl}" alt="Current Image" />`;
        }

        const docSelect = document.getElementById('product-document-select');
        if (docSelect) {
            docSelect.value = product.document_filename || '';
        }

        document.getElementById('product-modal').classList.add('active');
    },

    async saveProduct() {
        const productId = document.getElementById('product-id').value;
        const formData = new FormData();

        if (productId) {
            formData.append('product_id', productId);
        }

        formData.append('product_name', document.getElementById('product-name').value);
        formData.append('brand_id', document.getElementById('product-brand').value);
        formData.append('category_id', document.getElementById('product-category').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('stock_quantity', document.getElementById('product-stock').value);
        formData.append('description', document.getElementById('product-description').value);
        formData.append('specifications', document.getElementById('product-specs').value);
        formData.append('document_filename', document.getElementById('product-document-select').value);

        const imageFile = document.getElementById('product-image').files[0];
        if (imageFile) {
            formData.append('main_image_file', imageFile);
        }

        try {
            const token = localStorage.getItem('jwt_token');
            const response = productId
                ? await api.admin_updateProduct(formData, token)
                : await api.admin_createProduct(formData, token);

            if (response.success) {
                alert(productId ? 'Product updated successfully!' : 'Product created successfully!');
                this.closeModal();
                await this.loadData();
                this.renderTable();
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product: ' + error.message);
        }
    },

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await api.admin_deleteProduct(productId, token);

            if (response.success) {
                alert('Product deleted successfully!');
                await this.loadData();
                this.renderTable();
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product: ' + error.message);
        }
    },

    showDocumentModal(productId) {
        document.getElementById('doc-product-id').value = productId;
        document.getElementById('document-modal').classList.add('active');
        this.loadProductDocuments(productId);
    },

    closeDocumentModal() {
        document.getElementById('document-modal').classList.remove('active');
    },

    async loadProductDocuments(productId) {
        const product = this.products.find(p => p.product_id == productId);
        const listDiv = document.getElementById('current-documents-list');

        if (product && product.product_document_path) {
            listDiv.innerHTML = `
                <div class="document-item">
                    <span>${product.product_document_name || 'Document'}</span>
                    <a href="api/v1/download_document.php?id=${productId}" target="_blank">Download</a>
                </div>
            `;
        } else {
            listDiv.innerHTML = '<p style="color: #6c757d; font-size: 14px;">No documents uploaded yet.</p>';
        }
    },

    async uploadDocument() {
        const productId = document.getElementById('doc-product-id').value;
        const fileInput = document.getElementById('product-document');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a document file');
            return;
        }

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await api.admin_uploadDocument(productId, file, token);

            if (response.success) {
                alert('Document uploaded successfully!');
                this.closeDocumentModal();
                await this.loadData();
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error uploading document: ' + error.message);
        }
    }
};

window.adminProducts = adminProducts;
