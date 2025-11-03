// 🔐 Xử lý đăng nhập
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");
  
    message.textContent = "Đang xử lý...";
    message.className = "";
  
    try {
      const response = await fetch("https://banhngot.fitlhu.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
  
      const data = await response.json();
  
      if (data.success) {
        message.textContent = data.message;
        message.className = "success";
  
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("username", data.data.username);
  
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } else {
        message.textContent = data.message || "Đăng nhập thất bại!";
        message.className = "error";
      }
    } catch (error) {
      console.error(error);
      message.textContent = "Không thể kết nối tới máy chủ!";
      message.className = "error";
    }
  });
  
  // 👁 Hiện / ẩn mật khẩu
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
  
    // Đổi icon khi bật/tắt
    togglePassword.textContent = type === "password" ? "👁" : "🙈";
  });
  