document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const secretariaDropdown = document.getElementById('institucional-dropdown'); 

    // --- Lógica de Abertura do Menu Principal (Hambúrguer) ---
    function toggleMenu() {
        navMenu.classList.toggle('active');
        // Garante que o submenu se feche se o menu principal for fechado
        secretariaDropdown.classList.remove('open');
    }
    hamburger.addEventListener('click', toggleMenu);

    // --- Lógica de Abertura/Fechamento do Submenu (Clique) ---
    secretariaDropdown.addEventListener('click', function(e) {
        // Se o clique foi em um link dentro do submenu (<a>), deixa o clique seguir para ir para a página.
        if (e.target.tagName.toLowerCase() === 'a') {
            return; 
        }
        
        // Impede que o clique no div feche imediatamente ao propagar 
        e.stopPropagation(); 
        
        // Alterna a classe 'open' no elemento pai para mostrar/esconder o submenu
        secretariaDropdown.classList.toggle('open');
    });
    
    // --- Fechar Submenu ao clicar fora ---
    document.addEventListener('click', function(e) {
        const isClickInsideDropdown = secretariaDropdown.contains(e.target);
        
        // Se o clique não foi dentro do dropdown, fecha o submenu.
        if (!isClickInsideDropdown) {
            secretariaDropdown.classList.remove('open');
        }
    });
});

// --- Lógica de Envio de Formulário (Formspree) ---
const form = document.getElementById('contact-form');
const statusMessage = document.getElementById('form-status');

if (form && statusMessage) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault(); // Impede o envio tradicional e o redirecionamento
        
        const data = new FormData(e.target);
        
        // Desabilita o botão para evitar cliques múltiplos
        const submitButton = form.querySelector('.submit-button');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'; 

        try {
            const response = await fetch(e.target.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // SUCESSO: Mensagem e limpeza
                statusMessage.classList.remove('status-error');
                statusMessage.classList.add('status-success');
                statusMessage.textContent = "✅ Mensagem enviada com sucesso! Em breve entraremos em contato.";
                form.reset(); // LIMPA O FORMULÁRIO
            } else {
                // ERRO: Lida com possíveis erros do Formspree
                const responseData = await response.json();
                if (responseData.errors) {
                    // Exibe o primeiro erro retornado pelo Formspree (ex: campo inválido)
                    statusMessage.textContent = `❌ Erro: ${responseData.errors[0].message || 'Ocorreu um erro no envio.'}`;
                } else {
                    statusMessage.textContent = "❌ Erro ao enviar mensagem. Tente novamente mais tarde.";
                }
                statusMessage.classList.remove('status-success');
                statusMessage.classList.add('status-error');
            }
        } catch (error) {
            // ERRO DE CONEXÃO (rede, etc.)
            statusMessage.textContent = "❌ Erro de conexão. Verifique sua rede e tente novamente.";
            statusMessage.classList.remove('status-success');
            statusMessage.classList.add('status-error');
        } finally {
            // Restaura o botão após 3 segundos
            setTimeout(() => {
                 submitButton.disabled = false;
                 submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem';
            }, 3000);
            
            // Limpa a mensagem de status após 10 segundos
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.classList.remove('status-success', 'status-error');
            }, 10000);
        }
    });
}


// --- Lógica da Página de Indicadores (indicadores.html) ---

async function loadIndicatorsData() {
    const filtersContainer = document.getElementById('indicator-filters');
    const subFiltersContainer = document.getElementById('indicator-subfilters'); // NOVO ELEMENTO
    const dataGrid = document.getElementById('indicator-data-grid');
    const descriptionBox = document.getElementById('indicator-description-box');
    
    if (!filtersContainer || !dataGrid || !subFiltersContainer || !descriptionBox) return; 

    try {
        const response = await fetch('src/dados/indicadores.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const indicatorsData = await response.json();
        window.allIndicatorsData = indicatorsData; 
        
        const indicatorNames = Object.keys(indicatorsData);
        filtersContainer.innerHTML = ''; 
        dataGrid.innerHTML = `<p style="text-align: center; color: #666; padding: 50px;">Selecione um indicador acima para visualizar os dados.</p>`;
        descriptionBox.innerHTML = '';
        subFiltersContainer.classList.remove('active'); // Garante que o sub-menu comece escondido
        subFiltersContainer.innerHTML = ''; // Limpa qualquer conteúdo prévio

        indicatorNames.forEach(name => {
            const button = createIndicatorButton(name, 'indicator-button');
            
            button.addEventListener('click', () => {
                // Remove a seleção de todos os botões e seleciona o clicado
                Array.from(filtersContainer.children).forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Lida com a exibição, podendo acionar o sub-menu
                handleIndicatorClick(name, indicatorsData, filtersContainer, subFiltersContainer, dataGrid, descriptionBox);
            });
            
            filtersContainer.appendChild(button);
        });

    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
        dataGrid.innerHTML = `<p class="status-error">Não foi possível carregar os dados dos indicadores. Erro: ${error.message}</p>`;
    }
}

function createIndicatorButton(name, className) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = name;
    return button;
}

