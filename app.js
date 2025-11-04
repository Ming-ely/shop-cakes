const API = "https://banhngot.fitlhu.com/api/cakes";

// Auth
function getToken(){
  return localStorage.getItem("token") || localStorage.getItem("authToken");
}
const token = getToken();
if(!token){
  alert("Bạn chưa đăng nhập. Chuyển về trang đăng nhập.");
  window.location.href = "/login.html";
}

// DOM
const grid = document.getElementById("grid");
const alertBox = document.getElementById("alert");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const perPageSelect = document.getElementById("perPage");
const stats = document.getElementById("stats");
const pageInfo = document.getElementById("pageInfo");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModal");
const form = document.getElementById("form");
const cakeIdField = document.getElementById("cakeId");
const nameField = document.getElementById("name");
const imageField = document.getElementById("image");
const priceField = document.getElementById("price");
const stockField = document.getElementById("stock");
const categoryField = document.getElementById("category");
const descField = document.getElementById("description");
const tpl = document.getElementById("cardTpl");
const btnNew = document.getElementById("btnNew");
const btnLogout = document.getElementById("btnLogout");
const btnMyCakes = document.getElementById("btnMyCakes");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

// state
let state = {
  items: [],
  filtered: [],
  page: 1,
  perPage: Number(perPageSelect.value),
  q: '',
  category: '',
  mode: 'all' // 'all' hoặc 'my'
};

// fetch wrapper
async function api(path = "", opts = {}){
  const headers = opts.headers || {};
  headers['Authorization'] = `Bearer ${token}`;
  if(opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']){
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path.startsWith("http") ? path : API + path, {...opts, headers});
  const text = await res.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : null } catch(e){ data = text; }
  if(!res.ok) throw new Error(data?.message || `${res.status} ${res.statusText}`);
  return data;
}

// load list
async function loadAll(){
  showAlert('Đang tải danh sách...', 'info');
  try{
    const data = await api(""); // GET /api/cakes
    const items = Array.isArray(data) ? data : (data.data || data.items || []);
    state.items = items;
    buildFilters();
    applyFilters();
    hideAlert();
  }catch(e){
    showAlert("Lỗi tải sản phẩm: " + e.message, 'error');
  }
}

// ✅ load user cakes
async function loadMyCakes(){
  showAlert('Đang tải bánh của bạn...', 'info');
  try{
    const data = await api("/my");
    const items = Array.isArray(data) ? data : (data.data || data.items || []);
    state.items = items;
    state.mode = 'my';
    buildFilters();
    applyFilters();
    hideAlert();
    document.querySelector("h2").textContent = "Bánh của tôi 🍩";
  }catch(e){
    showAlert("Lỗi tải bánh cá nhân: " + e.message, 'error');
  }
}

// build category filter
function buildFilters(){
  const cats = Array.from(new Set(state.items.map(i => (i.category || 'Chung').trim()).filter(Boolean)));
  categoryFilter.innerHTML = `<option value="">— Tất cả danh mục —</option>`;
  for(const c of cats){
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    categoryFilter.appendChild(opt);
  }
}

function applyFilters(){
  const q = state.q.toLowerCase();
  const cat = state.category;
  let filtered = state.items.filter(it => {
    const hay = `${it.name||''} ${it.description||''} ${it.category||''}`.toLowerCase();
    if(cat && (it.category||'') !== cat) return false;
    if(q && !hay.includes(q)) return false;
    return true;
  });
  state.filtered = filtered;
  renderPage();
}

function renderPage(){
  const per = state.perPage;
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / per));
  if(state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * per;
  const pageItems = state.filtered.slice(start, start + per);

  pageInfo.textContent = `Trang ${state.page} / ${totalPages} — ${total} bánh`;
  stats.textContent = `${total} kết quả`;

  grid.innerHTML = "";
  if(pageItems.length === 0){
    grid.innerHTML = `<div class="muted" style="padding:20px">Không có sản phẩm để hiển thị.</div>`;
    return;
  }
  for(const it of pageItems){
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.card');
    const img = node.querySelector('.thumb');
    const title = node.querySelector('.title');
    const catEl = node.querySelector('.cat');
    const priceEl = node.querySelector('.price');
    const desc = node.querySelector('.desc');
    const btnEdit = node.querySelector('.edit');
    const btnDel = node.querySelector('.delete');

    img.src = it.image || it.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';
    title.textContent = it.name || 'Không tên';
    catEl.textContent = it.category || 'Chung';
    priceEl.textContent = (it.price != null) ? Number(it.price).toLocaleString('vi-VN') + ' đ' : '-';
    desc.textContent = (it.description || '').slice(0,120);

    btnEdit.addEventListener('click', ()=> openEdit(it));
    btnDel.addEventListener('click', ()=> removeCake(it));

    grid.appendChild(node);
  }
}

