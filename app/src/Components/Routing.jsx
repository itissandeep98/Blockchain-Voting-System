import { Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Start from "./Start";
import RenderID from "./RenderID";
import Verifier from "./Verifier";
import Election from "./Election";
import Header from "./Header";
import Loading from "./Loading";

function Routing(props) {
	const { drizzle, drizzleState } = props;
	const start = () => {
		return <Start drizzle={drizzle} drizzleState={drizzleState} />;
	};
	const generate = () => {
		return <RenderID drizzle={drizzle} drizzleState={drizzleState} />;
	};
	const verifier = () => {
		return <Verifier drizzle={drizzle} drizzleState={drizzleState} />;
	};
	const election = () => {
		return <Election drizzle={drizzle} drizzleState={drizzleState} />;
	};
	return (
		<BrowserRouter basename={process.env.PUBLIC_URL}>
			<Header />
			<Suspense fallback={<Loading />}>
				<Switch>
					<Route exact path="/" component={start} />
					<Route exact path="/generate" component={generate} />
					<Route exact path="/verifier" component={verifier} />
					<Route exact path="/election" component={election} />
				</Switch>
			</Suspense>
		</BrowserRouter>
	);
}

export default Routing;