function handleIndicatorClick(indicatorName, data, filtersContainer, subFiltersContainer, dataGrid, descriptionBox) {
    const indicatorGroup = data[indicatorName];
    
    // 1. Limpa o sub-filtro e o grid de dados
    subFiltersContainer.innerHTML = '';
    dataGrid.innerHTML = '';

    // 2. Exibe a DESCRIÇÃO PRINCIPAL
    descriptionBox.innerHTML = `<p>${indicatorGroup.descricao}</p>`;

    if (indicatorGroup.tipo === 'agrupado' && indicatorGroup.subIndicadores) {
        // É um indicador AGRUPADO (ex: IDEB)
        subFiltersContainer.classList.add('active'); // Mostra o sub-menu

        const subIndicatorNames = Object.keys(indicatorGroup.subIndicadores);
        
        // Mensagem inicial de instrução para o sub-menu
        dataGrid.innerHTML = `<p style="text-align: center; color: #666; padding: 50px;">Selecione uma categoria de ${indicatorName} para ver os dados.</p>`;


        // 3. Cria os botões do sub-menu
        subIndicatorNames.forEach(subName => {
            const subButton = createIndicatorButton(subName, 'indicator-button');
            
            subButton.addEventListener('click', () => {
                // Remove a seleção de todos os sub-botões e seleciona o clicado
                Array.from(subFiltersContainer.children).forEach(btn => btn.classList.remove('active'));
                subButton.classList.add('active');
                
                // Exibe os dados e descrição do SUB-INDICADOR
                displaySubIndicatorData(indicatorName, subName, indicatorGroup.subIndicadores[subName], dataGrid, descriptionBox);
            });
            
            subFiltersContainer.appendChild(subButton);
        });
        
    } else {
        // É um indicador SIMPLES (ex: Taxa de Aprovação)
        subFiltersContainer.classList.remove('active'); // Esconde o sub-menu
        
        // Exibe os dados do indicador simples
        displayDataCards(indicatorName, indicatorGroup.dados, dataGrid);
    }
}

function displaySubIndicatorData(mainName, subName, subIndicatorData, dataGrid, descriptionBox) {
    // 1. Exibe a DESCRIÇÃO ESPECÍFICA do sub-indicador
    descriptionBox.innerHTML = `<p><strong>${mainName} - ${subName}:</strong> ${subIndicatorData.descricao}</p>`;

    // 2. Exibe os Cards de Dados
    displayDataCards(`${mainName} (${subName})`, subIndicatorData.dados, dataGrid);
}


function displayDataCards(fullName, dataArray, dataGrid) {
    dataGrid.innerHTML = ''; 
    
    dataArray.forEach((item, index) => { // Adicionamos o 'index' aqui
        const card = document.createElement('div');
        card.className = 'data-card';
        
        // --- LÓGICA DE DESTAQUE (Mais Recente) ---
        let badgeHTML = "";
        if (index === 0) {
            card.classList.add('latest-data'); // Adiciona a classe de destaque
            badgeHTML = `<span class="latest-badge"><i class="fas fa-star"></i> Atual</span>`;
        }
        
        const metaHTML = (item.meta && item.meta !== "") 
            ? `<p class="data-detail"><strong>Meta:</strong> ${item.meta}</p>` 
            : "";
        
        const detalheHTML = (item.detalhe && item.detalhe !== "") 
            ? `<p class="data-description">${item.detalhe}</p>` 
            : "";

        const fonteHTML = (item.fonte && item.fonte !== "")
            ? `<div class="data-source"><i class="fas fa-info-circle"></i> Fonte: ${item.fonte}</div>`
            : "";
        
        card.innerHTML = `
            <span class="data-year">${item.ano}</span>
            <h4>${fullName}</h4>
            <div class="data-value">${item.valor}</div>
            ${metaHTML} 
            ${detalheHTML}
            ${fonteHTML}
            ${badgeHTML} 
        `;
        
        dataGrid.appendChild(card);
    });
}
// Inicializa o carregamento dos dados quando a página estiver pronta
loadIndicatorsData();


