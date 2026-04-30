const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const verifyLink = `${process.env.FRONTEND_URL}/verify.html?token=${token}`;

  await transporter.sendMail({
    from: `"JSON Panic" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Підтвердження email – JSON Panic",
    html: `
      <h2>JSON Panic</h2>
      <p>Дякуємо за реєстрацію.</p>
      <p>Щоб активувати акаунт, натисніть кнопку:</p>
      <a href="${verifyLink}" style="padding:12px 18px;background:#22d3ee;color:#020617;text-decoration:none;border-radius:8px;font-weight:bold;">
        Підтвердити email
      </a>
      <p>Якщо кнопка не працює, відкрийте це посилання:</p>
      <p>${verifyLink}</p>
    `
  });
};

module.exports = {
  sendVerificationEmail
};