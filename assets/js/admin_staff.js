const adminStaff = {
    staffList: [],
    allUsers: [],
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
                this.allUsers = response.data || [];
                this.staffList = this.allUsers.filter(user =>
                    user.user_type === 'admin'
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

        document.getElementById('user-select').addEventListener('change', (e) => {
            this.handleUserSelection(e.target.value);
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
        document.getElementById('modal-title').textContent = 'Change User Role';
        document.getElementById('staff-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-info-group').style.display = 'none';
        document.getElementById('user-select-group').style.display = 'block';
        this.populateUserSelect();
        document.getElementById('staff-modal').classList.add('active');
    },

    populateUserSelect() {
        const select = document.getElementById('user-select');
        const customerUsers = this.allUsers.filter(u => u.user_type === 'customer');

        select.innerHTML = '<option value="">Select a user...</option>';
        customerUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.user_id;
            option.textContent = `${user.full_name} (${user.email})`;
            option.dataset.user = JSON.stringify(user);
            select.appendChild(option);
        });
    },

    handleUserSelection(userId) {
        const infoGroup = document.getElementById('user-info-group');
        if (!userId) {
            infoGroup.style.display = 'none';
            return;
        }

        const selectedOption = document.querySelector(`#user-select option[value="${userId}"]`);
        const user = JSON.parse(selectedOption.dataset.user);

        document.getElementById('selected-fullname').textContent = user.full_name;
        document.getElementById('selected-email').textContent = user.email || 'N/A';
        document.getElementById('selected-phone').textContent = user.phone_number || 'N/A';
        document.getElementById('user-id').value = user.user_id;

        infoGroup.style.display = 'block';
    },

    closeModal() {
        document.getElementById('staff-modal').classList.remove('active');
    },

    async editStaff(userId) {
        const staff = this.staffList.find(s => s.user_id == userId);
        if (!staff) return;

        document.getElementById('modal-title').textContent = 'Edit User Role';
        document.getElementById('user-id').value = staff.user_id;
        document.getElementById('user-select-group').style.display = 'none';

        document.getElementById('selected-fullname').textContent = staff.full_name;
        document.getElementById('selected-email').textContent = staff.email || 'N/A';
        document.getElementById('selected-phone').textContent = staff.phone_number || 'N/A';
        document.getElementById('user-info-group').style.display = 'block';

        document.getElementById('staff-role').value = staff.user_type;

        document.getElementById('staff-modal').classList.add('active');
    },

    async saveStaff() {
        const userId = document.getElementById('user-id').value;
        const role = document.getElementById('staff-role').value;

        if (!userId) {
            alert('Please select a user');
            return;
        }

        if (!role) {
            alert('Please select a role');
            return;
        }

        try {
            const token = localStorage.getItem('jwt_token');

            const data = {
                user_id: userId,
                user_type: role
            };

            const response = await this.updateStaff(data, token);

            if (response.success) {
                alert('User role updated successfully!');
                this.closeModal();
                await this.loadData();
                this.renderTable();
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error updating role: ' + error.message);
        }
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
