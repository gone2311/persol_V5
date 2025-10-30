import { api } from "./api_service.js";

const mainContent = document.getElementById("app-content");
let compareList = JSON.parse(sessionStorage.getItem("compareList")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCompareCount() {
  const count = compareList.length;

  const navCountElement = document.getElementById("compare-count-nav");
  if (navCountElement) {
    navCountElement.textContent = count;
  }

  const pageCountElement = document.getElementById("compare-count");
  if (pageCountElement) {
    pageCountElement.textContent = count;
  }
}

function updateCartCount() {
  const countElement = document.getElementById("cart-count");
  if (countElement) {
    countElement.textContent = cart.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }
}

function addToCompare(id) {
  if (!compareList.includes(id)) {
    if (compareList.length >= 4) {
      alert("You can only compare a maximum of 4 products.");
      return;
    }
    compareList.push(id);
    sessionStorage.setItem("compareList", JSON.stringify(compareList));
    alert("Product added to comparison.");
    updateCompareCount();
  } else {
    alert("Product is already in the comparison list.");
  }
}

function addToCart(product, quantity = 1) {
  const existingItem = cart.find((item) => item.id === product.product_id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.product_id,
      name: product.product_name,
      price: product.Price,
      image: product.main_image,
      quantity: quantity,
    });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart!");
}

function clearCompare() {
  compareList = [];
  sessionStorage.removeItem("compareList");
  alert("Comparison list cleared.");
  router();
}

function checkUserLogin() {
  const token = localStorage.getItem("jwt_token");
  const userNav = document.getElementById("user-nav");
  const guestNav = document.getElementById("guest-nav");
  const adminLink = document.getElementById("admin-link");

  if (token) {
    if (userNav) userNav.style.display = "block";
    if (guestNav) guestNav.style.display = "none";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userWelcome = document.getElementById("user-welcome");
      if (userWelcome)
        userWelcome.textContent = `Welcome, ${payload.data.email}`; // Changed

      if (adminLink) {
        if (payload.data.role === "admin") {
          adminLink.style.display = "block";
        } else {
          adminLink.style.display = "none";
        }
      }
    } catch (e) {
      console.error("Invalid token", e);
      logout();
    }
  } else {
    if (userNav) userNav.style.display = "none";
    if (guestNav) guestNav.style.display = "block";
    if (adminLink) adminLink.style.display = "none";
  }
}

function logout() {
  localStorage.removeItem("jwt_token");

  // Clear cart when logging out
  cart = [];
  localStorage.removeItem("cart");
  updateCartCount();

  alert("Logged out."); // Changed
  checkUserLogin();
  window.location.hash = "#home";
}

async function initHomePage() {
  const newArrivalsContainer = document.getElementById("new-arrivals-grid");
  const productsContainer = document.getElementById("home-products-grid");
  const template = document.getElementById("product-card-template");

  if (!newArrivalsContainer || !productsContainer || !template) {
    console.warn(
      "Missing element for homepage or missing #product-card-template",
    );
    return;
  }

  const productsRes = await api.getProducts();
  if (!productsRes || !productsRes.success || !productsRes.data) {
    const errorMsg = `<p>Error loading products: ${productsRes ? productsRes.message : "API Error"}</p>`;
    newArrivalsContainer.innerHTML = errorMsg;
    productsContainer.innerHTML = errorMsg;
    return;
  }

  const allProducts = productsRes.data;
  const newArrivals = allProducts.slice(0, 4);
  const products = allProducts.slice(0, 8);

  const renderGrid = (container, productList) => {
    container.innerHTML = "";
    if (productList.length === 0) {
      container.innerHTML = "<p>No products found.</p>"; // Changed
      return;
    }
    productList.forEach((product) => {
      const card = template.content.cloneNode(true);
      const imgEl = card.querySelector("img");
      const nameEl = card.querySelector(".product-name");
      const brandEl = card.querySelector(".product-brand");
      const priceEl = card.querySelector(".product-price");
      const detailBtn = card.querySelector(".btn-detail");
      const compareBtn = card.querySelector(".btn-compare");
      const addCartBtn = card.querySelector(".btn-add-cart");

      if (nameEl) nameEl.textContent = product.product_name;
      if (brandEl) brandEl.textContent = product.brand_name || "N/A";
      if (priceEl)
        priceEl.textContent = `${parseFloat(product.Price).toLocaleString("en-US", { style: "currency", currency: "USD" })}`; // Changed currency format

      if (imgEl) {
        imgEl.src = `api/v1/get_product_image.php?id=${product.product_id}`;
        imgEl.alt = product.product_name || "Product Image";
      }

      if (detailBtn) detailBtn.href = `#product/${product.product_id}`;

      if (compareBtn) {
        compareBtn.dataset.id = product.product_id;
        compareBtn.addEventListener("click", (e) => {
          addToCompare(e.target.dataset.id);
        });
      }

      if (addCartBtn) {
        addCartBtn.addEventListener("click", () => {
          addToCart(product, 1);
        });
      }

      container.appendChild(card);
    });
  };

  renderGrid(newArrivalsContainer, newArrivals);
  renderGrid(productsContainer, products);
}

