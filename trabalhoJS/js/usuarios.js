let users = [];
const userModal = new bootstrap.Modal(document.getElementById('userModal'));
const API_URL = 'http://localhost:3000/users';

// Carregar usuários
function loadUsers() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            users = data;
            displayUsers();
        })
        .catch(error => console.error('Erro ao carregar usuários:', error));
}

// Exibir usuários na tabela
function displayUsers() {
    const tableBody = document.getElementById('userTable');
    tableBody.innerHTML = '';
    
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser(${index})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${index})">Excluir</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Salvar usuário
function saveUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const editingId = document.getElementById('editingId').value;

    const userData = { username, password };

    if (editingId === '') {
        // Novo usuário
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(() => {
            loadUsers();
            userModal.hide();
            document.getElementById('userForm').reset();
        });
    } else {
        // Editar usuário existente
        fetch(`${API_URL}/${users[parseInt(editingId)].id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(() => {
            loadUsers();
            userModal.hide();
            document.getElementById('userForm').reset();
            document.getElementById('editingId').value = '';
        });
    }
}

// Editar usuário
function editUser(index) {
    const user = users[index];
    document.getElementById('username').value = user.username;
    document.getElementById('password').value = user.password;
    document.getElementById('editingId').value = index;
    document.getElementById('modalTitle').textContent = 'Editar Usuário';
    userModal.show();
}

// Excluir usuário
function deleteUser(index) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        fetch(`${API_URL}/${users[index].id}`, {
            method: 'DELETE'
        })
        .then(() => loadUsers());
    }
}

// Carregar usuários quando a página for carregada
document.addEventListener('DOMContentLoaded', loadUsers);