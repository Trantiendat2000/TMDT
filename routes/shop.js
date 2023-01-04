const express = require("express");

const router = express.Router();

const shopController = require("../controller/shop");

const isAuth = require("../middlewares/is-auth");

router.get("/products", shopController.getAllProducts);

router.get("/products/pagination", shopController.getPagination);

router.get("/products/:prodId", shopController.getProductDetail);

router.post("/addToCart", isAuth, shopController.postAddToCart);

router.get("/carts", isAuth, shopController.getCart);

router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

router.put("/updateCart", isAuth, shopController.putCartUpdate);

router.post("/email", isAuth, shopController.postEmail);

router.get("/histories", isAuth, shopController.getHistory);

router.get("/histories/:orderId", isAuth, shopController.getDetailHistory);

router.post("/chatrooms/createNewRoom", isAuth, shopController.postNewChatRoom);

router.put("/chatrooms/addMessage", isAuth, shopController.putAddMessage);

router.get("/chatrooms/getById", isAuth, shopController.getMessageByRoomId);

module.exports = router;
