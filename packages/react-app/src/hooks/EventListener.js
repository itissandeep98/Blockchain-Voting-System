import { useEffect, useState, useRef } from "react";

export default function useEventListener(contracts, contractName, eventName, provider, startBlock, args) {
  const [updates, setUpdates] = useState([]);
  const currentStartBlockRef = useRef();

  useEffect(() => {
    if (currentStartBlockRef.current !== startBlock) {
      currentStartBlockRef.current = startBlock;
      setUpdates([]);
    }
    if (typeof provider !== "undefined" && typeof startBlock !== "undefined") {
      // if you want to read _all_ events from your contracts, set this to the block number it is deployed
      provider.resetEventsBlock(startBlock);
    }
    if (contracts && contractName && contracts[contractName]) {
      try {
        contracts[contractName].on(eventName, (...args) => {
          const blockNumber = args[args.length - 1].blockNumber;
          setUpdates(messages => [{ blockNumber, ...args.pop().args }, ...messages]);
        });
        return () => {
          contracts[contractName].removeListener(eventName);
        };
      } catch (e) {
        console.log(e);
      }
    }
  }, [provider, startBlock, contracts, contractName, eventName]);

  return updates;
}
