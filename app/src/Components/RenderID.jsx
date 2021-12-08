import React, { useState } from "react";
import generateHash from "../Utils/HashGenerator";
import { Button } from "reactstrap";

function RenderID(props) {
	const [state, setState] = useState({
		hash: "nothing",
		disableCopy: true,
		hasCopied: false,
		canGenerate: true,
		electioNr: 0,
	});

	const getNVoters = async () => {
		const {
			drizzle: {
				contracts: { Voting },
			},
		} = props;
		const n = await Voting.methods.getNumberOfVoters().call();
		return n;
	};

	const genHash = async () => {
		const { electioNr } = state;
		const nVoters = await getNVoters();
		const hash = await generateHash(electioNr, nVoters);
		addVoter(hash);
		setState({
			...state,
			hash,
			disableCopy: false,
			hasCopied: false,
		});
	};

	const handleSubmit = (event) => {
		const result = event.target.value;
		this.setState({
			...state,
			electioNr: result,
			canGenerate: result <= 0,
		});
	};

	const addVoter = async (hash) => {
		const {
			drizzle: {
				contracts: { Voting },
			},
			drizzleState: { accounts },
		} = props;
		await Voting.methods
			.addVoter(hash)
			.send({ from: accounts[0], gas: 200000 });
	};

	return (
		<div className="d-flex flex-column align-items-center">
			<h1>Generate Voting ID</h1>
			{/* <div>
				<FlipFlap id={state.hash} />
			</div> */}
			<div>
				<Button color="danger" disabled={state.canGenerate} onClick={genHash}>
					Generate
				</Button>
				<Button
					color="warning"
					onClick={() => navigator.clipboard.writeText(state.hash)}
				>
					Copy Hash
				</Button>
			</div>
			<div>
				<input
					placeholder="Election hall nr."
					type="number"
					onChange={handleSubmit}
				/>
			</div>
			<div>
				{state.hasCopied ? <span style={{ color: "red" }}>Copied</span> : null}
			</div>
		</div>
	);
}

export default RenderID;
