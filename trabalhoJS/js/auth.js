function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

function isLoggedIn() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

// Função para obter o usuário atual do servidor
async function getCurrentUser() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        throw new Error('Usuário não logado');
    }
    
    const response = await fetch(`http://localhost:3000/users/${userId}`);
    if (!response.ok) {
        throw new Error('Erro ao carregar dados do usuário');
    }
    
    return await response.json();
}