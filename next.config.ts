import type { NextConfig } from "next";
import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    domains: [
      "i.pinimg.com", ]
  }
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "849ae2c8-85c2-4b7f-ba56-95e47f684738"
});

export default withCivicAuth(nextConfig)