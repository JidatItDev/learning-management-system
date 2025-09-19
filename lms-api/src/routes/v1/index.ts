import { Router } from 'express';

const router = Router();

router.use('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the API',
    version: '1.0.0',
    documentation: 'https://example.com/docs',
  });
});

export default router;
