/**
 * Script to test email configuration
 * Usage: npx ts-node scripts/test-email.ts <recipient-email>
 */

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testEmail(recipientEmail: string) {
  console.log('📧 Testing email configuration...\n');

  // Check environment variables
  console.log('Configuration:');
  console.log(`  SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`  SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`  SMTP_SECURE: ${process.env.SMTP_SECURE}`);
  console.log(`  SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`  SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***' : '(not set)'}`);
  console.log(`  SMTP_FROM: ${process.env.SMTP_FROM}\n`);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Email service not configured. Please set SMTP environment variables.');
    process.exit(1);
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true, // Enable debug output
      logger: true, // Enable logger
    });

    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log(`📤 Sending test email to ${recipientEmail}...`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject: 'Test Email from Typing Toy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">✅ Email Configuration Test</h1>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>SMTP Secure: ${process.env.SMTP_SECURE}</li>
            <li>Sent at: ${new Date().toLocaleString()}</li>
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is a test email from Typing Toy. You can now use the email verification feature.
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);
    console.log('🎉 Email configuration is working correctly!');

  } catch (error) {
    console.error('\n❌ Email test failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);

      // Provide helpful suggestions based on error
      if (error.message.includes('wrong version number') || error.message.includes('SSL')) {
        console.error('\n💡 Suggestion: Check SMTP_SECURE setting');
        console.error('   - Port 587 should use SMTP_SECURE=false (STARTTLS)');
        console.error('   - Port 465 should use SMTP_SECURE=true (SSL/TLS)');
      } else if (error.message.includes('authentication') || error.message.includes('auth')) {
        console.error('\n💡 Suggestion: Check your SMTP username and password');
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
        console.error('\n💡 Suggestion: Check SMTP host and port, ensure server is accessible');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Get recipient email from command line
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.log('Usage: npx ts-node scripts/test-email.ts <recipient-email>');
  console.log('Example: npx ts-node scripts/test-email.ts your@email.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Invalid email address format');
  process.exit(1);
}

testEmail(recipientEmail);