// modal create/edit/delete (giữ nguyên)
function openCreate(){ cakeIdField.value=''; modalTitle.textContent="Tạo bánh mới"; form.reset(); modal.setAttribute('aria-hidden','false'); }
function openEdit(item){ cakeIdField.value=item._id||item.id||''; modalTitle.textContent="Cập nhật bánh"; nameField.value=item.name||''; imageField.value=item.image||''; priceField.value=item.price??''; stockField.value=item.stock??''; categoryField.value=item.category||''; descField.value=item.description||''; modal.setAttribute('aria-hidden','false'); }
function closeModal(){ modal.setAttribute('aria-hidden','true'); }

form.addEventListener('submit', async ev=>{
  ev.preventDefault();
  const id = cakeIdField.value.trim();
  const payload = {
    name: nameField.value.trim(),
    image: imageField.value.trim() || undefined,
    price: priceField.value ? Number(priceField.value) : undefined,
    stock: stockField.value ? Number(stockField.value) : undefined,
    category: categoryField.value.trim() || undefined,
    description: descField.value.trim() || undefined
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
  try{
    if(id){
      await api(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showAlert('Cập nhật thành công', 'success');
    }else{
      await api('', { method: 'POST', body: JSON.stringify(payload) });
      showAlert('Tạo bánh thành công', 'success');
    }
    closeModal();
    (state.mode === 'my') ? await loadMyCakes() : await loadAll();
  }catch(e){ showAlert('Lỗi lưu: ' + e.message, 'error'); }
});

async function removeCake(item){
  const id = item._id || item.id;
  if(!id || !confirm(`Xác nhận xóa "${item.name}" ?`)) return;
  try{
    await api(`/${id}`, { method:'DELETE' });
    showAlert('Xóa thành công', 'success');
    (state.mode === 'my') ? await loadMyCakes() : await loadAll();
  }catch(e){ showAlert('Xóa lỗi: ' + e.message, 'error'); }
}

function showAlert(msg,type='info'){ alertBox.hidden=false; alertBox.textContent=msg; alertBox.style.display='block';
  if(type==='error') alertBox.style.background='linear-gradient(90deg,#fecaca,#f87171)',alertBox.style.color='#200';
  else if(type==='success') alertBox.style.background='linear-gradient(90deg,#a7f3d0,#34d399)',alertBox.style.color='#032';
  else alertBox.style.background='linear-gradient(90deg,#fef3c7,#fcd34d)',alertBox.style.color='#2b2b00';
  setTimeout(()=>{ alertBox.hidden=true; alertBox.style.display='none'; },3000);
}
function hideAlert(){ alertBox.hidden=true; alertBox.style.display='none'; }

// filters & pagination
let searchTimer=null;
searchInput.addEventListener('input', ()=>{ clearTimeout(searchTimer); searchTimer=setTimeout(()=>{ state.q=searchInput.value.trim(); state.page=1; applyFilters(); },350); });
categoryFilter.addEventListener('change', ()=>{ state.category=categoryFilter.value; state.page=1; applyFilters(); });
perPageSelect.addEventListener('change', ()=>{ state.perPage=Number(perPageSelect.value); state.page=1; renderPage(); });
prevBtn.addEventListener('click', ()=>{ if(state.page>1){ state.page--; renderPage(); } });
nextBtn.addEventListener('click', ()=>{ const totalPages=Math.max(1,Math.ceil(state.filtered.length/state.perPage)); if(state.page<totalPages){ state.page++; renderPage(); } });

// controls
closeModalBtn.addEventListener('click', closeModal);
document.getElementById("cancel").addEventListener('click', closeModal);
window.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
btnNew.addEventListener('click', openCreate);
btnLogout.addEventListener('click', ()=>{ localStorage.removeItem('token'); localStorage.removeItem('authToken'); window.location.href='/login.html'; });

// ✅ nút xem bánh cá nhân
btnMyCakes.addEventListener('click', ()=>{
  if(state.mode === 'my'){ // nếu đang ở my thì trở lại all
    state.mode = 'all';
    document.querySelector("h2").textContent = "Danh sách bánh";
    loadAll();
  } else {
    loadMyCakes();
  }
});

// khởi động
loadAll();

// hiệu ứng rơi
(function makeFalling(){
  const cont=document.getElementById('falling');
  if(!cont)return;
  const count=18;
  for(let i=0;i<count;i++){
    const el=document.createElement('div');
    el.className='falling-item';
    el.style.left=Math.random()*100+'vw';
    el.style.animationDuration=(10+Math.random()*18)+'s';
    el.style.top=(-10-Math.random()*20)+'vh';
    el.style.opacity=0.9;
    el.innerHTML=Math.random()>0.6?
      `<svg width="28" height="28" viewBox="0 0 24 24"><path fill="#ffd166" d="M12 2c1.1 0 2 .9 2 2 0 .75-.4 1.4-1 1.72C13.6 6.3 15 7.91 15 10c0 2.21-1.79 4-4 4s-4-1.79-4-4c0-2.09 1.4-3.7 2.99-4.28C10.4 5.4 10 4.75 10 4c0-1.1.9-2 2-2z"/></svg>`
      :`<div style="width:26px;height:26px;border-radius:6px;background:linear-gradient(90deg,#ffb347,#ff416c)"></div>`;
    cont.appendChild(el);
  }
})();