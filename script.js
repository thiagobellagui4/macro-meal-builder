const foodInput = document.getElementById('food-input');
const portionInput = document.getElementById('portion-input');
const searchBtn = document.getElementById('search-btn');
const barcodeFile = document.getElementById('barcode-file');
const mealsTableBody = document.getElementById('meals-table-body');
const kcalVal = document.getElementById('kcal-val');
const kcalBar = document.getElementById('kcal-bar');

let refeicoes = [];

document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem('nutrimeta_items');
  if (salvas) refeicoes = JSON.parse(salvas);
  atualizarTela();
});

if (searchBtn) searchBtn.addEventListener('click', buscarPorNome);

if (barcodeFile) {
  barcodeFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      alert("Foto capturada! Para leitura automática de barras por foto sem leitor nativo, digite o nome do produto abaixo ou digite o código de barras diretamente na busca por nome.");
    }
  });
}

async function buscarPorNome() {
  const termo = foodInput.value.trim();
  const gramas = parseFloat(portionInput.value) || 100;
  if (!termo) return alert("Digite o nome ou código do alimento.");

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
