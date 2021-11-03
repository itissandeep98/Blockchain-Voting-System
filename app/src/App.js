import React from "react";
import { DrizzleContext } from "@drizzle/react-plugin";
import Routing from "./Components/Routing";
import Loading from "./Components/Loading";
import "./App.css";

const App = () => {
	return (
		<DrizzleContext.Consumer>
			{(drizzleContext) => {
				const { drizzle, drizzleState, initialized } = drizzleContext;
				console.log(drizzleContext);
				if (!initialized) {
					return (
						<div
							className="d-flex flex-column justify-content-center align-items-center"
							style={{ height: "100vh" }}
						>
							<Loading />
						</div>
					);
				}

				return <Routing drizzle={drizzle} drizzleState={drizzleState} />;
			}}
		</DrizzleContext.Consumer>
	);
};

export default App;
