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
        uint256 vestingId,
        uint256 schemeId,
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
        uint256 schemeId,
        uint256 cliffTime,
        uint256 vestTime,
        uint256 durationTime,
        uint256 periodTime
    );

    event AddToken(uint256 amount);
    event Claim(address wallet, uint256 amount, uint256[] vestingIds);
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
    function addToken(uint256 _amount, address _wallet, address _tokenAddress, uint256 _vestingId) public onlyOperator {
        VestingInformation memory vestingInfo = vestingInfors[_vestingId];
        if(vestingInfo.status == 0) {
            vestingInfo.status = 1;
        }
        IERC20Upgradeable(_tokenAddress).safeTransferFrom(
            _wallet,
            address(this),
            _amount
        );
        emit AddToken(_amount);
    }

    function newSchemeInformation(
        string memory name,
        uint256 vestTime,
        uint256 cliffTime,
        uint256 durationTime,
        uint256 periodTime,
        address tokenAddress
    ) public onlyOperator {
        require(vestTime > 0, "time claim must be greater than 0");
        require(cliffTime > 0, "time claim must be greater than 0");
        require(durationTime > 0, "time claim invalid");
        require(tokenAddress != address(0), "tokenAddress invalid");
        require(bytes(name).length > 0, "scheme name is required");
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
        require(wallet != address(0), "wallet is required");
        require(totalClaimed > 0, "maxSupplyClaim must be greater than 0");
        require(schemeId > 0, "schemeId invalid");
        require(schemeInfo.durationTime > 0, "scheme not found");
        require(startTime > 0, "startTime is required");
        require(totalAmount > 0, "totalAmount must be greater than 0");

        _vestingIds.increment();
        VestingInformation storage vestingInfo = vestingInfors[_vestingIds.current()];
        walletToVestingInfor[msg.sender].push(_vestingIds.current());
        vestingInfo.totalAmount = totalAmount;
        vestingInfo.wallet = wallet;
        vestingInfo.schemeId = schemeId;
        // @dev get duration of cliff time
        uint256 durationOfCliff = schemeInfo.periodTime * schemeInfo.cliffTime;

        vestingInfo.startTime = startTime + durationOfCliff;
        vestingInfo.totalClaimed = totalClaimed;
        if(amountDeposit > 0) {
            addToken(amountDeposit, msg.sender, schemeInfo.tokenAddress, _vestingIds.current());
        }
        vestingInfo.status = 0;
        if(vestingInfo.startTime > 0) {
            vestingInfo.status = 1;
        }
        emit NewVestingInformation(
            wallet, 
            _vestingIds.current(), 
            schemeId, 
            amountDeposit, 
            totalAmount,
            vestingInfo.totalClaimed,
            startTime,
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

        uint256[] memory vestIdsList = new uint256[](countVestId);
        uint256 count = 0;
        for (uint256 i = 0; i < vestIdsList.length; i++) {
            if(vestingInfors[_vestingIdsList[i]].status == 1 && vestingInfors[_vestingIdsList[i]].wallet == msg.sender) {
                withdrawable = withdrawable.add(_getAmountCanClaim(_vestingIdsList[i]));
                vestingInfors[_vestingIdsList[i]].totalClaimed = vestingInfors[_vestingIdsList[i]].totalClaimed.add(withdrawable);
                vestIdsList[count] = _vestingIdsList[i];
                count++;
            }
            if(vestingInfors[_vestingIdsList[i]].totalClaimed == vestingInfors[_vestingIdsList[i]].totalAmount) {
                vestingInfors[_vestingIdsList[i]].status = 2;
            }
        }
        require(IERC20Upgradeable(tokenAddress).balanceOf(address(this)) >= withdrawable, "contract dont have enough token to transfer");
        if(withdrawable != 0) {
            IERC20Upgradeable(tokenAddress).transfer(msg.sender, withdrawable);
        }
        
        emit Claim(msg.sender, withdrawable, vestIdsList);
    }

    function _getAmountCanClaim(uint256 _vestingId) internal view returns(uint256) {
        VestingInformation memory vestingInfo = vestingInfors[_vestingId];
        SchemeInformation memory schemeInfo = schemeInfos[vestingInfo.schemeId];
        uint256 withdrawable = 0;
        uint256 endTime = vestingInfo.startTime.add(schemeInfo.durationTime);
        if (block.timestamp < endTime && block.timestamp > vestingInfo.startTime && vestingInfo.status == 1) {
            if (vestingInfo.totalClaimed == vestingInfo.totalAmount) {
                return 0;
            }
            withdrawable = (vestingInfo.totalAmount * (block.timestamp - vestingInfo.startTime)/schemeInfo.durationTime) - vestingInfo.totalClaimed;
        
        } else if (block.timestamp > endTime) {
            withdrawable = vestingInfo.totalAmount.sub(vestingInfo.totalClaimed);
        }
        return withdrawable;
    }

    function getListOperators() public view returns (address[] memory) {
        return listOperators;
    }

}
