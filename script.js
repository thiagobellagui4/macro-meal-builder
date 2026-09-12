
const foodInput = document.getElementById('food-input');
const foodSuggestions = document.getElementById('food-suggestions');
const portionInput = document.getElementById('portion-input');
const searchBtn = document.getElementById('search-btn');
const mealsTableBody = document.getElementById('meals-table-body');

// Elementos do Modal Manual
const openManualBtn = document.getElementById('open-manual-btn');
const manualCard = document.getElementById('manual-card');
const cancelManualBtn = document.getElementById('cancel-manual-btn');
const saveManualBtn = document.getElementById('save-manual-btn');
const manualName = document.getElementById('manual-name');
const manualKcal = document.getElementById('manual-kcal');
const manualProt = document.getElementById('manual-prot');
const manualCarb = document.getElementById('manual-carb');
const manualFat = document.getElementById('manual-fat');

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
let cacheProdutos = [];

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

// Ações do Modal Manual
if (openManualBtn) {
  openManualBtn.addEventListener('click', () => {
    manualCard.style.display = 'block';
    foodSuggestions.style.display = 'none';
  });
}

if (cancelManualBtn) {
  cancelManualBtn.addEventListener('click', () => {
    manualCard.style.display = 'none';
    limparCamposManuais();
  });
}

if (saveManualBtn) {
  saveManualBtn.addEventListener('click', () => {
    const nome = manualName.value.trim();
    const gramas = parseFloat(portionInput.value) || 100;
    
    if (!nome) return alert("Digite o nome do alimento.");

    const kcal100 = parseFloat(manualKcal.value) || 0;
    const prot100 = parseFloat(manualProt.value) || 0;
    const carb100 = parseFloat(manualCarb.value) || 0;
    const fat100 = parseFloat(manualFat.value) || 0;

    const fator = gramas / 100;

    adicionarPrato(
      nome,
      gramas,
      kcal100 * fator,
      prot100 * fator,
      carb100 * fator,
      fat100 * fator
    );

    manualCard.style.display = 'none';
    limparCamposManuais();
  });
}

function limparCamposManuais() {
  manualName.value = '';
  manualKcal.value = '';
  manualProt.value = '';
  manualCarb.value = '';
  manualFat.value = '';
}

// Sistema de Busca Estável e Limpo (API Global com Filtro de Idioma PT/BR)
let timeoutId = null;
if (foodInput) {
  foodInput.addEventListener('input', (e) => {
    const termo = e.target.value.trim();
    if (termo.length < 2) {
      foodSuggestions.style.display = 'none';
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      try {
        // Usando a API global estável do Open Food Facts
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=30`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.products && data.products.length > 0) {
          // Filtro para aceitar apenas itens que tenham dados nutricionais e preferência por PT ou Brasil
          cacheProdutos = data.products.filter(p => {
            const nome = p.product_name_pt || p.product_name || '';
            const temNutri = p.nutriments && (p.nutriments['energy-kcal_100g'] !== undefined || p.nutriments['energy-kcal'] !== undefined);
            
            // Remove lixo estrangeiro óbvio (como catalão, francês sem tradução, etc)
            const lixoEstrangeiro = /biculture|bonpreu|nomen|catala|superu/i.test(JSON.stringify(p));

            return temNutri && nome.length > 0 && !lixoEstrangeiro;
          });

          // Ordena para colocar itens do Brasil ou em português no topo
          cacheProdutos.sort((a, b) => {
            const aPt = (a.countries_tags && a.countries_tags.some(c => c.includes('brazil'))) || a.product_name_pt ? 1 : 0;
            const bPt = (b.countries_tags && b.countries_tags.some(c => c.includes('brazil'))) || b.product_name_pt ? 1 : 0;
            return bPt - aPt;
          });
          
          foodSuggestions.innerHTML = '';
          cacheProdutos.slice(0, 10).forEach(p => {
            const nome = p.product_name_pt || p.product_name;
            const marca = p.brands ? ` • ${p.brands}` : '';
            const isBr = (p.countries_tags && p.countries_tags.some(c => c.includes('brazil'))) ? ' 🇧🇷' : '';
            
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${nome}</strong><span style="color:var(--subtext); font-size:0.8rem;">${marca}${isBr}</span>`;
            
            div.addEventListener('click', () => {
              foodInput.value = nome + (p.brands ? ` (${p.brands})` : '');
              foodSuggestions.style.display = 'none';
            });
            foodSuggestions.appendChild(div);
          });
          
          if (cacheProdutos.length > 0) {
            foodSuggestions.style.display = 'block';
          } else {
            foodSuggestions.style.display = 'none';
          }
        } else {
          foodSuggestions.style.display = 'none';
        }
      } catch (err) {
        foodSuggestions.style.display = 'none';
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!foodInput.contains(e.target) && !foodSuggestions.contains(e.target) && !manualCard.contains(e.target) && !openManualBtn.contains(e.target)) {
      foodSuggestions.style.display = 'none';
    }
  });
}

if (searchBtn) searchBtn.addEventListener('click', buscarPorNome);
if (saveGoalsBtn) saveGoalsBtn.addEventListener('click', salvarMetas);

async function buscarPorNome() {
  const termo = foodInput.value.trim();
  const gramas = parseFloat(portionInput.value) || 100;
  if (!termo) return alert("Digite ou selecione o nome do alimento.");

  foodSuggestions.style.display = 'none';
  searchBtn.textContent = "Buscando...";
  searchBtn.disabled = true;

  const fator = gramas / 100;
  try {
    let p = cacheProdutos.find(prod => {
      const nomeCompleto = (prod.product_name_pt || prod.product_name) + (prod.brands ? ` (${prod.brands})` : '');
      return nomeCompleto === termo || (prod.product_name_pt === termo || prod.product_name === termo);
    });
    
    if (!p) {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=5`);
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        p = data.products.find(prod => prod.nutriments && (prod.nutriments['energy-kcal_100g'] || prod.nutriments['energy-kcal'])) || data.products[0];
      }
    }

    if (p) {
      const n = p.nutriments || {};
      const kcal100 = n['energy-kcal_100g'] || n['energy-kcal'] || 0;
      const prot100 = n.proteins_100g || n.proteins || 0;
      const carb100 = n.carbohydrates_100g || n.carbohydrates || 0;
      const fat100 = n.fat_100g || n.fat || 0;

      const nomeExibicao = (p.product_name_pt || p.product_name) + (p.brands ? ` (${p.brands})` : '');

      adicionarPrato(
        nomeExibicao,
        gramas,
        kcal100 * fator,
        prot100 * fator,
        carb100 * fator,
        fat100 * fator
      );
      foodInput.value = '';
    } else {
      alert("Alimento não encontrado. Use o botão '+ Manual' para cadastrá-lo rapidamente!");
    }
  } catch (e) {
    alert("Erro ao conectar com o banco de dados.");
  } finally {
    searchBtn.textContent = "Buscar na Web";
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
