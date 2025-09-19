import express from 'express';
import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Define interfaces for type safety
interface EmailTestResult {
  success: boolean;
  provider: string;
  messageId?: string;
  response?: string;
  error?: string;
  code?: string;
  command?: string;
}

interface PortTestResult {
  port: number;
  secure: boolean;
  name: string;
  success: boolean;
  error?: string;
}

interface TestResults {
  titanEmail: EmailTestResult | null;
  gmailEmail: EmailTestResult | null;
  titanAlternativePorts: PortTestResult[] | null;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
  };
}

// Test Email Service Class
class TestEmailService {
  async testTitanEmail(): Promise<EmailTestResult> {
    console.log('🧪 Testing Titan Email Configuration...');

    const transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 587,
      secure: false,
      auth: {
        user: 'zohaib@jidatit.uk',
        pass: '@optipleX360@',
      },
      family: 4, // force IPv4
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      debug: true,
      logger: true,
    } as SMTPTransport.Options);

    try {
      // Test 1: Verify connection
      console.log('🔍 Step 1: Testing SMTP connection...');
      await transporter.verify();
      console.log('✅ Titan Email connection: SUCCESS');

      // Test 2: Send test email
      console.log('🔍 Step 2: Sending test email...');
      const result = await transporter.sendMail({
        from: '"Test LMS System" <zohaib@jidatit.uk>',
        to: 'aqeel4622@gmail.com',
        subject: 'Test Email from Titan SMTP - ' + new Date().toISOString(),
        html: `
          <h2>Test Email</h2>
          <p>This is a test email sent at: ${new Date().toISOString()}</p>
          <p>If you receive this, Titan Email SMTP is working correctly!</p>
        `,
      });

      console.log('✅ Email sent successfully via Titan:', {
        messageId: result.messageId,
        response: result.response,
      });

      return {
        success: true,
        provider: 'Titan Email',
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error: any) {
      console.error('❌ Titan Email test failed:', {
        error: error.message,
        code: error.code,
        command: error.command,
      });

      return {
        success: false,
        provider: 'Titan Email',
        error: error.message,
        code: error.code,
        command: error.command,
      };
    }
  }

  async testGmailEmail(): Promise<EmailTestResult> {
    console.log('🧪 Testing Gmail Configuration...');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'aqeel4622@gmail.com',
        pass: 'your-app-password', // Replace with actual app password
      },
      debug: true,
      logger: true,
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });

    try {
      // Test 1: Verify connection
      console.log('🔍 Step 1: Testing Gmail SMTP connection...');
      await transporter.verify();
      console.log('✅ Gmail connection: SUCCESS');

      // Test 2: Send test email
      console.log('🔍 Step 2: Sending test email via Gmail...');
      const result = await transporter.sendMail({
        from: '"Test LMS System" <aqeel4622@gmail.com>',
        to: 'aqeel4622@gmail.com',
        subject: 'Test Email from Gmail SMTP - ' + new Date().toISOString(),
        html: `
          <h2>Test Email via Gmail</h2>
          <p>This is a test email sent at: ${new Date().toISOString()}</p>
          <p>If you receive this, Gmail SMTP is working correctly!</p>
        `,
      });

      console.log('✅ Email sent successfully via Gmail:', {
        messageId: result.messageId,
        response: result.response,
      });

      return {
        success: true,
        provider: 'Gmail',
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error: any) {
      console.error('❌ Gmail test failed:', {
        error: error.message,
        code: error.code,
        command: error.command,
      });

      return {
        success: false,
        provider: 'Gmail',
        error: error.message,
        code: error.code,
        command: error.command,
      };
    }
  }

  async testTitanAlternativePorts(): Promise<PortTestResult[]> {
    console.log('🧪 Testing Titan Email with different configurations...');

    const configs = [
      { port: 587, secure: false, name: 'Port 587 (STARTTLS)' },
      { port: 465, secure: true, name: 'Port 465 (SSL)' },
      { port: 25, secure: false, name: 'Port 25 (Plain)' },
      { port: 2525, secure: false, name: 'Port 2525 (Alternative)' },
    ];

    const results: PortTestResult[] = [];

    for (const config of configs) {
      console.log(`🔍 Testing ${config.name}...`);

      const transporter = nodemailer.createTransport({
        host: 'smtp.titan.email',
        port: config.port,
        secure: config.secure,
        auth: {
          user: 'zohaib@jidatit.uk',
          pass: '@optipleX360@',
        },
        connectionTimeout: 10000, // Shorter timeout for testing
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });

      try {
        await transporter.verify();
        console.log(`✅ ${config.name}: SUCCESS`);
        results.push({ ...config, success: true });
      } catch (error: any) {
        console.log(`❌ ${config.name}: FAILED -`, error.message);
        results.push({ ...config, success: false, error: error.message });
      }
    }

    return results;
  }

  async runAllTests(): Promise<TestResults> {
    console.log('🚀 Running comprehensive email tests...\n');

    const results: TestResults = {
      titanEmail: null,
      gmailEmail: null,
      titanAlternativePorts: null,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
      },
    };

    // Test 1: Titan Email
    console.log('=== TEST 1: Titan Email (Current Config) ===');
    const titanResult = await this.testTitanEmail();
    results.titanEmail = titanResult;
    results.summary.totalTests++;
    if (results.titanEmail?.success) results.summary.passed++;
    else results.summary.failed++;

    // console.log('\n=== TEST 2: Gmail Fallback ===');
    // const gmailResult = await this.testGmailEmail();
    // results.gmailEmail = gmailResult;
    // results.summary.totalTests++;
    // if (results.gmailEmail?.success) results.summary.passed++;
    // else results.summary.failed++;

    console.log('\n=== TEST 3: Titan Alternative Ports ===');
    const portResults = await this.testTitanAlternativePorts();
    results.titanAlternativePorts = portResults;

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);

    if (results.titanEmail?.success) {
      console.log(
        '✅ Titan Email is working - you can use your current configuration'
      );
    }
    // else if (results.gmailEmail?.success) {
    //   console.log('✅ Gmail fallback is working - consider switching temporarily');
    // }
    else {
      console.log(
        '❌ Both email providers failed - network/firewall issue likely'
      );
    }

    return results;
  }
}

// Export the test service
export const testEmailService = new TestEmailService();

// Express routes for manual testing
export const createTestEmailRoutes = () => {
  const router = express.Router();

  // Test current Titan configuration
  router.post('/test/email/titan', async (req, res) => {
    try {
      const result = await testEmailService.testTitanEmail();
      res.json({
        success: result.success,
        message: result.success
          ? 'Titan Email test successful'
          : 'Titan Email test failed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Test failed with exception',
        error: error.message,
      });
    }
  });

  // Test Gmail configuration
  router.post('/test/email/gmail', async (req, res) => {
    try {
      const result = await testEmailService.testGmailEmail();
      res.json({
        success: result.success,
        message: result.success ? 'Gmail test successful' : 'Gmail test failed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Test failed with exception',
        error: error.message,
      });
    }
  });

  // Test all configurations
  router.post('/test/email/all', async (req, res) => {
    try {
      const results = await testEmailService.runAllTests();
      res.json({
        success: true,
        message: 'All tests completed',
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Test suite failed with exception',
        error: error.message,
      });
    }
  });

  // Test alternative Titan ports
  router.post('/test/email/titan-ports', async (req, res) => {
    try {
      const results = await testEmailService.testTitanAlternativePorts();
      res.json({
        success: true,
        message: 'Port tests completed',
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Port tests failed with exception',
        error: error.message,
      });
    }
  });

  return router;
};
