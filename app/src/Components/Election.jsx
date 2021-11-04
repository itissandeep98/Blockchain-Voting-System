import React, { useEffect, useState } from "react";
import EthCrypto from "eth-crypto";
import checkCryptoKeyPair from "../Utils/CheckCryptoKeyPair";
import isElectionRunning from "../Utils/IsElectionRunning";
import Loading from "./Loading";
import { Button } from "reactstrap";

export default function Election(props) {
	const [state, setState] = useState({
		privateKey: "",
		privateKeyisCorrect: false,
		isRunning: false,
	});
	useEffect(() => {
		isElectionRunning(props.drizzle).then((isRunning) => {
			setState({ ...state, isRunning });
		});
		//eslint-disable-next-line
	}, []);

	const start = async () => {
		const { publicKey, privateKey } = EthCrypto.createIdentity();
		setState({ ...state, privateKey, privateKeyisCorrect: true });
		const {
			drizzle: {
				contracts: { Voting },
			},
			drizzleState: { accounts },
		} = props;
		try {
			await Voting.methods
				.startElection(publicKey, 0, 500)
				.send({ from: accounts[0], gas: 2000000 });
			this.setState({
				isRunning: true,
			});
		} catch (error) {
			console.log("Couldn't start the election? -> ", error);
		}
	};

	const stop = async () => {
		const { privateKey, privateKeyisCorrect } = state;
		const Voting = props.drizzle.contracts.Voting;
		const accounts = props.drizzleState.accounts;

		if (!privateKeyisCorrect) {
			const r = window.confirm(
				`Your entered private key is not correct, stop election anyway?`
			);
			if (!r) {
				return;
			}
		}
		try {
			await Voting.methods
				.stopElection(privateKey)
				.send({ from: accounts[0], gas: 200000 });
			setState({ ...state, isRunning: false });
		} catch (error) {
			console.log("Couldn't stop the election? -> ", error);
		}
	};

	const handleKey = async (event) => {
		const { drizzle } = props;
		const result = event.target.value;
		const publicKey = await drizzle.contracts.Voting.methods.publicKey().call();
		const privateKeyisCorrect = await checkCryptoKeyPair(publicKey, result);
		setState({
			...state,
			privateKey: privateKeyisCorrect ? result : "",
			privateKeyisCorrect,
		});
	};

	return (
		<div className="d-flex flex-column align-items-center">
			{state.isRunning ? (
				<div className="d-flex flex-column align-items-center">
					<h1>Election in progress</h1>
					<Loading />
					<div>
						<Button name="Stop election!" color="danger" onClick={stop} />
						{state.privateKeyisCorrect ? (
							<Button
								color="warning"
								onClick={() => navigator.clipboard.writeText(state.privateKey)}
							>
								Copy private key!
							</Button>
						) : (
							<input
								placeholder="Enter private key"
								type="text"
								onChange={handleKey}
							/>
						)}
					</div>
				</div>
			) : (
				<div className="d-flex flex-column align-items-center">
					<h1>No election is running</h1>
					<Button name="Start election!" color="warning" onClick={start} />
				</div>
			)}
		</div>
	);
}
