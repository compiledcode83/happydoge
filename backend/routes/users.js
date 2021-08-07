const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require("passport");
let referralCodes = require("referral-codes");
var nodeEth = require("node-eth-address");

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
  const { username, password, address, referralcode } = req.body;
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
    address: address,
    referralcode: referralcode,
    owncode: code[0],
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
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

    // Check Password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User Matched
        const payload = {
          id: user.id,
          name: user.name,
          address: user.address,
          countETH: user.countETH,
          countHDT: user.countHDT,
          owncode: user.owncode,
          referralcode: user.referralcode,
        }; // Create JWT Payload

        // Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token,
            });
          }
        );
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
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
// @route   GET users by id
// @desc    Return user by id
// @access  Private
router.post(
  "/getuser",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log(req.body);
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

module.exports = router;