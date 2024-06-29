import mongoose from "mongoose";

const cartCollection = "carts";

const cartsSchema = new mongoose.Schema({
  products: {
    type: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
        quantity: Number,
      },
    ],
  },
});

cartsSchema.pre("find", function () {
  this.populate("products.product");
});

cartsSchema.pre("findOne", function () {
  this.populate("products.product");
});

// Moodelo utilizado para manejar la base de datos
export const cartModel = mongoose.model(cartCollection, cartsSchema);
