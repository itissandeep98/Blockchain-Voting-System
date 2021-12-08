pragma solidity >=0.5.0 <0.6.0;

import "./Owner.sol";

contract Voting is Ownable {
    address private admin; //admin of the contract election comisioner

    mapping(address => uint256) private addtoaad; //eth address to aadhaar number
    mapping(uint256 => address) private aadtoadd; //aadhaar number to eth address;

    bool public electionIsRunning; //election active or no
    uint256 private deadline; //current deadline

    constructor() public {
        admin = msg.sender;
        electionIsRunning = false;
    }

    modifier notrunning() {
        require(deadline < now);
        _;
    }
    modifier running() {
        require(electionIsRunning == true && deadline >= now);
        _;
    }

    struct Voter {
        string name;
        uint256 age;
        bool eligible_to_vote;
        uint256 aadhar;
        uint256 aadhar_voted; //0 is defualt value
        string name_voted; //"" is defualt value or not voted value
    }
    Voter[] private voters;

    modifier isvoter() {
        bool found = false;
        uint256 aadhar = addtoaad[msg.sender]; //get aadhar number from address
        for (uint256 i = 0; i < voters.length; i++) {
            if (aadhar == voters[i].aadhar) {
                found = true;
                break;
            }
        }
        require(found == true);
        _;
    }
    modifier notcandidate(uint256 aadhar) {
        bool found = false;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (aadhar == candidates[i].aadhar) {
                found = true;
                break;
            }
        }
        require(found == false);
        _;
    }

    struct Candidate {
        string name;
        uint256 age;
        bool eligible_to_contest;
        uint256 aadhar;
        uint256 number_of_votes;
    }
    Candidate[] private candidates;

    function addvoter(
        string memory _name,
        uint256 _age,
        uint256 _aadhar,
        address _add
    ) public onlyOwner returns (bool) {
        if (
            aadtoadd[_aadhar] == address(0) && addtoaad[_add] == 0
        ) //does not exists and wallet address not already used
        {
            require(_age > 18);
            voters.push(Voter(_name, _age, false, _aadhar, 0, "")); //assuming a person added in between an election cannot vote
            aadtoadd[_aadhar] = _add;
            addtoaad[_add] = _aadhar;
            return true;
        }
        // else if (aadtoadd[_aadhar]!=0)
        // {
        //         //emit aadhar already exists
        // }
        //  else {
        //      //wallet address already linked

        // }
        return false;
    }

    //has to be a voter before

    function addcandidate(
        string memory _name,
        uint256 _age,
        uint256 _aadhar
    ) public onlyOwner notcandidate(_aadhar) returns (bool) {
        if (
            aadtoadd[_aadhar] != address(0)
        ) // exists and wallet address already exists imples voter
        {
            require(_age > 25);
            candidates.push(Candidate(_name, _age, false, _aadhar, 0)); //assuming a person added in between an election cannot vote
            return true;
        }
        // else if (aadtoadd[_aadhar]!=0)
        // {
        //         //emit aadhar already exists
        // }
        //  else {
        //      //wallet address already linked

        // }
        return false;
    }

    //election starts now and lasts for the passed number of days
    function startelection(uint256 numberofdays) public onlyOwner notrunning {
        require(numberofdays >= 1);
        electionIsRunning = true;
        deadline = now + (numberofdays * 1 days);
        //event to be added to state that election is started.
        for (uint256 i = 0; i < voters.length; i++) {
            voters[i].eligible_to_vote = true;
            voters[i].aadhar_voted = 0;
            voters[i].name_voted = "";
        }
        for (uint256 i = 0; i < candidates.length; i++) {
            candidates[i].eligible_to_contest = true;
            candidates[i].number_of_votes = 0;
        }
    }

    function vote(uint256 candidate_aadhar) public running isvoter {
        bool exists = false; // checking if the candidate exists or not
        Voter memory temp;
        uint256 aadhar = addtoaad[msg.sender]; //get aadhar number from address
        for (uint256 i = 0; i < voters.length; i++) {
            if (aadhar == voters[i].aadhar) {
                exists = true;
                temp = voters[i];
                break;
            }
        }

        if (temp.eligible_to_vote == true) {
            for (uint256 i = 0; i < candidates.length; i++) {
                if (candidates[i].aadhar == candidate_aadhar) {
                    exists = true;
                    candidates[i].number_of_votes += 1;
                    temp.eligible_to_vote = false;
                    temp.aadhar_voted = candidate_aadhar;
                    temp.name_voted = candidates[i].name;

                    break;
                }
            }
        }
        // else
        // {
        //     //unsuccessful voting
        // }
    }

    function stopelection() public onlyOwner {
        electionIsRunning = false;
        for (uint256 i = 0; i < voters.length; i++) {
            voters[i].eligible_to_vote = false;
            voters[i].aadhar_voted = 0;
            voters[i].name_voted = "";
        }
        for (uint256 i = 0; i < candidates.length; i++) {
            candidates[i].eligible_to_contest = false;
            candidates[i].number_of_votes = 0;
        }
    }

    // struct Results
    // {

    // }
    // function  calculate_results()
    // {

    // }
    // function show_results()
    // {

    // }
}
