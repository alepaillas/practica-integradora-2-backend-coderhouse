const formularioRegistro = document.getElementById("formulario-registro");

formularioRegistro.addEventListener("submit", async (event) => {
  event.preventDefault();

  const first_name = document.getElementById("first_name").value;
  const last_name = document.getElementById("last_name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const age = document.getElementById("age").value;

  const datos = {
    first_name,
    last_name,
    email,
    password,
    age,
  };

  try {
    const response = await fetch("/api/session/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (response.ok) {
      alert("Usuario registrado exitosamente");
      window.location.href = "/"; // Redirect to the login page or show success message
    } else {
      const errorResponse = await response.json(); // Parse JSON error response from server
      throw new Error(
        `Error al registrarse: ${errorResponse.msg || response.statusText || "Ocurrió un error"}`,
      );
    }
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    alert(error.message); // Display the error message to the user
  }
});
