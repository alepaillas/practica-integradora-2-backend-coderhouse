import { Router } from "express";
import productDao from "../dao/mongoDao/product.dao.mjs";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { limit, page, sort, category, status } = req.query;
    const options = {
      limit: limit || 10,
      page: page || 1,
      sort: {
        price: sort === "asc" ? 1 : -1,
      },
      lean: true,
    };

    // seguridad al buscar por página
    if (
      isNaN(page) ||
      parseInt(page, 10) === NaN ||
      page < 1 ||
      page > Math.MAX_SAFE_INTEGER / options.limit
    ) {
      return res.status(400).json({
        status: "Error",
        msg: "La página buscada debe ser un número entero positivo dentro de un rango válido.",
      });
    }

    // aqui esta bien feo el código hay que rescribirlo segun DRY
    if (status) {
      const products = await productDao.getAll({ status: status }, options);
      if (products.totalPages < page || page <= 0) {
        return res
          .status(400)
          .json({ status: "Error", msg: "Página fuera de rango." });
      }
      return res.status(200).json({ products });
    }

    if (category) {
      const products = await productDao.getAll({ category: category }, options);
      if (products.totalPages < page || page <= 0) {
        return res
          .status(400)
          .json({ status: "Error", msg: "Página fuera de rango." });
      }
      return res.status(200).json({ products });
    }

    const products = await productDao.getAll({}, options);
    if (products.totalPages < page || page <= 0) {
      return res
        .status(400)
        .json({ status: "Error", msg: "Página fuera de rango." });
    }

    res.status(200).json({ status: "success", products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Error", msg: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productDao.getById(id);
    if (!product)
      return res
        .status(404)
        .json({ status: "Error", msg: `Producto no encontrado con id: ${id}` });
    res.status(200).json({ status: "success", payload: product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Error", msg: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const product = req.body;
    const newProduct = await productDao.create(product);
    // Cuando se ha creado algo nuevo va el status 201
    res.status(201).json({ status: "success", payload: newProduct });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      // Handle duplicate key error
      console.error(error);
      res.status(400).json({
        status: "Error",
        msg: `Producto con código "${error.keyValue.code}" ya existe. Elija un código único para el producto.`,
      });
    } else {
      console.error(error);
      // Handle other errors (consider logging the full error for debugging)
      res.status(500).json({ status: "Error", msg: "Error al crear producto" });
    }
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productDao.deleteOne(id);
    if (!product)
      return res
        .status(404)
        .json({ status: "Error", msg: `Producto no encontrado con id: ${id}` });
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Error", msg: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const updatedProduct = await productDao.update(id, productData);
    if (!updatedProduct)
      return res
        .status(404)
        .json({ status: "Error", msg: `Producto no encontrado con id: ${id}` });
    res.status(200).json({ status: "success", payload: updatedProduct });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Error", msg: "Internal server error" });
  }
});

export default router;
