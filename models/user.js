const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        idProduct: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productImage: { type: String, required: true },
        productName: { type: String, required: true },
        productPrice: { type: String, required: true },
        count: { type: Number, required: true },
        total: { type: Number },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product, count) {
  const cartProductIndex = this.cart.items.findIndex((cartProduct) => {
    return cartProduct.idProduct.toString() === product._id.toString();
  });

  let newCount = count;

  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newCount = this.cart.items[cartProductIndex].count + count;
    updatedCartItems[cartProductIndex].count = newCount;
    updatedCartItems[cartProductIndex].total = newCount * product.price;
  } else {
    updatedCartItems.push({
      idProduct: product._id,
      productImage: product.img1,
      productName: product.name,
      productPrice: product.price,
      count: newCount,
      total: +product.price * newCount,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };

  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.updateToCart = function (product, newCount) {
  const cartProductIndex = this.cart.items.findIndex((cartProduct) => {
    return cartProduct.idProduct.toString() === product._id.toString();
  });

  const updatedCartItems = [...this.cart.items];

  updatedCartItems[cartProductIndex].count = newCount;

  const updateCart = { items: updatedCartItems };
  this.cart = updateCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.idProduct.toString() !== productId.toString();
  });

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
