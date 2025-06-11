let users = [];

fetch('../database/users.json')
  .then(response => response.json())
  .then(data => {
    users = data.users;
  })
  .catch(error => console.error('Erro ao carregar usuários:', error));

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('loggedIn', 'true');
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('alert').classList.remove('d-none');
  }
});