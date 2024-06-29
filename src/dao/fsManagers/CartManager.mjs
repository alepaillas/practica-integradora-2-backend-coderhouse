// Este código implementa un sistema para gestionar productos de un carrito usando clases en JavaScript.
// Se utilizan archivos locales para el modelo de persistencia de datos.

//  Importar funciones loadProducts y saveProducts
import { loadCarts, saveCarts } from "./utils/fs.mjs";

// funcion de chatGPT para generar UUIDs que usaremos para identificar los productos mas adelante
/*
  Utiliza una expresión regular /[xy]/g para hacer coincidir cada caracter 'x' y 'y' en la cadena de plantilla del UUID.
  Para cada caracter coincidente, genera un dígito hexadecimal aleatorio (r) utilizando Math.random() y manipulación de bits (| 0).
  Para los caracteres 'x', utiliza el dígito aleatorio directamente.
  Para los caracteres 'y', aplica operaciones específicas de bits ((r & 0x3 | 0x8)) para asegurar que el UUID cumpla con la especificación de la versión 4 de UUID.
  Convierte cada dígito aleatorio en una cadena hexadecimal utilizando .toString(16) y devuelve la cadena UUID final.
*/
export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8; // operador ternario
    return v.toString(16);
  });
}

// para validar los UUID generados
export function validateUUID(uuid) {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}
// Example usage:
// const uuid = generateUUID();
// console.log(uuid); // Output: something like "3d16f03e-08b4-4c08-9e1d-78bfbf7b0ac5"

export class Cart {
  #id;
  #products;

  constructor() {
    this.#id = generateUUID();
    this.#products = []; // Array to store product objects
  }

  getId() {
    return this.#id;
  }

  getProducts() {
    return this.#products; // Return the entire array of product objects
  }

  getCartAsObject() {
    return {
      id: this.getId(),
      products: this.getProducts(),
    };
  }

  printCart() {
    console.log(this.getCartAsObject());
  }

  addProduct(productId) {
    const existingProduct = this.#products.find(
      (product) => product.id === productId
    );

    if (existingProduct) {
      existingProduct.quantity++; // Increment quantity for existing product
    } else {
      this.#products.push({ id: productId, quantity: 1 }); // Add new product object
    }
  }

  updateId(id) {
    this.#id = id;
  }
}

export class CartManager {
  #carts;

  // dependency injection by constructor injection
  // pasamos un arreglo vacio donde se guardaran los productos en memoria
  constructor(carts) {
    this.#carts = carts;
  }

  getCarts() {
    return this.#carts;
  }

  getCartsAsObjects() {
    const cartsObjects = [];
    this.#carts.forEach((cart) => {
      cartsObjects.push(cart.getCartAsObject());
    });

    return cartsObjects;
  }

  getCartById(cartId) {
    const cart = this.#carts.find(
      (carritoExistente) => carritoExistente.getId() === cartId
    );

    if (!cart) {
      throw new Error(`Carrito con Id: ${cartId} no encontrado.`);
    }

    return cart;
  }

  // iteramos nuestro arreglo de productos para obtener todos los productos
  printCarts() {
    console.log("Estos son los carritos almacenados:");
    this.#carts.forEach((cart) => {
      cart.printCart();
    });
  }

  addCart(cart) {
    this.#carts.push(cart);
  }

  async loadCarts() {
    try {
      // Cargar carritos del archivo JSON
      const cartsJSON = await loadCarts();
      //console.log(cartsJSON[0].products);

      const carts = [];

      // convertir los objetos a productos de la clase Product
      cartsJSON.forEach((cartData) => {
        const cart = new Cart();

        cartData.products.forEach((product) => {
          //console.log("Product ID:", product.id);
          // Access the quantity property of the product
          const quantity = product.quantity;

          // Loop and call addProduct for the specified quantity
          for (let i = 0; i < quantity; i++) {
            cart.addProduct(product.id);
          }
        });

        cart.updateId(cartData.id);

        carts.push(cart);
      });
      this.#carts = carts;
    } catch (error) {
      console.error("Error loading carts:", error);
    }
  }

  async saveCarts() {
    try {
      // Save current carts to the file using the imported function
      await saveCarts(this.getCartsAsObjects());
    } catch (error) {
      console.error("Error saving carts:", error);
      // Handle saving errors (e.g., disk errors)
    }
  }
}
