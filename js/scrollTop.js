var ScrollTop = (function () {
    var btn;

    function init() {
        btn = document.getElementById("scrollTopBtn");
        if (!btn) return;

        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);

        // IMPORTANT: DOM gets rebuilt in this app
        window.addEventListener("hashchange", update);
        window.addEventListener("panda_data", update);

        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        update();
    }

    function update() {
        if (!btn) return;

        btn.classList.toggle("visible", window.scrollY > 200);

        var footer = document.getElementById("footer"); // ALWAYS re-fetch

        var baseOffset = 24;

        if (!footer) {
            btn.style.bottom = baseOffset + "px";
            return;
        }

        var rect = footer.getBoundingClientRect();
        var windowHeight = window.innerHeight;

        // only adjust if footer is visible
        if (rect.top < windowHeight) {
            var overlap = windowHeight - rect.top;
            btn.style.bottom = (overlap + 10) + "px";
        } else {
            btn.style.bottom = baseOffset + "px";
        }
    }

    return {
        init: init
    };
})();