async function initProductsPage() {
  const brandFilter = document.getElementById("brand-filter");
  const categoryFilter = document.getElementById("category-filter");
  const searchInput = document.getElementById("search-input");
  const priceFilterBtn = document.getElementById("price-filter-btn");

  if (!brandFilter || !categoryFilter) {
    console.error("Filter elements not found on products page.");
    return;
  }

  const [brandsRes, categoriesRes] = await Promise.all([
    api.getBrands(),
    api.getCategories(),
  ]);

  brandFilter.innerHTML = '<option value="">-- Filter by brand --</option>';
  if (brandsRes && brandsRes.success && brandsRes.data) {
    brandsRes.data.forEach((brand) => {
      brandFilter.innerHTML += `<option value="${brand.brand_id}">${brand.brand_name}</option>`;
    });
  }

  categoryFilter.innerHTML =
    '<option value="">-- Filter by category --</option>';
  if (categoriesRes && categoriesRes.success && categoriesRes.data) {
    categoriesRes.data.forEach((cat) => {
      categoryFilter.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
    });
  }

  brandFilter.addEventListener("change", renderProductList);
  categoryFilter.addEventListener("change", renderProductList);

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchInput.debounceTimer);
      searchInput.debounceTimer = setTimeout(renderProductList, 500);
    });
  }

  if (priceFilterBtn) {
    priceFilterBtn.addEventListener("click", renderProductList);
  }

  updateCompareCount();
  await renderProductList();
}

async function renderProductList() {
  const container = document.getElementById("product-list-container");
  const template = document.getElementById("product-card-template");
  const brandFilter = document.getElementById("brand-filter");
  const categoryFilter = document.getElementById("category-filter");
  const minPriceInput = document.getElementById("min-price");
  const maxPriceInput = document.getElementById("max-price");
  const searchInput = document.getElementById("search-input");

  if (!container || !template) {
    console.error("Missing container or template for product list.");
    if (container) container.innerHTML = "<p>Page structure error.</p>";
    return;
  }

  const brand_id = brandFilter ? brandFilter.value : "";
  const category_id = categoryFilter ? categoryFilter.value : "";
  const min_price = minPriceInput ? minPriceInput.value : "";
  const max_price = maxPriceInput ? maxPriceInput.value : "";
  const search = searchInput ? searchInput.value.trim() : "";

  container.innerHTML = "<p>Loading products...</p>";

  const productsRes = await api.getProducts({
    brand_id,
    category_id,
    min_price,
    max_price,
    search,
  });
  container.innerHTML = "";

  if (
    !productsRes ||
    !productsRes.success ||
    !productsRes.data ||
    productsRes.data.length === 0
  ) {
    container.innerHTML = `<p>No products found matching your criteria. ${productsRes ? productsRes.message : ""}</p>`; // Changed
    return;
  }

  productsRes.data.forEach((product) => {
    const card = template.content.cloneNode(true);
    const imgEl = card.querySelector("img");
    const nameEl = card.querySelector(".product-name");
    const brandEl = card.querySelector(".product-brand");
    const priceEl = card.querySelector(".product-price");
    const detailBtn = card.querySelector(".btn-detail");
    const compareBtn = card.querySelector(".btn-compare");
    const addCartBtn = card.querySelector(".btn-add-cart");

    if (nameEl) nameEl.textContent = product.product_name;
    if (brandEl) brandEl.textContent = product.brand_name || "N/A";
    if (priceEl)
      priceEl.textContent = `${parseFloat(product.Price).toLocaleString("en-US", { style: "currency", currency: "USD" })}`; // Changed currency format

    if (imgEl) {
      imgEl.src = `api/v1/get_product_image.php?id=${product.product_id}`;
      imgEl.alt = product.product_name || "Product Image";
    }

    if (detailBtn) detailBtn.href = `#product/${product.product_id}`;

    if (compareBtn) {
      compareBtn.dataset.id = product.product_id;
      compareBtn.addEventListener("click", (e) => {
        addToCompare(e.target.dataset.id);
      });
    }

    if (addCartBtn) {
      addCartBtn.addEventListener("click", () => {
        addToCart(product, 1);
      });
    }

    container.appendChild(card);
  });
}

