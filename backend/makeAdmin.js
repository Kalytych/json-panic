const db = require("./db");

const email = "test@test.com";

db.run(
  `UPDATE users SET role = 'admin' WHERE email = ?`,
  [email],
  function (err) {
    if (err) {
      console.error("Failed to make admin:", err.message);
      process.exit();
    }

    console.log("Admin role updated for:", email);
    process.exit();
  }
);