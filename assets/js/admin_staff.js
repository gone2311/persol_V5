const adminStaff = {
    staffList: [],
    filteredStaff: [],
    currentPage: 1,
    itemsPerPage: 10,

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderTable();
    },

    async loadData() {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await api.admin_getAllUsers(token);

            if (response.success) {
                this.staffList = (response.data || []).filter(user =>
                    user.user_type === 'admin' || user.user_type === 'staff'
                );
                this.filteredStaff = [...this.staffList];
            }
        } catch (error) {
            console.error('Error loading staff:', error);
            alert('Error loading staff: ' + error.message);
        }
    },

    setupEventListeners() {
        document.getElementById('staff-search').addEventListener('input', () => {
            this.filterStaff();
        });

        document.getElementById('filter-role').addEventListener('change', () => {
            this.filterStaff();
        });

        document.getElementById('filter-status').addEventListener('change', () => {
            this.filterStaff();
        });

        document.getElementById('staff-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStaff();
        });
    },

    filterStaff() {
        const search = document.getElementById('staff-search').value.toLowerCase();
        const role = document.getElementById('filter-role').value;
        const status = document.getElementById('filter-status').value;

        this.filteredStaff = this.staffList.filter(staff => {
            const matchSearch = !search ||
                staff.full_name.toLowerCase().includes(search) ||
                (staff.email && staff.email.toLowerCase().includes(search));

            const matchRole = !role || staff.user_type === role;
            const matchStatus = status === '' || staff.is_active == status;

            return matchSearch && matchRole && matchStatus;
        });

        this.currentPage = 1;
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('staff-table-body');
        tbody.innerHTML = '';

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageStaff = this.filteredStaff.slice(start, end);

        if (pageStaff.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No staff found</td></tr>';
            return;
        }

        pageStaff.forEach(staff => {
            const row = document.createElement('tr');

            const statusClass = staff.is_active == 1 ? 'status-active' : 'status-inactive';
            const statusText = staff.is_active == 1 ? 'Active' : 'Inactive';

            const roleClass = staff.user_type === 'admin' ? 'role-admin' : 'role-staff';
            const roleText = staff.user_type === 'admin' ? 'Admin' : 'Staff';

            const createdDate = staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A';

            row.innerHTML = `
                <td>${staff.user_id}</td>
                <td>${staff.full_name}</td>
                <td>${staff.email || 'N/A'}</td>
                <td>${staff.phone_number || 'N/A'}</td>
                <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="adminStaff.editStaff(${staff.user_id})">Edit</button>
                        <button class="btn-icon btn-toggle" onclick="adminStaff.toggleStatus(${staff.user_id}, ${staff.is_active == 1 ? 0 : 1})">
                            ${staff.is_active == 1 ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        this.updatePagination();
    },

    updatePagination() {
        const totalPages = Math.ceil(this.filteredStaff.length / this.itemsPerPage);
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
        const totalPages = Math.ceil(this.filteredStaff.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    },

    showCreateModal() {
        document.getElementById('modal-title').textContent = 'Add New Staff';
        document.getElementById('staff-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('staff-password').placeholder = 'Enter password (required)';
        document.getElementById('staff-password').required = true;
        document.getElementById('staff-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('staff-modal').classList.remove('active');
    },

    async editStaff(userId) {
        const staff = this.staffList.find(s => s.user_id == userId);
        if (!staff) return;

        document.getElementById('modal-title').textContent = 'Edit Staff';
        document.getElementById('user-id').value = staff.user_id;
        document.getElementById('staff-fullname').value = staff.full_name;
        document.getElementById('staff-email').value = staff.email || '';
        document.getElementById('staff-phone').value = staff.phone_number || '';
        document.getElementById('staff-role').value = staff.user_type;
        document.getElementById('staff-address').value = staff.address || '';
        document.getElementById('staff-password').value = '';
        document.getElementById('staff-password').placeholder = 'Leave empty to keep current';
        document.getElementById('staff-password').required = false;

        document.getElementById('staff-modal').classList.add('active');
    },

    async saveStaff() {
        const userId = document.getElementById('user-id').value;
        const fullName = document.getElementById('staff-fullname').value;
        const email = document.getElementById('staff-email').value;
        const phone = document.getElementById('staff-phone').value;
        const password = document.getElementById('staff-password').value;
        const role = document.getElementById('staff-role').value;
        const address = document.getElementById('staff-address').value;

        if (!userId && !password) {
            alert('Password is required for new staff');
            return;
        }

        if (password && password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            const token = localStorage.getItem('jwt_token');

            const data = {
                user_type: role,
                full_name: fullName,
                email: email,
                phone_number: phone,
                address: address
            };

            if (userId) {
                data.user_id = userId;
                if (password) {
                    data.password = password;
                }
            } else {
                data.password = password;
                data.username = email;
            }

            const response = userId
                ? await this.updateStaff(data, token)
                : await this.createStaff(data, token);

            if (response.success) {
                alert(userId ? 'Staff updated successfully!' : 'Staff created successfully!');
                this.closeModal();
                await this.loadData();
                this.renderTable();
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Error saving staff:', error);
            alert('Error saving staff: ' + error.message);
        }
    },

    async createStaff(data, token) {
        return fetch('api/v1/admin/users.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(r => r.json());
    },

    async updateStaff(data, token) {
        return fetch('api/v1/admin/users.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...data, _method: 'PUT' })
        }).then(r => r.json());
    },

    async toggleStatus(userId, newStatus) {
        if (!confirm(`Are you sure you want to ${newStatus == 1 ? 'enable' : 'disable'} this staff member?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('jwt_token');
            const response = await api.admin_toggleUserStatus(userId, newStatus, token);

            if (response.success) {
                alert('Status updated successfully!');
                await this.loadData();
                this.renderTable();
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error toggling status: ' + error.message);
        }
    }
};

window.adminStaff = adminStaff;