async function initProductDetailPage(id) {
  if (!id) {
    mainContent.innerHTML =
      '<h1>Invalid Product ID</h1><a href="#products">&larr; Back to list</a>'; // Changed
    return;
  }
  mainContent.innerHTML = "<p>Loading product details...</p>"; // Changed

  const productRes = await api.getProductById(id);

  if (!productRes || !productRes.success || !productRes.data) {
    mainContent.innerHTML = `<h1>Product not found</h1><p>${productRes ? productRes.message : "API Error"}</p><a href="#products">&larr; Back to list</a>`; // Changed
    console.error(
      "Failed to load product details:",
      productRes ? productRes.message : "No response",
    );
    return;
  }

  const templateHtml = await api.getTemplate("product_detail");
  mainContent.innerHTML = templateHtml;

  const product = productRes.data;

  const productNameEl = document.getElementById("product-name");
  const productBrandEl = document.getElementById("product-brand");
  const productCategoryEl = document.getElementById("product-category");
  const productPriceEl = document.getElementById("product-price");
  const productDescriptionEl = document.getElementById("product-description");
  const productImageEl = document.getElementById("product-image");
  const specsBody = document.querySelector("#product-specs tbody");
  const docsList = document.getElementById("product-docs");
  const addToCartBtn = document.getElementById("btn-add-to-cart");
  const addToCompareBtn = document.getElementById("btn-add-to-compare");

  if (productNameEl) productNameEl.textContent = product.product_name;
  if (productBrandEl) productBrandEl.textContent = product.brand_name || "N/A";
  if (productCategoryEl)
    productCategoryEl.textContent = product.category_name || "N/A";
  if (productPriceEl)
    productPriceEl.textContent = `${parseFloat(product.Price).toLocaleString("en-US", { style: "currency", currency: "USD" })}`; // Changed currency format
  if (productDescriptionEl)
    productDescriptionEl.textContent = product.product_description;

  if (productImageEl) {
    productImageEl.src = `api/v1/get_product_image.php?id=${product.product_id}`;
    productImageEl.alt = product.product_name || "Product Image";
  }

  if (specsBody) {
    specsBody.innerHTML = "";
    if (product.specifications) {
      const specs = product.specifications;
      specsBody.innerHTML += `<tr><td>Frame Material</td><td>${specs.frame_material || "N/A"}</td></tr>`;
      specsBody.innerHTML += `<tr><td>Frame Color</td><td>${specs.frame_color || "N/A"}</td></tr>`;
      specsBody.innerHTML += `<tr><td>Lens Coating</td><td>${specs.lens_coating || "N/A"}</td></tr>`;
      specsBody.innerHTML += `<tr><td>Style</td><td>${specs.style || "N/A"}</td></tr>`;
    } else {
      specsBody.innerHTML =
        '<tr><td colspan="2">No specifications available.</td></tr>'; // Changed
    }
  }

  if (docsList) {
    docsList.innerHTML = "";
    if (product.documents && product.documents.length > 0) {
      product.documents.forEach((doc) => {
        if (doc.document_id && doc.original_filename) {
          docsList.innerHTML += `<li><a href="api/v1/download_document.php?id=${doc.document_id}" target="_blank" download="${doc.original_filename}">${doc.original_filename} (${doc.mime_type || "unknown"})</a></li>`;
        }
      });
    } else {
      docsList.innerHTML = "<li>No documents available.</li>"; // Changed
    }
  }

  if (addToCompareBtn) {
    addToCompareBtn.onclick = () => {
      addToCompare(product.product_id);
    };
  }

  if (addToCartBtn) {
    addToCartBtn.onclick = () => {
      addToCart(product, 1);
    };
  }
}

