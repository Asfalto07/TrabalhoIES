let users = [];
const API_URL = 'http://localhost:3000/users';

// Carregar usuários do JSON Server
fetch(API_URL)
  .then(response => response.json())
  .then(data => {
    users = data;
  })
  .catch(error => console.error('Erro ao carregar usuários:', error));

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userId', user.id); // Salvar apenas o ID do usuário
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('alert').classList.remove('d-none');
  }
});