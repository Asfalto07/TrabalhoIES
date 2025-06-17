
      function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
  }

function isLoggedIn() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}s