// Elementos da Interface
const foodInput = document.getElementById('food-input');
const portionInput = document.getElementById('portion-input');
const searchBtn = document.getElementById('search-btn');
const manualBtn = document.getElementById('manual-btn');
const mealsTableBody = document.getElementById('meals-table-body');

// Inputs de Metas
const goalKcalInput = document.getElementById('goal-kcal');
const goalCarbInput = document.getElementById('goal-carb');
const goalProtInput = document.getElementById('goal-prot');
const goalFatInput = document.getElementById('goal-fat');
const saveGoalsBtn = document.getElementById('save-goals-btn');

// Dashboard Totais Atuais
const kcalVal = document.getElementById('kcal-val');
const carbVal = document.getElementById('carb-val');
const protVal = document.getElementById('prot-val');
const fatVal = document.getElementById('fat-val');

// Metas em Vermelho
const metaKcalTxt = document.getElementById('meta-kcal-txt');
const metaCarbTxt = document.getElementById('meta-carb-txt');
const metaProtTxt = document.getElementById('meta-prot-txt');
const metaFatTxt = document.getElementById('meta-fat-txt');

// Barras de Progresso
const kcalBar = document.getElementById('kcal-bar');
const carbBar = document.getElementById('carb-bar');
const protBar = document.getElementById('prot-bar');
const fatBar = document.getElementById('fat-bar');

// Storage Keys
const STORAGE_KEY_ITEMS = 'macro_meal_builder_items';
const STORAGE_KEY_GOALS = 'macro_meal_builder_goals';
const STORAGE_KEY_CUSTOM = 'macro_meal_builder_custom_foods';

let refeicoes = [];
let alimentosCustomizados = [];
let metas = { kcal: 1800, carb: 200, prot: 130, fat: 60 };

// Base Local Padrão
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const salvas = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (salvas) refeicoes = JSON.parse(salvas);

  const metasSalvas = localStorage.getItem(STORAGE_KEY_GOALS);
  if (metasSalvas) metas = JSON.parse(metasSalvas);

  const customizados = localStorage.getItem(STORAGE_KEY_CUSTOM);
  if (customizados) alimentosCustomizados = JSON.parse(customizados);

  preencherCamposMetas();
  atualizarTela();
});

// Event Listeners
if (searchBtn) searchBtn.addEventListener('click', (e) => { e.preventDefault(); buscarEAdicionar(); });
if (manualBtn) manualBtn.addEventListener('click', (e) => { e.preventDefault(); adicionarManual(foodInput.value.trim(), parseFloat(portionInput.value) || 100, true); });
if (saveGoalsBtn) saveGoalsBtn.addEventListener('click', (e) => { e.preventDefault(); salvarMetas(); });

// Salvar Metas
function salvarMetas() {
  metas = {
    kcal: parseFloat(goalKcalInput.value) || metas.kcal,
    carb: parseFloat(goalCarbInput.value) || metas.carb,
    prot: parseFloat(goalProtInput.value) || metas.prot,
    fat: parseFloat(goalFatInput.value) || metas.fat
  };

  localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(metas));
  atualizarTela();
  alert("Metas diárias salvas com sucesso!");
}

function preencherCamposMetas() {
  if (goalKcalInput) goalKcalInput.value = metas.kcal;
  if (goalCarbInput) goalCarbInput.value = metas.carb;
  if (goalProtInput) goalProtInput.value = metas.prot;
  if (goalFatInput) goalFatInput.value = metas.fat;
}

