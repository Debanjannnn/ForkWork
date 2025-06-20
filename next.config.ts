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
  clientId: "f1d54c2a-3a2b-485e-ac7a-8ae310980d99"
});

export default withCivicAuth(nextConfig)