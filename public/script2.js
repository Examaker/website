async function checkAuthStatus() {
    try {
        const response = await fetch('/check', {
            method: 'GET',
            credentials: 'include',
        });
        const data = await response.json();
        console.log(data);

        const loginButtons = document.querySelector('.login');
        const userSection = document.querySelector('.user');

        if (data.authenticated) {
            if (loginButtons) {
                loginButtons.style.display = 'none';
            }
            if (userSection) {
                userSection.classList.remove('hidden');
            }
        } else {
            if (loginButtons) {
                loginButtons.style.display = 'block';
            }
            if (userSection) {
                userSection.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();

    
})

let subMenu = document.getElementById("sub-menu") ;
      function togglemenu() {
        subMenu.classList.toggle("open-menu") ;
      }