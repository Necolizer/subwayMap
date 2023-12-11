document.addEventListener("DOMContentLoaded", function () {
    const foregroundSvg = document.getElementById("foreground-svg");
    const overlay = document.getElementById('overlay');

    document.getElementById('visualization0').addEventListener('click', function() {
        overlay.classList.add('blur-in');
        overlay.style.display = 'block';
        foregroundSvg.style.display = "block";
    });

    foregroundSvg.addEventListener('click', function() {
        foregroundSvg.style.display = "none";
        overlay.classList.add('blur-out');
        // overlay.style.display = 'none';
        overlay.addEventListener('animationend', function() {
            overlay.style.display = 'none';
            // Remove the animation classes to reset for the next time
            overlay.classList.remove('blur-in', 'blur-out');
        }, { once: true });
    });

});