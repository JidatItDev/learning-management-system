// Add these routes to your Express app (usually in your main router file)
// These serve as fallback pages when the frontend is not running

import { Request, Response } from 'express';

/**
 * Auth Success Fallback Page
 * GET /auth/success
 */
export const authSuccessPage = (req: Request, res: Response) => {
  const user = req.query.user;
  const parsedUser = user ? JSON.parse(decodeURIComponent(user as string)) : null;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login Successful</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #4CAF50; }
        .user-info { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 4px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="success">✅ Microsoft Login Successful!</h1>
        <p>You have successfully logged in with Microsoft Entra ID.</p>
        
        ${parsedUser ? `
          <div class="user-info">
            <h3>User Information:</h3>
            <p><strong>Name:</strong> ${parsedUser.firstName} ${parsedUser.lastName}</p>
            <p><strong>Email:</strong> ${parsedUser.email}</p>
            <p><strong>Role:</strong> ${parsedUser.role}</p>
            <p><strong>User ID:</strong> ${parsedUser.id}</p>
          </div>
        ` : ''}
        
        <p><em>Note: This is a fallback page. In production, you would be redirected to your frontend application.</em></p>
        
        <div style="margin-top: 30px;">
          <a href="/api/auth/test-protected" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Test Protected Route</a>
          <a href="/api/users/me" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-left: 10px;">View Profile</a>
        </div>
      </div>
    </body>
    </html>
  `);
};

/**
 * Auth Error Fallback Page
 * GET /auth/error
 */
export const authErrorPage = (req: Request, res: Response) => {
  const error = req.query.error || req.query.message || 'Unknown authentication error';
  
  res.status(400).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Error</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error { color: #dc3545; }
        .error-details { 
          background: #f8d7da; 
          padding: 15px; 
          border-radius: 4px; 
          margin: 20px 0;
          border-left: 4px solid #dc3545;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">❌ Authentication Failed</h1>
        <p>There was an error during the authentication process.</p>
        
        <div class="error-details">
          <h3>Error Details:</h3>
          <p>${error}</p>
        </div>
        
        <p><em>Note: This is a fallback page. In production, you would be redirected to your frontend application's error page.</em></p>
        
        <div style="margin-top: 30px;">
          <a href="/api/auth/microsoft" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Try Again</a>
          <a href="/api/auth/login" style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-left: 10px;">Regular Login</a>
        </div>
      </div>
    </body>
    </html>
  `);
};

/**
 * Signup Success Fallback Page
 * GET /auth/signup-success
 */
export const signupSuccessPage = (req: Request, res: Response) => {
  const welcome = req.query.welcome;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Signup Successful</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #4CAF50; }
        .welcome { 
          background: #d4edda; 
          padding: 15px; 
          border-radius: 4px; 
          margin: 20px 0;
          border-left: 4px solid #4CAF50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="success">🎉 Welcome! Signup Successful!</h1>
        <p>Your Microsoft Entra ID signup has been completed successfully.</p>
        
        ${welcome ? `
          <div class="welcome">
            <h3>Welcome to the platform!</h3>
            <p>Your account has been created and you're now logged in. You can start using the application.</p>
          </div>
        ` : ''}
        
        <p><em>Note: This is a fallback page. In production, you would be redirected to your frontend application's dashboard.</em></p>
        
        <div style="margin-top: 30px;">
          <a href="/api/users/me" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View My Profile</a>
          <a href="/api/users" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-left: 10px;">View All Users</a>
        </div>
      </div>
    </body>
    </html>
  `);
};