import React from "react";
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import drizzleOptions from "./drizzleOptions";
import Routing from "./Components/Routing";
import Loading from "./Components/Loading";
import "./App.css";

const drizzle = new Drizzle(drizzleOptions);

const App = () => {
	return (
		<DrizzleContext.Provider drizzle={drizzle}>
			<DrizzleContext.Consumer>
				{(drizzleContext) => {
					const { drizzle, drizzleState, initialized } = drizzleContext;

					if (!initialized) {
						return (
							<div
								className="d-flex flex-column"
								style={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "100%",
								}}
							>
								<Loading />
							</div>
						);
					}

					return <Routing drizzle={drizzle} drizzleState={drizzleState} />;
				}}
			</DrizzleContext.Consumer>
		</DrizzleContext.Provider>
	);
};

export default App;
