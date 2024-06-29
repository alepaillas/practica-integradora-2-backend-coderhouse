document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", async function (event) {
      event.preventDefault(); // Evita el comportamiento predeterminado del enlace

      try {
        const response = await fetch("/api/session/logout", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok) {
          alert(result.msg); // Mostrar mensaje de éxito
          // Redirigir al usuario a la página de inicio de sesión u otra página
          window.location.href = "/";
        } else {
          alert(result.msg); // Mostrar mensaje de error
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cerrar sesión. Inténtalo de nuevo más tarde.");
      }
    });
  }
});
