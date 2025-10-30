<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persol Eyewear</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <header>
        <div class="logo">
            <a href="#home"><img src="assets/images/logo.png" alt="Persol Logo"></a>
        </div>
        <nav id="main-menu">
            <a href="#home">Home</a>
            <a href="#products">Products</a>
            <a href="#contact">Contact</a>
            <a href="#compare">Comparison (<span id="compare-count-nav">0</span>)</a> 
            
            <a href="#checkout" id="cart-link">Cart (<span id="cart-count">0</span>)</a>
            <a href="admin.php" id="admin-link" style="display:none; color: red;">Admin</a>
        </nav>
        <div class="header-right">
            <div id="guest-nav">
                <a href="#login">Login</a>
                <a href="#register">Register</a>
            </div>
            <div id="user-nav" style="display:none;">
                <span id="user-welcome"></span>
                <a href="#profile">Profile</a>
            </div>
            <div id="visitor-counter">
            </div>
        </div>
    </header>

    <main id="app-content">
    </main>

    <footer id="ticker">
    </footer>
<template id="product-card-template">
    <div class="product-card">
        <img src="uploads/product_images/placeholder.jpg" alt="Product Image">
        <h3 class="product-name"></h3>
        <p class="product-brand"></p>
        <p class="product-price"></p>
        <div class="card-actions">
            <a href="#" class="btn-detail">Details</a>
            <button class="btn-compare">Compare</button>
        </div>
    </div>
</template>
    <script type="module" src="assets/js/app.js"></script>
</body>
</html>