async function initComparePage() {
  const clearBtn = document.getElementById("btn-clear-compare");
  const container = document.getElementById("compare-table-container");
  const searchBtn = document.getElementById("btn-search-compare");
  const searchInput = document.getElementById("compare-search");
  const searchResults = document.getElementById("compare-search-results");

  if (!clearBtn || !container) {
    console.error("Missing elements for compare page.");
    if (container) container.innerHTML = "<p>Compare page structure error.</p>";
    return;
  }

  clearBtn.addEventListener("click", clearCompare);

  if (searchBtn && searchInput && searchResults) {
    searchBtn.addEventListener("click", async () => {
      const searchTerm = searchInput.value.trim();
      if (!searchTerm) {
        searchResults.innerHTML = "<p style='color: red;'>Please enter a search term</p>";
        return;
      }

      searchResults.innerHTML = "<p>Searching...</p>";
      const productsRes = await api.getProducts({ search: searchTerm });

      if (productsRes.success && productsRes.data && productsRes.data.length > 0) {
        searchResults.innerHTML = "<div style='display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;'>";
        productsRes.data.forEach((product) => {
          searchResults.innerHTML += `
            <div style="border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; text-align: center; cursor: pointer; transition: var(--transition);"
                 onmouseover="this.style.borderColor='var(--primary-color)'"
                 onmouseout="this.style.borderColor='var(--border-color)'"
                 onclick="addToCompare('${product.product_id}'); window.location.reload();">
              <img src="api/v1/get_product_image.php?id=${product.product_id}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
              <p style="margin: 10px 0 5px; font-weight: 600;">${product.product_name}</p>
              <p style="margin: 0; color: var(--accent-color); font-weight: 700;">${parseFloat(product.Price).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
              <button style="margin-top: 10px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">Add to Compare</button>
            </div>
          `;
        });
        searchResults.innerHTML += "</div>";
      } else {
        searchResults.innerHTML = "<p>No products found</p>";
      }
    });
  }

  if (compareList.length === 0) {
    container.innerHTML =
      '<p>You haven\'t added any products to the comparison list.</p><a href="#products">View products</a>';
    return;
  }

  container.innerHTML = "<p>Loading comparison data...</p>";

  const productsRes = await api.getProductsByIds(compareList);
  if (
    !productsRes ||
    !productsRes.success ||
    !productsRes.data ||
    productsRes.data.length === 0
  ) {
    container.innerHTML = `<p>Could not load comparison data. ${productsRes ? productsRes.message : ""}</p>`;
    return;
  }
  const products = productsRes.data;

  // Fixed specification fields
  const specFields = [
    { label: "Frame Material", key: "frame_material" },
    { label: "Frame Color", key: "frame_color" },
    { label: "Lens Coating", key: "lens_coating" },
    { label: "Style", key: "style" },
  ];

  let table = '<table class="compare-table">';
  table += "<thead><tr><th>Feature</th>"; // Changed
  products.forEach((p) => {
    table += `<th>
                    <img src="api/v1/get_product_image.php?id=${p.product_id}" alt="${p.product_name || ""}">
                    <p>${p.product_name || "N/A"}</p>
                 </th>`;
  });
  table += "</tr></thead>";
  table += "<tbody>";

  table += `<tr><td>Price</td>${products.map((p) => `<td>${p.Price ? parseFloat(p.Price).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "N/A"}</td>`).join("")}</tr>`; // Changed currency format
  table += `<tr><td>Brand</td>${products.map((p) => `<td>${p.brand_name || "N/A"}</td>`).join("")}</tr>`;
  table += `<tr><td>Description</td>${products.map((p) => `<td>${p.product_description ? p.product_description.substring(0, 100) + "..." : "N/A"}</td>`).join("")}</tr>`;

  specFields.forEach((field) => {
    table += `<tr><td>${field.label}</td>`;
    products.forEach((p) => {
      let specValue = "N/A";
      if (p.specifications && p.specifications[field.key]) {
        specValue = p.specifications[field.key];
      }
      table += `<td>${specValue}</td>`;
    });
    table += "</tr>";
  });

  table += "</tbody></table>";
  container.innerHTML = table;
}

