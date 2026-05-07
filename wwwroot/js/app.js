// Sidebar toggle
document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Auto-dismiss alerts
    setTimeout(function () {
        document.querySelectorAll('.alert-auto-dismiss').forEach(el => {
            el.classList.add('fade');
            setTimeout(() => el.remove(), 300);
        });
    }, 4000);
});
