const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
//@import models
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require("passport");

let referralCodes = require("referral-codes");
var nodeEth = require("node-eth-address");
var Wallet = require("ethereumjs-wallet");
const EthWallet = Wallet.default.generate();
//@import validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
// @route   GET users/test
// @desc    Return current user
// @access  Public
router.get("/test", (req, res) => {});
// @route    POST users/resigter
// @desc     Register user
// @access   Public
router.post("/register", async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  const { username, password, referralcode } = req.body;
  const address = EthWallet.getAddressString();
  const privateKey = EthWallet.getPrivateKeyString();
  if (!isValid) {
    return res.status(400).send(errors);
  }
  if (!nodeEth.validateAddress(address)) {
    return res.status(400).json({ address: "Address in not valid" });
  }
  let user = await User.findOne({ name: username });
  let check_add = await User.findOne({ address: address });

  if (user) {
    return res.status(400).json({ name: "User already exists" });
  }
  if (check_add) {
    return res.status(400).json({ address: "Address already exists" });
  }
  if (!nodeEth.validateAddress(address)) {
    return res.status(400).json({ address: "Address in not valid" });
  }
  if (referralcode) {
    let referral_person = await User.findOne({ owncode: referralcode });
    if (!referral_person) {
      return res.status(400).json({ referralcode: "Referral code not found" });
    }
  }
  const code = referralCodes.generate({
    length: 8,
    count: 1,
    charset: username,
  });
  user = new User({
    name: username,
    password,
    address,
    referralcode: referralcode,
    owncode: code[0],
    privateKey,
  });

  // const salt = await bcrypt.genSalt(10);
  // user.password = await bcrypt.hash(password, salt);
  console.log(user);
  await user
    .save()
    .then((item) => {
      return res.status(200).json({ msg: "success" });
    })
    .catch((err) => {
      return res.status(400).json({ errors: err });
    });
});
// @route    POST users/login
// @desc     Login user
// @access   Public
router.post("/login", async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const name = req.body.username;
  const password = req.body.password;

  // Find user by email
  User.findOne({ name }).then((user) => {
    // Check for user
    if (!user) {
      errors.name = "User not found";
      return res.status(404).json(errors);
    }
    if (password === user.password) {
      const payload = {
        id: user.id,
        name: user.name,
        role: user.role,
        address: user.address,
        countETH: user.countETH,
        countHDT: user.countHDT,
        owncode: user.owncode,
        referralcode: user.referralcode,
      };
      jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
        res.json({
          success: true,
          token: "Bearer " + token,
        });
      });
    } else {
      errors.password = "Password incorrect";
      return res.status(400).json(errors);
    }
  });
});
// @route   GET users/current
// @desc    Return current user
// @access  Private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    return res.status(200).json(req.user);
  }
);
// @route   post users/getuser
// @desc    Return user by id
// @access  Private
router.post(
  "/getuser",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { id } = req.body;
    User.findOne({ _id: id })
      .then((user) => {
        return res.status(200).json(user);
      })
      .catch((err) => {
        return res.status(400).json({ errors: err });
      });
  }
);
// @route   GET users/all
// @desc    Return all users info
// @access  Private
router.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.find()
      .then((item) => {
        return res.status(200).json(item);
      })
      .catch((err) => {
        return res.status(400).json({ errors: err });
      });
  }
);
module.exports = router;