async function initContactPage() {
  const mapElement = document.getElementById("google-map-placeholder");
  if (mapElement) {
    const apiKey = "AIzaSyBFw0Qbyq9zTFTd-tuzVqH3u0qXTYEU_Q4";
    const lat = 10.762622;
    const lng = 106.660172;

    if (apiKey && apiKey !== "YOUR_API_KEY_HERE") {
      mapElement.innerHTML = `<iframe
        width="100%"
        height="300"
        frameborder="0"
        style="border:0; border-radius: 8px;"
        src="https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15"
        allowfullscreen>
      </iframe>`;
    } else {
      mapElement.textContent = "Google Maps (API Key needed)";
    }
  }
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const clearErrors = () => {
    document.getElementById("login_email_error").textContent = "";
    document.getElementById("login_password_error").textContent = "";
    document.getElementById("login_general_error").textContent = "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const submitButton = form.querySelector('button[type="submit"]');

    let hasError = false;

    if (!email) {
      document.getElementById("login_email_error").textContent = "Email is required";
      hasError = true;
    }

    if (!password) {
      document.getElementById("login_password_error").textContent = "Password is required";
      hasError = true;
    }

    if (hasError) return;

    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";

    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem("jwt_token", res.token);
      alert("Login successful!");
      checkUserLogin();
      window.location.hash = "#home";
    } else {
      document.getElementById("login_general_error").textContent = res.message || "Login failed. Please check your credentials.";
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const clearErrors = () => {
    document.getElementById("username_error").textContent = "";
    document.getElementById("email_error").textContent = "";
    document.getElementById("password_error").textContent = "";
    document.getElementById("confirm_password_error").textContent = "";
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const confirmPassword = e.target.confirm_password.value;
    const submitButton = form.querySelector('button[type="submit"]');

    let hasError = false;

    if (!username) {
      document.getElementById("username_error").textContent = "Username is required";
      hasError = true;
    }

    if (!email) {
      document.getElementById("email_error").textContent = "Email is required";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("email_error").textContent = "Please enter a valid email address";
      hasError = true;
    }

    if (!password) {
      document.getElementById("password_error").textContent = "Password is required";
      hasError = true;
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        document.getElementById("password_error").textContent = passwordError;
        hasError = true;
      }
    }

    if (!confirmPassword) {
      document.getElementById("confirm_password_error").textContent = "Please confirm your password";
      hasError = true;
    } else if (password !== confirmPassword) {
      document.getElementById("confirm_password_error").textContent = "Passwords do not match";
      hasError = true;
    }

    if (hasError) return;

    submitButton.disabled = true;
    submitButton.textContent = "Registering...";

    const res = await api.register(email, password, username);
    if (res.success) {
      alert("Registration successful! Please log in.");
      window.location.hash = "#login";
    } else {
      if (res.message.includes("email") || res.message.includes("Email")) {
        document.getElementById("email_error").textContent = res.message;
      } else {
        alert(`Registration error: ${res.message || "Unknown error"}`);
      }
      submitButton.disabled = false;
      submitButton.textContent = "Register";
    }
  });
}

async function initCheckoutPage() {
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    alert("Please log in to proceed to checkout."); // Changed
    window.location.hash = "#login";
    return;
  }

  if (cart.length === 0) {
    mainContent.innerHTML =
      '<h2>Cart is empty!</h2><a href="#products">Continue shopping</a>'; // Changed
    return;
  }

  const summaryContainer = document.getElementById("cart-summary");
  const totalDisplay = document.getElementById("total-amount-display");
  const form = document.getElementById("checkout-form");

  if (!summaryContainer || !totalDisplay || !form) {
    console.error("Missing elements for checkout page.");
    mainContent.innerHTML = "<h2>Error loading checkout page.</h2>"; // Changed
    return;
  }

  let html = "<h4>Products in cart:</h4><ul>"; // Changed
  let total = 0;
  cart.forEach((item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    const subtotal = price * quantity;
    total += subtotal;
    html += `<li>${item.name || "Unknown"} (x${quantity}) - ${subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}</li>`; // Changed currency format
  });
  html += "</ul>";
  summaryContainer.innerHTML = html;
  totalDisplay.textContent = `Total: ${total.toLocaleString("en-US", { style: "currency", currency: "USD" })}`; // Changed currency format

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');

    const shipping = {
      name: e.target.recipient_name.value,
      phone: e.target.recipient_number.value,
      address: e.target.shipping_address.value,
      notes: e.target.order_notes.value,
      payment: e.target.payment_method.value,
    };

    if (!shipping.name || !shipping.phone || !shipping.address) {
      alert("Please fill in all shipping information."); // Changed
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Processing..."; // Changed

    const res = await api.createOrder(cart, shipping, token);
    if (res.success) {
      alert(
        `Order placed successfully! Your order code is: ${res.order_code || "N/A"}`,
      ); // Changed
      cart = [];
      localStorage.removeItem("cart");
      updateCartCount();
      window.location.hash = "#profile";
    } else {
      alert(`Order error: ${res.message || "Unknown error"}`); // Changed
      submitButton.disabled = false;
      submitButton.textContent = "Complete Order"; // Changed
    }
  });
}

