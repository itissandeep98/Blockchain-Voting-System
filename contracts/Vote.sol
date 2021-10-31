/*

    Test contract to check that project works as intended.

*/

pragma solidity ^0.5.5;

contract Vote {
    bool private didVote;
    uint256 public vote;

    constructor() public {
        didVote = false;
        vote = 0;
    }

    modifier eligibleToVote() {
        require(!didVote, "Sender cant vote");
        _;
    }

    function doVote() public eligibleToVote returns (uint256) {
        didVote = true;
        vote = 1;

        return vote;
    }
}
