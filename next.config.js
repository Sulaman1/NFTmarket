require("dotenv").config();

module.exports = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  env: {
    UPLOAD_IPFS: process.env.UPLOAD_IPFS,
    PRI_KEY: process.env.PRI_KEY,
    RINKEBY_URL: process.env.RINKEBY_URL,
    MNEMONICS: process.env.MNEMONICS
  },
}
