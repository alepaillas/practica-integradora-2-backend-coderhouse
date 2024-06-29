import express from "express";
// Importamos el gestor de carritos desde el archivo CartManager.mjs
import { Cart, CartManager, validateUUID } from "../models/CartManager.mjs";

const router = express.Router();

// Función asincrónica para cargar los carritos al iniciar el servidor
async function loadCarts() {
  // Creamos un array vacío para almacenar los carritos en memoria
  const carts = [];
  // Creamos una nueva instancia del gestor de carritos y le pasamos el array de carritos
  // Este patrón se llama dependency injection by constructor injection
  const manager = new CartManager(carts);
  // Cargamos los carritos de nuestro JSON de carritos llamando al método loadCarts del gestor
  await manager.loadCarts();
  // Imprimimos el arreglo de carritos para facilitarle la correción a nuestro tutor
  manager.printCarts();
  // Devolvemos el gestor de carritos cargado para usarlo en main
  return manager;
}

// Función principal que se encarga de definir las rutas y escuchar las peticiones en el servidor
async function main(manager) {
  // Definimos la ruta para devolver los productos de un carrito por ID (UUID)
  router.get("/:cid", async (req, res) => {
    try {
      const cartId = req.params.cid;
      const cart = manager.getCartById(cartId);
      const products = cart.getProducts();

      res.status(200).json({ products });
    } catch (error) {
      if (error.message.includes("no encontrado")) {
        res.status(404).json({ error: "Cart not found." });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  router.post("/", async (req, res) => {
    try {
      const cart = new Cart();
      manager.addCart(cart);

      // guardamos los carritos en el fs
      await manager.saveCarts();

      const id = cart.getId();
      res.status(200).json({ id });
    } catch (error) {
      console.error("Error creating cart:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/:cid/product/:pid", async (req, res) => {
    try {
      // Extraemos el Id de los request parameters
      const cartId = req.params.cid;
      const productId = req.params.pid;

      // Validamos si la busqueda es por UUID, si no, nos ahorramos la lógica siguiente
      if (!validateUUID(cartId)) {
        return res
          .status(400)
          .json({ error: "Invalid cart Id format (expecting UUID)" });
      }

      // Devolverá error si no encuentra el carrito con ese id
      const cart = manager.getCartById(cartId);
      cart.addProduct(productId);

      // guardamos los carritos en el fs
      await manager.saveCarts();

      res.status(200).json({
        message: `Producto con Id: ${productId} agregado al carrito con Id: ${cartId}`,
      });
    } catch (error) {
      if (error.message.includes("no encontrado")) {
        res.status(404).json({ error: "Cart not found." });
      } else {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
}

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    // Cargamos los carritos
    const manager = await loadCarts();
    // Ejecutamos la función principal pasando el gestor de carritos cargado
    await main(manager);
    // Mostramos un mensaje cuando se completen las tareas de inicio
    console.log("Tareas de inicio de carritos completadas.");
  } catch (error) {
    // Si se produce un error durante la inicialización, lo registramos en la consola y salimos del proceso con un código de error
    console.error("Error inicializando la aplicación:", error);
    process.exit(1);
  }
}

// Llamamos a la función para inicializar la aplicación
initializeApp();

export default router;