// --- Lógica da Página de Eventos (eventos.html) ---
async function loadEventsData() {
    const upcomingContainer = document.getElementById('upcoming-events');
    const pastContainer = document.getElementById('past-events');
    
    // Verifica se estamos na página de eventos antes de rodar o código
    if (!upcomingContainer || !pastContainer) return;

    try {
        const response = await fetch('src/dados/eventos.json');
        let events = await response.json();

        // 1. ORDENAÇÃO INTELIGENTE (Data primeiro, ID como desempate)
        events.sort((a, b) => {
            const dataA = new Date(a.data + 'T00:00:00');
            const dataB = new Date(b.data + 'T00:00:00');

            if (dataB - dataA !== 0) {
                return dataB - dataA; // Mais recentes/futuros primeiro
            }
            return b.id - a.id; // Desempate pelo ID
        });

        // Limpa os containers
        upcomingContainer.innerHTML = '';
        pastContainer.innerHTML = '';

        // Pegamos a data de hoje (zerando as horas para comparar apenas os dias)
        const hoje = new Date().setHours(0, 0, 0, 0);

        events.forEach(event => {   
            const dateObj = new Date(event.data + 'T00:00:00');

            // 2. AUTOMAÇÃO: Verifica se o evento já passou da data de hoje
            // O evento é considerado "passado" se a data for menor que hoje OU se estiver marcado concluído no JSON
            const estaConcluido = dateObj.getTime() < hoje || event.concluido === true;

            const dataFormatada = dateObj.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            // Caminho da imagem (com fallback se estiver vazio)
            const imgPath = event.imagem || 'src/img/eventos/default.jpg';

            const eventHTML = `
                <div class="event-card ${estaConcluido ? 'past' : ''}">
                    <div class="event-image-container">
                        <img src="${imgPath}" alt="${event.titulo}" class="event-img">
                    </div>
                    <div class="event-info">
                        <span class="event-full-date"><i class="far fa-calendar-alt"></i> ${dataFormatada}</span>
                        <h4>${event.titulo}</h4>
                        <p><i class="far fa-clock"></i> ${event.hora}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.local}</p>
                        <p class="details">${event.descricao}</p>
                    </div>
                </div>
            `;

            if (estaConcluido) {
                pastContainer.innerHTML += eventHTML;
            } else {
                upcomingContainer.innerHTML += eventHTML;
            }
        });

        // Ativa as funções auxiliares
        setupImageModal();
        setupEventsToggle();

    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        upcomingContainer.innerHTML = "<p>Erro ao carregar eventos.</p>";
    }
}

// --- FUNÇÃO PARA MOSTRAR/OCULTAR EVENTOS PASSADOS ---
function setupEventsToggle() {
    const divider = document.querySelector('.event-divider.realizado');
    const container = document.getElementById('past-events');
    
    if (divider && container) {
        container.style.display = 'none'; // Inicia escondido
        divider.style.cursor = 'pointer';
        
        // Cria o botão de alternância
        const toggleInfo = document.createElement('span');
        toggleInfo.className = 'toggle-badge';
        toggleInfo.style.fontSize = '0.7em';
        toggleInfo.style.marginLeft = 'auto';
        toggleInfo.style.backgroundColor = '#f0f0f0';
        toggleInfo.style.padding = '5px 12px';
        toggleInfo.style.borderRadius = '20px';
        toggleInfo.innerHTML = 'VER FINALIZADOS <i class="fas fa-chevron-down"></i>';
        divider.appendChild(toggleInfo);

        divider.onclick = () => {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? 'grid' : 'none';
            toggleInfo.innerHTML = isHidden ? 
                'OCULTAR <i class="fas fa-chevron-up"></i>' : 
                'VER FINALIZADOS <i class="fas fa-chevron-down"></i>';
        };
    }
}

// --- MODAL DE IMAGEM PARA EVENTOS ---
function setupImageModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('img-ampliada');
    const captionText = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal) return;

    document.querySelectorAll('.event-img').forEach(img => {
        img.onclick = function() {
            modal.style.display = "block";
            modalImg.src = this.src;
            captionText.innerHTML = this.alt;
            document.body.style.overflow = "hidden"; // Trava o scroll
        }
    });

    closeBtn.onclick = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };
}

// Inicia a função
loadEventsData();



// --- VARIÁVEIS GLOBAIS - PAGINA DE NOTICIAS ---
let todasNoticias = [];
const ITENS_POR_PAGINA = 6; // Definido como 6 itens na visualização completa
let paginaAtual = 1;

