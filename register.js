const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  // ✅ Kiểm tra mật khẩu xác nhận
  if (password !== confirmPassword) {
    alert("❌ Mật khẩu xác nhận không khớp!");
    return;
  }

  try {
    const response = await fetch("https://banhngot.fitlhu.com/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    console.log("Phản hồi từ server:", data);

    if (data.success) {
      alert("✅ Đăng ký thành công!");
      // 👉 Lưu token vào localStorage (nếu muốn dùng để đăng nhập tự động)
      localStorage.setItem("token", data.data.token);
      // 👉 Điều hướng sang trang đăng nhập
      window.location.href = "login.html";
    } else {
      alert(`❌ Lỗi: ${data.message || "Không rõ nguyên nhân"}`);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    alert("❌ Không thể kết nối tới server. Vui lòng thử lại sau.");
  }
});
