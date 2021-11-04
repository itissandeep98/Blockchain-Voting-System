import React from "react";
import { Link } from "react-router-dom";
import { Nav, NavItem, NavLink } from "reactstrap";

function Header() {
	return (
		<div>
			<Nav tabs>
				<NavItem>
					<NavLink>
						<Link to="/">Start</Link>
					</NavLink>
				</NavItem>
				<NavItem>
					<NavLink>
						<Link to="/generate">Generate</Link>
					</NavLink>
				</NavItem>
				<NavItem>
					<NavLink>
						<Link to="/verifier">Verifier</Link>
					</NavLink>
				</NavItem>
				<NavItem>
					<NavLink>
						<Link to="/election">Election</Link>
					</NavLink>
				</NavItem>
			</Nav>
		</div>
	);
}

export default Header;