// --- INICIALIZAÇÃO ---
async function loadNewsData() {
    try {
        const response = await fetch('src/dados/noticias.json');
        todasNoticias = await response.json();

        // 1. ORDENAÇÃO INTELIGENTE (MODIFICADO)
        todasNoticias.sort((a, b) => {
            // Criamos objetos de data para comparação
            const dataA = new Date(a.data + 'T00:00:00');
            const dataB = new Date(b.data + 'T00:00:00');

            // Critério 1: Data mais recente primeiro
            if (dataB - dataA !== 0) {
                return dataB - dataA;
            }

            // Critério 2: Se a data for igual, o ID maior (postado por último) vence
            return b.id - a.id;
        });

        // 2. Carregar a tela inicial (Apenas as 3 mais recentes)
        renderizarRecentes(3);

        // 3. Configurar os botões de navegação
        setupNavigation();

    } catch (e) {
        console.error("Erro ao carregar notícias:", e);
    }
}

// --- RENDERIZA AS RECENTES NA CAPA ---
function renderizarRecentes(quantidade) {
    const grid = document.getElementById('grid-recentes');
    if (!grid) return;

    // Fatia o array (pega só as 3 primeiras)
    const recentes = todasNoticias.slice(0, quantidade);
    
    grid.innerHTML = recentes.map(item => criarCardHTML(item)).join('');
}

// --- RENDERIZA O ARQUIVO (PAGINAÇÃO DE 6 EM 6) ---
function renderizarArquivo(pagina) {
    const grid = document.getElementById('grid-arquivo');
    const paginationContainer = document.getElementById('pagination');
    if (!grid) return;

    // Cálculo dos índices
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const itensDaPagina = todasNoticias.slice(inicio, fim);

    // Renderiza cards
    grid.innerHTML = itensDaPagina.map(item => criarCardHTML(item)).join('');

    // Renderiza botões de paginação (1, 2, 3...)
    const totalPaginas = Math.ceil(todasNoticias.length / ITENS_POR_PAGINA);
    let pagHTML = '';

    if (totalPaginas > 1) {
        for (let i = 1; i <= totalPaginas; i++) {
            pagHTML += `<button class="page-btn ${i === pagina ? 'active' : ''}" onclick="mudarPagina(${i})">${i}</button>`;
        }
    }
    paginationContainer.innerHTML = pagHTML;
    
    // Rola suave para o topo do grid
    document.getElementById('view-arquivo').scrollIntoView({ behavior: 'smooth' });
}

// --- HELPER: CRIA O HTML DO CARD ---
function criarCardHTML(noticia) {
    const dataFormatada = new Date(noticia.data + 'T00:00:00').toLocaleDateString('pt-BR');
    
    return `
        <div class="standard-card" onclick="abrirNoticia(${noticia.id})">
            <div class="card-img-container">
                <img src="${noticia.imagem}" alt="${noticia.titulo}">
            </div>
            <div class="card-content">
                <span class="card-date"><i class="far fa-calendar-alt"></i> ${dataFormatada}</span>
                <h3 class="card-title">${noticia.titulo}</h3>
                <p class="card-summary">${noticia.resumo}</p>
            </div>
        </div>
    `;
}

// --- CONTROLE DE NAVEGAÇÃO ENTRE TELAS ---
function setupNavigation() {
    const btnVerTodas = document.getElementById('btn-ver-todas');
    const btnVoltar = document.getElementById('btn-voltar');
    const viewRecentes = document.getElementById('view-recentes');
    const viewArquivo = document.getElementById('view-arquivo');

    // Botão "Ver Todas"
    btnVerTodas.addEventListener('click', () => {
        viewRecentes.style.display = 'none';
        viewArquivo.style.display = 'block';
        renderizarArquivo(1); // Carrega a página 1
    });

    // Botão "Voltar"
    btnVoltar.addEventListener('click', () => {
        viewArquivo.style.display = 'none';
        viewRecentes.style.display = 'block';
    });
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    renderizarArquivo(paginaAtual);
}

// --- MODAL DE LEITURA ---
function abrirNoticia(id) {
    const noticia = todasNoticias.find(n => n.id === id);
    const modal = document.getElementById('news-modal');
    const content = document.getElementById('modal-content-area');

    if (noticia) {
        const dataFormatada = new Date(noticia.data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        content.innerHTML = `
            <span class="modal-noticia-date">
                <i class="far fa-calendar-alt"></i> ${dataFormatada}
            </span>

            <h2 class="modal-noticia-title">
                ${noticia.titulo}
            </h2>

            <img src="${noticia.imagem}" class="modal-full-img">
            <div class="modal-text">
                ${noticia.conteudo}
            </div>
        `;
        modal.style.display = "block";
        document.body.style.overflow = "hidden"; // Trava scroll da página de trás
    }
}

// Fechar Modal
const closeBtn = document.querySelector('.modal-close-btn');
if(closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('news-modal').style.display = "none";
        document.body.style.overflow = "auto";
    });
}

window.onclick = (e) => {
    const modal = document.getElementById('news-modal');
    if (e.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
};

loadNewsData();