const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongodb = require("mongodb");

const User = require("../models/user");
const Product = require("../models/product");
const Session = require("../models/session");
const Order = require("../models/order");

exports.postAdminSignup = async (req, res, next) => {
  const { fullname, email, password, phone } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const hashedPass = await bcrypt.hash(password, 12);
      const newUser = new User({
        fullname: fullname,
        email: email,
        password: hashedPass,
        phone: phone,
        role: "Admin",
      });
      const response = await newUser.save();
      if (!response) {
        res.statusMessage = "Cannt create admin user";
        return res.status(400).end();
      } else {
        res.statusMessage = "New admin user created";
        res.status(200).end();
      }
    } else {
      res.statusMessage = "This email is already been used";
      res.status(400).end();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postAdminSignin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({ message: "User not found!" });
    } else {
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        return res.status(401).json({ message: "Wrong password!" });
      } else {
        const accessToken = jwt.sign(
          user.toJSON(),
          `${process.env.ACCESS_TOKEN}`
        );

        res.status(200).json({ accessToken: accessToken });
      }
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).send(products);
  } catch (err) {
    console.log(err);
  }
};

exports.postSearchProducts = async (req, res, next) => {
  const query = req.body.query;

  try {
    const products = await Product.find();
    const results = products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    res.status(200).send(results);
  } catch (err) {
    console.log(err);
  }
};

exports.getAllChatRooms = async (req, res, next) => {
  try {
    const chatRooms = await Session.find();
    res.status(200).send(chatRooms);
  } catch (err) {
    console.log(err);
  }
};

exports.getChatRoomById = async (req, res, next) => {
  const roomId = req.query.roomId;

  try {
    const chatRoom = await Session.findById(roomId);
    res.status(200).send(chatRoom);
  } catch (err) {
    console.log(err);
  }
};

exports.getClients = async (req, res, next) => {
  try {
    const users = await User.find();
    const clients = users.filter((user) => user.role === "client");
    res.status(200).send(clients);
  } catch (err) {
    console.log(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();
    let earning = 0;
    for (let i = 0; i < orders.length; i++) {
      earning += orders[i].totalBill;
    }
    res.status(200).json({ earning: earning, orders: orders });
  } catch (err) {
    console.log(err);
  }
};

exports.postNewProduct = async (req, res, next) => {
  const { productName, category, price, shortDesc, longDesc } = req.body;
  const images = req.files.map((file) => "http://localhost:5000/" + file.path);

  try {
    const product = new Product({
      name: productName,
      category: category,
      img1: images[0],
      img2: images[1],
      img3: images[2],
      img4: images[3],
      long_desc: longDesc,
      short_desc: shortDesc,
      price: price,
    });
    const response = await product.save();
    res.status(201).json({ message: "New product added" });
  } catch (err) {
    console.log(err);
  }
};

exports.postDeleteProduct = (req, res, next) => {
  const id = req.body.id;
  console.log(req.body);

  Product.findOne({ _id: id })
    .then((hotel) => {
      hotel.delete();
      res.status(200).json({ message: "Hotel Deleted" });
    })
    .catch((err) => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
  const { prodId } = req.params;

  Product.findOne({ _id: prodId })
    .then((prod) => {
      res.status(200).send(prod);
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.params.prodId;
  const {
    name,
    category,
    img1,
    img2,
    img3,
    img4,
    long_desc,
    short_desc,
    price,
  } = req.body;

  console.log(req.body);

  Product.findOne({ _id: prodId })
    .then((prod) => {
      prod.name = name;
      prod.category = category;
      prod.img1 = img1;
      prod.img2 = img2;
      prod.img3 = img3;
      prod.img4 = img4;
      prod.long_desc = long_desc;
      prod.short_desc = short_desc;
      prod.price = price;
      prod.save();
      res.status(201).json({ message: "Hotel Updated!" });
    })
    .catch((err) => console.log(err));
};