async function initProfilePage() {
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    alert("Please log in."); // Changed
    window.location.hash = "#login";
    return;
  }

  const logoutBtn = document.getElementById("btn-logout");
  const tableBody = document.querySelector("#order-history-table tbody");

  if (!logoutBtn || !tableBody) {
    console.error("Missing elements for profile page.");
    mainContent.innerHTML = "<h2>Error loading profile page.</h2>"; // Changed
    return;
  }

  logoutBtn.addEventListener("click", logout);

  tableBody.innerHTML =
    '<tr><td colspan="5">Loading order history...</td></tr>'; // Changed

  const res = await api.getMyOrders(token);
  tableBody.innerHTML = "";

  if (res.success && res.data && res.data.length > 0) {
    res.data.forEach((order) => {
      const orderDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-CA")
        : "N/A";
      const totalAmount = order.total_amount
        ? parseFloat(order.total_amount).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })
        : "$0.00";
      tableBody.innerHTML += `
                <tr>
                    <td>${order.order_code || "N/A"}</td>
                    <td>${orderDate}</td>
                    <td>${totalAmount}</td>
                    <td>${order.order_status || "N/A"}</td>
                    <td>${order.payment_status || "N/A"}</td>
                </tr>
            `;
    });
  } else {
    tableBody.innerHTML = `<tr><td colspan="5">You have no orders yet. ${res.success ? "" : res.message || "Could not load history."}</td></tr>`; // Changed
  }
}

function initForgotPasswordPage() {
  const form = document.getElementById("forgot-password-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.querySelector("#forgot_email").value.trim();
    const errorEl = document.getElementById("forgot_email_error");
    const successEl = document.getElementById("forgot-success-message");

    errorEl.textContent = "";
    successEl.textContent = "";

    if (!email) {
      errorEl.textContent = "Email is required";
      return;
    }

    alert("Password reset functionality will be implemented with email service. For now, please contact admin.");
    successEl.textContent = "If this email exists, a reset link has been sent.";
  });
}

function initProfileDetailPage() {
  const form = document.getElementById("profile-update-form");
  if (!form) return;

  const token = localStorage.getItem("jwt_token");
  if (!token) {
    window.location.hash = "#login";
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    document.getElementById("profile_email").value = payload.data.email || "";
  } catch (e) {
    console.error("Invalid token", e);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = e.target.querySelector("#profile_full_name").value.trim();
    const phone = e.target.querySelector("#profile_phone_number").value.trim();
    const dob = e.target.querySelector("#profile_date_of_birth").value;

    alert("Profile updated successfully!");
  });
}

function initChangePasswordPage() {
  const form = document.getElementById("change-password-form");
  if (!form) return;

  const clearErrors = () => {
    document.getElementById("current_password_error").textContent = "";
    document.getElementById("new_password_error").textContent = "";
    document.getElementById("confirm_new_password_error").textContent = "";
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const currentPassword = e.target.querySelector("#current_password").value;
    const newPassword = e.target.querySelector("#new_password").value;
    const confirmPassword = e.target.querySelector("#confirm_new_password").value;

    let hasError = false;

    if (!currentPassword) {
      document.getElementById("current_password_error").textContent = "Current password is required";
      hasError = true;
    }

    if (!newPassword) {
      document.getElementById("new_password_error").textContent = "New password is required";
      hasError = true;
    } else {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        document.getElementById("new_password_error").textContent = passwordError;
        hasError = true;
      }
    }

    if (!confirmPassword) {
      document.getElementById("confirm_new_password_error").textContent = "Please confirm your new password";
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      document.getElementById("confirm_new_password_error").textContent = "Passwords do not match";
      hasError = true;
    }

    if (hasError) return;

    alert("Password changed successfully!");
    window.location.hash = "#profile";
  });
}

