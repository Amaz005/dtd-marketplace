//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./ArrayLib.sol";
import "hardhat/console.sol";

contract Vesting is 
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using AddressUpgradeable for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _vestingIds;
    CountersUpgradeable.Counter private _schemeIds;

    struct VestingInformation {
        address wallet;
        uint256 schemeId;
        uint256 startTime;
        uint256 totalAmount;
        uint256 totalClaimed;
        // @dev 0: inactive, 1: active, 2: completed
        uint8 status;
    }
    
    struct SchemeInformation {
        string name;
        uint256 vestTime;
        uint256 cliffTime;
        uint256 durationTime;
        uint256 periodTime;
        address tokenAddress;
    }

    struct VestingsClaim {
        uint256 vestingBcId;
        uint256 withdrawable;
    }

    // @dev get vestingInformation by index
    mapping(uint256 => VestingInformation) vestingInfors;
    // @dev get vestingInformations list by wallet
    mapping(address => uint256[]) walletToVestingInfor;
    // @dev get schemeInfo by index
    mapping(uint256 => SchemeInformation) schemeInfos;
    // @dev declare variables for role
    address public preventiveWallet;
    mapping(address => bool) private _operators;
    address[] public listOperators;

    // @dev create vesting event
    event NewVestingInformation(
        address wallet,
        uint256 vestingBcId,
        uint256 schemeBcId,
        uint256 amountDeposit,
        uint256 totalAmount,
        uint256 totalClaimed,
        uint256 startTime,
        uint8 status
    );
    
    // @dev create scheme event
    event NewSchemeInformation(
        string name,
        address tokenAddress,
        uint256 schemeBcId,
        uint256 cliffTime,
        uint256 vestTime,
        uint256 durationTime,
        uint256 periodTime
    );

    event AddToken(uint256 amount, uint256 vestingBcId);
    event Claim(address wallet, VestingsClaim[] vestingIds);
    event EmergencyWithdraw(address preventiveWallet, uint256 amount);
    event PreventiveWallet(address preventiveWallet);
    event Operator(address operator, bool isOperator);

    modifier onlyOperator() {
        require(_operators[_msgSender()]);
        _;
    }

    function initialize(address _preventiveWallet)
        public
        initializer
    {
        __Pausable_init();
        __UUPSUpgradeable_init();
        __Ownable_init();
        __ReentrancyGuard_init();
        preventiveWallet = _preventiveWallet;
        _operators[msg.sender] = true;
        listOperators.push(msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address _erc20Token) public whenPaused onlyOwner {
        uint256 balanceOfThis = IERC20Upgradeable(_erc20Token).balanceOf(address(this));
        IERC20Upgradeable(_erc20Token).transfer(preventiveWallet, balanceOfThis);
        emit EmergencyWithdraw(preventiveWallet, balanceOfThis);
    }

    function setPreventiveWallet(address preventiveAddress) public onlyOwner {
        preventiveWallet = preventiveAddress;
        emit PreventiveWallet(preventiveWallet);
    }

    function setOperator(address operator, bool isOperator) public onlyOwner {
        _operators[operator] = isOperator;

        (bool isOperatorBefore, uint256 indexInArr) = ArrayLib
            .checkExistsInArray(listOperators, operator);

        if (isOperator && !isOperatorBefore) {
            listOperators.push(operator);
        }
        if (!isOperator && isOperatorBefore) {
            listOperators = ArrayLib.removeOutOfArray(
                listOperators,
                indexInArr
            );
        }
        emit Operator(operator, isOperator);
    }

    //@dev add token from admin to contract
    function addToken(uint256 _amount, uint256 _vestingId) public onlyOperator {
        VestingInformation storage vestingInfo = vestingInfors[_vestingId];
        SchemeInformation memory schemeInfo = schemeInfos[vestingInfo.schemeId];
        require(_amount == (vestingInfo.totalAmount - vestingInfo.totalClaimed), "amount-invalid");
        IERC20Upgradeable(schemeInfo.tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
        emit AddToken(_amount, _vestingId);
    }

    function newSchemeInformation(
        string memory name,
        uint256 vestTime,
        uint256 cliffTime,
        uint256 durationTime,
        uint256 periodTime,
        address tokenAddress
    ) public onlyOperator {
        require(vestTime > 0, "vest-claim-invalid");
        require(cliffTime >= 0, "cliff-claim-invalid");
        require(durationTime > 0, "duration-time-invalid");
        require(tokenAddress != address(0), "tokenAddress-invalid");
        require(bytes(name).length > 0, "scheme-name-invalid");
        require(durationTime > periodTime, "duration-time-invalid");
        _schemeIds.increment();
        uint256 id = _schemeIds.current();
        SchemeInformation storage schemeInfo = schemeInfos[id];
        schemeInfo.tokenAddress = tokenAddress;
        schemeInfo.name = name;
        schemeInfo.vestTime = vestTime;
        schemeInfo.cliffTime = cliffTime;
        schemeInfo.durationTime = durationTime;
        schemeInfo.periodTime = periodTime;
        emit NewSchemeInformation(
            name,
            schemeInfo.tokenAddress, 
            id,
            schemeInfo.cliffTime,
            schemeInfo.vestTime,
            schemeInfo.durationTime,
            schemeInfo.periodTime
        );
    }

    function newVestingInformation(
        address wallet,
        uint256 totalAmount,
        uint256 amountDeposit,
        uint256 totalClaimed,
        uint256 schemeId,
        uint256 startTime
    ) public onlyOperator {
        SchemeInformation storage schemeInfo = schemeInfos[schemeId];
        require(schemeId > 0, "schemeId-invalid");
        require(schemeInfo.durationTime > 0, "scheme-invalid");
        require(wallet != address(0), "wallet-invalid");
        require(startTime > 0, "startTime-invalid");
        require(totalAmount > 0, "totalAmount-invalid");
        require(totalAmount > totalClaimed, "totalAmount-invalid");

        _vestingIds.increment();
        VestingInformation storage vestingInfo = vestingInfors[_vestingIds.current()];
        walletToVestingInfor[msg.sender].push(_vestingIds.current());
        vestingInfo.totalAmount = totalAmount;
        vestingInfo.wallet = wallet;
        vestingInfo.schemeId = schemeId;
        // @dev get duration of cliff time

        vestingInfo.startTime = startTime + schemeInfo.cliffTime;
        vestingInfo.totalClaimed = totalClaimed;
        vestingInfo.status = 1;
        if(amountDeposit > 0) {
            addToken(amountDeposit, _vestingIds.current());
        }
        emit NewVestingInformation(
            wallet, 
            _vestingIds.current(), 
            schemeId, 
            amountDeposit, 
            totalAmount,
            vestingInfo.totalClaimed,
            vestingInfo.startTime,
            vestingInfo.status
        );
    }

    function getListVestIdsByWallet(address _wallet) public view returns(uint256[] memory) {
        return walletToVestingInfor[_wallet];
    }

    function getSchemeInforById(uint256 _schemeId) public view returns(
        string memory name,
        address tokenAddress,
        uint256 durationTime,
        uint256 vestTime,
        uint256 cliffTime
    ) {
        SchemeInformation memory schemeInfo = schemeInfos[_schemeId];
        name = schemeInfo.name;
        tokenAddress = schemeInfo.tokenAddress;
        durationTime = schemeInfo.durationTime;
        vestTime = schemeInfo.vestTime;
        cliffTime = schemeInfo.cliffTime;
    }

    function getVestingInforById(uint256 _vestingId) public view returns(
        address wallet,
        uint256 schemeId,
        uint256 startTime,
        uint256 totalAmount,
        uint256 totalClaimed,
        uint8 status,
        uint256 withdrawable
    ) {
        VestingInformation storage vestingInfo = vestingInfors[_vestingId];
        wallet = vestingInfo.wallet;
        totalAmount = vestingInfo.totalAmount;
        totalClaimed = vestingInfo.totalClaimed;
        schemeId = vestingInfo.schemeId;
        startTime = vestingInfo.startTime;
        status = vestingInfo.status;
        withdrawable = _getAmountCanClaim(_vestingId);
    }

    function claim(uint256[] memory _vestingIdsList, address tokenAddress) public nonReentrant whenNotPaused {
        require(!msg.sender.isContract(), "caller-invalid");
        
        uint256 withdrawable = 0;
        uint256 countVestId = 0;

        // @dev get list vesting can claim token
        for (uint256 i = 0; i < _vestingIdsList.length; i++) {
            if(vestingInfors[_vestingIdsList[i]].status == 1 
                && vestingInfors[_vestingIdsList[i]].wallet == msg.sender
                && _getAmountCanClaim(_vestingIdsList[i]) > 0) {
                countVestId++;
            }
        }

        console.log("vesting list: %s",countVestId);
        VestingsClaim[] memory vestIdsList = new VestingsClaim[](countVestId);
        uint256 count = 0;
        for (uint256 i = 0; i < vestIdsList.length; i++) {
            VestingInformation storage vestingInfo = vestingInfors[_vestingIdsList[i]];
            if(vestingInfo.status == 1 && vestingInfo.wallet == msg.sender) {
                withdrawable = withdrawable.add(_getAmountCanClaim(_vestingIdsList[i]));
                vestingInfo.totalClaimed = vestingInfo.totalClaimed.add(withdrawable);
                vestIdsList[count].vestingBcId = _vestingIdsList[i];
                vestIdsList[count].withdrawable = _getAmountCanClaim(_vestingIdsList[i]);
                count++;
            }
            if(vestingInfo.totalClaimed == vestingInfo.totalAmount) {
                vestingInfo.status = 2;
            }
        }
        console.log("vesting list: %s",count);
        require(IERC20Upgradeable(tokenAddress).balanceOf(address(this)) >= withdrawable, "contract-dont-have-enough-token-to-transfer");
        if(withdrawable != 0) {
            IERC20Upgradeable(tokenAddress).transfer(msg.sender, withdrawable);
        }
        uint256 endTime = vestingInfors[_vestingIdsList[0]].startTime.add(schemeInfos[vestingInfors[_vestingIdsList[0]].schemeId].durationTime);
        console.log("block timestamp is %s", block.timestamp);
        console.log("endTime is %s ", endTime);
        emit Claim(msg.sender, vestIdsList);
    }

    function _getAmountCanClaim(uint256 _vestingId) public view returns(uint256) {
        VestingInformation memory vestingInfo = vestingInfors[_vestingId];
        SchemeInformation memory schemeInfo = schemeInfos[vestingInfo.schemeId];
        uint256 withdrawable = 0;
        uint256 endTime = vestingInfo.startTime.add(schemeInfo.durationTime);
        if (block.timestamp < endTime && block.timestamp > vestingInfo.startTime && vestingInfo.status == 1) {
            console.log("now > startTime && now < endTime");
            if (vestingInfo.totalClaimed == vestingInfo.totalAmount) {
                return 0;
            }
            uint256 timeFromStart = block.timestamp - vestingInfo.startTime;
            uint256 vestedSlicePeriods = timeFromStart/schemeInfo.periodTime;
            uint256 vestedSeconds = vestedSlicePeriods*schemeInfo.periodTime;
            console.log("timeFromStart: %s", timeFromStart);
            console.log("vestedSlicePeriods: %s",vestedSlicePeriods);
            console.log("vestedSeconds: %s",vestedSeconds);
            withdrawable = (vestingInfo.totalAmount * vestedSeconds/schemeInfo.durationTime);
            if (withdrawable > vestingInfo.totalClaimed) {
                withdrawable = withdrawable - vestingInfo.totalClaimed;
            }
            console.log("withdrawable: %s", withdrawable);
            ArrayLib.divRound(withdrawable);
            
        } else if (block.timestamp >= endTime) {
            console.log("now > endTime");
            withdrawable = vestingInfo.totalAmount.sub(vestingInfo.totalClaimed);
        }
        console.log("get block time 2 %s", block.timestamp);

        return withdrawable;
    }

    function getListOperators() public view returns (address[] memory) {
        return listOperators;
    }

}
