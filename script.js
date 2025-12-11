document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const secretariaDropdown = document.getElementById('secretaria-dropdown'); 

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
    const dataGrid = document.getElementById('indicator-data-grid');
    
    // Verifica se os contêineres existem (se estamos na página correta)
    if (!filtersContainer || !dataGrid) return; 

    try {
        // 1. Fetch dos dados do JSON
        const response = await fetch('src/dados/indicadores.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const indicatorsData = await response.json();
        
        // Armazena os dados globalmente (ou usa cache) para evitar novo fetch
        window.allIndicatorsData = indicatorsData; 
        
        // 2. Cria os botões de filtro
        const indicatorNames = Object.keys(indicatorsData);
        filtersContainer.innerHTML = ''; // Limpa o conteúdo inicial
        
        indicatorNames.forEach(name => {
            const button = document.createElement('button');
            button.className = 'indicator-button';
            button.textContent = name;
            
            // Adiciona o evento de clique ao botão
            button.addEventListener('click', () => {
                displayIndicatorDetails(name, indicatorsData, filtersContainer, dataGrid);
            });
            
            filtersContainer.appendChild(button);
        });

        // 3. Carrega o primeiro indicador por padrão (opcional)
        if (indicatorNames.length > 0) {
            // Seleciona o primeiro indicador para mostrar ao carregar a página
            displayIndicatorDetails(indicatorNames[0], indicatorsData, filtersContainer, dataGrid);
        }

    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
        dataGrid.innerHTML = `<p class="status-error">Não foi possível carregar os dados dos indicadores. Erro: ${error.message}</p>`;
    }
}

function displayIndicatorDetails(indicatorName, data, filtersContainer, dataGrid) {
    const indicatorDetails = data[indicatorName];
    
    // 1. Atualiza o estado "ativo" dos botões
    Array.from(filtersContainer.children).forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === indicatorName) {
            btn.classList.add('active');
        }
    });

    // 2. Cria e injeta os cards
    dataGrid.innerHTML = ''; // Limpa os cards anteriores
    
    indicatorDetails.forEach(item => {
        const card = document.createElement('div');
        card.className = 'data-card';
        
        // Estrutura do Card de Dados (Valor, Ano, Detalhe)
        card.innerHTML = `
            <span class="data-year">${item.ano}</span>
            <h4>${indicatorName}</h4>
            <div class="data-value">${item.valor}</div>
            <p class="data-detail">Meta: ${item.meta}</p>
            <p class="data-description">${item.detalhe}</p>
        `;
        
        dataGrid.appendChild(card);
    });
}

// Inicializa o carregamento dos dados quando a página estiver pronta
loadIndicatorsData();