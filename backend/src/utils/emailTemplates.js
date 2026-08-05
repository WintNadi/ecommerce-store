export const emailTemplates = {
  welcomeEmail: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Store!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with us. We're excited to have you on board!</p>
          <p>Start exploring our products and find amazing deals.</p>
          <a href="${process.env.CLIENT_URL}/shop" class="button">Start Shopping</a>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordResetEmail: (name, resetUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  verificationEmail: (name, verifyUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        </div>
      </div>
    </body>
    </html>
  `
};
