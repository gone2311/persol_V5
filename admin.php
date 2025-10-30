<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Persol</title>
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
            <a href="#admin_dashboard" class="nav-item"><i class="fas fa-home"></i> Trang chủ</a>
            <a href="#admin_orders" class="nav-item"><i class="fas fa-file-invoice"></i> Quản lý hoá đơn</a>
            
            <div class="nav-item has-submenu">
                <a href="#" class="submenu-toggle"><i class="fas fa-box-open"></i> Quản lý sản phẩm <i class="fas fa-chevron-down arrow"></i></a>
                <div class="submenu">
                    <a href="#admin_products">Sản phẩm</a>
                    <a href="#admin_attributes">Các thuộc tính</a>
                </div>
            </div>

            <a href="#admin_staff" class="nav-item"><i class="fas fa-user-shield"></i> Quản lý nhân viên</a>
            <a href="#admin_customers" class="nav-item"><i class="fas fa-users"></i> Quản lý khách hàng</a>
            
            <hr>
            <a href="index.php" class="nav-item"><i class="fas fa-sign-out-alt"></i> Xem trang chính</a>
        </nav>
    </aside>

    <main id="admin-app-content">
        </main>

    <script type="module" src="assets/js/admin.js"></script>
</body>
</html>