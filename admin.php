<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Persol</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body class="admin-body">

    <aside class="admin-sidebar">
        <div class="admin-logo">
            <img src="assets/images/Logo.png" alt="Persol Logo">
        </div>

        <nav class="sidebar-nav">
            <a href="#admin_dashboard" class="nav-item"><i class="fas fa-home"></i> Dashboard</a>
            <a href="#admin_orders" class="nav-item"><i class="fas fa-file-invoice"></i> Orders</a>

            <div class="has-submenu">
                <button class="submenu-toggle">
                    <i class="fas fa-box-open"></i>
                    <span>Products</span>
                    <i class="fas fa-chevron-down arrow"></i>
                </button>
                <div class="submenu">
                    <a href="#admin_products">All Products</a>
                    <a href="#admin_attributes">Attributes</a>
                </div>
            </div>

            <a href="#admin_staff" class="nav-item"><i class="fas fa-user-shield"></i> Staff</a>
            <a href="#admin_customers" class="nav-item"><i class="fas fa-users"></i> Customers</a>

            <hr>
            <a href="index.php" class="nav-item"><i class="fas fa-sign-out-alt"></i> View Store</a>
        </nav>
    </aside>

    <main id="admin-app-content">
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const submenuToggles = document.querySelectorAll('.submenu-toggle');
            submenuToggles.forEach(toggle => {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    const parent = this.closest('.has-submenu');
                    parent.classList.toggle('active');
                });
            });
        });
    </script>
    <script src="assets/js/api_service.js"></script>
    <script type="module" src="assets/js/admin.js"></script>
</body>
</html>