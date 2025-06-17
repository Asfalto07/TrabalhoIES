let accounts = {};
let currentPlatform = '';
const API_URL = 'http://localhost:3000/contas';

// Plataformas disponíveis
const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'];

// Carregar contas do servidor
function loadAccounts() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            // Inicializar todas as plataformas como desconectadas
            platforms.forEach(platform => {
                accounts[platform] = { connected: false, username: '', followers: 0, id: null };
            });
            
            // Atualizar com dados do servidor
            data.forEach(conta => {
                if (accounts[conta.platform]) {
                    accounts[conta.platform] = {
                        connected: conta.connected,
                        username: conta.username,
                        followers: conta.followers,
                        id: conta.id
                    };
                }
            });
            
            updateUI();
        })
        .catch(error => {
            console.error('Erro ao carregar contas:', error);
            // Fallback para dados locais se o servidor não estiver disponível
            loadLocalAccounts();
        });
}

// Fallback para dados locais
function loadLocalAccounts() {
    const savedAccounts = localStorage.getItem('socialAccounts');
    if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
    } else {
        // Inicializar todas as plataformas como desconectadas
        platforms.forEach(platform => {
            accounts[platform] = { connected: false, username: '', followers: 0, id: null };
        });
    }
    updateUI();
}

// Salvar conta no servidor
function saveAccount(platform, accountData) {
    const conta = {
        platform: platform,
        username: accountData.username,
        followers: accountData.followers,
        connected: accountData.connected,
        connectedAt: new Date().toISOString()
    };

    if (accountData.id) {
        // Atualizar conta existente
        fetch(`${API_URL}/${accountData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(conta)
        })
        .then(response => response.json())
        .then(() => {
            loadAccounts();
        })
        .catch(error => {
            console.error('Erro ao atualizar conta:', error);
            saveLocalAccount(platform, accountData);
        });
    } else {
        // Criar nova conta
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(conta)
        })
        .then(response => response.json())
        .then(() => {
            loadAccounts();
        })
        .catch(error => {
            console.error('Erro ao criar conta:', error);
            saveLocalAccount(platform, accountData);
        });
    }
}

// Excluir conta do servidor
function deleteAccount(platform) {
    const accountId = accounts[platform].id;
    
    if (accountId) {
        fetch(`${API_URL}/${accountId}`, {
            method: 'DELETE'
        })
        .then(() => {
            accounts[platform] = { connected: false, username: '', followers: 0, id: null };
            updateUI();
        })
        .catch(error => {
            console.error('Erro ao excluir conta:', error);
            // Fallback local
            accounts[platform] = { connected: false, username: '', followers: 0, id: null };
            saveLocalAccounts();
            updateUI();
        });
    }
}

// Salvar localmente como fallback
function saveLocalAccount(platform, accountData) {
    accounts[platform] = accountData;
    saveLocalAccounts();
    updateUI();
}

function saveLocalAccounts() {
    localStorage.setItem('socialAccounts', JSON.stringify(accounts));
}

// Alternar conexão
function toggleConnection(platform) {
    currentPlatform = platform;
    
    if (accounts[platform].connected) {
        // Desconectar
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        if (confirm(`Deseja desconectar sua conta do ${platformName}?`)) {
            deleteAccount(platform);
            showToast(`Conta do ${platformName} desconectada com sucesso!`, 'success');
        }
    } else {
        // Conectar - abrir modal
        openConnectionModal(platform);
    }
}

// Abrir modal de conexão
function openConnectionModal(platform) {
    const modal = new bootstrap.Modal(document.getElementById('connectionModal'));
    const title = document.getElementById('modalTitle');
    
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    title.textContent = `Conectar ${platformName}`;
    
    // Limpar formulário
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    modal.show();
}

// Conectar conta
function connectAccount() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showToast('Por favor, preencha todos os campos!', 'error');
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
    Object.keys(accounts).forEach(platform => {
        const card = document.querySelector(`[data-platform="${platform}"]`);
        if (!card) return; // Pular se o card não existir
        
        const status = card.querySelector('.status');
        const button = card.querySelector('.connect-btn');
        const details = card.querySelector('.account-details');
        const username = details.querySelector('.username');
        const followers = details.querySelector('.followers');
        
        if (accounts[platform].connected) {
            // Conectado
            card.classList.add('border-success');
            status.textContent = 'Conectado';
            status.className = 'text-success status';
            button.innerHTML = '<i class="fas fa-unlink"></i> Desconectar';
            button.className = 'btn btn-outline-danger w-100 connect-btn';
            
            username.textContent = `@${accounts[platform].username}`;
            followers.textContent = formatFollowers(accounts[platform].followers);
            details.classList.remove('d-none');
        } else {
            // Desconectado
            card.classList.remove('border-success');
            status.textContent = 'Não conectado';
            status.className = 'text-muted status';
            button.innerHTML = '<i class="fas fa-link"></i> Conectar';
            button.className = 'btn btn-outline-primary w-100 connect-btn';
            details.classList.add('d-none');
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
    } else {
        return count.toString();
    }
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
    // Criar container de toast se não existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1080';
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
    loadAccounts();
    
    // Event listener para o formulário
    document.getElementById('connectionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        connectAccount();
    });
});