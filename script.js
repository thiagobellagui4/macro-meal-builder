const foodInput = document.getElementById('food-input');
const portionInput = document.getElementById('portion-input');
const searchBtn = document.getElementById('search-btn');
const mealsTableBody = document.getElementById('meals-table-body');

const kcalVal = document.getElementById('kcal-val');
const kcalBar = document.getElementById('kcal-bar');
const dispMetaKcal = document.getElementById('disp-meta-kcal');
const txtMetaKcal = document.getElementById('txt-meta-kcal');

const protVal = document.getElementById('prot-val');
const protBar = document.getElementById('prot-bar');
const dispMetaProt = document.getElementById('disp-meta-prot');
const txtMetaProt = document.getElementById('txt-meta-prot');

const carbVal = document.getElementById('carb-val');
const carbBar = document.getElementById('carb-bar');
const dispMetaCarb = document.getElementById('disp-meta-carb');
const txtMetaCarb = document.getElementById('txt-meta-carb');

const fatVal = document.getElementById('fat-val');
const fatBar = document.getElementById('fat-bar');
const dispMetaFat = document.getElementById('disp-meta-fat');
const txtMetaFat = document.getElementById('txt-meta-fat');

const inputMetaKcal = document.getElementById('input-meta-kcal');
const inputMetaCarb = document.getElementById('input-meta-carb');
const inputMetaProt = document.getElementById('input-meta-prot');
const inputMetaFat = document.getElementById('input-meta-fat');
const saveGoalsBtn = document.getElementById('save-goals-btn');

let refeicoes = [];
let metas = { kcal: 1800, carb: 12, prot: 85, fat: 60 };

document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem('nutrimeta_items');
  if (salvas) refeicoes = JSON.parse(salvas);

  const metasSalvas = localStorage.getItem('nutrimeta_metas');
  if (metasSalvas) {
    metas = JSON.parse(metasSalvas);
    inputMetaKcal.value = metas.kcal;
    inputMetaCarb.value = metas.carb;
    inputMetaProt.value = metas.prot;
    inputMetaFat.value = metas.fat;
  }
  atualizarTela();
});

if (searchBtn) searchBtn.addEventListener('click', buscarPorNome);
if (saveGoalsBtn) saveGoalsBtn.addEventListener('click', salvarMetas);

async function buscarPorNome() {
  const termo = foodInput.value.trim();
  const gramas = parseFloat(portionInput.value) || 100;
  if (!termo) return alert("Digite o nome do alimento.");

  searchBtn.textContent = "Buscando...";
  searchBtn.disabled = true;

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
        (n.proteins_100g || 0) * fator,
        (n.carbohydrates_100g || 0) * fator,
        (n.fat_100g || 0) * fator
      );
      foodInput.value = '';
    } else {
      alert("Alimento não encontrado.");
    }
  } catch (e) {
    alert("Erro ao buscar alimento.");
  } finally {
    searchBtn.textContent = "Buscar e Adicionar";
    searchBtn.disabled = false;
  }
}

function adicionarPrato(nome, gramas, kcal, prot, carb, fat) {
  refeicoes.push({
    id: Date.now(),
    nome: nome,
    gramas: gramas,
    kcal: parseFloat(kcal.toFixed(1)),
    prot: parseFloat(prot.toFixed(1)),
    carb: parseFloat(carb.toFixed(1)),
    fat: parseFloat(fat.toFixed(1))
  });
  localStorage.setItem('nutrimeta_items', JSON.stringify(refeicoes));
  atualizarTela();
}

function excluirPrato(id) {
  refeicoes = refeicoes.filter(i => i.id !== id);
  localStorage.setItem('nutrimeta_items', JSON.stringify(refeicoes));
  atualizarTela();
}

function salvarMetas() {
  metas = {
    kcal: parseFloat(inputMetaKcal.value) || 1800,
    carb: parseFloat(inputMetaCarb.value) || 12,
    prot: parseFloat(inputMetaProt.value) || 85,
    fat: parseFloat(inputMetaFat.value) || 60
  };
  localStorage.setItem('nutrimeta_metas', JSON.stringify(metas));
  atualizarTela();
  alert("Metas atualizadas com sucesso!");
}

function atualizarTela() {
  if (mealsTableBody) mealsTableBody.innerHTML = '';
  let tk = 0, tp = 0, tc = 0, tf = 0;

  refeicoes.forEach(i => {
    tk += i.kcal;
    tp += i.prot;
    tc += i.carb || 0;
    tf += i.fat || 0;

    if (mealsTableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${i.nome}</strong></td>
        <td>${i.gramas}g</td>
        <td>${i.prot}g</td>
        <td>${i.kcal}</td>
        <td><button class="btn-del" onclick="excluirPrato(${i.id})">X</button></td>
      `;
      mealsTableBody.appendChild(tr);
    }
  });

  // Atualizar textos e metas na tela
  kcalVal.textContent = tk.toFixed(1);
  dispMetaKcal.textContent = metas.kcal;
  txtMetaKcal.textContent = metas.kcal;
  kcalBar.style.width = `${Math.min(100, (tk / metas.kcal) * 100)}%`;

  carbVal.textContent = tc.toFixed(1);
  dispMetaCarb.textContent = metas.carb;
  txtMetaCarb.textContent = metas.carb;
  carbBar.style.width = `${Math.min(100, (tc / metas.carb) * 100)}%`;

  protVal.textContent = tp.toFixed(1);
  dispMetaProt.textContent = metas.prot;
  txtMetaProt.textContent = metas.prot;
  protBar.style.width = `${Math.min(100, (tp / metas.prot) * 100)}%`;

  fatVal.textContent = tf.toFixed(1);
  dispMetaFat.textContent = metas.fat;
  txtMetaFat.textContent = metas.fat;
  fatBar.style.width = `${Math.min(100, (tf / metas.fat) * 100)}%`;
}
