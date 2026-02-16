interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailTemplatesService {
  getOTPTemplate(otp: string): EmailTemplate {
    return {
      subject: 'Your One-Time Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db; margin: 20px 0; }
            .footer { color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Your One-Time Password</h2>
            </div>
            <p>Hello,</p>
            <p>Your one-time password is:</p>
            <div class="code">${otp}</div>
            <p>This code will expire in 5 minutes. Please do not share this code with anyone.</p>
            <div class="footer">
              <p>If you did not request this code, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getWelcomeTemplate(name: string): EmailTemplate {
    return {
      subject: 'Welcome to Anora Admin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3498db; color: white; padding: 30px; border-radius: 5px; text-align: center; }
            .button { background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Anora Admin</h1>
            </div>
            <p>Hello ${name},</p>
            <p>Your account has been successfully created. You can now log in with your credentials.</p>
            <p><a class="button" href="https://anora.admin/login">Log In Now</a></p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
        </html>
      `,
    };
  }

  getPasswordResetTemplate(resetLink: string): EmailTemplate {
    return {
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; color: #856404; }
            .button { background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <p><a class="button" href="${resetLink}">Reset Password</a></p>
            <div class="warning">
              <p><strong>Note:</strong> This link will expire in 1 hour. If you did not request this reset, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getProjectUpdateTemplate(projectName: string, update: string): EmailTemplate {
    return {
      subject: `Project Update: ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .project-name { color: #3498db; font-weight: bold; }
            .update-box { background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Project Update</h2>
            <p>Hello,</p>
            <p>There's an update on your project: <span class="project-name">${projectName}</span></p>
            <div class="update-box">
              ${update}
            </div>
            <p>Thank you for working with us!</p>
          </div>
        </body>
        </html>
      `,
    };
  }

  getDeadlineReminderTemplate(projectName: string, daysRemaining: number): EmailTemplate {
    return {
      subject: `Project Deadline Reminder: ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background-color: #f8d7da; padding: 15px; border-radius: 5px; color: #721c24; }
            .days { font-size: 24px; font-weight: bold; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Project Deadline Reminder</h2>
            <p>Hello,</p>
            <div class="alert">
              <p>Your project <strong>${projectName}</strong> has <span class="days">${daysRemaining}</span> days remaining.</p>
              <p>Please ensure all necessary preparations are completed on time.</p>
            </div>
            <p>If you need any assistance, please reach out to us.</p>
          </div>
        </body>
        </html>
      `,
    };
  }

  getStatusChangeTemplate(projectName: string, newStatus: string): EmailTemplate {
    return {
      subject: `Project Status Update: ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .status-badge { display: inline-block; padding: 10px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .status-active { background-color: #d4edda; color: #155724; }
            .status-completed { background-color: #cce5ff; color: #004085; }
            .status-on-hold { background-color: #fff3cd; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Project Status Update</h2>
            <p>Hello,</p>
            <p>The status of your project <strong>${projectName}</strong> has been updated.</p>
            <p>New Status: <span class="status-badge status-${newStatus.toLowerCase()}">${newStatus}</span></p>
            <p>We will continue to keep you informed on the progress.</p>
          </div>
        </body>
        </html>
      `,
    };
  }

  getInvoiceTemplate(invoiceNumber: string, amount: number, dueDate: string): EmailTemplate {
    return {
      subject: `Invoice ${invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .invoice-header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
            .invoice-details { background-color: #ecf0f1; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="invoice-header">
              <h2>Invoice #${invoiceNumber}</h2>
            </div>
            <div class="invoice-details">
              <p><strong>Amount Due:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <p>Thank you for your business!</p>
          </div>
        </body>
        </html>
      `,
    };
  }
}

export const emailTemplatesService = new EmailTemplatesService();
