
const users = [
  { username: 'admin', password: 'admin' }
];

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    window.location.href = 'index.html';
  } else {
    document.getElementById('alert').classList.remove('d-none');
  }
});
