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

// Chave para salvar no armazenamento local
const STORAGE_KEY = 'macro_meal_builder_items';

// Array com as refeições do dia
let refeicoes = [];

// 1. Carrega alimentos salvos ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem(STORAGE_KEY);
  if (salvas) {
    refeicoes = JSON.parse(salvas);
    atualizarTela();
  }
});

// 2. Função principal para buscar alimento na API do Open Food Facts e adicionar
async function buscarEAdicionar() {
  const termo = foodInput.value.trim();
  const gramas = parseFloat(portionInput.value) || 100;

  if (!termo) {
    alert("Digite o nome de um alimento (ex: Ovo, Peito de frango).");
    return;
  }

  // Altera texto do botão enquanto busca
  searchBtn.textContent = "Buscando...";
  searchBtn.disabled = true;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1`
    );
    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const produto = data.products[0];
      const nutriments = produto.nutriments || {};
      const fator = gramas / 100;

      // Monta objeto com os macronutrientes proporcionais
      const novoAlimento = {
        id: Date.now(),
        nome: produto.product_name || termo,
        gramas: gramas,
        kcal: Math.round((nutriments['energy-kcal_100g'] || 0) * fator),
        prot: parseFloat(((nutriments.proteins_100g || 0) * fator).toFixed(1)),
        carb: parseFloat(((nutriments.carbohydrates_100g || 0) * fator).toFixed(1)),
        fat: parseFloat(((nutriments.fat_100g || 0) * fator).toFixed(1))
      };

      // Adiciona à lista e limpa o input
      refeicoes.push(novoAlimento);
      salvarEAtualizar();
      foodInput.value = '';
    } else {
      alert("Alimento não encontrado. Tente digitar de outra forma.");
    }
  } catch (erro) {
    console.error("Erro na busca da API:", erro);
    alert("Erro ao buscar alimento. Verifique sua conexão.");
  } finally {
    searchBtn.textContent = "Buscar e Adicionar";
    searchBtn.disabled = false;
  }
}

// 3. Remove um alimento da lista
function removerAlimento(id) {
  refeicoes = refeicoes.filter(item => item.id !== id);
  salvarEAtualizar();
}

// 4. Salva no LocalStorage e atualiza a interface
function salvarEAtualizar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(refeicoes));
  atualizarTela();
}

// 5. Atualiza a tabela de refeições e o Dashboard de Totais
function atualizarTela() {
  // Limpa tabela
  mealsTableBody.innerHTML = '';

  let totalKcal = 0;
  let totalCarb = 0;
  let totalProt = 0;
  let totalFat = 0;

  // Preenche a tabela e soma os totais
  refeicoes.forEach(item => {
    totalKcal += item.kcal;
    totalCarb += item.carb;
    totalProt += item.prot;
    totalFat += item.fat;

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
  });

  // Atualiza o Dashboard no topo
  kcalVal.textContent = `${totalKcal} kcal`;
  carbVal.textContent = `${totalCarb.toFixed(1)} g`;
  protVal.textContent = `${totalProt.toFixed(1)} g`;
  fatVal.textContent = `${totalFat.toFixed(1)} g`;
}
