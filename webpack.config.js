const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
const fs = require('fs');

// Get the root path
const ROOT_PATH = path.resolve(__dirname);

// Load environment variables
const getEnvConfig = () => {
  // Check if .env exists
  const envPath = path.resolve(ROOT_PATH, '.env');
  const envExample = path.resolve(ROOT_PATH, '.env.example');

  let finalPath = fs.existsSync(envPath) ? envPath : envExample;
  
  const env = dotenv.config({ path: finalPath }).parsed;
  
  // Validate required environment variables
  const requiredEnvVars = ['GOOGLE_MAPS_API_KEY', 'WEATHER_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(key => !env || !env[key]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Convert env variables to webpack-compatible format
  return Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
  }, {});
};

module.exports = {
  entry: './src/js/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/emergency-finder/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      hash: true,
      cache: false
    }),
    new webpack.DefinePlugin(getEnvConfig())
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/emergency-finder/'
    },
    historyApiFallback: true,
    compress: true,
    port: 8080,
    hot: true,
    open: true
  },
  mode: 'production'
}; 