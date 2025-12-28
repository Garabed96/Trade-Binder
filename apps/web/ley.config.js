import 'dotenv/config';
console.log('DATABASE_URL:', process.env.DATABASE_URL);

export default {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
};
// export default {
//   host: process.env.POSTGRES_HOST || 'localhost',
//   port: process.env.POSTGRES_PORT || 5432,
//   database: process.env.POSTGRES_DB,
//   user: process.env.POSTGRES_USER,
//   password: process.env.POSTGRES_PASSWORD,
// };
