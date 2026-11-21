(() => {
  "use strict";
  const products = [
    {id:1,name:"AirPod Pro 3",category:"accessories",price:120,tag:"MRW pick",image:"assets/airpod-pro-3.jpg"},
    {id:2,name:"Classic Low-Top Sneaker",category:"footwear",price:78,tag:"New",image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"},
    {id:3,name:"Essential Cotton Tee",category:"clothing",price:32,tag:"Everyday essential",image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"},
    {id:4,name:"Minimalist Everyday Watch",category:"accessories",price:92,tag:"",image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"},
    {id:5,name:"Relaxed Weekend Layers",category:"clothing",price:56,tag:"",image:"https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80"},
    {id:6,name:"Structured Carryall Bag",category:"accessories",price:48,tag:"",image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80"}
  ];
  const $ = (selector) => document.querySelector(selector);
  const grid = $("#product-grid");
  const searchInput = $("#product-search");
  const sortSelect = $("#sort-products");
  const emptyState = $("#empty-state");
  const bagDrawer = $("#bag-drawer");
  const backdrop = $("#drawer-backdrop");
  const bagItems = $("#bag-items");
  const menu = $(".main-nav");
  const menuToggle = $(".menu-toggle");
  const money = (amount) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(amount);
  let activeCategory = "all";
  let cart = loadCart();
  let toastTimer;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem("mrw-cart") || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter((item) => item && products.some((product) => product.id === item.id) && Number.isSafeInteger(item.quantity) && item.quantity > 0);
    } catch { return []; }
  }
  function saveCart() {
    try { localStorage.setItem("mrw-cart", JSON.stringify(cart)); }
    catch { /* The bag still works for this visit if storage is unavailable. */ }
  }
  function setActiveCategory(category) {
    activeCategory = category;
    document.querySelectorAll(".filter-button").forEach((button) => {
      const isActive = button.dataset.category === category;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    document.querySelectorAll("[data-nav-category]").forEach((link) => link.classList.toggle("active", link.dataset.navCategory === category));
    renderProducts();
  }
  function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const visible = products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesSearch = (product.name + " " + product.category).toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    switch (sortSelect.value) {
      case "price-low": visible.sort((a,b) => a.price - b.price); break;
      case "price-high": visible.sort((a,b) => b.price - a.price); break;
      case "name": visible.sort((a,b) => a.name.localeCompare(b.name)); break;
    }
    grid.replaceChildren();
    emptyState.hidden = visible.length !== 0;
    visible.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      const imageWrap = document.createElement("div");
      imageWrap.className = "product-image-wrap";
      const image = document.createElement("img");
      image.className = "product-image";
      image.src = product.image;
      image.alt = product.name;
      image.loading = "lazy";
      image.onerror = () => { image.onerror = null; image.src = "https://placehold.co/800x940/f0eee8/777?text=MRW"; };
      imageWrap.append(image);
      if (product.tag) {
        const tag = document.createElement("span");
        tag.className = "product-tag";
        tag.textContent = product.tag;
        imageWrap.append(tag);
      }
      const add = document.createElement("button");
      add.className = "quick-add";
      add.type = "button";
      add.dataset.add = String(product.id);
      add.textContent = "Add to bag +";
      add.setAttribute("aria-label", "Add " + product.name + " to bag");
      imageWrap.append(add);
      const info = document.createElement("div");
      info.className = "product-info";
      const description = document.createElement("div");
      const name = document.createElement("h3");
      name.className = "product-name";
      name.textContent = product.name;
      const category = document.createElement("p");
      category.className = "product-category";
      category.textContent = product.category;
      description.append(name, category);
      const price = document.createElement("p");
      price.className = "product-price";
      price.textContent = money(product.price);
      info.append(description, price);
      card.append(imageWrap, info);
      grid.append(card);
    });
  }
  function addToCart(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({id,quantity:1});
    saveCart();
    renderCart();
    showToast(product.name + " added to your bag");
  }
  function changeQuantity(id, amount) {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity += amount;
    cart = cart.filter((entry) => entry.quantity > 0);
    saveCart();
    renderCart();
  }
  function renderCart() {
    const count = cart.reduce((sum,item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum,item) => {
      const product = products.find((entry) => entry.id === item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    $("#bag-count").textContent = String(count);
    $("#drawer-count").textContent = "(" + count + ")";
    $("#bag-subtotal").textContent = money(subtotal);
    bagItems.replaceChildren();
    if (cart.length === 0) {
      const empty = document.createElement("p");
      empty.className = "bag-empty";
      empty.textContent = "Your bag is waiting for something good.";
      bagItems.append(empty);
      return;
    }
    cart.forEach((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) return;
      const row = document.createElement("div");
      row.className = "bag-item";
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = "";
      image.loading = "lazy";
      image.onerror = () => { image.onerror = null; image.src = "https://placehold.co/160x190/f0eee8/777?text=MRW"; };
      const details = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = product.name;
      const price = document.createElement("p");
      price.textContent = money(product.price);
      const controls = document.createElement("div");
      controls.className = "quantity-controls";
      const minus = document.createElement("button");
      minus.type = "button";
      minus.dataset.quantity = "-1";
      minus.dataset.id = String(product.id);
      minus.setAttribute("aria-label", "Decrease quantity of " + product.name);
      minus.textContent = "−";
      const quantity = document.createElement("span");
      quantity.textContent = String(item.quantity);
      const plus = document.createElement("button");
      plus.type = "button";
      plus.dataset.quantity = "1";
      plus.dataset.id = String(product.id);
      plus.setAttribute("aria-label", "Increase quantity of " + product.name);
      plus.textContent = "+";
      controls.append(minus, quantity, plus);
      details.append(name, price, controls);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-item";
      remove.dataset.remove = String(product.id);
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + product.name + " from bag");
      row.append(image, details, remove);
      bagItems.append(row);
    });
  }
  function openBag() {
    backdrop.hidden = false;
    bagDrawer.inert = false;
    bagDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => bagDrawer.classList.add("open"));
    $("#bag-close").focus();
  }
  function closeBag() {
    if (!bagDrawer.classList.contains("open")) return;
    bagDrawer.classList.remove("open");
    bagDrawer.setAttribute("aria-hidden", "true");
    bagDrawer.inert = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
    $("#bag-open").focus();
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("mrw-theme", theme); }
    catch { /* Theme still changes for this visit if storage is unavailable. */ }
    $("#theme-toggle").setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    $("#theme-toggle").textContent = theme === "dark" ? "☼" : "◐";
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#171715" : "#f7f6f2";
  }
  try {
    const savedTheme = localStorage.getItem("mrw-theme");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
  } catch { /* Keep the default light theme. */ }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(Number(button.dataset.add));
  });
  bagItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity]");
    const removeButton = event.target.closest("[data-remove]");
    if (quantityButton) changeQuantity(Number(quantityButton.dataset.id), Number(quantityButton.dataset.quantity));
    if (removeButton) {
      cart = cart.filter((item) => item.id !== Number(removeButton.dataset.remove));
      saveCart();
      renderCart();
    }
  });
  document.querySelectorAll(".filter-button").forEach((button) => button.addEventListener("click", () => setActiveCategory(button.dataset.category)));
  document.querySelectorAll("[data-nav-category]").forEach((link) => {
    link.addEventListener("click", () => {
      setActiveCategory(link.dataset.navCategory);
      menu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    });
  });
  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
  $("#theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#bag-open").addEventListener("click", openBag);
  $("#bag-close").addEventListener("click", closeBag);
  backdrop.addEventListener("click", closeBag);
  $("#checkout-button").addEventListener("click", () => showToast("Checkout is a preview — payments are not enabled yet."));
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (bagDrawer.classList.contains("open")) closeBag();
    if (menu.classList.contains("open")) {
      menu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.focus();
    }
  });
  $("#year").textContent = String(new Date().getFullYear());
  renderProducts();
  renderCart();
})();