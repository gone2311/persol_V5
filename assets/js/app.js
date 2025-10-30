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

  if (!brandFilter || !categoryFilter) {
    console.error("Filter elements not found on products page.");
    return;
  }

  const [brandsRes, categoriesRes] = await Promise.all([
    api.getBrands(),
    api.getCategories(),
  ]);

  brandFilter.innerHTML = '<option value="">-- Filter by brand --</option>'; // Changed
  if (brandsRes && brandsRes.success && brandsRes.data) {
    brandsRes.data.forEach((brand) => {
      brandFilter.innerHTML += `<option value="${brand.brand_id}">${brand.brand_name}</option>`;
    });
  }

  categoryFilter.innerHTML =
    '<option value="">-- Filter by category --</option>'; // Changed
  if (categoriesRes && categoriesRes.success && categoriesRes.data) {
    categoriesRes.data.forEach((cat) => {
      categoryFilter.innerHTML += `<option value="${cat.category_id}">${cat.category_name}</option>`;
    });
  }

  brandFilter.addEventListener("change", renderProductList);
  categoryFilter.addEventListener("change", renderProductList);

  updateCompareCount();
  await renderProductList();
}

async function renderProductList() {
  const container = document.getElementById("product-list-container");
  const template = document.getElementById("product-card-template");
  const brandFilter = document.getElementById("brand-filter");
  const categoryFilter = document.getElementById("category-filter");
  const minPriceInput = document.getElementById("min-price"); // Get price inputs
  const maxPriceInput = document.getElementById("max-price");

  if (!container || !template) {
    console.error("Missing container or template for product list.");
    if (container) container.innerHTML = "<p>Page structure error.</p>"; // Changed
    return;
  }

  const brand_id = brandFilter ? brandFilter.value : "";
  const category_id = categoryFilter ? categoryFilter.value : "";
  const min_price = minPriceInput ? minPriceInput.value : ""; // Read price values
  const max_price = maxPriceInput ? maxPriceInput.value : "";

  container.innerHTML = "<p>Loading products...</p>"; // Changed

  const productsRes = await api.getProducts({
    brand_id,
    category_id,
    min_price,
    max_price,
  }); // Pass prices
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

  if (!clearBtn || !container) {
    console.error("Missing elements for compare page.");
    if (container) container.innerHTML = "<p>Compare page structure error.</p>"; // Changed
    return;
  }

  clearBtn.addEventListener("click", clearCompare);

  if (compareList.length === 0) {
    container.innerHTML =
      '<p>You haven\'t added any products to the comparison list.</p><a href="#products">View products</a>'; // Changed
    return;
  }

  container.innerHTML = "<p>Loading comparison data...</p>"; // Changed

  const productsRes = await api.getProductsByIds(compareList);
  if (
    !productsRes ||
    !productsRes.success ||
    !productsRes.data ||
    productsRes.data.length === 0
  ) {
    container.innerHTML = `<p>Could not load comparison data. ${productsRes ? productsRes.message : ""}</p>`; // Changed
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
  const mapElement = document.getElementById("map-placeholder");
  if (mapElement) {
    mapElement.textContent =
      "(Google Maps will display here if you configure an API Key)"; // Changed
  }
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = "Logging in..."; // Changed

    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem("jwt_token", res.token);
      alert("Login successful!"); // Changed
      checkUserLogin();
      window.location.hash = "#home";
    } else {
      alert(`Login error: ${res.message || "Unknown error"}`); // Changed
      submitButton.disabled = false;
      submitButton.textContent = "Login"; // Changed
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = e.target.full_name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = "Registering..."; // Changed

    const res = await api.register(email, password, fullName);
    if (res.success) {
      alert("Registration successful! Please log in."); // Changed
      window.location.hash = "#login";
    } else {
      alert(`Registration error: ${res.message || "Unknown error"}`); // Changed
      submitButton.disabled = false;
      submitButton.textContent = "Register"; // Changed
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

  const updateTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const date = now.toLocaleDateString("en-CA");

    let locationText = " | Fetching location..."; // Changed

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(2);
          const lon = position.coords.longitude.toFixed(2);
          // Ensure tickerElement has content before splitting
          const currentTextParts = tickerElement.textContent.split("|");
          const currentTimeText =
            currentTextParts.length >= 2
              ? currentTextParts[0] + "|" + currentTextParts[1]
              : `Today: ${date} | Time: ${time}`;
          tickerElement.textContent = `${currentTimeText} | Location (approx.): ${lat}, ${lon}`; // Changed
        },
        () => {
          const currentTextParts = tickerElement.textContent.split("|");
          const currentTimeText =
            currentTextParts.length >= 2
              ? currentTextParts[0] + "|" + currentTextParts[1]
              : `Today: ${date} | Time: ${time}`;
          tickerElement.textContent = `${currentTimeText} | Could not get location.`; // Changed
        },
        { timeout: 5000 },
      );
      tickerElement.textContent = `Today: ${date} | Time: ${time}${locationText}`; // Changed
    } else {
      tickerElement.textContent = `Today: ${date} | Time: ${time} | Geolocation not supported by browser.`; // Changed
    }
  };

  updateTime();
  setInterval(updateTime, 60000);
}

async function loadPage(page, id = null) {
  try {
    mainContent.innerHTML = "<h1>Loading...</h1>"; // Changed

    const templateName = page === "product" ? "product_detail" : page;
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
