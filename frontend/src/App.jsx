import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import { Alert, Button, Col, Menu, Row, Spin, Typography } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Contract, Faucet, GasGauge, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useExchangePrice,
  useGasPrice,
  useUserSigner,
  useCurrentDistribution,
} from "./hooks";
import QuadraticDiplomacyVote from "./views/QuadraticDiplomacyVote";
import QuadraticDiplomacyReward from "./views/QuadraticDiplomacyReward";
import QuadraticDiplomacyCreate from "./views/QuadraticDiplomacyCreate";

const { ethers } = require("ethers");
const { Title } = Typography;

const targetNetwork = NETWORKS.ropsten;

const serverUrl = "https://ibc-voting.herokuapp.com/";

const DEBUG = false;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;

const localProviderUrl = targetNetwork.rpcUrl;
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

const blockExplorer = targetNetwork.blockExplorer;

const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    /*torus: {
      package: Torus,
    },*/
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, options) => {
        await provider.enable();
        return provider;
      },
    },
  },
});

function App() {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  const [currentDistribution, setCurrentDistribution] = useCurrentDistribution(serverUrl);
  const isVoter =
    address && currentDistribution && currentDistribution.members && currentDistribution.members.includes(address);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  const [adminRole, setAdminRole] = useState();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const updateRoleAdmin = async () => {
      if (DEBUG) console.log("Updating admin role...");
      if (readContracts && readContracts.QuadraticDiplomacyContract) {
        const adminRoleFromContract = await readContracts.QuadraticDiplomacyContract.DEFAULT_ADMIN_ROLE();
        setAdminRole(adminRoleFromContract);
        if (DEBUG) console.log("Admin role updated!");
      }
    };
    updateRoleAdmin();
  }, [address, readContracts]);

  useEffect(() => {
    const updateAdmin = async () => {
      if (DEBUG) console.log("Updating admin...");
      if (readContracts && readContracts.QuadraticDiplomacyContract && adminRole) {
        const isAdminFromContract = await readContracts.QuadraticDiplomacyContract.hasRole(adminRole, address);
        setIsAdmin(isAdminFromContract);
        if (DEBUG) console.log("Admin updated!");
      }
    };
    updateAdmin();
  }, [address, readContracts, adminRole]);

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [mainnetProvider, address, selectedChainId, yourLocalBalance, yourMainnetBalance, readContracts, writeContracts]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);
                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
                .
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    ethers.utils.formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: ethers.utils.parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  function pageContentForAdmin() {
    return (
      <div>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Create
            </Link>
          </Menu.Item>
          <Menu.Item key="/quadratic-diplomacy-vote">
            <Link
              onClick={() => {
                setRoute("/quadratic-diplomacy-vote");
              }}
              to="/quadratic-diplomacy-vote"
            >
              Vote
            </Link>
          </Menu.Item>
          <Menu.Item key="/quadratic-diplomacy-reward">
            <Link
              onClick={() => {
                setRoute("/quadratic-diplomacy-reward");
              }}
              to="/quadratic-diplomacy-reward"
            >
              Result
            </Link>
          </Menu.Item>
          <Menu.Item key="/contract">
            <Link
              onClick={() => {
                setRoute("/contract");
              }}
              to="/contract"
            >
              Settings
            </Link>
          </Menu.Item>
        </Menu>

        <Switch>
          <Route exact path="/">
            <QuadraticDiplomacyCreate
              mainnetProvider={mainnetProvider}
              serverUrl={serverUrl}
              address={address}
              userSigner={userSigner}
              currentDistribution={currentDistribution}
              setCurrentDistribution={setCurrentDistribution}
              isAdmin={isAdmin}
            />
          </Route>
          <Route path="/quadratic-diplomacy-vote">
            <QuadraticDiplomacyVote
              isVoter={isVoter}
              mainnetProvider={mainnetProvider}
              currentDistribution={currentDistribution}
              address={address}
              userSigner={userSigner}
              serverUrl={serverUrl}
            />
          </Route>
          <Route path="/quadratic-diplomacy-reward">
            <QuadraticDiplomacyReward
              tx={tx}
              writeContracts={writeContracts}
              userSigner={userSigner}
              price={price}
              isAdmin={isAdmin}
              mainnetProvider={mainnetProvider}
              currentDistribution={currentDistribution}
              serverUrl={serverUrl}
              address={address}
            />
          </Route>
          <Route exact path="/contract">
            <Contract
              name="QuadraticDiplomacyContract"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </div>
    );
  }

  function pageContentForVoter() {
    return (
      <div>
        <QuadraticDiplomacyVote
          isVoter={isVoter}
          mainnetProvider={mainnetProvider}
          currentDistribution={currentDistribution}
          address={address}
          userSigner={userSigner}
          serverUrl={serverUrl}
        />
      </div>
    );
  }

  function pageContentForOthers() {
    if (currentDistribution.id) {
      return (
        <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
          <Title level={4}>Voting in progress</Title>
        </div>
      );
    } else {
      return (
        <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
          <Title level={4}>No voting in progress</Title>
        </div>
      );
    }
  }

  function pageContent() {
    if (currentDistribution == null || isAdmin == null) {
      return <Spin />;
    }
    if (isAdmin) {
      return pageContentForAdmin();
    }
    if (currentDistribution && isVoter) {
      return pageContentForVoter();
    }
    return pageContentForOthers();
  }

  return (
    <div className="App text-center">
      <img src="/logo/logo.png" width={300} height={80} className="my-3 mx-3" />

      {networkDisplay}
      <div className="p-5">
        <Account
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
          isAdmin={isAdmin}
          isVoter={isVoter}
        />
      </div>
      <BrowserRouter>{pageContent()}</BrowserRouter>
    </div>
  );
}

export default App;
