import React, { useEffect, useState } from "react";
import { Button, Form, FormGroup } from "reactstrap";
import getParties from "../Utils/PartyCollector";
import { encryptVote } from "../Utils/EncryptVote";
import "../animate.css";

function Verifier(props) {
	const [state, setState] = useState({
		voterID: null,
		parties: null,
		candidate: null,
		voteConfirm: null,
		able: false,
		didVote: false,
		input: "",
	});

	useEffect(async () => {
		const { drizzle } = props;
		const { parties } = state;
		if (!parties) {
			const p = await getParties(drizzle);
			setState({ ...state, parties: p });
		}
		//eslint-disable-next-line
	}, []);

	const setValue = async (value) => {
		const { drizzle } = props;
		const contract = drizzle.contracts.Voting;

		// let drizzle know we want to call the `set` method with `value`

		const isit = await contract.methods.isAbleToVote(value).call();

		setState({ ...state, able: isit });
	};

	const getTxStatus = () => {
		// get the transaction states from the drizzle state
		const { drizzle } = props;
		const stateUpdate = drizzle.props?.store.getState();
		const { voteConfirm } = state;

		if (voteConfirm == null) return null;
		// get the transaction hash using our saved `stackId`
		const txHash = stateUpdate.transactionStack[voteConfirm];

		// if transaction hash does not exist, don't display anything
		if (!txHash) return null;

		// otherwise, return the transaction status
		return `Transaction status: ${
			stateUpdate.transactions[txHash] &&
			stateUpdate.transactions[txHash].status
		}`;
	};

	const handleSend = (voterID, encryptedVote) => {
		const { drizzle, drizzleState } = props;
		const contract = drizzle.contracts.Voting;

		const voteConfirm = contract.methods.vote.cacheSend(
			voterID,
			encryptedVote,
			{
				from: drizzleState.accounts[0],
				gas: 250000,
			}
		);

		setState({ ...state, voteConfirm, didVote: true });
	};

	const handleVote = async () => {
		const { drizzle } = props;
		const { voterID, candidate } = state;
		const publicKey = await drizzle.contracts.Voting.methods.publicKey().call();
		const encryptedVote = await encryptVote(publicKey, candidate);
		const r = window.confirm(`You are now voting for ${candidate}`);
		if (r === true) {
			handleSend(voterID, encryptedVote);
		}
	};

	const handleSubmit = (event) => {
		setState({
			...state,
			voterID: event.target.value,
			input: event.target.value,
		});
	};

	const handleVerify = async (event) => {
		const { voterID } = state;
		await setValue(voterID);
	};

	const handleForm = (event) => {
		setState({ ...state, candidate: event.target.value });
	};

	const { parties, able, didVote, input } = state;

	if (didVote) {
		// Reset this page
		setState({
			...state,
			voterID: null,
			candidate: null,
			voteConfirm: null,
			able: false,
			didVote: false,
			input: "",
		});
	}

	if (!parties) return "";
	const size = parties.length; // antalet kandidater
	const options = []; // array med kandidater (i formatet <option> PARTI </option>)
	for (let i = 0; i < size; i += 1) {
		//
		options.push(<option key={i}> {parties[i]} </option>); //
	}

	return (
		<div>
			<div className=" d-flex justify-content-center">
				<div>
					<div className="d-flex justify-content-center">Your key: </div>
					<div className="d-flex justify-content-center">
						<input
							type="text"
							className="voteInput"
							onChange={handleSubmit}
							value={input}
						/>
					</div>
					<div className="d-flex justify-content-center">
						<Button
							color="primary"
							onClick={handleVerify}
							className="button"
							type="submit"
						>
							{" "}
							Verify{" "}
						</Button>
					</div>
				</div>
				{able && (
					<div className="boxx">
						<div className=" animated fadeInDown  ">
							<Form>
								<FormGroup>
									{/* <Form.Control
											onChange={this.handleForm}
											componentClass="textarea"
											style={{ height: 100, width: 500 }}
											as="select"
											multiple
										>
											{options}
										</Form.Control> */}
								</FormGroup>
							</Form>
							<Button
								color="primary"
								className="Vote-button "
								type="submit"
								onClick={handleVote}
							>
								Submit vote
							</Button>
						</div>
					</div>
				)}
			</div>
			<div>{getTxStatus()}</div>
		</div>
	);
}

export default Verifier;
