const foodInput = document.getElementById('food-input');
const portionInput = document.getElementById('portion-input');
const searchBtn = document.getElementById('search-btn');
const camBtn = document.getElementById('cam-btn');
const closeCamBtn = document.getElementById('close-cam-btn');
const readerModal = document.getElementById('reader-modal');
const mealsTableBody = document.getElementById('meals-table-body');
const kcalVal = document.getElementById('kcal-val');
const kcalBar = document.getElementById('kcal-bar');

let refeicoes = [];
let html5QrCode = null;

document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem('nutrimeta_items');
  if (salvas) refeicoes = JSON.parse(salvas);
  atualizarTela();
});

if (camBtn) camBtn.addEventListener('click', abrirCamera);
if (closeCamBtn) closeCamBtn.addEventListener('click', fecharCamera);
if (searchBtn) searchBtn.addEventListener('click', buscarPorNome);

async function abrirCamera() {
  readerModal.style.display = 'flex';
  
  try {
    // Força o pedido de permissão da câmera do Android/WebView
    await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  } catch (err) {
    alert("Permissão de câmera negada ou indisponível nas configurações do app.");
    fecharCamera();
    return;
  }

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 150 } },
    (codigo) => {
      fecharCamera();
      consultarAPI(codigo);
    },
    (err) => {}
  ).catch(err => {
    alert("Erro ao iniciar leitor: " + err);
    fecharCamera();
  });
}

function fecharCamera() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      readerModal.style.display = 'none';
    }).catch(() => {
      readerModal.style.display = 'none';
    });
  } else {
    readerModal.style.display = 'none';
  }
}

async function consultarAPI(codigo) {
  const gramas = parseFloat(portionInput.value) || 100;
  const fator = gramas / 100;

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`);
    const data = await res.json();

    if (data.status === 1 && data.product) {
      const p = data.product;
      const n = p.nutriments || {};

      const nome = p.product_name_pt || p.product_name || "Produto Escaneado";
      const kcal = (n['energy-kcal_100g'] || n['energy-kcal'] || 0) * fator;
      const prot = (n.proteins_100g || n.proteins || 0) * fator;

      adicionarPrato(nome, gramas, kcal, prot);
    } else {
      alert("Produto não encontrado na base de dados.");
    }
  } catch (e) {
    alert("Erro ao conectar com o servidor de alimentos.");
  }
}

async function buscarPorNome() {
  const termo = foodInput.value.trim();
  const gramas = parseFloat(portionInput.value) || 100;
  if (!termo) return alert("Digite o nome do alimento.");

  const fator = gramas / 100;
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1`);
    const data = await res.json();

    if (data.products && data.products.length > 0) {
      const p = data.products[0];
      const n = p.nutriments || {};
      adicionarPrato(
        p.product_name_pt || p.product_name || termo,
        gramas,
        (n['energy-kcal_100g'] || 0) * fator,
        (n.proteins_100g || 0) * fator
      );
      foodInput.value = '';
    } else {
      alert("Alimento não encontrado.");
    }
  } catch (e) {
    alert("Erro na busca.");
  }
}

function adicionarPrato(nome, gramas, kcal, prot) {
  refeicoes.push({
    id: Date.now(),
    nome: nome,
    gramas: gramas,
    kcal: Math.round(kcal),
    prot: parseFloat(prot.toFixed(1))
  });
  localStorage.setItem('nutrimeta_items', JSON.stringify(refeicoes));
  atualizarTela();
}

function atualizarTela() {
  if (mealsTableBody) mealsTableBody.innerHTML = '';
  let tk = 0;

  refeicoes.forEach(i => {
    tk += i.kcal;
    if (mealsTableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${i.nome}</strong></td><td>${i.gramas}g</td><td>${i.prot}g</td><td>${i.kcal} kcal</td>`;
      mealsTableBody.appendChild(tr);
    }
  });

  if (kcalVal) kcalVal.textContent = tk;
  if (kcalBar) kcalBar.style.width = `${Math.min(100, (tk / 1800) * 100)}%`;
}
