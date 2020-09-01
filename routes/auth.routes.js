const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // to generate token
const bcrypt = require('bcryptjs'); // encrypt password

//Check validation for express
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar') // get user image by email

//Models
const User = require('../models/User');

//@route POST api/user/register
//@desc Register user
//@access Public
router.post(
  '/register',
  [
    //validation
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more cheracters')
      .isLength({ min: 6 })
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      })
    }

    //get name and email and password from request
    const { name, email, password } = req.body

    try {
      //Check if user already exist
      let user = await User.findOne({ email })

      //If user exist
      if (user) {
        return res.status(400).json({
          error: [
            {
              msg: 'User already exists'
            }
          ]
        })
      }

      //If not exists
      //Get image from gravatar
      const avatar = gravatar.url(email, {
        s: '200', //Size
        r: 'pg', //Rate
        d: 'mm'
      })

      //create user object
      user = new User({
        name, email, avatar, password
      })

      //encrypt password
      const salt = await bcrypt.genSalt(10); // generrate salt contains 10
      //save password
      user.password = await bcrypt.hash(password, salt); //use user password and salt to hash password
      //sava user in DB
      await user.save()

      //payload to generate token
      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        process.env.JWT_SECRET, {
        expiresIn: 360000 // for dev for product it will 3600
      },
        (err, token) => {
          if (err) throw err;
          res.json({ token })
        }
      )

    } catch (error) {
      console.log(err.message);
      res.status(500).send('Server error')
    }

  })

module.exports = router