const Product = require("../models/product");
const Order = require("../models/order");
const Session = require("../models/session");

const sgMail = require("@sendgrid/mail");
const io = require("../socket");

sgMail.setApiKey(process.env.API_KEY);

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    if (products.length === 0) {
      return res.status(404).json({ massage: "Product not found!" });
    } else {
      res.status(200).send(products);
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getPagination = async (req, res, next) => {
  const { category, count, page, search } = req.query;

  const startIndex = (page - 1) * count;
  const endIndex = page * count;
  const results = {};
  let products;

  try {
    if (category === "all") {
      products = await Product.find();
    } else {
      products = await Product.find({ category: category });
    }

    results.page = page;
    results.products = products.slice(startIndex, endIndex);
    results.total_page = Math.ceil(products.length / count);

    res.status(200).send(results);
  } catch (err) {
    console.log(err);
  }
};

exports.getProductDetail = async (req, res, next) => {
  const prodId = req.params.prodId;
  const product = await Product.findById(prodId);

  try {
    if (!product) {
      return res.status(404).json({ massage: "Could not find product" });
    } else {
      res.status(200).send(product);
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postAddToCart = async (req, res, next) => {
  const { idUser, idProduct, count } = req.body;
  try {
    const product = await Product.findById(idProduct);
    const reponse = await req.user.addToCart(product, count, idUser);
    res.status(200).json({ message: "Successfully added product to cart" });
  } catch (err) {
    console.log(err);
  }
};

exports.getCart = (req, res, next) => {
  try {
    const cart = req.user.cart.items;
    res.status(200).send(cart);
  } catch (err) {
    console.log(err);
  }
};

exports.putCartUpdate = async (req, res, next) => {
  const updateCount = req.body.count;
  const prodId = req.body.idProduct;

  try {
    const product = await Product.findById(prodId);
    await req.user.updateToCart(product, updateCount);
    res.status(200).json({ message: "Successfully updated product to cart" });
  } catch (err) {
    console.log(err);
  }
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.idProduct;

  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.status(200).json({ message: "Delete Successfully" });
    })
    .catch((err) => console.log(err));
};

exports.postEmail = async (req, res, next) => {
  const { to, fullname, phone, address, idUser } = req.body;

  try {
    const products = req.user.cart.items.map((item) => {
      return {
        quantity: item.count,
        product: item._doc,
      };
    });

    let totalBill = 0;
    for (let i = 0; i < products.length; i++) {
      totalBill += products[i].product.total * products[i].product.count;
    }

    const order = new Order({
      user: {
        name: fullname,
        phone: phone,
        address: address,
        userId: req.user._id,
      },
      orderDate: new Date(),
      orderStatus: "order successfully",
      orderDelivery: "Processing",
      totalBill: totalBill,
      products: products,
    });

    const saveOrder = await order.save();
    if (saveOrder) {
      // let transporter = nodemailer.createTransport({
      //   service: "email",
      //   auth: {
      //     user: "datsam20@gmail.com",
      //     pass: "Tiendat0948756694",
      //   },
      // });

      const message = {
        from: "datsam20@gmail.com",
        to: to,
        subject: "YOUR ORDER SUCCESSFULLY",
        html: `
          <h1>Xin chào ${saveOrder.user.name}</h1><br />
          <p>Phone: ${saveOrder.user.phone}</p>
          <p>Address: ${saveOrder.user.address}</p>
          <table>
            <thead>
              <tr>
                <th style="border: 1px solid black">Tên sản phẩm</th>
                <th style="border: 1px solid black">Hình ảnh</th>
                <th style="border: 1px solid black">Giá</th>
                <th style="border: 1px solid black">Số lượng</th>
                <th style="border: 1px solid black">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${saveOrder.products.map((prod) => {
                return `
                  <tr>
                    <td style="border: 1px solid black">${
                      prod.product.productName
                    }</td>
                    <td style="border: 1px solid black"><img src = "${
                      prod.product.productImage
                    }" width="80" height="80" /></td>
                    <td style="border: 1px solid black">${
                      prod.product.productPrice
                    }</td>
                    <td style="border: 1px solid black">${prod.quantity}</td>
                    <td style="border: 1px solid black">${
                      prod.quantity * prod.product.productPrice
                    }</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
          <p>Ngày đặt hàng: ${saveOrder.orderDate.toLocaleDateString(
            "en-GB"
          )}</p>
          <h2>Tổng thanh toán: ${saveOrder.totalBill} VND</h2><br />
          <h2>Cảm ơn bạn đã đạt hàng!.</h2>
        `,
      };

      sgMail
        .send(message)
        .then((res) => {
          console.log("Email sent");
          req.user.clearCart();
        })
        .catch((err) => console.log(err.message));

      // transporter.sendMail(mailDetails, (err, info) => {
      //   if (err) {
      //     return console.log(err);
      //   } else {
      //     console.log("Email send!");
      //     req.user.clearCart();
      //     res.status(201).json({ message: "New order created" });
      //   }
      // });
    } else {
      res.status(400).json({ message: "No order" });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getHistory = async (req, res, next) => {
  const { idUser } = req.query;

  try {
    const userOrders = await Order.find({ "user.userId": idUser });
    res.status(200).send(userOrders);
  } catch (err) {
    console.log(err);
  }
};

exports.getDetailHistory = async (req, res, next) => {
  const { orderId } = req.params;

  try {
    const orderDetail = await Order.findById(orderId);
    res.status(200).send(orderDetail);
  } catch (err) {
    console.log(err);
  }
};

exports.postNewChatRoom = async (req, res, next) => {
  try {
    const session = new Session({
      user: {
        name: req.user.fullname,
        userId: req.user._id,
      },
      createdDate: new Date(),
      messages: [],
    });

    const savedSession = await session.save();
    res
      .status(200)
      .json({ msg: "New chat room created", session: savedSession });
  } catch (err) {
    console.log(err);
  }
};

exports.putAddMessage = async (req, res, next) => {
  const { roomId, message } = req.body;

  try {
    const chatRoom = await Session.findById(roomId);

    const addMessage = await chatRoom.addMessage(message);
    io.getIO().emit("send_message", (data) => {
      console.log(data);
    });
    res.status(200).send(chatRoom);
  } catch (err) {
    console.log(err);
  }
};

exports.getMessageByRoomId = async (req, res, next) => {
  const roomId = req.query.roomId;

  try {
    const chatRoom = await Session.findById(roomId);
    res.status(200).send(chatRoom);
  } catch (err) {
    console.log(err);
  }
};
