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

// Chave do LocalStorage
const STORAGE_KEY = 'macro_meal_builder_items';

let refeicoes = [];

// Carrega os alimentos do dia salvos
document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem(STORAGE_KEY);
  if (salvas) {
    refeicoes = JSON.parse(salvas);
    atualizarTela();
  }
});

// Busca na API do Open Food Facts com endpoint otimizado
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
    // URL otimizada de busca do Open Food Facts
    const apiUrl = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      // Procura o primeiro produto que tenha dados nutricionais válidos
      const produto = data.products.find(p => p.nutriments && (p.nutriments['energy-kcal_100g'] !== undefined || p.nutriments.proteins_100g !== undefined)) || data.products[0];
      
      const nutriments = produto.nutriments || {};
      const fator = gramas / 100;

      // Extrai os valores ou assume 0 se não encontrar
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
      alert("Nenhum alimento encontrado com esse nome. Tente um termo mais simples (ex: Banana, Frango).");
    }
  } catch (erro) {
    console.error("Erro na busca:", erro);
    alert("Não foi possível conectar com o banco de dados. Tente novamente em alguns instantes.");
  } finally {
    searchBtn.textContent = "Buscar e Adicionar";
    searchBtn.disabled = false;
  }
}

function removerAlimento(id) {
  refeicoes = refeicoes.filter(item => item.id !== id);
  salvarEAtualizar();
}

function salvarEAtualizar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(refeicoes));
  atualizarTela();
}

function atualizarTela() {
  mealsTableBody.innerHTML = '';

  let totalKcal = 0;
  let totalCarb = 0;
  let totalProt = 0;
  let totalFat = 0;

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

  kcalVal.textContent = `${totalKcal} kcal`;
  carbVal.textContent = `${totalCarb.toFixed(1)} g`;
  protVal.textContent = `${totalProt.toFixed(1)} g`;
  fatVal.textContent = `${totalFat.toFixed(1)} g`;
}
