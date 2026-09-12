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

// LocalStorage
const STORAGE_KEY_ITEMS = 'macro_meal_builder_items';
const STORAGE_KEY_GOALS = 'macro_meal_builder_goals';

let refeicoes = [];
let metas = { kcal: 1800, carb: 200, prot: 130, fat: 60 };

// Base de Dados Local Ampliada (Funciona offline e dá resposta instantânea)
const BANCO_LOCAL = [
  { palavras: ['ovo', 'ovos', 'ovo cozido'], nome: 'Ovo Cozido', kcal: 155, prot: 13, carb: 1.1, fat: 11 },
  { palavras: ['frango', 'peito de frango', 'frango grelhado'], nome: 'Peito de Frango Grelhado', kcal: 165, prot: 31, carb: 0, fat: 3.6 },
  { palavras: ['arroz', 'arroz branco'], nome: 'Arroz Branco Cozido', kcal: 130, prot: 2.7, carb: 28, fat: 0.3 },
  { palavras: ['feijao', 'feijão', 'feijão preto'], nome: 'Feijão Preto Cozido', kcal: 77, prot: 4.5, carb: 14, fat: 0.5 },
  { palavras: ['banana', 'banana nanica', 'banana prata'], nome: 'Banana', kcal: 89, prot: 1.1, carb: 23, fat: 0.3 },
  { palavras: ['pao', 'pão', 'pao de forma', 'pão de fôrma'], nome: 'Pão de Fôrma', kcal: 265, prot: 9, carb: 49, fat: 3.2 },
  { palavras: ['carne', 'patinho', 'carne moida', 'carne moída'], nome: 'Patinho Grelhado/Moído', kcal: 219, prot: 35, carb: 0, fat: 7.3 },
  { palavras: ['leite', 'leite integral'], nome: 'Leite Integral', kcal: 61, prot: 3.2, carb: 4.8, fat: 3.2 },
  { palavras: ['aveia', 'aveia em flocos'], nome: 'Aveia em Flocos', kcal: 394, prot: 13.9, carb: 66.6, fat: 8.5 },
  { palavras: ['iogurte', 'iogurte desnatado'], nome: 'Iogurte Desnatado', kcal: 43, prot: 4.7, carb: 6, fat: 0.2 },
  { palavras: ['iogurte natural', 'iogurte integral'], nome: 'Iogurte Natural Integral', kcal: 61, prot: 3.5, carb: 4.7, fat: 3.3 },
  { palavras: ['tilapia', 'tilápia', 'peixe', 'file de tilapia'], nome: 'Filé de Tilápia Grelhado', kcal: 128, prot: 26, carb: 0, fat: 2.7 },
  { palavras: ['batata doce', 'batata-doce'], nome: 'Batata Doce Cozida', kcal: 86, prot: 1.6, carb: 20, fat: 0.1 },
  { palavras: ['pasta de amendoim', 'amendoim'], nome: 'Pasta de Amendoim', kcal: 588, prot: 25, carb: 20, fat: 50 },
  { palavras: ['mandioca', 'aipim', 'macaxeira'], nome: 'Mandioca Cozida', kcal: 160, prot: 1.4, carb: 38, fat: 0.3 },
  { palavras: ['queijo', 'queijo mussarela', 'mussarela'], nome: 'Queijo Mussarela', kcal: 280, prot: 18, carb: 3.1, fat: 22 }
];

// 1. Carrega dados salvos ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (salvas) refeicoes = JSON.parse(salvas);

  const metasSalvas = localStorage.getItem(STORAGE_KEY_GOALS);
  if (metasSalvas) metas = JSON.parse(metasSalvas);

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

// 3. Busca Híbrida Inteligente
async function buscarEAdicionar() {
  const termo = foodInput.value.trim().toLowerCase();
  const gramas = parseFloat(portionInput.value) || 100;

  if (!termo) {
    alert("Digite o nome de um alimento (ex: Ovo, Peito de frango).");
    return;
  }

  const fator = gramas / 100;

  // Busca 1: Banco Local (procura por palavras que contenham ou estejam contidas no termo)
  const itemLocal = BANCO_LOCAL.find(item => 
    item.palavras.some(p => termo.includes(p) || p.includes(termo))
  );

  if (itemLocal) {
    const novoAlimento = {
      id: Date.now(),
      nome: itemLocal.nome,
      gramas: gramas,
      kcal: Math.round(itemLocal.kcal * fator),
      prot: parseFloat((itemLocal.prot * fator).toFixed(1)),
      carb: parseFloat((itemLocal.carb * fator).toFixed(1)),
      fat: parseFloat((itemLocal.fat * fator).toFixed(1))
    };

    refeicoes.push(novoAlimento);
    salvarEAtualizar();
    foodInput.value = '';
    return;
  }

  // Busca 2: API Externa da Open Food Facts
  searchBtn.textContent = "Buscando...";
  searchBtn.disabled = true;

  try {
    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const produto = data.products[0];
      const nutriments = produto.nutriments || {};

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
      adicionarManual(termo, gramas);
    }
  } catch (erro) {
    console.error("Erro na busca:", erro);
    adicionarManual(termo, gramas);
  } finally {
    searchBtn.textContent = "Buscar e Adicionar";
    searchBtn.disabled = false;
  }
}

// 4. Entrada Manual de Emergência
function adicionarManual(termo, gramas) {
  const confirmar = confirm(`Alimento "${termo}" não encontrado automaticamente. Deseja informar os nutrientes manualmente?`);
  if (!confirmar) return;

  const kcal = parseFloat(prompt(`Calorias para ${gramas}g:`, "100")) || 0;
  const prot = parseFloat(prompt(`Proteínas (g) para ${gramas}g:`, "10")) || 0;
  const carb = parseFloat(prompt(`Carboidratos (g) para ${gramas}g:`, "0")) || 0;
  const fat = parseFloat(prompt(`Gorduras (g) para ${gramas}g:`, "0")) || 0;

  const novoAlimento = {
    id: Date.now(),
    nome: termo.charAt(0).toUpperCase() + termo.slice(1),
    gramas: gramas,
    kcal: Math.round(kcal),
    prot: parseFloat(prot.toFixed(1)),
    carb: parseFloat(carb.toFixed(1)),
    fat: parseFloat(fat.toFixed(1))
  };

  refeicoes.push(novoAlimento);
  salvarEAtualizar();
  foodInput.value = '';
}

// 5. Remove alimento
function removerAlimento(id) {
  refeicoes = refeicoes.filter(item => item.id !== id);
  salvarEAtualizar();
}

// 6. Salva no LocalStorage e atualiza a tela
function salvarEAtualizar() {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(refeicoes));
  atualizarTela();
}

// 7. Atualiza Dashboard e Tabela
function atualizarTela() {
  if (mealsTableBody) mealsTableBody.innerHTML = '';

  let totalKcal = 0, totalCarb = 0, totalProt = 0, totalFat = 0;

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
        <td><button class="btn-del" onclick="removerAlimento(${item.id})">✕</button></td>
      `;
      mealsTableBody.appendChild(tr);
    }
  });

  if (kcalVal) kcalVal.textContent = `${totalKcal} kcal`;
  if (carbVal) carbVal.textContent = `${totalCarb.toFixed(1)} g`;
  if (protVal) protVal.textContent = `${totalProt.toFixed(1)} g`;
  if (fatVal) fatVal.textContent = `${totalFat.toFixed(1)} g`;
}

// 8. Atualiza Metas
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