// Busca e Adição
async function buscarEAdicionar() {
  const termo = foodInput.value.trim().toLowerCase();
  const gramas = parseFloat(portionInput.value) || 100;

  if (!termo) {
    alert("Digite o nome de um alimento (ex: Ovo, Peito de frango).");
    return;
  }

  const fator = gramas / 100;

  const customEncontrado = alimentosCustomizados.find(item => 
    item.palavras.some(p => termo.includes(p) || p.includes(termo))
  );

  if (customEncontrado) {
    adicionarPratoAoMenu(customEncontrado.nome, gramas, customEncontrado.kcal100 * fator, customEncontrado.prot100 * fator, customEncontrado.carb100 * fator, customEncontrado.fat100 * fator);
    foodInput.value = '';
    return;
  }

  const itemLocal = BANCO_LOCAL.find(item => 
    item.palavras.some(p => termo.includes(p) || p.includes(termo))
  );

  if (itemLocal) {
    adicionarPratoAoMenu(itemLocal.nome, gramas, itemLocal.kcal * fator, itemLocal.prot * fator, itemLocal.carb * fator, itemLocal.fat * fator);
    foodInput.value = '';
    return;
  }

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

      adicionarPratoAoMenu(
        produto.product_name_pt || produto.product_name || termo,
        gramas,
        kcal100 * fator,
        prot100 * fator,
        carb100 * fator,
        fat100 * fator
      );
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

// Adição Manual
function adicionarManual(termo, gramas, diretoPeloBotao = false) {
  let nomeAlimento = termo;

  if (diretoPeloBotao || !nomeAlimento) {
    const nomeDigitado = prompt("Digite o nome do alimento:", foodInput.value.trim() || "");
    if (!nomeDigitado) return;
    nomeAlimento = nomeDigitado;
  } else {
    const confirmar = confirm(`Alimento "${nomeAlimento}" não encontrado automaticamente. Deseja informar os nutrientes manualmente?`);
    if (!confirmar) return;
  }

  const kcal = parseFloat(prompt(`Calorias totais para ${gramas}g de ${nomeAlimento}:`, "100")) || 0;
  const prot = parseFloat(prompt(`Proteínas (g) totais:`, "10")) || 0;
  const carb = parseFloat(prompt(`Carboidratos (g) totais:`, "0")) || 0;
  const fat = parseFloat(prompt(`Gorduras (g) totais:`, "0")) || 0;

  const fator100 = 100 / gramas;
  const nomeFormatado = nomeAlimento.charAt(0).toUpperCase() + nomeAlimento.slice(1);
  const termoChave = nomeAlimento.toLowerCase().trim();

  const jaExisteIdx = alimentosCustomizados.findIndex(a => a.nome.toLowerCase() === termoChave);
  const itemCustom = {
    palavras: [termoChave],
    nome: nomeFormatado,
    kcal100: kcal * fator100,
    prot100: prot * fator100,
    carb100: carb * fator100,
    fat100: fat * fator100
  };

  if (jaExisteIdx >= 0) {
    alimentosCustomizados[jaExisteIdx] = itemCustom;
  } else {
    alimentosCustomizados.push(itemCustom);
  }
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(alimentosCustomizados));

  adicionarPratoAoMenu(nomeFormatado, gramas, kcal, prot, carb, fat);
  foodInput.value = '';
}

function adicionarPratoAoMenu(nome, gramas, kcal, prot, carb, fat) {
  refeicoes.push({
    id: Date.now(),
    nome: nome,
    gramas: gramas,
    kcal: Math.round(kcal),
    prot: parseFloat(prot.toFixed(1)),
    carb: parseFloat(carb.toFixed(1)),
    fat: parseFloat(fat.toFixed(1))
  });
  salvarEAtualizar();
}

function removerAlimento(id) {
  refeicoes = refeicoes.filter(item => item.id !== id);
  salvarEAtualizar();
}

function salvarEAtualizar() {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(refeicoes));
  atualizarTela();
}

// Renderização na Tela
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

  // Atualiza Consumo Atual (Esquerda)
  if (kcalVal) kcalVal.textContent = totalKcal;
  if (carbVal) carbVal.textContent = totalCarb.toFixed(1);
  if (protVal) protVal.textContent = totalProt.toFixed(1);
  if (fatVal) fatVal.textContent = totalFat.toFixed(1);

  // Atualiza Metas em Vermelho (Direita)
  if (metaKcalTxt) metaKcalTxt.textContent = metas.kcal;
  if (metaCarbTxt) metaCarbTxt.textContent = metas.carb;
  if (metaProtTxt) metaProtTxt.textContent = metas.prot;
  if (metaFatTxt) metaFatTxt.textContent = metas.fat;

  // Atualiza Barras de Progresso
  if (kcalBar) kcalBar.style.width = `${Math.min(100, (totalKcal / (metas.kcal || 1)) * 100)}%`;
  if (carbBar) carbBar.style.width = `${Math.min(100, (totalCarb / (metas.carb || 1)) * 100)}%`;
  if (protBar) protBar.style.width = `${Math.min(100, (totalProt / (metas.prot || 1)) * 100)}%`;
  if (fatBar) fatBar.style.width = `${Math.min(100, (totalFat / (metas.fat || 1)) * 100)}%`;
}