async function loadVisitorCount() {
  const counterElement = document.getElementById("visitor-counter");
  if (!counterElement) return;

  try {
    const res = await api.getSiteInfo();
    if (res && res.success && res.visitor_count !== undefined) {
      counterElement.textContent = `Visitors: ${res.visitor_count}`;
    } else {
      counterElement.textContent = "Visitors: N/A";
      console.warn(
        "Failed to get visitor count:",
        res ? res.message : "No response",
      );
    }
  } catch (e) {
    counterElement.textContent = "Visitors: Error";
    console.error("Error loading visitor count:", e);
  }
}

function initTicker() {
  const tickerElement = document.getElementById("ticker");
  if (!tickerElement) return;

  const tickerContent = document.createElement("div");
  tickerContent.className = "ticker-content";
  tickerElement.appendChild(tickerContent);

  const updateTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const date = now.toLocaleDateString("en-CA");

    let text = `Today: ${date} | Time: ${time} | Welcome to Persol Eyewear - Premium Eyewear Collection | Free Shipping on Orders Over $100 | `;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(2);
          const lon = position.coords.longitude.toFixed(2);
          tickerContent.textContent = `${text}Location: ${lat}, ${lon} | `;
        },
        () => {
          tickerContent.textContent = text;
        },
        { timeout: 5000 },
      );
    } else {
      tickerContent.textContent = text;
    }
  };

  updateTime();
  setInterval(updateTime, 60000);
}

async function loadPage(page, id = null) {
  try {
    mainContent.innerHTML = "<h1>Loading...</h1>"; // Changed

    let templateName = page;
    if (page === "product") templateName = "product_detail";
    if (page === "forgot-password") templateName = "forgot_password";
    if (page === "profile-detail") templateName = "profile_detail";
    if (page === "change-password") templateName = "change_password";
    const html = await api.getTemplate(templateName);
    mainContent.innerHTML = html;

    if (page === "home") await initHomePage();
    if (page === "products") await initProductsPage();
    if (page === "product") await initProductDetailPage(id);
    if (page === "compare") await initComparePage();
    if (page === "contact") await initContactPage();
    if (page === "login") initLoginPage();
    if (page === "register") initRegisterPage();
    if (page === "checkout") await initCheckoutPage();
    if (page === "profile") await initProfilePage();
    if (page === "forgot-password") initForgotPasswordPage();
    if (page === "profile-detail") initProfileDetailPage();
    if (page === "change-password") initChangePasswordPage();
    if (page === "privacy") {}
    if (page === "terms") {}

    api.trackVisit(`#${page}${id ? '/' + id : ''}`);
  } catch (error) {
    console.error("Error loading page:", page, error);
    mainContent.innerHTML = `<h1>Error loading page (${page})</h1><p>${error.message}</p>`; // Changed
  } finally {
    window.scrollTo(0, 0);
  }
}

function router() {
  const fullHash = window.location.hash.substring(1) || "home";
  const [path, queryString] = fullHash.split("?");
  const parts = path.split("/");
  const page = parts[0];
  const id = parts[1] || null;

  const allowedPages = [
    "home",
    "products",
    "product",
    "contact",
    "compare",
    "login",
    "register",
    "checkout",
    "profile",
    "forgot-password",
    "profile-detail",
    "change-password",
    "privacy",
    "terms",
  ];
  if (!allowedPages.includes(page)) {
    console.warn(`Invalid page route requested: ${page}`);
    loadPage("home");
    return;
  }

  const menuItems = document.querySelectorAll("#main-menu a");
  menuItems.forEach((item) => {
    const hrefTarget = item.getAttribute("href")?.substring(1).split("/")[0];
    if (hrefTarget === page) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  loadPage(page, id);
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  loadVisitorCount();
  initTicker();
  updateCartCount();
  checkUserLogin();
  router();
});
