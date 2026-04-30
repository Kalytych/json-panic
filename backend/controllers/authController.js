const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendVerificationEmail } = require("../utils/emailService");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    db.get(
      `SELECT * FROM users WHERE email = ? OR username = ?`,
      [email, username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        }

        if (user) {
          if (user.email === email && user.email_verified !== 1) {
            const newVerificationToken = crypto.randomBytes(32).toString("hex");
        
            db.run(
              `
              UPDATE users
              SET email_verification_token = ?
              WHERE id = ?
              `,
              [newVerificationToken, user.id],
              async function (updateErr) {
                if (updateErr) {
                  return res.status(500).json({
                    message: "Failed to update verification token"
                  });
                }
        
                try {
                  await sendVerificationEmail(email, newVerificationToken);
        
                  return res.status(200).json({
                    message: "This email is already registered but not verified. Verification email was sent again."
                  });
        
                } catch (mailError) {
                  console.error("Email resend error:", mailError.message);
        
                  return res.status(500).json({
                    message: "User exists but verification email could not be sent."
                  });
                }
              }
            );
        
            return;
          }
        
          return res.status(400).json({
            message: "User with this email or username already exists"
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        db.run(
          `
          INSERT INTO users (
            username,
            email,
            password,
            role,
            email_verified,
            email_verification_token
          ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            username,
            email,
            hashedPassword,
            "user",
            0,
            verificationToken
          ],
          async function (insertErr) {
            if (insertErr) {
              return res.status(500).json({
                message: "Failed to create user",
                error: insertErr.message
              });
            }

            try {
              await sendVerificationEmail(email, verificationToken);
            } catch (mailError) {
              console.error("Email send error:", mailError.message);

              return res.status(201).json({
                message:
                  "User registered, but verification email could not be sent. Check SMTP settings.",
                user: {
                  id: this.lastID,
                  username,
                  email,
                  role: "user",
                  email_verified: 0
                }
              });
            }

            return res.status(201).json({
              message: "User registered successfully. Please verify your email.",
              user: {
                id: this.lastID,
                username,
                email,
                role: "user",
                email_verified: 0
              }
            });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server error during registration",
      error: error.message
    });
  }
};

const verifyEmail = (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "Verification token is required"
    });
  }

  db.get(
    `SELECT * FROM users WHERE email_verification_token = ?`,
    [token],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          message: "Database error"
        });
      }

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired verification token"
        });
      }

      db.run(
        `
        UPDATE users
        SET email_verified = 1,
            email_verification_token = NULL
        WHERE id = ?
        `,
        [user.id],
        function (updateErr) {
          if (updateErr) {
            return res.status(500).json({
              message: "Failed to verify email"
            });
          }

          return res.json({
            message: "Email verified successfully. You can now log in."
          });
        }
      );
    }
  );
};

const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid password"
        });
      }

      if (user.email_verified !== 1) {
        return res.status(403).json({
          message: "Please verify your email before logging in."
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          email_verified: user.email_verified
        }
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error during login"
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail
};