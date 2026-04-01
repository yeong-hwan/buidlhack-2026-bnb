import { createConfig, http, injected } from "wagmi";
import { bscTestnet, opBNBTestnet } from "viem/chains";

export const wagmiConfig = createConfig({
  chains: [bscTestnet, opBNBTestnet],
  connectors: [injected()],
  transports: {
    [bscTestnet.id]: http("https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
    [opBNBTestnet.id]: http("https://opbnb-testnet-rpc.bnbchain.org"),
  },
});
