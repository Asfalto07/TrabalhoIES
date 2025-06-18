let accounts = {};
let currentPlatform = '';
let currentUser = null;
const API_URL = 'http://localhost:3000/users';

// Plataformas disponíveis
const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'];

// Carregar contas do usuário atual
async function loadAccounts() {
    console.log('Carregando contas...');
    
    try {
        // Carregar usuário atual do servidor
        currentUser = await getCurrentUser();
        console.log('Usuário atual:', currentUser);
        
        // Carregar dados das contas
        loadUserAccounts();
        
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        showToast('Erro: Não foi possível carregar dados do usuário', 'error');
    }
}

// Carregar dados das contas do usuário
function loadUserAccounts() {
    console.log('Carregando dados das contas...');
    
    // Inicializar todas as plataformas como desconectadas
    platforms.forEach(platform => {
        accounts[platform] = { connected: false, username: '', followers: 0, id: null };
    });
    
    // Usar dados do usuário atual
    if (currentUser.contas && currentUser.contas.length > 0) {
        console.log('Contas encontradas:', currentUser.contas);
        currentUser.contas.forEach(conta => {
            if (accounts[conta.platform]) {
                accounts[conta.platform] = {
                    connected: conta.connected,
                    username: conta.username,
                    followers: conta.totalFollowers || 0,
                    id: conta.id,
                    followersHistory: conta.followers || []
                };
            }
        });
    }
    
    console.log('Accounts carregadas:', accounts);
    updateUI();
}

// Salvar conta no servidor
async function saveAccount(platform, accountData) {
    if (!currentUser) {
        showToast('Erro: Nenhum usuário logado', 'error');
        return;
    }

    console.log('Salvando conta:', platform, accountData);

    // Garantir que o array de contas existe
    if (!currentUser.contas) {
        currentUser.contas = [];
    }

    // Procurar se já existe uma conta desta plataforma
    const existingIndex = currentUser.contas.findIndex(conta => conta.platform === platform);
    
    const contaData = {
        id: accountData.id || generateId(),
        platform: platform,
        username: accountData.username,
        followers: [{
            data: new Date().toISOString(),
            numero: accountData.followers
        }],
        totalFollowers: accountData.followers,
        connected: true,
        connectedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        // Atualizar conta existente
        currentUser.contas[existingIndex] = contaData;
    } else {
        // Adicionar nova conta
        currentUser.contas.push(contaData);
    }

    try {
        // Salvar no servidor
        const response = await fetch(`${API_URL}/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentUser)
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar conta');
        }
        
        // Atualizar accounts local
        accounts[platform] = {
            connected: true,
            username: accountData.username,
            followers: accountData.followers,
            id: contaData.id
        };
        
        updateUI();
        
    } catch (error) {
        console.error('Erro ao salvar conta:', error);
        showToast('Erro ao salvar conta', 'error');
    }
}

// Excluir conta do servidor
async function deleteAccount(platform) {
    if (!currentUser) {
        showToast('Erro: Nenhum usuário logado', 'error');
        return;
    }

    try {
        // Remover da lista de contas do usuário
        if (currentUser.contas) {
            currentUser.contas = currentUser.contas.filter(conta => conta.platform !== platform);
        }

        // Salvar no servidor
        const response = await fetch(`${API_URL}/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentUser)
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir conta');
        }

        // Atualizar accounts local
        accounts[platform] = {
            connected: false,
            username: '',
            followers: 0,
            id: null
        };

        updateUI();
        showToast(`Conta ${platform} desconectada!`, 'success');
        
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        showToast('Erro ao desconectar conta', 'error');
    }
}

// Gerar ID único
function generateId() {
    return Math.random().toString(36).substr(2, 4);
}

// Alternar conexão
function toggleConnection(platform) {
    console.log('Toggle connection:', platform);
    currentPlatform = platform;
    
    if (accounts[platform].connected) {
        // Desconectar
        if (confirm(`Deseja desconectar a conta do ${platform}?`)) {
            deleteAccount(platform);
        }
    } else {
        // Conectar
        openConnectionModal(platform);
    }
}

