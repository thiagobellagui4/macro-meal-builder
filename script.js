// Elementos da Interface
const foodInput = document.getElementById('food-input');
const portionInput = document.getElementById('portion-input');
const searchBtn = document.getElementById('search-btn');
const mealsTableBody = document.getElementById('meals-table-body');

// Dashboard Totais
const kcalVal = document.getElementById('kcal-val');
const carbVal = document.getElementById('carb-val');
const protVal = document.getElementById('prot-val');
const fatVal = document.getElementById('fat-val');

// Chaves do LocalStorage
const STORAGE_KEY_ITEMS = 'macro_meal_builder_items';
const STORAGE_KEY_GOALS = 'macro_meal_builder_goals';

let refeicoes = [];
let metas = { kcal: 1800, carb: 200, prot: 130, fat: 60 };

// 1. Carrega dados salvos ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (salvas) {
    refeicoes = JSON.parse(salvas);
  }

  const metasSalvas = localStorage.getItem(STORAGE_KEY_GOALS);
  if (metasSalvas) {
    metas = JSON.parse(metasSalvas);
  }

  atualizarMetasNaTela();
  atualizarTela();
});

// 2. Listener do botão de busca
if (searchBtn) {
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    buscarEAdicionar();
  });
}

// 3. Função principal para buscar alimento na API
async function buscarEAdicionar() {
  const termo = foodInput.value.trim();
  const gramas = parseFloat(portionInput.value) || 100;

  if (!termo) {
    alert("Digite o nome de um alimento (ex: Ovo, Peito de frango).");
    return;
  }

  searchBtn.textContent = "Buscando...";
  searchBtn.disabled = true;

  try {
    // API de busca global da Open Food Facts (v2)
    const apiUrl = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(termo)}&fields=product_name,product_name_pt,nutriments&page_size=5`;
    
    let response = await fetch(apiUrl);
    let data = await response.json();

    // Busca secundária caso a busca por categoria não traga resultados
    if (!data.products || data.products.length === 0) {
      const fallbackUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1`;
      response = await fetch(fallbackUrl);
      data = await response.json();
    }

    if (data.products && data.products.length > 0) {
      const produto = data.products[0];
      const nutriments = produto.nutriments || {};
      const fator = gramas / 100;

      const kcal100 = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
      const prot100 = nutriments.proteins_100g || nutriments.proteins || 0;
      const carb100 = nutriments.carbohydrates_100g || nutriments.carbohydrates || 0;
      const fat100 = nutriments.fat_100g || nutriments.fat || 0;

      const novoAlimento = {
        id: Date.now(),
        nome: produto.product_name_pt || produto.product_name || termo,
        gramas: gramas,
        kcal: Math.round(kcal100 * fator),
        prot: parseFloat((prot100 * fator).toFixed(1)),
        carb: parseFloat((carb100 * fator).toFixed(1)),
        fat: parseFloat((fat100 * fator).toFixed(1))
      };

      refeicoes.push(novoAlimento);
      salvarEAtualizar();
      foodInput.value = '';
    } else {
      alert("Alimento não encontrado. Tente um termo mais simples.");
    }
  } catch (erro) {
    console.error("Erro na busca:", erro);
    alert("Erro ao conectar à API. Verifique sua conexão e tente novamente.");
  } finally {
    searchBtn.textContent = "Buscar e Adicionar";
    searchBtn.disabled = false;
  }
}

// 4. Remove um alimento da lista
function removerAlimento(id) {
  refeicoes = refeicoes.filter(item => item.id !== id);
  salvarEAtualizar();
}

// 5. Salva no LocalStorage e atualiza a interface
function salvarEAtualizar() {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(refeicoes));
  atualizarTela();
}

// 6. Atualiza a tabela de refeições e o Dashboard
function atualizarTela() {
  if (mealsTableBody) {
    mealsTableBody.innerHTML = '';
  }

  let totalKcal = 0;
  let totalCarb = 0;
  let totalProt = 0;
  let totalFat = 0;

  refeicoes.forEach(item => {
    totalKcal += item.kcal;
    totalCarb += item.carb;
    totalProt += item.prot;
    totalFat += item.fat;

    if (mealsTableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.nome}</strong></td>
        <td>${item.gramas}g</td>
        <td>${item.prot}g</td>
        <td>${item.kcal} kcal</td>
        <td>
          <button class="btn-del" onclick="removerAlimento(${item.id})">✕</button>
        </td>
      `;
      mealsTableBody.appendChild(tr);
    }
  });

  if (kcalVal) kcalVal.textContent = `${totalKcal} kcal`;
  if (carbVal) carbVal.textContent = `${totalCarb.toFixed(1)} g`;
  if (protVal) protVal.textContent = `${totalProt.toFixed(1)} g`;
  if (fatVal) fatVal.textContent = `${totalFat.toFixed(1)} g`;
}

// 7. Atualiza exibição das Metas Diárias
function atualizarMetasNaTela() {
  const targetKcal = document.getElementById('target-kcal-label');
  const targetCarb = document.getElementById('target-carb-label');
  const targetProt = document.getElementById('target-prot-label');
  const targetFat = document.getElementById('target-fat-label');
  
  if (targetKcal) targetKcal.textContent = `Meta: ${metas.kcal} kcal`;
  if (targetCarb) targetCarb.textContent = `Meta: ${metas.carb}g`;
  if (targetProt) targetProt.textContent = `Meta: ${metas.prot}g`;
  if (targetFat) targetFat.textContent = `Meta: ${metas.fat}g`;
}
