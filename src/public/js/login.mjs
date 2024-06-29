const formularioLogin = document.getElementById("formulario-login");

formularioLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const datos = {
    email,
    password,
  };

  try {
    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (response.ok) {
      window.location.href = "/"; // Redirect to the main page on successful login
    } else {
      const errorResponse = await response.json(); // Parse the JSON error response
      throw new Error(`Error de inicio de sesión: ${errorResponse.msg}`);
    }
  } catch (error) {
    //console.error("Error al iniciar sesión:", error);
    alert(error.message); // Display the more informative error message
  }
});
