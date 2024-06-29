import express from "express";
// Importamos el gestor de productos desde el archivo ProductManager.mjs
import {
  Product,
  ProductManager,
  validateUUID,
} from "../dao/fsManagers/ProductManager.mjs";

const router = express.Router();

// Definimos el límite predeterminado de productos a devolver
const DEFAULT_LIMIT = 10;

// Función asincrónica para cargar los productos al iniciar el servidor
async function loadProducts() {
  // Creamos un array vacío para almacenar los productos en memoria
  const products = [];
  // Creamos una nueva instancia del gestor de productos y le pasamos el array de productos
  // Este patrón se llama dependency injection by constructor injection
  const manager = new ProductManager(products);
  // Cargamos los productos de nuestro JSON de productos llamando al método loadProducts del gestor
  await manager.loadProducts();
  // Imprimimos el arreglo de productos para facilitarle la correción a nuestro tutor
  manager.printProducts();
  // Devolvemos el gestor de productos cargado para usarlo en main
  return manager;
}

// Función principal que se encarga de definir las rutas y escuchar las peticiones en el servidor
async function main(manager) {
  // Definimos una ruta GET para obtener la lista de productos
  router.get("/", async (req, res) => {
    try {
      // Obtenemos el límite de productos a devolver del parámetro de consulta 'limit', o utilizamos el límite predeterminado si no se proporciona
      const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;

      // Verificamos si el límite es un número válido y mayor o igual a cero
      if (limit < 0 || Number.isNaN(limit)) {
        // Si el límite no es válido, devolvemos un error 400 con un mensaje de error
        return res.status(400).json({ error: "Invalid limit parameter" });
      }

      // Obtenemos todos los productos como objetos del gestor de productos
      const products = await manager.getProductsAsObjects();
      // Limitamos la cantidad de productos a devolver utilizando el límite especificado
      const limitedProducts = products.slice(0, limit);
      // Enviamos la lista de productos limitada como respuesta
      res.json(limitedProducts);
    } catch (error) {
      // Si se produce un error, lo registramos en la consola y devolvemos un error 500 con un mensaje de error
      console.error("Error getting products:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Definimos la ruta para devolver un producto por ID (UUID)
  router.get("/:pid", async (req, res) => {
    try {
      // Extraemos el Id de los request parameters
      const productId = req.params.pid;

      // Validamos si la busqueda es por UUID, si no, nos ahorramos la lógica siguiente
      if (!validateUUID(productId)) {
        return res
          .status(400)
          .json({ error: "Invalid product ID format (expecting UUID)" });
      }

      // Conseguimos nuestro producto del manager
      const product = await manager.getProductById(productId);

      // Si no se encuentra, devuelve 404
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Convertimos nuestro producto de la clase Product a un objeto
      const productJSON = product.getProductAsObject();

      // Devolvemos el producto como JSON
      res.json(productJSON);
    } catch (error) {
      // En caso de un error más genérico
      console.error("Error getting product:", error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      // Extraemos los datos del producto del json del request body
      const { title, price, description, thumbnail, code, stock } = req.body;

      // Revisamos si falta algun campo desestructurado del body
      if (!title || !price || !description || !thumbnail || !code || !stock) {
        throw new Error("Missing required fields"); // Error si falta un dato
      }

      // IMPORTANTE
      // Como Javascript no tiene tipado de datos es súper importante pasar los campos en este orden exacto,
      // sino, se puede crear el producto con un precio igual a un string que contenga la descripcion.
      const product = new Product(
        title,
        price,
        description,
        thumbnail,
        code,
        stock
      );

      // Devolverá error si es que existe un producto con el mismo código en el arreglo de productos
      manager.addProduct(product);
      // Guardamos nuestros productos en el filesystem
      // Aca hay posibilidad de optimizar ya que estamos escribiendo todos los productos que hay en memoria
      // cuando en realidad lo que queremos es solo concatenar el nuevo producto
      await manager.saveProducts();

      // devolvemos el producto creado con su Id generado como uuid
      res.status(201).json(product.getProductAsObject());
    } catch (error) {
      if (error.message === "Missing required fields") {
        // 400 Bad Request si faltan datos para crear el producto
        return res.status(400).json({ error: "Missing required fields" });
      } else if (error.message == "Ya existe un producto con este código.") {
        return res
          .status(409)
          .json({ error: "Ya existe un producto con este código." });
      } else {
        // Otros errores
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  router.post("/:pid", async (req, res) => {
    try {
      // Extraemos el Product Id del request parameter
      const productId = req.params.pid;

      // Validamos si la busqueda es por UUID, si no, nos ahorramos la lógica siguiente
      if (!validateUUID(productId)) {
        return res
          .status(400)
          .json({ error: "Invalid product ID format (expecting UUID)" });
      }

      // Extraemos los datos del producto del json del request body
      const product = req.body;
      // Desestructuramos para verificar si estan todos los campos requeridos
      const { title, price, description, thumbnail, code, stock } = product;

      // Revisamos si falta algun campo desestructurado del body
      if (!title || !price || !description || !thumbnail || !code || !stock) {
        throw new Error("Missing required fields"); // Error si falta un dato
      }

      // Devolverá error si es que existe un producto con el mismo código en el arreglo de productos
      // También devolverá error si es que no encuentra producto con el Id buscado
      manager.updateProduct(productId, product);
      // Guardamos nuestros productos en el filesystem
      // Aca hay posibilidad de optimizar ya que estamos escribiendo todos los productos que hay en memoria
      // cuando en realidad lo que queremos es solo concatenar el nuevo producto
      await manager.saveProducts();

      // devolvemos el producto actualizado
      res.status(201).json({ id: productId, ...product });
    } catch (error) {
      if (error.message === "Missing required fields") {
        // 400 Bad Request si faltan datos para crear el producto
        return res.status(400).json({ error: "Missing required fields" });
      } else if (error.message.includes("No existe un producto con ID:")) {
        return res
          .status(404)
          .json({ error: "No existe un producto con el Id buscado." });
      } else if (
        error.message ==
        "No puedes asignar un código de producto que ya está en uso."
      ) {
        return res.status(409).json({
          error: "No puedes asignar un código de producto que ya está en uso.",
        });
      } else {
        // Otros errores
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  router.delete("/:pid", async (req, res) => {
    try {
      // Extraer el ID del producto del parámetro de la ruta
      const productId = req.params.pid;

      // Aqui ya repeti este codigo 3 veces, debería convertirlo en un middleware pero no alcanzo xd
      // Validamos si la busqueda es por UUID, si no, nos ahorramos la lógica siguiente
      if (!validateUUID(productId)) {
        return res
          .status(400)
          .json({ error: "Invalid product ID format (expecting UUID)" });
      }

      // Enviará error si no encuentra el producto
      manager.deleteProduct(productId);
      // Guardamos nuestros productos en el FS
      manager.saveProducts();

      // Enviar respuesta de éxito
      res
        .status(200)
        .json({ message: `Producto con ID: ${productId} eliminado` });
    } catch (error) {
      if (error.message.includes("No existe un producto con ID:")) {
        res
          .status(404)
          .json({ error: "No existe un producto con el Id buscado" });
      } else {
        // Otros errores
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  });
}

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    // Cargamos los productos
    const manager = await loadProducts();
    // Ejecutamos la función principal pasando el gestor de productos cargado
    await main(manager);
    // Mostramos un mensaje cuando se completen las tareas de inicio
    console.log("Tareas de inicio de productos completadas.");
  } catch (error) {
    // Si se produce un error durante la inicialización, lo registramos en la consola y salimos del proceso con un código de error
    console.error("Error inicializando la aplicación:", error);
    process.exit(1);
  }
}

// Llamamos a la función para inicializar la aplicación
initializeApp();

export default router;