// Abrir modal de conexão
function openConnectionModal(platform) {
    console.log('Abrindo modal para:', platform);
    const modal = new bootstrap.Modal(document.getElementById('connectionModal'));
    const title = document.getElementById('modalTitle');
    
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    title.textContent = `Conectar ${platformName}`;
    
    // Preencher o formulário do modal
    const modalBody = document.querySelector('#connectionModal .modal-body');
    modalBody.innerHTML = `
        <form id="connectionForm">
            <div class="mb-3">
                <label for="username" class="form-label">Usuário do ${platformName}</label>
                <input type="text" class="form-control" id="username" required>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Senha</label>
                <input type="password" class="form-control" id="password" required>
            </div>
        </form>
    `;
    
    modal.show();
}

// Conectar conta
function connectAccount() {
    console.log('Conectando conta...');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    // Simular conexão
    const accountData = simulateConnection(currentPlatform, username);
    saveAccount(currentPlatform, accountData);
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('connectionModal'));
    modal.hide();
    
    const platformName = currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1);
    showToast(`Conta do ${platformName} conectada com sucesso!`, 'success');
}

// Simular conexão
function simulateConnection(platform, username) {
    // Simular diferentes números de seguidores para cada plataforma
    const followersRange = {
        instagram: [500, 5000],
        tiktok: [200, 2000],
        youtube: [1000, 10000],
        twitter: [100, 1000],
        facebook: [50, 500],
        linkedin: [30, 300]
    };
    
    const range = followersRange[platform];
    const followers = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    
    return {
        connected: true,
        username: username,
        followers: followers,
        id: accounts[platform].id || null
    };
}

// Atualizar interface
function updateUI() {
    console.log('Atualizando UI...');
    
    Object.keys(accounts).forEach(platform => {
        const card = document.querySelector(`[data-platform="${platform}"]`);
        if (!card) return;

        const account = accounts[platform];
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        
        // Ícones das plataformas
        const icons = {
            instagram: 'fab fa-instagram',
            tiktok: 'fab fa-tiktok',
            youtube: 'fab fa-youtube',
            twitter: 'fab fa-twitter',
            facebook: 'fab fa-facebook',
            linkedin: 'fab fa-linkedin'
        };

        // Cores das plataformas
        const colors = {
            instagram: '#E4405F',
            tiktok: '#000000',
            youtube: '#FF0000',
            twitter: '#1DA1F2',
            facebook: '#4267B2',
            linkedin: '#0077B5'
        };

        // Atualizar cabeçalho do card
        const headerDiv = card.querySelector('.d-flex.align-items-center.mb-3');
        headerDiv.innerHTML = `
            <i class="${icons[platform]}" style="font-size: 2rem; color: ${colors[platform]};"></i>
            <div class="ms-3">
                <h5 class="mb-0">${platformName}</h5>
                <small class="text-muted">${account.connected ? 'Conectado' : 'Desconectado'}</small>
            </div>
        `;

        // Atualizar detalhes da conta
        const detailsDiv = card.querySelector('.account-details');
        const button = card.querySelector('.connect-btn');

        if (account.connected) {
            detailsDiv.innerHTML = `
                <p class="mb-1"><strong>@${account.username}</strong></p>
                <p class="mb-0 text-muted">${formatFollowers(account.followers)} seguidores</p>
            `;
            detailsDiv.classList.remove('d-none');
            button.textContent = 'Desconectar';
            button.className = 'btn btn-outline-danger w-100 connect-btn';
        } else {
            detailsDiv.classList.add('d-none');
            button.textContent = 'Conectar';
            button.className = 'btn btn-outline-primary w-100 connect-btn';
        }
    });
    
    updateSummary();
}

// Formatar número de seguidores
function formatFollowers(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

// Atualizar resumo
function updateSummary() {
    const connectedCount = Object.values(accounts).filter(acc => acc.connected).length;
    const totalFollowers = Object.values(accounts).reduce((total, acc) => total + acc.followers, 0);
    
    document.getElementById('connected-count').textContent = connectedCount;
    document.getElementById('total-followers').textContent = formatFollowers(totalFollowers);
}

// Mostrar toast/notificação
function showToast(message, type = 'info') {
    console.log('Toast:', message, type);
    
    // Criar container de toast se não existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Criar toast
    const toastId = 'toast-' + Date.now();
    const toastBg = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
    
    const toastHTML = `
        <div id="${toastId}" class="toast ${toastBg} text-white" role="alert">
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Mostrar toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remover toast após ser ocultado
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando contas...');
    loadAccounts();
    
    // Event listener para o formulário
    const connectionForm = document.getElementById('connectionForm');
    if (connectionForm) {
        connectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            connectAccount();
        });
    }
});