import React from "react";
import { Chart } from "react-google-charts";
import { Button } from "reactstrap";
import calculateResult from "../Utils/CalculateResult";
import decryptVote from "../Utils/DecryptVote";
import isElectionRunning from "../Utils/IsElectionRunning";
import Loading from "./Loading";

class Start extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isRunning: false,
			data: null,
			hasResult: false,
			hash: null,
			vote: null,
		};
		isElectionRunning(props.drizzle).then((isRunning) => {
			this.setState({
				isRunning,
			});
		});
	}

	findVote = async () => {
		const {
			state,
			props: { drizzle },
		} = this;
		let vote = await drizzle.contracts.Voting.methods.votes(state.hash).call();
		if (vote.on === "") {
			vote = "nothing";
		} else {
			const privateKey = await drizzle.contracts.Voting.methods
				.privateKey()
				.call();
			vote = await decryptVote(privateKey, vote.on);
		}
		this.setState({
			vote,
		});
	};

	handleHash = (event) => {
		const hash = event.target.value;
		this.setState({
			hash,
		});
	};

	transformResult = async () => {
		const {
			state,
			props: { drizzle },
		} = this;
		if (state.data === null) {
			if (!state.isRunning) {
				let result = null;
				const resultMap = await calculateResult(drizzle);
				if (resultMap !== null && resultMap.size > 0) {
					result = [["Party", "Procentage"]];
					let i = 1;
					resultMap.forEach((procentage, party) => {
						result[i] = [party, procentage];
						i += 1;
					});
				}
				this.setState({
					data: result,
					hasResult: true,
				});
			}
		}
	};

	render() {
		const { state, transformResult, handleHash, findVote } = this;

		if (!state.hasResult) {
			transformResult();
		}

		return (
			<div className="d-flex flex-column justify-content-center align-items-center">
				{state.data !== null ? (
					<div className="d-flex flex-column  justify-content-center align-items-center">
						<Chart
							chartType="Bar"
							loader={
								<div className="d-flex flex-column align-items-center">
									<h2>Loading Chart...</h2>
									<Loading />
								</div>
							}
							data={state.data}
							options={{
								chart: {
									title: "Election",
									subtitle: "Parties and procentage",
								},
							}}
							rootProps={{ "data-testid": "2" }}
						/>
						<h2>Confirm your vote:</h2>
						<div>
							<input
								placeholder="Enter your voting hash:"
								type="text"
								onChange={handleHash}
							/>
							<Button onClick={findVote}>Confirm</Button>
						</div>
						{state.vote !== null ? (
							<div>
								<span>You voted for: </span>
								<span style={{ fontWeight: "bold" }}>{state.vote}</span>
							</div>
						) : null}
					</div>
				) : (
					<h1>No election result to display</h1>
				)}
			</div>
		);
	}
}

export default Start;
