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
            <img src="assets/images/logo.png" alt="Persol Logo">
        </div>

        <nav class="sidebar-nav">
            <a href="#admin_dashboard" class="nav-item"><i class="fas fa-home"></i> Dashboard</a>
            <a href="#admin_orders" class="nav-item"><i class="fas fa-file-invoice"></i> Orders</a>

            <div class="nav-item has-submenu">
                <a href="#" class="submenu-toggle"><i class="fas fa-box-open"></i> Products <i class="fas fa-chevron-down arrow"></i></a>
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

    <script type="module" src="assets/js/admin.js"></script>
</body>
</html>